/**
 * Fetch with an AbortController timeout.
 *
 * Called by: `apiFetch` in `api.svelte.ts` (all admin/worker HTTP requests)
 * Purpose: Prevents requests from hanging indefinitely if the backend stalls.
 *          After timeout ms, the controller aborts the signal and the promise rejects.
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
	const id = setTimeout(() => controller.abort(), timeout);
	const res = await fetch(url, { ...options, signal: controller.signal });
	clearTimeout(id);
	return res;
}
