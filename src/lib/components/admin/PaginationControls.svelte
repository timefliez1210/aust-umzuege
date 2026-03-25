<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	/**
	 * Pagination controls for offset-based list pages.
	 *
	 * Renders a `.pagination` div (styled by `admin-components.css`) with:
	 * - A left chevron button (disabled on first page)
	 * - A "Seite X von Y" label
	 * - A right chevron button (disabled on last page)
	 *
	 * The component is purely presentational: it receives the current state
	 * and calls `onPrev` / `onNext` callbacks. The parent page owns the
	 * offset/limit state and the data reload.
	 *
	 * @example
	 *   <PaginationControls
	 *     page={Math.floor(offset / limit)}
	 *     {total}
	 *     {limit}
	 *     onPrev={() => { offset -= limit; load(); }}
	 *     onNext={() => { offset += limit; load(); }}
	 *   />
	 */

	/**
	 * Component props.
	 *
	 * @prop page   - Current 0-based page index (e.g. offset / limit).
	 * @prop total  - Total number of items across all pages.
	 * @prop limit  - Number of items shown per page.
	 * @prop onPrev - Callback invoked when the user clicks the previous button.
	 * @prop onNext - Callback invoked when the user clicks the next button.
	 */
	let {
		page,
		total,
		limit,
		onPrev,
		onNext
	}: {
		page: number;
		total: number;
		limit: number;
		onPrev: () => void;
		onNext: () => void;
	} = $props();

	/**
	 * Total number of pages, rounded up.
	 *
	 * Called by: Template (label computation).
	 * Purpose: Derive the "von Y" part of the "Seite X von Y" label.
	 *
	 * Math: totalPages = ceil(total / limit)
	 */
	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

	/** True when the user is on the first page. */
	const isFirst = $derived(page <= 0);

	/** True when the user is on the last page. */
	const isLast = $derived((page + 1) * limit >= total);
</script>

<div class="pagination">
	<button onclick={onPrev} disabled={isFirst} aria-label="Vorherige Seite">
		<ChevronLeft size={16} />
	</button>
	<span>Seite {page + 1} von {totalPages}</span>
	<button onclick={onNext} disabled={isLast} aria-label="Nächste Seite">
		<ChevronRight size={16} />
	</button>
</div>
