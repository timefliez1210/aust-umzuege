import { describe, it, expect } from 'vitest';
import {
	rowToLabel,
	calculateLaborCents,
	calculateNonLaborCents,
	calculateBruttoCents,
	calculateLaborProfit,
	reverseCalculateRate,
	isFlatTotalItem,
	normalizeFlatTotalItem,
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

	it('returns 0 for flat-total items (qty=0, price=0) — caller must normalize first', () => {
		// This documents the limitation: flat-total items compute as 0
		// Callers must use normalizeFlatTotalItem() before passing to this function
		const items = [{ quantity: 0, unit_price_cents: 0 }];
		expect(calculateNonLaborCents(items)).toBe(0);
	});

	it('correctly handles normalized flat-total items', () => {
		// After normalization: qty=1, unit_price=total → included in sum
		const items = [
			{ quantity: 1, unit_price_cents: 4500 }, // normalized Fahrkostenpauschale
			{ quantity: 2, unit_price_cents: 5000 },  // De/Montage
		];
		expect(calculateNonLaborCents(items)).toBe(14500);
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

	it('produces correct rate when nonLaborCents includes flat-total amounts', () => {
		// brutto=11900 → netto=10000, flat travel=4500, 2 persons × 3 hours
		// available for labor = 10000 - 4500 = 5500
		// rate = round(5500 / 6) = 917
		expect(reverseCalculateRate(11900, 4500, 2, 3)).toBe(917);
	});

	it('overstates rate when flat-total amounts are excluded (documents the bug)', () => {
		// Same scenario but caller forgot to include flat-total in nonLaborCents
		// rate = round(10000 / 6) = 1667 — WRONG, 750 cents too high
		const buggyRate = reverseCalculateRate(11900, 0, 2, 3);
		const correctRate = reverseCalculateRate(11900, 4500, 2, 3);
		expect(buggyRate).toBe(1667);
		expect(correctRate).toBe(917);
		expect(buggyRate).toBeGreaterThan(correctRate);
	});
});

describe('isFlatTotalItem', () => {
	it('returns true for qty=0, price=0, total>0 (Fahrkostenpauschale pattern)', () => {
		expect(isFlatTotalItem({ quantity: 0, unit_price_cents: 0, total_cents: 4500 })).toBe(true);
	});

	it('returns false for normal items', () => {
		expect(isFlatTotalItem({ quantity: 2, unit_price_cents: 3000, total_cents: 6000 })).toBe(false);
	});

	it('returns false for truly empty items (total=0)', () => {
		expect(isFlatTotalItem({ quantity: 0, unit_price_cents: 0, total_cents: 0 })).toBe(false);
	});

	it('returns false when only quantity is 0 but price is set', () => {
		expect(isFlatTotalItem({ quantity: 0, unit_price_cents: 5000, total_cents: 0 })).toBe(false);
	});
});

describe('normalizeFlatTotalItem', () => {
	it('converts flat-total item to qty=1, unit_price=total', () => {
		const item = { quantity: 0, unit_price_cents: 0, total_cents: 4500 };
		const result = normalizeFlatTotalItem(item);
		expect(result.quantity).toBe(1);
		expect(result.unit_price_cents).toBe(4500);
		expect(result.total_cents).toBe(4500);
	});

	it('leaves normal items unchanged', () => {
		const item = { quantity: 2, unit_price_cents: 3000, total_cents: 6000 };
		const result = normalizeFlatTotalItem(item);
		expect(result.quantity).toBe(2);
		expect(result.unit_price_cents).toBe(3000);
	});

	it('does not mutate the original item', () => {
		const item = { quantity: 0, unit_price_cents: 0, total_cents: 4500 };
		normalizeFlatTotalItem(item);
		expect(item.quantity).toBe(0);
		expect(item.unit_price_cents).toBe(0);
	});

	it('preserves extra fields on the item', () => {
		const item = { quantity: 0, unit_price_cents: 0, total_cents: 4500, label: 'Fahrkostenpauschale', is_labor: false };
		const result = normalizeFlatTotalItem(item);
		expect(result.label).toBe('Fahrkostenpauschale');
		expect(result.is_labor).toBe(false);
		expect(result.quantity).toBe(1);
	});

	it('makes flat-total items compatible with calculateNonLaborCents', () => {
		const flatItem = { quantity: 0, unit_price_cents: 0, total_cents: 4500 };
		const normalItem = { quantity: 2, unit_price_cents: 5000, total_cents: 10000 };

		// Without normalization: flat item contributes 0
		expect(calculateNonLaborCents([flatItem, normalItem])).toBe(10000);

		// With normalization: flat item contributes 4500
		const normalized = normalizeFlatTotalItem(flatItem);
		expect(calculateNonLaborCents([normalized, normalItem])).toBe(14500);
	});
});
