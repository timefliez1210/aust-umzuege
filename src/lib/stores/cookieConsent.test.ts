import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { cookieConsent } from './cookieConsent';

const STORAGE_KEY = 'cookie-consent';

beforeEach(() => {
	localStorage.clear();
	cookieConsent.reset();
});

describe('cookieConsent store', () => {
	it('defaults to no consent with only necessary cookies allowed', () => {
		const state = get(cookieConsent);
		expect(state.consented).toBe(false);
		expect(state.preferences).toEqual({ necessary: true, analytics: false, marketing: false });
	});

	it('acceptAll enables analytics + marketing and persists with version', () => {
		cookieConsent.acceptAll();
		const state = get(cookieConsent);
		expect(state.consented).toBe(true);
		expect(state.preferences.analytics).toBe(true);
		expect(state.preferences.marketing).toBe(true);

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
		expect(stored.version).toBe('1.0');
		expect(stored.preferences.analytics).toBe(true);
	});

	it('rejectAll records the choice but disables all optional categories', () => {
		cookieConsent.rejectAll();
		const state = get(cookieConsent);
		// consented=true means "user made a choice", not "user agreed"
		expect(state.consented).toBe(true);
		expect(state.preferences.analytics).toBe(false);
		expect(state.preferences.marketing).toBe(false);
	});

	it('savePreferences stores a custom selection and always forces necessary=true', () => {
		cookieConsent.savePreferences({ necessary: false, analytics: true, marketing: false });
		const state = get(cookieConsent);
		expect(state.preferences).toEqual({ necessary: true, analytics: true, marketing: false });
		expect(state.consented).toBe(true);
	});

	it('reset clears persisted consent so the banner shows again', () => {
		cookieConsent.acceptAll();
		cookieConsent.reset();
		expect(get(cookieConsent).consented).toBe(false);
		expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
	});
});

describe('cookieConsent persistence across reloads', () => {
	async function freshStore() {
		vi.resetModules();
		const mod = await import('./cookieConsent');
		return mod.cookieConsent;
	}

	it('rehydrates a stored consent on load', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: '1.0',
				consented: true,
				preferences: { necessary: true, analytics: true, marketing: false },
				timestamp: 123,
			})
		);
		const store = await freshStore();
		const state = get(store);
		expect(state.consented).toBe(true);
		expect(state.preferences.analytics).toBe(true);
		expect(state.preferences.marketing).toBe(false);
	});

	it('invalidates consent stored under an older policy version (re-consent required)', async () => {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				version: '0.9',
				consented: true,
				preferences: { necessary: true, analytics: true, marketing: true },
				timestamp: 123,
			})
		);
		const store = await freshStore();
		expect(get(store).consented).toBe(false);
		expect(get(store).preferences.analytics).toBe(false);
	});

	it('survives corrupted localStorage payloads by falling back to defaults', async () => {
		localStorage.setItem(STORAGE_KEY, '{not json');
		const store = await freshStore();
		expect(get(store).consented).toBe(false);
	});
});
