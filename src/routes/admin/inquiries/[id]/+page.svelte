<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import {
		apiGet,
		apiPatch,
		apiPost,
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
	import { floorLabel, parseFloor } from "$lib/utils/floor";
	import AddressEditor from "./_components/AddressEditor.svelte";
	import EmployeeAssignmentPanel from "$lib/components/admin/EmployeeAssignmentPanel.svelte";
	import { normalizeFlatTotalItem, calculateBruttoCents, bruttoCentsToNetto } from "$lib/utils/pricing";
	import EstimationItemsTable from "$lib/components/admin/EstimationItemsTable.svelte";
	import PhotoVideoUpload from "$lib/components/admin/PhotoVideoUpload.svelte";
	import { SERVICE_TYPE_LABELS } from '$lib/utils/constants';
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
		Download,
		Send,
	} from "lucide-svelte";

	interface AddressSnapshot {
		id: string;
		street: string;
		house_number: string | null;
		city: string;
		postal_code: string | null;
		country: string;
		floor: string | null;
		elevator: boolean | null;
		needs_parking_ban: boolean | null;
		parking_ban: boolean | null;
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
		customer_type: string | null;
		company_name: string | null;
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
		scheduled_date: string | null;
		notes: string | null;
		customer_message: string | null;
		created_at: string;
		updated_at: string;
		offer_sent_at: string | null;
		accepted_at: string | null;
		service_type: string | null;
		submission_mode: string | null;
		recipient: CustomerSnapshot | null;
		billing_address: AddressSnapshot | null;

		customer: CustomerSnapshot | null;
		origin_address: AddressSnapshot | null;
		destination_address: AddressSnapshot | null;
		stop_address: AddressSnapshot | null;
		estimation: EstimationSnapshot | null;
		estimations?: EstimationSnapshot[];
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

	let data = $state<InquiryResponse | null>(null);


	let loading = $state(true);
	let saving = $state(false);

	// Billing address editor state
	let showBillingEdit = $state(false);
	let billingSaving = $state(false);
	let billingStreet = $state('');
	let billingNumber = $state('');
	let billingPostal = $state('');
	let billingCity = $state('');

	// Pre-fill billing fields when opening editor
	$effect(() => {
		if (showBillingEdit && data.billing_address) {
			billingStreet = data.billing_address.street || '';
			billingNumber = data.billing_address.house_number || '';
			billingPostal = data.billing_address.postal_code || '';
			billingCity = data.billing_address.city || '';
		} else if (showBillingEdit && !data.billing_address) {
			billingStreet = '';
			billingNumber = '';
			billingPostal = '';
			billingCity = '';
		}
	});

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
	let editCustomer = $state({ salutation: "", first_name: "", last_name: "", email: "", phone: "", customer_type: "private", company_name: "" });

	// Bindable handles to EstimationItemsTable internals
	let openPhotoDetailFn = $state<((idx: number) => void) | null>(null);
	let saveIfDirtyFn = $state<(() => Promise<void>) | null>(null);

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
			mkLineItem(0, '', 1, 0),
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
	let calculatedBruttoCents = $derived(calculateBruttoCents(calculatedNettoCents));
	const COST_PER_PERSON_HOUR = 18.23;
	let laborProfit = $derived(
		editPersons * editHours * (editRateCents / 100 - COST_PER_PERSON_HOUR),
	);

	/**
	 * Handles keyboard shortcuts for the photo filter while no input is focused.
	 * Reviewer and photo-detail keyboard navigation is handled inside EstimationItemsTable.
	 *
	 * Called by: svelte:window onkeydown
	 * Purpose: Escape clears the active photo filter when no overlay is open.
	 *          Keypresses inside input/textarea/select elements are ignored.
	 *
	 * @param e - The native KeyboardEvent
	 * @returns void
	 */
	function handleKeydown(e: KeyboardEvent) {
		// Don't intercept when typing in inputs
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

		if (filterPhotoIndex !== null) {
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
			// Build "{seq}-{year} {last_name}.pdf", e.g. "1113-2026 Spatz.pdf"
			// offer_number format from backend: "{year}-{seq:04}" e.g. "2026-1113"
			const offerNum = data.offer?.offer_number ?? '';
			const [year, seqStr] = offerNum.includes('-') ? offerNum.split('-') : ['', offerNum];
			const seq = seqStr ? String(parseInt(seqStr, 10)) : data.id.slice(0, 8);
			const lastName = data.customer?.last_name ?? data.customer?.name?.split(' ').pop() ?? 'Angebot';
			const filename = year ? `${seq}-${year} ${lastName}.pdf` : `angebot_${offerNum || data.id.slice(0, 8)}.pdf`;
			await apiDownload(
				`/api/v1/inquiries/${data.id}/pdf`,
				filename,
			);
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			downloadingPdf = false;
		}
	}

	// Photo filter: click a photo to filter items table
	let filterPhotoIndex = $state<number | null>(null);

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
		// Prefer the full estimations array (all statuses: processing, failed, completed).
		// Fall back to the single completed estimation for backward compatibility.
		const ests = data?.estimations;
		if (ests && ests.length > 0) {
			return ests.map((est) => ({
				id: est.id,
				method: est.method,
				status: est.status,
				total_volume_m3: est.total_volume_m3,
				item_count: est.item_count,
				created_at: est.created_at,
				source_video_url: est.source_video ?? null,
				source_image_urls: est.source_images ?? [],
			}));
		}
		const est = data?.estimation;
		if (!est) return [];
		return [
			{
				id: est.id,
				method: est.method,
				status: est.status,
				total_volume_m3: est.total_volume_m3,
				item_count: est.item_count,
				created_at: est.created_at,
				source_video_url: est.source_video ?? null,
				source_image_urls: est.source_images ?? [],
			},
		];
	});

	/** Full-URL photo list — index-aligned so EstimationItemsTable can resolve filterPhotoIndex. */
	let galleryImages = $derived(
		estimationsList
			.filter((e) => e.source_image_urls.length > 0)
			.flatMap((e) => e.source_image_urls.map((url) => API_BASE + url)),
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
			editDate = data.scheduled_date || "";
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
			scheduled_date: editDate || null,
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

	/** Save or update the billing address for this inquiry. */
	async function saveBillingAddress() {
		if (!data) return;
		billingSaving = true;
		try {
			const patch: Record<string, unknown> = {};
			if (billingStreet.trim() || billingCity.trim()) {
				patch.billing_address = {
					street: billingStreet.trim() || null,
					house_number: billingNumber.trim() || null,
					postal_code: billingPostal.trim() || null,
					city: billingCity.trim() || null,
				};
			} else {
				patch.clear_billing_address = true;
			}
			await apiPatch(`/api/v1/inquiries/${data.id}`, patch);
			showBillingEdit = false;
			showToast("Rechnungsadresse gespeichert", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			billingSaving = false;
		}
	}

	/** Clear the billing address override (fall back to auto-resolution). */
	async function clearBillingAddress() {
		if (!data) return;
		billingSaving = true;
		try {
			await apiPatch(`/api/v1/inquiries/${data.id}`, { clear_billing_address: true });
			showBillingEdit = false;
			showToast("Rechnungsadresse zurückgesetzt", "success");
			await loadInquiry();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			billingSaving = false;
		}
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
		const targetNetto = bruttoCentsToNetto(editBruttoCents);
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
			await saveIfDirtyFn?.();
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
				payload.price_cents_netto = bruttoCentsToNetto(editBruttoCents);
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
			await saveIfDirtyFn?.();
			// Persist inquiry metadata (volume, distance, notes) so the backend reads fresh data
			await persistInquiry();
			const payload: Record<string, unknown> = {
				persons: editPersons,
				hours: editHours,
				rate: editRateCents / 100,
			};
			if (priceDirty) {
				payload.price_cents_netto = bruttoCentsToNetto(editBruttoCents);
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
		{ value: "completed", label: "Erledigt" },
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
		const status = data.status ?? 'unbekannt';
		const hasOffer = !!data.offer;
		let msg = `Anfrage unwiderruflich loeschen?`;
		if (hasOffer) msg = `Diese Anfrage hat ein Angebot. ` + msg;
		if (!['new', 'pending', 'rejected', 'expired', 'cancelled'].includes(status))
			msg = `Status: ${status}. ` + msg;
		if (!confirm(msg)) return;
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
			salutation: c.salutation ?? "",
			first_name: c.first_name ?? "",
			last_name: c.last_name ?? c.name ?? "",
			email: c.email,
			phone: c.phone ?? "",
			customer_type: c.customer_type ?? "private",
			company_name: c.company_name ?? "",
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
				salutation: editCustomer.salutation || null,
				first_name: editCustomer.first_name || null,
				last_name: editCustomer.last_name || null,
				email: editCustomer.email || null,
				phone: editCustomer.phone || null,
				customer_type: editCustomer.customer_type || null,
				company_name: editCustomer.company_name || null,
			});
			showToast("Kunde gespeichert", "success");
			editingCustomer = false;
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
		// offer total_netto_cents is netto; brutto = netto * VAT_RATE
		const brutto = calculateBruttoCents(offerNetto);
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
			const updated = await apiPatch(`/api/v1/inquiries/${data.id}/employees/${empId}`, { planned_hours: numValue });
			if (data.employees) {
				const idx = data.employees.findIndex((e: EmployeeAssignment) => e.employee_id === empId);
				if (idx !== -1) {
					data.employees[idx] = { ...data.employees[idx], ...updated };
				}
			}
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
	 * Math: combines the inquiry's scheduled_date with the HH:MM time input,
	 * converts to UTC ISO via new Date(...).toISOString().
	 *
	 * @param empId - Employee UUID
	 * @param field - 'clock_in' or 'clock_out'
	 * @param time - HH:MM string from the time input
	 */
	async function updateEmployeeClock(empId: string, field: 'clock_in' | 'clock_out', time: string) {
		if (!data) return;
		if (!time) return;
		const date = data.scheduled_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
		const iso = new Date(`${date}T${time}:00`).toISOString();
		employeeSaving = empId;
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${data.id}/employees/${empId}`, { [field]: iso });
			// Update local state so actual_hours badge and planned_hours reflect immediately
			if (data.employees) {
				const idx = data.employees.findIndex((e: EmployeeAssignment) => e.employee_id === empId);
				if (idx !== -1) {
					data.employees[idx] = { ...data.employees[idx], ...updated };
				}
			}
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
							<label for="cust-type">Kundentyp</label>
							<select id="cust-type" bind:value={editCustomer.customer_type}>
								<option value={null}>–</option>
								<option value="private">Privat</option>
								<option value="business">Gewerbe</option>
							</select>
						</div>
						<div class="field">
							<label for="cust-company">Firma</label>
							<input id="cust-company" type="text" bind:value={editCustomer.company_name} placeholder="{editCustomer.customer_type === 'business' ? 'Firmenname' : 'optional'}" />
						</div>
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
								{#if data.customer?.customer_type === 'business'}
									<span class="cust-type-badge" data-type="business">Gewerbe</span>
								{:else}
									<span class="cust-type-badge" data-type="private">Privat</span>
								{/if}
								{#if data.customer?.salutation}
									<span class="salutation-badge">{data.customer.salutation === "D" ? "Divers" : data.customer.salutation}</span>
								{/if}
								{data.customer?.first_name && data.customer?.last_name
									? `${data.customer.first_name} ${data.customer.last_name}`
									: (data.customer?.last_name ?? data.customer?.name ?? "—")}
							</span>
						</div>
						{#if data.customer?.company_name}
							<div class="info-item">
								<span class="info-label">Firma</span>
								<span class="info-value">{data.customer.company_name}</span>
							</div>
						{/if}
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

			{#if data.recipient}
				<div class="card">
					<div class="card-header">
						<h3>Leistungsempfänger</h3>
					</div>
					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">Name</span>
							<span class="info-value">
								{#if data.recipient.salutation}
									<span class="salutation-badge">{data.recipient.salutation === "D" ? "Divers" : data.recipient.salutation}</span>
								{/if}
								{data.recipient.first_name && data.recipient.last_name
									? `${data.recipient.first_name} ${data.recipient.last_name}`
									: (data.recipient.last_name ?? "—")}
							</span>
						</div>
						<div class="info-item">
							<span class="info-label">E-Mail</span>
							<span class="info-value">{data.recipient.email ?? "—"}</span>
						</div>
						{#if data.recipient.phone}
							<div class="info-item">
								<span class="info-label">Telefon</span>
								<span class="info-value">{data.recipient.phone}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Billing Address (editable) -->
			<div class="card card--compact">
				<div class="card-header">
					<h3>Rechnungsadresse</h3>
					<button class="btn btn-sm" onclick={() => showBillingEdit = !showBillingEdit}>
						{showBillingEdit ? 'Schliessen' : 'Bearbeiten'}
					</button>
				</div>

				{#if data.billing_address}
					<div class="billing-addr-display">
						<span>{data.billing_address.street}{data.billing_address.house_number ? ` ${data.billing_address.house_number}` : ''}</span>
						<span>{data.billing_address.postal_code ? `${data.billing_address.postal_code} ` : ''}{data.billing_address.city}</span>
					</div>
				{:else}
					<p class="billing-addr-hint">
						{data.status === 'completed' || data.status === 'invoiced' || data.status === 'paid'
							? 'Einzugsadresse wird verwendet (Einzug abgeschlossen).'
							: 'Auszugsadresse wird verwendet (Standardeinstellung).'}
					</p>
				{/if}

				{#if showBillingEdit}
					<div class="billing-addr-form">
						<div class="billing-addr-row">
							<input type="text" placeholder="Strasse" bind:value={billingStreet} class="form-input" style="flex:2;" />
							<input type="text" placeholder="Nr." bind:value={billingNumber} class="form-input" style="flex:0 0 80px;" />
						</div>
						<div class="billing-addr-row">
							<input type="text" placeholder="PLZ" bind:value={billingPostal} class="form-input" style="flex:0 0 100px;" />
							<input type="text" placeholder="Ort" bind:value={billingCity} class="form-input" style="flex:2;" />
						</div>
						<div class="billing-addr-actions">
							<button class="btn btn-primary btn-sm" onclick={saveBillingAddress} disabled={billingSaving}>
								{billingSaving ? 'Speichert…' : 'Speichern'}
							</button>
							{#if data.billing_address}
								<button class="btn btn-sm" onclick={clearBillingAddress} disabled={billingSaving} style="color: #dc2626;">
									Zurücksetzen
								</button>
							{/if}
							<button class="btn btn-sm" onclick={() => showBillingEdit = false}>Abbrechen</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Service info -->
			{#if data.service_type}
				<div class="card" style="padding: 0.75rem 1rem;">
					<span class="svc-badge" data-type={data.service_type}>{SERVICE_TYPE_LABELS[data.service_type] ?? data.service_type}</span>
					{#if data.submission_mode && data.submission_mode !== 'termin'}
						<span class="svc-badge" style="margin-left: 0.5rem; background: #f3f4f6; color: #6b7280;">{data.submission_mode}</span>
					{/if}
				</div>
			{/if}

			<!-- Addresses -->
			<AddressEditor
				originAddress={data.origin_address}
				destinationAddress={data.destination_address}
				onSaved={loadInquiry}
			/>

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

			<!-- Photo/Video Upload & Gallery -->
			<PhotoVideoUpload
				inquiryId={data.id}
				{estimationsList}
				{filterPhotoIndex}
				openPhotoDetail={openPhotoDetailFn}
				onTogglePhotoFilter={togglePhotoFilter}
				onFilterClear={() => { filterPhotoIndex = null; }}
				onUpdated={loadInquiry}
			/>

			<!-- Estimation Items Table (Sections A / B / C) -->
			<EstimationItemsTable
				inquiryId={data.id}
				items={data.items ?? []}
				{filterPhotoIndex}
				galleryImages={galleryImages}
				bind:openPhotoDetail={openPhotoDetailFn}
				bind:saveIfDirty={saveIfDirtyFn}
				onUpdated={loadInquiry}
			/>

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
	<div class="employees-section">
		<div class="card">
			<EmployeeAssignmentPanel
				entityId={data.id}
				entityType="inquiry"
				preferredDate={data.scheduled_date}
			/>
		</div>
	</div>
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

	.card--compact {
		padding: 0.75rem 1rem;
		border-left: 3px solid var(--dt-primary);
	}

	/* Billing address display / edit */
	.billing-addr-display {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		line-height: 1.4;
	}

	.billing-addr-hint {
		font-size: 0.78rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
		font-style: italic;
	}

	.billing-addr-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.billing-addr-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.billing-addr-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
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

	.cust-type-badge {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin-right: 0.35rem;
		vertical-align: middle;
	}

	.cust-type-badge[data-type="business"] {
		background: #d1fae5;
		color: #065f46;
	}

	.cust-type-badge[data-type="private"] {
		background: #dbeafe;
		color: #1e40af;
	}

	.svc-badge {
		display: inline-block;
		padding: 0.15rem 0.45rem;
		border-radius: 4px;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		white-space: nowrap;
		background: #e8eef6;
		color: #1a3a5c;
	}

	.svc-badge[data-type="firmenumzug"] { background: #d1fae5; color: #065f46; }
	.svc-badge[data-type="entruempelung"] { background: #fce7f3; color: #9d174d; }
	.svc-badge[data-type="haushaltsaufloesung"] { background: #fef3c7; color: #92400e; }
	.svc-badge[data-type="lagerung"] { background: #e0e7ff; color: #3730a3; }
	.svc-badge[data-type="montage"] { background: #fef9c3; color: #854d0e; }
	.svc-badge[data-type="umzugshelfer"] { background: #f0fdf4; color: #166534; }
	.svc-badge[data-type="seniorenumzug"] { background: #fce7f3; color: #9d174d; }

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

	/* ── Employees Section ─────────────────────────────────────────── */

	.employees-section {
		margin-bottom: 1.5rem;
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


</style>
