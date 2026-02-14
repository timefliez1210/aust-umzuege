<script lang="ts">
    // Hero - Full-width hero section with background image and CTA
    import CTAButton from "$lib/components/CTAButton.svelte";

    interface Props {
        tagline?: string;
        heading?: string;
        subheading?: string;
        ctaText?: string;
        ctaHref?: string;
        backgroundImage?: string;
    }

    let {
        tagline = "Professionell & kompetent",
        heading = "Ihr Partner für Umzüge, Haushaltsauflösungen und Montagen",
        subheading = "Unverbindlich anfragen und ein kostenloses Angebot erhalten",
        ctaText = "Jetzt anfragen",
        ctaHref = "/kostenloses-angebot",
        backgroundImage = "/umzuege-haushaltsaufloesungen-hildesheim-umgebung.webp",
    }: Props = $props();
</script>

<section class="hero">
    <img
        src={backgroundImage}
        srcset="{backgroundImage.replace('.webp', '')}-640w.webp 640w, {backgroundImage.replace('.webp', '')}-1024w.webp 1024w, {backgroundImage.replace('.webp', '')}-1536w.webp 1536w, {backgroundImage.replace('.webp', '')}-1920w.webp 1920w"
        sizes="100vw"
        alt="Aust Umzüge Team bei der Arbeit in Hildesheim"
        class="hero__background"
        loading="eager"
        fetchpriority="high"
        decoding="sync"
        width="1920"
        height="1080"
    />
    <div class="hero__overlay"></div>

    <div class="hero__container">
        <div class="hero__content">
            <span class="hero__tagline">{tagline}</span>
            <h1 class="hero__heading">{heading}</h1>
            <p class="hero__subheading">{subheading}</p>
            <CTAButton
                text={ctaText}
                href={ctaHref}
                ariaLabel="Jetzt kostenlos anfragen und Angebot erhalten"
            />
        </div>
    </div>
</section>

<style>
    .hero {
        --header-height: 120px; /* InfoBar ~40px + Navbar ~80px */
        position: relative;
        min-height: calc(100vh - var(--header-height));
        min-height: calc(100dvh - var(--header-height));
        display: flex;
        align-items: center;
        overflow: hidden;
    }

    .hero__background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        z-index: -2;
    }

    .hero__overlay {
        position: absolute;
        inset: 0;
        z-index: -1;
        /* Gradient overlay: solid on left, fading to transparent on right */
        background: linear-gradient(
            105deg,
            rgba(30, 58, 95, 0.92) 0%,
            rgba(30, 58, 95, 0.85) 35%,
            rgba(30, 58, 95, 0.4) 60%,
            rgba(30, 58, 95, 0) 80%
        );
    }

    .hero__container {
        width: 100%;
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        padding-block: var(--space-16);
    }

    .hero__content {
        max-width: 580px;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-5);
    }

    .hero__tagline {
        display: inline-block;
        color: var(--color-nav-accent);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .hero__heading {
        color: var(--color-text);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        line-height: 1.15;
        margin: 0;
        text-wrap: balance;
    }

    .hero__subheading {
        color: rgba(255, 255, 255, 0.85);
        font-size: var(--text-lg);
        line-height: var(--leading-relaxed);
        margin: 0;
        max-width: 480px;
    }

    .hero__content :global(.cta-button) {
        margin-top: var(--space-3);
    }

    /* Mobile Responsive */
    @media (max-width: 767px) {
        .hero {
            --header-height: 80px; /* Only Navbar, InfoBar hidden on mobile */
            min-height: calc(100vh - var(--header-height));
            min-height: calc(100dvh - var(--header-height));
        }

        .hero__overlay {
            background: linear-gradient(
                180deg,
                rgba(30, 58, 95, 0.9) 0%,
                rgba(30, 58, 95, 0.7) 100%
            );
        }

        .hero__content {
            text-align: center;
            align-items: center;
            max-width: 100%;
        }

        .hero__subheading {
            max-width: 100%;
        }

        .hero__background {
            object-position: center center;
        }
    }
</style>
