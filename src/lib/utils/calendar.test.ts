import { describe, it, expect } from 'vitest';
import { buildCalendar } from './calendar';
import type { BaseDaySchedule } from './calendar';

describe('buildCalendar', () => {
	it('generates correct number of days for February 2026 (non-leap)', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const currentMonthDays = days.filter(d => !d.isOverflow);
		expect(currentMonthDays).toHaveLength(28);
	});

	it('generates 31 days for January', () => {
		const days = buildCalendar(2026, 0, [], '2026-01-15');
		const currentMonthDays = days.filter(d => !d.isOverflow);
		expect(currentMonthDays).toHaveLength(31);
	});

	it('starts with correct overflow cells for Monday-based week', () => {
		// Feb 1, 2026 is a Sunday → 6 leading overflow cells (Mon–Sat from Jan)
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const leadingOverflow = days.filter(d => d.isOverflow && d.dateStr < '2026-02-01');
		expect(leadingOverflow).toHaveLength(6);
	});

	it('fills trailing overflow cells to complete the last week row', () => {
		// Feb 2026: 28 days + 6 leading = 34 total → 34 % 7 = 6 → needs 1 trailing day
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const trailingOverflow = days.filter(d => d.isOverflow && d.dateStr > '2026-02-28');
		expect(trailingOverflow).toHaveLength(1);
		expect(trailingOverflow[0].dateStr).toBe('2026-03-01');
	});

	it('total grid length is always a multiple of 7', () => {
		// Test several months
		for (const [y, m] of [[2026, 0], [2026, 1], [2026, 2], [2026, 11]] as [number, number][]) {
			const days = buildCalendar(y, m, []);
			expect(days.length % 7).toBe(0);
		}
	});

	it('overflow cells have isOverflow=true, current month cells have isOverflow=false', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const feb = days.filter(d => d.dateStr.startsWith('2026-02'));
		expect(feb.every(d => !d.isOverflow)).toBe(true);
		const overflow = days.filter(d => !d.dateStr.startsWith('2026-02'));
		expect(overflow.every(d => d.isOverflow)).toBe(true);
	});

	it('marks today correctly', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const today = days.find(d => d.isToday);
		expect(today).toBeDefined();
		expect(today!.date).toBe(15);
	});

	it('does not mark any day as today when today is outside the month', () => {
		const days = buildCalendar(2026, 1, [], '2026-03-05');
		// Mar 5 is not in this grid at all, so no day is today
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
		const day10 = days.find(d => d.dateStr === '2026-02-10');
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
		const day10 = days.find(d => d.dateStr === '2026-02-10');
		expect(day10!.schedule).toBeTruthy();
	});

	it('returns null schedule for days without data', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		expect(days.find(d => d.dateStr === '2026-02-01')!.schedule).toBeNull();
	});

	it('generates correct keys in YYYY-MM-DD format for current month days', () => {
		const days = buildCalendar(2026, 1, [], '2026-02-15');
		const day1 = days.find(d => d.dateStr === '2026-02-01');
		expect(day1!.key).toBe('2026-02-01');
	});

	it('each day has a dateStr property matching the full ISO date', () => {
		const days = buildCalendar(2026, 2, [], '2026-03-15'); // March 2026
		const march15 = days.find(d => d.dateStr === '2026-03-15');
		expect(march15).toBeDefined();
		expect(march15!.isOverflow).toBe(false);
	});
});
