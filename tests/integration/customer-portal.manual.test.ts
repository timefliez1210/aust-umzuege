/**
 * MANUAL suite — customer accept/reject offer transitions.
 *
 * Both `POST /customer/inquiries/{id}/accept` and `/reject` fire a real Telegram
 * notification to the admin (Alex) on success, so they are EXCLUDED from the
 * default integration run. Execute deliberately with:
 *
 *     npm run test:integration:manual
 *
 * Each test seeds its own customer + inquiry + draft offer (via the admin API,
 * which is Telegram-free) and then drives the customer transition.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiPost } from '$lib/utils/api.svelte';
import { adminLogin, cleanup, createCustomer, createInquiry, customerOtpLogin, newRefs } from './helpers';
import { API_BASE } from './config';

const refs = newRefs();

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

/** Seeds a customer with an inquiry that has a freshly generated draft offer. */
async function seedCustomerWithOffer() {
	const customer = await createCustomer(refs);
	const inquiryId = await createInquiry(refs, customer.id, { estimated_volume_m3: 22 });
	// Generate a draft offer (admin route, no Telegram).
	await apiPost(`/api/v1/inquiries/${inquiryId}/generate-offer`, {});
	const session = await customerOtpLogin(customer.email);
	return { inquiryId, token: session.token };
}

describe('Customer offer transitions (fires admin Telegram)', () => {
	it('accept advances offer + inquiry to accepted', async () => {
		const { inquiryId, token } = await seedCustomerWithOffer();
		const res = await fetch(`${API_BASE}/api/v1/customer/inquiries/${inquiryId}/accept`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.ok, `accept → ${res.status}`).toBe(true);
		const body = (await res.json()) as { status: string };
		expect(body.status).toBe('accepted');

		// Re-accept must now fail: offer is no longer in draft/sent.
		const again = await fetch(`${API_BASE}/api/v1/customer/inquiries/${inquiryId}/accept`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(again.status).toBe(400);
	});

	it('reject advances offer + inquiry to rejected', async () => {
		const { inquiryId, token } = await seedCustomerWithOffer();
		const res = await fetch(`${API_BASE}/api/v1/customer/inquiries/${inquiryId}/reject`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.ok, `reject → ${res.status}`).toBe(true);
		const body = (await res.json()) as { status: string };
		expect(body.status).toBe('rejected');
	});
});
