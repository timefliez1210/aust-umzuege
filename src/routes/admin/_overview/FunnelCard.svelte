<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import { formatEuroWhole } from '$lib/utils/format';
	import type { Overview } from './types';

	/** Inquiries of the last 90 days by how far they got. */
	let { funnel, pipeline }: { funnel: Overview['funnel']; pipeline: Overview['pipeline'] } = $props();

	const stages = $derived.by(() => {
		const raw = [
			{ label: 'Anfragen', n: funnel.inquiries },
			{ label: 'Volumen geschätzt', n: funnel.estimated },
			{ label: 'Angebot erstellt', n: funnel.offered },
			{ label: 'Angenommen', n: funnel.won },
			{ label: 'Abgerechnet', n: funnel.invoiced }
		];
		const top = Math.max(1, funnel.inquiries);
		return raw.map((s, i) => ({
			...s,
			width: (s.n / top) * 100,
			conv: i > 0 && raw[i - 1].n > 0 ? `${Math.round((s.n / raw[i - 1].n) * 100)} %` : '',
			won: i >= 3
		}));
	});
</script>

<Card>
	<CardHeader title="Trichter">
		{#snippet actions()}<span class="label-xs text-faint">90 Tage</span>{/snippet}
	</CardHeader>
	<div class="flex flex-col gap-3.5 px-4 pt-1 pb-4">
		{#each stages as s (s.label)}
			<div class="flex flex-col gap-1.5">
				<div class="flex items-baseline justify-between gap-2 text-[13px]">
					<span>{s.label}</span>
					<span class="num"><span class="mr-2 text-[11px] text-faint">{s.conv}</span>{s.n}</span>
				</div>
				<div class="h-2 rounded-xs bg-sunk">
					<div class="h-full rounded-xs {s.won ? 'bg-accent' : 'bg-bar-strong'}" style="width: {s.width}%"></div>
				</div>
			</div>
		{/each}
		<p class="border-t border-line pt-3 text-[12.5px] text-muted">
			Annahmequote
			<span class="num text-fg">{pipeline.win_rate === null ? '—' : `${Math.round(pipeline.win_rate * 100)} %`}</span>
			{#if pipeline.avg_won_netto_cents}
				· Ø Auftrag <span class="num text-fg">{formatEuroWhole(pipeline.avg_won_netto_cents)}</span>
			{/if}
		</p>
	</div>
</Card>
