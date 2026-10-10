/**
 * Thrown when a request never got an answer: the timeout fired or the network
 * dropped. Carries a German message that can go straight into a toast.
 *
 * `kind` tells the two apart: 'timeout' means the request may still have
 * reached the server (a write could have gone through), 'offline' means the
 * browser could not send it at all.
 */
export class NetworkError extends Error {
	constructor(
		public kind: 'timeout' | 'offline',
		message: string
	) {
		super(message);
		this.name = 'NetworkError';
	}
}

const READ_METHODS = new Set(['GET', 'HEAD']);

/** Delays before the 1st and 2nd retry of a read request. */
export const RETRY_DELAYS_MS = [1000, 3000];

function isOffline(): boolean {
	return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function networkError(kind: 'timeout' | 'offline', isRead: boolean): NetworkError {
	if (kind === 'offline') {
		return new NetworkError(
			'offline',
			isRead
				? 'Keine Internetverbindung – Daten konnten nicht geladen werden.'
				: 'Keine Internetverbindung – nicht gespeichert. Bitte erneut versuchen.'
		);
	}
	return new NetworkError(
		'timeout',
		isRead
			? 'Die Verbindung ist zu langsam – Daten konnten nicht geladen werden.'
			: 'Keine Antwort vom Server (Verbindung zu langsam) – evtl. nicht gespeichert. Bitte erneut versuchen.'
	);
}

/** One attempt: fetch with a timeout, translating failures into NetworkError. */
async function attempt(
	url: string,
	options: RequestInit,
	timeout: number,
	isRead: boolean
): Promise<Response> {
	const controller = new AbortController();
	const callerSignal = options.signal;
	if (callerSignal) {
		if (callerSignal.aborted) controller.abort(callerSignal.reason);
		else callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true });
	}
	let timedOut = false;
	const id = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, timeout);
	try {
		return await fetch(url, { ...options, signal: controller.signal });
	} catch (e) {
		// The caller cancelled on purpose — not a network problem, pass it through.
		if (callerSignal?.aborted && !timedOut) throw e;
		if (timedOut) throw networkError('timeout', isRead);
		// fetch rejects with a TypeError ("Failed to fetch" / "Load failed") when
		// the connection drops; Safari can also abort in-flight requests itself.
		if (e instanceof TypeError || (e instanceof DOMException && e.name === 'AbortError')) {
			throw networkError(isOffline() ? 'offline' : 'timeout', isRead);
		}
		throw e;
	} finally {
		clearTimeout(id);
	}
}

/**
 * Fetch with a timeout, readable German errors and automatic retries for reads.
 *
 * Called by: `apiFetch`/`apiDownload`/`apiPreview` in `api.svelte.ts` and
 *            `workerFetch` (all admin/worker HTTP requests)
 * Purpose: Keeps the dashboard usable on a flaky mobile connection (Alex works
 *          from the car). A stalled request is aborted after `timeout` ms.
 *          GET/HEAD requests are retried up to twice (1 s, 3 s back-off), since
 *          repeating a read is harmless. Writes are never retried here — the
 *          caller decides, because a timed-out write may have gone through.
 *
 * A caller-provided `options.signal` is respected: aborting it aborts the
 * request (and rethrows the original AbortError, no retry).
 *
 * @param url     - Full URL to fetch
 * @param options - Standard RequestInit options (body, headers, method, etc.)
 * @param timeout - Timeout per attempt in milliseconds (default: 15000)
 * @returns Promise resolving to a Response
 * @throws NetworkError when every attempt timed out or the network was down
 */
export async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeout = 15000
): Promise<Response> {
	const isRead = READ_METHODS.has((options.method ?? 'GET').toUpperCase());
	const delays = isRead ? RETRY_DELAYS_MS : [];
	for (let i = 0; ; i++) {
		try {
			return await attempt(url, options, timeout, isRead);
		} catch (e) {
			if (!(e instanceof NetworkError) || i >= delays.length) throw e;
			await new Promise((r) => setTimeout(r, delays[i]));
		}
	}
}
