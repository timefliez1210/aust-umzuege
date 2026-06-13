import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	loadGoogleAnalytics,
	loadMetaPixel,
	loadGoogleTagManager,
	removeTrackingCookies,
	deferUntilInteractionOrIdle,
} from './analytics';

function clearInjectedScripts() {
	document.head.querySelectorAll('script').forEach((s) => s.remove());
	document.body.querySelectorAll('noscript').forEach((n) => n.remove());
}

beforeEach(() => clearInjectedScripts());

describe('loadGoogleAnalytics', () => {
	it('injects the gtag loader for the given measurement id plus an inline config', () => {
		loadGoogleAnalytics('G-TEST123');
		const scripts = [...document.head.querySelectorAll('script')];
		const loader = scripts.find((s) => s.src.includes('googletagmanager.com/gtag/js?id=G-TEST123'));
		expect(loader).toBeDefined();
		expect(loader!.async).toBe(true);

		const config = scripts.find((s) => s.innerHTML.includes("gtag('config', 'G-TEST123'"));
		expect(config).toBeDefined();
	});

	it('configures GA with anonymize_ip for DSGVO', () => {
		loadGoogleAnalytics('G-TEST123');
		const inline = [...document.head.querySelectorAll('script')].map((s) => s.innerHTML).join('');
		expect(inline).toContain("'anonymize_ip': true");
	});
});

describe('loadMetaPixel / loadGoogleTagManager', () => {
	it('injects the Meta pixel bootstrap with the pixel id', () => {
		loadMetaPixel('987654');
		const inline = [...document.head.querySelectorAll('script')].map((s) => s.innerHTML).join('');
		expect(inline).toContain("fbq('init', '987654')");
		expect(inline).toContain('connect.facebook.net');
	});

	it('injects GTM script into head and noscript iframe into body', () => {
		loadGoogleTagManager('GTM-XYZ');
		const inline = [...document.head.querySelectorAll('script')].map((s) => s.innerHTML).join('');
		expect(inline).toContain('googletagmanager.com/gtm.js');
		expect(inline).toContain('GTM-XYZ');
		expect(document.body.querySelector('noscript')).not.toBeNull();
	});
});

describe('removeTrackingCookies', () => {
	it('expires GA/Meta tracking cookies but leaves unrelated cookies alone', () => {
		document.cookie = '_ga=GA1.2.123; path=/';
		document.cookie = '_ga_ABC123=GS1.1; path=/';
		document.cookie = '_fbp=fb.1.2.3; path=/';
		document.cookie = 'session=keepme; path=/';

		removeTrackingCookies();

		expect(document.cookie).not.toContain('_ga=');
		expect(document.cookie).not.toContain('_ga_ABC123=');
		expect(document.cookie).not.toContain('_fbp=');
		expect(document.cookie).toContain('session=keepme');
	});
});

describe('deferUntilInteractionOrIdle', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('runs the callback on first user interaction, exactly once', () => {
		const fn = vi.fn();
		deferUntilInteractionOrIdle(fn);
		expect(fn).not.toHaveBeenCalled();

		document.dispatchEvent(new Event('scroll'));
		expect(fn).toHaveBeenCalledTimes(1);

		// further interactions must not re-run it
		document.dispatchEvent(new Event('click'));
		document.dispatchEvent(new Event('keydown'));
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('falls back to a timer when the user never interacts', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		deferUntilInteractionOrIdle(fn);

		// jsdom has no requestIdleCallback → 8s setTimeout fallback
		vi.advanceTimersByTime(8000);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('does not double-fire when interaction happens before the idle fallback', () => {
		vi.useFakeTimers();
		const fn = vi.fn();
		deferUntilInteractionOrIdle(fn);

		document.dispatchEvent(new Event('touchstart'));
		vi.advanceTimersByTime(10000);
		expect(fn).toHaveBeenCalledTimes(1);
	});
});
