import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('tenant branding', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.unstubAllGlobals();
	});

	it("starts as Aust, so Aust's console never flashes another look", async () => {
		const { tenant } = await import('./tenant.svelte');
		expect({ ...tenant }).toEqual({
			name: 'Aust Umzüge',
			mark: 'AU',
			place: 'Hildesheim',
			accent: '#ff5a1f'
		});
	});

	it("takes the backend's branding and ignores a malformed colour", async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ name: 'Zweite Umzüge', mark: 'ZU', place: 'Celle', accent: 'red' })
			})
		);
		const { tenant, loadTenant } = await import('./tenant.svelte');
		await loadTenant();
		expect(tenant.name).toBe('Zweite Umzüge');
		expect(tenant.mark).toBe('ZU');
		expect(tenant.place).toBe('Celle');
		expect(tenant.accent).toBe('#ff5a1f');
	});

	it('keeps the defaults when the backend is unreachable', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		const { tenant, loadTenant } = await import('./tenant.svelte');
		await loadTenant();
		expect(tenant.name).toBe('Aust Umzüge');
	});
});
