<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Info, AlertTriangle, CircleAlert } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/** Inline callout: info (neutral hint), warn (needs attention), danger (error). */
	let {
		tone = 'info',
		children,
		actions,
		class: className
	}: { tone?: 'info' | 'warn' | 'danger'; children?: Snippet; actions?: Snippet; class?: string } = $props();

	const styles = {
		info: 'border-info/35 bg-info/8',
		warn: 'border-warn/40 bg-warn/8',
		danger: 'border-danger/40 bg-danger/8'
	};
	const iconTone = { info: 'text-info', warn: 'text-warn', danger: 'text-danger' };
</script>

<div
	class={cn('flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border px-3.5 py-2.5 text-[13px]', styles[tone], className)}
	role={tone === 'danger' ? 'alert' : 'note'}
>
	<span class="mt-0.5 shrink-0 {iconTone[tone]}">
		{#if tone === 'danger'}<CircleAlert size={15} />{:else if tone === 'warn'}<AlertTriangle size={15} />{:else}<Info size={15} />{/if}
	</span>
	<div class="min-w-0 flex-1 leading-relaxed">{@render children?.()}</div>
	{#if actions}<div class="flex shrink-0 gap-2">{@render actions()}</div>{/if}
</div>
