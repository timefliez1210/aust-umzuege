<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Page title row: optional mono eyebrow, the title with an optional count, actions
	 * on the right (wrap under the title on phones).
	 */
	let {
		title,
		eyebrow,
		count,
		back,
		actions,
		class: className
	}: {
		title: string;
		eyebrow?: string;
		count?: string | number;
		back?: Snippet;
		actions?: Snippet;
		class?: string;
	} = $props();
</script>

<header class={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-4', className)}>
	<div class="flex min-w-0 flex-col gap-1.5">
		{#if back}{@render back()}{/if}
		{#if eyebrow}<span class="label-xs text-faint">{eyebrow}</span>{/if}
		<div class="flex min-w-0 items-baseline gap-3">
			<h1 class="truncate text-[26px] leading-none font-semibold tracking-[-0.03em] sm:text-[30px]">{title}</h1>
			{#if count !== undefined}<span class="num text-sm text-faint">{count}</span>{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</header>
