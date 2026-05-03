<script lang="ts">
	import { apiPatch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { floorLabel } from '$lib/utils/floor';
	import { Save, Pencil } from 'lucide-svelte';

	/**
	 * Address data shape for display and editing.
	 */
	interface AddressSnapshot {
		id: string;
		street: string;
		house_number: string | null;
		city: string;
		postal_code: string | null;
		floor: string | null;
		elevator: boolean | null;
		parking_ban: boolean | null;
	}

	/**
	 * Props for the AddressEditor component.
	 *
	 * Called by: inquiries/[id]/+page.svelte (inside the detail-grid)
	 * Purpose: Renders the origin and destination address cards with inline edit forms.
	 *          When the user saves an address, calls onSaved so the parent can reload the inquiry.
	 *
	 * @prop originAddress - The current origin address, or null if not yet set
	 * @prop destinationAddress - The current destination address, or null if not yet set
	 * @prop stopAddress - The current stop address, or null if not set
	 * @prop onSaved - Callback called after a successful address PATCH so the parent can reload
	 */
	interface Props {
		originAddress: AddressSnapshot | null;
		destinationAddress: AddressSnapshot | null;
		stopAddress: AddressSnapshot | null;
		inquiryId: string;
		onSaved: () => void;
	}

	let { originAddress, destinationAddress, stopAddress, inquiryId, onSaved }: Props = $props();

	/**
	 * @notice Legacy data may have the house number concatenated into the street
	 *         field (e.g. "Musterstr. 1") with house_number = NULL.
	 *         See: aust-api submissions.rs `split_street_house_number()`.
	 *         When touching the addresses table, consider backfilling.
	 *
	 * @dev Extracts the last whitespace-separated token from `street` if it starts
	 *      with a digit. Returns [streetWithoutNumber, houseNumber] or the original
	 *      street unchanged if no number pattern is detected.
	 */
	function splitStreetNumber(street: string): [string, string] {
		const m = street.match(/^(.*)\s+(\d\S*)$/);
		if (m) return [m[1], m[2]];
		return [street, ''];
	}

	// ─── Origin address edit state ────────────────────────────────────────────

	let editingOrigin = $state(false);
	let editOrigin = $state({
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		floor: '0',
		elevator: false,
		parking_ban: false,
	});

	// ─── Destination address edit state ──────────────────────────────────────

	let editingDest = $state(false);
	let editDest = $state({
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		floor: '0',
		elevator: false,
		parking_ban: false,
	});

	// ─── Stop address edit state ────────────────────────────────────────────
	// addingStop = true when user is creating a stop on an inquiry that has none.

	let editingStop = $state(false);
	let addingStop = $state(false);
	let editStop = $state({
		street: '',
		house_number: '',
		postal_code: '',
		city: '',
		floor: '0',
		elevator: false,
		parking_ban: false,
	});

	function startEditOrigin() {
		if (!originAddress) return;
		const a = originAddress;
		// @notice Legacy: house_number may be NULL with the number baked into street.
		//        Extract it so the edit form shows it in the correct field.
		const [cleanStreet, extractedHn] = a.house_number
			? [a.street, a.house_number]
			: splitStreetNumber(a.street);
		editOrigin = {
			street: cleanStreet,
			house_number: extractedHn,
			postal_code: a.postal_code || '',
			city: a.city,
			floor: a.floor || '0',
			elevator: a.elevator ?? false,
			parking_ban: a.parking_ban ?? false,
		};
		editingOrigin = true;
	}

	function startEditDest() {
		if (!destinationAddress) return;
		const a = destinationAddress;
		// @notice Legacy: house_number may be NULL with the number baked into street.
		const [cleanStreet, extractedHn] = a.house_number
			? [a.street, a.house_number]
			: splitStreetNumber(a.street);
		editDest = {
			street: cleanStreet,
			house_number: extractedHn,
			postal_code: a.postal_code || '',
			city: a.city,
			floor: a.floor || '0',
			elevator: a.elevator ?? false,
			parking_ban: a.parking_ban ?? false,
		};
		editingDest = true;
	}

	function startEditStop() {
		if (!stopAddress) return;
		const a = stopAddress;
		// @notice Legacy: house_number may be NULL with the number baked into street.
		const [cleanStreet, extractedHn] = a.house_number
			? [a.street, a.house_number]
			: splitStreetNumber(a.street);
		editStop = {
			street: cleanStreet,
			house_number: extractedHn,
			postal_code: a.postal_code || '',
			city: a.city,
			floor: a.floor || '0',
			elevator: a.elevator ?? false,
			parking_ban: a.parking_ban ?? false,
		};
		editingStop = true;
	}

	function startAddStop() {
		editStop = {
			street: '',
			house_number: '',
			postal_code: '',
			city: '',
			floor: '0',
			elevator: false,
			parking_ban: false,
		};
		addingStop = true;
	}

	async function saveNewStop() {
		try {
			await apiPatch(`/api/v1/inquiries/${inquiryId}`, {
				stop_address: editStop,
			});
			showToast('Zwischenstopp hinzugefügt', 'success');
			addingStop = false;
			onSaved();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function removeStop() {
		if (!confirm('Zwischenstopp entfernen?')) return;
		try {
			await apiPatch(`/api/v1/inquiries/${inquiryId}`, {
				clear_stop_address: true,
			});
			showToast('Zwischenstopp entfernt', 'success');
			onSaved();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function saveAddress(
		addressId: string,
		fields: { street: string; house_number: string; postal_code: string; city: string; floor: string; elevator: boolean; parking_ban: boolean },
		setEditing: (v: boolean) => void,
	) {
		try {
			await apiPatch(`/api/v1/admin/addresses/${addressId}`, fields);
			showToast('Adresse gespeichert', 'success');
			setEditing(false);
			onSaved();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}
</script>

{#if originAddress}
	<div class="card">
		<div class="card-header">
			<h3>Von</h3>
			{#if !editingOrigin}
				<button class="btn btn-sm" onclick={startEditOrigin}>
					<Pencil size={14} />
					Bearbeiten
				</button>
			{/if}
		</div>
		{#if editingOrigin}
			<div class="form-grid">
				<div class="field">
					<label for="origin-street">Strasse</label>
					<input id="origin-street" type="text" bind:value={editOrigin.street} />
				</div>
				<div class="field field--shrink">
					<label for="origin-number">Nr.</label>
					<input id="origin-number" type="text" bind:value={editOrigin.house_number} />
				</div>
				<div class="field">
					<label for="origin-plz">PLZ</label>
					<input id="origin-plz" type="text" bind:value={editOrigin.postal_code} />
				</div>
				<div class="field">
					<label for="origin-city">Stadt</label>
					<input id="origin-city" type="text" bind:value={editOrigin.city} />
				</div>
				<div class="field">
					<label for="origin-floor">Stockwerk</label>
					<select id="origin-floor" bind:value={editOrigin.floor}>
						<option value="-1">Keller</option>
						<option value="0">Erdgeschoss</option>
						<option value="1">1. OG</option>
						<option value="2">2. OG</option>
						<option value="3">3. OG</option>
						<option value="4">4. OG</option>
						<option value="5">5. OG</option>
					</select>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editOrigin.elevator} />
						Aufzug
					</label>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editOrigin.parking_ban} />
						Halteverbot
					</label>
				</div>
				<div class="field full-width addr-actions">
					<button class="btn btn-sm btn-save" onclick={() => saveAddress(originAddress!.id, editOrigin, (v) => (editingOrigin = v))}>
						<Save size={14} />
						Speichern
					</button>
					<button class="btn btn-sm" onclick={() => (editingOrigin = false)}>Abbrechen</button>
				</div>
			</div>
		{:else}
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Adresse</span>
					<span class="info-value">
						{originAddress.street}{originAddress.house_number ? ` ${originAddress.house_number}` : ''}, {originAddress.postal_code || ''} {originAddress.city}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Stockwerk</span>
					<span class="info-value">
						{floorLabel(originAddress.floor)}
						{#if originAddress.elevator}(Aufzug){/if}
					</span>
				</div>
				{#if originAddress.parking_ban}
					<div class="info-item">
						<span class="info-label">Halteverbot</span>
						<span class="info-value">Ja</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if destinationAddress}
	<div class="card">
		<div class="card-header">
			<h3>Nach</h3>
			{#if !editingDest}
				<button class="btn btn-sm" onclick={startEditDest}>
					<Pencil size={14} />
					Bearbeiten
				</button>
			{/if}
		</div>
		{#if editingDest}
			<div class="form-grid">
				<div class="field">
					<label for="dest-street">Strasse</label>
					<input id="dest-street" type="text" bind:value={editDest.street} />
				</div>
				<div class="field field--shrink">
					<label for="dest-number">Nr.</label>
					<input id="dest-number" type="text" bind:value={editDest.house_number} />
				</div>
				<div class="field">
					<label for="dest-plz">PLZ</label>
					<input id="dest-plz" type="text" bind:value={editDest.postal_code} />
				</div>
				<div class="field">
					<label for="dest-city">Stadt</label>
					<input id="dest-city" type="text" bind:value={editDest.city} />
				</div>
				<div class="field">
					<label for="dest-floor">Stockwerk</label>
					<select id="dest-floor" bind:value={editDest.floor}>
						<option value="-1">Keller</option>
						<option value="0">Erdgeschoss</option>
						<option value="1">1. OG</option>
						<option value="2">2. OG</option>
						<option value="3">3. OG</option>
						<option value="4">4. OG</option>
						<option value="5">5. OG</option>
					</select>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editDest.elevator} />
						Aufzug
					</label>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editDest.parking_ban} />
						Halteverbot
					</label>
				</div>
				<div class="field full-width addr-actions">
					<button class="btn btn-sm btn-save" onclick={() => saveAddress(destinationAddress!.id, editDest, (v) => (editingDest = v))}>
						<Save size={14} />
						Speichern
					</button>
					<button class="btn btn-sm" onclick={() => (editingDest = false)}>Abbrechen</button>
				</div>
			</div>
		{:else}
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Adresse</span>
					<span class="info-value">
						{destinationAddress.street}{destinationAddress.house_number ? ` ${destinationAddress.house_number}` : ''}, {destinationAddress.postal_code || ''} {destinationAddress.city}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Stockwerk</span>
					<span class="info-value">
						{floorLabel(destinationAddress.floor)}
						{#if destinationAddress.elevator}(Aufzug){/if}
					</span>
				</div>
				{#if destinationAddress.parking_ban}
					<div class="info-item">
						<span class="info-label">Halteverbot</span>
						<span class="info-value">Ja</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

{#if stopAddress}
	<div class="card">
		<div class="card-header">
			<h3>Zwischenstopp</h3>
			{#if !editingStop}
				<div class="addr-actions">
					<button class="btn btn-sm" onclick={startEditStop}>
						<Pencil size={14} />
						Bearbeiten
					</button>
					<button class="btn btn-sm" onclick={removeStop}>
						Entfernen
					</button>
				</div>
			{/if}
		</div>
		{#if editingStop}
			<div class="form-grid">
				<div class="field">
					<label for="stop-street">Strasse</label>
					<input id="stop-street" type="text" bind:value={editStop.street} />
				</div>
				<div class="field field--shrink">
					<label for="stop-number">Nr.</label>
					<input id="stop-number" type="text" bind:value={editStop.house_number} />
				</div>
				<div class="field">
					<label for="stop-plz">PLZ</label>
					<input id="stop-plz" type="text" bind:value={editStop.postal_code} />
				</div>
				<div class="field">
					<label for="stop-city">Stadt</label>
					<input id="stop-city" type="text" bind:value={editStop.city} />
				</div>
				<div class="field">
					<label for="stop-floor">Stockwerk</label>
					<select id="stop-floor" bind:value={editStop.floor}>
						<option value="-1">Keller</option>
						<option value="0">Erdgeschoss</option>
						<option value="1">1. OG</option>
						<option value="2">2. OG</option>
						<option value="3">3. OG</option>
						<option value="4">4. OG</option>
						<option value="5">5. OG</option>
					</select>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editStop.elevator} />
						Aufzug
					</label>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editStop.parking_ban} />
						Halteverbot
					</label>
				</div>
				<div class="field full-width addr-actions">
					<button class="btn btn-sm btn-save" onclick={() => saveAddress(stopAddress!.id, editStop, (v) => (editingStop = v))}>
						<Save size={14} />
						Speichern
					</button>
					<button class="btn btn-sm" onclick={() => (editingStop = false)}>Abbrechen</button>
				</div>
			</div>
		{:else}
			<div class="info-grid">
				<div class="info-item">
					<span class="info-label">Adresse</span>
					<span class="info-value">
						{stopAddress.street}{stopAddress.house_number ? ` ${stopAddress.house_number}` : ''}, {stopAddress.postal_code || ''} {stopAddress.city}
					</span>
				</div>
				<div class="info-item">
					<span class="info-label">Stockwerk</span>
					<span class="info-value">
						{floorLabel(stopAddress.floor)}
						{#if stopAddress.elevator}(Aufzug){/if}
					</span>
				</div>
				{#if stopAddress.parking_ban}
					<div class="info-item">
						<span class="info-label">Halteverbot</span>
						<span class="info-value">Ja</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<div class="card">
		<div class="card-header">
			<h3>Zwischenstopp</h3>
			{#if !addingStop}
				<button class="btn btn-sm" onclick={startAddStop}>
					Hinzufügen
				</button>
			{/if}
		</div>
		{#if addingStop}
			<div class="form-grid">
				<div class="field">
					<label for="stop-new-street">Strasse</label>
					<input id="stop-new-street" type="text" bind:value={editStop.street} />
				</div>
				<div class="field field--shrink">
					<label for="stop-new-number">Nr.</label>
					<input id="stop-new-number" type="text" bind:value={editStop.house_number} />
				</div>
				<div class="field">
					<label for="stop-new-plz">PLZ</label>
					<input id="stop-new-plz" type="text" bind:value={editStop.postal_code} />
				</div>
				<div class="field">
					<label for="stop-new-city">Stadt</label>
					<input id="stop-new-city" type="text" bind:value={editStop.city} />
				</div>
				<div class="field">
					<label for="stop-new-floor">Stockwerk</label>
					<select id="stop-new-floor" bind:value={editStop.floor}>
						<option value="-1">Keller</option>
						<option value="0">Erdgeschoss</option>
						<option value="1">1. OG</option>
						<option value="2">2. OG</option>
						<option value="3">3. OG</option>
						<option value="4">4. OG</option>
						<option value="5">5. OG</option>
					</select>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editStop.elevator} />
						Aufzug
					</label>
				</div>
				<div class="field">
					<label class="checkbox-label">
						<input type="checkbox" bind:checked={editStop.parking_ban} />
						Halteverbot
					</label>
				</div>
				<div class="field full-width addr-actions">
					<button class="btn btn-sm btn-save" onclick={saveNewStop}>
						<Save size={14} />
						Speichern
					</button>
					<button class="btn btn-sm" onclick={() => (addingStop = false)}>Abbrechen</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.addr-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.btn-save {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.field--shrink {
		flex: 0 0 80px;
	}
</style>