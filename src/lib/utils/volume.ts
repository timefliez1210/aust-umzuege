export function computeTotalVolume(
	items: { volume_m3: number; quantity: number }[]
): number {
	return items.reduce((sum, item) => sum + item.volume_m3 * item.quantity, 0);
}
