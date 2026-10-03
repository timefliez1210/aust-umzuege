<script lang="ts" generics="T extends string">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/** Two-to-four way switch (e.g. Bestehend / Neu anlegen). */
	let {
		options,
		value = $bindable(),
		onchange,
		label,
		size = 'md',
		class: className
	}: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		options: { value: T; label: string; icon?: Component<any> | any }[];
		value: T;
		onchange?: (v: T) => void;
		label?: string;
		size?: 'sm' | 'md';
		class?: string;
	} = $props();
</script>

<div
	role="group"
	aria-label={label}
	class={cn('inline-flex gap-0.5 rounded-md border border-line bg-sunk p-0.5', className)}
>
	{#each options as o (o.value)}
		{@const on = o.value === value}
		<button
			type="button"
			aria-pressed={on}
			onclick={() => {
				value = o.value;
				onchange?.(o.value);
			}}
			class={cn(
				'flex items-center justify-center gap-1.5 rounded-sm border px-3 whitespace-nowrap transition-colors',
				size === 'sm' ? 'h-7 text-xs' : 'h-8 text-[13px]',
				on ? 'border-line-strong bg-panel text-fg' : 'border-transparent text-muted hover:text-fg'
			)}
		>
			{#if o.icon}<o.icon size={14} strokeWidth={1.8} />{/if}
			{o.label}
		</button>
	{/each}
</div>
