<script lang="ts">
	// Consent Manager - Automatically loads analytics/marketing scripts based on consent
	import { cookieConsent } from '$lib/stores/cookieConsent';
	import {
		loadGoogleAnalytics,
		loadMetaPixel,
		loadGoogleTagManager,
		removeTrackingCookies,
		deferUntilInteractionOrIdle,
	} from '$lib/utils/analytics';
	import { browser } from '$app/environment';

	const GOOGLE_ANALYTICS_ID = 'G-9QT7TKENKZ';
	const META_PIXEL_ID = ''; // e.g., '1234567890'
	const GOOGLE_TAG_MANAGER_ID = ''; // e.g., 'GTM-XXXXXX'

	// Track which scripts have been loaded to avoid duplicates
	let analyticsLoaded = false;
	let marketingLoaded = false;

	// Watch for consent changes and load/unload scripts accordingly
	$effect(() => {
		if (!browser || !$cookieConsent.consented) return;

		const { analytics, marketing } = $cookieConsent.preferences;

		// Load analytics scripts if consented and not already loaded.
		// Deferred until first interaction/idle so gtag.js never competes with LCP.
		if (analytics && !analyticsLoaded && GOOGLE_ANALYTICS_ID) {
			deferUntilInteractionOrIdle(() => loadGoogleAnalytics(GOOGLE_ANALYTICS_ID));
			analyticsLoaded = true;
		}

		// Load marketing scripts if consented and not already loaded
		if (marketing && !marketingLoaded) {
			if (META_PIXEL_ID) {
				loadMetaPixel(META_PIXEL_ID);
			}
			if (GOOGLE_TAG_MANAGER_ID) {
				loadGoogleTagManager(GOOGLE_TAG_MANAGER_ID);
			}
			marketingLoaded = true;
		}

		// Remove tracking cookies if consent was revoked
		if (!analytics && !marketing) {
			removeTrackingCookies();
		}
	});
</script>

<!-- This component has no visible output, it just manages script loading -->
