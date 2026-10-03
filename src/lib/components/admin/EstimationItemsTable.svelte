<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { apiPut } from '$lib/utils/api.svelte';
	import { API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { sortItems, filterItemsByPhotoIndex } from '$lib/utils/sorting';
	import { computeTotalVolume } from '$lib/utils/volume';
	import { Save, X, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-svelte';

	// ---------------------------------------------------------------------------
	// Interfaces
	// ---------------------------------------------------------------------------

	/**
	 * A single detected estimation item as returned by GET /api/v1/inquiries/{id}.
	 * Mirrors the ItemSnapshot interface from the inquiry detail page.
	 */
	interface EstimationItem {
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

	/**
	 * Internal mutable copy of an EstimationItem with all optional fields resolved.
	 */
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

	// ---------------------------------------------------------------------------
	// Props
	// ---------------------------------------------------------------------------

	/**
	 * Component props.
	 *
	 * @prop inquiryId        - UUID of the inquiry whose items are being edited.
	 * @prop items            - Server-supplied items array (re-initialises on change).
	 * @prop filterPhotoIndex - When non-null, narrows sections B/C to items seen in that photo.
	 *                          Controlled by the parent's photo gallery section.
	 * @prop galleryImages    - Full-URL list of source photos used in the photo-detail popup.
	 * @prop openPhotoDetail  - Bindable setter: parent binds to this to imperatively open the
	 *                          photo-detail popup from a gallery thumbnail right-click.
	 * @prop saveIfDirty      - Bindable async function: parent binds to this to trigger a save
	 *                          when items are dirty before generating an offer.
	 * @prop onUpdated        - Called after a successful PUT /items save so the parent can
	 *                          reload inquiry data (which re-syncs volume_m3 from the server).
	 */
	let {
		inquiryId,
		items,
		filterPhotoIndex = null,
		galleryImages = [],
		openPhotoDetail = $bindable<((idx: number) => void) | null>(null),
		saveIfDirty = $bindable<(() => Promise<void>) | null>(null),
		onUpdated,
	}: {
		inquiryId: string;
		items: EstimationItem[];
		filterPhotoIndex?: number | null;
		galleryImages?: string[];
		openPhotoDetail?: ((idx: number) => void) | null;
		saveIfDirty?: (() => Promise<void>) | null;
		onUpdated: () => void;
	} = $props();

	// ---------------------------------------------------------------------------
	// Internal editable state — initialised from the `items` prop
	// ---------------------------------------------------------------------------

	/**
	 * Mutable copy of estimation items. Starts from the `items` prop and is mutated
	 * by inline edits. Saved via PUT /api/v1/inquiries/{id}/items.
	 */
	let editItems = $state<EditableItem[]>([]);

	/** True when editItems has unsaved local changes. */
	let itemsDirty = $state(false);

	/** True while the PUT /items request is in-flight. */
	let savingItems = $state(false);

	// ---------------------------------------------------------------------------
	// Sorting state (Section A only)
	// ---------------------------------------------------------------------------

	let sortKey = $state<'name' | 'quantity' | 'volume_m3' | null>(null);
	let sortAsc = $state(true);

	// ---------------------------------------------------------------------------
	// Section C collapse state
	// ---------------------------------------------------------------------------

	/** Controls whether the non-moveable items section is expanded. */
	let showNonMoveable = $state(false);

	// ---------------------------------------------------------------------------
	// Reviewer lightbox state
	// ---------------------------------------------------------------------------

	/** Index into sortedItems() of the item currently open in the reviewer, or null. */
	let reviewIndex = $state<number | null>(null);

	// ---------------------------------------------------------------------------
	// Photo detail popup state
	// ---------------------------------------------------------------------------

	/** Index into galleryImages of the photo currently open in the popup, or null. */
	let photoDetailIndex = $state<number | null>(null);

	/** Index into photoDetailItems() of the crop currently zoomed in the popup, or null. */
	let photoDetailZoomItem = $state<number | null>(null);

	// ---------------------------------------------------------------------------
	// Derived item slices
	// ---------------------------------------------------------------------------

	/** Items that should be transported and don't pack into boxes (Section A). */
	let mainItems = $derived(editItems.filter((i) => i.is_moveable && !i.packs_into_boxes));

	/** Items that pack into boxes (Section B). */
	let boxItems = $derived(editItems.filter((i) => i.is_moveable && i.packs_into_boxes));

	/** Items classified as non-moveable (Section C). */
	let nonMoveableItems = $derived(editItems.filter((i) => !i.is_moveable));

	/** Section B items narrowed by the active photo filter. */
	let filteredBoxItems = $derived(
		filterPhotoIndex !== null ? filterItemsByPhotoIndex(boxItems, filterPhotoIndex) : boxItems,
	);

	/** Section C items narrowed by the active photo filter. */
	let filteredNonMoveableItems = $derived(
		filterPhotoIndex !== null
			? filterItemsByPhotoIndex(nonMoveableItems, filterPhotoIndex)
			: nonMoveableItems,
	);

	/**
	 * Section A items filtered by the active photo index and then sorted.
	 *
	 * Called by: Template (Section A table rows, reviewer lightbox)
	 * Purpose: Provides the final display order respecting both the photo filter and
	 *          the user-chosen sort column.
	 */
	let sortedItems = $derived.by(() => {
		const filtered = filterItemsByPhotoIndex(mainItems, filterPhotoIndex);
		return sortItems(filtered, sortKey, sortAsc);
	});

	/**
	 * Live total cubic-metre volume of Section A (transportable, non-box) items.
	 *
	 * Called by: Template (Gesamt row in Section A footer), saveItems (synced to server)
	 * Purpose: Shows Alex the running total as items are edited before committing.
	 *
	 * Math: total = sum(item.volume_m3 * item.quantity) across mainItems
	 */
	let computedTotal = $derived(computeTotalVolume(mainItems));

	// ---------------------------------------------------------------------------
	// Initialise editItems from prop
	// ---------------------------------------------------------------------------

	/**
	 * Copies the incoming `items` prop into the mutable editItems state and resets dirty flag.
	 *
	 * Called by: $effect (whenever the `items` prop changes **and** there are no unsaved local edits)
	 * Purpose: Keeps the editable local copy in sync with fresh server data after the parent
	 *          calls onUpdated → loadInquiry and passes the new items back as a prop.
	 *          Guards against stomping manual additions by only running when `itemsDirty` is false.
	 *
	 * @param incoming - Raw EstimationItem array from the parent
	 * @returns void (side-effect: replaces editItems, resets itemsDirty)
	 */
	function initEditItems(incoming: EstimationItem[]) {
		editItems = incoming.map((item) => ({
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

	$effect(() => {
		if (!itemsDirty) {
			initEditItems(items);
		}
	});

	// ---------------------------------------------------------------------------
	// Expose imperative APIs to parent via $bindable props
	// ---------------------------------------------------------------------------

	$effect(() => {
		openPhotoDetail = (idx: number) => {
			photoDetailIndex = idx;
			photoDetailZoomItem = null;
		};
		saveIfDirty = async () => {
			if (itemsDirty) await saveItems();
		};
	});

	// ---------------------------------------------------------------------------
	// Sort helpers
	// ---------------------------------------------------------------------------

	/**
	 * Toggles the column sort key and direction for Section A.
	 *
	 * Called by: Template (onclick on column headers — Name, Menge, Volumen)
	 * Purpose: Allows the admin to sort the items list to spot duplicates, outliers,
	 *          or the highest-volume items quickly. Clicking the same column again reverses direction.
	 *
	 * @param key - The column to sort by: 'name', 'quantity', or 'volume_m3'
	 * @returns void (side-effect: updates sortKey and sortAsc)
	 */
	function toggleSort(key: 'name' | 'quantity' | 'volume_m3') {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = true;
		}
	}

	// ---------------------------------------------------------------------------
	// Item mutation helpers
	// ---------------------------------------------------------------------------

	/**
	 * Marks the items list as having unsaved changes, enabling the save button.
	 *
	 * Called by: Template (oninput / onchange on any editable field in the items tables)
	 * Purpose: Tracks whether the admin has made local edits that have not yet been persisted.
	 *
	 * @returns void (side-effect: sets itemsDirty = true)
	 */
	function markDirty() {
		itemsDirty = true;
	}

	/**
	 * Appends a new blank item row to the editable items list.
	 *
	 * Called by: Template (onclick on the "+" button at the bottom of Section A)
	 * Purpose: Lets the admin manually add a piece of furniture missed by the AI estimation.
	 *
	 * @returns void (side-effect: appends to editItems, sets itemsDirty = true)
	 */
	function addItem() {
		editItems = [
			...editItems,
			{
				name: '',
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
	 * Adds a new blank item linked to the currently shown photo in the photo-detail popup.
	 *
	 * Called by: Template (Hinzufügen button in photo-detail popup)
	 * Purpose: Lets the admin add an item missed by AI for a specific photo, pre-linking
	 *          the new item to that photo's index for cross-referencing.
	 *
	 * @returns void (side-effect: appends to editItems, sets itemsDirty = true)
	 */
	function addItemToPhoto() {
		if (photoDetailIndex === null) return;
		const idx = photoDetailIndex;
		editItems = [
			...editItems,
			{
				name: '',
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

	/**
	 * Removes a specific item from the editable items list by reference.
	 *
	 * Called by: reviewDelete (reviewer lightbox), Template (del-btn in each table row and photo-detail popup)
	 * Purpose: Lets the admin discard a falsely-detected or duplicate item.
	 *
	 * @param item - The EditableItem instance to remove (matched by reference)
	 * @returns void (side-effect: filters editItems, sets itemsDirty = true)
	 */
	function deleteItem(item: EditableItem) {
		editItems = editItems.filter((i) => i !== item);
		itemsDirty = true;
	}

	// ---------------------------------------------------------------------------
	// Save
	// ---------------------------------------------------------------------------

	/**
	 * Bulk-saves all editable estimation items to the API.
	 *
	 * Called by: Template (Speichern button in Section A footer and photo-detail save bar)
	 * Purpose: Persists admin corrections to item names, quantities, or volumes via
	 *          PUT /api/v1/inquiries/{id}/items with the full current items array.
	 *          On success, calls onUpdated() so the parent reloads the inquiry and
	 *          syncs volume_m3 (the backend recalculates the total on PUT /items).
	 *
	 * @returns void (side-effect: sets savingItems, clears itemsDirty, shows toast, calls onUpdated)
	 */
	async function saveItems() {
		savingItems = true;
		try {
			await apiPut(`/api/v1/inquiries/${inquiryId}/items`, {
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
			itemsDirty = false;
			showToast('Gegenstaende gespeichert', 'success');
			onUpdated();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			savingItems = false;
		}
	}

	// ---------------------------------------------------------------------------
	// Reviewer lightbox helpers
	// ---------------------------------------------------------------------------

	/**
	 * Opens the reviewer lightbox at the position of the clicked item in the sorted list.
	 *
	 * Called by: Template (onclick on crop thumbnail in Section A rows)
	 * Purpose: Launches the full-screen image review overlay for the admin to inspect
	 *          the source photo and bounding box for a detected item.
	 *
	 * @param item - The EditableItem that was clicked
	 * @returns void (side-effect: sets reviewIndex)
	 */
	function openReview(item: EditableItem) {
		const idx = sortedItems.indexOf(item);
		reviewIndex = idx >= 0 ? idx : 0;
	}

	/**
	 * Closes the reviewer lightbox.
	 *
	 * Called by: Template (close button, backdrop click), keyboard Escape
	 * Purpose: Returns the page to the normal items-table view.
	 *
	 * @returns void (side-effect: sets reviewIndex = null)
	 */
	function closeReview() {
		reviewIndex = null;
	}

	/**
	 * Moves the reviewer to the previous item in the sorted list.
	 *
	 * Called by: Template (left-chevron button in reviewer), keyboard ArrowLeft
	 * Purpose: Allows sequential review without closing the lightbox.
	 *
	 * @returns void (side-effect: decrements reviewIndex if not at index 0)
	 */
	function reviewPrev() {
		if (reviewIndex !== null && reviewIndex > 0) reviewIndex--;
	}

	/**
	 * Moves the reviewer to the next item in the sorted list.
	 *
	 * Called by: Template (right-chevron button in reviewer), keyboard ArrowRight
	 * Purpose: Allows sequential review without closing the lightbox.
	 *
	 * @returns void (side-effect: increments reviewIndex if not already at last item)
	 */
	function reviewNext() {
		if (reviewIndex !== null && reviewIndex < sortedItems.length - 1) reviewIndex++;
	}

	/**
	 * Deletes the currently reviewed item and adjusts the reviewer index to stay in bounds.
	 *
	 * Called by: Template (delete button inside reviewer lightbox)
	 * Purpose: Lets the admin discard a falsely-detected item without leaving the reviewer.
	 *          Automatically advances or closes the lightbox when the last item is deleted.
	 *
	 * @returns void (side-effect: calls deleteItem, then adjusts reviewIndex)
	 */
	function reviewDelete() {
		if (reviewIndex === null) return;
		const item = sortedItems[reviewIndex];
		deleteItem(item);
		const remaining = sortedItems;
		if (remaining.length === 0) {
			reviewIndex = null;
		} else if (reviewIndex >= remaining.length) {
			reviewIndex = remaining.length - 1;
		}
	}

	// ---------------------------------------------------------------------------
	// Photo detail popup helpers
	// ---------------------------------------------------------------------------

	/**
	 * Closes the photo detail popup.
	 *
	 * Called by: Template (close button, backdrop click), keyboard Escape
	 * Purpose: Dismisses the full-photo + items-side-panel popup.
	 *
	 * @returns void (side-effect: clears photoDetailIndex and photoDetailZoomItem)
	 */
	function closePhotoDetail() {
		photoDetailIndex = null;
		photoDetailZoomItem = null;
	}

	/**
	 * Navigates the photo detail popup to the previous gallery image.
	 *
	 * Called by: Template (prev button in photo detail popup), keyboard ArrowLeft
	 * Purpose: Allows sequential review of all photos without closing the popup.
	 *
	 * @returns void (side-effect: decrements photoDetailIndex, clears zoom)
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
	 * Called by: Template (next button in photo detail popup), keyboard ArrowRight
	 * Purpose: Allows sequential review of all photos without closing the popup.
	 *
	 * @returns void (side-effect: increments photoDetailIndex, clears zoom)
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
	 * Purpose: Filters editItems to only those seen in or primarily belonging to
	 *          the current photo so the admin can review and edit items per photo.
	 *
	 * @returns EditableItem[] matching items for the current photo
	 */
	function photoDetailItems(): EditableItem[] {
		if (photoDetailIndex === null) return [];
		const idx = photoDetailIndex;
		return editItems.filter(
			(item) =>
				item.bbox_image_index === idx || (item.seen_in_images?.includes(idx) ?? false),
		);
	}

	// ---------------------------------------------------------------------------
	// Keyboard shortcuts
	// ---------------------------------------------------------------------------

	/**
	 * Handles keyboard shortcuts for the reviewer lightbox and photo detail popup.
	 *
	 * Called by: svelte:window onkeydown
	 * Purpose: Escape closes the active overlay; ArrowLeft/Right navigate items or photos.
	 *          Keypresses inside input/textarea/select elements are ignored.
	 *
	 * @param e - The native KeyboardEvent
	 * @returns void
	 */
	function handleKeydown(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (reviewIndex !== null) {
			if (e.key === 'Escape') {
				closeReview();
				e.preventDefault();
			} else if (e.key === 'ArrowLeft') {
				reviewPrev();
				e.preventDefault();
			} else if (e.key === 'ArrowRight') {
				reviewNext();
				e.preventDefault();
			}
		} else if (photoDetailIndex !== null) {
			if (e.key === 'Escape') {
				closePhotoDetail();
				e.preventDefault();
			} else if (e.key === 'ArrowLeft') {
				photoDetailPrev();
				e.preventDefault();
			} else if (e.key === 'ArrowRight') {
				photoDetailNext();
				e.preventDefault();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Shared look for the inline editors in every table / card / dialog below. -->
{#snippet num(item: EditableItem, field: 'quantity' | 'volume_m3', cls = 'w-20')}
	<input
		type="number"
		class="num h-8 rounded-sm border border-line bg-transparent px-2 text-right text-[13px] outline-none hover:border-line-strong focus:border-fg {cls}"
		min={field === 'quantity' ? 1 : 0}
		step={field === 'quantity' ? 1 : 0.01}
		bind:value={item[field]}
		oninput={markDirty}
		aria-label={field === 'quantity' ? 'Anzahl' : 'Volumen (m³)'}
	/>
{/snippet}

{#snippet crop(item: EditableItem, size = 'size-11')}
	{#if item.crop_url}
		<button class="block shrink-0 overflow-hidden rounded-xs border border-line {size}" onclick={() => openReview(item)}>
			<img src={API_BASE + item.crop_url} alt={item.name} class="size-full object-cover" loading="lazy" />
		</button>
	{:else}
		<span class="flex shrink-0 items-center justify-center rounded-xs border border-dashed border-line text-faint {size}">—</span>
	{/if}
{/snippet}

<!--
	One table for all three sections. Desktop: hairline table; phones: stacked cards.
	`showVolume` is off for non-moveable items (they don't count towards the volume).
-->
{#snippet itemsTable(list: EditableItem[], showVolume: boolean, total: { label: string } | null, sortable: boolean)}
	<div class="hidden md:block">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-line">
					<th class="label-xs w-16 px-4 py-2 text-left font-normal text-faint">Foto</th>
					<th class="label-xs px-2 py-2 text-left font-normal text-faint">
						{#if sortable}
							<button class="label-xs hover:text-fg" onclick={() => toggleSort('name')}>
								Gegenstand {sortKey === 'name' ? (sortAsc ? '▲' : '▼') : ''}
							</button>
						{:else}Gegenstand{/if}
					</th>
					<th class="label-xs w-24 px-2 py-2 text-right font-normal text-faint">
						{#if sortable}
							<button class="label-xs hover:text-fg" onclick={() => toggleSort('quantity')}>
								Anzahl {sortKey === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
							</button>
						{:else}Anzahl{/if}
					</th>
					{#if showVolume}
						<th class="label-xs w-28 px-2 py-2 text-right font-normal text-faint">
							{#if sortable}
								<button class="label-xs hover:text-fg" onclick={() => toggleSort('volume_m3')}>
									m³ {sortKey === 'volume_m3' ? (sortAsc ? '▲' : '▼') : ''}
								</button>
							{:else}m³{/if}
						</th>
					{/if}
					<th class="label-xs w-20 px-2 py-2 text-right font-normal text-faint">Konfidenz</th>
					<th class="w-12 px-4 py-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each list as item, idx (idx)}
					<tr class="border-b border-line hover:bg-sunk/50">
						<td class="px-4 py-1.5">{@render crop(item)}</td>
						<td class="px-2 py-1.5">
							<input
								type="text"
								class="h-8 w-full rounded-sm border border-transparent bg-transparent px-2 text-sm outline-none hover:border-line focus:border-fg"
								bind:value={item.name}
								oninput={markDirty}
								aria-label="Gegenstand"
							/>
						</td>
						<td class="px-2 py-1.5 text-right">{@render num(item, 'quantity')}</td>
						{#if showVolume}<td class="px-2 py-1.5 text-right">{@render num(item, 'volume_m3', 'w-24')}</td>{/if}
						<td class="num px-2 py-1.5 text-right text-xs text-muted">{Math.round(item.confidence * 100)} %</td>
						<td class="px-4 py-1.5 text-right">
							<Button variant="ghost" size="icon-sm" onclick={() => deleteItem(item)} aria-label="Entfernen"><X size={14} /></Button>
						</td>
					</tr>
				{/each}
				{#if total}
					<tr class="font-semibold">
						<td class="px-4 py-2.5"></td>
						<td class="px-4 py-2.5">{total.label}</td>
						<td class="num px-4 py-2.5 text-right">{list.reduce((s, i) => s + i.quantity, 0)}</td>
						{#if showVolume}
							<td class="num px-4 py-2.5 text-right">{list.reduce((s, i) => s + i.volume_m3, 0).toFixed(2)} m³</td>
						{/if}
						<td></td><td></td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<div class="flex flex-col gap-2 p-3 md:hidden">
		{#each list as item, idx (idx)}
			<div class="flex flex-col gap-2 rounded-md border border-line p-2.5">
				<div class="flex items-center gap-2.5">
					{@render crop(item, 'size-12')}
					<input
						type="text"
						class="h-9 min-w-0 flex-1 rounded-sm border border-line bg-transparent px-2.5 text-sm outline-none focus:border-fg"
						bind:value={item.name}
						oninput={markDirty}
						placeholder="Bezeichnung"
						aria-label="Gegenstand"
					/>
					<Button variant="ghost" size="icon" onclick={() => deleteItem(item)} aria-label="Entfernen"><X size={16} /></Button>
				</div>
				<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
					<label class="flex items-center gap-2">Anzahl {@render num(item, 'quantity', 'w-16')}</label>
					{#if showVolume}<label class="flex items-center gap-2">m³ {@render num(item, 'volume_m3', 'w-20')}</label>{/if}
					<span class="num ml-auto">{Math.round(item.confidence * 100)} %</span>
				</div>
			</div>
		{/each}
		{#if total}
			<div class="num flex justify-between px-1 pt-1 text-sm font-semibold">
				<span>{total.label}</span>
				<span>{list.reduce((s, i) => s + i.quantity, 0)} Stück</span>
				{#if showVolume}<span>{list.reduce((s, i) => s + i.volume_m3, 0).toFixed(2)} m³</span>{/if}
			</div>
		{/if}
	</div>
{/snippet}

<!-- ── Section A: moveable items ───────────────────────────────────────── -->
<div class="flex items-center justify-between gap-3 px-4 py-3">
	<h4 class="text-sm font-medium">
		{#if filterPhotoIndex !== null}
			Gegenstände aus Foto {filterPhotoIndex + 1} <span class="num text-faint">({sortedItems.length})</span>
		{:else}
			Möbel & Gegenstände <span class="num text-faint">({mainItems.length})</span>
		{/if}
	</h4>
	<div class="flex gap-1.5">
		<Button size="sm" onclick={addItem}><Plus size={14} /> Gegenstand</Button>
		<Button size="sm" variant={itemsDirty ? 'accent' : 'outline'} onclick={saveItems} disabled={savingItems || !itemsDirty}>
			<Save size={14} />
			{savingItems ? 'Speichern …' : 'Speichern'}
		</Button>
	</div>
</div>
{#if mainItems.length > 0}
	<div class="border-t border-line">
		{@render itemsTable(sortedItems, true, filterPhotoIndex === null ? { label: 'Gesamt' } : null, true)}
	</div>
{:else}
	<p class="border-t border-line px-4 py-6 text-center text-sm text-muted">Noch keine Gegenstände erfasst.</p>
{/if}

<!-- ── Section B: box-packable items ───────────────────────────────────── -->
{#if filteredBoxItems.length > 0}
	<div class="border-t-4 border-sunk">
		<div class="flex flex-wrap items-center gap-2 px-4 py-3">
			<h4 class="text-sm font-medium">Kartons & Kleinteile <span class="num text-faint">({filteredBoxItems.length})</span></h4>
			<Badge tone="info">In Kartons verpackt</Badge>
		</div>
		<div class="border-t border-line">{@render itemsTable(filteredBoxItems, true, { label: 'Rohvolumen' }, false)}</div>
		<p class="px-4 pt-1 pb-3 text-xs text-muted">
			Das Rohvolumen dieser Kleinteile wird automatisch in Umzugskartons umgerechnet und im Gesamtvolumen berücksichtigt.
		</p>
	</div>
{/if}

<!-- ── Section C: non-moveable items ───────────────────────────────────── -->
{#if filteredNonMoveableItems.length > 0}
	<div class="border-t-4 border-sunk">
		<button
			class="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left"
			onclick={() => (showNonMoveable = !showNonMoveable)}
			aria-expanded={showNonMoveable}
		>
			<ChevronRight size={15} class="text-faint transition-transform {showNonMoveable ? 'rotate-90' : ''}" />
			<h4 class="text-sm font-medium">Nicht transportiert <span class="num text-faint">({filteredNonMoveableItems.length})</span></h4>
			<Badge>Vom Volumen ausgeschlossen</Badge>
		</button>
		{#if showNonMoveable}
			<div class="border-t border-line">{@render itemsTable(filteredNonMoveableItems, false, null, false)}</div>
			<p class="px-4 pt-1 pb-3 text-xs text-muted">
				Diese Gegenstände wurden als nicht transportierbar eingestuft (z. B. Heizkörper, Einbauten) und fließen nicht ins
				Umzugsvolumen ein. Bitte bei Bedarf korrigieren.
			</p>
		{/if}
	</div>
{/if}

<!-- ── Photo detail popup ──────────────────────────────────────────────── -->
{#if photoDetailIndex !== null}
	{@const pdItems = photoDetailItems()}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[620] flex items-stretch justify-center bg-black/70 sm:p-4"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) closePhotoDetail();
		}}
	>
		<div class="flex w-full max-w-6xl flex-col overflow-hidden border border-line bg-panel text-fg shadow-2xl sm:rounded-md">
			<div class="flex shrink-0 items-center gap-2 border-b border-line px-3 py-2">
				<Button size="icon-sm" onclick={photoDetailPrev} disabled={photoDetailIndex === 0} aria-label="Vorheriges Foto">
					<ChevronLeft size={16} />
				</Button>
				<h3 class="num text-sm font-semibold">Foto {photoDetailIndex + 1} / {galleryImages.length}</h3>
				<Button
					size="icon-sm"
					onclick={photoDetailNext}
					disabled={photoDetailIndex === galleryImages.length - 1}
					aria-label="Nächstes Foto"
				>
					<ChevronRight size={16} />
				</Button>
				<Button variant="ghost" size="icon" class="ml-auto" onclick={closePhotoDetail} aria-label="Schließen"><X size={18} /></Button>
			</div>

			<div class="flex min-h-0 flex-1 flex-col lg:flex-row">
				<div class="relative flex min-h-[40dvh] flex-1 items-center justify-center bg-black">
					{#if photoDetailZoomItem !== null && pdItems[photoDetailZoomItem]?.crop_url}
						<Button size="xs" class="absolute top-2 left-2 bg-panel" onclick={() => (photoDetailZoomItem = null)}>
							<ChevronLeft size={13} /> Foto
						</Button>
						<img
							src={API_BASE + pdItems[photoDetailZoomItem].crop_url}
							alt={pdItems[photoDetailZoomItem].name}
							class="max-h-full max-w-full object-contain"
						/>
					{:else}
						<img src={galleryImages[photoDetailIndex]} alt="Foto {photoDetailIndex + 1}" class="max-h-full max-w-full object-contain" />
					{/if}
				</div>

				<div class="flex max-h-[50dvh] w-full flex-col border-t border-line lg:max-h-none lg:w-96 lg:border-t-0 lg:border-l">
					<div class="flex items-center justify-between gap-2 px-3 py-2.5">
						<h4 class="text-sm font-medium"><span class="num">{pdItems.length}</span> Gegenstände</h4>
						<Button size="xs" onclick={addItemToPhoto}><Plus size={13} /> Hinzufügen</Button>
					</div>
					<div class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3">
						{#each pdItems as item, i (i)}
							<div class="flex items-start gap-2 rounded-sm border p-2 {photoDetailZoomItem === i ? 'border-accent' : 'border-line'}">
								<button
									class="size-12 shrink-0 overflow-hidden rounded-xs border border-line"
									onclick={() => (photoDetailZoomItem = photoDetailZoomItem === i ? null : i)}
									title={item.crop_url ? 'Vergrößern' : 'Kein Foto'}
								>
									{#if item.crop_url}
										<img src={API_BASE + item.crop_url} alt={item.name} class="size-full object-cover" />
									{:else}
										<span class="flex size-full items-center justify-center text-faint">—</span>
									{/if}
								</button>
								<div class="flex min-w-0 flex-1 flex-col gap-1.5">
									<input
										type="text"
										class="h-8 w-full rounded-sm border border-line bg-transparent px-2 text-[13px] outline-none focus:border-fg"
										bind:value={item.name}
										oninput={markDirty}
										placeholder="Bezeichnung"
										aria-label="Gegenstand"
									/>
									<div class="flex items-center gap-2 text-xs text-muted">
										{@render num(item, 'volume_m3', 'w-20')} m³
										<label class="ml-auto flex items-center gap-1.5">
											<input type="checkbox" class="accent-[var(--accent)]" bind:checked={item.is_moveable} onchange={markDirty} />
											Mobil
										</label>
									</div>
								</div>
								<Button variant="ghost" size="icon-sm" onclick={() => deleteItem(item)} aria-label="Entfernen"><X size={14} /></Button>
							</div>
						{/each}
						{#if pdItems.length === 0}
							<p class="py-6 text-center text-sm text-muted">Keine Gegenstände für dieses Foto erkannt.</p>
						{/if}
					</div>
					{#if itemsDirty}
						<div class="border-t border-line p-3">
							<Button variant="accent" class="w-full" onclick={saveItems} disabled={savingItems}>
								<Save size={14} />
								{savingItems ? 'Speichern …' : 'Speichern'}
							</Button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ── Reviewer lightbox ────────────────────────────────────────────────── -->
{#if reviewIndex !== null}
	{@const rItem = sortedItems[reviewIndex]}
	{#if rItem}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-[620] flex items-center justify-center bg-black/85 p-4"
			role="presentation"
			onclick={(e) => {
				if (e.target === e.currentTarget) closeReview();
			}}
		>
			<button
				class="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
				onclick={closeReview}
				aria-label="Schließen"
			>
				<X size={24} />
			</button>
			{#if reviewIndex > 0}
				<button
					class="absolute top-1/2 left-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
					onclick={reviewPrev}
					aria-label="Vorheriger Gegenstand"
				>
					<ChevronLeft size={32} />
				</button>
			{/if}
			{#if reviewIndex < sortedItems.length - 1}
				<button
					class="absolute top-1/2 right-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
					onclick={reviewNext}
					aria-label="Nächster Gegenstand"
				>
					<ChevronRight size={32} />
				</button>
			{/if}

			<div class="flex w-full max-w-lg flex-col overflow-hidden rounded-md border border-line bg-panel text-fg">
				<div class="flex aspect-[4/3] items-center justify-center bg-black">
					{#key reviewIndex}
						{#if rItem.crop_url}
							<img src={API_BASE + rItem.crop_url} alt={rItem.name} class="max-h-full max-w-full object-contain" />
						{:else}
							<span class="text-sm text-white/60">Kein Foto</span>
						{/if}
					{/key}
				</div>
				<div class="flex flex-col gap-3 p-4">
					<label class="flex flex-col gap-1.5 text-xs font-medium text-muted" for="review-item-name">
						Gegenstand
						<input
							id="review-item-name"
							type="text"
							bind:value={rItem.name}
							oninput={markDirty}
							class="h-9 rounded-sm border border-line-strong bg-panel px-3 text-sm font-normal text-fg outline-none focus:border-fg"
						/>
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label class="flex flex-col gap-1.5 text-xs font-medium text-muted" for="review-volume">
							Volumen (m³)
							<input
								id="review-volume"
								type="number"
								min="0"
								step="0.01"
								bind:value={rItem.volume_m3}
								oninput={markDirty}
								class="num h-9 rounded-sm border border-line-strong bg-panel px-3 text-sm font-normal text-fg outline-none focus:border-fg"
							/>
						</label>
						<label class="flex flex-col gap-1.5 text-xs font-medium text-muted" for="review-quantity">
							Anzahl
							<input
								id="review-quantity"
								type="number"
								min="1"
								step="1"
								bind:value={rItem.quantity}
								oninput={markDirty}
								class="num h-9 rounded-sm border border-line-strong bg-panel px-3 text-sm font-normal text-fg outline-none focus:border-fg"
							/>
						</label>
					</div>
					<div class="flex items-center justify-between gap-2">
						<Button size="sm" variant="danger" onclick={reviewDelete}><Trash2 size={14} /> Entfernen</Button>
						<span class="num text-xs text-faint">{reviewIndex + 1} / {sortedItems.length}</span>
						<Button
							size="sm"
							onclick={() => {
								addItem();
								reviewIndex = sortedItems.length - 1;
							}}><Plus size={14} /> Neu</Button
						>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}
