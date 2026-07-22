<script lang="ts">
	import { API_BASE } from "$lib/utils/api.svelte";
	import { ChevronRight } from "lucide-svelte";
	import PhotoVideoUpload from "$lib/components/admin/PhotoVideoUpload.svelte";
	import EstimationItemsTable from "$lib/components/admin/EstimationItemsTable.svelte";

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

	let {
		inquiryId,
		estimations,
		estimation,
		items,
		filterPhotoIndex = $bindable(),
		saveIfDirty = $bindable(),
		photosOpen = $bindable(),
		itemsOpen = $bindable(),
		onTogglePhotos,
		onToggleItems,
		onUpdated,
	}: {
		inquiryId: string;
		estimations: EstimationSnapshot[] | undefined;
		estimation: EstimationSnapshot | null;
		items: ItemSnapshot[];
		filterPhotoIndex: number | null;
		saveIfDirty: (() => Promise<void>) | null;
		photosOpen: boolean;
		itemsOpen: boolean;
		onTogglePhotos: () => void;
		onToggleItems: () => void;
		onUpdated: () => void | Promise<void>;
	} = $props();

	// Bindable handle to EstimationItemsTable's photo-detail opener, shared with PhotoVideoUpload
	let openPhotoDetailFn = $state<((idx: number) => void) | null>(null);

	let estimationsList = $derived.by((): EstimationEntry[] => {
		// Prefer the full estimations array (all statuses: processing, failed, completed).
		// Fall back to the single completed estimation for backward compatibility.
		const ests = estimations;
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
		const est = estimation;
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
</script>

<!-- Photo/Video Upload & Gallery -->
<div class="card" class:card--collapsed={!photosOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onTogglePhotos} aria-expanded={photosOpen}>
			<span class="card-toggle-chev" class:open={photosOpen}><ChevronRight size={16} /></span>
			<h3>Foto- &amp; Videoanalyse</h3>
		</button>
	</div>
	{#if photosOpen}
		<PhotoVideoUpload
			{inquiryId}
			{estimationsList}
			{filterPhotoIndex}
			openPhotoDetail={openPhotoDetailFn}
			onTogglePhotoFilter={togglePhotoFilter}
			onFilterClear={() => { filterPhotoIndex = null; }}
			{onUpdated}
		/>
	{/if}
</div>

<!-- Estimation Items Table (Sections A / B / C) -->
<div class="card" class:card--collapsed={!itemsOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onToggleItems} aria-expanded={itemsOpen}>
			<span class="card-toggle-chev" class:open={itemsOpen}><ChevronRight size={16} /></span>
			<h3>Möbel und Gegenstände</h3>
		</button>
	</div>
	{#if itemsOpen}
		<EstimationItemsTable
			{inquiryId}
			items={items ?? []}
			{filterPhotoIndex}
			{galleryImages}
			bind:openPhotoDetail={openPhotoDetailFn}
			bind:saveIfDirty
			{onUpdated}
		/>
	{/if}
</div>
