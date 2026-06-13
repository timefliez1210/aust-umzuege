import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '$lib/utils/api.svelte';
import { normalizeTimeInput } from '$lib/utils/format';
import { adminLogin, createEmployee, cleanup, newRefs } from './helpers';

interface CalendarItemRow {
	id: string;
	title: string;
	category: string;
	scheduled_date: string | null;
	status: string;
}

interface EmployeeAssignmentRow {
	employee_id: string;
	job_date: string;
	clock_in: string | null;
	clock_out: string | null;
	break_minutes: number;
	actual_hours: number | null;
	notes: string | null;
}

interface EmployeeHoursSummary {
	actual_hours: number;
	calendar_items: Array<{
		calendar_item_id: string;
		actual_hours: number | null;
	}>;
}

const refs = newRefs();
const createdItemIds: string[] = [];

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	for (const id of createdItemIds) {
		await apiDelete(`/api/v1/admin/calendar-items/${id}`).catch(() => {});
	}
	await cleanup(refs);
});

describe('calendar item CRUD', () => {
	let itemId: string;

	it('creates a calendar item and reads it back', async () => {
		const created = await apiPost<CalendarItemRow>('/api/v1/admin/calendar-items', {
			title: 'Integration Schulung',
			category: 'schulung',
			scheduled_date: '2027-08-15',
			status: 'scheduled',
			start_time: '09:00:00',
		});
		expect(created.id).toBeTruthy();
		itemId = created.id;
		createdItemIds.push(itemId);

		const detail = await apiGet<CalendarItemRow>(`/api/v1/admin/calendar-items/${itemId}`);
		expect(detail.title).toBe('Integration Schulung');
		expect(detail.category).toBe('schulung');
		expect(detail.scheduled_date).toContain('2027-08-15');
	});

	it('patches title and status, reads back updated values', async () => {
		await apiPatch(`/api/v1/admin/calendar-items/${itemId}`, {
			title: 'Schulung Aktualisiert',
			status: 'completed',
		});

		const detail = await apiGet<CalendarItemRow>(`/api/v1/admin/calendar-items/${itemId}`);
		expect(detail.title).toBe('Schulung Aktualisiert');
		expect(detail.status).toBe('completed');
	});

	it('deletes the item and returns 404 on re-read', async () => {
		await apiDelete(`/api/v1/admin/calendar-items/${itemId}`);
		createdItemIds.splice(createdItemIds.indexOf(itemId), 1);

		try {
			await apiGet(`/api/v1/admin/calendar-items/${itemId}`);
			expect.fail('expected 404');
		} catch (err: unknown) {
			expect((err as { status: number }).status).toBe(404);
		}
	});
});

describe('employee assignment on a calendar item', () => {
	const scheduledDate = `${new Date().toISOString().slice(0, 7)}-20`;
	let itemId: string;
	let employeeId: string;

	it('creates item and assigns employee', async () => {
		const created = await apiPost<CalendarItemRow>('/api/v1/admin/calendar-items', {
			title: 'Zuweisung Testtermin',
			category: 'intern',
			scheduled_date: scheduledDate,
			start_time: '08:00:00',
		});
		itemId = created.id;
		createdItemIds.push(itemId);

		const employee = await createEmployee(refs);
		employeeId = employee.id;

		const assigned = await apiPost<EmployeeAssignmentRow[]>(
			`/api/v1/admin/calendar-items/${itemId}/employees`,
			{ employee_id: employeeId }
		);
		expect(assigned.some((a) => a.employee_id === employeeId)).toBe(true);
	});

	it('patches clock times and reads back computed actual_hours', async () => {
		await apiPatch(`/api/v1/admin/calendar-items/${itemId}/employees/${employeeId}`, {
			clock_in: '07:00:00',
			clock_out: '15:00:00',
			break_minutes: 30,
		});

		const list = await apiGet<EmployeeAssignmentRow[]>(
			`/api/v1/admin/calendar-items/${itemId}/employees`
		);
		const mine = list.find((a) => a.employee_id === employeeId);
		expect(mine, 'assignment fehlt nach PATCH').toBeDefined();
		expect(mine!.clock_in).toBe('07:00:00');
		expect(mine!.clock_out).toBe('15:00:00');
		expect(mine!.break_minutes).toBe(30);
		expect(mine!.actual_hours).toBeCloseTo(7.5);
	});

	it('calendar item hours appear in admin employee hours summary', async () => {
		const month = scheduledDate.slice(0, 7);
		const summary = await apiGet<EmployeeHoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${month}`
		);

		const itemEntry = (summary.calendar_items ?? []).find(
			(ci) => ci.calendar_item_id === itemId
		);
		expect(itemEntry, 'Kalendereintrag fehlt in Stundenzusammenfassung').toBeDefined();
		expect(itemEntry!.actual_hours).toBeCloseTo(7.5);
		expect(summary.actual_hours).toBeGreaterThanOrEqual(7.5);
	});
});

describe('PUT employees — full-replace preserves existing clock times (COALESCE regression)', () => {
	const scheduledDate = `${new Date().toISOString().slice(0, 7)}-20`;
	let itemId: string;
	let employeeId: string;

	beforeAll(async () => {
		const created = await apiPost<CalendarItemRow>('/api/v1/admin/calendar-items', {
			title: 'PUT Regression Testtermin',
			category: 'intern',
			scheduled_date: scheduledDate,
			start_time: '08:00:00',
		});
		itemId = created.id;
		createdItemIds.push(itemId);

		const employee = await createEmployee(refs);
		employeeId = employee.id;

		await apiPost(`/api/v1/admin/calendar-items/${itemId}/employees`, {
			employee_id: employeeId,
		});

		await apiPatch(`/api/v1/admin/calendar-items/${itemId}/employees/${employeeId}`, {
			clock_in: '07:00:00',
			clock_out: '15:00:00',
			break_minutes: 30,
		});
	});

	it('PUT with new times does not overwrite existing clock_in when COALESCE wins', async () => {
		const before = await apiGet<EmployeeAssignmentRow[]>(
			`/api/v1/admin/calendar-items/${itemId}/employees`
		);
		expect(before.find((a) => a.employee_id === employeeId)?.clock_in).toBe('07:00:00');

		await apiPut(`/api/v1/admin/calendar-items/${itemId}/employees`, [
			{
				employee_id: employeeId,
				job_date: scheduledDate,
				notes: null,
				clock_in: normalizeTimeInput('08:00'),
				clock_out: normalizeTimeInput('17:00'),
				break_minutes: 0,
			},
		]);

		const after = await apiGet<EmployeeAssignmentRow[]>(
			`/api/v1/admin/calendar-items/${itemId}/employees`
		);
		const mine = after.find((a) => a.employee_id === employeeId);
		expect(mine, 'assignment fehlt nach PUT').toBeDefined();
		expect(mine!.clock_in).toBe('07:00:00');
	});
});

describe('remove employee assignment', () => {
	const scheduledDate = `${new Date().toISOString().slice(0, 7)}-20`;
	let itemId: string;
	let employeeId: string;

	beforeAll(async () => {
		const created = await apiPost<CalendarItemRow>('/api/v1/admin/calendar-items', {
			title: 'Entfernung Testtermin',
			category: 'intern',
			scheduled_date: scheduledDate,
			start_time: '08:00:00',
		});
		itemId = created.id;
		createdItemIds.push(itemId);

		const employee = await createEmployee(refs);
		employeeId = employee.id;

		await apiPost(`/api/v1/admin/calendar-items/${itemId}/employees`, {
			employee_id: employeeId,
		});

		await apiPatch(`/api/v1/admin/calendar-items/${itemId}/employees/${employeeId}`, {
			clock_in: '07:00:00',
			clock_out: '15:00:00',
			break_minutes: 30,
		});
	});

	it('removes the assignment and employee list is empty', async () => {
		await apiDelete(`/api/v1/admin/calendar-items/${itemId}/employees/${employeeId}`);

		const list = await apiGet<EmployeeAssignmentRow[]>(
			`/api/v1/admin/calendar-items/${itemId}/employees`
		);
		expect(list.find((a) => a.employee_id === employeeId)).toBeUndefined();
	});

	it('employee hours summary no longer includes the calendar item', async () => {
		const month = scheduledDate.slice(0, 7);
		const summary = await apiGet<EmployeeHoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${month}`
		);
		const itemEntry = (summary.calendar_items ?? []).find(
			(ci) => ci.calendar_item_id === itemId
		);
		expect(itemEntry).toBeUndefined();
	});
});

describe('rechnungsausgangsbuch smoke test', () => {
	it('returns 200 with an array', async () => {
		const rows = await apiGet<unknown[]>('/api/v1/admin/rechnungsausgangsbuch');
		expect(Array.isArray(rows)).toBe(true);
	});
});
