<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	/** Checkbox with its label; the tenant colour fills the box. */
	let {
		checked = $bindable(false),
		class: className,
		children,
		...rest
	}: HTMLInputAttributes & { checked?: boolean; children?: Snippet } = $props();
</script>

<label class={cn('inline-flex min-h-8 cursor-pointer items-center gap-2 text-[13px] text-fg select-none', className)}>
	<input type="checkbox" bind:checked class="size-4 shrink-0 cursor-pointer accent-[var(--accent)]" {...rest} />
	{@render children?.()}
</label>
