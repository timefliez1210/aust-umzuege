<script lang="ts">
	/**
	 * Monatsübersicht — one register year broken down by month.
	 *
	 * Used by: admin/rechnungsausgangsbuch/+page.svelte
	 * Purpose: The register is a legal ledger read as a running list, which answers
	 *          "what did we invoice, in what order" but never "what did we invoice in
	 *          May". The monthly figures are also the ones that leave the building —
	 *          the Umsatzsteuer-Voranmeldung is filed per month, so the MWST column
	 *          here is the number Alex reports.
	 *
	 * The chart and the table below it show the same twelve numbers. The table is the
	 * accessible view and is never collapsed away: the chart is a shape, the table is
	 * the record.
	 */
	import { formatEuro } from '$lib/utils/format';
	import type { MonthSummary } from '$lib/utils/register';

	interface Props {
		months: MonthSummary[];
		/** Currently filtered month (1–12), or null for the whole year. */
		selected: number | null;
		/** Called when a column or table row is clicked; the page filters on it. */
		onSelect: (month: number | null) => void;
	}

	let { months, selected, onSelect }: Props = $props();

	/**
	 * A round number at or above the tallest column, for the gridlines.
	 *
	 * Ticks that read 0 / 2.000 / 4.000 are worth more than ticks that read the exact
	 * maximum: the axis is there to let the eye estimate the columns it isn't labelled.
	 */
	function niceCeiling(max: number): number {
		if (max <= 0) return 0;
		const magnitude = 10 ** Math.floor(Math.log10(max));
		for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10]) {
			if (magnitude * step >= max) return magnitude * step;
		}
		return magnitude * 10;
	}

	let maxBrutto = $derived(Math.max(0, ...months.map((m) => m.brutto)));
	let ceiling = $derived(niceCeiling(maxBrutto));
	/** Four gridlines including the baseline, top-down. */
	let gridTicks = $derived(
		ceiling === 0 ? [0] : [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(ceiling * f))
	);

	/** The tallest month — the only column that gets a direct label. */
	let peakMonth = $derived(
		maxBrutto <= 0 ? null : (months.find((m) => m.brutto === maxBrutto)?.month ?? null)
	);

	function heightPercent(brutto: number): number {
		if (ceiling <= 0) return 0;
		// A month with revenue always shows at least a sliver, so "small" never
		// renders identically to "none".
		return brutto <= 0 ? 0 : Math.max(1.5, (brutto / ceiling) * 100);
	}

	let yearTotals = $derived({
		netto: months.reduce((s, m) => s + m.netto, 0),
		mwst: months.reduce((s, m) => s + m.mwst, 0),
		brutto: months.reduce((s, m) => s + m.brutto, 0),
		offen: months.reduce((s, m) => s + m.offen, 0),
		count: months.reduce((s, m) => s + m.count, 0)
	});

	/** Clicking the already-selected month clears the filter — the chart is a toggle. */
	function toggle(month: number) {
		onSelect(selected === month ? null : month);
	}

	function tooltip(m: MonthSummary): string {
		if (m.count === 0) return `${m.label}: keine Rechnungen`;
		const parts = [
			`${m.label}: ${m.count} ${m.count === 1 ? 'Rechnung' : 'Rechnungen'}`,
			`Netto ${formatEuro(m.netto)}`,
			`MWST ${formatEuro(m.mwst)}`,
			`Brutto ${formatEuro(m.brutto)}`
		];
		if (m.offen !== 0) parts.push(`offen ${formatEuro(m.offen)}`);
		return parts.join(' · ');
	}
</script>

<section class="panel">
	<header class="panel-head">
		<h2>Monats&uuml;bersicht</h2>
		<p class="panel-sub">
			Umsatz brutto je Monat, nach Rechnungsdatum. Entw&uuml;rfe z&auml;hlen nicht mit.
		</p>
	</header>

	{#if yearTotals.count === 0}
		<p class="empty">Keine gebuchten Rechnungen in diesem Jahr.</p>
	{:else}
		<!-- Chart: one series, one hue. Selecting a month de-emphasises the rest
		     rather than recolouring them — the highlight is the message. -->
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
									<span class="bar-value" style:bottom="{heightPercent(m.brutto)}%">
										{Math.round(m.brutto / 100).toLocaleString('de-DE')}&nbsp;&euro;
									</span>
								{/if}
								<span class="bar" style:height="{heightPercent(m.brutto)}%"></span>
							</span>
							<span class="bar-label">{m.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- The record. Same twelve numbers, never collapsed away. -->
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Monat</th>
						<th class="num">Rg.</th>
						<th class="num">Netto</th>
						<th class="num">MWST</th>
						<th class="num">Brutto</th>
						<th class="num">Offen</th>
					</tr>
				</thead>
				<tbody>
					{#each months as m}
						<tr
							class:empty-month={m.count === 0}
							class:selected={selected === m.month}
						>
							<td>
								<button type="button" class="month-btn" onclick={() => toggle(m.month)}>
									{m.label}
								</button>
							</td>
							<td class="num">{m.count || '—'}</td>
							<td class="num">{m.count ? formatEuro(m.netto) : '—'}</td>
							<td class="num">{m.count ? formatEuro(m.mwst) : '—'}</td>
							<td class="num">{m.count ? formatEuro(m.brutto) : '—'}</td>
							<td class="num offen">{m.offen ? formatEuro(m.offen) : '—'}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<th>Jahr</th>
						<th class="num">{yearTotals.count}</th>
						<th class="num">{formatEuro(yearTotals.netto)}</th>
						<th class="num">{formatEuro(yearTotals.mwst)}</th>
						<th class="num">{formatEuro(yearTotals.brutto)}</th>
						<th class="num">{formatEuro(yearTotals.offen)}</th>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</section>

<style>
	/* One series, one hue. A lighter, more chromatic step of the brand navy than
	 * --dt-primary (#022448): as a 12-bar area fill the brand step reads as a wall of
	 * near-black, and it sits outside the legible lightness/chroma band. This step
	 * passes the palette validator against the white chart surface. */
	.panel {
		--chart-ink: #1b6ca8;
		/* De-emphasis, not erasure: a month that is filtered out must still be
		 * readable as a column, or the chart stops being a year at a glance. */
		--chart-ink-dim: color-mix(in srgb, #1b6ca8 32%, transparent);

		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: var(--dt-space-5) var(--dt-space-6);
		margin-bottom: var(--dt-space-4);
	}

	.panel-head { margin-bottom: var(--dt-space-5); }
	.panel-head h2 {
		margin: 0; font-size: 1rem; font-weight: 700; color: var(--dt-on-surface);
	}
	.panel-sub {
		margin: 0.15rem 0 0; font-size: 0.75rem; color: var(--dt-on-surface-variant);
	}
	.empty {
		color: var(--dt-on-surface-variant); font-size: 0.8125rem;
		padding: var(--dt-space-6) 0; text-align: center;
	}

	/* ── chart ─────────────────────────────────────── */
	.chart { display: flex; gap: var(--dt-space-2); height: 190px; }

	.y-axis {
		display: flex; flex-direction: column; justify-content: space-between;
		/* Aligns with .plot's own bottom label strip so ticks meet their gridlines. */
		padding-bottom: 22px;
		font-size: 0.6875rem; font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface-variant); text-align: right; min-width: 3.5ch;
	}
	.y-tick { line-height: 1; transform: translateY(-0.35em); }

	.plot { position: relative; flex: 1; min-width: 0; }

	.grid {
		position: absolute; inset: 0 0 22px 0;
		display: flex; flex-direction: column; justify-content: space-between;
	}
	/* Hairline, solid, one step off the surface — recessive by construction. */
	.grid-line { height: 1px; background: var(--dt-outline-variant); opacity: 0.5; }

	.bars {
		position: absolute; inset: 0;
		display: flex; align-items: stretch;
		/* The 2px surface gap that separates touching columns. */
		gap: 2px;
	}

	.bar-slot {
		flex: 1; min-width: 0;
		display: flex; flex-direction: column;
		padding: 0; border: none; background: none; cursor: pointer;
	}
	/* Dimming is the fill colour alone — never also an opacity on the slot. Stacking
	 * the two washed the column out to almost nothing and made a hovered dim column
	 * read as a muddy third state that means neither "selected" nor "not". */
	.bar-slot.dimmed .bar-value { color: var(--dt-on-surface-variant); }

	.bar-track {
		position: relative; flex: 1;
		display: flex; align-items: flex-end; justify-content: center;
	}

	/* ≤24px thick, 4px rounded cap, square at the baseline. */
	.bar {
		width: 100%; max-width: 24px;
		background: var(--chart-ink);
		border-radius: 4px 4px 0 0;
		transition: background var(--dt-transition);
	}
	.bar-slot.dimmed .bar { background: var(--chart-ink-dim); }
	/* Hover previews a column by restoring it to full strength; only the SELECTED
	 * month goes to the darker brand step. Giving hover and selection the same
	 * colour made "the pointer happens to be here" indistinguishable from
	 * "this is the month you are filtered to". */
	.bar-slot:hover .bar { background: var(--chart-ink); }
	.bar-slot.active .bar, .bar-slot.active:hover .bar { background: var(--dt-primary); }

	/* Only the tallest column is labelled — a number on every column goes unread. */
	.bar-value {
		position: absolute; left: 50%; transform: translate(-50%, -4px);
		font-size: 0.6875rem; font-weight: 600; white-space: nowrap;
		font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface);
	}

	.bar-label {
		height: 22px; line-height: 22px;
		font-size: 0.6875rem; color: var(--dt-on-surface-variant);
	}
	.bar-slot.active .bar-label { color: var(--dt-on-surface); font-weight: 700; }

	/* ── table ─────────────────────────────────────── */
	.table-wrap { margin-top: var(--dt-space-5); overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
	th {
		padding: 6px var(--dt-space-3); text-align: left; font-weight: 500;
		font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em;
		color: var(--dt-on-surface-variant); white-space: nowrap;
	}
	td { padding: 4px var(--dt-space-3); color: var(--dt-on-surface); white-space: nowrap; }
	.num { text-align: right; font-variant-numeric: tabular-nums; }
	td.offen { color: var(--dt-secondary); font-weight: 600; }
	tbody tr.empty-month td { color: var(--dt-on-surface-variant); opacity: 0.6; }
	tbody tr.selected { background: var(--dt-surface-container-high); }
	tbody tr:hover { background: var(--dt-surface-container-low); }

	.month-btn {
		padding: 0; border: none; background: none; cursor: pointer;
		font: inherit; color: inherit; text-decoration: underline dotted;
	}
	.month-btn:hover { color: var(--dt-primary); }

	tfoot th {
		padding-top: 8px; font-size: 0.8125rem; text-transform: none; letter-spacing: 0;
		font-weight: 700; color: var(--dt-on-surface);
		border-top: 2px solid var(--dt-outline-variant);
	}

	@media (max-width: 768px) {
		.panel { padding: var(--dt-space-4); }
		.chart { height: 150px; }
		.bar-value { display: none; }
		.month-btn { min-height: 32px; }
	}
</style>
