<script lang="ts">
	/**
	 * KVA-Buch — the Kostenvoranschlag counterpart to the Rechnungsausgangsbuch.
	 *
	 * Requested in feedback report fa436f07 ("same as the Rechnungsausgangsbuch,
	 * just for KVAs"), so the layout deliberately mirrors that page: year selector,
	 * month navigator, monthly subtotal, yearly grand total. The extra column here
	 * is Status, because unlike an invoice a KVA can still be rejected or expire.
	 */
	import { onMount } from 'svelte';
	import { apiGet, apiPreview } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { ChevronLeft, ChevronRight, FileText } from 'lucide-svelte';

	interface KvaBuchItem {
		id: string;
		inquiry_id: string;
		offer_number: string | null;
		customer_name: string | null;
		scheduled_date: string | null;
		netto_cents: number;
		mwst_cents: number;
		brutto_cents: number;
		/** "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" */
		status: string;
		valid_until: string | null;
		sent_at: string | null;
		created_at: string;
		/** Set once the KVA turned into a job. */
		invoice_number: string | null;
		pdf_s3_key: string | null;
	}

	interface MonthGroup {
		key: string;
		label: string;
		items: KvaBuchItem[];
		netto: number;
		mwst: number;
		brutto: number;
		/** Netto sum of the KVAs that actually became jobs. */
		angenommen: number;
		/** Brutto of the drafts — shown, but never counted, as in the invoice register. */
		entwurf: number;
	}

	/**
	 * A KVA that was never handed to the customer. The pipeline drafts an offer for
	 * essentially every inquiry, so counting drafts would inflate the totals — and the
	 * Rechnungsausgangsbuch one menu entry away excludes exactly this class, so the two
	 * registers must not disagree.
	 */
	function isDraft(item: KvaBuchItem): boolean {
		return item.sent_at == null && item.status === 'draft';
	}

	const STATUS_LABELS: Record<string, string> = {
		draft: 'Entwurf',
		sent: 'Versendet',
		viewed: 'Angesehen',
		accepted: 'Angenommen',
		rejected: 'Abgelehnt',
		expired: 'Abgelaufen'
	};

	let rows = $state<KvaBuchItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeYear = $state<string>('');
	let activeIndex = $state(0);

	/** The year a KVA belongs to: its KVA-Datum, falling back to creation. */
	function yearOf(item: KvaBuchItem): string {
		return (item.sent_at ?? item.created_at).substring(0, 4);
	}

	function groupByMonth(list: KvaBuchItem[]): MonthGroup[] {
		const map = new Map<string, KvaBuchItem[]>();
		for (const item of list) {
			const m = (item.sent_at ?? item.created_at).substring(0, 7);
			if (!map.has(m)) map.set(m, []);
			map.get(m)!.push(item);
		}
		return [...map.keys()].sort().map(m => {
			const items = map.get(m)!;
			const [y, mo] = m.split('-');
			const label = new Date(+y, +mo - 1).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' });
			const issued = items.filter(r => !isDraft(r));
			return {
				key: m, label, items,
				netto: issued.reduce((s, r) => s + r.netto_cents, 0),
				mwst: issued.reduce((s, r) => s + r.mwst_cents, 0),
				brutto: issued.reduce((s, r) => s + r.brutto_cents, 0),
				angenommen: issued.reduce((s, r) => s + (r.invoice_number ? r.netto_cents : 0), 0),
				entwurf: items.filter(isDraft).reduce((s, r) => s + r.brutto_cents, 0)
			};
		});
	}

	async function load() {
		loading = true;
		error = null;
		try {
			const data = await apiGet<KvaBuchItem[]>('/api/v1/admin/kva-buch');
			rows = data;
			const ys = [...new Set(data.map(yearOf))].sort();
			activeYear = ys.at(-1) ?? String(new Date().getFullYear());
			activeIndex = Math.max(0, groupByMonth(data.filter(r => yearOf(r) === activeYear)).length - 1);
		} catch (e: any) {
			error = e?.message || 'Ladefehler';
			rows = [];
			activeIndex = 0;
		} finally {
			loading = false;
		}
	}

	onMount(() => { load(); });

	let years = $derived([...new Set(rows.map(yearOf))].sort());
	let monthGroups = $derived(groupByMonth(rows.filter(r => yearOf(r) === activeYear)));
	let active = $derived(monthGroups[Math.min(activeIndex, Math.max(0, monthGroups.length - 1))]);

	let totalNetto = $derived(monthGroups.reduce((s, g) => s + g.netto, 0));
	let totalMwst = $derived(monthGroups.reduce((s, g) => s + g.mwst, 0));
	let totalBrutto = $derived(monthGroups.reduce((s, g) => s + g.brutto, 0));
	let totalAngenommen = $derived(monthGroups.reduce((s, g) => s + g.angenommen, 0));
	let totalEntwurf = $derived(monthGroups.reduce((s, g) => s + g.entwurf, 0));

	function selectYear(y: string) {
		activeYear = y;
		activeIndex = Math.max(0, groupByMonth(rows.filter(r => yearOf(r) === y)).length - 1);
	}

	function prevMonth() { activeIndex = Math.max(0, activeIndex - 1); }
	function nextMonth() { activeIndex = Math.min(monthGroups.length - 1, activeIndex + 1); }

	function fmtEur(cents: number | null): string {
		if (cents == null) return '—';
		return (cents / 100).toLocaleString('de-DE', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}) + ' €';
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit', month: '2-digit', year: 'numeric'
		});
	}

	/** Opens the KVA document for a row. */
	async function openKvaPdf(item: KvaBuchItem) {
		try {
			await apiPreview(`/api/v1/admin/kva-buch/${item.id}/pdf`);
		} catch (e: any) {
			showToast(e?.message || 'PDF konnte nicht geöffnet werden', 'error');
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>KVA-Buch</h1>
		<span class="page-count">{rows.length} Kostenvoranschl&auml;ge</span>
	</div>

	{#if loading}
		<div class="loading">Lade KVA-Buch...</div>
	{:else if error}
		<div class="error-box">{error}</div>
	{:else if rows.length === 0}
		<div class="empty">Keine Kostenvoranschl&auml;ge vorhanden.</div>
	{:else}
		<div class="year-nav">
			{#each years as y}
				<button type="button" class="year-btn" class:active={y === activeYear} onclick={() => selectYear(y)}>
					{y}
				</button>
			{/each}
		</div>

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

		{#if active}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>KVA-Nr.</th>
							<th>KVA-Datum</th>
							<th>Kunde</th>
							<th>Leistungsdatum</th>
							<th class="num">Netto</th>
							<th class="num">MWST</th>
							<th class="num">Brutto</th>
							<th>G&uuml;ltig bis</th>
							<th>Status</th>
							<th>Rechnung</th>
						</tr>
					</thead>
					<tbody>
						{#each active.items as item}
							<tr
								class:won={item.invoice_number != null}
								class:lost={item.status === 'rejected' || item.status === 'expired'}
								class:draft={isDraft(item)}
							>
								<td class="mono">
									{#if item.pdf_s3_key}
										<button type="button" class="link-btn" onclick={() => openKvaPdf(item)} title="KVA öffnen">
											<FileText size={12} />
											{item.offer_number || '—'}
										</button>
									{:else}
										{item.offer_number || '—'}
									{/if}
								</td>
								<td>{fmtDate(item.sent_at ?? item.created_at)}</td>
								<td>
									<a class="row-link" href="/admin/inquiries/{item.inquiry_id}">
										{item.customer_name || '—'}
									</a>
								</td>
								<td>{fmtDate(item.scheduled_date)}</td>
								<td class="num">{fmtEur(item.netto_cents)}</td>
								<td class="num">{fmtEur(item.mwst_cents)}</td>
								<td class="num">{fmtEur(item.brutto_cents)}</td>
								<td>{fmtDate(item.valid_until)}</td>
								<td><span class="status status--{item.status}">{STATUS_LABELS[item.status] ?? item.status}</span></td>
								<td class="mono">{item.invoice_number || '—'}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th colspan="4">Summe {active.label}</th>
							<th class="num">{fmtEur(active.netto)}</th>
							<th class="num">{fmtEur(active.mwst)}</th>
							<th class="num">{fmtEur(active.brutto)}</th>
							<th colspan="3"></th>
						</tr>
						{#if active.entwurf !== 0}
							<tr class="foot-note">
								<td colspan="10">
									Nicht gez&auml;hlt: {fmtEur(active.entwurf)} aus KVA-Entw&uuml;rfen,
									die nie versendet wurden.
								</td>
							</tr>
						{/if}
					</tfoot>
				</table>
			</div>
		{/if}

		<div class="grand-total">
			<span class="grand-total__label">Gesamtsumme {activeYear}</span>
			<span class="num" data-label="Netto">{fmtEur(totalNetto)}</span>
			<span class="num" data-label="MWST">{fmtEur(totalMwst)}</span>
			<span class="num" data-label="Brutto">{fmtEur(totalBrutto)}</span>
			<span class="num" data-label="Davon beauftragt">{fmtEur(totalAngenommen)}</span>
		</div>

		{#if totalEntwurf !== 0}
			<p class="draft-note">
				Zus&auml;tzlich {fmtEur(totalEntwurf)} in nie versendeten KVA-Entw&uuml;rfen —
				diese z&auml;hlen nicht zu den Summen.
			</p>
		{/if}
	{/if}
</div>

<style>
	.page { padding: var(--dt-space-6); }

	.page-header {
		display: flex; align-items: baseline; gap: 0.75rem;
		margin-bottom: var(--dt-space-6);
	}
	.page-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--dt-on-surface); margin: 0; }
	.page-count { font-size: 0.8125rem; color: var(--dt-on-surface-variant); }

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
	.year-btn.active { background: var(--dt-primary); color: var(--dt-on-primary); border-color: transparent; }

	/* ── month navigation ──────────────────────────── */
	.month-nav {
		display: flex; align-items: center; justify-content: center;
		gap: var(--dt-space-3); margin-bottom: var(--dt-space-4);
	}
	.nav-btn {
		flex: 0 0 auto; width: 36px; height: 36px; border-radius: var(--dt-radius-md);
		color: var(--dt-on-surface); background: var(--dt-surface-container-low);
		border: var(--dt-ghost-border); cursor: pointer; line-height: 1;
		transition: background var(--dt-transition);
	}
	.nav-btn:hover { background: var(--dt-surface-container-high); }
	.nav-btn.dimmed { opacity: 0.35; }

	.month-label { display: flex; align-items: center; justify-content: center; }
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
	td { padding: 8px var(--dt-space-4); color: var(--dt-on-surface); white-space: nowrap; }
	td.num { text-align: right; font-variant-numeric: tabular-nums; }
	tbody tr:nth-child(even) { background: var(--dt-surface-container-low); }
	tbody tr:nth-child(odd)  { background: var(--dt-surface-container-lowest); }
	tbody tr:hover { background: var(--dt-surface-container-high) !important; }
	tbody tr.lost td { opacity: 0.65; }
	tbody tr.draft td { opacity: 0.7; }

	.mono { font-family: var(--font-mono); font-size: 0.75rem; }

	.link-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0; border: none; background: none; cursor: pointer;
		font-family: var(--font-mono); font-size: 0.75rem;
		color: var(--dt-primary); text-decoration: underline;
	}
	.link-btn:hover { opacity: 0.75; }
	.row-link { color: var(--dt-on-surface); text-decoration: underline; }
	.row-link:hover { color: var(--dt-primary); }

	.status {
		padding: 1px 8px; border-radius: var(--dt-radius-sm);
		font-size: 0.6875rem; font-weight: 600; white-space: nowrap;
		background: var(--dt-surface-container-high); color: var(--dt-on-surface-variant);
	}
	.status--accepted { color: var(--admin-success, #2e7d32); }
	.status--rejected, .status--expired { color: var(--dt-error-text, #b3261e); }

	tfoot { background: var(--dt-surface-container-high); }
	tfoot th {
		padding: 10px var(--dt-space-4); font-weight: 600; color: var(--dt-on-surface);
		border-top: 2px solid var(--dt-outline-variant);
	}
	tfoot th.num { text-align: right; }
	tfoot tr.foot-note td {
		padding: 6px var(--dt-space-4);
		font-size: 0.75rem; font-weight: 400;
		color: var(--dt-on-surface-variant);
	}

	.draft-note {
		margin: var(--dt-space-2) 0 0;
		font-size: 0.8125rem; color: var(--dt-on-surface-variant);
	}

	/* ── grand total ──────────────────────────────── */
	.grand-total {
		display: grid; grid-template-columns: 1fr repeat(4, 140px); gap: var(--dt-space-4);
		align-items: center; padding: var(--dt-space-4) var(--dt-space-6);
		background: var(--dt-primary); color: var(--dt-on-primary);
		border-radius: var(--dt-radius-lg); font-weight: 700; font-size: 1rem;
		margin-top: var(--dt-space-4);
	}
	.grand-total .num { text-align: right; font-variant-numeric: tabular-nums; }

	@media (max-width: 768px) {
		.page { padding: var(--dt-space-4); }
		.year-btn, .nav-btn, .month-select { min-height: 44px; }

		/* Fixed 5-column grid overflows narrow viewports — wrap with inline labels. */
		.grand-total { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; }
		.grand-total__label { flex-basis: 100%; }
		.grand-total .num::before {
			content: attr(data-label) ': ';
			font-weight: 400; opacity: 0.85;
		}
	}
</style>
