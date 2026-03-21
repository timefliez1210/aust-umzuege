<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiFetch, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import VolumeCalculator from '$lib/components/VolumeCalculator.svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus, X, Camera, List, Upload, Video } from 'lucide-svelte';

	interface InquiryListItem {
		id: string;
		customer_name: string | null;
		customer_email: string;
		salutation: string | null;
		origin_city: string | null;
		destination_city: string | null;
		volume_m3: number | null;
		distance_km: number | null;
		status: string;
		has_offer: boolean;
		offer_status: string | null;
		created_at: string;
	}

	interface InquiriesResponse {
		inquiries: InquiryListItem[];
		total: number;
	}

	interface CustomerMatch {
		id: string;
		email: string;
		name: string | null;
		phone: string | null;
	}

	let inquiries = $state<InquiryListItem[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let statusFilter = $state('');
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	let sortKey = $state('created_at');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// Create form state
	let showCreateForm = $state(false);
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

	const floorOptions = ['EG', '1. OG', '2. OG', '3. OG', '4. OG', '5. OG', 'DG', 'UG'];

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'pending', label: 'Offen' },
		{ value: 'estimating', label: 'Schaetzung' },
		{ value: 'estimated', label: 'Volumen' },
		{ value: 'offer_ready', label: 'Angebot' },
		{ value: 'sent', label: 'Gesendet' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'scheduled', label: 'Geplant' },
		{ value: 'completed', label: 'Erledigt' },
		{ value: 'invoiced', label: 'Fakturiert' },
		{ value: 'paid', label: 'Bezahlt' }
	];

	const columns = [
		{ key: 'created_at', label: 'Datum', sortable: true, width: '120px' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', sortable: true, width: '100px' },
		{ key: 'status', label: 'Status', width: '140px' }
	];

	$effect(() => {
		loadInquiries();
	});

	/**
	 * Fetches the paginated inquiries list from the API and populates the DataTable.
	 *
	 * Called by: $effect (on mount and whenever statusFilter, searchQuery, or offset change)
	 * Purpose: Loads inquiry records filtered by status and free-text search, respecting the
	 *          current pagination offset. Calls GET /api/v1/inquiries with query parameters.
	 *          On error, resets the list to empty so the page stays usable.
	 *
	 * @returns void (side-effect: sets `inquiries`, `total`, `loading`)
	 */
	async function loadInquiries() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));

			const res = await apiGet<InquiriesResponse>(`/api/v1/inquiries?${params}`);
			inquiries = res.inquiries;
			total = res.total;
		} catch {
			inquiries = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	/**
	 * Switches the active status tab filter and reloads the quotes list from page 1.
	 *
	 * Called by: Template (onclick on each status tab button — Alle, Offen, Volumen, etc.)
	 * Purpose: Narrows the quotes table to a single workflow stage without clearing the search input.
	 *
	 * @param value - The status string to filter by ('' for all, or e.g. 'pending', 'offer_generated')
	 * @returns void
	 */
	function setFilter(value: string) {
		statusFilter = value;
		offset = 0;
		loadInquiries();
	}

	/**
	 * Resets the pagination offset and triggers a new quote search with the current query string.
	 *
	 * Called by: Template (oninput or onsubmit on the search input field)
	 * Purpose: Ensures search results always start from page 1 when the query changes.
	 *
	 * @returns void
	 */
	function handleSearch() {
		offset = 0;
		loadInquiries();
	}

	/**
	 * Moves the pagination offset back by one page and reloads the quotes list.
	 *
	 * Called by: Template (onclick on the left-chevron pagination button)
	 * Purpose: Navigates to the previous 20-item page; no-ops if already on page 1.
	 *
	 * @returns void
	 */
	function prevPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			loadInquiries();
		}
	}

	/**
	 * Advances the pagination offset by one page and reloads the quotes list.
	 *
	 * Called by: Template (onclick on the right-chevron pagination button)
	 * Purpose: Navigates to the next 20-item page; no-ops if already on the last page.
	 *
	 * @returns void
	 */
	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadInquiries();
		}
	}

	let customerSearchTimer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Queries the customers API with the current search string and populates the autocomplete dropdown.
	 *
	 * Called by: handleCustomerSearchInput (debounced, 250 ms after keystroke)
	 * Purpose: Allows finding an existing customer by name or email when creating a new quote manually.
	 *          Calls GET /api/v1/admin/customers?search=...&limit=8.
	 *          Skips the API call if the query is shorter than 2 characters.
	 *
	 * @returns void (side-effect: sets `customerResults`, `showCustomerDropdown`, `customerSearchLoading`)
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
	 *          Cancels any pending timer before scheduling a new one.
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
	 * Purpose: Stores the chosen customer so the create-quote API call can reference their ID,
	 *          and updates the search input text to show the selected customer's name or email.
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
	}

	/**
	 * Compiles all selected service flags and free-text extras into a single comma-separated notes string.
	 *
	 * Called by: handleCreateQuote (to assemble the `notes` field of the POST /api/v1/admin/quotes body)
	 * Purpose: Converts the checkbox-driven service selection (Halteverbot, Montage, etc.) into the
	 *          plain-text notes format that the API and pricing engine expect for downstream line-item
	 *          auto-generation.
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
	 * Validates the create-quote form, creates the quote via the API, and optionally uploads media.
	 *
	 * Called by: Template (onclick on the "Anfrage erstellen" submit button)
	 * Purpose: Orchestrates the full quote-creation workflow:
	 *          1. Validates required fields (customer, addresses, media in photo/video mode).
	 *          2. Optionally creates a new customer first via POST /api/v1/admin/customers.
	 *          3. Creates the quote via POST /api/v1/admin/quotes.
	 *          4. If volumeMode is 'photos', uploads images via POST /api/v1/estimates/depth-sensor
	 *             to trigger the vision pipeline and auto-offer generation.
	 *          5. If volumeMode is 'video', uploads videos via POST /api/v1/estimates/video.
	 *          6. Navigates to the new quote's detail page.
	 *
	 * @returns void (side-effect: navigates to /admin/inquiries/{id} on success, sets `createError` on failure)
	 */
	async function handleCreateQuote() {
		if (customerMode === 'existing' && !selectedCustomer) {
			createError = 'Bitte Kunde auswählen';
			return;
		}
		if (customerMode === 'new' && !newCustomerEmail.trim()) {
			createError = 'E-Mail-Adresse ist erforderlich';
			return;
		}
		if (!originStreet.trim() || !originCity.trim()) {
			createError = 'Auszugsadresse (Straße, Stadt) ist erforderlich';
			return;
		}
		if (!destStreet.trim() || !destCity.trim()) {
			createError = 'Einzugsadresse (Straße, Stadt) ist erforderlich';
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
				});
				customerId = newCustomer.id;
			} else {
				customerId = selectedCustomer!.id;
			}

			const body: Record<string, unknown> = {
				customer_id: customerId,
				origin: {
					street: originStreet.trim(),
					city: originCity.trim(),
					postal_code: originPostal.trim() || null,
					floor: originFloor || null,
					elevator: originElevator || null
				},
				destination: {
					street: destStreet.trim(),
					city: destCity.trim(),
					postal_code: destPostal.trim() || null,
					floor: destFloor || null,
					elevator: destElevator || null
				},
				notes: buildNotes() || null
			};

			if (preferredDate) body.preferred_date = preferredDate;
			if (distanceKm) body.distance_km = parseFloat(distanceKm);

			// Only include manual volume data in manual mode
			if (volumeMode === 'manual') {
				if (volumeM3 > 0) body.estimated_volume_m3 = volumeM3;
				if (itemSummary.trim()) body.items_list = itemSummary.trim();
			}

			// 1. Create the quote
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

			goto(`/admin/inquiries/${res.id}`);
		} catch (e: any) {
			createError = e.message || 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	let currentPage = $derived(Math.floor(offset / limit) + 1);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="page">
	<div class="page-header">
		<h1>Anfragen</h1>
		<span class="page-count">{total} gesamt</span>
		<button class="btn-create" onclick={() => { showCreateForm = !showCreateForm; }}>
			{#if showCreateForm}
				<X size={16} />
				Schließen
			{:else}
				<Plus size={16} />
				Neue Anfrage
			{/if}
		</button>
	</div>

	{#if showCreateForm}
		<div class="create-section">
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
						<input type="email" placeholder="E-Mail *" bind:value={newCustomerEmail} class="form-input" />
						<input type="text" placeholder="Name" bind:value={newCustomerName} class="form-input" />
						<input type="tel" placeholder="Telefon" bind:value={newCustomerPhone} class="form-input" />
					</div>
				{/if}
			</div>

			<!-- 2. Adressen -->
			<div class="create-section__group">
				<h3>Adressen</h3>
				<div class="address-grid">
					<div class="address-col">
						<h4>Von (Auszug)</h4>
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

					<div class="address-col">
						<h4>Nach (Einzug)</h4>
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
				</div>
			</div>

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
				onclick={handleCreateQuote}
				disabled={createLoading}
			>
				{createLoading
				? (volumeMode === 'photos' ? 'Fotos werden analysiert...' : volumeMode === 'video' ? 'Video wird analysiert...' : 'Erstelle Anfrage...')
				: 'Anfrage erstellen'}
			</button>
		</div>
	{/if}

	<div class="toolbar">
		<div class="tabs">
			{#each tabs as tab}
				<button
					class="tab"
					class:active={statusFilter === tab.value}
					onclick={() => setFilter(tab.value)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="search-box">
			<Search size={16} />
			<input
				type="text"
				placeholder="Suche..."
				bind:value={searchQuery}
				onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			/>
		</div>
	</div>

	<DataTable
		{columns}
		rows={inquiries}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/inquiries/${(row as InquiryListItem).id}`)}
	>
		{#snippet row(item, _i)}
			{@const q = item as InquiryListItem}
			<td>{formatDate(q.created_at)}</td>
			<td>
				<div class="cell-name">
					{#if q.salutation}<span class="sal-badge">{q.salutation === 'D' ? 'Div.' : q.salutation}</span>{/if}{q.customer_name || q.customer_email}
				</div>
				{#if q.customer_name}<div class="cell-email">{q.customer_email}</div>{/if}
			</td>
			<td>
				{#if q.origin_city && q.destination_city}
					{q.origin_city} &rarr; {q.destination_city}
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td>
				{#if q.volume_m3 != null}
					{q.volume_m3.toFixed(1)} m&sup3;
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td><StatusBadge status={q.status} /></td>
		{/snippet}
	</DataTable>

	{#if totalPages > 1}
		<div class="pagination">
			<button onclick={prevPage} disabled={offset === 0}>
				<ChevronLeft size={16} />
			</button>
			<span>Seite {currentPage} von {totalPages}</span>
			<button onclick={nextPage} disabled={offset + limit >= total}>
				<ChevronRight size={16} />
			</button>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		flex: 1;
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		border: none;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.btn-create:hover {
		opacity: 0.88;
	}

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
		.page-header {
			flex-wrap: wrap;
		}
		.search-box {
			flex: 1;
			min-width: 0;
		}
		.search-box input {
			width: 100%;
		}
		.btn-create {
			min-height: 44px;
		}
		.tab {
			min-height: 44px;
		}
		.pagination button {
			min-height: 44px;
			min-width: 44px;
			justify-content: center;
		}
		.address-grid {
			grid-template-columns: 1fr;
		}
		.details-row {
			flex-direction: column;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-md);
		padding: 0.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.tab {
		padding: 0.375rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.tab:hover {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
	}

	.tab.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-md);
		padding: 0 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.search-box input {
		background: transparent;
		border: none;
		color: var(--dt-on-surface);
		padding: 0.5rem 0;
		font-size: 0.875rem;
		outline: none;
		width: 200px;
	}

	.search-box input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.sal-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--dt-primary);
		background: var(--dt-surface-container);
		padding: 0.05rem 0.3rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.3rem;
		vertical-align: middle;
	}

	.cell-name {
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.cell-email {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.text-muted {
		color: var(--dt-outline-variant);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.pagination button {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		border: var(--dt-ghost-border);
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
		cursor: pointer;
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.pagination button:hover:not(:disabled) {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
	}

	.pagination button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
