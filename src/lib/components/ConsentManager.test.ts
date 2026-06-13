import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import ConsentManager from './ConsentManager.svelte';
import { cookieConsent } from '$lib/stores/cookieConsent';

function gaScripts(): HTMLScriptElement[] {
	return [...document.head.querySelectorAll('script')].filter(
		(s) => s.src.includes('googletagmanager.com/gtag') || s.innerHTML.includes('gtag(')
	);
}

beforeEach(() => {
	localStorage.clear();
	cookieConsent.reset();
	document.head.querySelectorAll('script').forEach((s) => s.remove());
	document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
});

describe('ConsentManager — DSGVO gating (the connected-changes contract: no GA before consent)', () => {
	it('loads nothing while no consent decision was made', async () => {
		render(ConsentManager);
		await tick();
		document.dispatchEvent(new Event('scroll')); // would trigger the deferred loader
		expect(gaScripts()).toHaveLength(0);
	});

	it('loads nothing when the user rejected optional cookies', async () => {
		render(ConsentManager);
		cookieConsent.rejectAll();
		await tick();
		document.dispatchEvent(new Event('scroll'));
		expect(gaScripts()).toHaveLength(0);
	});

	it('loads Google Analytics only after analytics consent, deferred until interaction', async () => {
		render(ConsentManager);
		cookieConsent.acceptAll();
		await tick();

		// consent alone must not inject the script yet (LCP protection) …
		expect(gaScripts()).toHaveLength(0);

		// … the first interaction does
		document.dispatchEvent(new Event('scroll'));
		const scripts = gaScripts();
		expect(scripts.length).toBeGreaterThan(0);
		expect(scripts.some((s) => s.src.includes('id=G-9QT7TKENKZ'))).toBe(true);
	});

	it('does not double-inject when consent fires repeatedly', async () => {
		render(ConsentManager);
		cookieConsent.acceptAll();
		await tick();
		document.dispatchEvent(new Event('scroll'));
		const count = gaScripts().length;

		cookieConsent.savePreferences({ necessary: true, analytics: true, marketing: true });
		await tick();
		document.dispatchEvent(new Event('click'));
		expect(gaScripts().length).toBe(count);
	});

	it('removes tracking cookies when consent is revoked', async () => {
		render(ConsentManager);
		document.cookie = '_ga=GA1.2.42; path=/';
		cookieConsent.rejectAll();
		await tick();
		expect(document.cookie).not.toContain('_ga=');
	});
});
