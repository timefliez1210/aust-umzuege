<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronRight } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Card with a title row that can fold away. Collapsible when `onToggle` is given;
	 * `summary` shows next to the title while folded (e.g. a total), `actions` while open.
	 */
	let {
		title,
		open = true,
		onToggle,
		actions,
		summary,
		children,
		class: className,
		bodyClass
	}: {
		title: string;
		open?: boolean;
		onToggle?: () => void;
		actions?: Snippet;
		summary?: Snippet;
		children?: Snippet;
		class?: string;
		bodyClass?: string;
	} = $props();
</script>

<section class={cn('min-w-0 rounded-md border border-line bg-panel', className)}>
	<header class="flex min-h-12 items-center justify-between gap-3 px-4 py-2.5">
		{#if onToggle}
			<button
				type="button"
				class="group -my-1 flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
				onclick={onToggle}
				aria-expanded={open}
			>
				<ChevronRight
					size={16}
					class="shrink-0 text-faint transition-transform duration-150 {open ? 'rotate-90' : ''}"
				/>
				<h3 class="truncate text-[15px] font-semibold group-hover:text-accent-text">{title}</h3>
			</button>
		{:else}
			<h3 class="truncate text-[15px] font-semibold">{title}</h3>
		{/if}
		{#if !open && summary}
			<div class="flex shrink-0 items-center gap-2">{@render summary()}</div>
		{/if}
		{#if open && actions}
			<div class="flex shrink-0 flex-wrap items-center justify-end gap-2">{@render actions()}</div>
		{/if}
	</header>
	{#if open}
		<div class={cn('border-t border-line px-4 py-4', bodyClass)}>
			{@render children?.()}
		</div>
	{/if}
</section>
