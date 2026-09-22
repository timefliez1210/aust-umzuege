import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PricingSettingsCard from './PricingSettingsCard.svelte';
import { API_BASE } from '$lib/utils/api.svelte';

const settingsPayload = {
	pricing: {
		rate_per_person_hour_cents: 3500,
		saturday_surcharge_cents: 5000,
		fahrt_rate_per_km: 1.2,
		assembly_price: 25,
		parking_ban_price: 100,
		packing_price: 30,
		transporter_price: 60
	},
	positions: [
		{ key: 'demontage', label: 'Demontage', remark: '', unit_price_cents: 2500 },
		{ key: 'montage', label: 'Montage', remark: '', unit_price_cents: 2500 },
		{
			key: 'verleih_kleiderboxen',
			label: 'Verleih Kleiderboxen',
			remark: '610x520x1370',
			unit_price_cents: 1000
		}
	],
	next_invoice_number: 80,
	next_offer_number: 140
};

let fetchMock: ReturnType<typeof vi.fn>;

/** Records the PUT bodies so a test can assert what was sent. */
let puts: { url: string; body: unknown }[];

beforeEach(() => {
	puts = [];
	fetchMock = vi.fn((url: string, opts?: RequestInit) => {
		if (opts?.method === 'PUT') {
			puts.push({ url, body: JSON.parse(String(opts.body)) });
			return Promise.resolve(
				new Response(JSON.stringify({ ok: true }), {
					headers: { 'content-type': 'application/json' }
				})
			);
		}
		return Promise.resolve(
			new Response(JSON.stringify(settingsPayload), {
				headers: { 'content-type': 'application/json' }
			})
		);
	});
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('PricingSettingsCard — Positionen', () => {
	it('lists every position with its price in euros', async () => {
		render(PricingSettingsCard);
		const demontage = (await screen.findByLabelText(/Demontage/)) as HTMLInputElement;
		expect(demontage.value).toBe('25');
		expect((screen.getByLabelText(/Verleih Kleiderboxen/) as HTMLInputElement).value).toBe('10');
	});

	it('saves an edited price back as cents', async () => {
		const user = userEvent.setup();
		render(PricingSettingsCard);
		const boxen = (await screen.findByLabelText(/Verleih Kleiderboxen/)) as HTMLInputElement;
		await user.clear(boxen);
		await user.type(boxen, '12.50');
		await user.click(screen.getByRole('button', { name: /Positionspreise speichern/ }));

		await waitFor(() => expect(puts.length).toBeGreaterThan(0));
		const put = puts.find((p) => p.url.endsWith('/api/v1/admin/settings/positions'));
		expect(put?.url).toBe(`${API_BASE}/api/v1/admin/settings/positions`);
		expect((put?.body as { positions: { key: string; unit_price_cents: number }[] }).positions).toEqual([
			{ key: 'demontage', unit_price_cents: 2500 },
			{ key: 'montage', unit_price_cents: 2500 },
			{ key: 'verleih_kleiderboxen', unit_price_cents: 1250 }
		]);
	});

	it('no longer duplicates the position prices in the Preise card', async () => {
		render(PricingSettingsCard);
		await screen.findByLabelText(/Demontage/);
		// The old "De-/Montage pro Einheit" field would match this too, so a hit
		// here means the duplicate is back.
		expect(screen.queryByLabelText(/pro Einheit/)).not.toBeInTheDocument();
		expect(screen.getByLabelText(/Stundensatz pro Helfer/)).toBeInTheDocument();
	});
});
