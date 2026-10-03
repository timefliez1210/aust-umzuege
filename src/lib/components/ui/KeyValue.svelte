<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/** One "label — value" line of a read-only info block. */
	let { label, children, class: className }: { label: string; children?: Snippet; class?: string } = $props();
</script>

<div class={cn('grid grid-cols-[96px_minmax(0,1fr)] items-baseline gap-3 py-1.5 sm:grid-cols-[120px_minmax(0,1fr)]', className)}>
	<dt class="label-xs text-faint">{label}</dt>
	<dd class="min-w-0 text-sm break-words">{@render children?.()}</dd>
</div>
