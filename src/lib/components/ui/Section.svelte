<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/** A titled block inside a form or modal (no card chrome). */
	let {
		title,
		actions,
		children,
		class: className
	}: { title: string; actions?: Snippet; children?: Snippet; class?: string } = $props();
</script>

<section class={cn('flex flex-col gap-3 border-b border-line py-5 first:pt-0 last:border-b-0 last:pb-0', className)}>
	<div class="flex items-center justify-between gap-3">
		<h3 class="label-xs text-faint">{title}</h3>
		{@render actions?.()}
	</div>
	{@render children?.()}
</section>
