<script lang="ts">
	import { onMount } from 'svelte';
	import { apiGet } from '$lib/utils/api.svelte';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface RechnungsausgangItem {
		id: string;
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
	}

	interface MonthGroup {
		key: string;
		label: string;
		items: RechnungsausgangItem[];
		netto: number;
		mwst: number;
		brutto: number;
		offen: number;
	}

	let rows = $state<RechnungsausgangItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeIndex = $state(0);

	function groupByMonth(list: RechnungsausgangItem[]): MonthGroup[] {
		const map = new Map<string, RechnungsausgangItem[]>();
		for (const item of list) {
			const d = item.sent_at ?? item.created_at;
			const m = d.substring(0, 7);
			if (!map.has(m)) map.set(m, []);
			map.get(m)!.push(item);
		}
		return [...map.keys()].sort().map(m => {
			const items = map.get(m)!;
			const [y, mo] = m.split('-');
			const label = new Date(+y, +mo - 1).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
			return {
				key: m, label, items,
				netto: items.reduce((s, r) => s + (r.netto_cents ?? 0), 0),
				mwst: items.reduce((s, r) => s + (r.mwst_cents ?? 0), 0),
				brutto: items.reduce((s, r) => s + (r.brutto_cents ?? 0), 0),
				offen: items.reduce((s, r) => s + (r.offene_zahlungen_cents ?? 0), 0)
			};
		});
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const data = await apiGet<RechnungsausgangItem[]>('/api/v1/admin/rechnungsausgangsbuch');
			rows = data;
			const groups = groupByMonth(data);
			activeIndex = Math.max(0, groups.length - 1);
		} catch (e: any) {
			error = e?.message || 'Ladefehler';
			rows = [];
			activeIndex = 0;
		} finally {
			loading = false;
		}
	}

	onMount(() => { load(); });

	let monthGroups = $derived(groupByMonth(rows));

	function prevMonth() {
		console.log('prev clicked, before:', activeIndex);
		activeIndex = Math.max(0, activeIndex - 1);
		console.log('prev clicked, after:', activeIndex);
	}

	function nextMonth() {
		console.log('next clicked, before:', activeIndex);
		activeIndex = Math.min(monthGroups.length - 1, activeIndex + 1);
		console.log('next clicked, after:', activeIndex);
	}

	let active = $derived(monthGroups[activeIndex]);

	let totalNetto = $derived(monthGroups.reduce((s, g) => s + g.netto, 0));
	let totalMwst  = $derived(monthGroups.reduce((s, g) => s + g.mwst, 0));
	let totalBrutto = $derived(monthGroups.reduce((s, g) => s + g.brutto, 0));
	let totalOffen = $derived(monthGroups.reduce((s, g) => s + g.offen, 0));

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
		<!-- Month navigator -->
		<div class="month-nav">
			<button type="button" class="nav-btn" class:dimmed={activeIndex === 0} onclick={prevMonth}>
				<ChevronLeft size={18} />
			</button>

			<div class="month-label">
				<select
					class="month-select"
					value={active?.key ?? ''}
					onchange={(e) => {
						const idx = monthGroups.findIndex(g => g.key === e.currentTarget.value);
						if (idx !== -1) activeIndex = idx;
					}}
				>
					{#each monthGroups as g}
						<option value={g.key}>{g.label} ({g.items.length})</option>
					{/each}
				</select>
			</div>

			<button type="button" class="nav-btn" class:dimmed={activeIndex >= monthGroups.length - 1} onclick={nextMonth}>
				<ChevronRight size={18} />
			</button>
		</div>

		<!-- Active month table -->
		{#if active}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Rg-Nr.</th>
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
						{#each active.items as item}
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
							<th colspan="3">Summe {active.label}</th>
							<th class="num">{fmtEur(active.netto)}</th>
							<th class="num">{fmtEur(active.mwst)}</th>
							<th class="num">{fmtEur(active.brutto)}</th>
							<th colspan="3"></th>
							<th class="num">{fmtEur(active.offen)}</th>
							<th colspan="2"></th>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}

		<!-- Year grand total -->
		<div class="grand-total">
			<span>Gesamtsumme (Jahr)</span>
			<span class="num">{fmtEur(totalNetto)}</span>
			<span class="num">{fmtEur(totalMwst)}</span>
			<span class="num">{fmtEur(totalBrutto)}</span>
			<span class="spacer"></span>
			<span class="num">{fmtEur(totalOffen)}</span>
		</div>
	{/if}
</div>

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

	/* ── month navigation ──────────────────────────── */
	.month-nav {
		display: flex; flex-direction: row; align-items: center; justify-content: center;
		gap: var(--dt-space-3); margin-bottom: var(--dt-space-4); flex-wrap: nowrap;
	}
	.nav-btn {
		flex: 0 0 auto; width: 36px; height: 36px; border-radius: var(--dt-radius-md);
		color: var(--dt-on-surface); background: var(--dt-surface-container-low);
		border: var(--dt-ghost-border); cursor: pointer; font-size: 16px; line-height: 1;
		transition: background var(--dt-transition);
	}
	.nav-btn:hover { background: var(--dt-surface-container-high); }
	.nav-btn.dimmed { opacity: 0.35; }

	.month-label {
		flex: 0 0 auto; display: flex; align-items: center; justify-content: center;
	}
	.month-select {
		appearance: none; -webkit-appearance: none;
		background-color: var(--dt-surface-container-low); color: var(--dt-on-surface);
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-md);
		padding: 0.5rem 2rem 0.5rem var(--dt-space-4);
		font-size: 1rem; font-weight: 600; cursor: pointer;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23191c1e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat; background-position: right 0.75rem center;
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
	.notes-cell { max-width: 200px; overflow: hidden; text-overflow: ellipsis; }

	tfoot { background: var(--dt-surface-container-high); }
	tfoot th {
		padding: 10px var(--dt-space-4); font-weight: 600; color: var(--dt-on-surface);
		border-top: 2px solid var(--dt-outline-variant);
	}
	tfoot th.num { text-align: right; }

	/* ── grand total ──────────────────────────────── */
	.grand-total {
		display: grid; grid-template-columns: 1fr repeat(4, 120px); gap: var(--dt-space-4);
		align-items: center; padding: var(--dt-space-4) var(--dt-space-6);
		background: var(--dt-primary); color: var(--dt-on-primary);
		border-radius: var(--dt-radius-lg); font-weight: 700; font-size: 1rem; margin-top: var(--dt-space-4);
	}
	.grand-total .num { text-align: right; font-variant-numeric: tabular-nums; }
	.grand-total .spacer { grid-column: span 3; }
</style>
