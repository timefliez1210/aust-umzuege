export interface CalendarDay<S extends BaseDaySchedule = BaseDaySchedule> {
	date: number | null;
	key: string;
	schedule: S | null;
	isToday: boolean;
}

export interface BaseDaySchedule {
	date: string;
	inquiries: unknown[];
	available: boolean;
	capacity: number;
	booked: number;
	remaining: number;
}

/**
 * Builds a grid of calendar day cells for a given month, merging schedule data from the API.
 *
 * Called by: admin/calendar/+page.svelte (as a reactive $derived value whenever
 *            year, month, or schedule data changes)
 * Purpose: Transforms a flat list of API schedule objects into a Monday-anchored
 *          grid ready for direct rendering; leading empty cells align the first day
 *          of the month to the correct weekday column
 *
 * @param y - Full calendar year (e.g. 2026)
 * @param m - Zero-indexed month (0 = January, 11 = December), matching JS Date convention
 * @param sched - Array of schedule objects from the API, each keyed by ISO date string
 * @param today - Optional ISO date string representing today (defaults to current local date);
 *                used to set the isToday flag on the matching cell
 * @returns Array of CalendarDay cells ordered left-to-right, top-to-bottom; leading
 *          cells for pre-month padding have date=null and schedule=null
 */
export function buildCalendar<S extends BaseDaySchedule>(
	y: number,
	m: number,
	sched: S[],
	today?: string
): CalendarDay<S>[] {
	const first = new Date(y, m, 1);
	const startDay = (first.getDay() + 6) % 7; // Monday=0
	const daysInMonth = new Date(y, m + 1, 0).getDate();
	const schedMap = new Map(sched.map((d) => [d.date.split('T')[0], d]));
	const todayStr = today ?? new Date().toISOString().split('T')[0];

	const days: CalendarDay<S>[] = [];

	for (let i = 0; i < startDay; i++) {
		days.push({ date: null, key: `empty-${i}`, schedule: null, isToday: false });
	}

	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
		days.push({
			date: d,
			key: dateStr,
			schedule: schedMap.get(dateStr) || null,
			isToday: dateStr === todayStr,
		});
	}

	return days;
}
