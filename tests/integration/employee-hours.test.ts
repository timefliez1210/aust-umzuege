/**
 * Round-trip: admin sets clock times for an assigned employee, worker
 * overrides with their own clock, monthly aggregates are verified at every
 * read point. Tests run in declaration order inside each describe block;
 * shared state is established in beforeAll.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPatch, apiPost } from '$lib/utils/api.svelte';
import { normalizeTimeInput } from '$lib/utils/format';
import {
	adminLogin,
	createCustomer,
	createEmployee,
	createInquiry,
	cleanup,
	newRefs,
	workerOtpLogin,
	workerPatchRaw,
} from './helpers';

// ── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
	employee_id: string;
	clock_in: string | null;
	clock_out: string | null;
	break_minutes: number | null;
	actual_hours: number | null;
	employee_clock_in: string | null;
	employee_clock_out: string | null;
	employee_actual_hours: number | null;
}

interface InquiryEmployeeSnapshot {
	employee_id: string;
	actual_hours: number | null;
	employee_clock_in: string | null;
	employee_actual_hours: number | null;
}

interface InquiryDetail {
	id: string;
	status: string;
	employees: InquiryEmployeeSnapshot[];
}

interface HoursSummaryAssignment {
	inquiry_id: string;
	actual_hours: number | null;
	employee_clock_in: string | null;
}

interface HoursSummary {
	actual_hours: number | null;
	target_hours: number | null;
	assignments: HoursSummaryAssignment[];
}

interface EmployeeListItem {
	id: string;
	actual_hours_month: number | null;
}

interface EmployeeListResponse {
	employees: EmployeeListItem[];
	total: number;
}

// ── Shared fixture ───────────────────────────────────────────────────────────

const refs = newRefs();

// Current-month date so all hours queries find the inquiry.
const scheduledDate = new Date().toISOString().slice(0, 7) + '-15';
const currentMonth = scheduledDate.slice(0, 7);

let inquiryId: string;
let employeeId: string;
let employeeEmail: string;

beforeAll(async () => {
	await adminLogin();

	const customer = await createCustomer(refs);
	const employee = await createEmployee(refs);
	employeeId = employee.id;
	employeeEmail = employee.email;

	inquiryId = await createInquiry(refs, customer.id, {
		scheduled_date: scheduledDate,
	});

	// Status must be `scheduled` for the worker schedule endpoint to expose the job.
	await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'scheduled' });

	// Assign the employee.
	await apiPost(`/api/v1/inquiries/${inquiryId}/employees`, {
		employee_id: employeeId,
		notes: null,
	});

	// Admin sets clock_in 08:00, clock_out 17:00, break 30 min.
	await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
		clock_in: normalizeTimeInput('08:00'),
	});
	await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
		clock_out: normalizeTimeInput('17:00'),
	});
	await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
		break_minutes: 30,
	});
});

afterAll(async () => {
	await cleanup(refs);
});

// ── 1a. actual_hours math across three read points ───────────────────────────

describe('1a: admin clock times → actual_hours (3 read points)', () => {
	it('read point 1 — GET /inquiries/{id} employees snapshot has actual_hours ≈ 8.5', async () => {
		const detail = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		const emp = detail.employees.find((e) => e.employee_id === employeeId);
		expect(emp, 'employee nicht im inquiry snapshot').toBeDefined();
		expect(emp!.actual_hours).toBeCloseTo(8.5, 1);
	});

	it('read point 2 — GET /inquiries/{id}/employees has actual_hours ≈ 8.5', async () => {
		const list = await apiGet<Assignment[]>(`/api/v1/inquiries/${inquiryId}/employees`);
		const mine = list.find((a) => a.employee_id === employeeId);
		expect(mine, 'assignment nicht in Liste').toBeDefined();
		expect(mine!.actual_hours).toBeCloseTo(8.5, 1);
	});

	it('read point 3 — GET /admin/employees/{id}/hours?month= has actual_hours ≈ 8.5 and inquiry in assignments', async () => {
		const summary = await apiGet<HoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${currentMonth}`
		);
		expect(summary.actual_hours).toBeCloseTo(8.5, 1);
		const found = summary.assignments.find((a) => a.inquiry_id === inquiryId);
		expect(found, 'inquiry nicht in assignments').toBeDefined();
	});
});

// ── 1b. Employee list with month filter ──────────────────────────────────────

describe('1b: employee list with month filter includes actual_hours_month', () => {
	it('GET /admin/employees?month= includes our employee with actual_hours_month ≈ 8.5', async () => {
		// Mirror the dashboard's query (employees/+page.svelte): active=true + a high
		// limit. The shared staging DB accumulates soft-deleted test employees, so the
		// unfiltered default page (limit 50) is not deterministic for a fresh row.
		const res = await apiGet<EmployeeListResponse>(
			`/api/v1/admin/employees?active=true&limit=100&month=${currentMonth}`
		);
		const mine = res.employees.find((e) => e.id === employeeId);
		expect(mine, 'employee nicht in Liste').toBeDefined();
		expect(mine!.actual_hours_month).toBeCloseTo(8.5, 1);
	});
});

// ── 1c. break_minutes reduces actual_hours ───────────────────────────────────

describe('1c: break_minutes reduces actual_hours correctly', () => {
	it('PATCH break_minutes to 60 → actual_hours ≈ 8.0', async () => {
		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
			break_minutes: 60,
		});

		const summary = await apiGet<HoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${currentMonth}`
		);
		expect(summary.actual_hours).toBeCloseTo(8.0, 1);
	});

	// Reset break back to 30 min for subsequent tests that rely on 8.5.
	afterAll(async () => {
		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
			break_minutes: 30,
		});
	});
});

// ── 1d. Worker clock → admin cross-check ─────────────────────────────────────

describe('1d: worker clock → admin cross-check', () => {
	let workerToken: string;

	beforeAll(async () => {
		const data = await workerOtpLogin(employeeEmail);
		workerToken = data.token;
	});

	it('worker PATCHes own clock 07:30–15:30', async () => {
		const jobDate = scheduledDate;
		const clockIn = `${jobDate}T07:30:00Z`;
		const clockOut = `${jobDate}T15:30:00Z`;

		await workerPatchRaw(
			`/api/v1/employee/jobs/${inquiryId}/clock`,
			workerToken,
			{ employee_clock_in: clockIn, employee_clock_out: clockOut }
		);
	});

	it('admin hours endpoint includes employee_clock_in (non-null) after worker clock', async () => {
		const summary = await apiGet<HoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${currentMonth}`
		);
		const found = summary.assignments.find((a) => a.inquiry_id === inquiryId);
		expect(found, 'inquiry nicht in assignments').toBeDefined();
		expect(found!.employee_clock_in, 'employee_clock_in ist null nach worker clock').not.toBeNull();
	});

	it('GET /inquiries/{id} employees snapshot has non-null employee_clock_in and employee_actual_hours ≈ 8.0', async () => {
		const detail = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		const emp = detail.employees.find((e) => e.employee_id === employeeId);
		expect(emp, 'employee nicht im inquiry snapshot').toBeDefined();
		expect(emp!.employee_clock_in, 'employee_clock_in ist null').not.toBeNull();
		// 07:30 → 15:30 = 8 h, no break deducted on worker side.
		expect(emp!.employee_actual_hours).toBeCloseTo(8.0, 1);
	});
});

// ── 1e. monthly_hours_target reflected in hours summary ─────────────────────

describe('1e: PATCH monthly_hours_target → reflected in hours summary', () => {
	it('PATCH monthly_hours_target to 140 → target_hours === 140 in hours summary', async () => {
		await apiPatch(`/api/v1/admin/employees/${employeeId}`, {
			monthly_hours_target: 140,
		});

		const summary = await apiGet<HoursSummary>(
			`/api/v1/admin/employees/${employeeId}/hours?month=${currentMonth}`
		);
		expect(summary.target_hours).toBe(140);
	});
});
