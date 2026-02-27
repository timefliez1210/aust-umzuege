export interface CalendarDay<S extends BaseDaySchedule = BaseDaySchedule> {
	date: number | null;
	key: string;
	schedule: S | null;
	isToday: boolean;
}

export interface BaseDaySchedule {
	date: string;
	bookings: unknown[];
	availability: {
		capacity: number;
		booked: number;
		available: boolean;
		remaining: number;
	};
}

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
