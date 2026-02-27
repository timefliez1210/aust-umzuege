<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiFetch, apiGet, apiPatch, apiPost, apiPut, apiDelete, formatDate, formatEuro, API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import PriceInput from '$lib/components/admin/PriceInput.svelte';
	import RouteMap from '$lib/components/admin/RouteMap.svelte';
	import { floorLabel, parseFloor } from '$lib/utils/floor';
	import { sortItems, filterItemsByPhotoIndex } from '$lib/utils/sorting';
	import { computeTotalVolume } from '$lib/utils/volume';
	import { normalizeFlatTotalItem } from '$lib/utils/pricing';
	import { ArrowLeft, Save, FileOutput, RotateCcw, Trash2, X, Pencil, Plus, ChevronLeft, ChevronRight, Upload, Video, Download, ImagePlus } from 'lucide-svelte';

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

	interface EstimationEntry {
		id: string;
		method: string;
		status: string;
		total_volume_m3: number | null;
		item_count: number;
		created_at: string;
		source_video_url: string | null;
		source_image_urls: string[];
	}

	interface OfferSummary {
		id: string;
		total_brutto_cents: number | null;
		status: string;
		created_at: string;
	}

	interface OfferLineItemDetail {
		label: string;
		remark: string | null;
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
		estimations: EstimationEntry[];
		items: EstimationItem[];
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

	/**
	 * Toggles the column sort key and direction for the estimation items table.
	 *
	 * Called by: Template (onclick on column headers — Name, Menge, Volumen)
	 * Purpose: Allows the admin to sort the items list to spot duplicates, outliers, or
	 *          the highest-volume items quickly. Clicking the same column again reverses the direction.
	 *
	 * @param key - The column to sort by: 'name', 'quantity', or 'volume_m3'
	 * @returns void (side-effect: updates `sortKey` and `sortAsc`)
	 */
	function toggleSort(key: 'name' | 'quantity' | 'volume_m3') {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	let sortedItems = $derived(() => {
		const filtered = filterItemsByPhotoIndex(editItems, filterPhotoIndex);
		return sortItems(filtered, sortKey, sortAsc);
	});

	// Live-computed total volume from editable items
	let computedTotal = $derived(computeTotalVolume(editItems));

	// Editable line items
	const ROW_OPTIONS: { row: number; label: string; defaultCents: number }[] = [
		{ row: 31, label: 'Demontage', defaultCents: 5000 },
		{ row: 32, label: 'Montage', defaultCents: 5000 },
		{ row: 33, label: 'Halteverbotszone', defaultCents: 10000 },
		{ row: 34, label: 'Umzugsmaterial', defaultCents: 3000 },
		{ row: 35, label: 'Möbellift', defaultCents: 0 },
		{ row: 36, label: 'Verleih Kleiderboxen', defaultCents: 0 },
		{ row: 37, label: 'Verkauf U-Karton', defaultCents: 0 },
		{ row: 38, label: 'Verkauf B-Karton', defaultCents: 0 },
		{ row: 99, label: 'Sonstiges', defaultCents: 0 },
	];

	interface EditLineItem {
		row: number;
		label: string;
		remark: string;
		quantity: number;
		unitPriceCents: number;
		_priceText: string;
		_editing: boolean;
	}

	let editLineItems = $state<EditLineItem[]>([]);

	/**
	 * Constructs a new EditLineItem object with sensible defaults for UI state fields.
	 *
	 * Called by: computeLineItemsFromNotes (to build auto-generated items), addLineItem (for manual additions)
	 * Purpose: Centralises line-item construction so all items share a consistent shape including
	 *          the derived `_priceText` string and the `_editing` flag used by inline price inputs.
	 *
	 * @param row - The ROW_OPTIONS row number (e.g. 31 for De/Montage, 39 for Transporter)
	 * @param label - Human-readable label shown on the PDF line item
	 * @param quantity - Number of units
	 * @param unitPriceCents - Unit price in euro cents
	 * @param remark - Optional remark appended to the line on the PDF (default '')
	 * @returns A fully initialised EditLineItem ready for use in `editLineItems`
	 */
	function mkLineItem(row: number, label: string, quantity: number, unitPriceCents: number, remark: string = ''): EditLineItem {
		return { row, label, remark, quantity, unitPriceCents, _priceText: (unitPriceCents / 100).toFixed(2), _editing: false };
	}

	/**
	 * Auto-generates a suggested set of extra line items by scanning the quote notes for service keywords.
	 *
	 * Called by: computePricingDefaults (after loading a new quote), Template (no direct call — triggered via computePricingDefaults)
	 * Purpose: Reduces manual data entry by pre-filling line items from structured notes entered at quote creation.
	 *          The backend will independently re-generate Fahrkostenpauschale via ORS, so it is not included here.
	 *          Matches the auto-generation logic in the backend's `build_line_items()`.
	 *
	 * @returns void (side-effect: replaces `editLineItems` with auto-computed items)
	 */
	function computeLineItemsFromNotes() {
		const notes = editNotes.toLowerCase();
		const items: EditLineItem[] = [];

		if (notes.includes('demontage')) {
			items.push(mkLineItem(31, 'Demontage', 1, 5000));
		}
		// Check "montage" separately — strip "demontage" occurrences first to avoid false positive
		if (notes.replace('demontage', '').includes('montage')) {
			items.push(mkLineItem(32, 'Montage', 1, 5000));
		}

		const hvAuszug = notes.includes('halteverbot auszug');
		const hvEinzug = notes.includes('halteverbot einzug');
		const hvCount = (hvAuszug ? 1 : 0) + (hvEinzug ? 1 : 0);
		if (hvCount > 0) {
			const remark = hvAuszug && hvEinzug
				? 'Beladestelle + Entladestelle'
				: hvAuszug ? 'Beladestelle' : 'Entladestelle';
			items.push(mkLineItem(33, 'Halteverbotszone', hvCount, 10000, remark));
		}

		if (notes.includes('verpackungsservice') || notes.includes('einpackservice')) {
			items.push(mkLineItem(34, 'Umzugsmaterial', 1, 3000, 'Stretchfolie, Decken, Gurte Einzelpreis 30,00 €'));
		}

		editLineItems = items;
	}

	/**
	 * Appends a new De/Montage line item with default values to the editable line-items list.
	 *
	 * Called by: Template (onclick on the "+" add line item button in the pricing section)
	 * Purpose: Allows the admin to add an extra charge not auto-detected from the notes,
	 *          before generating the offer PDF.
	 *
	 * @returns void (side-effect: appends to `editLineItems`)
	 */
	function addLineItem() {
		editLineItems = [...editLineItems, mkLineItem(31, 'Demontage', 1, 5000)];
	}

	/**
	 * Removes a line item from the editable list by index.
	 *
	 * Called by: Template (onclick on the X button next to each extra line item row)
	 * Purpose: Allows the admin to delete auto-generated or manually added charges before generating the offer.
	 *
	 * @param idx - Zero-based index of the line item to remove from `editLineItems`
	 * @returns void
	 */
	function removeLineItem(idx: number) {
		editLineItems = editLineItems.filter((_, i) => i !== idx);
	}

	/**
	 * Resets a line item's label and price to the defaults for the newly selected row type.
	 *
	 * Called by: Template (onchange on the row-type <select> for each line item row)
	 * Purpose: Keeps the label and default unit price in sync with the chosen category after the
	 *          admin changes the row type. Row 99 "Sonstiges" clears label and price for manual entry.
	 *
	 * @param idx - Zero-based index of the changed line item in `editLineItems`
	 * @returns void (side-effect: mutates label, unitPriceCents, _priceText on the item; triggers reactivity)
	 */
	function onLineItemRowChange(idx: number) {
		const item = editLineItems[idx];
		const opt = ROW_OPTIONS.find(r => r.row === item.row);
		if (opt) {
			if (item.row === 99) {
				item.label = '';
				item.unitPriceCents = 0;
				item._priceText = '0.00';
			} else {
				item.label = opt.label;
				item.unitPriceCents = opt.defaultCents;
				item._priceText = (opt.defaultCents / 100).toFixed(2);
			}
		}
		editLineItems = [...editLineItems];
	}

	let laborCents = $derived(editPersons * editHours * editRateCents);
	let nonLaborCents = $derived(
		editLineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0)
	);
	let calculatedNettoCents = $derived(nonLaborCents + laborCents);
	let calculatedBruttoCents = $derived(Math.round(calculatedNettoCents * 1.19));
	const COST_PER_PERSON_HOUR = 18.23;
	let laborProfit = $derived(editPersons * editHours * (editRateCents / 100 - COST_PER_PERSON_HOUR));

	// Item reviewer state
	let reviewIndex = $state<number | null>(null);

	/**
	 * Opens the item reviewer lightbox at the position of the clicked item in the sorted list.
	 *
	 * Called by: Template (onclick on each row in the estimation items table)
	 * Purpose: Launches the full-screen image review overlay so the admin can inspect the source photo
	 *          and bounding box for a detected item before confirming or editing it.
	 *
	 * @param item - The EditableItem that was clicked
	 * @returns void (side-effect: sets `reviewIndex` to the item's position in `sortedItems()`)
	 */
	function openReview(item: EditableItem) {
		const items = sortedItems();
		const idx = items.indexOf(item);
		reviewIndex = idx >= 0 ? idx : 0;
	}

	/**
	 * Closes the item reviewer lightbox.
	 *
	 * Called by: Template (onclick on the lightbox close button), handleKeydown (on Escape key)
	 * Purpose: Returns the page to the normal items-table view after the admin is done reviewing an item.
	 *
	 * @returns void (side-effect: sets `reviewIndex = null`)
	 */
	function closeReview() {
		reviewIndex = null;
	}

	/**
	 * Moves the item reviewer to the previous item in the sorted list.
	 *
	 * Called by: Template (onclick on the left-chevron button in the reviewer), handleKeydown (ArrowLeft)
	 * Purpose: Allows the admin to flip through detected items sequentially without closing the lightbox.
	 *
	 * @returns void (side-effect: decrements `reviewIndex` if not already at index 0)
	 */
	function reviewPrev() {
		if (reviewIndex !== null && reviewIndex > 0) reviewIndex--;
	}

	/**
	 * Moves the item reviewer to the next item in the sorted list.
	 *
	 * Called by: Template (onclick on the right-chevron button in the reviewer), handleKeydown (ArrowRight)
	 * Purpose: Allows the admin to flip through detected items sequentially without closing the lightbox.
	 *
	 * @returns void (side-effect: increments `reviewIndex` if not already at the last item)
	 */
	function reviewNext() {
		if (reviewIndex !== null && reviewIndex < sortedItems().length - 1) reviewIndex++;
	}

	/**
	 * Deletes the currently reviewed item and adjusts the reviewer index to stay in bounds.
	 *
	 * Called by: Template (onclick on the delete button inside the item reviewer lightbox)
	 * Purpose: Lets the admin discard a falsely-detected item without leaving the reviewer,
	 *          automatically advancing to the next item or closing the lightbox when the last item is deleted.
	 *
	 * @returns void (side-effect: calls deleteItem, then adjusts `reviewIndex`)
	 */
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

	/**
	 * Handles keyboard shortcuts for the item reviewer and photo filter while no input is focused.
	 *
	 * Called by: Template (onkeydown on the document/page root)
	 * Purpose: Enables keyboard navigation — Escape closes the reviewer or clears the photo filter;
	 *          ArrowLeft/ArrowRight navigate between items in the reviewer. Keypresses inside
	 *          input, textarea, or select elements are ignored to avoid conflicts with text entry.
	 *
	 * @param e - The native KeyboardEvent
	 * @returns void
	 */
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
	let videoDragging = $state(false);
	let downloadingMedia = $state(false);

	let photoUploading = $state(false);
	let photoProgress = $state('');
	let photoFileInput = $state<HTMLInputElement | null>(null);
	let photoQueue = $state<File[]>([]);
	let photoDragging = $state(false);

	/**
	 * Downloads all source photos and videos for the quote as a single ZIP archive via the browser.
	 *
	 * Called by: Template (onclick on the "Alle Medien herunterladen" button in the photos card)
	 * Purpose: Provides the admin with an offline copy of all customer-supplied media in one action,
	 *          useful for sharing with the moving crew or archiving. Uses JSZip (dynamically imported)
	 *          to bundle files fetched from the API_BASE proxy without requiring a server-side ZIP endpoint.
	 *
	 * @returns void (side-effect: triggers browser download of `medien_{quoteId}.zip`, sets `downloadingMedia`)
	 */
	async function downloadAllMedia() {
		if (!data) return;
		downloadingMedia = true;
		try {
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();

			const images = estimationsList.flatMap(e => e.source_image_urls);
			const videos = estimationsList.filter(e => e.source_video_url).map(e => e.source_video_url!);

			if (images.length === 0 && videos.length === 0) {
				showToast('Keine Medien zum Herunterladen vorhanden', 'error');
				return;
			}

			const imgFolder = zip.folder('fotos');
			const vidFolder = zip.folder('videos');

			const imgPromises = images.map(async (url: string, i: number) => {
				const res = await fetch(API_BASE + url);
				const blob = await res.blob();
				const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
				imgFolder!.file(`foto_${i + 1}.${ext}`, blob);
			});

			const vidPromises = videos.map(async (url: string, i: number) => {
				const res = await fetch(API_BASE + url);
				const blob = await res.blob();
				const ext = blob.type.includes('webm') ? 'webm' : 'mp4';
				vidFolder!.file(`video_${i + 1}.${ext}`, blob);
			});

			await Promise.all([...imgPromises, ...vidPromises]);

			const content = await zip.generateAsync({ type: 'blob' });
			const quoteId = data.quote.id.slice(0, 8);
			const link = document.createElement('a');
			link.href = URL.createObjectURL(content);
			link.download = `medien_${quoteId}.zip`;
			link.click();
			URL.revokeObjectURL(link.href);

			showToast(`${images.length} Fotos und ${videos.length} Videos heruntergeladen`, 'success');
		} catch (e) {
			showToast('Download fehlgeschlagen: ' + (e as Error).message, 'error');
		} finally {
			downloadingMedia = false;
		}
	}

	/**
	 * Deletes an estimation entry and all its detected items after confirmation.
	 *
	 * Called by: Template (onclick on the X button next to each photo thumbnail and on failed estimation rows)
	 * Purpose: Removes a bad or duplicate AI analysis run so it no longer influences the volume total
	 *          or item list. Calls DELETE /api/v1/estimates/{estimationId} then reloads the quote.
	 *
	 * @param estimationId - UUID of the EstimationEntry to delete
	 * @returns void (side-effect: shows toast, calls loadQuote on success)
	 */
	async function deleteEstimation(estimationId: string) {
		if (!confirm('Diese Analyse und alle zugehörigen Gegenstände werden gelöscht.')) return;
		try {
			await apiDelete(`/api/v1/estimates/${estimationId}`);
			showToast('Analyse gelöscht', 'success');
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Validates and appends image files to the photo upload queue, rejecting non-images or files over 50 MB.
	 *
	 * Called by: handlePhotoSelect (after file picker selection), handlePhotoDrop (after drag-and-drop)
	 * Purpose: Guards the photo queue so only valid image files reach the upload step.
	 *          Accepts common image MIME types and extensions including HEIC/HEIF from iOS devices.
	 *
	 * @param files - FileList or File array from a file input or drag event
	 * @returns void (side-effect: appends valid files to `photoQueue`, shows error toast for rejected files)
	 */
	function addPhotoFiles(files: FileList | File[]) {
		const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
		for (const file of Array.from(files)) {
			const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
			if (!file.type.startsWith('image/') && !imageExtensions.includes(ext)) {
				showToast(`${file.name}: Keine Bilddatei`, 'error');
				continue;
			}
			if (file.size > 50 * 1024 * 1024) {
				showToast(`${file.name} zu gross (max. 50 MB)`, 'error');
				continue;
			}
			photoQueue = [...photoQueue, file];
		}
	}

	/**
	 * Reads image files from a file-input change event and forwards them to addPhotoFiles.
	 *
	 * Called by: Template (onchange on the hidden photo <input type="file"> in the photo-analysis card)
	 * Purpose: Bridges the native file-input event to the addPhotoFiles validation logic,
	 *          then resets the input so the same file can be selected again if needed.
	 *
	 * @param e - The native change Event from the file input element
	 * @returns void
	 */
	function handlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;
		addPhotoFiles(input.files);
		input.value = '';
	}

	/**
	 * Handles a drag-and-drop event on the photo drop zone and forwards files to addPhotoFiles.
	 *
	 * Called by: Template (ondrop on the photo dropzone in the photo-analysis card)
	 * Purpose: Allows the admin to drop photos directly onto the upload area without opening a file picker.
	 *
	 * @param e - The native DragEvent carrying the dropped files
	 * @returns void
	 */
	function handlePhotoDrop(e: DragEvent) {
		e.preventDefault();
		photoDragging = false;
		if (e.dataTransfer?.files) addPhotoFiles(e.dataTransfer.files);
	}

	/**
	 * Prevents the browser default drag behavior and activates the photo drop-zone highlight.
	 *
	 * Called by: Template (ondragover on the photo dropzone in the photo-analysis card)
	 * Purpose: Visual feedback so the admin sees the area is a valid drop target for images.
	 *
	 * @param e - The native DragEvent
	 * @returns void
	 */
	function handlePhotoDragOver(e: DragEvent) {
		e.preventDefault();
		photoDragging = true;
	}

	/**
	 * Clears the photo drop-zone drag-over highlight when the cursor leaves the zone.
	 *
	 * Called by: Template (ondragleave on the photo dropzone in the photo-analysis card)
	 * Purpose: Resets the drop zone to its idle visual state when the drag cursor exits.
	 *
	 * @returns void
	 */
	function handlePhotoDragLeave() {
		photoDragging = false;
	}

	/**
	 * Removes a photo from the staged upload queue before it is submitted.
	 *
	 * Called by: Template (onclick on the X button next to each queued photo in the upload list)
	 * Purpose: Lets the admin deselect a photo that was added by mistake before triggering the upload.
	 *
	 * @param idx - Zero-based position of the file to remove from `photoQueue`
	 * @returns void
	 */
	function removePhotoFromQueue(idx: number) {
		photoQueue = photoQueue.filter((_, i) => i !== idx);
	}

	/**
	 * Uploads all queued photos to the depth-sensor estimation endpoint and polls for results.
	 *
	 * Called by: Template (onclick on the "Fotos analysieren" button in the photo-analysis card)
	 * Purpose: Sends the queued images to the AI volume estimation pipeline via
	 *          POST /api/v1/estimates/depth-sensor (multipart FormData with quote_id and images[]).
	 *          After upload, polls for estimation completion via pollEstimations if any results are
	 *          still processing, or falls back to loadQuote if all are already complete.
	 *
	 * @returns void (side-effect: clears `photoQueue`, shows toast, calls pollEstimations or loadQuote)
	 */
	async function uploadPhotos() {
		if (photoQueue.length === 0 || !data) return;

		photoUploading = true;
		const count = photoQueue.length;
		photoProgress = `${count} Foto${count > 1 ? 's' : ''} wird hochgeladen...`;

		try {
			const formData = new FormData();
			formData.append('quote_id', data.quote.id);
			for (const file of photoQueue) {
				formData.append('images', file);
			}

			const results = await apiFetch<{ id: string; status: string }[]>(`/api/v1/estimates/depth-sensor`, {
				method: 'POST',
				body: formData,
			});

			photoQueue = [];
			showToast(`${count} Foto${count > 1 ? 's' : ''} hochgeladen — Analyse läuft`, 'success');

			const processingIds = results.filter(r => r.status === 'processing').map(r => r.id);
			if (processingIds.length > 0) {
				await pollEstimations(processingIds);
			} else {
				await loadQuote();
			}
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			photoUploading = false;
			photoProgress = '';
		}
	}

	/**
	 * Validates and appends video files to the video upload queue, rejecting non-video or oversized files.
	 *
	 * Called by: handleVideoSelect (after file picker selection), handleVideoDrop (after drag-and-drop)
	 * Purpose: Guards the video queue so only valid video files under 500 MB reach the upload step.
	 *          Checks both MIME type and common video file extensions (.mp4, .mov, .webm, .mkv, .avi).
	 *
	 * @param files - FileList or File array from a file input or drag event
	 * @returns void (side-effect: appends valid files to `videoQueue`, shows error toast for rejected files)
	 */
	function addVideoFiles(files: FileList | File[]) {
		const videoExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.avi'];
		for (const file of Array.from(files)) {
			const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
			if (!file.type.startsWith('video/') && !videoExtensions.includes(ext)) {
				showToast(`${file.name}: Keine Videodatei`, 'error');
				continue;
			}
			if (file.size > 500 * 1024 * 1024) {
				showToast(`${file.name} zu gross (max. 500 MB)`, 'error');
				continue;
			}
			videoQueue = [...videoQueue, file];
		}
	}

	/**
	 * Reads video files from a file-input change event and forwards them to addVideoFiles.
	 *
	 * Called by: Template (onchange on the hidden video <input type="file"> in the video-analysis card)
	 * Purpose: Bridges the native file-input event to the addVideoFiles validation logic,
	 *          then resets the input so the same file can be selected again.
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
	 * Handles a drag-and-drop event on the video drop zone and forwards files to addVideoFiles.
	 *
	 * Called by: Template (ondrop on the video dropzone in the video-analysis card)
	 * Purpose: Allows the admin to drop video files directly onto the upload area without a file picker.
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
	 * Called by: Template (ondragover on the video dropzone in the video-analysis card)
	 * Purpose: Visual feedback so the admin sees the area is a valid drop target for videos.
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
	 * Called by: Template (ondragleave on the video dropzone in the video-analysis card)
	 * Purpose: Resets the drop zone to its idle visual state when the drag cursor exits.
	 *
	 * @returns void
	 */
	function handleVideoDragLeave() {
		videoDragging = false;
	}

	/**
	 * Removes a video file from the staged upload queue before it is submitted.
	 *
	 * Called by: Template (onclick on the X button next to each queued video in the upload list)
	 * Purpose: Lets the admin deselect a video that was added by mistake before triggering the upload.
	 *
	 * @param idx - Zero-based position of the file to remove from `videoQueue`
	 * @returns void
	 */
	function removeFromQueue(idx: number) {
		videoQueue = videoQueue.filter((_, i) => i !== idx);
	}

	/**
	 * Formats a byte count as a human-readable KB or MB string.
	 *
	 * Called by: Template (to display the size of each file in the upload queue)
	 * Purpose: Renders file sizes in a compact, readable format for the queue list.
	 *
	 * @param bytes - File size in bytes
	 * @returns A formatted string such as "512 KB" or "1.4 MB"
	 */
	function formatFileSize(bytes: number): string {
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	/**
	 * Uploads all queued videos to the video estimation endpoint and polls for results.
	 *
	 * Called by: Template (onclick on the "Videos analysieren" button in the video-analysis card)
	 * Purpose: Sends queued videos to the AI volume estimation pipeline via
	 *          POST /api/v1/estimates/video (multipart FormData with quote_id and video fields).
	 *          After upload, polls for completion via pollEstimations if any results are still processing.
	 *
	 * @returns void (side-effect: clears `videoQueue`, shows toast, calls pollEstimations or loadQuote)
	 */
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

	/**
	 * Polls the estimation status endpoint at 5-second intervals until all estimations are done or timed out.
	 *
	 * Called by: uploadPhotos (after a photo upload), uploadVideos (after a video upload)
	 * Purpose: AI estimation runs asynchronously on the server; this loop keeps the UI informed of
	 *          progress and reloads the quote once all submitted estimations finish (or fail).
	 *          Polls GET /api/v1/estimates/{id} for each pending estimation ID.
	 *          Times out after 120 attempts (10 minutes at 5-second intervals).
	 *
	 * @param estimationIds - Array of estimation UUIDs returned from the upload response that are still processing
	 * @returns void (side-effect: updates `videoProgress` label, shows toast on completion/failure, calls loadQuote)
	 */
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

	// Normalize estimations: support new estimations[] array and old estimation singular object
	let estimationsList = $derived.by(() => {
		if (data?.estimations?.length) return data.estimations;
		const legacy = (data as any)?.estimation;
		if (!legacy) return [];
		// Map old shape to new EstimationEntry format
		return [{
			id: legacy.id ?? '',
			method: legacy.method ?? '',
			status: 'completed' as string,
			total_volume_m3: legacy.total_volume_m3 ?? null,
			item_count: legacy.items?.length ?? 0,
			created_at: '',
			source_video_url: null as string | null,
			source_image_urls: (legacy.source_images ?? []) as string[],
		},
		// If old shape had source_videos, create a separate entry per video
		...(legacy.source_videos ?? []).map((url: string) => ({
			id: legacy.id ?? '',
			method: 'video',
			status: 'completed' as string,
			total_volume_m3: null,
			item_count: 0,
			created_at: '',
			source_video_url: url,
			source_image_urls: [] as string[],
		}))
		] as EstimationEntry[];
	});

	let galleryEntries = $derived(
		estimationsList
			.filter(e => e.source_image_urls.length > 0)
			.flatMap(e => e.source_image_urls.map(url => ({ url: API_BASE + url, estimationId: e.id })))
	);
	let galleryImages = $derived(galleryEntries.map(e => e.url));

	let videoEntries = $derived(
		estimationsList
			.filter(e => e.source_video_url !== null)
			.map(e => ({ url: API_BASE + e.source_video_url!, estimationId: e.id }))
	);

	let processingEstimations = $derived(
		estimationsList.filter(e => e.status === 'processing')
	);
	let failedEstimations = $derived(
		estimationsList.filter(e => e.status === 'failed')
	);

	/**
	 * Toggles a photo-index filter that narrows the items table to only items seen in a given source photo.
	 *
	 * Called by: Template (onclick on each photo thumbnail in the gallery)
	 * Purpose: Allows the admin to cross-reference a specific photo with the items detected in it,
	 *          making it easy to verify or correct the AI's output for that image.
	 *          Clicking the same photo again clears the filter and shows all items.
	 *
	 * @param idx - Zero-based index of the source photo in `galleryImages`
	 * @returns void (side-effect: sets or clears `filterPhotoIndex`)
	 */
	function togglePhotoFilter(idx: number) {
		filterPhotoIndex = filterPhotoIndex === idx ? null : idx;
	}

	/**
	 * Copies the API-returned estimation items into the editable items state, resetting the dirty flag.
	 *
	 * Called by: loadQuote (after fetching fresh quote data)
	 * Purpose: Initialises `editItems` from the server response so the admin can edit quantities, volumes,
	 *          and names before saving. Maps nullable fields to explicit null to satisfy TypeScript.
	 *
	 * @param items - Array of EstimationItem objects from the API response
	 * @returns void (side-effect: sets `editItems` and resets `itemsDirty = false`)
	 */
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

	/**
	 * Calculates suggested persons, hours, rate, and line items for the offer pricing section.
	 *
	 * Called by: loadQuote (after data is fetched and items are initialised)
	 * Purpose: Seeds the pricing editor with an intelligent starting point so the admin doesn't need
	 *          to compute staffing manually. If a latest_offer already exists, it re-uses that offer's
	 *          values instead of re-computing. Otherwise applies the floor/elevator heuristic:
	 *          extra persons for floors without elevators, hours derived from volume.
	 *
	 * Math:
	 *   originExtra = originFloor > 0 && !originElev ? originFloor : 0
	 *   destExtra   = destFloor > 0 && !destElev   ? destFloor   : 0
	 *   persons     = max(2, 2 + originExtra + destExtra)
	 *   hours       = max(1, ceil(volume_m3 / (persons * 2.0)))
	 *   rate        = 3000 cents (30.00 EUR/h, fixed default)
	 *
	 * @returns void (side-effect: updates editPersons, editHours, editRateCents, editBruttoCents,
	 *          editLineItems, priceDirty)
	 */
	function computePricingDefaults() {
		if (!data) return;

		// If an offer exists with edited values, use those instead of recomputing
		if (data.latest_offer) {
			const lo = data.latest_offer;
			editPersons = lo.persons;
			editHours = lo.hours;
			editRateCents = lo.rate_cents;
			editBruttoCents = lo.total_brutto_cents;
			// Build editable line items from offer (non-labor only, normalize flat-total items)
			editLineItems = lo.line_items
				.filter(li => !li.is_labor)
				.map(li => {
					const normalized = normalizeFlatTotalItem(li);
					const match = ROW_OPTIONS.find(r => r.label === li.label);
					return mkLineItem(
						match?.row ?? 99,
						li.label,
						normalized.quantity,
						normalized.unit_price_cents,
						li.remark ?? '',
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

	/**
	 * Fetches the full quote detail from the API and initialises all page state.
	 *
	 * Called by: $effect (on mount, keyed on the route `id` param), and after any mutation (save, delete, upload)
	 * Purpose: Primary data loader for the quote detail page. Calls GET /api/v1/quotes/{id},
	 *          then seeds editVolume, editDistance, editNotes, editItems (via initEditItems),
	 *          and pricing defaults (via computePricingDefaults). Also fires a non-blocking
	 *          POST /api/v1/distance/calculate to populate the RouteMap polyline.
	 *          Handles both the current API shape (top-level `items`) and the legacy shape
	 *          (`estimation.items`) for backwards compatibility.
	 *
	 * @returns void (side-effect: sets `data`, edit* fields, `routeCoordinates`, `loading`)
	 */
	async function loadQuote() {
		loading = true;
		try {
			const id = $page.params.id;
			data = await apiGet<QuoteDetail>(`/api/v1/quotes/${id}`);
			editVolume = data.quote.volume_m3;
			editDistance = data.quote.distance_km;
			editNotes = data.quote.notes || '';
			// items may be top-level (new API) or nested in estimation (old API)
			const items = (data as any).items?.length
				? (data as any).items
				: (data as any).estimation?.items?.length
					? (data as any).estimation.items
					: null;
			if (items) {
				initEditItems(items);
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

	/**
	 * Persists the edited volume, distance, and notes fields to the API.
	 *
	 * Called by: Template (onclick on the "Speichern" button in the Details card)
	 * Purpose: Saves manual corrections to quote metadata without affecting items or pricing.
	 *          Calls PATCH /api/v1/quotes/{id} with estimated_volume_m3, distance_km, and notes.
	 *          On success reloads the quote so derived state (pricing defaults, map) refreshes.
	 *
	 * @returns void (side-effect: sets `saving`, shows toast, calls loadQuote on success)
	 */
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

	/**
	 * Bulk-saves all editable estimation items to the API and updates the volume field.
	 *
	 * Called by: Template (onclick on the "Gegenstaende speichern" button in the items card)
	 * Purpose: Persists any admin corrections to item names, quantities, or volumes made in the
	 *          inline editable items table. Calls PUT /api/v1/quotes/{id}/estimation-items with
	 *          the full current items array. After a successful save, syncs editVolume to the
	 *          computed total so the volume field reflects the corrected item list.
	 *
	 * @returns void (side-effect: sets `savingItems`, clears `itemsDirty`, shows toast)
	 */
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

	/**
	 * Marks the items list as having unsaved changes, enabling the save button.
	 *
	 * Called by: Template (oninput on any editable field in the items table)
	 * Purpose: Tracks whether the admin has made local edits that have not yet been persisted,
	 *          so the UI can show a "save" prompt and prevent accidental data loss.
	 *
	 * @returns void (side-effect: sets `itemsDirty = true`)
	 */
	function markDirty() {
		itemsDirty = true;
	}

	/**
	 * Appends a new blank item row to the editable items list.
	 *
	 * Called by: Template (onclick on the "+" button at the bottom of the items table)
	 * Purpose: Lets the admin manually add a piece of furniture or other item that was missed by the
	 *          AI estimation or entered without photo analysis.
	 *
	 * @returns void (side-effect: appends to `editItems`, sets `itemsDirty = true`)
	 */
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

	/**
	 * Removes a specific item from the editable items list by reference.
	 *
	 * Called by: reviewDelete (from the reviewer lightbox), Template (onclick on delete button in each item row)
	 * Purpose: Lets the admin discard a falsely-detected or duplicate item from the estimation list.
	 *
	 * @param item - The EditableItem instance to remove (matched by reference, not index)
	 * @returns void (side-effect: filters `editItems`, sets `itemsDirty = true`)
	 */
	function deleteItem(item: EditableItem) {
		editItems = editItems.filter((i) => i !== item);
		itemsDirty = true;
	}

	/**
	 * Back-calculates the hourly rate from a manually entered brutto total and updates editRateCents.
	 *
	 * Called by: Template (oninput on the brutto price field in the pricing card)
	 * Purpose: Allows the admin to set a desired final price and have the implied hourly rate
	 *          computed automatically, keeping persons and hours constant.
	 *
	 * Math:
	 *   targetNetto      = round(editBruttoCents / 1.19)
	 *   availableForLabor = targetNetto - nonLaborCents
	 *   editRateCents    = round(availableForLabor / (persons * hours))
	 *
	 * @returns void (side-effect: updates `editRateCents` if persons > 0, hours > 0, and availableForLabor > 0;
	 *          sets `priceDirty = true`)
	 */
	function onBruttoChange() {
		const targetNetto = Math.round(editBruttoCents / 1.19);
		const availableForLabor = targetNetto - nonLaborCents;
		if (editPersons > 0 && editHours > 0 && availableForLabor > 0) {
			editRateCents = Math.round(availableForLabor / (editPersons * editHours));
		}
		priceDirty = true;
	}

	// Most recent non-deleted offer for this quote
	let latestOffer = $derived(
		(data?.offers ?? []).filter(o => o.status !== 'deleted').at(-1) ?? null
	);

	/**
	 * Triggers a full re-estimation of the latest offer, recalculating distance and regenerating the PDF.
	 *
	 * Called by: Template (onclick on the "Neu berechnen" button in the page header)
	 * Purpose: Used after address corrections to recompute distance-based pricing and regenerate the offer.
	 *          Calls POST /api/v1/admin/offers/{latestOfferId}/re-estimate.
	 *          Prompts for confirmation before proceeding.
	 *
	 * @returns void (side-effect: shows toast, calls loadQuote on success)
	 */
	async function reEstimateOffer() {
		if (!latestOffer) return;
		if (!confirm('Entfernung neu berechnen und Angebot neu erstellen?')) return;
		try {
			await apiPost(`/api/v1/admin/offers/${latestOffer.id}/re-estimate`, {});
			showToast('Angebot wird neu berechnet...', 'success');
			await loadQuote();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Generates a new offer PDF from the current quote using the admin's edited pricing inputs.
	 *
	 * Called by: Template (onclick on the "Angebot erstellen" button in the page header)
	 * Purpose: Creates the first offer for this quote by posting all pricing parameters to the
	 *          generation endpoint. Calls POST /api/v1/offers/generate with quote_id, persons, hours,
	 *          rate, optionally price_cents_netto (when priceDirty), and optionally line_items.
	 *          Reloads the quote after success so the new offer appears in the offers list.
	 *
	 * @returns void (side-effect: shows toast, calls loadQuote on success)
	 */
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
			if (editLineItems.length > 0) {
				payload.line_items = editLineItems.map(li => ({
					description: li.label,
					quantity: li.quantity,
					unit_price: li.unitPriceCents / 100,
					...(li.remark ? { remark: li.remark } : {}),
				}));
			}
			await apiPost<{ id: string }>(`/api/v1/offers/generate`, payload);

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

	/**
	 * Updates the quote's workflow status via the API using the status dropdown.
	 *
	 * Called by: Template (onchange on the status <select> in the page header)
	 * Purpose: Allows the admin to manually override the quote lifecycle state (e.g. mark as paid,
	 *          cancelled, or done) without going through automated transitions.
	 *          Calls POST /api/v1/admin/quotes/{id}/status with the new status value.
	 *          No-ops if the selected value equals the current status.
	 *
	 * @param newStatus - The target status string (e.g. 'accepted', 'done', 'paid', 'cancelled')
	 * @returns void (side-effect: sets `changingStatus`, shows toast, calls loadQuote on success)
	 */
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

	/**
	 * Permanently deletes the quote and navigates back to the quotes list.
	 *
	 * Called by: Template (onclick on the Trash2 delete button in the page header)
	 * Purpose: Hard-removes a quote that was created in error or is no longer needed.
	 *          Calls POST /api/v1/admin/quotes/{id}/delete.
	 *          Prompts for confirmation before proceeding.
	 *
	 * @returns void (side-effect: shows toast, navigates to /admin/quotes)
	 */
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

	/**
	 * Copies the origin address fields into the inline edit form and activates origin edit mode.
	 *
	 * Called by: Template (onclick on the "Bearbeiten" button in the origin address card)
	 * Purpose: Seeds the inline address editor with the current values so the admin starts from
	 *          existing data rather than an empty form.
	 *
	 * @returns void (side-effect: populates `editOrigin`, sets `editingOrigin = true`)
	 */
	function startEditOrigin() {
		if (!data?.origin_address) return;
		const a = data.origin_address;
		editOrigin = { street: a.street, postal_code: a.postal_code || '', city: a.city, floor: a.floor || '0', elevator: a.elevator ?? false };
		editingOrigin = true;
	}

	/**
	 * Copies the destination address fields into the inline edit form and activates destination edit mode.
	 *
	 * Called by: Template (onclick on the "Bearbeiten" button in the destination address card)
	 * Purpose: Seeds the inline address editor with the current values so the admin starts from
	 *          existing data rather than an empty form.
	 *
	 * @returns void (side-effect: populates `editDest`, sets `editingDest = true`)
	 */
	function startEditDest() {
		if (!data?.destination_address) return;
		const a = data.destination_address;
		editDest = { street: a.street, postal_code: a.postal_code || '', city: a.city, floor: a.floor || '0', elevator: a.elevator ?? false };
		editingDest = true;
	}

	/**
	 * Saves an edited address (origin or destination) to the API and exits edit mode.
	 *
	 * Called by: Template (onclick on the "Speichern" button inside the inline origin/destination address form)
	 * Purpose: Persists corrections to street, city, postal code, floor, or elevator for either address.
	 *          Calls PATCH /api/v1/admin/addresses/{addressId} then reloads the quote so the
	 *          route map and pricing defaults reflect the corrected address.
	 *
	 * @param addressId - UUID of the address record to update
	 * @param fields - Object with the current form values (street, postal_code, city, floor, elevator)
	 * @param setEditing - Callback to set the editing flag (e.g. `(v) => editingOrigin = v`) to false on success
	 * @returns void (side-effect: shows toast, calls setEditing(false) and loadQuote on success)
	 */
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
				{#if latestOffer}
					<button class="btn btn-primary" onclick={reEstimateOffer}>
						<RotateCcw size={16} />
						Neu berechnen
					</button>
				{:else}
					<button class="btn btn-primary" onclick={generateOffer}>
						<FileOutput size={16} />
						Angebot erstellen
					</button>
				{/if}
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
								<label for="origin-street">Strasse</label>
								<input id="origin-street" type="text" bind:value={editOrigin.street} />
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
								<label for="dest-street">Strasse</label>
								<input id="dest-street" type="text" bind:value={editDest.street} />
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

			<!-- Route Map -->
			{#if routeCoordinates}
				<RouteMap coordinates={routeCoordinates} distanceKm={editDistance} />
			{/if}

			<!-- Customer Message -->
			{#if data.quote.customer_message}
				<div class="card">
					<h3>Kundennachricht</h3>
					<p class="customer-message">{data.quote.customer_message}</p>
				</div>
			{/if}

			<!-- Estimation Status (processing / failed) -->
			{#if processingEstimations.length > 0 || failedEstimations.length > 0}
				<div class="card full-width">
					{#each processingEstimations as est}
						<div class="estimation-status-row">
							<div class="upload-spinner"></div>
							<span>{est.method === 'video' ? 'Video' : 'Foto'}-Analyse wird verarbeitet...</span>
						</div>
					{/each}
					{#each failedEstimations as est}
						<div class="estimation-status-row estimation-failed">
							<span>{est.method === 'video' ? 'Video' : 'Foto'}-Analyse fehlgeschlagen</span>
							<button class="btn btn-sm btn-danger" onclick={() => deleteEstimation(est.id)}>
								<Trash2 size={14} /> Entfernen
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Source Photos Gallery -->
			{#if galleryImages.length > 0}
				<div class="card full-width">
					<div class="card-header">
						<h3>Fotos ({galleryImages.length})</h3>
						{#if galleryEntries.length > 0 || videoEntries.length > 0}
							<button
								class="download-all-btn"
								onclick={downloadAllMedia}
								disabled={downloadingMedia}
							>
								{#if downloadingMedia}
									ZIP wird erstellt…
								{:else}
									<Download size={16} /> Alle Medien herunterladen
								{/if}
							</button>
						{/if}
						{#if filterPhotoIndex !== null}
							<button class="btn btn-sm" onclick={() => { filterPhotoIndex = null; }}>
								<X size={14} />
								Filter aufheben
							</button>
						{/if}
					</div>
					<div class="photo-grid">
						{#each galleryImages as url, idx}
							<div class="photo-thumb-wrapper">
								<button
									class="photo-thumb-btn"
									class:photo-active={filterPhotoIndex === idx}
									onclick={() => togglePhotoFilter(idx)}
								>
									<img src={url} alt="Foto {idx + 1}" class="photo-thumb" />
								</button>
								<button
									class="photo-delete-btn"
									onclick={() => deleteEstimation(galleryEntries[idx].estimationId)}
									title="Analyse löschen"
								>
									<X size={12} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Photo Upload -->
			<div class="card full-width">
				<div class="card-header">
					<h3>Foto-Analyse</h3>
				</div>
				{#if photoUploading}
					<div class="upload-status">
						<div class="upload-spinner"></div>
						<span>{photoProgress}</span>
					</div>
				{:else}
					{#if photoQueue.length > 0}
						<div class="upload-queue">
							{#each photoQueue as file, idx}
								<div class="upload-queue-item">
									<ImagePlus size={16} />
									<span class="upload-queue-name">{file.name}</span>
									<span class="upload-queue-size">{formatFileSize(file.size)}</span>
									<button class="del-btn" onclick={() => removePhotoFromQueue(idx)} title="Entfernen">
										<X size={14} />
									</button>
								</div>
							{/each}
							<div class="upload-queue-actions">
								<label for="photo-upload" class="btn btn-sm upload-add-more">
									<Plus size={14} />
									Weiteres Foto
								</label>
								<button class="btn btn-primary" onclick={uploadPhotos}>
									<Upload size={16} />
									{photoQueue.length} Foto{photoQueue.length > 1 ? 's' : ''} hochladen
								</button>
							</div>
						</div>
					{/if}
					<input
						type="file"
						accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
						multiple
						onchange={handlePhotoSelect}
						bind:this={photoFileInput}
						class="upload-file-input"
						id="photo-upload"
					/>
					{#if photoQueue.length === 0}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="upload-drop-label"
							class:upload-dragging={photoDragging}
							ondrop={handlePhotoDrop}
							ondragover={handlePhotoDragOver}
							ondragleave={handlePhotoDragLeave}
							onclick={() => photoFileInput?.click()}
							role="button"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') photoFileInput?.click(); }}
						>
							<ImagePlus size={24} />
							<span>Fotos hierher ziehen oder klicken</span>
							<span class="upload-hint">JPG, PNG, WebP, HEIC (max. 50 MB pro Bild)</span>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Video Upload -->
			<div class="card full-width">
				<div class="card-header">
					<h3>Video-Analyse</h3>
				</div>
				{#if videoEntries.length > 0}
					<div class="video-gallery">
						{#each videoEntries as entry}
							<div class="video-item">
								<video controls preload="metadata" class="video-player">
									<source src={entry.url} />
								</video>
								<button
									class="video-delete-btn"
									onclick={() => deleteEstimation(entry.estimationId)}
									title="Video-Analyse löschen"
								>
									<Trash2 size={14} /> Löschen
								</button>
							</div>
						{/each}
					</div>
				{/if}
				{#if videoUploading}
					<div class="upload-status">
						<div class="upload-spinner"></div>
						<span>{videoProgress}</span>
					</div>
				{:else}
					{#if videoQueue.length > 0}
						<div class="upload-queue">
							{#each videoQueue as file, idx}
								<div class="upload-queue-item">
									<Video size={16} />
									<span class="upload-queue-name">{file.name}</span>
									<span class="upload-queue-size">{formatFileSize(file.size)}</span>
									<button class="del-btn" onclick={() => removeFromQueue(idx)} title="Entfernen">
										<X size={14} />
									</button>
								</div>
							{/each}
							<div class="upload-queue-actions">
								<label for="video-upload" class="btn btn-sm upload-add-more">
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
						multiple
						onchange={handleVideoSelect}
						bind:this={videoFileInput}
						class="upload-file-input"
						id="video-upload"
					/>
					{#if videoQueue.length === 0}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="upload-drop-label"
							class:upload-dragging={videoDragging}
							ondrop={handleVideoDrop}
							ondragover={handleVideoDragOver}
							ondragleave={handleVideoDragLeave}
							onclick={() => videoFileInput?.click()}
							role="button"
							tabindex="0"
							onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') videoFileInput?.click(); }}
						>
							<Video size={24} />
							<span>Videos hierher ziehen oder klicken</span>
							<span class="upload-hint">MP4, MOV, WebM (max. 500 MB pro Video)</span>
						</div>
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
							Erfasste Gegenstaende ({editItems.length})
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
					<span class="labor-profit" class:negative={laborProfit < 0}>{laborProfit.toFixed(2)} &euro;</span>
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
							<div class="li-edit-top">
								<select bind:value={li.row} onchange={() => onLineItemRowChange(idx)}>
									{#each ROW_OPTIONS as opt}
										<option value={opt.row}>{opt.label}</option>
									{/each}
								</select>
								{#if li.row === 99}
									<input
										type="text"
										class="edit-li-label"
										bind:value={li.label}
										placeholder="Bezeichnung"
									/>
								{/if}
								<button class="del-btn" onclick={() => removeLineItem(idx)} title="Entfernen">
									<X size={14} />
								</button>
							</div>
							<div class="li-edit-bottom">
								<input
									type="text"
									class="edit-li-remark"
									bind:value={li.remark}
									placeholder="Bemerkung"
								/>
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

			{#if latestOffer}
				<button class="btn-generate-bottom" onclick={reEstimateOffer}>
					<RotateCcw size={20} />
					Neu berechnen
				</button>
			{:else}
				<button class="btn-generate-bottom" onclick={generateOffer}>
					<FileOutput size={20} />
					Angebot erstellen
				</button>
			{/if}
		</div>
	{/if}
</div>

<svelte:window onkeydown={handleKeydown} />

{#if reviewIndex !== null}
	{@const items = sortedItems()}
	{@const rItem = items[reviewIndex]}
	{#if rItem}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="review-backdrop" role="presentation" onclick={(e) => { if (e.target === e.currentTarget) closeReview(); }}>
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
						<label for="review-item-name">Gegenstand</label>
						<input
							id="review-item-name" type="text"
							bind:value={rItem.name}
							oninput={markDirty}
							class="review-input"
						/>
					</div>
					<div class="review-row">
						<div class="review-field">
							<label for="review-volume">Volumen (m3)</label>
							<input
								id="review-volume" type="number"
								min="0"
								step="0.01"
								bind:value={rItem.volume_m3}
								oninput={markDirty}
								class="review-input review-input-num"
							/>
						</div>
						<div class="review-field">
							<label for="review-quantity">Anzahl</label>
							<input
								id="review-quantity" type="number"
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

	/* Upload Queue (shared by photo & video) */
	.upload-queue {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.upload-queue-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #e8ecf1;
		border-radius: 8px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.upload-queue-name {
		flex: 1;
		font-size: 0.8125rem;
		color: #334155;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.upload-queue-size {
		font-size: 0.75rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.upload-queue-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.upload-add-more {
		cursor: pointer;
	}

	.upload-file-input {
		display: none;
	}

	.upload-drop-label {
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

	.upload-drop-label:hover,
	.upload-drop-label.upload-dragging {
		border-color: #6366f1;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.04);
	}

	.upload-hint {
		font-size: 0.6875rem;
		color: #94a3b8;
	}

	.upload-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		color: #6366f1;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.upload-spinner {
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

	.labor-profit {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #22c55e;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
	}

	.labor-profit.negative {
		color: #ef4444;
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
		padding: 0.5rem 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.375rem;
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

	.edit-li-label {
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

	.edit-li-label:focus {
		box-shadow: inset 1px 1px 3px #d1d9e6, inset -1px -1px 3px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	.edit-li-remark {
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

	.edit-li-remark:focus {
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

	.photo-thumb-wrapper {
		position: relative;
	}

	.photo-delete-btn {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		color: #fff;
		border: none;
		cursor: pointer;
		opacity: 0;
		transition: opacity 150ms ease;
	}

	.photo-thumb-wrapper:hover .photo-delete-btn {
		opacity: 1;
	}

	.video-item {
		position: relative;
	}

	.video-delete-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 0.375rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: #ef4444;
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 150ms ease;
	}

	.video-delete-btn:hover { opacity: 1; }

	.estimation-status-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		font-size: 0.8125rem;
		color: #6366f1;
		border-radius: 8px;
		background: #f1f5f9;
		margin-bottom: 0.5rem;
	}

	.estimation-status-row.estimation-failed {
		color: #ef4444;
		background: #fef2f2;
		justify-content: space-between;
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

		.li-edit-top select {
			min-width: 0;
			flex: 1;
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

	.download-all-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--admin-primary, #6366f1);
		background: #ffffff;
		border: none;
		border-radius: 8px;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.download-all-btn:hover:not(:disabled) {
		background: var(--admin-primary, #6366f1);
		color: #ffffff;
	}

	.download-all-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}
</style>
