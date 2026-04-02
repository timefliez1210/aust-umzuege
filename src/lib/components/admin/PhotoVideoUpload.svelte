<script lang="ts">
	import { apiFetch, apiDelete, API_BASE } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import MediaDropzone from '$lib/components/MediaDropzone.svelte';
	import MediaPreviewGrid from '$lib/components/MediaPreviewGrid.svelte';
	import { Trash2, X, Download, Upload, Plus } from 'lucide-svelte';

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
	 * Why: Phone photos are typically 3–10 MB each. 92 photos can exceed Cloudflare
	 *      Tunnel's ~100 MB upload limit, causing the request to be silently dropped.
	 *      Resizing to max 1600 px on the longest edge at 82 % JPEG quality reduces a
	 *      typical 5 MB phone photo to ~300 KB — a 15× reduction with no visible loss
	 *      for ML estimation purposes.
	 *
	 * HEIC/HEIF and any format the browser cannot decode fall back to the original file.
	 *
	 * @param file    - Raw File from the file picker
	 * @returns       Compressed JPEG File, or the original File if compression fails
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
	 * Compresses, uploads all queued photos to the photo estimation endpoint and polls for results.
	 *
	 * Called by: Template (onclick on "Hochladen" button in the Foto-Analyse card)
	 * Purpose: Compresses each image client-side (max 1600 px / JPEG 82 %) to stay within
	 *          Cloudflare Tunnel's upload limit, then POSTs to
	 *          POST /api/v1/inquiries/{id}/estimate/depth (multipart FormData with images fields).
	 *          After upload, polls for completion via pollEstimations.
	 *
	 * @returns void (side-effect: clears photoQueue, shows toast, calls onUpdated on completion)
	 */
	async function uploadPhotos() {
		if (photoQueue.length === 0) return;

		photoUploading = true;
		const count = photoQueue.length;

		try {
			const compressed: File[] = [];
			for (let i = 0; i < photoQueue.length; i++) {
				photoProgress = `Komprimiere ${i + 1}/${count}...`;
				compressed.push(await compressImage(photoQueue[i]));
			}

			photoProgress = `${count} Foto${count > 1 ? 's' : ''} wird hochgeladen...`;
			const formData = new FormData();
			for (const file of compressed) {
				formData.append('images', file);
			}

			const results = await apiFetch<{ id: string; status: string }[]>(
				`/api/v1/inquiries/${inquiryId}/estimate/depth`,
				{
					method: 'POST',
					body: formData,
				},
			);

			photoQueue = [];
			showToast(
				`${count} Foto${count > 1 ? 's' : ''} hochgeladen — Analyse läuft`,
				'success',
			);

			const processingIds = results
				.filter((r) => r.status === 'processing')
				.map((r) => r.id);
			if (processingIds.length > 0) {
				await pollEstimations(processingIds, 'photo');
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

<!-- Estimation Status (processing / failed) -->
{#if processingEstimations.length > 0 || failedEstimations.length > 0}
	<div class="card full-width">
		{#each processingEstimations as est}
			<div class="estimation-status-row">
				<div class="upload-spinner"></div>
				<span
					>{est.method === 'video'
						? 'Video'
						: 'Foto'}-Analyse wird verarbeitet...</span
				>
			</div>
		{/each}
		{#each failedEstimations as est}
			<div class="estimation-status-row estimation-failed">
				<span
					>{est.method === 'video'
						? 'Video'
						: 'Foto'}-Analyse fehlgeschlagen</span
				>
				<button
					class="btn btn-sm btn-danger"
					onclick={() => confirmDeleteEstimation(est.id)}
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
				<button class="btn btn-sm" onclick={onFilterClear}>
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
						onclick={() => onTogglePhotoFilter(idx)}
						oncontextmenu={(e) => {
							e.preventDefault();
							openPhotoDetail?.(idx);
						}}
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
						onclick={() => confirmDeleteEstimation(galleryEntries[idx].estimationId)}
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
			<div class="upload-queue-actions">
				<label for="admin-detail-photos" class="btn btn-sm upload-add-more">
					<Plus size={14} />
					Weiteres Foto
				</label>
				<button
					class="btn btn-primary"
					onclick={uploadPhotos}
					disabled={photoQueue.length === 0}
				>
					<Upload size={16} />
					{photoQueue.length} Foto{photoQueue.length > 1 ? 's' : ''} hochladen
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
					<video controls preload="metadata" class="video-player">
						<source src={entry.url} />
					</video>
					<button
						class="video-delete-btn"
						onclick={() => confirmDeleteEstimation(entry.estimationId)}
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
			<div class="upload-queue-actions">
				<label for="admin-detail-videos" class="btn btn-sm upload-add-more">
					<Plus size={14} />
					Weiteres Video
				</label>
				<button
					class="btn btn-primary"
					onclick={uploadVideos}
					disabled={videoQueue.length === 0}
				>
					<Upload size={16} />
					{videoQueue.length} Video{videoQueue.length > 1 ? 's' : ''} hochladen
				</button>
			</div>
		</MediaDropzone>
	{/if}
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

<style>
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
</style>
