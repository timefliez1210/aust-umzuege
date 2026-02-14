<script lang="ts">
    import { ClipboardList, Package, Home, ShieldCheck, ArrowRight } from "lucide-svelte";
    import CTASection from "$lib/components/CTASection.svelte";

    const guides = [
        {
            title: "Die ultimative Umzugs-Checkliste",
            description:
                "Planen Sie Ihren Umzug Schritt für Schritt. Unsere Checkliste hilft Ihnen, den Überblick zu behalten.",
            icon: ClipboardList,
            link: "/ratgeber/umzugs-checkliste",
        },
        {
            title: "Verpackungstipps vom Profi",
            description:
                "So verpacken Sie Gläser, Geschirr und Bücher sicher. Tipps für schadenfreies Ankommen.",
            icon: Package,
            link: "/ratgeber/verpackungstipps",
        },
        {
            title: "Haushaltsauflösungen und Entrümpelungen",
            description:
                "Praktischer Ratgeber für die komplette Wohnungsräumung. Von der Planung über Transport bis zur Entsorgung.",
            icon: Home,
            link: "/ratgeber/haushaltsaufloesungen-entruempelungen",
        },
        {
            title: "Wie erkenne ich eine seriöse Umzugsfirma?",
            description:
                "Red Flags erkennen, die richtigen Fragen stellen und schwarze Schafe vermeiden. Praktischer Ratgeber mit Checkliste.",
            icon: ShieldCheck,
            link: "/ratgeber/seriose-umzugsfirma",
        },
    ];
</script>

<svelte:head>
    <title>Ratgeber & Tipps | Aust Umzüge Hildesheim</title>
    <meta
        name="description"
        content="Nützliche Tipps und Checklisten rund um den Umzug. Erfahren Sie, wie Sie Ihren Wohnungswechsel stressfrei gestalten."
    />
</svelte:head>

<main class="guides-page">
    <div class="guides-page__container">
        <header class="guides-page__header">
            <h1 class="guides-page__title">Ratgeber & Tipps</h1>
            <p class="guides-page__intro">
                Profitieren Sie von unserer langjährigen Erfahrung. Hier finden
                Sie wertvolle Ratschläge für einen reibungslosen Umzug.
            </p>
        </header>

        <div class="guides-grid">
            {#each guides as guide}
                {@const Icon = guide.icon}
                <div class="guide-card">
                    <div class="guide-card__icon-wrapper">
                        <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <div class="guide-card__content">
                        <h2 class="guide-card__title">{guide.title}</h2>
                        <p class="guide-card__description">
                            {guide.description}
                        </p>
                    </div>
                    <div class="guide-card__actions">
                        <a href={guide.link} class="guide-card__link">
                            Weiterlesen
                            <ArrowRight size={16} />
                        </a>
                    </div>
                </div>
            {/each}
        </div>

        <CTASection
            heading="Haben Sie Fragen?"
            description="Wir beraten Sie gerne persönlich zu allen Details Ihres Umzugs."
            buttonText="Kontakt aufnehmen"
            buttonHref="/kontakt"
        />
    </div>
</main>

<style>
    .guides-page {
        background-color: #f8fafc;
        min-height: 80vh;
        padding-block: var(--space-12);
    }

    .guides-page__container {
        max-width: 1200px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .guides-page__header {
        text-align: center;
        margin-bottom: var(--space-12);
        max-width: 800px;
        margin-inline: auto;
    }

    .guides-page__title {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
        position: relative;
        display: inline-block;
        padding-bottom: var(--space-2);
    }

    .guides-page__title::after {
        content: "";
        display: block;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-nav-accent), #ff8a3d);
        border-radius: var(--radius-full);
        margin: var(--space-3) auto 0;
    }

    .guides-page__intro {
        color: #4a5568;
        font-size: var(--text-lg);
        line-height: 1.6;
    }

    .guides-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: var(--space-6);
        margin-bottom: var(--space-16);
    }

    @media (min-width: 640px) {
        .guides-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .guide-card {
        background-color: #fff;
        border-radius: var(--radius-lg);
        padding: var(--space-8);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        transition:
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
        display: flex;
        flex-direction: column;
        border: 1px solid #f1f5f9;
        height: 100%;
        position: relative;
    }

    .guide-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        border-color: #e2e8f0;
    }

    .guide-card__icon-wrapper {
        width: 56px;
        height: 56px;
        background-color: #f0fdf4; /* Greenish/Fresh for tips */
        color: var(--color-nav-accent); /* Or brand orange */
        color: #16a34a; /* Green for "Go" / Checklist */
        color: var(--color-info-bar); /* Stick to brand */
        background-color: #e0f2fe;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-6);
    }

    .guide-card__title {
        color: var(--color-info-bar);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-3);
    }

    .guide-card__description {
        color: #2d3748;
        font-size: var(--text-base);
        line-height: 1.6;
        margin-bottom: var(--space-6);
        flex: 1;
    }

    .guide-card__actions {
        border-top: 1px solid #f1f5f9;
        padding-top: var(--space-4);
        margin-top: auto;
    }

    .guide-card__link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #c44a00; /* Darker orange for better contrast on white */
        font-weight: var(--font-semibold);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .guide-card__link:hover {
        color: #a03d00; /* Even darker on hover */
        text-decoration: underline;
    }
</style>
