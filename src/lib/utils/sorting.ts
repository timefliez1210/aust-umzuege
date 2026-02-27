/**
 * Returns a sorted copy of an array of objects by a chosen key.
 *
 * Called by: quotes/[id]/+page.svelte (as part of a reactive $derived display list
 *            combining filter and sort for inventory items)
 * Purpose: Provides locale-aware, direction-togglable sorting for any tabular
 *          list in the admin so columns can be clicked to re-order rows without
 *          mutating the underlying data
 *
 * @param items - Array of objects of type T to sort
 * @param sortKey - The property key of T to sort by, or null to return items unsorted
 * @param ascending - Sort direction; true for A-Z / low-to-high, false for Z-A / high-to-low
 * @returns A new sorted array (original array is not mutated); strings use de locale collation
 */
export function sortItems<T>(
	items: T[],
	sortKey: keyof T | null,
	ascending: boolean = true
): T[] {
	if (!sortKey) return items;
	const dir = ascending ? 1 : -1;
	return [...items].sort((a, b) => {
		const av = a[sortKey];
		const bv = b[sortKey];
		if (typeof av === 'string' && typeof bv === 'string') {
			return av.localeCompare(bv, 'de') * dir;
		}
		return ((av as number) - (bv as number)) * dir;
	});
}

/**
 * Filters an array of inventory items to those associated with a specific photo index.
 *
 * Called by: quotes/[id]/+page.svelte (as part of a reactive $derived display list
 *            when the admin selects a photo in the depth-sensor/video estimation panel)
 * Purpose: Narrows the visible item list to only those items that were detected in
 *          or linked to a particular photo frame, enabling per-image review of the
 *          AI-generated inventory
 *
 * @param items - Array of items, each optionally carrying bbox_image_index and seen_in_images
 * @param filterIndex - Photo index to filter by, or null to return all items unfiltered
 * @returns Filtered array containing only items whose bbox_image_index matches filterIndex
 *          or whose seen_in_images array includes filterIndex
 */
export function filterItemsByPhotoIndex<
	T extends { bbox_image_index?: number | null; seen_in_images?: number[] | null }
>(items: T[], filterIndex: number | null): T[] {
	if (filterIndex === null) return items;
	return items.filter(
		item =>
			item.bbox_image_index === filterIndex ||
			(item.seen_in_images && item.seen_in_images.includes(filterIndex))
	);
}
