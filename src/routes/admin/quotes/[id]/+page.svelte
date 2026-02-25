<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiFetch, apiGet, apiPatch, apiPost, apiPut, apiDelete, formatDate, formatEuro, API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import PriceInput from '$lib/components/admin/PriceInput.svelte';
	import RouteMap from '$lib/components/admin/RouteMap.svelte';
	import { ArrowLeft, Save, FileOutput, Trash2, X, Pencil, Plus, ChevronLeft, ChevronRight, Upload, Video } from 'lucide-svelte';

	interface Address {
		id: string;
		street: string;
		city: string;
		postal_code: string | null;
		floor: string | null;
		elevator: boolean | null;
	}

	interface Customer {
		id: string;
		name: string | null;
		email: string;
		phone: string | null;
	}

	interface EstimationItem {
		name: string;
		volume_m3: number;
		quantity: number;
		confidence: number;
		crop_url: string | null;
		source_image_url: string | null;
		bbox: number[] | null;
		crop_s3_key?: string | null;
		bbox_image_index?: number | null;
		seen_in_images?: number[] | null;
		category?: string | null;
		dimensions?: unknown | null;
	}

	interface Estimation {
		id: string;
		method: string;
		total_volume_m3: number;
		items: EstimationItem[];
		source_images: string[];
		source_videos: string[];
	}

	interface OfferSummary {
		id: string;
		total_brutto_cents: number | null;
		status: string;
		created_at: string;
	}

	interface OfferLineItemDetail {
		label: string;
		quantity: number;
		unit_price_cents: number;
		total_cents: number;
		is_labor: boolean;
	}

	interface LatestOfferPricing {
		offer_id: string;
		persons: number;
		hours: number;
		rate_cents: number;
		total_netto_cents: number;
		total_brutto_cents: number;
		line_items: OfferLineItemDetail[];
	}

	interface QuoteDetail {
		quote: {
			id: string;
			volume_m3: number | null;
			distance_km: number;
			notes: string | null;
			status: string;
			customer_message: string | null;
			created_at: string;
		};
		customer: Customer;
		origin_address: Address | null;
		destination_address: Address | null;
		estimation: Estimation | null;
		offers: OfferSummary[];
		latest_offer: LatestOfferPricing | null;
	}

	interface EditableItem {
		name: string;
		volume_m3: number;
		quantity: number;
		confidence: number;
		crop_url: string | null;
		source_image_url: string | null;
		bbox: number[] | null;
		crop_s3_key: string | null;
		bbox_image_index: number | null;
		seen_in_images: number[] | null;
		category: string | null;
		dimensions: unknown | null;
	}

	function floorLabel(floor: string | null): string {
		if (!floor) return 'EG';
		const labels: Record<string, string> = {
			'0': 'Erdgeschoss', '1': '1. OG', '2': '2. OG', '3': '3. OG',
			'4': '4. OG', '5': '5. OG', '-1': 'Keller'
		};
		return labels[floor] || `${floor}. OG`;
	}

	function parseFloor(floor: string | null): number {
		if (!floor) return 0;
		const s = floor.trim();
		if (s === 'Erdgeschoss' || s === 'Hochparterre' || s === '0') return 0;
		if (s === 'Höher als 6. Stock') return 7;
		const m = s.match(/^(\d+)/);
		return m ? parseInt(m[1]) : 0;
	}

	let data = $state<QuoteDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let savingItems = $state(false);

	// Route map coordinates
	let routeCoordinates = $state<[number, number][] | null>(null);

	// Editable fields
	let editVolume = $state<number | null>(null);
	let editDistance = $state(0);
	let editNotes = $state('');

	// Pricing fields
	let editPersons = $state(2);
	let editHours = $state(3);
	let editRateCents = $state(3000);
	let editBruttoCents = $state(0);
	let priceDirty = $state(false);

	// Local string state for rate input to avoid cursor-resetting
	let rateText = $state('30.00');
	let rateEditing = $state(false);

	let editingOrigin = $state(false);
	let editingDest = $state(false);
	let editOrigin = $state({ street: '', postal_code: '', city: '', floor: '0', elevator: false });
	let editDest = $state({ street: '', postal_code: '', city: '', floor: '0', elevator: false });

	// Editable items
	let editItems = $state<EditableItem[]>([]);
	let itemsDirty = $state(false);

	// Items sorting
	let sortKey = $state<'name' | 'quantity' | 'volume_m3' | null>(null);
	let sortAsc = $state(true);

	function toggleSort(key: 'name' | 'quantity' | 'volume_m3') {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	let sortedItems = $derived(() => {
		let items = editItems;
		// Apply photo filter
		if (filterPhotoIndex !== null) {
			const idx = filterPhotoIndex;
			items = items.filter(item =>
				item.bbox_image_index === idx ||
				(item.seen_in_images && item.seen_in_images.includes(idx))
			);
		}
		if (!sortKey) return items;
		const k = sortKey;
		const dir = sortAsc ? 1 : -1;
		return [...items].sort((a, b) => {
			const av = a[k];
			const bv = b[k];
			if (typeof av === 'string' && typeof bv === 'string') {
				return av.localeCompare(bv, 'de') * dir;
			}
			return ((av as number) - (bv as number)) * dir;
		});
	});

	// Live-computed total volume from editable items
	let computedTotal = $derived(
		editItems.reduce((sum, item) => sum + item.volume_m3 * item.quantity, 0)
	);

	// Editable line items
	const ROW_OPTIONS: { row: number; label: string; defaultCents: number }[] = [
		{ row: 31, label: 'De/Montage', defaultCents: 5000 },
		{ row: 32, label: 'Halteverbotszone', defaultCents: 10000 },
		{ row: 33, label: 'Umzugsmaterial', defaultCents: 3000 },
		{ row: 39, label: 'Transporter', defaultCents: 6000 },
		{ row: 42, label: 'Anfahrt/Abfahrt', defaultCents: 3000 },
	];

	interface EditLineItem {
		row: number;
		label: string;
		quantity: number;
		unitPriceCents: number;
		_priceText: string;
		_editing: boolean;
	}

	let editLineItems = $state<EditLineItem[]>([]);

	function mkLineItem(row: number, label: string, quantity: number, unitPriceCents: number): EditLineItem {
		return { row, label, quantity, unitPriceCents, _priceText: (unitPriceCents / 100).toFixed(2), _editing: false };
	}

	function computeLineItemsFromNotes() {
		const notes = editNotes.toLowerCase();
		const items: EditLineItem[] = [];

		if (notes.includes('montage') || notes.includes('demontage')) {
			items.push(mkLineItem(31, 'De/Montage', 1, 5000));
		}

		let hvCount = 0;
		if (notes.includes('halteverbot auszug')) hvCount++;
		if (notes.includes('halteverbot einzug')) hvCount++;
		if (hvCount > 0) {
			items.push(mkLineItem(32, 'Halteverbotszone', hvCount, 10000));
		}

		if (notes.includes('verpackungsservice') || notes.includes('einpackservice')) {
			items.push(mkLineItem(33, 'Umzugsmaterial', 1, 3000));
		}

		const vol = editItems.length > 0 ? computedTotal : (editVolume ?? 0);
		items.push(mkLineItem(39, 'Transporter', vol > 30 ? 2 : 1, 6000));

		if (editDistance > 0) {
			const price = 30 + editDistance * 1.5;
			items.push(mkLineItem(42, 'Anfahrt/Abfahrt', 1, Math.round(price * 100)));
		}

		editLineItems = items;
	}

	function addLineItem() {
		editLineItems = [...editLineItems, mkLineItem(39, 'Transporter', 1, 6000)];
	}

	function removeLineItem(idx: number) {
		editLineItems = editLineItems.filter((_, i) => i !== idx);
	}

	function onLineItemRowChange(idx: number) {
		const item = editLineItems[idx];
		const opt = ROW_OPTIONS.find(r => r.row === item.row);
		if (opt) {
			item.label = opt.label;
			item.unitPriceCents = opt.defaultCents;
			item._priceText = (opt.defaultCents / 100).toFixed(2);
		}
		editLineItems = [...editLineItems];
	}

	let laborCents = $derived(editPersons * editHours * editRateCents);
	let nonLaborCents = $derived(
		editLineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0)
	);
	let calculatedNettoCents = $derived(nonLaborCents + laborCents);
	let calculatedBruttoCents = $derived(Math.round(calculatedNettoCents * 1.19));

	// Item reviewer state
	let reviewIndex = $state<number | null>(null);

	function openReview(item: EditableItem) {
		const items = sortedItems();
		const idx = items.indexOf(item);
		reviewIndex = idx >= 0 ? idx : 0;
	}

	function closeReview() {
		reviewIndex = null;
	}

	function reviewPrev() {
		if (reviewIndex !== null && reviewIndex > 0) reviewIndex--;
	}

	function reviewNext() {
		if (reviewIndex !== null && reviewIndex < sortedItems().length - 1) reviewIndex++;
	}

	function reviewDelete() {
		if (reviewIndex === null) return;
		const items = sortedItems();
		const item = items[reviewIndex];
		deleteItem(item);
		const remaining = sortedItems();
		if (remaining.length === 0) {
			reviewIndex = null;
		} else if (reviewIndex >= remaining.length) {
			reviewIndex = remaining.length - 1;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// Don't intercept when typing in inputs
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (reviewIndex !== null) {
			if (e.key === 'Escape') { closeReview(); e.preventDefault(); }
			else if (e.key === 'ArrowLeft') { reviewPrev(); e.preventDefault(); }
			else if (e.key === 'ArrowRight') { reviewNext(); e.preventDefault(); }
		} else if (filterPhotoIndex !== null) {
			if (e.key === 'Escape') { filterPhotoIndex = null; e.preventDefault(); }
		}
	}

	// Video upload state
	let videoUploading = $state(false);
	let videoProgress = $state('');
	let videoFileInput = $state<HTMLInputElement | null>(null);
	let videoQueue = $state<File[]>([]);

	function handleVideoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
		const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
		if (!file.type.startsWith('video/') && !videoExtensions.includes(ext)) {
			showToast('Bitte eine Videodatei waehlen', 'error');
			input.value = '';
			return;
		}
		if (file.size > 500 * 1024 * 1024) {
			showToast(`${file.name} zu gross (max. 500 MB)`, 'error');
			input.value = '';
			return;
		}

		videoQueue = [...videoQueue, file];
		input.value = '';
	}

	function removeFromQueue(idx: number) {
		videoQueue = videoQueue.filter((_, i) => i !== idx);
	}

	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	async function uploadVideos() {
		if (videoQueue.length === 0 || !data) return;

		videoUploading = true;
		const count = videoQueue.length;
		videoProgress = `${count} Video${count > 1 ? 's' : ''} wird hochgeladen...`;

		try {
			const formData = new FormData();
			formData.append('quote_id', data.quote.id);
			for (const file of videoQueue) {
				formData.append('video', file);
			}

			const results = await apiFetch<{ id: string; status: string }[]>(`/api/v1/estimates/video`, {
				method: 'POST',
				body: formData,
			});

			videoQueue = [];
			showToast(`${count} Video${count > 1 ? 's' : ''} hochgeladen — Analyse läuft`, 'success');

			const processingIds = results.filter(r => r.status === 'processing').map(r => r.id);
			if (processingIds.length > 0) {
				await pollEstimations(processingIds);
			} else {
				await loadQuote();
			}
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			videoUploading = false;
			videoProgress = '';
		}
	}

	async function pollEstimations(estimationIds: string[]) {
		const maxAttempts = 120; // 10 min at 5s intervals
		const pending = new Set(estimationIds);
		let completed = 0;
		let failed = 0;
		const total = estimationIds.length;

		for (let i = 0; i < maxAttempts && pending.size > 0; i++) {
			await new Promise(r => setTimeout(r, 5000));
			for (const id of [...pending]) {
				try {
					const est = await apiFetch<{ id: string; status: string }>(`/api/v1/estimates/${id}`);
					if (est.status === 'completed') {
						pending.delete(id);
						completed++;
					} else if (est.status === 'failed') {
						pending.delete(id);
						failed++;
					}
				} catch {
					// Network error during poll, keep trying
				}
			}
			if (pending.size > 0) {
				videoProgress = `${completed + failed}/${total} Videos analysiert...`;
			}
		}

		if (failed > 0 && completed === 0) {
			showToast('Video-Analyse fehlgeschlagen', 'error');
		} else if (failed > 0) {
			showToast(`${completed}/${total} Videos analysiert, ${failed} fehlgeschlagen`, 'warning');
		} else if (pending.size > 0) {
			showToast('Video-Analyse Timeout', 'error');
		} else {
			showToast('Video-Analyse abgeschlossen', 'success');
		}
		await loadQuote();
	}

	// Photo filter: click a photo to filter items table
	let filterPhotoIndex = $state<number | null>(null);
	let galleryImages = $derived(
		(data?.estimation?.source_images ?? []).map(url => API_BASE + url)
	);

	function togglePhotoFilter(idx: number) {
		filterPhotoIndex = filterPhotoIndex === idx ? null : idx;
	}

	function initEditItems(items: EstimationItem[]) {
		editItems = items.map(item => ({
			name: item.name,
			volume_m3: item.volume_m3,
			quantity: item.quantity,
			confidence: item.confidence,
			crop_url: item.crop_url ?? null,
			source_image_url: item.source_image_url ?? null,
			bbox: item.bbox ?? null,
			crop_s3_key: item.crop_s3_key ?? null,
			bbox_image_index: item.bbox_image_index ?? null,
			seen_in_images: item.seen_in_images ?? null,
			category: item.category ?? null,
			dimensions: item.dimensions ?? null,
		}));
		itemsDirty = false;
	}

	function computePricingDefaults() {
		if (!data) return;

		// If an offer exists with edited values, use those instead of recomputing
		if (data.latest_offer) {
			const lo = data.latest_offer;
			editPersons = lo.persons;
			editHours = lo.hours;
			editRateCents = lo.rate_cents;
			editBruttoCents = lo.total_brutto_cents;
			// Build editable line items from offer (non-labor only)
			editLineItems = lo.line_items
				.filter(li => !li.is_labor)
				.map(li => {
					const match = ROW_OPTIONS.find(r => r.label === li.label);
					return mkLineItem(
						match?.row ?? 0,
						li.label,
						li.quantity,
						li.unit_price_cents,
					);
				});
			priceDirty = false;
			return;
		}

		const originFloor = parseFloor(data.origin_address?.floor ?? null);
		const destFloor = parseFloor(data.destination_address?.floor ?? null);
		const originElev = data.origin_address?.elevator ?? false;
		const destElev = data.destination_address?.elevator ?? false;

		const originExtra = originFloor > 0 && !originElev ? originFloor : 0;
		const destExtra = destFloor > 0 && !destElev ? destFloor : 0;

		editPersons = Math.max(2, 2 + originExtra + destExtra);
		const vol = data.quote.volume_m3 ?? 0;
		editHours = Math.max(1, Math.ceil(vol / (editPersons * 2.0)));
		editRateCents = 3000;
		priceDirty = false;
		computeLineItemsFromNotes();
	}

	$effect(() => {
		if (!rateEditing) {
			rateText = (editRateCents / 100).toFixed(2);
		}
	});

	$effect(() => {
		loadQuote();
	});

	async function loadQuote() {
		loading = true;
		try {
			const id = $page.params.id;
			data = await apiGet<QuoteDetail>(`/api/v1/quotes/${id}`);
			editVolume = data.quote.volume_m3;
			editDistance = data.quote.distance_km;
			editNotes = data.quote.notes || '';
			if (data.estimation) {
				initEditItems(data.estimation.items);
			}
			computePricingDefaults();

			// Fetch route geometry from distance calculator (non-blocking)
			if (data.origin_address && data.destination_address) {
				const originStr = `${data.origin_address.street}, ${data.origin_address.postal_code || ''} ${data.origin_address.city}`.trim();
				const destStr = `${data.destination_address.street}, ${data.destination_address.postal_code || ''} ${data.destination_address.city}`.trim();
				apiPost<{ legs: { geometry: [number, number][] }[] }>(`/api/v1/distance/calculate`, {
					addresses: [originStr, destStr]
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

	async function saveQuote() {
		if (!data) return;
		saving = true;
		try {
			await apiPatch(`/api/v1/quotes/${data.quote.id}`, {
				estimated_volume_m3: editVolume,
				distance_km: editDistance,
				notes: editNotes || null
			});
			showToast('Anfrage gespeichert', 'success');
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			saving = false;
		}
	}

	async function saveItems() {
		if (!data) return;
		savingItems = true;
		try {
			await apiPut(`/api/v1/quotes/${data.quote.id}/estimation-items`, {
				items: editItems.map(item => ({
					name: item.name,
					volume_m3: item.volume_m3,
					quantity: item.quantity,
					confidence: item.confidence,
					crop_s3_key: item.crop_s3_key,
					bbox: item.bbox,
					bbox_image_index: item.bbox_image_index,
					seen_in_images: item.seen_in_images,
					category: item.category,
					dimensions: item.dimensions,
				}))
			});
			editVolume = computedTotal;
			itemsDirty = false;
			showToast('Gegenstaende gespeichert', 'success');
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			savingItems = false;
		}
	}

	function markDirty() {
		itemsDirty = true;
	}

	function addItem() {
		editItems = [...editItems, {
			name: '',
			volume_m3: 0,
			quantity: 1,
			confidence: 1.0,
			crop_url: null,
			source_image_url: null,
			bbox: null,
			crop_s3_key: null,
			bbox_image_index: null,
			seen_in_images: null,
			category: null,
			dimensions: null,
		}];
		itemsDirty = true;
	}

	function deleteItem(item: EditableItem) {
		editItems = editItems.filter((i) => i !== item);
		itemsDirty = true;
	}

	function onBruttoChange() {
		const targetNetto = Math.round(editBruttoCents / 1.19);
		const availableForLabor = targetNetto - nonLaborCents;
		if (editPersons > 0 && editHours > 0 && availableForLabor > 0) {
			editRateCents = Math.round(availableForLabor / (editPersons * editHours));
		}
		priceDirty = true;
	}

	async function generateOffer() {
		if (!data) return;
		try {
			const payload: Record<string, unknown> = {
				quote_id: data.quote.id,
				persons: editPersons,
				hours: editHours,
				rate: editRateCents / 100,
			};
			if (priceDirty) {
				payload.price_cents_netto = Math.round(editBruttoCents / 1.19);
			}
			const result = await apiPost<{ id: string }>(`/api/v1/offers/generate`, payload);

			// Patch the new offer with edited line items
			if (result?.id && editLineItems.length > 0) {
				const lineItemsJson = editLineItems.map(li => ({
					row: li.row,
					quantity: li.quantity,
					unit_price: li.unitPriceCents / 100,
				}));
				await apiPatch(`/api/v1/admin/offers/${result.id}`, {
					price_netto_cents: calculatedNettoCents,
					persons: editPersons,
					hours: editHours,
					rate_per_hour_cents: editRateCents,
					line_items_json: lineItemsJson,
				});
				// Regenerate PDF with the updated line items
				await apiPost(`/api/v1/admin/offers/${result.id}/regenerate`, {
					persons: editPersons,
					hours: editHours,
					rate: editRateCents / 100,
					price_cents: calculatedNettoCents,
				});
			}

			showToast('Angebot erstellt', 'success');
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	const statusOptions: { value: string; label: string }[] = [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'volume_estimated', label: 'Volumen geschaetzt' },
		{ value: 'offer_generated', label: 'Angebot erstellt' },
		{ value: 'offer_sent', label: 'Angebot gesendet' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'done', label: 'Erledigt' },
		{ value: 'paid', label: 'Bezahlt' },
		{ value: 'rejected', label: 'Abgelehnt' },
		{ value: 'cancelled', label: 'Storniert' },
	];

	let changingStatus = $state(false);

	async function setQuoteStatus(newStatus: string) {
		if (!data) return;
		if (data.quote.status === newStatus) return;
		changingStatus = true;
		try {
			await apiPost(`/api/v1/admin/quotes/${data.quote.id}/status`, { status: newStatus });
			const label = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
			showToast(`Status: ${label}`, 'success');
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			changingStatus = false;
		}
	}

	async function deleteQuote() {
		if (!data) return;
		if (!confirm('Anfrage unwiderruflich loeschen?')) return;
		try {
			await apiPost(`/api/v1/admin/quotes/${data.quote.id}/delete`);
			showToast('Anfrage geloescht', 'success');
			goto('/admin/quotes');
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	function startEditOrigin() {
		if (!data?.origin_address) return;
		const a = data.origin_address;
		editOrigin = { street: a.street, postal_code: a.postal_code || '', city: a.city, floor: a.floor || '0', elevator: a.elevator ?? false };
		editingOrigin = true;
	}

	function startEditDest() {
		if (!data?.destination_address) return;
		const a = data.destination_address;
		editDest = { street: a.street, postal_code: a.postal_code || '', city: a.city, floor: a.floor || '0', elevator: a.elevator ?? false };
		editingDest = true;
	}

	async function saveAddress(addressId: string, fields: typeof editOrigin, setEditing: (v: boolean) => void) {
		try {
			await apiPatch(`/api/v1/admin/addresses/${addressId}`, fields);
			showToast('Adresse gespeichert', 'success');
			setEditing(false);
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

</script>

<div class="page">
	<a href="/admin/quotes" class="back-link">
		<ArrowLeft size={16} />
		Zurueck zu Anfragen
	</a>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if data}
		<div class="page-header">
			<div class="header-left">
				<h1>Anfrage</h1>
				<StatusBadge status={data.quote.status} />
			</div>
			<div class="header-actions">
				<button class="btn btn-primary" onclick={generateOffer}>
					<FileOutput size={16} />
					Angebot erstellen
				</button>
				<select
					class="status-select"
					value={data.quote.status}
					onchange={(e) => setQuoteStatus((e.target as HTMLSelectElement).value)}
					disabled={changingStatus}
				>
					{#each statusOptions as opt}
						<option value={opt.value} selected={opt.value === data.quote.status}>{opt.label}</option>
					{/each}
				</select>
				<button class="btn btn-danger" onclick={deleteQuote}>
					<Trash2 size={16} />
				</button>
			</div>
		</div>

		<div class="detail-grid">
			<!-- Customer -->
			<div class="card">
				<h3>Kunde</h3>
				<div class="info-grid">
					<div class="info-item">
						<span class="info-label">Name</span>
						<span class="info-value">{data.customer.name || '—'}</span>
					</div>
					<div class="info-item">
						<span class="info-label">E-Mail</span>
						<span class="info-value">{data.customer.email}</span>
					</div>
					{#if data.customer.phone}
						<div class="info-item">
							<span class="info-label">Telefon</span>
							<span class="info-value">{data.customer.phone}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Addresses -->
			{#if data.origin_address}
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
							<div class="field full-width">
								<label>Strasse</label>
								<input type="text" bind:value={editOrigin.street} />
							</div>
							<div class="field">
								<label>PLZ</label>
								<input type="text" bind:value={editOrigin.postal_code} />
							</div>
							<div class="field">
								<label>Stadt</label>
								<input type="text" bind:value={editOrigin.city} />
							</div>
							<div class="field">
								<label>Stockwerk</label>
								<select bind:value={editOrigin.floor}>
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
							<div class="field full-width addr-actions">
								<button class="btn btn-sm btn-save" onclick={() => saveAddress(data!.origin_address!.id, editOrigin, (v) => editingOrigin = v)}>
									<Save size={14} />
									Speichern
								</button>
								<button class="btn btn-sm" onclick={() => editingOrigin = false}>
									Abbrechen
								</button>
							</div>
						</div>
					{:else}
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Adresse</span>
								<span class="info-value">
									{data.origin_address.street}, {data.origin_address.postal_code || ''} {data.origin_address.city}
								</span>
							</div>
							<div class="info-item">
								<span class="info-label">Stockwerk</span>
								<span class="info-value">
									{floorLabel(data.origin_address.floor)}
									{#if data.origin_address.elevator}(Aufzug){/if}
								</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if data.destination_address}
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
							<div class="field full-width">
								<label>Strasse</label>
								<input type="text" bind:value={editDest.street} />
							</div>
							<div class="field">
								<label>PLZ</label>
								<input type="text" bind:value={editDest.postal_code} />
							</div>
							<div class="field">
								<label>Stadt</label>
								<input type="text" bind:value={editDest.city} />
							</div>
							<div class="field">
								<label>Stockwerk</label>
								<select bind:value={editDest.floor}>
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
							<div class="field full-width addr-actions">
								<button class="btn btn-sm btn-save" onclick={() => saveAddress(data!.destination_address!.id, editDest, (v) => editingDest = v)}>
									<Save size={14} />
									Speichern
								</button>
								<button class="btn btn-sm" onclick={() => editingDest = false}>
									Abbrechen
								</button>
							</div>
						</div>
					{:else}
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Adresse</span>
								<span class="info-value">
									{data.destination_address.street}, {data.destination_address.postal_code || ''} {data.destination_address.city}
								</span>
							</div>
							<div class="info-item">
								<span class="info-label">Stockwerk</span>
								<span class="info-value">
									{floorLabel(data.destination_address.floor)}
									{#if data.destination_address.elevator}(Aufzug){/if}
								</span>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Route Map -->
			{#if routeCoordinates}
				<RouteMap coordinates={routeCoordinates} distanceKm={editDistance} />
			{/if}

			<!-- Editable Fields -->
			<div class="card">
				<div class="card-header">
					<h3>Details</h3>
					<button class="btn btn-sm" onclick={saveQuote} disabled={saving}>
						<Save size={14} />
						{saving ? 'Speichern...' : 'Speichern'}
					</button>
				</div>
				<div class="form-grid">
					<div class="field">
						<label for="volume">Volumen (m3)</label>
						<input id="volume" type="number" step="0.1" bind:value={editVolume} />
					</div>
					<div class="field">
						<label for="distance">Entfernung (km)</label>
						<input id="distance" type="number" step="0.1" bind:value={editDistance} />
					</div>
					<div class="field full-width">
						<label for="notes">Notizen / Services</label>
						<textarea id="notes" rows={3} bind:value={editNotes}></textarea>
					</div>
				</div>
			</div>

			<!-- Customer Message -->
			{#if data.quote.customer_message}
				<div class="card">
					<h3>Kundennachricht</h3>
					<p class="customer-message">{data.quote.customer_message}</p>
				</div>
			{/if}

			<!-- Source Photos Gallery -->
			{#if galleryImages.length > 0}
				<div class="card full-width">
					<div class="card-header">
						<h3>Fotos ({galleryImages.length})</h3>
						{#if filterPhotoIndex !== null}
							<button class="btn btn-sm" onclick={() => { filterPhotoIndex = null; }}>
								<X size={14} />
								Filter aufheben
							</button>
						{/if}
					</div>
					<div class="photo-grid">
						{#each galleryImages as url, idx}
							<button
								class="photo-thumb-btn"
								class:photo-active={filterPhotoIndex === idx}
								onclick={() => togglePhotoFilter(idx)}
							>
								<img src={url} alt="Foto {idx + 1}" class="photo-thumb" />
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Video Upload -->
			<div class="card full-width">
				<div class="card-header">
					<h3>Video-Analyse</h3>
				</div>
				{#if data.estimation?.source_videos && data.estimation.source_videos.length > 0}
					<div class="video-gallery">
						{#each data.estimation.source_videos as videoUrl}
							<video controls preload="metadata" class="video-player">
								<source src={API_BASE + videoUrl} />
							</video>
						{/each}
					</div>
				{/if}
				{#if videoUploading}
					<div class="video-uploading">
						<div class="video-spinner"></div>
						<span>{videoProgress}</span>
					</div>
				{:else}
					{#if videoQueue.length > 0}
						<div class="video-queue">
							{#each videoQueue as file, idx}
								<div class="video-queue-item">
									<Video size={16} />
									<span class="video-queue-name">{file.name}</span>
									<span class="video-queue-size">{formatFileSize(file.size)}</span>
									<button class="del-btn" onclick={() => removeFromQueue(idx)} title="Entfernen">
										<X size={14} />
									</button>
								</div>
							{/each}
							<div class="video-queue-actions">
								<label for="video-upload" class="btn btn-sm video-add-more">
									<Plus size={14} />
									Weiteres Video
								</label>
								<button class="btn btn-primary" onclick={uploadVideos}>
									<Upload size={16} />
									{videoQueue.length} Video{videoQueue.length > 1 ? 's' : ''} hochladen
								</button>
							</div>
						</div>
					{/if}
					<input
						type="file"
						accept="video/*,.mov,.mp4,.webm,.mkv"
						onchange={handleVideoSelect}
						bind:this={videoFileInput}
						class="video-file-input"
						id="video-upload"
					/>
					{#if videoQueue.length === 0}
						<label for="video-upload" class="video-upload-label">
							<Video size={24} />
							<span>Video hinzufuegen</span>
							<span class="video-hint">MP4, MOV, WebM (max. 500 MB pro Video)</span>
						</label>
					{/if}
				{/if}
			</div>

		<!-- Estimation Items (Editable) -->
				<div class="card full-width">
					<div class="card-header">
						<h3>
						{#if filterPhotoIndex !== null}
							Gegenstaende aus Foto {filterPhotoIndex + 1} ({sortedItems().length})
						{:else}
							Erfasste Gegenstaende{data.estimation?.method ? ` (${data.estimation.method})` : ''}
						{/if}
					</h3>
						<div class="items-header-actions">
							<button class="btn btn-sm" onclick={addItem}>
								<Plus size={14} />
								Gegenstand
							</button>
							<button
								class="btn btn-sm"
								class:btn-dirty={itemsDirty}
								onclick={saveItems}
								disabled={savingItems || !itemsDirty}
							>
								<Save size={14} />
								{savingItems ? 'Speichern...' : 'Speichern'}
							</button>
						</div>
					</div>
					{#if editItems.length > 0}
					<div class="items-table-wrap">
						<table class="items-table">
							<thead>
								<tr>
									<th class="th-foto">Foto</th>
									<th class="th-sortable" onclick={() => toggleSort('name')}>
										Gegenstand {sortKey === 'name' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
									</th>
									<th class="th-num th-sortable" onclick={() => toggleSort('quantity')}>
										Anzahl {sortKey === 'quantity' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
									</th>
									<th class="th-num th-sortable" onclick={() => toggleSort('volume_m3')}>
										Volumen (m3) {sortKey === 'volume_m3' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
									</th>
									<th class="th-num">Konfidenz</th>
									<th class="th-del"></th>
								</tr>
							</thead>
							<tbody>
								{#each sortedItems() as item, idx}
									<tr>
										<td class="crop-cell">
											{#if item.crop_url}
												<button class="crop-btn" onclick={() => openReview(item)}>
													<img src={API_BASE + item.crop_url} alt={item.name} class="crop-thumb" />
												</button>
											{:else}
												<span class="no-crop">—</span>
											{/if}
										</td>
										<td>
											<input
												type="text"
												class="edit-input edit-name"
												bind:value={item.name}
												oninput={markDirty}
											/>
										</td>
										<td>
											<input
												type="number"
												class="edit-input edit-num"
												min="1"
												step="1"
												bind:value={item.quantity}
												oninput={markDirty}
											/>
										</td>
										<td>
											<input
												type="number"
												class="edit-input edit-num"
												min="0"
												step="0.01"
												bind:value={item.volume_m3}
												oninput={markDirty}
											/>
										</td>
										<td class="confidence-cell">
											{Math.round(item.confidence * 100)}%
										</td>
										<td class="del-cell">
											<button class="del-btn" onclick={() => deleteItem(item)} title="Entfernen">
												<X size={14} />
											</button>
										</td>
									</tr>
								{/each}
								<tr class="total-row">
									<td></td>
									<td>Gesamt</td>
									<td>{editItems.reduce((s, i) => s + i.quantity, 0)}</td>
									<td>{computedTotal.toFixed(2)}</td>
									<td></td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</div>
				{:else}
					<p class="empty-items">Noch keine Gegenstaende erfasst.</p>
				{/if}
				</div>

			<!-- Pricing Editor -->
			<div class="card">
				<h3>Preisgestaltung</h3>
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
				</div>
			</div>

			<!-- Line Items (Editable) -->
			<div class="card">
				<div class="card-header">
					<h3>Positionen</h3>
					<div class="li-header-actions">
						<button class="btn btn-sm" onclick={computeLineItemsFromNotes} title="Aus Notizen neu berechnen">
							Neu berechnen
						</button>
						<button class="btn btn-sm" onclick={addLineItem}>
							<Plus size={14} />
							Position
						</button>
					</div>
				</div>
				<div class="line-items">
					<!-- Labor (always shown, driven by persons/hours/rate) -->
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
							<div class="li-edit-row">
								<select bind:value={li.row} onchange={() => onLineItemRowChange(idx)}>
									{#each ROW_OPTIONS as opt}
										<option value={opt.row}>{opt.label}</option>
									{/each}
								</select>
								<input
									type="number"
									class="edit-li-qty"
									min={1}
									step={1}
									bind:value={li.quantity}
								/>
								<span class="li-times">&times;</span>
								<input
									type="number"
									class="edit-li-price"
									min={0}
									step={0.5}
									value={li._editing ? li._priceText : (li.unitPriceCents / 100).toFixed(2)}
									oninput={(e) => {
										const target = e.target as HTMLInputElement;
										li._priceText = target.value;
										const val = parseFloat(target.value);
										if (!isNaN(val)) li.unitPriceCents = Math.round(val * 100);
									}}
									onfocus={() => { li._editing = true; }}
									onblur={() => { li._editing = false; }}
								/>
								<span class="li-eur">EUR</span>
								<span class="li-total">{formatEuro(li.quantity * li.unitPriceCents)}</span>
								<button class="del-btn" onclick={() => removeLineItem(idx)} title="Entfernen">
									<X size={14} />
								</button>
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
			</div>

			<!-- Linked Offers -->
			{#if data.offers.length > 0}
				<div class="card full-width">
					<h3>Angebote</h3>
					<div class="offers-list">
						{#each data.offers as offer}
							<a href="/admin/offers/{offer.id}" class="offer-row">
								<span class="offer-date">{formatDate(offer.created_at)}</span>
								<span class="offer-price">{offer.total_brutto_cents != null ? formatEuro(offer.total_brutto_cents) : '—'}</span>
								<StatusBadge status={offer.status} />
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<button class="btn-generate-bottom" onclick={generateOffer}>
				<FileOutput size={20} />
				Angebot erstellen
			</button>
		</div>
	{/if}
</div>

<svelte:window onkeydown={handleKeydown} />

{#if reviewIndex !== null}
	{@const items = sortedItems()}
	{@const rItem = items[reviewIndex]}
	{#if rItem}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="review-backdrop" onclick={(e) => { if (e.target === e.currentTarget) closeReview(); }}>
			<button class="review-close" onclick={closeReview} aria-label="Schliessen">
				<X size={24} />
			</button>

			{#if reviewIndex > 0}
				<button class="review-nav review-prev" onclick={reviewPrev} aria-label="Vorheriger Gegenstand">
					<ChevronLeft size={32} />
				</button>
			{/if}

			{#if reviewIndex < items.length - 1}
				<button class="review-nav review-next" onclick={reviewNext} aria-label="Naechster Gegenstand">
					<ChevronRight size={32} />
				</button>
			{/if}

			<div class="review-content">
				<div class="review-image-wrap">
					{#key reviewIndex}
						{#if rItem.crop_url}
							<img src={API_BASE + rItem.crop_url} alt={rItem.name} class="review-image" />
						{:else}
							<div class="review-no-image">Kein Foto</div>
						{/if}
					{/key}
				</div>

				<div class="review-panel">
					<div class="review-field">
						<label>Gegenstand</label>
						<input
							type="text"
							bind:value={rItem.name}
							oninput={markDirty}
							class="review-input"
						/>
					</div>
					<div class="review-row">
						<div class="review-field">
							<label>Volumen (m3)</label>
							<input
								type="number"
								min="0"
								step="0.01"
								bind:value={rItem.volume_m3}
								oninput={markDirty}
								class="review-input review-input-num"
							/>
						</div>
						<div class="review-field">
							<label>Anzahl</label>
							<input
								type="number"
								min="1"
								step="1"
								bind:value={rItem.quantity}
								oninput={markDirty}
								class="review-input review-input-num"
							/>
						</div>
					</div>
					<div class="review-actions">
						<button class="review-btn review-btn-delete" onclick={reviewDelete}>
							<Trash2 size={14} />
							Entfernen
						</button>
						<span class="review-counter">{reviewIndex + 1} / {items.length}</span>
						<button class="review-btn review-btn-add" onclick={() => { addItem(); reviewIndex = sortedItems().length - 1; }}>
							<Plus size={14} />
							Neu
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
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
	}

	.detail-grid {
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

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.info-label {
		font-size: 0.6875rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 0.9375rem;
		color: #1a1a2e;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field.full-width {
		grid-column: 1 / -1;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
	}

	.field input,
	.field textarea {
		background: #e8ecf1;
		border: none;
		border-radius: 8px;
		color: #1a1a2e;
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
		outline: none;
		transition: box-shadow 150ms ease;
		font-family: inherit;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.field input:focus,
	.field textarea:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.customer-message {
		color: #334155;
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	/* Photo Gallery */
	.photo-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 0.5rem;
	}

	.photo-thumb-btn {
		aspect-ratio: 1;
		overflow: hidden;
		border-radius: 10px;
		border: none;
		background: #e8ecf1;
		cursor: pointer;
		padding: 0;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
		transition: box-shadow 150ms ease, transform 150ms ease;
	}

	.photo-thumb-btn:hover {
		box-shadow: 5px 5px 12px #c5cdd8, -5px -5px 12px #ffffff;
		transform: scale(1.03);
	}

	.photo-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* Video Gallery */
	.video-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.video-player {
		width: 100%;
		border-radius: 10px;
		background: #1a1a2e;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	/* Video Queue */
	.video-queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.video-queue-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #e8ecf1;
		border-radius: 8px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.video-queue-name {
		flex: 1;
		font-size: 0.8125rem;
		color: #334155;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.video-queue-size {
		font-size: 0.75rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.video-queue-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.video-add-more {
		cursor: pointer;
	}

	/* Video Upload */
	.video-upload-zone {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-file-input {
		display: none;
	}

	.video-upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 2rem;
		border: 2px dashed #d1d9e6;
		border-radius: 12px;
		cursor: pointer;
		color: #64748b;
		transition: all 150ms ease;
		width: 100%;
		text-align: center;
	}

	.video-upload-label:hover {
		border-color: #6366f1;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.04);
	}

	.video-hint {
		font-size: 0.6875rem;
		color: #94a3b8;
	}

	.video-uploading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		color: #6366f1;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.video-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid #e2e8f0;
		border-top-color: #6366f1;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Pricing */
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

	.btn-link {
		color: #6366f1;
		font-size: 0.75rem;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color 150ms ease;
	}

	.btn-link:hover {
		color: #4f46e5;
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
		padding: 0.375rem 0.75rem;
		color: #334155;
		border-bottom: 1px solid #f1f5f9;
		vertical-align: middle;
	}

	.items-table .total-row td {
		font-weight: 700;
		color: #1a1a2e;
		border-top: 1px solid #e2e8f0;
		padding: 0.5rem 0.75rem;
	}

	.items-header-actions {
		display: flex;
		gap: 0.375rem;
	}

	.empty-items {
		color: #94a3b8;
		font-size: 0.875rem;
		text-align: center;
		padding: 1.5rem 0;
	}

	.th-sortable {
		cursor: pointer;
		user-select: none;
		transition: color 150ms ease;
	}

	.th-sortable:hover {
		color: #6366f1;
	}

	.th-foto {
		width: 60px;
	}

	.th-num {
		width: 110px;
	}

	.th-del {
		width: 40px;
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
		border-radius: 6px;
	}

	.no-crop {
		color: #cbd5e1;
		font-size: 0.75rem;
	}

	/* Inline edit inputs */
	.edit-input {
		background: #e8ecf1;
		border: none;
		border-radius: 6px;
		color: #334155;
		padding: 0.25rem 0.375rem;
		font-size: 0.8125rem;
		outline: none;
		transition: box-shadow 150ms ease;
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff;
	}

	.edit-input:hover {
		box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff;
	}

	.edit-input:focus {
		box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.edit-name {
		min-width: 120px;
	}

	.edit-num {
		width: 80px;
		text-align: right;
	}

	.confidence-cell {
		color: #94a3b8;
		font-size: 0.75rem;
	}

	.del-cell {
		width: 40px;
		text-align: center;
	}

	.del-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: #cbd5e1;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
		transition: color 150ms ease, background 150ms ease;
	}

	.del-btn:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}

	/* Dirty state indicator for save button */
	.btn-dirty {
		background: #6366f1 !important;
		color: #ffffff !important;
		border-color: transparent !important;
	}

	.offers-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.offer-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		text-decoration: none;
		transition: background 150ms ease;
	}

	.offer-row:hover {
		background: #f8fafc;
	}

	.offer-date {
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.offer-price {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1a1a2e;
		flex: 1;
	}

	/* Shared button styles */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		border: none;
		color: #64748b;
		background: #e8ecf1;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
	}

	.btn-sm:hover:not(:disabled) {
		color: #1a1a2e;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.btn-primary {
		background: #6366f1;
		color: #ffffff;
		box-shadow: 3px 3px 10px rgba(99, 102, 241, 0.3);
	}

	.btn-primary:hover {
		background: #4f46e5;
	}

	.btn-danger {
		background: #ffffff;
		color: #94a3b8;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.btn-danger:hover {
		color: #ef4444;
	}

	.status-select {
		padding: 0.5rem 0.75rem;
		border-radius: 10px;
		border: none;
		background: #e8ecf1;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #1a1a2e;
		cursor: pointer;
		outline: none;
	}

	.status-select:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px #6366f1;
	}

	.status-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.field select {
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

	.field select:focus {
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #334155;
		padding-top: 1.25rem;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		accent-color: #6366f1;
	}

	.addr-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.btn-save {
		background: #6366f1 !important;
		color: #ffffff !important;
	}

	/* Editable line items */
	.li-header-actions {
		display: flex;
		gap: 0.375rem;
	}

	.line-item.editable {
		padding: 0.375rem 0;
	}

	.li-edit-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.li-edit-row select {
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

	.edit-li-qty,
	.edit-li-price {
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

	.edit-li-qty:focus,
	.edit-li-price:focus {
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.li-times {
		color: #cbd5e1;
		font-size: 0.8125rem;
	}

	.li-eur {
		color: #94a3b8;
		font-size: 0.75rem;
	}

	/* Item Reviewer Lightbox */
	.review-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: reviewFadeIn 150ms ease;
	}

	@keyframes reviewFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.review-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10001;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.5rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.review-close:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.2);
	}

	.review-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10001;
		color: rgba(255, 255, 255, 0.7);
		padding: 0.75rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.review-nav:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.25);
	}

	.review-prev { left: 1rem; }
	.review-next { right: 1rem; }

	.review-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		max-width: 560px;
		width: 90vw;
	}

	.review-image-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 200px;
	}

	.review-image {
		max-width: 100%;
		max-height: 55vh;
		object-fit: contain;
		border-radius: 12px;
		display: block;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}

	.review-no-image {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.875rem;
	}

	.review-panel {
		width: 100%;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(16px);
		border-radius: 12px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.review-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.review-field label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.review-input {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		color: #ffffff;
		padding: 0.5rem 0.625rem;
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		transition: border-color 150ms ease;
		width: 100%;
		box-sizing: border-box;
	}

	.review-input:focus {
		border-color: #6366f1;
	}

	.review-input-num {
		width: 100%;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.review-row {
		display: flex;
		gap: 0.75rem;
	}

	.review-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.25rem;
	}

	.review-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.review-btn-delete {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
		border: 1px solid rgba(239, 68, 68, 0.25);
	}

	.review-btn-delete:hover {
		background: rgba(239, 68, 68, 0.25);
		color: #ffffff;
	}

	.review-btn-add {
		background: rgba(99, 102, 241, 0.15);
		color: #a5b4fc;
		border: 1px solid rgba(99, 102, 241, 0.25);
	}

	.review-btn-add:hover {
		background: rgba(99, 102, 241, 0.25);
		color: #ffffff;
	}

	.review-counter {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.4);
		font-variant-numeric: tabular-nums;
	}

	.photo-active {
		box-shadow: 0 0 0 3px #6366f1, 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
		transform: scale(1.03);
	}

	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.pricing-fields {
			grid-template-columns: 1fr;
		}

		.li-edit-row {
			flex-wrap: wrap;
		}

		.li-edit-row select {
			min-width: 0;
			width: 100%;
		}

		.edit-li-qty,
		.edit-li-price {
			width: 60px;
		}

		.th-num {
			width: 80px;
		}

		.th-foto,
		.crop-cell {
			width: 50px;
		}

		.card {
			max-width: 100%;
			overflow-x: auto;
		}

		.line-items {
			max-width: 100%;
			overflow-x: auto;
		}

		.btn { min-height: 44px; }
		.btn-sm { min-height: 44px; }
		.header-actions { flex-wrap: wrap; }
	}

	.btn-generate-bottom {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		background: #6366f1;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		box-shadow: 3px 3px 10px rgba(99, 102, 241, 0.3);
		transition: background 150ms ease;
	}

	.btn-generate-bottom:hover {
		background: #4f46e5;
	}
</style>
