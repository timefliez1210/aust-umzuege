/**
 * Computes the combined cubic-metre volume of all inventory items in a quote.
 *
 * Called by: quotes/[id]/+page.svelte (as a reactive $derived value for the volume summary)
 * Purpose: Gives the admin an at-a-glance total volume figure to help assess
 *          the size and complexity of a move without manually summing items
 *
 * @param items - Array of inventory items, each carrying volume_m3 and quantity fields
 * @returns Total volume in cubic metres as a floating-point number
 *
 * Math: total = sum(item.volume_m3 * item.quantity)
 */
export function computeTotalVolume(
	items: { volume_m3: number; quantity: number }[]
): number {
	return items.reduce((sum, item) => sum + item.volume_m3 * item.quantity, 0);
}
