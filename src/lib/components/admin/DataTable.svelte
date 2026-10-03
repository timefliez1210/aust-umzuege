<script lang="ts">
	import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface Column {
		key: string;
		label: string;
		sortable?: boolean;
		width?: string;
	}

	let {
		columns,
		rows,
		sortKey = $bindable(''),
		sortDir = $bindable<'asc' | 'desc'>('desc'),
		onRowClick,
		row: rowSnippet,
		card,
		rowClass,
		emptyMessage = 'Keine Einträge gefunden'
	}: {
		columns: Column[];
		rows: unknown[];
		sortKey?: string;
		sortDir?: 'asc' | 'desc';
		onRowClick?: (row: unknown) => void;
		row: Snippet<[unknown, number]>;
		/** Phone layout for one row. Without it, rows reflow generically into label/value cards. */
		card?: Snippet<[unknown, number]>;
		rowClass?: (row: unknown, i: number) => string | undefined;
		emptyMessage?: string;
	} = $props();

	/**
	 * Handles a click on a sortable column header button.
	 *
	 * Called by: Template (onclick of each sortable column's .sort-btn)
	 * Purpose: Toggles sort direction when the same column is clicked again, or
	 *          switches to descending order when a new column is selected. Updates
	 *          the bindable sortKey and sortDir props so the parent page can
	 *          re-sort its data array accordingly.
	 *
	 * @param key - The column key string that was clicked
	 */
	function handleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'desc';
		}
	}

	/** True below the shared 768px admin mobile breakpoint (same matchMedia pattern as admin/calendar). */
	let isMobile = $state(false);
	$effect(() => {
		// jsdom (unit tests) doesn't implement matchMedia — degrade to desktop mode there.
		if (typeof window.matchMedia !== 'function') return;
		const mq = window.matchMedia('(max-width: 768px)');
		isMobile = mq.matches;
		const handler = (ev: MediaQueryListEvent) => { isMobile = ev.matches; };
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	let tableWrapperEl: HTMLDivElement | undefined = $state();

	/**
	 * Labels each rendered <td> with its column header via a data-label attribute,
	 * consumed by the mobile card-mode CSS (`content: attr(data-label)`).
	 *
	 * Called by: Svelte effect scheduler, after every DOM commit while isMobile is true.
	 * Purpose: The row markup comes from the caller's `row` snippet (DataTable does not
	 *          own those <td> elements), so labels can't be passed in as props — this
	 *          walks the committed DOM instead. Real callers render exactly one <td> per
	 *          column in `columns` order, so index-matching is safe. Skipped entirely
	 *          when rows is empty (that row is the single-cell "empty" placeholder).
	 */
	$effect(() => {
		if (!isMobile || !tableWrapperEl || rows.length === 0) return;
		const trs = tableWrapperEl.querySelectorAll('tbody tr');
		trs.forEach((tr) => {
			const tds = tr.querySelectorAll('td');
			tds.forEach((td, j) => {
				const label = columns[j]?.label;
				if (label) td.setAttribute('data-label', label);
			});
		});
	});
</script>

{#if isMobile && columns.some((c) => c.sortable)}
	<div class="mb-3 flex gap-2">
		<select
			class="h-11 flex-1 rounded-md border border-line bg-panel px-3 text-base text-fg"
			value={sortKey}
			onchange={(e) => handleSort((e.target as HTMLSelectElement).value)}
			aria-label="Sortieren nach"
		>
			{#each columns.filter((c) => c.sortable) as col (col.key)}
				<option value={col.key}>{col.label}</option>
			{/each}
		</select>
		<button
			class="inline-flex size-11 items-center justify-center rounded-md border border-line bg-panel text-muted"
			type="button"
			onclick={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
			aria-label="Sortierrichtung umkehren"
		>
			{#if sortDir === 'asc'}<ArrowUp size={16} />{:else}<ArrowDown size={16} />{/if}
		</button>
	</div>
{/if}

{#if isMobile && card}
	<div class="flex flex-col gap-2">
		{#if rows.length === 0}
			<p class="rounded-md border border-dashed border-line-strong py-10 text-center text-sm text-muted">{emptyMessage}</p>
		{/if}
		{#each rows as item, i (i)}
			{#if onRowClick}
				<button
					type="button"
					class="{rowClass?.(item, i) ?? ''} block w-full rounded-md border border-line bg-panel p-3.5 text-left active:bg-sunk"
					onclick={() => onRowClick?.(item)}
				>
					{@render card(item, i)}
				</button>
			{:else}
				<div class="{rowClass?.(item, i) ?? ''} rounded-md border border-line bg-panel p-3.5">{@render card(item, i)}</div>
			{/if}
		{/each}
	</div>
{:else}
<!--
	Desktop: hairline table. Phones (≤768px): every row reflows into a card — the first
	cell is the title, the rest are "LABEL value" lines (labels come from data-label).
	Cell styling is applied from here because cells are rendered by the caller's snippet.
-->
<div
	bind:this={tableWrapperEl}
	class={isMobile
		? '[&_table]:block [&_tbody]:block [&_thead]:hidden [&_tr]:mb-2.5 [&_tr]:block [&_tr]:rounded-md [&_tr]:border [&_tr]:border-line [&_tr]:bg-panel [&_tr]:px-4 [&_tr]:pt-1 [&_tr]:pb-2 [&_td]:flex [&_td]:items-baseline [&_td]:justify-between [&_td]:gap-3 [&_td]:border-b [&_td]:border-line [&_td]:py-1.5 [&_td]:text-[13px] [&_td:last-child]:border-b-0 [&_td]:before:shrink-0 [&_td]:before:font-mono [&_td]:before:text-[10.5px] [&_td]:before:tracking-wider [&_td]:before:text-faint [&_td]:before:uppercase [&_td]:before:content-[attr(data-label)] [&_td:first-child:not(.empty)]:block [&_td:first-child:not(.empty)]:pt-2.5 [&_td:first-child:not(.empty)]:pb-2 [&_td:first-child:not(.empty)]:text-[15px] [&_td:first-child:not(.empty)]:font-semibold [&_td:first-child:not(.empty)]:before:content-none'
		: 'overflow-x-auto rounded-md border border-line bg-panel [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle [&_tbody_tr]:border-t [&_tbody_tr]:border-line'}
>
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr>
				{#each columns as col (col.key)}
					<th
						style={col.width ? `width: ${col.width}` : ''}
						class="label-xs px-4 py-2.5 text-left font-normal whitespace-nowrap text-faint"
					>
						{#if col.sortable}
							<button
								class="label-xs inline-flex items-center gap-1.5 {sortKey === col.key ? 'text-fg' : 'text-faint hover:text-fg'}"
								onclick={() => handleSort(col.key)}
							>
								{col.label}
								{#if sortKey === col.key}
									{#if sortDir === 'asc'}<ArrowUp size={13} />{:else}<ArrowDown size={13} />{/if}
								{:else}
									<ArrowUpDown size={13} />
								{/if}
							</button>
						{:else}
							{col.label}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#if rows.length === 0}
				<tr>
					<td colspan={columns.length} class="empty !block py-10 text-center text-sm text-muted">{emptyMessage}</td>
				</tr>
			{:else}
				{#each rows as item, i (i)}
					<tr
						class="{rowClass?.(item, i) ?? ''} transition-colors {onRowClick ? 'cursor-pointer hover:bg-sunk' : ''}"
						class:clickable={!!onRowClick}
						onclick={() => onRowClick?.(item)}
						onkeydown={(e) => {
							if (e.key === 'Enter') onRowClick?.(item);
						}}
						tabindex={onRowClick ? 0 : undefined}
						role={onRowClick ? 'button' : undefined}
					>
						{@render rowSnippet(item, i)}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
{/if}
