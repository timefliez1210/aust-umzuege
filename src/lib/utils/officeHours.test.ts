import { describe, it, expect } from 'vitest';
import { computeOpenState } from './officeHours.svelte';

/**
 * Documented intent: office hours are Mon–Fri 09:00–19:00 Europe/Berlin.
 * All instants below are given in UTC; Berlin is UTC+2 in June (CEST)
 * and UTC+1 in January (CET), so these tests also pin the DST handling.
 */
const at = (iso: string) => computeOpenState(new Date(iso));

describe('computeOpenState — open window', () => {
	it('is open mid-day on a weekday', () => {
		// Wed 2026-06-10 10:00 Berlin
		const s = at('2026-06-10T08:00:00Z');
		expect(s.open).toBe(true);
		expect(s.soon).toBe(false);
		expect(s.label).toBe('Geöffnet — wir gehen sofort ran');
		expect(s.reopens).toBe(null);
	});

	it('opens exactly at 09:00', () => {
		// Wed 09:00 Berlin
		expect(at('2026-06-10T07:00:00Z').open).toBe(true);
	});

	it('is closed exactly at 19:00', () => {
		// Wed 19:00 Berlin
		expect(at('2026-06-10T17:00:00Z').open).toBe(false);
	});

	it('flags the last 30 minutes as "soon" with a countdown label', () => {
		// Wed 18:35 Berlin → 25 min left
		const s = at('2026-06-10T16:35:00Z');
		expect(s.open).toBe(true);
		expect(s.soon).toBe(true);
		expect(s.label).toBe('Noch 25 Min geöffnet');
	});

	it('the soon window starts at exactly 30 minutes before close', () => {
		// Wed 18:30 Berlin
		const s = at('2026-06-10T16:30:00Z');
		expect(s.soon).toBe(true);
		expect(s.label).toBe('Noch 30 Min geöffnet');
		// Wed 18:29 Berlin → 31 min left, not yet "soon"
		expect(at('2026-06-10T16:29:00Z').soon).toBe(false);
	});

	it('respects winter time (CET, UTC+1)', () => {
		// Wed 2026-01-14 09:30 Berlin = 08:30 UTC
		expect(at('2026-01-14T08:30:00Z').open).toBe(true);
		// Same UTC instant in June would be 10:30 — in January 08:30 UTC-1h earlier:
		// Wed 2026-01-14 08:30 Berlin = 07:30 UTC → still closed
		expect(at('2026-01-14T07:30:00Z').open).toBe(false);
	});
});

describe('computeOpenState — closed states and reopen hints', () => {
	it('before opening on a weekday → "heute ab 09:00 Uhr"', () => {
		// Wed 08:59 Berlin
		const s = at('2026-06-10T06:59:00Z');
		expect(s.open).toBe(false);
		expect(s.label).toBe('Aktuell geschlossen');
		expect(s.reopens).toBe('heute ab 09:00 Uhr');
	});

	it('after closing Mon–Thu → "morgen ab 09:00 Uhr"', () => {
		// Wed 20:00 Berlin
		expect(at('2026-06-10T18:00:00Z').reopens).toBe('morgen ab 09:00 Uhr');
	});

	it('Friday evening → "am Montag ab 09:00 Uhr"', () => {
		// Fri 2026-06-12 19:30 Berlin
		expect(at('2026-06-12T17:30:00Z').reopens).toBe('am Montag ab 09:00 Uhr');
	});

	it('Saturday → "am Montag ab 09:00 Uhr"', () => {
		// Sat 2026-06-13 12:00 Berlin
		const s = at('2026-06-13T10:00:00Z');
		expect(s.open).toBe(false);
		expect(s.reopens).toBe('am Montag ab 09:00 Uhr');
	});

	it('Sunday → "morgen (Montag) ab 09:00 Uhr"', () => {
		// Sun 2026-06-14 12:00 Berlin
		const s = at('2026-06-14T10:00:00Z');
		expect(s.open).toBe(false);
		expect(s.reopens).toBe('morgen (Montag) ab 09:00 Uhr');
	});

	it('weekend mornings inside the 09–19 window are still closed', () => {
		// Sat 10:00 Berlin
		expect(at('2026-06-13T08:00:00Z').open).toBe(false);
	});
});
