<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { Loader } from 'lucide-svelte';
	import { apiFetch, apiDelete, API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import { Trash2, X, Download, Upload, Plus, RefreshCw } from 'lucide-svelte';

	// ---------------------------------------------------------------------------
	// Interfaces
	// ---------------------------------------------------------------------------

	/**
	 * Normalised view of one estimation as needed by the gallery/upload UI.
	 * Mirrors EstimationEntry from the inquiry detail page.
	 */
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

	// ---------------------------------------------------------------------------
	// Props
	// ---------------------------------------------------------------------------

	/**
	 * Component props.
	 *
	 * @prop inquiryId          - UUID of the inquiry to upload estimations for.
	 * @prop estimationsList    - Flat list of estimation entries from the parent (derived from inquiry data).
	 * @prop filterPhotoIndex   - Currently selected photo index for cross-filter; null = show all.
	 * @prop openPhotoDetail    - Callback bound from EstimationItemsTable to open the photo-detail popup.
	 * @prop onTogglePhotoFilter - Called when the user clicks a photo thumbnail to toggle the filter.
	 * @prop onFilterClear      - Called when the user clicks "Filter aufheben".
	 * @prop onUpdated          - Called after a successful delete or upload so the parent can reload.
	 */
	const {
		inquiryId,
		estimationsList = [],
		filterPhotoIndex = null,
		openPhotoDetail = null,
		onTogglePhotoFilter,
		onFilterClear,
		onUpdated,
	}: {
		inquiryId: string;
		estimationsList: EstimationEntry[];
		filterPhotoIndex: number | null;
		openPhotoDetail: ((idx: number) => void) | null;
		onTogglePhotoFilter: (idx: number) => void;
		onFilterClear: () => void;
		onUpdated: () => void;
	} = $props();

	// ---------------------------------------------------------------------------
	// Derived gallery data
	// ---------------------------------------------------------------------------

	/**
	 * Flat list of {url, estimationId} pairs for all source photos across all estimations.
	 * Used to render the photo gallery grid and to resolve which estimation to delete on X click.
	 */
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

	/** Full-URL photo list — index matches filterPhotoIndex from the parent. */
	let galleryImages = $derived(galleryEntries.map((e) => e.url));

	/** Estimations with an attached video. */
	let videoEntries = $derived(
		estimationsList
			.filter((e) => e.source_video_url)
			.map((e) => ({
				url: API_BASE + e.source_video_url!,
				estimationId: e.id,
			})),
	);

	/** Estimations still being processed by the ML pipeline. */
	let processingEstimations = $derived(
		estimationsList.filter((e) => e.status === 'processing'),
	);

	/** Estimations whose ML pipeline run failed. */
	let failedEstimations = $derived(
		estimationsList.filter((e) => e.status === 'failed'),
	);

	// ---------------------------------------------------------------------------
	// Upload state
	// ---------------------------------------------------------------------------

	let photoUploading = $state(false);
	let photoProgress = $state('');
	let photoQueue = $state<File[]>([]);

	let videoUploading = $state(false);
	let videoProgress = $state('');
	let videoQueue = $state<File[]>([]);

	let downloadingMedia = $state(false);
	let retryingId = $state<string | null>(null);

	// ---------------------------------------------------------------------------
	// Delete confirmation state
	// ---------------------------------------------------------------------------

	let pendingDeleteId = $state<string | null>(null);
	let showDeleteDialog = $state(false);

	// ---------------------------------------------------------------------------
	// Functions
	// ---------------------------------------------------------------------------

	/**
	 * Opens the delete confirmation dialog for a given estimation.
	 *
	 * Called by: Template (X button on photo thumbnails, Löschen button on video items,
	 *            Entfernen button on failed estimation rows)
	 * Purpose: Surfaces a ConfirmationDialog instead of native confirm() to confirm removal
	 *          before calling the DELETE API.
	 *
	 * @param estimationId - UUID of the estimation to delete
	 */
	function confirmDeleteEstimation(estimationId: string) {
		pendingDeleteId = estimationId;
		showDeleteDialog = true;
	}

	/**
	 * Deletes the pending estimation after the user confirmed in the dialog.
	 *
	 * Called by: ConfirmationDialog onConfirm
	 * Purpose: Calls DELETE /api/v1/estimates/{id}, then triggers parent reload via onUpdated.
	 */
	async function deleteEstimation() {
		if (!pendingDeleteId) return;
		try {
			await apiDelete(`/api/v1/estimates/${pendingDeleteId}`);
			showToast('Analyse gelöscht', 'success');
			onUpdated();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			pendingDeleteId = null;
			showDeleteDialog = false;
		}
	}

	/**
	 * Retries a failed estimation by calling the backend retry endpoint.
	 *
	 * Called by: Template ("Wiederholen" button on failed estimation rows)
	 * Purpose: Re-downloads the original images/video from S3 and respawns the Modal
	 *          pipeline without requiring the admin to re-upload from the browser.
	 *
	 * @param estimationId - UUID of the failed estimation to retry
	 */
	async function retryEstimation(estimationId: string) {
		retryingId = estimationId;
		try {
			const resp = await apiFetch<{
				estimation_id: string;
				status: string;
				message: string;
			}>(
				`/api/v1/inquiries/${inquiryId}/estimations/${estimationId}/retry`,
				{ method: 'POST' },
			);
			showToast(resp.message, 'success');
			onUpdated();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			retryingId = null;
		}
	}

	/**
	 * Downloads all source photos and videos for the inquiry as a single ZIP archive via the browser.
	 *
	 * Called by: Template (onclick on "Alle Medien herunterladen" button in the photos card)
	 * Purpose: Provides the admin with an offline copy of all customer-supplied media in one action,
	 *          useful for sharing with the moving crew or archiving. Uses JSZip (dynamically imported)
	 *          to bundle files fetched from the public image proxy without requiring a server-side ZIP endpoint.
	 *
	 * @returns void (side-effect: triggers browser download of `medien_{inquiryId}.zip`)
	 */
	async function downloadAllMedia() {
		downloadingMedia = true;
		try {
			const JSZip = (await import('jszip')).default;
			const zip = new JSZip();

			const images = estimationsList.flatMap((e) => e.source_image_urls);
			const videos = estimationsList
				.filter((e) => e.source_video_url)
				.map((e) => e.source_video_url!);

			if (images.length === 0 && videos.length === 0) {
				showToast('Keine Medien zum Herunterladen vorhanden', 'error');
				return;
			}

			const imgFolder = zip.folder('fotos');
			const vidFolder = zip.folder('videos');

			const imgPromises = images.map(async (url: string, i: number) => {
				const res = await fetch(API_BASE + url);
				const blob = await res.blob();
				const ext = blob.type.includes('png')
					? 'png'
					: blob.type.includes('webp')
						? 'webp'
						: 'jpg';
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
			const shortId = inquiryId.slice(0, 8);
			const link = document.createElement('a');
			link.href = URL.createObjectURL(content);
			link.download = `medien_${shortId}.zip`;
			link.click();
			URL.revokeObjectURL(link.href);

			showToast(
				`${images.length} Fotos und ${videos.length} Videos heruntergeladen`,
				'success',
			);
		} catch (e) {
			showToast('Download fehlgeschlagen: ' + (e as Error).message, 'error');
		} finally {
			downloadingMedia = false;
		}
	}

	/**
	 * Polls the estimation status endpoint at 5-second intervals until all estimations finish or time out.
	 *
	 * Called by: uploadPhotos (after photo upload), uploadVideos (after video upload)
	 * Purpose: AI estimation runs asynchronously on the server. This loop keeps the UI informed of
	 *          progress and reloads the inquiry once all submitted estimations finish (or fail).
	 *          Polls GET /api/v1/estimates/{id} for each pending estimation ID.
	 *          Times out after 120 attempts (10 minutes at 5-second intervals).
	 *
	 * @param estimationIds - Array of estimation UUIDs returned from the upload response that are still processing
	 * @param mode - 'photo' or 'video' — controls which progress state and toast labels are used
	 */
	async function pollEstimations(estimationIds: string[], mode: 'photo' | 'video') {
		const maxAttempts = 120; // 10 min at 5s intervals
		const pending = new Set(estimationIds);
		let completed = 0;
		let failed = 0;
		const total = estimationIds.length;
		const label = mode === 'photo' ? 'Foto' : 'Video';
		const unit = mode === 'photo' ? 'Fotos' : 'Videos';

		for (let i = 0; i < maxAttempts && pending.size > 0; i++) {
			await new Promise((r) => setTimeout(r, 5000));
			for (const id of [...pending]) {
				try {
					const est = await apiFetch<{ id: string; status: string }>(
						`/api/v1/estimates/${id}`,
					);
					if (est.status === 'completed') {
						pending.delete(id);
						completed++;
					} else if (est.status === 'failed') {
						pending.delete(id);
						failed++;
					}
				} catch {
					// Network error during poll — keep trying
				}
			}
			if (pending.size > 0) {
				const progressText = `${completed + failed}/${total} ${unit} analysiert...`;
				if (mode === 'photo') {
					photoProgress = progressText;
				} else {
					videoProgress = progressText;
				}
			}
		}

		if (failed > 0 && completed === 0) {
			showToast(`${label}-Analyse fehlgeschlagen`, 'error');
		} else if (failed > 0) {
			showToast(
				`${completed}/${total} ${unit} analysiert, ${failed} fehlgeschlagen`,
				'error',
			);
		} else if (pending.size > 0) {
			showToast(`${label}-Analyse Timeout`, 'error');
		} else {
			showToast(`${label}-Analyse abgeschlossen`, 'success');
		}
		onUpdated();
	}

	/**
	 * Resizes and JPEG-compresses a single image file using an offscreen canvas.
	 *
	 * Called by: uploadPhotos (for every file in photoQueue before FormData assembly)
	 * Why: Phone photos are typically 3–10 MB each. Resizing to max 1600 px at 82 %
	 *      JPEG quality reduces a typical 5 MB photo to ~300 KB (15×) with no visible
	 *      loss for ML estimation purposes.
	 *
	 *      HEIC/HEIF (iPhone) cannot be decoded by the browser Canvas API on desktop —
	 *      those fall back to the original file. Batching (15/request) ensures even
	 *      15 × 6 MB uncompressed HEIC files stay under Cloudflare's 100 MB limit.
	 *
	 * @param file    - Raw File from the file picker
	 * @returns       Compressed JPEG File, or the original File if canvas cannot decode it
	 */
	async function compressImage(file: File): Promise<File> {
		const MAX_DIM = 1600;
		const QUALITY = 0.82;
		return new Promise((resolve) => {
			const img = new Image();
			const url = URL.createObjectURL(file);
			img.onload = () => {
				URL.revokeObjectURL(url);
				const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
				const canvas = document.createElement('canvas');
				canvas.width = Math.round(img.width * scale);
				canvas.height = Math.round(img.height * scale);
				canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
				canvas.toBlob(
					(blob) => {
						if (!blob) { resolve(file); return; }
						resolve(new File(
							[blob],
							file.name.replace(/\.[^.]+$/, '.jpg'),
							{ type: 'image/jpeg', lastModified: file.lastModified },
						));
					},
					'image/jpeg',
					QUALITY,
				);
			};
			img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
			img.src = url;
		});
	}

	/**
	 * Compresses and uploads all queued photos in batches, then polls for results.
	 *
	 * Called by: Template (onclick on "Hochladen" button in the Foto-Analyse card)
	 * Purpose: Compresses each image client-side (max 1600 px / JPEG 82 %), then splits
	 *          into batches of BATCH_SIZE before POSTing to
	 *          POST /api/v1/inquiries/{id}/estimate/depth.
	 *
	 *          Batching is required because Cloudflare Tunnel enforces a ~100 MB per-request
	 *          limit. HEIC photos (iPhone) cannot be decoded by Canvas and fall back to their
	 *          original size (4–6 MB each), so 20+ uncompressed photos can exceed the cap.
	 *          At BATCH_SIZE=15, worst-case is 15 × 6 MB = 90 MB — safely under the limit.
	 *
	 * @returns void (side-effect: clears photoQueue, shows toast, calls onUpdated on completion)
	 */
	async function uploadPhotos() {
		if (photoQueue.length === 0) return;

		photoUploading = true;
		const count = photoQueue.length;
		const BATCH_SIZE = 15;

		try {
			// 1. Compress all images (HEIC fallback: returns original file unchanged)
			const compressed: File[] = [];
			for (let i = 0; i < photoQueue.length; i++) {
				photoProgress = `Komprimiere ${i + 1}/${count}...`;
				compressed.push(await compressImage(photoQueue[i]));
			}

			// 2. Split into batches and POST each one sequentially
			const allProcessingIds: string[] = [];
			const batches: File[][] = [];
			for (let i = 0; i < compressed.length; i += BATCH_SIZE) {
				batches.push(compressed.slice(i, i + BATCH_SIZE));
			}

			for (let b = 0; b < batches.length; b++) {
				photoProgress = batches.length > 1
					? `Hochladen ${b + 1}/${batches.length}...`
					: `${count} Foto${count > 1 ? 's' : ''} wird hochgeladen...`;

				const formData = new FormData();
				for (const file of batches[b]) {
					formData.append('images', file);
				}

				const results = await apiFetch<{ id: string; status: string }[]>(
					`/api/v1/inquiries/${inquiryId}/estimate/depth`,
					{ method: 'POST', body: formData },
				);

				for (const r of results) {
					if (r.status === 'processing') allProcessingIds.push(r.id);
				}
			}

			photoQueue = [];
			showToast(
				`${count} Foto${count > 1 ? 's' : ''} hochgeladen — Analyse läuft`,
				'success',
			);

			if (allProcessingIds.length > 0) {
				await pollEstimations(allProcessingIds, 'photo');
			} else {
				onUpdated();
			}
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			photoUploading = false;
			photoProgress = '';
		}
	}

	/**
	 * Uploads all queued videos to the video estimation endpoint and polls for results.
	 *
	 * Called by: Template (onclick on "Hochladen" button in the Video-Analyse card)
	 * Purpose: Sends queued videos to the AI volume estimation pipeline via
	 *          POST /api/v1/inquiries/{id}/estimate/video (multipart FormData with video fields).
	 *          After upload, polls for completion via pollEstimations.
	 *
	 * @returns void (side-effect: clears videoQueue, shows toast, calls onUpdated on completion)
	 */
	async function uploadVideos() {
		if (videoQueue.length === 0) return;

		videoUploading = true;
		const count = videoQueue.length;
		videoProgress = `${count} Video${count > 1 ? 's' : ''} wird hochgeladen...`;

		try {
			const formData = new FormData();
			for (const file of videoQueue) {
				formData.append('video', file);
			}

			const results = await apiFetch<{ id: string; status: string }[]>(
				`/api/v1/inquiries/${inquiryId}/estimate/video`,
				{
					method: 'POST',
					body: formData,
				},
			);

			videoQueue = [];
			showToast(
				`${count} Video${count > 1 ? 's' : ''} hochgeladen — Analyse läuft`,
				'success',
			);

			const processingIds = results
				.filter((r) => r.status === 'processing')
				.map((r) => r.id);
			if (processingIds.length > 0) {
				await pollEstimations(processingIds, 'video');
			} else {
				onUpdated();
			}
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			videoUploading = false;
			videoProgress = '';
		}
	}
</script>

<div class="flex flex-col gap-5">
	{#if processingEstimations.length > 0 || failedEstimations.length > 0}
		<div class="flex flex-col divide-y divide-line rounded-sm border border-line">
			{#each processingEstimations as est (est.id)}
				<div class="flex items-center gap-2.5 px-3 py-2.5 text-sm text-muted">
					<Loader size={15} class="animate-spin" />
					{est.method === 'video' ? 'Video' : 'Foto'}-Analyse wird verarbeitet …
				</div>
			{/each}
			{#each failedEstimations as est (est.id)}
				<div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
					<span class="text-danger">{est.method === 'video' ? 'Video' : 'Foto'}-Analyse fehlgeschlagen</span>
					<span class="flex gap-1.5">
						<Button size="xs" disabled={retryingId === est.id} onclick={() => retryEstimation(est.id)}>
							{#if retryingId === est.id}<Loader size={13} class="animate-spin" /> Wird wiederholt …{:else}<RefreshCw
									size={13}
								/> Wiederholen{/if}
						</Button>
						<Button size="xs" variant="danger" onclick={() => confirmDeleteEstimation(est.id)}><Trash2 size={13} /> Entfernen</Button>
					</span>
				</div>
			{/each}
		</div>
	{/if}

	{#if galleryImages.length > 0}
		<div class="flex flex-col gap-2.5">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<h4 class="label-xs text-faint">Fotos <span class="num">({galleryImages.length})</span></h4>
				<span class="flex flex-wrap gap-1.5">
					{#if filterPhotoIndex !== null}
						<Button size="xs" onclick={onFilterClear}><X size={13} /> Filter aufheben</Button>
					{/if}
					{#if galleryEntries.length > 0 || videoEntries.length > 0}
						<Button size="xs" variant="ghost" onclick={downloadAllMedia} disabled={downloadingMedia}>
							{#if downloadingMedia}ZIP wird erstellt …{:else}<Download size={13} /> Alle Medien{/if}
						</Button>
					{/if}
				</span>
			</div>
			<div class="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
				{#each galleryImages as url, idx (idx)}
					<div class="group relative aspect-square">
						<button
							class="block size-full overflow-hidden rounded-sm border-2 {filterPhotoIndex === idx
								? 'border-accent'
								: 'border-transparent hover:border-line-strong'}"
							onclick={() => onTogglePhotoFilter(idx)}
							oncontextmenu={(e) => {
								e.preventDefault();
								openPhotoDetail?.(idx);
							}}
							title="Linksklick: Filter | Rechtsklick: Details"
						>
							<img src={url} alt="Foto {idx + 1}" class="size-full object-cover" loading="lazy" />
						</button>
						<button
							class="absolute top-1 right-1 hidden size-6 items-center justify-center rounded-full bg-black/70 text-white group-hover:flex focus:flex"
							onclick={() => confirmDeleteEstimation(galleryEntries[idx].estimationId)}
							title="Analyse löschen"
							aria-label="Analyse löschen"
						>
							<X size={12} />
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="grid gap-5 lg:grid-cols-2">
		<div class="flex flex-col gap-2.5">
			<h4 class="label-xs text-faint">Foto-Analyse</h4>
			{#if photoUploading}
				<div class="flex items-center gap-2.5 rounded-sm border border-line px-3 py-3 text-sm text-muted">
					<Loader size={15} class="animate-spin" />{photoProgress}
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
					onfiles={(files) => {
						photoQueue = [...photoQueue, ...files];
					}}
					onrejected={(_, reason) => showToast(reason, 'error')}
				>
					<MediaPreviewGrid
						files={photoQueue}
						mode="queue"
						variant="admin"
						dropzoneId="admin-detail-photos"
						addMoreLabel="Weiteres Foto"
						onremove={(i) => {
							photoQueue = photoQueue.filter((_, idx) => idx !== i);
						}}
					/>
					<div class="mt-3 flex flex-wrap justify-end gap-2">
						<label
							for="admin-detail-photos"
							class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-line-strong px-3 text-[13px] hover:bg-sunk"
						>
							<Plus size={14} /> Weiteres Foto
						</label>
						<Button size="sm" variant="solid" onclick={uploadPhotos} disabled={photoQueue.length === 0}>
							<Upload size={15} />
							{photoQueue.length} Foto{photoQueue.length > 1 ? 's' : ''} hochladen
						</Button>
					</div>
				</MediaDropzone>
			{/if}
		</div>

		<div class="flex flex-col gap-2.5">
			<h4 class="label-xs text-faint">Video-Analyse</h4>
			{#if videoEntries.length > 0}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each videoEntries as entry (entry.url)}
						<div class="flex flex-col gap-1.5">
							<video controls preload="metadata" class="aspect-video w-full rounded-sm bg-black">
								<source src={entry.url} />
							</video>
							<Button size="xs" variant="danger" class="self-start" onclick={() => confirmDeleteEstimation(entry.estimationId)}>
								<Trash2 size={13} /> Löschen
							</Button>
						</div>
					{/each}
				</div>
			{/if}
			{#if videoUploading}
				<div class="flex items-center gap-2.5 rounded-sm border border-line px-3 py-3 text-sm text-muted">
					<Loader size={15} class="animate-spin" />{videoProgress}
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
					onfiles={(files) => {
						videoQueue = [...videoQueue, ...files];
					}}
					onrejected={(_, reason) => showToast(reason, 'error')}
				>
					<MediaPreviewGrid
						files={videoQueue}
						mode="queue"
						variant="admin"
						dropzoneId="admin-detail-videos"
						addMoreLabel="Weiteres Video"
						onremove={(i) => {
							videoQueue = videoQueue.filter((_, idx) => idx !== i);
						}}
					/>
					<div class="mt-3 flex flex-wrap justify-end gap-2">
						<label
							for="admin-detail-videos"
							class="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-line-strong px-3 text-[13px] hover:bg-sunk"
						>
							<Plus size={14} /> Weiteres Video
						</label>
						<Button size="sm" variant="solid" onclick={uploadVideos} disabled={videoQueue.length === 0}>
							<Upload size={15} />
							{videoQueue.length} Video{videoQueue.length > 1 ? 's' : ''} hochladen
						</Button>
					</div>
				</MediaDropzone>
			{/if}
		</div>
	</div>
</div>

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Analyse löschen"
	message="Diese Analyse und alle zugehörigen Gegenstände werden gelöscht."
	onConfirm={deleteEstimation}
	onCancel={() => {
		showDeleteDialog = false;
		pendingDeleteId = null;
	}}
/>
