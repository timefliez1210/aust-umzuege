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
        tagline = "Vollservice-Umzugsunternehmen aus Hildesheim",
        heading = "Ihr Umzugsunternehmen aus Hildesheim: pünktlich, sorgfältig, persönlich",
        paragraphs = [
            "Aust Umzüge ist Ihr Vollservice-Umzugsunternehmen aus Hildesheim. Privatumzug, Firmenumzug, Seniorenumzug, Haushaltsauflösung, Möbelmontage und Einlagerung – alles aus einer Hand, vom selben Team koordiniert. Wir arbeiten mit eigenen festangestellten Mitarbeitern statt Tagelöhnern und nehmen uns die Zeit, jeden Auftrag persönlich vor Ort zu besichtigen. Daraus kalkulieren wir ehrlich – manchmal sagen wir auch, dass ein 3,5-Tonner reicht, wenn andere mit einem 7,5-Tonner kommen würden. Was Sie im Kostenvoranschlag lesen, steht auch auf der Endrechnung.",
            "Über 70 Fünf-Sterne-Bewertungen wiederholen drei Dinge in fast jedem Text: pünktlich, sorgfältig, freundlich. Das ist kein Marketing-Versprechen, sondern Arbeitsweise. Möbel werden professionell verpackt, mit Tragegurten gesichert und auch nach 100 oder 350 Kilometern Fahrt unbeschädigt entladen. Wo eine schwere Druckmaschine durch einen engen Flur muss, tragen zwei Mitarbeiter mit Gurten – und zwei weitere stützen ihnen den Rücken. So sehen die Details aus, die einen Umzug ohne Kratzer von einem Umzug mit Schadensliste unterscheiden.",
            "Aust Umzüge ist inhabergeführt. Bei der kostenlosen Vor-Ort-Besichtigung kommt Alex Aust selbst vorbei. Er schätzt das Volumen ein, erstellt das Festpreisangebot und koordiniert den Auftrag. Per Telefon und WhatsApp ist er direkt erreichbar – auch nach Auftragsbestätigung, auch am Umzugstag, falls unterwegs eine Frage auftaucht. Die Ausführung am Umzugstag selbst liegt in den Händen unseres festangestellten Teams: sieben Mitarbeiter, eingespielt, mit denselben Standards – kein Tagelöhner-Karussell.",
            "Ein Umzugstag ist hektisch genug. Unser Team bringt die Ruhe mit, die ein guter Umzug braucht – nicht weil wir es eilig haben, sondern weil wir wissen, wie es geht. Sie kümmern sich um Ihr neues Zuhause; wir kümmern uns um alles, was bis zur Schlüsselübergabe dazwischen liegt.",
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
        color: #ff6b00; /* Darker orange for WCAG AA contrast (4.5:1 against white) */
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
