import { describe, it, expect } from 'vitest';
import { formatEuro, formatDate, formatDateTime } from './format';

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
