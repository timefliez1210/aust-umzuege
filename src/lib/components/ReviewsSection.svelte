<script lang="ts">
	import { reviews, aggregateRating, allReviewsUrl } from '$lib/data/structuredData';

	let currentIndex = $state(0);
	let windowWidth = $state(0);

	const actualVisibleCards = $derived(() => {
		if (windowWidth === 0) return 2;
		if (windowWidth <= 640) return 1;
		if (windowWidth <= 1024) return 2;
		return 2;
	});

	const maxIndex = $derived(Math.max(0, reviews.length - actualVisibleCards()));
	const dots = $derived(Array.from({ length: maxIndex + 1 }, (_, i) => i));

	$effect(() => {
		if (typeof window === 'undefined') return;
		requestAnimationFrame(() => { windowWidth = window.innerWidth; });
		const handleResize = () => {
			requestAnimationFrame(() => {
				windowWidth = window.innerWidth;
				if (currentIndex > maxIndex) currentIndex = maxIndex;
			});
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isSwiping = $state(false);

	function next() { currentIndex = Math.min(currentIndex + 1, maxIndex); }
	function prev() { currentIndex = Math.max(currentIndex - 1, 0); }
	function goTo(index: number) { currentIndex = Math.min(Math.max(index, 0), maxIndex); }

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchEndX = e.touches[0].clientX;
		isSwiping = true;
	}
	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;
		touchEndX = e.touches[0].clientX;
	}
	function handleTouchEnd() {
		if (!isSwiping) return;
		isSwiping = false;
		const swipeDistance = touchStartX - touchEndX;
		if (Math.abs(swipeDistance) > 50) {
			if (swipeDistance > 0) next(); else prev();
		}
		touchStartX = 0;
		touchEndX = 0;
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffMonths = Math.floor(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
		if (diffMonths < 1) return 'Vor wenigen Wochen';
		if (diffMonths === 1) return 'Vor 1 Monat';
		if (diffMonths < 12) return `Vor ${diffMonths} Monaten`;
		const diffYears = Math.floor(diffMonths / 12);
		if (diffYears === 1) return 'Vor 1 Jahr';
		return `Vor ${diffYears} Jahren`;
	}
</script>

<section class="reviews">
	<div class="reviews__header">
		<span class="reviews__tagline">Kundenstimmen</span>
		<h2 class="reviews__heading">Das sagen unsere Kunden</h2>
		<div class="reviews__aggregate">
			<div class="reviews__stars" role="img" aria-label="5 von 5 Sternen">
				{#each Array(5) as _}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
						<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
					</svg>
				{/each}
			</div>
			<a href={allReviewsUrl} target="_blank" rel="noopener noreferrer" class="reviews__rating-text">
				{aggregateRating.ratingValue} von 5 Sternen — {aggregateRating.reviewCount} Bewertungen auf Google
			</a>
		</div>
	</div>

	{#if dots.length > 1}
		<div class="reviews__dots">
			{#each dots as _, i}
				<button
					class="reviews__dot"
					class:active={currentIndex === i}
					onclick={() => goTo(i)}
					aria-label={`Gehe zu Bewertung ${i + 1}`}
				></button>
			{/each}
		</div>
	{/if}

	<div class="reviews__wrapper">
		<button
			class="reviews__nav reviews__nav--prev"
			onclick={prev}
			disabled={currentIndex === 0}
			aria-label="Vorherige Bewertung"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</button>

		<div
			class="reviews__viewport"
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			role="region"
			aria-label="Kundenbewertungen Karussell"
		>
			<div
				class="reviews__track"
				style="transform: translateX(calc(-{currentIndex} * (100% / {actualVisibleCards()} + var(--gap) / {actualVisibleCards()})))"
			>
				{#each reviews as review}
					<a
						href={review.url}
						target="_blank"
						rel="noopener noreferrer"
						class="review-card"
					>
						<div class="review-card__header">
							<div class="review-card__author-info">
								<div class="review-card__avatar">
									{review.author.charAt(0)}
								</div>
								<div>
									<strong class="review-card__name">{review.author}</strong>
									<span class="review-card__meta">
										{#if review.badge}
											<span class="review-card__badge">{review.badge}</span>
											<span class="review-card__separator">·</span>
										{/if}
										{#if review.reviewCount}
											{review.reviewCount} Rezensionen
										{/if}
										{#if review.photoCount}
											<span class="review-card__separator">·</span>
											{review.photoCount} Fotos
										{/if}
									</span>
								</div>
							</div>
							<div class="review-card__stars">
								{#each Array(review.rating) as _}
									<svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" aria-hidden="true">
										<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
									</svg>
								{/each}
							</div>
						</div>
						<time datetime={review.date} class="review-card__date">
							{formatDate(review.date)}
						</time>
						<p class="review-card__text">{review.text}</p>
						<span class="review-card__source">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
							</svg>
							Auf Google ansehen
						</span>
					</a>
				{/each}
			</div>
		</div>

		<button
			class="reviews__nav reviews__nav--next"
			onclick={next}
			disabled={currentIndex === maxIndex}
			aria-label="Nächste Bewertung"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="9 18 15 12 9 6"></polyline>
			</svg>
		</button>
	</div>

	<div class="reviews__cta">
		<a href={allReviewsUrl} target="_blank" rel="noopener noreferrer" class="reviews__all-link">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			</svg>
			Alle {aggregateRating.reviewCount} Bewertungen auf Google ansehen
		</a>
	</div>
</section>

<style>
	.reviews {
		--gap: var(--space-6);
		padding-block: var(--space-16);
		background: linear-gradient(180deg, #f8fafc 0%, #fff 50%, #f8fafc 100%);
		overflow: hidden;
	}

	.reviews__header {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--container-padding);
		margin-bottom: var(--space-10);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.reviews__tagline {
		color: #c44a00;
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.reviews__heading {
		color: var(--color-info-bar);
		font-size: clamp(var(--text-2xl), 3.5vw, var(--text-4xl));
		font-weight: var(--font-bold);
		margin: 0;
	}

	.reviews__aggregate {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.reviews__stars {
		display: flex;
		gap: 2px;
	}

	.reviews__rating-text {
		color: #4a5568;
		font-size: var(--text-sm);
		margin: 0;
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.reviews__rating-text:hover {
		color: #1a73e8;
	}

	/* Dots */
	.reviews__dots {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
		margin-bottom: var(--space-8);
	}

	.reviews__dot {
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		background-color: transparent;
		border: none;
		cursor: pointer;
		position: relative;
	}

	.reviews__dot::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		border-radius: var(--radius-full);
		background-color: #cbd5e1;
		transition: background-color var(--transition-fast), transform var(--transition-fast);
	}

	.reviews__dot:hover::after {
		background-color: #94a3b8;
	}

	.reviews__dot.active::after {
		background-color: var(--color-info-bar);
		transform: translate(-50%, -50%) scale(1.2);
	}

	/* Carousel wrapper */
	.reviews__wrapper {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--container-padding);
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.reviews__nav {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-nav-accent);
		color: var(--color-text);
		border: none;
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: background-color var(--transition-fast), transform var(--transition-fast);
		box-shadow: var(--shadow-md);
	}

	.reviews__nav:hover:not(:disabled) {
		background-color: #d84a00;
		transform: scale(1.05);
	}

	.reviews__nav:disabled {
		background-color: #e2e8f0;
		color: #94a3b8;
		cursor: not-allowed;
	}

	.reviews__viewport {
		flex: 1;
		overflow: hidden;
		touch-action: pan-y pinch-zoom;
		cursor: grab;
	}

	.reviews__viewport:active {
		cursor: grabbing;
	}

	.reviews__track {
		display: flex;
		gap: var(--gap);
		transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	/* Review card */
	.review-card {
		flex: 0 0 calc((100% - var(--gap)) / 2);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: #fff;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		text-decoration: none;
		color: inherit;
		transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.review-card:hover {
		border-color: var(--color-nav-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		color: inherit;
	}

	.review-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.review-card__author-info {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.review-card__avatar {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-full);
		background: var(--color-info-bar);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: var(--font-bold);
		font-size: var(--text-base);
		flex-shrink: 0;
	}

	.review-card__name {
		display: block;
		color: var(--color-info-bar);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
	}

	.review-card__meta {
		display: flex;
		align-items: center;
		gap: 4px;
		color: #64748b;
		font-size: var(--text-xs, 0.75rem);
		flex-wrap: wrap;
	}

	.review-card__badge {
		color: #1a73e8;
		font-weight: var(--font-semibold);
	}

	.review-card__separator {
		color: #94a3b8;
	}

	.review-card__date {
		display: block;
		color: #64748b;
		font-size: var(--text-sm);
	}

	.review-card__stars {
		display: flex;
		gap: 1px;
		flex-shrink: 0;
	}

	.review-card__text {
		color: #2d3748;
		line-height: 1.7;
		margin: 0;
		font-size: var(--text-sm);
		flex: 1;
	}

	.review-card__source {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: #1967d2;
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
	}

	/* All reviews CTA */
	.reviews__cta {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--container-padding);
		margin-top: var(--space-8);
		text-align: center;
	}

	.reviews__all-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-6);
		background: #fff;
		color: #1967d2;
		border: 2px solid #1967d2;
		border-radius: var(--radius-md);
		font-weight: var(--font-semibold);
		font-size: var(--text-base);
		text-decoration: none;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.reviews__all-link:hover {
		background: #1967d2;
		color: #fff;
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	/* Tablet: 2 cards */
	@media (max-width: 1024px) {
		.review-card {
			flex: 0 0 calc((100% - var(--gap)) / 2);
		}
	}

	/* Mobile: 1 card, hide arrows */
	@media (max-width: 640px) {
		.reviews__wrapper {
			gap: 0;
		}

		.reviews__nav {
			display: none;
		}

		.review-card {
			flex: 0 0 100%;
		}

		.reviews__header {
			text-align: center;
			align-items: center;
		}

		.reviews__aggregate {
			justify-content: center;
		}
	}
</style>
