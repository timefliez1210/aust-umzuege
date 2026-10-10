import { describe, it, expect, vi } from 'vitest';
import { fetchWithTimeout, NetworkError, RETRY_DELAYS_MS } from './fetchTimeout';

describe('fetchWithTimeout', () => {
	it('returns response when fetch resolves within timeout', async () => {
		const mockResponse = new Response('{"ok":true}', { status: 200 });
		globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

		const res = await fetchWithTimeout('https://example.com/api');
		expect(res.status).toBe(200);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('passes through options to fetch', async () => {
		const mockResponse = new Response('{}', { status: 200 });
		globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

		await fetchWithTimeout('https://example.com/api', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: true }),
		});

		expect(fetch).toHaveBeenCalledWith(
			'https://example.com/api',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ test: true }),
			})
		);
	});

	it('includes an AbortSignal when calling fetch', async () => {
		const mockResponse = new Response('{}', { status: 200 });
		let capturedSignal: AbortSignal | undefined;
		globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
			capturedSignal = opts?.signal as AbortSignal;
			return Promise.resolve(mockResponse);
		});

		await fetchWithTimeout('https://example.com/api');
		expect(capturedSignal).toBeDefined();
		expect(capturedSignal?.aborted).toBe(false);
	});

	/** fetch mock that hangs until its AbortSignal fires, like a stalled connection. */
	function hangingFetch() {
		return vi.fn().mockImplementation(
			(_url, opts) =>
				new Promise((_resolve, reject) => {
					(opts?.signal as AbortSignal).addEventListener('abort', () =>
						reject(new DOMException('Fetch is aborted', 'AbortError'))
					);
				})
		);
	}

	it('turns a timed-out write into a German NetworkError without retrying', async () => {
		globalThis.fetch = hangingFetch();

		const err = await fetchWithTimeout('https://example.com/api', { method: 'PATCH' }, 10).catch((e) => e);
		expect(err).toBeInstanceOf(NetworkError);
		expect(err.kind).toBe('timeout');
		expect(err.message).toContain('evtl. nicht gespeichert');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('retries a timed-out read and succeeds on the next attempt', async () => {
		vi.useFakeTimers();
		try {
			const ok = new Response('{}', { status: 200 });
			const hang = hangingFetch();
			globalThis.fetch = vi
				.fn()
				.mockImplementationOnce((u, o) => hang(u, o))
				.mockResolvedValueOnce(ok);

			const p = fetchWithTimeout('https://example.com/api', {}, 10);
			await vi.advanceTimersByTimeAsync(10 + RETRY_DELAYS_MS[0]);
			await expect(p).resolves.toBe(ok);
			expect(fetch).toHaveBeenCalledTimes(2);
		} finally {
			vi.useRealTimers();
		}
	});

	it('gives up on a read after all retries', async () => {
		vi.useFakeTimers();
		try {
			globalThis.fetch = hangingFetch();
			const p = fetchWithTimeout('https://example.com/api', {}, 10).catch((e) => e);
			await vi.advanceTimersByTimeAsync(10 * 3 + RETRY_DELAYS_MS.reduce((a, b) => a + b, 0));
			const err = await p;
			expect(err).toBeInstanceOf(NetworkError);
			expect(err.message).toContain('nicht geladen');
			expect(fetch).toHaveBeenCalledTimes(1 + RETRY_DELAYS_MS.length);
		} finally {
			vi.useRealTimers();
		}
	});

	it('maps a dropped connection (TypeError) to an offline/timeout NetworkError', async () => {
		globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Load failed'));
		const err = await fetchWithTimeout('https://example.com/api', { method: 'POST' }, 1000).catch((e) => e);
		expect(err).toBeInstanceOf(NetworkError);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('passes a caller abort through untouched and does not retry', async () => {
		globalThis.fetch = hangingFetch();
		const ctrl = new AbortController();
		const p = fetchWithTimeout('https://example.com/api', { signal: ctrl.signal }, 10_000).catch((e) => e);
		ctrl.abort();
		const err = await p;
		expect(err).not.toBeInstanceOf(NetworkError);
		expect(err.name).toBe('AbortError');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('clears the timeout when fetch resolves quickly', async () => {
		const mockResponse = new Response('{}', { status: 200 });
		globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

		const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
		await fetchWithTimeout('https://example.com/api', {}, 10000);
		expect(clearTimeoutSpy).toHaveBeenCalled();
		clearTimeoutSpy.mockRestore();
	});
});
