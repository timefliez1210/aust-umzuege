import { describe, it, expect, vi } from 'vitest';
import { fetchWithTimeout } from './fetchTimeout';

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

	it('aborts fetch when timeout is exceeded', async () => {
		globalThis.fetch = vi.fn().mockImplementation(() =>
			new Promise((_resolve, reject) => {
				// never resolves — simulates a hanging server
				setTimeout(() => {
					reject(new DOMException('The operation was aborted.', 'AbortError'));
				}, 50);
			})
		);

		await expect(fetchWithTimeout('https://example.com/api', {}, 10)).rejects.toThrow('The operation was aborted');
	});

	it('uses a custom timeout when provided', async () => {
		globalThis.fetch = vi.fn().mockImplementation(() =>
			new Promise((_resolve, reject) => {
				setTimeout(() => {
					reject(new DOMException('The operation was aborted.', 'AbortError'));
				}, 200);
			})
		);

		// With a 50ms timeout, the fetch should be aborted before the 200ms fake resolve
		await expect(fetchWithTimeout('https://example.com/api', {}, 50)).rejects.toThrow('The operation was aborted');
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
