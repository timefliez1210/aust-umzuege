/**
 * Fetch with an AbortController timeout.
 *
 * Called by: `apiFetch` in `api.svelte.ts` (all admin/worker HTTP requests)
 * Purpose: Prevents requests from hanging indefinitely if the backend stalls.
 *          After timeout ms, the controller aborts the signal and the promise rejects.
 *
 * A caller-provided `options.signal` is respected: aborting it aborts the
 * request, independent of the timeout.
 *
 * @param url     - Full URL to fetch
 * @param options - Standard RequestInit options (body, headers, method, etc.)
 * @param timeout - Timeout in milliseconds (default: 15000)
 * @returns Promise resolving to a Response
 * @throws AbortError when the timeout is exceeded or the signal is otherwise aborted
 */
export async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeout = 15000
): Promise<Response> {
	const controller = new AbortController();
	const callerSignal = options.signal;
	if (callerSignal) {
		if (callerSignal.aborted) controller.abort(callerSignal.reason);
		else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true });
	}
	const id = setTimeout(() => controller.abort(), timeout);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} finally {
		clearTimeout(id);
	}
}
