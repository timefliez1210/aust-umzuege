<script lang="ts">
    // Hero — two-column navy hero with static accent word, testimonial
    // carousel, and the site-wide contact flow CTA (same as the homepage).
    import { onMount, onDestroy } from "svelte";
    import AnchorCTA from "$lib/components/contact/AnchorCTA.svelte";

    interface Testimonial {
        initial: string;
        quote: string;
        author: string;
    }

    interface Props {
        leadIn?: string;
        accentWord?: string;
        trailing?: string;
        imageBase?: string; // e.g. "/seniorenumzuege-hildesheim-carousel-6" (no extension, no width suffix)
        imageAlt?: string;
        ratingCount?: string;
        testimonials?: Testimonial[];
        reviewLink?: string;
    }

    const defaultTestimonials: Testimonial[] = [
        {
            initial: "Q",
            quote: "Dank guter Abschätzung des Volumens hat er uns das günstigste Angebot gemacht. Alles hat rein gepasst und der Umzug reibungslos verlaufen.",
            author: "Quadrilla M., Google Local Guide",
        },
        {
            initial: "L",
            quote: "Der Umzug verlief reibungslos und außergewöhnlich zügig. Wir sind über 100 km weit weg gezogen und kein Möbelstück ist zu Schaden gekommen.",
            author: "Luca W., Google Local Guide",
        },
        {
            initial: "M",
            quote: "Fairer Preis, zeitnahe Absprache und schnelle Erledigung. Herr Aust und sein Team haben die Wohnungsauflösung sehr schnell erledigt.",
            author: "Mathias M., Google Local Guide",
        },
        {
            initial: "B",
            quote: "Das Team war pünktlich, super freundlich und extrem fleißig. Ich kann Aust Umzüge wirklich uneingeschränkt weiterempfehlen.",
            author: "Bea, Google Rezension",
        },
        {
            initial: "N",
            quote: "Herr Aust und sein Team haben den Umzug meiner Mutter in eine betreute Wohnung wunderbar gemacht. Sehr hilfsbereit, zuverlässig und schnell.",
            author: "Nicole S., Google Rezension",
        },
        {
            initial: "H",
            quote: "Schnelles unkompliziertes Abchecken des Umzugsvolumens. Der Umzug begann pünktlich und blieb im Zeitrahmen.",
            author: "Hagen D., Google Rezension",
        },
    ];

    let {
        leadIn = "Ihr Partner für",
        accentWord = "Umzüge, Entrümpelungen & Montagen",
        trailing = "in Hildesheim und Region",
        imageBase = "/seniorenumzuege-hildesheim-carousel-6",
        imageAlt = "Aust Umzüge Team in Hildesheim",
        ratingCount = "70+",
        testimonials = defaultTestimonials,
        reviewLink = "https://www.google.com/search?q=Aust+Umz%C3%BCge+Hildesheim",
    }: Props = $props();

    // ---- Carousel ----
    const CAROUSEL_INTERVAL = 7000;
    let activeIdx = $state(0);
    let timer: ReturnType<typeof setInterval> | null = null;

    function next() {
        activeIdx = (activeIdx + 1) % testimonials.length;
    }
    function goTo(i: number) {
        activeIdx = i;
        resetTimer();
    }
    function resetTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(next, CAROUSEL_INTERVAL);
    }

    onMount(() => {
        resetTimer();
    });
    onDestroy(() => {
        if (timer) clearInterval(timer);
    });

    const srcset = $derived(`${imageBase}-400w.webp 400w, ${imageBase}-600w.webp 600w, ${imageBase}-800w.webp 800w`);
</script>

<section class="hero">
    <div class="hero__container">
        <div class="hero__left">
            <h1 class="hero__heading">
                {leadIn}<br />
                <span class="hero__accent">{accentWord}</span><br />
                {trailing}
            </h1>

            <div class="hero__rating">
                <div class="hero__stars">
                    <div class="hero__stars-row" aria-label="5 von 5 Sternen">
                        {#each Array(5) as _, i (i)}
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        {/each}
                        <span class="hero__google-badge" aria-hidden="true">G</span>
                    </div>
                    <p class="hero__rating-text">
                        Google, <strong>5,0 / 5</strong><br />
                        basierend auf {ratingCount} Bewertungen.
                    </p>
                </div>

                <div class="hero__carousel">
                    {#each testimonials as t, i (i)}
                        <article
                            class="hero__testimonial"
                            class:active={i === activeIdx}
                            aria-hidden={i !== activeIdx}
                        >
                            <div class="avatar" aria-hidden="true">{t.initial}</div>
                            <div class="hero__testimonial-body">
                                <blockquote>
                                    „{t.quote}“
                                    <cite>— {t.author}</cite>
                                </blockquote>
                                <a class="review-link" href={reviewLink} target="_blank" rel="noopener noreferrer">
                                    Auf Google ansehen
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                            </div>
                        </article>
                    {/each}
                    <div class="hero__dots">
                        {#each testimonials as _, i (i)}
                            <button
                                type="button"
                                class:active={i === activeIdx}
                                aria-label={`Bewertung ${i + 1}`}
                                onclick={() => goTo(i)}
                            ></button>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="hero__callback">
                <AnchorCTA
                    variant="primary"
                    title="Reden wir 5 Minuten."
                    sub="Anruf, Rückruf, WhatsApp oder Nachricht — Sie entscheiden."
                />
            </div>
        </div>

        <div class="hero__right">
            <div class="hero__image-wrap">
                <img
                    src={`${imageBase}.webp`}
                    srcset={srcset}
                    sizes="(max-width: 1023px) 100vw, 600px"
                    alt={imageAlt}
                    width="800"
                    height="1000"
                    loading="eager"
                    fetchpriority="high"
                    decoding="sync"
                />
            </div>
        </div>
    </div>
</section>

<style>
    .hero {
        --hero-navy: #1e3a5f;
        --hero-orange: var(--color-nav-accent, #ff6b00);
        --hero-orange-hover: #a83700;
        background: var(--hero-navy);
        color: #fff;
        padding: 3rem 1.5rem;
        position: relative;
        overflow: hidden;
    }
    @media (min-width: 768px) {
        .hero { padding: 4rem 2rem; }
    }
    .hero__container {
        max-width: var(--container-max, 1440px);
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: center;
    }
    @media (max-width: 1023px) {
        .hero__container {
            grid-template-columns: 1fr;
            gap: 2rem;
        }
    }

    .hero__left {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        min-width: 0;
    }

    .hero__heading {
        font-size: clamp(1.75rem, 4.5vw, 2.75rem);
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -0.02em;
        margin: 0;
    }
    .hero__accent { color: var(--hero-orange); }

    /* Rating + carousel */
    .hero__rating {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 1.25rem;
    }
    @media (max-width: 640px) {
        .hero__rating { flex-direction: column; }
    }
    .hero__stars {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .hero__stars-row {
        display: flex;
        gap: 2px;
        color: var(--hero-orange);
        align-items: center;
    }
    .hero__stars-row svg { width: 20px; height: 20px; }
    .hero__google-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--hero-navy);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 9999px;
        width: 20px;
        height: 20px;
        font-size: 10px;
        font-weight: 700;
        margin-left: 4px;
        color: #fff;
    }
    .hero__rating-text {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.75);
        font-weight: 500;
        line-height: 1.4;
        margin: 0;
    }
    .hero__rating-text strong {
        color: #fff;
        font-size: 0.9rem;
    }

    .hero__carousel {
        position: relative;
        padding-bottom: 1.75rem;
        display: grid;
        grid-template-columns: 1fr;
        flex: 1 1 0%;
        min-width: 0;
    }
    .hero__testimonial {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 1rem;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        grid-area: 1 / 1;
        width: 100%;
        opacity: 0;
        transform: translateX(0.75rem);
        transition: opacity 0.5s ease, transform 0.5s ease;
        pointer-events: none;
    }
    .hero__testimonial.active {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
    }
    .hero__testimonial .avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.125rem;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, var(--hero-orange), var(--hero-orange-hover));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 0 0 2px rgba(255, 255, 255, 0.15);
    }
    .hero__testimonial-body { min-width: 0; flex: 1; }
    .hero__testimonial blockquote {
        font-size: 0.8rem;
        font-weight: 500;
        font-style: italic;
        line-height: 1.5;
        margin: 0;
    }
    .hero__testimonial cite {
        display: block;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.65);
        font-style: normal;
        margin-top: 0.3rem;
    }
    .hero__testimonial .review-link {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        margin-top: 0.4rem;
        font-size: 0.7rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.75);
        text-decoration: none;
    }
    .hero__testimonial .review-link:hover { color: var(--hero-orange); }
    .hero__testimonial .review-link svg { width: 10px; height: 10px; opacity: 0.75; }

    .hero__dots {
        position: absolute;
        bottom: 0.25rem;
        left: 1rem;
        display: flex;
        gap: 0.35rem;
    }
    .hero__dots button {
        width: 6px;
        height: 6px;
        border-radius: 9999px;
        background: rgba(255, 255, 255, 0.3);
        border: none;
        cursor: pointer;
        padding: 0;
        transition: background 0.3s, width 0.3s;
    }
    .hero__dots button.active {
        background: var(--hero-orange);
        width: 18px;
    }

    /* Callback CTA — opens the site-wide contact flow (same as homepage) */
    .hero__callback {
        display: flex;
        flex-direction: column;
    }

    /* Right column image */
    .hero__right { min-width: 0; }
    .hero__image-wrap {
        border-radius: 32px;
        overflow: hidden;
        border: 4px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    }
    .hero__image-wrap img {
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        display: block;
    }
</style>
