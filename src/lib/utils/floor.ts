/**
 * Converts a numeric floor code stored in the database to a German display label.
 *
 * Called by: quotes/[id]/+page.svelte (address info panels for origin and destination)
 * Purpose: Translates raw floor values (e.g. "0", "1", "-1") from the API into
 *          the German terms shown to the admin (e.g. "Erdgeschoss", "1. OG", "Keller")
 *
 * @param floor - Floor value from the API as a string, or null
 * @returns Human-readable German floor label; returns "EG" when floor is null/empty,
 *          falls back to "{floor}. OG" for values not in the lookup table
 */
export function floorLabel(floor: string | null): string {
	if (!floor) return 'EG';
	const labels: Record<string, string> = {
		'0': 'Erdgeschoss', '1': '1. OG', '2': '2. OG', '3': '3. OG',
		'4': '4. OG', '5': '5. OG', '-1': 'Keller'
	};
	return labels[floor] || `${floor}. OG`;
}

/**
 * Parses a floor string from the public quote form into a numeric floor index.
 *
 * Called by: quotes/[id]/+page.svelte (when preparing the estimation payload,
 *            to convert address floor strings into integers for the API)
 * Purpose: The public quote form collects floor as a free-text or select value
 *          (e.g. "Erdgeschoss", "3. Stock", "Höher als 6. Stock"); this function
 *          normalises those strings to integers the backend pricing model expects
 *
 * @param floor - Floor string from the quote form, or null
 * @returns Numeric floor index: 0 for ground floor/null, 7 for "Höher als 6. Stock",
 *          leading digit for patterns like "3. Stock" or "1. OG", 0 as fallback
 */
export function parseFloor(floor: string | null): number {
	if (!floor) return 0;
	const s = floor.trim();
	if (s === 'Erdgeschoss' || s === 'Hochparterre' || s === '0') return 0;
	if (s === 'Höher als 6. Stock') return 7;
	const m = s.match(/^(\d+)/);
	return m ? parseInt(m[1]) : 0;
}
