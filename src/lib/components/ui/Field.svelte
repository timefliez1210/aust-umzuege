<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/** Label above a control. Pass `for` to link it to the control's id. */
	let {
		label,
		for: htmlFor,
		hint,
		class: className,
		children
	}: { label: string; for?: string; hint?: string; class?: string; children?: Snippet } = $props();
</script>

<div class={cn('flex flex-col gap-1.5', className)}>
	<label for={htmlFor} class="text-xs font-medium text-muted">{label}</label>
	{@render children?.()}
	{#if hint}<p class="text-xs text-faint">{hint}</p>{/if}
</div>
