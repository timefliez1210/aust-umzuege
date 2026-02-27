import { describe, it, expect } from 'vitest';
import { computeTotalVolume } from './volume';

describe('computeTotalVolume', () => {
	it('sums volume * quantity for all items', () => {
		const items = [
			{ volume_m3: 0.5, quantity: 2 },
			{ volume_m3: 1.0, quantity: 1 },
		];
		expect(computeTotalVolume(items)).toBeCloseTo(2.0);
	});

	it('returns 0 for empty array', () => {
		expect(computeTotalVolume([])).toBe(0);
	});

	it('handles fractional volumes', () => {
		const items = [{ volume_m3: 0.333, quantity: 3 }];
		expect(computeTotalVolume(items)).toBeCloseTo(0.999);
	});

	it('handles single item', () => {
		const items = [{ volume_m3: 2.5, quantity: 4 }];
		expect(computeTotalVolume(items)).toBeCloseTo(10.0);
	});
});
