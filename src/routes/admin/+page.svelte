<script lang="ts">
	import { apiGet } from '$lib/utils/api.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { formatEuroWhole } from '$lib/utils/format';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SearchButton from '$lib/components/console/SearchButton.svelte';
	import { Plus, RefreshCw } from 'lucide-svelte';
	import MorningWorkflowDialog from './_components/MorningWorkflowDialog.svelte';
	import TodoCard from './_overview/TodoCard.svelte';
	import JobsCard from './_overview/JobsCard.svelte';
	import RevenueChart from './_overview/RevenueChart.svelte';
	import FunnelCard from './_overview/FunnelCard.svelte';
	import CapacityCard from './_overview/CapacityCard.svelte';
	import ReceivablesCard from './_overview/ReceivablesCard.svelte';
	import RemindersCard from './_overview/RemindersCard.svelte';
	import { buildTodos } from './_overview/todos';
	import type { Overview } from './_overview/types';

	/**
	 * Heute — the console's home: what needs doing, who is out today, and how the
	 * business is going. One request (`/admin/overview`); every number repeats a
	 * figure from the page it links to.
	 */
	let data = $state<Overview | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function load() {
		loading = true;
		try {
			data = await apiGet<Overview>('/api/v1/admin/overview');
			error = null;
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

	const dateLine = $derived.by(() => {
		const d = data ? new Date(`${data.today}T12:00:00`) : new Date();
		const kw = (() => {
			const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
			t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
			return Math.ceil(((t.getTime() - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
		})();
		return `${d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })} · KW ${kw}`;
	});

	const greeting = $derived.by(() => {
		const h = new Date().getHours();
		const first = auth.user?.name?.split(/\s+/)[0];
		const word = h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
		return first ? `${word}, ${first}` : word;
	});

	const todos = $derived(data ? buildTodos(data) : []);

	/** KPI row. Revenue is the last *complete* month — the current one has barely started. */
	const kpis = $derived.by(() => {
		if (!data) return [];
		const rev = data.revenue;
		const last = rev.at(-2);
		const prev = rev.at(-3);
		const monthLabel = last ? MONTHS[Number(last.month.slice(5, 7)) - 1] : '';
		const tiles = [];

		if (last) {
			const change = prev && prev.revenue_cents > 0 ? (last.revenue_cents - prev.revenue_cents) / prev.revenue_cents : null;
			tiles.push({
				label: `Umsatz · ${monthLabel}`,
				value: formatEuroWhole(last.revenue_cents),
				delta: change === null ? undefined : `${change >= 0 ? '▲' : '▼'} ${Math.abs(Math.round(change * 100))} %`,
				deltaTone: (change === null ? 'neutral' : change >= 0 ? 'ok' : 'danger') as 'ok' | 'danger' | 'neutral',
				sub: prev ? `ggü. ${MONTHS[Number(prev.month.slice(5, 7)) - 1]}` : undefined,
				spark: rev.map((m) => m.revenue_cents),
				href: '/admin/rechnungsausgangsbuch'
			});
		}
		if (last && last.result_cents !== null) {
			const margin = last.revenue_cents > 0 ? Math.round((last.result_cents / last.revenue_cents) * 100) : null;
			tiles.push({
				label: `Ergebnis · ${monthLabel}`,
				value: formatEuroWhole(last.result_cents),
				delta: margin === null ? undefined : `${margin} %`,
				deltaTone: (last.result_cents < 0 ? 'danger' : 'neutral') as 'danger' | 'neutral',
				sub: 'vom Umsatz',
				spark: rev.map((m) => m.result_cents ?? 0),
				sparkClass: 'text-accent',
				href: '/admin/gewinn'
			});
		} else {
			tiles.push({
				label: 'Einsätze heute & morgen',
				value: String(data.jobs.length),
				sub: `${data.attention.unstaffed.length} ohne Team`,
				href: '/admin/calendar'
			});
		}
		tiles.push({
			label: 'Offene Angebote',
			value: String(data.pipeline.open_count),
			delta: formatEuroWhole(data.pipeline.open_netto_cents),
			deltaTone: 'neutral' as const,
			sub: 'netto, Umzug noch offen',
			href: '/admin/kva-buch'
		});
		const wr = data.pipeline.win_rate;
		const wp = data.pipeline.win_rate_previous;
		const pts = wr !== null && wp !== null ? Math.round((wr - wp) * 100) : null;
		tiles.push({
			label: 'Annahmequote · 90 T',
			value: wr === null ? '—' : `${Math.round(wr * 100)} %`,
			delta: pts === null ? undefined : `${pts >= 0 ? '▲' : '▼'} ${Math.abs(pts)} Pkt.`,
			deltaTone: (pts === null ? 'neutral' : pts >= 0 ? 'ok' : 'danger') as 'ok' | 'danger' | 'neutral',
			sub: pts === null ? 'entschiedene KVAs' : 'ggü. Vorquartal',
			spark: data.pipeline.win_rate_trend.map((v) => v ?? 0),
			href: '/admin/kva-buch'
		});
		return tiles;
	});
</script>

<svelte:head><title>Heute</title></svelte:head>

<div class="flex flex-col gap-3.5">
	<header class="flex flex-wrap items-end justify-between gap-4 pb-2">
		<div class="flex flex-col gap-1.5">
			<span class="label-xs text-faint">{dateLine}</span>
			<h1 class="text-[28px] leading-none font-semibold tracking-[-0.03em] sm:text-[34px]">{greeting}</h1>
		</div>
		<div class="flex items-center gap-2">
			<SearchButton class="hidden lg:flex" />
			<Button variant="ghost" size="icon" aria-label="Aktualisieren" onclick={load} disabled={loading}>
				<RefreshCw size={16} class={loading ? 'animate-spin' : ''} />
			</Button>
			<Button variant="accent" href="/admin/inquiries?neu=1"><Plus size={16} strokeWidth={2.2} /> Neue Anfrage</Button>
		</div>
	</header>

	{#if error}
		<div class="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
			Übersicht konnte nicht geladen werden: {error}
		</div>
	{/if}

	{#if !data}
		{#if !error}
			<div class="grid grid-cols-2 gap-3.5 lg:grid-cols-4" aria-busy="true">
				{#each Array(4) as _, i (i)}<div class="h-[118px] animate-pulse rounded-md bg-sunk"></div>{/each}
			</div>
			<div class="h-80 animate-pulse rounded-md bg-sunk"></div>
		{/if}
	{:else}
		<section class="grid grid-cols-2 gap-3.5 lg:grid-cols-4" aria-label="Kennzahlen">
			{#each kpis as k (k.label)}
				<Kpi {...k} />
			{/each}
		</section>

		<section class="grid gap-3.5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
			<TodoCard {todos} />
			<JobsCard jobs={data.jobs} today={data.today} />
		</section>

		<RemindersCard onChange={load} />

		<section class="grid gap-3.5 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
			<RevenueChart months={data.revenue} />
			<FunnelCard funnel={data.funnel} pipeline={data.pipeline} />
		</section>

		<section class="grid gap-3.5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
			<CapacityCard days={data.capacity} today={data.today} />
			<ReceivablesCard r={data.receivables} />
		</section>
	{/if}
</div>

<MorningWorkflowDialog />
