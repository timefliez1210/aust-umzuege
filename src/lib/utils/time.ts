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
