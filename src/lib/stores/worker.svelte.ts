/**
 * Worker (employee) auth store.
 *
 * Mirrors the pattern of auth.svelte.ts but uses the employee OTP/session system.
 * Session token is stored in localStorage under 'worker_token'.
 * Employee profile is stored under 'worker_employee'.
 */

const TOKEN_KEY = 'worker_token';
const EMPLOYEE_KEY = 'worker_employee';
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.aufraeumhelden.com';

export interface WorkerEmployee {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	salutation: string | null;
	phone: string | null;
}

function loadFromStorage<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function saveToStorage<T>(key: string, value: T): void {
	localStorage.setItem(key, JSON.stringify(value));
}

class WorkerStore {
	token = $state<string | null>(null);
	employee = $state<WorkerEmployee | null>(null);

	constructor() {
		if (typeof window !== 'undefined') {
			this.token = localStorage.getItem(TOKEN_KEY);
			this.employee = loadFromStorage<WorkerEmployee>(EMPLOYEE_KEY);
		}
	}

	get isAuthenticated(): boolean {
		return this.token !== null && this.employee !== null;
	}

	/**
	 * Store credentials returned by POST /employee/auth/verify.
	 *
	 * Called by: worker login page after successful OTP verification.
	 * Purpose: Persists session token + employee profile so the portal
	 *          stays logged in across page reloads (30-day session).
	 *
	 * @param token    - 64-char hex session token from the API
	 * @param employee - Employee profile from the API response
	 */
	login(token: string, employee: WorkerEmployee): void {
		this.token = token;
		this.employee = employee;
		localStorage.setItem(TOKEN_KEY, token);
		saveToStorage(EMPLOYEE_KEY, employee);
	}

	/**
	 * Clear all session state and redirect to worker login.
	 *
	 * Called by: worker layout auth guard on 401, or explicit logout button.
	 * Purpose: Ensures no stale credentials remain in localStorage.
	 */
	logout(): void {
		this.token = null;
		this.employee = null;
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(EMPLOYEE_KEY);
	}
}

export const worker = new WorkerStore();

/**
 * Authenticated fetch for the worker portal.
 *
 * Called by: all worker API helpers (workerGet, etc.)
 * Purpose: Injects the worker session token as a Bearer header; on 401
 *          logs the worker out and redirects to the login page.
 *
 * @param path    - API path (e.g. "/api/v1/employee/me")
 * @param options - Standard fetch options
 * @returns Parsed JSON response
 */
export async function workerFetch<T = unknown>(
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const headers: Record<string, string> = {
		...(options.headers as Record<string, string>),
	};

	if (worker.token) {
		headers['Authorization'] = `Bearer ${worker.token}`;
	}
	if (!(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

	if (res.status === 401) {
		worker.logout();
		window.location.href = '/worker/login';
		throw new Error('Session abgelaufen');
	}

	if (!res.ok) {
		const err = await res.json().catch(() => ({ message: res.statusText }));
		throw new Error((err as { message?: string }).message ?? res.statusText);
	}

	return res.json() as Promise<T>;
}

export function workerGet<T = unknown>(path: string): Promise<T> {
	return workerFetch<T>(path, { method: 'GET' });
}
