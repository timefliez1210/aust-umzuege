<script lang="ts">
	import { tenant } from '$lib/tenant.svelte';
	import { cn } from '$lib/utils/cn';

	let { class: className }: { class?: string } = $props();
</script>

<span
	aria-hidden="true"
	class={cn(
		'num inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-accent text-[13px] font-semibold text-accent-ink',
		className
	)}>{tenant.mark}</span
>
