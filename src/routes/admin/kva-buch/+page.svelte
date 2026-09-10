<script lang="ts">
	/**
	 * KVA-Buch — the Kostenvoranschlag counterpart to the Rechnungsausgangsbuch.
	 *
	 * Requested in feedback report fa436f07 ("same as the Rechnungsausgangsbuch,
	 * just for KVAs"), so the register keeps that page's shape: year selector,
	 * monthly overview, sortable table, filters, export.
	 *
	 * Where it deliberately differs: an invoice register is a legal ledger, a KVA
	 * register is a sales instrument. So this page leads with the Nachfassliste —
	 * the KVAs worth a phone call today — and its statistics are about winning work,
	 * not about reporting revenue.
	 *
	 * NOTE on status: `offers.status` is NOT maintained (126 of 133 production rows
	 * sit at "draft" while a third of them already produced an invoice), so nothing
	 * here reads it. The backend derives `lage` from `inquiries.status`, which is
	 * maintained, and that is the only win/loss signal used.
	 */
	import { onMount } from 'svelte';
	import { apiGet, apiPatch, apiPut, apiPreview } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { formatEuro } from '$lib/utils/format';
	import KvaMonatsUebersicht from '$lib/components/admin/KvaMonatsUebersicht.svelte';
	import {
		type KvaRow, type KvaFilters, type KvaSortKey, type KvaSortState, type LageFilter,
		LAGE_LABELS, NO_FILTERS, availableYears, rowsForYear, kvaKpis, monthlySummaries,
		followupRows, dateMissingRows, staleRows, viewRows, hasActiveFilters, kvaDate
	} from '$lib/utils/kvaBuch';
	import {
		FileText, Search, X, ArrowUpDown, ArrowUp, ArrowDown, BellOff, Bell, Phone
	} from 'lucide-svelte';

	let rows = $state<KvaRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let activeYear = $state<string>('');
	let filters = $state<KvaFilters>({ ...NO_FILTERS });
	let sort = $state<KvaSortState | null>(null);
	let followupDays = $state(6);
	let savingDays = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			rows = await apiGet<KvaRow[]>('/api/v1/admin/kva-buch');
			const ys = availableYears(rows);
			if (!ys.includes(activeYear)) {
				activeYear = ys.at(-1) ?? String(new Date().getFullYear());
			}
		} catch (e: any) {
			error = e?.message || 'Ladefehler';
			rows = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => { load(); });

	let years = $derived(availableYears(rows));
	let yearRows = $derived(rowsForYear(rows, activeYear));
	let kpis = $derived(kvaKpis(yearRows));
	let months = $derived(monthlySummaries(yearRows));
	let visible = $derived(viewRows(yearRows, filters, sort));

	/* The Nachfassliste is deliberately NOT year-scoped: a KVA from last December
	   whose move is next month still deserves the call. */
	let chase = $derived(followupRows(rows));
	let missingDate = $derived(dateMissingRows(rows));
	let stale = $derived(staleRows(rows));

	function selectYear(y: string) {
		activeYear = y;
		filters = { ...NO_FILTERS };
		sort = null;
	}

	/** asc → desc → back to register order. */
	function toggleSort(key: KvaSortKey) {
		if (sort?.key !== key) sort = { key, dir: 'asc' };
		else if (sort.dir === 'asc') sort = { key, dir: 'desc' };
		else sort = null;
	}

	function sortIcon(key: KvaSortKey) {
		if (sort?.key !== key) return ArrowUpDown;
		return sort.dir === 'asc' ? ArrowUp : ArrowDown;
	}

	function setLage(lage: LageFilter) {
		filters = { ...filters, lage };
	}

	function setMonth(month: number | null) {
		filters = { ...filters, month };
	}

	function clearFilters() {
		filters = { ...NO_FILTERS };
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('de-DE', {
			day: '2-digit', month: '2-digit', year: 'numeric'
		});
	}

	function pct(value: number | null): string {
		if (value == null) return '—';
		return `${(value * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
	}

	async function openKvaPdf(item: KvaRow) {
		try {
			await apiPreview(`/api/v1/admin/kva-buch/${item.id}/pdf`);
		} catch (e: any) {
			showToast(e?.message || 'PDF konnte nicht geöffnet werden', 'error');
		}
	}

	async function toggleMute(item: KvaRow) {
		const next = !item.followup_muted;
		try {
			await apiPatch(`/api/v1/admin/kva-buch/${item.id}/followup-mute`, { muted: next });
			showToast(next ? 'KVA von der Nachfassliste genommen' : 'KVA wieder auf der Nachfassliste', 'success');
			await load();
		} catch (e: any) {
			showToast(e?.message || 'Konnte nicht gespeichert werden', 'error');
		}
	}

	async function saveFollowupDays() {
		if (savingDays) return;
		const days = Math.round(followupDays);
		if (!Number.isFinite(days) || days < 1 || days > 365) {
			showToast('Bitte 1 bis 365 Tage angeben.', 'error');
			return;
		}
		savingDays = true;
		try {
			await apiPut('/api/v1/admin/kva-buch/followup-days', { days });
			showToast(`Nachfass-Frist auf ${days} Tage gesetzt`, 'success');
			await load();
		} catch (e: any) {
			showToast(e?.message || 'Konnte nicht gespeichert werden', 'error');
		} finally {
			savingDays = false;
		}
	}

	function exportYear() {
		window.open(
			`/api/v1/admin/kva-buch/export?year=${encodeURIComponent(activeYear)}`,
			'_blank'
		);
	}

	const COLUMNS: { key: KvaSortKey; label: string; num?: boolean }[] = [
		{ key: 'number', label: 'KVA-Nr.' },
		{ key: 'date', label: 'KVA-Datum' },
		{ key: 'customer', label: 'Kunde' },
		{ key: 'service', label: 'Umzugsdatum' },
		{ key: 'netto', label: 'Netto', num: true },
		{ key: 'brutto', label: 'Brutto', num: true },
		{ key: 'age', label: 'Alter', num: true },
		{ key: 'lage', label: 'Lage' }
	];

	const LAGE_FILTERS: { key: LageFilter; label: string }[] = [
		{ key: 'alle', label: 'Alle' },
		{ key: 'offen', label: 'Offen' },
		{ key: 'gewonnen', label: 'Gewonnen' },
		{ key: 'verloren', label: 'Verloren' },
		{ key: 'nachfassen', label: 'Nachfassen' }
	];
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
		<!-- ── Nachfassliste ───────────────────────────────────────────────
		     First on the page because it is the only part that earns money.
		     Not year-scoped: an old KVA with a future move date still counts. -->
		<section class="chase" class:chase--empty={chase.length === 0}>
			<header class="chase-head">
				<div>
					<h2><Phone size={16} /> Nachfassen</h2>
					<p class="chase-sub">
						Offene KVAs, die l&auml;nger als {followupDays} Tage ohne Antwort sind
						<strong>und</strong> deren Umzugstermin noch bevorsteht. Genau diese
						meldet auch der Telegram-Bot.
					</p>
				</div>
				<label class="days-field">
					<span>Frist</span>
					<input
						type="number" min="1" max="365" bind:value={followupDays}
						onblur={saveFollowupDays} disabled={savingDays}
					/>
					<span>Tage</span>
				</label>
			</header>

			{#if chase.length === 0}
				<p class="chase-none">Nichts nachzufassen — alle offenen KVAs sind aktuell.</p>
			{:else}
				<ul class="chase-list">
					{#each chase as item}
						<li>
							<a class="chase-nr" href="/admin/inquiries/{item.inquiry_id ?? ''}">
								{item.offer_number || '—'}
							</a>
							<span class="chase-name">{item.customer_name || '—'}</span>
							<span class="chase-num">{formatEuro(item.netto_cents)}</span>
							<span class="chase-meta">
								{item.age_days} Tage still &middot; Umzug {fmtDate(item.scheduled_date)}
							</span>
							{#if item.followup_last_pinged_on}
								<span class="chase-pinged">
									zuletzt erinnert {fmtDate(item.followup_last_pinged_on)}
								</span>
							{/if}
							<button
								type="button" class="mute-btn" onclick={() => toggleMute(item)}
								title="Nicht mehr an diesen KVA erinnern"
							>
								<BellOff size={13} /> Stumm
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			{#if missingDate.length > 0}
				<details class="side-list">
					<summary>
						{missingDate.length} &uuml;berf&auml;llige KVAs ohne Umzugsdatum
					</summary>
					<!-- Not pinged by design: without a move date there is no way to tell
					     whether the job is still live. They stay visible here instead. -->
					<p class="side-note">
						Diese werden nicht automatisch gemeldet — ohne Termin l&auml;sst sich nicht
						sagen, ob der Auftrag noch aktuell ist.
					</p>
					<ul>
						{#each missingDate as item}
							<li>
								<span class="chase-nr">{item.offer_number || '—'}</span>
								<span class="chase-name">{item.customer_name || '—'}</span>
								<span class="chase-num">{formatEuro(item.netto_cents)}</span>
								<span class="chase-meta">{item.age_days} Tage still</span>
							</li>
						{/each}
					</ul>
				</details>
			{/if}

			{#if stale.length > 0}
				<details class="side-list">
					<summary>
						{stale.length} offene KVAs mit vergangenem Umzugsdatum
						({formatEuro(kpis.deadOpenNetto)})
					</summary>
					<!-- These inflate "Offen" without being winnable. Surfaced as a cleanup
					     queue so the open pipeline figure can be read honestly. -->
					<p class="side-note">
						Der Termin ist vorbei — diese lassen sich nicht mehr gewinnen und sollten
						auf gewonnen oder verloren gesetzt werden.
					</p>
					<ul>
						{#each stale as item}
							<li>
								<span class="chase-nr">{item.offer_number || '—'}</span>
								<span class="chase-name">{item.customer_name || '—'}</span>
								<span class="chase-num">{formatEuro(item.netto_cents)}</span>
								<span class="chase-meta">Umzug war {fmtDate(item.scheduled_date)}</span>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</section>

		<div class="year-nav">
			{#each years as y}
				<button
					type="button" class="year-btn" class:active={y === activeYear}
					onclick={() => selectYear(y)}
				>{y}</button>
			{/each}
			<button type="button" class="export-btn" onclick={exportYear}>
				Excel-Export {activeYear}
			</button>
		</div>

		<!-- ── KPIs ─────────────────────────────────────────────────────── -->
		<div class="kpis">
			<div class="kpi">
				<span class="kpi-label">Angebotsvolumen</span>
				<span class="kpi-value">{formatEuro(kpis.volumeNetto)}</span>
				<span class="kpi-note">{kpis.count} KVAs netto</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">Gewonnen</span>
				<span class="kpi-value">{formatEuro(kpis.wonNetto)}</span>
				<span class="kpi-note">{kpis.wonCount} Auftr&auml;ge</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">Annahmequote</span>
				<span class="kpi-value">{pct(kpis.winRateByCount)}</span>
				<!-- Both rates, always: they diverge when won and lost jobs differ in
				     size, and that gap is the interesting number. -->
				<span class="kpi-note">nach Wert {pct(kpis.winRateByValue)}</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">Offen</span>
				<span class="kpi-value">{formatEuro(kpis.liveOpenNetto)}</span>
				<span class="kpi-note">
					{#if kpis.deadOpenCount > 0}
						+ {formatEuro(kpis.deadOpenNetto)} Termin vorbei
					{:else}
						{kpis.openCount} KVAs
					{/if}
				</span>
			</div>
			<div class="kpi" class:kpi--alert={kpis.followupCount > 0}>
				<span class="kpi-label">Nachfassen</span>
				<span class="kpi-value">{kpis.followupCount}</span>
				<span class="kpi-note">{formatEuro(kpis.followupNetto)}</span>
			</div>
			<div class="kpi">
				<span class="kpi-label">&Oslash; Auftragswert</span>
				<span class="kpi-value">
					{kpis.avgWonNetto == null ? '—' : formatEuro(kpis.avgWonNetto)}
				</span>
				<!-- A systematically higher average on lost KVAs is a pricing signal. -->
				<span class="kpi-note">
					verloren {kpis.avgLostNetto == null ? '—' : formatEuro(kpis.avgLostNetto)}
				</span>
			</div>
		</div>

		<KvaMonatsUebersicht {months} selected={filters.month} onSelect={setMonth} />

		<!-- ── filter bar ───────────────────────────────────────────────── -->
		<div class="filter-bar">
			<div class="chips">
				{#each LAGE_FILTERS as f}
					<button
						type="button" class="chip" class:active={filters.lage === f.key}
						onclick={() => setLage(f.key)}
					>{f.label}</button>
				{/each}
			</div>
			<label class="search">
				<Search size={14} />
				<input
					type="search" placeholder="Nr., Kunde oder Rechnung…"
					value={filters.search}
					oninput={(e) => (filters = { ...filters, search: e.currentTarget.value })}
				/>
			</label>
			{#if hasActiveFilters(filters)}
				<button type="button" class="clear-btn" onclick={clearFilters}>
					<X size={14} /> Filter zur&uuml;cksetzen
				</button>
			{/if}
			<span class="result-count">{visible.length} von {yearRows.length}</span>
		</div>

		<!-- ── register table ───────────────────────────────────────────── -->
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						{#each COLUMNS as col}
							{@const Icon = sortIcon(col.key)}
							<th class:num={col.num}>
								<button type="button" class="sort-btn" onclick={() => toggleSort(col.key)}>
									{col.label}<Icon size={12} />
								</button>
							</th>
						{/each}
						<th>Rechnung</th>
					</tr>
				</thead>
				<tbody>
					{#each visible as item}
						<tr class:won={item.lage === 'gewonnen'} class:lost={item.lage === 'verloren'}>
							<td class="mono">
								{#if item.pdf_s3_key}
									<button
										type="button" class="link-btn" onclick={() => openKvaPdf(item)}
										title="KVA öffnen"
									>
										<FileText size={12} />{item.offer_number || '—'}
									</button>
								{:else}
									{item.offer_number || '—'}
								{/if}
							</td>
							<td>{fmtDate(kvaDate(item))}</td>
							<td>
								<a class="row-link" href="/admin/inquiries/{item.inquiry_id ?? ''}">
									{item.customer_name || '—'}
								</a>
							</td>
							<td class:past={item.move_date_passed}>{fmtDate(item.scheduled_date)}</td>
							<td class="num">{formatEuro(item.netto_cents)}</td>
							<td class="num">{formatEuro(item.brutto_cents)}</td>
							<td class="num">{item.age_days} T</td>
							<td>
								<span class="lage lage--{item.lage}">
									{LAGE_LABELS[item.lage] ?? item.lage}
								</span>
								{#if item.needs_followup}
									<span class="tag tag--chase" title="Auf der Nachfassliste">nachfassen</span>
								{:else if item.followup_muted && item.lage === 'offen'}
									<button
										type="button" class="tag tag--muted" onclick={() => toggleMute(item)}
										title="Wieder erinnern"
									><Bell size={11} /> stumm</button>
								{/if}
							</td>
							<td class="mono">{item.invoice_number || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if visible.length === 0}
				<p class="no-rows">Keine KVAs f&uuml;r diese Filter.</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { padding: var(--dt-space-6); }

	.page-header {
		display: flex; align-items: baseline; gap: 0.75rem;
		margin-bottom: var(--dt-space-5);
	}
	.page-header h1 {
		font-size: 1.5rem; font-weight: 700; color: var(--dt-on-surface); margin: 0;
	}
	.page-count { font-size: 0.8125rem; color: var(--dt-on-surface-variant); }

	.loading, .empty {
		color: var(--dt-on-surface-variant); padding: var(--dt-space-10); text-align: center;
	}
	.error-box {
		background: var(--dt-error-bg); border: 1px solid var(--dt-error-text);
		color: var(--dt-error-text); padding: var(--dt-space-4);
		border-radius: var(--dt-radius-md);
	}

	/* ── Nachfassliste ──────────────────────────────── */
	.chase {
		background: var(--dt-surface-container-lowest);
		border: 1px solid var(--dt-outline-variant);
		border-left: 3px solid #1b6ca8;
		border-radius: var(--dt-radius-lg);
		padding: var(--dt-space-5) var(--dt-space-6);
		margin-bottom: var(--dt-space-5);
	}
	.chase--empty { border-left-color: var(--dt-outline-variant); }

	.chase-head {
		display: flex; justify-content: space-between; align-items: flex-start;
		gap: var(--dt-space-4); flex-wrap: wrap; margin-bottom: var(--dt-space-3);
	}
	.chase-head h2 {
		display: flex; align-items: center; gap: 0.4rem;
		margin: 0; font-size: 1rem; font-weight: 700; color: var(--dt-on-surface);
	}
	.chase-sub {
		margin: 0.15rem 0 0; font-size: 0.8125rem;
		color: var(--dt-on-surface-variant); max-width: 60ch;
	}
	.chase-none {
		margin: 0; font-size: 0.875rem; color: var(--dt-on-surface-variant);
	}

	.days-field {
		display: inline-flex; align-items: center; gap: 0.35rem;
		font-size: 0.8125rem; color: var(--dt-on-surface-variant); white-space: nowrap;
	}
	.days-field input {
		width: 4rem; padding: 0.3rem 0.4rem; text-align: right;
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-low); color: var(--dt-on-surface);
		font-variant-numeric: tabular-nums;
	}

	.chase-list { list-style: none; margin: 0; padding: 0; }
	.chase-list > li, .side-list li {
		display: flex; align-items: center; gap: var(--dt-space-3);
		flex-wrap: wrap; padding: 0.5rem 0;
		border-top: 1px solid var(--dt-outline-variant);
		font-size: 0.8125rem;
	}
	.chase-nr {
		font-family: var(--font-mono); font-size: 0.75rem;
		color: var(--dt-primary); text-decoration: underline; flex: 0 0 auto;
	}
	.chase-name { font-weight: 600; color: var(--dt-on-surface); }
	.chase-num {
		font-variant-numeric: tabular-nums; font-weight: 600;
		color: var(--dt-on-surface); margin-left: auto;
	}
	.chase-meta, .chase-pinged {
		color: var(--dt-on-surface-variant); font-size: 0.75rem;
	}
	.chase-pinged { font-style: italic; }

	.mute-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.2rem 0.5rem; border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm); background: var(--dt-surface-container-low);
		color: var(--dt-on-surface-variant); font-size: 0.6875rem; cursor: pointer;
	}
	.mute-btn:hover { background: var(--dt-surface-container-high); }

	.side-list { margin-top: var(--dt-space-4); }
	.side-list summary {
		cursor: pointer; font-size: 0.8125rem; color: var(--dt-on-surface-variant);
		padding: 0.25rem 0;
	}
	.side-list summary:hover { color: var(--dt-on-surface); }
	.side-list ul { list-style: none; margin: 0; padding: 0; }
	.side-note {
		margin: 0.25rem 0 0.5rem; font-size: 0.75rem;
		color: var(--dt-on-surface-variant); max-width: 70ch;
	}

	/* ── year nav ───────────────────────────────────── */
	.year-nav {
		display: flex; justify-content: center; align-items: center; flex-wrap: wrap;
		gap: var(--dt-space-2); margin-bottom: var(--dt-space-4);
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
	.export-btn {
		margin-left: var(--dt-space-3); padding: 0.35rem 0.9rem;
		border-radius: var(--dt-radius-md); border: var(--dt-ghost-border);
		background: var(--dt-surface-container-low); color: var(--dt-on-surface-variant);
		font-size: 0.8125rem; font-weight: 600; cursor: pointer;
	}
	.export-btn:hover { background: var(--dt-surface-container-high); }

	/* ── KPIs ───────────────────────────────────────── */
	.kpis {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: var(--dt-space-3); margin-bottom: var(--dt-space-4);
	}
	.kpi {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg); padding: var(--dt-space-4);
		display: flex; flex-direction: column; gap: 0.15rem;
	}
	.kpi--alert { border-left: 3px solid #1b6ca8; }
	.kpi-label {
		font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em;
		color: var(--dt-on-surface-variant); font-weight: 500;
	}
	.kpi-value {
		font-size: 1.125rem; font-weight: 700; color: var(--dt-on-surface);
		font-variant-numeric: tabular-nums;
	}
	.kpi-note { font-size: 0.75rem; color: var(--dt-on-surface-variant); }

	/* ── filter bar ─────────────────────────────────── */
	.filter-bar {
		display: flex; align-items: center; gap: var(--dt-space-3);
		flex-wrap: wrap; margin-bottom: var(--dt-space-3);
	}
	.chips { display: flex; gap: var(--dt-space-2); flex-wrap: wrap; }
	.chip {
		padding: 0.3rem 0.75rem; border-radius: 999px; border: var(--dt-ghost-border);
		background: var(--dt-surface-container-low); color: var(--dt-on-surface-variant);
		font-size: 0.8125rem; cursor: pointer;
	}
	.chip:hover { background: var(--dt-surface-container-high); }
	.chip.active {
		background: var(--dt-primary); color: var(--dt-on-primary); border-color: transparent;
	}

	.search {
		display: inline-flex; align-items: center; gap: 0.35rem;
		padding: 0.3rem 0.6rem; border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md); background: var(--dt-surface-container-low);
		color: var(--dt-on-surface-variant);
	}
	.search input {
		border: none; background: none; outline: none; color: var(--dt-on-surface);
		font-size: 0.8125rem; min-width: 12rem;
	}

	.clear-btn {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.3rem 0.6rem; border: none; background: none;
		color: var(--dt-primary); font-size: 0.8125rem; cursor: pointer;
	}
	.result-count {
		margin-left: auto; font-size: 0.8125rem; color: var(--dt-on-surface-variant);
		font-variant-numeric: tabular-nums;
	}

	/* ── table ──────────────────────────────────────── */
	/* Same scroll box as the Rechnungsausgangsbuch: the sticky header row and the
	 * horizontal scrollbar on the bottom edge stay in view while scrolling rows,
	 * with the same 14rem reserve for the sticky topbar. */
	.table-wrapper {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
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
	thead th {
		position: sticky; top: 0; z-index: 2;
		background: var(--dt-surface-container-high);
	}
	th.num { text-align: right; }
	th.num .sort-btn { justify-content: flex-end; width: 100%; }
	.sort-btn {
		display: inline-flex; align-items: center; gap: 0.3rem;
		padding: 0; border: none; background: none; cursor: pointer;
		color: inherit; font: inherit; text-transform: inherit;
		letter-spacing: inherit;
	}
	.sort-btn:hover { color: var(--dt-on-surface); }

	td {
		padding: 8px var(--dt-space-4); color: var(--dt-on-surface); white-space: nowrap;
	}
	td.num { text-align: right; font-variant-numeric: tabular-nums; }
	td.past { color: var(--dt-error-text, #b3261e); }
	tbody tr:nth-child(even) { background: var(--dt-surface-container-low); }
	tbody tr:nth-child(odd) { background: var(--dt-surface-container-lowest); }
	tbody tr:hover { background: var(--dt-surface-container-high) !important; }
	tbody tr.lost td { opacity: 0.7; }

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

	/* Lage is never colour-alone — the label always carries the word. */
	.lage {
		padding: 1px 8px; border-radius: var(--dt-radius-sm);
		font-size: 0.6875rem; font-weight: 600; white-space: nowrap;
		background: var(--dt-surface-container-high); color: var(--dt-on-surface-variant);
	}
	.lage--gewonnen { color: var(--admin-success, #2e7d32); }
	.lage--verloren { color: var(--dt-error-text, #b3261e); }

	.tag {
		margin-left: 0.35rem; padding: 1px 6px; border-radius: var(--dt-radius-sm);
		font-size: 0.625rem; font-weight: 600; white-space: nowrap;
		border: none; cursor: default;
	}
	.tag--chase { background: #1b6ca8; color: #fff; }
	.tag--muted {
		display: inline-flex; align-items: center; gap: 0.2rem;
		background: var(--dt-surface-container-high); color: var(--dt-on-surface-variant);
		cursor: pointer;
	}

	.no-rows {
		padding: var(--dt-space-6); text-align: center;
		color: var(--dt-on-surface-variant); font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.page { padding: var(--dt-space-4); }
		.year-btn, .export-btn, .chip { min-height: 40px; }
		.chase-num { margin-left: 0; }
		.result-count { margin-left: 0; }
	}
</style>
