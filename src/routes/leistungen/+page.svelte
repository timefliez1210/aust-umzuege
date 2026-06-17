<script lang="ts">
    import {
        Home,
        Building2,
        Globe,
        HeartHandshake,
        Users,
        Ban,
        MessageSquare,
        Wrench,
        Trash2,
        Archive,
        Warehouse,
        Stethoscope,
        BookMarked,
        Paintbrush,
        Hammer,
        ArrowUpFromLine,
        ArrowRight,
        Mail,
    } from "lucide-svelte";
    import CTASection from "$lib/components/CTASection.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { leistungenOverview, createBreadcrumbs } from "$lib/data/structuredData";
    import { openContactFlow } from "$lib/stores/contactFlow.svelte";

    const services = [
        {
            title: "Privatumzug",
            description: "Wohnungswechsel zum Festpreis – mit Versicherungsschutz.",
            icon: Home,
            link: "/leistungen/privatumzug",
        },
        {
            title: "Firmenumzug",
            description: "Büro- und Objektumzüge mit minimaler Ausfallzeit.",
            icon: Building2,
            link: "/leistungen/firmenumzug",
        },
        {
            title: "Fern- & Überseeumzug",
            description: "Sicherer Transport über lange Distanzen und Grenzen.",
            icon: Globe,
            link: "/leistungen/fern-ueberseeumzug",
        },
        {
            title: "Seniorenumzug",
            description: "Einfühlsam ins betreute Wohnen oder Pflegeheim.",
            icon: HeartHandshake,
            link: "/leistungen/seniorenumzug",
        },
        {
            title: "Umzugshelfer",
            description: "Versicherte Tragehilfe – stundenweise buchbar.",
            icon: Users,
            link: "/leistungen/umzugshelfer",
        },
        {
            title: "Möbellift mieten",
            description: "Elektrisch, leise & abgasfrei – ab 90 € pro Stunde.",
            icon: ArrowUpFromLine,
            link: "/leistungen/moebellift",
        },
        {
            title: "Halteverbot",
            description: "Beantragung und Aufstellung der Halteverbotszone.",
            icon: Ban,
            link: "/leistungen/halteverbot",
        },
        {
            title: "Umzugsberatung",
            description: "Kostenlose Besichtigung mit individueller Planung.",
            icon: MessageSquare,
            link: "/leistungen/umzugsberatung",
        },
        {
            title: "Demontage & Montage",
            description: "Fachgerechter Auf- und Abbau von Möbeln und Küchen.",
            icon: Wrench,
            link: "/leistungen/montage",
        },
        {
            title: "Haushaltsauflösung",
            description: "Diskrete Wohnungsauflösung mit Wertanrechnung.",
            icon: Trash2,
            link: "/leistungen/haushaltsaufloesung",
        },
        {
            title: "Entrümpelung",
            description: "Keller, Dachboden, Garage oder Messie-Wohnung räumen.",
            icon: Archive,
            link: "/leistungen/entruempelung",
        },
        {
            title: "Lagerung & Einlagerung",
            description: "Kurz- oder langfristige Möbellagerung.",
            icon: Warehouse,
            link: "/leistungen/lagerung",
        },
        {
            title: "Praxisumzug",
            description: "Arzt- und Zahnarztpraxen DSGVO-konform umziehen.",
            icon: Stethoscope,
            link: "/leistungen/praxisumzug",
        },
        {
            title: "Archiv-Montage & Demontage",
            description: "Stand-, Fach- und Rollregale, deutschlandweit.",
            icon: BookMarked,
            link: "/leistungen/archiv-montage",
        },
        {
            title: "Malerarbeiten beim Umzug",
            description: "Übergabe-Ausbesserungen selbst, Komplett über Meisterbetrieb-Partner.",
            icon: Paintbrush,
            link: "/leistungen/malerarbeiten",
        },
        {
            title: "Renovierungsarbeiten beim Umzug",
            description: "Maler, Boden, Elektro, Sanitär – koordiniert über Meisterbetriebe.",
            icon: Hammer,
            link: "/leistungen/renovierungsarbeiten",
        },
    ];

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen" }
    ]);
</script>

<MetaTags
    title="Leistungen — Umzug, Seniorenumzug & Entrümpelung Hildesheim"
    description="Privatumzug, Firmenumzug, Seniorenumzug, Haushaltsauflösung & Entrümpelung in Hildesheim — alle Leistungen zum Festpreis nach kostenloser Vor-Ort-Besichtigung."
    keywords="Umzugsservice Hildesheim, Umzugsleistungen Hildesheim"
    canonical="https://www.aust-umzuege.de/leistungen"
/>

<StructuredData schema={leistungenOverview} />
<StructuredData schema={breadcrumbs} />

<main class="services-page">
    <div class="services-page__container">
        <header class="services-page__header">
            <h1 class="services-page__title">Umzugsservice Hildesheim – Alle Leistungen</h1>
            <p class="services-page__intro">
                Ihr kompletter Umzugsservice aus Hildesheim: Privatumzug, Firmenumzug, Seniorenumzug,
                Haushaltsauflösung und mehr – alles aus einer Hand, mit eigenen Mitarbeitern und
                Festpreisgarantie. Auf dieser Seite finden Sie alle Umzugsleistungen im Überblick.
                Klicken Sie auf eine Leistung für Details, Preisbeispiele und häufige Fragen.
            </p>
        </header>

        <div class="services-grid">
            {#each services as service}
                {@const Icon = service.icon}
                <div class="service-card">
                    <div class="service-card__icon-wrapper">
                        <Icon size={32} strokeWidth={1.5} />
                    </div>
                    <div class="service-card__content">
                        <h2 class="service-card__title">{service.title}</h2>
                        <p class="service-card__description">
                            {service.description}
                        </p>
                    </div>
                    <div class="service-card__actions">
                        <a
                            href={service.link}
                            class="service-card__link details"
                        >
                            Details
                            <ArrowRight size={16} />
                        </a>
                        <button
                            onclick={() => openContactFlow('picker')}
                            class="service-card__link contact"
                        >
                            Direkt anfragen
                            <Mail size={16} />
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        <section class="why-section">
            <h2 class="why-section__title">Warum unser Umzugsservice in Hildesheim?</h2>
            <p>
                Eine überregionale Umzugsfirma kennt Ihre Stadt nicht. Wir schon. Wir wissen,
                wo in der Innenstadt das Halteverbot zwei Wochen vorher beim Bauamt beantragt
                werden muss, welche Altbauten am Moritzberg keinen Aufzug haben und welche
                Gründerzeit-Treppenhäuser in der Nordstadt zu schmal für den Standard-Möbellift sind.
                Diese lokale Erfahrung spart Zeit, Geld und Nerven – und ist der Grund, warum sich
                unsere Kunden in Hildesheim seit Jahren auf uns verlassen.
            </p>
            <p>
                Was uns von vielen anderen Umzugsunternehmen unterscheidet: Wir arbeiten mit eigenen
                festangestellten Mitarbeitern, nicht mit Tagelöhnern oder Subunternehmern. Das heißt:
                dieselben Gesichter bei der Besichtigung wie am Umzugstag, geschultes Personal,
                klare Verantwortung. Schäden – sollten sie passieren – sind über unsere
                Betriebshaftpflicht und Transportversicherung vollständig abgedeckt.
                Sie haften nicht und müssen nicht selbst nachverhandeln.
            </p>
            <p>
                Unser Festpreis ist ein echter Festpreis. Wir besichtigen Ihren Haushalt kostenlos vor Ort,
                kalkulieren sorgfältig und nennen Ihnen einen Preis, der auch dann gilt, wenn der Umzug
                eine Stunde länger dauert oder das Treppenhaus enger ist als gedacht. Keine Überraschungen
                auf der Rechnung – ein Punkt, den Sie in vielen Bewertungen unserer Kunden wiederfinden.
            </p>

            <h3 class="why-section__subtitle">Unser Umzugsservice umfasst</h3>
            <p>
                Den klassischen <a href="/leistungen/privatumzug">Privatumzug</a> innerhalb Hildesheims oder
                deutschlandweit, <a href="/leistungen/firmenumzug">Firmenumzüge</a> mit minimaler Ausfallzeit,
                <a href="/leistungen/seniorenumzug">Seniorenumzüge</a> ins betreute Wohnen,
                <a href="/leistungen/haushaltsaufloesung">Haushaltsauflösungen</a> nach Todesfall oder Pflegeheim-Umzug
                sowie <a href="/leistungen/entruempelung">Entrümpelungen</a> von Keller, Dachboden oder Messie-Wohnungen.
                Dazu Zusatzleistungen wie <a href="/leistungen/halteverbot">Halteverbot</a>,
                <a href="/leistungen/montage">Möbelmontage</a> und <a href="/leistungen/lagerung">Einlagerung</a> –
                alles aus einer Hand, von einem Ansprechpartner koordiniert.
            </p>
            <p>
                Spezialaufträge wie <a href="/leistungen/praxisumzug">Praxisumzüge</a> mit DSGVO-konformem
                Aktentransport, <a href="/leistungen/archiv-montage">Archiv-Montagen</a> für andere Umzugsunternehmen
                oder <a href="/leistungen/fern-ueberseeumzug">Fern- und Überseeumzüge</a> übernehmen wir ebenfalls.
                Eine vollständige Übersicht aller Leistungen finden Sie unten – jede mit eigener Detailseite,
                konkreten Preisbeispielen und Antworten auf häufige Fragen.
            </p>
        </section>

        <CTASection
            heading="Planen Sie einen Umzug?"
            description="Nutzen Sie unseren Online-Rechner für ein schnelles Angebot."
            buttonText="Kostenloses Angebot"
            buttonHref="/kostenloses-angebot"
        />
    </div>
</main>

<style>
    .services-page {
        background-color: #f8fafc;
        min-height: 80vh;
        padding-block: var(--space-12);
    }

    .services-page__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    /* Header */
    .services-page__header {
        text-align: center;
        margin-bottom: var(--space-12);
        max-width: 800px;
        margin-inline: auto;
    }

    .services-page__title {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
        position: relative;
        display: inline-block;
        padding-bottom: var(--space-2);
    }

    .services-page__title::after {
        content: "";
        display: block;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-nav-accent), #ff8a3d);
        border-radius: var(--radius-full);
        margin: var(--space-3) auto 0;
    }

    .services-page__intro {
        color: #4a5568;
        font-size: var(--text-lg);
        line-height: 1.6;
    }

    .why-section {
        margin: var(--space-16) 0;
        padding: var(--space-8);
        background-color: #fff;
        border: 1px solid #f1f5f9;
        border-radius: var(--radius-lg);
    }

    .why-section__title {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-2xl), 3vw, var(--text-3xl));
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
    }

    .why-section__subtitle {
        color: var(--color-info-bar);
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        margin-top: var(--space-8);
        margin-bottom: var(--space-3);
    }

    .why-section p {
        color: #4a5568;
        font-size: var(--text-base);
        line-height: 1.7;
        margin-bottom: var(--space-4);
    }

    .why-section a {
        color: var(--color-nav-accent);
        text-decoration: underline;
        font-weight: var(--font-semibold);
    }

    .why-section a:hover {
        color: var(--color-info-bar);
    }

    /* Grid */
    .services-grid {
        display: grid;
        grid-template-columns: repeat(1, 1fr);
        gap: var(--space-6);
        margin-bottom: var(--space-16);
    }

    @media (min-width: 640px) {
        .services-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 1024px) {
        .services-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    /* Card */
    .service-card {
        background-color: #fff;
        border-radius: var(--radius-lg);
        padding: var(--space-8);
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03);
        transition:
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
        display: flex;
        flex-direction: column;
        height: 100%;
        border: 1px solid #f1f5f9;
        position: relative;
        overflow: hidden;
        /* Performance optimizations */
        will-change: transform;
        contain: layout style paint;
    }

    .service-card:hover {
        transform: translate3d(0, -5px, 0);
        box-shadow:
            0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
        border-color: #e2e8f0;
    }

    .service-card::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background-color: var(--color-info-bar);
        transform: scale3d(0, 1, 1);
        transform-origin: left;
        transition: transform var(--transition-normal);
        will-change: transform;
    }

    .service-card:hover::before {
        transform: scale3d(1, 1, 1);
    }

    .service-card__icon-wrapper {
        width: 64px;
        height: 64px;
        background-color: #eff6ff;
        color: var(--color-info-bar);
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-6);
        transition:
            background-color var(--transition-fast),
            color var(--transition-fast);
        will-change: background-color;
    }

    .service-card:hover .service-card__icon-wrapper {
        background-color: var(--color-nav-accent);
        color: #fff;
    }

    .service-card__content {
        flex: 1;
    }

    .service-card__title {
        color: var(--color-info-bar);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-3);
    }

    .service-card__description {
        color: #64748b;
        font-size: var(--text-base);
        line-height: 1.6;
        margin-bottom: var(--space-6);
    }

    .service-card__actions {
        border-top: 1px solid #f1f5f9;
        padding-top: var(--space-4);
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        flex-wrap: wrap;
    }

    .service-card__link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        font-weight: var(--font-semibold);
        text-decoration: none;
        transition: color var(--transition-fast);
        font-size: var(--text-sm);
    }

    .service-card__link.details {
        color: #64748b;
    }

    /* Stretched link - makes entire card clickable */
    .service-card__link.details::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
    }

    .service-card__link.details:hover {
        color: var(--color-info-bar);
    }

    .service-card__link.contact {
        color: var(--color-nav-accent);
        position: relative;
        z-index: 2; /* Above the stretched link */
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
    }

    .service-card__link.contact:hover {
        color: #d84a00;
        text-decoration: underline;
    }

    /* Bottom CTA */
</style>
