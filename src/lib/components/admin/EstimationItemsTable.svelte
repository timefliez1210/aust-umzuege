<script lang="ts">
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
	 * Called by: $effect (whenever the `items` prop changes, i.e. after a server reload)
	 * Purpose: Keeps the editable local copy in sync with fresh server data after the parent
	 *          calls onUpdated → loadInquiry and passes the new items back as a prop.
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
		initEditItems(items);
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

<!-- ── Section A: Main moveable items ──────────────────────────────────── -->
<div class="card full-width">
	<div class="card-header">
		<h3>
			{#if filterPhotoIndex !== null}
				Gegenstaende aus Foto {filterPhotoIndex + 1} ({sortedItems.length})
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
					{#each sortedItems as item}
						<tr>
							<td class="crop-cell">
								{#if item.crop_url}
									<button class="crop-btn" onclick={() => openReview(item)}>
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
								<button class="del-btn" onclick={() => deleteItem(item)} title="Entfernen">
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
			{savingItems ? 'Speichern...' : 'Speichern'}
		</button>
	</div>
</div>

<!-- ── Section B: Box-packable items ───────────────────────────────────── -->
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
									<button class="crop-btn" onclick={() => openReview(item)}>
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
								<button class="del-btn" onclick={() => deleteItem(item)} title="Entfernen">
									<X size={14} />
								</button>
							</td>
						</tr>
					{/each}
					<tr class="total-row">
						<td></td>
						<td>Rohvolumen</td>
						<td>{filteredBoxItems.reduce((s, i) => s + i.quantity, 0)}</td>
						<td
							>{filteredBoxItems
								.reduce((s, i) => s + i.volume_m3, 0)
								.toFixed(2)} m&#x00B3;</td
						>
						<td></td>
						<td></td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="section-note">
			Das Rohvolumen dieser Kleinteile wird automatisch in Umzugskartons umgerechnet und im
			Gesamtvolumen ber&#x00FC;cksichtigt.
		</p>
	</div>
{/if}

<!-- ── Section C: Non-moveable items ───────────────────────────────────── -->
{#if filteredNonMoveableItems.length > 0}
	<div class="card full-width items-section-nonmoveable">
		<div class="card-header">
			<button
				class="section-toggle"
				onclick={() => (showNonMoveable = !showNonMoveable)}
			>
				<h3>Nicht transportiert ({filteredNonMoveableItems.length})</h3>
				<span class="section-badge badge-nonmoveable">Vom Volumen ausgeschlossen</span>
				<span class="toggle-arrow">{showNonMoveable ? '\u25B2' : '\u25BC'}</span>
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
										<button class="crop-btn" onclick={() => openReview(item)}>
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
									<button class="del-btn" onclick={() => deleteItem(item)} title="Entfernen">
										<X size={14} />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="section-note">
				Diese Gegenst&#x00E4;nde wurden als nicht transportierbar eingestuft (z.&nbsp;B.
				Heizk&#x00F6;rper, Einbauten) und flie&#x00DF;en nicht ins Umzugsvolumen ein. Bitte bei
				Bedarf korrigieren.
			</p>
		{/if}
	</div>
{/if}

<!-- ── Photo detail popup ──────────────────────────────────────────────── -->
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
				<button class="review-close" onclick={closePhotoDetail} aria-label="Schliessen">
					<X size={20} />
				</button>
			</div>

			<!-- Body: large image + items panel -->
			<div class="photo-detail-body">
				<!-- Main area: full photo or zoomed crop -->
				<div class="photo-detail-main">
					{#if photoDetailZoomItem !== null && pdItems[photoDetailZoomItem]?.crop_url}
						<div class="photo-detail-zoom-back">
							<button class="btn btn-sm" onclick={() => (photoDetailZoomItem = null)}>
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
										(photoDetailZoomItem = photoDetailZoomItem === i ? null : i)}
									title={item.crop_url ? 'Vergr&ouml;&szlig;ern' : 'Kein Foto'}
								>
									{#if item.crop_url}
										<img src={API_BASE + item.crop_url} alt={item.name} class="pdi-thumb" />
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
								<button class="del-btn" onclick={() => deleteItem(item)} title="Entfernen">
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
							<button class="btn btn-primary" onclick={saveItems} disabled={savingItems}>
								<Save size={14} />
								{savingItems ? 'Speichern...' : 'Speichern'}
							</button>
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
			class="review-backdrop"
			role="presentation"
			onclick={(e) => {
				if (e.target === e.currentTarget) closeReview();
			}}
		>
			<button class="review-close" onclick={closeReview} aria-label="Schliessen">
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

			{#if reviewIndex < sortedItems.length - 1}
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
						<button class="review-btn review-btn-delete" onclick={reviewDelete}>
							<Trash2 size={14} />
							Entfernen
						</button>
						<span class="review-counter">{reviewIndex + 1} / {sortedItems.length}</span>
						<button
							class="review-btn review-btn-add"
							onclick={() => {
								addItem();
								reviewIndex = sortedItems.length - 1;
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
	/* ── Items table ────────────────────────────────────────────────────── */

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

	/* ── Section B — box items ──────────────────────────────────────────── */

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

	/* ── Section C — non-moveable items ────────────────────────────────── */

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

	/* ── Column header styles ───────────────────────────────────────────── */

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

	/* ── Crop thumbnail cell ────────────────────────────────────────────── */

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

	/* ── Inline edit inputs ─────────────────────────────────────────────── */

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

	/* ── Dirty state indicator for save button ──────────────────────────── */

	.btn-dirty {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container)) !important;
		color: var(--dt-on-primary) !important;
		border-color: transparent !important;
	}

	/* ── Card shell (used for the three section cards) ──────────────────── */

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

	/* ── Button styles (scoped copy of page-level styles) ───────────────── */

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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	/* ── Reviewer lightbox ──────────────────────────────────────────────── */

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

	/* ── Photo detail popup ─────────────────────────────────────────────── */

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

	.pdi-check input[type='checkbox'] {
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

		.btn {
			min-height: 44px;
		}

		.btn-sm {
			min-height: 44px;
		}
	}
</style>
