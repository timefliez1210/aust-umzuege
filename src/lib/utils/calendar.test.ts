import { describe, it, expect } from 'vitest';
import { buildCalendar } from './calendar';
import type { BaseDaySchedule } from './calendar';

describe('buildCalendar', () => {
	it('generates correct number of days for February 2026 (non-leap)', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const dateDays = days.filter(d => d.date !== null);
		expect(dateDays).toHaveLength(28);
	});

	it('generates 31 days for January', () => {
		const days = buildCalendar(2026, 0, [], '2026-01-15');
		const dateDays = days.filter(d => d.date !== null);
		expect(dateDays).toHaveLength(31);
	});

	it('starts with correct empty cells for Monday-based week', () => {
		// Feb 1, 2026 is a Sunday → 6 empty cells before day 1
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const emptyCells = days.filter(d => d.date === null);
		expect(emptyCells).toHaveLength(6);
	});

	it('marks today correctly', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const today = days.find(d => d.isToday);
		expect(today).toBeDefined();
		expect(today!.date).toBe(15);
	});

	it('does not mark any day as today when today is outside the month', () => {
		const days = buildCalendar(2026, 1, [], '2026-03-01');
		const today = days.find(d => d.isToday);
		expect(today).toBeUndefined();
	});

	it('maps schedule data to correct days', () => {
		const sched: BaseDaySchedule[] = [{
			date: '2026-02-10',
			inquiries: [],
			available: true,
			capacity: 2,
			booked: 1,
			remaining: 1,
		}];
		const days = buildCalendar(2026, 1, sched, '2026-02-15');
		const day10 = days.find(d => d.date === 10);
		expect(day10!.schedule).toBeTruthy();
		expect(day10!.schedule!.booked).toBe(1);
	});

	it('handles schedule dates with T-suffix', () => {
		const sched: BaseDaySchedule[] = [{
			date: '2026-02-10T00:00:00Z',
			inquiries: [],
			available: true,
			capacity: 1,
			booked: 0,
			remaining: 1,
		}];
		const days = buildCalendar(2026, 1, sched, '2026-02-15');
		const day10 = days.find(d => d.date === 10);
		expect(day10!.schedule).toBeTruthy();
	});

	it('returns null schedule for days without data', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		expect(days.find(d => d.date === 1)!.schedule).toBeNull();
	});

	it('generates correct keys in YYYY-MM-DD format', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const day1 = days.find(d => d.date === 1);
		expect(day1!.key).toBe('2026-02-01');
	});
});
