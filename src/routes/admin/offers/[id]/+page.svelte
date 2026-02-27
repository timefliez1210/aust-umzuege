<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiPatch, apiDownload, formatDate, formatEuro, API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import PriceInput from '$lib/components/admin/PriceInput.svelte';
	import ImageLightbox from '$lib/components/admin/ImageLightbox.svelte';
	import RouteMap from '$lib/components/admin/RouteMap.svelte';
	import { ROW_OPTIONS, rowToLabel, COST_PER_PERSON_HOUR, calculateLaborCents, calculateNonLaborCents, calculateBruttoCents, calculateLaborProfit, reverseCalculateRate } from '$lib/utils/pricing';
	import { ArrowLeft, Send, XCircle, Download, RefreshCw, RotateCcw, Trash2, Pencil, Save, Plus, X } from 'lucide-svelte';

	interface LineItem {
		label: string;
		remark: string | null;
		quantity: number;
		unit_price_cents: number;
		total_cents: number;
		is_labor: boolean;
	}

	interface EditLineItem {
		row: number;
		label: string;
		remark: string;
		quantity: number;
		unit_price_cents: number;
	}

	interface OfferDetail {
		id: string;
		offer_number: string | null;
		quote_id: string;
		customer_name: string;
		customer_email: string;
		origin_address: string;
		destination_address: string;
		volume_m3: number;
		distance_km: number;
		persons: number;
		hours: number;
		rate_cents: number;
		total_netto_cents: number;
		total_brutto_cents: number;
		line_items: LineItem[];
		status: string;
		valid_until: string | null;
		pdf_url: string | null;
		created_at: string;
		items: OfferItem[];
		email_subject: string;
		email_body: string;
	}

	interface OfferItem {
		name: string;
		volume_m3: number;
		quantity: number;
		crop_url: string | null;
		source_image_url: string | null;
		bbox: number[] | null;
	}

	let offer = $state<OfferDetail | null>(null);
	let loading = $state(true);
	let editing = $state(false);
	let saving = $state(false);

	// Email draft state
	let emailSubject = $state('');
	let emailBody = $state('');

	// Route map coordinates
	let routeCoordinates = $state<[number, number][] | null>(null);

	// Editable state
	let editPersons = $state(2);
	let editHours = $state(3);
	let editRateCents = $state(3000);
	let editBruttoCents = $state(0);
	let editLineItems = $state<EditLineItem[]>([]);

	// Rate text for smooth editing
	let rateText = $state('30.00');
	let rateEditing = $state(false);

	// Lightbox state
	let lightboxItem = $state<OfferItem | null>(null);

	// Derived calculations
	let laborCents = $derived(calculateLaborCents(editPersons, editHours, editRateCents));
	let nonLaborCents = $derived(calculateNonLaborCents(editLineItems));
	let calculatedNettoCents = $derived(nonLaborCents + laborCents);
	let calculatedBruttoCents = $derived(calculateBruttoCents(calculatedNettoCents));
	let laborProfit = $derived(calculateLaborProfit(editPersons, editHours, editRateCents));

	$effect(() => {
		if (!rateEditing) {
			rateText = (editRateCents / 100).toFixed(2);
		}
	});

	$effect(() => {
		loadOffer();
	});

	async function loadOffer() {
		loading = true;
		try {
			const id = $page.params.id;
			offer = await apiGet<OfferDetail>(`/api/v1/admin/offers/${id}`);
			emailSubject = offer.email_subject;
			emailBody = offer.email_body;

			// Fetch route geometry from distance calculator (non-blocking)
			if (offer.origin_address && offer.destination_address) {
				apiPost<{ legs: { geometry: [number, number][] }[] }>(`/api/v1/distance/calculate`, {
					addresses: [offer.origin_address, offer.destination_address]
				})
					.then((r) => {
						const geo = r.legs?.[0]?.geometry;
						// geometry is [[lng, lat], ...] — swap to [lat, lng] for Leaflet
						routeCoordinates = geo?.length >= 2
							? geo.map(([lng, lat]) => [lat, lng] as [number, number])
							: null;
					})
					.catch(() => { routeCoordinates = null; });
			}
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			loading = false;
		}
	}

	function startEditing() {
		if (!offer) return;
		editPersons = offer.persons;
		editHours = offer.hours;
		editRateCents = offer.rate_cents;
		editBruttoCents = offer.total_brutto_cents;
		// Map non-labor line items to editable - try to recover row from label
		editLineItems = offer.line_items.filter(li => !li.is_labor).map(li => {
			const match = ROW_OPTIONS.find(r => r.label === li.label);
			return {
				row: match?.row ?? 99,
				label: li.label,
				remark: li.remark ?? '',
				quantity: li.quantity,
				unit_price_cents: li.unit_price_cents,
			};
		});
		editing = true;
	}

	function cancelEditing() {
		editing = false;
	}

	function onBruttoChange() {
		const rate = reverseCalculateRate(editBruttoCents, nonLaborCents, editPersons, editHours);
		if (rate > 0) {
			editRateCents = rate;
		}
	}

	function addLineItem() {
		editLineItems = [...editLineItems, { row: 39, label: 'Transporter', remark: '', quantity: 1, unit_price_cents: 6000 }];
	}

	function removeLineItem(idx: number) {
		editLineItems = editLineItems.filter((_, i) => i !== idx);
	}

	function onLineItemRowChange(idx: number) {
		const item = editLineItems[idx];
		if (item.row === 99) {
			item.label = '';
			item.remark = '';
			item.unit_price_cents = 0;
		} else {
			item.label = rowToLabel(item.row);
			item.remark = '';
		}
		editLineItems = [...editLineItems];
	}

	async function saveOffer() {
		if (!offer) return;
		saving = true;
		try {
			// Build line_items_json in the format the backend stores
			const lineItemsJson = editLineItems.map(li => ({
				description: li.label,
				quantity: li.quantity,
				unit_price: li.unit_price_cents / 100,
				is_labor: false,
				...(li.remark ? { remark: li.remark } : { remark: null }),
			}));

			// First PATCH the offer with new pricing + line items
			await apiPatch(`/api/v1/admin/offers/${offer.id}`, {
				price_netto_cents: calculatedNettoCents,
				persons: editPersons,
				hours: editHours,
				rate_per_hour_cents: editRateCents,
				line_items_json: lineItemsJson,
			});

			// Then regenerate to produce new PDF (include line items so they're preserved)
			await apiPost(`/api/v1/admin/offers/${offer.id}/regenerate`, {
				persons: editPersons,
				hours: editHours,
				rate: editRateCents / 100,
				price_cents: calculatedNettoCents,
				line_items: editLineItems.map(li => ({
					description: li.label,
					quantity: li.quantity,
					unit_price: li.unit_price_cents / 100,
					...(li.remark ? { remark: li.remark } : {}),
				})),
			});

			showToast('Angebot aktualisiert', 'success');
			editing = false;
			await loadOffer();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			saving = false;
		}
	}

	async function regenerateOffer() {
		if (!offer) return;
		try {
			await apiPost(`/api/v1/admin/offers/${offer.id}/regenerate`, {});
			showToast('Angebot wird neu erstellt...', 'success');
			await loadOffer();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function reEstimateOffer() {
		if (!offer) return;
		if (!confirm('Entfernung neu berechnen und Angebot neu erstellen?')) return;
		try {
			await apiPost(`/api/v1/admin/offers/${offer.id}/re-estimate`, {});
			showToast('Angebot wird neu berechnet...', 'success');
			await loadOffer();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function sendOffer() {
		if (!offer) return;
		if (!confirm('Angebot an Kunden senden?')) return;
		try {
			await apiPost(`/api/v1/admin/offers/${offer.id}/send`, {
				email_subject: emailSubject,
				email_body: emailBody,
			});
			showToast('Angebot gesendet', 'success');
			await loadOffer();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function rejectOffer() {
		if (!offer) return;
		if (!confirm('Angebot verwerfen?')) return;
		try {
			await apiPost(`/api/v1/admin/offers/${offer.id}/reject`);
			showToast('Angebot verworfen', 'success');
			await loadOffer();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function deleteOffer() {
		if (!offer) return;
		if (!confirm('Angebot unwiderruflich loeschen?')) return;
		try {
			await apiPost(`/api/v1/admin/offers/${offer.id}/delete`);
			showToast('Angebot geloescht', 'success');
			goto('/admin/offers');
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}
</script>

<div class="page">
	<a href="/admin/offers" class="back-link">
		<ArrowLeft size={16} />
		Zurueck zu Angebote
	</a>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if offer}
		<div class="page-header">
			<div class="header-left">
				<h1>{offer.offer_number || 'Angebot'}</h1>
				<StatusBadge status={offer.status} />
			</div>
			<div class="header-actions">
				{#if editing}
					<button class="btn btn-primary" onclick={saveOffer} disabled={saving}>
						<Save size={16} />
						{saving ? 'Speichern...' : 'Speichern & PDF'}
					</button>
					<button class="btn btn-outline" onclick={cancelEditing}>
						Abbrechen
					</button>
				{:else}
					{#if offer.pdf_url}
						<button
							class="btn btn-outline"
							onclick={async () => {
								try {
									await apiDownload(`/api/v1/offers/${offer!.id}/pdf`, `${offer!.offer_number || 'Angebot'}.pdf`);
								} catch (e) {
									showToast((e as Error).message, 'error');
								}
							}}
						>
							<Download size={16} />
							PDF
						</button>
					{/if}
					<button class="btn btn-outline" onclick={startEditing}>
						<Pencil size={16} />
						Bearbeiten
					</button>
					<a href="/admin/quotes/{offer.quote_id}" class="btn btn-outline">
						Anfrage
					</a>
					<button class="btn btn-outline" onclick={reEstimateOffer} title="Neu berechnen">
						<RotateCcw size={16} />
						Neu berechnen
					</button>
					<button class="btn btn-outline" onclick={regenerateOffer}>
						<RefreshCw size={16} />
					</button>
					<button class="btn btn-primary" onclick={sendOffer}>
						<Send size={16} />
						Senden
					</button>
					<button class="btn btn-danger-outline" onclick={rejectOffer}>
						<XCircle size={16} />
					</button>
					<button class="btn btn-danger" onclick={deleteOffer} title="Loeschen">
						<Trash2 size={16} />
					</button>
				{/if}
			</div>
		</div>

		<div class="editor-grid">
			<!-- Customer & Route Info -->
			<div class="card">
				<h3>Auftrag</h3>
				<div class="info-rows">
					<div class="info-row">
						<span class="info-label">Kunde</span>
						<span class="info-value">{offer.customer_name}</span>
					</div>
					<div class="info-row">
						<span class="info-label">E-Mail</span>
						<span class="info-value">{offer.customer_email}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Route</span>
						<span class="info-value">{offer.origin_address} &rarr; {offer.destination_address}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Volumen</span>
						<span class="info-value">{offer.volume_m3.toFixed(1)} m&sup3;</span>
					</div>
					<div class="info-row">
						<span class="info-label">Entfernung</span>
						<span class="info-value">{offer.distance_km.toFixed(1)} km</span>
					</div>
					<div class="info-row">
						<span class="info-label">Erstellt</span>
						<span class="info-value">{formatDate(offer.created_at)}</span>
					</div>
				</div>
			</div>

			<!-- Pricing -->
			<div class="card">
				<h3>Preisgestaltung</h3>
				{#if editing}
					<div class="pricing-section">
						<PriceInput
							bind:bruttoCents={editBruttoCents}
							label="Gesamtpreis"
						/>

						<div class="pricing-fields">
							<div class="field">
								<label for="persons">Helfer</label>
								<input
									id="persons"
									type="number"
									min={1}
									max={10}
									bind:value={editPersons}
								/>
							</div>
							<div class="field">
								<label for="hours">Stunden</label>
								<input
									id="hours"
									type="number"
									min={1}
									max={24}
									step={0.5}
									bind:value={editHours}
								/>
							</div>
							<div class="field">
								<label for="rate">Stundensatz (EUR)</label>
								<input
									id="rate"
									type="number"
									step={0.5}
									value={rateEditing ? rateText : (editRateCents / 100).toFixed(2)}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										rateText = target.value;
										const val = parseFloat(target.value);
										if (!isNaN(val)) editRateCents = Math.round(val * 100);
									}}
									onfocus={() => { rateEditing = true; }}
									onblur={() => { rateEditing = false; }}
								/>
							</div>
						</div>

						<button class="btn-link" onclick={onBruttoChange}>
							Rate aus Gesamtpreis berechnen
						</button>
						<span class="labor-profit" class:negative={laborProfit < 0}>{laborProfit.toFixed(2)} &euro;</span>
					</div>
				{:else}
					<div class="info-rows">
						<div class="info-row">
							<span class="info-label">Helfer</span>
							<span class="info-value">{offer.persons}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Stunden</span>
							<span class="info-value">{offer.hours}</span>
						</div>
						<div class="info-row">
							<span class="info-label">Stundensatz</span>
							<span class="info-value">{(offer.rate_cents / 100).toFixed(2)} EUR</span>
						</div>
						<div class="info-row highlight">
							<span class="info-label">Netto</span>
							<span class="info-value">{formatEuro(offer.total_netto_cents)}</span>
						</div>
						<div class="info-row highlight">
							<span class="info-label">Brutto (inkl. 19% MwSt.)</span>
							<span class="info-value price">{formatEuro(offer.total_brutto_cents)}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Line Items -->
			<div class="card full-width">
				<div class="card-header">
					<h3>Positionen</h3>
					{#if editing}
						<button class="btn btn-sm" onclick={addLineItem}>
							<Plus size={14} />
							Position
						</button>
					{/if}
				</div>

				{#if editing}
					<div class="line-items">
						<!-- Labor -->
						<div class="line-item">
							<span class="li-name">{editPersons} Umzugshelfer</span>
							<div class="li-detail">
								<span class="li-qty">{editHours} Std.</span>
								<span class="li-unit">&times; {(editRateCents / 100).toFixed(2)} EUR</span>
								<span class="li-total">{formatEuro(laborCents)}</span>
							</div>
						</div>

						{#each editLineItems as li, idx}
							<div class="line-item editable">
								<div class="li-edit-top">
									<select bind:value={li.row} onchange={() => onLineItemRowChange(idx)}>
										{#each ROW_OPTIONS as opt}
											<option value={opt.row}>{opt.label}</option>
										{/each}
									</select>
									{#if li.row === 99}
										<input
											type="text"
											class="edit-label"
											bind:value={li.label}
											placeholder="Bezeichnung"
										/>
									{/if}
									<button class="btn-icon-sm" onclick={() => removeLineItem(idx)}>
										<X size={14} />
									</button>
								</div>
								<div class="li-edit-bottom">
									<input
										type="text"
										class="edit-remark"
										bind:value={li.remark}
										placeholder="Bemerkung"
									/>
									<input
										type="number"
										class="edit-qty"
										min={1}
										step={1}
										bind:value={li.quantity}
										placeholder="Anz."
									/>
									<span class="li-times">&times;</span>
									<input
										type="number"
										class="edit-price"
										min={0}
										step={100}
										bind:value={li.unit_price_cents}
										placeholder="Cent"
									/>
									<span class="li-cent-label">ct</span>
									<span class="li-total">{formatEuro(li.quantity * li.unit_price_cents)}</span>
								</div>
							</div>
						{/each}

						<div class="line-item total">
							<span class="li-name">Netto</span>
							<span class="li-total">{formatEuro(calculatedNettoCents)}</span>
						</div>
						<div class="line-item total grand">
							<span class="li-name">Brutto (inkl. 19% MwSt.)</span>
							<span class="li-total">{formatEuro(calculatedBruttoCents)}</span>
						</div>
					</div>
				{:else}
					<div class="line-items">
						<!-- Labor -->
						<div class="line-item">
							<span class="li-name">{offer.persons} Umzugshelfer</span>
							<div class="li-detail">
								<span class="li-qty">{offer.hours} Std.</span>
								<span class="li-unit">&times; {(offer.rate_cents / 100).toFixed(2)} EUR</span>
								<span class="li-total">{formatEuro(offer.persons * offer.hours * offer.rate_cents)}</span>
							</div>
						</div>

						{#each offer.line_items.filter(x => !x.is_labor) as li}
							<div class="line-item">
								<div>
									<span class="li-name">{li.label}</span>
									{#if li.remark}
										<span class="li-remark">{li.remark}</span>
									{/if}
								</div>
								<div class="li-detail">
									<span class="li-qty">{li.quantity}</span>
									<span class="li-unit">&times; {(li.unit_price_cents / 100).toFixed(2)} EUR</span>
									<span class="li-total">{formatEuro(li.total_cents)}</span>
								</div>
							</div>
						{/each}

						<div class="line-item total">
							<span class="li-name">Netto</span>
							<span class="li-total">{formatEuro(offer.total_netto_cents)}</span>
						</div>
						<div class="line-item total grand">
							<span class="li-name">Brutto (inkl. 19% MwSt.)</span>
							<span class="li-total">{formatEuro(offer.total_brutto_cents)}</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Email Draft -->
			<div class="card full-width">
				<h3>E-Mail an {offer.customer_email}</h3>
				<div class="email-draft">
					<div class="field">
						<label for="email-subject">Betreff</label>
						<input id="email-subject" type="text" bind:value={emailSubject} />
					</div>
					<div class="field">
						<label for="email-body">Nachricht</label>
						<textarea id="email-body" rows={8} bind:value={emailBody}></textarea>
					</div>
					<span class="email-hint">PDF wird automatisch angehängt</span>
				</div>
			</div>

			<!-- Route Map -->
			{#if routeCoordinates && offer}
				<RouteMap coordinates={routeCoordinates} distanceKm={offer.distance_km} />
			{/if}

			<!-- Detected Items -->
			{#if offer.items && offer.items.length > 0}
				<div class="card full-width">
					<h3>Erfasste Gegenstaende</h3>
					<div class="items-table-wrap">
						<table class="items-table">
							<thead>
								<tr>
									<th class="th-foto">Foto</th>
									<th>Gegenstand</th>
									<th>Anzahl</th>
									<th>Volumen (m3)</th>
								</tr>
							</thead>
							<tbody>
								{#each offer.items as item}
									<tr>
										<td class="crop-cell">
											{#if item.crop_url}
												<button class="crop-btn" onclick={() => { lightboxItem = item; }}>
													<img src={API_BASE + item.crop_url} alt={item.name} class="crop-thumb" />
												</button>
											{:else}
												<span class="no-crop">—</span>
											{/if}
										</td>
										<td>{item.name}</td>
										<td>{item.quantity}</td>
										<td>{item.volume_m3.toFixed(2)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if lightboxItem && lightboxItem.source_image_url}
	<ImageLightbox
		imageUrl={API_BASE + lightboxItem.source_image_url}
		bbox={lightboxItem.bbox}
		itemName={lightboxItem.name}
		volumeM3={lightboxItem.volume_m3}
		imageWidth={4000}
		imageHeight={3000}
		onclose={() => { lightboxItem = null; }}
	/>
{/if}

<style>
	.page {
		max-width: 1200px;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		text-decoration: none;
		margin-bottom: 1rem;
		transition: color 150ms ease;
	}

	.back-link:hover {
		color: #6366f1;
	}

	.loading {
		color: #94a3b8;
		padding: 2rem;
		text-align: center;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.header-left h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.editor-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.card {
		background: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 0.75rem;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		margin-bottom: 0;
	}

	.info-rows {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.info-row.highlight {
		padding-top: 0.5rem;
		border-top: 1px solid #f1f5f9;
	}

	.info-label {
		font-size: 0.8125rem;
		color: #94a3b8;
		flex-shrink: 0;
	}

	.info-value {
		font-size: 0.8125rem;
		color: #334155;
		text-align: right;
	}

	.info-value.price {
		font-weight: 700;
		color: #1a1a2e;
		font-size: 0.9375rem;
	}

	/* Pricing edit mode */
	.pricing-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.pricing-fields {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
	}

	.field input {
		background: #e8ecf1;
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
		outline: none;
		font-family: inherit;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.field input:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.btn-link {
		color: #6366f1;
		font-size: 0.75rem;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.btn-link:hover {
		color: #4f46e5;
	}

	.labor-profit {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #22c55e;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}

	.labor-profit.negative {
		color: #ef4444;
	}

	/* Email Draft */
	.email-draft {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.email-draft textarea {
		background: #e8ecf1;
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		padding: 0.625rem;
		font-size: 0.8125rem;
		font-family: inherit;
		outline: none;
		resize: vertical;
		line-height: 1.5;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.email-draft textarea:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.email-draft input {
		background: #e8ecf1;
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		padding: 0.5rem 0.625rem;
		font-size: 0.8125rem;
		font-family: inherit;
		outline: none;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.email-draft input:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.email-hint {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	/* Line Items */
	.line-items {
		display: flex;
		flex-direction: column;
	}

	.line-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.line-item.editable {
		padding: 0.5rem 0;
	}

	.line-item.total {
		border-bottom: none;
		border-top: 1px solid #e2e8f0;
		padding-top: 0.75rem;
	}

	.line-item.grand {
		border-top: none;
		padding-top: 0.25rem;
	}

	.line-item.grand .li-name,
	.line-item.grand .li-total {
		font-size: 1rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.li-name {
		font-size: 0.875rem;
		color: #334155;
		font-weight: 500;
	}

	.li-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.li-qty {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.li-unit {
		font-size: 0.8125rem;
		color: #cbd5e1;
	}

	.li-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1a1a2e;
		min-width: 80px;
		text-align: right;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}

	/* Editable line item rows */
	.line-item.editable {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.375rem;
		padding: 0.5rem 0;
	}

	.li-edit-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.li-edit-top select {
		background: #e8ecf1;
		border: none;
		border-radius: 6px;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: #334155;
		outline: none;
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff;
		min-width: 140px;
	}

	.li-edit-bottom {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-qty,
	.edit-price {
		background: #e8ecf1;
		border: none;
		border-radius: 6px;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: #334155;
		outline: none;
		width: 70px;
		text-align: right;
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff;
	}

	.edit-qty:focus,
	.edit-price:focus {
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.edit-label {
		background: #e8ecf1;
		border: none;
		border-radius: 6px;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: #334155;
		outline: none;
		flex: 1;
		min-width: 100px;
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff;
	}

	.edit-label:focus {
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.edit-remark {
		background: #e8ecf1;
		border: none;
		border-radius: 6px;
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		color: #64748b;
		outline: none;
		flex: 1;
		min-width: 80px;
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff;
	}

	.edit-remark:focus {
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.li-remark {
		display: block;
		font-size: 0.75rem;
		color: #94a3b8;
		margin-top: 0.125rem;
	}

	.li-times {
		color: #cbd5e1;
		font-size: 0.8125rem;
	}

	.li-cent-label {
		color: #94a3b8;
		font-size: 0.75rem;
	}

	.btn-icon-sm {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: none;
		background: none;
		color: #cbd5e1;
		cursor: pointer;
		transition: color 150ms ease;
	}

	.btn-icon-sm:hover {
		color: #ef4444;
	}

	/* Items table */
	.items-table-wrap {
		overflow-x: auto;
	}

	.items-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.items-table th {
		text-align: left;
		color: #64748b;
		font-weight: 600;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid #e2e8f0;
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.items-table td {
		padding: 0.5rem 0.75rem;
		color: #334155;
		border-bottom: 1px solid #f1f5f9;
	}

	.th-foto {
		width: 60px;
	}

	.crop-cell {
		width: 60px;
		padding: 0.25rem 0.75rem !important;
	}

	.crop-btn {
		display: block;
		background: none;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 0;
		cursor: pointer;
		overflow: hidden;
		transition: border-color 150ms ease;
	}

	.crop-btn:hover {
		border-color: #6366f1;
	}

	.crop-thumb {
		display: block;
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: 0.25rem;
	}

	.no-crop {
		color: #cbd5e1;
		font-size: 0.75rem;
	}

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 500;
		transition: all 150ms ease;
		text-decoration: none;
		cursor: pointer;
	}

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		border: none;
		color: #64748b;
		background: #e8ecf1;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
	}

	.btn-sm:hover {
		color: #1a1a2e;
	}

	.btn-outline {
		background: #ffffff;
		border: none;
		color: #64748b;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.btn-outline:hover {
		color: #1a1a2e;
		box-shadow: 4px 4px 10px #d1d9e6, -4px -4px 10px #ffffff;
	}

	.btn-primary {
		background: #6366f1;
		color: #ffffff;
		border: none;
		box-shadow: 3px 3px 10px rgba(99, 102, 241, 0.3);
	}

	.btn-primary:hover {
		background: #4f46e5;
	}

	.btn-danger-outline {
		background: #ffffff;
		border: none;
		color: #94a3b8;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.btn-danger-outline:hover {
		color: #ef4444;
	}

	.btn-danger {
		background: #ffffff;
		border: none;
		color: #94a3b8;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.btn-danger:hover {
		color: #ef4444;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.editor-grid {
			grid-template-columns: 1fr;
		}

		.pricing-fields {
			grid-template-columns: 1fr;
		}

		.li-edit-top select {
			min-width: 0;
			flex: 1;
		}

		.edit-qty,
		.edit-price {
			width: 60px;
		}

		.info-row {
			flex-wrap: wrap;
		}

		.card {
			max-width: 100%;
			overflow-x: auto;
		}

		.line-items {
			max-width: 100%;
			overflow-x: auto;
		}

		.items-table-wrap {
			max-width: 100%;
		}

		.btn { min-height: 44px; }
		.btn-sm { min-height: 44px; }
	}
</style>
