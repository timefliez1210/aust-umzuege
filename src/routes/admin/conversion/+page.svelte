<script lang="ts">
	/**
	 * Conversion — where customers come from (Telefon, Kontaktformular, Kostenloses
	 * Angebot, Rückruf …), how far they get, and where they drop off.
	 *
	 * Data: GET /api/v1/admin/conversion (admin only). Attribution happens in the
	 * backend: a form or Rückruf claims the inquiry Alex creates for that person
	 * afterwards; inquiries nobody claimed are phone calls.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, formatEuro } from '$lib/utils/api.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ChannelTable from './_components/ChannelTable.svelte';
	import Funnel from './_components/Funnel.svelte';
	import DropOffs from './_components/DropOffs.svelte';
	import MonthTrend from './_components/MonthTrend.svelte';
	import LeadList from './_components/LeadList.svelte';
	import OrderSize from './_components/OrderSize.svelte';
	import { RANGES, STAGE_SENT_INDEX, fmtDays, pct, rangeQuery, type ConversionReport, type RangeKey } from './_components/types';

	let range = $derived(($page.url.searchParams.get('zeitraum') as RangeKey) || 'jahr');
	let data = $state<ConversionReport | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let loadSeq = 0;

	function selectRange(key: RangeKey) {
		const url = new URL($page.url);
		url.searchParams.set('zeitraum', key);
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	async function load(key: RangeKey) {
		const seq = ++loadSeq;
		loading = true;
		error = null;
		try {
			const res = await apiGet<ConversionReport>(`/api/v1/admin/conversion${rangeQuery(key)}`);
			if (seq === loadSeq) data = res;
		} catch (e) {
			if (seq === loadSeq) error = (e as Error).message || 'Conversion-Daten konnten nicht geladen werden.';
		} finally {
			if (seq === loadSeq) loading = false;
		}
	}

	$effect(() => {
		load(range);
	});

	let t = $derived(data?.total);
</script>

<svelte:head><title>Conversion</title></svelte:head>

<PageHeader title="Conversion" eyebrow="Woher Kunden kommen und wo sie abspringen">
	{#snippet actions()}
		<Segmented label="Zeitraum" options={RANGES} value={range} onchange={selectRange} />
	{/snippet}
</PageHeader>

{#if error}
	<Notice tone="danger">
		{error}
		{#snippet actions()}<Button size="xs" onclick={() => load(range)}>Erneut laden</Button>{/snippet}
	</Notice>
{/if}

{#if data && t}
	<div class="flex flex-col gap-6 {loading ? 'opacity-60 transition-opacity' : ''}">
		<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Kennzahlen">
			<Kpi label="Eingänge" value={String(t.leads)} sub={t.duplicates ? `+${t.duplicates} doppelte` : 'Anrufe, Formulare, Rückrufe'} />
			<Kpi label="Aufträge" value={String(t.won)} sub="{t.open} noch offen" />
			<Kpi label="Abschlussquote" value={pct(t.won, t.leads)} sub="Aufträge ÷ Eingänge" />
			<Kpi label="KVA → Auftrag" value={pct(t.won, t.reached[STAGE_SENT_INDEX])} sub="{t.reached[STAGE_SENT_INDEX]} KVAs versendet" />
			<Kpi
				label="Auftragswert netto"
				value={formatEuro(t.won_value_cents)}
				sub={t.avg_won_value_cents === null ? '—' : `Ø ${formatEuro(t.avg_won_value_cents)}`}
			/>
			<Kpi label="Tage bis KVA" value={fmtDays(t.median_days_to_kva)} sub="Median · Zusage {fmtDays(t.median_days_to_order)}" />
		</section>

		{#if t.leads === 0}
			<Notice>Im gewählten Zeitraum gibt es keine Eingänge.</Notice>
		{:else}
			<section class="flex flex-col gap-2">
				<h2 class="text-[15px] font-semibold">Kanäle im Vergleich</h2>
				<ChannelTable channels={data.channels} total={t} />
			</section>

			<div class="grid gap-6 xl:grid-cols-2">
				<section class="flex min-w-0 flex-col gap-2">
					<h2 class="text-[15px] font-semibold">Trichter</h2>
					<Funnel channels={data.channels} total={t} />
				</section>
				<section class="flex min-w-0 flex-col gap-2">
					<h2 class="text-[15px] font-semibold">Verlauf</h2>
					<MonthTrend months={data.months} />
				</section>
			</div>

			<section class="flex flex-col gap-2">
				<h2 class="text-[15px] font-semibold">Auftragsgröße</h2>
				<OrderSize leads={data.leads} />
			</section>

			<section class="flex flex-col gap-2">
				<h2 class="text-[15px] font-semibold">Wo springen Kunden ab?</h2>
				<DropOffs channels={data.channels} total={t} />
			</section>

			<section class="flex flex-col gap-2">
				<h2 class="text-[15px] font-semibold">Alle Kontakte</h2>
				<LeadList leads={data.leads} />
			</section>
		{/if}

		<details class="rounded-md border border-line bg-panel px-4 py-3 text-xs text-muted">
			<summary class="cursor-pointer text-[13px] text-fg">So wird gezählt</summary>
			<ul class="mt-2 flex list-disc flex-col gap-1 pl-4">
				<li>
					<b>Eingang</b> = eine Person meldet sich: ein Formular (Kontakt oder Kostenloses Angebot), ein Rückruf-Wunsch oder — wenn
					vorher nichts online kam — eine von Hand angelegte Anfrage, also ein Anruf.
				</li>
				<li>
					Ein Formular oder Rückruf bekommt die Anfrage zugeordnet, die danach für dieselbe Person angelegt wurde (gleicher Kunde,
					gleiche E-Mail oder gleiche Telefonnummer, bis 60 Tage später). Diese Anfrage zählt dann nicht noch einmal als Anruf.
				</li>
				<li>Ein zweites Formular derselben Person innerhalb von 14 Tagen ist „doppelt“ und wird nicht gezählt.</li>
				<li>
					<b>Abgesprungen</b>: Formular ohne Anfrage nach 14 Tagen, Anfrage ohne versendeten KVA nach 30 Tagen, KVA ohne Antwort nach
					30 Tagen, oder abgelehnt, abgelaufen, storniert.
				</li>
				<li>
					Anrufe, aus denen nie eine Anfrage wurde, kennt das System nicht. Telefon-Quoten sind deshalb etwas zu gut. Tage bis
					Zusage gibt es erst für Aufträge ab Mitte September 2026.
				</li>
				<li>Auftragswert = KVA netto der Aufträge.</li>
			</ul>
		</details>
	</div>
{:else if loading}
	<div class="flex flex-col gap-3">
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
			{#each Array(6) as _, i (i)}<div class="h-24 animate-pulse rounded-md bg-sunk"></div>{/each}
		</div>
		<div class="h-80 animate-pulse rounded-md bg-sunk"></div>
	</div>
{/if}
