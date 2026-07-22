<script lang="ts">
	import { apiGet, apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Euro, Hash } from 'lucide-svelte';

	interface PricingSettings {
		rate_per_person_hour_cents: number;
		saturday_surcharge_cents: number;
		fahrt_rate_per_km: number;
		assembly_price: number;
		parking_ban_price: number;
		packing_price: number;
		transporter_price: number;
	}
	interface SettingsResponse {
		pricing: PricingSettings;
		next_invoice_number: number;
		next_offer_number: number;
	}

	let settingsLoading = $state(true);
	// Pricing form (euros for display; *_cents fields converted on save/load).
	let laborRateEur = $state(0);
	let saturdaySurchargeEur = $state(0);
	let fahrtRatePerKm = $state(0);
	let assemblyPrice = $state(0);
	let parkingBanPrice = $state(0);
	let packingPrice = $state(0);
	let transporterPrice = $state(0);
	let savingPricing = $state(false);

	let nextInvoiceNumber = $state(0);
	let nextOfferNumber = $state(0);
	let savingNumbers = $state(false);

	$effect(() => {
		loadSettings();
	});

	/**
	 * Loads pricing values and the next invoice/KVA numbers from the API.
	 *
	 * Called by: $effect (on mount), savePricing/saveNumbers after a successful write.
	 * Purpose: Populates the Preise and Nummernkreise cards via GET /api/v1/admin/settings.
	 */
	async function loadSettings() {
		settingsLoading = true;
		try {
			const data = await apiGet<SettingsResponse>('/api/v1/admin/settings');
			laborRateEur = data.pricing.rate_per_person_hour_cents / 100;
			saturdaySurchargeEur = data.pricing.saturday_surcharge_cents / 100;
			fahrtRatePerKm = data.pricing.fahrt_rate_per_km;
			assemblyPrice = data.pricing.assembly_price;
			parkingBanPrice = data.pricing.parking_ban_price;
			packingPrice = data.pricing.packing_price;
			transporterPrice = data.pricing.transporter_price;
			nextInvoiceNumber = data.next_invoice_number;
			nextOfferNumber = data.next_offer_number;
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Laden der Einstellungen', 'error');
		} finally {
			settingsLoading = false;
		}
	}

	/**
	 * Persists the standard pricing values via PUT /api/v1/admin/settings/pricing.
	 *
	 * Called by: Template (Preise form onsubmit).
	 * Purpose: Lets the admin change pricing without a code redeploy. Euro inputs for the
	 *          labor rate and Saturday surcharge are converted back to cents.
	 */
	async function savePricing(e: Event) {
		e.preventDefault();
		savingPricing = true;
		try {
			await apiPut('/api/v1/admin/settings/pricing', {
				rate_per_person_hour_cents: Math.round(laborRateEur * 100),
				saturday_surcharge_cents: Math.round(saturdaySurchargeEur * 100),
				fahrt_rate_per_km: fahrtRatePerKm,
				assembly_price: assemblyPrice,
				parking_ban_price: parkingBanPrice,
				packing_price: packingPrice,
				transporter_price: transporterPrice
			});
			showToast('Preise gespeichert', 'success');
			await loadSettings();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Speichern', 'error');
		} finally {
			savingPricing = false;
		}
	}

	/**
	 * Sets the next Rechnungsnummer and KVA-Nummer via PUT /api/v1/admin/settings/numbers.
	 *
	 * Called by: Template (Nummernkreise form onsubmit).
	 * Purpose: Lets the admin reset where the invoice/offer sequences continue from.
	 */
	async function saveNumbers(e: Event) {
		e.preventDefault();
		savingNumbers = true;
		try {
			await apiPut('/api/v1/admin/settings/numbers', {
				next_invoice_number: nextInvoiceNumber,
				next_offer_number: nextOfferNumber
			});
			showToast('Nummernkreise gespeichert', 'success');
			await loadSettings();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Speichern', 'error');
		} finally {
			savingNumbers = false;
		}
	}
</script>

<!-- Pricing Card -->
<div class="card">
	<div class="card-header">
		<Euro size={20} />
		<h2>Preise</h2>
	</div>

	{#if settingsLoading}
		<div class="loading">Lade Einstellungen...</div>
	{:else}
		<form class="create-form" onsubmit={savePricing}>
			<div class="form-row">
				<div class="field">
					<label for="labor-rate">Stundensatz pro Helfer (EUR, netto)</label>
					<input id="labor-rate" type="number" step="0.01" min="0" bind:value={laborRateEur} required />
				</div>
				<div class="field">
					<label for="saturday">Samstagszuschlag (EUR)</label>
					<input id="saturday" type="number" step="0.01" min="0" bind:value={saturdaySurchargeEur} required />
				</div>
			</div>
			<div class="form-row">
				<div class="field">
					<label for="fahrt">Fahrkosten pro km (EUR)</label>
					<input id="fahrt" type="number" step="0.01" min="0" bind:value={fahrtRatePerKm} required />
				</div>
				<div class="field">
					<label for="assembly">De-/Montage pro Einheit (EUR)</label>
					<input id="assembly" type="number" step="0.01" min="0" bind:value={assemblyPrice} required />
				</div>
			</div>
			<div class="form-row">
				<div class="field">
					<label for="parking">Halteverbotszone pro Stück (EUR)</label>
					<input id="parking" type="number" step="0.01" min="0" bind:value={parkingBanPrice} required />
				</div>
				<div class="field">
					<label for="packing">Umzugsmaterial (EUR)</label>
					<input id="packing" type="number" step="0.01" min="0" bind:value={packingPrice} required />
				</div>
			</div>
			<div class="form-row">
				<div class="field">
					<label for="transporter">3,5t Transporter (EUR)</label>
					<input id="transporter" type="number" step="0.01" min="0" bind:value={transporterPrice} required />
				</div>
				<div class="field"></div>
			</div>
			<button type="submit" class="btn-create" disabled={savingPricing}>
				{#if savingPricing}
					Wird gespeichert...
				{:else}
					<Euro size={16} />
					Preise speichern
				{/if}
			</button>
		</form>
	{/if}
</div>

<!-- Number Sequences Card -->
<div class="card">
	<div class="card-header">
		<Hash size={20} />
		<h2>Nummernkreise</h2>
	</div>

	{#if settingsLoading}
		<div class="loading">Lade Einstellungen...</div>
	{:else}
		<form class="create-form" onsubmit={saveNumbers}>
			<div class="form-row">
				<div class="field">
					<label for="next-invoice">Nächste Rechnungsnummer</label>
					<input id="next-invoice" type="number" step="1" min="1" bind:value={nextInvoiceNumber} required />
				</div>
				<div class="field">
					<label for="next-offer">Nächste KVA-Nummer</label>
					<input id="next-offer" type="number" step="1" min="1" bind:value={nextOfferNumber} required />
				</div>
			</div>
			<p class="hint">
				Legt fest, mit welcher Nummer die nächste Rechnung bzw. der nächste
				Kostenvoranschlag erzeugt wird. Danach wird automatisch hochgezählt.
			</p>
			<button type="submit" class="btn-create" disabled={savingNumbers}>
				{#if savingNumbers}
					Wird gespeichert...
				{:else}
					<Hash size={16} />
					Nummernkreise speichern
				{/if}
			</button>
		</form>
	{/if}
</div>

<style>
	.card {
		box-shadow: none;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
		color: var(--dt-on-surface);
	}

	.card-header h2 {
		font-size: 1.0625rem;
		font-weight: 600;
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.field input {
		padding: 0.625rem 0.75rem;
		font-size: 0.9375rem;
	}

	.btn-create {
		padding: 0.75rem var(--dt-space-6);
		font-size: 0.9375rem;
		align-self: flex-start;
		justify-content: center;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		line-height: 1.5;
	}

	.loading {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		padding: 1rem 0;
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
