<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiFetch } from '$lib/utils/api.svelte';
	import VolumeCalculator from '$lib/components/VolumeCalculator.svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { X, Camera, List, Upload, Video } from 'lucide-svelte';
	import { SERVICE_TYPE_LABELS, SERVICE_ADDRESS_CONFIG } from '$lib/utils/constants';

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
		email: string;
		name: string | null;
		phone: string | null;
	}

	// ─── Create form state ─────────────────────────────────────────────────────

	let createError = $state('');
	let createLoading = $state(false);

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
		customerSearch = c.name || c.email;
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
		if (customerMode === 'new' && !newCustomerEmail.trim()) {
			createError = 'E-Mail-Adresse ist erforderlich';
			return;
		}
		if (addrCfg.showOrigin && (!originStreet.trim() || !originCity.trim())) {
			createError = `${addrCfg.originLabel} (Straße, Stadt) ist erforderlich`;
			return;
		}
		if (addrCfg.showDestination && (!destStreet.trim() || !destCity.trim())) {
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
			if (customerMode === 'new') {
				const newCustomer = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: newCustomerEmail.trim(),
					name: newCustomerName.trim() || null,
					phone: newCustomerPhone.trim() || null,
					customer_type: customerType || null,
					company_name: customerType === 'business' ? newCustomerCompanyName.trim() || null : null,
				});
				customerId = newCustomer.id;
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
				...(addrCfg.showDestination ? {
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
			if (!bookingForSelf && recipientLastName.trim()) {
				// Create a recipient customer record, then set recipient_id
				const recipientRes = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: recipientEmail.trim() || `recipient-${Date.now()}@aufraeumhelden.com`,
					first_name: recipientFirstName.trim() || null,
					last_name: recipientLastName.trim(),
					phone: recipientPhone.trim() || null,
					salutation: recipientSalutation || null,
				});
				body.recipient_id = recipientRes.id;
			}
			if (showBilling && billingStreet.trim() && billingCity.trim()) {
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

			// 1. Create the inquiry
			const res = await apiPost<{ id: string }>('/api/v1/inquiries', body);

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
			createError = (e instanceof Error ? e.message : null) || 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}
</script>

<div class="create-section">
	<!-- 0. Auftragsart -->
	<div class="create-section__group">
		<h3>Auftragsart</h3>
		<div class="svc-type-grid">
			{#each SERVICE_OPTIONS as [id, label]}
				<button
					type="button"
					class="svc-type-btn"
					class:selected={selectedServiceType === id}
					onclick={() => { selectedServiceType = id; }}
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	<!-- 1. Kunde -->
	<div class="create-section__group">
		<h3>Kunde</h3>
		<div class="customer-mode-toggle">
			<button
				class="toggle-btn"
				class:active={customerMode === 'existing'}
				onclick={() => { customerMode = 'existing'; clearCustomer(); }}
			>Bestehend</button>
			<button
				class="toggle-btn"
				class:active={customerMode === 'new'}
				onclick={() => { customerMode = 'new'; clearCustomer(); }}
			>Neu anlegen</button>
		</div>

		{#if customerMode === 'existing'}
			{#if selectedCustomer}
				<div class="selected-customer">
					<span>{selectedCustomer.name || selectedCustomer.email}</span>
					{#if selectedCustomer.name}<span class="selected-customer__email">{selectedCustomer.email}</span>{/if}
					<button class="selected-customer__clear" onclick={clearCustomer}><X size={14} /></button>
				</div>
			{:else}
				<div class="customer-search">
					<input
						type="text"
						placeholder="Kunde suchen (Name oder E-Mail)..."
						bind:value={customerSearch}
						oninput={handleCustomerSearchInput}
						onfocus={() => { if (customerResults.length) showCustomerDropdown = true; }}
						onblur={() => { setTimeout(() => { showCustomerDropdown = false; }, 200); }}
						class="form-input"
					/>
					{#if showCustomerDropdown && customerResults.length > 0}
						<div class="customer-dropdown">
							{#each customerResults as c}
								<button class="customer-dropdown__item" onmousedown={() => selectCustomer(c)}>
									<span class="customer-dropdown__name">{c.name || c.email}</span>
									{#if c.name}<span class="customer-dropdown__email">{c.email}</span>{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<div class="new-customer-form">
				<div class="type-toggle" role="group" aria-label="Kundentyp">
					<button type="button" class="type-btn" class:active={customerType === 'private'}
						onclick={() => customerType = 'private'}>Privat</button>
					<button type="button" class="type-btn" class:active={customerType === 'business'}
						onclick={() => customerType = 'business'}>Gewerbe</button>
				</div>
				{#if customerType === 'business'}
					<input type="text" placeholder="Firmenname *" bind:value={newCustomerCompanyName} class="form-input" />
				{/if}
				<input type="email" placeholder="E-Mail *" bind:value={newCustomerEmail} class="form-input" />
				<input type="text" placeholder="Name" bind:value={newCustomerName} class="form-input" />
				<input type="tel" placeholder="Telefon" bind:value={newCustomerPhone} class="form-input" />

				{#if customerType === 'private'}
					<div class="booking-for-toggle" role="group" aria-label="Für wen buchen Sie?">
						<button type="button" class="type-btn" class:active={bookingForSelf}
							onclick={() => bookingForSelf = true}>Für mich selbst</button>
						<button type="button" class="type-btn" class:active={!bookingForSelf}
							onclick={() => bookingForSelf = false}>Für jemand anderen</button>
					</div>
					{#if !bookingForSelf}
						<div class="recipient-fields">
							<h4>Leistungsempfänger</h4>
							<div class="address-row">
								<select bind:value={recipientSalutation} class="form-select">
									<option value="">Anrede</option>
									<option>Herr</option><option>Frau</option><option>Divers</option>
								</select>
								<input type="text" placeholder="Vorname" bind:value={recipientFirstName} class="form-input" />
								<input type="text" placeholder="Nachname *" bind:value={recipientLastName} class="form-input" />
							</div>
							<div class="address-row">
								<input type="tel" placeholder="Telefon" bind:value={recipientPhone} class="form-input" />
								<input type="email" placeholder="E-Mail" bind:value={recipientEmail} class="form-input" />
							</div>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<!-- 2. Adressen -->
	<div class="create-section__group">
		<h3>Adressen</h3>
		<div class="address-grid" class:address-grid--single={!addrCfg.showDestination}>
			{#if addrCfg.showOrigin}
				<div class="address-col">
					<h4>{addrCfg.originLabel}</h4>
					<input type="text" placeholder="Straße *" bind:value={originStreet} class="form-input" />
					<div class="address-row">
						<input type="text" placeholder="PLZ" bind:value={originPostal} class="form-input form-input--short" />
						<input type="text" placeholder="Stadt *" bind:value={originCity} class="form-input" />
					</div>
					<div class="address-row">
						<select bind:value={originFloor} class="form-select">
							<option value="">Stockwerk</option>
							{#each floorOptions as f}<option value={f}>{f}</option>{/each}
						</select>
						<label class="form-checkbox">
							<input type="checkbox" bind:checked={originElevator} />
							Aufzug
						</label>
						<label class="form-checkbox">
							<input type="checkbox" bind:checked={originHalteverbot} />
							Halteverbot
						</label>
					</div>
				</div>
			{/if}

			{#if addrCfg.showDestination}
				<div class="address-col">
					<h4>{addrCfg.destinationLabel}</h4>
					<input type="text" placeholder="Straße *" bind:value={destStreet} class="form-input" />
					<div class="address-row">
						<input type="text" placeholder="PLZ" bind:value={destPostal} class="form-input form-input--short" />
						<input type="text" placeholder="Stadt *" bind:value={destCity} class="form-input" />
					</div>
					<div class="address-row">
						<select bind:value={destFloor} class="form-select">
							<option value="">Stockwerk</option>
							{#each floorOptions as f}<option value={f}>{f}</option>{/each}
						</select>
						<label class="form-checkbox">
							<input type="checkbox" bind:checked={destElevator} />
							Aufzug
						</label>
						<label class="form-checkbox">
							<input type="checkbox" bind:checked={destHalteverbot} />
							Halteverbot
						</label>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Billing address (when not auto-derived from origin/destination) -->
	{#if customerType === 'business' || !bookingForSelf}
	<div class="create-section__group">
");
		<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
			<h3 style="margin:0;">Rechnungsadresse</h3>
			<button type="button" class="toggle-btn" style="font-size:0.75rem;padding:0.2rem 0.5rem;"
				onclick={() => showBilling = !showBilling}>{showBilling ? 'Ausblenden' : 'Abweichend'}</button>
		</div>
		{#if !showBilling}
			<p class="form-hint">{customerType === 'business' ? 'Firmensitz wird als Rechnungsadresse verwendet.' : 'Auszugsadresse wird als Rechnungsadresse verwendet.'}</p>
		{:else}
			<div class="address-row">
				<input type="text" placeholder="Straße" bind:value={billingStreet} class="form-input" style="flex:1;" />
				<input type="text" placeholder="Nr." bind:value={billingNumber} class="form-input" style="max-width:80px;" />
			</div>
			<div class="address-row">
				<input type="text" placeholder="PLZ" bind:value={billingPostal} class="form-input" style="max-width:100px;" />
				<input type="text" placeholder="Stadt" bind:value={billingCity} class="form-input" style="flex:1;" />
			</div>
		{/if}
	</div>
	{/if}

	<!-- 3. Umzugsgut -->
	<div class="create-section__group">
		<div class="volume-header">
			<h3>Umzugsgut</h3>
			<div class="volume-mode-toggle">
				<button
					class="volume-mode-btn"
					class:active={volumeMode === 'manual'}
					onclick={() => { volumeMode = 'manual'; }}
				>
					<List size={14} />
					Manuell
				</button>
				<button
					class="volume-mode-btn"
					class:active={volumeMode === 'photos'}
					onclick={() => { volumeMode = 'photos'; }}
				>
					<Camera size={14} />
					Fotos
				</button>
				<button
					class="volume-mode-btn"
					class:active={volumeMode === 'video'}
					onclick={() => { volumeMode = 'video'; }}
				>
					<Video size={14} />
					Video
				</button>
			</div>
		</div>

		{#if volumeMode === 'manual'}
			<VolumeCalculator bind:volumeM3 bind:itemSummary />
		{:else if volumeMode === 'video'}
			<MediaDropzone
				variant="admin"
				accept="video/*,.mp4,.mov,.mpeg,.mpg,.avi,.webm,.mkv,.3gp,.m4v"
				mimeFilter="video/"
				maxSizeMb={500}
				label="Videos hierher ziehen oder klicken"
				hint="MP4, MOV, MPEG, AVI, WebM, MKV, 3GP — Raum-Rundgang fuer 3D-Analyse (max. 500 MB)"
				hasFiles={videoFiles.length > 0}
				id="admin-list-videos"
				onfiles={(files) => { videoFiles = [...videoFiles, ...files]; }}
				onrejected={(file, reason) => { createError = reason; }}
			>
				<MediaPreviewGrid
					files={videoFiles}
					mode="queue"
					variant="admin"
					dropzoneId="admin-list-videos"
					addMoreLabel="Weitere Videos"
					onremove={(i) => { videoFiles = videoFiles.filter((_, idx) => idx !== i); }}
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
				onfiles={(files) => { photoFiles = [...photoFiles, ...files]; }}
				onrejected={(_, reason) => { createError = reason; }}
			>
				<MediaPreviewGrid
					files={photoFiles}
					mode="thumbnails"
					variant="admin"
					dropzoneId="admin-list-photos"
					onremove={(i) => { photoFiles = photoFiles.filter((_, idx) => idx !== i); }}
				/>
			</MediaDropzone>
		{/if}
	</div>

	<!-- 4. Zusatzleistungen -->
	<div class="create-section__group">
		<h3>Zusatzleistungen</h3>
		<div class="services-grid">
			<label class="form-checkbox"><input type="checkbox" bind:checked={svcEinpacken} /> Einpackservice</label>
			<label class="form-checkbox"><input type="checkbox" bind:checked={svcMontage} /> Montage</label>
			<label class="form-checkbox"><input type="checkbox" bind:checked={svcDemontage} /> Demontage</label>
			<label class="form-checkbox"><input type="checkbox" bind:checked={svcEinlagerung} /> Einlagerung</label>
			<label class="form-checkbox"><input type="checkbox" bind:checked={svcEntsorgung} /> Entsorgung</label>
		</div>
	</div>

	<!-- 5. Details -->
	<div class="create-section__group">
		<h3>Details</h3>
		<div class="details-row">
			<div class="details-field">
				<label for="preferred-date">Datum</label>
				<input id="preferred-date" type="date" bind:value={preferredDate} class="form-input" />
			</div>
			<div class="details-field">
				<label for="distance-km">Entfernung (km)</label>
				<input id="distance-km" type="number" bind:value={distanceKm} placeholder="optional" class="form-input" min="0" step="1" />
			</div>
		</div>
		<div class="details-field" style="margin-top: 0.75rem;">
			<label for="extra-notes">Notizen</label>
			<textarea id="extra-notes" bind:value={extraNotes} rows="2" placeholder="Weitere Hinweise..." class="form-input form-textarea"></textarea>
		</div>
	</div>

	<!-- Submit -->
	{#if createError}
		<p class="create-section__error">{createError}</p>
	{/if}
	<button
		class="create-section__submit"
		onclick={handleCreateInquiry}
		disabled={createLoading}
	>
		{createLoading
		? (volumeMode === 'photos' ? 'Fotos werden analysiert...' : volumeMode === 'video' ? 'Video wird analysiert...' : 'Erstelle Anfrage...')
		: 'Anfrage erstellen'}
	</button>
</div>

<style>
	/* --- Create Section --- */

	.create-section {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.5rem;
		margin-bottom: 1.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.create-section__group {
		margin-bottom: 1.25rem;
	}

	.create-section__group--subtle {
		background: var(--dt-surface-container);
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 1rem;
	}

	.create-section__group h3 {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		margin: 0 0 0.75rem;
	}

	.create-section__group h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin: 0 0 0.5rem;
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

	.form-textarea {
		resize: vertical;
		font-family: inherit;
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

	.form-checkbox input[type="checkbox"] {
		accent-color: var(--dt-primary);
	}

	/* Customer mode toggle */
	.customer-mode-toggle {
		display: flex;
		gap: 0;
		margin-bottom: 0.75rem;
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		background: var(--dt-surface-container);
	}

	.toggle-btn {
		flex: 1;
		padding: 0.4rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.toggle-btn.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	.new-customer-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Customer search */
	.customer-search {
		position: relative;
	}

	.customer-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-md);
		box-shadow: var(--dt-shadow-ambient);
		z-index: 10;
		max-height: 240px;
		overflow-y: auto;
		margin-top: 4px;
	}

	.customer-dropdown__item {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.customer-dropdown__item:hover {
		background: var(--dt-surface-container-low);
	}

	.customer-dropdown__name {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.customer-dropdown__email {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.selected-customer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.selected-customer__email {
		font-weight: 400;
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
	}

	.selected-customer__clear {
		margin-left: auto;
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		border: var(--dt-ghost-border);
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.selected-customer__clear:hover {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface);
	}

	/* Addresses */
	.address-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.address-grid--single {
		grid-template-columns: 1fr;
	}

	.address-col {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.address-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Volume mode toggle */
	.volume-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.volume-header h3 {
		margin: 0 !important;
	}

	.volume-mode-toggle {
		display: flex;
		gap: 0.25rem;
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-sm);
		padding: 0.1875rem;
	}

	.volume-mode-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
		background: transparent;
		color: var(--dt-on-surface-variant);
	}

	.volume-mode-btn:hover {
		color: var(--dt-on-surface);
	}

	.volume-mode-btn.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	/* Services */
	.services-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem 1.5rem;
	}

	/* Details */
	.details-row {
		display: flex;
		gap: 1rem;
	}

	.details-field {
		flex: 1;
	}

	.details-field label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.25rem;
	}

	.create-section__error {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: var(--dt-secondary);
	}

	.create-section__submit {
		display: block;
		width: 100%;
		padding: 0.75rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		border: none;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.create-section__submit:hover:not(:disabled) {
		opacity: 0.88;
	}

	.create-section__submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.address-grid {
			grid-template-columns: 1fr;
		}

		.details-row {
			flex-direction: column;
		}
	}
	.svc-type-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.svc-type-btn {
		padding: 0.35rem 0.65rem;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		background: var(--dt-surface-container-lowest);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: all 0.12s;
	}

	.svc-type-btn:hover {
		border-color: var(--dt-primary);
		color: var(--dt-primary);
	}

	.svc-type-btn.selected {
		background: var(--dt-primary);
		border-color: var(--dt-primary);
		color: #fff;
	}

	.type-toggle {
		display: inline-flex;
		align-self: flex-start;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.6rem;
	}

	.type-btn {
		padding: 0.35rem 0.85rem;
		border: none;
		background: var(--dt-surface-container-lowest);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: all 0.12s;
	}

	.type-btn:not(:first-child) { border-left: 1.5px solid var(--dt-outline-variant); }
	.type-btn.active { background: var(--dt-primary); color: #fff; }

	.booking-for-toggle {
		display: inline-flex;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		overflow: hidden;
		margin-top: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.recipient-fields {
		background: var(--dt-surface-container);
		border-radius: 8px;
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.recipient-fields h4 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--dt-primary);
		margin: 0 0 0.5rem;
	}

	.form-hint {
		font-size: 0.78rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
	}
</style>
