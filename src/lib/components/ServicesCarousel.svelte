<script lang="ts">
    // ServicesCarousel - Dynamic carousel for service cards
    interface ServiceItem {
        image: string;
        title: string;
        description: string;
        href: string;
    }

    interface Props {
        tagline?: string;
        heading?: string;
        ctaText?: string;
        ctaHref?: string;
        services?: ServiceItem[];
        visibleCards?: number;
    }

    let {
        tagline = "Umzüge, Entrümpelung und Haushaltsauflösungen",
        heading = "Alle Leistungen im Überblick",
        ctaText = "Leistungen",
        ctaHref = "/leistungen",
        services = [
            {
                image: "/privatumzuege-hildesheim-carousel-1.webp",
                title: "Privatumzüge",
                description:
                    "Ihr Privatumzug in professionellen Händen – von der Planung bis zum Einräumen. Von Hildesheim aus bundesweit und europaweit.",
                href: "/leistungen/privatumzug",
            },
            {
                image: "/umzuege-hildesheim-carousel-1.webp",
                title: "Gewerbe & Firmenumzüge",
                description:
                    "Firmenumzüge mit minimaler Ausfallzeit. Wir planen und koordinieren den Umzug Ihres Unternehmens – termingerecht und zuverlässig.",
                href: "/leistungen/firmenumzug",
            },
            {
                image: "/montagen-demontagen-carousel-2.webp",
                title: "Montagen & Demontagen",
                description:
                    "Unsere Monteure bauen auch komplexe Küchen und Möbelsysteme fachgerecht ab und am neuen Standort wieder auf – inklusive Anpassungen.",
                href: "/leistungen/montage",
            },
            {
                image: "/Haushaltsaufloesungen-Entruempelungen-carousel-3.webp",
                title: "Haushaltsauflösungen",
                description:
                    "Wir lösen Haushalte diskret auf und entrümpeln Keller, Dachboden oder Garage. Mit Wertanrechnung, fachgerechter Entsorgung und besenreiner Übergabe.",
                href: "/leistungen/haushaltsaufloesung",
            },
            {
                image: "/einlagerung-service-hildesheim-carousel-4.webp",
                title: "Lagerung & Einlagerung",
                description:
                    "Sichere Lagerung für Ihre Möbel – ob kurzfristig oder langfristig. Flexible Laufzeiten, faire Konditionen.",
                href: "/leistungen/lagerung",
            },
            {
                image: "/seniorenumzuege-hildesheim-carousel-6.webp",
                title: "Seniorenumzüge",
                description:
                    "Wir begleiten den Umzug ins betreute Wohnen mit Geduld und Sorgfalt. Vom Einpacken bis zum Einrichten – alles aus einer Hand.",
                href: "/leistungen/seniorenumzug",
            },
        ],
        visibleCards = 3,
    }: Props = $props();

    let currentIndex = $state(0);
    let carouselRef: HTMLElement;

    const maxIndex = $derived(Math.max(0, services.length - visibleCards));
    const dots = $derived(Array.from({ length: maxIndex + 1 }, (_, i) => i));

    function next() {
        currentIndex = Math.min(currentIndex + 1, maxIndex);
    }

    function prev() {
        currentIndex = Math.max(currentIndex - 1, 0);
    }

    function goTo(index: number) {
        currentIndex = Math.min(Math.max(index, 0), maxIndex);
    }
</script>

<section class="services-carousel">
    <div class="services-carousel__header">
        <div class="services-carousel__header-content">
            <span class="services-carousel__tagline">{tagline}</span>
            <h2 class="services-carousel__heading">{heading}</h2>
            <a href={ctaHref} class="services-carousel__cta">{ctaText}</a>
        </div>
    </div>

    {#if dots.length > 1}
        <div class="services-carousel__dots">
            {#each dots as dot, i}
                <button
                    class="services-carousel__dot"
                    class:active={currentIndex === i}
                    onclick={() => goTo(i)}
                    aria-label={`Gehe zu Slide ${i + 1}`}
                ></button>
            {/each}
        </div>
    {/if}

    <div class="services-carousel__wrapper">
        <button
            class="services-carousel__nav services-carousel__nav--prev"
            onclick={prev}
            disabled={currentIndex === 0}
            aria-label="Vorheriger Slide"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
            >
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>

        <div class="services-carousel__viewport" bind:this={carouselRef}>
            <div
                class="services-carousel__track"
                style="transform: translateX(calc(-{currentIndex} * (100% / {visibleCards} + var(--gap) / {visibleCards})))"
            >
                {#each services as service}
                    <article class="service-card">
                        <div class="service-card__image-wrapper">
                            <img
                                src={service.image}
                                srcset="{service.image.replace('.webp', '')}-400w.webp 400w, {service.image.replace('.webp', '')}-600w.webp 600w, {service.image.replace('.webp', '')}-800w.webp 800w"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                alt={service.title}
                                class="service-card__image"
                                loading="lazy"
                                decoding="async"
                                width="800"
                                height="600"
                            />
                            <a
                                href={service.href}
                                class="service-card__title-link"
                            >
                                {service.title}
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"
                                    ></polyline>
                                </svg>
                            </a>
                        </div>
                        <p class="service-card__description">
                            {service.description}
                        </p>
                        <a href={service.href} class="service-card__link" aria-label="Mehr erfahren über {service.title}">
                            Hier mehr erfahren
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </article>
                {/each}
            </div>
        </div>

        <button
            class="services-carousel__nav services-carousel__nav--next"
            onclick={next}
            disabled={currentIndex === maxIndex}
            aria-label="Nächster Slide"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
            >
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
    </div>
</section>

<style>
    .services-carousel {
        --gap: var(--space-6);
        padding-block: var(--space-16);
        background: linear-gradient(180deg, var(--color-text) 0%, #f8fafc 100%);
        overflow: hidden;
    }

    .services-carousel__header {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        margin-bottom: var(--space-10);
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        flex-wrap: wrap;
        gap: var(--space-6);
    }

    .services-carousel__header-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .services-carousel__tagline {
        color: #c44a00; /* Darker orange for WCAG AA contrast */
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .services-carousel__heading {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-2xl), 3.5vw, var(--text-4xl));
        font-weight: var(--font-bold);
        margin: 0;
    }

    .services-carousel__cta {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        margin-top: var(--space-2);
        padding: var(--space-3) var(--space-6);
        background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
        color: var(--color-text);
        font-weight: var(--font-semibold);
        font-size: var(--text-sm);
        text-decoration: none;
        border-radius: var(--radius-md);
        transition:
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
    }

    .services-carousel__cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
        color: var(--color-text);
    }

    .services-carousel__dots {
        display: flex;
        justify-content: center;
        gap: var(--space-2);
        margin-bottom: var(--space-8);
    }

    .services-carousel__dot {
        width: 24px;
        height: 24px;
        border-radius: var(--radius-full);
        background-color: transparent;
        border: none;
        cursor: pointer;
        transition:
            background-color var(--transition-fast),
            transform var(--transition-fast);
        position: relative;
    }

    /* Visual dot inside touch target */
    .services-carousel__dot::after {
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

    .services-carousel__dot:hover::after {
        background-color: #94a3b8;
    }

    .services-carousel__dot.active::after {
        background-color: var(--color-info-bar);
        transform: translate(-50%, -50%) scale(1.2);
    }

    .services-carousel__wrapper {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        position: relative;
        display: flex;
        align-items: center;
        gap: var(--space-4);
    }

    .services-carousel__nav {
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
        transition:
            background-color var(--transition-fast),
            transform var(--transition-fast);
        box-shadow: var(--shadow-md);
    }

    .services-carousel__nav:hover:not(:disabled) {
        background-color: #d84a00;
        transform: scale(1.05);
    }

    .services-carousel__nav:disabled {
        background-color: #e2e8f0;
        color: #94a3b8;
        cursor: not-allowed;
    }

    .services-carousel__viewport {
        flex: 1;
        overflow: hidden;
    }

    .services-carousel__track {
        display: flex;
        gap: var(--gap);
        transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .service-card {
        flex: 0 0 calc((100% - var(--gap) * 2) / 3);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .service-card__image-wrapper {
        position: relative;
        border-radius: var(--radius-lg);
        overflow: hidden;
        aspect-ratio: 4 / 3;
    }

    .service-card__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-base);
    }

    .service-card:hover .service-card__image {
        transform: scale(1.05);
    }

    .service-card__title-link {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-2);
        padding: var(--space-4);
        background: linear-gradient(
            135deg,
            var(--color-info-bar) 0%,
            #2d5a87 100%
        );
        color: var(--color-text);
        font-weight: var(--font-semibold);
        font-size: var(--text-base);
        text-decoration: none;
        transition: background-color var(--transition-fast);
    }

    .service-card__title-link:hover {
        background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
        color: var(--color-text);
    }

    .service-card__title-link svg {
        flex-shrink: 0;
    }

    .service-card__description {
        color: #4a5568;
        font-size: var(--text-sm);
        line-height: 1.7;
        margin: 0;
        flex: 1;
    }

    .service-card__link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-nav-accent);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-decoration: none;
        transition: gap var(--transition-fast);
    }

    .service-card__link:hover {
        gap: var(--space-3);
        text-decoration: underline;
    }

    /* Tablet: 2 cards */
    @media (max-width: 1024px) {
        .service-card {
            flex: 0 0 calc((100% - var(--gap)) / 2);
        }
    }

    /* Mobile: 1 card, hide arrows */
    @media (max-width: 640px) {
        .services-carousel__wrapper {
            gap: 0;
        }

        .services-carousel__nav {
            display: none;
        }

        .service-card {
            flex: 0 0 100%;
        }
    }
</style>
