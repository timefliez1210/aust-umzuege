<script lang="ts">
	// Customer Reviews Section with Schema.org structured data for SEO
	const reviews = [
		{
			author: 'Bea',
			rating: 5,
			date: '2024-12-13', // ~2 months ago from now (Feb 2025)
			text: 'Ich bin letzte Woche mit Aust Umzüge umgezogen und ich bin absolut begeistert! Das Team war pünktlich, super freundlich und extrem fleißig. Alles wurde sorgfältig und ordentlich eingepackt, abgebaut, transportiert und wieder aufgebaut. Die Jungs haben richtig tolle Arbeit geleistet – schnell, professionell und mit viel Engagement. Ich kann Aust Umzüge wirklich uneingeschränkt weiterempfehlen. Vielen Dank für den reibungslosen, recht spontanen und stressfreien Umzug!',
		},
		{
			author: 'Michael Sack',
			rating: 5,
			date: '2024-11-13', // ~3 months ago
			text: 'Die Haushaltsauflösung hat prima geklappt - von der Kontaktaufnahme über die gemeinsame Besichtigung und das Angebot bis zur Durchführung und Abrechnung. Das Team war pünktlich und sehr sorgfältig und freundlich. Kann ich guten Gewissens weiter empfehlen.',
		},
		{
			author: 'Sabine Winkler',
			rating: 5,
			date: '2024-04-13', // ~10 months ago
			text: 'Vielen herzlichen Dank! Der Umzug von meinem Vater vom Haus in betreutes Wohnen hat hervorragend geklappt - pünktlich, schnell und alle waren sehr vorsichtig mit dem Inventar! War für das Team nicht immer so einfach. Kann ich nur weiterempfehlen und macht weiter so!',
		},
		{
			author: 'Isa Sit',
			rating: 5,
			date: '2022-02-13', // ~3 years ago
			text: 'Ich bin vollends begeistert von dem Service von Aust Umzüge. Ich habe diesmal meinen Umzug in andere (professionelle) Hände gegeben und werde mich beim nächsten wieder an Aust wenden. Die Absprachen waren unkompliziert und einfach, die Beratung kompetent und ich konnte mich völlig auf das Unternehmen verlassen - auch kurzfristige Anfragen wurden noch schnell eingebunden.',
		},
		{
			author: 'Rita Skottky',
			rating: 5,
			date: '2021-02-13', // ~4 years ago
			text: 'Ein sehr kompetentes/professionelles und unheimlich freundliches, zugleich absolut zuverlässiges Team. Ein sehr gutes Preis-Leistungsverhältnis. Der Umzug hat sehr gut geklappt; ebenso die Entrümpelung. Sehr empfehlenswert. Ich möchte mich bei Herrn Aust und seinem Team herzlich bedanken und wünsche alles Gute und weiterhin viel Erfolg.',
		},
	];

	const aggregateRating = {
		ratingValue: 5.0,
		reviewCount: 5,
	};

	// Format date for display
	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));

		if (diffMonths < 1) return 'Vor wenigen Wochen';
		if (diffMonths === 1) return 'Vor 1 Monat';
		if (diffMonths < 12) return `Vor ${diffMonths} Monaten`;
		const diffYears = Math.floor(diffMonths / 12);
		if (diffYears === 1) return 'Vor 1 Jahr';
		return `Vor ${diffYears} Jahren`;
	}
</script>

<svelte:head>
	<!-- Schema.org Structured Data for Rich Snippets -->
	{@html `<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "LocalBusiness",
			"name": "Aust Umzüge & Haushaltsauflösungen",
			"aggregateRating": {
				"@type": "AggregateRating",
				"ratingValue": "${aggregateRating.ratingValue}",
				"reviewCount": "${aggregateRating.reviewCount}",
				"bestRating": "5",
				"worstRating": "1"
			},
			"review": [
				${reviews
					.map(
						(review) => `{
					"@type": "Review",
					"author": {
						"@type": "Person",
						"name": "${review.author}"
					},
					"datePublished": "${review.date}",
					"reviewRating": {
						"@type": "Rating",
						"ratingValue": "${review.rating}",
						"bestRating": "5",
						"worstRating": "1"
					},
					"reviewBody": "${review.text.replace(/"/g, '\\"')}"
				}`
					)
					.join(',')}
			]
		}
	</script>`}
</svelte:head>

<section class="reviews-section">
	<div class="reviews-section__container">
		<div class="reviews-section__header">
			<h2 class="reviews-section__title">Das sagen unsere Kunden</h2>
			<div class="reviews-section__rating">
				<div class="stars">⭐⭐⭐⭐⭐</div>
				<p class="rating-text">
					{aggregateRating.ratingValue} von 5 Sternen ({aggregateRating.reviewCount}
					Bewertungen)
				</p>
			</div>
		</div>

		<div class="reviews-grid">
			{#each reviews as review}
				<article
					class="review-card"
					itemscope
					itemtype="https://schema.org/Review"
				>
					<div class="review-card__header">
						<div class="review-card__author">
							<span
								itemprop="author"
								itemscope
								itemtype="https://schema.org/Person"
							>
								<strong itemprop="name">{review.author}</strong>
							</span>
							<time
								itemprop="datePublished"
								datetime={review.date}
								class="review-card__date"
							>
								{formatDate(review.date)}
							</time>
						</div>
						<div
							class="review-card__stars"
							itemprop="reviewRating"
							itemscope
							itemtype="https://schema.org/Rating"
						>
							<meta itemprop="ratingValue" content={review.rating.toString()} />
							<meta itemprop="bestRating" content="5" />
							<meta itemprop="worstRating" content="1" />
							{'⭐'.repeat(review.rating)}
						</div>
					</div>
					<p itemprop="reviewBody" class="review-card__text">
						{review.text}
					</p>
				</article>
			{/each}
		</div>

		<div class="reviews-section__cta">
			<a
				href="https://maps.app.goo.gl/KUs8ajSyfU6iwEqw9"
				target="_blank"
				rel="noopener noreferrer"
				class="google-reviews-link"
			>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="currentColor"
					style="margin-right: 8px;"
				>
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Alle Bewertungen auf Google ansehen
			</a>
		</div>
	</div>
</section>

<style>
	.reviews-section {
		padding: var(--space-16) var(--container-padding);
		background: linear-gradient(to bottom, #f8fafc 0%, #fff 50%, #f8fafc 100%);
	}

	.reviews-section__container {
		max-width: var(--container-max);
		margin: 0 auto;
	}

	.reviews-section__header {
		text-align: center;
		margin-bottom: var(--space-12);
	}

	.reviews-section__title {
		font-size: var(--text-3xl);
		font-weight: var(--font-bold);
		color: var(--color-info-bar);
		margin: 0 0 var(--space-4) 0;
	}

	.reviews-section__rating {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.stars {
		font-size: 1.5rem;
		line-height: 1;
	}

	.rating-text {
		color: #4a5568;
		font-size: var(--text-base);
		margin: 0;
	}

	/* Reviews Grid */
	.reviews-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-6);
		margin-bottom: var(--space-10);
	}

	.review-card {
		background: #fff;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.review-card:hover {
		border-color: var(--color-nav-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.review-card__header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-4);
		gap: var(--space-3);
	}

	.review-card__author {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.review-card__author strong {
		color: var(--color-info-bar);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
	}

	.review-card__date {
		color: #64748b;
		font-size: var(--text-sm);
	}

	.review-card__stars {
		font-size: 1.25rem;
		color: #fbbf24;
		flex-shrink: 0;
	}

	.review-card__text {
		color: #2d3748;
		line-height: 1.7;
		margin: 0;
		font-size: var(--text-base);
	}

	/* CTA Section */
	.reviews-section__cta {
		text-align: center;
	}

	.google-reviews-link {
		display: inline-flex;
		align-items: center;
		padding: var(--space-4) var(--space-6);
		background: #fff;
		color: #4285f4;
		border: 2px solid #4285f4;
		border-radius: var(--radius-md);
		font-weight: var(--font-semibold);
		font-size: var(--text-base);
		text-decoration: none;
		transition: all var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.google-reviews-link:hover {
		background: #4285f4;
		color: #fff;
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.reviews-section {
			padding: var(--space-12) var(--container-padding);
		}

		.reviews-section__title {
			font-size: var(--text-2xl);
		}

		.reviews-grid {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}

		.review-card__header {
			flex-direction: column;
		}

		.review-card__stars {
			align-self: flex-start;
		}
	}
</style>
