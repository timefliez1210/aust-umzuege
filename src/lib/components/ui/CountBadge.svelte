<script lang="ts">
	import { cn } from '$lib/utils/cn';

	/** Navigation counter. `hot` = needs attention now (tenant colour). Renders nothing at 0. */
	let { count, hot = false, label, class: className }: { count: number; hot?: boolean; label?: string; class?: string } =
		$props();
</script>

{#if count > 0}
	<span
		class={cn(
			'num inline-flex h-[18px] min-w-5 items-center justify-center rounded-xs px-1.5 text-[11px] leading-none',
			hot ? 'bg-accent text-accent-ink' : 'bg-sunk-2 text-muted',
			className
		)}
		aria-label={label}>{count > 99 ? '99+' : count}</span
	>
{/if}
