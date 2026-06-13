import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { worker, workerFetch, workerGet, type WorkerEmployee } from './worker.svelte';

const TOKEN_KEY = 'worker_token';
const EMPLOYEE_KEY = 'worker_employee';

const employee: WorkerEmployee = {
	id: 'e1',
	email: 'max@aust.de',
	first_name: 'Max',
	last_name: 'Helfer',
	salutation: 'Herr',
	phone: null,
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	localStorage.clear();
	worker.logout();
	// fresh Response per call — a Response body is single-use
	fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => vi.restoreAllMocks());

describe('worker store', () => {
	it('is only authenticated with both token and profile present', () => {
		expect(worker.isAuthenticated).toBe(false);
		worker.token = 'tok';
		expect(worker.isAuthenticated).toBe(false);
		worker.employee = employee;
		expect(worker.isAuthenticated).toBe(true);
	});

	it('login persists session token and profile for the 30-day session', () => {
		worker.login('session-token-64hex', employee);
		expect(worker.isAuthenticated).toBe(true);
		expect(localStorage.getItem(TOKEN_KEY)).toBe('session-token-64hex');
		expect(JSON.parse(localStorage.getItem(EMPLOYEE_KEY)!)).toEqual(employee);
	});

	it('logout clears all session state from memory and localStorage', () => {
		worker.login('tok', employee);
		worker.logout();
		expect(worker.isAuthenticated).toBe(false);
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
		expect(localStorage.getItem(EMPLOYEE_KEY)).toBeNull();
	});
});

describe('workerFetch', () => {
	it('injects the session token as a Bearer header', async () => {
		worker.login('tok123', employee);
		await workerGet('/api/v1/employee/me');
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toMatch(/\/api\/v1\/employee\/me$/);
		expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok123');
	});

	it('only sets a JSON Content-Type when a body is present (no preflight on GETs)', async () => {
		worker.login('tok', employee);
		await workerGet('/api/v1/employee/me');
		expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Content-Type']).toBeUndefined();

		await workerFetch('/api/v1/employee/hours', { method: 'POST', body: JSON.stringify({ a: 1 }) });
		expect((fetchMock.mock.calls[1][1].headers as Record<string, string>)['Content-Type']).toBe(
			'application/json'
		);
	});

	it('on 401: logs out, redirects to /worker/login, and throws (no token refresh for workers)', async () => {
		worker.login('expired', employee);
		fetchMock.mockResolvedValue(jsonResponse({}, 401));

		await expect(workerGet('/api/v1/employee/me')).rejects.toThrow('Session abgelaufen');
		expect(worker.isAuthenticated).toBe(false);
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
	});

	it('throws the backend error message on non-401 failures', async () => {
		worker.login('tok', employee);
		fetchMock.mockResolvedValue(jsonResponse({ message: 'Einsatz nicht gefunden' }, 404));
		await expect(workerGet('/api/v1/employee/jobs/x')).rejects.toThrow('Einsatz nicht gefunden');
		// non-401 errors must NOT log the worker out
		expect(worker.isAuthenticated).toBe(true);
	});

	it('falls back to statusText when the error body is not JSON', async () => {
		worker.login('tok', employee);
		fetchMock.mockResolvedValue(new Response('boom', { status: 500, statusText: 'Internal Server Error' }));
		await expect(workerGet('/x')).rejects.toThrow('Internal Server Error');
	});

	it('parses successful JSON responses', async () => {
		worker.login('tok', employee);
		fetchMock.mockResolvedValue(jsonResponse({ jobs: [1, 2] }));
		expect(await workerGet('/api/v1/employee/schedule')).toEqual({ jobs: [1, 2] });
	});
});
