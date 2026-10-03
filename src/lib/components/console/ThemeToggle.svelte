<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { cn } from '$lib/utils/cn';

	/** Segmented Hell / Dunkel switch. */
	let { class: className }: { class?: string } = $props();

	const options = [
		{ value: 'light', label: 'Hell', icon: Sun },
		{ value: 'dark', label: 'Dunkel', icon: Moon }
	] as const;
</script>

<div
	role="group"
	aria-label="Darstellung"
	class={cn('grid grid-cols-2 gap-0.5 rounded-md border border-line bg-sunk p-0.5', className)}
>
	{#each options as o (o.value)}
		{@const on = theme.resolved === o.value}
		<button
			type="button"
			aria-pressed={on}
			onclick={() => theme.set(o.value)}
			class={cn(
				'flex h-8 items-center justify-center gap-1.5 rounded-sm border text-[12.5px] transition-colors',
				on ? 'border-line-strong bg-panel text-fg' : 'border-transparent text-muted hover:text-fg'
			)}
		>
			<o.icon size={14} strokeWidth={1.8} />
			{o.label}
		</button>
	{/each}
</div>
