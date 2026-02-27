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
