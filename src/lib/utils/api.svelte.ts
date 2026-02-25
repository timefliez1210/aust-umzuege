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

export function apiGet<T = unknown>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: 'GET' });
}

export function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'POST', body });
}

export function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'PATCH', body });
}

export function apiPut<T = unknown>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: 'PUT', body });
}

export function apiDelete<T = unknown>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: 'DELETE' });
}

/** Fetch a file with auth headers and trigger a browser download. */
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

export function formatEuro(cents: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR'
	}).format(cents / 100);
}

export function formatDate(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(dateStr));
}
