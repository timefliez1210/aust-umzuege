/**
 * Test stub for `$app/stores` (aliased in vite.config.ts when VITEST is set).
 *
 * SvelteKit's real `page` store requires router context that doesn't exist in
 * unit tests. This stub exposes the same readable-store shape plus a
 * `setTestUrl` helper so tests can simulate navigation:
 *
 *   import { setTestUrl } from '$lib/test/app-stores';
 *   setTestUrl('/leistungen/privatumzug');
 */
import { writable, type Writable } from 'svelte/store';

export interface TestPage {
	url: URL;
	params: Record<string, string>;
	route: { id: string | null };
	status: number;
	error: Error | null;
	data: Record<string, unknown>;
	form: unknown;
	state: Record<string, unknown>;
}

function makePage(pathname: string): TestPage {
	return {
		url: new URL(`https://www.aust-umzuege.de${pathname}`),
		params: {},
		route: { id: pathname },
		status: 200,
		error: null,
		data: {},
		form: null,
		state: {},
	};
}

export const page: Writable<TestPage> = writable(makePage('/'));

/** Point the mocked page store at a new path (e.g. '/admin/login'). */
export function setTestUrl(pathname: string, params: Record<string, string> = {}): void {
	const p = makePage(pathname);
	p.params = params;
	page.set(p);
}

export const navigating = writable(null);
export const updated = { ...writable(false), check: async () => false };
