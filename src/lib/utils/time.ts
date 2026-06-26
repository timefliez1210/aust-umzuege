/**
 * Tolerant time-input normalization for the worker portal clock fields.
 *
 * Movers type their hours on a phone with a numeric/decimal keypad, so they
 * naturally enter "7.30", "7,30", "730" or just "8" rather than a strict
 * "07:30". This normalizes any of those into a canonical "HH:MM" 24h string
 * so the caller can build a timezone-correct ISO timestamp.
 *
 * Accepted shapes (whitespace ignored):
 *   "7:30" "07:30" "7.30" "7,30" "7 30" "7h30"  → "07:30"
 *   "730"  "0730"                                → "07:30"
 *   "7"    "17"                                   → "07:00" / "17:00"
 *
 * @param raw - Whatever the worker typed.
 * @returns Canonical "HH:MM", or null when the input is empty or not a sane time.
 */
export function normalizeTime(raw: string): string | null {
	const s = (raw ?? '').trim();
	if (!s) return null;

	let hh: number;
	let mm: number;

	// hours + separator (:.,h or space) + minutes  → "7:30", "7.30", "7h30", "7 30"
	const sep = s.match(/^(\d{1,2})\s*[:.,hH ]\s*(\d{1,2})$/);
	if (sep) {
		hh = Number(sep[1]);
		mm = Number(sep[2].padEnd(2, '0')); // "7.3" → 30, not 03
	} else if (/^\d{1,2}$/.test(s)) {
		// bare hour: "7", "17"
		hh = Number(s);
		mm = 0;
	} else if (/^\d{3}$/.test(s)) {
		// "730" → 7:30
		hh = Number(s.slice(0, 1));
		mm = Number(s.slice(1));
	} else if (/^\d{4}$/.test(s)) {
		// "0730" / "1730"
		hh = Number(s.slice(0, 2));
		mm = Number(s.slice(2));
	} else {
		return null;
	}

	if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh > 23 || mm > 59) return null;

	return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Break times are **stored** as integer minutes (the `break_minutes` DB columns),
 * but Alex enters them as **decimal hours** (e.g. `0.25` = a 15-minute break).
 * These two helpers are the single conversion point so every admin break input
 * round-trips identically.
 *
 * Minutes is the canonical "snap": a typed decimal is rounded to the nearest
 * whole minute before storing, then rendered back at 2 decimal places. This makes
 * messy thirds land on clean values both ways:
 *   0.25 → 15 min → "0.25"
 *   0.33 → 20 min → "0.33"   (0.33 × 60 = 19.8, rounds to 20; 20 / 60 = 0.333… → "0.33")
 * and every whole-minute value 0–60 round-trips exactly (see time.test.ts).
 */

/**
 * Parse a user-typed decimal-hours break into integer minutes for the API/DB.
 *
 * Tolerant: accepts a German comma ("0,25"), surrounding whitespace, a plain
 * number, or an empty/garbage value (→ 0). Negatives clamp to 0.
 *
 * @param raw - Whatever sits in the break input ("0.25", "0,25", 1.5, "", null).
 * @returns Whole minutes, rounded to the nearest minute.
 */
export function breakHoursToMinutes(raw: string | number | null | undefined): number {
	if (raw == null) return 0;
	const s = (typeof raw === 'number' ? String(raw) : raw).trim().replace(',', '.');
	if (!s) return 0;
	const hours = parseFloat(s);
	if (!Number.isFinite(hours) || hours <= 0) return 0;
	return Math.round(hours * 60);
}

/**
 * Render stored break minutes as a decimal-hours string for an input field.
 *
 * Returns "" for 0 / null so the field shows its "0" placeholder instead of a
 * literal zero. Otherwise a 2-decimal value with trailing zeros stripped
 * ("0.25", "0.33", "1.5", "1").
 *
 * @param min - Stored break minutes.
 * @returns Decimal-hours string, or "" when empty.
 */
export function breakMinutesToHours(min: number | null | undefined): string {
	if (min == null || min === 0) return '';
	return String(Math.round((min / 60) * 100) / 100);
}
