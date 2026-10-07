import { API_BASE } from '$lib/utils/api.svelte';

/**
 * The company this console belongs to: name, initials, town, accent colour.
 *
 * Starts as Aust so Aust's console never flashes another look, then is confirmed by
 * `GET /api/v1/tenant`, which the backend answers by the domain the console is
 * served from. Components read these fields; the accent goes to `--accent` on <html>.
 */
export interface TenantBranding {
	name: string;
	mark: string;
	place: string;
	accent: string;
}

const AUST: TenantBranding = {
	name: 'Aust Umzüge',
	mark: 'AU',
	place: 'Hildesheim',
	accent: '#ff5a1f'
};

export const tenant = $state<TenantBranding>({ ...AUST });

let loading: Promise<void> | null = null;

/** Fetch the branding once per page load; on any failure the defaults stay. */
export function loadTenant(): Promise<void> {
	loading ??= (async () => {
		try {
			const res = await fetch(`${API_BASE}/api/v1/tenant`);
			if (!res.ok) return;
			const t = (await res.json()) as Partial<TenantBranding>;
			if (t.name) tenant.name = t.name;
			if (t.mark) tenant.mark = t.mark;
			if (t.place !== undefined) tenant.place = t.place;
			if (t.accent && /^#[0-9a-f]{6}$/i.test(t.accent)) tenant.accent = t.accent;
		} catch {
			// Offline or old backend: keep the defaults.
		}
	})();
	return loading;
}
