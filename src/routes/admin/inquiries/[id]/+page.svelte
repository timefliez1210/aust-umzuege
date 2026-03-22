<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import {
		apiFetch,
		apiGet,
		apiPatch,
		apiPost,
		apiPut,
		apiDelete,
		apiDownload,
		formatDate,
		formatDateTime,
		formatEuro,
		API_BASE,
	} from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
	import PriceInput from "$lib/components/admin/PriceInput.svelte";
	import RouteMap from "$lib/components/admin/RouteMap.svelte";
	import MediaDropzone from "$lib/components/MediaDropzone.svelte";
	import MediaPreviewGrid from "$lib/components/MediaPreviewGrid.svelte";
	import { floorLabel, parseFloor } from "$lib/utils/floor";
	import { sortItems, filterItemsByPhotoIndex } from "$lib/utils/sorting";
	import { computeTotalVolume } from "$lib/utils/volume";
	import { normalizeFlatTotalItem } from "$lib/utils/pricing";
	import {
		ArrowLeft,
		Save,
		FileOutput,
		RotateCcw,
		Trash2,
		X,
		Pencil,
		Plus,
		ChevronLeft,
		ChevronRight,
		Upload,
		Video,
		Download,
		Send,
	} from "lucide-svelte";

	interface AddressSnapshot {
		id: string;
		street: string;
		city: string;
		postal_code: string | null;
		country: string;
		floor: string | null;
		elevator: boolean | null;
		needs_parking_ban: boolean | null;
		latitude: number | null;
		longitude: number | null;
	}

	interface CustomerSnapshot {
		id: string;
		name: string | null;
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		email: string;
		phone: string | null;
	}

	interface ItemSnapshot {
		name: string;
		volume_m3: number;
		quantity: number;
		confidence: number;
		category: string | null;
		dimensions: unknown | null;
		crop_url: string | null;
		crop_s3_key?: string | null;
		source_image_url: string | null;
		bbox: number[] | null;
		bbox_image_index: number | null;
		seen_in_images: number[] | null;
		is_moveable?: boolean;
		packs_into_boxes?: boolean;
	}

	interface EstimationSnapshot {
		id: string;
		method: string;
		status: string;
		total_volume_m3: number | null;
		confidence_score: number | null;
		item_count: number;
		source_images: string[];
		source_video: string | null;
		created_at: string;
	}

	interface LineItemSnapshot {
		label: string;
		remark: string | null;
		quantity: number;
		unit_price_cents: number;
		total_cents: number;
		is_labor: boolean;
		is_flat_total: boolean;
	}

	interface OfferSnapshot {
		id: string;
		offer_number: string | null;
		status: string;
		persons: number;
		hours: number;
		rate_cents: number;
		total_netto_cents: number;
		total_brutto_cents: number;
		line_items: LineItemSnapshot[];
		pdf_url: string | null;
		valid_until: string | null;
		created_at: string;
	}

	interface Services {
		packing: boolean;
		assembly: boolean;
		disassembly: boolean;
		storage: boolean;
		disposal: boolean;
		parking_ban_origin: boolean;
		parking_ban_destination: boolean;
	}

	interface InquiryResponse {
		id: string;
		status: string;
		source: string;
		services: Services;
		volume_m3: number | null;
		distance_km: number | null;
		preferred_date: string | null;
		scheduled_date: string | null;
		notes: string | null;
		customer_message: string | null;
		created_at: string;
		updated_at: string;
		offer_sent_at: string | null;
		accepted_at: string | null;

		customer: CustomerSnapshot | null;
		origin_address: AddressSnapshot | null;
		destination_address: AddressSnapshot | null;
		stop_address: AddressSnapshot | null;
		estimation: EstimationSnapshot | null;
		items: ItemSnapshot[];
		offer: OfferSnapshot | null;
		employees?: EmployeeAssignment[];
	}

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		planned_hours: number;
		clock_in: string | null;
		clock_out: string | null;
		actual_hours: number | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_actual_hours: number | null;
		notes: string | null;
	}

	interface EmployeeOption {
		id: string;
		first_name: string;
		last_name: string;
		email: string;
	}

	interface EditableItem {
		name: string;
		volume_m3: number;
		quantity: number;
		confidence: number;
		crop_url: string | null;
		crop_s3_key: string | null;
		source_image_url: string | null;
		bbox: number[] | null;
		bbox_image_index: number | null;
		seen_in_images: number[] | null;
		category: string | null;
		dimensions: unknown | null;
		is_moveable: boolean;
		packs_into_boxes: boolean;
	}

	let data = $state<InquiryResponse | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let savingItems = $state(false);

	// Route map coordinates
	let routeCoordinates = $state<[number, number][] | null>(null);

	// Editable fields
	let editVolume = $state<number | null>(null);
	let editDistance = $state(0);
	let editNotes = $state("");
	let editDate = $state("");

	// Pricing fields
	let editPersons = $state(2);
	let editHours = $state(3);
	let editRateCents = $state(3000);
	let editBruttoCents = $state(0);
	let priceDirty = $state(false);

	// Local string state for rate input to avoid cursor-resetting
	let rateText = $state("30.00");
	let rateEditing = $state(false);

	let editingCustomer = $state(false);
	let editCustomer = $state({ first_name: "", last_name: "", email: "", phone: "" });

	let editingOrigin = $state(false);
	let editingDest = $state(false);
	let editOrigin = $state({
		street: "",
		postal_code: "",
		city: "",
		floor: "0",
		elevator: false,
	});
	let editDest = $state({
		street: "",
		postal_code: "",
		city: "",
		floor: "0",
		elevator: false,
	});

	// Editable items
	let editItems = $state<EditableItem[]>([]);
	let itemsDirty = $state(false);

	// Items sorting
	let sortKey = $state<"name" | "quantity" | "volume_m3" | null>(null);
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
	function toggleSort(key: "name" | "quantity" | "volume_m3") {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	// Derived item slices by transport category
	let mainItems = $derived(editItems.filter((i) => i.is_moveable && !i.packs_into_boxes));
	let boxItems = $derived(editItems.filter((i) => i.is_moveable && i.packs_into_boxes));
	let nonMoveableItems = $derived(editItems.filter((i) => !i.is_moveable));
	let showNonMoveable = $state(false);

	// Filtered item slices for sections B and C when photo filter is active
	let filteredBoxItems = $derived(
		filterPhotoIndex !== null ? filterItemsByPhotoIndex(boxItems, filterPhotoIndex) : boxItems,
	);
	let filteredNonMoveableItems = $derived(
		filterPhotoIndex !== null
			? filterItemsByPhotoIndex(nonMoveableItems, filterPhotoIndex)
			: nonMoveableItems,
	);

	let sortedItems = $derived(() => {
		const filtered = filterItemsByPhotoIndex(mainItems, filterPhotoIndex);
		return sortItems(filtered, sortKey, sortAsc);
	});

	// Live-computed total volume from main (moveable, non-box) items only
	let computedTotal = $derived(computeTotalVolume(mainItems));

	// Editable line items
	const ROW_OPTIONS: { row: number; label: string; defaultCents: number; defaultRemark: string }[] =
		[
			{ row: 30, label: "Fahrkostenpauschale", defaultCents: 0, defaultRemark: "" },
			{ row: 31, label: "Demontage", defaultCents: 5000, defaultRemark: "" },
			{ row: 32, label: "Montage", defaultCents: 5000, defaultRemark: "" },
			{ row: 33, label: "Halteverbotszone", defaultCents: 10000, defaultRemark: "" },
			{ row: 34, label: "Umzugsmaterial", defaultCents: 3000, defaultRemark: "Stretchfolie, Decken, Gurte" },
			{ row: 35, label: "Möbellift", defaultCents: 0, defaultRemark: "" },
			{ row: 36, label: "Verleih Kleiderboxen", defaultCents: 1000, defaultRemark: "610x520x1370" },
			{ row: 37, label: "Verkauf Seidenpapier", defaultCents: 500, defaultRemark: "500x750" },
			{ row: 38, label: "Verkauf U-Karton", defaultCents: 210, defaultRemark: "590x318x328" },
			{ row: 39, label: "Verkauf B-Karton", defaultCents: 220, defaultRemark: "400x318x328" },
			{ row: 99, label: "Sonstiges", defaultCents: 0, defaultRemark: "" },
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
	function mkLineItem(
		row: number,
		label: string,
		quantity: number,
		unitPriceCents: number,
		remark: string = "",
	): EditLineItem {
		return {
			row,
			label,
			remark,
			quantity,
			unitPriceCents,
			_priceText: (unitPriceCents / 100).toFixed(2),
			_editing: false,
		};
	}

	/**
	 * Auto-generates a suggested set of extra line items by scanning the inquiry notes for service keywords.
	 *
	 * Called by: computePricingDefaults (after loading a new inquiry), Template (no direct call — triggered via computePricingDefaults)
	 * Purpose: Reduces manual data entry by pre-filling line items from structured notes entered at inquiry creation.
	 *          The backend will independently re-generate Fahrkostenpauschale via ORS, so it is not included here.
	 *          Matches the auto-generation logic in the backend's `build_line_items()`.
	 *
	 * @returns void (side-effect: replaces `editLineItems` with auto-computed items)
	 */
	function computeLineItemsFromNotes() {
		const notes = editNotes.toLowerCase();
		const items: EditLineItem[] = [];

		if (notes.includes("demontage")) {
			items.push(mkLineItem(31, "Demontage", 1, 5000));
		}
		// Check "montage" separately — strip "demontage" occurrences first to avoid false positive
		if (notes.replace("demontage", "").includes("montage")) {
			items.push(mkLineItem(32, "Montage", 1, 5000));
		}

		const hvAuszug = notes.includes("halteverbot auszug");
		const hvEinzug = notes.includes("halteverbot einzug");
		const hvCount = (hvAuszug ? 1 : 0) + (hvEinzug ? 1 : 0);
		if (hvCount > 0) {
			const remark =
				hvAuszug && hvEinzug
					? "Beladestelle + Entladestelle"
					: hvAuszug
						? "Beladestelle"
						: "Entladestelle";
			items.push(
				mkLineItem(33, "Halteverbotszone", hvCount, 10000, remark),
			);
		}

		if (
			notes.includes("verpackungsservice") ||
			notes.includes("einpackservice")
		) {
			items.push(
				mkLineItem(
					34,
					"Umzugsmaterial",
					1,
					3000,
					"Stretchfolie, Decken, Gurte Einzelpreis 30,00 €",
				),
			);
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
		editLineItems = [
			...editLineItems,
			mkLineItem(31, "Demontage", 1, 5000),
		];
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
		const opt = ROW_OPTIONS.find((r) => r.row === item.row);
		if (opt) {
			if (item.row === 99) {
				item.label = "";
				item.unitPriceCents = 0;
				item._priceText = "0.00";
				item.remark = "";
			} else {
				item.label = opt.label;
				item.unitPriceCents = opt.defaultCents;
				item._priceText = (opt.defaultCents / 100).toFixed(2);
				item.remark = opt.defaultRemark;
			}
		}
		editLineItems = [...editLineItems];
	}

	let laborCents = $derived(editPersons * editHours * editRateCents);
	let nonLaborCents = $derived(
		editLineItems.reduce(
			(sum, li) => sum + li.quantity * li.unitPriceCents,
			0,
		),
	);
	let calculatedNettoCents = $derived(nonLaborCents + laborCents);
	let calculatedBruttoCents = $derived(
		Math.round(calculatedNettoCents * 1.19),
	);
	const COST_PER_PERSON_HOUR = 18.23;
	let laborProfit = $derived(
		editPersons * editHours * (editRateCents / 100 - COST_PER_PERSON_HOUR),
	);

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
		if (reviewIndex !== null && reviewIndex < sortedItems().length - 1)
			reviewIndex++;
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
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

		if (reviewIndex !== null) {
			if (e.key === "Escape") {
				closeReview();
				e.preventDefault();
			} else if (e.key === "ArrowLeft") {
				reviewPrev();
				e.preventDefault();
			} else if (e.key === "ArrowRight") {
				reviewNext();
				e.preventDefault();
			}
		} else if (photoDetailIndex !== null) {
			if (e.key === "Escape") {
				closePhotoDetail();
				e.preventDefault();
			} else if (e.key === "ArrowLeft") {
				photoDetailPrev();
				e.preventDefault();
			} else if (e.key === "ArrowRight") {
				photoDetailNext();
				e.preventDefault();
			}
		} else if (filterPhotoIndex !== null) {
			if (e.key === "Escape") {
				filterPhotoIndex = null;
				e.preventDefault();
			}
		}
	}

	// PDF download state
	let downloadingPdf = $state(false);

	/**
	 * Downloads the offer PDF for the current inquiry via authenticated fetch.
	 *
	 * Called by: Template (onclick on the "PDF herunterladen" button in the offer card)
	 * Purpose: Uses apiDownload so the Authorization header is included — a plain <a href> tag
	 *          cannot attach the Bearer token required by the protected endpoint.
	 *          Calls GET /api/v1/inquiries/{id}/pdf and triggers a browser file download.
	 *
	 * @returns void (side-effect: triggers browser PDF download, shows error toast on failure)
	 */
	async function downloadPdf() {
		if (!data) return;
		downloadingPdf = true;
		try {
			const offerNum = data.offer?.offer_number || data.id.slice(0, 8);
			await apiDownload(
				`/api/v1/inquiries/${data.id}/pdf`,
				`angebot_${offerNum}.pdf`,
			);
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			downloadingPdf = false;
		}
	}

	// Video upload state
	let videoUploading = $state(false);
	let videoProgress = $state("");
	let videoQueue = $state<File[]>([]);
	let downloadingMedia = $state(false);

	let photoUploading = $state(false);
	let photoProgress = $state("");
	let photoQueue = $state<File[]>([]);

	/**
	 * Downloads all source photos and videos for the inquiry as a single ZIP archive via the browser.
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
			const JSZip = (await import("jszip")).default;
			const zip = new JSZip();

			const images = estimationsList.flatMap((e) => e.source_image_urls);
			const videos = estimationsList
				.filter((e) => e.source_video_url)
				.map((e) => e.source_video_url!);

			if (images.length === 0 && videos.length === 0) {
				showToast("Keine Medien zum Herunterladen vorhanden", "error");
				return;
			}

			const imgFolder = zip.folder("fotos");
			const vidFolder = zip.folder("videos");

			const imgPromises = images.map(async (url: string, i: number) => {
				const res = await fetch(API_BASE + url);
				const blob = await res.blob();
				const ext = blob.type.includes("png")
					? "png"
					: blob.type.includes("webp")
						? "webp"
						: "jpg";
				imgFolder!.file(`foto_${i + 1}.${ext}`, blob);
			});

			const vidPromises = videos.map(async (url: string, i: number) => {
				const res = await fetch(API_BASE + url);
				const blob = await res.blob();
				const ext = blob.type.includes("webm") ? "webm" : "mp4";
				vidFolder!.file(`video_${i + 1}.${ext}`, blob);
			});

			await Promise.all([...imgPromises, ...vidPromises]);

			const content = await zip.generateAsync({ type: "blob" });
			const inquiryId = data.id.slice(0, 8);
			const link = document.createElement("a");
			link.href = URL.createObjectURL(content);
			link.download = `medien_${inquiryId}.zip`;
			link.click();
			URL.revokeObjectURL(link.href);

			showToast(
				`${images.length} Fotos und ${videos.length} Videos heruntergeladen`,
				"success",
			);
		} catch (e) {
			showToast(
				"Download fehlgeschlagen: " + (e as Error).message,
				"error",
			);
		} finally {
			downloadingMedia = false;
		}
	}

	/**
	 * Deletes an estimation entry and all its detected items after confirmation.
	 *
	 * Called by: Template (onclick on the X button next to each photo thumbnail and on failed estimation rows)
	 * Purpose: Removes a bad or duplicate AI analysis run so it no longer influences the volume total
	 *          or item list. Calls DELETE /api/v1/estimates/{estimationId} then reloads the inquiry.
	 *
	 * @param estimationId - UUID of the EstimationEntry to delete
	 * @returns void (side-effect: shows toast, calls loadInquiry on success)
	 */
	async function deleteEstimation(estimationId: string) {
		if (
			!confirm(
				"Diese Analyse und alle zugehörigen Gegenstände werden gelöscht.",
			)
		)
			return;
		try {
			await apiDelete(`/api/v1/estimates/${estimationId}`);
			showToast("Analyse gelöscht", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}



	/**
	 * Uploads all queued videos to the video estimation endpoint and polls for results.
	 *
	 * Called by: Template (onclick on the "Videos analysieren" button in the video-analysis card)
	 * Purpose: Sends queued videos to the AI volume estimation pipeline via
	 *          POST /api/v1/inquiries/{id}/estimate/video (multipart FormData with video fields).
	 *          After upload, polls for completion via pollEstimations if any results are still processing.
	 *
	 * @returns void (side-effect: clears `videoQueue`, shows toast, calls pollEstimations or loadInquiry)
	 */
	async function uploadVideos() {
		if (videoQueue.length === 0 || !data) return;

		videoUploading = true;
		const count = videoQueue.length;
		videoProgress = `${count} Video${count > 1 ? "s" : ""} wird hochgeladen...`;

		try {
			const formData = new FormData();
			for (const file of videoQueue) {
				formData.append("video", file);
			}

			const results = await apiFetch<{ id: string; status: string }[]>(
				`/api/v1/inquiries/${data.id}/estimate/video`,
				{
					method: "POST",
					body: formData,
				},
			);

			videoQueue = [];
			showToast(
				`${count} Video${count > 1 ? "s" : ""} hochgeladen — Analyse läuft`,
				"success",
			);

			const processingIds = results
				.filter((r) => r.status === "processing")
				.map((r) => r.id);
			if (processingIds.length > 0) {
				await pollEstimations(processingIds);
			} else {
				await loadInquiry();
			}
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			videoUploading = false;
			videoProgress = "";
		}
	}

	/**
	 * Polls the estimation status endpoint at 5-second intervals until all estimations are done or timed out.
	 *
	 * Called by: uploadPhotos (after a photo upload), uploadVideos (after a video upload)
	 * Purpose: AI estimation runs asynchronously on the server; this loop keeps the UI informed of
	 *          progress and reloads the inquiry once all submitted estimations finish (or fail).
	 *          Polls GET /api/v1/estimates/{id} for each pending estimation ID.
	 *          Times out after 120 attempts (10 minutes at 5-second intervals).
	 *
	 * @param estimationIds - Array of estimation UUIDs returned from the upload response that are still processing
	 * @returns void (side-effect: updates `videoProgress` label, shows toast on completion/failure, calls loadInquiry)
	 */
	async function pollEstimations(estimationIds: string[]) {
		const maxAttempts = 120; // 10 min at 5s intervals
		const pending = new Set(estimationIds);
		let completed = 0;
		let failed = 0;
		const total = estimationIds.length;

		for (let i = 0; i < maxAttempts && pending.size > 0; i++) {
			await new Promise((r) => setTimeout(r, 5000));
			for (const id of [...pending]) {
				try {
					const est = await apiFetch<{ id: string; status: string }>(
						`/api/v1/estimates/${id}`,
					);
					if (est.status === "completed") {
						pending.delete(id);
						completed++;
					} else if (est.status === "failed") {
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
			showToast("Video-Analyse fehlgeschlagen", "error");
		} else if (failed > 0) {
			showToast(
				`${completed}/${total} Videos analysiert, ${failed} fehlgeschlagen`,
				"warning",
			);
		} else if (pending.size > 0) {
			showToast("Video-Analyse Timeout", "error");
		} else {
			showToast("Video-Analyse abgeschlossen", "success");
		}
		await loadInquiry();
	}

	// Photo filter: click a photo to filter items table
	let filterPhotoIndex = $state<number | null>(null);

	// Photo detail popup state
	let photoDetailIndex = $state<number | null>(null);
	let photoDetailZoomItem = $state<number | null>(null);

	/**
	 * Opens the photo detail popup for a specific gallery image index.
	 *
	 * Called by: Template (oncontextmenu on gallery photo thumbnails)
	 * Purpose: Shows the full-size source photo alongside detected item thumbnails
	 *          for side-by-side review and editing of items in that photo.
	 *
	 * @param idx - Zero-based index of the gallery image to show
	 * @returns void
	 */
	function openPhotoDetail(idx: number) {
		photoDetailIndex = idx;
		photoDetailZoomItem = null;
	}

	/**
	 * Closes the photo detail popup.
	 *
	 * Called by: Template (close button, backdrop click, Escape key)
	 * Purpose: Returns to the normal inquiry view.
	 *
	 * @returns void
	 */
	function closePhotoDetail() {
		photoDetailIndex = null;
		photoDetailZoomItem = null;
	}

	/**
	 * Navigates the photo detail popup to the previous gallery image.
	 *
	 * Called by: Template (prev button in photo detail popup)
	 * Purpose: Allows sequential review of all photos without closing the popup.
	 *
	 * @returns void
	 */
	function photoDetailPrev() {
		if (photoDetailIndex !== null && photoDetailIndex > 0) {
			photoDetailIndex--;
			photoDetailZoomItem = null;
		}
	}

	/**
	 * Navigates the photo detail popup to the next gallery image.
	 *
	 * Called by: Template (next button in photo detail popup)
	 * Purpose: Allows sequential review of all photos without closing the popup.
	 *
	 * @returns void
	 */
	function photoDetailNext() {
		if (photoDetailIndex !== null && photoDetailIndex < galleryImages.length - 1) {
			photoDetailIndex++;
			photoDetailZoomItem = null;
		}
	}

	/**
	 * Returns all editable items associated with the currently shown gallery photo.
	 *
	 * Called by: Template (photo detail popup item panel)
	 * Purpose: Filters editItems to only those seen in or primarily belonging to the
	 *          current photo, so the admin can review and edit items per photo.
	 *
	 * @returns EditableItem[] matching items for the current photo
	 */
	function photoDetailItems(): EditableItem[] {
		if (photoDetailIndex === null) return [];
		const idx = photoDetailIndex;
		return editItems.filter(
			(item) =>
				item.bbox_image_index === idx ||
				(item.seen_in_images?.includes(idx) ?? false),
		);
	}

	/**
	 * Adds a new blank item linked to the currently shown photo in the detail popup.
	 *
	 * Called by: Template (Hinzufügen button in photo detail popup)
	 * Purpose: Lets the admin add an item that was missed by the AI for a specific photo,
	 *          pre-linking the new item to that photo's index.
	 *
	 * @returns void
	 */
	function addItemToPhoto() {
		if (photoDetailIndex === null) return;
		const idx = photoDetailIndex;
		editItems = [
			...editItems,
			{
				name: "",
				volume_m3: 0,
				quantity: 1,
				confidence: 1.0,
				crop_url: null,
				crop_s3_key: null,
				source_image_url: null,
				bbox: null,
				bbox_image_index: idx,
				seen_in_images: [idx],
				category: null,
				dimensions: null,
				is_moveable: true,
				packs_into_boxes: false,
			},
		];
		itemsDirty = true;
	}

	// Normalize estimation snapshot into an array for gallery/upload UI compatibility
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

	let estimationsList = $derived.by((): EstimationEntry[] => {
		const est = data?.estimation;
		if (!est) return [];
		const entries: EstimationEntry[] = [
			{
				id: est.id,
				method: est.method,
				status: est.status,
				total_volume_m3: est.total_volume_m3,
				item_count: est.item_count,
				created_at: est.created_at,
				source_video_url: est.source_video,
				source_image_urls: est.source_images ?? [],
			},
		];
		return entries;
	});

	let galleryEntries = $derived(
		estimationsList
			.filter((e) => e.source_image_urls.length > 0)
			.flatMap((e) =>
				e.source_image_urls.map((url) => ({
					url: API_BASE + url,
					estimationId: e.id,
				})),
			),
	);
	let galleryImages = $derived(galleryEntries.map((e) => e.url));

	let videoEntries = $derived(
		estimationsList
			.filter((e) => e.source_video_url)
			.map((e) => ({
				url: API_BASE + e.source_video_url!,
				estimationId: e.id,
			})),
	);

	let processingEstimations = $derived(
		estimationsList.filter((e) => e.status === "processing"),
	);
	let failedEstimations = $derived(
		estimationsList.filter((e) => e.status === "failed"),
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
	 * Called by: loadInquiry (after fetching fresh inquiry data)
	 * Purpose: Initialises `editItems` from the server response so the admin can edit quantities, volumes,
	 *          and names before saving. Maps nullable fields to explicit null to satisfy TypeScript.
	 *
	 * @param items - Array of EstimationItem objects from the API response
	 * @returns void (side-effect: sets `editItems` and resets `itemsDirty = false`)
	 */
	function initEditItems(items: ItemSnapshot[]) {
		editItems = items.map((item) => ({
			name: item.name,
			volume_m3: item.volume_m3,
			quantity: item.quantity,
			confidence: item.confidence,
			crop_url: item.crop_url ?? null,
			crop_s3_key: item.crop_s3_key ?? null,
			source_image_url: item.source_image_url ?? null,
			bbox: item.bbox ?? null,
			bbox_image_index: item.bbox_image_index ?? null,
			seen_in_images: item.seen_in_images ?? null,
			category: item.category ?? null,
			dimensions: item.dimensions ?? null,
			is_moveable: item.is_moveable ?? true,
			packs_into_boxes: item.packs_into_boxes ?? false,
		}));
		itemsDirty = false;
	}

	/**
	 * Calculates suggested persons, hours, rate, and line items for the offer pricing section.
	 *
	 * Called by: loadInquiry (after data is fetched and items are initialised)
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
		if (data.offer) {
			const lo = data.offer;
			editPersons = lo.persons;
			editHours = lo.hours;
			editRateCents = lo.rate_cents;
			editBruttoCents = lo.total_brutto_cents;
			// Build editable line items from offer (non-labor only; Nürnbergerversicherung is fixed non-editable)
			editLineItems = lo.line_items
				.filter((li) => !li.is_labor && li.label !== "Nürnbergerversicherung")
				.map((li) => {
					const normalized = normalizeFlatTotalItem(li);
					const match = ROW_OPTIONS.find((r) => r.label === li.label);
					return mkLineItem(
						match?.row ?? 99,
						li.label,
						normalized.quantity,
						normalized.unit_price_cents,
						li.remark ?? "",
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
		const vol = data.volume_m3 ?? 0;
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
		loadInquiry();
	});

	/**
	 * Fetches the full inquiry detail from the API and initialises all page state.
	 *
	 * Called by: $effect (on mount, keyed on the route `id` param), and after any mutation (save, delete, upload)
	 * Purpose: Primary data loader for the inquiry detail page. Calls GET /api/v1/inquiries/{id},
	 *          then seeds editVolume, editDistance, editNotes, editItems (via initEditItems),
	 *          and pricing defaults (via computePricingDefaults). Also fires a non-blocking
	 *          POST /api/v1/distance/calculate (public) to populate the RouteMap polyline.
	 *
	 * @returns void (side-effect: sets `data`, edit* fields, `routeCoordinates`, `loading`)
	 */
	async function loadInquiry() {
		loading = true;
		try {
			const id = $page.params.id;
			data = await apiGet<InquiryResponse>(`/api/v1/inquiries/${id}`);
			editVolume = data.volume_m3;
			editDistance = data.distance_km ?? 0;
			editNotes = data.notes || "";
			editDate = data.scheduled_date || data.preferred_date || "";
			if (data.items?.length) {
				initEditItems(data.items);
			}
			computePricingDefaults();

			// Load emails non-blocking so the inquiry renders first
			loadEmails();

			// Fetch route geometry from distance calculator (non-blocking)
			if (data.origin_address && data.destination_address) {
				const originStr =
					`${data.origin_address.street}, ${data.origin_address.postal_code || ""} ${data.origin_address.city}`.trim();
				const destStr =
					`${data.destination_address.street}, ${data.destination_address.postal_code || ""} ${data.destination_address.city}`.trim();
				apiPost<{ legs: { geometry: [number, number][] }[] }>(
					`/api/v1/distance/calculate`,
					{
						addresses: [originStr, destStr],
					},
				)
					.then((r) => {
						const geo = r.legs?.[0]?.geometry;
						// geometry is [[lng, lat], ...] — swap to [lat, lng] for Leaflet
						routeCoordinates =
							geo?.length >= 2
								? geo.map(
										([lng, lat]) =>
											[lat, lng] as [number, number],
									)
								: null;
					})
					.catch(() => {
						routeCoordinates = null;
					});
			}
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			loading = false;
		}
	}

	/**
	 * Persists the edited volume, distance, and notes fields to the API without reloading.
	 *
	 * Called by: saveInquiry(), generateOffer(), reEstimateOffer()
	 * Purpose: Writes inquiry metadata to the DB so that subsequent backend reads (e.g. offer
	 *          generation) see fresh data. Does NOT reload the inquiry or show a toast — callers
	 *          handle their own UI feedback.
	 *
	 * @returns void (side-effect: calls PATCH /api/v1/inquiries/{id})
	 */
	async function persistInquiry() {
		if (!data) return;
		await apiPatch(`/api/v1/inquiries/${data.id}`, {
			estimated_volume_m3: editVolume,
			distance_km: editDistance,
			notes: editNotes || null,
			preferred_date: editDate || null,
		});
	}

	/**
	 * Persists the edited volume, distance, and notes fields to the API.
	 *
	 * Called by: Template (onclick on the "Speichern" button in the Details card)
	 * Purpose: Saves manual corrections to inquiry metadata without affecting items or pricing.
	 *          Calls persistInquiry() then reloads the inquiry so derived state refreshes.
	 *
	 * @returns void (side-effect: sets `saving`, shows toast, calls loadInquiry on success)
	 */
	async function saveInquiry() {
		if (!data) return;
		saving = true;
		try {
			await persistInquiry();
			showToast("Anfrage gespeichert", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			saving = false;
		}
	}

	/**
	 * Bulk-saves all editable estimation items to the API and updates the volume field.
	 *
	 * Called by: Template (onclick on the "Gegenstaende speichern" button in the items card)
	 * Purpose: Persists any admin corrections to item names, quantities, or volumes made in the
	 *          inline editable items table. Calls PUT /api/v1/inquiries/{id}/items with
	 *          the full current items array. After a successful save, syncs editVolume to the
	 *          computed total so the volume field reflects the corrected item list.
	 *
	 * @returns void (side-effect: sets `savingItems`, clears `itemsDirty`, shows toast)
	 */
	async function saveItems() {
		if (!data) return;
		savingItems = true;
		try {
			await apiPut(`/api/v1/inquiries/${data.id}/items`, {
				items: editItems.map((item) => ({
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
					is_moveable: item.is_moveable,
					packs_into_boxes: item.packs_into_boxes,
				})),
			});
			editVolume = computedTotal;
			itemsDirty = false;
			showToast("Gegenstaende gespeichert", "success");
		} catch (e) {
			showToast((e as Error).message, "error");
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
		editItems = [
			...editItems,
			{
				name: "",
				volume_m3: 0,
				quantity: 1,
				confidence: 1.0,
				crop_url: null,
				crop_s3_key: null,
				source_image_url: null,
				bbox: null,
				bbox_image_index: null,
				seen_in_images: null,
				category: null,
				dimensions: null,
				is_moveable: true,
				packs_into_boxes: false,
			},
		];
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
			editRateCents = Math.round(
				availableForLabor / (editPersons * editHours),
			);
		}
		priceDirty = true;
	}

	// Embedded offer from the inquiry response
	let latestOffer = $derived(data?.offer ?? null);

	/**
	 * Triggers a full re-estimation of the latest offer, recalculating distance and regenerating the PDF.
	 *
	 * Called by: Template (onclick on the "Neu berechnen" button in the page header)
	 * Purpose: Used after address corrections to recompute distance-based pricing and regenerate the offer.
	 *          Falls back to generateOffer() when no offer exists yet.
	 *          First persists any unsaved items and inquiry metadata so the backend reads fresh data,
	 *          then calls POST /api/v1/inquiries/{id}/generate-offer with the admin's current pricing
	 *          inputs (persons, hours, rate, price, line_items).
	 *          Fahrkostenpauschale is excluded from line_items so the backend uses the stored admin
	 *          override (if one was previously set via generateOffer) or recalculates from ORS.
	 *          To force an ORS recalculation and clear the stored override, send fahrt_reset: true.
	 *          Prompts for confirmation before proceeding.
	 *
	 * @returns void (side-effect: shows toast, calls loadInquiry on success)
	 */
	async function reEstimateOffer() {
		if (!latestOffer) {
			// No offer yet — delegate to generateOffer() which handles the first-time case
			await generateOffer();
			return;
		}
		if (!confirm("Entfernung neu berechnen und Angebot neu erstellen?"))
			return;
		try {
			// Persist unsaved items first (recalculates total volume)
			if (itemsDirty) {
				await saveItems();
			}
			// Persist inquiry metadata (volume, distance, notes) so the backend reads fresh data
			await persistInquiry();
			// Include admin-edited pricing so the regenerated offer reflects manual overrides.
			// Exclude Fahrkostenpauschale from line_items: backend uses stored admin override if set,
			// otherwise recalculates from ORS.
			const payload: Record<string, unknown> = {
				persons: editPersons,
				hours: editHours,
				rate: editRateCents / 100,
			};
			if (priceDirty) {
				payload.price_cents_netto = Math.round(editBruttoCents / 1.19);
			}
			// If the admin has a Fahrkostenpauschale in editLineItems, that value is law —
			// always send it as fahrt_flat_total so backend never recalculates via ORS.
			const fahrtItemRe = editLineItems.find((li) => li.label === "Fahrkostenpauschale");
			if (fahrtItemRe) {
				payload.fahrt_flat_total = fahrtItemRe.unitPriceCents / 100;
			}
			const nonFahrtItems = editLineItems.filter(
				(li) => li.label !== "Fahrkostenpauschale",
			);
			if (nonFahrtItems.length > 0) {
				payload.line_items = nonFahrtItems.map((li) => ({
					description: li.label,
					quantity: li.quantity,
					unit_price: li.unitPriceCents / 100,
					...(li.remark ? { remark: li.remark } : {}),
				}));
			}
			await apiPost(
				`/api/v1/inquiries/${data!.id}/generate-offer`,
				payload,
			);
			showToast("Angebot wird neu berechnet...", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/**
	 * Generates a new offer PDF from the current quote using the admin's edited pricing inputs.
	 *
	 * Called by: Template (onclick on the "Angebot erstellen" button in the page header)
	 * Purpose: Creates the first offer for this inquiry by posting all pricing parameters to the
	 *          generation endpoint. First persists any unsaved items (recalculates total volume)
	 *          and inquiry metadata (volume, distance, notes) so the backend reads fresh data.
	 *          Then calls POST /api/v1/inquiries/{id}/generate-offer with persons, hours, rate,
	 *          optionally price_cents_netto (when priceDirty), and optionally line_items.
	 *          Reloads the inquiry after success so the new offer appears embedded.
	 *
	 * @returns void (side-effect: shows toast, calls loadInquiry on success)
	 */
	async function generateOffer() {
		if (!data) return;
		try {
			// Persist unsaved items first (recalculates total volume)
			if (itemsDirty) {
				await saveItems();
			}
			// Persist inquiry metadata (volume, distance, notes) so the backend reads fresh data
			await persistInquiry();
			const payload: Record<string, unknown> = {
				persons: editPersons,
				hours: editHours,
				rate: editRateCents / 100,
			};
			if (priceDirty) {
				payload.price_cents_netto = Math.round(editBruttoCents / 1.19);
			}
			// Extract Fahrkostenpauschale as fahrt_flat_total — admin-set value is law.
			const fahrtItemGen = editLineItems.find((li) => li.label === "Fahrkostenpauschale");
			if (fahrtItemGen) {
				payload.fahrt_flat_total = fahrtItemGen.unitPriceCents / 100;
			}
			const nonFahrtGen = editLineItems.filter((li) => li.label !== "Fahrkostenpauschale");
			if (nonFahrtGen.length > 0) {
				payload.line_items = nonFahrtGen.map((li) => ({
					description: li.label,
					quantity: li.quantity,
					unit_price: li.unitPriceCents / 100,
					...(li.remark ? { remark: li.remark } : {}),
				}));
			}
			await apiPost<{ id: string }>(
				`/api/v1/inquiries/${data.id}/generate-offer`,
				payload,
			);

			showToast("Angebot erstellt", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	const statusOptions: { value: string; label: string }[] = [
		{ value: "pending", label: "Ausstehend" },
		{ value: "estimating", label: "Schaetzung" },
		{ value: "estimated", label: "Volumen" },
		{ value: "offer_ready", label: "Angebot" },
		{ value: "sent", label: "Gesendet" },
		{ value: "accepted", label: "Akzeptiert" },
		{ value: "scheduled", label: "Geplant" },
		{ value: "completed", label: "Abgeschlossen" },
		{ value: "invoiced", label: "Fakturiert" },
		{ value: "paid", label: "Bezahlt" },
		{ value: "rejected", label: "Abgelehnt" },
		{ value: "cancelled", label: "Storniert" },
	];

	let changingStatus = $state(false);

	/**
	 * Updates the inquiry's workflow status via the API using the status dropdown.
	 *
	 * Called by: Template (onchange on the status <select> in the page header)
	 * Purpose: Allows the admin to manually override the inquiry lifecycle state (e.g. mark as paid,
	 *          cancelled, or done) without going through automated transitions.
	 *          Calls PATCH /api/v1/inquiries/{id} with the new status value.
	 *          No-ops if the selected value equals the current status.
	 *
	 * @param newStatus - The target status string (e.g. 'accepted', 'done', 'paid', 'cancelled')
	 * @returns void (side-effect: sets `changingStatus`, shows toast, calls loadInquiry on success)
	 */
	async function setInquiryStatus(newStatus: string) {
		if (!data) return;
		if (data.status === newStatus) return;
		changingStatus = true;
		try {
			await apiPatch(`/api/v1/inquiries/${data.id}`, {
				status: newStatus,
			});
			const label =
				statusOptions.find((s) => s.value === newStatus)?.label ||
				newStatus;
			showToast(`Status: ${label}`, "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			changingStatus = false;
		}
	}

	/**
	 * Soft-deletes the inquiry and navigates back to the inquiries list.
	 *
	 * Called by: Template (onclick on the Trash2 delete button in the page header)
	 * Purpose: Cancels an inquiry that was created in error or is no longer needed.
	 *          Calls DELETE /api/v1/inquiries/{id}.
	 *          Prompts for confirmation before proceeding.
	 *
	 * @returns void (side-effect: shows toast, navigates to /admin/inquiries)
	 */
	async function deleteInquiry() {
		if (!data) return;
		if (!confirm("Anfrage unwiderruflich loeschen?")) return;
		try {
			await apiDelete(`/api/v1/inquiries/${data.id}`);
			showToast("Anfrage geloescht", "success");
			goto("/admin/inquiries");
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/**
	 * Copies the origin address fields into the inline edit form and activates origin edit mode.
	 *
	 * Called by: Template (onclick on the "Bearbeiten" button in the Kunde card)
	 * Purpose: Seeds the inline customer editor with the current values.
	 *
	 * @returns void (side-effect: populates `editCustomer`, sets `editingCustomer = true`)
	 */
	function startEditCustomer() {
		if (!data?.customer) return;
		const c = data.customer;
		editCustomer = {
			first_name: c.first_name ?? "",
			last_name: c.last_name ?? c.name ?? "",
			email: c.email,
			phone: c.phone ?? "",
		};
		editingCustomer = true;
	}

	/**
	 * Saves the edited customer fields to the API and exits edit mode.
	 *
	 * Called by: Template (onclick on the "Speichern" button in the Kunde card)
	 * Purpose: Persists name, email and phone corrections via PATCH /api/v1/admin/customers/{id}.
	 *
	 * @returns void (side-effect: shows toast, sets editingCustomer = false, reloads inquiry)
	 */
	async function saveCustomer() {
		if (!data?.customer) return;
		try {
			await apiPatch(`/api/v1/admin/customers/${data.customer.id}`, {
				first_name: editCustomer.first_name || null,
				last_name: editCustomer.last_name || null,
				email: editCustomer.email || null,
				phone: editCustomer.phone || null,
			});
			showToast("Kunde gespeichert", "success");
			editingCustomer = false;
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/**
	 * Called by: Template (onclick on the "Bearbeiten" button in the origin address card)
	 * Purpose: Seeds the inline address editor with the current values so the admin starts from
	 *          existing data rather than an empty form.
	 *
	 * @returns void (side-effect: populates `editOrigin`, sets `editingOrigin = true`)
	 */
	function startEditOrigin() {
		if (!data?.origin_address) return;
		const a = data.origin_address;
		editOrigin = {
			street: a.street,
			postal_code: a.postal_code || "",
			city: a.city,
			floor: a.floor || "0",
			elevator: a.elevator ?? false,
		};
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
		editDest = {
			street: a.street,
			postal_code: a.postal_code || "",
			city: a.city,
			floor: a.floor || "0",
			elevator: a.elevator ?? false,
		};
		editingDest = true;
	}

	/**
	 * Saves an edited address (origin or destination) to the API and exits edit mode.
	 *
	 * Called by: Template (onclick on the "Speichern" button inside the inline origin/destination address form)
	 * Purpose: Persists corrections to street, city, postal code, floor, or elevator for either address.
	 *          Calls PATCH /api/v1/admin/addresses/{addressId} then reloads the inquiry so the
	 *          route map and pricing defaults reflect the corrected address.
	 *
	 * @param addressId - UUID of the address record to update
	 * @param fields - Object with the current form values (street, postal_code, city, floor, elevator)
	 * @param setEditing - Callback to set the editing flag (e.g. `(v) => editingOrigin = v`) to false on success
	 * @returns void (side-effect: shows toast, calls setEditing(false) and loadInquiry on success)
	 */
	async function saveAddress(
		addressId: string,
		fields: typeof editOrigin,
		setEditing: (v: boolean) => void,
	) {
		try {
			await apiPatch(`/api/v1/admin/addresses/${addressId}`, fields);
			showToast("Adresse gespeichert", "success");
			setEditing(false);
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	// ─── Email thread (inline, for this inquiry) ───────────────────────────

	interface InquiryEmailThread {
		id: string;
		customer_email: string;
		customer_name: string | null;
		quote_id: string | null;
		subject: string | null;
		created_at: string;
	}

	interface InquiryEmailMessage {
		id: string;
		direction: string;
		from_address: string;
		to_address: string;
		subject: string | null;
		body_text: string | null;
		llm_generated: boolean;
		status: string;
		created_at: string;
	}

	interface InquiryThreadWithMessages {
		thread: InquiryEmailThread;
		messages: InquiryEmailMessage[];
	}

	let emailsLoading = $state(false);
	let emailThreads = $state<InquiryThreadWithMessages[]>([]);

	// Employee assignment state
	let showAssignModal = $state(false);
	let availableEmployees = $state<EmployeeOption[]>([]);
	let assignEmployeeId = $state('');
	let assignPlannedHours = $state('4');
	let assignNotes = $state('');
	let assignLoading = $state(false);
	let employeeSaving = $state<string | null>(null);

	// Draft editing state
	let emailEditingId = $state<string | null>(null);
	let emailEditSubject = $state("");
	let emailEditBody = $state("");
	let emailSaving = $state(false);
	let emailActionLoading = $state<string | null>(null);

	// --- Employee assignment functions ---

	const employeeStatuses = ['accepted', 'scheduled', 'completed', 'invoiced', 'paid'];

	/**
	 * Whether the Mitarbeiter card should be visible.
	 *
	 * Called by: Template (conditional rendering)
	 * Purpose: Only show employee assignments for inquiries past offer_sent.
	 */
	let showEmployeeCard = $derived(
		data != null && employeeStatuses.includes(data.status)
	);

	// ── Rechnungen ────────────────────────────────────────────────────────

	interface InvoiceExtraService {
		description: string;
		price_cents: number;
	}

	interface Invoice {
		id: string;
		inquiry_id: string;
		invoice_number: string;
		invoice_type: string;
		partial_group_id: string | null;
		partial_percent: number | null;
		status: string;
		extra_services: InvoiceExtraService[];
		total_netto_cents: number;
		total_brutto_cents: number;
		pdf_s3_key: string | null;
		sent_at: string | null;
		paid_at: string | null;
		created_at: string;
	}

	const invoiceStatuses = ['accepted', 'scheduled', 'completed', 'invoiced', 'paid'];
	let showInvoiceCard = $derived(data != null && invoiceStatuses.includes(data.status));

	let invoices = $state<Invoice[]>([]);
	let invoicesLoading = $state(false);
	let invoiceCreating = $state(false);
	let showPartialForm = $state(false);
	let partialPercent = $state(30);

	// Extra services editor state — keyed by invoice id
	let editingExtras = $state<Record<string, boolean>>({});
	let extrasDraft = $state<Record<string, InvoiceExtraService[]>>({});

	/**
	 * Load all invoices for the current inquiry.
	 *
	 * Called by: $effect (on mount when showInvoiceCard becomes true)
	 * Purpose: Populates the Rechnungen card with existing invoices.
	 */
	async function loadInvoices() {
		if (!data) return;
		invoicesLoading = true;
		try {
			const result = await apiGet(`/api/v1/inquiries/${data.id}/invoices`);
			invoices = (result ?? []) as Invoice[];
		} catch {
			showToast('Rechnungen konnten nicht geladen werden', 'error');
		} finally {
			invoicesLoading = false;
		}
	}

	/**
	 * Create a single full invoice for the inquiry.
	 *
	 * Called by: Template ("Rechnung Erstellen" button)
	 * Purpose: Triggers XLSX + PDF generation for the full job amount.
	 */
	async function createFullInvoice() {
		if (!data) return;
		invoiceCreating = true;
		try {
			const result = await apiPost(`/api/v1/inquiries/${data.id}/invoices`, { invoice_type: 'full' });
			invoices = (result ?? []) as Invoice[];
			showToast('Rechnung erstellt', 'success');
		} catch {
			showToast('Rechnung konnte nicht erstellt werden', 'error');
		} finally {
			invoiceCreating = false;
		}
	}

	/**
	 * Create a partial invoice pair (Anzahlung + Restbetrag).
	 *
	 * Called by: Template (Partielle Rechnung form submit)
	 * Purpose: Creates two linked invoices — partial_first sendable immediately,
	 *          partial_final sendable after inquiry is completed.
	 *
	 * @param e - Submit event (prevented by caller)
	 */
	async function createPartialInvoice(e: Event) {
		e.preventDefault();
		if (!data) return;
		if (partialPercent < 1 || partialPercent > 99) {
			showToast('Prozentsatz muss zwischen 1 und 99 liegen', 'error');
			return;
		}
		invoiceCreating = true;
		try {
			const result = await apiPost(`/api/v1/inquiries/${data.id}/invoices`, {
				invoice_type: 'partial',
				partial_percent: partialPercent,
			});
			invoices = (result ?? []) as Invoice[];
			showPartialForm = false;
			showToast('Teilrechnungen erstellt', 'success');
		} catch {
			showToast('Teilrechnungen konnten nicht erstellt werden', 'error');
		} finally {
			invoiceCreating = false;
		}
	}

	/**
	 * Send a specific invoice by email to the customer.
	 *
	 * Called by: Template ("Senden" button per invoice)
	 * Purpose: Attaches the invoice PDF and sends via SMTP.
	 *          Gated by sendability rules (partial_final requires completed status).
	 *
	 * @param invId - UUID of the invoice to send
	 */
	async function sendInvoice(invId: string) {
		if (!data) return;
		try {
			const updated = await apiPost(`/api/v1/inquiries/${data.id}/invoices/${invId}/send`);
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			showToast('Rechnung gesendet', 'success');
			// Reload inquiry to pick up status transition (→ invoiced)
			await reloadInquiry();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Rechnung konnte nicht gesendet werden';
			showToast(msg, 'error');
		}
	}

	/**
	 * Mark a specific invoice as paid.
	 *
	 * Called by: Template ("Als bezahlt markieren" button)
	 * Purpose: Sets paid_at and updates status to 'paid'.
	 *          Auto-transitions inquiry to 'paid' when all invoices are paid.
	 *
	 * @param invId - UUID of the invoice to mark as paid
	 */
	async function markInvoicePaid(invId: string) {
		if (!data) return;
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${data.id}/invoices/${invId}`, { status: 'paid' });
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			showToast('Rechnung als bezahlt markiert', 'success');
			await reloadInquiry();
		} catch {
			showToast('Konnte nicht als bezahlt markiert werden', 'error');
		}
	}

	/**
	 * Begin editing extra services for a specific invoice.
	 *
	 * Called by: Template ("Zusatzleistungen bearbeiten" toggle)
	 * Purpose: Copies current extra_services into draft state for inline editing.
	 *
	 * @param inv - Invoice object whose extras are being edited
	 */
	function startEditExtras(inv: Invoice) {
		extrasDraft[inv.id] = inv.extra_services.map((e) => ({ ...e }));
		editingExtras[inv.id] = true;
	}

	/**
	 * Add an empty row to the extras draft for a given invoice.
	 *
	 * Called by: Template ("+ Zusatzleistung" button)
	 * Purpose: Lets admin add a new on-site extra service line.
	 *
	 * @param invId - Invoice ID
	 */
	function addExtraRow(invId: string) {
		if (!extrasDraft[invId]) extrasDraft[invId] = [];
		extrasDraft[invId] = [...extrasDraft[invId], { description: '', price_cents: 0 }];
	}

	/**
	 * Remove an extra service row from the draft.
	 *
	 * Called by: Template (× button per row)
	 * Purpose: Removes a single extra service from the pending edit.
	 *
	 * @param invId - Invoice ID
	 * @param idx - Row index to remove
	 */
	function removeExtraRow(invId: string, idx: number) {
		extrasDraft[invId] = extrasDraft[invId].filter((_, i) => i !== idx);
	}

	/**
	 * Save the edited extra services for an invoice and regenerate the PDF.
	 *
	 * Called by: Template ("Speichern" button in extras editor)
	 * Purpose: Persists the updated extras list and triggers server-side PDF regeneration.
	 *
	 * @param invId - Invoice ID
	 */
	async function saveExtras(invId: string) {
		if (!data) return;
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${data.id}/invoices/${invId}`, {
				extra_services: extrasDraft[invId] ?? [],
			});
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			editingExtras[invId] = false;
			showToast('Zusatzleistungen gespeichert', 'success');
		} catch {
			showToast('Zusatzleistungen konnten nicht gespeichert werden', 'error');
		}
	}

	$effect(() => {
		if (showInvoiceCard) loadInvoices();
	});

	/**
	 * Returns a human-readable German label for an invoice status.
	 *
	 * Called by: Template (status badge rendering)
	 * Purpose: Maps internal status strings to display labels.
	 *
	 * @param status - Invoice status string
	 * @returns German label
	 */
	function invoiceStatusLabel(status: string): string {
		return { draft: 'Entwurf', ready: 'Offen', sent: 'Gesendet', paid: 'Bezahlt' }[status] ?? status;
	}

	/**
	 * Returns a CSS class suffix for an invoice status badge.
	 *
	 * Called by: Template (class binding on status badge)
	 * Purpose: Colours the badge: grey=draft, orange=ready, blue=sent, green=paid.
	 *
	 * @param status - Invoice status string
	 * @returns CSS class suffix
	 */
	function invoiceStatusClass(status: string): string {
		return { draft: 'grey', ready: 'orange', sent: 'blue', paid: 'green' }[status] ?? 'grey';
	}

	/**
	 * Returns true if a given invoice can be sent right now.
	 * partial_first: always sendable; full / partial_final: require completed status.
	 *
	 * Called by: Template (Senden button disabled state)
	 * Purpose: Enforces business rule that final invoices are only sent after job completion.
	 *
	 * @param inv - Invoice object
	 * @returns Whether sending is currently allowed
	 */
	function canSendInvoice(inv: Invoice): boolean {
		if (inv.invoice_type === 'partial_first') return true;
		return data?.status === 'completed';
	}

	/**
	 * Compute a preview of Anzahlung / Restbetrag amounts for the partial form.
	 * Uses the active offer's brutto price.
	 *
	 * Called by: Template (partial invoice preview)
	 * Purpose: Shows Alex what the split will look like before confirming.
	 *
	 * @returns { first, remaining } in cents, or null if no offer
	 *
	 * Math: first = round(offer_brutto * percent / 100)
	 *       remaining = offer_brutto - first
	 */
	function partialPreview(): { first: number; remaining: number } | null {
		const offerNetto = data?.offer?.total_netto_cents;
		if (!offerNetto) return null;
		// offer total_netto_cents is netto; brutto = netto * 1.19
		const brutto = Math.round(offerNetto * 1.19);
		const first = Math.round(brutto * partialPercent / 100);
		return { first, remaining: brutto - first };
	}

	/**
	 * Opens the browser PDF download for a specific invoice.
	 *
	 * Called by: Template ("PDF" button per invoice)
	 * Purpose: Triggers authenticated download of the invoice PDF.
	 *
	 * @param inv - Invoice whose PDF should be downloaded
	 */
	async function downloadInvoicePdf(inv: Invoice) {
		if (!data) return;
		await apiDownload(
			`/api/v1/inquiries/${data.id}/invoices/${inv.id}/pdf`,
			`Rechnung_${inv.invoice_number}.pdf`
		);
	}

	/**
	 * Opens the assign modal and loads available employees.
	 *
	 * Called by: Template (Zuweisen button)
	 * Purpose: Fetches active employees for the dropdown.
	 */
	async function openAssignModal() {
		try {
			const res = await apiGet<{ employees: EmployeeOption[] }>(
				'/api/v1/admin/employees?active=true&limit=100'
			);
			// Filter out already-assigned employees
			const assignedIds = new Set((data?.employees ?? []).map((e: EmployeeAssignment) => e.employee_id));
			availableEmployees = res.employees.filter((e) => !assignedIds.has(e.id));
			assignEmployeeId = availableEmployees[0]?.id ?? '';
			assignPlannedHours = '4';
			assignNotes = '';
			showAssignModal = true;
		} catch {
			showToast('Mitarbeiterliste konnte nicht geladen werden', 'error');
		}
	}

	/**
	 * Assigns an employee to the current inquiry.
	 *
	 * Called by: Template (assign modal submit)
	 * Purpose: POST /api/v1/inquiries/{id}/employees with employee_id and planned_hours.
	 */
	async function handleAssign() {
		if (!data || !assignEmployeeId) return;
		assignLoading = true;
		try {
			await apiPost(`/api/v1/inquiries/${data.id}/employees`, {
				employee_id: assignEmployeeId,
				planned_hours: parseFloat(assignPlannedHours) || 0,
				notes: assignNotes || null
			});
			showToast('Mitarbeiter zugewiesen', 'success');
			showAssignModal = false;
			await reloadInquiry();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			assignLoading = false;
		}
	}

	/**
	 * Updates planned hours for an assignment.
	 *
	 * Called by: Template (inline edit blur on planned_hours input)
	 * Purpose: PATCH /api/v1/inquiries/{id}/employees/{emp_id}.
	 *
	 * @param empId - Employee UUID
	 * @param value - Raw string value from the input
	 */
	async function updatePlannedHours(empId: string, value: string) {
		if (!data) return;
		const numValue = parseFloat(value);
		if (isNaN(numValue)) return;
		employeeSaving = empId;
		try {
			await apiPatch(`/api/v1/inquiries/${data.id}/employees/${empId}`, { planned_hours: numValue });
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			employeeSaving = null;
		}
	}

	/**
	 * Updates clock_in or clock_out for an assignment.
	 *
	 * Called by: Template (time input blur)
	 * Purpose: PATCH /api/v1/inquiries/{id}/employees/{emp_id} with ISO timestamp.
	 *
	 * Math: combines the inquiry's preferred_date with the HH:MM time input,
	 * converts to UTC ISO via new Date(...).toISOString().
	 *
	 * @param empId - Employee UUID
	 * @param field - 'clock_in' or 'clock_out'
	 * @param time - HH:MM string from the time input
	 */
	async function updateEmployeeClock(empId: string, field: 'clock_in' | 'clock_out', time: string) {
		if (!data) return;
		if (!time) return;
		const date = data.preferred_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
		const iso = new Date(`${date}T${time}:00`).toISOString();
		employeeSaving = empId;
		try {
			await apiPatch(`/api/v1/inquiries/${data.id}/employees/${empId}`, { [field]: iso });
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			employeeSaving = null;
		}
	}

	/**
	 * Extracts local HH:MM time string from an ISO timestamp for display in time inputs.
	 *
	 * Called by: Template (time input value binding)
	 * Purpose: Convert UTC ISO back to local HH:MM for the time input.
	 *
	 * @param iso - ISO 8601 timestamp or null
	 * @returns HH:MM string or empty string
	 */
	function isoToLocalTime(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
	}

	/**
	 * Formats actual hours derived from clock_in/clock_out as "Xh Ym".
	 *
	 * Called by: Template (actual hours display cell)
	 * Purpose: Show human-readable duration instead of decimal hours.
	 *
	 * Math: totalMinutes = actual_hours * 60; h = floor(totalMinutes / 60); m = totalMinutes % 60
	 *
	 * @param hours - Decimal hours (e.g. 3.75) or null
	 * @returns Formatted string like "3h 45m" or "—"
	 */
	function fmtActualHours(hours: number | null): string {
		if (hours == null) return '—';
		const totalMin = Math.round(hours * 60);
		const h = Math.floor(totalMin / 60);
		const m = totalMin % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	/**
	 * Returns true when admin-set and employee-reported hours differ by >15 min.
	 *
	 * Called by: Template (discrepancy highlight on employee time cells).
	 * Purpose: Visual flag so Alex can quickly spot when an employee's self-reported
	 *          hours don't match the admin-entered times.
	 *
	 * @param emp - Employee assignment record
	 * @returns True if both sets of hours exist and differ by more than 0.25h
	 */
	function hasDiscrepancy(emp: EmployeeAssignment): boolean {
		if (emp.actual_hours == null || emp.employee_actual_hours == null) return false;
		return Math.abs(emp.actual_hours - emp.employee_actual_hours) > 0.25;
	}

	/**
	 * Removes an employee from the current inquiry.
	 *
	 * Called by: Template (remove button)
	 * Purpose: DELETE /api/v1/inquiries/{id}/employees/{emp_id}.
	 */
	async function removeEmployee(empId: string) {
		if (!data || !confirm('Mitarbeiter von dieser Anfrage entfernen?')) return;
		try {
			await apiDelete(`/api/v1/inquiries/${data.id}/employees/${empId}`);
			showToast('Mitarbeiter entfernt', 'success');
			await reloadInquiry();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Reloads the inquiry data without full page reload.
	 *
	 * Called by: handleAssign, removeEmployee
	 * Purpose: Refreshes data after employee assignment changes.
	 */
	async function reloadInquiry() {
		if (!data) return;
		try {
			const res = await apiGet<InquiryResponse>(`/api/v1/inquiries/${data.id}`);
			data = res;
		} catch { /* keep existing data */ }
	}

	/**
	 * Loads all email threads for this inquiry plus their messages.
	 *
	 * Called by: loadInquiry (after inquiry data is fetched)
	 * Purpose: Fetches GET /api/v1/inquiries/{id}/emails to get thread list,
	 *          then fetches GET /api/v1/admin/emails/{threadId} for each thread to get messages.
	 *
	 * @returns void (side-effect: sets `emailThreads`, `emailsLoading`)
	 */
	async function loadEmails() {
		if (!data) return;
		emailsLoading = true;
		try {
			const threads = await apiGet<InquiryEmailThread[]>(
				`/api/v1/inquiries/${data.id}/emails`,
			);
			const withMessages = await Promise.all(
				threads.map(async (thread) => {
					try {
						const res = await apiGet<{
							thread: InquiryEmailThread;
							messages: InquiryEmailMessage[];
						}>(`/api/v1/admin/emails/${thread.id}`);
						return { thread: res.thread, messages: res.messages };
					} catch {
						return { thread, messages: [] };
					}
				}),
			);
			emailThreads = withMessages;
		} catch {
			emailThreads = [];
		} finally {
			emailsLoading = false;
		}
	}

	/**
	 * Sends a draft email message to the customer after confirmation.
	 *
	 * Called by: Template (onclick on "Senden" button in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/send to dispatch the email.
	 *          Reloads emails on success so the message status updates to "sent".
	 *
	 * @param msgId - ID of the draft message to send
	 * @returns void
	 */
	async function emailSendDraft(msgId: string) {
		if (!confirm("E-Mail jetzt an den Kunden senden?")) return;
		emailActionLoading = msgId;
		try {
			const res = await apiPost<{ message: string }>(
				`/api/v1/admin/emails/messages/${msgId}/send`,
			);
			showToast(res.message, "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}

	/**
	 * Discards a draft email message after confirmation.
	 *
	 * Called by: Template (onclick on "Verwerfen" button in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/discard to delete the draft.
	 *          Reloads emails on success so the message disappears.
	 *
	 * @param msgId - ID of the draft message to discard
	 * @returns void
	 */
	async function emailDiscardDraft(msgId: string) {
		if (!confirm("Entwurf verwerfen?")) return;
		emailActionLoading = msgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/discard`);
			showToast("Entwurf verworfen", "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}

	/**
	 * Opens the inline editor for a draft email message pre-filling with existing content.
	 *
	 * Called by: Template (onclick on "Bearbeiten" button in the email section draft bubble)
	 * Purpose: Seeds the editable subject and body fields with the draft's existing text.
	 *
	 * @param msg - The InquiryEmailMessage to edit
	 * @returns void
	 */
	function emailStartEdit(msg: InquiryEmailMessage) {
		emailEditingId = msg.id;
		emailEditSubject = msg.subject || "";
		emailEditBody = msg.body_text || "";
	}

	/**
	 * Closes the inline email editor without saving.
	 *
	 * Called by: Template (onclick on "Abbrechen" inside the inline email editor)
	 * Purpose: Resets the editing state so the message bubble reverts to read-only view.
	 *
	 * @returns void
	 */
	function emailCancelEdit() {
		emailEditingId = null;
		emailEditSubject = "";
		emailEditBody = "";
	}

	/**
	 * Saves the edited subject and body of a draft email to the API.
	 *
	 * Called by: Template (onclick on "Speichern" inside the inline email editor)
	 * Purpose: PATCHes via PATCH /api/v1/admin/emails/messages/{id}.
	 *          Closes the editor and reloads emails on success.
	 *
	 * @param msgId - ID of the draft message being edited
	 * @returns void
	 */
	async function emailSaveEdit(msgId: string) {
		emailSaving = true;
		try {
			await apiPatch(`/api/v1/admin/emails/messages/${msgId}`, {
				subject: emailEditSubject || null,
				body_text: emailEditBody || null,
			});
			showToast("Entwurf gespeichert", "success");
			emailEditingId = null;
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailSaving = false;
		}
	}

	/**
	 * Regenerates the LLM response for a draft email message.
	 *
	 * Called by: Template (onclick on "Neu generieren" in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/regenerate to ask the LLM to
	 *          rewrite the draft. Reloads emails on success so the updated body appears.
	 *
	 * @param msgId - ID of the draft message to regenerate
	 * @returns void
	 */
	async function emailRegenerateLlm(msgId: string) {
		emailActionLoading = msgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/regenerate`);
			showToast("Antwort wird neu generiert...", "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}
</script>

<div class="page">
	<a href="/admin/inquiries" class="back-link">
		<ArrowLeft size={16} />
		Zurueck zu Anfragen
	</a>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if data}
		<div class="page-header">
			<div class="header-left">
				<h1>Anfrage</h1>
				<StatusBadge status={data.status} />
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
					value={data.status}
					onchange={(e) =>
						setInquiryStatus((e.target as HTMLSelectElement).value)}
					disabled={changingStatus}
				>
					{#each statusOptions as opt}
						<option
							value={opt.value}
							selected={opt.value === data.status}
							>{opt.label}</option
						>
					{/each}
				</select>
				<button class="btn btn-danger" onclick={deleteInquiry}>
					<Trash2 size={16} />
				</button>
			</div>
		</div>

		<div class="detail-grid">
			<!-- Customer -->
			<div class="card">
				<div class="card-header">
					<h3>Kunde</h3>
					{#if !editingCustomer}
						<button class="btn btn-sm" onclick={startEditCustomer}>
							<Pencil size={14} />
							Bearbeiten
						</button>
					{/if}
				</div>
				{#if editingCustomer}
					<div class="form-grid">
						<div class="field">
							<label for="cust-first-name">Vorname</label>
							<input id="cust-first-name" type="text" bind:value={editCustomer.first_name} />
						</div>
						<div class="field">
							<label for="cust-last-name">Nachname</label>
							<input id="cust-last-name" type="text" bind:value={editCustomer.last_name} />
						</div>
						<div class="field full-width">
							<label for="cust-email">E-Mail</label>
							<input id="cust-email" type="email" bind:value={editCustomer.email} />
						</div>
						<div class="field full-width">
							<label for="cust-phone">Telefon</label>
							<input id="cust-phone" type="tel" bind:value={editCustomer.phone} />
						</div>
						<div class="field-actions full-width">
							<button class="btn btn-primary btn-sm" onclick={saveCustomer}>Speichern</button>
							<button class="btn btn-sm" onclick={() => (editingCustomer = false)}>Abbrechen</button>
						</div>
					</div>
				{:else}
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Name</span>
							<span class="info-value name-with-salutation">
								{#if data.customer?.salutation}
									<span class="salutation-badge">{data.customer.salutation === "D" ? "Divers" : data.customer.salutation}</span>
								{/if}
								{data.customer?.first_name && data.customer?.last_name
									? `${data.customer.first_name} ${data.customer.last_name}`
									: (data.customer?.last_name ?? data.customer?.name ?? "—")}
							</span>
						</div>
						<div class="info-item">
							<span class="info-label">E-Mail</span>
							<span class="info-value">{data.customer?.email}</span>
						</div>
						{#if data.customer?.phone}
							<div class="info-item">
								<span class="info-label">Telefon</span>
								<span class="info-value">{data.customer?.phone}</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Addresses -->
			{#if data.origin_address}
				<div class="card">
					<div class="card-header">
						<h3>Von</h3>
						{#if !editingOrigin}
							<button
								class="btn btn-sm"
								onclick={startEditOrigin}
							>
								<Pencil size={14} />
								Bearbeiten
							</button>
						{/if}
					</div>
					{#if editingOrigin}
						<div class="form-grid">
							<div class="field full-width">
								<label for="origin-street">Strasse</label>
								<input
									id="origin-street"
									type="text"
									bind:value={editOrigin.street}
								/>
							</div>
							<div class="field">
								<label for="origin-plz">PLZ</label>
								<input
									id="origin-plz"
									type="text"
									bind:value={editOrigin.postal_code}
								/>
							</div>
							<div class="field">
								<label for="origin-city">Stadt</label>
								<input
									id="origin-city"
									type="text"
									bind:value={editOrigin.city}
								/>
							</div>
							<div class="field">
								<label for="origin-floor">Stockwerk</label>
								<select
									id="origin-floor"
									bind:value={editOrigin.floor}
								>
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
									<input
										type="checkbox"
										bind:checked={editOrigin.elevator}
									/>
									Aufzug
								</label>
							</div>
							<div class="field full-width addr-actions">
								<button
									class="btn btn-sm btn-save"
									onclick={() =>
										saveAddress(
											data!.origin_address!.id,
											editOrigin,
											(v) => (editingOrigin = v),
										)}
								>
									<Save size={14} />
									Speichern
								</button>
								<button
									class="btn btn-sm"
									onclick={() => (editingOrigin = false)}
								>
									Abbrechen
								</button>
							</div>
						</div>
					{:else}
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Adresse</span>
								<span class="info-value">
									{data.origin_address.street}, {data
										.origin_address.postal_code || ""}
									{data.origin_address.city}
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
								<input
									id="dest-street"
									type="text"
									bind:value={editDest.street}
								/>
							</div>
							<div class="field">
								<label for="dest-plz">PLZ</label>
								<input
									id="dest-plz"
									type="text"
									bind:value={editDest.postal_code}
								/>
							</div>
							<div class="field">
								<label for="dest-city">Stadt</label>
								<input
									id="dest-city"
									type="text"
									bind:value={editDest.city}
								/>
							</div>
							<div class="field">
								<label for="dest-floor">Stockwerk</label>
								<select
									id="dest-floor"
									bind:value={editDest.floor}
								>
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
									<input
										type="checkbox"
										bind:checked={editDest.elevator}
									/>
									Aufzug
								</label>
							</div>
							<div class="field full-width addr-actions">
								<button
									class="btn btn-sm btn-save"
									onclick={() =>
										saveAddress(
											data!.destination_address!.id,
											editDest,
											(v) => (editingDest = v),
										)}
								>
									<Save size={14} />
									Speichern
								</button>
								<button
									class="btn btn-sm"
									onclick={() => (editingDest = false)}
								>
									Abbrechen
								</button>
							</div>
						</div>
					{:else}
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">Adresse</span>
								<span class="info-value">
									{data.destination_address.street}, {data
										.destination_address.postal_code || ""}
									{data.destination_address.city}
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
					<button
						class="btn btn-sm"
						onclick={saveInquiry}
						disabled={saving}
					>
						<Save size={14} />
						{saving ? "Speichern..." : "Speichern"}
					</button>
				</div>
				<div class="form-grid">
					<div class="field">
						<label for="volume">Volumen (m3)</label>
						<input
							id="volume"
							type="number"
							step="0.1"
							bind:value={editVolume}
						/>
					</div>
					<div class="field">
						<label for="distance">Entfernung (km)</label>
						<input
							id="distance"
							type="number"
							step="0.1"
							bind:value={editDistance}
						/>
					</div>
					<div class="field">
						<label for="preferred-date">Datum</label>
						<input
							id="preferred-date"
							type="date"
							bind:value={editDate}
						/>
					</div>
					<div class="field full-width">
						<label for="notes">Notizen / Services</label>
						<textarea id="notes" rows={3} bind:value={editNotes}
						></textarea>
					</div>
				</div>
			</div>

			<!-- Route Map -->
			{#if routeCoordinates}
				<RouteMap
					coordinates={routeCoordinates}
					distanceKm={editDistance}
				/>
			{/if}

			<!-- Customer Message -->
			{#if data.customer_message}
				<div class="card">
					<h3>Kundennachricht</h3>
					<p class="customer-message">{data.customer_message}</p>
				</div>
			{/if}

			<!-- Estimation Status (processing / failed) -->
			{#if processingEstimations.length > 0 || failedEstimations.length > 0}
				<div class="card full-width">
					{#each processingEstimations as est}
						<div class="estimation-status-row">
							<div class="upload-spinner"></div>
							<span
								>{est.method === "video"
									? "Video"
									: "Foto"}-Analyse wird verarbeitet...</span
							>
						</div>
					{/each}
					{#each failedEstimations as est}
						<div class="estimation-status-row estimation-failed">
							<span
								>{est.method === "video"
									? "Video"
									: "Foto"}-Analyse fehlgeschlagen</span
							>
							<button
								class="btn btn-sm btn-danger"
								onclick={() => deleteEstimation(est.id)}
							>
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
							<button
								class="btn btn-sm"
								onclick={() => {
									filterPhotoIndex = null;
								}}
							>
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
									class:photo-active={filterPhotoIndex ===
										idx}
									onclick={() => togglePhotoFilter(idx)}
									oncontextmenu={(e) => { e.preventDefault(); openPhotoDetail(idx); }}
									title="Linksklick: Filter | Rechtsklick: Details"
								>
									<img
										src={url}
										alt="Foto {idx + 1}"
										class="photo-thumb"
									/>
								</button>
								<button
									class="photo-delete-btn"
									onclick={() =>
										deleteEstimation(
											galleryEntries[idx].estimationId,
										)}
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
					<MediaDropzone
						variant="admin"
						accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.tif,.avif"
						mimeFilter="image/"
						maxSizeMb={50}
						label="Fotos hierher ziehen oder klicken"
						hint="JPG, PNG, WebP, HEIC, GIF, BMP, TIFF, AVIF (max. 50 MB pro Bild)"
						hasFiles={photoQueue.length > 0}
						id="admin-detail-photos"
						onfiles={(files) => { photoQueue = [...photoQueue, ...files]; }}
						onrejected={(_, reason) => showToast(reason, "error")}
					>
						<MediaPreviewGrid
							files={photoQueue}
							mode="queue"
							variant="admin"
							dropzoneId="admin-detail-photos"
							addMoreLabel="Weiteres Foto"
							onremove={(i) => { photoQueue = photoQueue.filter((_, idx) => idx !== i); }}
						/>
						<div class="upload-queue-actions">
							<label for="admin-detail-photos" class="btn btn-sm upload-add-more">
								<Plus size={14} />
								Weiteres Foto
							</label>
							<button class="btn btn-primary" onclick={uploadPhotos}>
								<Upload size={16} />
								{photoQueue.length} Foto{photoQueue.length > 1 ? "s" : ""} hochladen
							</button>
						</div>
					</MediaDropzone>
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
								<video
									controls
									preload="metadata"
									class="video-player"
								>
									<source src={entry.url} />
								</video>
								<button
									class="video-delete-btn"
									onclick={() =>
										deleteEstimation(entry.estimationId)}
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
					<MediaDropzone
						variant="admin"
						accept="video/*,.mp4,.mov,.mpeg,.mpg,.avi,.webm,.mkv,.3gp,.m4v"
						mimeFilter="video/"
						maxSizeMb={500}
						label="Videos hierher ziehen oder klicken"
						hint="MP4, MOV, MPEG, AVI, WebM, MKV, 3GP, M4V (max. 500 MB pro Video)"
						hasFiles={videoQueue.length > 0}
						id="admin-detail-videos"
						onfiles={(files) => { videoQueue = [...videoQueue, ...files]; }}
						onrejected={(_, reason) => showToast(reason, "error")}
					>
						<MediaPreviewGrid
							files={videoQueue}
							mode="queue"
							variant="admin"
							dropzoneId="admin-detail-videos"
							addMoreLabel="Weiteres Video"
							onremove={(i) => { videoQueue = videoQueue.filter((_, idx) => idx !== i); }}
						/>
						<div class="upload-queue-actions">
							<label for="admin-detail-videos" class="btn btn-sm upload-add-more">
								<Plus size={14} />
								Weiteres Video
							</label>
							<button class="btn btn-primary" onclick={uploadVideos}>
								<Upload size={16} />
								{videoQueue.length} Video{videoQueue.length > 1 ? "s" : ""} hochladen
							</button>
						</div>
					</MediaDropzone>
				{/if}
			</div>

			<!-- Section A: Main moveable items -->
			<div class="card full-width">
				<div class="card-header">
					<h3>
						{#if filterPhotoIndex !== null}
							Gegenstaende aus Foto {filterPhotoIndex + 1} ({sortedItems().length})
						{:else}
							Moebel &amp; Gegenstaende ({mainItems.length})
						{/if}
					</h3>
				</div>
				{#if mainItems.length > 0}
					<div class="items-table-wrap">
						<table class="items-table">
							<thead>
								<tr>
									<th class="th-foto">Foto</th>
									<th
										class="th-sortable"
										onclick={() => toggleSort("name")}
									>
										Gegenstand {sortKey === "name"
											? sortAsc
												? "\u25B2"
												: "\u25BC"
											: ""}
									</th>
									<th
										class="th-num th-sortable"
										onclick={() => toggleSort("quantity")}
									>
										Anzahl {sortKey === "quantity"
											? sortAsc
												? "\u25B2"
												: "\u25BC"
											: ""}
									</th>
									<th
										class="th-num th-sortable"
										onclick={() => toggleSort("volume_m3")}
									>
										Volumen (m3) {sortKey === "volume_m3"
											? sortAsc
												? "\u25B2"
												: "\u25BC"
											: ""}
									</th>
									<th class="th-num">Konfidenz</th>
									<th class="th-del"></th>
								</tr>
							</thead>
							<tbody>
								{#each sortedItems() as item}
									<tr>
										<td class="crop-cell">
											{#if item.crop_url}
												<button
													class="crop-btn"
													onclick={() =>
														openReview(item)}
												>
													<img
														src={API_BASE +
															item.crop_url}
														alt={item.name}
														class="crop-thumb"
													/>
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
											<button
												class="del-btn"
												onclick={() => deleteItem(item)}
												title="Entfernen"
											>
												<X size={14} />
											</button>
										</td>
									</tr>
								{/each}
								<tr class="total-row">
									<td></td>
									<td>Gesamt</td>
									<td>{mainItems.reduce((s, i) => s + i.quantity, 0)}</td>
									<td>{computedTotal.toFixed(2)} m&#x00B3;</td>
									<td></td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</div>
				{:else}
					<p class="empty-items">Noch keine Gegenstaende erfasst.</p>
				{/if}
				<div class="items-footer-actions">
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
						{savingItems ? "Speichern..." : "Speichern"}
					</button>
				</div>
			</div>

			<!-- Section B: Box-packable items -->
			{#if filteredBoxItems.length > 0}
				<div class="card full-width items-section-box">
					<div class="card-header">
						<h3>Kartons &amp; Kleinteile ({filteredBoxItems.length})</h3>
						<span class="section-badge badge-box">In Kartons verpackt</span>
					</div>
					<div class="items-table-wrap">
						<table class="items-table">
							<thead>
								<tr>
									<th class="th-foto">Foto</th>
									<th>Gegenstand</th>
									<th class="th-num">Anzahl</th>
									<th class="th-num">Volumen (m3)</th>
									<th class="th-num">Konfidenz</th>
									<th class="th-del"></th>
								</tr>
							</thead>
							<tbody>
								{#each filteredBoxItems as item}
									<tr class="box-item-row">
										<td class="crop-cell">
											{#if item.crop_url}
												<button
													class="crop-btn"
													onclick={() => openReview(item)}
												>
													<img
														src={API_BASE + item.crop_url}
														alt={item.name}
														class="crop-thumb"
													/>
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
											<button
												class="del-btn"
												onclick={() => deleteItem(item)}
												title="Entfernen"
											>
												<X size={14} />
											</button>
										</td>
									</tr>
								{/each}
								<tr class="total-row">
									<td></td>
									<td>Rohvolumen</td>
									<td>{filteredBoxItems.reduce((s, i) => s + i.quantity, 0)}</td>
									<td>{filteredBoxItems.reduce((s, i) => s + i.volume_m3, 0).toFixed(2)} m&#x00B3;</td>
									<td></td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="section-note">
						Das Rohvolumen dieser Kleinteile wird automatisch in Umzugskartons umgerechnet und im Gesamtvolumen ber&#x00FC;cksichtigt.
					</p>
				</div>
			{/if}

			<!-- Section C: Non-moveable items (excluded from total, shown for review) -->
			{#if filteredNonMoveableItems.length > 0}
				<div class="card full-width items-section-nonmoveable">
					<div class="card-header">
						<button
							class="section-toggle"
							onclick={() => (showNonMoveable = !showNonMoveable)}
						>
							<h3>Nicht transportiert ({filteredNonMoveableItems.length})</h3>
							<span class="section-badge badge-nonmoveable">Vom Volumen ausgeschlossen</span>
							<span class="toggle-arrow">{showNonMoveable ? "\u25B2" : "\u25BC"}</span>
						</button>
					</div>
					{#if showNonMoveable}
						<div class="items-table-wrap">
							<table class="items-table">
								<thead>
									<tr>
										<th class="th-foto">Foto</th>
										<th>Gegenstand</th>
										<th class="th-num">Anzahl</th>
										<th class="th-num">Konfidenz</th>
										<th class="th-del"></th>
									</tr>
								</thead>
								<tbody>
									{#each filteredNonMoveableItems as item}
										<tr class="nonmoveable-row">
											<td class="crop-cell">
												{#if item.crop_url}
													<button
														class="crop-btn"
														onclick={() => openReview(item)}
													>
														<img
															src={API_BASE + item.crop_url}
															alt={item.name}
															class="crop-thumb"
														/>
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
											<td class="confidence-cell">
												{Math.round(item.confidence * 100)}%
											</td>
											<td class="del-cell">
												<button
													class="del-btn"
													onclick={() => deleteItem(item)}
													title="Entfernen"
												>
													<X size={14} />
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="section-note">
							Diese Gegenst&#x00E4;nde wurden als nicht transportierbar eingestuft (z.&nbsp;B. Heizk&#x00F6;rper, Einbauten) und flie&#x00DF;en nicht ins Umzugsvolumen ein. Bitte bei Bedarf korrigieren.
						</p>
					{/if}
				</div>
			{/if}

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
								value={rateEditing
									? rateText
									: (editRateCents / 100).toFixed(2)}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									rateText = target.value;
									const val = parseFloat(target.value);
									if (!isNaN(val))
										editRateCents = Math.round(val * 100);
								}}
								onfocus={() => {
									rateEditing = true;
								}}
								onblur={() => {
									rateEditing = false;
								}}
							/>
						</div>
					</div>

					<button class="btn-link" onclick={onBruttoChange}>
						Rate aus Gesamtpreis berechnen
					</button>
					<span class="labor-profit" class:negative={laborProfit < 0}
						>{laborProfit.toFixed(2)} &euro;</span
					>
				</div>
			</div>

			<!-- Line Items (Editable) -->
			<div class="card">
				<div class="card-header">
					<h3>Positionen</h3>
					<div class="header-actions">
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
							<span class="li-unit"
								>&times; {(editRateCents / 100).toFixed(2)} EUR</span
							>
							<span class="li-total"
								>{formatEuro(laborCents)}</span
							>
						</div>
					</div>


					{#each editLineItems as li, idx}
						<div class="line-item editable">
							<div class="li-edit-top">
								<select
									bind:value={li.row}
									onchange={() => onLineItemRowChange(idx)}
								>
									{#each ROW_OPTIONS as opt}
										<option value={opt.row}
											>{opt.label}</option
										>
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
								<button
									class="del-btn"
									onclick={() => removeLineItem(idx)}
									title="Entfernen"
								>
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
									value={li._editing
										? li._priceText
										: (li.unitPriceCents / 100).toFixed(2)}
									oninput={(e) => {
										const target =
											e.target as HTMLInputElement;
										li._priceText = target.value;
										const val = parseFloat(target.value);
										if (!isNaN(val))
											li.unitPriceCents = Math.round(
												val * 100,
											);
									}}
									onfocus={() => {
										li._editing = true;
									}}
									onblur={() => {
										li._editing = false;
									}}
								/>
								<span class="li-eur">EUR</span>
								<span class="li-total"
									>{formatEuro(
										li.quantity * li.unitPriceCents,
									)}</span
								>
							</div>
						</div>
					{/each}

					<!-- Nürnbergerversicherung: fixed non-editable last item, always €0 -->
					<div class="line-item">
						<span class="li-name">Nürnbergerversicherung</span>
						<div class="li-detail">
							<span class="li-qty">Deckungssumme: 620,00 Euro / m³</span>
							<span class="li-total">inklusive</span>
						</div>
					</div>

					<div class="line-item total">
						<span class="li-name">Netto</span>
						<span class="li-total"
							>{formatEuro(calculatedNettoCents)}</span
						>
					</div>
					<div class="line-item total grand">
						<span class="li-name">Brutto (inkl. 19% MwSt.)</span>
						<span class="li-total"
							>{formatEuro(calculatedBruttoCents)}</span
						>
					</div>
				</div>
			</div>

			<!-- Linked Offer -->
			{#if data.offer}
				<div class="card full-width">
					<div class="card-header">
						<h3>Angebot</h3>
						<button
							class="btn btn-sm"
							onclick={downloadPdf}
							disabled={downloadingPdf}
						>
							<Download size={14} />
							{downloadingPdf
								? "Wird geladen..."
								: "PDF herunterladen"}
						</button>
					</div>
					<div class="offers-list">
						<div class="offer-row">
							<span class="offer-date"
								>{formatDate(data.offer.created_at)}</span
							>
							<span class="offer-price"
								>{data.offer.total_brutto_cents != null
									? formatEuro(data.offer.total_brutto_cents)
									: "—"}</span
							>
							<StatusBadge status={data.offer.status} />
						</div>
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

<!-- Mitarbeiter Card (visible for accepted+ statuses) -->
{#if showEmployeeCard && data}
	{@const emps = data.employees ?? []}
	<div class="employees-section">
		<div class="card">
			<div class="card-header">
				<h3>Mitarbeiter</h3>
				<button class="btn btn-sm" onclick={openAssignModal}>
					<Plus size={14} />
					Zuweisen
				</button>
			</div>

			{#if emps.length > 0}
				<div class="emp-table-wrapper">
					<table class="emp-table">
						<thead>
							<tr>
								<th>Name</th>
								<th class="num">Geplant (h)</th>
								<th colspan="2" class="group-header admin-group">Admin-Zeiten</th>
								<th colspan="2" class="group-header emp-group">Mitarbeiter-Zeiten</th>
								<th></th>
							</tr>
							<tr class="subheader-row">
								<th></th>
								<th></th>
								<th>Beginn</th>
								<th class="num">Ende / Ist</th>
								<th>Beginn</th>
								<th class="num">Ende / Ist</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each emps as emp}
								<tr>
									<td>{emp.first_name} {emp.last_name}</td>
									<td class="num">
										<input
											type="number"
											step="0.5"
											class="inline-input"
											value={emp.planned_hours}
											onblur={(e) => updatePlannedHours(emp.employee_id, (e.target as HTMLInputElement).value)}
										/>
									</td>
									<!-- Admin-set times (editable) -->
									<td>
										<input
											type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
											class="inline-input"
											value={isoToLocalTime(emp.clock_in)}
											onblur={(e) => updateEmployeeClock(emp.employee_id, 'clock_in', (e.target as HTMLInputElement).value)}
										/>
									</td>
									<td class="num">
										<input
											type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
											class="inline-input"
											value={isoToLocalTime(emp.clock_out)}
											onblur={(e) => updateEmployeeClock(emp.employee_id, 'clock_out', (e.target as HTMLInputElement).value)}
										/>
										{#if emp.actual_hours != null}
											<span class="hours-badge">{fmtActualHours(emp.actual_hours)}</span>
										{/if}
									</td>
									<!-- Employee self-reported times (read-only) -->
									<td class:discrepancy={hasDiscrepancy(emp)}>
										<span class="emp-time">{isoToLocalTime(emp.employee_clock_in) || '—'}</span>
									</td>
									<td class="num" class:discrepancy={hasDiscrepancy(emp)}>
										<span class="emp-time">{isoToLocalTime(emp.employee_clock_out) || '—'}</span>
										{#if emp.employee_actual_hours != null}
											<span class="hours-badge emp-badge">{fmtActualHours(emp.employee_actual_hours)}</span>
										{/if}
									</td>
									<td>
										<button
											class="btn-icon danger"
											title="Entfernen"
											onclick={() => removeEmployee(emp.employee_id)}
										>
											<Trash2 size={14} />
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="total-row">
								<td><strong>Gesamt</strong></td>
								<td class="num"><strong>{emps.reduce((s, e) => s + e.planned_hours, 0).toFixed(1)}</strong></td>
								<td></td>
								<td class="num">
									<strong>
										{#if emps.some(e => e.actual_hours != null)}
											{fmtActualHours(emps.reduce((s, e) => s + (e.actual_hours ?? 0), 0))}
										{:else}—{/if}
									</strong>
								</td>
								<td></td>
								<td class="num">
									<strong>
										{#if emps.some(e => e.employee_actual_hours != null)}
											{fmtActualHours(emps.reduce((s, e) => s + (e.employee_actual_hours ?? 0), 0))}
										{:else}—{/if}
									</strong>
								</td>
								<td></td>
							</tr>
						</tfoot>
					</table>
				</div>
			{:else}
				<p class="empty-hint">Noch keine Mitarbeiter zugewiesen.</p>
			{/if}
		</div>
	</div>

	<!-- Assign modal -->
	{#if showAssignModal}
		<div class="modal-overlay" onclick={() => (showAssignModal = false)}>
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<h3>Mitarbeiter zuweisen</h3>
				<form onsubmit={(e) => { e.preventDefault(); handleAssign(); }}>
					<div class="field" style="margin-bottom:0.75rem">
						<label for="assign-emp">Mitarbeiter</label>
						<select id="assign-emp" bind:value={assignEmployeeId}>
							{#each availableEmployees as emp}
								<option value={emp.id}>{emp.first_name} {emp.last_name} ({emp.email})</option>
							{/each}
						</select>
					</div>
					<div class="field" style="margin-bottom:0.75rem">
						<label for="assign-hours">Geplante Stunden</label>
						<input id="assign-hours" type="number" step="0.5" bind:value={assignPlannedHours} />
					</div>
					<div class="field" style="margin-bottom:0.75rem">
						<label for="assign-notes">Notizen</label>
						<input id="assign-notes" type="text" bind:value={assignNotes} placeholder="Optional" />
					</div>
					<div class="modal-actions">
						<button type="button" class="btn" onclick={() => (showAssignModal = false)}>Abbrechen</button>
						<button type="submit" class="btn btn-primary" disabled={assignLoading || !assignEmployeeId}>
							{assignLoading ? 'Zuweisen...' : 'Zuweisen'}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
{/if}

<!-- Rechnungen Card (visible for accepted+ statuses) -->
{#if showInvoiceCard && data}
	<div class="invoices-section">
		<div class="card">
			<div class="card-header">
				<h3>Rechnungen</h3>
				{#if invoices.length === 0}
					<div class="invoice-create-btns">
						<button
							class="btn btn-sm btn-primary"
							disabled={invoiceCreating}
							onclick={createFullInvoice}
						>
							<Plus size={14} />
							Rechnung Erstellen
						</button>
						<button
							class="btn btn-sm"
							onclick={() => (showPartialForm = !showPartialForm)}
						>
							<Plus size={14} />
							Partielle Rechnung
						</button>
					</div>
				{/if}
			</div>

			<!-- Partial invoice form -->
			{#if showPartialForm && invoices.length === 0}
				<form class="partial-form" onsubmit={createPartialInvoice}>
					<div class="partial-form-row">
						<label for="partial-pct">Anzahlungsprozentsatz (%)</label>
						<input
							id="partial-pct"
							type="number"
							min="1"
							max="99"
							class="inline-input"
							bind:value={partialPercent}
						/>
					</div>
					{#if partialPreview()}
						{@const preview = partialPreview()!}
						<div class="partial-preview">
							<span>Anzahlung: <strong>{formatEuro(preview.first)}</strong></span>
							<span>Restbetrag: <strong>{formatEuro(preview.remaining)}</strong></span>
						</div>
					{/if}
					<div class="partial-form-actions">
						<button type="button" class="btn btn-sm" onclick={() => (showPartialForm = false)}>Abbrechen</button>
						<button type="submit" class="btn btn-sm btn-primary" disabled={invoiceCreating}>
							{invoiceCreating ? 'Erstelle...' : 'Erstellen'}
						</button>
					</div>
				</form>
			{/if}

			{#if invoicesLoading}
				<p class="empty-hint">Rechnungen werden geladen...</p>
			{:else if invoices.length === 0}
				<p class="empty-hint">Noch keine Rechnung erstellt.</p>
			{:else}
				<div class="invoices-list">
					{#each invoices as inv}
						<div class="invoice-row">
							<div class="invoice-row-header">
								<div class="invoice-row-meta">
									<span class="invoice-number">Nr. {inv.invoice_number}</span>
									<span class="invoice-type-label">
										{#if inv.invoice_type === 'full'}Vollrechnung
										{:else if inv.invoice_type === 'partial_first'}Anzahlung ({inv.partial_percent}%)
										{:else}Restbetrag
										{/if}
									</span>
									<span class="invoice-amount">{formatEuro(inv.total_brutto_cents)}</span>
								</div>
								<div class="invoice-row-actions">
									<span class="inv-status inv-status--{invoiceStatusClass(inv.status)}">
										{invoiceStatusLabel(inv.status)}
									</span>
									<button
										class="btn btn-sm"
										title="PDF herunterladen"
										onclick={() => downloadInvoicePdf(inv)}
									>
										<Download size={13} />
										PDF
									</button>
									{#if inv.status !== 'sent' && inv.status !== 'paid'}
										<button
											class="btn btn-sm btn-primary"
											disabled={!canSendInvoice(inv)}
											title={!canSendInvoice(inv) ? 'Erst nach Auftragsabschluss sendbar' : 'Rechnung senden'}
											onclick={() => sendInvoice(inv.id)}
										>
											<Send size={13} />
											Senden
										</button>
									{/if}
									{#if inv.status === 'sent'}
										<button
											class="btn btn-sm"
											onclick={() => markInvoicePaid(inv.id)}
										>
											Als bezahlt markieren
										</button>
									{/if}
								</div>
							</div>

							<!-- Extra services (only on full / partial_final) -->
							{#if inv.invoice_type !== 'partial_first'}
								<div class="extras-section">
									{#if !editingExtras[inv.id]}
										<div class="extras-header">
											<span class="extras-label">Zusatzleistungen</span>
											<button
												class="btn-link"
												onclick={() => startEditExtras(inv)}
											>Bearbeiten</button>
										</div>
										{#if inv.extra_services.length > 0}
											<ul class="extras-list">
												{#each inv.extra_services as extra}
													<li>
														<span>{extra.description}</span>
														<span class="extras-price">{formatEuro(extra.price_cents)}</span>
													</li>
												{/each}
											</ul>
										{:else}
											<p class="empty-hint extras-empty">Keine Zusatzleistungen</p>
										{/if}
									{:else}
										<div class="extras-editor">
											{#each extrasDraft[inv.id] ?? [] as extra, idx}
												<div class="extras-editor-row">
													<input
														type="text"
														placeholder="Beschreibung"
														class="extras-input"
														bind:value={extrasDraft[inv.id][idx].description}
													/>
													<input
														type="number"
														placeholder="Preis (Netto €)"
														class="extras-input extras-input--price"
														value={(extrasDraft[inv.id][idx].price_cents / 100).toFixed(2)}
														onchange={(e) => {
															extrasDraft[inv.id][idx].price_cents = Math.round(
																parseFloat((e.target as HTMLInputElement).value) * 100
															);
														}}
													/>
													<button
														class="btn-icon danger"
														onclick={() => removeExtraRow(inv.id, idx)}
													><X size={13} /></button>
												</div>
											{/each}
											<div class="extras-editor-footer">
												<button class="btn-link" onclick={() => addExtraRow(inv.id)}>
													<Plus size={12} /> Hinzufügen
												</button>
												<div class="extras-editor-actions">
													<button class="btn btn-sm" onclick={() => { editingExtras[inv.id] = false; }}>Abbrechen</button>
													<button class="btn btn-sm btn-primary" onclick={() => saveExtras(inv.id)}>Speichern</button>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Email Thread Section (below the main grid) -->
{#if data}
	<div class="email-section">
		<div class="email-section__header">
			<h2 class="email-section__title">E-Mail-Verlauf</h2>
			{#if emailThreads.length > 0}
				<a
					href="/admin/emails/{emailThreads[0].thread.id}"
					class="email-section__link"
				>
					Vollansicht
				</a>
			{/if}
		</div>

		{#if emailsLoading}
			<div class="email-loading">E-Mails werden geladen...</div>
		{:else if emailThreads.length === 0}
			<div class="email-empty">Noch keine E-Mails für diese Anfrage.</div>
		{:else}
			{#each emailThreads as { thread, messages }}
				<div class="email-thread">
					{#if thread.subject}
						<div class="email-thread__subject">
							{thread.subject}
						</div>
					{/if}
					<div class="email-conversation">
						{#each messages as msg}
							<div
								class="email-msg"
								class:email-msg--inbound={msg.direction ===
									"inbound"}
								class:email-msg--outbound={msg.direction ===
									"outbound" && msg.status !== "draft"}
								class:email-msg--draft={msg.status === "draft"}
							>
								<div class="email-msg__header">
									<span class="email-msg__from">
										{#if msg.status === "draft"}
											Entwurf an {msg.to_address}
										{:else if msg.direction === "inbound"}
											{msg.from_address}
										{:else}
											AUST Umzuege
										{/if}
									</span>
									<div class="email-msg__meta">
										{#if msg.status === "draft"}
											<span
												class="email-badge email-badge--draft"
												>Entwurf</span
											>
										{/if}
										{#if msg.llm_generated}
											<span
												class="email-badge email-badge--ai"
												>KI</span
											>
										{/if}
										<span class="email-msg__date"
											>{formatDateTime(
												msg.created_at,
											)}</span
										>
									</div>
								</div>

								{#if emailEditingId === msg.id}
									<div class="email-edit-fields">
										<input
											class="email-edit-subject"
											type="text"
											placeholder="Betreff"
											bind:value={emailEditSubject}
										/>
										<textarea
											class="email-edit-body"
											rows="8"
											placeholder="Nachrichtentext..."
											bind:value={emailEditBody}
										></textarea>
									</div>
									<div class="email-draft-actions">
										<button
											class="btn btn-sm btn-save"
											onclick={() =>
												emailSaveEdit(msg.id)}
											disabled={emailSaving}
										>
											<Save size={14} />
											{emailSaving
												? "Speichere..."
												: "Speichern"}
										</button>
										<button
											class="btn btn-sm"
											onclick={emailCancelEdit}
											disabled={emailSaving}
										>
											Abbrechen
										</button>
									</div>
								{:else}
									{#if msg.subject}
										<div class="email-msg__subject">
											{msg.subject}
										</div>
									{/if}
									<div class="email-msg__body">
										{msg.body_text || ""}
									</div>

									{#if msg.status === "draft"}
										<div class="email-draft-actions">
											<button
												class="btn btn-sm btn-primary"
												onclick={() =>
													emailSendDraft(msg.id)}
												disabled={emailActionLoading ===
													msg.id}
											>
												<Send size={14} />
												{emailActionLoading === msg.id
													? "Bitte warten..."
													: "Senden"}
											</button>
											<button
												class="btn btn-sm"
												onclick={() =>
													emailStartEdit(msg)}
												disabled={emailActionLoading ===
													msg.id}
											>
												<Pencil size={14} />
												Bearbeiten
											</button>
											{#if msg.llm_generated}
												<button
													class="btn btn-sm"
													onclick={() =>
														emailRegenerateLlm(
															msg.id,
														)}
													disabled={emailActionLoading ===
														msg.id}
												>
													<RotateCcw size={14} />
													Neu generieren
												</button>
											{/if}
											<button
												class="btn btn-sm btn-danger"
												onclick={() =>
													emailDiscardDraft(msg.id)}
												disabled={emailActionLoading ===
													msg.id}
											>
												<X size={14} />
												Verwerfen
											</button>
										</div>
									{/if}
								{/if}
							</div>
						{/each}
						{#if messages.length === 0}
							<div class="email-empty">
								Keine Nachrichten in diesem Thread.
							</div>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
{/if}

<svelte:window onkeydown={handleKeydown} />

{#if photoDetailIndex !== null}
	{@const pdItems = photoDetailItems()}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="photo-detail-backdrop"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) closePhotoDetail();
		}}
	>
		<div class="photo-detail-modal">
			<!-- Header -->
			<div class="photo-detail-header">
				<button
					class="btn btn-sm"
					onclick={photoDetailPrev}
					disabled={photoDetailIndex === 0}
					aria-label="Vorheriges Foto"
				>
					<ChevronLeft size={16} />
				</button>
				<h3>Foto {photoDetailIndex + 1} / {galleryImages.length}</h3>
				<button
					class="btn btn-sm"
					onclick={photoDetailNext}
					disabled={photoDetailIndex === galleryImages.length - 1}
					aria-label="Naechstes Foto"
				>
					<ChevronRight size={16} />
				</button>
				<button
					class="review-close"
					onclick={closePhotoDetail}
					aria-label="Schliessen"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Body: large image + items panel -->
			<div class="photo-detail-body">
				<!-- Main area: full photo or zoomed crop -->
				<div class="photo-detail-main">
					{#if photoDetailZoomItem !== null && pdItems[photoDetailZoomItem]?.crop_url}
						<div class="photo-detail-zoom-back">
							<button
								class="btn btn-sm"
								onclick={() => (photoDetailZoomItem = null)}
							>
								<ChevronLeft size={14} /> Foto
							</button>
						</div>
						<img
							src={API_BASE + pdItems[photoDetailZoomItem].crop_url}
							alt={pdItems[photoDetailZoomItem].name}
							class="photo-detail-main-img"
						/>
					{:else}
						<img
							src={galleryImages[photoDetailIndex]}
							alt="Foto {photoDetailIndex + 1}"
							class="photo-detail-main-img"
						/>
					{/if}
				</div>

				<!-- Items side panel -->
				<div class="photo-detail-side">
					<div class="photo-detail-side-header">
						<h4>{pdItems.length} Gegenst&auml;nde</h4>
						<button class="btn btn-sm" onclick={addItemToPhoto}>
							<Plus size={14} /> Hinzuf&uuml;gen
						</button>
					</div>
					<div class="photo-detail-items-list">
						{#each pdItems as item, i}
							<div
								class="photo-detail-item"
								class:pdi-zoomed={photoDetailZoomItem === i}
							>
								<!-- Crop thumbnail (click to enlarge) -->
								<button
									class="pdi-thumb-btn"
									onclick={() =>
										(photoDetailZoomItem =
											photoDetailZoomItem === i ? null : i)}
									title={item.crop_url ? "Vergr&ouml;&szlig;ern" : "Kein Foto"}
								>
									{#if item.crop_url}
										<img
											src={API_BASE + item.crop_url}
											alt={item.name}
											class="pdi-thumb"
										/>
									{:else}
										<div class="pdi-no-thumb">&mdash;</div>
									{/if}
								</button>
								<!-- Edit fields -->
								<div class="pdi-fields">
									<input
										type="text"
										class="edit-input edit-name"
										bind:value={item.name}
										oninput={markDirty}
										placeholder="Bezeichnung"
									/>
									<div class="pdi-row">
										<input
											type="number"
											class="edit-input edit-num"
											min="0"
											step="0.01"
											bind:value={item.volume_m3}
											oninput={markDirty}
										/>
										<span class="pdi-unit">m&sup3;</span>
										<label class="pdi-check">
											<input
												type="checkbox"
												bind:checked={item.is_moveable}
												onchange={markDirty}
											/>
											<span>Mobil</span>
										</label>
									</div>
								</div>
								<!-- Delete -->
								<button
									class="del-btn"
									onclick={() => deleteItem(item)}
									title="Entfernen"
								>
									<X size={14} />
								</button>
							</div>
						{/each}
						{#if pdItems.length === 0}
							<p class="empty-items">
								Keine Gegenst&auml;nde f&uuml;r dieses Foto erkannt.
							</p>
						{/if}
					</div>
					{#if itemsDirty}
						<div class="photo-detail-save">
							<button
								class="btn btn-primary"
								onclick={saveItems}
								disabled={savingItems}
							>
								<Save size={14} />
								{savingItems ? "Speichern..." : "Speichern"}
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}


{#if reviewIndex !== null}
	{@const items = sortedItems()}
	{@const rItem = items[reviewIndex]}
	{#if rItem}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="review-backdrop"
			role="presentation"
			onclick={(e) => {
				if (e.target === e.currentTarget) closeReview();
			}}
		>
			<button
				class="review-close"
				onclick={closeReview}
				aria-label="Schliessen"
			>
				<X size={24} />
			</button>

			{#if reviewIndex > 0}
				<button
					class="review-nav review-prev"
					onclick={reviewPrev}
					aria-label="Vorheriger Gegenstand"
				>
					<ChevronLeft size={32} />
				</button>
			{/if}

			{#if reviewIndex < items.length - 1}
				<button
					class="review-nav review-next"
					onclick={reviewNext}
					aria-label="Naechster Gegenstand"
				>
					<ChevronRight size={32} />
				</button>
			{/if}

			<div class="review-content">
				<div class="review-image-wrap">
					{#key reviewIndex}
						{#if rItem.crop_url}
							<img
								src={API_BASE + rItem.crop_url}
								alt={rItem.name}
								class="review-image"
							/>
						{:else}
							<div class="review-no-image">Kein Foto</div>
						{/if}
					{/key}
				</div>

				<div class="review-panel">
					<div class="review-field">
						<label for="review-item-name">Gegenstand</label>
						<input
							id="review-item-name"
							type="text"
							bind:value={rItem.name}
							oninput={markDirty}
							class="review-input"
						/>
					</div>
					<div class="review-row">
						<div class="review-field">
							<label for="review-volume">Volumen (m3)</label>
							<input
								id="review-volume"
								type="number"
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
								id="review-quantity"
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
						<button
							class="review-btn review-btn-delete"
							onclick={reviewDelete}
						>
							<Trash2 size={14} />
							Entfernen
						</button>
						<span class="review-counter"
							>{reviewIndex + 1} / {items.length}</span
						>
						<button
							class="review-btn review-btn-add"
							onclick={() => {
								addItem();
								reviewIndex = sortedItems().length - 1;
							}}
						>
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
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
		text-decoration: none;
		margin-bottom: 1rem;
		transition: color var(--dt-transition);
	}

	.back-link:hover {
		color: var(--dt-on-surface);
	}

	.loading {
		color: var(--dt-on-surface-variant);
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
		color: var(--dt-on-surface);
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
		background: var(--dt-surface-container-lowest);
		border: none;
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
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
		color: var(--dt-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 0.9375rem;
		color: var(--dt-on-surface);
	}

	.name-with-salutation {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.salutation-badge {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--dt-surface-container);
		color: var(--dt-primary);
		letter-spacing: 0.03em;
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
		color: var(--dt-on-surface-variant);
	}

	.field input,
	.field textarea {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
		outline: none;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
		font-family: inherit;
	}

	.field input:focus,
	.field textarea:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.customer-message {
		color: var(--dt-on-surface);
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
		border-radius: var(--dt-radius-md);
		border: none;
		background: var(--dt-surface-container-high);
		cursor: pointer;
		padding: 0;
		box-shadow: var(--dt-shadow-ambient);
		transition: transform var(--dt-transition), box-shadow var(--dt-transition);
	}

	.photo-thumb-btn:hover {
		transform: scale(1.03);
		box-shadow: var(--dt-shadow-ambient);
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
		border-radius: var(--dt-radius-md);
		background: var(--dt-tertiary);
		box-shadow: var(--dt-shadow-ambient);
	}

	/* Upload Queue actions */
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

	.upload-status {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 0;
		color: var(--dt-primary);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.upload-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--dt-outline-variant);
		border-top-color: var(--dt-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
		color: var(--dt-primary);
		font-size: 0.75rem;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color var(--dt-transition);
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.btn-link:hover {
		text-decoration: underline;
	}

	.labor-profit {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		font-family: "JetBrains Mono", "Fira Code", monospace;
	}

	.labor-profit.negative {
		color: var(--dt-secondary);
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
		border-bottom: 1px solid var(--dt-surface-container);
	}

	.line-item.total {
		border-bottom: none;
		border-top: 1px solid var(--dt-outline-variant);
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
		color: var(--dt-on-surface);
	}

	.li-name {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.li-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.li-qty {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.li-unit {
		font-size: 0.8125rem;
		color: var(--dt-outline-variant);
	}

	.li-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		min-width: 80px;
		text-align: right;
		font-family: "JetBrains Mono", "Fira Code", monospace;
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
		color: var(--dt-on-surface-variant);
		font-weight: 600;
		padding: 0.5rem 0.75rem;
		background: var(--dt-surface-container-high);
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.items-table td {
		padding: 0.375rem 0.75rem;
		color: var(--dt-on-surface);
		vertical-align: middle;
	}

	.items-table tr:nth-child(even) td {
		background: var(--dt-surface-container-low);
	}

	.items-table .total-row td {
		font-weight: 700;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
		padding: 0.5rem 0.75rem;
	}

	.items-footer-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.375rem;
		padding: 0.75rem 1rem 0.25rem;
	}

	.empty-items {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-align: center;
		padding: 1.5rem 0;
	}

	/* Section B — box items */
	.items-section-box .card-header {
		border-left: 3px solid var(--dt-secondary-container);
		padding-left: 0.75rem;
	}

	.badge-box {
		background: var(--dt-surface-container);
		color: var(--dt-on-surface-variant);
	}

	.box-item-row td {
		background: var(--dt-surface-container-low);
	}

	/* Section C — non-moveable items */
	.items-section-nonmoveable .card-header {
		border-left: 3px solid var(--dt-outline-variant);
		padding-left: 0.75rem;
	}

	.badge-nonmoveable {
		background: var(--dt-surface-container);
		color: var(--dt-on-surface-variant);
	}

	.nonmoveable-row td {
		opacity: 0.7;
	}

	.section-badge {
		display: inline-block;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.section-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.section-toggle h3 {
		margin: 0;
	}

	.toggle-arrow {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.section-note {
		font-size: 0.78rem;
		color: var(--dt-on-surface-variant);
		padding: 0.5rem 1rem 0.75rem;
		margin: 0;
		font-style: italic;
	}

	.th-sortable {
		cursor: pointer;
		user-select: none;
		transition: color var(--dt-transition);
	}

	.th-sortable:hover {
		color: var(--dt-on-surface);
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
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		padding: 0;
		cursor: pointer;
		overflow: hidden;
		transition: border-color var(--dt-transition);
	}

	.crop-btn:hover {
		border-color: var(--dt-primary);
	}

	.crop-thumb {
		display: block;
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: var(--dt-radius-sm);
	}

	.no-crop {
		color: var(--dt-outline-variant);
		font-size: 0.75rem;
	}

	/* Inline edit inputs */
	.edit-input {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		padding: 0.25rem 0.375rem;
		font-size: 0.8125rem;
		outline: none;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
		font-family: inherit;
		width: 100%;
		box-sizing: border-box;
	}

	.edit-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-name {
		min-width: 120px;
	}

	.edit-num {
		width: 80px;
		text-align: right;
	}

	.confidence-cell {
		color: var(--dt-on-surface-variant);
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
		color: var(--dt-outline-variant);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.del-btn:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container);
	}

	.del-cell .del-btn {
		color: var(--dt-secondary);
	}

	.del-cell .del-btn :global(svg) {
		width: calc(14px * 1.3);
		height: calc(14px * 1.3);
	}

	/* Dirty state indicator for save button */
	.btn-dirty {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container)) !important;
		color: var(--dt-on-primary) !important;
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
		border-radius: var(--dt-radius-sm);
		text-decoration: none;
		transition: background var(--dt-transition);
	}

	.offer-row:hover {
		background: var(--dt-surface-container-low);
	}

	.offer-date {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.offer-price {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		flex: 1;
	}

	/* Shared button styles */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: opacity var(--dt-transition), background var(--dt-transition);
	}

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.75rem;
		border: var(--dt-ghost-border);
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
	}

	.btn-sm:hover:not(:disabled) {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
	}

	.btn-primary {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		box-shadow: var(--dt-shadow-ambient);
	}

	.btn-primary:hover {
		opacity: 0.88;
	}

	.btn-danger {
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
		border: var(--dt-ghost-border);
		box-shadow: var(--dt-shadow-ambient);
	}

	.btn-danger:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container-low);
	}

	.status-select {
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-md);
		border: none;
		background: var(--dt-surface-container-high);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface);
		cursor: pointer;
		outline: none;
		transition: background var(--dt-transition);
	}

	.status-select:focus {
		background: var(--dt-surface-container-lowest);
		outline: 2px solid var(--dt-primary);
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
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		padding: 0.5rem 0.625rem;
		font-size: 0.875rem;
		outline: none;
		font-family: inherit;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.field select:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		padding-top: 1.25rem;
		cursor: pointer;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1rem;
		height: 1rem;
		accent-color: var(--dt-primary);
	}

	.addr-actions {
		display: flex;
		gap: 0.5rem;
		padding-top: 0.25rem;
	}

	.btn-save {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container)) !important;
		color: var(--dt-on-primary) !important;
	}

	/* Editable line items */
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
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		min-width: 140px;
		transition: background var(--dt-transition);
	}

	.li-edit-top select:focus {
		background: var(--dt-surface-container-lowest);
		outline: 2px solid var(--dt-primary);
	}

	.li-edit-bottom {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-li-qty,
	.edit-li-price {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		width: 70px;
		text-align: right;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-qty:focus,
	.edit-li-price:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-li-label {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		flex: 1;
		min-width: 100px;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-label:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-li-remark {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		outline: none;
		flex: 1;
		min-width: 80px;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-remark:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.li-times {
		color: var(--dt-outline-variant);
		font-size: 0.8125rem;
	}

	.li-eur {
		color: var(--dt-on-surface-variant);
		font-size: 0.75rem;
	}

	/* Item Reviewer Lightbox */
	.review-backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
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
		border-radius: var(--dt-radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		transition: background var(--dt-transition);
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
		border-radius: var(--dt-radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border: none;
		cursor: pointer;
		transition: background var(--dt-transition);
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
		border-radius: var(--dt-radius-md);
		display: block;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}

	.review-no-image {
		width: 200px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--dt-radius-md);
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.3);
		font-size: 0.875rem;
	}

	.review-panel {
		width: 100%;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border: var(--dt-glass-border);
		border-radius: var(--dt-radius-md);
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
		border-radius: var(--dt-radius-sm);
		color: #ffffff;
		padding: 0.5rem 0.625rem;
		font-size: 0.9375rem;
		font-family: inherit;
		outline: none;
		transition: border-color var(--dt-transition);
		width: 100%;
		box-sizing: border-box;
	}

	.review-input:focus {
		border-color: var(--dt-on-primary);
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
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.review-btn-delete {
		background: rgba(168, 57, 0, 0.2);
		color: #ffb4a0;
		border: 1px solid rgba(168, 57, 0, 0.3);
	}

	.review-btn-delete:hover {
		background: rgba(168, 57, 0, 0.35);
		color: #ffffff;
	}

	.review-btn-add {
		background: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.review-btn-add:hover {
		background: rgba(255, 255, 255, 0.25);
	}

	.review-counter {
		font-size: 0.8125rem;
		color: rgba(255, 255, 255, 0.4);
		font-variant-numeric: tabular-nums;
	}

	.photo-active {
		box-shadow: 0 0 0 3px var(--dt-primary), var(--dt-shadow-ambient);
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
		transition: opacity var(--dt-transition);
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
		color: var(--dt-secondary);
		background: none;
		border: none;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity var(--dt-transition);
	}

	.video-delete-btn:hover {
		opacity: 1;
	}

	.estimation-status-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		font-size: 0.8125rem;
		color: var(--dt-primary);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container);
		margin-bottom: 0.5rem;
	}

	.estimation-status-row.estimation-failed {
		color: var(--dt-secondary);
		background: var(--dt-surface-container-high);
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

		.btn {
			min-height: 44px;
		}
		.btn-sm {
			min-height: 44px;
		}
		.header-actions {
			flex-wrap: wrap;
		}
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
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		border: none;
		border-radius: var(--dt-radius-lg);
		cursor: pointer;
		box-shadow: var(--dt-shadow-ambient);
		transition: opacity var(--dt-transition);
	}

	.btn-generate-bottom:hover {
		opacity: 0.88;
	}

	.download-all-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		box-shadow: var(--dt-shadow-ambient);
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.download-all-btn:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
	}

	.download-all-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	/* ── Employees Section ─────────────────────────────────────────── */

	.employees-section {
		margin-bottom: 1.5rem;
	}

	.emp-table-wrapper {
		overflow-x: auto;
	}

	.emp-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.emp-table th {
		text-align: left;
		padding: 0.5rem 0.75rem;
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		font-weight: 600;
		font-size: 0.8125rem;
	}

	.emp-table td {
		padding: 0.5rem 0.75rem;
		color: var(--dt-on-surface);
	}

	.emp-table tr:nth-child(even) td {
		background: var(--dt-surface-container-low);
	}

	.emp-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.emp-table .total-row td {
		background: var(--dt-surface-container-high);
		font-weight: 700;
	}

	.emp-table .group-header {
		text-align: center;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
	}

	.emp-table .admin-group {
		background: #eff6ff;
		color: #1d4ed8;
		border-bottom: 2px solid #bfdbfe;
	}

	.emp-table .emp-group {
		background: #f0fdf4;
		color: #15803d;
		border-bottom: 2px solid #bbf7d0;
	}

	.emp-table .subheader-row th {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.75rem;
	}

	.emp-table td.discrepancy {
		background: #fff7ed;
	}

	.emp-time {
		font-variant-numeric: tabular-nums;
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.hours-badge {
		display: inline-block;
		font-size: 0.6875rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 999px;
		padding: 0.1rem 0.4rem;
		margin-left: 0.25rem;
		font-weight: 600;
	}

	.emp-badge {
		background: #dcfce7;
		color: #15803d;
	}

	.inline-input {
		width: 60px;
		padding: 0.25rem 0.375rem;
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		outline: none;
		transition: border-bottom var(--dt-transition), background var(--dt-transition);
	}

	.inline-input:focus {
		border-bottom-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
	}

	.inline-input[type="text"] {
		width: 88px;
		text-align: left;
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.btn-icon.danger:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container);
	}

	.empty-hint {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem 0;
		margin: 0;
	}

	/* ── Rechnungen Section ─────────────────────────────────────────── */

	.invoices-section {
		margin-bottom: 1.5rem;
	}

	.invoice-create-btns {
		display: flex;
		gap: 0.5rem;
	}

	.partial-form {
		padding: 1rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.partial-form-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.partial-form-row label {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.partial-preview {
		display: flex;
		gap: 2rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.partial-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.invoices-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.invoice-row {
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		padding: 0.875rem 1rem;
	}

	.invoice-row-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.invoice-row-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.invoice-number {
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.invoice-type-label {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.invoice-amount {
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.invoice-row-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.inv-status {
		display: inline-block;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}

	.inv-status--grey   { background: var(--dt-surface-container); color: var(--dt-on-surface-variant); }
	.inv-status--orange { background: var(--dt-surface-container-high); color: var(--dt-secondary); }
	.inv-status--blue   { background: var(--dt-surface-container); color: var(--dt-primary); }
	.inv-status--green  { background: var(--dt-surface-container); color: var(--dt-primary); }

	.extras-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-surface-container-high);
	}

	.extras-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.extras-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
	}

	.extras-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.extras-list li {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--dt-on-surface);
	}

	.extras-price {
		font-weight: 500;
	}

	.extras-empty {
		margin: 0.25rem 0 0;
	}

	.extras-editor {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.extras-editor-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.extras-input {
		flex: 1;
		padding: 0.3rem 0.5rem;
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		transition: border-bottom var(--dt-transition), background var(--dt-transition);
	}

	.extras-input:focus {
		border-bottom-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
	}

	.extras-input--price {
		flex: 0 0 9rem;
	}

	.extras-editor-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
	}

	.extras-editor-actions {
		display: flex;
		gap: 0.4rem;
	}

	/* ── Email Thread Section ───────────────────────────────────────── */
	.email-section {
		max-width: 1200px;
		margin-top: 1.5rem;
	}

	.email-section__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.email-section__title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.email-section__link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-lowest);
		transition: background var(--dt-transition);
	}

	.email-section__link:hover {
		background: var(--dt-surface-container-low);
	}

	.email-loading,
	.email-empty {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		padding: 1.5rem;
		text-align: center;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-thread {
		margin-bottom: 1rem;
	}

	.email-thread__subject {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.5rem;
		padding-left: 0.25rem;
	}

	.email-conversation {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.email-msg {
		border-radius: var(--dt-radius-md);
		padding: 1rem 1.25rem;
		max-width: 85%;
	}

	.email-msg--inbound {
		align-self: flex-start;
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg--outbound {
		align-self: flex-end;
		background: var(--dt-surface-container);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg--draft {
		align-self: flex-end;
		background: var(--dt-surface-container-low);
		border: 2px dashed var(--dt-outline-variant);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.email-msg__from {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.email-msg__meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.email-msg__date {
		font-size: 0.6875rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.email-badge {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.email-badge--draft {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.email-badge--ai {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.email-msg__subject {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}

	.email-msg__body {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.email-draft-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-outline-variant);
		flex-wrap: wrap;
	}

	.email-edit-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.email-edit-subject,
	.email-edit-body {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
		outline: none;
		box-sizing: border-box;
		font-family: inherit;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.email-edit-subject:focus,
	.email-edit-body:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.email-edit-body {
		resize: vertical;
		line-height: 1.5;
	}

	.btn-save {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container)) !important;
		color: var(--dt-on-primary) !important;
	}

	.btn-save:hover:not(:disabled) {
		opacity: 0.88;
	}

	@media (max-width: 768px) {
		.email-msg {
			max-width: 100%;
		}

		.email-msg__header {
			gap: 0.375rem;
		}
	}

	/* ── Photo Detail Popup ─────────────────────────────────────────── */
	.photo-detail-backdrop {
		position: fixed;
		inset: 0;
		z-index: 300;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.photo-detail-modal {
		background: var(--dt-surface);
		border-radius: var(--dt-radius-lg);
		width: 90vw;
		max-width: 1280px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}

	.photo-detail-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 1rem;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border-bottom: var(--dt-glass-border);
		flex-shrink: 0;
	}

	.photo-detail-header h3 {
		flex: 1;
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		text-align: center;
		margin: 0;
	}

	.photo-detail-body {
		display: grid;
		grid-template-columns: 1fr 300px;
		flex: 1;
		overflow: hidden;
		min-height: 0;
	}

	.photo-detail-main {
		background: var(--dt-tertiary);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
		min-height: 400px;
	}

	.photo-detail-zoom-back {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		z-index: 1;
	}

	.photo-detail-main-img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		display: block;
	}

	.photo-detail-side {
		background: var(--dt-surface-container-lowest);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.photo-detail-side-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		background: var(--dt-surface-container-high);
		flex-shrink: 0;
	}

	.photo-detail-side-header h4 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		margin: 0;
	}

	.photo-detail-items-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.375rem;
	}

	.photo-detail-item {
		display: grid;
		grid-template-columns: 52px 1fr 28px;
		gap: 0.375rem;
		padding: 0.375rem;
		border-radius: var(--dt-radius-sm);
		border: 1px solid transparent;
		margin-bottom: 0.25rem;
		align-items: start;
		transition: background var(--dt-transition), border-color var(--dt-transition);
	}

	.photo-detail-item:hover {
		background: var(--dt-surface-container-low);
	}

	.photo-detail-item.pdi-zoomed {
		background: var(--dt-surface-container);
		border-color: var(--dt-outline-variant);
	}

	.pdi-thumb-btn {
		border: none;
		background: var(--dt-surface-container);
		padding: 0;
		cursor: pointer;
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		width: 52px;
		height: 52px;
		transition: outline var(--dt-transition);
	}

	.pdi-thumb-btn:hover {
		outline: 2px solid var(--dt-primary);
	}

	.pdi-thumb {
		width: 52px;
		height: 52px;
		object-fit: cover;
		display: block;
	}

	.pdi-no-thumb {
		width: 52px;
		height: 52px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--dt-on-surface-variant);
		font-size: 1rem;
	}

	.pdi-fields {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.pdi-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.pdi-unit {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.pdi-check {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		margin-left: auto;
		white-space: nowrap;
	}

	.pdi-check input[type="checkbox"] {
		cursor: pointer;
		accent-color: var(--dt-primary);
	}

	.photo-detail-save {
		padding: 0.625rem 0.875rem;
		border-top: 1px solid var(--dt-outline-variant);
		flex-shrink: 0;
	}

	.photo-detail-save .btn-primary {
		width: 100%;
	}

	@media (max-width: 768px) {
		.photo-detail-modal {
			width: 100vw;
			max-width: 100vw;
			height: 100vh;
			max-height: 100vh;
			border-radius: 0;
		}
		.photo-detail-body {
			grid-template-columns: 1fr;
			grid-template-rows: 50vh 1fr;
		}
		.photo-detail-side {
			border-left: none;
		}
	}

</style>
