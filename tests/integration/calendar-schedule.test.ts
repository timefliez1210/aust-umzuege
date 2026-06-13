/**
 * Round-trip: the calendar planning endpoints the admin dashboard reads —
 * `/calendar/availability`, `/calendar/schedule`, `/calendar/capacity/{date}`.
 *
 * These power the booking calendar grid (schedule) and the public-facing
 * date-availability check (availability). Both expose the same
 * capacity/booked/remaining/available semantics, so a scheduled job or a
 * capacity override must move both in lock-step.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '$lib/utils/api.svelte';
import { adminLogin, createCustomer, createInquiry, cleanup, newRefs } from './helpers';

interface DateAvailability {
	date: string;
	available: boolean;
	capacity: number;
	booked: number;
	remaining: number;
}

interface AvailabilityResult {
	requested_date: string;
	requested_date_available: boolean;
	requested_date_info: DateAvailability;
	alternatives: DateAvailability[];
}

interface ScheduleEntry {
	date: string;
	available: boolean;
	capacity: number;
	booked: number;
	remaining: number;
	inquiries: Array<{ inquiry_id: string; status: string }>;
	calendar_items: Array<{ calendar_item_id: string; title: string }>;
}

const refs = newRefs();
const createdItemIds: string[] = [];
// Dates restored to their default capacity in teardown.
const overriddenDates = new Set<string>();
let defaultCapacity = 1;

// Far-future, collision-free dates (no other suite touches 2028).
const CAP_DATE = '2028-03-15';
const INQ_DATE = '2028-03-16';
const ITEM_DATE = '2028-03-17';

const availability = (date: string) =>
	apiGet<AvailabilityResult>(`/api/v1/calendar/availability?date=${date}`);

const scheduleDay = async (date: string): Promise<ScheduleEntry> => {
	const entries = await apiGet<ScheduleEntry[]>(
		`/api/v1/calendar/schedule?from=${date}&to=${date}`
	);
	expect(entries, `schedule liefert keinen Eintrag für ${date}`).toHaveLength(1);
	return entries[0];
};

const setCapacity = async (date: string, capacity: number) => {
	overriddenDates.add(date);
	return apiPut<{ override_date: string; capacity: number }>(
		`/api/v1/calendar/capacity/${date}`,
		{ capacity }
	);
};

beforeAll(async () => {
	await adminLogin();
	// A pristine far-future date reports the configured default capacity.
	defaultCapacity = (await availability('2028-06-10')).requested_date_info.capacity;
});

afterAll(async () => {
	for (const date of overriddenDates) {
		await setCapacity(date, defaultCapacity).catch(() => {});
	}
	for (const id of createdItemIds) {
		await apiDelete(`/api/v1/admin/calendar-items/${id}`).catch(() => {});
	}
	await cleanup(refs);
});

describe('capacity override round-trips through availability + schedule', () => {
	it('PUT /capacity/{date} is reflected by both availability and schedule', async () => {
		const res = await setCapacity(CAP_DATE, 5);
		expect(res.capacity).toBe(5);
		expect(res.override_date).toContain(CAP_DATE);

		const avail = await availability(CAP_DATE);
		expect(avail.requested_date_info.capacity).toBe(5);
		expect(avail.requested_date_info.booked).toBe(0);
		expect(avail.requested_date_info.remaining).toBe(5);
		expect(avail.requested_date_available).toBe(true);

		const day = await scheduleDay(CAP_DATE);
		expect(day.capacity).toBe(5);
		expect(day.remaining).toBe(5);
		expect(day.available).toBe(true);
	});

	it('capacity 0 marks the day unavailable in both endpoints', async () => {
		await setCapacity(CAP_DATE, 0);

		const avail = await availability(CAP_DATE);
		expect(avail.requested_date_info.capacity).toBe(0);
		expect(avail.requested_date_available).toBe(false);

		const day = await scheduleDay(CAP_DATE);
		expect(day.capacity).toBe(0);
		expect(day.available).toBe(false);
	});

	it('rejects a negative capacity', async () => {
		try {
			await apiPut(`/api/v1/calendar/capacity/${CAP_DATE}`, { capacity: -1 });
			expect.fail('negative capacity sollte 400 sein');
		} catch (err: unknown) {
			expect((err as { status: number }).status).toBe(400);
		}
	});
});

describe('a scheduled inquiry consumes a slot consistently', () => {
	it('booked === 1 in BOTH availability and schedule once a job is scheduled on the date', async () => {
		await setCapacity(INQ_DATE, 5);

		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id, { scheduled_date: INQ_DATE });
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'scheduled' });

		const avail = await availability(INQ_DATE);
		expect(avail.requested_date_info.booked).toBe(1);
		expect(avail.requested_date_info.remaining).toBe(4);

		const day = await scheduleDay(INQ_DATE);
		expect(day.inquiries.some((i) => i.inquiry_id === inquiryId)).toBe(true);
		expect(day.booked).toBe(1);
		expect(day.remaining).toBe(4);

		// The two endpoints must agree on occupancy.
		expect(day.booked).toBe(avail.requested_date_info.booked);
	});
});

describe('schedule range validation', () => {
	it('rejects from > to', async () => {
		try {
			await apiGet('/api/v1/calendar/schedule?from=2028-03-20&to=2028-03-10');
			expect.fail('from > to sollte 400 sein');
		} catch (err: unknown) {
			expect((err as { status: number }).status).toBe(400);
		}
	});

	it('rejects a range wider than 90 days', async () => {
		try {
			await apiGet('/api/v1/calendar/schedule?from=2028-01-01&to=2028-12-31');
			expect.fail('range > 90 Tage sollte 400 sein');
		} catch (err: unknown) {
			expect((err as { status: number }).status).toBe(400);
		}
	});
});

/**
 * Regression guard — calendar items must consume capacity consistently across
 * `/availability` and `/schedule`.
 *
 * `calendar_repo::count_active_on_date` (availability) counts inquiries AND
 * non-cancelled calendar_items spanning the date. `get_schedule` previously
 * computed `booked = day_inquiries.len()` and ignored `day_cal_items`, so a day
 * holding a training/internal calendar item (which occupies the crew) was
 * reported FULL by availability but FREE by the schedule grid the admin books
 * against — and the calendar's "Überbucht" warning never fired. Fixed in
 * `get_schedule` so `booked` includes calendar items; this test pins it.
 */
describe('calendar item occupancy agrees across availability + schedule', () => {
	it('a calendar item makes the day booked in BOTH availability and schedule', async () => {
		await setCapacity(ITEM_DATE, 1);

		const item = await apiPost<{ id: string }>('/api/v1/admin/calendar-items', {
			title: 'Belegung Schulung',
			category: 'schulung',
			scheduled_date: ITEM_DATE,
			start_time: '08:00:00',
		});
		createdItemIds.push(item.id);

		const avail = await availability(ITEM_DATE);
		expect(avail.requested_date_info.booked, 'availability zählt das Item').toBe(1);
		expect(avail.requested_date_available).toBe(false);

		const day = await scheduleDay(ITEM_DATE);
		expect(day.calendar_items.some((c) => c.calendar_item_id === item.id)).toBe(true);

		// Both endpoints must report the same occupancy for the same day.
		expect(day.booked, 'schedule muss Kalender-Items als booked zählen').toBe(
			avail.requested_date_info.booked
		);
		expect(day.available).toBe(avail.requested_date_available);
	});
});
