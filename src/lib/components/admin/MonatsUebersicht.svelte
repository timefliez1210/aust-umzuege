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

<!-- One series, one hue. Selecting a month dims the rest instead of recolouring them. -->
<section class="rounded-md border border-line bg-panel">
	<header class="flex flex-col gap-1 px-4 py-3.5">
		<h2 class="text-[15px] font-semibold">Monatsübersicht</h2>
		<p class="text-xs text-muted">
			Umsatz brutto je Monat, nach Leistungsdatum (Auftragsdatum). Entwürfe zählen nicht mit. Klick auf einen Monat filtert die
			Liste.
		</p>
	</header>

	{#if yearTotals.count === 0}
		<p class="border-t border-line px-4 py-6 text-center text-sm text-muted">Keine gebuchten Rechnungen in diesem Jahr.</p>
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
							<span class="num mb-1 text-center text-[10px] text-fg">{Math.round(m.brutto / 100).toLocaleString('de-DE')} €</span>
						{/if}
						<span
							class="rounded-t-xs {selected === m.month ? 'bg-accent ring-2 ring-fg' : 'bg-accent/70'}"
							style:height="{heightPercent(m.brutto)}%"
						></span>
					</button>
				{/each}
			</div>
			<div class="grid grid-cols-12 gap-1.5 pt-2 sm:gap-2">
				{#each months as m (m.month)}
					<span class="num text-center text-[10.5px] {selected === m.month ? 'text-fg' : 'text-faint'}">{m.label}</span>
				{/each}
			</div>
		</div>

		<!-- The record: the same twelve numbers, never collapsed away. -->
		<div class="overflow-x-auto border-t border-line">
			<table class="num w-full min-w-[520px] border-collapse text-[13px]">
				<thead>
					<tr class="label-xs text-faint">
						<th class="px-4 py-2 text-left font-normal">Monat</th>
						<th class="px-3 py-2 text-right font-normal">Rg.</th>
						<th class="px-3 py-2 text-right font-normal">Netto</th>
						<th class="px-3 py-2 text-right font-normal">MwSt</th>
						<th class="px-3 py-2 text-right font-normal">Brutto</th>
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
							<td class="px-3 py-1.5 text-right">{m.count ? formatEuro(m.netto) : '—'}</td>
							<td class="px-3 py-1.5 text-right">{m.count ? formatEuro(m.mwst) : '—'}</td>
							<td class="px-3 py-1.5 text-right">{m.count ? formatEuro(m.brutto) : '—'}</td>
							<td class="px-4 py-1.5 text-right {m.offen ? 'text-warn' : ''}">{m.offen ? formatEuro(m.offen) : '—'}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="border-t border-line-strong font-semibold">
						<th class="px-4 py-2 text-left font-sans">Jahr</th>
						<th class="px-3 py-2 text-right">{yearTotals.count}</th>
						<th class="px-3 py-2 text-right">{formatEuro(yearTotals.netto)}</th>
						<th class="px-3 py-2 text-right">{formatEuro(yearTotals.mwst)}</th>
						<th class="px-3 py-2 text-right">{formatEuro(yearTotals.brutto)}</th>
						<th class="px-4 py-2 text-right">{formatEuro(yearTotals.offen)}</th>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</section>
