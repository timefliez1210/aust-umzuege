<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';
	import { panels } from './panels.svelte';

	/** Opens the ⌘K palette. Wide on desktop, icon-only on phones. */
	let { compact = false, class: className }: { compact?: boolean; class?: string } = $props();
	const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
</script>

{#if compact}
	<button
		type="button"
		onclick={() => (panels.palette = true)}
		aria-label="Suchen"
		class={cn('inline-flex size-11 items-center justify-center rounded-md border border-line bg-panel', className)}
	>
		<Search size={18} strokeWidth={1.8} />
	</button>
{:else}
	<button
		type="button"
		onclick={() => (panels.palette = true)}
		class={cn(
			'flex h-9 min-w-64 items-center gap-2.5 rounded-sm border border-line-strong bg-panel px-3 text-[13px] text-faint hover:text-muted',
			className
		)}
	>
		<Search size={15} strokeWidth={1.8} />
		<span class="flex-1 text-left">Kunde, Anfrage, Seite …</span>
		<kbd class="num rounded-xs border border-line-strong px-1.5 text-[11px]">{isMac ? '⌘' : 'Strg'} K</kbd>
	</button>
{/if}
