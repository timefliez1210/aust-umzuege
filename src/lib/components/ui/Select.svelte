<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { fieldClass } from './field';

	/** Native select — best on phones, styled to match. */
	let {
		value = $bindable(),
		class: className,
		children,
		...rest
	}: HTMLSelectAttributes & { children?: Snippet } = $props();
</script>

<select
	bind:value
	class={cn(
		fieldClass,
		"h-9 appearance-none bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8 bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")]",
		className
	)}
	{...rest}
>
	{@render children?.()}
</select>
