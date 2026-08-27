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

<section class="panel">
	<header class="panel-head">
		<h2>Monats&uuml;bersicht</h2>
		<p class="panel-sub">
			Angebotsvolumen netto je Monat, nach KVA-Datum. Der dunkle Teil ist der
			bereits gewonnene Anteil.
		</p>
	</header>

	{#if yearTotals.count === 0}
		<p class="empty">Keine Kostenvoranschl&auml;ge in diesem Jahr.</p>
	{:else}
		<!-- Two nested measures, so identity is never colour-alone: the legend names
		     both and the table below repeats every number. -->
		<div class="legend">
			<span class="legend-item">
				<span class="swatch swatch--won"></span>Gewonnen
			</span>
			<span class="legend-item">
				<span class="swatch swatch--open"></span>Noch offen / verloren
			</span>
		</div>

		<div class="chart">
			<div class="y-axis" aria-hidden="true">
				{#each gridTicks as tick}
					<span class="y-tick">{Math.round(tick / 100).toLocaleString('de-DE')}</span>
				{/each}
			</div>
			<div class="plot">
				<div class="grid" aria-hidden="true">
					{#each gridTicks as _tick}
						<span class="grid-line"></span>
					{/each}
				</div>
				<div class="bars">
					{#each months as m}
						<button
							type="button"
							class="bar-slot"
							class:dimmed={selected != null && selected !== m.month}
							class:active={selected === m.month}
							onclick={() => toggle(m.month)}
							title={tooltip(m)}
							aria-label={tooltip(m)}
							aria-pressed={selected === m.month}
						>
							<span class="bar-track">
								{#if m.month === peakMonth}
									<span class="bar-value" style:bottom="{heightPercent(m.volumeNetto)}%">
										{Math.round(m.volumeNetto / 100).toLocaleString('de-DE')}&nbsp;&euro;
									</span>
								{/if}
								<span class="bar" style:height="{heightPercent(m.volumeNetto)}%">
									<span class="bar-won" style:height="{wonPercentOfColumn(m)}%"></span>
								</span>
							</span>
							<span class="bar-label">{m.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- The record. Same twelve months, never collapsed away. -->
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Monat</th>
						<th class="num">KVAs</th>
						<th class="num">Volumen</th>
						<th class="num">Gewonnen</th>
						<th class="num">Quote</th>
						<th class="num">Offen</th>
					</tr>
				</thead>
				<tbody>
					{#each months as m}
						<tr class:empty-month={m.count === 0} class:selected={selected === m.month}>
							<td>
								<button type="button" class="month-btn" onclick={() => toggle(m.month)}>
									{m.label}
								</button>
							</td>
							<td class="num">{m.count || '—'}</td>
							<td class="num">{m.count ? formatEuro(m.volumeNetto) : '—'}</td>
							<td class="num">{m.count ? formatEuro(m.wonNetto) : '—'}</td>
							<td class="num">
								{m.wonCount + m.lostCount > 0 ? quota(m.wonCount, m.wonCount + m.lostCount) : '—'}
							</td>
							<td class="num">{m.openCount || '—'}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th>Jahr</th>
						<th class="num">{yearTotals.count}</th>
						<th class="num">{formatEuro(yearTotals.volumeNetto)}</th>
						<th class="num">{formatEuro(yearTotals.wonNetto)}</th>
						<th class="num">
							{quota(yearTotals.wonCount, yearTotals.wonCount + yearTotals.lostCount)}
						</th>
						<th class="num">{yearTotals.openCount}</th>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</section>

<style>
	/* One hue at two steps, because the two measures are nested rather than
	 * categorical: won volume is part of quoted volume. #1b6ca8 passes the palette
	 * validator against the white chart surface; #7fb5da sits ΔE 23.8 from it in
	 * normal vision and 20+ under every CVD simulation, so the split stays legible.
	 * The lighter step is under 3:1 against the surface on its own — relieved by the
	 * legend above and the full table below, both always present. */
	.panel {
		--chart-won: #1b6ca8;
		--chart-open: #7fb5da;
		/* De-emphasis, not erasure: a filtered-out month must still read as a column. */
		--chart-won-dim: color-mix(in srgb, #1b6ca8 32%, transparent);
		--chart-open-dim: color-mix(in srgb, #7fb5da 32%, transparent);

		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: var(--dt-space-5) var(--dt-space-6);
		margin-bottom: var(--dt-space-4);
	}

	.panel-head { margin-bottom: var(--dt-space-4); }
	.panel-head h2 {
		margin: 0; font-size: 1rem; font-weight: 700; color: var(--dt-on-surface);
	}
	.panel-sub {
		margin: 0.15rem 0 0; font-size: 0.8125rem; color: var(--dt-on-surface-variant);
	}
	.empty {
		color: var(--dt-on-surface-variant); padding: var(--dt-space-6) 0;
		text-align: center; font-size: 0.875rem;
	}

	/* ── legend ─────────────────────────────────────── */
	.legend {
		display: flex; flex-wrap: wrap; gap: var(--dt-space-4);
		margin-bottom: var(--dt-space-3);
	}
	.legend-item {
		display: inline-flex; align-items: center; gap: 0.4rem;
		font-size: 0.75rem; color: var(--dt-on-surface-variant);
	}
	.swatch {
		width: 10px; height: 10px; border-radius: 2px; flex: 0 0 auto;
	}
	.swatch--won { background: var(--chart-won); }
	.swatch--open { background: var(--chart-open); }

	/* ── chart ──────────────────────────────────────── */
	.chart { display: flex; gap: var(--dt-space-2); height: 190px; }

	.y-axis {
		display: flex; flex-direction: column; justify-content: space-between;
		align-items: flex-end; padding-bottom: 20px; width: 3.5rem; flex: 0 0 auto;
	}
	.y-tick {
		font-size: 0.6875rem; color: var(--dt-on-surface-variant);
		font-variant-numeric: tabular-nums; line-height: 1;
	}

	.plot { position: relative; flex: 1 1 auto; min-width: 0; }
	.grid {
		position: absolute; inset: 0 0 20px 0; display: flex;
		flex-direction: column; justify-content: space-between; pointer-events: none;
	}
	.grid-line { border-top: 1px solid var(--dt-outline-variant); opacity: 0.5; }

	.bars {
		position: absolute; inset: 0; display: flex; align-items: flex-end;
		gap: 2px; /* surface gap between adjacent fills */
	}
	.bar-slot {
		flex: 1 1 0; min-width: 0; display: flex; flex-direction: column;
		align-items: center; height: 100%; padding: 0; border: none;
		background: none; cursor: pointer;
	}
	.bar-track {
		position: relative; flex: 1 1 auto; width: 100%;
		display: flex; align-items: flex-end; justify-content: center;
	}
	.bar {
		position: relative; width: 100%; max-width: 24px;
		background: var(--chart-open); border-radius: 4px 4px 0 0;
		transition: background var(--dt-transition);
		display: flex; flex-direction: column; justify-content: flex-end;
	}
	/* Anchored to the baseline, so the won portion grows up from the axis. */
	.bar-won {
		width: 100%; background: var(--chart-won);
		border-radius: 0 0 0 0; transition: background var(--dt-transition);
	}
	.bar-label {
		font-size: 0.625rem; color: var(--dt-on-surface-variant);
		height: 20px; line-height: 20px; overflow: hidden;
		white-space: nowrap; max-width: 100%;
	}
	.bar-value {
		position: absolute; left: 50%; transform: translate(-50%, -2px);
		font-size: 0.625rem; font-weight: 600; color: var(--dt-on-surface);
		font-variant-numeric: tabular-nums; white-space: nowrap;
	}

	/* Dimming is a fill change only — never stacked with opacity, or the column
	 * disappears instead of receding. */
	.bar-slot.dimmed .bar { background: var(--chart-open-dim); }
	.bar-slot.dimmed .bar-won { background: var(--chart-won-dim); }

	/* Hover and selection must not look alike: hover restores full ink, selection
	 * uses the brand step. */
	.bar-slot:hover .bar { background: var(--chart-open); }
	.bar-slot:hover .bar-won { background: var(--chart-won); }
	.bar-slot.active .bar-won,
	.bar-slot.active:hover .bar-won { background: var(--dt-primary); }

	/* ── table ──────────────────────────────────────── */
	.table-wrap { margin-top: var(--dt-space-4); overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
	th {
		padding: 6px var(--dt-space-3); text-align: left; font-weight: 500;
		color: var(--dt-on-surface-variant); font-size: 11px;
		text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
	}
	th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }
	td {
		padding: 6px var(--dt-space-3); color: var(--dt-on-surface); white-space: nowrap;
	}
	tbody tr.empty-month td { color: var(--dt-on-surface-variant); }
	tbody tr.selected { background: var(--dt-surface-container-high); }
	tbody tr:hover { background: var(--dt-surface-container-low); }

	.month-btn {
		padding: 0; border: none; background: none; cursor: pointer;
		color: inherit; font: inherit; text-align: left;
	}
	.month-btn:hover { text-decoration: underline; }

	tfoot th {
		border-top: 2px solid var(--dt-outline-variant);
		color: var(--dt-on-surface); font-weight: 700;
		font-size: 0.8125rem; text-transform: none; letter-spacing: 0;
	}

	@media (max-width: 768px) {
		.panel { padding: var(--dt-space-4); }
		.chart { height: 160px; }
		.bar-label { font-size: 0.5rem; }
	}
</style>
