<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Loader } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	/** Button that disables itself and shows a spinner while `loading`. */
	let {
		loading = false,
		disabled = false,
		variant = 'primary',
		size = 'default',
		type = 'button',
		onclick,
		children
	}: {
		loading?: boolean;
		disabled?: boolean;
		variant?: 'primary' | 'ghost' | 'danger';
		size?: 'default' | 'sm';
		type?: 'button' | 'submit';
		onclick?: () => void | Promise<void>;
		children: Snippet;
	} = $props();

	const map = { primary: 'solid', ghost: 'outline', danger: 'danger' } as const;
</script>

<Button
	{type}
	variant={map[variant]}
	size={size === 'sm' ? 'sm' : 'md'}
	data-variant={variant}
	data-size={size}
	disabled={loading || disabled}
	{onclick}
>
	{#if loading}<Loader size={15} class="animate-spin" aria-hidden="true" />{/if}
	{@render children()}
</Button>
