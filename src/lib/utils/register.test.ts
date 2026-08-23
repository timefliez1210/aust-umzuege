import { describe, it, expect } from 'vitest';
import {
	isDraft,
	bookingDate,
	yearOf,
	parseInvoiceNumber,
	compareByNumber,
	availableYears,
	rowsForYear,
	registerTotals,
	formatServicePeriod,
	monthOf,
	monthlySummaries,
	dueOn,
	isOverdue,
	matchesFilters,
	hasActiveFilters,
	viewRows,
	registerKpis,
	daysBetween,
	NO_FILTERS,
	MONTH_LABELS,
	type RegisterRow,
	type RegisterFilters,
} from './register';

let seq = 0;

/**
 * Builds a register row; every field has a sane default so tests state only what matters.
 *
 * The invoice number defaults to one drawn from the row's own booking year, because
 * that is the invariant the real data has — a row's number prefix and its booking
 * date agree unless the invoice was issued in the January after the job.
 */
function row(over: Partial<RegisterRow> = {}): RegisterRow {
	const merged = {
		status: 'sent',
		sent_at: '2026-03-14T10:00:00Z' as string | null,
		paid_at: null as string | null,
		created_at: '2026-03-01T10:00:00Z',
		netto_cents: 10000 as number | null,
		mwst_cents: 1900 as number | null,
		brutto_cents: 11900 as number | null,
		offene_zahlungen_cents: 11900 as number | null,
		...over,
	};
	const year = (merged.sent_at ?? merged.created_at).substring(0, 4);
	return { invoice_number: `${year}-${++seq}`, ...merged };
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

describe('parseInvoiceNumber', () => {
	it('reads padded and unpadded numbers as the same entry', () => {
		// Numbers issued before 2026-08-21 came from a global sequence and are
		// four-digit padded; they stay as printed on the customers' invoices, so one
		// register year legitimately contains both forms.
		expect(parseInvoiceNumber('2026-0087')).toEqual([2026, 87]);
		expect(parseInvoiceNumber('2026-87')).toEqual([2026, 87]);
		expect(parseInvoiceNumber(' 2026-87 ')).toEqual([2026, 87]);
	});

	it('rejects anything that is not YYYY-N', () => {
		for (const bad of ['TEST-abc', '2026', '26-1', '2026-', '2026-1a', '']) {
			expect(parseInvoiceNumber(bad)).toBeNull();
		}
	});
});

describe('bookingDate / yearOf', () => {
	it('books an issued invoice under its Rechnungsdatum, not its creation date', () => {
		const r = row({ created_at: '2025-12-28T10:00:00Z', sent_at: '2026-01-03T10:00:00Z' });
		expect(bookingDate(r)).toBe('2026-01-03T10:00:00Z');
		expect(yearOf(r)).toBe('2026');
	});

	it('books a December job invoiced in January into the January book', () => {
		// Alex's 2026-02 carries a Leistungsdatum of 23.12.2025 and sits in the 2026
		// book: the number, not the date, decides which ledger a row belongs to.
		const r = row({
			invoice_number: '2026-02',
			sent_at: '2025-12-23T10:00:00Z',
			created_at: '2025-12-20T10:00:00Z',
		});
		expect(yearOf(r)).toBe('2026');
	});

	it('falls back to the booking date when the number cannot be parsed', () => {
		const r = row({ invoice_number: 'Storno-A', sent_at: null, created_at: '2025-12-28T10:00:00Z' });
		expect(yearOf(r)).toBe('2025');
	});
});

describe('availableYears', () => {
	it('lists each year once, ascending', () => {
		const rows = [
			row({ invoice_number: '2026-01' }),
			row({ invoice_number: '2024-01' }),
			row({ invoice_number: '2026-02' }),
			row({ invoice_number: '2025-01' }),
		];
		expect(availableYears(rows)).toEqual(['2024', '2025', '2026']);
	});

	it('returns an empty list for no rows', () => {
		expect(availableYears([])).toEqual([]);
	});
});

describe('compareByNumber', () => {
	it('orders numerically, not lexically', () => {
		const nums = ['2026-11', '2026-2', '2026-0001', '2025-99', '2026-10'];
		const sorted = nums.map((n) => row({ invoice_number: n })).sort(compareByNumber);
		expect(sorted.map((r) => r.invoice_number)).toEqual([
			'2025-99',
			'2026-0001',
			'2026-2',
			'2026-10',
			'2026-11',
		]);
	});

	it('puts unparseable numbers last instead of dropping them', () => {
		const nums = ['Storno-B', '2026-99', 'Storno-A'];
		const sorted = nums.map((n) => row({ invoice_number: n })).sort(compareByNumber);
		expect(sorted.map((r) => r.invoice_number)).toEqual(['2026-99', 'Storno-A', 'Storno-B']);
	});
});

describe('rowsForYear', () => {
	it('keeps only the selected year', () => {
		const rows = [row({ invoice_number: '2025-01' }), row({ invoice_number: '2026-01' })];
		expect(rowsForYear(rows, '2026')).toHaveLength(1);
	});

	it('orders the year by invoice number, not by date', () => {
		// The register is read as a number sequence and Alex's dates are not
		// monotonic: his 2026-25 is dated 29.05. and 2026-26 is dated 13.03.
		// A date sort scrambles the very sequence the book exists to show.
		const rows = [
			row({ invoice_number: '2026-26', sent_at: '2026-03-13T10:00:00Z' }),
			row({ invoice_number: '2026-25', sent_at: '2026-05-29T10:00:00Z' }),
			row({ invoice_number: '2026-24', sent_at: '2026-03-31T10:00:00Z' }),
		];
		expect(rowsForYear(rows, '2026').map((r) => r.invoice_number)).toEqual([
			'2026-24',
			'2026-25',
			'2026-26',
		]);
	});

	it('interleaves a Lagerung row into the sequence by its number', () => {
		// Storage invoices share the number space and belong in the same running list.
		const rows = [
			row({ invoice_number: '2026-63' }),
			row({ invoice_number: '2026-62' }), // Lagerung Engelhardt
			row({ invoice_number: '2026-61' }),
		];
		expect(rowsForYear(rows, '2026').map((r) => r.invoice_number)).toEqual([
			'2026-61',
			'2026-62',
			'2026-63',
		]);
	});

	it('keeps drafts in number order alongside issued invoices', () => {
		const rows = [
			row({ invoice_number: '2026-05' }),
			row({ invoice_number: '2026-04', status: 'draft', sent_at: null }),
		];
		expect(rowsForYear(rows, '2026').map((r) => r.invoice_number)).toEqual(['2026-04', '2026-05']);
	});

	it('does not reorder the caller-owned array', () => {
		const rows = [row({ invoice_number: '2026-09' }), row({ invoice_number: '2026-01' })];
		const before = rows.map((r) => r.invoice_number);
		rowsForYear(rows, '2026');
		expect(rows.map((r) => r.invoice_number)).toEqual(before);
	});
});

describe('formatServicePeriod', () => {
	it('collapses a span inside one month the way Alex writes it', () => {
		expect(formatServicePeriod('2026-01-12', '2026-01-13')).toBe('12.-13.01.2026');
	});

	it('spells out a span across months or years', () => {
		expect(formatServicePeriod('2025-11-07', '2026-01-30')).toBe('07.11.2025-30.01.2026');
		expect(formatServicePeriod('2026-03-24', '2026-09-30')).toBe('24.03.2026-30.09.2026');
	});

	it('shows a single day as that day', () => {
		expect(formatServicePeriod('2026-02-24', '2026-02-24')).toBe('24.02.2026');
		expect(formatServicePeriod('2026-02-24', null)).toBe('24.02.2026');
	});

	it('reads a full timestamp, not just a bare date', () => {
		expect(formatServicePeriod('2026-02-24T00:00:00Z', null)).toBe('24.02.2026');
	});

	it('does not shift the date across a timezone boundary', () => {
		// `new Date('2026-01-01')` is UTC midnight, which renders as 31.12.2025 in any
		// zone behind UTC — the dates here are split textually for exactly that reason.
		expect(formatServicePeriod('2026-01-01', null)).toBe('01.01.2026');
	});

	it('shows an end before the start as the start alone, not a backwards range', () => {
		expect(formatServicePeriod('2026-05-02', '2026-04-01')).toBe('02.05.2026');
	});

	it('shows an em dash when there is no date at all', () => {
		expect(formatServicePeriod(null, null)).toBe('—');
		expect(formatServicePeriod(null, '2026-02-24')).toBe('—');
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

	it('counts only the unpaid remainder of a part-paid invoice as open', () => {
		// Alex's 2026-23: Brutto 1.372,49 € with 1.300,00 € received. Before
		// Teilzahlungen existed the whole Brutto stayed in the Offen column and the
		// remainder lived in the Bemerkung as free text.
		const totals = registerTotals([
			row({ brutto_cents: 137249, offene_zahlungen_cents: 7249 }),
		]);
		expect(totals.offen).toBe(7249);
	});

	it('excludes drafts from the counted totals and reports them separately', () => {
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

	it('counts a Gutschrift against the year', () => {
		// Alex's 2026-35 is a −650,00 € Gutschrift; a register that ignored it would
		// overstate the year.
		const totals = registerTotals([
			row({ netto_cents: 100000, mwst_cents: 19000, brutto_cents: 119000, offene_zahlungen_cents: 0 }),
			row({ netto_cents: -54622, mwst_cents: -10378, brutto_cents: -65000, offene_zahlungen_cents: 0 }),
		]);
		expect(totals.brutto).toBe(54000);
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
			row({ invoice_number: '2025-01', brutto_cents: 100000 }),
			row({ invoice_number: '2026-01', brutto_cents: 11900 }),
		];
		expect(registerTotals(rowsForYear(rows, '2026')).brutto).toBe(11900);
		expect(registerTotals(rowsForYear(rows, '2025')).brutto).toBe(100000);
	});
});

// ---------------------------------------------------------------------------
// Buchhaltung
// ---------------------------------------------------------------------------

/** A row with everything the accounting helpers read. */
function acc(over: Partial<RegisterRow> = {}): RegisterRow {
	return row({
		netto_cents: 100000,
		mwst_cents: 19000,
		brutto_cents: 119000,
		offene_zahlungen_cents: 119000,
		customer_name: 'Müller',
		...over,
	});
}

describe('monthOf', () => {
	it('books a row into the month of its Rechnungsdatum', () => {
		// Soll-Versteuerung: the tax is owed in the month the invoice is issued, so the
		// Rechnungsdatum decides the month — not the job date and not the payment date.
		expect(monthOf(acc({ sent_at: '2026-03-14T10:00:00Z' }), '2026')).toBe(3);
	});

	it('falls back to the creation date for a draft', () => {
		expect(monthOf(acc({ status: 'draft', sent_at: null, created_at: '2026-07-02T10:00:00Z' }), '2026')).toBe(7);
	});

	it('returns null when the Rechnungsdatum is outside the register year', () => {
		// Such a row is real and stays in the register; it just has no month in THIS
		// book, and a monthly figure that swallowed it would be wrong.
		const r = acc({ invoice_number: '2026-02', sent_at: '2025-12-23T10:00:00Z' });
		expect(monthOf(r, '2026')).toBeNull();
	});
});

describe('monthlySummaries', () => {
	it('always returns all twelve months, zero-filled', () => {
		const months = monthlySummaries([], '2026');
		expect(months).toHaveLength(12);
		expect(months.map((m) => m.label)).toEqual(MONTH_LABELS);
		// A quiet February must stay visible as a gap, not be compressed away.
		expect(months[1]).toMatchObject({ month: 2, count: 0, netto: 0, brutto: 0 });
	});

	it('sums each month separately', () => {
		const months = monthlySummaries(
			[
				acc({ sent_at: '2026-03-02T10:00:00Z', netto_cents: 10000, brutto_cents: 11900 }),
				acc({ sent_at: '2026-03-20T10:00:00Z', netto_cents: 20000, brutto_cents: 23800 }),
				acc({ sent_at: '2026-04-01T10:00:00Z', netto_cents: 50000, brutto_cents: 59500 }),
			],
			'2026'
		);
		expect(months[2]).toMatchObject({ count: 2, netto: 30000, brutto: 35700 });
		expect(months[3]).toMatchObject({ count: 1, netto: 50000, brutto: 59500 });
	});

	it('leaves drafts out, exactly as the year totals do', () => {
		const months = monthlySummaries(
			[
				acc({ sent_at: '2026-03-02T10:00:00Z', netto_cents: 10000 }),
				acc({ status: 'draft', sent_at: null, created_at: '2026-03-05T10:00:00Z', netto_cents: 99999 }),
			],
			'2026'
		);
		expect(months[2]).toMatchObject({ count: 1, netto: 10000 });
	});

	it('does not attribute an out-of-year row to any month', () => {
		const months = monthlySummaries(
			[acc({ invoice_number: '2026-02', sent_at: '2025-12-23T10:00:00Z', netto_cents: 42300 })],
			'2026'
		);
		expect(months.reduce((s, m) => s + m.netto, 0)).toBe(0);
	});
});

describe('dueOn / isOverdue', () => {
	it('uses the invoice’s own Fälligkeit when it has one', () => {
		expect(dueOn(acc({ due_date: '2026-04-15' }))).toBe('2026-04-15');
	});

	it('falls back to seven days after the Rechnungsdatum', () => {
		// The same interval the dunning system uses for the first Zahlungserinnerung,
		// so the register and the Mahnwesen agree on which invoices are late.
		expect(dueOn(acc({ due_date: null, sent_at: '2026-04-01T10:00:00Z' }))).toBe('2026-04-08');
	});

	it('has no due date at all when the invoice was never sent', () => {
		expect(dueOn(acc({ due_date: null, sent_at: null }))).toBeNull();
	});

	it('marks an unpaid invoice past its Fälligkeit as overdue', () => {
		expect(isOverdue(acc({ due_date: '2026-04-15' }), '2026-04-16')).toBe(true);
		expect(isOverdue(acc({ due_date: '2026-04-15' }), '2026-04-15')).toBe(false);
	});

	it('never calls a settled invoice overdue', () => {
		const paid = acc({ due_date: '2026-01-01', paid_at: '2026-03-01T10:00:00Z', is_settled: true });
		expect(isOverdue(paid, '2026-08-23')).toBe(false);
	});

	it('never calls a draft overdue — an unissued number cannot be late', () => {
		const draft = acc({ status: 'draft', sent_at: null, due_date: '2026-01-01' });
		expect(isOverdue(draft, '2026-08-23')).toBe(false);
	});
});

describe('matchesFilters', () => {
	const f = (over: Partial<RegisterFilters> = {}): RegisterFilters => ({ ...NO_FILTERS, ...over });

	it('passes everything through when nothing is filtered', () => {
		expect(matchesFilters(acc(), NO_FILTERS, '2026', '2026-08-23')).toBe(true);
		expect(hasActiveFilters(NO_FILTERS)).toBe(false);
	});

	it('filters by month', () => {
		const march = acc({ sent_at: '2026-03-14T10:00:00Z' });
		expect(matchesFilters(march, f({ month: 3 }), '2026', '2026-08-23')).toBe(true);
		expect(matchesFilters(march, f({ month: 4 }), '2026', '2026-08-23')).toBe(false);
		expect(hasActiveFilters(f({ month: 3 }))).toBe(true);
	});

	it('filters by status', () => {
		const open = acc({ due_date: '2026-09-30' });
		const overdue = acc({ due_date: '2026-01-01' });
		const paid = acc({ paid_at: '2026-03-01T10:00:00Z', is_settled: true });
		const draft = acc({ status: 'draft', sent_at: null });
		const today = '2026-08-23';

		expect(matchesFilters(open, f({ status: 'offen' }), '2026', today)).toBe(true);
		expect(matchesFilters(paid, f({ status: 'offen' }), '2026', today)).toBe(false);
		expect(matchesFilters(overdue, f({ status: 'ueberfaellig' }), '2026', today)).toBe(true);
		expect(matchesFilters(open, f({ status: 'ueberfaellig' }), '2026', today)).toBe(false);
		expect(matchesFilters(paid, f({ status: 'bezahlt' }), '2026', today)).toBe(true);
		expect(matchesFilters(draft, f({ status: 'entwurf' }), '2026', today)).toBe(true);
		expect(matchesFilters(open, f({ status: 'entwurf' }), '2026', today)).toBe(false);
	});

	it('searches the customer without needing the umlaut', () => {
		// Alex types "muller" for "Müller"; a register that made him type the umlaut
		// would be slower than scrolling.
		const r = acc({ customer_name: 'Müller' });
		expect(matchesFilters(r, f({ search: 'muller' }), '2026', '2026-08-23')).toBe(true);
		expect(matchesFilters(r, f({ search: 'MÜLL' }), '2026', '2026-08-23')).toBe(true);
		expect(matchesFilters(r, f({ search: 'schmidt' }), '2026', '2026-08-23')).toBe(false);
	});

	it('searches the invoice number', () => {
		const r = acc({ invoice_number: '2026-0045', customer_name: 'Ebeling' });
		expect(matchesFilters(r, f({ search: '0045' }), '2026', '2026-08-23')).toBe(true);
	});

	it('ignores a whitespace-only search', () => {
		expect(matchesFilters(acc(), f({ search: '   ' }), '2026', '2026-08-23')).toBe(true);
		expect(hasActiveFilters(f({ search: '   ' }))).toBe(false);
	});

	it('tolerates a row with no customer name', () => {
		const r = acc({ customer_name: null });
		expect(matchesFilters(r, f({ search: 'muller' }), '2026', '2026-08-23')).toBe(false);
		expect(matchesFilters(r, NO_FILTERS, '2026', '2026-08-23')).toBe(true);
	});
});

describe('viewRows', () => {
	const today = '2026-08-23';

	it('keeps the register’s own order when nothing is sorted', () => {
		const rows = [
			acc({ invoice_number: '2026-26' }),
			acc({ invoice_number: '2026-24' }),
			acc({ invoice_number: '2026-25' }),
		];
		expect(viewRows(rows, NO_FILTERS, null, '2026', today).map((r) => r.invoice_number)).toEqual([
			'2026-24',
			'2026-25',
			'2026-26',
		]);
	});

	it('sorts by amount in both directions', () => {
		const rows = [
			acc({ invoice_number: '2026-01', brutto_cents: 20000 }),
			acc({ invoice_number: '2026-02', brutto_cents: 50000 }),
			acc({ invoice_number: '2026-03', brutto_cents: 10000 }),
		];
		expect(
			viewRows(rows, NO_FILTERS, { key: 'brutto', dir: 'asc' }, '2026', today).map((r) => r.brutto_cents)
		).toEqual([10000, 20000, 50000]);
		expect(
			viewRows(rows, NO_FILTERS, { key: 'brutto', dir: 'desc' }, '2026', today).map((r) => r.brutto_cents)
		).toEqual([50000, 20000, 10000]);
	});

	it('sorts customers with a German collation', () => {
		const rows = [
			acc({ invoice_number: '2026-01', customer_name: 'Zapf' }),
			acc({ invoice_number: '2026-02', customer_name: 'Österle' }),
			acc({ invoice_number: '2026-03', customer_name: 'Ostermann' }),
		];
		// "Ö" belongs with "O", not after "Z".
		expect(
			viewRows(rows, NO_FILTERS, { key: 'customer', dir: 'asc' }, '2026', today).map((r) => r.customer_name)
		).toEqual(['Österle', 'Ostermann', 'Zapf']);
	});

	it('puts rows with an empty cell last in BOTH directions', () => {
		// An empty Bezahlt-Datum is "no value", not a small one — letting it lead a
		// descending sort would bury the rows the column was opened to see.
		const rows = [
			acc({ invoice_number: '2026-01', paid_at: null }),
			acc({ invoice_number: '2026-02', paid_at: '2026-05-01T10:00:00Z' }),
			acc({ invoice_number: '2026-03', paid_at: '2026-02-01T10:00:00Z' }),
		];
		expect(
			viewRows(rows, NO_FILTERS, { key: 'paid', dir: 'asc' }, '2026', today).map((r) => r.invoice_number)
		).toEqual(['2026-03', '2026-02', '2026-01']);
		expect(
			viewRows(rows, NO_FILTERS, { key: 'paid', dir: 'desc' }, '2026', today).map((r) => r.invoice_number)
		).toEqual(['2026-02', '2026-03', '2026-01']);
	});

	it('breaks ties on the invoice number, so equal rows do not reshuffle', () => {
		const rows = [
			acc({ invoice_number: '2026-09', customer_name: 'Luttert' }),
			acc({ invoice_number: '2026-03', customer_name: 'Luttert' }),
			acc({ invoice_number: '2026-07', customer_name: 'Luttert' }),
		];
		for (const dir of ['asc', 'desc'] as const) {
			expect(
				viewRows(rows, NO_FILTERS, { key: 'customer', dir }, '2026', today).map((r) => r.invoice_number)
			).toEqual(['2026-03', '2026-07', '2026-09']);
		}
	});

	it('filters and sorts together', () => {
		const rows = [
			acc({ invoice_number: '2026-01', sent_at: '2026-03-01T10:00:00Z', brutto_cents: 30000 }),
			acc({ invoice_number: '2026-02', sent_at: '2026-03-15T10:00:00Z', brutto_cents: 10000 }),
			acc({ invoice_number: '2026-03', sent_at: '2026-04-01T10:00:00Z', brutto_cents: 90000 }),
		];
		const out = viewRows(rows, { ...NO_FILTERS, month: 3 }, { key: 'brutto', dir: 'desc' }, '2026', today);
		expect(out.map((r) => r.invoice_number)).toEqual(['2026-01', '2026-02']);
	});

	it('does not reorder the caller-owned array', () => {
		const rows = [acc({ invoice_number: '2026-09' }), acc({ invoice_number: '2026-01' })];
		const before = rows.map((r) => r.invoice_number);
		viewRows(rows, NO_FILTERS, { key: 'brutto', dir: 'desc' }, '2026', today);
		expect(rows.map((r) => r.invoice_number)).toEqual(before);
	});
});

describe('daysBetween', () => {
	it('counts whole days by date, ignoring the time of day', () => {
		// Sent at 18:00, paid at 09:00 two mornings later — two days, not one and a half.
		expect(daysBetween('2026-03-01T18:00:00Z', '2026-03-03T09:00:00Z')).toBe(2);
	});

	it('returns null when either date is missing or unreadable', () => {
		expect(daysBetween(null, '2026-03-03T09:00:00Z')).toBeNull();
		expect(daysBetween('2026-03-01T18:00:00Z', null)).toBeNull();
		expect(daysBetween('kaputt', '2026-03-03T09:00:00Z')).toBeNull();
	});

	it('ignores a payment booked before the invoice date', () => {
		// A data-entry slip, not a negative wait; one typo must not drag the average
		// below zero.
		expect(daysBetween('2026-03-10T10:00:00Z', '2026-03-01T10:00:00Z')).toBeNull();
	});
});

describe('registerKpis', () => {
	const today = '2026-08-23';

	it('reports revenue, tax and what is still open', () => {
		const kpis = registerKpis(
			[
				acc({ netto_cents: 100000, mwst_cents: 19000, offene_zahlungen_cents: 0, is_settled: true }),
				acc({ netto_cents: 50000, mwst_cents: 9500, offene_zahlungen_cents: 59500, due_date: '2026-09-30' }),
			],
			today
		);
		expect(kpis.umsatzNetto).toBe(150000);
		expect(kpis.umsatzsteuer).toBe(28500);
		expect(kpis.offen).toBe(59500);
		expect(kpis.ueberfaellig).toBe(0);
	});

	it('counts overdue separately from merely open', () => {
		const kpis = registerKpis(
			[
				acc({ offene_zahlungen_cents: 10000, due_date: '2026-01-01' }),
				acc({ offene_zahlungen_cents: 20000, due_date: '2026-01-05' }),
				acc({ offene_zahlungen_cents: 30000, due_date: '2026-12-31' }),
			],
			today
		);
		expect(kpis.offen).toBe(60000);
		expect(kpis.ueberfaellig).toBe(30000);
		expect(kpis.ueberfaelligCount).toBe(2);
	});

	it('excludes drafts from revenue', () => {
		const kpis = registerKpis(
			[
				acc({ netto_cents: 100000 }),
				acc({ status: 'draft', sent_at: null, netto_cents: 999999 }),
			],
			today
		);
		expect(kpis.umsatzNetto).toBe(100000);
	});

	it('averages the payment wait over invoices that have both dates', () => {
		const kpis = registerKpis(
			[
				acc({ sent_at: '2026-03-01T10:00:00Z', paid_at: '2026-03-05T10:00:00Z', is_settled: true }),
				acc({ sent_at: '2026-04-01T10:00:00Z', paid_at: '2026-04-11T10:00:00Z', is_settled: true }),
				acc({ sent_at: '2026-05-01T10:00:00Z', paid_at: null }),
			],
			today
		);
		expect(kpis.zahlungsdauerTage).toBe(7);
	});

	it('reports no payment wait at all rather than zero when nothing is paid', () => {
		// An average of no samples is not zero — "0 Tage" would read as "they pay
		// instantly", which is the opposite of the truth.
		const kpis = registerKpis([acc({ paid_at: null })], today);
		expect(kpis.zahlungsdauerTage).toBeNull();
	});

	it('returns zeroes for no rows', () => {
		expect(registerKpis([], today)).toEqual({
			umsatzNetto: 0,
			umsatzsteuer: 0,
			offen: 0,
			ueberfaellig: 0,
			ueberfaelligCount: 0,
			zahlungsdauerTage: null,
		});
	});
});
