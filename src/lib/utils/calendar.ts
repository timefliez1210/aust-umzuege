export interface CalendarDay<S extends BaseDaySchedule = BaseDaySchedule> {
	date: number;       // day-of-month (1–31); overflow cells use the adjacent month's day number
	dateStr: string;    // full ISO date string (YYYY-MM-DD)
	key: string;
	schedule: S | null;
	isToday: boolean;
	isOverflow: boolean; // true = this cell belongs to the previous or next month
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
 *          grid ready for direct rendering. Leading and trailing cells are filled
 *          with overflow days from the adjacent months so every row is a full week.
 *
 * @param y - Full calendar year (e.g. 2026)
 * @param m - Zero-indexed month (0 = January, 11 = December), matching JS Date convention
 * @param sched - Array of schedule objects from the API, each keyed by ISO date string
 * @param today - Optional ISO date string representing today (defaults to current local date);
 *                used to set the isToday flag on the matching cell
 * @returns Array of CalendarDay cells ordered left-to-right, top-to-bottom; leading and
 *          trailing overflow cells have isOverflow=true and belong to adjacent months
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
	const pad = (n: number) => String(n).padStart(2, '0');

	const days: CalendarDay<S>[] = [];

	// Leading overflow: last N days of the previous month
	if (startDay > 0) {
		const prevMonthEnd = new Date(y, m, 0); // last day of previous month
		const prevY = prevMonthEnd.getFullYear();
		const prevM = prevMonthEnd.getMonth(); // 0-indexed
		const prevLast = prevMonthEnd.getDate();
		for (let i = startDay - 1; i >= 0; i--) {
			const d = prevLast - i;
			const dateStr = `${prevY}-${pad(prevM + 1)}-${pad(d)}`;
			days.push({
				date: d,
				dateStr,
				key: `overflow-prev-${dateStr}`,
				schedule: schedMap.get(dateStr) || null,
				isToday: dateStr === todayStr,
				isOverflow: true,
			});
		}
	}

	// Current month days
	for (let d = 1; d <= daysInMonth; d++) {
		const dateStr = `${y}-${pad(m + 1)}-${pad(d)}`;
		days.push({
			date: d,
			dateStr,
			key: dateStr,
			schedule: schedMap.get(dateStr) || null,
			isToday: dateStr === todayStr,
			isOverflow: false,
		});
	}

	// Trailing overflow: first N days of the next month to complete the last week row
	const remainder = days.length % 7;
	if (remainder !== 0) {
		const trailingCount = 7 - remainder;
		const nextMonthStart = new Date(y, m + 1, 1);
		const nextY = nextMonthStart.getFullYear();
		const nextM = nextMonthStart.getMonth(); // 0-indexed
		for (let d = 1; d <= trailingCount; d++) {
			const dateStr = `${nextY}-${pad(nextM + 1)}-${pad(d)}`;
			days.push({
				date: d,
				dateStr,
				key: `overflow-next-${dateStr}`,
				schedule: schedMap.get(dateStr) || null,
				isToday: dateStr === todayStr,
				isOverflow: true,
			});
		}
	}

	return days;
}

/**
 * Returns the ISO 8601 week number (1–53) for a given date string.
 *
 * Called by: admin/calendar/+page.svelte (month-view KW column)
 * Why: ISO week numbers are the standard way German businesses refer to weeks (KW 14 etc.)
 *
 * Math:
 *   Shift to nearest Thursday (ISO weeks run Mon–Sun, keyed on Thursday).
 *   Week 1 is the week containing the first Thursday of the year.
 *   weekNumber = ceil((dayOfYear(thursday) + 1) / 7)
 *
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns ISO week number 1–53
 */
export function getISOWeek(dateStr: string): number {
	const d = new Date(dateStr);
	d.setHours(0, 0, 0, 0);
	// Shift to nearest Thursday: Mon=1 … Sun=7; getDay() returns 0 for Sun
	d.setDate(d.getDate() + 4 - (d.getDay() || 7));
	const yearStart = new Date(d.getFullYear(), 0, 1);
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}
