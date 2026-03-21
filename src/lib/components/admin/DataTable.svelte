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
		emptyMessage = 'Keine Eintraege gefunden'
	}: {
		columns: Column[];
		rows: unknown[];
		sortKey?: string;
		sortDir?: 'asc' | 'desc';
		onRowClick?: (row: unknown) => void;
		row: Snippet<[unknown, number]>;
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
</script>

<div class="table-wrapper">
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

	@media (max-width: 768px) {
		td, th {
			padding: 8px 0.6rem;
			font-size: 0.8125rem;
		}

		th {
			white-space: normal;
		}
	}
</style>
