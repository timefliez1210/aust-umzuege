<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';

	let { class: className, children, ...rest }: HTMLAttributes<HTMLElement> & { children?: Snippet } = $props();
</script>

<section class={cn('min-w-0 rounded-md border border-line bg-panel', className)} {...rest}>
	{@render children?.()}
</section>
