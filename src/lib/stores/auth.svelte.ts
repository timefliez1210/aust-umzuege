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

/**
 * Reads and JSON-parses a value from localStorage, returning null on any failure.
 *
 * Called by: AuthStore (on initialisation to rehydrate the user object from storage)
 * Purpose: Safely recovers persisted auth state after a page reload without
 *          crashing during SSR (where localStorage is unavailable) or when the
 *          stored value is malformed
 *
 * @param key - localStorage key to read
 * @returns Parsed value cast to T, or null if not in browser, key is absent, or JSON is invalid
 */
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

/**
 * JSON-serialises a value and writes it to localStorage.
 *
 * Called by: AuthStore.login (to persist access token, refresh token, and user profile)
 * Purpose: Persists auth state so that the admin session survives page reloads;
 *          no-ops during SSR where localStorage is unavailable
 *
 * @param key - localStorage key to write
 * @param value - Any JSON-serialisable value to store
 */
function saveToStorage(key: string, value: unknown) {
	if (!browser) return;
	localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Removes a single key from localStorage.
 *
 * Called by: AuthStore.logout (to clear all three persisted auth keys)
 * Purpose: Ensures that tokens and user data are fully wiped from the browser
 *          on logout; no-ops during SSR
 *
 * @param key - localStorage key to remove
 */
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

	/**
	 * Authenticates the user against the API and persists the resulting tokens.
	 *
	 * Called by: admin/login/+page.svelte (on form submit)
	 * Purpose: Exchanges email/password credentials for a JWT access token and
	 *          refresh token, stores them in localStorage, and decodes the JWT
	 *          payload to populate the user profile in reactive state
	 *
	 * @param email - User's email address
	 * @param password - User's plaintext password (sent over HTTPS)
	 * @returns True if login succeeded and tokens were stored; false on auth failure
	 *          or network error (sets this.error with a German message)
	 */
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

	/**
	 * Attempts to obtain a new access token using the stored refresh token.
	 *
	 * Called by: apiFetch in api.svelte.ts (automatically on every 401 response),
	 *            apiDownload in api.svelte.ts (automatically on 401 during file fetch)
	 * Purpose: Transparently extends the session without requiring the admin to
	 *          re-enter credentials when the short-lived access token expires;
	 *          called internally by the API layer, never directly by UI components
	 *
	 * @returns True if a new access token was successfully obtained and stored;
	 *          false if no refresh token exists, the request fails, or in SSR context
	 */
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

	/**
	 * Clears all in-memory and persisted auth state, effectively ending the session.
	 *
	 * Called by: admin/+layout.svelte (logout button),
	 *            apiFetch in api.svelte.ts (when token refresh fails after a 401),
	 *            apiDownload in api.svelte.ts (when token refresh fails after a 401)
	 * Purpose: Ensures a clean sign-out by wiping both the reactive Svelte state
	 *          and the localStorage entries so no credentials linger in the browser
	 */
	logout() {
		this.token = null;
		this.user = null;
		this.error = null;
		removeFromStorage(TOKEN_KEY);
		removeFromStorage(REFRESH_KEY);
		removeFromStorage(USER_KEY);
	}
}

/**
 * Decodes the payload segment of a JWT without verifying the signature.
 *
 * Called by: AuthStore.login (to extract email, name, and role claims after login)
 * Purpose: Avoids a separate /me API call by reading user metadata directly from
 *          the access token; signature verification is left to the backend on every
 *          subsequent authenticated request
 *
 * @param token - Raw JWT string in the standard "header.payload.signature" format
 * @returns Parsed payload object as a string-keyed record, or null if the token
 *          is malformed or base64 decoding/JSON parsing fails
 */
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
