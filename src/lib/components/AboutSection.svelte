<script lang="ts">
    // AboutSection - Split layout content section with text and image
    interface Props {
        tagline?: string;
        heading?: string;
        paragraphs?: string[];
        imageSrc?: string;
        imageAlt?: string;
        reversed?: boolean;
    }

    let {
        tagline = "Umzüge und Haushaltsauflösungen",
        heading = "Mehr als nur Umzug – Ihr Spezialist für die schwierigen Fälle",
        paragraphs = [
            "Sie suchen einen Umzugspartner, der mehr kann als nur tragen? Aust Umzüge verbindet professionelle Umzüge und Haushaltsauflösungen mit echtem Fachwissen – dort, wo andere an ihre Grenzen stoßen.",
            "Ihre Einbauküche muss nicht nur ab-, sondern auch wieder fachgerecht aufgebaut werden? Unsere erfahrenen Monteure übernehmen komplexe Küchenmontagen inklusive Arbeitsplatten-Anpassung, Wasser- und Elektroanschluss. Ihre Eltern ziehen ins betreute Wohnen und brauchen mehr als nur einen Transporter? Wir begleiten Seniorenumzüge mit Geduld, Einfühlungsvermögen und einem Komplett-Service vom Einpacken bis zum Einräumen. Sie besitzen hochwertige Möbel, die beim Transport besondere Sorgfalt verlangen? Wir wissen, wie man empfindliche Stücke sicher ans Ziel bringt.",
            "Ob Privatumzug, Firmenumzug oder Haushaltsauflösung – bei uns bekommen Sie alles aus einer Hand: Planung, Organisation, Transport, Montage und auf Wunsch auch die fachgerechte Entsorgung. Von Hildesheim aus arbeiten wir bundesweit und europaweit.",
            "Was uns unterscheidet? Wir nehmen uns Zeit. Für eine ehrliche Beratung vor Ort, für Ihre individuellen Wünsche und für die Details, die einen guten Umzug von einem stressfreien unterscheiden.",
        ],
        imageSrc = "/umziehen-leicht-gemacht-hildesheim-hannover-braunschweig.webp",
        imageAlt = "Aust Umzüge Mitarbeiter beim Umzug",
        reversed = false,
    }: Props = $props();
</script>

<section class="about-section" class:reversed>
    <div class="about-section__container">
        <div class="about-section__content">
            <span class="about-section__tagline">{tagline}</span>
            <h2 class="about-section__heading">{heading}</h2>
            <div class="about-section__text">
                {#each paragraphs as paragraph}
                    <p>{paragraph}</p>
                {/each}
            </div>
        </div>

        <div class="about-section__image-wrapper">
            <div class="about-section__image-container">
                <img
                    src={imageSrc}
                    srcset="{imageSrc.replace('.webp', '')}-400w.webp 400w, {imageSrc.replace('.webp', '')}-500w.webp 500w, {imageSrc.replace('.webp', '')}-600w.webp 600w"
                    sizes="(max-width: 900px) 100vw, 50vw"
                    alt={imageAlt}
                    class="about-section__image"
                    loading="lazy"
                    decoding="async"
                    width="500"
                    height="375"
                />
                <div class="about-section__image-accent"></div>
            </div>
        </div>
    </div>
</section>

<style>
    .about-section {
        padding-block: var(--space-20);
        background-color: var(--color-text);
    }

    .about-section__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-12);
        align-items: center;
    }

    .reversed .about-section__container {
        direction: rtl;
    }

    .reversed .about-section__container > * {
        direction: ltr;
    }

    .about-section__content {
        display: flex;
        flex-direction: column;
        gap: var(--space-5);
    }

    .about-section__tagline {
        display: inline-block;
        color: #c44a00; /* Darker orange for WCAG AA contrast (4.5:1 against white) */
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .about-section__heading {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-2xl), 3.5vw, var(--text-4xl));
        font-weight: var(--font-bold);
        line-height: var(--leading-tight);
        margin: 0;
    }

    .about-section__text {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .about-section__text p {
        color: #4a5568;
        font-size: var(--text-base);
        line-height: 1.75;
        margin: 0;
    }

    .about-section__image-wrapper {
        display: flex;
        justify-content: center;
    }

    .about-section__image-container {
        position: relative;
        width: 100%;
        max-width: 500px;
    }

    .about-section__image {
        width: 100%;
        height: auto;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        position: relative;
        z-index: 2;
    }

    .about-section__image-accent {
        position: absolute;
        inset: 20px -20px -20px 20px;
        background: linear-gradient(
            135deg,
            var(--color-info-bar) 0%,
            #2d5a87 100%
        );
        border-radius: var(--radius-lg);
        z-index: 1;
    }

    /* Mobile Responsive */
    @media (max-width: 900px) {
        .about-section {
            padding-block: var(--space-12);
        }

        .about-section__container {
            grid-template-columns: 1fr;
            gap: var(--space-10);
        }

        .reversed .about-section__container {
            direction: ltr;
        }

        .about-section__image-container {
            max-width: 400px;
        }

        .about-section__image-accent {
            inset: 15px -15px -15px 15px;
        }
    }

    @media (max-width: 500px) {
        .about-section__image-accent {
            inset: 10px -10px -10px 10px;
        }
    }
</style>
