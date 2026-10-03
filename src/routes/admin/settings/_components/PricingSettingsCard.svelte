<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiGet, apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Euro, Hash, ListOrdered } from 'lucide-svelte';
	import { invalidatePositions, type PositionPrice } from '$lib/utils/positionCatalog';

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
		positions: PositionPrice[];
		next_invoice_number: number;
		next_offer_number: number;
	}

	/** One row of the Positionen card: the catalogue entry plus its euro input. */
	interface PositionRow extends PositionPrice {
		priceEur: number;
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

	// Positionen — the fixed KVA line items and their unit prices.
	let positions = $state<PositionRow[]>([]);
	let savingPositions = $state(false);

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
			positions = (data.positions ?? []).map((p) => ({
				...p,
				priceEur: p.unit_price_cents / 100
			}));
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
	 * Persists the position unit prices via PUT /api/v1/admin/settings/positions.
	 *
	 * Called by: Template (Positionen form onsubmit).
	 * Purpose: These prices were hardcoded in the inquiry page, so a change to
	 *          e.g. the Kleiderboxen rate needed a redeploy (feedback report
	 *          ce764f7b). The cached catalogue is dropped afterwards so the next
	 *          KVA picks the new prices up without a reload.
	 */
	async function savePositions(e: Event) {
		e.preventDefault();
		savingPositions = true;
		try {
			await apiPut('/api/v1/admin/settings/positions', {
				positions: positions.map((p) => ({
					key: p.key,
					unit_price_cents: Math.round(p.priceEur * 100)
				}))
			});
			invalidatePositions();
			showToast('Positionspreise gespeichert', 'success');
			await loadSettings();
		} catch (e) {
			showToast((e as Error).message || 'Fehler beim Speichern', 'error');
		} finally {
			savingPositions = false;
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

<Panel title="Preise">
	{#if settingsLoading}
		<div class="h-28 animate-pulse rounded-sm bg-sunk"></div>
	{:else}
		<form class="flex flex-col gap-3" onsubmit={savePricing}>
			<div class="grid gap-3 sm:grid-cols-3">
				<Field label="Stundensatz pro Helfer (€, netto)" for="labor-rate">
					<Input id="labor-rate" class="num" type="number" step="0.01" min="0" bind:value={laborRateEur} required />
				</Field>
				<Field label="Samstagszuschlag (€)" for="saturday">
					<Input id="saturday" class="num" type="number" step="0.01" min="0" bind:value={saturdaySurchargeEur} required />
				</Field>
				<Field label="Fahrkosten pro km (€)" for="fahrt">
					<Input id="fahrt" class="num" type="number" step="0.01" min="0" bind:value={fahrtRatePerKm} required />
				</Field>
			</div>
			<p class="text-xs text-muted">De-/Montage, Halteverbotszone, Umzugsmaterial und Transporter stehen unten bei den Positionen.</p>
			<Button type="submit" variant="solid" class="self-start" disabled={savingPricing}>
				{#if savingPricing}Wird gespeichert …{:else}<Euro size={15} /> Preise speichern{/if}
			</Button>
		</form>
	{/if}
</Panel>

<Panel title="Positionen">
	{#if settingsLoading}
		<div class="h-60 animate-pulse rounded-sm bg-sunk"></div>
	{:else}
		<form class="flex flex-col gap-3" onsubmit={savePositions}>
			<div class="grid gap-x-6 sm:grid-cols-2">
				{#each positions as p, i (p.key)}
					<div class="flex items-center justify-between gap-3 border-b border-line py-2">
						<label for="pos-{p.key}" class="flex min-w-0 flex-col text-sm">
							{p.label}
							{#if p.remark}<span class="text-xs text-faint">{p.remark}</span>{/if}
						</label>
						<span class="flex items-center gap-1.5 text-xs text-faint">
							<input
								id="pos-{p.key}"
								type="number"
								step="0.01"
								min="0"
								class="num h-8 w-24 rounded-sm border border-line-strong bg-panel px-2 text-right text-sm text-fg outline-none focus:border-fg"
								bind:value={positions[i].priceEur}
								required
							/>
							€
						</span>
					</div>
				{/each}
			</div>
			<p class="text-xs text-muted">
				Einzelpreise (netto) der festen Positionen. Sie werden beim Anlegen einer Position im KVA vorgeschlagen und lassen sich
				dort weiterhin einzeln überschreiben. Bereits erstellte Kostenvoranschläge bleiben unverändert.
			</p>
			<Button type="submit" variant="solid" class="self-start" disabled={savingPositions}>
				{#if savingPositions}Wird gespeichert …{:else}<ListOrdered size={15} /> Positionspreise speichern{/if}
			</Button>
		</form>
	{/if}
</Panel>

<Panel title="Nummernkreise">
	{#if settingsLoading}
		<div class="h-28 animate-pulse rounded-sm bg-sunk"></div>
	{:else}
		<form class="flex flex-col gap-3" onsubmit={saveNumbers}>
			<div class="grid gap-3 sm:grid-cols-2">
				<Field label="Nächste Rechnungsnummer" for="next-invoice">
					<Input id="next-invoice" class="num" type="number" step="1" min="1" bind:value={nextInvoiceNumber} required />
				</Field>
				<Field label="Nächste KVA-Nummer" for="next-offer">
					<Input id="next-offer" class="num" type="number" step="1" min="1" bind:value={nextOfferNumber} required />
				</Field>
			</div>
			<p class="text-xs text-muted">
				Legt fest, mit welcher Nummer die nächste Rechnung bzw. der nächste Kostenvoranschlag erzeugt wird. Danach wird
				automatisch hochgezählt.
			</p>
			<Button type="submit" variant="solid" class="self-start" disabled={savingNumbers}>
				{#if savingNumbers}Wird gespeichert …{:else}<Hash size={15} /> Nummernkreise speichern{/if}
			</Button>
		</form>
	{/if}
</Panel>
