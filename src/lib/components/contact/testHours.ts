/**
 * Test helper: force the shared office-hours rune into a known state.
 * The real module recomputes every 30s from the wall clock; tests must not
 * depend on when they run.
 */
import { hours } from '$lib/utils/officeHours.svelte';

export function setHoursOpen(): void {
	Object.assign(hours, {
		open: true,
		soon: false,
		label: 'Geöffnet — wir gehen sofort ran',
		reopens: null,
	});
}

export function setHoursClosed(reopens = 'morgen ab 09:00 Uhr'): void {
	Object.assign(hours, {
		open: false,
		soon: false,
		label: 'Aktuell geschlossen',
		reopens,
	});
}
