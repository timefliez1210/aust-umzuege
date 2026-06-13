/**
 * Round-trip: the customer self-service portal (`/api/v1/customer/*`) — a JWT
 * SPA audience that previously had ZERO integration coverage.
 *
 * Covers the OTP auth handshake (request → email → verify → session token),
 * the authenticated read endpoints (profile, inquiry list, inquiry detail), and
 * the ownership/precondition guards on accept/reject that reject BEFORE any
 * admin Telegram notification fires.
 *
 * The successful accept/reject transitions DO notify admin over Telegram, so
 * they live in `customer-portal.manual.test.ts` (opt-in) — not here.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { adminLogin, cleanup, createCustomer, createInquiry, customerOtpLogin, newRefs } from './helpers';
import { API_BASE } from './config';

const refs = newRefs();
let customerEmail: string;
let customerId: string;
let inquiryId: string;
let token: string;

async function customerGet(path: string): Promise<Response> {
	return fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
}

beforeAll(async () => {
	await adminLogin();
	const customer = await createCustomer(refs);
	customerEmail = customer.email;
	customerId = customer.id;
	inquiryId = await createInquiry(refs, customerId, { estimated_volume_m3: 18 });

	const session = await customerOtpLogin(customerEmail);
	token = session.token;
	// verify_otp upserts/matches by email → must resolve the SAME customer row.
	expect(session.customer.id).toBe(customerId);
});

afterAll(async () => {
	await cleanup(refs);
});

describe('Customer portal auth + reads', () => {
	it('returns the authenticated customer profile from GET /customer/me', async () => {
		const res = await customerGet('/api/v1/customer/me');
		expect(res.ok, `me → ${res.status}`).toBe(true);
		const me = (await res.json()) as { id: string; email: string };
		expect(me.id).toBe(customerId);
		expect(me.email).toBe(customerEmail);
	});

	it('lists the customer’s own inquiries via GET /customer/inquiries', async () => {
		const res = await customerGet('/api/v1/customer/inquiries');
		expect(res.ok, `inquiries → ${res.status}`).toBe(true);
		const list = (await res.json()) as { id: string; status: string }[];
		const mine = list.find((i) => i.id === inquiryId);
		expect(mine, 'seeded inquiry missing from customer list').toBeDefined();
	});

	it('returns inquiry detail with addresses via GET /customer/inquiries/{id}', async () => {
		const res = await customerGet(`/api/v1/customer/inquiries/${inquiryId}`);
		expect(res.ok, `detail → ${res.status}`).toBe(true);
		const detail = (await res.json()) as {
			id: string;
			status: string;
			origin_address: { city: string } | null;
			destination_address: { city: string } | null;
			offers: unknown[];
		};
		expect(detail.id).toBe(inquiryId);
		expect(detail.origin_address?.city).toBe('Hildesheim');
		expect(detail.destination_address?.city).toBe('Hannover');
	});

	it('rejects requests without a customer token (401)', async () => {
		const res = await fetch(`${API_BASE}/api/v1/customer/inquiries`);
		expect(res.status).toBe(401);
	});
});

describe('Customer accept/reject guards (no Telegram side effect)', () => {
	it('cannot accept an inquiry that has no active offer (404 before any notify)', async () => {
		// The seeded inquiry has a volume but no generated offer, so accept must
		// 404 ("Kein aktives Angebot gefunden") — this returns before the admin
		// Telegram notification is reached.
		const res = await fetch(`${API_BASE}/api/v1/customer/inquiries/${inquiryId}/accept`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(404);
	});

	it('cannot act on an inquiry owned by another customer (404)', async () => {
		// Create a second customer + inquiry; the first customer's token must not
		// be able to reject it (ownership check fails → 404 before notify).
		const other = await createCustomer(refs);
		const otherInquiry = await createInquiry(refs, other.id, { estimated_volume_m3: 10 });
		const res = await fetch(`${API_BASE}/api/v1/customer/inquiries/${otherInquiry}/reject`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
		});
		expect(res.status).toBe(404);
	});
});
