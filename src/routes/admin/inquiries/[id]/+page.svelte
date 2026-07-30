<script lang="ts">
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import {
		apiGet,
		apiPatch,
		apiPost,
		apiDelete,
		apiDownload,
	} from "$lib/utils/api.svelte";
	import { normalizeTimeInput } from "$lib/utils/format";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";
	import { floorLabel, parseFloor } from "$lib/utils/floor";
	import AddressEditor from "./_components/AddressEditor.svelte";
	import ReviewRequestModal from "./_components/ReviewRequestModal.svelte";
	import AppointmentsSection from "./_components/AppointmentsSection.svelte";
	import EmailThreadSection from "./_components/EmailThreadSection.svelte";
	import InvoicesSection from "./_components/InvoicesSection.svelte";
	import EmployeesSection from "./_components/EmployeesSection.svelte";
	import CustomerSection from "./_components/CustomerSection.svelte";
	import DetailsSection from "./_components/DetailsSection.svelte";
	import { normalizeFlatTotalItem, calculateBruttoCents, bruttoCentsToNetto } from "$lib/utils/pricing";
	import PhotoEstimationSection from "./_components/PhotoEstimationSection.svelte";
	import PricingSection from "./_components/PricingSection.svelte";
	import { SERVICE_TYPE_LABELS } from '$lib/utils/constants';
	import {
		ArrowLeft,
		FileOutput,
		RotateCcw,
		Trash2,
		ChevronLeft,
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
		transporter: boolean;
	}

	interface InquiryResponse {
		id: string;
		status: string;
		source: string;
		services: Services;
		volume_m3: number | null;
		distance_km: number | null;
		scheduled_date: string | null;
		start_time: string;
		end_time: string;
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
		effective_billing_address: AddressSnapshot | null;

		customer: CustomerSnapshot | null;
		origin_address: AddressSnapshot | null;
		destination_address: AddressSnapshot | null;
		stop_address: AddressSnapshot | null;
		estimation: EstimationSnapshot | null;
		estimations?: EstimationSnapshot[];
		items: ItemSnapshot[];
		offer: OfferSnapshot | null;
		employees?: EmployeeAssignment[];
		end_date?: string | null;
		is_multi_day?: boolean;
		has_pauschale?: boolean;
		appointments?: Appointment[];
	}

	/** Appointment (Besichtigung or paid Zusatztermin) linked to this inquiry. */
	interface Appointment {
		id: string;
		kind: string;
		scheduled_date: string;
		start_time: string | null;
		end_time: string | null;
		assignee_id: string | null;
		assignee_name: string | null;
		location: string | null;
		description: string | null;
		employee_notes: string | null;
		notes: string | null;
		status: string;
		employees?: { employee_id: string; first_name: string; last_name: string }[];
		created_at: string;
	}

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		clock_in: string | null;
		clock_out: string | null;
		actual_hours: number | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_actual_hours: number | null;
		notes: string | null;
		job_date?: string | null;
		transport_mode?: string | null;
		travel_costs_cents?: number | null;
		accommodation_cents?: number | null;
		misc_costs_cents?: number | null;
		meal_deduction?: string | null;
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

	// Route map coordinates
	let routeCoordinates = $state<[number, number][] | null>(null);

	// Editable fields
	let editVolume = $state<number | null>(null);
	let editDistance = $state(0);
	let editNotes = $state("");
	let editEmployeeNotes = $state("");
	let editDate = $state("");
	let editStartTime = $state("");
	let editEndTime = $state("");
	let editHasPauschale = $state(false);
	// Free-text override for the A29 headline on the KVA ("Umzugspauschale X m³" by default).
	// Lets Alex re-label the main service line for non-volume jobs (Umzugshelfer, Lagerung, …).
	let editHeadlineOverride = $state("");

	let isLocked = $derived(false);

	// Pricing fields
	let editPersons = $state(2);
	let editHours = $state(3);
	let editRateCents = $state(3000);
	let editBruttoCents = $state(0);
	let priceDirty = $state(false);

	// Local string state for rate input to avoid cursor-resetting
	let rateText = $state("30.00");
	let rateEditing = $state(false);

	let cardOpen = $state({
		customer: false,
		recipient: false,
		billing: false,
		details: false,
		message: false,
		pricing: false,
		positions: false,
		offer: false,
		employees: false,
		appointments: false,
		invoices: false,
		route: false,
		photos: false,
		items: false,
	});
	const toggleCard = (k: keyof typeof cardOpen) => { cardOpen[k] = !cardOpen[k]; };

	// Bindable handle to EstimationItemsTable, needed by generateOffer/reEstimateOffer
	// to flush unsaved item edits before regenerating the offer.
	let saveIfDirtyFn = $state<(() => Promise<void>) | null>(null);

	type ItemKind = 'labor' | 'fahrt' | 'insurance' | 'item';

	interface PositionDef {
		kind: ItemKind;
		label: string;
		defaultCents: number;
		defaultRemark: string;
	}

	const POSITION_SKELETON: PositionDef[] = [
		{ kind: 'labor', label: 'Umzugshelfer', defaultCents: 0, defaultRemark: '' },
		{ kind: 'item', label: 'Demontage', defaultCents: 5000, defaultRemark: '' },
		{ kind: 'item', label: 'Montage', defaultCents: 5000, defaultRemark: '' },
		{ kind: 'item', label: 'Einpackservice', defaultCents: 0, defaultRemark: 'je Karton (Glas, Porzellan)' },
		{ kind: 'item', label: 'Halteverbotszone', defaultCents: 10000, defaultRemark: '' },
		{ kind: 'item', label: 'Umzugsmaterial', defaultCents: 3000, defaultRemark: 'Stretchfolie, Decken, Gurte' },
		{ kind: 'item', label: 'Verkauf Seidenpapier', defaultCents: 500, defaultRemark: '500x750' },
		{ kind: 'item', label: 'Verkauf U-Karton', defaultCents: 210, defaultRemark: '590x318x328' },
		{ kind: 'item', label: 'Verkauf B-Karton', defaultCents: 220, defaultRemark: '400x318x328' },
		{ kind: 'item', label: 'Fernsehkarton', defaultCents: 0, defaultRemark: '' },
		{ kind: 'item', label: 'Verleih Kleiderboxen', defaultCents: 1000, defaultRemark: '610x520x1370' },
		{ kind: 'item', label: '3,5t Transporter m. Koffer', defaultCents: 6000, defaultRemark: '' },
		{ kind: 'item', label: 'Möbellift', defaultCents: 0, defaultRemark: '' },
		{ kind: 'item', label: 'Transferfahrzeug', defaultCents: 0, defaultRemark: '' },
		{ kind: 'fahrt', label: 'Fahrkostenpauschale', defaultCents: 0, defaultRemark: '' },
		{ kind: 'insurance', label: 'Nürnbergerversicherung', defaultCents: 0, defaultRemark: 'Deckungssumme: 620,00 Euro / m³' },
	];

	const CUSTOM_LABEL_OPTIONS: string[] = [
		...POSITION_SKELETON.filter(p => p.kind === 'item').map(p => p.label),
		'Sonstiges',
	];

	interface EditLineItem {
		_id: number;        // stable key so Svelte tracks DOM nodes across reorders
		kind: ItemKind;
		label: string;
		remark: string;
		quantity: number;
		unitPriceCents: number;
		_priceText: string;
		_editing: boolean;
		isCustomLabel: boolean;
	}

	function isPresetItemLabel(label: string): boolean {
		return POSITION_SKELETON.some((p) => p.kind === 'item' && p.label === label);
	}

	let _idCounter = 0;
	function nextId() { return ++_idCounter; }

	let editLineItems = $state<EditLineItem[]>([]);
	let dragIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);

	function classifyKind(label: string): ItemKind {
		if (label === 'Fahrkostenpauschale') return 'fahrt';
		if (label === 'Nürnbergerversicherung') return 'insurance';
		if (label.endsWith('Umzugshelfer')) return 'labor';
		return 'item';
	}

	/**
	 * Constructs a new EditLineItem object with sensible defaults for UI state fields.
	 *
	 * Called by: computeLineItemsFromNotes (to build auto-generated items), addLineItem (for manual additions)
	 * Purpose: Centralises line-item construction so all items share a consistent shape including
	 *          the derived `_priceText` string and the `_editing` flag used by inline price inputs.
	 *
	 * @param kind - ItemKind discriminator (labor/fahrt/insurance/item)
	 * @param label - Human-readable label shown on the PDF line item
	 * @param quantity - Number of units
	 * @param unitPriceCents - Unit price in euro cents
	 * @param remark - Optional remark appended to the line on the PDF (default '')
	 * @returns A fully initialised EditLineItem ready for use in `editLineItems`
	 */
	function mkLineItem(
		kind: ItemKind,
		label: string,
		quantity: number,
		unitPriceCents: number,
		remark: string = "",
	): EditLineItem {
		return {
			_id: nextId(),
			kind,
			label,
			remark,
			quantity,
			unitPriceCents,
			_priceText: (unitPriceCents / 100).toFixed(2),
			_editing: false,
			isCustomLabel: kind === 'item' && !isPresetItemLabel(label),
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
	function buildSkeleton(): EditLineItem[] {
		return POSITION_SKELETON.map(p =>
			mkLineItem(p.kind, p.label, p.kind === 'insurance' ? 1 : 0, p.defaultCents, p.defaultRemark)
		);
	}

	function applyNotesToSkeleton(skel: EditLineItem[]) {
		const notes = editNotes.toLowerCase();
		const setQty = (label: string, qty: number, remark?: string) => {
			const it = skel.find(i => i.label === label);
			if (it) {
				it.quantity = qty;
				if (remark !== undefined) it.remark = remark;
			}
		};
		if (notes.includes("demontage")) setQty("Demontage", 1);
		if (notes.replace("demontage", "").includes("montage")) setQty("Montage", 1);
		const hvAuszug = notes.includes("halteverbot auszug");
		const hvEinzug = notes.includes("halteverbot einzug");
		const hvCount = (hvAuszug ? 1 : 0) + (hvEinzug ? 1 : 0);
		if (hvCount > 0) {
			const remark = hvAuszug && hvEinzug
				? "Beladestelle + Entladestelle"
				: hvAuszug ? "Beladestelle" : "Entladestelle";
			setQty("Halteverbotszone", hvCount, remark);
		}
		if (notes.includes("verpackungsservice") || notes.includes("einpackservice")) {
			setQty("Umzugsmaterial", 1, "Stretchfolie, Decken, Gurte Einzelpreis 30,00 €");
		}
	}

	function computeLineItemsFromNotes() {
		const skel = buildSkeleton();
		applyNotesToSkeleton(skel);
		editLineItems = skel;
	}

	function addLineItem() {
		editLineItems = [
			...editLineItems,
			mkLineItem('item', '', 1, 0),
		];
	}

	function removeLineItem(idx: number) {
		editLineItems = editLineItems.filter((_, i) => i !== idx);
	}

	function addInsurance() {
		const def = POSITION_SKELETON.find(p => p.kind === 'insurance')!;
		editLineItems = [
			...editLineItems,
			mkLineItem('insurance', def.label, 1, def.defaultCents, def.defaultRemark),
		];
	}

	function onCustomLabelChange(idx: number) {
		const item = editLineItems[idx];
		item.isCustomLabel = !isPresetItemLabel(item.label);
		const def = POSITION_SKELETON.find(p => p.label === item.label && p.kind === 'item');
		if (def) {
			item.unitPriceCents = def.defaultCents;
			item._priceText = (def.defaultCents / 100).toFixed(2);
			if (!item.remark) item.remark = def.defaultRemark;
		}
		editLineItems = [...editLineItems];
	}

	// `armedIdx` is set when the user mouse-downs on a drag handle. Only then will the
	// row's `dragstart` actually initiate a reorder — clicking into an input or select
	// inside the row will not trigger a drag because the handle wasn't pressed.
	let armedIdx = $state<number | null>(null);
	function armDrag(idx: number) { armedIdx = idx; }
	function disarmDrag() { armedIdx = null; }

	function onDragStart(e: DragEvent, idx: number) {
		if (armedIdx !== idx) {
			e.preventDefault();
			return;
		}
		dragIdx = idx;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			// Firefox requires data to be set for the drag to actually start.
			e.dataTransfer.setData('text/plain', String(idx));
		}
	}
	function onDragOver(e: DragEvent, idx: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverIdx = idx;
	}
	function onDragLeave() { dragOverIdx = null; }
	function onDrop(e: DragEvent, idx: number) {
		e.preventDefault();
		if (dragIdx === null || dragIdx === idx) { dragIdx = null; dragOverIdx = null; return; }
		const next = [...editLineItems];
		const [moved] = next.splice(dragIdx, 1);
		next.splice(idx, 0, moved);
		editLineItems = next;
		dragIdx = null;
		dragOverIdx = null;
	}
	function onDragEnd() { dragIdx = null; dragOverIdx = null; armedIdx = null; }

	let laborCents = $derived(editPersons * editHours * editRateCents);
	function serializeLineItems() {
		return editLineItems
			.filter((li) => {
				if (li.kind === 'labor') return true;
				if (li.kind === 'fahrt') return true;
				if (li.kind === 'insurance') return true;
				return li.quantity > 0;
			})
			.map((li) => {
				const description = li.kind === 'labor' ? `${editPersons} Umzugshelfer` : li.label;
				return {
					description,
					quantity: li.quantity,
					unit_price: li.unitPriceCents / 100,
					...(li.remark ? { remark: li.remark } : {}),
				};
			});
	}

	let nonLaborCents = $derived(
		editLineItems.reduce(
			(sum, li) => li.kind === 'labor' ? sum : sum + li.quantity * li.unitPriceCents,
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

	// Photo filter: click a photo to filter items table. Owned at page level because
	// handleKeydown (svelte:window) clears it on Escape; bound down into PhotoEstimationSection.
	let filterPhotoIndex = $state<number | null>(null);

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
			const fromServer: EditLineItem[] = lo.line_items.map((li) => {
				const normalized = normalizeFlatTotalItem(li);
				return mkLineItem(classifyKind(li.label), li.label, normalized.quantity, normalized.unit_price_cents, li.remark ?? "");
			});
			const seenLabels = new Set(fromServer.map((i) => i.label));
			const haveLabor = fromServer.some((i) => i.kind === 'labor');
			const haveInsurance = fromServer.some((i) => i.kind === 'insurance');
			const missing = POSITION_SKELETON
				.filter((p) => {
					if (p.kind === 'labor') return !haveLabor;
					if (p.kind === 'insurance') return !haveInsurance;
					return !seenLabels.has(p.label);
				})
				.map((p) => mkLineItem(p.kind, p.label, 0, p.defaultCents, p.defaultRemark));
			const missingInsurance = missing.find((i) => i.kind === 'insurance');
			const missingRest = missing.filter((i) => i.kind !== 'insurance');
			const merged = [...fromServer, ...missingRest];
			if (missingInsurance) merged.push(missingInsurance);
			editLineItems = merged;
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
			editEmployeeNotes = (data as any).employee_notes || "";
			editDate = data.scheduled_date || "";
			editHasPauschale = (data as any).has_pauschale || false;
			editStartTime = data.start_time ? data.start_time.slice(0, 5) : '';
			editEndTime = data.end_time ? data.end_time.slice(0, 5) : '';
			editHeadlineOverride = (data as any).custom_fields?.offer_headline_override ?? "";
			computePricingDefaults();
			// Email thread loads itself (EmailThreadSection $effect on inquiryId)

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
			// Volume, distance and services are locked once an offer exists
			...(!isLocked && {
				estimated_volume_m3: editVolume,
				distance_km: editDistance,
			}),
			notes: editNotes || null,
			employee_notes: editEmployeeNotes || null,
			scheduled_date: editDate || null,
			start_time: normalizeTimeInput(editStartTime) ?? undefined,
			end_time: normalizeTimeInput(editEndTime) ?? undefined,
			has_pauschale: editHasPauschale,
			custom_fields: {
				...((data as any).custom_fields ?? {}),
				offer_headline_override: editHeadlineOverride.trim() || null,
			},
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
					payload.line_items = serializeLineItems();
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
					payload.line_items = serializeLineItems();
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
		{ value: "info_requested", label: "Info angefragt" },
		{ value: "estimating", label: "Schätzung" },
		{ value: "estimated", label: "Geschätzt" },
		{ value: "offer_ready", label: "Angebot bereit" },
		{ value: "offer_sent", label: "Angebot gesendet" },
		{ value: "accepted", label: "Angenommen" },
		{ value: "rejected", label: "Abgelehnt" },
		{ value: "expired", label: "Abgelaufen" },
		{ value: "cancelled", label: "Storniert" },
		{ value: "scheduled", label: "Geplant" },
		{ value: "completed", label: "Erledigt" },
		{ value: "invoiced", label: "Fakturiert" },
		{ value: "paid", label: "Bezahlt" },
	];

	let changingStatus = $state(false);

	// Review request popup — opened after marking an inquiry as "Erledigt"; see ReviewRequestModal
	let showReviewPopup = $state(false);

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
			// After marking as completed, ask Alex whether to send a review request
			if (newStatus === 'completed') {
				showReviewPopup = true;
			}
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
	 * Reloads the inquiry data without full page reload.
	 *
	 * Called by: EmployeesSection (assign/remove), InvoicesSection (send/mark paid)
	 * Purpose: Refreshes data after employee assignment or invoice status changes.
	 */
	async function reloadInquiry() {
		if (!data) return;
		try {
			const res = await apiGet<InquiryResponse>(`/api/v1/inquiries/${data.id}`);
			data = res;
		} catch { /* keep existing data */ }
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
				{#if data.service_type}
					<span class="svc-badge" data-type={data.service_type}>{SERVICE_TYPE_LABELS[data.service_type] ?? data.service_type}</span>
				{/if}
				{#if data.submission_mode && data.submission_mode !== 'termin'}
					<span class="svc-badge svc-badge--mode">{data.submission_mode}</span>
				{/if}
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
			<CustomerSection
				inquiryId={data.id}
				inquiryStatus={data.status}
				customer={data.customer}
				recipient={data.recipient}
				billingAddress={data.billing_address}
				effectiveBillingAddress={data.effective_billing_address}
				bind:customerOpen={cardOpen.customer}
				bind:recipientOpen={cardOpen.recipient}
				bind:billingOpen={cardOpen.billing}
				onToggleCustomer={() => toggleCard('customer')}
				onToggleRecipient={() => toggleCard('recipient')}
				onToggleBilling={() => toggleCard('billing')}
				onSaved={loadInquiry}
			/>

			<!-- Addresses -->
			<AddressEditor
				originAddress={data.origin_address}
				destinationAddress={data.destination_address}
				stopAddress={data.stop_address}
				inquiryId={data.id}
				onSaved={loadInquiry}
			/>

			<DetailsSection
				bind:editVolume
				bind:editDistance
				bind:editDate
				bind:editStartTime
				bind:editEndTime
				bind:editNotes
				{isLocked}
				{saving}
				{routeCoordinates}
				customerMessage={data.customer_message}
				bind:detailsOpen={cardOpen.details}
				bind:routeOpen={cardOpen.route}
				bind:messageOpen={cardOpen.message}
				onToggleDetails={() => toggleCard('details')}
				onToggleRoute={() => toggleCard('route')}
				onToggleMessage={() => toggleCard('message')}
				onSave={saveInquiry}
			/>

			<PhotoEstimationSection
				inquiryId={data.id}
				estimations={data.estimations}
				estimation={data.estimation}
				items={data.items ?? []}
				bind:filterPhotoIndex
				bind:saveIfDirty={saveIfDirtyFn}
				bind:photosOpen={cardOpen.photos}
				bind:itemsOpen={cardOpen.items}
				onTogglePhotos={() => toggleCard('photos')}
				onToggleItems={() => toggleCard('items')}
				onUpdated={loadInquiry}
			/>

			<PricingSection
				bind:editBruttoCents
				bind:editPersons
				bind:editHours
				bind:editRateCents
				bind:rateText
				bind:rateEditing
				bind:editHeadlineOverride
				{editVolume}
				{laborProfit}
				{laborCents}
				{calculatedNettoCents}
				{calculatedBruttoCents}
				bind:editLineItems
				bind:dragIdx
				bind:dragOverIdx
				bind:armedIdx
				customLabelOptions={CUSTOM_LABEL_OPTIONS}
				inquiryId={data.id}
				customer={data.customer}
				offer={data.offer}
				{latestOffer}
				bind:pricingOpen={cardOpen.pricing}
				bind:positionsOpen={cardOpen.positions}
				bind:offerOpen={cardOpen.offer}
				onTogglePricing={() => toggleCard('pricing')}
				onTogglePositions={() => toggleCard('positions')}
				onToggleOffer={() => toggleCard('offer')}
				{onBruttoChange}
				{addLineItem}
				{removeLineItem}
				{addInsurance}
				{onCustomLabelChange}
				{armDrag}
				{disarmDrag}
				{onDragStart}
				{onDragOver}
				{onDragLeave}
				{onDrop}
				{onDragEnd}
				onHeadlineBlur={persistInquiry}
				{generateOffer}
				{reEstimateOffer}
			/>
		</div>
	{:else}
		<div class="loading" style="color: var(--dt-secondary)">
			<p>Anfrage konnte nicht geladen werden.</p>
			<p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--dt-on-surface-variant)">
				Bitte überprüfe die Browser-Konsole oder lade die Seite neu.
			</p>
		</div>
	{/if}
</div>

{#if data}
	<EmployeesSection
		inquiryId={data.id}
		status={data.status}
		scheduledDate={data.scheduled_date}
		isMultiDay={data.is_multi_day}
		employees={data.employees ?? []}
		bind:hasPauschale={editHasPauschale}
		bind:employeeNotes={editEmployeeNotes}
		bind:open={cardOpen.employees}
		onToggle={() => toggleCard('employees')}
		onFieldBlur={persistInquiry}
	/>
{/if}

{#if data}
	<AppointmentsSection
		inquiryId={data.id}
		scheduledDate={data.scheduled_date}
		appointments={data.appointments ?? []}
		bind:open={cardOpen.appointments}
		onToggle={() => toggleCard('appointments')}
		onSaved={loadInquiry}
	/>
{/if}

{#if data}
	<InvoicesSection
		inquiryId={data.id}
		status={data.status}
		offerNettoCents={data.offer?.total_netto_cents ?? null}
		bind:open={cardOpen.invoices}
		onToggle={() => toggleCard('invoices')}
		onStatusChange={reloadInquiry}
	/>
{/if}

{#if data}
	<EmailThreadSection inquiryId={data.id} />
{/if}

<svelte:window onkeydown={handleKeydown} />

{#if data}
	<ReviewRequestModal bind:open={showReviewPopup} inquiryId={data.id} />
{/if}

<style>
	.page {
		/* No height:100% — Mitarbeiter/Rechnungen/E-Mail sections render as
		   siblings of .page, so a fixed page height pushes them off-screen. */
		display: block;
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

	/* :global — the "card" chrome (background/toggle/chevron) is used by
	   every extracted _components/*.svelte section; Svelte's scoped CSS
	   wouldn't otherwise reach elements rendered by a child component. */
	:global(.card) {
		background: var(--dt-surface-container-lowest);
		border: none;
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	:global(.card.full-width) {
		grid-column: 1 / -1;
	}

	/* Mode badge variant */
	.svc-badge--mode {
		background: var(--dt-surface-container);
		color: var(--dt-on-surface-variant);
	}

	:global(.card h3) {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		letter-spacing: -0.01em;
		margin-bottom: 0.75rem;
	}

	:global(.card-header) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	:global(.card-header h3) {
		margin-bottom: 0;
	}

	:global(.card-header--toggleable) {
		gap: 0.75rem;
	}

	:global(.card--collapsed) {
		padding-bottom: 0.75rem;
	}

	:global(.card--collapsed .card-header),
	:global(.card--collapsed .card-header--toggleable) {
		margin-bottom: 0;
	}

	:global(.card-toggle) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		min-width: 0;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		text-align: left;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}

	:global(.card-toggle:hover h3) {
		color: var(--dt-primary);
	}

	:global(.card-toggle-chev) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 150ms ease;
		color: var(--dt-on-surface-variant);
		flex-shrink: 0;
	}

	:global(.card-toggle-chev.open) {
		transform: rotate(90deg);
	}

	/* Flatten nested card chrome when a child component already renders its own .card */
	:global(.card > .card),
	:global(.card > .route-map-card) {
		background: none;
		border: none;
		box-shadow: none;
		padding: 0;
		margin: 0;
		border-radius: 0;
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

	/* :global — this "field"/"form-grid" design pattern is shared by several
	   extracted _components/*.svelte children; Svelte's scoped CSS wouldn't
	   otherwise reach elements rendered by a child component. */
	:global(.form-grid) {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	:global(.field) {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	:global(.field.full-width) {
		grid-column: 1 / -1;
	}

	:global(.field label) {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
	}

	:global(.field input),
	:global(.field textarea),
	:global(.form-input) {
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
		box-sizing: border-box;
		min-width: 0;
	}

	:global(.field input:focus),
	:global(.field textarea:focus),
	:global(.form-input:focus) {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	/* :global — used by both this page (Pricing header actions) and InvoicesSection.svelte */
	:global(.btn-link) {
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

	:global(.btn-link:hover) {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		:global(.form-grid) {
			grid-template-columns: 1fr;
		}

		:global(.card) {
			max-width: 100%;
			overflow-x: auto;
		}

		:global(.btn) {
			min-height: 44px;
		}
		:global(.btn-sm) {
			min-height: 44px;
		}
		.header-actions {
			flex-wrap: wrap;
		}
	}
</style>
