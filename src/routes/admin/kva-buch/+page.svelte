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
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { Tone } from '$lib/components/ui/tone';
	import {
		type KvaRow, type KvaFilters, type KvaSortKey, type KvaSortState, type LageFilter,
		LAGE_LABELS, NO_FILTERS, availableYears, rowsForYear, kvaKpis, monthlySummaries,
		followupRows, dateMissingRows, staleRows, viewRows, hasActiveFilters, kvaDate
	} from '$lib/utils/kvaBuch';
	import {
		FileText, Search, X, ArrowUpDown, ArrowUp, ArrowDown, BellOff, Bell, Phone, Download, ChevronRight
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

	const LAGE_TONE: Record<string, Tone> = { gewonnen: 'ok', verloren: 'danger', offen: 'info' };
</script>

<svelte:head><title>KVA-Buch</title></svelte:head>

<PageHeader title="KVA-Buch" count="{rows.length} Kostenvoranschläge">
	{#snippet actions()}
		{#if rows.length > 0}
			<Button onclick={exportYear}><Download size={15} /> Excel {activeYear}</Button>
		{/if}
	{/snippet}
</PageHeader>

{#if loading}
	<div class="flex flex-col gap-3.5" aria-busy="true">
		<div class="h-40 animate-pulse rounded-md bg-sunk"></div>
		<div class="h-80 animate-pulse rounded-md bg-sunk"></div>
	</div>
{:else if error}
	<p class="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
{:else if rows.length === 0}
	<EmptyState title="Keine Kostenvoranschläge vorhanden" />
{:else}
	<div class="flex flex-col gap-3.5">
		<!-- Nachfassliste first: the only part of the page that earns money. Not year-scoped:
		     an old KVA with a future move date still counts. -->
		<section class="rounded-md border bg-panel {chase.length ? 'border-accent/50' : 'border-line'}">
			<header class="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
				<div class="flex max-w-2xl flex-col gap-1">
					<h2 class="flex items-center gap-2 text-[15px] font-semibold">
						<Phone size={16} class="text-accent-text" /> Nachfassen
						<span class="num text-sm font-normal text-faint">{chase.length}</span>
					</h2>
					<p class="text-xs text-muted">
						Offene KVAs, die länger als {followupDays} Tage ohne Antwort sind <strong class="text-fg">und</strong> deren
						Umzugstermin noch bevorsteht. Genau diese meldet auch der Telegram-Bot.
					</p>
				</div>
				<label class="flex items-center gap-2 text-[13px] text-muted">
					Frist
					<input
						type="number"
						min="1"
						max="365"
						class="num h-8 w-16 rounded-sm border border-line-strong bg-panel px-2 text-right text-fg outline-none focus:border-fg"
						bind:value={followupDays}
						onblur={saveFollowupDays}
						disabled={savingDays}
					/>
					Tage
				</label>
			</header>

			{#if chase.length === 0}
				<p class="border-t border-line px-4 py-4 text-sm text-muted">Nichts nachzufassen — alle offenen KVAs sind aktuell.</p>
			{:else}
				<ul>
					{#each chase as item (item.id)}
						<li class="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-t border-line px-4 py-2.5 text-sm sm:grid-cols-[80px_minmax(0,1fr)_110px_auto_auto]">
							<a class="num text-[13px] text-muted hover:text-fg" href="/admin/inquiries/{item.inquiry_id ?? ''}">{item.offer_number || '—'}</a>
							<span class="flex min-w-0 flex-col">
								<a class="truncate font-medium hover:underline" href="/admin/inquiries/{item.inquiry_id ?? ''}">{item.customer_name || '—'}</a>
								<span class="num text-xs text-faint">
									{item.age_days} Tage still · Umzug {fmtDate(item.scheduled_date)}
									{#if item.followup_last_pinged_on}· erinnert {fmtDate(item.followup_last_pinged_on)}{/if}
								</span>
							</span>
							<span class="num text-right font-medium sm:order-none">{formatEuro(item.netto_cents)}</span>
							<span class="hidden sm:block"></span>
							<Button
								size="xs"
								variant="ghost"
								class="col-span-3 justify-self-end sm:col-span-1"
								onclick={() => toggleMute(item)}
								title="Nicht mehr an diesen KVA erinnern"
							>
								<BellOff size={13} /> Stumm
							</Button>
						</li>
					{/each}
				</ul>
			{/if}

			{#each [{ list: missingDate, title: `${missingDate.length} überfällige KVAs ohne Umzugsdatum`, note: 'Diese werden nicht automatisch gemeldet — ohne Termin lässt sich nicht sagen, ob der Auftrag noch aktuell ist.', meta: (i: KvaRow) => `${i.age_days} Tage still` }, { list: stale, title: `${stale.length} offene KVAs mit vergangenem Umzugsdatum (${formatEuro(kpis.deadOpenNetto)})`, note: 'Der Termin ist vorbei — diese lassen sich nicht mehr gewinnen und sollten auf gewonnen oder verloren gesetzt werden.', meta: (i: KvaRow) => `Umzug war ${fmtDate(i.scheduled_date)}` }] as group (group.title)}
				{#if group.list.length > 0}
					<details class="group border-t border-line">
						<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-[13px] text-muted hover:text-fg">
							<ChevronRight size={14} class="transition-transform group-open:rotate-90" />
							{group.title}
						</summary>
						<p class="px-4 pb-2 text-xs text-faint">{group.note}</p>
						<ul class="pb-2">
							{#each group.list as item (item.id)}
								<li class="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 px-4 py-1.5 text-[13px] sm:grid-cols-[80px_minmax(0,1fr)_110px_180px]">
									<span class="num text-muted">{item.offer_number || '—'}</span>
									<span class="truncate">{item.customer_name || '—'}</span>
									<span class="num text-right">{formatEuro(item.netto_cents)}</span>
									<span class="num hidden text-right text-xs text-faint sm:block">{group.meta(item)}</span>
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			{/each}
		</section>

		<FilterTabs
			label="Jahr"
			options={years.map((y) => ({ value: y, label: y }))}
			value={activeYear}
			onchange={(v) => selectYear(v)}
		/>

		<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Kennzahlen">
			<Kpi label="Angebotsvolumen" value={formatEuro(kpis.volumeNetto)} sub="{kpis.count} KVAs netto" />
			<Kpi label="Gewonnen" value={formatEuro(kpis.wonNetto)} sub="{kpis.wonCount} Aufträge" />
			<!-- Both rates, always: they diverge when won and lost jobs differ in size. -->
			<Kpi label="Annahmequote" value={pct(kpis.winRateByCount)} sub="nach Wert {pct(kpis.winRateByValue)}" />
			<Kpi
				label="Offen"
				value={formatEuro(kpis.liveOpenNetto)}
				sub={kpis.deadOpenCount > 0 ? `+ ${formatEuro(kpis.deadOpenNetto)} Termin vorbei` : `${kpis.openCount} KVAs`}
			/>
			<Kpi
				label="Nachfassen"
				value={String(kpis.followupCount)}
				sub={formatEuro(kpis.followupNetto)}
				class={kpis.followupCount > 0 ? 'border-accent/50' : ''}
			/>
			<!-- A systematically higher average on lost KVAs is a pricing signal. -->
			<Kpi
				label="Ø Auftragswert"
				value={kpis.avgWonNetto == null ? '—' : formatEuro(kpis.avgWonNetto)}
				sub="verloren {kpis.avgLostNetto == null ? '—' : formatEuro(kpis.avgLostNetto)}"
			/>
		</section>

		<KvaMonatsUebersicht {months} selected={filters.month} onSelect={setMonth} />

		<div class="flex flex-col gap-3 lg:flex-row lg:items-center">
			<FilterTabs
				label="Lage"
				options={LAGE_FILTERS.map((f) => ({ value: f.key, label: f.label }))}
				value={filters.lage}
				onchange={(v) => setLage(v as typeof filters.lage)}
			/>
			<label
				class="flex h-9 items-center gap-2 rounded-sm border border-line-strong bg-panel px-3 text-faint focus-within:border-fg lg:ml-auto lg:w-72"
			>
				<Search size={14} />
				<input
					type="search"
					placeholder="Nr., Kunde oder Rechnung …"
					class="min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
					value={filters.search}
					oninput={(e) => (filters = { ...filters, search: e.currentTarget.value })}
				/>
			</label>
			{#if hasActiveFilters(filters)}
				<Button size="sm" variant="ghost" onclick={clearFilters}><X size={14} /> Zurücksetzen</Button>
			{/if}
			<span class="num text-xs text-faint">{visible.length} von {yearRows.length}</span>
		</div>

		<div class="overflow-x-auto rounded-md border border-line bg-panel">
			<table class="w-full min-w-[860px] border-collapse text-sm">
				<thead>
					<tr class="border-b border-line">
						{#each COLUMNS as col (col.key)}
							{@const Icon = sortIcon(col.key)}
							<th class="px-3 py-2.5 font-normal first:pl-4 {col.num ? 'text-right' : 'text-left'}">
								<button
									type="button"
									class="label-xs inline-flex items-center gap-1 text-faint hover:text-fg"
									onclick={() => toggleSort(col.key)}
								>
									{col.label}<Icon size={12} />
								</button>
							</th>
						{/each}
						<th class="label-xs px-3 py-2.5 pr-4 text-left font-normal text-faint">Rechnung</th>
					</tr>
				</thead>
				<tbody>
					{#each visible as item (item.id)}
						<tr class="border-b border-line last:border-b-0 hover:bg-sunk/60">
							<td class="num px-3 py-2 pl-4 text-[13px]">
								{#if item.pdf_s3_key}
									<button
										type="button"
										class="inline-flex items-center gap-1 text-accent-text hover:underline"
										onclick={() => openKvaPdf(item)}
										title="KVA öffnen"
									>
										<FileText size={12} />{item.offer_number || '—'}
									</button>
								{:else}
									{item.offer_number || '—'}
								{/if}
							</td>
							<td class="num px-3 py-2 text-[13px] text-muted">{fmtDate(kvaDate(item))}</td>
							<td class="px-3 py-2">
								<a class="font-medium hover:underline" href="/admin/inquiries/{item.inquiry_id ?? ''}">{item.customer_name || '—'}</a>
							</td>
							<td class="num px-3 py-2 text-[13px] {item.move_date_passed ? 'text-faint line-through' : ''}">{fmtDate(item.scheduled_date)}</td>
							<td class="num px-3 py-2 text-right">{formatEuro(item.netto_cents)}</td>
							<td class="num px-3 py-2 text-right text-muted">{formatEuro(item.brutto_cents)}</td>
							<td class="num px-3 py-2 text-right text-[13px] text-muted">{item.age_days} T</td>
							<td class="px-3 py-2">
								<span class="flex flex-wrap items-center gap-1">
									<Badge tone={LAGE_TONE[item.lage] ?? 'neutral'}>{LAGE_LABELS[item.lage] ?? item.lage}</Badge>
									{#if item.needs_followup}
										<Badge tone="accent">nachfassen</Badge>
									{:else if item.followup_muted && item.lage === 'offen'}
										<button
											type="button"
											class="inline-flex h-5 items-center gap-1 rounded-xs border border-dashed border-line-strong px-1.5 text-[11px] text-faint hover:text-fg"
											onclick={() => toggleMute(item)}
											title="Wieder erinnern"><Bell size={11} /> stumm</button
										>
									{/if}
								</span>
							</td>
							<td class="num px-3 py-2 pr-4 text-[13px] text-muted">{item.invoice_number || '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if visible.length === 0}
				<p class="py-8 text-center text-sm text-muted">Keine KVAs für diese Filter.</p>
			{/if}
		</div>
	</div>
{/if}
