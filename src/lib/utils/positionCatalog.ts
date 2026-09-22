import { apiGet } from '$lib/utils/api.svelte';

/** One fixed KVA position with its configured unit price. */
export interface PositionPrice {
	key: string;
	label: string;
	remark: string;
	unit_price_cents: number;
}

/**
 * The catalogue as the backend defines it in code.
 *
 * Used only when the price fetch fails — a KVA half-filled with blank prices is
 * worse than one filled with the defaults. Keep in sync with
 * `POSITION_CATALOG` in `crates/api/src/repositories/settings_repo.rs`.
 */
export const FALLBACK_POSITIONS: PositionPrice[] = [
	{ key: 'demontage', label: 'Demontage', remark: '', unit_price_cents: 2500 },
	{ key: 'montage', label: 'Montage', remark: '', unit_price_cents: 2500 },
	{
		key: 'einpackservice',
		label: 'Einpackservice',
		remark: 'je Karton (Glas, Porzellan)',
		unit_price_cents: 0
	},
	{ key: 'halteverbotszone', label: 'Halteverbotszone', remark: '', unit_price_cents: 10000 },
	{
		key: 'umzugsmaterial',
		label: 'Umzugsmaterial',
		remark: 'Stretchfolie, Decken, Gurte',
		unit_price_cents: 3000
	},
	{ key: 'verkauf_seidenpapier', label: 'Verkauf Seidenpapier', remark: '500x750', unit_price_cents: 500 },
	{ key: 'verkauf_u_karton', label: 'Verkauf U-Karton', remark: '590x318x328', unit_price_cents: 210 },
	{ key: 'verkauf_b_karton', label: 'Verkauf B-Karton', remark: '400x318x328', unit_price_cents: 220 },
	{ key: 'fernsehkarton', label: 'Fernsehkarton', remark: '', unit_price_cents: 0 },
	{
		key: 'verleih_kleiderboxen',
		label: 'Verleih Kleiderboxen',
		remark: '610x520x1370',
		unit_price_cents: 1000
	},
	{ key: 'transporter_3_5t', label: '3,5t Transporter m. Koffer', remark: '', unit_price_cents: 6000 },
	{ key: 'moebellift', label: 'Möbellift', remark: '', unit_price_cents: 0 },
	{ key: 'transferfahrzeug', label: 'Transferfahrzeug', remark: '', unit_price_cents: 0 }
];

let cached: PositionPrice[] | null = null;

/**
 * Loads the position catalogue, cached for the lifetime of the page session.
 *
 * Called by: the Positionen panel on an inquiry.
 * Purpose: the prices were hardcoded in this file's predecessor, so Alex could
 *          not change them anywhere (feedback report ce764f7b). They now live
 *          in the settings table; the built-in list is only a fallback.
 */
export async function loadPositions(): Promise<PositionPrice[]> {
	if (cached) return cached;
	try {
		const data = await apiGet<{ positions: PositionPrice[] }>('/api/v1/admin/positions');
		if (Array.isArray(data.positions) && data.positions.length > 0) {
			cached = data.positions;
		}
	} catch {
		// Fall through to the built-in defaults.
	}
	return cached ?? FALLBACK_POSITIONS;
}

/** Drops the cache so the next load sees freshly saved prices. */
export function invalidatePositions() {
	cached = null;
}
