<script lang="ts">
	// DSGVO-compliant cookie consent banner
	import { cookieConsent } from '$lib/stores/cookieConsent';

	let showBanner = $state(false);
	let showSettings = $state(false);

	// Custom preferences (for settings modal)
	let analyticsEnabled = $state(false);
	let marketingEnabled = $state(false);

	// Show banner if user hasn't consented yet
	$effect(() => {
		showBanner = !$cookieConsent.consented;
	});

	function handleAcceptAll() {
		cookieConsent.acceptAll();
		showBanner = false;
	}

	function handleRejectAll() {
		cookieConsent.rejectAll();
		showBanner = false;
	}

	function handleSavePreferences() {
		cookieConsent.savePreferences({
			necessary: true,
			analytics: analyticsEnabled,
			marketing: marketingEnabled,
		});
		showSettings = false;
		showBanner = false;
	}

	function openSettings() {
		analyticsEnabled = $cookieConsent.preferences.analytics;
		marketingEnabled = $cookieConsent.preferences.marketing;
		showSettings = true;
	}
</script>

{#if showBanner}
	<!-- Backdrop -->
	<div class="cookie-banner__backdrop"></div>

	<!-- Banner -->
	<div
		class="cookie-banner"
		role="dialog"
		aria-labelledby="cookie-banner-title"
		aria-modal="true"
	>
		<div class="cookie-banner__container">
			<div class="cookie-banner__content">
				<h2 id="cookie-banner-title" class="cookie-banner__title">
					🍪 Wir respektieren Ihre Privatsphäre
				</h2>
				<p class="cookie-banner__text">
					Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer
					Website zu bieten. Notwendige Cookies sind für die Funktion der Website
					erforderlich. Optionale Cookies helfen uns, unsere Website zu verbessern
					und Ihnen personalisierte Inhalte anzuzeigen.
				</p>
				<a href="/datenschutz" class="cookie-banner__link">
					Mehr in unserer Datenschutzerklärung
				</a>
			</div>

			<div class="cookie-banner__actions">
				<button
					type="button"
					class="cookie-banner__btn cookie-banner__btn--accept"
					onclick={handleAcceptAll}
				>
					Alle akzeptieren
				</button>
				<button
					type="button"
					class="cookie-banner__btn cookie-banner__btn--reject"
					onclick={handleRejectAll}
				>
					Alle ablehnen
				</button>
				<button
					type="button"
					class="cookie-banner__btn cookie-banner__btn--settings"
					onclick={openSettings}
				>
					Einstellungen
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showSettings}
	<!-- Settings Modal -->
	<div
		class="cookie-settings__backdrop"
		onclick={() => (showSettings = false)}
		role="presentation"
	></div>

	<div
		class="cookie-settings"
		role="dialog"
		aria-labelledby="cookie-settings-title"
		aria-modal="true"
	>
		<div class="cookie-settings__header">
			<h2 id="cookie-settings-title" class="cookie-settings__title">
				Cookie-Einstellungen
			</h2>
			<button
				type="button"
				class="cookie-settings__close"
				onclick={() => (showSettings = false)}
				aria-label="Schließen"
			>
				✕
			</button>
		</div>

		<div class="cookie-settings__body">
			<!-- Necessary Cookies (Always on) -->
			<div class="cookie-category">
				<div class="cookie-category__header">
					<div class="cookie-category__info">
						<h3 class="cookie-category__title">Notwendige Cookies</h3>
						<p class="cookie-category__description">
							Diese Cookies sind für die Funktion der Website erforderlich und können
							nicht deaktiviert werden.
						</p>
					</div>
					<div class="cookie-category__toggle cookie-category__toggle--disabled">
						<input
							type="checkbox"
							checked
							disabled
							id="cookie-necessary"
							class="toggle-input"
						/>
						<label for="cookie-necessary" class="toggle-label">Immer aktiv</label>
					</div>
				</div>
			</div>

			<!-- Analytics Cookies -->
			<div class="cookie-category">
				<div class="cookie-category__header">
					<div class="cookie-category__info">
						<h3 class="cookie-category__title">Analyse-Cookies</h3>
						<p class="cookie-category__description">
							Diese Cookies helfen uns zu verstehen, wie Besucher unsere Website
							nutzen (z.B. Google Analytics).
						</p>
					</div>
					<div class="cookie-category__toggle">
						<input
							type="checkbox"
							bind:checked={analyticsEnabled}
							id="cookie-analytics"
							class="toggle-input"
						/>
						<label for="cookie-analytics" class="toggle-label">
							<span class="toggle-slider"></span>
						</label>
					</div>
				</div>
			</div>

			<!-- Marketing Cookies -->
			<div class="cookie-category">
				<div class="cookie-category__header">
					<div class="cookie-category__info">
						<h3 class="cookie-category__title">Marketing-Cookies</h3>
						<p class="cookie-category__description">
							Diese Cookies werden verwendet, um Ihnen relevante Werbung anzuzeigen
							(z.B. Facebook Pixel, Google Ads).
						</p>
					</div>
					<div class="cookie-category__toggle">
						<input
							type="checkbox"
							bind:checked={marketingEnabled}
							id="cookie-marketing"
							class="toggle-input"
						/>
						<label for="cookie-marketing" class="toggle-label">
							<span class="toggle-slider"></span>
						</label>
					</div>
				</div>
			</div>
		</div>

		<div class="cookie-settings__footer">
			<button
				type="button"
				class="cookie-settings__btn cookie-settings__btn--save"
				onclick={handleSavePreferences}
			>
				Einstellungen speichern
			</button>
		</div>
	</div>
{/if}

<style>
	/* Animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}

	/* Banner Backdrop */
	.cookie-banner__backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9998;
		animation: fadeIn 0.2s ease-out;
	}

	/* Cookie Banner */
	.cookie-banner {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #fff;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
		z-index: 9999;
		padding: 1.5rem;
		animation: slideUp 0.3s ease-out;
	}

	.cookie-banner__container {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.cookie-banner__title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: #1e3a5f;
	}

	.cookie-banner__text {
		margin: 0 0 0.5rem 0;
		color: #2d3748;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.cookie-banner__link {
		color: #c44100;
		text-decoration: underline;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.cookie-banner__link:hover {
		color: #e65100;
	}

	.cookie-banner__actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.cookie-banner__btn {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s;
		border: 2px solid transparent;
		white-space: nowrap;
	}

	.cookie-banner__btn--accept {
		background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
		color: #fff;
		border-color: #e65100;
	}

	.cookie-banner__btn--accept:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
	}

	.cookie-banner__btn--reject {
		background: #fff;
		color: #4a5568;
		border-color: #cbd5e0;
	}

	.cookie-banner__btn--reject:hover {
		background: #f7fafc;
		border-color: #a0aec0;
	}

	.cookie-banner__btn--settings {
		background: #fff;
		color: #1e3a5f;
		border-color: #1e3a5f;
	}

	.cookie-banner__btn--settings:hover {
		background: #1e3a5f;
		color: #fff;
	}

	/* Settings Modal Backdrop */
	.cookie-settings__backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 10000;
		animation: fadeIn 0.2s ease-out;
	}

	/* Settings Modal */
	.cookie-settings {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		z-index: 10001;
		width: 90%;
		max-width: 600px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		animation: scaleIn 0.3s ease-out;
	}

	.cookie-settings__header {
		padding: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.cookie-settings__title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: #1e3a5f;
	}

	.cookie-settings__close {
		background: none;
		border: none;
		font-size: 1.75rem;
		color: #718096;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: background 0.2s;
	}

	.cookie-settings__close:hover {
		background: #f7fafc;
		color: #2d3748;
	}

	.cookie-settings__body {
		padding: 1.5rem;
		overflow-y: auto;
		flex: 1;
	}

	.cookie-category {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.cookie-category:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}

	.cookie-category__header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.cookie-category__info {
		flex: 1;
	}

	.cookie-category__title {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: #2d3748;
	}

	.cookie-category__description {
		font-size: 0.9rem;
		color: #718096;
		margin: 0;
		line-height: 1.5;
	}

	/* Toggle Switch */
	.cookie-category__toggle {
		flex-shrink: 0;
	}

	.toggle-input {
		display: none;
	}

	.toggle-label {
		display: block;
		width: 52px;
		height: 28px;
		background: #cbd5e0;
		border-radius: 14px;
		position: relative;
		cursor: pointer;
		transition: background 0.3s;
	}

	.toggle-slider {
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

	.toggle-input:checked + .toggle-label {
		background: #e65100;
	}

	.toggle-input:checked + .toggle-label .toggle-slider {
		transform: translateX(24px);
	}

	.cookie-category__toggle--disabled .toggle-label {
		cursor: not-allowed;
		opacity: 0.6;
		background: #48bb78;
		font-size: 0.75rem;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 0.75rem;
		width: auto;
		font-weight: 600;
	}

	.cookie-settings__footer {
		padding: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.cookie-settings__btn--save {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
		color: #fff;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cookie-settings__btn--save:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
	}

	/* Responsive */
	@media (min-width: 768px) {
		.cookie-banner__container {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}

		.cookie-banner__content {
			flex: 1;
		}

		.cookie-banner__actions {
			flex-shrink: 0;
		}
	}
</style>
