// Cookie consent store for DSGVO compliance
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface CookieConsent {
	necessary: boolean; // Always true, required for site functionality
	analytics: boolean; // Google Analytics, etc.
	marketing: boolean; // Meta Pixel, ads, etc.
}

export interface CookieConsentState {
	consented: boolean; // Has user made a choice?
	preferences: CookieConsent;
	timestamp: number;
}

const STORAGE_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0'; // Increment when privacy policy changes

// Default state - no consent given
const defaultState: CookieConsentState = {
	consented: false,
	preferences: {
		necessary: true, // Always allowed
		analytics: false,
		marketing: false,
	},
	timestamp: Date.now(),
};

// Load consent from localStorage
function loadConsent(): CookieConsentState {
	if (!browser) return defaultState;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return defaultState;

		const parsed = JSON.parse(stored);

		// Check if consent is still valid (version matches)
		if (parsed.version !== CONSENT_VERSION) {
			return defaultState;
		}

		return {
			consented: parsed.consented || false,
			preferences: {
				necessary: true, // Always true
				analytics: parsed.preferences?.analytics || false,
				marketing: parsed.preferences?.marketing || false,
			},
			timestamp: parsed.timestamp || Date.now(),
		};
	} catch (error) {
		console.error('Failed to load cookie consent:', error);
		return defaultState;
	}
}

// Save consent to localStorage
function saveConsent(state: CookieConsentState) {
	if (!browser) return;

	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: CONSENT_VERSION,
				...state,
			})
		);
	} catch (error) {
		console.error('Failed to save cookie consent:', error);
	}
}

// Create the store
function createConsentStore() {
	const { subscribe, set, update } = writable<CookieConsentState>(loadConsent());

	return {
		subscribe,

		// Accept all cookies
		acceptAll: () => {
			const newState: CookieConsentState = {
				consented: true,
				preferences: {
					necessary: true,
					analytics: true,
					marketing: true,
				},
				timestamp: Date.now(),
			};
			saveConsent(newState);
			set(newState);
		},

		// Reject all optional cookies
		rejectAll: () => {
			const newState: CookieConsentState = {
				consented: true,
				preferences: {
					necessary: true,
					analytics: false,
					marketing: false,
				},
				timestamp: Date.now(),
			};
			saveConsent(newState);
			set(newState);
		},

		// Save custom preferences
		savePreferences: (preferences: CookieConsent) => {
			const newState: CookieConsentState = {
				consented: true,
				preferences: {
					necessary: true, // Always true
					analytics: preferences.analytics,
					marketing: preferences.marketing,
				},
				timestamp: Date.now(),
			};
			saveConsent(newState);
			set(newState);
		},

		// Reset consent (for testing or when user wants to change)
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set(defaultState);
		},
	};
}

export const cookieConsent = createConsentStore();
