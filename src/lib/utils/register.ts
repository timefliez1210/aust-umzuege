/**
 * Rechnungsausgangsbuch — booking year, register order, and totals.
 *
 * Used by: admin/rechnungsausgangsbuch/+page.svelte
 * Purpose: The register is a legal ledger read as one running list per calendar year.
 *          Which year a row falls into, how the rows are ordered, and which of them
 *          count towards the totals is arithmetic that must not live inside the
 *          template — an earlier version summed every loaded row while labelling the
 *          result "Gesamtsumme (Jahr)" (feedback report 12e2d18f).
 */

/** The subset of a register row these helpers need. */
export interface RegisterRow {
	invoice_number: string;
	status: string;
	sent_at: string | null;
	paid_at: string | null;
	created_at: string;
	netto_cents?: number | null;
	mwst_cents?: number | null;
	brutto_cents?: number | null;
	offene_zahlungen_cents?: number | null;
	/** Present on real rows; the sorting and search helpers tolerate its absence. */
	customer_name?: string | null;
	scheduled_date?: string | null;
	due_date?: string | null;
	is_settled?: boolean;
}

/** Totals shown in the table footer. All values in cents. */
export interface RegisterTotals {
	netto: number;
	mwst: number;
	brutto: number;
	offen: number;
	/** Brutto of rows that are not issued yet — displayed, but never counted. */
	entwurf: number;
}

/** Statuses that mean "number reserved, invoice not issued". */
const DRAFT_STATUSES = ['draft', 'ready', 'pending_approval'];

/**
 * Whether a row is still a draft.
 *
 * A sent or paid invoice is issued no matter what its status column says — those
 * two timestamps are the authoritative signal.
 */
export function isDraft(item: RegisterRow): boolean {
	if (item.sent_at != null || item.paid_at != null) return false;
	return DRAFT_STATUSES.includes(item.status);
}

/**
 * Split an invoice number into `[year, sequence]`, or `null` if it isn't `YYYY-N`.
 *
 * Padded and unpadded numbers parse identically: `2026-0087` and `2026-87` are the
 * same entry. Numbers issued before 2026-08-21 came from a global sequence and are
 * four-digit padded; they are left as they were printed on the customers' invoices,
 * so a register year can legitimately contain both forms.
 */
export function parseInvoiceNumber(invoiceNumber: string): [number, number] | null {
	const match = /^(\d{4})-(\d+)$/.exec((invoiceNumber ?? '').trim());
	if (!match) return null;
	return [Number(match[1]), Number(match[2])];
}

/**
 * The date a row is booked under: its Rechnungsdatum, falling back to the creation
 * date for drafts that have no invoice date yet.
 */
export function bookingDate(item: RegisterRow): string {
	return item.sent_at ?? item.created_at;
}

/**
 * The calendar year a row belongs to, as a four-character string.
 *
 * The invoice number decides, not the date: Alex issues invoices in January for work
 * done the previous December (2026-02 carries a Leistungsdatum of 23.12.2025) and
 * they belong in the 2026 book, because that is the book their number came from.
 * Numbers we can't parse fall back to the booking date.
 */
export function yearOf(item: RegisterRow): string {
	const parsed = parseInvoiceNumber(item.invoice_number);
	return parsed ? String(parsed[0]) : bookingDate(item).substring(0, 4);
}

/** Every year present in the data, ascending — the year selector's options. */
export function availableYears<T extends RegisterRow>(rows: T[]): string[] {
	return [...new Set(rows.map(yearOf))].sort();
}

/**
 * Compare two rows by invoice number, numerically.
 *
 * Rows whose number doesn't parse sort last, by raw text, rather than being dropped
 * or landing in an arbitrary place.
 */
export function compareByNumber(a: RegisterRow, b: RegisterRow): number {
	const pa = parseInvoiceNumber(a.invoice_number);
	const pb = parseInvoiceNumber(b.invoice_number);
	if (pa && pb) return pa[0] - pb[0] || pa[1] - pb[1];
	if (pa) return -1;
	if (pb) return 1;
	return (a.invoice_number ?? '').localeCompare(b.invoice_number ?? '');
}

/**
 * The rows of one year, in register order — ascending invoice number.
 *
 * NOT date order. The register is a running ledger read as a number sequence, and
 * invoice dates are not monotonic (2026-25 is dated 29.05., 2026-26 13.03.), so
 * sorting by date scrambles the very sequence the book exists to show.
 *
 * Sorts a copy: the caller's array is derived state that other views read.
 */
export function rowsForYear<T extends RegisterRow>(rows: T[], year: string): T[] {
	return rows
		.filter((r) => yearOf(r) === year)
		.slice()
		.sort(compareByNumber);
}

/**
 * Sums one year's rows.
 *
 * Only issued invoices count towards netto/mwst/brutto/offen — a draft
 * Schlussrechnung has a reserved number but is not yet a receivable, so counting
 * it would overstate revenue in a document the tax office may read. Drafts are
 * reported separately as `entwurf`.
 */
export function registerTotals<T extends RegisterRow>(yearRows: T[]): RegisterTotals {
	const issued = yearRows.filter((r) => !isDraft(r));
	const sum = (list: T[], key: keyof RegisterRow): number =>
		list.reduce((s, r) => s + ((r[key] as number | null | undefined) ?? 0), 0);

	return {
		netto: sum(issued, 'netto_cents'),
		mwst: sum(issued, 'mwst_cents'),
		brutto: sum(issued, 'brutto_cents'),
		offen: sum(issued, 'offene_zahlungen_cents'),
		entwurf: sum(yearRows.filter(isDraft), 'brutto_cents'),
	};
}

/**
 * Renders a Leistungszeitraum the way Alex writes it in his book.
 *
 * A single day is just that day. A span inside one month collapses the repeated
 * month and year ("12.-13.01.2026"), which is the form most of his span rows use;
 * a wider span prints both dates in full. An end before the start is bad data,
 * not a span, and shows as the start alone rather than as a backwards range.
 *
 * Dates come from the API as `YYYY-MM-DD` and are split textually — `new Date()`
 * on a bare date string is UTC-midnight, which renders as the previous day in
 * any timezone behind UTC.
 */
export function formatServicePeriod(
	start: string | null | undefined,
	end: string | null | undefined
): string {
	const s = splitIsoDate(start);
	if (!s) return '—';
	const e = splitIsoDate(end);
	if (!e || (e[0] === s[0] && e[1] === s[1] && e[2] === s[2])) return germanDate(s);
	if (compareParts(e, s) < 0) return germanDate(s);
	if (e[0] === s[0] && e[1] === s[1]) return `${s[2]}.-${germanDate(e)}`;
	return `${germanDate(s)}-${germanDate(e)}`;
}

/** `YYYY-MM-DD…` → `["YYYY", "MM", "DD"]`, or null if it isn't a date. */
function splitIsoDate(iso: string | null | undefined): [string, string, string] | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
	return match ? [match[1], match[2], match[3]] : null;
}

function germanDate([y, m, d]: [string, string, string]): string {
	return `${d}.${m}.${y}`;
}

function compareParts(a: [string, string, string], b: [string, string, string]): number {
	return a.join('').localeCompare(b.join(''));
}

// ---------------------------------------------------------------------------
// Buchhaltung — months, filters, sorting, and the figures Alex actually asks for
// ---------------------------------------------------------------------------

/**
 * The month a row is booked into, 1–12, or `null` when it has none.
 *
 * Keyed on the Rechnungsdatum, because that is the date the Umsatzsteuer follows
 * (Soll-Versteuerung: the tax is owed in the month the invoice is issued, not the
 * month the money arrives). A draft has no Rechnungsdatum and falls back to its
 * creation date, which is the only date it has.
 *
 * Returns `null` when the resulting date lands outside `year`. Such a row is real
 * and stays in the register — it just cannot be attributed to a month of this
 * book, and a monthly revenue figure that silently swallowed it would be wrong.
 */
export function monthOf(item: RegisterRow, year: string): number | null {
	const date = bookingDate(item);
	if (date.substring(0, 4) !== year) return null;
	const month = Number(date.substring(5, 7));
	return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
}

/** German month abbreviations, index 0 = Januar. */
export const MONTH_LABELS = [
	'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
	'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

/** One month's figures. All amounts in cents. */
export interface MonthSummary {
	/** 1–12. */
	month: number;
	label: string;
	/** Issued invoices booked into this month. Drafts are excluded, as in the totals. */
	count: number;
	netto: number;
	mwst: number;
	brutto: number;
	offen: number;
}

/**
 * The twelve months of one register year, always all twelve.
 *
 * A month with no invoices is a zero row, not a missing one: a monthly revenue
 * chart that dropped empty months would compress the gaps and make a quiet
 * February look like it never happened.
 *
 * Drafts are left out for the same reason `registerTotals` leaves them out — a
 * reserved number is not yet revenue.
 */
export function monthlySummaries<T extends RegisterRow>(
	yearRows: T[],
	year: string
): MonthSummary[] {
	const months: MonthSummary[] = MONTH_LABELS.map((label, i) => ({
		month: i + 1,
		label,
		count: 0,
		netto: 0,
		mwst: 0,
		brutto: 0,
		offen: 0,
	}));

	for (const row of yearRows) {
		if (isDraft(row)) continue;
		const m = monthOf(row, year);
		if (m == null) continue;
		const bucket = months[m - 1];
		bucket.count += 1;
		bucket.netto += row.netto_cents ?? 0;
		bucket.mwst += row.mwst_cents ?? 0;
		bucket.brutto += row.brutto_cents ?? 0;
		bucket.offen += row.offene_zahlungen_cents ?? 0;
	}
	return months;
}

/**
 * The day an invoice becomes overdue, as `YYYY-MM-DD`, or null if it never does.
 *
 * Uses the invoice's own Fälligkeit when it has one. Rows issued before due dates
 * were captured fall back to seven days after the Rechnungsdatum — the same
 * interval the dunning system already uses for the first Zahlungserinnerung
 * (migration 20260503000000), so the register and the Mahnwesen agree on which
 * invoices are late.
 */
export function dueOn(item: RegisterRow): string | null {
	if (item.due_date) return item.due_date.substring(0, 10);
	if (!item.sent_at) return null;
	const sent = new Date(`${item.sent_at.substring(0, 10)}T00:00:00Z`);
	if (Number.isNaN(sent.getTime())) return null;
	sent.setUTCDate(sent.getUTCDate() + 7);
	return sent.toISOString().substring(0, 10);
}

/** Whether a row is settled — the backend's flag, with a fallback for older payloads. */
export function isSettled(item: RegisterRow): boolean {
	return item.is_settled ?? item.paid_at != null;
}

/**
 * Whether an issued, unpaid invoice is past its Fälligkeit on `today`.
 *
 * Drafts can never be overdue: a number that was never issued cannot be late.
 */
export function isOverdue(item: RegisterRow, today: string): boolean {
	if (isSettled(item) || isDraft(item)) return false;
	const due = dueOn(item);
	return due != null && due < today;
}

/** Which rows the status chips show. */
export type StatusFilter = 'alle' | 'offen' | 'ueberfaellig' | 'bezahlt' | 'entwurf';

/** The filter bar's state. `month` is 1–12, or null for the whole year. */
export interface RegisterFilters {
	month: number | null;
	status: StatusFilter;
	search: string;
}

/** Nothing filtered — the register as the law wants it read, top to bottom. */
export const NO_FILTERS: RegisterFilters = { month: null, status: 'alle', search: '' };

/** Whether any filter is narrowing the view. */
export function hasActiveFilters(f: RegisterFilters): boolean {
	return f.month != null || f.status !== 'alle' || f.search.trim() !== '';
}

function matchesStatus(item: RegisterRow, status: StatusFilter, today: string): boolean {
	switch (status) {
		case 'offen':
			return !isSettled(item) && !isDraft(item);
		case 'ueberfaellig':
			return isOverdue(item, today);
		case 'bezahlt':
			return isSettled(item);
		case 'entwurf':
			return isDraft(item);
		default:
			return true;
	}
}

/**
 * Whether a row survives the filter bar.
 *
 * Search matches the invoice number or the customer, case- and accent-insensitively:
 * Alex types "muller" for "Müller" and "26-45" for "2026-0045", and a register that
 * made him type the umlaut would be slower than scrolling.
 */
export function matchesFilters(
	item: RegisterRow,
	filters: RegisterFilters,
	year: string,
	today: string
): boolean {
	if (filters.month != null && monthOf(item, year) !== filters.month) return false;
	if (!matchesStatus(item, filters.status, today)) return false;

	const needle = foldForSearch(filters.search);
	if (needle === '') return true;
	const haystack = foldForSearch(`${item.invoice_number} ${item.customer_name ?? ''}`);
	return haystack.includes(needle);
}

/** Lowercases and strips diacritics so "muller" finds "Müller". */
function foldForSearch(value: string): string {
	return (value ?? '')
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '');
}

/** Columns the register can be sorted by. */
export type SortKey =
	| 'number'
	| 'service'
	| 'customer'
	| 'netto'
	| 'mwst'
	| 'brutto'
	| 'offen'
	| 'sent'
	| 'paid';

/** `null` means register order — ascending invoice number, the ledger's own order. */
export interface SortState {
	key: SortKey;
	dir: 'asc' | 'desc';
}

/** The row field each sortable column reads. */
const SORT_FIELDS: Record<Exclude<SortKey, 'number'>, keyof RegisterRow> = {
	customer: 'customer_name',
	netto: 'netto_cents',
	mwst: 'mwst_cents',
	brutto: 'brutto_cents',
	offen: 'offene_zahlungen_cents',
	service: 'scheduled_date',
	sent: 'sent_at',
	paid: 'paid_at',
};

/** Whether a row has nothing to show in the sorted column. */
function isMissing(item: RegisterRow, key: SortKey): boolean {
	if (key === 'number') return false;
	const value = item[SORT_FIELDS[key]];
	return value == null || value === '';
}

/**
 * Compares two rows on one column, both values known to be present.
 *
 * Amounts compare numerically, dates as ISO text (which sorts chronologically), and
 * customers with a German collation so "Ö" lands with "O" rather than after "Z".
 */
function compareBySortKey(a: RegisterRow, b: RegisterRow, key: SortKey): number {
	if (key === 'number') return compareByNumber(a, b);
	const field = SORT_FIELDS[key];
	const x = a[field];
	const y = b[field];
	if (typeof x === 'number' && typeof y === 'number') return x - y;
	if (key === 'customer') return String(x).localeCompare(String(y), 'de');
	return String(x).localeCompare(String(y));
}

/**
 * Applies the filter bar and the sort to one year's rows.
 *
 * Sorts a copy — the caller's array is derived state that other views read.
 *
 * `sort: null` keeps the register's own order (ascending invoice number). Every
 * other order is a lens on the same ledger; only the default is the ledger itself,
 * which is why the page marks it and offers a way back.
 */
export function viewRows<T extends RegisterRow>(
	yearRows: T[],
	filters: RegisterFilters,
	sort: SortState | null,
	year: string,
	today: string
): T[] {
	const rows = yearRows.filter((r) => matchesFilters(r, filters, year, today));
	if (sort == null) return rows.sort(compareByNumber);

	const sign = sort.dir === 'desc' ? -1 : 1;
	return rows.sort((a, b) => {
		// Rows with nothing in the sorted column go last in BOTH directions — an empty
		// Bezahlt-Datum is "no value", not a small one, and letting it lead a descending
		// sort would bury the rows Alex opened the column to see.
		const missing = Number(isMissing(a, sort.key)) - Number(isMissing(b, sort.key));
		if (missing !== 0) return missing;

		const primary = compareBySortKey(a, b, sort.key);
		if (primary !== 0) return sign * primary;

		// Ties always fall back to the ledger's own order, never to array position, so
		// the table doesn't reshuffle within a group on every re-render.
		return compareByNumber(a, b);
	});
}

/** The headline figures above the table. All amounts in cents; days are days. */
export interface RegisterKpis {
	/** Netto of every issued invoice in scope — the revenue figure. */
	umsatzNetto: number;
	/** Umsatzsteuer owed on that revenue. */
	umsatzsteuer: number;
	/** Still outstanding. */
	offen: number;
	/** The part of `offen` that is past its Fälligkeit. */
	ueberfaellig: number;
	/** How many invoices make up `ueberfaellig`. */
	ueberfaelligCount: number;
	/**
	 * Mean days from Rechnungsdatum to payment, over invoices that have both dates.
	 * `null` when nothing in scope has been paid yet — an average of no samples is
	 * not zero.
	 */
	zahlungsdauerTage: number | null;
}

/**
 * The KPI row.
 *
 * Computed over whatever rows it is given, so it reflects the current filter — the
 * tiles answer "…in what I am looking at", which is the only reading that stays
 * true when a month is selected.
 */
export function registerKpis<T extends RegisterRow>(rows: T[], today: string): RegisterKpis {
	const issued = rows.filter((r) => !isDraft(r));

	let umsatzNetto = 0;
	let umsatzsteuer = 0;
	let offen = 0;
	let ueberfaellig = 0;
	let ueberfaelligCount = 0;
	let paymentDays = 0;
	let paymentSamples = 0;

	for (const row of issued) {
		umsatzNetto += row.netto_cents ?? 0;
		umsatzsteuer += row.mwst_cents ?? 0;
		offen += row.offene_zahlungen_cents ?? 0;

		if (isOverdue(row, today)) {
			ueberfaellig += row.offene_zahlungen_cents ?? 0;
			ueberfaelligCount += 1;
		}

		const days = daysBetween(row.sent_at, row.paid_at);
		if (days != null) {
			paymentDays += days;
			paymentSamples += 1;
		}
	}

	return {
		umsatzNetto,
		umsatzsteuer,
		offen,
		ueberfaellig,
		ueberfaelligCount,
		zahlungsdauerTage: paymentSamples === 0 ? null : Math.round(paymentDays / paymentSamples),
	};
}

/**
 * Whole days between two timestamps, or null if either is missing or unparseable.
 *
 * Compares the date parts only: an invoice sent at 18:00 and paid at 09:00 two
 * mornings later took two days, not one and a half.
 */
export function daysBetween(from: string | null | undefined, to: string | null | undefined): number | null {
	if (!from || !to) return null;
	const a = Date.parse(`${from.substring(0, 10)}T00:00:00Z`);
	const b = Date.parse(`${to.substring(0, 10)}T00:00:00Z`);
	if (Number.isNaN(a) || Number.isNaN(b)) return null;
	const days = Math.round((b - a) / 86_400_000);
	// A payment booked before the invoice date is a data-entry slip, not a negative
	// wait; leaving it out keeps one typo from dragging the average below zero.
	return days < 0 ? null : days;
}
