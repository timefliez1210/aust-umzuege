<script lang="ts">
	// Cookie Settings Page - Allows users to manage their cookie preferences
	import { cookieConsent } from '$lib/stores/cookieConsent';
	import { goto } from '$app/navigation';
	import MetaTags from "$lib/components/MetaTags.svelte";
	import StructuredData from "$lib/components/StructuredData.svelte";
	import { createBreadcrumbs } from "$lib/data/structuredData";

	let analyticsEnabled = $state($cookieConsent.preferences.analytics);
	let marketingEnabled = $state($cookieConsent.preferences.marketing);
	let saved = $state(false);

	function handleSave() {
		cookieConsent.savePreferences({
			necessary: true,
			analytics: analyticsEnabled,
			marketing: marketingEnabled,
		});
		saved = true;
		setTimeout(() => {
			saved = false;
		}, 3000);
	}

	function handleAcceptAll() {
		cookieConsent.acceptAll();
		goto('/');
	}

	function handleRejectAll() {
		cookieConsent.rejectAll();
		goto('/');
	}

	const breadcrumbs = createBreadcrumbs([
		{ name: "Home", url: "https://www.aust-umzuege.de/" },
		{ name: "Cookie-Einstellungen" }
	]);
</script>

<MetaTags
	title="Cookie-Einstellungen | Aust Umzüge"
	description="Verwalten Sie Ihre Cookie-Einstellungen für aust-umzuege.de"
	canonical="https://www.aust-umzuege.de/cookie-einstellungen"
	noindex={true}
/>

<StructuredData schema={breadcrumbs} />

<main class="cookie-page">
	<div class="cookie-page__container">
		<h1 class="cookie-page__title">🍪 Cookie-Einstellungen</h1>

		<div class="cookie-page__intro">
			<p>
				Hier können Sie Ihre Cookie-Einstellungen jederzeit anpassen. Wir
				respektieren Ihre Privatsphäre und geben Ihnen die volle Kontrolle über
				Ihre Daten.
			</p>
			<p>
				Weitere Informationen finden Sie in unserer
				<a href="/datenschutz">Datenschutzerklärung</a>.
			</p>
		</div>

		{#if saved}
			<div class="cookie-page__success">
				✅ Ihre Einstellungen wurden erfolgreich gespeichert!
			</div>
		{/if}

		<!-- Cookie Categories -->
		<div class="cookie-categories">
			<!-- Necessary Cookies -->
			<div class="cookie-card">
				<div class="cookie-card__header">
					<div class="cookie-card__info">
						<h2 class="cookie-card__title">Notwendige Cookies</h2>
						<span class="cookie-card__badge cookie-card__badge--required">
							Erforderlich
						</span>
					</div>
				</div>
				<p class="cookie-card__description">
					Diese Cookies sind für die grundlegende Funktionalität der Website
					erforderlich. Sie ermöglichen die Navigation, Sicherheit und den Zugriff
					auf geschützte Bereiche. Diese Cookies können nicht deaktiviert werden.
				</p>
				<div class="cookie-card__details">
					<strong>Beispiele:</strong> Session-Cookies, Sicherheits-Cookies,
					Cookie-Einwilligung
				</div>
			</div>

			<!-- Analytics Cookies -->
			<div class="cookie-card">
				<div class="cookie-card__header">
					<div class="cookie-card__info">
						<h2 class="cookie-card__title">Analyse-Cookies</h2>
						<span
							class="cookie-card__badge"
							class:cookie-card__badge--active={analyticsEnabled}
						>
							{analyticsEnabled ? 'Aktiv' : 'Inaktiv'}
						</span>
					</div>
					<label class="toggle">
						<input type="checkbox" bind:checked={analyticsEnabled} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<p class="cookie-card__description">
					Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website
					nutzen. Wir sammeln Informationen über besuchte Seiten, Verweildauer und
					Klickverhalten, um unsere Website zu verbessern.
				</p>
				<div class="cookie-card__details">
					<strong>Dienste:</strong> Google Analytics
					<br />
					<strong>Zweck:</strong> Webseitenoptimierung, Nutzerverhalten analysieren
				</div>
			</div>

			<!-- Marketing Cookies -->
			<div class="cookie-card">
				<div class="cookie-card__header">
					<div class="cookie-card__info">
						<h2 class="cookie-card__title">Marketing-Cookies</h2>
						<span
							class="cookie-card__badge"
							class:cookie-card__badge--active={marketingEnabled}
						>
							{marketingEnabled ? 'Aktiv' : 'Inaktiv'}
						</span>
					</div>
					<label class="toggle">
						<input type="checkbox" bind:checked={marketingEnabled} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<p class="cookie-card__description">
					Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen
					und die Wirksamkeit unserer Marketingkampagnen zu messen.
				</p>
				<div class="cookie-card__details">
					<strong>Dienste:</strong> Facebook Pixel, Google Ads
					<br />
					<strong>Zweck:</strong> Personalisierte Werbung, Conversion-Tracking
				</div>
			</div>
		</div>

		<!-- Action Buttons -->
		<div class="cookie-page__actions">
			<button class="btn btn--primary" onclick={handleSave}>
				Einstellungen speichern
			</button>
			<button class="btn btn--accept" onclick={handleAcceptAll}>
				Alle akzeptieren
			</button>
			<button class="btn btn--reject" onclick={handleRejectAll}>
				Alle ablehnen
			</button>
		</div>

		<div class="cookie-page__info">
			<p>
				💡 <strong>Hinweis:</strong> Sie können Ihre Einstellungen jederzeit über
				diesen Link ändern. Ihre Wahl wird in Ihrem Browser gespeichert.
			</p>
		</div>
	</div>
</main>

<style>
	.cookie-page {
		min-height: 60vh;
		padding: var(--space-12) var(--container-padding);
		background: linear-gradient(to bottom, #f8fafc 0%, #fff 100%);
	}

	.cookie-page__container {
		max-width: 800px;
		margin: 0 auto;
	}

	.cookie-page__title {
		font-size: var(--text-3xl);
		font-weight: var(--font-bold);
		color: var(--color-info-bar);
		margin: 0 0 var(--space-6) 0;
		text-align: center;
	}

	.cookie-page__intro {
		background: #fff;
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		margin-bottom: var(--space-8);
		line-height: 1.7;
	}

	.cookie-page__intro p {
		margin: 0 0 var(--space-4) 0;
		color: #4a5568;
	}

	.cookie-page__intro p:last-child {
		margin-bottom: 0;
	}

	.cookie-page__intro a {
		color: #e65100;
		text-decoration: underline;
	}

	.cookie-page__intro a:hover {
		color: #ff6b00;
	}

	.cookie-page__success {
		background: #d4edda;
		color: #155724;
		padding: var(--space-4) var(--space-6);
		border-radius: var(--radius-md);
		border-left: 4px solid #28a745;
		margin-bottom: var(--space-6);
		font-weight: 600;
	}

	/* Cookie Categories */
	.cookie-categories {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.cookie-card {
		background: #fff;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		transition: border-color 0.2s;
	}

	.cookie-card:hover {
		border-color: #cbd5e0;
	}

	.cookie-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		gap: var(--space-4);
	}

	.cookie-card__info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.cookie-card__title {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: #2d3748;
		margin: 0;
	}

	.cookie-card__badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: var(--radius-full);
		font-size: 0.8rem;
		font-weight: 600;
		background: #e2e8f0;
		color: #64748b;
	}

	.cookie-card__badge--required {
		background: #d4edda;
		color: #155724;
	}

	.cookie-card__badge--active {
		background: #e65100;
		color: #fff;
	}

	.cookie-card__description {
		color: #4a5568;
		line-height: 1.7;
		margin: 0 0 var(--space-4) 0;
	}

	.cookie-card__details {
		background: #f8fafc;
		padding: var(--space-4);
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		color: #64748b;
		line-height: 1.6;
	}

	/* Toggle Switch */
	.toggle {
		display: block;
		width: 52px;
		height: 28px;
		position: relative;
		cursor: pointer;
		flex-shrink: 0;
	}

	.toggle input {
		display: none;
	}

	.toggle-slider {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #cbd5e0;
		border-radius: 14px;
		transition: background 0.3s;
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 24px;
		height: 24px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.3s;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle input:checked + .toggle-slider {
		background: #e65100;
	}

	.toggle input:checked + .toggle-slider::before {
		transform: translateX(24px);
	}

	/* Action Buttons */
	.cookie-page__actions {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
		margin-bottom: var(--space-8);
	}

	.btn {
		padding: var(--space-4) var(--space-6);
		border-radius: var(--radius-md);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		border: 2px solid transparent;
		flex: 1;
		min-width: 150px;
	}

	.btn--primary {
		background: var(--color-info-bar);
		color: #fff;
		border-color: var(--color-info-bar);
	}

	.btn--primary:hover {
		background: #173a5e;
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.btn--accept {
		background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
		color: #fff;
		border-color: #e65100;
	}

	.btn--accept:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
	}

	.btn--reject {
		background: #fff;
		color: #4a5568;
		border-color: #cbd5e0;
	}

	.btn--reject:hover {
		background: #f7fafc;
		border-color: #a0aec0;
	}

	.cookie-page__info {
		background: #fff3cd;
		border-left: 4px solid #ffc107;
		padding: var(--space-4) var(--space-6);
		border-radius: var(--radius-md);
		color: #856404;
		line-height: 1.6;
	}

	.cookie-page__info p {
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.cookie-page__actions {
			flex-direction: column;
		}

		.btn {
			min-width: 100%;
		}

		.cookie-card__header {
			flex-direction: column;
		}
	}
</style>
