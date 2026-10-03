<script lang="ts">
	import { cn } from '$lib/utils/cn';

	/**
	 * Tiny trend line, no axes. Colour comes from `class` via currentColor
	 * (e.g. `text-muted`, `text-accent`).
	 */
	let {
		values,
		width = 96,
		height = 32,
		class: className
	}: { values: number[]; width?: number; height?: number; class?: string } = $props();

	const PAD = 3;
	const points = $derived.by(() => {
		if (values.length < 2) return [];
		const min = Math.min(...values);
		const span = Math.max(...values) - min || 1;
		return values.map((v, i) => [
			PAD + (i * (width - 2 * PAD)) / (values.length - 1),
			height - PAD - ((v - min) / span) * (height - 2 * PAD)
		]);
	});
	const last = $derived(points.at(-1));
</script>

{#if points.length > 1 && last}
	<svg {width} {height} viewBox="0 0 {width} {height}" class={cn('shrink-0', className)} aria-hidden="true">
		<polyline
			points={points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
		<circle cx={last[0]} cy={last[1]} r="2.5" fill="currentColor" />
	</svg>
{/if}
