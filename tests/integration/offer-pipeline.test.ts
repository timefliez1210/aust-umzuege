/**
 * Round-trip: the offer-generation "money path" — the most business-critical
 * code in the system and previously the largest coverage hole.
 *
 * Drives the MANUAL trigger `POST /api/v1/inquiries/{id}/generate-offer` (the
 * admin "Angebot erstellen" button). This path is deliberately chosen over the
 * automatic `try_auto_generate_offer` pipeline because the manual route does
 * NOT post to Telegram — only the auto pipeline does. We seed the inquiry's
 * volume directly on creation (the admin `POST /inquiries` route also skips the
 * auto-offer/Telegram path), so this suite is side-effect-free and safe to run
 * by default.
 *
 * Asserts the full chain: pricing → XLSX/PDF render → object-storage upload →
 * downloadable via the admin API, plus the in-place-reuse guard that keeps the
 * `offers_inquiry_active_unique` constraint from firing on regeneration.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPost } from '$lib/utils/api.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { adminLogin, cleanup, createCustomer, createInquiry, newRefs } from './helpers';
import { API_BASE } from './config';

interface Offer {
	id: string;
	inquiry_id: string;
	price_cents: number;
	currency: string;
	status: string;
	pdf_storage_key: string | null;
	offer_number?: string;
}

const refs = newRefs();
let inquiryId: string;
let firstOffer: Offer;

beforeAll(async () => {
	await adminLogin();
	const customer = await createCustomer(refs);
	// Seed volume on creation: the admin POST /inquiries route stores the manual
	// estimate and flips status to `estimated` WITHOUT triggering the auto-offer
	// (Telegram) pipeline. build_offer then has the volume it requires.
	inquiryId = await createInquiry(refs, customer.id, { estimated_volume_m3: 25 });
});

afterAll(async () => {
	await cleanup(refs);
});

describe('POST /inquiries/{id}/generate-offer (manual offer generation)', () => {
	it('rejects generation before any volume is known', async () => {
		// A fresh pending inquiry (no volume) must 400, not 500 — this is the
		// precondition build_offer enforces ("Inquiry has no volume estimate").
		const customer = await createCustomer(refs);
		const emptyInquiry = await createInquiry(refs, customer.id); // no estimated_volume_m3
		await expect(
			apiPost<Offer>(`/api/v1/inquiries/${emptyInquiry}/generate-offer`, {})
		).rejects.toMatchObject({ status: 400 });
	});

	it('persists a priced offer with a PDF stored under offers/{id}/', async () => {
		firstOffer = await apiPost<Offer>(`/api/v1/inquiries/${inquiryId}/generate-offer`, {});

		expect(firstOffer.id).toBeTruthy();
		expect(firstOffer.inquiry_id).toBe(inquiryId);
		expect(firstOffer.currency).toBe('EUR');
		expect(firstOffer.status).toBe('draft');
		// 25 m³ of labour must price to something > 0 even with distance 0.
		expect(firstOffer.price_cents).toBeGreaterThan(0);

		// Storage key must be namespaced under the offer (no orphaned uploads) —
		// AGENTS.md calls this out as critical but it was previously unpinned.
		expect(firstOffer.pdf_storage_key, 'offer PDF was not uploaded to storage').toBeTruthy();
		expect(firstOffer.pdf_storage_key!).toContain('offers/');
		expect(firstOffer.pdf_storage_key!).toContain(firstOffer.id);
	});

	it('serves the generated file via GET /inquiries/{id}/pdf with an attachment disposition', async () => {
		// Binary download — bypass the JSON api client and use the raw token.
		const res = await fetch(`${API_BASE}/api/v1/inquiries/${inquiryId}/pdf`, {
			headers: { Authorization: `Bearer ${auth.token}` },
		});
		expect(res.ok, `PDF download → ${res.status}`).toBe(true);

		const disposition = res.headers.get('content-disposition') ?? '';
		expect(disposition).toContain('attachment');

		const contentType = res.headers.get('content-type') ?? '';
		const buf = new Uint8Array(await res.arrayBuffer());
		expect(buf.byteLength).toBeGreaterThan(100);

		// The render step may emit a real PDF or fall back to the XLSX; accept
		// whichever the storage key advertises and verify the magic bytes match.
		const isPdf = firstOffer.pdf_storage_key!.endsWith('.pdf');
		if (isPdf) {
			expect(contentType).toContain('application/pdf');
			expect(String.fromCharCode(...buf.slice(0, 4))).toBe('%PDF');
		} else {
			// XLSX is a ZIP container → starts with "PK".
			expect(String.fromCharCode(...buf.slice(0, 2))).toBe('PK');
		}
	});

	it('reuses the active offer in place on regeneration (no duplicate-active-offer violation)', async () => {
		const regenerated = await apiPost<Offer>(
			`/api/v1/inquiries/${inquiryId}/generate-offer`,
			{}
		);
		// The route reuses any existing active offer (UPDATE in place) rather than
		// inserting a second row that would trip offers_inquiry_active_unique.
		expect(regenerated.id).toBe(firstOffer.id);
		expect(regenerated.inquiry_id).toBe(inquiryId);
		expect(regenerated.price_cents).toBeGreaterThan(0);
	});

	it('honours an explicit price override on regeneration', async () => {
		// An explicit price override is applied verbatim as the offer's stored
		// price_cents (it bypasses the pricing engine), confirming the override
		// resolution order reaches the final output. NOTE: the request field is
		// named `price_cents_netto` but the value lands in `price_cents`, which
		// the model documents as brutto — the override is taken as-is, no ×1.19.
		const priceOverride = 100_000; // €1.000,00
		const overridden = await apiPost<Offer>(
			`/api/v1/inquiries/${inquiryId}/generate-offer`,
			{ price_cents_netto: priceOverride }
		);
		expect(overridden.id).toBe(firstOffer.id);
		expect(overridden.price_cents).toBe(priceOverride);
	});
});
