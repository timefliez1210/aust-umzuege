/**
 * Round-trip: the public lead-capture endpoints — flash-contact (quick
 * callback) and /submit/manual — write real rows that the admin API reads back.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPost, apiDelete } from '$lib/utils/api.svelte';
import { adminLogin, cleanup, newRefs, publicPost } from './helpers';
import { TEST_DOMAIN, API_BASE } from './config';

const refs = newRefs();
const MARKER = `Integration Flash ${Date.now()}`;

beforeAll(async () => {
	await adminLogin();
});

afterAll(async () => {
	await cleanup(refs);
});

describe('flash-contact (Schneller Rückruf)', () => {
	it('accepts all three documented time preferences and shows up in the admin list', async () => {
		for (const pref of ['gleich', 'vormittag', 'nachmittag'] as const) {
			const res = await publicPost('/api/v1/flash-contact', {
				name: `${MARKER} ${pref}`,
				phone: '0151 2222222',
				time_preference: pref,
			});
			expect(res.status, `time_preference=${pref}`).toBe(201);
		}

		const list = await apiGet<Array<{ id: string; name: string; time_preference: string }>>(
			'/api/v1/admin/flash-contacts'
		);
		const mine = list.filter((c) => c.name.startsWith(MARKER));
		expect(mine).toHaveLength(3);
		expect(mine.map((c) => c.time_preference).sort()).toEqual([
			'gleich',
			'nachmittag',
			'vormittag',
		]);

		// mark handled so they don't linger as open callbacks in the staging UI
		for (const c of mine) {
			await apiPost(`/api/v1/admin/flash-contacts/${c.id}/handle`).catch(() => {});
		}
	});

	it('rejects the legacy Hero values (any_time / 08-10) — enum contract regression', async () => {
		for (const bad of ['any_time', '08-10']) {
			const res = await publicPost('/api/v1/flash-contact', {
				name: `${MARKER} invalid`,
				phone: '0151 2222222',
				time_preference: bad,
			});
			expect(res.ok, `"${bad}" darf nicht akzeptiert werden`).toBe(false);
		}
	});

	it('rejects empty name or phone', async () => {
		const res = await publicPost('/api/v1/flash-contact', {
			name: '   ',
			phone: '0151 333',
			time_preference: 'gleich',
		});
		expect(res.status).toBe(400);
	});
});

describe('POST /submit/manual (public inquiry without media)', () => {
	it('creates customer + inquiry + addresses readable via the admin API', async () => {
		const email = `manual-${Date.now()}@${TEST_DOMAIN}`;
		const fd = new FormData();
		fd.append('name', 'Manuel Manuell');
		fd.append('email', email);
		fd.append('phone', '0151 4444444');
		fd.append('service_type', 'privatumzug');
		fd.append('submission_mode', 'manuell');
		fd.append('departure_address', 'Startgasse 5');
		fd.append('startPlz', '31134');
		fd.append('startOrt', 'Hildesheim');
		fd.append('departure_floor', '1');
		fd.append('arrival_address', 'Endallee 8');
		fd.append('endPlz', '30159');
		fd.append('endOrt', 'Hannover');
		fd.append('volumen', '18.5');
		fd.append('umzugsgut', '1x Klavier (1.50 m³)');
		fd.append('nachricht', 'Integrationstest — bitte ignorieren');

		const res = await fetch(`${API_BASE}/api/v1/submit/manual`, { method: 'POST', body: fd });
		expect(res.ok, await res.clone().text()).toBe(true);
		const created = (await res.json()) as { inquiry_id: string; customer_id: string };
		expect(created.inquiry_id).toBeTruthy();
		refs.inquiryIds.push(created.inquiry_id);
		refs.customerIds.push(created.customer_id);

		// read back through the admin API — the same view the dashboard uses
		const detail = await apiGet<{
			service_type: string | null;
			volume_m3: number | null;
			customer: { id: string; email: string } | null;
			origin_address: { city: string; floor: string | null } | null;
			destination_address: { city: string } | null;
			notes: string | null;
		}>(`/api/v1/inquiries/${created.inquiry_id}`);

		expect(detail.customer?.email).toBe(email);
		expect(detail.service_type).toBe('privatumzug');
		expect(detail.volume_m3).toBeCloseTo(18.5);
		expect(detail.origin_address?.city).toBe('Hildesheim');
		expect(detail.origin_address?.floor).toBe('1');
		expect(detail.destination_address?.city).toBe('Hannover');
		expect(detail.notes).toContain('Integrationstest');
	});

	it('rejects a submission without the required arrival address', async () => {
		const fd = new FormData();
		fd.append('name', 'Unvollständig');
		fd.append('email', `incomplete-${Date.now()}@${TEST_DOMAIN}`);
		fd.append('departure_address', 'Nur Start 1, 31134 Hildesheim');

		const res = await fetch(`${API_BASE}/api/v1/submit/manual`, { method: 'POST', body: fd });
		expect(res.ok).toBe(false);
		expect(res.status).toBeLessThan(500); // validation error, not a crash
	});
});
