<script lang="ts">
	const articles = [
		{
			title: "Umzugs-Checkliste",
			description: "Strukturierter Plan für Ihren Umzug: Was Sie 4 Wochen, 1 Woche und am Umzugstag beachten müssen.",
			href: "/ratgeber/umzugs-checkliste",
			linkText: "Zur Umzugs-Checkliste",
		},
		{
			title: "Verpackungstipps vom Profi",
			description: "Geschirr, Elektronik und Möbel sicher verpacken – mit Profi-Tricks vom Umzugsunternehmen.",
			href: "/ratgeber/verpackungstipps",
			linkText: "Verpackungstipps lesen",
		},
		{
			title: "Haushaltsauflösungen & Entrümpelungen",
			description: "Praktischer Ratgeber zu Transport, Entsorgung und realistischer Zeitplanung.",
			href: "/ratgeber/haushaltsaufloesungen-entruempelungen",
			linkText: "Ratgeber Haushaltsauflösung",
		},
		{
			title: "Seriöse Umzugsfirma erkennen",
			description: "Red Flags erkennen, die richtigen Fragen stellen und schwarze Schafe vermeiden.",
			href: "/ratgeber/seriose-umzugsfirma",
			linkText: "Ratgeber Umzugsfirmen",
		},
		{
			title: "Messie-Wohnung entrümpeln",
			description: "DIY-Ratgeber für extreme Unordnung: Gesundheits-Check, Sortiersystem, Schutzausrüstung und Entsorgungsplan.",
			href: "/ratgeber/messie-wohnung-raeumen",
			linkText: "Ratgeber Messie-Wohnung",
		},
		{
			title: "Umzug mit Kindern",
			description: "Altergerechte Vorbereitung, Abschiedsrituale und Tipps für den Schulwechsel in Hildesheim.",
			href: "/ratgeber/umzug-mit-kindern",
			linkText: "Ratgeber Umzug mit Kindern",
		},
		{
			title: "Möbel einlagern",
			description: "Kosten pro Quadratmeter, Lageroptionen und Vorbereitung: Welche Einlagerungsarten es gibt und wie Sie Möbel schadensfrei lagern.",
			href: "/ratgeber/moebel-einlagern",
			linkText: "Ratgeber Einlagerung",
		},
	];
</script>

<section class="ratgeber-teaser">
	<div class="ratgeber-teaser__container">
		<div class="ratgeber-teaser__header">
			<span class="ratgeber-teaser__tagline">Wissen & Tipps</span>
			<h2 class="ratgeber-teaser__heading">Ratgeber für Umzüge, Haushaltsauflösungen, Entrümpelungen und vieles mehr</h2>
		</div>

		<div class="ratgeber-teaser__grid">
			{#each articles as article}
				<a href={article.href} class="ratgeber-card">
					<h3 class="ratgeber-card__title">{article.title}</h3>
					<p class="ratgeber-card__description">{article.description}</p>
					<span class="ratgeber-card__link">
						{article.linkText}
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
							<line x1="5" y1="12" x2="19" y2="12"></line>
							<polyline points="12 5 19 12 12 19"></polyline>
						</svg>
					</span>
				</a>
			{/each}
		</div>

		<div class="ratgeber-teaser__cta">
			<a href="/ratgeber" class="ratgeber-teaser__all-link">
				Alle Ratgeber-Artikel
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
					<line x1="5" y1="12" x2="19" y2="12"></line>
					<polyline points="12 5 19 12 12 19"></polyline>
				</svg>
			</a>
		</div>
	</div>
</section>

<style>
	.ratgeber-teaser {
		padding-block: var(--space-16);
		background: #fff;
	}

	.ratgeber-teaser__container {
		max-width: var(--container-max);
		margin-inline: auto;
		padding-inline: var(--container-padding);
	}

	.ratgeber-teaser__header {
		margin-bottom: var(--space-10);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.ratgeber-teaser__tagline {
		color: #c44a00;
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.ratgeber-teaser__heading {
		color: var(--color-info-bar);
		font-size: clamp(var(--text-2xl), 3.5vw, var(--text-4xl));
		font-weight: var(--font-bold);
		margin: 0;
	}

	.ratgeber-teaser__grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-6);
		margin-bottom: var(--space-8);
	}

	.ratgeber-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-6);
		background: #f8fafc;
		border: 2px solid #e2e8f0;
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: inherit;
		transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
	}

	.ratgeber-card:hover {
		border-color: var(--color-nav-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
		color: inherit;
	}

	.ratgeber-card__title {
		color: var(--color-info-bar);
		font-size: var(--text-lg);
		font-weight: var(--font-bold);
		margin: 0;
	}

	.ratgeber-card__description {
		color: #4a5568;
		font-size: var(--text-sm);
		line-height: 1.6;
		margin: 0;
		flex: 1;
	}

	.ratgeber-card__link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--color-nav-accent);
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		transition: gap var(--transition-fast);
	}

	.ratgeber-card:hover .ratgeber-card__link {
		gap: var(--space-3);
	}

	.ratgeber-teaser__cta {
		text-align: center;
	}

	.ratgeber-teaser__all-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-6);
		background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
		color: var(--color-text);
		font-weight: var(--font-semibold);
		font-size: var(--text-sm);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition: transform var(--transition-fast), box-shadow var(--transition-fast);
	}

	.ratgeber-teaser__all-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
		color: var(--color-text);
	}

	@media (max-width: 640px) {
		.ratgeber-teaser__grid {
			grid-template-columns: 1fr;
		}

		.ratgeber-teaser__header {
			text-align: center;
			align-items: center;
		}
	}
</style>
