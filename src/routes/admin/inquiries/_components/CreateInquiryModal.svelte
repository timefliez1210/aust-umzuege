<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiFetch } from '$lib/utils/api.svelte';
	import VolumeCalculator from '$lib/components/VolumeCalculator.svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { X, Camera, List, Video } from 'lucide-svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Section from '$lib/components/ui/Section.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Check from '$lib/components/ui/Check.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { SERVICE_TYPE_LABELS, SERVICE_ADDRESS_CONFIG } from '$lib/utils/constants';
	import { fetchKnownAddresses, knownAddressStreetLine, type KnownAddress } from '$lib/utils/addressBook';
	import AddressFields from './AddressFields.svelte';
	import NewCustomerFields from './NewCustomerFields.svelte';

	/**
	 * Props for the create-inquiry modal/form.
	 *
	 * Called by: inquiries/+page.svelte (mounted conditionally when showCreateForm is true)
	 * Purpose: Encapsulates all create-inquiry form state, customer search, address entry,
	 *          volume mode selection, services checkboxes, and the submit logic.
	 *
	 * @prop open - Whether the form is currently visible (bindable)
	 * @prop onCreated - Callback called with the new inquiry UUID after creation
	 */
	interface Props {
		open: boolean;
		onCreated: (id: string) => void;
	}

	let { open = $bindable(), onCreated }: Props = $props();

	interface CustomerMatch {
		id: string;
		email: string | null;
		name: string | null;
		phone: string | null;
	}

	// ─── Create form state ─────────────────────────────────────────────────────

	let createError = $state('');
	let createLoading = $state(false);

	// Records already created by an earlier, partly failed attempt. A retry reuses
	// them instead of creating a second customer / inquiry (report 84713361: a
	// failed photo upload after the inquiry existed made "Erneut" create a duplicate).
	let createdCustomerId: string | null = null;
	let createdRecipientId: string | null = null;
	let createdInquiryId = $state<string | null>(null);

	// Customer selection
	let customerMode = $state<'existing' | 'new'>('existing');
	let customerSearch = $state('');
	let customerResults = $state<CustomerMatch[]>([]);
	let selectedCustomer = $state<CustomerMatch | null>(null);
	let customerSearchLoading = $state(false);
	let showCustomerDropdown = $state(false);

	// New customer fields
	let newCustomerEmail = $state('');
	let newCustomerName = $state('');
	let newCustomerPhone = $state('');
	let newCustomerSalutation = $state('');

	// Known addresses (address book of the selected existing customer)
	let knownAddresses = $state<KnownAddress[]>([]);

	// Addresses
	let originStreet = $state('');
	let originCity = $state('');
	let originPostal = $state('');
	let originFloor = $state('');
	let originElevator = $state(false);
	let originHalteverbot = $state(false);

	let destStreet = $state('');
	let destCity = $state('');
	let destPostal = $state('');
	let destFloor = $state('');
	let destElevator = $state(false);
	let destHalteverbot = $state(false);

	// Volume mode: 'manual' (VolumeCalculator), 'photos' (image upload), or 'video' (video upload)
	let volumeMode = $state<'manual' | 'photos' | 'video'>('manual');

	// VolumeCalculator
	let volumeM3 = $state(0);
	let itemSummary = $state('');

	// Photo upload
	let photoFiles = $state<File[]>([]);

	// Video upload
	let videoFiles = $state<File[]>([]);

	// Services
	let svcEinpacken = $state(false);
	let svcMontage = $state(false);
	let svcDemontage = $state(false);
	let svcEinlagerung = $state(false);
	let svcEntsorgung = $state(false);
	let svcTransporter = $state(true);

	// Details
	let preferredDate = $state('');
	let distanceKm = $state('');
	let extraNotes = $state('');


	const SERVICE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS) as [string, string][];

	// Service type
	let selectedServiceType = $state<string>('privatumzug');

	// Customer type
	let customerType = $state<'private' | 'business'>('private');
	let newCustomerCompanyName = $state('');

	// Booking for self vs. someone else (private only)
	let bookingForSelf = $state(true);

	// Recipient fields (when booking for someone else)
	let recipientSalutation = $state('');
	let recipientFirstName = $state('');
	let recipientLastName = $state('');
	let recipientPhone = $state('');
	let recipientEmail = $state('');

	// Billing address (when not auto-derived)
	let billingStreet = $state('');
	let billingNumber = $state('');
	let billingPostal = $state('');
	let billingCity = $state('');
	let showBilling = $state(false);


	// Derived address config for current service type
	let addrCfg = $derived(SERVICE_ADDRESS_CONFIG[selectedServiceType] ?? SERVICE_ADDRESS_CONFIG['privatumzug']);

	// Billing address visibility: show if service wants it, OR if business/recipient
	let showBillingSection = $derived(addrCfg.showBilling || customerType === 'business' || !bookingForSelf);

	const floorOptions = ['EG', '1. OG', '2. OG', '3. OG', '4. OG', '5. OG', 'DG', 'UG'];

	// Load the selected customer's known addresses so they can be picked to
	// pre-fill the origin/destination fields. Cleared when no customer is chosen.
	$effect(() => {
		const id = selectedCustomer?.id;
		if (id) {
			fetchKnownAddresses(id).then((list) => { knownAddresses = list; });
		} else {
			knownAddresses = [];
		}
	});

	/** Pre-fill the origin fields from a picked known address. */
	function applyToOrigin(a: KnownAddress) {
		originStreet = knownAddressStreetLine(a);
		originCity = a.city;
		originPostal = a.postal_code ?? '';
		if (a.floor && floorOptions.includes(a.floor)) originFloor = a.floor;
		originElevator = a.elevator ?? false;
		originHalteverbot = a.parking_ban;
	}

	/** Pre-fill the destination fields from a picked known address. */
	function applyToDestination(a: KnownAddress) {
		destStreet = knownAddressStreetLine(a);
		destCity = a.city;
		destPostal = a.postal_code ?? '';
		if (a.floor && floorOptions.includes(a.floor)) destFloor = a.floor;
		destElevator = a.elevator ?? false;
		destHalteverbot = a.parking_ban;
	}

	let customerSearchTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Queries the customers API with the current search string and populates the autocomplete dropdown.
	 *
	 * Called by: handleCustomerSearchInput (debounced, 250 ms after keystroke)
	 * Purpose: Allows finding an existing customer by name or email when creating a new inquiry manually.
	 *          Calls GET /api/v1/admin/customers?search=...&limit=8.
	 *          Skips the API call if the query is shorter than 2 characters.
	 *
	 * @returns void (side-effect: sets customerResults, showCustomerDropdown, customerSearchLoading)
	 */
	async function searchCustomers() {
		const q = customerSearch.trim();
		if (q.length < 2) {
			customerResults = [];
			showCustomerDropdown = false;
			return;
		}
		customerSearchLoading = true;
		try {
			const res = await apiGet<{ customers: CustomerMatch[]; total: number }>(
				`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`
			);
			customerResults = res.customers;
			showCustomerDropdown = true;
		} catch {
			customerResults = [];
		} finally {
			customerSearchLoading = false;
		}
	}

	/**
	 * Debounces keystrokes in the customer search field and schedules a searchCustomers call.
	 *
	 * Called by: Template (oninput on the customer search text input)
	 * Purpose: Prevents a new API request on every keypress by waiting 250 ms since the last keystroke.
	 *
	 * @returns void
	 */
	function handleCustomerSearchInput() {
		if (customerSearchTimer) clearTimeout(customerSearchTimer);
		customerSearchTimer = setTimeout(searchCustomers, 250);
	}

	/**
	 * Confirms the user's customer selection from the autocomplete dropdown and closes it.
	 *
	 * Called by: Template (onmousedown on each customer-dropdown item)
	 * Purpose: Stores the chosen customer so the create inquiry API call can reference their ID.
	 *
	 * @param c - The CustomerMatch object the user clicked
	 * @returns void
	 */
	function selectCustomer(c: CustomerMatch) {
		selectedCustomer = c;
		customerSearch = c.name || c.email || 'Kunde';
		showCustomerDropdown = false;
	}

	/**
	 * Resets all customer-selection and new-customer form state back to empty.
	 *
	 * Called by: Template (onclick on the clear button next to a selected customer, and on mode toggle)
	 * Purpose: Allows the user to pick a different customer or switch between existing/new mode cleanly.
	 *
	 * @returns void
	 */
	function clearCustomer() {
		selectedCustomer = null;
		customerSearch = '';
		customerResults = [];
		newCustomerEmail = '';
		newCustomerName = '';
		newCustomerPhone = '';
		newCustomerSalutation = '';
		newCustomerCompanyName = '';
		customerType = 'private';
		bookingForSelf = true;
		recipientSalutation = '';
		recipientFirstName = '';
		recipientLastName = '';
		recipientPhone = '';
		recipientEmail = '';
		billingStreet = '';
		billingNumber = '';
		billingPostal = '';
		billingCity = '';
		showBilling = false;
	}

	/**
	 * Compiles all selected service flags and free-text extras into a single comma-separated notes string.
	 *
	 * Called by: handleCreateInquiry (to assemble the notes field of the POST /api/v1/inquiries body)
	 * Purpose: Converts the checkbox-driven service selection into the plain-text notes format
	 *          that the API and pricing engine expect for downstream line-item auto-generation.
	 *
	 * @returns A comma-separated string of active services and extra notes, or '' if nothing is selected.
	 */
	function buildNotes(): string {
		const parts: string[] = [];
		if (originFloor) parts.push(`Auszug: ${originFloor}`);
		if (destFloor) parts.push(`Einzug: ${destFloor}`);
		if (originHalteverbot) parts.push('Halteverbot Auszug');
		if (destHalteverbot) parts.push('Halteverbot Einzug');
		if (svcEinpacken) parts.push('Verpackungsservice');
		if (svcMontage) parts.push('Montage');
		if (svcDemontage) parts.push('Demontage');
		if (svcEinlagerung) parts.push('Einlagerung');
		if (svcEntsorgung) parts.push('Entsorgung');
		if (svcTransporter) parts.push('3,5t Transporter m. Koffer');
		if (extraNotes.trim()) parts.push(extraNotes.trim());
		return parts.join(', ');
	}

	/**
	 * Validates the create-inquiry form, creates the inquiry via the API, and optionally uploads media.
	 *
	 * Called by: Template (onclick on the "Anfrage erstellen" submit button)
	 * Purpose: Orchestrates the full inquiry-creation workflow:
	 *          1. Validates required fields (customer, addresses, media in photo/video mode).
	 *          2. Optionally creates a new customer first via POST /api/v1/admin/customers.
	 *          3. Creates the inquiry via POST /api/v1/inquiries.
	 *          4. If volumeMode is 'photos', uploads images via POST /api/v1/inquiries/{id}/estimate/depth.
	 *          5. If volumeMode is 'video', uploads videos via POST /api/v1/inquiries/{id}/estimate/video.
	 *          6. Calls onCreated(id) so the parent can navigate to the new inquiry's detail page.
	 *
	 * @returns void (side-effect: calls onCreated on success, sets createError on failure)
	 */
	async function handleCreateInquiry() {
		if (customerMode === 'existing' && !selectedCustomer) {
			createError = 'Bitte Kunde auswählen';
			return;
		}
		if (customerMode === 'new' && !newCustomerEmail.trim() && !newCustomerName.trim() && !newCustomerPhone.trim()) {
			createError = 'Bitte mindestens Name, E-Mail oder Telefon angeben';
			return;
		}
		if (addrCfg.showOrigin && (!originStreet.trim() || !originCity.trim())) {
			createError = `${addrCfg.originLabel} (Straße, Stadt) ist erforderlich`;
			return;
		}
		if (addrCfg.showDestination && !addrCfg.optionalDestination && (!destStreet.trim() || !destCity.trim())) {
			createError = `${addrCfg.destinationLabel} (Straße, Stadt) ist erforderlich`;
			return;
		}
		if (volumeMode === 'photos' && photoFiles.length === 0) {
			createError = 'Bitte mindestens ein Foto hinzufügen';
			return;
		}

		createError = '';
		createLoading = true;

		try {
			// If creating a new customer, do that first
			let customerId: string;
			if (customerMode === 'new' && createdCustomerId) {
				customerId = createdCustomerId;
			} else if (customerMode === 'new') {
				const newCustomer = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: newCustomerEmail.trim() || null,
					name: newCustomerName.trim() || null,
					phone: newCustomerPhone.trim() || null,
					salutation: newCustomerSalutation || null,
					customer_type: customerType || null,
					company_name: customerType === 'business' ? newCustomerCompanyName.trim() || null : null,
				});
				customerId = newCustomer.id;
				createdCustomerId = newCustomer.id;
			} else {
				customerId = selectedCustomer!.id;
			}

			const body: Record<string, unknown> = {
				customer_id: customerId,
				service_type: selectedServiceType,
				submission_mode: volumeMode === 'photos' ? 'foto' : volumeMode === 'video' ? 'video' : 'manuell',
				...(addrCfg.showOrigin ? {
					origin: {
						street: originStreet.trim(),
						city: originCity.trim(),
						postal_code: originPostal.trim() || null,
						floor: originFloor || null,
						elevator: originElevator || null,
						parking_ban: originHalteverbot || null,
					},
				} : {}),
				// Include destination when the service requires it, or when it's optional
				// (Umzugshelfer) but the user actually filled it in.
				...(addrCfg.showDestination && (!addrCfg.optionalDestination || destStreet.trim() || destCity.trim()) ? {
					destination: {
						street: destStreet.trim(),
						city: destCity.trim(),
						postal_code: destPostal.trim() || null,
						floor: destFloor || null,
						elevator: destElevator || null,
						parking_ban: destHalteverbot || null,
					},
				} : {}),
				notes: buildNotes() || null,
			};

			if (preferredDate) body.scheduled_date = preferredDate;
			if (customerType === 'business' && newCustomerCompanyName.trim()) {
				body.company_name = newCustomerCompanyName.trim();
			}
			if (!bookingForSelf && recipientLastName.trim() && createdRecipientId) {
				body.recipient_id = createdRecipientId;
			} else if (!bookingForSelf && recipientLastName.trim()) {
				// Create a recipient customer record, then set recipient_id
				const recipientRes = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: recipientEmail.trim() || `recipient-${Date.now()}@aufraeumhelden.com`,
					first_name: recipientFirstName.trim() || null,
					last_name: recipientLastName.trim(),
					phone: recipientPhone.trim() || null,
					salutation: recipientSalutation || null,
				});
				body.recipient_id = recipientRes.id;
				createdRecipientId = recipientRes.id;
			}
			if ((showBilling || customerType === 'business') && billingStreet.trim() && billingCity.trim()) {
				body.billing_address = {
					street: billingStreet.trim(),
					house_number: billingNumber.trim() || null,
					postal_code: billingPostal.trim() || null,
					city: billingCity.trim(),
				};
			}
			if (distanceKm) body.distance_km = parseFloat(distanceKm);

			// Only include manual volume data in manual mode
			if (volumeMode === 'manual') {
				if (volumeM3 > 0) body.estimated_volume_m3 = volumeM3;
				if (itemSummary.trim()) body.items_list = itemSummary.trim();
			}

			// 1. Create the inquiry (once — a retry after a failed upload only re-uploads)
			if (!createdInquiryId) {
				createdInquiryId = (await apiPost<{ id: string }>('/api/v1/inquiries', body)).id;
			}
			const res = { id: createdInquiryId };

			// 2. If photos mode, upload images to depth estimation endpoint
			if (volumeMode === 'photos' && photoFiles.length > 0) {
				createError = '';
				const formData = new FormData();
				for (const file of photoFiles) {
					formData.append('images', file);
				}
				// This runs the vision pipeline, stores estimation, updates inquiry, and triggers auto offer generation
				await apiFetch(`/api/v1/inquiries/${res.id}/estimate/depth`, { method: 'POST', body: formData });
			}

			// 3. If video mode, upload videos to video endpoint
			if (volumeMode === 'video' && videoFiles.length > 0) {
				createError = '';
				const formData = new FormData();
				for (const file of videoFiles) {
					formData.append('video', file);
				}
				await apiFetch(`/api/v1/inquiries/${res.id}/estimate/video`, { method: 'POST', body: formData });
			}

			open = false;
			onCreated(res.id);
		} catch (e: unknown) {
			const msg = (e instanceof Error ? e.message : null) || 'Fehler beim Erstellen';
			createError = createdInquiryId
				? `Anfrage wurde angelegt, aber der Upload ist fehlgeschlagen: ${msg} Erneut klicken lädt nur die Dateien hoch.`
				: msg;
		} finally {
			createLoading = false;
		}
	}

	/** True once anything was typed or picked — closing would then lose it. */
	function hasInput(): boolean {
		return (
			!!selectedCustomer ||
			[newCustomerEmail, newCustomerName, newCustomerPhone, originStreet, originCity, destStreet, destCity, itemSummary, extraNotes, preferredDate]
				.some((v) => v.trim() !== '') ||
			photoFiles.length > 0 ||
			videoFiles.length > 0
		);
	}

	/**
	 * Closes the modal without saving.
	 *
	 * Called by: Template (backdrop click, header close button)
	 * Purpose: Lets the admin dismiss the create-inquiry sheet the same way any
	 *          other admin modal closes, now that this is a real overlay instead
	 *          of an inline page panel.
	 */
	function handleClose() {
		if (createLoading) return;
		// The modal is unmounted on close, so a stray tap on the backdrop (or Esc)
		// used to throw away a half-filled inquiry without a word.
		if (createdInquiryId) {
			// Already created — don't strand it; open it instead.
			open = false;
			onCreated(createdInquiryId);
			return;
		}
		if (hasInput() && !confirm('Eingaben verwerfen? Die Anfrage wurde noch nicht angelegt.')) return;
		open = false;
	}
</script>

<Modal title="Neue Anfrage" onclose={handleClose} size="lg">
	<Section title="Auftragsart">
		<div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
			{#each SERVICE_OPTIONS as [id, label] (id)}
				<button
					type="button"
					aria-pressed={selectedServiceType === id}
					class="h-9 rounded-sm border px-2 text-[13px] transition-colors {selectedServiceType === id
						? 'border-fg bg-fg text-bg'
						: 'border-line bg-panel text-muted hover:border-line-strong hover:text-fg'}"
					onclick={() => {
						selectedServiceType = id;
					}}>{label}</button
				>
			{/each}
		</div>
	</Section>

	<Section title="Kunde">
		<Segmented
			label="Kunde"
			options={[
				{ value: 'existing', label: 'Bestehend' },
				{ value: 'new', label: 'Neu anlegen' }
			]}
			bind:value={customerMode}
			onchange={clearCustomer}
			class="self-start"
		/>

		{#if customerMode === 'existing'}
			{#if selectedCustomer}
				<div class="flex items-center gap-3 rounded-sm border border-line-strong bg-sunk px-3 py-2">
					<span class="flex min-w-0 flex-1 flex-col">
						<span class="truncate text-sm font-medium">{selectedCustomer.name || selectedCustomer.email || 'Kunde'}</span>
						{#if selectedCustomer.name && selectedCustomer.email}
							<span class="truncate text-xs text-muted">{selectedCustomer.email}</span>
						{/if}
					</span>
					<Button variant="ghost" size="icon-sm" aria-label="Kunde entfernen" onclick={clearCustomer}><X size={14} /></Button>
				</div>
			{:else}
				<div class="relative">
					<Input
						placeholder="Kunde suchen (Name oder E-Mail)..."
						bind:value={customerSearch}
						oninput={handleCustomerSearchInput}
						onfocus={() => {
							if (customerResults.length) showCustomerDropdown = true;
						}}
						onblur={() => {
							setTimeout(() => {
								showCustomerDropdown = false;
							}, 200);
						}}
					/>
					{#if showCustomerDropdown && customerResults.length > 0}
						<div
							class="absolute inset-x-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-md border border-line bg-panel p-1 shadow-xl"
						>
							{#each customerResults as c (c.id)}
								<button
									type="button"
									class="flex w-full flex-col items-start rounded-sm px-2.5 py-2 text-left hover:bg-sunk"
									onmousedown={() => selectCustomer(c)}
								>
									<span class="text-sm">{c.name || c.email || 'Kunde'}</span>
									{#if c.name && c.email}<span class="text-xs text-muted">{c.email}</span>{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<NewCustomerFields
				bind:customerType
				bind:newCustomerCompanyName
				bind:newCustomerSalutation
				bind:newCustomerEmail
				bind:newCustomerName
				bind:newCustomerPhone
				bind:bookingForSelf
				bind:recipientSalutation
				bind:recipientFirstName
				bind:recipientLastName
				bind:recipientPhone
				bind:recipientEmail
			/>
		{/if}
	</Section>

	<Section title="Adressen">
		<div class="grid gap-5 {addrCfg.showDestination ? 'sm:grid-cols-2' : ''}">
			{#if addrCfg.showOrigin}
				<AddressFields
					title={addrCfg.originLabel}
					streetRequired={true}
					bind:street={originStreet}
					bind:city={originCity}
					bind:postal={originPostal}
					bind:floor={originFloor}
					bind:elevator={originElevator}
					bind:halteverbot={originHalteverbot}
					{floorOptions}
					{knownAddresses}
					onSelect={applyToOrigin}
				/>
			{/if}
			{#if addrCfg.showDestination}
				<AddressFields
					title={addrCfg.destinationLabel}
					streetRequired={!addrCfg.optionalDestination}
					bind:street={destStreet}
					bind:city={destCity}
					bind:postal={destPostal}
					bind:floor={destFloor}
					bind:elevator={destElevator}
					bind:halteverbot={destHalteverbot}
					{floorOptions}
					{knownAddresses}
					onSelect={applyToDestination}
				/>
			{/if}
		</div>
	</Section>

	{#if customerType === 'business' || !bookingForSelf}
		<Section title="Rechnungsadresse">
			{#snippet actions()}
				{#if customerType !== 'business'}
					<Button size="xs" variant="ghost" onclick={() => (showBilling = !showBilling)}
						>{showBilling ? 'Ausblenden' : 'Abweichend'}</Button
					>
				{/if}
			{/snippet}
			{#if customerType === 'business'}
				<p class="text-xs text-muted">Firmensitz des Kunden — wird als Rechnungsadresse verwendet.</p>
			{/if}
			{#if customerType === 'business' || showBilling}
				<div class="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
					<Input placeholder="Straße" bind:value={billingStreet} />
					<Input placeholder="Nr." bind:value={billingNumber} />
				</div>
				<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
					<Input placeholder="PLZ" bind:value={billingPostal} />
					<Input placeholder="Stadt" bind:value={billingCity} />
				</div>
			{:else}
				<p class="text-xs text-muted">Auszugsadresse wird als Rechnungsadresse verwendet.</p>
			{/if}
		</Section>
	{/if}

	<Section title="Umzugsgut">
		{#snippet actions()}
			<Segmented
				size="sm"
				label="Erfassung"
				options={[
					{ value: 'manual', label: 'Manuell', icon: List },
					{ value: 'photos', label: 'Fotos', icon: Camera },
					{ value: 'video', label: 'Video', icon: Video }
				]}
				bind:value={volumeMode}
			/>
		{/snippet}

		{#if volumeMode === 'manual'}
			<VolumeCalculator bind:volumeM3 bind:itemSummary />
		{:else if volumeMode === 'video'}
			<MediaDropzone
				variant="admin"
				accept="video/*,.mp4,.mov,.mpeg,.mpg,.avi,.webm,.mkv,.3gp,.m4v"
				mimeFilter="video/"
				maxSizeMb={500}
				label="Videos hierher ziehen oder klicken"
				hint="MP4, MOV, MPEG, AVI, WebM, MKV, 3GP — Raum-Rundgang für 3D-Analyse (max. 500 MB)"
				hasFiles={videoFiles.length > 0}
				id="admin-list-videos"
				onfiles={(files) => {
					videoFiles = [...videoFiles, ...files];
				}}
				onrejected={(file, reason) => {
					createError = reason;
				}}
			>
				<MediaPreviewGrid
					files={videoFiles}
					mode="queue"
					variant="admin"
					dropzoneId="admin-list-videos"
					addMoreLabel="Weitere Videos"
					onremove={(i) => {
						videoFiles = videoFiles.filter((_, idx) => idx !== i);
					}}
				/>
			</MediaDropzone>
		{:else}
			<MediaDropzone
				variant="admin"
				accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.tif,.avif"
				mimeFilter="image/"
				label="Fotos hierher ziehen oder klicken"
				hint="JPG, PNG, WebP, HEIC — Raumfotos für automatische Volumenberechnung"
				hasFiles={photoFiles.length > 0}
				id="admin-list-photos"
				onfiles={(files) => {
					photoFiles = [...photoFiles, ...files];
				}}
				onrejected={(_, reason) => {
					createError = reason;
				}}
			>
				<MediaPreviewGrid
					files={photoFiles}
					mode="thumbnails"
					variant="admin"
					dropzoneId="admin-list-photos"
					onremove={(i) => {
						photoFiles = photoFiles.filter((_, idx) => idx !== i);
					}}
				/>
			</MediaDropzone>
		{/if}
	</Section>

	<Section title="Zusatzleistungen">
		<div class="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
			<Check bind:checked={svcEinpacken}>Einpackservice</Check>
			<Check bind:checked={svcMontage}>Montage</Check>
			<Check bind:checked={svcDemontage}>Demontage</Check>
			<Check bind:checked={svcEinlagerung}>Einlagerung</Check>
			<Check bind:checked={svcEntsorgung}>Entsorgung</Check>
			<Check bind:checked={svcTransporter}>3,5t Transporter m. Koffer</Check>
		</div>
	</Section>

	<Section title="Details">
		<div class="grid grid-cols-2 gap-3">
			<Field label="Datum" for="preferred-date"><Input id="preferred-date" type="date" bind:value={preferredDate} /></Field>
			<Field label="Entfernung (km)" for="distance-km">
				<Input id="distance-km" type="number" bind:value={distanceKm} placeholder="optional" min="0" step="1" />
			</Field>
		</div>
		<Field label="Notizen" for="extra-notes">
			<Textarea id="extra-notes" bind:value={extraNotes} rows={2} placeholder="Weitere Hinweise …" />
		</Field>
	</Section>

	{#snippet footer()}
		{#if createError}
			<p class="text-[13px] text-danger sm:mr-auto" role="alert">{createError}</p>
		{/if}
		<Button variant="accent" size="lg" onclick={handleCreateInquiry} disabled={createLoading}>
			{createLoading
				? volumeMode === 'photos'
					? 'Fotos werden analysiert …'
					: volumeMode === 'video'
						? 'Video wird analysiert …'
						: 'Erstelle Anfrage …'
				: 'Anfrage erstellen'}
		</Button>
	{/snippet}
</Modal>
