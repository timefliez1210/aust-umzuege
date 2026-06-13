/**
 * Round-trip: worker OTP login (code read from Mailpit), schedule/hours
 * reads, and the self-reported clock-in/out write → recomputed hours.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiPatch, apiPost } from '$lib/utils/api.svelte';
import {
	adminLogin,
	createCustomer,
	createEmployee,
	createInquiry,
	cleanup,
	newRefs,
	publicPost,
	workerOtpLogin,
	workerGetRaw,
	workerPatchRaw,
} from './helpers';

const refs = newRefs();

let employeeEmail: string;
let employeeId: string;
let inquiryId: string;
let jobDate: string;
let sessionToken: string;

interface JobDetail {
	inquiry_id: string;
	job_date: string | null;
	origin_city: string | null;
	destination_city: string | null;
	customer_name: string | null;
	employee_clock_in: string | null;
	employee_clock_out: string | null;
	employee_actual_hours: number | null;
}

beforeAll(async () => {
	await adminLogin();
	// fixture: an employee assigned to a scheduled job this month
	const customer = await createCustomer(refs);
	const employee = await createEmployee(refs);
	employeeEmail = employee.email;
	employeeId = employee.id;

	const now = new Date();
	jobDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`;
	inquiryId = await createInquiry(refs, customer.id, { scheduled_date: jobDate });
	await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'scheduled' });
	await apiPost(`/api/v1/inquiries/${inquiryId}/employees`, {
		employee_id: employeeId,
		notes: null,
	});
});

afterAll(async () => {
	await cleanup(refs);
});

describe('worker portal', () => {
	it('requests an OTP, reads the 6-digit code from the email, and logs in', async () => {
		const data = await workerOtpLogin(employeeEmail);
		expect(data.token).toBeTruthy();
		expect(data.employee.id).toBe(employeeId);
		sessionToken = data.token;
	});

	it('rejects a wrong OTP', async () => {
		await publicPost('/api/v1/employee/auth/request', { email: employeeEmail });
		const res = await publicPost('/api/v1/employee/auth/verify', {
			email: employeeEmail,
			code: '000000',
		});
		expect(res.ok).toBe(false);
	});

	it('the schedule shows the assigned job for the current month', async () => {
		const month = jobDate.slice(0, 7);
		const jobs = await workerGetRaw<Array<{ inquiry_id: string | null; origin_city: string | null }>>(
			`/api/v1/employee/schedule?month=${month}`,
			sessionToken
		);
		const mine = jobs.find((j) => j.inquiry_id === inquiryId);
		expect(mine, 'assigned job missing from schedule').toBeDefined();
		expect(mine!.origin_city).toBe('Hildesheim');
	});

	// Regression guard: the clock PATCH must write the employee_clock_* columns
	// (migration 20260322), never the admin clock_in/clock_out — and the detail
	// endpoint must compute hours from them.
	it('clock-in/out PATCH persists and the computed hours appear on re-read', async () => {
		const clockIn = new Date(`${jobDate}T07:00:00`).toISOString();
		const clockOut = new Date(`${jobDate}T15:30:00`).toISOString();

		await workerPatchRaw(`/api/v1/employee/jobs/${inquiryId}/clock`, sessionToken, {
			employee_clock_in: clockIn,
			employee_clock_out: clockOut,
		});

		const detail = await workerGetRaw<JobDetail>(
			`/api/v1/employee/jobs/${inquiryId}`,
			sessionToken
		);
		expect(detail.employee_clock_in).toBeTruthy();
		expect(detail.employee_clock_out).toBeTruthy();
		// 07:00 → 15:30 = 8.5h
		expect(detail.employee_actual_hours).toBeCloseTo(8.5, 1);
	});

	it('the monthly hours summary includes the assignment', async () => {
		const month = jobDate.slice(0, 7);
		const summary = await workerGetRaw<{
			target_hours: number;
			assignments: Array<{ inquiry_id: string | null }>;
		}>(`/api/v1/employee/hours?month=${month}`, sessionToken);

		expect(summary.target_hours).toBeGreaterThan(0);
		expect(summary.assignments.some((a) => a.inquiry_id === inquiryId)).toBe(true);
	});

	it('worker endpoints refuse requests without a session token', async () => {
		const res = await fetch(`http://localhost:8080/api/v1/employee/hours?month=2026-06`);
		expect(res.status).toBe(401);
	});
});
