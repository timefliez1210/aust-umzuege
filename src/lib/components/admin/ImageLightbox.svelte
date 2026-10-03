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
	let currentIndex = $state((() => initialIndex)());
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
<!-- "backdrop" class: test hook for the outside click. -->
<div class="backdrop fixed inset-0 z-[700] flex items-center justify-center bg-black/90 p-4" role="presentation" onclick={handleBackdropClick}>
	<button
		class="absolute top-3 right-3 inline-flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
		onclick={onclose}
		aria-label="Schließen"
	>
		<X size={24} />
	</button>

	{#if isGallery && currentIndex > 0}
		<button
			class="absolute top-1/2 left-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
			onclick={prev}
			aria-label="Vorheriges Bild"
		>
			<ChevronLeft size={32} />
		</button>
	{/if}
	{#if isGallery && currentIndex < images.length - 1}
		<button
			class="absolute top-1/2 right-2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
			onclick={next}
			aria-label="Nächstes Bild"
		>
			<ChevronRight size={32} />
		</button>
	{/if}

	<div class="flex max-h-full max-w-5xl flex-col items-center gap-3">
		<div class="relative">
			{#key currentUrl}
				<img bind:this={imgEl} src={currentUrl} alt={itemName || `Bild ${currentIndex + 1}`} class="max-h-[80dvh] max-w-full rounded-sm object-contain" />
			{/key}
			{#if bbox && bbox.length >= 4 && bboxStyle}
				<div class="pointer-events-none absolute border-2 border-accent shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" style={bboxStyle}></div>
			{/if}
		</div>
		<div class="num flex items-center gap-4 text-sm text-white/85">
			{#if itemName}<span class="font-sans font-medium text-white">{itemName}</span>{/if}
			{#if volumeM3 > 0}<span>{volumeM3.toFixed(2)} m³</span>{/if}
			{#if isGallery}<span class="text-white/60">{currentIndex + 1} / {images.length}</span>{/if}
		</div>
	</div>
</div>
