/**
 * KVA-Buch — win/loss derivation, Nachfassliste, and the register's statistics.
 *
 * Used by: admin/kva-buch/+page.svelte
 * Purpose: The KVA register is not a legal ledger like the Rechnungsausgangsbuch —
 *          it is a sales instrument. It answers "how much did I quote, how much did
 *          I win, what is still open, and what should I chase today?".
 *
 * The one rule everything here rests on: **win/loss comes from the inquiry, never
 * from `offers.status`.** That column is not maintained — 126 of 133 production rows
 * sit at "draft" while a third of them already produced an invoice. The backend
 * derives `lage` from `inquiries.status` and this module only ever reads that.
 */

/** The subset of a KVA-Buch row these helpers need. */
export interface KvaRow {
	id: string;
	inquiry_id: string;
	offer_number: string | null;
	/** Present when a KVA document has been rendered. */
	pdf_s3_key?: string | null;
	customer_name?: string | null;
	scheduled_date: string | null;
	netto_cents: number;
	mwst_cents: number;
	brutto_cents: number;
	created_at: string;
	sent_at: string | null;
	valid_until: string | null;
	invoice_number: string | null;
	/** Derived by the backend from `inquiries.status`. */
	lage: string;
	age_days: number;
	needs_followup: boolean;
	followup_date_missing: boolean;
	move_date_passed: boolean;
	followup_muted: boolean;
	followup_last_pinged_on: string | null;
}

export type Lage = 'gewonnen' | 'verloren' | 'offen' | 'unbekannt';

export const LAGE_LABELS: Record<string, string> = {
	gewonnen: 'Gewonnen',
	verloren: 'Verloren',
	offen: 'Offen',
	unbekannt: 'Unklar'
};

/**
 * The date a KVA belongs to.
 *
 * `sent_at` is populated on 7 of 133 production rows and `inquiries.offer_sent_at`
 * on none, so creation is in practice the only usable KVA date. The fallback order
 * is kept so the register improves automatically if those columns ever start being
 * written.
 */
export function kvaDate(item: KvaRow): string {
	return item.sent_at ?? item.created_at;
}

export function yearOf(item: KvaRow): string {
	return kvaDate(item).substring(0, 4);
}

export function availableYears(rows: KvaRow[]): string[] {
	return [...new Set(rows.map(yearOf))].sort();
}

export function rowsForYear(rows: KvaRow[], year: string): KvaRow[] {
	return rows.filter((r) => yearOf(r) === year);
}

/** Parses `2026-0131` into `[2026, 131]`; `null` when the shape does not match. */
export function parseOfferNumber(offerNumber: string | null): [number, number] | null {
	if (!offerNumber) return null;
	const m = /^(\d{4})-(\d+)$/.exec(offerNumber.trim());
	if (!m) return null;
	return [Number(m[1]), Number(m[2])];
}

/** Register order: ascending KVA number, unnumbered rows last, then by date. */
export function compareByNumber(a: KvaRow, b: KvaRow): number {
	const pa = parseOfferNumber(a.offer_number);
	const pb = parseOfferNumber(b.offer_number);
	if (pa && pb) return pa[0] - pb[0] || pa[1] - pb[1];
	if (pa) return -1;
	if (pb) return 1;
	return kvaDate(a).localeCompare(kvaDate(b));
}

// ── statistics ────────────────────────────────────────────────────────────

export interface KvaKpis {
	/** Every KVA in scope. */
	count: number;
	volumeNetto: number;
	wonCount: number;
	wonNetto: number;
	lostCount: number;
	lostNetto: number;
	openCount: number;
	openNetto: number;
	/**
	 * Open KVAs whose move date has already passed — counted in `open*` but not
	 * actually winnable. Surfaced so the open figure can be read honestly.
	 */
	deadOpenCount: number;
	deadOpenNetto: number;
	/** Open and still winnable: `openNetto` minus the dead ones. */
	liveOpenNetto: number;
	/**
	 * Share of *decided* KVAs that were won, 0–1. Undecided KVAs are excluded —
	 * including them would drag the rate down purely because a quote is recent.
	 * `null` when nothing has been decided yet.
	 */
	winRateByCount: number | null;
	/** Same, weighted by netto value. Diverges from the count rate when the
	 *  won and lost jobs are of different sizes — which is the interesting case. */
	winRateByValue: number | null;
	/** Average netto of won / lost KVAs; `null` when that bucket is empty. */
	avgWonNetto: number | null;
	avgLostNetto: number | null;
	/** KVAs on the Nachfassliste right now. */
	followupCount: number;
	followupNetto: number;
}

export function kvaKpis(rows: KvaRow[]): KvaKpis {
	const sum = (list: KvaRow[]) => list.reduce((s, r) => s + r.netto_cents, 0);

	const won = rows.filter((r) => r.lage === 'gewonnen');
	const lost = rows.filter((r) => r.lage === 'verloren');
	const open = rows.filter((r) => r.lage === 'offen');
	const dead = open.filter((r) => r.move_date_passed);
	const followups = rows.filter((r) => r.needs_followup);

	const decidedCount = won.length + lost.length;
	const wonNetto = sum(won);
	const lostNetto = sum(lost);
	const decidedNetto = wonNetto + lostNetto;
	const openNetto = sum(open);
	const deadOpenNetto = sum(dead);

	return {
		count: rows.length,
		volumeNetto: sum(rows),
		wonCount: won.length,
		wonNetto,
		lostCount: lost.length,
		lostNetto,
		openCount: open.length,
		openNetto,
		deadOpenCount: dead.length,
		deadOpenNetto,
		liveOpenNetto: openNetto - deadOpenNetto,
		winRateByCount: decidedCount > 0 ? won.length / decidedCount : null,
		winRateByValue: decidedNetto > 0 ? wonNetto / decidedNetto : null,
		avgWonNetto: won.length > 0 ? Math.round(wonNetto / won.length) : null,
		avgLostNetto: lost.length > 0 ? Math.round(lostNetto / lost.length) : null,
		followupCount: followups.length,
		followupNetto: sum(followups)
	};
}

export const MONTH_LABELS = [
	'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export interface KvaMonthSummary {
	/** 0-based month index. */
	month: number;
	label: string;
	count: number;
	/** Netto quoted in this month. */
	volumeNetto: number;
	/** Netto of the KVAs from this month that were won. */
	wonNetto: number;
	wonCount: number;
	lostCount: number;
	openCount: number;
}

/**
 * One entry per calendar month, always all twelve.
 *
 * A month with no KVAs still gets a zero row so the chart keeps a stable
 * twelve-slot x-axis instead of re-scaling as the year fills in.
 */
export function monthlySummaries(yearRows: KvaRow[]): KvaMonthSummary[] {
	const months: KvaMonthSummary[] = MONTH_LABELS.map((label, month) => ({
		month, label, count: 0, volumeNetto: 0, wonNetto: 0,
		wonCount: 0, lostCount: 0, openCount: 0
	}));
	for (const r of yearRows) {
		const idx = Number(kvaDate(r).substring(5, 7)) - 1;
		if (!(idx >= 0 && idx < 12)) continue;
		const m = months[idx];
		m.count += 1;
		m.volumeNetto += r.netto_cents;
		if (r.lage === 'gewonnen') { m.wonNetto += r.netto_cents; m.wonCount += 1; }
		else if (r.lage === 'verloren') m.lostCount += 1;
		else if (r.lage === 'offen') m.openCount += 1;
	}
	return months;
}

// ── Nachfassliste ─────────────────────────────────────────────────────────

/**
 * The KVAs worth chasing, most valuable first.
 *
 * Mirrors the backend's `fetch_followup_candidates` exactly: open, past the
 * threshold, move date still ahead, not muted. Sorted by value rather than age
 * because with limited calling time the biggest job is the one to ring first.
 */
export function followupRows(rows: KvaRow[]): KvaRow[] {
	return rows
		.filter((r) => r.needs_followup)
		.sort((a, b) => b.netto_cents - a.netto_cents || compareByNumber(a, b));
}

/**
 * Overdue open KVAs with no move date — cannot be pinged, must not vanish.
 *
 * Liveness is unprovable without a date, so the nag skips these by design; the UI
 * lists them separately so they still get looked at.
 */
export function dateMissingRows(rows: KvaRow[]): KvaRow[] {
	return rows
		.filter((r) => r.followup_date_missing)
		.sort((a, b) => b.age_days - a.age_days || compareByNumber(a, b));
}

/**
 * Open KVAs whose move date has passed — dead weight in the open pipeline.
 *
 * Not a nag list: it is the cleanup queue. These inflate "Offen" without being
 * winnable (17 of 33 on production when this was built).
 */
export function staleRows(rows: KvaRow[]): KvaRow[] {
	return rows
		.filter((r) => r.move_date_passed)
		.sort((a, b) => (a.scheduled_date ?? '').localeCompare(b.scheduled_date ?? ''));
}

// ── filtering & sorting ───────────────────────────────────────────────────

export type LageFilter = 'alle' | 'gewonnen' | 'verloren' | 'offen' | 'nachfassen';

export interface KvaFilters {
	/** 0-based month index, or `null` for the whole year. */
	month: number | null;
	lage: LageFilter;
	search: string;
}

export const NO_FILTERS: KvaFilters = { month: null, lage: 'alle', search: '' };

export function hasActiveFilters(f: KvaFilters): boolean {
	return f.month !== null || f.lage !== 'alle' || f.search.trim() !== '';
}

/** Accent- and case-insensitive fold, so "muller" finds "Müller". */
export function foldForSearch(value: string): string {
	return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function matchesFilters(item: KvaRow, f: KvaFilters): boolean {
	if (f.month !== null && Number(kvaDate(item).substring(5, 7)) - 1 !== f.month) return false;

	if (f.lage === 'nachfassen') {
		if (!item.needs_followup) return false;
	} else if (f.lage !== 'alle' && item.lage !== f.lage) {
		return false;
	}

	const term = foldForSearch(f.search.trim());
	if (term !== '') {
		const haystack = foldForSearch(
			[item.offer_number ?? '', item.customer_name ?? '', item.invoice_number ?? ''].join(' ')
		);
		if (!haystack.includes(term)) return false;
	}
	return true;
}

export type KvaSortKey =
	| 'number' | 'date' | 'customer' | 'service'
	| 'netto' | 'brutto' | 'age' | 'lage';

export interface KvaSortState {
	key: KvaSortKey;
	dir: 'asc' | 'desc';
}

const SORT_FIELDS: Record<Exclude<KvaSortKey, 'number' | 'date'>, keyof KvaRow> = {
	customer: 'customer_name',
	service: 'scheduled_date',
	netto: 'netto_cents',
	brutto: 'brutto_cents',
	age: 'age_days',
	lage: 'lage'
};

function isMissing(item: KvaRow, key: KvaSortKey): boolean {
	if (key === 'number' || key === 'date') return false;
	const value = item[SORT_FIELDS[key]];
	return value == null || value === '';
}

function compareBySortKey(a: KvaRow, b: KvaRow, key: KvaSortKey): number {
	if (key === 'number') return compareByNumber(a, b);
	if (key === 'date') return kvaDate(a).localeCompare(kvaDate(b));
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
 * Sorts a copy — the caller's array is derived state other views read.
 * `sort: null` keeps register order (ascending KVA number).
 */
export function viewRows(
	yearRows: KvaRow[],
	filters: KvaFilters,
	sort: KvaSortState | null
): KvaRow[] {
	const rows = yearRows.filter((r) => matchesFilters(r, filters));
	if (sort == null) return rows.sort(compareByNumber);

	const sign = sort.dir === 'desc' ? -1 : 1;
	return rows.sort((a, b) => {
		// Empty cells go last in BOTH directions — a missing Leistungsdatum is
		// "no value", not a small one.
		const missing = Number(isMissing(a, sort.key)) - Number(isMissing(b, sort.key));
		if (missing !== 0) return missing;
		const primary = compareBySortKey(a, b, sort.key);
		if (primary !== 0) return sign * primary;
		return compareByNumber(a, b);
	});
}
