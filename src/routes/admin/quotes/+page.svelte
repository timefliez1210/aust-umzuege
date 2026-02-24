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
	let customerSearch = $state('');
	let customerResults = $state<CustomerMatch[]>([]);
	let selectedCustomer = $state<CustomerMatch | null>(null);
	let customerSearchLoading = $state(false);
	let showCustomerDropdown = $state(false);

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
	let photoFileInput: HTMLInputElement;

	// Video upload
	let videoFile = $state<File | null>(null);
	let videoFileInput: HTMLInputElement;

	function handleVideoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file && file.type.startsWith('video/')) {
			if (file.size > 500 * 1024 * 1024) {
				createError = 'Video zu gross (max. 500 MB)';
				return;
			}
			videoFile = file;
			createError = '';
		}
	}

	function removeVideo() {
		videoFile = null;
		if (videoFileInput) videoFileInput.value = '';
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

	function setFilter(value: string) {
		statusFilter = value;
		offset = 0;
		loadQuotes();
	}

	function handleSearch() {
		offset = 0;
		loadQuotes();
	}

	function prevPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			loadQuotes();
		}
	}

	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadQuotes();
		}
	}

	let customerSearchTimer: ReturnType<typeof setTimeout> | null = null;

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

	function handleCustomerSearchInput() {
		if (customerSearchTimer) clearTimeout(customerSearchTimer);
		customerSearchTimer = setTimeout(searchCustomers, 250);
	}

	function selectCustomer(c: CustomerMatch) {
		selectedCustomer = c;
		customerSearch = c.name || c.email;
		showCustomerDropdown = false;
	}

	function clearCustomer() {
		selectedCustomer = null;
		customerSearch = '';
		customerResults = [];
	}

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

	function addPhotos(files: FileList | File[]) {
		for (const file of files) {
			if (!file.type.startsWith('image/')) continue;
			if (photoFiles.some(f => f.name === file.name && f.size === file.size)) continue;
			photoFiles = [...photoFiles, file];
			const url = URL.createObjectURL(file);
			photoPreviews = [...photoPreviews, url];
		}
	}

	function removePhoto(index: number) {
		URL.revokeObjectURL(photoPreviews[index]);
		photoFiles = photoFiles.filter((_, i) => i !== index);
		photoPreviews = photoPreviews.filter((_, i) => i !== index);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		draggingOver = false;
		if (e.dataTransfer?.files) addPhotos(e.dataTransfer.files);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		draggingOver = true;
	}

	function handleDragLeave() {
		draggingOver = false;
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) addPhotos(input.files);
		input.value = '';
	}

	async function handleCreateQuote() {
		if (!selectedCustomer) {
			createError = 'Bitte Kunde auswählen';
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
			const body: Record<string, unknown> = {
				customer_id: selectedCustomer.id,
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

			// 3. If video mode, upload video to video endpoint
			if (volumeMode === 'video' && videoFile) {
				createError = '';
				const formData = new FormData();
				formData.append('quote_id', res.id);
				formData.append('video', videoFile);
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
					{#if videoFile}
						<div class="video-selected">
							<Video size={20} />
							<div class="video-selected__info">
								<span class="video-selected__name">{videoFile.name}</span>
								<span class="video-selected__size">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
							</div>
							<button class="photo-thumb__remove" onclick={removeVideo}>
								<Trash2 size={12} />
							</button>
						</div>
					{:else}
						<div
							class="photo-dropzone"
							role="button"
							tabindex="0"
							onclick={() => videoFileInput.click()}
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') videoFileInput.click(); }}
						>
							<Video size={32} />
							<p>Video auswaehlen</p>
							<span class="photo-dropzone__hint">MP4, MOV, WebM — Raum-Rundgang fuer 3D-Analyse (max. 500 MB)</span>
						</div>
					{/if}
					<input
						type="file"
						accept="video/*"
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
						<label>Wunschdatum</label>
						<input type="date" bind:value={preferredDate} class="form-input" />
					</div>
					<div class="details-field">
						<label>Entfernung (km)</label>
						<input type="number" bind:value={distanceKm} placeholder="optional" class="form-input" min="0" step="1" />
					</div>
				</div>
				<div class="details-field" style="margin-top: 0.75rem;">
					<label>Notizen</label>
					<textarea bind:value={extraNotes} rows="2" placeholder="Weitere Hinweise..." class="form-input form-textarea"></textarea>
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
