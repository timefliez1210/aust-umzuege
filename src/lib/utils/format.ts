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
