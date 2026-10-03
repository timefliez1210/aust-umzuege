<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { toneFill, type Tone } from './tone';

	let { tone = 'neutral', class: className }: { tone?: Tone; class?: string } = $props();
</script>

<span aria-hidden="true" class={cn('inline-block size-2 shrink-0 rounded-full', toneFill[tone], className)}></span>
