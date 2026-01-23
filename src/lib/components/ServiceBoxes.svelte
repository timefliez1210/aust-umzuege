<script lang="ts">
    // ServiceBoxes - Grid of service category links with hover effect
    interface ServiceBox {
        title: string;
        href: string;
    }

    interface Props {
        services?: ServiceBox[];
    }

    let {
        services = [
            { title: "Umzüge Privat & Gewerbe", href: "/leistungen/umzuege" },
            { title: "Montagen & Demontagen", href: "/leistungen/montagen" },
            {
                title: "Haushaltsauflösungen",
                href: "/leistungen/haushaltsaufloesungen",
            },
            { title: "Weitere Leistungen", href: "/leistungen" },
        ],
    }: Props = $props();
</script>

<section class="service-boxes">
    <div class="service-boxes__grid">
        {#each services as service}
            <a href={service.href} class="service-box">
                <span class="service-box__title">{service.title}</span>
                <span class="service-box__link">
                    Hier mehr erfahren
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </span>
            </a>
        {/each}
    </div>
</section>

<style>
    .service-boxes {
        position: relative;
        margin-top: -60px;
        z-index: 10;
        padding-inline: var(--container-padding);
    }

    .service-boxes__grid {
        max-width: var(--container-max);
        margin-inline: auto;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
    }

    .service-box {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-6) var(--space-5);
        min-height: 120px;
        background-color: var(--color-info-bar);
        text-decoration: none;
        transition: background-color var(--transition-base);
    }

    .service-box:hover {
        background-color: var(--color-nav-accent);
    }

    .service-box__title {
        color: var(--color-text);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        line-height: var(--leading-tight);
    }

    .service-box__link {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: rgba(255, 255, 255, 0.75);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        transition: color var(--transition-fast);
    }

    .service-box:hover .service-box__link {
        color: var(--color-text);
    }

    .service-box__link svg {
        transition: transform var(--transition-fast);
    }

    .service-box:hover .service-box__link svg {
        transform: translateX(4px);
    }

    /* Tablet: 2x2 grid */
    @media (max-width: 900px) {
        .service-boxes__grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Mobile: single column */
    @media (max-width: 500px) {
        .service-boxes {
            margin-top: -40px;
        }

        .service-boxes__grid {
            grid-template-columns: 1fr;
        }

        .service-box {
            min-height: 90px;
            padding: var(--space-5) var(--space-4);
        }
    }
</style>
