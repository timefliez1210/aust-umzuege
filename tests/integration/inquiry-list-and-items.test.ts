/**
 * Round-trip: the admin inquiry list (search / status / has_offer / paging)
 * and the inventory-items editor's PUT → recomputed volume path.
 *
 * The list endpoint backs the dashboard's main "Aufträge/Anfragen" table;
 * the items PUT backs EstimationItemsTable.svelte, where Alex edits the
 * furniture list and expects volume_m3 to re-sum from quantity × per-item m³.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPatch, apiPut } from '$lib/utils/api.svelte';
import { adminLogin, createCustomer, createInquiry, cleanup, newRefs } from './helpers';

interface InquiryListItem {
	id: string;
	customer_name: string | null;
	status: string;
	has_offer: boolean;
}

interface InquiryListResponse {
	inquiries: InquiryListItem[];
	total: number;
	limit: number;
	offset: number;
}

interface EstimationDetail {
	id: string;
	total_volume_m3: number;
	items: Array<{ name: string; volume_m3: number; quantity: number }>;
}

interface InquiryDetail {
	id: string;
	status: string;
	volume_m3: number | null;
}

const refs = newRefs();

// A marker unique to this run so the search filter isolates our rows from the
// shared staging DB.
const MARKER = `ZZListProbe ${Date.now()}`;
let customerId: string;
let inquiryA: string;
let inquiryB: string;

beforeAll(async () => {
	await adminLogin();
	const customer = await createCustomer(refs, { name: MARKER });
	customerId = customer.id;
	inquiryA = await createInquiry(refs, customerId);
	inquiryB = await createInquiry(refs, customerId);
});

afterAll(async () => {
	await cleanup(refs);
});

describe('inquiry list — search filter', () => {
	it('search by customer name returns exactly the two tagged inquiries', async () => {
		const res = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}`
		);
		const mine = res.inquiries.filter((i) => i.customer_name === MARKER);
		expect(mine).toHaveLength(2);
		expect(mine.map((i) => i.id).sort()).toEqual([inquiryA, inquiryB].sort());
		// total reflects the filtered set, not the whole table
		expect(res.total).toBe(2);
	});

	it('a non-matching search yields an empty set with total 0', async () => {
		const res = await apiGet<InquiryListResponse>(
			'/api/v1/inquiries?search=NichtExistierenderKunde999'
		);
		expect(res.inquiries).toHaveLength(0);
		expect(res.total).toBe(0);
	});
});

describe('inquiry list — has_offer filter', () => {
	it('has_offer=false includes inquiries that have no offer yet', async () => {
		const res = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&has_offer=false`
		);
		expect(res.total).toBe(2);
		expect(res.inquiries.every((i) => i.has_offer === false)).toBe(true);
	});

	it('has_offer=true excludes our offer-less inquiries', async () => {
		const res = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&has_offer=true`
		);
		expect(res.inquiries.some((i) => i.id === inquiryA || i.id === inquiryB)).toBe(false);
	});
});

describe('inquiry list — status filter', () => {
	it('status filter narrows to inquiries in that status', async () => {
		await apiPatch(`/api/v1/inquiries/${inquiryA}`, { status: 'completed' });

		const res = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&status=completed`
		);
		expect(res.inquiries.some((i) => i.id === inquiryA)).toBe(true);
		expect(res.inquiries.some((i) => i.id === inquiryB)).toBe(false);
		expect(res.inquiries.every((i) => i.status === 'completed')).toBe(true);
	});
});

describe('inquiry list — pagination', () => {
	it('limit caps the page and total still counts the full filtered set', async () => {
		const res = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&limit=1&offset=0`
		);
		expect(res.inquiries).toHaveLength(1);
		expect(res.limit).toBe(1);
		expect(res.total).toBe(2);
	});

	it('offset walks to the second page without repeating the first row', async () => {
		const page1 = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&limit=1&offset=0`
		);
		const page2 = await apiGet<InquiryListResponse>(
			`/api/v1/inquiries?search=${encodeURIComponent(MARKER)}&limit=1&offset=1`
		);
		expect(page1.inquiries[0].id).not.toBe(page2.inquiries[0].id);
	});
});

describe('PUT /inquiries/{id}/items — volume recomputation', () => {
	it('total_volume_m3 = Σ(volume_m3 × quantity) and is written back to the inquiry', async () => {
		const detail = await apiPut<EstimationDetail>(`/api/v1/inquiries/${inquiryB}/items`, {
			items: [
				{ name: 'Stuhl', volume_m3: 0.5, quantity: 3, confidence: 0.9 },
				{ name: 'Sofa', volume_m3: 2.0, quantity: 1, confidence: 1.0 },
			],
		});
		// 3 × 0.5 + 1 × 2.0 = 3.5
		expect(detail.total_volume_m3).toBeCloseTo(3.5);

		const inquiry = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryB}`);
		expect(inquiry.volume_m3).toBeCloseTo(3.5);
	});

	it('a follow-up PUT fully replaces the item set and re-sums the volume', async () => {
		const detail = await apiPut<EstimationDetail>(`/api/v1/inquiries/${inquiryB}/items`, {
			items: [{ name: 'Kühlschrank', volume_m3: 1.25, quantity: 2, confidence: 1.0 }],
		});
		expect(detail.items).toHaveLength(1);
		expect(detail.total_volume_m3).toBeCloseTo(2.5);

		const inquiry = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryB}`);
		expect(inquiry.volume_m3).toBeCloseTo(2.5);
	});

	it('an empty item list zeroes the volume', async () => {
		const detail = await apiPut<EstimationDetail>(`/api/v1/inquiries/${inquiryB}/items`, {
			items: [],
		});
		expect(detail.total_volume_m3).toBeCloseTo(0);

		const inquiry = await apiGet<InquiryDetail>(`/api/v1/inquiries/${inquiryB}`);
		expect(inquiry.volume_m3).toBeCloseTo(0);
	});
});
