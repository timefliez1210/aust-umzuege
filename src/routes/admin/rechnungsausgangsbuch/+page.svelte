<script lang="ts">
	import { onMount } from 'svelte';
	import { apiGet, apiPatch, apiPost, apiPreview } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ReviewRequestModal from '$lib/components/admin/ReviewRequestModal.svelte';
	import { Check, FileText } from 'lucide-svelte';
	import { isDraft, yearOf, availableYears, rowsForYear, registerTotals } from '$lib/utils/register';

	const PAYMENT_METHODS = ['Überweisung', 'Bar', 'EC-Karte', 'PayPal'];

	interface RechnungsausgangItem {
		id: string;
		kind: string; // "umzug" | "lagerung"
		/** null for Lagerung — storage invoices hang off a contract, not an inquiry. */
		inquiry_id: string | null;
		invoice_number: string;
		customer_name: string | null;
		scheduled_date: string | null;
		netto_cents: number | null;
		mwst_cents: number | null;
		brutto_cents: number | null;
		sent_at: string | null;
		created_at: string;
		due_date: string | null;
		paid_at: string | null;
		offene_zahlungen_cents: number | null;
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
	 * The whole selected year as one chronological list — the register is a running
	 * ledger, so it is read top to bottom rather than paged month by month.
	 */
	let yearRows = $derived(rowsForYear(rows, activeYear));

	// Year totals — these used to sum EVERY loaded row regardless of year despite
	// being labelled "Gesamtsumme (Jahr)" (feedback report 12e2d18f). Scoping and
	// the draft exclusion live in $lib/utils/register so they stay under test.
	let totals = $derived(registerTotals(yearRows));
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
			item.offene_zahlungen_cents = 0;
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
			{loading ? rows.length : yearRows.length} Eintr&auml;ge{loading ? '' : ` ${activeYear}`}
		</span>
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
					onclick={() => (activeYear = y)}
				>
					{y}
				</button>
			{/each}
		</div>

		<!-- Full year, one chronological list -->
		{#if yearRows.length === 0}
			<div class="empty">Keine Rechnungen im Jahr {activeYear}.</div>
		{:else}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Rg-Nr.</th>
							<th>Typ</th>
							<th>Leistungsdatum</th>
							<th>Kunde</th>
							<th class="num">Netto</th>
							<th class="num">MWST</th>
							<th class="num">Brutto</th>
							<th>Rechnungsdatum</th>
							<th>F&auml;llig</th>
							<th>Bezahlt</th>
							<th class="num">Offen</th>
							<th>Zahlungsart</th>
							<th>Bem.</th>
						</tr>
					</thead>
					<tbody>
						{#each yearRows as item}
							<tr class:paid={item.paid_at != null} class:draft={isDraft(item)}>
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
								<td>{fmtDate(item.scheduled_date)}</td>
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
								<td class="num offen">{fmtEur(item.offene_zahlungen_cents)}</td>
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
								<td class="notes-cell">{item.notes || ''}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="4">Summe {activeYear}</th>
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
			<span class="grand-total__label">Gesamtsumme {activeYear}</span>
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

	/* ── table ───────────────────────────────────── */
	.table-wrapper {
		background: var(--dt-surface-container-lowest); border-radius: var(--dt-radius-lg);
		overflow-x: auto;
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
		position: sticky; top: 0; z-index: 1;
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
	.notes-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }

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
		.payment-method-select {
			min-height: 44px;
		}

		/* Fixed 5-column grid (label + 4×120px) overflows narrow viewports —
		 * switch to a wrapping flex list with inline labels instead. */
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
