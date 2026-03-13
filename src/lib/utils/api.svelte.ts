import { auth } from '$lib/stores/auth.svelte';

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.aufraeumhelden.com';

interface FetchOptions extends Omit<RequestInit, 'body'> {
	body?: unknown;
}

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Core authenticated fetch wrapper for all admin API calls.
 *
 * Called by: apiGet, apiPost, apiPatch, apiPut, apiDelete (internally),
 *            quotes/[id]/+page.svelte (directly for multipart uploads and polling),
 *            quotes/+page.svelte (directly for file upload)
 * Purpose: Centralises auth header injection, JSON serialisation, and the
 *          401-refresh-retry cycle so every HTTP method gets identical behaviour.
 *
 * @param path - API path relative to API_BASE (e.g. "/api/v1/quotes/123")
 * @param options - Standard fetch options; body may be any value or FormData
 * @returns Parsed JSON response cast to T, or the raw Response for non-JSON replies
 *
 * Auth flow: attaches Bearer token from auth store; on 401 calls auth.refreshToken()
 * once and retries; if refresh fails, calls auth.logout() and throws ApiError(401).
 */
export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
	const { body, headers: customHeaders, ...rest } = options;

	const headers: Record<string, string> = {
		...(customHeaders as Record<string, string>)
	};

	if (auth.token) {
		headers['Authorization'] = `Bearer ${auth.token}`;
	}

	if (body !== undefined && !(body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	const fetchOptions: RequestInit = {
		...rest,
		headers,
		body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined
	};

	let res = await fetch(`${API_BASE}${path}`, fetchOptions);

	// On 401, try refreshing the token once
	if (res.status === 401 && auth.token) {
		const refreshed = await auth.refreshToken();
		if (refreshed) {
			headers['Authorization'] = `Bearer ${auth.token}`;
			fetchOptions.headers = headers;
			res = await fetch(`${API_BASE}${path}`, fetchOptions);
		} else {
			auth.logout();
			throw new ApiError(401, 'Sitzung abgelaufen. Bitte erneut anmelden.');
		}
	}

	if (!res.ok) {
		const errorBody = await res.json().catch(() => null);
		throw new ApiError(res.status, errorBody?.message || `Fehler ${res.status}`);
	}

	const contentType = res.headers.get('content-type');
	if (contentType?.includes('application/json')) {
		return res.json();
	}

	return res as unknown as T;
}

/**
 * Sends a GET request to the given API path.
 *
 * Called by: admin/+page.svelte (dashboard), quotes/+page.svelte (list),
 *            quotes/[id]/+page.svelte (detail), offers/+page.svelte (list),
 *            offers/[id]/+page.svelte (detail), customers/+page.svelte,
 *            customers/[id]/+page.svelte, emails/+page.svelte,
 *            emails/[id]/+page.svelte, orders/+page.svelte,
 *            settings/+page.svelte, calendar/+page.svelte
 * Purpose: Convenience wrapper so callers do not need to specify method: 'GET'
 *
 * @param path - API path relative to API_BASE
 * @returns Parsed JSON response cast to T
 */
export function apiGet<T = unknown>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: 'GET' });
}

/**
 * Sends a POST request with an optional JSON body to the given API path.
 *
 * Called by: quotes/+page.svelte (create quote/customer), quotes/[id]/+page.svelte
 *            (generate offer, status change, delete, re-estimate),
 *            offers/[id]/+page.svelte (regenerate, send, reject, delete, re-estimate),
 *            customers/+page.svelte, customers/[id]/+page.svelte,
 *            emails/+page.svelte, emails/[id]/+page.svelte,
 *            settings/+page.svelte, calendar/+page.svelte
 * Purpose: Convenience wrapper for mutating operations that create resources
 *
 * @param path - API path relative to API_BASE
 * @param body - Optional request payload; serialised to JSON automatically
 * @returns Parsed JSON response cast to T
 */
export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'POST', body });
}

/**
 * Sends a PATCH request with a partial JSON body to the given API path.
 *
 * Called by: quotes/[id]/+page.svelte (address edits, quote status),
 *            offers/[id]/+page.svelte (offer field edits),
 *            customers/[id]/+page.svelte, emails/[id]/+page.svelte,
 *            calendar/+page.svelte (booking status)
 * Purpose: Convenience wrapper for partial resource updates
 *
 * @param path - API path relative to API_BASE
 * @param body - Partial update payload; serialised to JSON automatically
 * @returns Parsed JSON response cast to T
 */
export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'PATCH', body });
}

/**
 * Sends a PUT request with a full replacement JSON body to the given API path.
 *
 * Called by: quotes/[id]/+page.svelte (estimation items bulk replace),
 *            calendar/+page.svelte (capacity update)
 * Purpose: Convenience wrapper for full resource replacement operations
 *
 * @param path - API path relative to API_BASE
 * @param body - Full replacement payload; serialised to JSON automatically
 * @returns Parsed JSON response cast to T
 */
export function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'PUT', body });
}

/**
 * Sends a DELETE request to the given API path.
 *
 * Called by: quotes/[id]/+page.svelte (delete estimation),
 *            calendar/+page.svelte (delete booking)
 * Purpose: Convenience wrapper for resource deletion
 *
 * @param path - API path relative to API_BASE
 * @returns Parsed JSON response cast to T (typically an empty body or confirmation)
 */
export function apiDelete<T = unknown>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: 'DELETE' });
}

/**
 * Fetch a file with auth headers and trigger a browser download.
 *
 * Called by: offers/[id]/+page.svelte (PDF download button)
 * Purpose: Downloads a protected binary resource (e.g. offer PDF) and saves it
 *          using a synthetic anchor-click so the browser treats it as a download
 *
 * @param path - API path relative to API_BASE for the file resource
 * @param filename - The filename the browser should use when saving the file
 * @returns Resolves when the download has been triggered
 *
 * Auth flow: attaches Bearer token; on 401 calls auth.refreshToken() once and
 * retries; if refresh fails, calls auth.logout() and throws ApiError(401).
 */
export async function apiDownload(path: string, filename: string): Promise<void> {
	const headers: Record<string, string> = {};
	if (auth.token) {
		headers['Authorization'] = `Bearer ${auth.token}`;
	}

	let res = await fetch(`${API_BASE}${path}`, { headers });

	if (res.status === 401 && auth.token) {
		const refreshed = await auth.refreshToken();
		if (refreshed) {
			headers['Authorization'] = `Bearer ${auth.token}`;
			res = await fetch(`${API_BASE}${path}`, { headers });
		} else {
			auth.logout();
			throw new ApiError(401, 'Sitzung abgelaufen. Bitte erneut anmelden.');
		}
	}

	if (!res.ok) {
		throw new ApiError(res.status, `Download fehlgeschlagen (${res.status})`);
	}

	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export { formatEuro, formatDate, formatDateTime } from '$lib/utils/format';

/**
 * Formats a byte count as a human-readable size string.
 *
 * Called by: MediaPreviewGrid.svelte (to display file sizes in queue/tile views),
 *            admin/inquiries/[id]/+page.svelte (upload queue)
 * Purpose: Renders file sizes compactly so users can see at a glance whether a file is
 *          large (video) or small (photo) before uploading.
 *
 * @param bytes - File size in bytes
 * @returns A formatted string such as "512 B", "850 KB", or "2.4 MB"
 */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
