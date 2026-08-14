import { describe, it, expect } from 'vitest';
import {
	isDraft,
	bookingDate,
	yearOf,
	availableYears,
	rowsForYear,
	registerTotals,
	type RegisterRow,
} from './register';

/** Builds a register row; every field has a sane default so tests state only what matters. */
function row(over: Partial<RegisterRow> = {}): RegisterRow {
	return {
		status: 'sent',
		sent_at: '2026-03-14T10:00:00Z',
		paid_at: null,
		created_at: '2026-03-01T10:00:00Z',
		netto_cents: 10000,
		mwst_cents: 1900,
		brutto_cents: 11900,
		offene_zahlungen_cents: 11900,
		...over,
	};
}

describe('isDraft', () => {
	it('treats reserved-but-unissued statuses as drafts', () => {
		for (const status of ['draft', 'ready', 'pending_approval']) {
			expect(isDraft(row({ status, sent_at: null }))).toBe(true);
		}
	});

	it('treats a sent invoice as issued regardless of its status column', () => {
		expect(isDraft(row({ status: 'draft', sent_at: '2026-03-14T10:00:00Z' }))).toBe(false);
	});

	it('treats a paid invoice as issued even when it was never marked sent', () => {
		// Cash jobs get booked paid without a send step; counting them as drafts
		// would drop real revenue out of the register totals.
		expect(isDraft(row({ status: 'draft', sent_at: null, paid_at: '2026-03-20T10:00:00Z' }))).toBe(false);
	});

	it('does not treat an unknown status as a draft', () => {
		expect(isDraft(row({ status: 'cancelled', sent_at: null }))).toBe(false);
	});
});

describe('bookingDate / yearOf', () => {
	it('books an issued invoice under its Rechnungsdatum, not its creation date', () => {
		// A December draft sent in January belongs to the new year — booking it under
		// created_at would move revenue across a tax-year boundary.
		const r = row({ created_at: '2025-12-28T10:00:00Z', sent_at: '2026-01-03T10:00:00Z' });
		expect(bookingDate(r)).toBe('2026-01-03T10:00:00Z');
		expect(yearOf(r)).toBe('2026');
	});

	it('falls back to the creation date for a draft with no invoice date', () => {
		const r = row({ status: 'draft', sent_at: null, created_at: '2025-12-28T10:00:00Z' });
		expect(yearOf(r)).toBe('2025');
	});
});

describe('availableYears', () => {
	it('lists each year once, ascending', () => {
		const rows = [
			row({ sent_at: '2026-02-01T10:00:00Z' }),
			row({ sent_at: '2024-05-01T10:00:00Z' }),
			row({ sent_at: '2026-11-01T10:00:00Z' }),
			row({ sent_at: '2025-01-01T10:00:00Z' }),
		];
		expect(availableYears(rows)).toEqual(['2024', '2025', '2026']);
	});

	it('returns an empty list for no rows', () => {
		expect(availableYears([])).toEqual([]);
	});
});

describe('rowsForYear', () => {
	it('keeps only the selected year', () => {
		const rows = [
			row({ sent_at: '2025-06-01T10:00:00Z' }),
			row({ sent_at: '2026-06-01T10:00:00Z' }),
		];
		expect(rowsForYear(rows, '2026')).toHaveLength(1);
	});

	it('orders the year oldest first, so the ledger reads top to bottom', () => {
		const rows = [
			row({ sent_at: '2026-09-01T10:00:00Z' }),
			row({ sent_at: '2026-01-15T10:00:00Z' }),
			row({ sent_at: '2026-05-20T10:00:00Z' }),
		];
		expect(rowsForYear(rows, '2026').map(bookingDate)).toEqual([
			'2026-01-15T10:00:00Z',
			'2026-05-20T10:00:00Z',
			'2026-09-01T10:00:00Z',
		]);
	});

	it('sorts drafts by creation date alongside issued invoices', () => {
		const rows = [
			row({ sent_at: '2026-05-01T10:00:00Z' }),
			row({ status: 'draft', sent_at: null, created_at: '2026-02-01T10:00:00Z' }),
		];
		expect(rowsForYear(rows, '2026').map(bookingDate)).toEqual([
			'2026-02-01T10:00:00Z',
			'2026-05-01T10:00:00Z',
		]);
	});

	it('does not reorder the caller-owned array', () => {
		const rows = [
			row({ sent_at: '2026-09-01T10:00:00Z' }),
			row({ sent_at: '2026-01-15T10:00:00Z' }),
		];
		const before = rows.map(bookingDate);
		rowsForYear(rows, '2026');
		expect(rows.map(bookingDate)).toEqual(before);
	});
});

describe('registerTotals', () => {
	it('sums the issued invoices', () => {
		const totals = registerTotals([
			row({ netto_cents: 10000, mwst_cents: 1900, brutto_cents: 11900, offene_zahlungen_cents: 11900 }),
			row({ netto_cents: 20000, mwst_cents: 3800, brutto_cents: 23800, offene_zahlungen_cents: 0 }),
		]);
		expect(totals).toEqual({ netto: 30000, mwst: 5700, brutto: 35700, offen: 11900, entwurf: 0 });
	});

	it('excludes drafts from the counted totals and reports them separately', () => {
		// A draft Schlussrechnung holds a reserved number but is not yet a receivable;
		// counting it would overstate revenue in a document the tax office may read.
		const totals = registerTotals([
			row({ netto_cents: 10000, mwst_cents: 1900, brutto_cents: 11900, offene_zahlungen_cents: 11900 }),
			row({
				status: 'draft',
				sent_at: null,
				netto_cents: 50000,
				mwst_cents: 9500,
				brutto_cents: 59500,
				offene_zahlungen_cents: 59500,
			}),
		]);
		expect(totals.netto).toBe(10000);
		expect(totals.brutto).toBe(11900);
		expect(totals.offen).toBe(11900);
		expect(totals.entwurf).toBe(59500);
	});

	it('counts a paid-but-never-sent invoice as issued', () => {
		const totals = registerTotals([
			row({ status: 'draft', sent_at: null, paid_at: '2026-03-20T10:00:00Z', brutto_cents: 11900 }),
		]);
		expect(totals.brutto).toBe(11900);
		expect(totals.entwurf).toBe(0);
	});

	it('treats null and missing amounts as zero rather than producing NaN', () => {
		const totals = registerTotals([
			row({ netto_cents: null, mwst_cents: null, brutto_cents: null, offene_zahlungen_cents: null }),
			row({ netto_cents: undefined, brutto_cents: 11900 }),
		]);
		expect(Number.isNaN(totals.netto)).toBe(false);
		expect(totals.netto).toBe(0);
		expect(totals.brutto).toBe(11900);
	});

	it('returns zeroes for an empty year', () => {
		expect(registerTotals([])).toEqual({ netto: 0, mwst: 0, brutto: 0, offen: 0, entwurf: 0 });
	});

	it('only ever sums the rows it is given, so year scoping is the caller’s contract', () => {
		// The bug behind report 12e2d18f was a footer labelled "Gesamtsumme (Jahr)"
		// that summed every loaded row. Totals are computed from rowsForYear output.
		const rows = [
			row({ sent_at: '2025-06-01T10:00:00Z', brutto_cents: 100000 }),
			row({ sent_at: '2026-06-01T10:00:00Z', brutto_cents: 11900 }),
		];
		expect(registerTotals(rowsForYear(rows, '2026')).brutto).toBe(11900);
		expect(registerTotals(rowsForYear(rows, '2025')).brutto).toBe(100000);
	});
});
