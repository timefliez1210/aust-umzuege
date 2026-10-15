import { describe, it, expect } from 'vitest';
import { BANDS, bandOf, sizeStats } from './orderSize';
import type { Lead } from './types';

const lead = (value: number, outcome: Lead['outcome']): Lead => ({
	id: crypto.randomUUID(),
	channel: 'telefon',
	at: '2026-06-01T10:00:00Z',
	name: null,
	inquiry_id: null,
	stage: 3,
	outcome,
	reason: null,
	value_cents: value,
	days_to_kva: null,
	days_to_order: null
});

describe('order size', () => {
	it('puts every amount into exactly one band', () => {
		expect(bandOf(99_999)).toBe(0);
		expect(bandOf(100_000)).toBe(1);
		expect(bandOf(250_000)).toBe(2);
		expect(bandOf(2_600_000)).toBe(BANDS.length - 1);
	});

	it('summarises KVA and order sizes', () => {
		const s = sizeStats([lead(50_000, 'won'), lead(300_000, 'won'), lead(150_000, 'lost')]);
		expect(s.kvas).toBe(3);
		expect(s.medianKva).toBe(150_000);
		expect(s.won).toBe(2);
		expect(s.avgWon).toBe(175_000);
		expect(s.bigWon).toBe(1);
		expect(s.bigWonCents).toBe(300_000);
		expect(s.maxWon).toBe(300_000);
	});

	it('handles a channel without orders', () => {
		const s = sizeStats([lead(80_000, 'lost')]);
		expect(s.avgWon).toBeNull();
		expect(s.maxWon).toBeNull();
	});
});
