<script lang="ts">
	import { Search, X } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Search field that reports after the user pauses typing (and on Enter).
	 */
	let {
		value = $bindable(''),
		onsearch,
		placeholder = 'Suchen …',
		delay = 300,
		class: className
	}: {
		value?: string;
		onsearch?: (v: string) => void;
		placeholder?: string;
		delay?: number;
		class?: string;
	} = $props();

	let timer: ReturnType<typeof setTimeout> | undefined;
	function schedule() {
		clearTimeout(timer);
		timer = setTimeout(() => onsearch?.(value), delay);
	}
	function now() {
		clearTimeout(timer);
		onsearch?.(value);
	}
</script>

<label
	class={cn(
		'flex h-9 items-center gap-2 rounded-sm border border-line-strong bg-panel px-3 text-faint focus-within:border-fg',
		className
	)}
>
	<Search size={15} strokeWidth={1.8} class="shrink-0" />
	<input
		type="search"
		bind:value
		{placeholder}
		oninput={schedule}
		onkeydown={(e) => e.key === 'Enter' && now()}
		class="h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
	/>
	{#if value}
		<button
			type="button"
			aria-label="Suche leeren"
			class="inline-flex size-6 items-center justify-center rounded-xs hover:bg-sunk hover:text-fg"
			onclick={() => {
				value = '';
				now();
			}}><X size={14} /></button
		>
	{/if}
</label>
