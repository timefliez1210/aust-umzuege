<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Check from '$lib/components/ui/Check.svelte';
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

<div class="flex flex-col gap-2">
	<h4 class="text-[13px] font-medium text-muted">{title}</h4>
	<KnownAddressPicker addresses={knownAddresses} onselect={onSelect} />
	<Input placeholder={streetRequired ? 'Straße *' : 'Straße'} bind:value={street} />
	<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
		<Input placeholder="PLZ" bind:value={postal} />
		<Input placeholder={streetRequired ? 'Stadt *' : 'Stadt'} bind:value={city} />
	</div>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
		<Select bind:value={floor} class="w-36" aria-label="Stockwerk">
			<option value="">Stockwerk</option>
			{#each floorOptions as f (f)}<option value={f}>{f}</option>{/each}
		</Select>
		<Check bind:checked={elevator}>Aufzug</Check>
		<Check bind:checked={halteverbot}>Halteverbot</Check>
	</div>
</div>
