/**
 * Rechnungsausgangsbuch — booking dates, year scoping and register totals.
 *
 * Used by: admin/rechnungsausgangsbuch/+page.svelte
 * Purpose: The register is a legal ledger read as one running list per calendar year.
 *          Which year a row falls into, and which rows count towards the totals, is
 *          arithmetic that must not live inside the template — an earlier version
 *          summed every loaded row while labelling the result "Gesamtsumme (Jahr)"
 *          (feedback report 12e2d18f).
 */

/** The subset of a register row these helpers need. */
export interface RegisterRow {
	status: string;
	sent_at: string | null;
	paid_at: string | null;
	created_at: string;
	netto_cents?: number | null;
	mwst_cents?: number | null;
	brutto_cents?: number | null;
	offene_zahlungen_cents?: number | null;
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
 * The date a row is booked under: its Rechnungsdatum, falling back to the creation
 * date for drafts that have no invoice date yet.
 */
export function bookingDate(item: RegisterRow): string {
	return item.sent_at ?? item.created_at;
}

/** The calendar year a row belongs to, as a four-character string. */
export function yearOf(item: RegisterRow): string {
	return bookingDate(item).substring(0, 4);
}

/** Every year present in the data, ascending — the year selector's options. */
export function availableYears<T extends RegisterRow>(rows: T[]): string[] {
	return [...new Set(rows.map(yearOf))].sort();
}

/**
 * The rows of one year, oldest first.
 *
 * Sorts a copy: the caller's array is derived state that other views read.
 */
export function rowsForYear<T extends RegisterRow>(rows: T[], year: string): T[] {
	return rows
		.filter((r) => yearOf(r) === year)
		.slice()
		.sort((a, b) => bookingDate(a).localeCompare(bookingDate(b)));
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
