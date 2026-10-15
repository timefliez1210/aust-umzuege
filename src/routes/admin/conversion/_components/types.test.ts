import { describe, it, expect } from 'vitest';
import { CHANNELS, fmtDays, monthShort, pct, rangeQuery } from './types';

describe('conversion helpers', () => {
	it('formats percentages German-style and guards division by zero', () => {
		expect(pct(1, 3)).toBe('33,3 %');
		expect(pct(1, 4, 0)).toBe('25 %');
		expect(pct(5, 0)).toBe('—');
	});

	it('formats durations', () => {
		expect(fmtDays(null)).toBe('—');
		expect(fmtDays(0.4)).toBe('< 1 Tag');
		expect(fmtDays(1)).toBe('1 Tag');
		expect(fmtDays(2.26)).toBe('2,3 Tage');
	});

	it('builds the range query for each preset', () => {
		const today = new Date(2026, 9, 13);
		expect(rangeQuery('gesamt', today)).toBe('');
		expect(rangeQuery('jahr', today)).toBe('?from=2026-01-01&to=2026-10-13');
		expect(rangeQuery('90d', today)).toBe('?from=2026-07-16&to=2026-10-13');
		expect(rangeQuery('12m', today)).toBe('?from=2025-11-01&to=2026-10-13');
	});

	it('labels months', () => {
		expect(monthShort('2026-03')).toBe('Mär 26');
	});

	it('keeps one fixed colour slot per channel', () => {
		expect(new Set(CHANNELS.map((c) => c.color)).size).toBe(CHANNELS.length);
	});
});
