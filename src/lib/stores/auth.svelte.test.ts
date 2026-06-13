import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auth } from './auth.svelte';

const TOKEN_KEY = 'aust_access_token';
const REFRESH_KEY = 'aust_refresh_token';
const USER_KEY = 'aust_user';

/** Builds an unsigned JWT whose payload auth.login() decodes for the user profile. */
function fakeJwt(payload: Record<string, string>): string {
	const b64 = (o: unknown) =>
		btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	localStorage.clear();
	auth.logout();
	fetchMock = vi.fn();
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => vi.restoreAllMocks());

describe('auth.login', () => {
	it('stores tokens and decodes the user profile from the JWT payload', async () => {
		const token = fakeJwt({ email: 'alex@aust.de', name: 'Alex Aust', role: 'admin' });
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: token, refresh_token: 'r1', token_type: 'Bearer', expires_in: 900 })
		);

		const ok = await auth.login('alex@aust.de', 'secret');

		expect(ok).toBe(true);
		expect(auth.isAuthenticated).toBe(true);
		expect(auth.token).toBe(token);
		expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
		expect(localStorage.getItem(REFRESH_KEY)).toBe('r1');
		expect(auth.user).toEqual({ email: 'alex@aust.de', name: 'Alex Aust', role: 'admin' });
		expect(JSON.parse(localStorage.getItem(USER_KEY)!)).toEqual(auth.user);
	});

	it('sends credentials as JSON to the login endpoint', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: fakeJwt({}), refresh_token: 'r', token_type: 'Bearer', expires_in: 1 })
		);
		await auth.login('a@b.de', 'pw');

		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toMatch(/\/api\/v1\/auth\/login$/);
		expect(opts.method).toBe('POST');
		expect(JSON.parse(opts.body)).toEqual({ email: 'a@b.de', password: 'pw' });
	});

	it('surfaces the backend error message on rejected credentials', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ message: 'Ungültige Anmeldedaten' }, 401));
		const ok = await auth.login('a@b.de', 'wrong');
		expect(ok).toBe(false);
		expect(auth.error).toBe('Ungültige Anmeldedaten');
		expect(auth.isAuthenticated).toBe(false);
	});

	it('uses a generic German error on network failure', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));
		const ok = await auth.login('a@b.de', 'pw');
		expect(ok).toBe(false);
		expect(auth.error).toBe('Netzwerkfehler. Bitte versuchen Sie es erneut.');
	});

	it('falls back to email for name when the JWT carries no claims', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: fakeJwt({}), refresh_token: 'r', token_type: 'Bearer', expires_in: 1 })
		);
		await auth.login('plain@user.de', 'pw');
		expect(auth.user).toEqual({ email: 'plain@user.de', name: 'plain@user.de', role: 'admin' });
	});
});

describe('auth.refreshToken', () => {
	it('returns false without a stored refresh token', async () => {
		expect(await auth.refreshToken()).toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('exchanges the refresh token and stores the rotated pair', async () => {
		localStorage.setItem(REFRESH_KEY, 'old-refresh');
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'Bearer', expires_in: 900 })
		);

		expect(await auth.refreshToken()).toBe(true);
		expect(auth.token).toBe('new-access');
		expect(localStorage.getItem(TOKEN_KEY)).toBe('new-access');
		expect(localStorage.getItem(REFRESH_KEY)).toBe('new-refresh');

		const [, opts] = fetchMock.mock.calls[0];
		expect(JSON.parse(opts.body)).toEqual({ refresh_token: 'old-refresh' });
	});

	it('returns false when the backend rejects the refresh token', async () => {
		localStorage.setItem(REFRESH_KEY, 'revoked');
		fetchMock.mockResolvedValue(jsonResponse({}, 401));
		expect(await auth.refreshToken()).toBe(false);
	});

	it('shares one in-flight request between concurrent callers (rotation safety)', async () => {
		localStorage.setItem(REFRESH_KEY, 'r0');
		let resolveFetch!: (r: Response) => void;
		fetchMock.mockImplementation(() => new Promise<Response>((res) => (resolveFetch = res)));

		const a = auth.refreshToken();
		const b = auth.refreshToken();
		resolveFetch(
			jsonResponse({ access_token: 'a1', refresh_token: 'r1', token_type: 'Bearer', expires_in: 1 })
		);

		expect(await Promise.all([a, b])).toEqual([true, true]);
		// the rotated token must only be exchanged once
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('allows a new refresh attempt after the previous one settled', async () => {
		localStorage.setItem(REFRESH_KEY, 'r0');
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: 'a1', refresh_token: 'r1', token_type: 'Bearer', expires_in: 1 })
		);
		await auth.refreshToken();
		await auth.refreshToken();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe('auth.logout', () => {
	it('wipes reactive state and all three localStorage keys', async () => {
		const token = fakeJwt({ email: 'a@b.de' });
		fetchMock.mockResolvedValue(
			jsonResponse({ access_token: token, refresh_token: 'r', token_type: 'Bearer', expires_in: 1 })
		);
		await auth.login('a@b.de', 'pw');

		auth.logout();
		expect(auth.token).toBe(null);
		expect(auth.user).toBe(null);
		expect(auth.isAuthenticated).toBe(false);
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
		expect(localStorage.getItem(REFRESH_KEY)).toBeNull();
		expect(localStorage.getItem(USER_KEY)).toBeNull();
	});
});
