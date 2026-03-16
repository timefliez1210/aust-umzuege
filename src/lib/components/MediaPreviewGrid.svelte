<script lang="ts">
	import { X, ImagePlus, Video, FileIcon } from 'lucide-svelte';
	import { formatFileSize } from '$lib/utils/api.svelte';

	/**
	 * Renders the selected-file list or thumbnail grid after files are staged for upload.
	 *
	 * Supports three display modes:
	 * - "thumbnails": Image thumbnail grid with object-fit cover and X remove button overlay.
	 * - "queue":      File-name + size list rows with X remove buttons (used for video queues).
	 * - "mixed":      Thumbnails for image/* files; file-tile cards for video/* and other files.
	 *
	 * Object URLs for image thumbnails are created via URL.createObjectURL and revoked on cleanup.
	 * The component does NOT own file state — the parent owns the files array.
	 *
	 * Used by: foto-angebot/+page.svelte (mode="mixed", variant="public"),
	 *          admin/inquiries/+page.svelte (mode="thumbnails" and mode="queue", variant="admin"),
	 *          admin/inquiries/[id]/+page.svelte (mode="queue", variant="admin")
	 */

	interface Props {
		/** Array of File objects to display. Owned by the parent — not mutated here. */
		files: File[];
		/**
		 * Rendering strategy:
		 * - "thumbnails": all files shown as square image thumbnails.
		 * - "queue":      all files shown as name + size rows.
		 * - "mixed":      images → thumbnails, videos → tile with Video icon, others → tile with File icon.
		 */
		mode?: 'thumbnails' | 'queue' | 'mixed';
		/** Controls which CSS variant/theme is applied. */
		variant?: 'public' | 'admin';
		/** Whether to show an "add more files" control. */
		showAddMore?: boolean;
		/** Label for the "add more" button/link. */
		addMoreLabel?: string;
		/**
		 * When set, the "add more" control is rendered as a `<label for={dropzoneId}>` so
		 * clicking it opens the hidden file input managed by a sibling MediaDropzone.
		 */
		dropzoneId?: string | null;
		/** Called when the user clicks the remove button for a file. */
		onremove: (index: number) => void;
		/** Fallback called when showAddMore=true but no dropzoneId is provided. */
		onaddmore?: () => void;
	}

	let {
		files,
		mode = 'mixed',
		variant = 'admin',
		showAddMore = true,
		addMoreLabel = 'Weitere',
		dropzoneId = null,
		onremove,
		onaddmore,
	}: Props = $props();

	/**
	 * Derives a map of object URLs for image files, keyed by File reference.
	 * Non-image files get an empty string entry as a sentinel.
	 *
	 * Called by: $effect (rebuilt whenever `files` changes)
	 * Purpose: Provides fast thumbnail previews without FileReader by using
	 *          the browser's native object URL mechanism. URLs are revoked when
	 *          the effect re-runs or the component is destroyed to prevent memory leaks.
	 */
	// Internal (untracked) cache — never read by Svelte's dependency tracker
	let _urlCache = new Map<File, string>();
	// Reactive snapshot exposed to the template
	let objectUrls = $state<Map<File, string>>(new Map());

	$effect(() => {
		// Only read `files` — do NOT read `objectUrls` inside this effect
		const currentFiles = new Set(files);

		// Revoke URLs for files no longer in the list
		for (const [file, url] of _urlCache) {
			if (!currentFiles.has(file)) {
				if (url) URL.revokeObjectURL(url);
				_urlCache.delete(file);
			}
		}
		// Create URLs for new image files
		for (const file of files) {
			if (!_urlCache.has(file)) {
				if (file.type.startsWith('image/') || isImageByExtension(file.name)) {
					_urlCache.set(file, URL.createObjectURL(file));
				} else {
					_urlCache.set(file, '');
				}
			}
		}
		// Publish a new snapshot for the template
		objectUrls = new Map(_urlCache);

		return () => {
			for (const url of _urlCache.values()) {
				if (url) URL.revokeObjectURL(url);
			}
			_urlCache.clear();
		};
	});

	/**
	 * Tests whether a filename has a recognised image extension.
	 *
	 * Called by: $effect (to handle HEIC/HEIF files whose MIME type may be empty)
	 * Purpose: Fallback extension check for files where the browser does not populate
	 *          `file.type` (common on iOS for HEIC images).
	 *
	 * @param name - The filename including extension
	 * @returns true when the extension is a known image format
	 */
	function isImageByExtension(name: string): boolean {
		const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
		return ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif', '.bmp', '.tiff', '.tif', '.avif'].includes(ext);
	}

	/**
	 * Determines whether a given file should be rendered as an image thumbnail.
	 *
	 * Called by: Template (for mode="mixed" to branch between thumbnail and tile)
	 * Purpose: Centralises the thumbnail-eligibility check so it can be reused
	 *          in both the $effect URL management and the template branching.
	 *
	 * @param file - The file to test
	 * @returns true when the file should be shown as an image thumbnail
	 */
	function isImage(file: File): boolean {
		return file.type.startsWith('image/') || isImageByExtension(file.name);
	}
</script>

{#if mode === 'thumbnails' || (mode === 'mixed')}
	<div class="mpg-grid mpg-grid--{variant}">
		{#each files as file, i}
			{@const url = objectUrls.get(file) ?? ''}
			{#if mode === 'thumbnails' || isImage(file)}
				<!-- Image thumbnail -->
				<div class="mpg-thumb mpg-thumb--{variant}">
					{#if url}
						<img src={url} alt={file.name} />
					{:else}
						<!-- Fallback while URL is being created -->
						<div class="mpg-thumb-placeholder"></div>
					{/if}
					<button
						type="button"
						class="mpg-remove mpg-remove--{variant}"
						onclick={() => onremove(i)}
						aria-label="Entfernen"
					>
						<X size={13} />
					</button>
				</div>
			{:else}
				<!-- Non-image file tile (mode="mixed") -->
				<div class="mpg-tile mpg-tile--{variant}">
					{#if file.type.startsWith('video/')}
						<Video size={26} strokeWidth={1.5} class="mpg-tile-icon" />
					{:else}
						<FileIcon size={26} strokeWidth={1.5} class="mpg-tile-icon" />
					{/if}
					<span class="mpg-tile-name">{file.name}</span>
					<span class="mpg-tile-size">{formatFileSize(file.size)}</span>
					<button
						type="button"
						class="mpg-remove mpg-remove--{variant} mpg-remove--tile"
						onclick={() => onremove(i)}
						aria-label="Entfernen"
					>
						<X size={13} />
					</button>
				</div>
			{/if}
		{/each}

		{#if showAddMore}
			{#if dropzoneId}
				<label for={dropzoneId} class="mpg-add mpg-add--{variant}">
					<ImagePlus size={variant === 'public' ? 22 : 18} />
					<span>{addMoreLabel}</span>
				</label>
			{:else if onaddmore}
				<button type="button" class="mpg-add mpg-add--{variant}" onclick={onaddmore}>
					<ImagePlus size={variant === 'public' ? 22 : 18} />
					<span>{addMoreLabel}</span>
				</button>
			{/if}
		{/if}
	</div>
{:else}
	<!-- Queue mode: file-name + size rows -->
	<div class="mpg-queue mpg-queue--{variant}">
		{#each files as file, i}
			<div class="mpg-queue-item mpg-queue-item--{variant}">
				{#if file.type.startsWith('video/')}
					<Video size={16} />
				{:else}
					<ImagePlus size={16} />
				{/if}
				<span class="mpg-queue-name">{file.name}</span>
				<span class="mpg-queue-size">{formatFileSize(file.size)}</span>
				<button
					type="button"
					class="mpg-queue-remove"
					onclick={() => onremove(i)}
					title="Entfernen"
				>
					<X size={14} />
				</button>
			</div>
		{/each}

		{#if showAddMore && dropzoneId}
			<div class="mpg-queue-actions">
				<label for={dropzoneId} class="mpg-add-more-label mpg-add-more-label--{variant}">
					<ImagePlus size={14} />
					{addMoreLabel}
				</label>
			</div>
		{:else if showAddMore && onaddmore}
			<div class="mpg-queue-actions">
				<button
					type="button"
					class="mpg-add-more-label mpg-add-more-label--{variant}"
					onclick={onaddmore}
				>
					<ImagePlus size={14} />
					{addMoreLabel}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	/* ===== Thumbnail grid ===== */

	/* Public variant (matches ap__media-grid from foto-angebot) */
	.mpg-grid--public {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: var(--space-3, 0.75rem);
		padding: var(--space-4, 1rem);
	}

	/* Admin variant (matches photo-grid from admin list) */
	.mpg-grid--admin {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding: 0 0 0.75rem;
	}

	/* ===== Thumbnail cell ===== */

	/* Public variant (matches ap__thumb) */
	.mpg-thumb--public {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-md, 8px);
		overflow: hidden;
		background-color: #e2e8f0;
	}

	/* Admin variant (matches .photo-thumb from admin list) */
	.mpg-thumb--admin {
		position: relative;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		overflow: hidden;
		background: #e8ecf1;
		box-shadow: 2px 2px 6px #d1d9e6;
	}

	.mpg-thumb--public img,
	.mpg-thumb--admin img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.mpg-thumb-placeholder {
		width: 100%;
		height: 100%;
		background: #e2e8f0;
	}

	/* ===== Remove button ===== */

	/* Public variant (matches ap__thumb-remove) */
	.mpg-remove--public {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 22px;
		height: 22px;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: var(--radius-full, 9999px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.mpg-remove--public:hover {
		background-color: #dc2626;
	}

	.mpg-remove--public.mpg-remove--tile {
		position: absolute;
		top: 4px;
		right: 4px;
	}

	/* Admin variant (matches photo-thumb__remove from admin list) */
	.mpg-remove--admin {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 20px;
		height: 20px;
		background: rgba(0, 0, 0, 0.55);
		color: white;
		border: none;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		opacity: 0;
		transition: opacity 100ms;
	}

	.mpg-thumb--admin:hover .mpg-remove--admin,
	.mpg-tile--admin:hover .mpg-remove--admin {
		opacity: 1;
	}

	/* ===== File tile (mode="mixed", non-image files) ===== */

	/* Public variant (matches ap__file-tile) */
	.mpg-tile--public {
		position: relative;
		aspect-ratio: 1;
		border-radius: var(--radius-md, 8px);
		background-color: #eef2ff;
		border: 1.5px solid #c7d2fe;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1, 0.25rem);
		padding: var(--space-2, 0.5rem);
		color: #4f46e5;
		overflow: hidden;
	}

	/* Admin variant — similar style but neumorphic */
	.mpg-tile--admin {
		position: relative;
		width: 80px;
		height: 80px;
		border-radius: 8px;
		background: #e8ecf1;
		border: 1.5px solid #c7d2fe;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		padding: 0.5rem;
		color: #6366f1;
		overflow: hidden;
		box-shadow: 2px 2px 6px #d1d9e6;
	}

	.mpg-tile-name {
		font-size: var(--text-xs, 0.75rem);
		color: #1e293b;
		text-align: center;
		word-break: break-all;
		line-height: 1.2;
		max-height: 2.4em;
		overflow: hidden;
	}

	.mpg-tile-size {
		font-size: 10px;
		color: #64748b;
	}

	/* ===== Add more cell ===== */

	/* Public variant (matches ap__photo-add) */
	.mpg-add--public {
		aspect-ratio: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1, 0.25rem);
		border: 2px dashed #cbd5e0;
		border-radius: var(--radius-md, 8px);
		background: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: var(--text-xs, 0.75rem);
		transition: all 150ms ease;
		text-decoration: none;
	}

	.mpg-add--public:hover {
		border-color: var(--color-nav-accent, #c44100);
		color: var(--color-nav-accent, #c44100);
	}

	/* Admin variant */
	.mpg-add--admin {
		width: 80px;
		height: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		border: 2px dashed #d1d9e6;
		border-radius: 8px;
		background: none;
		color: #94a3b8;
		cursor: pointer;
		font-size: 0.6875rem;
		transition: all 150ms ease;
		text-decoration: none;
	}

	.mpg-add--admin:hover {
		border-color: #6366f1;
		color: #6366f1;
	}

	/* ===== Queue mode ===== */

	.mpg-queue--public,
	.mpg-queue--admin {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	/* Public queue item */
	.mpg-queue-item--public {
		display: flex;
		align-items: center;
		gap: var(--space-2, 0.5rem);
		padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
		background-color: #f8fafc;
		border: 1.5px solid #e2e8f0;
		border-radius: var(--radius-md, 8px);
		color: #475569;
	}

	/* Admin queue item (matches upload-queue-item from [id] page) */
	.mpg-queue-item--admin {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: #e8ecf1;
		border-radius: 8px;
		box-shadow:
			inset 2px 2px 5px #d1d9e6,
			inset -2px -2px 5px #ffffff;
	}

	.mpg-queue-name {
		flex: 1;
		font-size: 0.8125rem;
		color: #334155;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mpg-queue-size {
		font-size: 0.75rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.mpg-queue-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: none;
		border: none;
		cursor: pointer;
		color: #94a3b8;
		border-radius: 4px;
		flex-shrink: 0;
		transition: color 100ms ease;
	}

	.mpg-queue-remove:hover {
		color: #dc2626;
	}

	.mpg-queue-actions {
		display: flex;
		align-items: center;
		padding-top: 0.25rem;
	}

	/* "Add more" link in queue mode */
	.mpg-add-more-label--admin {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		color: #6366f1;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		text-decoration: none;
		transition: color 150ms ease;
	}

	.mpg-add-more-label--admin:hover {
		color: #4f46e5;
	}

	.mpg-add-more-label--public {
		display: flex;
		align-items: center;
		gap: var(--space-2, 0.5rem);
		font-size: var(--text-sm, 0.875rem);
		color: var(--color-nav-accent, #c44100);
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		text-decoration: none;
		transition: color 150ms ease;
	}

	.mpg-add-more-label--public:hover {
		color: #b83b00;
	}

	/* ===== Responsive ===== */
	@media (max-width: 767px) {
		.mpg-grid--public {
			grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
		}
	}
</style>
