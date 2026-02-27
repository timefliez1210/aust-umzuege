import { describe, it, expect } from 'vitest';
import {
	rowToLabel,
	calculateLaborCents,
	calculateNonLaborCents,
	calculateBruttoCents,
	calculateLaborProfit,
	reverseCalculateRate,
	ROW_OPTIONS,
} from './pricing';

describe('rowToLabel', () => {
	it('returns label for known rows', () => {
		expect(rowToLabel(31)).toBe('De/Montage');
		expect(rowToLabel(32)).toBe('Halteverbotszone');
		expect(rowToLabel(33)).toBe('Umzugsmaterial');
		expect(rowToLabel(39)).toBe('Transporter');
		expect(rowToLabel(42)).toBe('Anfahrt/Abfahrt');
	});

	it('returns Sonstiges for unknown row', () => {
		expect(rowToLabel(99)).toBe('Sonstiges');
		expect(rowToLabel(0)).toBe('Sonstiges');
	});
});

describe('ROW_OPTIONS', () => {
	it('has unique row numbers', () => {
		const rows = ROW_OPTIONS.map(r => r.row);
		expect(new Set(rows).size).toBe(rows.length);
	});
});

describe('calculateLaborCents', () => {
	it('multiplies persons * hours * rate', () => {
		expect(calculateLaborCents(2, 3, 3000)).toBe(18000);
	});

	it('returns 0 when any factor is 0', () => {
		expect(calculateLaborCents(0, 3, 3000)).toBe(0);
		expect(calculateLaborCents(2, 0, 3000)).toBe(0);
		expect(calculateLaborCents(2, 3, 0)).toBe(0);
	});
});

describe('calculateNonLaborCents', () => {
	it('sums quantity * unit_price_cents for all line items', () => {
		const items = [
			{ quantity: 2, unit_price_cents: 5000 },
			{ quantity: 1, unit_price_cents: 3000 },
		];
		expect(calculateNonLaborCents(items)).toBe(13000);
	});

	it('returns 0 for empty array', () => {
		expect(calculateNonLaborCents([])).toBe(0);
	});
});

describe('calculateBruttoCents', () => {
	it('applies 19% VAT', () => {
		expect(calculateBruttoCents(10000)).toBe(11900);
	});

	it('rounds correctly', () => {
		expect(calculateBruttoCents(10001)).toBe(Math.round(10001 * 1.19));
	});

	it('handles 0', () => {
		expect(calculateBruttoCents(0)).toBe(0);
	});
});

describe('calculateLaborProfit', () => {
	it('calculates profit based on rate minus cost', () => {
		// 2 persons * 3 hours * (30.00 - 18.23) = 6 * 11.77 = 70.62
		const profit = calculateLaborProfit(2, 3, 3000);
		expect(profit).toBeCloseTo(70.62, 2);
	});

	it('returns negative when rate is below cost', () => {
		const profit = calculateLaborProfit(2, 3, 1000); // rate = 10.00 EUR/h
		expect(profit).toBeLessThan(0);
	});

	it('accepts custom cost per person hour', () => {
		const profit = calculateLaborProfit(1, 1, 2500, 20);
		expect(profit).toBeCloseTo(5, 2); // 25.00 - 20.00 = 5.00
	});
});

describe('reverseCalculateRate', () => {
	it('reverse-calculates rate from brutto target', () => {
		// brutto = 11900, nonLabor = 0, 2 persons, 3 hours
		// netto = round(11900 / 1.19) = 10000
		// rate = round(10000 / 6) = 1667
		expect(reverseCalculateRate(11900, 0, 2, 3)).toBe(1667);
	});

	it('accounts for non-labor costs', () => {
		const rate = reverseCalculateRate(11900, 5000, 2, 3);
		// netto = 10000, labor budget = 5000, rate = round(5000/6) = 833
		expect(rate).toBe(833);
	});

	it('returns 0 when persons is 0', () => {
		expect(reverseCalculateRate(11900, 0, 0, 3)).toBe(0);
	});

	it('returns 0 when hours is 0', () => {
		expect(reverseCalculateRate(11900, 0, 2, 0)).toBe(0);
	});

	it('returns 0 when available labor budget is negative', () => {
		// netto = round(1190 / 1.19) = 1000, nonLabor = 5000 → available = -4000
		expect(reverseCalculateRate(1190, 5000, 2, 3)).toBe(0);
	});
});
