// Office hours: Mon–Fri 09:00–19:00 Europe/Berlin.
// `hours` is a reactive Svelte 5 rune so all CTAs re-render across open/close.

export type HoursState = {
	open: boolean;
	soon: boolean;        // last 30 min of open window
	label: string;        // status pill text
	reopens: string | null; // human-readable next open (German)
};

function berlinNow(now = new Date()): { day: number; mins: number } {
	// Project the given instant into Europe/Berlin wall-clock.
	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Europe/Berlin',
		weekday: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(now);
	const wd = parts.find(p => p.type === 'weekday')?.value ?? 'Mon';
	const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
	const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
	const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
	return { day: dayMap[wd] ?? 1, mins: h * 60 + m };
}

export function computeOpenState(now = new Date()): HoursState {
	const { day, mins } = berlinNow(now);
	const weekday = day >= 1 && day <= 5;
	const openMins = 9 * 60;
	const closeMins = 19 * 60;

	if (weekday && mins >= openMins && mins < closeMins) {
		const left = closeMins - mins;
		if (left <= 30) {
			return { open: true, soon: true, label: `Noch ${left} Min geöffnet`, reopens: null };
		}
		return { open: true, soon: false, label: 'Geöffnet — wir gehen sofort ran', reopens: null };
	}

	let reopens = 'morgen ab 09:00 Uhr';
	if (weekday && mins < openMins) reopens = 'heute ab 09:00 Uhr';
	else if (day === 5 && mins >= closeMins) reopens = 'am Montag ab 09:00 Uhr';
	else if (day === 6) reopens = 'am Montag ab 09:00 Uhr';
	else if (day === 0) reopens = 'morgen (Montag) ab 09:00 Uhr';

	return { open: false, soon: false, label: 'Aktuell geschlossen', reopens };
}

export const hours = $state<HoursState>(computeOpenState());

if (typeof window !== 'undefined') {
	setInterval(() => Object.assign(hours, computeOpenState()), 30_000);
}
