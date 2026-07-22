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
		rowClass,
		emptyMessage = 'Keine Eintraege gefunden'
	}: {
		columns: Column[];
		rows: unknown[];
		sortKey?: string;
		sortDir?: 'asc' | 'desc';
		onRowClick?: (row: unknown) => void;
		row: Snippet<[unknown, number]>;
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
	<div class="mobile-sort">
		<select
			class="mobile-sort-select"
			value={sortKey}
			onchange={(e) => handleSort((e.target as HTMLSelectElement).value)}
			aria-label="Sortieren nach"
		>
			{#each columns.filter((c) => c.sortable) as col}
				<option value={col.key}>{col.label}</option>
			{/each}
		</select>
		<button
			class="mobile-sort-dir"
			type="button"
			onclick={() => (sortDir = sortDir === 'asc' ? 'desc' : 'asc')}
			aria-label="Sortierrichtung umkehren"
		>
			{#if sortDir === 'asc'}
				<ArrowUp size={16} />
			{:else}
				<ArrowDown size={16} />
			{/if}
		</button>
	</div>
{/if}

<div class="table-wrapper" bind:this={tableWrapperEl}>
	<table>
		<thead>
			<tr>
				{#each columns as col}
					<th style={col.width ? `width: ${col.width}` : ''}>
						{#if col.sortable}
							<button class="sort-btn" onclick={() => handleSort(col.key)}>
								{col.label}
								{#if sortKey === col.key}
									{#if sortDir === 'asc'}
										<ArrowUp size={14} />
									{:else}
										<ArrowDown size={14} />
									{/if}
								{:else}
									<ArrowUpDown size={14} />
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
					<td colspan={columns.length} class="empty">{emptyMessage}</td>
				</tr>
			{:else}
				{#each rows as item, i}
					<tr
						class={rowClass?.(item, i) ?? ''}
						class:clickable={!!onRowClick}
						onclick={() => onRowClick?.(item)}
						onkeydown={(e) => { if (e.key === 'Enter') onRowClick?.(item); }}
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

<style>
	.table-wrapper {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	thead {
		background: var(--dt-surface-container-high);
	}

	th {
		padding: 8px 1rem;
		text-align: left;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	td {
		padding: 8px 1rem;
		color: var(--dt-on-surface);
	}

	tbody tr {
		transition: background var(--dt-transition);
	}

	tbody tr:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	tbody tr:nth-child(odd) {
		background: var(--dt-surface-container-lowest);
	}

	tbody tr:hover {
		background: var(--dt-surface-container-low);
	}

	tr.clickable {
		cursor: pointer;
	}

	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--dt-on-surface-variant);
		font-weight: 500;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		transition: color var(--dt-transition);
	}

	.sort-btn:hover {
		color: var(--dt-on-surface);
	}

	.empty {
		text-align: center;
		color: var(--dt-on-surface-variant);
		padding: 2rem 1rem;
	}

	.mobile-sort {
		display: none;
	}

	@media (max-width: 768px) {
		td, th {
			padding: 8px 0.6rem;
			font-size: 0.8125rem;
		}

		th {
			white-space: normal;
		}

		/* Compact sort control shown above the card list — the header row (and
		 * its sort buttons) is hidden in card mode, so this is the only sort UI. */
		.mobile-sort {
			display: flex;
			gap: 0.5rem;
			margin-bottom: 0.75rem;
		}

		.mobile-sort-select {
			flex: 1;
			min-height: 44px;
			font-size: 16px;
			padding: 0 0.75rem;
			border-radius: var(--dt-radius-md);
			border: none;
			background: var(--dt-surface-container-lowest);
			color: var(--dt-on-surface);
		}

		.mobile-sort-dir {
			min-height: 44px;
			min-width: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: var(--dt-radius-md);
			border: none;
			background: var(--dt-surface-container-lowest);
			color: var(--dt-on-surface-variant);
		}

		/* ─── Card mode: table/thead/tbody/tr reflow as a stacked card list ── */

		table {
			display: block;
		}

		thead {
			display: none;
		}

		tbody {
			display: block;
		}

		tbody tr {
			display: block;
			border-radius: var(--dt-radius-md);
			padding: 0.25rem 1rem 0.5rem;
			margin-bottom: 0.75rem;
			background: var(--dt-surface-container-lowest);
			box-shadow: var(--dt-shadow-ambient);
		}

		tbody tr:nth-child(even),
		tbody tr:nth-child(odd) {
			background: var(--dt-surface-container-lowest);
		}

		/* Each td is a label:value line; the label comes from the data-label
		 * attribute set by the mobile-labeling effect in <script>. */
		td {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			gap: 0.75rem;
			padding: 0.375rem 0;
			border-bottom: 1px solid var(--dt-surface-container-high);
		}

		td:last-child {
			border-bottom: none;
		}

		td::before {
			content: attr(data-label);
			font-weight: 500;
			font-size: 12px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--dt-on-surface-variant);
			flex-shrink: 0;
		}

		/* First column is the card title: full-width, bold, no label prefix. */
		tr td:first-child:not(.empty) {
			display: block;
			font-weight: 600;
			font-size: 0.9375rem;
			color: var(--dt-on-surface);
			padding: 0.625rem 0 0.5rem;
		}

		tr td:first-child:not(.empty)::before {
			content: none;
		}

		td.empty {
			display: block;
			text-align: center;
			border-bottom: none;
		}

		td.empty::before {
			content: none;
		}
	}
</style>
