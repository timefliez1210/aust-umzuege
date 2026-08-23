/**
 * Formats a cent-denominated integer as a localised German euro currency string.
 *
 * Called by: offers/[id]/+page.svelte (price display throughout offer editor),
 *            quotes/[id]/+page.svelte (labour and line-item totals),
 *            quotes/+page.svelte (quote list price column),
 *            offers/+page.svelte (offer list price column),
 *            customers/[id]/+page.svelte (offer price in customer history),
 *            orders/+page.svelte (order price column);
 *            re-exported via api.svelte.ts for convenience
 * Purpose: Ensures all monetary values throughout the admin are displayed
 *          consistently in German locale formatting (e.g. "1.234,56 €")
 *
 * @param cents - Amount in cents (integer); divided by 100 before formatting
 * @returns Localised currency string in de-DE format, e.g. "1.234,56 €"
 *
 * Math: euros = cents / 100
 */
export function formatEuro(cents: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR'
	}).format(cents / 100);
}

/**
 * Formats an ISO 8601 date string as a short German date (DD.MM.YYYY).
 *
 * Called by: quotes/+page.svelte (created_at column), quotes/[id]/+page.svelte
 *            (offer created_at), offers/+page.svelte (created_at column),
 *            offers/[id]/+page.svelte (offer info), customers/+page.svelte
 *            (created_at column), customers/[id]/+page.svelte (dates in history),
 *            orders/+page.svelte (date column);
 *            re-exported via api.svelte.ts for convenience
 * Purpose: Converts raw API date strings to the German short-date format
 *          expected by the admin interface
 *
 * @param dateStr - ISO 8601 date or datetime string (e.g. "2026-02-28" or "2026-02-28T10:00:00Z")
 * @returns Date string formatted as "DD.MM.YYYY" in de-DE locale
 */
export function formatDate(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(dateStr));
}

/**
 * Formats an ISO 8601 datetime string as a German date-and-time string (DD.MM.YYYY HH:MM).
 *
 * Called by: admin/+page.svelte (activity feed timestamps),
 *            emails/+page.svelte (last message timestamp),
 *            emails/[id]/+page.svelte (per-message timestamp),
 *            settings/+page.svelte (user created_at);
 *            re-exported via api.svelte.ts for convenience
 * Purpose: Shows precise timestamps in the admin interface where date-only precision
 *          is insufficient (e.g. email threads and activity logs)
 *
 * @param dateStr - ISO 8601 datetime string (e.g. "2026-02-28T14:30:00Z")
 * @returns Datetime string formatted as "DD.MM.YYYY HH:MM" in de-DE locale
 */
export function formatDateTime(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(dateStr));
}

/**
 * Formats a time string (HH:MM:SS or HH:MM) to HH:MM display format.
 *
 * Called by: calendar/+page.svelte (time display in calendar cells and side panel),
 *            calendar-items/[id]/+page.svelte (start/end time display)
 * Purpose: Strips seconds from the raw TIME value returned by the API for cleaner display.
 *          Returns an empty string for null/undefined values so templates can use it safely.
 *
 * @param t - Time string from the API (e.g. "09:00:00" or "09:00"), or null/undefined
 * @returns Formatted string "HH:MM", or empty string if the input is null/undefined
 */
export function formatTime(t: string | null | undefined): string {
	return t ? t.slice(0, 5) : '';
}

/**
 * Normalizes loose time input (e.g. "7", "7:30", "7.30", "7,30", "730") into HH:MM:SS.
 * Returns null for empty/whitespace input.
 *
 * Dot/comma separators matter: the assignment time fields use
 * `inputmode="decimal"`, whose mobile keyboard has no colon key — German users
 * naturally type "7.30" for 07:30 (this silently failed as a backend 422
 * before, see Lisa Lullies incident 2026-06-10).
 */
export function normalizeTimeInput(value: string | null): string | null {
	if (!value || !value.trim()) return null;
	const v = value.trim();
	if (/^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
	// Colon, dot, or comma as hour/minute separator: 7:30 / 07.30 / 7,30
	const sep = v.match(/^(\d{1,2})[:.,](\d{2})$/);
	if (sep) return sep[1].padStart(2, '0') + ':' + sep[2] + ':00';
	// Bare 3-4 digits: 730 → 07:30, 1230 → 12:30
	const bare = v.match(/^(\d{1,2})(\d{2})$/);
	if (bare && v.length >= 3) return bare[1].padStart(2, '0') + ':' + bare[2] + ':00';
	if (/^\d{1,2}$/.test(v)) return v.padStart(2, '0') + ':00:00';
	return v;
}

/**
 * Parses a German-typed euro amount into cents.
 *
 * Called by: admin/rechnungsausgangsbuch/+page.svelte (Teilzahlung cell)
 * Purpose: Alex types amounts the way he writes them in his book — "1.300,50",
 *          "1300,5", "1300.50", sometimes with a trailing "€". All of those mean
 *          the same number, and a register that rejects three of the four forms
 *          would be slower than the spreadsheet it replaces.
 *
 * A dot is a thousands separator only when a comma is also present ("1.300,50");
 * on its own it is a decimal point ("1300.50"), because that is what a keyboard
 * numpad produces. Cents are rounded, never truncated.
 *
 * @param value - Raw input text
 * @returns Amount in cents, or null when the input is empty or not a number
 */
export function parseEuroInput(value: string): number | null {
	let text = (value ?? '').replace(/[€\s ]/g, '').trim();
	if (text === '') return null;

	if (text.includes(',')) {
		text = text.replace(/\./g, '').replace(',', '.');
	}
	const amount = Number(text);
	if (!Number.isFinite(amount)) return null;
	return Math.round(amount * 100);
}
