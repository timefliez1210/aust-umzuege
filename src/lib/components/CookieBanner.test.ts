import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CookieBanner from './CookieBanner.svelte';
import { cookieConsent } from '$lib/stores/cookieConsent';

beforeEach(() => {
	localStorage.clear();
	cookieConsent.reset();
});

/** The banner defers its visibility check by 300ms to not block hydration. */
async function bannerAppears() {
	return waitFor(() => screen.getByText(/Wir respektieren Ihre Privatsphäre/), { timeout: 1500 });
}

describe('CookieBanner — visibility', () => {
	it('appears (after the hydration delay) when no consent was given yet', async () => {
		render(CookieBanner);
		expect(screen.queryByText(/Wir respektieren Ihre Privatsphäre/)).not.toBeInTheDocument();
		await bannerAppears();
	});

	it('stays hidden when the user already made a choice', async () => {
		cookieConsent.rejectAll();
		render(CookieBanner);
		await new Promise((r) => setTimeout(r, 400));
		expect(screen.queryByText(/Wir respektieren Ihre Privatsphäre/)).not.toBeInTheDocument();
	});

	it('links to the privacy policy', async () => {
		render(CookieBanner);
		await bannerAppears();
		expect(screen.getByRole('link', { name: /Datenschutzerklärung/ })).toHaveAttribute(
			'href',
			'/datenschutz'
		);
	});
});

describe('CookieBanner — choices', () => {
	it('"Alle akzeptieren" enables analytics + marketing and dismisses the banner', async () => {
		const user = userEvent.setup();
		render(CookieBanner);
		await bannerAppears();

		await user.click(screen.getByRole('button', { name: 'Alle akzeptieren' }));
		const state = get(cookieConsent);
		expect(state.consented).toBe(true);
		expect(state.preferences.analytics).toBe(true);
		expect(state.preferences.marketing).toBe(true);
		expect(screen.queryByText(/Wir respektieren Ihre Privatsphäre/)).not.toBeInTheDocument();
	});

	it('"Alle ablehnen" records the refusal and dismisses the banner', async () => {
		const user = userEvent.setup();
		render(CookieBanner);
		await bannerAppears();

		await user.click(screen.getByRole('button', { name: 'Alle ablehnen' }));
		const state = get(cookieConsent);
		expect(state.consented).toBe(true);
		expect(state.preferences.analytics).toBe(false);
		expect(state.preferences.marketing).toBe(false);
	});
});

describe('CookieBanner — settings modal', () => {
	it('lets the user save a custom selection (analytics only)', async () => {
		const user = userEvent.setup();
		render(CookieBanner);
		await bannerAppears();

		await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
		expect(screen.getByText('Cookie-Einstellungen')).toBeInTheDocument();

		// necessary is always on and cannot be disabled
		const necessary = document.querySelector<HTMLInputElement>('#cookie-necessary')!;
		expect(necessary.checked).toBe(true);
		expect(necessary.disabled).toBe(true);

		const analytics = document.querySelector<HTMLInputElement>('#cookie-analytics')!;
		await user.click(analytics);
		await user.click(screen.getByRole('button', { name: 'Einstellungen speichern' }));

		const state = get(cookieConsent);
		expect(state.preferences).toEqual({ necessary: true, analytics: true, marketing: false });
		// both modal and banner are dismissed after saving
		expect(screen.queryByText('Cookie-Einstellungen')).not.toBeInTheDocument();
		expect(screen.queryByText(/Wir respektieren Ihre Privatsphäre/)).not.toBeInTheDocument();
	});

	it('the close button dismisses the modal without saving', async () => {
		const user = userEvent.setup();
		render(CookieBanner);
		await bannerAppears();

		await user.click(screen.getByRole('button', { name: 'Einstellungen' }));
		await user.click(screen.getByRole('button', { name: 'Schließen' }));
		expect(screen.queryByText('Cookie-Einstellungen')).not.toBeInTheDocument();
		// no choice recorded → banner still visible
		expect(get(cookieConsent).consented).toBe(false);
		expect(screen.getByText(/Wir respektieren Ihre Privatsphäre/)).toBeInTheDocument();
	});
});
