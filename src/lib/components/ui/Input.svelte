<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { fieldClass } from './field';

	let { value = $bindable(), class: className, ...rest }: HTMLInputAttributes = $props();
</script>

<input bind:value class={cn(fieldClass, 'h-9', className)} {...rest} />
