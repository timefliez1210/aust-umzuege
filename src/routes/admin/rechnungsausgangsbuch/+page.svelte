<script lang="ts">
	import { onMount } from 'svelte';
	import { apiDownload, apiGet, apiPatch, apiPost, apiPreview } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ReviewRequestModal from '$lib/components/admin/ReviewRequestModal.svelte';
	import { ArrowDown, ArrowUp, Check, Download, FileText, Search, X } from 'lucide-svelte';
	import MonatsUebersicht from '$lib/components/admin/MonatsUebersicht.svelte';
	import {
		isDraft,
		isOverdue,
		isSettled,
		yearOf,
		availableYears,
		rowsForYear,
		registerTotals,
		formatServicePeriod,
		monthlySummaries,
		viewRows,
		registerKpis,
		hasActiveFilters,
		NO_FILTERS,
		MONTH_LABELS,
		type RegisterFilters,
		type SortKey,
		type SortState,
		type StatusFilter
	} from '$lib/utils/register';
	import { parseEuroInput } from '$lib/utils/format';

	/**
	 * Alex's own vocabulary, in his own frequency order — his 2026 book is "EC" 83
	 * times and "BAR" 3 times, and nothing else. The app used to offer "EC-Karte"
	 * and "Bar", so not one stored value matched what he reads in his own register.
	 */
	const PAYMENT_METHODS = ['EC', 'BAR', 'Überweisung', 'PayPal'];

	interface RechnungsausgangItem {
		id: string;
		kind: string; // "umzug" | "lagerung"
		/** null for Lagerung — storage invoices hang off a contract, not an inquiry. */
		inquiry_id: string | null;
		invoice_number: string;
		customer_name: string | null;
		scheduled_date: string | null;
		/** Last day of the job; equal to scheduled_date for a single-day move. */
		end_date: string | null;
		netto_cents: number | null;
		mwst_cents: number | null;
		brutto_cents: number | null;
		sent_at: string | null;
		created_at: string;
		due_date: string | null;
		paid_at: string | null;
		offene_zahlungen_cents: number | null;
		/**
		 * True once the invoice is fully settled. Derived by the backend — not the same
		 * as `paid_at != null`, because a storage invoice can be paid without one.
		 */
		is_settled: boolean;
		/** Recorded Teilzahlung in cents; null when none was entered. */
		paid_amount_cents: number | null;
		payment_method: string | null;
		notes: string | null;
		/** "full" | "partial_first" | "partial_final" | "lagerung" */
		invoice_type: string;
		partial_percent: number | null;
		/** "draft" | "ready" | "sent" | "paid" */
		status: string;
		is_gutschrift: boolean;
		pdf_s3_key: string | null;
	}

	/** Short label for the Typ column — an Anzahlung must not look like a duplicate row. */
	function typeLabel(item: RechnungsausgangItem): string {
		if (item.is_gutschrift) return 'Gutschrift';
		switch (item.invoice_type) {
			case 'lagerung':
				return 'Lagerung';
			case 'partial_first':
				return item.partial_percent ? `Anzahlung ${item.partial_percent}%` : 'Anzahlung';
			case 'partial_final':
				return 'Schlussrechnung';
			default:
				return 'Umzug';
		}
	}

	/**
	 * True while an invoice has not actually been issued — most often the
	 * Schlussrechnung created as a draft alongside an Anzahlung. Such a row stays
	 * visible (its number is already reserved) but is marked, and is left out of the
	 * totals.
	 *
	 * Deliberately NOT keyed on `sent_at` alone: `invoice_repo::mark_paid` stamps
	 * `paid_at`/`status` but never `sent_at`, so an invoice handed over on paper and
	 * then booked via the "Bezahlt" button would otherwise be badged as a draft and
	 * silently dropped from the register's sums — the very failure this page was
	 * fixed to stop.
	 */

	/** Response of POST /rechnungsausgangsbuch/{id}/paid. */
	interface PaidOutcome {
		kind: string;
		paid_at: string;
		inquiry_id: string | null;
		customer_name: string | null;
		inquiry_settled: boolean;
		/** True when the job is fully settled and nobody has answered the review question yet. */
		review_prompt: boolean;
	}

	let rows = $state<RechnungsausgangItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	/** Selected calendar year — the register is kept per year, like a paper ledger. */
	let activeYear = $state<string>('');


	async function load() {
		loading = true;
		error = null;
		try {
			const data = await apiGet<RechnungsausgangItem[]>('/api/v1/admin/rechnungsausgangsbuch');
			rows = data;
			const years = [...new Set(data.map(yearOf))].sort();
			activeYear = years.at(-1) ?? String(new Date().getFullYear());
		} catch (e: any) {
			error = e?.message || 'Ladefehler';
			rows = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { load(); });

	let years = $derived(availableYears(rows));

	/**
	 * The whole selected year as one list in invoice-number order — the register is a
	 * running ledger, so it is read top to bottom rather than paged month by month,
	 * and its order is the number sequence, not the date (see `rowsForYear`).
	 */
	let yearRows = $derived(rowsForYear(rows, activeYear));


	/**
	 * Today, as YYYY-MM-DD.
	 *
	 * Captured once per load rather than per render: "überfällig" must not flip
	 * mid-session, and a fresh `new Date()` inside a $derived would recompute the
	 * whole table on every unrelated keystroke.
	 */
	let today = $state(new Date().toISOString().substring(0, 10));

	// ── Filter & Sortierung ──────────────────────────────────────────────────

	let filters = $state<RegisterFilters>({ ...NO_FILTERS });
	/** null = register order (ascending invoice number), the ledger's own order. */
	let sort = $state<SortState | null>(null);

	let filtered = $derived(viewRows(yearRows, filters, sort, activeYear, today));
	let filtersActive = $derived(hasActiveFilters(filters));
	let monthSummaries = $derived(monthlySummaries(yearRows, activeYear));
	/** KPIs follow the filter, so the tiles answer "in what I am looking at". */
	let kpis = $derived(registerKpis(filtered, today));

	const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
		{ key: 'alle', label: 'Alle' },
		{ key: 'offen', label: 'Offen' },
		{ key: 'ueberfaellig', label: 'Überfällig' },
		{ key: 'bezahlt', label: 'Bezahlt' },
		{ key: 'entwurf', label: 'Entwürfe' }
	];

	/**
	 * Cycles one column through ascending → descending → register order.
	 *
	 * The third click matters: a sorted register is a lens, and Alex needs a way back
	 * to the ledger's own order without hunting for a reset button.
	 */
	function toggleSort(key: SortKey) {
		if (sort?.key !== key) sort = { key, dir: 'asc' };
		else if (sort.dir === 'asc') sort = { key, dir: 'desc' };
		else sort = null;
	}

	/**
	 * The table's columns, in order.
	 *
	 * `sort` names the key a header sorts by; a column without one is not sortable
	 * (Typ and Bemerkungen are labels and free text — ordering by them tells nobody
	 * anything). Labels carry entities because they are rendered with `@html`.
	 */
	const COLUMNS: { label: string; sort?: SortKey; num?: boolean }[] = [
		{ label: 'Rg-Nr.', sort: 'number' },
		{ label: 'Typ' },
		{ label: 'Leistungszeitraum', sort: 'service' },
		{ label: 'Kunde', sort: 'customer' },
		{ label: 'Netto', sort: 'netto', num: true },
		{ label: 'MWST', sort: 'mwst', num: true },
		{ label: 'Brutto', sort: 'brutto', num: true },
		{ label: 'Rechnungsdatum', sort: 'sent' },
		{ label: 'F&auml;llig' },
		{ label: 'Bezahlt', sort: 'paid' },
		{ label: 'Offen', sort: 'offen', num: true },
		{ label: 'Zahlungsart' },
		{ label: 'Bem.' }
	];

	function resetFilters() {
		filters = { ...NO_FILTERS };
	}

	function selectMonth(month: number | null) {
		filters = { ...filters, month };
	}

	/**
	 * Switches the register to another year.
	 *
	 * Clears the filters and the sort on the way: a month or a search carried across
	 * a year boundary silently shows a different slice than the one the chips claim,
	 * and the register is the wrong place to be surprised.
	 */
	function selectYear(year: string) {
		activeYear = year;
		filters = { ...NO_FILTERS };
		sort = null;
	}

	// Year totals — these used to sum EVERY loaded row regardless of year despite
	// being labelled "Gesamtsumme (Jahr)" (feedback report 12e2d18f). Scoping and
	// the draft exclusion live in $lib/utils/register so they stay under test.
	//
	// Deliberately computed from the FILTERED rows: a footer that kept showing the
	// whole year while the table showed one month would be the same bug in a new
	// place. The year figure stays available in the Monatsübersicht below.
	let totals = $derived(registerTotals(filtered));
	let totalNetto = $derived(totals.netto);
	let totalMwst = $derived(totals.mwst);
	let totalBrutto = $derived(totals.brutto);
	let totalOffen = $derived(totals.offen);
	let totalEntwurf = $derived(totals.entwurf);

	/**
	 * Opens the invoice document for a row.
	 *
	 * Called by: template (Rechnungsnummer button).
	 * Purpose: the register had no way to reach the actual invoice (report 542fb20d).
	 */
	async function openInvoicePdf(item: RechnungsausgangItem) {
		// Storage invoices hang off a contract, not an inquiry, and have their own route.
		const path =
			item.kind === 'lagerung'
				? `/api/v1/admin/storage/invoices/${item.id}/pdf`
				: item.inquiry_id
					? `/api/v1/inquiries/${item.inquiry_id}/invoices/${item.id}/pdf`
					: null;
		if (!path) return;
		try {
			await apiPreview(path);
		} catch (e: any) {
			showToast(e?.message || 'PDF konnte nicht geöffnet werden', 'error');
		}
	}

	function fmtEur(cents: number | null): string {
		if (cents == null) return '\u2014';
		return (cents / 100).toLocaleString('de-DE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}) + ' \u20AC';
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '\u2014';
		const d = new Date(iso);
		return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}

	async function updatePaymentMethod(item: RechnungsausgangItem, value: string) {
		const payment_method = value || null;
		const prev = item.payment_method;
		item.payment_method = payment_method;
		try {
			await apiPatch(`/api/v1/admin/rechnungsausgangsbuch/${item.id}/payment-method`, { payment_method });
		} catch (e: any) {
			item.payment_method = prev;
			error = e?.message || 'Zahlungsart konnte nicht gespeichert werden';
		}
	}

	// ── Bemerkungen ──────────────────────────────────────────────────────────

	/**
	 * Saves a row's Bemerkung on blur.
	 *
	 * Called by: template (Bemerkungen cell).
	 * Purpose: Bemerkungen is the column Alex actually works in — "19.08.26 erinnert
	 *          per mail", "verrechnung mit RG 12 … 1432,-". It was read-only, which
	 *          made the page a report rather than a ledger.
	 *
	 * Saves only when the text actually changed, so tabbing through the table doesn't
	 * fire a request per row.
	 */
	async function saveNotes(item: RechnungsausgangItem, value: string) {
		const next = value.trim() === '' ? null : value;
		if (next === item.notes) return;
		const prev = item.notes;
		item.notes = next;
		try {
			await apiPatch(`/api/v1/admin/rechnungsausgangsbuch/${item.id}/notes`, { notes: next });
		} catch (e: any) {
			item.notes = prev;
			showToast(e?.message || 'Bemerkung konnte nicht gespeichert werden', 'error');
		}
	}

	// ── Teilzahlung ──────────────────────────────────────────────────────────

	/** Row whose Offen cell is currently open for editing. */
	let editingOffenId = $state<string | null>(null);
	/** Raw text in that cell while it is being typed. */
	let offenDraft = $state('');

	/** The stored Teilzahlung as the text the cell shows while editing. */
	function offenText(item: RechnungsausgangItem): string {
		if (item.paid_amount_cents == null) return '';
		return (item.paid_amount_cents / 100).toLocaleString('de-DE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function startOffenEdit(item: RechnungsausgangItem) {
		editingOffenId = item.id;
		offenDraft = offenText(item);
	}

	/**
	 * Abandons the edit without saving.
	 *
	 * Resets the draft to the stored value *before* closing the cell: removing the
	 * input can still fire its blur handler, and `saveTeilzahlung` then sees no change
	 * and does nothing — otherwise Escape would save the very text it is discarding.
	 */
	function cancelOffenEdit(item: RechnungsausgangItem) {
		offenDraft = offenText(item);
		editingOffenId = null;
	}

	/**
	 * Records how much of an invoice has been received.
	 *
	 * Called by: template (Offen cell editor).
	 * Purpose: A customer paying 1.300 € of a 1.372,49 € invoice was untrackable —
	 *          the register knew only paid or open, so the remainder lived in the
	 *          Bemerkung as free text and never reached the totals.
	 *
	 * Does not book the invoice as paid: a part-paid invoice is still an open
	 * receivable and stays in the Offen column and the dunning list. Clearing the
	 * field removes the Teilzahlung again.
	 */
	async function saveTeilzahlung(item: RechnungsausgangItem) {
		const paid_amount_cents = parseEuroInput(offenDraft);
		editingOffenId = null;

		if (offenDraft.trim() !== '' && paid_amount_cents == null) {
			showToast('Betrag konnte nicht gelesen werden', 'error');
			return;
		}
		if (paid_amount_cents != null && paid_amount_cents < 0) {
			showToast('Teilzahlung darf nicht negativ sein', 'error');
			return;
		}
		if (paid_amount_cents === item.paid_amount_cents) return;

		const prevPaid = item.paid_amount_cents;
		const prevOffen = item.offene_zahlungen_cents;
		item.paid_amount_cents = paid_amount_cents;
		item.offene_zahlungen_cents = openAmount(item);
		try {
			await apiPatch(`/api/v1/admin/rechnungsausgangsbuch/${item.id}/paid-amount`, {
				paid_amount_cents
			});
		} catch (e: any) {
			item.paid_amount_cents = prevPaid;
			item.offene_zahlungen_cents = prevOffen;
			showToast(e?.message || 'Teilzahlung konnte nicht gespeichert werden', 'error');
		}
	}

	/**
	 * What is still outstanding on a row, in cents — the same three-state rule the
	 * backend applies, repeated here so the cell updates without a refetch.
	 *
	 * Settled beats everything; then a Teilzahlung leaves the remainder (never
	 * negative — an overpayment reads as 0 and is settled with a Gutschrift row);
	 * otherwise the full Brutto. `null` Brutto stays `null`: a row whose amount we
	 * cannot compute must not claim 0,00 € open.
	 */
	function openAmount(item: RechnungsausgangItem): number | null {
		if (item.is_settled) return 0;
		if (item.brutto_cents == null) return null;
		if (item.paid_amount_cents == null) return item.brutto_cents;
		return Math.max(0, item.brutto_cents - item.paid_amount_cents);
	}

	// ── Export ───────────────────────────────────────────────────────────────

	/**
	 * Downloads the selected year as .xlsx.
	 *
	 * Called by: template (Als Excel exportieren).
	 * Purpose: The register is what Alex hands to the Steuerberater, who has always
	 *          received a spreadsheet. Without an export the app couldn't replace it.
	 */
	let exporting = $state(false);

	async function exportYear() {
		exporting = true;
		try {
			await apiDownload(
				`/api/v1/admin/rechnungsausgangsbuch/export?year=${activeYear}`,
				`Rechnungsausgangsbuch_${activeYear}.xlsx`
			);
		} catch (e: any) {
			showToast(e?.message || 'Export fehlgeschlagen', 'error');
		} finally {
			exporting = false;
		}
	}

	// ── Bezahlt ──────────────────────────────────────────────────────────────

	/** Invoice id currently being booked — disables just that row's button. */
	let payingId = $state<string | null>(null);

	/** Inquiry whose review question the modal is currently asking about. */
	let reviewFor = $state<{ inquiryId: string; customerName: string | null } | null>(null);

	async function markPaid(item: RechnungsausgangItem) {
		payingId = item.id;
		try {
			const outcome = await apiPost<PaidOutcome>(
				`/api/v1/admin/rechnungsausgangsbuch/${item.id}/paid`,
				{}
			);

			// Patch the row in place rather than refetching the whole register — a
			// reload would reset the year selection and lose the scroll position.
			item.paid_at = outcome.paid_at;
			item.is_settled = true;
			item.offene_zahlungen_cents = 0;
			// The backend stamps EC when no Zahlungsart was chosen — every row in Alex's
			// book carries one, and 83 of 86 are EC. Mirror it so the cell doesn't stay
			// on "—" until the next reload.
			item.payment_method = item.payment_method || 'EC';
			showToast(`Rechnung ${item.invoice_number} als bezahlt gebucht`, 'success');

			// Only for a fully settled Umzug whose review question is still open.
			if (outcome.review_prompt && outcome.inquiry_id) {
				reviewFor = {
					inquiryId: outcome.inquiry_id,
					customerName: outcome.customer_name ?? item.customer_name
				};
			}
		} catch (e: any) {
			showToast(e?.message || 'Konnte nicht als bezahlt gebucht werden', 'error');
		} finally {
			payingId = null;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Rechnungsausgangsbuch</h1>
		<span class="page-count">
			{loading ? rows.length : filtered.length} Eintr&auml;ge{loading
				? ''
				: filtersActive
					? ` von ${yearRows.length} (${activeYear})`
					: ` ${activeYear}`}
		</span>
		{#if !loading && !error && yearRows.length > 0}
			<button type="button" class="export-btn" onclick={exportYear} disabled={exporting}>
				<Download size={14} />
				{exporting ? 'Export läuft…' : 'Als Excel exportieren'}
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="loading">Lade Rechnungsausgangsbuch...</div>
	{:else if error}
		<div class="error-box">{error}</div>
	{:else if rows.length === 0}
		<div class="empty">Keine Rechnungen vorhanden.</div>
	{:else}
		<!-- Year selector -->
		<div class="year-nav">
			{#each years as y}
				<button
					type="button"
					class="year-btn"
					class:active={y === activeYear}
					onclick={() => selectYear(y)}
				>
					{y}
				</button>
			{/each}
		</div>

		<!-- Headline figures. These follow the filter, so they always describe what
		     is on screen rather than a year the reader isn't looking at. -->
		<div class="kpis">
			<div class="kpi">
				<span class="kpi-label">Umsatz netto</span>
				<span class="kpi-value">{fmtEur(kpis.umsatzNetto)}</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">Umsatzsteuer</span>
				<span class="kpi-value">{fmtEur(kpis.umsatzsteuer)}</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">Offen</span>
				<span class="kpi-value" class:warn={kpis.offen > 0}>{fmtEur(kpis.offen)}</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">
					&Uuml;berf&auml;llig{kpis.ueberfaelligCount ? ` (${kpis.ueberfaelligCount})` : ''}
				</span>
				<span class="kpi-value" class:danger={kpis.ueberfaellig > 0}>
					{fmtEur(kpis.ueberfaellig)}
				</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">&empty; Zahlungsdauer</span>
				<span class="kpi-value">
					{kpis.zahlungsdauerTage == null ? '\u2014' : `${kpis.zahlungsdauerTage} Tage`}
				</span>
			</div>
		</div>

		<MonatsUebersicht months={monthSummaries} selected={filters.month} onSelect={selectMonth} />

		<!-- Filters, one row above the table. -->
		<div class="filter-bar">
			<div class="chips">
				{#each STATUS_CHIPS as chip}
					<button
						type="button"
						class="chip"
						class:active={filters.status === chip.key}
						onclick={() => (filters = { ...filters, status: chip.key })}
					>
						{chip.label}
					</button>
				{/each}
			</div>

			<div class="chips months">
				<button
					type="button"
					class="chip"
					class:active={filters.month == null}
					onclick={() => selectMonth(null)}
				>
					Jahr
				</button>
				{#each MONTH_LABELS as label, i}
					<button
						type="button"
						class="chip"
						class:active={filters.month === i + 1}
						disabled={monthSummaries[i].count === 0}
						onclick={() => selectMonth(i + 1)}
					>
						{label}
					</button>
				{/each}
			</div>

			<div class="search">
				<Search size={14} />
				<input
					type="search"
					placeholder="Kunde oder Rg.-Nr."
					value={filters.search}
					oninput={(e) => (filters = { ...filters, search: e.currentTarget.value })}
				/>
			</div>

			{#if filtersActive}
				<button type="button" class="chip reset" onclick={resetFilters}>
					<X size={13} /> Filter zur&uuml;cksetzen
				</button>
			{/if}
		</div>

		<!-- Full year, one chronological list -->
		{#if filtered.length === 0}
			<div class="empty">
				{filtersActive
					? 'Keine Rechnungen für diese Auswahl.'
					: `Keine Rechnungen im Jahr ${activeYear}.`}
			</div>
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							{#each COLUMNS as col}
								{#if col.sort != null}
									{@const sortKey = col.sort}
									<th class:num={col.num}>
										<button
											type="button"
											class="sort-btn"
											class:sorted={sort?.key === sortKey}
											onclick={() => toggleSort(sortKey)}
											title="Sortieren — dritter Klick stellt die Registerreihenfolge wieder her"
										>
											<span>{@html col.label}</span>
											{#if sort?.key === sortKey}
												{#if sort.dir === 'asc'}
													<ArrowUp size={11} />
												{:else}
													<ArrowDown size={11} />
												{/if}
											{/if}
										</button>
									</th>
								{:else}
									<th class:num={col.num}>{@html col.label}</th>
								{/if}
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filtered as item}
							<tr
								class:paid={isSettled(item)}
								class:draft={isDraft(item)}
								class:overdue={isOverdue(item, today)}
							>
								<td class="mono">
									{#if item.pdf_s3_key && (item.inquiry_id || item.kind === 'lagerung')}
										<button
											type="button"
											class="link-btn"
											onclick={() => openInvoicePdf(item)}
											title="Rechnung \u00f6ffnen"
										>
											<FileText size={12} />
											{item.invoice_number}
										</button>
									{:else}
										{item.invoice_number}
									{/if}
								</td>
								<td>
									<span class="type-label" class:credit={item.is_gutschrift}>{typeLabel(item)}</span>
									{#if isDraft(item)}
										<span class="draft-badge" title="Noch nicht versendet \u2014 Nummer ist reserviert">Entwurf</span>
									{/if}
								</td>
								<td>{formatServicePeriod(item.scheduled_date, item.end_date)}</td>
								<td>
									{#if item.inquiry_id}
										<a class="row-link" href="/admin/inquiries/{item.inquiry_id}">
											{item.customer_name || '\u2014'}
										</a>
									{:else}
										{item.customer_name || '\u2014'}
									{/if}
								</td>
								<td class="num">{fmtEur(item.netto_cents)}</td>
								<td class="num">{fmtEur(item.mwst_cents)}</td>
								<td class="num">{fmtEur(item.brutto_cents)}</td>
								<td>{fmtDate(item.sent_at)}</td>
								<td>{fmtDate(item.due_date)}</td>
								<td>
									{#if item.paid_at}
										{fmtDate(item.paid_at)}
									{:else if isDraft(item)}
										<!-- Booking a never-issued invoice as paid would also flip its
										     inquiry to "bezahlt", from any status. Not offered here. -->
										<span class="muted-cell">&mdash;</span>
									{:else}
										<button
											type="button"
											class="paid-btn"
											onclick={() => markPaid(item)}
											disabled={payingId === item.id}
											title="Als bezahlt buchen"
										>
											<Check size={13} />
											{payingId === item.id ? '…' : 'Bezahlt'}
										</button>
									{/if}
								</td>
								<td class="num offen">
									{#if editingOffenId === item.id}
										<!-- svelte-ignore a11y_autofocus -->
										<input
											class="offen-input"
											type="text"
											inputmode="decimal"
											autofocus
											bind:value={offenDraft}
											onblur={() => saveTeilzahlung(item)}
											onkeydown={(e) => {
												if (e.key === 'Enter') e.currentTarget.blur();
												if (e.key === 'Escape') cancelOffenEdit(item);
											}}
											placeholder="Teilzahlung"
											title="Erhaltenen Teilbetrag eintragen — leeren, um ihn zu entfernen"
										/>
									{:else if item.is_settled}
										<!-- Alex's Offene-Zahlungen column says the word he scans for, not 0,00 €. -->
										<span class="settled">Bezahlt</span>
									{:else}
										<button
											type="button"
											class="offen-btn"
											onclick={() => startOffenEdit(item)}
											title="Teilzahlung erfassen"
										>
											{fmtEur(item.offene_zahlungen_cents)}
										</button>
										{#if item.paid_amount_cents != null}
											<span class="teilzahlung" title="Bereits erhalten">
												davon {fmtEur(item.paid_amount_cents)} erhalten
											</span>
										{/if}
									{/if}
								</td>
								<td>
									<select
										class="payment-method-select"
										value={item.payment_method ?? ''}
										onchange={(e) => updatePaymentMethod(item, e.currentTarget.value)}
									>
										<option value="">\u2014</option>
										{#each PAYMENT_METHODS as pm}
											<option value={pm}>{pm}</option>
										{/each}
									</select>
								</td>
								<td class="notes-cell">
									<input
										class="notes-input"
										type="text"
										value={item.notes ?? ''}
										onblur={(e) => saveNotes(item, e.currentTarget.value)}
										onkeydown={(e) => {
											if (e.key === 'Enter') e.currentTarget.blur();
											if (e.key === 'Escape') {
												e.currentTarget.value = item.notes ?? '';
												e.currentTarget.blur();
											}
										}}
										placeholder="Bemerkung"
									/>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="4">{filtersActive ? 'Summe Auswahl' : `Summe ${activeYear}`}</th>
							<th class="num">{fmtEur(totalNetto)}</th>
							<th class="num">{fmtEur(totalMwst)}</th>
							<th class="num">{fmtEur(totalBrutto)}</th>
							<th colspan="3"></th>
							<th class="num">{fmtEur(totalOffen)}</th>
							<th colspan="2"></th>
						</tr>
						{#if totalEntwurf !== 0}
							<tr class="foot-note">
								<td colspan="13">
									Nicht gez&auml;hlt: {fmtEur(totalEntwurf)} aus noch nicht versendeten Entw&uuml;rfen.
								</td>
							</tr>
						{/if}
					</tfoot>
				</table>
			</div>
		{/if}

		<!-- Year grand total -->
		<div class="grand-total">
			<span class="grand-total__label">
				{filtersActive ? 'Summe der Auswahl' : `Gesamtsumme ${activeYear}`}
			</span>
			<span class="num" data-label="Netto">{fmtEur(totalNetto)}</span>
			<span class="num" data-label="MWST">{fmtEur(totalMwst)}</span>
			<span class="num" data-label="Brutto">{fmtEur(totalBrutto)}</span>
			<span class="spacer"></span>
			<span class="num" data-label="Offen">{fmtEur(totalOffen)}</span>
		</div>

		{#if totalEntwurf !== 0}
			<p class="draft-note">
				Zus&auml;tzlich {fmtEur(totalEntwurf)} in noch nicht versendeten Entw&uuml;rfen —
				diese z&auml;hlen nicht zu den Summen.
			</p>
		{/if}
	{/if}
</div>

{#if reviewFor}
	<ReviewRequestModal
		inquiryId={reviewFor.inquiryId}
		customerName={reviewFor.customerName}
		onDecided={() => (reviewFor = null)}
		onClose={() => (reviewFor = null)}
	/>
{/if}

<style>
	.page { padding: var(--dt-space-6); }

	.page-header {
		display: flex; align-items: baseline; gap: 0.75rem;
		margin-bottom: var(--dt-space-6);
	}
	.page-header h1 {
		font-size: 1.5rem; font-weight: 700; color: var(--dt-on-surface); margin: 0;
	}
	.page-count {
		font-size: 0.8125rem; color: var(--dt-on-surface-variant);
	}

	.loading, .empty {
		color: var(--dt-on-surface-variant); padding: var(--dt-space-10); text-align: center;
	}
	.error-box {
		background: var(--dt-error-bg); border: 1px solid var(--dt-error-text);
		color: var(--dt-error-text); padding: var(--dt-space-4); border-radius: var(--dt-radius-md);
	}

	/* ── year selector ─────────────────────────────── */
	.year-nav {
		display: flex; justify-content: center; flex-wrap: wrap;
		gap: var(--dt-space-2); margin-bottom: var(--dt-space-3);
	}
	.year-btn {
		padding: 0.35rem 0.9rem; border-radius: var(--dt-radius-md);
		border: var(--dt-ghost-border); background: var(--dt-surface-container-low);
		color: var(--dt-on-surface-variant); font-size: 0.875rem; font-weight: 600;
		cursor: pointer; transition: background var(--dt-transition);
	}
	.year-btn:hover { background: var(--dt-surface-container-high); }
	.year-btn.active {
		background: var(--dt-primary); color: var(--dt-on-primary); border-color: transparent;
	}

	/* ── KPI row ─────────────────────────────────── */
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--dt-space-3);
		margin-bottom: var(--dt-space-4);
	}
	.kpi {
		display: flex; flex-direction: column; gap: 0.15rem;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: var(--dt-space-4) var(--dt-space-5);
	}
	.kpi-label {
		font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em;
		color: var(--dt-on-surface-variant);
	}
	.kpi-value {
		font-size: 1.25rem; font-weight: 700; font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface);
	}
	.kpi-value.warn { color: var(--dt-secondary); }
	.kpi-value.danger { color: var(--dt-error-text, #b3261e); }

	/* ── filter bar ──────────────────────────────── */
	.filter-bar {
		display: flex; flex-wrap: wrap; align-items: center;
		gap: var(--dt-space-3); margin-bottom: var(--dt-space-3);
	}
	.chips { display: flex; flex-wrap: wrap; gap: var(--dt-space-1, 0.25rem); }
	.chips.months { gap: 2px; }
	.chip {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.3rem 0.7rem; border-radius: var(--dt-radius-md);
		border: var(--dt-ghost-border); background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
		font-size: 0.75rem; font-weight: 600; cursor: pointer;
		transition: background var(--dt-transition);
	}
	.chip:hover:not(:disabled) { background: var(--dt-surface-container-high); }
	.chip.active {
		background: var(--dt-primary); color: var(--dt-on-primary); border-color: transparent;
	}
	.chip:disabled { opacity: 0.35; cursor: default; }
	.chip.reset { margin-left: auto; }

	.search {
		display: inline-flex; align-items: center; gap: 0.35rem;
		padding: 0.3rem 0.6rem; border-radius: var(--dt-radius-md);
		border: var(--dt-ghost-border); background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
	}
	.search input {
		border: none; background: none; outline: none; font: inherit;
		font-size: 0.8125rem; color: var(--dt-on-surface); width: 15ch;
	}

	/* ── table ───────────────────────────────────── */
	/* The register is its own scroll box rather than growing the page: that keeps
	 * the sticky header row (and its sort buttons) and the horizontal scrollbar on
	 * its bottom edge both in view while working down a full year of rows.
	 * The 14rem reserve is what leaves the box fully on screen — clear of the 56px
	 * sticky topbar — once the page is scrolled down to the register. */
	.table-wrapper {
		background: var(--dt-surface-container-lowest); border-radius: var(--dt-radius-lg);
		max-height: calc(100vh - 14rem);
		overflow: auto;
	}
	table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
	thead { background: var(--dt-surface-container-high); }
	th {
		padding: 8px var(--dt-space-4); text-align: left; font-weight: 500;
		color: var(--dt-on-surface-variant); font-size: 12px;
		text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
	}
	/* A full year is a long scroll — keep the column labels in view. */
	thead th {
		position: sticky; top: 0; z-index: 2;
		background: var(--dt-surface-container-high);
	}
	th.num { text-align: right; }
	td {
		padding: 8px var(--dt-space-4); color: var(--dt-on-surface); white-space: nowrap;
	}
	td.num { text-align: right; font-variant-numeric: tabular-nums; }
	td.offen { font-weight: 600; color: var(--dt-secondary); }
	tbody tr:nth-child(even) { background: var(--dt-surface-container-low); }
	tbody tr:nth-child(odd)  { background: var(--dt-surface-container-lowest); }
	tbody tr:hover { background: var(--dt-surface-container-high) !important; }
	tbody tr.paid td { color: var(--dt-on-surface-variant); }
	tbody tr.paid td.offen { color: var(--admin-success); }

	.mono { font-family: var(--font-mono); font-size: 0.75rem; }

	/* Sortable headers. The affordance stays quiet until hovered — the register is
	 * read far more often than it is re-sorted. */
	.sort-btn {
		display: inline-flex; align-items: center; gap: 0.2rem;
		padding: 0; border: none; background: none; cursor: pointer;
		font: inherit; color: inherit; text-transform: inherit; letter-spacing: inherit;
	}
	.sort-btn:hover { color: var(--dt-on-surface); }
	.sort-btn.sorted { color: var(--dt-primary); font-weight: 700; }
	th.num .sort-btn { flex-direction: row-reverse; }

	/* Issued, unpaid, past its Fälligkeit — the rows Alex is chasing. */
	tbody tr.overdue td.offen { color: var(--dt-error-text, #b3261e); }
	tbody tr.overdue td.mono { box-shadow: inset 3px 0 0 var(--dt-error-text, #b3261e); }

	/* ── row links ─────────────────────────────────── */
	.link-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0; border: none; background: none; cursor: pointer;
		font-family: var(--font-mono); font-size: 0.75rem;
		color: var(--dt-primary); text-decoration: underline;
	}
	.link-btn:hover { opacity: 0.75; }
	.row-link { color: var(--dt-on-surface); text-decoration: underline; }
	.row-link:hover { color: var(--dt-primary); }

	.muted-cell { color: var(--dt-on-surface-variant); }
	.type-label { white-space: nowrap; }
	.type-label.credit { color: var(--dt-error-text, #b3261e); font-weight: 600; }

	.draft-badge {
		margin-left: 0.35rem; padding: 1px 6px; border-radius: var(--dt-radius-sm);
		font-size: 0.6875rem; font-weight: 600; white-space: nowrap;
		color: var(--dt-on-surface-variant); background: var(--dt-surface-container-high);
	}
	/* Not yet issued — de-emphasised so the real entries read as the register. */
	tbody tr.draft td:not(.offen) { opacity: 0.7; }

	.paid-btn {
		display: inline-flex; align-items: center; gap: 0.2rem;
		padding: 2px 8px; font-size: 0.75rem; font-weight: 600;
		color: var(--admin-success, #2e7d32);
		background: color-mix(in srgb, var(--admin-success, #2e7d32) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--admin-success, #2e7d32) 35%, transparent);
		border-radius: var(--dt-radius-sm); cursor: pointer; white-space: nowrap;
		transition: background var(--dt-transition);
	}
	.paid-btn:hover:not(:disabled) {
		background: color-mix(in srgb, var(--admin-success, #2e7d32) 20%, transparent);
	}
	.paid-btn:disabled { opacity: 0.5; cursor: default; }
	.payment-method-select {
		background: transparent; color: var(--dt-on-surface);
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-sm);
		padding: 2px 4px; font-size: 0.8125rem; cursor: pointer;
	}
	.notes-cell { max-width: 240px; }

	/* Bemerkungen and Teilzahlung are cell editors, not form fields: chromeless
	 * until focused, so the table still reads as a ledger rather than a form. */
	.notes-input, .offen-input {
		width: 100%; padding: 2px 4px;
		border: 1px solid transparent; border-radius: var(--dt-radius-sm);
		background: transparent; color: var(--dt-on-surface);
		font: inherit;
	}
	.notes-input:hover, .offen-input:hover { border-color: var(--dt-outline-variant); }
	.notes-input:focus, .offen-input:focus {
		outline: none; border-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
	}
	.notes-input::placeholder, .offen-input::placeholder {
		color: var(--dt-on-surface-variant); opacity: 0.6;
	}
	.offen-input { text-align: right; font-variant-numeric: tabular-nums; }

	/* The open amount doubles as the Teilzahlung trigger — styled as text, not a
	 * button, so the column still reads as a column of numbers. */
	.offen-btn {
		padding: 0; border: none; background: none; cursor: text;
		font: inherit; color: inherit; text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.offen-btn:hover { text-decoration: underline dotted; }
	.settled { color: var(--admin-success, #2e7d32); font-weight: 600; }
	.teilzahlung {
		display: block; font-size: 0.6875rem; font-weight: 400;
		color: var(--dt-on-surface-variant); white-space: nowrap;
	}

	.export-btn {
		display: inline-flex; align-items: center; gap: 0.35rem;
		margin-left: auto; padding: 0.35rem 0.75rem;
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-md);
		background: var(--dt-surface-container-low); color: var(--dt-on-surface-variant);
		font-size: 0.8125rem; font-weight: 600; cursor: pointer;
		transition: background var(--dt-transition);
	}
	.export-btn:hover:not(:disabled) { background: var(--dt-surface-container-high); }
	.export-btn:disabled { opacity: 0.5; cursor: default; }

	tfoot { background: var(--dt-surface-container-high); }
	tfoot th {
		padding: 10px var(--dt-space-4); font-weight: 600; color: var(--dt-on-surface);
		border-top: 2px solid var(--dt-outline-variant);
	}
	tfoot th.num { text-align: right; }

	tfoot tr.foot-note td {
		padding: 6px var(--dt-space-4);
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--dt-on-surface-variant);
	}

	.draft-note {
		margin: var(--dt-space-2) 0 0;
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	/* ── grand total ──────────────────────────────── */
	.grand-total {
		display: grid; grid-template-columns: 1fr repeat(4, 120px); gap: var(--dt-space-4);
		align-items: center; padding: var(--dt-space-4) var(--dt-space-6);
		background: var(--dt-primary); color: var(--dt-on-primary);
		border-radius: var(--dt-radius-lg); font-weight: 700; font-size: 1rem; margin-top: var(--dt-space-4);
	}
	.grand-total .num { text-align: right; font-variant-numeric: tabular-nums; }
	.grand-total .spacer { grid-column: span 3; }

	@media (max-width: 768px) {
		.page {
			padding: var(--dt-space-4);
		}

		.paid-btn,
		.payment-method-select,
		.export-btn,
		.notes-input,
		.offen-input {
			min-height: 44px;
		}

		.chip, .search { min-height: 36px; }
		.search input { width: 100%; }
		.search { flex: 1; }
		.chip.reset { margin-left: 0; }
		.kpis { grid-template-columns: repeat(2, 1fr); }
	}

	/* The fixed 5-column grid (label + 4×120px) needs ~700px, more than the content
	 * column has next to the 240px sidebar on a laptop — so it reflows well above
	 * the mobile breakpoint: a wrapping flex list with inline labels instead. */
	@media (max-width: 1100px) {
		.grand-total {
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem 1rem;
		}

		.grand-total__label {
			flex-basis: 100%;
		}

		.grand-total .spacer {
			display: none;
		}

		.grand-total .num::before {
			content: attr(data-label) ': ';
			font-weight: 400;
			opacity: 0.85;
		}
	}
</style>
