<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import { formatEuroWhole, formatEuroCompact } from '$lib/utils/format';
	import type { Overview } from './types';

	/**
	 * Twelve Leistungsmonate as bars: the full bar is netto revenue, the tenant-coloured
	 * part at its foot is the Gewinn tab's result (admins only). A loss month gets a
	 * red foot instead. The current month is drawn at full strength, the rest muted.
	 */
	let { months }: { months: Overview['revenue'] } = $props();

	const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const max = $derived(Math.max(1, ...months.map((m) => m.revenue_cents)));
	const showResult = $derived(months.some((m) => m.result_cents !== null));
	const totalRevenue = $derived(months.reduce((s, m) => s + m.revenue_cents, 0));
	const totalResult = $derived(months.reduce((s, m) => s + (m.result_cents ?? 0), 0));
	const meta = $derived(
		showResult
			? `12 Monate · ${formatEuroWhole(totalRevenue)} Umsatz · ${formatEuroWhole(totalResult)} Ergebnis`
			: `12 Monate · ${formatEuroWhole(totalRevenue)} Umsatz netto`
	);

	const bars = $derived(
		months.map((m, i) => {
			const current = i === months.length - 1;
			const result = m.result_cents ?? 0;
			return {
				label: MONTHS[Number(m.month.slice(5, 7)) - 1],
				current,
				height: (m.revenue_cents / max) * 86,
				resultShare: m.revenue_cents > 0 ? Math.min(1, Math.max(0, result) / m.revenue_cents) * 100 : 0,
				loss: showResult && result < 0,
				title: `${MONTHS[Number(m.month.slice(5, 7)) - 1]} ${m.month.slice(0, 4)}: ${formatEuroWhole(m.revenue_cents)} Umsatz${
					m.result_cents !== null ? ` · ${formatEuroWhole(result)} Ergebnis` : ''
				}`,
				top: current || m.revenue_cents === max ? formatEuroCompact(m.revenue_cents) : ''
			};
		})
	);
</script>

<Card>
	<CardHeader title={showResult ? 'Umsatz & Ergebnis' : 'Umsatz'} {meta}>
		{#snippet actions()}
			<span class="hidden items-center gap-3.5 text-xs text-muted sm:flex">
				<span class="flex items-center gap-1.5"><span class="size-2.5 bg-bar-strong"></span>Umsatz</span>
				{#if showResult}<span class="flex items-center gap-1.5"><span class="size-2.5 bg-accent"></span>Ergebnis</span>{/if}
			</span>
		{/snippet}
	</CardHeader>
	<div class="px-4 pt-1 pb-4">
		<div
			class="grid h-52 grid-cols-12 items-end gap-1.5 border-b border-line-strong sm:gap-2"
			role="img"
			aria-label="Umsatz der letzten 12 Monate"
		>
			{#each bars as b, i (i)}
				<div class="flex h-full flex-col justify-end gap-1.5" title={b.title}>
					<span class="num text-center text-[10.5px] {b.current ? 'text-fg' : 'text-muted'}">{b.top}</span>
					<div
						class="flex flex-col justify-end overflow-hidden rounded-t-xs {b.current ? 'bg-bar-strong' : 'bg-bar'}"
						style="height: {b.height}%"
					>
						{#if b.loss}
							<div class="h-[3px] bg-danger"></div>
						{:else}
							<div class={b.current ? 'bg-accent' : 'bg-accent/50'} style="height: {b.resultShare}%"></div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="grid grid-cols-12 gap-1.5 pt-2 sm:gap-2">
			{#each bars as b, i (i)}
				<span class="num text-center text-[10.5px] {b.current ? 'text-fg' : 'text-faint'}">{b.label}</span>
			{/each}
		</div>
	</div>
</Card>
