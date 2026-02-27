<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiFetch, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import VolumeCalculator from '$lib/components/VolumeCalculator.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus, X, Camera, List, Upload, Trash2, Video } from 'lucide-svelte';

	interface Quote {
		id: string;
		customer_name: string | null;
		customer_email: string;
		origin_city: string | null;
		destination_city: string | null;
		volume_m3: number | null;
		status: string;
		created_at: string;
	}

	interface QuotesResponse {
		quotes: Quote[];
		total: number;
	}

	interface CustomerMatch {
		id: string;
		email: string;
		name: string | null;
		phone: string | null;
	}

	let quotes = $state<Quote[]>([]);
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
	let photoPreviews = $state<string[]>([]);
	let draggingOver = $state(false);
	let photoFileInput = $state<HTMLInputElement>(undefined!);

	// Video upload
	let videoFiles = $state<File[]>([]);
	let videoFileInput = $state<HTMLInputElement>(undefined!);
	let videoDragging = $state(false);

	/**
	 * Validates and appends video files to the upload queue, rejecting non-video or oversized files.
	 *
	 * Called by: handleVideoSelect (after file picker selection), handleVideoDrop (after drag-and-drop)
	 * Purpose: Guards the video queue so only valid video files under 500 MB reach the upload step.
	 *
	 * @param files - FileList or File array from a file input or drag event
	 * @returns void (side-effect: appends to `videoFiles`, sets `createError` on rejection)
	 */
	function addVideoFiles(files: FileList | File[]) {
		for (const file of Array.from(files)) {
			if (!file.type.startsWith('video/')) {
				createError = `${file.name}: Keine Videodatei`;
				continue;
			}
			if (file.size > 500 * 1024 * 1024) {
				createError = `${file.name} zu gross (max. 500 MB)`;
				continue;
			}
			videoFiles = [...videoFiles, file];
			createError = '';
		}
	}

	/**
	 * Reads files from a video file-input change event and forwards them to addVideoFiles.
	 *
	 * Called by: Template (onchange on the hidden video <input type="file">)
	 * Purpose: Bridges the native file-input event to the shared addVideoFiles validation logic,
	 *          then resets the input so the same file can be selected again if needed.
	 *
	 * @param e - The native change Event from the file input element
	 * @returns void
	 */
	function handleVideoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		addVideoFiles(input.files);
		input.value = '';
	}

	/**
	 * Removes a video file from the staged upload queue by index.
	 *
	 * Called by: Template (onclick on the Trash2 button next to each queued video)
	 * Purpose: Lets the user deselect a video before submitting the create-quote form.
	 *
	 * @param index - Zero-based position of the file to remove from `videoFiles`
	 * @returns void
	 */
	function removeVideo(index: number) {
		videoFiles = videoFiles.filter((_, i) => i !== index);
	}

	/**
	 * Handles a drag-and-drop event on the video drop zone and forwards files to addVideoFiles.
	 *
	 * Called by: Template (ondrop on the video dropzone element)
	 * Purpose: Allows the user to drop video files directly onto the upload area instead of using the file picker.
	 *
	 * @param e - The native DragEvent carrying the dropped files
	 * @returns void
	 */
	function handleVideoDrop(e: DragEvent) {
		e.preventDefault();
		videoDragging = false;
		if (e.dataTransfer?.files) addVideoFiles(e.dataTransfer.files);
	}

	/**
	 * Prevents the browser default drag behavior and activates the video drop-zone highlight.
	 *
	 * Called by: Template (ondragover on the video dropzone element)
	 * Purpose: Visual feedback so the user sees that the area accepts video drops.
	 *
	 * @param e - The native DragEvent
	 * @returns void
	 */
	function handleVideoDragOver(e: DragEvent) {
		e.preventDefault();
		videoDragging = true;
	}

	/**
	 * Clears the video drop-zone drag-over highlight when the cursor leaves the zone.
	 *
	 * Called by: Template (ondragleave on the video dropzone element)
	 * Purpose: Resets the drop zone to its idle visual state when the drag cursor exits.
	 *
	 * @returns void
	 */
	function handleVideoDragLeave() {
		videoDragging = false;
	}

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
		{ value: 'volume_estimated', label: 'Volumen' },
		{ value: 'offer_generated', label: 'Angebot' },
		{ value: 'offer_sent', label: 'Gesendet' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'done', label: 'Erledigt' },
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
		loadQuotes();
	});

	/**
	 * Fetches the paginated quotes list from the API and populates the DataTable.
	 *
	 * Called by: $effect (on mount and whenever statusFilter, searchQuery, or offset change)
	 * Purpose: Loads quote records filtered by status and free-text search, respecting the
	 *          current pagination offset. Calls GET /api/v1/admin/quotes with query parameters.
	 *          On error, resets the list to empty so the page stays usable.
	 *
	 * @returns void (side-effect: sets `quotes`, `total`, `loading`)
	 */
	async function loadQuotes() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));

			const res = await apiGet<QuotesResponse>(`/api/v1/admin/quotes?${params}`);
			quotes = res.quotes;
			total = res.total;
		} catch {
			quotes = [];
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
		loadQuotes();
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
		loadQuotes();
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
			loadQuotes();
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
			loadQuotes();
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
	 * Validates image files and appends them to the photo queue with blob-URL previews.
	 *
	 * Called by: handleDrop (on drag-and-drop), handleFileSelect (on file-picker selection)
	 * Purpose: Guards the photo queue against non-image files and duplicates (matched by name + size),
	 *          and generates object URLs so thumbnail previews can be rendered immediately.
	 *
	 * @param files - FileList or File array from a file input or drag event
	 * @returns void (side-effect: appends to `photoFiles` and `photoPreviews`)
	 */
	function addPhotos(files: FileList | File[]) {
		for (const file of files) {
			if (!file.type.startsWith('image/')) continue;
			if (photoFiles.some(f => f.name === file.name && f.size === file.size)) continue;
			photoFiles = [...photoFiles, file];
			const url = URL.createObjectURL(file);
			photoPreviews = [...photoPreviews, url];
		}
	}

	/**
	 * Removes a photo from the staged queue and revokes its blob preview URL to free memory.
	 *
	 * Called by: Template (onclick on the remove button of each photo thumbnail)
	 * Purpose: Lets the user deselect a photo before submitting the create-quote form,
	 *          and cleans up object URLs to prevent memory leaks.
	 *
	 * @param index - Zero-based position of the file to remove from `photoFiles` and `photoPreviews`
	 * @returns void
	 */
	function removePhoto(index: number) {
		URL.revokeObjectURL(photoPreviews[index]);
		photoFiles = photoFiles.filter((_, i) => i !== index);
		photoPreviews = photoPreviews.filter((_, i) => i !== index);
	}

	/**
	 * Handles a drag-and-drop event on the photo drop zone and forwards files to addPhotos.
	 *
	 * Called by: Template (ondrop on the photo dropzone element in 'photos' volume mode)
	 * Purpose: Allows the user to drop image files onto the upload area without opening a file picker.
	 *
	 * @param e - The native DragEvent carrying the dropped files
	 * @returns void
	 */
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		draggingOver = false;
		if (e.dataTransfer?.files) addPhotos(e.dataTransfer.files);
	}

	/**
	 * Prevents the browser default drag behavior and activates the photo drop-zone highlight.
	 *
	 * Called by: Template (ondragover on the photo dropzone element)
	 * Purpose: Visual feedback so the user sees that the area accepts image drops.
	 *
	 * @param e - The native DragEvent
	 * @returns void
	 */
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		draggingOver = true;
	}

	/**
	 * Clears the photo drop-zone drag-over highlight when the cursor leaves the zone.
	 *
	 * Called by: Template (ondragleave on the photo dropzone element)
	 * Purpose: Resets the drop zone to its idle visual state when the drag cursor exits.
	 *
	 * @returns void
	 */
	function handleDragLeave() {
		draggingOver = false;
	}

	/**
	 * Reads image files from a file-input change event and forwards them to addPhotos.
	 *
	 * Called by: Template (onchange on the hidden photo <input type="file">)
	 * Purpose: Bridges the native file-input event to the addPhotos validation and preview logic,
	 *          then resets the input so the same files can be re-selected if needed.
	 *
	 * @param e - The native change Event from the file input element
	 * @returns void
	 */
	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) addPhotos(input.files);
		input.value = '';
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
	 * @returns void (side-effect: navigates to /admin/quotes/{id} on success, sets `createError` on failure)
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
			const res = await apiPost<{ id: string }>('/api/v1/admin/quotes', body);

			// 2. If photos mode, upload images to depth-sensor endpoint
			if (volumeMode === 'photos' && photoFiles.length > 0) {
				createError = '';
				const formData = new FormData();
				formData.append('quote_id', res.id);
				for (const file of photoFiles) {
					formData.append('images', file);
				}
				// This runs the vision pipeline, stores estimation, updates quote, and triggers auto offer generation
				await apiFetch('/api/v1/estimates/depth-sensor', { method: 'POST', body: formData });
			}

			// 3. If video mode, upload videos to video endpoint
			if (volumeMode === 'video' && videoFiles.length > 0) {
				createError = '';
				const formData = new FormData();
				formData.append('quote_id', res.id);
				for (const file of videoFiles) {
					formData.append('video', file);
				}
				await apiFetch('/api/v1/estimates/video', { method: 'POST', body: formData });
			}

			goto(`/admin/quotes/${res.id}`);
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
					{#if videoFiles.length > 0}
						<div class="video-queue">
							{#each videoFiles as file, i}
								<div class="video-selected">
									<Video size={20} />
									<div class="video-selected__info">
										<span class="video-selected__name">{file.name}</span>
										<span class="video-selected__size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
									</div>
									<button class="photo-thumb__remove" onclick={() => removeVideo(i)}>
										<Trash2 size={12} />
									</button>
								</div>
							{/each}
							<button class="video-add-more-btn" type="button" onclick={() => videoFileInput.click()}>
								<Upload size={14} />
								Weitere Videos
							</button>
						</div>
					{/if}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					{#if videoFiles.length === 0}
						<div
							class="photo-dropzone"
							class:dragging={videoDragging}
							role="button"
							tabindex="0"
							ondrop={handleVideoDrop}
							ondragover={handleVideoDragOver}
							ondragleave={handleVideoDragLeave}
							onclick={() => videoFileInput.click()}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') videoFileInput.click(); }}
						>
							<Video size={32} />
							<p>Videos hierher ziehen oder klicken</p>
							<span class="photo-dropzone__hint">MP4, MOV, WebM — Raum-Rundgang fuer 3D-Analyse (max. 500 MB)</span>
						</div>
					{/if}
					<input
						type="file"
						accept="video/*"
						multiple
						class="photo-file-input"
						bind:this={videoFileInput}
						onchange={handleVideoSelect}
					/>
				{:else}
					<div
						class="photo-dropzone"
						class:dragging={draggingOver}
						role="button"
						tabindex="0"
						ondrop={handleDrop}
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						onclick={() => photoFileInput.click()}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') photoFileInput.click(); }}
					>
						<Upload size={32} />
						<p>Fotos hierher ziehen oder klicken</p>
						<span class="photo-dropzone__hint">JPG, PNG — Raumfotos für automatische Volumenberechnung</span>
					</div>
					<input
						type="file"
						accept="image/*"
						multiple
						class="photo-file-input"
						bind:this={photoFileInput}
						onchange={handleFileSelect}
					/>

					{#if photoPreviews.length > 0}
						<div class="photo-grid">
							{#each photoPreviews as preview, i}
								<div class="photo-thumb">
									<img src={preview} alt="Foto {i + 1}" />
									<button class="photo-thumb__remove" onclick={() => removePhoto(i)}>
										<Trash2 size={12} />
									</button>
								</div>
							{/each}
						</div>
						<p class="photo-count">{photoFiles.length} {photoFiles.length === 1 ? 'Foto' : 'Fotos'} ausgewählt</p>
					{/if}
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
						<label for="preferred-date">Wunschdatum</label>
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
		rows={quotes}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/quotes/${(row as Quote).id}`)}
	>
		{#snippet row(item, _i)}
			{@const q = item as Quote}
			<td>{formatDate(q.created_at)}</td>
			<td>
				<div class="cell-name">{q.customer_name || q.customer_email}</div>
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
		color: #1a1a2e;
	}

	.page-count {
		font-size: 0.8125rem;
		color: #94a3b8;
		flex: 1;
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #ffffff;
		background: #6366f1;
		border: none;
		cursor: pointer;
		box-shadow: 2px 2px 6px #d1d9e6;
		transition: all 150ms ease;
	}

	.btn-create:hover {
		background: #4f46e5;
	}

	/* --- Create Section --- */

	.create-section {
		background: #ffffff;
		border-radius: 14px;
		padding: 1.5rem;
		margin-bottom: 1.25rem;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.create-section__group {
		margin-bottom: 1.25rem;
	}

	.create-section__group h3 {
		font-size: 0.9375rem;
		font-weight: 700;
		color: #1a1a2e;
		margin: 0 0 0.75rem;
	}

	.create-section__group h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #475569;
		margin: 0 0 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		border: none;
		background: #e8ecf1;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		font-size: 0.875rem;
		color: #1a1a2e;
		outline: none;
		box-sizing: border-box;
	}

	.form-input::placeholder {
		color: #94a3b8;
	}

	.form-input:focus {
		box-shadow: inset 2px 2px 5px #c5cdd8, inset -2px -2px 5px #ffffff;
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
		border-radius: 8px;
		border: none;
		background: #e8ecf1;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		font-size: 0.875rem;
		color: #1a1a2e;
		outline: none;
		cursor: pointer;
	}

	.form-checkbox {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #475569;
		cursor: pointer;
		white-space: nowrap;
	}

	.form-checkbox input[type="checkbox"] {
		accent-color: #6366f1;
	}

	/* Customer mode toggle */
	.customer-mode-toggle {
		display: flex;
		gap: 0;
		margin-bottom: 0.75rem;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.toggle-btn {
		flex: 1;
		padding: 0.4rem 0.75rem;
		border: none;
		background: #f8fafc;
		color: #64748b;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.toggle-btn:first-child {
		border-right: 1px solid #e2e8f0;
	}

	.toggle-btn.active {
		background: #6366f1;
		color: #ffffff;
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
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
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
		transition: background 100ms;
	}

	.customer-dropdown__item:hover {
		background: #f1f5f9;
	}

	.customer-dropdown__name {
		font-size: 0.875rem;
		color: #1a1a2e;
		font-weight: 500;
	}

	.customer-dropdown__email {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.selected-customer {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #f1f5f9;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #1a1a2e;
		font-weight: 500;
	}

	.selected-customer__email {
		font-weight: 400;
		color: #94a3b8;
		font-size: 0.8125rem;
	}

	.selected-customer__clear {
		margin-left: auto;
		display: flex;
		align-items: center;
		padding: 0.25rem;
		border-radius: 6px;
		border: none;
		background: #e2e8f0;
		color: #64748b;
		cursor: pointer;
	}

	.selected-customer__clear:hover {
		background: #cbd5e1;
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
		background: #e8ecf1;
		border-radius: 8px;
		padding: 0.1875rem;
	}

	.volume-mode-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
		background: transparent;
		color: #94a3b8;
	}

	.volume-mode-btn:hover {
		color: #475569;
	}

	.volume-mode-btn.active {
		background: #6366f1;
		color: #ffffff;
		box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Photo upload */
	.photo-dropzone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2.5rem 1.5rem;
		border: 2px dashed #cbd5e1;
		border-radius: 12px;
		background: #f8fafc;
		color: #94a3b8;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.photo-dropzone:hover {
		border-color: #6366f1;
		background: #f5f3ff;
		color: #6366f1;
	}

	.photo-dropzone.dragging {
		border-color: #6366f1;
		background: #ede9fe;
		color: #6366f1;
	}

	.photo-dropzone p {
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 500;
	}

	.photo-dropzone__hint {
		font-size: 0.75rem;
	}

	.photo-file-input {
		display: none;
	}

	.photo-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
	}

	.photo-thumb {
		position: relative;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 2px 2px 6px #d1d9e6;
	}

	.photo-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.photo-thumb__remove {
		position: absolute;
		top: 4px;
		right: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: none;
		background: rgba(0, 0, 0, 0.55);
		color: #ffffff;
		cursor: pointer;
		opacity: 0;
		transition: opacity 100ms;
	}

	.photo-thumb:hover .photo-thumb__remove {
		opacity: 1;
	}

	.photo-count {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.video-selected {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #f0f2f5;
		border-radius: 10px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.video-selected__info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.video-selected__name {
		font-size: 0.875rem;
		color: #1a1a2e;
		font-weight: 500;
	}

	.video-selected__size {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.video-queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.video-add-more-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border: 2px dashed #cbd5e1;
		border-radius: 8px;
		background: none;
		color: #64748b;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.video-add-more-btn:hover {
		border-color: #6366f1;
		color: #6366f1;
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
		font-size: 0.8125rem;
		font-weight: 500;
		color: #64748b;
		margin-bottom: 0.25rem;
	}

	.create-section__error {
		margin: 0 0 0.75rem;
		font-size: 0.8125rem;
		color: #ef4444;
	}

	.create-section__submit {
		display: block;
		width: 100%;
		padding: 0.75rem;
		border-radius: 10px;
		font-size: 0.9375rem;
		font-weight: 700;
		color: #ffffff;
		background: #6366f1;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.create-section__submit:hover:not(:disabled) {
		background: #4f46e5;
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
		background: #ffffff;
		border: none;
		border-radius: 10px;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
		padding: 0.25rem;
	}

	.tab {
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #94a3b8;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.tab:hover {
		color: #475569;
	}

	.tab.active {
		background: #6366f1;
		color: #ffffff;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #e8ecf1;
		border: none;
		border-radius: 10px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		padding: 0 0.75rem;
		color: #94a3b8;
	}

	.search-box input {
		background: transparent;
		border: none;
		color: #1a1a2e;
		padding: 0.5rem 0;
		font-size: 0.875rem;
		outline: none;
		width: 200px;
	}

	.search-box input::placeholder {
		color: #94a3b8;
	}

	.cell-name {
		color: #1a1a2e;
		font-weight: 500;
	}

	.cell-email {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.text-muted {
		color: #cbd5e1;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.pagination button {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: 8px;
		color: #64748b;
		border: none;
		background: #ffffff;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.pagination button:hover:not(:disabled) {
		color: #1a1a2e;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.pagination button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
