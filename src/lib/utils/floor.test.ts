import { describe, it, expect } from 'vitest';
import { floorLabel, parseFloor } from './floor';

describe('floorLabel', () => {
	it('returns EG for null', () => {
		expect(floorLabel(null)).toBe('EG');
	});

	it('maps known floors', () => {
		expect(floorLabel('0')).toBe('Erdgeschoss');
		expect(floorLabel('1')).toBe('1. OG');
		expect(floorLabel('2')).toBe('2. OG');
		expect(floorLabel('3')).toBe('3. OG');
		expect(floorLabel('4')).toBe('4. OG');
		expect(floorLabel('5')).toBe('5. OG');
		expect(floorLabel('-1')).toBe('Keller');
	});

	it('generates label for unknown floors', () => {
		expect(floorLabel('8')).toBe('8. OG');
		expect(floorLabel('10')).toBe('10. OG');
	});
});

describe('parseFloor', () => {
	it('returns 0 for null', () => {
		expect(parseFloor(null)).toBe(0);
	});

	it('returns 0 for ground floor variants', () => {
		expect(parseFloor('Erdgeschoss')).toBe(0);
		expect(parseFloor('Hochparterre')).toBe(0);
		expect(parseFloor('0')).toBe(0);
	});

	it('returns 7 for "Höher als 6. Stock"', () => {
		expect(parseFloor('Höher als 6. Stock')).toBe(7);
	});

	it('extracts leading digits', () => {
		expect(parseFloor('3. Stock')).toBe(3);
		expect(parseFloor('1. OG')).toBe(1);
		expect(parseFloor('6')).toBe(6);
	});

	it('trims whitespace', () => {
		expect(parseFloor('  Erdgeschoss  ')).toBe(0);
		expect(parseFloor('  3. Stock ')).toBe(3);
	});

	it('returns 0 for non-numeric strings', () => {
		expect(parseFloor('Dachgeschoss')).toBe(0);
	});
});
