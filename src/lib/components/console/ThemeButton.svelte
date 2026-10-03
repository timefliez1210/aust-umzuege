<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	/** Icon-only theme switch for tight headers. */
	let { class: className }: { class?: string } = $props();
</script>

<Button
	variant="outline"
	size="icon-lg"
	class={className}
	aria-label={theme.resolved === 'dark' ? 'Helles Design' : 'Dunkles Design'}
	onclick={() => theme.toggle()}
>
	{#if theme.resolved === 'dark'}<Sun size={18} strokeWidth={1.8} />{:else}<Moon size={18} strokeWidth={1.8} />{/if}
</Button>
