import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from '$lib/utils/api.svelte';
import { normalizeTimeInput } from '$lib/utils/format';
import {
	adminLogin,
	createCustomer,
	createEmployee,
	createInquiry,
	cleanup,
	newRefs,
} from './helpers';

interface CustomerDetail {
	id: string;
	email: string | null;
	name: string | null;
	salutation: string | null;
	phone: string | null;
}

interface CustomerListResponse {
	customers: { id: string; email: string | null; name: string | null }[];
	total: number;
}

interface NoteRow {
	id: string;
	title: string;
	content: string;
	color: string;
	pinned: boolean;
	created_at: string;
	updated_at: string;
}

interface NoteListResponse {
	notes: NoteRow[];
}

interface Invoice {
	id: string;
	invoice_number: string;
	invoice_type: string;
	total_brutto_cents: number;
}

interface PricingSettings {
	rate_per_person_hour_cents: number;
	saturday_surcharge_cents: number;
	fahrt_rate_per_km: number;
	assembly_price: number;
	parking_ban_price: number;
	packing_price: number;
	transporter_price: number;
}

interface SettingsResponse {
	pricing: PricingSettings;
	next_invoice_number: number;
	next_offer_number: number;
}

interface Assignment {
	employee_id: string;
	clock_in: string | null;
	clock_out: string | null;
	break_minutes: number | null;
	actual_hours: number | null;
	job_date?: string | null;
}

const refs = newRefs();

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

// ── Part 1: Customer CRUD ────────────────────────────────────────────────────

describe('customer CRUD', () => {
	let customerId: string;
	let customerEmail: string;

	it('creates and reads back a customer with correct fields', async () => {
		const customer = await createCustomer(refs);
		customerId = customer.id;
		customerEmail = customer.email;

		const detail = await apiGet<CustomerDetail>(`/api/v1/admin/customers/${customerId}`);
		expect(detail.id).toBe(customerId);
		expect(detail.email).toBe(customerEmail);
		expect(detail.name).toBe('Integration Testkunde');
	});

	it('PATCH updates name and phone, re-read confirms the change', async () => {
		await apiPatch(`/api/v1/admin/customers/${customerId}`, {
			name: 'Geändert GmbH',
			phone: '0511 999 0000',
			salutation: 'Herr',
		});

		const after = await apiGet<CustomerDetail>(`/api/v1/admin/customers/${customerId}`);
		expect(after.name).toBe('Geändert GmbH');
		expect(after.phone).toBe('0511 999 0000');
		expect(after.salutation).toBe('Herr');
	});

	it('search returns the updated customer by name', async () => {
		const result = await apiGet<CustomerListResponse>(
			'/api/v1/admin/customers?search=Ge%C3%A4ndert'
		);
		expect(result.customers.some((c) => c.id === customerId)).toBe(true);
	});
});

// ── Part 2: Admin Notes CRUD ─────────────────────────────────────────────────

describe('admin notes CRUD', () => {
	let noteId: string;

	afterAll(async () => {
		if (noteId) {
			await apiDelete(`/api/v1/admin/notes/${noteId}`).catch(() => {});
		}
	});

	it('creates a note and gets back an id', async () => {
		const note = await apiPost<NoteRow>('/api/v1/admin/notes', {
			content: 'Integration test note',
		});
		expect(note.id).toBeTruthy();
		noteId = note.id;
		expect(note.content).toBe('Integration test note');
	});

	it('lists notes and finds the created note', async () => {
		const list = await apiGet<NoteListResponse>('/api/v1/admin/notes');
		const found = list.notes.find((n) => n.id === noteId);
		expect(found, 'note missing from list after create').toBeDefined();
		expect(found!.content).toBe('Integration test note');
	});

	it('updates note content and re-list confirms the new content', async () => {
		await apiPatch(`/api/v1/admin/notes/${noteId}`, { content: 'Geändert' });

		const list = await apiGet<NoteListResponse>('/api/v1/admin/notes');
		const found = list.notes.find((n) => n.id === noteId);
		expect(found, 'note missing from list after update').toBeDefined();
		expect(found!.content).toBe('Geändert');
	});

	it('deletes the note and re-list confirms it is gone', async () => {
		await apiDelete(`/api/v1/admin/notes/${noteId}`);

		const list = await apiGet<NoteListResponse>('/api/v1/admin/notes');
		expect(list.notes.some((n) => n.id === noteId)).toBe(false);

		noteId = '';
	});
});

// ── Part 3: Invoice number update ────────────────────────────────────────────

describe('invoice number update', () => {
	it('overrides invoice number, re-read reflects TEST-9999, second PATCH is idempotent', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });

		const created = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'full',
			price_cents_netto: 80_000,
		});
		expect(created).toHaveLength(1);
		const inv = created[0];
		expect(inv.invoice_number).toBeTruthy();

		await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}/number`, {
			invoice_number: 'TEST-9999',
		});

		const list = await apiGet<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`);
		const stored = list.find((i) => i.id === inv.id);
		expect(stored, 'invoice missing after number PATCH').toBeDefined();
		expect(stored!.invoice_number).toBe('TEST-9999');

		// Second PATCH with same number — must not error
		await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}/number`, {
			invoice_number: 'TEST-9999',
		});

		const list2 = await apiGet<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`);
		expect(list2.find((i) => i.id === inv.id)!.invoice_number).toBe('TEST-9999');
	});
});

// ── Part 4: Admin Settings read/update ───────────────────────────────────────

describe('admin settings read/update', () => {
	it('GET /settings returns 200 with pricing and number fields', async () => {
		const settings = await apiGet<SettingsResponse>('/api/v1/admin/settings');
		expect(settings.pricing).toBeDefined();
		expect(typeof settings.next_invoice_number).toBe('number');
		expect(typeof settings.next_offer_number).toBe('number');
		expect(typeof settings.pricing.rate_per_person_hour_cents).toBe('number');
	});

	it('PUT /settings/pricing persists a modified field, restores original on teardown', async () => {
		const before = await apiGet<SettingsResponse>('/api/v1/admin/settings');
		const original = { ...before.pricing };

		try {
			const modified: PricingSettings = {
				...original,
				saturday_surcharge_cents: original.saturday_surcharge_cents + 100,
			};

			await apiPut('/api/v1/admin/settings/pricing', modified);

			const after = await apiGet<SettingsResponse>('/api/v1/admin/settings');
			expect(after.pricing.saturday_surcharge_cents).toBe(modified.saturday_surcharge_cents);
		} finally {
			await apiPut('/api/v1/admin/settings/pricing', original);
		}
	});
});

// ── Part 5: PUT /inquiries/{id}/employees preserves existing clock_in ────────

describe('PUT employees preserves clock_in on re-submit (COALESCE check)', () => {
	it('clock_in set before a full-replace PUT is not overwritten', async () => {
		const customer = await createCustomer(refs);
		const employee = await createEmployee(refs);

		const inquiryId = await createInquiry(refs, customer.id, {
			scheduled_date: '2027-07-10',
			end_date: '2027-07-12',
		});

		await apiPost(`/api/v1/inquiries/${inquiryId}/employees`, {
			employee_id: employee.id,
			notes: null,
		});

		await apiPatch(`/api/v1/inquiries/${inquiryId}/employees/${employee.id}`, {
			clock_in: normalizeTimeInput('08:00'),
		});

		const before = await apiGet<Assignment[]>(`/api/v1/inquiries/${inquiryId}/employees`);
		const primary = before.find((a) => a.employee_id === employee.id);
		expect(primary, 'assignment missing after POST + PATCH').toBeDefined();
		expect(primary!.clock_in).toBe('08:00:00');

		// Re-submit the full assignment list the way CalendarSidePanel does after
		// a field-level save — default times for clock_out, no clock_in override.
		const putPayload = before.map((a) => ({
			employee_id: a.employee_id,
			job_date: a.job_date ?? null,
			notes: null,
			clock_in: normalizeTimeInput('08:00'),
			clock_out: normalizeTimeInput('17:00'),
			break_minutes: 0,
		}));

		await apiPut(`/api/v1/inquiries/${inquiryId}/employees`, putPayload);

		const after = await apiGet<Assignment[]>(`/api/v1/inquiries/${inquiryId}/employees`);
		const afterPrimary = after.find((a) => a.employee_id === employee.id);
		expect(afterPrimary, 'assignment missing after PUT').toBeDefined();
		expect(afterPrimary!.clock_in).toBe('08:00:00');
	});
});
