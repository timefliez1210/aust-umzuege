<script lang="ts">
    // ContactCTA - Contact information boxes with icons (appears on all pages)
    import { Phone, AtSign, MapPin, CheckCircle } from "lucide-svelte";

    interface Props {
        heading?: string;
    }

    let {
        heading = "Jetzt ein kostenloses Angebot erhalten oder einen Termin vereinbaren",
    }: Props = $props();
</script>

<section class="contact-cta">
    <div class="contact-cta__container">
        <h2 class="contact-cta__heading">{heading}</h2>

        <div class="contact-cta__grid">
            <!-- Telefon -->
            <a href="tel:+4951217558379" class="contact-cta__box">
                <div class="contact-cta__icon">
                    <Phone size={28} strokeWidth={2} />
                </div>
                <h3 class="contact-cta__title">Telefon</h3>
                <p class="contact-cta__text">
                    05121 – 7558379<br />
                    Mobil: 0176 – 70745281
                </p>
            </a>

            <!-- E-Mail -->
            <a href="mailto:info@aust-umzuege.de" class="contact-cta__box">
                <div class="contact-cta__icon">
                    <AtSign size={28} strokeWidth={2} />
                </div>
                <h3 class="contact-cta__title">E-Mail</h3>
                <p class="contact-cta__text">info@aust-umzuege.de</p>
            </a>

            <!-- Anfahrt -->
            <a
                href="https://maps.app.goo.gl/KUs8ajSyfU6iwEqw9"
                target="_blank"
                rel="noopener noreferrer"
                class="contact-cta__box"
            >
                <div class="contact-cta__icon">
                    <MapPin size={28} strokeWidth={2} />
                </div>
                <h3 class="contact-cta__title">Anfahrt</h3>
                <p class="contact-cta__text">
                    Kaiserstr. 32<br />
                    31134 Hildesheim
                </p>
            </a>

            <!-- Kostenloses Angebot -->
            <a href="/kostenloses-angebot" class="contact-cta__box">
                <div class="contact-cta__icon">
                    <CheckCircle size={28} strokeWidth={2} />
                </div>
                <h3 class="contact-cta__title">Zum kostenlosen Angebot</h3>
                <p class="contact-cta__link">
                    Mehr erfahren
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
                </p>
            </a>
        </div>
    </div>
</section>

<style>
    .contact-cta {
        padding-block: var(--space-16);
        background-color: var(--color-text);
    }

    .contact-cta__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .contact-cta__heading {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-xl), 3vw, var(--text-3xl));
        font-weight: var(--font-bold);
        text-align: center;
        margin: 0 0 var(--space-10);
        line-height: var(--leading-tight);
    }

    .contact-cta__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-4);
    }

    .contact-cta__box {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-6);
        background-color: var(--color-info-bar);
        border-radius: var(--radius-lg);
        text-decoration: none;
        transition:
            background-color var(--transition-base),
            transform var(--transition-fast);
    }

    .contact-cta__box:hover {
        background-color: var(--color-nav-accent);
        transform: translateY(-4px);
    }

    .contact-cta__icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        background-color: var(--color-nav-accent);
        border-radius: var(--radius-full);
        color: var(--color-text);
        transition: background-color var(--transition-base);
    }

    .contact-cta__box:hover .contact-cta__icon {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .contact-cta__title {
        color: var(--color-text);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        margin: 0;
    }

    .contact-cta__text {
        color: rgba(255, 255, 255, 0.85);
        font-size: var(--text-sm);
        line-height: 1.6;
        margin: 0;
    }

    .contact-cta__link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: rgba(255, 255, 255, 0.85);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        margin: 0;
        transition: gap var(--transition-fast);
    }

    .contact-cta__box:hover .contact-cta__link {
        gap: var(--space-3);
    }

    /* Tablet: 2x2 */
    @media (max-width: 900px) {
        .contact-cta__grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    /* Mobile: single column */
    @media (max-width: 500px) {
        .contact-cta {
            padding-block: var(--space-12);
        }

        .contact-cta__grid {
            grid-template-columns: 1fr;
        }

        .contact-cta__box {
            padding: var(--space-5);
        }
    }
</style>
