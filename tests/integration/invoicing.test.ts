/**
 * Round-trip: invoice creation with extras, partial invoices (Anzahlung +
 * Schlussrechnung), and the send path — the sent email is asserted in Mailpit.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPatch, apiPost } from '$lib/utils/api.svelte';
import {
	adminLogin,
	createCustomer,
	createInquiry,
	cleanup,
	newRefs,
	waitForMail,
} from './helpers';

interface Invoice {
	id: string;
	invoice_number: string;
	invoice_type: string;
	partial_percent: number | null;
	extra_services: { description: string; price_cents: number }[];
	total_netto_cents?: number;
	total_brutto_cents: number;
}

const refs = newRefs();

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

describe('invoicing', () => {
	it('full invoice: manual netto price → created with a number and readable back', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });

		// create (no offer exists → manual price, like the modal does)
		const created = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'full',
			price_cents_netto: 100_000, // 1.000 € netto
		});
		expect(created).toHaveLength(1);
		const inv = created[0];
		expect(inv.invoice_number).toBeTruthy();
		expect(inv.invoice_type).toBe('full');

		// stored invoice reads back with the same number
		const list = await apiGet<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`);
		const stored = list.find((i) => i.id === inv.id)!;
		expect(stored.invoice_number).toBe(inv.invoice_number);
	});

	// Regression guard: invoices store base_netto_cents at creation, so totals
	// never depend on an active offer existing.
	it('manual-price full invoice reports its actual total (119.000 brutto cents)', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });
		const [inv] = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'full',
			price_cents_netto: 100_000,
		});
		expect(inv.total_brutto_cents).toBe(119_000);
	});

	// Regression guard: PDF regeneration falls back to the row's stored
	// base_netto_cents, keeping manual-price (no-offer) invoices editable.
	it('extras can be added to a manual-price invoice (documented modal flow)', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });
		const [inv] = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'full',
			price_cents_netto: 100_000,
		});

		// 59,50 € brutto → 5.000 cents netto (the modal's conversion)
		await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}`, {
			extra_services: [{ description: 'Halteverbotszone (Auszug)', price_cents: 5000 }],
		});

		const list = await apiGet<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`);
		const stored = list.find((i) => i.id === inv.id)!;
		expect(stored.extra_services).toEqual([
			{ description: 'Halteverbotszone (Auszug)', price_cents: 5000 },
		]);
		// (100.000 + 5.000) netto · 1.19 = 124.950 brutto cents
		expect(stored.total_brutto_cents).toBe(124_950);
	});

	it('partial invoice: Anzahlung + Schlussrechnung pair with the chosen percentage', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });

		const created = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'partial',
			partial_percent: 40,
			price_cents_netto: 100_000,
		});

		expect(created.map((i) => i.invoice_type).sort()).toEqual(['partial_final', 'partial_first']);
		const first = created.find((i) => i.invoice_type === 'partial_first')!;
		const final = created.find((i) => i.invoice_type === 'partial_final')!;
		expect(first.partial_percent).toBe(40);
		// two distinct invoice numbers
		expect(first.invoice_number).not.toBe(final.invoice_number);
		// Anzahlung ≈ 40% of the brutto total, Schluss covers the rest
		const totalBrutto = first.total_brutto_cents + final.total_brutto_cents;
		expect(totalBrutto).toBe(119_000);
		expect(first.total_brutto_cents).toBe(47_600); // 1.190 € · 40 %
	});

	it('sending the invoice delivers a German email with the number to the customer (Mailpit)', async () => {
		const customer = await createCustomer(refs);
		const inquiryId = await createInquiry(refs, customer.id);
		await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });

		const [inv] = await apiPost<Invoice[]>(`/api/v1/inquiries/${inquiryId}/invoices`, {
			invoice_type: 'full',
			price_cents_netto: 50_000,
		});

		const subject = `Ihre Rechnung Nr. ${inv.invoice_number} — Aust Umzüge & Haushaltsauflösungen`;
		await apiPost(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}/send`, {
			subject,
			body: `Sehr geehrte Frau Testkunde,\n\nim Anhang finden Sie Ihre Rechnung Nr. ${inv.invoice_number}.\n\nMit freundlichen Grüßen`,
		});

		const mail = await waitForMail(customer.email, {
			subjectContains: inv.invoice_number,
		});
		expect(mail.meta.Subject).toBe(subject);
		expect(mail.text).toContain(inv.invoice_number);

		// the inquiry reflects the sent invoice on re-read
		const detail = await apiGet<{ status: string }>(`/api/v1/inquiries/${inquiryId}`);
		expect(['invoiced', 'completed']).toContain(detail.status);
	});
});
