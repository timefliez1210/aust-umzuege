<script lang="ts">
	import Card from './Card.svelte';
	import Sparkline from './Sparkline.svelte';
	import { cn } from '$lib/utils/cn';
	import { toneText, type Tone } from './tone';

	/** Headline number tile: label, big mono value, optional trend line and delta. */
	let {
		label,
		value,
		delta,
		deltaTone = 'neutral',
		sub,
		spark,
		sparkClass = 'text-muted',
		href,
		valueClass,
		class: className
	}: {
		label: string;
		value: string;
		delta?: string;
		deltaTone?: Tone;
		sub?: string;
		spark?: number[];
		sparkClass?: string;
		href?: string;
		/** e.g. text-danger for a negative result */
		valueClass?: string;
		class?: string;
	} = $props();
</script>

<Card class={cn('@container relative flex flex-col gap-3 p-4', href && 'transition-colors hover:border-line-strong', className)}>
	<span class="label-xs truncate text-faint">
		{#if href}<a {href} class="after:absolute after:inset-0">{label}</a>{:else}{label}{/if}
	</span>
	<div class="flex min-w-0 items-end justify-between gap-2">
		<!-- Size follows the tile width (cqi) so a six-figure amount never gets cut off. -->
		<span class={cn('num text-[clamp(15px,13cqi,30px)] leading-none font-medium tracking-tight whitespace-nowrap', valueClass)}>{value}</span>
		{#if spark && spark.length > 1}
			<Sparkline values={spark} width={80} class={cn('hidden shrink-0 xl:block', sparkClass)} />
		{/if}
	</div>
	{#if delta || sub}
		<p class="num truncate text-xs text-muted">
			{#if delta}<span class={toneText[deltaTone]}>{delta}</span>{/if}
			{sub}
		</p>
	{/if}
</Card>
