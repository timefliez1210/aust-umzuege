<script lang="ts">
	import { ChevronLeft, ChevronRight, X } from 'lucide-svelte';

	let {
		imageUrl = null,
		images = [],
		initialIndex = 0,
		bbox = null,
		itemName = '',
		volumeM3 = 0,
		imageWidth = 0,
		imageHeight = 0,
		onclose
	}: {
		imageUrl?: string | null;
		images?: string[];
		initialIndex?: number;
		bbox?: number[] | null;
		itemName?: string;
		volumeM3?: number;
		imageWidth?: number;
		imageHeight?: number;
		onclose: () => void;
	} = $props();

	let isGallery = $derived(images.length > 0);
	let currentIndex = $state(initialIndex);
	let currentUrl = $derived(isGallery ? images[currentIndex] : imageUrl);

	let imgEl = $state<HTMLImageElement | null>(null);
	let displayedWidth = $state(0);
	let displayedHeight = $state(0);

	let scale = $derived(imageWidth > 0 ? displayedWidth / imageWidth : 1);

	let bboxStyle = $derived.by(() => {
		if (!bbox || bbox.length < 4 || scale === 0 || isGallery) return '';
		const left = bbox[0] * scale;
		const top = bbox[1] * scale;
		const width = (bbox[2] - bbox[0]) * scale;
		const height = (bbox[3] - bbox[1]) * scale;
		return `left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;`;
	});

	$effect(() => {
		if (!imgEl) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				displayedWidth = entry.contentRect.width;
				displayedHeight = entry.contentRect.height;
			}
		});
		observer.observe(imgEl);
		return () => observer.disconnect();
	});

	/**
	 * Moves to the previous image in the gallery.
	 *
	 * Called by: Template (onclick of the previous-image nav button), handleKeydown
	 * Purpose: Decrements currentIndex so the gallery displays the preceding image.
	 *          Guards against going below index 0 to avoid out-of-bounds access.
	 */
	function prev() {
		if (currentIndex > 0) currentIndex--;
	}

	/**
	 * Moves to the next image in the gallery.
	 *
	 * Called by: Template (onclick of the next-image nav button), handleKeydown
	 * Purpose: Increments currentIndex so the gallery displays the following image.
	 *          Guards against exceeding the last index of the images array.
	 */
	function next() {
		if (currentIndex < images.length - 1) currentIndex++;
	}

	/**
	 * Handles keyboard events dispatched on the window while the lightbox is open.
	 *
	 * Called by: Template (svelte:window onkeydown binding)
	 * Purpose: Provides keyboard accessibility — Escape closes the lightbox, and
	 *          ArrowLeft/ArrowRight navigate between images in gallery mode.
	 *
	 * @param e - The KeyboardEvent from the window keydown listener
	 */
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		} else if (e.key === 'ArrowLeft' && isGallery) {
			prev();
		} else if (e.key === 'ArrowRight' && isGallery) {
			next();
		}
	}

	/**
	 * Closes the lightbox when the user clicks directly on the semi-transparent backdrop.
	 *
	 * Called by: Template (onclick on the .backdrop element)
	 * Purpose: Allows the user to dismiss the lightbox by clicking outside the
	 *          image area. The target/currentTarget check ensures clicks on child
	 *          elements (image, buttons) do not trigger a close.
	 *
	 * @param e - The MouseEvent from the backdrop click listener
	 */
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="backdrop" role="presentation" onclick={handleBackdropClick}>
	<button class="close-btn" onclick={onclose} aria-label="Schliessen">
		<X size={24} />
	</button>

	{#if isGallery && currentIndex > 0}
		<button class="nav-btn nav-prev" onclick={prev} aria-label="Vorheriges Bild">
			<ChevronLeft size={32} />
		</button>
	{/if}

	{#if isGallery && currentIndex < images.length - 1}
		<button class="nav-btn nav-next" onclick={next} aria-label="Naechstes Bild">
			<ChevronRight size={32} />
		</button>
	{/if}

	<div class="lightbox-content">
		<div class="image-container">
			{#key currentUrl}
				<img
					bind:this={imgEl}
					src={currentUrl}
					alt={itemName || `Bild ${currentIndex + 1}`}
					class="lightbox-image"
				/>
			{/key}
			{#if bbox && bbox.length >= 4 && bboxStyle}
				<div class="bbox-overlay" style={bboxStyle}></div>
			{/if}
		</div>

		<div class="caption">
			{#if itemName}
				<span class="item-name">{itemName}</span>
			{/if}
			{#if volumeM3 > 0}
				<span class="volume">{volumeM3.toFixed(2)} m&sup3;</span>
			{/if}
			{#if isGallery}
				<span class="counter">{currentIndex + 1} / {images.length}</span>
			{/if}
		</div>
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 9999;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: fadeIn 150ms ease;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10000;
		color: var(--dt-on-primary);
		padding: 0.5rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border: var(--dt-glass-border);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.close-btn:hover {
		background: rgba(30, 58, 95, 0.95);
	}

	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 10000;
		color: var(--dt-on-primary);
		padding: 0.75rem;
		border-radius: var(--dt-radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border: var(--dt-glass-border);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.nav-btn:hover {
		background: rgba(30, 58, 95, 0.95);
	}

	.nav-prev {
		left: 1rem;
	}

	.nav-next {
		right: 1rem;
	}

	.lightbox-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		max-width: 90vw;
		max-height: 92vh;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		overflow: hidden;
	}

	.image-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 0;
	}

	.lightbox-image {
		max-width: 90vw;
		max-height: 85vh;
		object-fit: contain;
		border-radius: var(--dt-radius-md);
		display: block;
	}

	.bbox-overlay {
		position: absolute;
		border: 2px solid var(--dt-secondary-container);
		border-radius: 4px;
		pointer-events: none;
		box-shadow: 0 0 0 1px rgba(252, 96, 24, 0.3);
	}

	.caption {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 1rem;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border-top: var(--dt-glass-border);
		color: var(--dt-on-primary);
		font-size: 0.875rem;
		width: 100%;
		box-sizing: border-box;
	}

	.item-name {
		font-weight: 600;
	}

	.volume {
		color: rgba(255, 255, 255, 0.7);
	}

	.counter {
		color: rgba(255, 255, 255, 0.55);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>
