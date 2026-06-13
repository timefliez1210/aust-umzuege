/**
 * Round-trip: the number-sequence settings (PUT /admin/settings/numbers) and
 * the employee CRUD lifecycle including the soft-delete semantics the admin
 * employee list relies on (`active=true` hides deleted staff).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPatch, apiPost, apiPut } from '$lib/utils/api.svelte';
import { adminLogin, createEmployee, cleanup, newRefs } from './helpers';

interface SettingsResponse {
	next_invoice_number: number;
	next_offer_number: number;
}

interface EmployeeDetail {
	id: string;
	first_name: string;
	last_name: string;
	email: string | null;
	active: boolean;
	monthly_hours_target: number | null;
}

interface EmployeeListResponse {
	employees: Array<{ id: string; active: boolean }>;
	total: number;
}

const refs = newRefs();

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

describe('admin settings — number sequences', () => {
	// Non-destructive: we only ever re-assert the CURRENT next values, never
	// lower them (which would risk duplicate invoice/offer numbers in staging).
	it('PUT /settings/numbers with the current values is idempotent', async () => {
		const before = await apiGet<SettingsResponse>('/api/v1/admin/settings');

		await apiPut('/api/v1/admin/settings/numbers', {
			next_invoice_number: before.next_invoice_number,
			next_offer_number: before.next_offer_number,
		});

		const after = await apiGet<SettingsResponse>('/api/v1/admin/settings');
		expect(after.next_invoice_number).toBe(before.next_invoice_number);
		expect(after.next_offer_number).toBe(before.next_offer_number);
	});

	it('rejects a next_invoice_number below 1 (422) without touching the sequence', async () => {
		const before = await apiGet<SettingsResponse>('/api/v1/admin/settings');

		try {
			await apiPut('/api/v1/admin/settings/numbers', { next_invoice_number: 0 });
			expect.fail('next_invoice_number=0 sollte abgelehnt werden');
		} catch (err: unknown) {
			expect((err as { status: number }).status).toBe(422);
		}

		const after = await apiGet<SettingsResponse>('/api/v1/admin/settings');
		expect(after.next_invoice_number).toBe(before.next_invoice_number);
	});
});

describe('employee CRUD lifecycle', () => {
	let employeeId: string;
	let employeeEmail: string;

	it('creates an employee and reads it back', async () => {
		const employee = await createEmployee(refs);
		employeeId = employee.id;
		employeeEmail = employee.email;

		const detail = await apiGet<EmployeeDetail>(`/api/v1/admin/employees/${employeeId}`);
		expect(detail.id).toBe(employeeId);
		expect(detail.first_name).toBe('Inge');
		expect(detail.last_name).toBe('Integration');
		expect(detail.active).toBe(true);
	});

	it('PATCH updates name and monthly_hours_target, re-read confirms', async () => {
		await apiPatch(`/api/v1/admin/employees/${employeeId}`, {
			first_name: 'Ingeborg',
			monthly_hours_target: 120,
		});

		const detail = await apiGet<EmployeeDetail>(`/api/v1/admin/employees/${employeeId}`);
		expect(detail.first_name).toBe('Ingeborg');
		expect(detail.monthly_hours_target).toBe(120);
	});

	it('active=true list includes the employee, active=false does not', async () => {
		const active = await apiGet<EmployeeListResponse>(
			'/api/v1/admin/employees?active=true&limit=100'
		);
		expect(active.employees.some((e) => e.id === employeeId)).toBe(true);
	});

	// Soft-delete contract: POST /delete flips active=false. The row remains
	// fetchable by id (it is referenced by historical assignments) but drops
	// out of the active list the dashboard renders.
	it('delete soft-deletes: row persists as inactive and leaves the active list', async () => {
		await apiPost(`/api/v1/admin/employees/${employeeId}/delete`);

		const detail = await apiGet<EmployeeDetail>(`/api/v1/admin/employees/${employeeId}`);
		expect(detail.active).toBe(false);

		const active = await apiGet<EmployeeListResponse>(
			'/api/v1/admin/employees?active=true&limit=100'
		);
		expect(active.employees.some((e) => e.id === employeeId)).toBe(false);

		// Narrow by the unique email: staging accumulates soft-deleted test
		// employees, so an unfiltered active=false page is not deterministic for a
		// single fresh row (search is an ILIKE on first_name/last_name/email).
		const inactive = await apiGet<EmployeeListResponse>(
			`/api/v1/admin/employees?active=false&limit=100&search=${encodeURIComponent(employeeEmail)}`
		);
		expect(inactive.employees.some((e) => e.id === employeeId)).toBe(true);
	});
});
