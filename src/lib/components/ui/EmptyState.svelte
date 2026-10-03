<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	let { title, hint, children, class: className }: { title: string; hint?: string; children?: Snippet; class?: string } =
		$props();
</script>

<div class={cn('flex flex-col items-center gap-2 rounded-md border border-dashed border-line-strong px-6 py-12 text-center', className)}>
	<p class="text-sm font-medium">{title}</p>
	{#if hint}<p class="max-w-sm text-[13px] text-muted">{hint}</p>{/if}
	{@render children?.()}
</div>
