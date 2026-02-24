import { browser } from '$app/environment';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.aufraeumhelden.com';
const TOKEN_KEY = 'aust_access_token';
const REFRESH_KEY = 'aust_refresh_token';
const USER_KEY = 'aust_user';

export interface AuthUser {
	email: string;
	name: string;
	role: string;
}

interface LoginResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
}

function loadFromStorage<T>(key: string): T | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

function saveToStorage(key: string, value: unknown) {
	if (!browser) return;
	localStorage.setItem(key, JSON.stringify(value));
}

function removeFromStorage(key: string) {
	if (!browser) return;
	localStorage.removeItem(key);
}

class AuthStore {
	token = $state<string | null>(browser ? localStorage.getItem(TOKEN_KEY) : null);
	user = $state<AuthUser | null>(loadFromStorage<AuthUser>(USER_KEY));
	isAuthenticated = $derived(!!this.token);
	loading = $state(false);
	error = $state<string | null>(null);

	async login(email: string, password: string): Promise<boolean> {
		this.loading = true;
		this.error = null;

		try {
			const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			if (!res.ok) {
				const body = await res.json().catch(() => null);
				this.error = body?.message || 'Anmeldung fehlgeschlagen';
				return false;
			}

			const data: LoginResponse = await res.json();
			this.token = data.access_token;

			if (browser) {
				localStorage.setItem(TOKEN_KEY, data.access_token);
				localStorage.setItem(REFRESH_KEY, data.refresh_token);
			}

			// Decode user from JWT payload
			const payload = parseJwtPayload(data.access_token);
			if (payload) {
				this.user = {
					email: payload.email || email,
					name: payload.name || email,
					role: payload.role || 'admin'
				};
				saveToStorage(USER_KEY, this.user);
			}

			return true;
		} catch {
			this.error = 'Netzwerkfehler. Bitte versuchen Sie es erneut.';
			return false;
		} finally {
			this.loading = false;
		}
	}

	async refreshToken(): Promise<boolean> {
		if (!browser) return false;
		const refreshToken = localStorage.getItem(REFRESH_KEY);
		if (!refreshToken) return false;

		try {
			const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh_token: refreshToken })
			});

			if (!res.ok) return false;

			const data: LoginResponse = await res.json();
			this.token = data.access_token;
			localStorage.setItem(TOKEN_KEY, data.access_token);
			localStorage.setItem(REFRESH_KEY, data.refresh_token);
			return true;
		} catch {
			return false;
		}
	}

	logout() {
		this.token = null;
		this.user = null;
		this.error = null;
		removeFromStorage(TOKEN_KEY);
		removeFromStorage(REFRESH_KEY);
		removeFromStorage(USER_KEY);
	}
}

function parseJwtPayload(token: string): Record<string, string> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(payload);
	} catch {
		return null;
	}
}

export const auth = new AuthStore();
