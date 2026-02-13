// Utility functions for loading analytics and marketing scripts
// These functions should be called when user gives consent

import { browser } from '$app/environment';

/**
 * Load Google Analytics
 * Call this when user accepts analytics cookies
 */
export function loadGoogleAnalytics(measurementId: string) {
	if (!browser) return;

	// Create script tags for Google Analytics
	const gtagScript = document.createElement('script');
	gtagScript.async = true;
	gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	document.head.appendChild(gtagScript);

	// Initialize gtag
	const gtagConfig = document.createElement('script');
	gtagConfig.innerHTML = `
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', '${measurementId}', {
			'anonymize_ip': true,
			'cookie_flags': 'SameSite=None;Secure'
		});
	`;
	document.head.appendChild(gtagConfig);

	console.log('✅ Google Analytics loaded');
}

/**
 * Load Meta Pixel (Facebook Pixel)
 * Call this when user accepts marketing cookies
 */
export function loadMetaPixel(pixelId: string) {
	if (!browser) return;

	// Initialize Facebook Pixel
	const fbScript = document.createElement('script');
	fbScript.innerHTML = `
		!function(f,b,e,v,n,t,s)
		{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};
		if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
		n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];
		s.parentNode.insertBefore(t,s)}(window, document,'script',
		'https://connect.facebook.net/en_US/fbevents.js');
		fbq('init', '${pixelId}');
		fbq('track', 'PageView');
	`;
	document.head.appendChild(fbScript);

	console.log('✅ Meta Pixel loaded');
}

/**
 * Load Google Tag Manager
 * Call this when user accepts analytics/marketing cookies
 */
export function loadGoogleTagManager(gtmId: string) {
	if (!browser) return;

	// GTM script
	const gtmScript = document.createElement('script');
	gtmScript.innerHTML = `
		(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
		new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
		j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
		'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','${gtmId}');
	`;
	document.head.appendChild(gtmScript);

	// GTM noscript iframe
	const gtmNoScript = document.createElement('noscript');
	gtmNoScript.innerHTML = `
		<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
		height="0" width="0" style="display:none;visibility:hidden"></iframe>
	`;
	document.body.insertBefore(gtmNoScript, document.body.firstChild);

	console.log('✅ Google Tag Manager loaded');
}

/**
 * Remove all tracking cookies
 * Call this when user rejects cookies or changes preferences
 */
export function removeTrackingCookies() {
	if (!browser) return;

	// List of common tracking cookie prefixes
	const cookiePrefixes = ['_ga', '_gid', '_gat', '_fbp', '_fbc', '_gcl'];

	// Get all cookies
	const cookies = document.cookie.split(';');

	// Remove tracking cookies
	cookies.forEach((cookie) => {
		const cookieName = cookie.split('=')[0].trim();
		const shouldRemove = cookiePrefixes.some((prefix) =>
			cookieName.startsWith(prefix)
		);

		if (shouldRemove) {
			document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
			console.log(`🗑️ Removed cookie: ${cookieName}`);
		}
	});
}
