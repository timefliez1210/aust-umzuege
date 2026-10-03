<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { X } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Modal surface. `bottom` = phone sheet sliding up, `right` = side panel,
	 * `center` = classic dialog. Focus trap, Esc and outside-click come from bits-ui.
	 */
	let {
		open = $bindable(false),
		side = 'center',
		title,
		description,
		hideTitle = false,
		class: className,
		children,
		footer,
		onOpenChange
	}: {
		open?: boolean;
		side?: 'bottom' | 'right' | 'center';
		title: string;
		description?: string;
		hideTitle?: boolean;
		class?: string;
		children?: Snippet;
		footer?: Snippet;
		onOpenChange?: (open: boolean) => void;
	} = $props();

	const position = {
		bottom:
			'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-lg border-t pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-[sheet-up_180ms_ease-out]',
		right:
			'inset-y-0 right-0 w-full max-w-md border-l data-[state=open]:animate-[sheet-left_180ms_ease-out]',
		center:
			'top-1/2 left-1/2 max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border'
	};
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[600] bg-black/50 backdrop-blur-[1px]" />
		<Dialog.Content
			class={cn(
				'fixed z-[601] flex flex-col border-line bg-panel text-fg shadow-2xl outline-none',
				position[side],
				className
			)}
		>
			<header class={cn('flex items-center justify-between gap-3 px-4 pt-3.5 pb-2', hideTitle && 'sr-only')}>
				<div class="flex min-w-0 flex-col">
					<Dialog.Title class="text-[15px] font-semibold">{title}</Dialog.Title>
					{#if description}
						<Dialog.Description class="text-xs text-muted">{description}</Dialog.Description>
					{/if}
				</div>
				<Dialog.Close
					class="inline-flex size-9 items-center justify-center rounded-sm text-muted hover:bg-sunk hover:text-fg"
					aria-label="Schließen"
				>
					<X size={18} />
				</Dialog.Close>
			</header>
			<div class="min-h-0 flex-1 overflow-y-auto">
				{@render children?.()}
			</div>
			{#if footer}
				<footer class="flex justify-end gap-2 border-t border-line px-4 py-3">{@render footer()}</footer>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
