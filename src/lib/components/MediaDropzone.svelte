<script lang="ts">
	import { Upload } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	/**
	 * A reusable dashed-border drop zone for file selection via click or drag-and-drop.
	 *
	 * Pure input surface — does NOT own or store files. The parent component owns all file
	 * state and receives validated files via the `onfiles` callback. When `hasFiles` is true
	 * the component renders its slot content (typically a MediaPreviewGrid) instead of the
	 * empty-state prompt, while still accepting drops on the entire area.
	 *
	 * Used by: foto-angebot/+page.svelte, admin/inquiries/+page.svelte,
	 *          admin/inquiries/[id]/+page.svelte
	 */

	interface Props {
		/**
		 * Value for the hidden `<input accept>` attribute.
		 * Defaults to accepting all common image and video formats.
		 */
		accept?: string;
		/** Allow selecting multiple files at once. Default true. */
		multiple?: boolean;
		/** Primary call-to-action text shown in the empty state. */
		label?: string;
		/** Secondary hint line shown below the label in the empty state. */
		hint?: string;
		/**
		 * Maximum allowed file size in megabytes. Files exceeding this limit are rejected
		 * via `onrejected` and excluded from the `onfiles` payload. null = no limit.
		 */
		maxSizeMb?: number | null;
		/**
		 * MIME-type prefix filter (e.g. "image/" or "video/"). When set, files whose type
		 * does not start with this prefix are rejected. null = no MIME filter.
		 */
		mimeFilter?: string | null;
		/** When true the dropzone area is non-interactive. */
		disabled?: boolean;
		/**
		 * `id` forwarded to the hidden `<input type="file">` so that external
		 * `<label for={id}>` "add more" buttons can trigger the file picker.
		 */
		id?: string;
		/**
		 * When true, renders `{@render children?.()}` instead of the empty-state UI.
		 * The outer drop area remains active so users can still drop additional files.
		 */
		hasFiles?: boolean;
		/** Controls which CSS variant/theme is applied. */
		variant?: 'public' | 'admin';
		/** Called with the array of validated (non-rejected) File objects. */
		onfiles: (files: File[]) => void;
		/** Called for each file that fails MIME or size validation. */
		onrejected?: (file: File, reason: string) => void;
		/** Slot content rendered when hasFiles is true (typically a MediaPreviewGrid). */
		children?: Snippet;
	}

	let {
		accept = 'image/*,video/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.tiff,.tif,.avif,.mp4,.mov,.mpeg,.mpg,.avi,.webm,.mkv,.3gp,.m4v',
		multiple = true,
		label = 'Dateien hierher ziehen oder klicken',
		hint = '',
		maxSizeMb = null,
		mimeFilter = null,
		disabled = false,
		id = `md-${Math.random().toString(36).slice(2, 9)}`,
		hasFiles = false,
		variant = 'admin',
		onfiles,
		onrejected,
		children,
	}: Props = $props();

	/** Whether a drag is currently hovering over the drop area. */
	let isDragging = $state(false);

	/**
	 * Validates a batch of raw File objects against the mimeFilter and maxSizeMb constraints.
	 *
	 * Called by: handleDrop (drag-and-drop), handleInputChange (file picker)
	 * Purpose: Central validation gate — accepted files are batched and forwarded to
	 *          `onfiles`; rejected files each trigger `onrejected` with a human-readable reason.
	 *
	 * @param raw - FileList or File array to validate
	 * @returns void (side-effects: calls onfiles with accepted files, calls onrejected per rejection)
	 */
	function processFiles(raw: FileList | File[]) {
		if (disabled) return;
		const accepted: File[] = [];
		for (const file of Array.from(raw)) {
			if (mimeFilter && !file.type.startsWith(mimeFilter)) {
				const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
				// Allow by extension as fallback (e.g. HEIC files often have empty MIME type)
				const extOk = mimeFilter.startsWith('image/')
					? ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif', '.bmp', '.tiff', '.tif', '.avif'].includes(ext)
					: mimeFilter.startsWith('video/')
						? ['.mp4', '.mov', '.mpeg', '.mpg', '.avi', '.webm', '.mkv', '.3gp', '.m4v'].includes(ext)
						: false;
				if (!extOk) {
					onrejected?.(file, `${file.name}: Falscher Dateityp`);
					continue;
				}
			}
			if (maxSizeMb !== null && file.size > maxSizeMb * 1024 * 1024) {
				onrejected?.(file, `${file.name} zu groß (max. ${maxSizeMb} MB)`);
				continue;
			}
			accepted.push(file);
		}
		if (accepted.length > 0) onfiles(accepted);
	}

	/**
	 * Handles the native drop event: prevents the browser's default file-open behavior,
	 * clears the drag-highlight, and forwards dropped files to processFiles.
	 *
	 * Called by: Template (ondrop on the outer drop area)
	 * Purpose: Allows files to be dragged directly onto the component from the OS file manager.
	 *
	 * @param e - The native DragEvent
	 * @returns void
	 */
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) processFiles(e.dataTransfer.files);
	}

	/**
	 * Prevents the browser's default dragover behavior and activates the drag-highlight.
	 *
	 * Called by: Template (ondragover on the outer drop area)
	 * Purpose: Visual feedback indicating the area is a valid drop target.
	 *
	 * @param e - The native DragEvent
	 * @returns void
	 */
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	/**
	 * Clears the drag-highlight when the dragged item leaves the drop area.
	 *
	 * Called by: Template (ondragleave on the outer drop area)
	 * Purpose: Resets the drop zone to its idle visual state.
	 *
	 * @returns void
	 */
	function handleDragLeave() {
		isDragging = false;
	}

	/**
	 * Reads files from a file-input change event and forwards them to processFiles.
	 *
	 * Called by: Template (onchange on the hidden <input type="file">)
	 * Purpose: Bridges the native file-input event to the shared validation logic,
	 *          then resets the input so the same file can be re-selected if needed.
	 *
	 * @param e - The native Event from the file input element
	 * @returns void
	 */
	function handleInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) processFiles(input.files);
		input.value = '';
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="md-wrap md-wrap--{variant}"
	class:md-wrap--dragging={isDragging}
	class:md-wrap--disabled={disabled}
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
>
	{#if hasFiles}
		{@render children?.()}
	{:else}
		<button
			type="button"
			class="md-empty md-empty--{variant}"
			{disabled}
			onclick={() => document.getElementById(id)?.click()}
		>
			<Upload size={variant === 'public' ? 44 : 32} strokeWidth={1.5} />
			<span class="md-label md-label--{variant}">{label}</span>
			{#if hint}
				<span class="md-hint">{hint}</span>
			{/if}
		</button>
	{/if}

	<input
		{id}
		type="file"
		{accept}
		{multiple}
		{disabled}
		class="md-input"
		onchange={handleInputChange}
	/>
</div>

<style>
	/* ===== Shared base ===== */
	.md-input {
		display: none;
	}

	.md-wrap {
		border-radius: var(--radius-lg, 12px);
		transition: all 150ms ease;
	}

	/* ===== Public variant (matches ap__dropzone from foto-angebot) ===== */
	.md-wrap--public {
		border: 2px dashed #cbd5e0;
		background-color: #f8fafc;
	}

	.md-wrap--public.md-wrap--dragging {
		border-color: var(--color-nav-accent, #c44100);
		background-color: rgba(196, 65, 0, 0.05);
	}

	.md-empty--public {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3, 0.75rem);
		padding: var(--space-10, 2.5rem) var(--space-6, 1.5rem);
		width: 100%;
		cursor: pointer;
		color: #94a3b8;
		background: none;
		border: none;
	}

	.md-empty--public:hover {
		color: var(--color-nav-accent, #c44100);
	}

	.md-label--public {
		font-size: var(--text-lg, 1.125rem);
		font-weight: var(--font-semibold, 600);
		color: #475569;
	}

	/* ===== Admin variant (matches upload-drop-label / photo-dropzone from admin pages) ===== */
	.md-wrap--admin {
		border: 2px dashed #d1d9e6;
	}

	.md-wrap--admin.md-wrap--dragging {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.04);
	}

	.md-empty--admin {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 2rem;
		width: 100%;
		cursor: pointer;
		color: #64748b;
		background: none;
		border: none;
		border-radius: inherit;
		text-align: center;
		transition: all 150ms ease;
	}

	.md-empty--admin:hover {
		border-color: #6366f1;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.04);
	}

	.md-wrap--admin.md-wrap--dragging .md-empty--admin {
		color: #6366f1;
	}

	.md-label--admin {
		font-size: 0.9375rem;
		font-weight: 500;
		color: inherit;
	}

	/* ===== Shared hint ===== */
	.md-hint {
		font-size: var(--text-sm, 0.875rem);
		color: #94a3b8;
	}

	.md-wrap--admin .md-hint {
		font-size: 0.6875rem;
	}

	/* ===== Disabled state ===== */
	.md-wrap--disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	/* ===== Responsive ===== */
	@media (max-width: 480px) {
		.md-empty--public {
			padding: var(--space-6, 1.5rem) var(--space-4, 1rem);
		}
	}
</style>
