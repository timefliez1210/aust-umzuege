<script lang="ts" generics="T extends string">
	import { cn } from '$lib/utils/cn';

	/**
	 * Single-choice filter pills. Scrolls sideways on phones instead of wrapping.
	 */
	let {
		options,
		value = $bindable(),
		onchange,
		label = 'Filter',
		class: className
	}: {
		options: { value: T; label: string; count?: number }[];
		value: T;
		onchange?: (v: T) => void;
		label?: string;
		class?: string;
	} = $props();
</script>

<div
	role="tablist"
	aria-label={label}
	class={cn(
		'-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden',
		className
	)}
>
	{#each options as o (o.value)}
		{@const on = o.value === value}
		<button
			type="button"
			role="tab"
			aria-selected={on}
			onclick={() => {
				value = o.value;
				onchange?.(o.value);
			}}
			class={cn(
				'flex h-8 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-[13px] whitespace-nowrap transition-colors',
				on ? 'border-fg bg-fg text-bg' : 'border-line bg-panel text-muted hover:border-line-strong hover:text-fg'
			)}
		>
			{o.label}
			{#if o.count !== undefined}<span class="num text-[11px] opacity-70">{o.count}</span>{/if}
		</button>
	{/each}
</div>
