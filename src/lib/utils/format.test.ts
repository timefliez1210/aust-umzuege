import { describe, it, expect } from 'vitest';
import { formatEuro, formatDate, formatDateTime, parseEuroInput } from './format';

describe('formatEuro', () => {
	it('formats cents to EUR with German locale', () => {
		const result = formatEuro(123456);
		expect(result).toContain('1.234,56');
		expect(result).toContain('€');
	});

	it('formats 0 cents', () => {
		const result = formatEuro(0);
		expect(result).toContain('0,00');
	});

	it('formats negative amounts', () => {
		const result = formatEuro(-500);
		expect(result).toContain('5,00');
	});

	it('handles single cent', () => {
		const result = formatEuro(1);
		expect(result).toContain('0,01');
	});

	it('handles large amounts with thousand separators', () => {
		const result = formatEuro(1000000);
		expect(result).toContain('10.000,00');
	});
});

describe('formatDate', () => {
	it('formats ISO date to German locale', () => {
		expect(formatDate('2026-02-27')).toBe('27.02.2026');
	});

	it('formats ISO datetime to date only', () => {
		const result = formatDate('2026-01-15T14:30:00Z');
		expect(result).toBe('15.01.2026');
	});

	it('zero-pads single-digit day and month', () => {
		expect(formatDate('2026-03-05')).toBe('05.03.2026');
	});
});

describe('formatDateTime', () => {
	it('formats ISO datetime to German locale with time', () => {
		const result = formatDateTime('2026-01-15T14:30:00Z');
		expect(result).toContain('15.01.2026');
		expect(result).toMatch(/\d{2}:\d{2}/);
	});
});

describe('parseEuroInput', () => {
	it('reads the German form Alex types', () => {
		expect(parseEuroInput('1.300,50')).toBe(130050);
		expect(parseEuroInput('1300,50')).toBe(130050);
		expect(parseEuroInput('1300,5')).toBe(130050);
	});

	it('reads a bare dot as a decimal point, the way a numpad produces it', () => {
		expect(parseEuroInput('1300.50')).toBe(130050);
		expect(parseEuroInput('1300')).toBe(130000);
	});

	it('ignores a euro sign and surrounding whitespace', () => {
		expect(parseEuroInput(' 1.300,00 € ')).toBe(130000);
		// Non-breaking space, which is what a copied German amount carries.
		expect(parseEuroInput('1.300,00 €')).toBe(130000);
	});

	it('rounds to whole cents rather than truncating', () => {
		expect(parseEuroInput('0,005')).toBe(1);
		expect(parseEuroInput('10,999')).toBe(1100);
	});

	it('returns null for empty input, so clearing a cell clears the value', () => {
		expect(parseEuroInput('')).toBeNull();
		expect(parseEuroInput('   ')).toBeNull();
	});

	it('returns null for text that is not a number', () => {
		expect(parseEuroInput('abc')).toBeNull();
		expect(parseEuroInput('1,2,3')).toBeNull();
	});

	it('reads a negative amount, which a correction can legitimately be', () => {
		expect(parseEuroInput('-50,00')).toBe(-5000);
	});
});
