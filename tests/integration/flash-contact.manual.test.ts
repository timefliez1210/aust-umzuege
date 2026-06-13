/**
 * MANUAL-ONLY suite — excluded from the default integration run.
 *
 * Every accepted flash-contact POST fires an immediate Telegram ping to Alex
 * (flash_contact.rs → telegram_service::send_telegram_message), so running this
 * on every `npm run test:integration` would spam the real bot. Run it
 * deliberately instead:
 *
 *     npm run test:integration:manual
 *
 * Round-trip: the public "Schneller Rückruf" lead-capture endpoint writes real
 * rows the admin API reads back, and enforces the time_preference enum.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiGet, apiPost } from '$lib/utils/api.svelte';
import { adminLogin, publicPost } from './helpers';

const MARKER = `Integration Flash ${Date.now()}`;

beforeAll(async () => {
	await adminLogin();
});

describe('flash-contact (Schneller Rückruf) [Telegram — manual only]', () => {
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
