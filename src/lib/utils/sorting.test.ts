import { describe, it, expect } from 'vitest';
import { sortItems, filterItemsByPhotoIndex } from './sorting';

describe('sortItems', () => {
	const items = [
		{ name: 'Tisch', quantity: 2, volume_m3: 0.5 },
		{ name: 'Stuhl', quantity: 4, volume_m3: 0.2 },
		{ name: 'Bett', quantity: 1, volume_m3: 1.0 },
	];

	it('returns items unchanged when sortKey is null', () => {
		expect(sortItems(items, null)).toEqual(items);
	});

	it('sorts strings with German locale ascending', () => {
		const sorted = sortItems(items, 'name', true);
		expect(sorted.map(i => i.name)).toEqual(['Bett', 'Stuhl', 'Tisch']);
	});

	it('sorts strings descending', () => {
		const sorted = sortItems(items, 'name', false);
		expect(sorted.map(i => i.name)).toEqual(['Tisch', 'Stuhl', 'Bett']);
	});

	it('sorts numbers ascending', () => {
		const sorted = sortItems(items, 'volume_m3', true);
		expect(sorted.map(i => i.volume_m3)).toEqual([0.2, 0.5, 1.0]);
	});

	it('sorts numbers descending', () => {
		const sorted = sortItems(items, 'volume_m3', false);
		expect(sorted.map(i => i.volume_m3)).toEqual([1.0, 0.5, 0.2]);
	});

	it('does not mutate original array', () => {
		const original = [...items];
		sortItems(items, 'name', true);
		expect(items).toEqual(original);
	});
});

describe('filterItemsByPhotoIndex', () => {
	const items = [
		{ name: 'A', bbox_image_index: 0, seen_in_images: [0, 1] },
		{ name: 'B', bbox_image_index: 1, seen_in_images: [1] },
		{ name: 'C', bbox_image_index: null, seen_in_images: [0, 2] },
		{ name: 'D', bbox_image_index: 2, seen_in_images: null },
	];

	it('returns all items when filterIndex is null', () => {
		expect(filterItemsByPhotoIndex(items, null)).toHaveLength(4);
	});

	it('filters by bbox_image_index match', () => {
		const result = filterItemsByPhotoIndex(items, 2);
		expect(result.map(i => i.name)).toContain('D');
	});

	it('filters by seen_in_images match', () => {
		const result = filterItemsByPhotoIndex(items, 0);
		expect(result.map(i => i.name)).toEqual(expect.arrayContaining(['A', 'C']));
	});

	it('matches items by either bbox_image_index or seen_in_images', () => {
		const result = filterItemsByPhotoIndex(items, 1);
		expect(result.map(i => i.name)).toEqual(expect.arrayContaining(['A', 'B']));
	});

	it('returns empty array when no items match', () => {
		const result = filterItemsByPhotoIndex(items, 99);
		expect(result).toHaveLength(0);
	});
});
