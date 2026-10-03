<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils/cn';
	import { fieldClass } from './field';

	let { value = $bindable(), class: className, ...rest }: HTMLTextareaAttributes = $props();
</script>

<textarea bind:value class={cn(fieldClass, 'min-h-20 py-2 leading-relaxed', className)} {...rest}></textarea>
