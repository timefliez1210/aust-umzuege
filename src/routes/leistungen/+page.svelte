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
        Warehouse,
        ArrowRight,
        Mail,
    } from "lucide-svelte";

    const services = [
        {
            title: "Privatumzug",
            description:
                "Stressfreier Wohnungswechsel für Singles, Paare und Familien. Wir kümmern uns um Ihr Hab und Gut.",
            icon: Home,
            link: "/leistungen/privatumzug",
        },
        {
            title: "Firmenumzug",
            description:
                "Professionelle Büro- und Objektumzüge mit minimaler Ausfallzeit für Ihr Unternehmen.",
            icon: Building2,
            link: "/leistungen/firmenumzug",
        },
        {
            title: "Fern- & Überseeumzug",
            description:
                "Sicherer Transport über weite Distanzen und Grenzen hinweg. Logistik aus einer Hand.",
            icon: Globe,
            link: "/leistungen/fern-ueberseeumzug",
        },
        {
            title: "Seniorenumzug",
            description:
                "Einfühlsamer und umfassender Service für den Umzug ins betreute Wohnen oder Seniorenheim.",
            icon: HeartHandshake,
            link: "/leistungen/seniorenumzug",
        },
        {
            title: "Umzugshelfer",
            description:
                "Kräftige Unterstützung beim Tragen, Beladen und Entladen – auch ohne LKW-Buchung.",
            icon: Users,
            link: "/leistungen/umzugshelfer",
        },
        {
            title: "Halteverbot",
            description:
                "Beantragung und Einrichtung offizieller Halteverbotszonen für einen reibungslosen Ablauf.",
            icon: Ban,
            link: "/leistungen/halteverbot",
        },
        {
            title: "Umzugsberatung",
            description:
                "Kostenlose Besichtigung und individuelle Planung für ein maßgeschneidertes Angebot.",
            icon: MessageSquare,
            link: "/leistungen/umzugsberatung",
        },
        {
            title: "Demontage & Montage",
            description:
                "Fachgerechter Abbau und Aufbau Ihrer Möbel und Küchen durch erfahrenes Personal.",
            icon: Wrench,
            link: "/leistungen/montage",
        },
        {
            title: "Haushaltsauflösungen",
            description:
                "Besenreine Räumung und fachgerechte Entsorgung von Sperrmüll und Altlasten.",
            icon: Trash2,
            link: "/leistungen/haushaltsaufloesung",
        },
        {
            title: "Lagerung & Einlagerung",
            description:
                "Sichere Lagerung für Ihre Möbel – ob kurzfristig beim Umzug oder langfristig.",
            icon: Warehouse,
            link: "/leistungen/lagerung",
        },
    ];
</script>

<svelte:head>
    <title>Unsere Leistungen | Aust Umzüge Hildesheim</title>
    <meta
        name="description"
        content="Alle Leistungen von Aust Umzüge auf einen Blick: Privatumzug, Firmenumzug, Montage, Entrümpelung und mehr."
    />
</svelte:head>

<main class="services-page">
    <div class="services-page__container">
        <header class="services-page__header">
            <h1 class="services-page__title">Unsere Leistungen</h1>
            <p class="services-page__intro">
                Wir bieten Ihnen ein umfassendes Spektrum an Dienstleistungen
                rund um Umzug und Transport. Maßgeschneidert auf Ihre
                individuellen Bedürfnisse.
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
                        <a href="/kontakt" class="service-card__link contact">
                            Direkt anfragen
                            <Mail size={16} />
                        </a>
                    </div>
                </div>
            {/each}
        </div>

        <section class="services-cta">
            <h2 class="services-cta__heading">Planen Sie einen Umzug?</h2>
            <p class="services-cta__text">
                Nutzen Sie unseren Online-Rechner für ein schnelles Angebot.
            </p>
            <a href="/kostenloses-angebot" class="cta-button">
                Kostenloses Angebot
            </a>
        </section>
    </div>
</main>

<style>
    .services-page {
        background-color: #f8fafc;
        min-height: 80vh;
        padding-block: var(--space-12);
    }

    .services-page__container {
        max-width: 1200px;
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
    }

    .service-card__link.contact:hover {
        color: #d84a00;
        text-decoration: underline;
    }

    /* Bottom CTA */
    .services-cta {
        background-color: var(--color-info-bar);
        border-radius: var(--radius-lg);
        padding: var(--space-10) var(--space-6);
        text-align: center;
        color: #fff;
    }

    .services-cta__heading {
        font-size: var(--text-3xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
        color: #fff;
    }

    .services-cta__text {
        font-size: var(--text-lg);
        font-weight: var(--font-medium);
        margin-bottom: var(--space-8);
        max-width: 600px;
        margin-inline: auto;
    }

    .cta-button {
        display: inline-block;
        background-color: var(--color-nav-accent);
        color: #fff;
        padding: var(--space-3) var(--space-8);
        border-radius: var(--radius-md);
        font-weight: var(--font-bold);
        text-decoration: none;
        transition:
            background-color var(--transition-fast),
            transform var(--transition-fast);
        will-change: transform;
    }

    .cta-button:hover {
        background-color: #d84a00;
        transform: translate3d(0, -2px, 0);
    }
</style>
