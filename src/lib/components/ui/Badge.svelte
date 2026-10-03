<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { toneChip, type Tone } from './tone';

	/** Small outlined status chip — mono, 11px. */
	let {
		tone = 'neutral',
		class: className,
		children,
		...rest
	}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children?: Snippet } = $props();
</script>

<span
	class={cn(
		'num inline-flex h-5 shrink-0 items-center gap-1 rounded-xs border px-1.5 text-[11px] leading-none whitespace-nowrap',
		toneChip[tone],
		className
	)}
	{...rest}>{@render children?.()}</span
>
