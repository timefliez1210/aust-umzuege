import { describe, it, expect } from 'vitest';
import {
	kvaDate, yearOf, availableYears, rowsForYear, parseOfferNumber, compareByNumber,
	kvaKpis, monthlySummaries, followupRows, dateMissingRows, staleRows,
	matchesFilters, viewRows, foldForSearch, hasActiveFilters, NO_FILTERS,
	type KvaRow
} from './kvaBuch';

/** A KVA row with sane defaults; override only what a test cares about. */
function row(over: Partial<KvaRow> = {}): KvaRow {
	return {
		id: crypto.randomUUID(),
		inquiry_id: crypto.randomUUID(),
		offer_number: '2026-0001',
		pdf_s3_key: null,
		customer_name: 'Test Kunde',
		scheduled_date: '2026-09-01',
		netto_cents: 100_000,
		mwst_cents: 19_000,
		brutto_cents: 119_000,
		created_at: '2026-03-15T10:00:00Z',
		sent_at: null,
		valid_until: null,
		invoice_number: null,
		lage: 'offen',
		age_days: 5,
		needs_followup: false,
		followup_date_missing: false,
		move_date_passed: false,
		followup_muted: false,
		followup_last_pinged_on: null,
		...over
	};
}

describe('kvaDate / yearOf', () => {
	it('falls back to created_at, because sent_at is almost never set', () => {
		expect(kvaDate(row({ sent_at: null, created_at: '2026-03-15T10:00:00Z' })))
			.toBe('2026-03-15T10:00:00Z');
	});

	it('prefers sent_at when it is present', () => {
		expect(kvaDate(row({ sent_at: '2026-04-01T08:00:00Z' }))).toBe('2026-04-01T08:00:00Z');
	});

	it('derives the year from the KVA date, not the move date', () => {
		expect(yearOf(row({ created_at: '2025-12-31T23:00:00Z', scheduled_date: '2026-01-05' })))
			.toBe('2025');
	});

	it('lists years ascending and de-duplicated', () => {
		const rows = [
			row({ created_at: '2026-01-01T00:00:00Z' }),
			row({ created_at: '2024-05-01T00:00:00Z' }),
			row({ created_at: '2026-07-01T00:00:00Z' })
		];
		expect(availableYears(rows)).toEqual(['2024', '2026']);
		expect(rowsForYear(rows, '2026')).toHaveLength(2);
	});
});

describe('parseOfferNumber / compareByNumber', () => {
	it('parses the YYYY-NNNN form', () => {
		expect(parseOfferNumber('2026-0131')).toEqual([2026, 131]);
		expect(parseOfferNumber('2026-131')).toEqual([2026, 131]);
	});

	it('rejects anything else', () => {
		expect(parseOfferNumber(null)).toBeNull();
		expect(parseOfferNumber('Angebot')).toBeNull();
		expect(parseOfferNumber('26-1')).toBeNull();
	});

	it('orders by year then sequence, padded and unpadded alike', () => {
		const sorted = [
			row({ offer_number: '2026-0010' }),
			row({ offer_number: '2026-2' }),
			row({ offer_number: '2025-0999' })
		].sort(compareByNumber);
		expect(sorted.map((r) => r.offer_number)).toEqual(['2025-0999', '2026-2', '2026-0010']);
	});

	it('puts unnumbered KVAs last', () => {
		const sorted = [
			row({ offer_number: null, created_at: '2026-01-01T00:00:00Z' }),
			row({ offer_number: '2026-0005' })
		].sort(compareByNumber);
		expect(sorted[0].offer_number).toBe('2026-0005');
	});
});

describe('kvaKpis', () => {
	it('splits won / lost / open and ignores offers.status entirely', () => {
		// Every row carries the same useless "draft" offer status; only `lage` counts.
		const rows = [
			row({ lage: 'gewonnen', netto_cents: 100_000 }),
			row({ lage: 'gewonnen', netto_cents: 200_000 }),
			row({ lage: 'verloren', netto_cents: 400_000 }),
			row({ lage: 'offen', netto_cents: 50_000 })
		];
		const k = kvaKpis(rows);
		expect(k.count).toBe(4);
		expect(k.volumeNetto).toBe(750_000);
		expect(k.wonCount).toBe(2);
		expect(k.wonNetto).toBe(300_000);
		expect(k.lostCount).toBe(1);
		expect(k.openCount).toBe(1);
	});

	it('computes the win rate over decided KVAs only', () => {
		const rows = [
			row({ lage: 'gewonnen' }), row({ lage: 'gewonnen' }), row({ lage: 'gewonnen' }),
			row({ lage: 'verloren' }),
			// Ten open KVAs must not drag the rate towards zero.
			...Array.from({ length: 10 }, () => row({ lage: 'offen' }))
		];
		expect(kvaKpis(rows).winRateByCount).toBeCloseTo(0.75, 5);
	});

	it('weights the value rate by netto, so big losses show up', () => {
		const rows = [
			row({ lage: 'gewonnen', netto_cents: 100_000 }),
			row({ lage: 'verloren', netto_cents: 300_000 })
		];
		const k = kvaKpis(rows);
		// Even split by count, badly lopsided by value — the gap is the point.
		expect(k.winRateByCount).toBeCloseTo(0.5, 5);
		expect(k.winRateByValue).toBeCloseTo(0.25, 5);
	});

	it('returns null rates when nothing has been decided yet', () => {
		const k = kvaKpis([row({ lage: 'offen' }), row({ lage: 'offen' })]);
		expect(k.winRateByCount).toBeNull();
		expect(k.winRateByValue).toBeNull();
		expect(k.avgWonNetto).toBeNull();
		expect(k.avgLostNetto).toBeNull();
	});

	it('reports averages so a systematic loss of the bigger jobs is visible', () => {
		const rows = [
			row({ lage: 'gewonnen', netto_cents: 150_000 }),
			row({ lage: 'gewonnen', netto_cents: 170_000 }),
			row({ lage: 'verloren', netto_cents: 400_000 })
		];
		const k = kvaKpis(rows);
		expect(k.avgWonNetto).toBe(160_000);
		expect(k.avgLostNetto).toBe(400_000);
	});

	it('separates the dead open pipeline from the live one', () => {
		const rows = [
			row({ lage: 'offen', netto_cents: 100_000, move_date_passed: false }),
			row({ lage: 'offen', netto_cents: 300_000, move_date_passed: true })
		];
		const k = kvaKpis(rows);
		expect(k.openNetto).toBe(400_000);
		expect(k.deadOpenCount).toBe(1);
		expect(k.deadOpenNetto).toBe(300_000);
		// The honest number: only a quarter of "offen" is actually still winnable.
		expect(k.liveOpenNetto).toBe(100_000);
	});

	it('counts the Nachfassliste', () => {
		const rows = [
			row({ needs_followup: true, netto_cents: 100_000 }),
			row({ needs_followup: true, netto_cents: 180_600 }),
			row({ needs_followup: false, netto_cents: 900_000 })
		];
		const k = kvaKpis(rows);
		expect(k.followupCount).toBe(2);
		expect(k.followupNetto).toBe(280_600);
	});

	it('handles an empty year without dividing by zero', () => {
		const k = kvaKpis([]);
		expect(k.count).toBe(0);
		expect(k.volumeNetto).toBe(0);
		expect(k.winRateByCount).toBeNull();
		expect(k.liveOpenNetto).toBe(0);
	});
});

describe('monthlySummaries', () => {
	it('always returns twelve months so the chart axis stays stable', () => {
		const months = monthlySummaries([row({ created_at: '2026-06-15T10:00:00Z' })]);
		expect(months).toHaveLength(12);
		expect(months[0].count).toBe(0);
		expect(months[5].count).toBe(1);
		expect(months[5].label).toBe('Juni');
	});

	it('tracks quoted volume against won volume per month', () => {
		const months = monthlySummaries([
			row({ created_at: '2026-03-01T00:00:00Z', lage: 'gewonnen', netto_cents: 100_000 }),
			row({ created_at: '2026-03-20T00:00:00Z', lage: 'verloren', netto_cents: 300_000 }),
			row({ created_at: '2026-03-25T00:00:00Z', lage: 'offen', netto_cents: 50_000 })
		]);
		const march = months[2];
		expect(march.count).toBe(3);
		expect(march.volumeNetto).toBe(450_000);
		expect(march.wonNetto).toBe(100_000);
		expect(march.wonCount).toBe(1);
		expect(march.lostCount).toBe(1);
		expect(march.openCount).toBe(1);
	});

	it('buckets by the KVA date, not the move date', () => {
		const months = monthlySummaries([
			row({ created_at: '2026-01-20T00:00:00Z', scheduled_date: '2026-11-01' })
		]);
		expect(months[0].count).toBe(1);
		expect(months[10].count).toBe(0);
	});
});

describe('Nachfassliste', () => {
	it('lists only flagged rows, most valuable first', () => {
		const rows = [
			row({ offer_number: '2026-0210', needs_followup: true, netto_cents: 100_800 }),
			row({ offer_number: '2026-0256', needs_followup: true, netto_cents: 180_600 }),
			row({ offer_number: '2026-0300', needs_followup: false, netto_cents: 900_000 })
		];
		expect(followupRows(rows).map((r) => r.offer_number)).toEqual(['2026-0256', '2026-0210']);
	});

	it('keeps date-less overdue KVAs in their own list, oldest first', () => {
		const rows = [
			row({ offer_number: 'A', followup_date_missing: true, age_days: 26 }),
			row({ offer_number: 'B', followup_date_missing: true, age_days: 130 }),
			row({ offer_number: 'C', followup_date_missing: false })
		];
		expect(dateMissingRows(rows).map((r) => r.offer_number)).toEqual(['B', 'A']);
	});

	it('never lets a date-less KVA onto the nag list', () => {
		// Liveness is unprovable without a move date, so it must not be chased.
		const rows = [row({ needs_followup: false, followup_date_missing: true })];
		expect(followupRows(rows)).toHaveLength(0);
	});

	it('collects open KVAs whose move already happened, soonest-past first', () => {
		const rows = [
			row({ offer_number: 'A', move_date_passed: true, scheduled_date: '2026-08-18' }),
			row({ offer_number: 'B', move_date_passed: true, scheduled_date: '2026-06-30' }),
			row({ offer_number: 'C', move_date_passed: false })
		];
		expect(staleRows(rows).map((r) => r.offer_number)).toEqual(['B', 'A']);
	});
});

describe('filters', () => {
	it('detects an active filter', () => {
		expect(hasActiveFilters(NO_FILTERS)).toBe(false);
		expect(hasActiveFilters({ ...NO_FILTERS, month: 3 })).toBe(true);
		expect(hasActiveFilters({ ...NO_FILTERS, lage: 'offen' })).toBe(true);
		expect(hasActiveFilters({ ...NO_FILTERS, search: '  ' })).toBe(false);
	});

	it('filters by month using the KVA date', () => {
		const r = row({ created_at: '2026-06-15T10:00:00Z' });
		expect(matchesFilters(r, { ...NO_FILTERS, month: 5 })).toBe(true);
		expect(matchesFilters(r, { ...NO_FILTERS, month: 6 })).toBe(false);
	});

	it('filters by Lage', () => {
		const won = row({ lage: 'gewonnen' });
		expect(matchesFilters(won, { ...NO_FILTERS, lage: 'gewonnen' })).toBe(true);
		expect(matchesFilters(won, { ...NO_FILTERS, lage: 'verloren' })).toBe(false);
	});

	it('has a dedicated Nachfassen filter that is not a Lage', () => {
		const chase = row({ lage: 'offen', needs_followup: true });
		const quiet = row({ lage: 'offen', needs_followup: false });
		expect(matchesFilters(chase, { ...NO_FILTERS, lage: 'nachfassen' })).toBe(true);
		expect(matchesFilters(quiet, { ...NO_FILTERS, lage: 'nachfassen' })).toBe(false);
	});

	it('searches number, customer and invoice number, ignoring accents and case', () => {
		const r = row({ offer_number: '2026-0086', customer_name: 'Claudia Krinzner', invoice_number: '2026-45' });
		expect(matchesFilters(r, { ...NO_FILTERS, search: 'krinzner' })).toBe(true);
		expect(matchesFilters(r, { ...NO_FILTERS, search: '0086' })).toBe(true);
		expect(matchesFilters(r, { ...NO_FILTERS, search: '2026-45' })).toBe(true);
		expect(matchesFilters(r, { ...NO_FILTERS, search: 'Fischer' })).toBe(false);
	});

	it('folds umlauts so "muller" finds "Müller"', () => {
		expect(foldForSearch('Müller')).toBe('muller');
		const r = row({ customer_name: 'Müller' });
		expect(matchesFilters(r, { ...NO_FILTERS, search: 'muller' })).toBe(true);
	});
});

describe('viewRows', () => {
	it('defaults to register order', () => {
		const rows = [row({ offer_number: '2026-0010' }), row({ offer_number: '2026-0002' })];
		expect(viewRows(rows, NO_FILTERS, null).map((r) => r.offer_number))
			.toEqual(['2026-0002', '2026-0010']);
	});

	it('sorts by a column in both directions', () => {
		const rows = [
			row({ offer_number: 'A', netto_cents: 300 }),
			row({ offer_number: 'B', netto_cents: 100 }),
			row({ offer_number: 'C', netto_cents: 200 })
		];
		expect(viewRows(rows, NO_FILTERS, { key: 'netto', dir: 'asc' }).map((r) => r.offer_number))
			.toEqual(['B', 'C', 'A']);
		expect(viewRows(rows, NO_FILTERS, { key: 'netto', dir: 'desc' }).map((r) => r.offer_number))
			.toEqual(['A', 'C', 'B']);
	});

	it('keeps empty cells last in BOTH directions', () => {
		const rows = [
			row({ offer_number: 'A', scheduled_date: null }),
			row({ offer_number: 'B', scheduled_date: '2026-09-01' }),
			row({ offer_number: 'C', scheduled_date: '2026-07-01' })
		];
		expect(viewRows(rows, NO_FILTERS, { key: 'service', dir: 'asc' }).map((r) => r.offer_number))
			.toEqual(['C', 'B', 'A']);
		// A missing Leistungsdatum is "no value", not a small one — it must not lead.
		expect(viewRows(rows, NO_FILTERS, { key: 'service', dir: 'desc' }).map((r) => r.offer_number))
			.toEqual(['B', 'C', 'A']);
	});

	it('breaks ties on register order, not array position', () => {
		const rows = [
			row({ offer_number: '2026-0009', netto_cents: 100 }),
			row({ offer_number: '2026-0003', netto_cents: 100 })
		];
		expect(viewRows(rows, NO_FILTERS, { key: 'netto', dir: 'asc' }).map((r) => r.offer_number))
			.toEqual(['2026-0003', '2026-0009']);
	});

	it('does not mutate the input order of the caller array', () => {
		const rows = [row({ offer_number: '2026-0010' }), row({ offer_number: '2026-0002' })];
		const before = rows.map((r) => r.offer_number);
		viewRows(rows, NO_FILTERS, { key: 'netto', dir: 'desc' });
		expect(rows.map((r) => r.offer_number)).toEqual(before);
	});

	it('applies filter and sort together', () => {
		const rows = [
			row({ offer_number: 'A', lage: 'gewonnen', netto_cents: 100 }),
			row({ offer_number: 'B', lage: 'verloren', netto_cents: 900 }),
			row({ offer_number: 'C', lage: 'gewonnen', netto_cents: 300 })
		];
		const out = viewRows(rows, { ...NO_FILTERS, lage: 'gewonnen' }, { key: 'netto', dir: 'desc' });
		expect(out.map((r) => r.offer_number)).toEqual(['C', 'A']);
	});
});
