<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Hairline table for ledger-style lists. Write plain <thead>/<tbody>/<tr>/<th>/<td>
	 * inside; spacing, header style and row rules come from here. Scrolls sideways on
	 * phones — pass `minWidth` (e.g. "720px") for wide tables.
	 */
	let {
		children,
		minWidth,
		class: className,
		bare = false
	}: { children?: Snippet; minWidth?: string; class?: string; bare?: boolean } = $props();
</script>

<div class={cn('overflow-x-auto', !bare && 'rounded-md border border-line bg-panel', className)}>
	<table
		style:min-width={minWidth}
		class="w-full border-collapse text-sm [&_tbody_tr]:border-b [&_tbody_tr]:border-line [&_tbody_tr:last-child]:border-b-0 [&_td]:px-3 [&_td]:py-2 [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_tfoot_tr]:border-t [&_tfoot_tr]:border-line-strong [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-normal [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 [&_thead_th]:label-xs [&_thead_th]:whitespace-nowrap [&_thead_th]:text-faint [&_thead_tr]:border-b [&_thead_tr]:border-line"
	>
		{@render children?.()}
	</table>
</div>
