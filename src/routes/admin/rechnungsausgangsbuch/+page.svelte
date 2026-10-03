<script lang="ts">
	import { onMount } from 'svelte';
	import { apiDownload, apiGet, apiPatch, apiPost, apiPreview } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ReviewRequestModal from '$lib/components/admin/ReviewRequestModal.svelte';
	import { ArrowDown, ArrowUp, Check, Download, FileText, Search, X } from 'lucide-svelte';
	import MonatsUebersicht from '$lib/components/admin/MonatsUebersicht.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
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
		{ label: 'Fällig' },
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
			// mark_paid backfills sent_at for a draft that Alex sent by hand. Mirror the
			// same COALESCE here so the Versendet column fills in with the rest of the
			// row instead of staying on "\u2014" until the next reload.
			item.sent_at = item.sent_at || outcome.paid_at;
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

<svelte:head><title>Rechnungsbuch</title></svelte:head>

<PageHeader
	title="Rechnungsbuch"
	count="{loading ? rows.length : filtered.length} Einträge{loading ? '' : filtersActive ? ` von ${yearRows.length} (${activeYear})` : ` ${activeYear}`}"
>
	{#snippet actions()}
		{#if !loading && !error && yearRows.length > 0}
			<Button onclick={exportYear} disabled={exporting}>
				<Download size={15} />
				{exporting ? 'Export läuft …' : `Excel ${activeYear}`}
			</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if loading}
	<div class="flex flex-col gap-3.5" aria-busy="true">
		<div class="h-28 animate-pulse rounded-md bg-sunk"></div>
		<div class="h-96 animate-pulse rounded-md bg-sunk"></div>
	</div>
{:else if error}
	<p class="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
{:else if rows.length === 0}
	<EmptyState title="Keine Rechnungen vorhanden" />
{:else}
	<div class="flex flex-col gap-3.5">
		<FilterTabs label="Jahr" options={years.map((y) => ({ value: y, label: y }))} value={activeYear} onchange={selectYear} />

		<!-- Headline figures follow the filter: they describe what is on screen. -->
		<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Kennzahlen">
			<Kpi label="Umsatz netto" value={fmtEur(kpis.umsatzNetto)} />
			<Kpi label="Umsatzsteuer" value={fmtEur(kpis.umsatzsteuer)} />
			<Kpi label="Offen" value={fmtEur(kpis.offen)} valueClass={kpis.offen > 0 ? 'text-warn' : ''} />
			<Kpi
				label="Überfällig{kpis.ueberfaelligCount ? ` (${kpis.ueberfaelligCount})` : ''}"
				value={fmtEur(kpis.ueberfaellig)}
				valueClass={kpis.ueberfaellig > 0 ? 'text-danger' : ''}
				class={kpis.ueberfaellig > 0 ? 'border-danger/40' : ''}
			/>
			<Kpi label="Ø Zahlungsdauer" value={kpis.zahlungsdauerTage == null ? '—' : `${kpis.zahlungsdauerTage} Tage`} />
		</section>

		<MonatsUebersicht months={monthSummaries} selected={filters.month} onSelect={selectMonth} />

		<div class="flex flex-col gap-2.5">
			<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
				<FilterTabs
					label="Status"
					options={STATUS_CHIPS.map((c) => ({ value: c.key, label: c.label }))}
					value={filters.status}
					onchange={(v) => (filters = { ...filters, status: v })}
				/>
				<label
					class="flex h-9 items-center gap-2 rounded-sm border border-line-strong bg-panel px-3 text-faint focus-within:border-fg lg:ml-auto lg:w-64"
				>
					<Search size={14} />
					<input
						type="search"
						placeholder="Kunde oder Rg.-Nr."
						class="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
						value={filters.search}
						oninput={(e) => (filters = { ...filters, search: e.currentTarget.value })}
					/>
				</label>
				{#if filtersActive}
					<Button size="sm" variant="ghost" onclick={resetFilters}><X size={14} /> Zurücksetzen</Button>
				{/if}
			</div>
			<FilterTabs
				label="Monat"
				options={[
					{ value: '0', label: 'Ganzes Jahr' },
					...MONTH_LABELS.map((label, i) => ({ value: String(i + 1), label, count: monthSummaries[i].count || undefined }))
				]}
				value={String(filters.month ?? 0)}
				onchange={(v) => selectMonth(v === '0' ? null : Number(v))}
			/>
		</div>

		{#if filtered.length === 0}
			<EmptyState title={filtersActive ? 'Keine Rechnungen für diese Auswahl.' : `Keine Rechnungen im Jahr ${activeYear}.`} />
		{:else}
			<div class="overflow-x-auto rounded-md border border-line bg-panel">
				<table class="w-full min-w-[1180px] border-collapse text-sm">
					<thead>
						<tr class="border-b border-line">
							{#each COLUMNS as col (col.label)}
								<th class="px-2.5 py-2.5 font-normal whitespace-nowrap first:pl-4 last:pr-4 {col.num ? 'text-right' : 'text-left'}">
									{#if col.sort != null}
										{@const sortKey = col.sort}
										<button
											type="button"
											class="label-xs inline-flex items-center gap-1 {sort?.key === sortKey ? 'text-fg' : 'text-faint hover:text-fg'}"
											onclick={() => toggleSort(sortKey)}
											title="Sortieren — dritter Klick stellt die Registerreihenfolge wieder her"
										>
											{col.label}
											{#if sort?.key === sortKey}
												{#if sort.dir === 'asc'}<ArrowUp size={11} />{:else}<ArrowDown size={11} />{/if}
											{/if}
										</button>
									{:else}
										<span class="label-xs text-faint">{col.label}</span>
									{/if}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filtered as item (item.kind + item.id)}
							{@const overdue = isOverdue(item, today)}
							<tr
								class="border-b border-line last:border-b-0 hover:bg-sunk/60 {isDraft(item) ? 'text-muted' : ''} {overdue
									? 'shadow-[inset_3px_0_0_var(--danger)]'
									: ''}"
							>
								<td class="num py-1.5 pr-2.5 pl-4 text-[13px] whitespace-nowrap">
									{#if item.pdf_s3_key && (item.inquiry_id || item.kind === 'lagerung')}
										<button
											type="button"
											class="inline-flex items-center gap-1 text-accent-text hover:underline"
											onclick={() => openInvoicePdf(item)}
											title="Rechnung öffnen"
										>
											<FileText size={12} />{item.invoice_number}
										</button>
									{:else}
										{item.invoice_number}
									{/if}
								</td>
								<td class="px-2.5 py-1.5">
									<span class="flex flex-wrap items-center gap-1">
										<span class="text-[13px] {item.is_gutschrift ? 'text-danger' : ''}">{typeLabel(item)}</span>
										{#if isDraft(item)}<Badge title="Noch nicht versendet — Nummer ist reserviert">Entwurf</Badge>{/if}
									</span>
								</td>
								<td class="num px-2.5 py-1.5 text-[13px] whitespace-nowrap">{formatServicePeriod(item.scheduled_date, item.end_date)}</td>
								<td class="max-w-56 truncate px-2.5 py-1.5">
									{#if item.inquiry_id}
										<a class="font-medium hover:underline" href="/admin/inquiries/{item.inquiry_id}">{item.customer_name || '—'}</a>
									{:else}
										{item.customer_name || '—'}
									{/if}
								</td>
								<td class="num px-2.5 py-1.5 text-right">{fmtEur(item.netto_cents)}</td>
								<td class="num px-2.5 py-1.5 text-right text-muted">{fmtEur(item.mwst_cents)}</td>
								<td class="num px-2.5 py-1.5 text-right font-medium">{fmtEur(item.brutto_cents)}</td>
								<td class="num px-2.5 py-1.5 text-[13px] whitespace-nowrap text-muted">{fmtDate(item.sent_at)}</td>
								<td class="num px-2.5 py-1.5 text-[13px] whitespace-nowrap {overdue ? 'text-danger' : 'text-muted'}">{fmtDate(item.due_date)}</td>
								<td class="px-2.5 py-1.5 whitespace-nowrap">
									{#if item.paid_at}
										<span class="num text-[13px] text-ok">{fmtDate(item.paid_at)}</span>
									{:else}
										<!-- Alex often sends a draft PDF himself instead of using "Senden"; booking it
										     as paid here backfills sent_at (see mark_paid). -->
										<Button
											size="xs"
											onclick={() => markPaid(item)}
											disabled={payingId === item.id}
											title={isDraft(item) ? 'Als bezahlt buchen (Rechnung gilt damit auch als versendet)' : 'Als bezahlt buchen'}
										>
											<Check size={12} />
											{payingId === item.id ? '…' : 'Bezahlt'}
										</Button>
									{/if}
								</td>
								<td class="px-2.5 py-1.5 text-right">
									{#if editingOffenId === item.id}
										<!-- svelte-ignore a11y_autofocus -->
										<input
											class="num h-7 w-24 rounded-xs border border-fg bg-panel px-1.5 text-right text-[13px] outline-none"
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
										<!-- Alex's column says the word he scans for, not 0,00 €. -->
										<span class="text-[13px] text-ok">Bezahlt</span>
									{:else}
										<button
											type="button"
											class="num rounded-xs px-1 text-warn hover:bg-sunk hover:underline"
											onclick={() => startOffenEdit(item)}
											title="Teilzahlung erfassen">{fmtEur(item.offene_zahlungen_cents)}</button
										>
										{#if item.paid_amount_cents != null}
											<span class="num block text-[11px] text-faint" title="Bereits erhalten"
												>davon {fmtEur(item.paid_amount_cents)} erhalten</span
											>
										{/if}
									{/if}
								</td>
								<td class="px-2.5 py-1.5">
									<select
										class="h-7 rounded-xs border border-transparent bg-transparent px-1.5 text-[13px] outline-none hover:border-line focus:border-fg bg-panel"
										aria-label="Zahlungsart"
										value={item.payment_method ?? ''}
										onchange={(e) => updatePaymentMethod(item, e.currentTarget.value)}
									>
										<option value="">—</option>
										{#each PAYMENT_METHODS as pm (pm)}<option value={pm}>{pm}</option>{/each}
									</select>
								</td>
								<td class="py-1.5 pr-4 pl-2.5">
									<input
										class="h-7 rounded-xs border border-transparent bg-transparent px-1.5 text-[13px] outline-none hover:border-line focus:border-fg w-40"
										type="text"
										aria-label="Bemerkung"
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
						<tr class="num border-t border-line-strong font-semibold">
							<th colspan="4" class="py-2.5 pl-4 text-left font-sans">{filtersActive ? 'Summe Auswahl' : `Summe ${activeYear}`}</th>
							<th class="px-2.5 py-2.5 text-right">{fmtEur(totalNetto)}</th>
							<th class="px-2.5 py-2.5 text-right">{fmtEur(totalMwst)}</th>
							<th class="px-2.5 py-2.5 text-right">{fmtEur(totalBrutto)}</th>
							<th colspan="3"></th>
							<th class="px-2.5 py-2.5 text-right">{fmtEur(totalOffen)}</th>
							<th colspan="2"></th>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}

		<!-- Grand total stays visible below the (horizontally scrolling) table on phones. -->
		<div class="num grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-line bg-panel px-4 py-3 text-sm sm:flex sm:items-baseline sm:gap-6">
			<span class="col-span-2 font-sans font-semibold">{filtersActive ? 'Summe der Auswahl' : `Gesamtsumme ${activeYear}`}</span>
			<span class="sm:ml-auto"><span class="label-xs mr-1.5 text-faint">Netto</span>{fmtEur(totalNetto)}</span>
			<span><span class="label-xs mr-1.5 text-faint">MwSt</span>{fmtEur(totalMwst)}</span>
			<span class="font-semibold"><span class="label-xs mr-1.5 font-normal text-faint">Brutto</span>{fmtEur(totalBrutto)}</span>
			<span class="text-warn"><span class="label-xs mr-1.5 text-faint">Offen</span>{fmtEur(totalOffen)}</span>
		</div>

		{#if totalEntwurf !== 0}
			<p class="text-xs text-muted">
				Zusätzlich {fmtEur(totalEntwurf)} in noch nicht versendeten Entwürfen — diese zählen nicht zu den Summen.
			</p>
		{/if}
	</div>
{/if}

{#if reviewFor}
	<ReviewRequestModal
		inquiryId={reviewFor.inquiryId}
		customerName={reviewFor.customerName}
		onDecided={() => (reviewFor = null)}
		onClose={() => (reviewFor = null)}
	/>
{/if}
