<script lang="ts">
	import { apiGet } from '$lib/utils/api.svelte';

	interface RechnungsausgangItem {
		id: string;
		invoice_number: string;
		customer_name: string | null;
		scheduled_date: string | null;
		netto_cents: number | null;
		mwst_cents: number | null;
		brutto_cents: number | null;
		sent_at: string | null;
		due_date: string | null;
		paid_at: string | null;
		offene_zahlungen_cents: number | null;
		payment_method: string | null;
		notes: string | null;
	}

	interface MonthGroup {
		label: string;      // e.g. "April 2026"
		items: RechnungsausgangItem[];
		netto: number;
		mwst: number;
		brutto: number;
		offen: number;
	}

	let rows = $state<RechnungsausgangItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			rows = await apiGet<RechnungsausgangItem[]>('/api/v1/admin/rechnungsausgangsbuch');
		} catch (e: any) {
			error = e?.message || 'Ladefehler';
			rows = [];
		} finally {
			loading = false;
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
		return d.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	/**
	 * Invoice date for grouping: sent_at because invoices are sent immediately
	 * after human confirmation; drafts (sent_at = null) fall into a catch-all.
	 */
	function invoiceDate(item: RechnungsausgangItem): string {
		return item.sent_at ?? '';
	}

	let monthGroups = $derived.by<MonthGroup[]>(() => {
		const map = new Map<string, RechnungsausgangItem[]>();
		const unsent: RechnungsausgangItem[] = [];
		for (const item of rows) {
			const d = invoiceDate(item);
			if (!d) {
				unsent.push(item);
				continue;
			}
			const m = d.substring(0, 7); // "YYYY-MM"
			if (!map.has(m)) map.set(m, []);
			map.get(m)!.push(item);
		}
		// Sort month keys chronologically; unsent drafts go last
		const keys = [...map.keys()].sort();
		const groups: MonthGroup[] = [];
		for (const m of keys) {
			const items = map.get(m)!;
			const [y, mo] = m.split('-');
			const label = new Date(+y, +mo - 1).toLocaleDateString('de-DE', {
				year: 'numeric',
				month: 'long'
			});
			groups.push({
				label,
				items,
				netto: items.reduce((s, r) => s + (r.netto_cents ?? 0), 0),
				mwst: items.reduce((s, r) => s + (r.mwst_cents ?? 0), 0),
				brutto: items.reduce((s, r) => s + (r.brutto_cents ?? 0), 0),
				offen: items.reduce((s, r) => s + (r.offene_zahlungen_cents ?? 0), 0)
			});
		}
		if (unsent.length > 0) {
			groups.push({
				label: 'Nicht versendet',
				items: unsent,
				netto: unsent.reduce((s, r) => s + (r.netto_cents ?? 0), 0),
				mwst: unsent.reduce((s, r) => s + (r.mwst_cents ?? 0), 0),
				brutto: unsent.reduce((s, r) => s + (r.brutto_cents ?? 0), 0),
				offen: unsent.reduce((s, r) => s + (r.offene_zahlungen_cents ?? 0), 0)
			});
		}
		return groups;
	});

	let totalNetto = $derived(monthGroups.reduce((s, g) => s + g.netto, 0));
	let totalMwst = $derived(monthGroups.reduce((s, g) => s + g.mwst, 0));
	let totalBrutto = $derived(monthGroups.reduce((s, g) => s + g.brutto, 0));
	let totalOffen = $derived(monthGroups.reduce((s, g) => s + g.offen, 0));

	$effect(() => { load(); });
</script>

<div class="page">
	<div class="page-header">
		<h1>Rechnungsausgangsbuch</h1>
		<span class="page-count">{rows.length} Eintr&auml;ge</span>
	</div>

	{#if loading}
		<div class="loading">Lade Rechnungsausgangsbuch...</div>
	{:else if error}
		<div class="error-box">{error}</div>
	{:else if rows.length === 0}
		<div class="empty">Keine Rechnungen vorhanden.</div>
	{:else}
		{#each monthGroups as group}
			<div class="month-section">
				<h2 class="month-heading">{group.label}</h2>
				<div class="table-wrapper">
					<table>
						<thead>
							<tr>
								<th>Rg.-Nummer</th>
								<th>Datum</th>
								<th>Kunde</th>
								<th class="num">Netto</th>
								<th class="num">MWST</th>
								<th class="num">Brutto</th>
								<th>Versendet</th>
								<th>F&auml;llig</th>
								<th>Bezahlt am</th>
								<th class="num">Offen</th>
								<th>Zahlungsart</th>
								<th>Bemerkungen</th>
							</tr>
						</thead>
						<tbody>
							{#each group.items as item, i}
								<tr class:paid={item.paid_at != null}>
									<td class="mono">{item.invoice_number}</td>
									<td>{fmtDate(item.scheduled_date)}</td>
									<td>{item.customer_name || '\u2014'}</td>
									<td class="num">{fmtEur(item.netto_cents)}</td>
									<td class="num">{fmtEur(item.mwst_cents)}</td>
									<td class="num">{fmtEur(item.brutto_cents)}</td>
									<td>{fmtDate(item.sent_at)}</td>
									<td>{fmtDate(item.due_date)}</td>
									<td>{fmtDate(item.paid_at)}</td>
									<td class="num offen">{fmtEur(item.offene_zahlungen_cents)}</td>
									<td>{item.payment_method || '\u2014'}</td>
									<td class="notes-cell">{item.notes || ''}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr>
								<th colspan="3">Summe {group.label}</th>
								<th class="num">{fmtEur(group.netto)}</th>
								<th class="num">{fmtEur(group.mwst)}</th>
								<th class="num">{fmtEur(group.brutto)}</th>
								<th colspan="3"></th>
								<th class="num">{fmtEur(group.offen)}</th>
								<th colspan="2"></th>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>
		{/each}

		<div class="grand-total">
			<span>Gesamtsumme</span>
			<span class="num">{fmtEur(totalNetto)}</span>
			<span class="num">{fmtEur(totalMwst)}</span>
			<span class="num">{fmtEur(totalBrutto)}</span>
			<span class="spacer"></span>
			<span class="num">{fmtEur(totalOffen)}</span>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--dt-space-6);
	}

	.page-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: var(--dt-space-6);
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		margin: 0;
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.loading {
		color: var(--dt-on-surface-variant);
		padding: var(--dt-space-10);
		text-align: center;
	}

	.error-box {
		background: var(--dt-error-bg);
		border: 1px solid var(--dt-error-text);
		color: var(--dt-error-text);
		padding: var(--dt-space-4);
		border-radius: var(--dt-radius-md);
	}

	.empty {
		padding: var(--dt-space-10);
		text-align: center;
		color: var(--dt-on-surface-variant);
	}

	/* ── Month sections ─────────────────────────────── */
	.month-section {
		margin-bottom: var(--dt-space-8);
	}

	.month-heading {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--dt-primary);
		margin: 0 0 var(--dt-space-3) 0;
		padding: var(--dt-space-3) var(--dt-space-4);
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-md);
	}

	/* ── Table ──────────────────────────────────────── */
	.table-wrapper {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead {
		background: var(--dt-surface-container-high);
	}

	th {
		padding: 8px var(--dt-space-4);
		text-align: left;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	th.num {
		text-align: right;
	}

	td {
		padding: 8px var(--dt-space-4);
		color: var(--dt-on-surface);
		white-space: nowrap;
	}

	td.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	tbody tr:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	tbody tr:nth-child(odd) {
		background: var(--dt-surface-container-lowest);
	}

	tbody tr:hover {
		background: var(--dt-surface-container-high) !important;
	}

	tbody tr.paid td {
		color: var(--dt-on-surface-variant);
	}

	tbody tr.paid td.offen {
		color: var(--admin-success);
	}

	td.offen {
		font-weight: 600;
		color: var(--dt-secondary);
	}

	.mono {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}

	.notes-cell {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	tfoot {
		background: var(--dt-surface-container-high);
	}

	tfoot th {
		padding: 10px var(--dt-space-4);
		font-weight: 600;
		color: var(--dt-on-surface);
		border-top: 2px solid var(--dt-outline-variant);
	}

	tfoot th.num {
		text-align: right;
	}

	/* ── Grand total ────────────────────────────────── */
	.grand-total {
		display: grid;
		grid-template-columns: 1fr repeat(4, 120px);
		gap: var(--dt-space-4);
		align-items: center;
		padding: var(--dt-space-4) var(--dt-space-6);
		background: var(--dt-primary);
		color: var(--dt-on-primary);
		border-radius: var(--dt-radius-lg);
		font-weight: 700;
		font-size: 1rem;
		margin-top: var(--dt-space-4);
	}

	.grand-total .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.grand-total .spacer {
		/* skip the middle columns (sent, due, paid) to align "offen" */
		grid-column: span 3;
	}
</style>
