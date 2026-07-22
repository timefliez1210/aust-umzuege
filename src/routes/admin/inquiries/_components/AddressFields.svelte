<script lang="ts">
	import KnownAddressPicker from '$lib/components/admin/KnownAddressPicker.svelte';
	import type { KnownAddress } from '$lib/utils/addressBook';

	/**
	 * One origin/destination address column (street, PLZ/city, floor, Aufzug, Halteverbot)
	 * used twice by CreateInquiryModal for the "Adressen" section.
	 *
	 * Called by: CreateInquiryModal.svelte
	 * Purpose: Mechanical extraction — the origin and destination columns were identical
	 *          markup with different bound variables and labels; this de-duplicates them.
	 *          All field values are `$bindable` so the parent's existing $state variables
	 *          (originStreet, destStreet, ...) keep working unchanged.
	 *
	 * @prop title - Section heading ("Auszugsadresse" / "Zielort" etc., from addrCfg)
	 * @prop streetRequired - Whether to show the "*" required marker on street/city (destination can be optional)
	 * @prop street, city, postal, floor - Bindable text field values
	 * @prop elevator, halteverbot - Bindable checkbox values
	 * @prop floorOptions - Shared list of floor select options
	 * @prop knownAddresses - The selected customer's address book, for the autocomplete picker
	 * @prop onSelect - Called with the picked KnownAddress; parent pre-fills all fields from it
	 */
	interface Props {
		title: string;
		streetRequired: boolean;
		street: string;
		city: string;
		postal: string;
		floor: string;
		elevator: boolean;
		halteverbot: boolean;
		floorOptions: string[];
		knownAddresses: KnownAddress[];
		onSelect: (a: KnownAddress) => void;
	}

	let {
		title,
		streetRequired,
		street = $bindable(),
		city = $bindable(),
		postal = $bindable(),
		floor = $bindable(),
		elevator = $bindable(),
		halteverbot = $bindable(),
		floorOptions,
		knownAddresses,
		onSelect,
	}: Props = $props();
</script>

<div class="address-col">
	<h4>{title}</h4>
	<KnownAddressPicker addresses={knownAddresses} onselect={onSelect} />
	<input type="text" placeholder={streetRequired ? 'Straße *' : 'Straße'} bind:value={street} class="form-input" />
	<div class="address-row">
		<input type="text" placeholder="PLZ" bind:value={postal} class="form-input form-input--short" />
		<input type="text" placeholder={streetRequired ? 'Stadt *' : 'Stadt'} bind:value={city} class="form-input" />
	</div>
	<div class="address-row">
		<select bind:value={floor} class="form-select">
			<option value="">Stockwerk</option>
			{#each floorOptions as f}<option value={f}>{f}</option>{/each}
		</select>
		<label class="form-checkbox">
			<input type="checkbox" bind:checked={elevator} />
			Aufzug
		</label>
		<label class="form-checkbox">
			<input type="checkbox" bind:checked={halteverbot} />
			Halteverbot
		</label>
	</div>
</div>

<style>
	.address-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.address-col h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin: 0 0 0.5rem;
	}

	.address-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.form-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		border: none;
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		box-sizing: border-box;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
		border-bottom: 2px solid transparent;
	}

	.form-input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.form-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.form-input--short {
		max-width: 100px;
	}

	.form-select {
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		border: none;
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.form-select:focus {
		background: var(--dt-surface-container-lowest);
		outline: 2px solid var(--dt-primary);
	}

	.form-checkbox {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		white-space: nowrap;
	}

	.form-checkbox input[type='checkbox'] {
		accent-color: var(--dt-primary);
	}
</style>
