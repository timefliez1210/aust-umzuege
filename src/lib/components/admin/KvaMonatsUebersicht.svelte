<script lang="ts">
	/**
	 * KVA-Monatsübersicht — one KVA year broken down by month.
	 *
	 * Used by: admin/kva-buch/+page.svelte
	 * Purpose: The register answers "what did we quote, in what order". This answers
	 *          "how much did we quote per month, and how much of it did we win" —
	 *          the shape of the sales year rather than the ledger.
	 *
	 * The two numbers are nested, not paired: won volume is a *part of* quoted volume,
	 * so it is drawn inside the same column rather than beside it. Side-by-side bars
	 * would imply two independent measures and invite reading the total as their sum.
	 *
	 * The chart and the table below show the same numbers. The table is the accessible
	 * view and is never collapsed away: the chart is a shape, the table is the record.
	 */
	import { formatEuro } from '$lib/utils/format';
	import type { KvaMonthSummary } from '$lib/utils/kvaBuch';

	interface Props {
		months: KvaMonthSummary[];
		/** Currently filtered month (0-based), or null for the whole year. */
		selected: number | null;
		onSelect: (month: number | null) => void;
	}

	let { months, selected, onSelect }: Props = $props();

	/** A round number at or above the tallest column, for the gridlines. */
	function niceCeiling(max: number): number {
		if (max <= 0) return 0;
		const magnitude = 10 ** Math.floor(Math.log10(max));
		for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
			if (magnitude * step >= max) return magnitude * step;
		}
		return magnitude * 10;
	}

	let maxVolume = $derived(Math.max(0, ...months.map((m) => m.volumeNetto)));
	let ceiling = $derived(niceCeiling(maxVolume));
	let gridTicks = $derived(
		ceiling === 0 ? [0] : [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(ceiling * f))
	);

	/** The tallest month — the only column that gets a direct label. */
	let peakMonth = $derived(
		maxVolume <= 0 ? null : (months.find((m) => m.volumeNetto === maxVolume)?.month ?? null)
	);

	function heightPercent(value: number): number {
		if (ceiling <= 0) return 0;
		// A month with volume always shows at least a sliver, so "small" never
		// renders identically to "none".
		return value <= 0 ? 0 : Math.max(1.5, (value / ceiling) * 100);
	}

	/** Won share as a percentage of that month's own column height. */
	function wonPercentOfColumn(m: KvaMonthSummary): number {
		if (m.volumeNetto <= 0 || m.wonNetto <= 0) return 0;
		return Math.min(100, (m.wonNetto / m.volumeNetto) * 100);
	}

	let yearTotals = $derived({
		count: months.reduce((s, m) => s + m.count, 0),
		volumeNetto: months.reduce((s, m) => s + m.volumeNetto, 0),
		wonNetto: months.reduce((s, m) => s + m.wonNetto, 0),
		wonCount: months.reduce((s, m) => s + m.wonCount, 0),
		lostCount: months.reduce((s, m) => s + m.lostCount, 0),
		openCount: months.reduce((s, m) => s + m.openCount, 0)
	});

	/** Clicking the already-selected month clears the filter — the chart is a toggle. */
	function toggle(month: number) {
		onSelect(selected === month ? null : month);
	}

	function quota(won: number, total: number): string {
		if (total <= 0) return '—';
		return `${Math.round((won / total) * 100)} %`;
	}

	function tooltip(m: KvaMonthSummary): string {
		if (m.count === 0) return `${m.label}: keine KVAs`;
		return [
			`${m.label}: ${m.count} ${m.count === 1 ? 'KVA' : 'KVAs'}`,
			`quotiert ${formatEuro(m.volumeNetto)}`,
			`gewonnen ${formatEuro(m.wonNetto)}`,
			`offen ${m.openCount}`
		].join(' · ');
	}
</script>

<!--
	Nested measures (won ⊂ quoted), so one hue at two strengths: the bar is the quoted
	volume, its tenant-coloured foot the won share. Identity is never colour-alone — the
	legend names both and the table repeats every number.
-->
<section class="rounded-md border border-line bg-panel">
	<header class="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
		<div class="flex flex-col gap-1">
			<h2 class="text-[15px] font-semibold">Monatsübersicht</h2>
			<p class="text-xs text-muted">Angebotsvolumen netto je Monat, nach KVA-Datum. Klick auf einen Monat filtert die Liste.</p>
		</div>
		{#if yearTotals.count > 0}
			<span class="flex items-center gap-3.5 text-xs text-muted">
				<span class="flex items-center gap-1.5"><span class="size-2.5 bg-accent"></span>Gewonnen</span>
				<span class="flex items-center gap-1.5"><span class="size-2.5 bg-bar-strong"></span>Offen / verloren</span>
			</span>
		{/if}
	</header>

	{#if yearTotals.count === 0}
		<p class="border-t border-line px-4 py-6 text-center text-sm text-muted">Keine Kostenvoranschläge in diesem Jahr.</p>
	{:else}
		<div class="px-4 pb-4">
			<div class="relative grid h-48 grid-cols-12 items-end gap-1.5 border-b border-line-strong sm:gap-2">
				<div class="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
					{#each gridTicks as tick, i (i)}
						<span class="num relative border-t border-dashed border-line text-[10px] text-faint"
							><span class="absolute -top-2 right-0 bg-panel pl-1">{Math.round(tick / 100).toLocaleString('de-DE')}</span></span
						>
					{/each}
				</div>
				{#each months as m (m.month)}
					<button
						type="button"
						class="relative z-[1] flex h-full flex-col justify-end transition-opacity {selected != null && selected !== m.month
							? 'opacity-35'
							: ''}"
						onclick={() => toggle(m.month)}
						title={tooltip(m)}
						aria-label={tooltip(m)}
						aria-pressed={selected === m.month}
					>
						{#if m.month === peakMonth}
							<span class="num mb-1 text-center text-[10px] text-fg">{Math.round(m.volumeNetto / 100).toLocaleString('de-DE')} €</span>
						{/if}
						<span
							class="flex flex-col justify-end overflow-hidden rounded-t-xs {selected === m.month ? 'bg-bar-strong ring-2 ring-fg' : 'bg-bar-strong/70'}"
							style:height="{heightPercent(m.volumeNetto)}%"
						>
							<span class="bg-accent" style:height="{wonPercentOfColumn(m)}%"></span>
						</span>
					</button>
				{/each}
			</div>
			<div class="grid grid-cols-12 gap-1.5 pt-2 sm:gap-2">
				{#each months as m (m.month)}
					<span class="num text-center text-[10.5px] {selected === m.month ? 'text-fg' : 'text-faint'}">{m.label}</span>
				{/each}
			</div>
		</div>

		<!-- The record: the same twelve months, never collapsed away. -->
		<div class="overflow-x-auto border-t border-line">
			<table class="num w-full min-w-[520px] border-collapse text-[13px]">
				<thead>
					<tr class="label-xs text-faint">
						<th class="px-4 py-2 text-left font-normal">Monat</th>
						<th class="px-3 py-2 text-right font-normal">KVAs</th>
						<th class="px-3 py-2 text-right font-normal">Volumen</th>
						<th class="px-3 py-2 text-right font-normal">Gewonnen</th>
						<th class="px-3 py-2 text-right font-normal">Quote</th>
						<th class="px-4 py-2 text-right font-normal">Offen</th>
					</tr>
				</thead>
				<tbody>
					{#each months as m (m.month)}
						<tr class="border-t border-line {m.count === 0 ? 'text-faint' : ''} {selected === m.month ? 'bg-sunk' : ''}">
							<td class="px-4 py-1.5">
								<button type="button" class="font-sans hover:underline" onclick={() => toggle(m.month)}>{m.label}</button>
							</td>
							<td class="px-3 py-1.5 text-right">{m.count || '—'}</td>
							<td class="px-3 py-1.5 text-right">{m.count ? formatEuro(m.volumeNetto) : '—'}</td>
							<td class="px-3 py-1.5 text-right">{m.count ? formatEuro(m.wonNetto) : '—'}</td>
							<td class="px-3 py-1.5 text-right">
								{m.wonCount + m.lostCount > 0 ? quota(m.wonCount, m.wonCount + m.lostCount) : '—'}
							</td>
							<td class="px-4 py-1.5 text-right">{m.openCount || '—'}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t border-line-strong font-semibold">
						<th class="px-4 py-2 text-left font-sans">Jahr</th>
						<th class="px-3 py-2 text-right">{yearTotals.count}</th>
						<th class="px-3 py-2 text-right">{formatEuro(yearTotals.volumeNetto)}</th>
						<th class="px-3 py-2 text-right">{formatEuro(yearTotals.wonNetto)}</th>
						<th class="px-3 py-2 text-right">{quota(yearTotals.wonCount, yearTotals.wonCount + yearTotals.lostCount)}</th>
						<th class="px-4 py-2 text-right">{yearTotals.openCount}</th>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</section>
