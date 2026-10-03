<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * In-place modal for forms that are mounted with `{#if}`: bottom sheet on phones,
	 * centred panel from `sm` up. Esc / backdrop close; the body scrolls, header and
	 * footer stay put.
	 */
	let {
		title,
		onclose,
		size = 'md',
		description,
		class: className,
		children,
		footer,
		headerExtra
	}: {
		title: string;
		onclose: () => void;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		description?: string;
		class?: string;
		children?: Snippet;
		footer?: Snippet;
		headerExtra?: Snippet;
	} = $props();

	const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };
	const titleId = `modal-${Math.random().toString(36).slice(2, 9)}`;
	let panel: HTMLDivElement | undefined = $state();

	$effect(() => {
		panel?.focus();
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});
</script>

<div
	class="fixed inset-0 z-[600] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
	role="presentation"
	data-backdrop
	onclick={onclose}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
>
	<div
		bind:this={panel}
		class={cn(
			'flex max-h-[92dvh] w-full flex-col rounded-t-lg border border-line bg-panel text-fg shadow-2xl outline-none sm:max-h-[88dvh] sm:rounded-md',
			widths[size],
			className
		)}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => {
			if (e.key === 'Escape') onclose();
			e.stopPropagation();
		}}
	>
		<header class="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
			<div class="flex min-w-0 flex-col gap-0.5">
				<h2 id={titleId} class="text-base font-semibold">{title}</h2>
				{#if description}<p class="text-xs text-muted">{description}</p>{/if}
			</div>
			<div class="flex items-center gap-2">
				{@render headerExtra?.()}
				<button
					type="button"
					onclick={onclose}
					aria-label="Schließen"
					class="-mr-2 inline-flex size-9 items-center justify-center rounded-sm text-muted hover:bg-sunk hover:text-fg"
				>
					<X size={18} />
				</button>
			</div>
		</header>
		<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4">
			{@render children?.()}
		</div>
		{#if footer}
			<footer
				class="flex shrink-0 flex-col gap-2 border-t border-line px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:pb-3"
			>
				{@render footer()}
			</footer>
		{/if}
	</div>
</div>
