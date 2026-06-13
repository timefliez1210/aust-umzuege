/**
 * Round-trip: admin creates a customer + inquiry, edits the address, assigns
 * an employee, enters German-decimal work times — every write is read back
 * from the backend and asserted against what the UI would display.
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
} from './helpers';

interface AddressSnapshot {
	id: string;
	street: string;
	house_number: string | null;
	city: string;
	postal_code: string | null;
	floor: string | null;
	elevator: boolean | null;
}

interface InquiryDetail {
	id: string;
	status: string;
	service_type: string | null;
	submission_mode: string | null;
	volume_m3: number | null;
	scheduled_date: string | null;
	customer: { id: string; email: string } | null;
	origin_address: AddressSnapshot | null;
	destination_address: AddressSnapshot | null;
	notes: string | null;
}

interface Assignment {
	employee_id: string;
	clock_in: string | null;
	clock_out: string | null;
	break_minutes?: number;
	actual_hours: number | null;
}

const refs = newRefs();

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

describe('admin inquiry lifecycle', () => {
	let customerId: string;
	let customerEmail: string;
	let inquiryId: string;
	let employeeId: string;

	it('creates customer + inquiry and reads back exactly what was sent', async () => {
		const customer = await createCustomer(refs);
		customerId = customer.id;
		customerEmail = customer.email;

		inquiryId = await createInquiry(refs, customerId, {
			estimated_volume_m3: 23.5,
			items_list: '2x Sofa, Couch, Liege je Sitz (0.80 m³)',
			scheduled_date: '2027-05-20',
		});

		const detail = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		expect(detail.customer?.id).toBe(customerId);
		expect(detail.customer?.email).toBe(customerEmail);
		expect(detail.service_type).toBe('privatumzug');
		expect(detail.submission_mode).toBe('manuell');
		expect(detail.volume_m3).toBeCloseTo(23.5);
		expect(detail.scheduled_date).toContain('2027-05-20');

		// addresses persisted with floor/elevator flags
		expect(detail.origin_address?.street).toContain('Teststr.');
		expect(detail.origin_address?.postal_code).toBe('31134');
		expect(detail.origin_address?.floor).toBe('2');
		expect(detail.origin_address?.elevator).toBe(true);
		expect(detail.destination_address?.city).toBe('Hannover');
	});

	it('address edits via PATCH /admin/addresses survive a re-read', async () => {
		const before = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		const addrId = before.origin_address!.id;

		// what the AddressEditor sends on save
		await apiPatch(`/api/v1/admin/addresses/${addrId}`, {
			street: 'Korrigierte Str.',
			house_number: '4b',
			postal_code: '31135',
			city: 'Hildesheim',
			floor: '3',
			elevator: false,
			parking_ban: true,
		});

		const after = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		expect(after.origin_address?.street).toBe('Korrigierte Str.');
		expect(after.origin_address?.house_number).toBe('4b');
		expect(after.origin_address?.floor).toBe('3');
		expect(after.origin_address?.elevator).toBe(false);
	});

	it('assigns an employee and persists German-decimal time input as HH:MM:SS', async () => {
		const employee = await createEmployee(refs);
		employeeId = employee.id;

		await apiPost(`/api/v1/inquiries/${inquiryId}/employees`, {
			employee_id: employeeId,
			notes: null,
		});

		// the panel normalizes "7.30" before PATCHing — same call chain here
		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
			clock_in: normalizeTimeInput('7.30'),
		});
		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
			clock_out: normalizeTimeInput('16,15'),
		});
		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employeeId}`, {
			break_minutes: 45,
		});

		const list = await apiGet<Assignment[]>(`/api/v1/inquiries/${inquiryId}/employees`);
		const mine = list.find((a) => a.employee_id === employeeId);
		expect(mine, 'assignment fehlt nach POST').toBeDefined();
		expect(mine!.clock_in).toBe('07:30:00');
		expect(mine!.clock_out).toBe('16:15:00');
		expect(mine!.break_minutes).toBe(45);
	});

	it('rejects garbage time values instead of silently storing them', async () => {
		// the pre-fix Lisa-Lullies failure mode: unparseable time reaches the API
		const res = await fetch(
			`http://localhost:8080/api/v1/inquiries/${inquiryId}/employees/${employeeId}`,
			{
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${(await import('$lib/stores/auth.svelte')).auth.token}`,
				},
				body: JSON.stringify({ clock_in: 'kein-zeitwert' }),
			}
		);
		expect(res.ok).toBe(false);

		// stored value untouched
		const list = await apiGet<Assignment[]>(`/api/v1/inquiries/${inquiryId}/employees`);
		expect(list.find((a) => a.employee_id === employeeId)!.clock_in).toBe('07:30:00');
	});

	it('status transitions persist (scheduled → completed)', async () => {
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });
		const detail = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryId}`);
		expect(detail.status).toBe('completed');
	});
});
