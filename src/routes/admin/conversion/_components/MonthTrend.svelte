<script lang="ts">
	/**
	 * Verlauf — Eingänge per month, stacked by channel, with the month's
	 * Abschlussquote on top. Hover (or focus) a month for the breakdown; the table
	 * toggle shows the same numbers as text.
	 */
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import { CHANNEL, CHANNELS, monthShort, pct, type Channel, type MonthRow } from './types';

	let { months }: { months: MonthRow[] } = $props();

	let view = $state<'chart' | 'table'>('chart');
	let hovered = $state<string | null>(null);

	/** Only channels that appear at all, in their fixed order (colours never shift). */
	let present = $derived(CHANNELS.filter((c) => months.some((m) => m.channels.some((x) => x.channel === c.key))));
	let rows = $derived(
		months.map((m) => {
			const by = new Map(m.channels.map((c) => [c.channel, c]));
			const leads = m.channels.reduce((s, c) => s + c.leads, 0);
			const won = m.channels.reduce((s, c) => s + c.won, 0);
			return { month: m.month, by, leads, won };
		})
	);
	let max = $derived(Math.max(1, ...rows.map((r) => r.leads)));
	let active = $derived(rows.find((r) => r.month === hovered) ?? null);

	function get(r: (typeof rows)[number], c: Channel) {
		return r.by.get(c) ?? { leads: 0, won: 0 };
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<!-- Legend: always shown, identity never by colour alone. -->
		<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legende">
			{#each present as c (c.key)}
				<li class="flex items-center gap-1.5"><span class="size-2.5 rounded-xs {c.dot}" aria-hidden="true"></span>{c.label}</li>
			{/each}
		</ul>
		<Segmented
			size="sm"
			label="Darstellung"
			options={[
				{ value: 'chart', label: 'Diagramm' },
				{ value: 'table', label: 'Tabelle' }
			]}
			bind:value={view}
		/>
	</div>

	{#if view === 'chart'}
		<div class="relative rounded-md border border-line bg-panel p-4">
			<!-- Hover readout sits above the plot so it never covers a bar. -->
			<div class="mb-3 min-h-10 text-xs" aria-live="polite">
				{#if active}
					<span class="font-medium text-fg">{monthShort(active.month)}</span>
					<span class="num text-muted"> · {active.leads} Eingänge · {active.won} Aufträge ({pct(active.won, active.leads, 0)})</span>
					<span class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
						{#each present as c (c.key)}
							{@const v = get(active, c.key)}
							{#if v.leads}
								<span class="num flex items-center gap-1 text-muted">
									<span class="size-2 rounded-xs {c.dot}" aria-hidden="true"></span>{c.short}
									<span class="text-fg">{v.leads}</span>/{v.won}
								</span>
							{/if}
						{/each}
					</span>
				{:else}
					<span class="text-faint">Monat antippen oder mit der Maus darüber fahren für Details.</span>
				{/if}
			</div>
			<div class="flex h-56 items-end gap-1.5 border-b border-line sm:gap-3" role="group" aria-label="Eingänge pro Monat">
				{#each rows as r (r.month)}
					<button
						type="button"
						class="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-t-sm outline-none focus-visible:ring-2 focus-visible:ring-accent {hovered ===
						r.month
							? 'bg-sunk/60'
							: ''}"
						aria-label="{monthShort(r.month)}: {r.leads} Eingänge, {r.won} Aufträge"
						onmouseenter={() => (hovered = r.month)}
						onmouseleave={() => (hovered = null)}
						onfocus={() => (hovered = r.month)}
						onblur={() => (hovered = null)}
						onclick={() => (hovered = hovered === r.month ? null : r.month)}
					>
						<span class="num text-[11px] text-muted">{pct(r.won, r.leads, 0)}</span>
						<!-- Stacked segments, 2px surface gap between fills, rounded data end on top. -->
						<span class="flex w-full max-w-10 flex-col-reverse gap-[2px]" style="height:{(r.leads / max) * 85}%">
							{#each present as c, ci (c.key)}
								{@const v = get(r, c.key)}
								{#if v.leads}
									<span
										class="w-full {ci === present.findLastIndex((p) => get(r, p.key).leads > 0) ? 'rounded-t-[4px]' : ''}"
										style="flex:{v.leads} 1 0; background:{c.color}"
									></span>
								{/if}
							{/each}
						</span>
					</button>
				{/each}
			</div>
			<div class="mt-1.5 flex gap-1.5 sm:gap-3">
				{#each rows as r (r.month)}
					<span class="num min-w-0 flex-1 truncate text-center text-[11px] text-faint">{monthShort(r.month)}</span>
				{/each}
			</div>
			<p class="mt-2 text-xs text-muted">Höhe = Eingänge im Monat, Zahl darüber = Abschlussquote.</p>
		</div>
	{:else}
		<Table minWidth="{200 + present.length * 96}px">
			<thead>
				<tr>
					<th>Monat</th>
					{#each present as c (c.key)}<th class="text-right">{c.short}</th>{/each}
					<th class="text-right">Gesamt</th>
					<th class="text-right">Aufträge</th>
					<th class="text-right">Quote</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r (r.month)}
					<tr>
						<td class="whitespace-nowrap">{monthShort(r.month)}</td>
						{#each present as c (c.key)}
							{@const v = get(r, c.key)}
							<td class="num text-right" title="{CHANNEL[c.key].label}: {v.leads} Eingänge, {v.won} Aufträge">
								{#if v.leads}{v.leads} <span class="text-faint">/ {v.won}</span>{:else}<span class="text-faint">—</span>{/if}
							</td>
						{/each}
						<td class="num text-right font-medium">{r.leads}</td>
						<td class="num text-right">{r.won}</td>
						<td class="num text-right">{pct(r.won, r.leads, 0)}</td>
					</tr>
				{/each}
			</tbody>
		</Table>
		<p class="text-xs text-muted">Je Kanal: Eingänge / Aufträge.</p>
	{/if}
</div>
