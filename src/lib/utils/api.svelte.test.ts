import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	apiFetch,
	apiGet,
	apiPost,
	apiPatch,
	apiPut,
	apiDelete,
	apiDownload,
	ApiError,
	API_BASE,
	formatFileSize,
} from './api.svelte';
import { auth } from '$lib/stores/auth.svelte';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	auth.token = 'test-token';
});

afterEach(() => {
	vi.restoreAllMocks();
	auth.logout();
});

describe('apiFetch — request construction', () => {
	it('prefixes paths with API_BASE and attaches the Bearer token', async () => {
		await apiFetch('/api/v1/inquiries');
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe(`${API_BASE}/api/v1/inquiries`);
		expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
	});

	it('sends no Authorization header when logged out', async () => {
		auth.token = null;
		await apiFetch('/api/v1/health');
		const [, opts] = fetchMock.mock.calls[0];
		expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
	});

	it('JSON-serialises plain bodies and sets Content-Type', async () => {
		await apiFetch('/x', { method: 'POST', body: { a: 1 } });
		const [, opts] = fetchMock.mock.calls[0];
		expect(opts.body).toBe('{"a":1}');
		expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json');
	});

	it('passes FormData through untouched without forcing a Content-Type', async () => {
		const fd = new FormData();
		fd.append('file', new Blob(['x']), 'a.txt');
		await apiFetch('/upload', { method: 'POST', body: fd });
		const [, opts] = fetchMock.mock.calls[0];
		expect(opts.body).toBe(fd);
		expect((opts.headers as Record<string, string>)['Content-Type']).toBeUndefined();
	});

	it('parses JSON responses and returns raw Response for non-JSON replies', async () => {
		expect(await apiFetch('/json')).toEqual({ ok: true });

		fetchMock.mockResolvedValue(new Response('binary', { status: 200 }));
		const raw = await apiFetch('/binary');
		expect(raw).toBeInstanceOf(Response);
	});
});

describe('apiFetch — error handling', () => {
	it('throws ApiError carrying the backend message', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ message: 'Nicht gefunden' }, 404));
		await expect(apiFetch('/missing')).rejects.toMatchObject({
			name: 'ApiError',
			status: 404,
			message: 'Nicht gefunden',
		});
	});

	it('falls back to a generic German message when the error body is not JSON', async () => {
		fetchMock.mockResolvedValue(new Response('boom', { status: 500 }));
		await expect(apiFetch('/broken')).rejects.toMatchObject({
			status: 500,
			message: 'Fehler 500',
		});
	});
});

describe('apiFetch — 401 refresh cycle', () => {
	it('refreshes once and retries with the new token', async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({}, 401))
			.mockResolvedValueOnce(jsonResponse({ fresh: true }));
		const refreshSpy = vi.spyOn(auth, 'refreshToken').mockImplementation(async () => {
			auth.token = 'renewed-token';
			return true;
		});

		const result = await apiFetch('/needs-auth');
		expect(result).toEqual({ fresh: true });
		expect(refreshSpy).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const [, retryOpts] = fetchMock.mock.calls[1];
		expect((retryOpts.headers as Record<string, string>).Authorization).toBe('Bearer renewed-token');
	});

	it('logs out and throws a session-expired ApiError when refresh fails', async () => {
		fetchMock.mockResolvedValue(jsonResponse({}, 401));
		vi.spyOn(auth, 'refreshToken').mockResolvedValue(false);
		const logoutSpy = vi.spyOn(auth, 'logout');

		await expect(apiFetch('/needs-auth')).rejects.toMatchObject({
			status: 401,
			message: 'Sitzung abgelaufen. Bitte erneut anmelden.',
		});
		expect(logoutSpy).toHaveBeenCalled();
	});

	it('does not attempt a refresh when no token was attached', async () => {
		auth.token = null;
		fetchMock.mockResolvedValue(jsonResponse({ message: 'unauthorized' }, 401));
		const refreshSpy = vi.spyOn(auth, 'refreshToken');

		await expect(apiFetch('/public-401')).rejects.toMatchObject({ status: 401 });
		expect(refreshSpy).not.toHaveBeenCalled();
	});
});

describe('HTTP method wrappers', () => {
	it.each([
		['apiGet', apiGet, 'GET'],
		['apiDelete', apiDelete, 'DELETE'],
	] as const)('%s sends %s', async (_n, fn, method) => {
		await (fn as (p: string) => Promise<unknown>)('/x');
		expect(fetchMock.mock.calls[0][1].method).toBe(method);
	});

	it.each([
		['apiPost', apiPost, 'POST'],
		['apiPatch', apiPatch, 'PATCH'],
		['apiPut', apiPut, 'PUT'],
	] as const)('%s sends %s with JSON body', async (_n, fn, method) => {
		await (fn as (p: string, b: unknown) => Promise<unknown>)('/x', { v: 1 });
		const [, opts] = fetchMock.mock.calls[0];
		expect(opts.method).toBe(method);
		expect(opts.body).toBe('{"v":1}');
	});
});

describe('apiDownload', () => {
	it('fetches with auth and triggers an anchor download with the given filename', async () => {
		fetchMock.mockResolvedValue(new Response(new Blob(['pdf-bytes']), { status: 200 }));
		const createObjectURL = vi.fn(() => 'blob:mock-url');
		const revokeObjectURL = vi.fn();
		vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));

		const clicked: HTMLAnchorElement[] = [];
		const origClick = HTMLAnchorElement.prototype.click;
		HTMLAnchorElement.prototype.click = function () {
			clicked.push(this as HTMLAnchorElement);
		};
		try {
			await apiDownload('/api/v1/offers/1/pdf', 'angebot.pdf');
		} finally {
			HTMLAnchorElement.prototype.click = origClick;
		}

		expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
		expect(clicked).toHaveLength(1);
		expect(clicked[0].download).toBe('angebot.pdf');
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
	});

	it('throws ApiError on a failed download', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 404 }));
		await expect(apiDownload('/gone', 'x.pdf')).rejects.toBeInstanceOf(ApiError);
	});
});

describe('formatFileSize', () => {
	it('formats bytes, kilobytes, and megabytes per documented thresholds', () => {
		expect(formatFileSize(512)).toBe('512 B');
		expect(formatFileSize(1023)).toBe('1023 B');
		expect(formatFileSize(1024)).toBe('1 KB');
		expect(formatFileSize(870400)).toBe('850 KB');
		expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
	});
});
