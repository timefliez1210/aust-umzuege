<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Card title row: heading + optional one-line meta on the left, actions on the right.
	 */
	let {
		title,
		meta,
		actions,
		class: className
	}: { title: string; meta?: string | Snippet; actions?: Snippet; class?: string } = $props();
</script>

<header class={cn('flex items-start justify-between gap-3 px-4 py-3.5', className)}>
	<div class="flex min-w-0 flex-col gap-1">
		<h2 class="text-[15px] font-semibold leading-tight">{title}</h2>
		{#if typeof meta === 'string'}
			<p class="num truncate text-xs text-muted">{meta}</p>
		{:else if meta}
			{@render meta()}
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</header>
