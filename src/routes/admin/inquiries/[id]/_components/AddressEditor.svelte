<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Check from '$lib/components/ui/Check.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
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

<!-- One edit form for Von / Nach / Zwischenstopp; `p` prefixes the element ids. -->
{#snippet addrForm(p: string, f: typeof editStop, onSave: () => void, onCancel: () => void)}
	<div class="grid grid-cols-[minmax(0,1fr)_88px] gap-3">
		<Field label="Straße" for="{p}-street"><Input id="{p}-street" bind:value={f.street} /></Field>
		<Field label="Nr." for="{p}-number"><Input id="{p}-number" bind:value={f.house_number} /></Field>
	</div>
	<div class="mt-3 grid grid-cols-[100px_minmax(0,1fr)] gap-3">
		<Field label="PLZ" for="{p}-plz"><Input id="{p}-plz" bind:value={f.postal_code} class="num" /></Field>
		<Field label="Stadt" for="{p}-city"><Input id="{p}-city" bind:value={f.city} /></Field>
	</div>
	<div class="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
		<Field label="Stockwerk" for="{p}-floor" class="w-40">
			<Select id="{p}-floor" bind:value={f.floor}>
				<option value="-1">Keller</option>
				<option value="0">Erdgeschoss</option>
				<option value="1">1. OG</option>
				<option value="2">2. OG</option>
				<option value="3">3. OG</option>
				<option value="4">4. OG</option>
				<option value="5">5. OG</option>
			</Select>
		</Field>
		<Check bind:checked={f.elevator}>Aufzug</Check>
		<Check bind:checked={f.parking_ban}>Halteverbot</Check>
	</div>
	<div class="mt-4 flex gap-2">
		<Button size="sm" variant="solid" onclick={onSave}><Save size={14} /> Speichern</Button>
		<Button size="sm" onclick={onCancel}>Abbrechen</Button>
	</div>
{/snippet}

{#snippet addrView(a: NonNullable<typeof originAddress>)}
	<p class="text-sm font-medium">
		{a.street}{a.house_number ? ` ${a.house_number}` : ''}, <span class="num">{a.postal_code || ''}</span> {a.city}
	</p>
	<div class="mt-2 flex flex-wrap gap-1.5">
		<Badge>{floorLabel(a.floor)}</Badge>
		{#if a.elevator}<Badge tone="ok">Aufzug</Badge>{/if}
		{#if a.parking_ban}<Badge tone="warn">Halteverbot</Badge>{/if}
	</div>
{/snippet}

{#if originAddress}
	<Panel title="Von">
		{#snippet actions()}
			{#if !editingOrigin}<Button size="sm" variant="ghost" onclick={startEditOrigin}><Pencil size={14} /> Bearbeiten</Button>{/if}
		{/snippet}
		{#if editingOrigin}
			{@render addrForm(
				'origin',
				editOrigin,
				() => saveAddress(originAddress!.id, editOrigin, (v) => (editingOrigin = v)),
				() => (editingOrigin = false)
			)}
		{:else}
			{@render addrView(originAddress)}
		{/if}
	</Panel>
{/if}

{#if destinationAddress}
	<Panel title="Nach">
		{#snippet actions()}
			{#if !editingDest}<Button size="sm" variant="ghost" onclick={startEditDest}><Pencil size={14} /> Bearbeiten</Button>{/if}
		{/snippet}
		{#if editingDest}
			{@render addrForm(
				'dest',
				editDest,
				() => saveAddress(destinationAddress!.id, editDest, (v) => (editingDest = v)),
				() => (editingDest = false)
			)}
		{:else}
			{@render addrView(destinationAddress)}
		{/if}
	</Panel>
{/if}

{#if stopAddress}
	<Panel title="Zwischenstopp">
		{#snippet actions()}
			{#if !editingStop}
				<Button size="sm" variant="ghost" onclick={startEditStop}><Pencil size={14} /> Bearbeiten</Button>
				<Button size="sm" variant="ghost" onclick={removeStop}>Entfernen</Button>
			{/if}
		{/snippet}
		{#if editingStop}
			{@render addrForm(
				'stop',
				editStop,
				() => saveAddress(stopAddress!.id, editStop, (v) => (editingStop = v)),
				() => (editingStop = false)
			)}
		{:else}
			{@render addrView(stopAddress)}
		{/if}
	</Panel>
{:else}
	<Panel title="Zwischenstopp">
		{#snippet actions()}
			{#if !addingStop}<Button size="sm" variant="ghost" onclick={startAddStop}>Hinzufügen</Button>{/if}
		{/snippet}
		{#if addingStop}
			{@render addrForm('stop-new', editStop, saveNewStop, () => (addingStop = false))}
		{:else}
			<p class="text-[13px] text-faint">Kein Zwischenstopp.</p>
		{/if}
	</Panel>
{/if}
