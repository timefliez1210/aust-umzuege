<script lang="ts">
    // HeroV2 — owner-led trust hero.
    // Light surface with navy accent rail, Alex's portrait, scannable trust
    // chips, one full testimonial, dual CTA (Vor-Ort-Termin + phone tap).
    import { Phone, MapPin, ExternalLink, CalendarCheck, FileCheck2, ShieldCheck } from "lucide-svelte";
    import CallbackForm from "$lib/components/CallbackForm.svelte";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type IconComponent = any;
    interface TrustBadge {
        icon: IconComponent;
        title: string;
        sub: string;
    }

    interface Props {
        eyebrow?: string;
        headingLeft?: string;
        headingAccent?: string;
        headingRight?: string;
        subtitle?: string;
        ownerName?: string;
        ownerRole?: string;
        ownerImageBase?: string;
        ownerImageAlt?: string;
        badges?: TrustBadge[];
        testimonialQuote?: string;
        testimonialAuthor?: string;
        testimonialMeta?: string;
        testimonialUrl?: string;
        phoneDisplay?: string;
        phoneHref?: string;
    }

    let {
        eyebrow = "Umzugsfirma aus Hildesheim · seit 2019",
        headingLeft = "Ihr Umzug in Hildesheim — zum",
        headingAccent = "Festpreis.",
        headingRight = "",
        subtitle = "",
        ownerName = "Alex Aust",
        ownerRole = "Inhaber, Aust Umzüge",
        ownerImageBase = "/seniorenumzuege-hildesheim-carousel-6",
        ownerImageAlt = "Alex Aust, Inhaber Aust Umzüge Hildesheim",
        badges = [
            { icon: CalendarCheck, title: "Kostenloser Vor-Ort-Termin", sub: "auch abends · persönliche Beratung inklusive" },
            { icon: FileCheck2, title: "Verbindliches Angebot", sub: "innerhalb 48 Stunden, schriftlich" },
            { icon: ShieldCheck, title: "Festpreis-Garantie", sub: "kein Stundenzähler, keine Nachforderung" },
        ],
        testimonialQuote = "Pünktlich, super freundlich und extrem fleißig. Alles wurde sorgfältig eingepackt, abgebaut, transportiert und wieder aufgebaut – schnell, professionell und mit viel Engagement.",
        testimonialAuthor = "Bea",
        testimonialMeta = "eine von 71× ★★★★★ auf Google",
        testimonialUrl = "https://maps.app.goo.gl/KNcwFdaD9wWhzHZV9",
        phoneDisplay = "05121 – 755 83 79",
        phoneHref = "tel:051217558379",
    }: Props = $props();

    const srcset = `${ownerImageBase}-400w.webp 400w, ${ownerImageBase}-600w.webp 600w, ${ownerImageBase}-800w.webp 800w`;

</script>

<section class="hero">
    <div class="hero__rail" aria-hidden="true"></div>

    <div class="hero__container">
        <div class="hero__left">
            <span class="hero__eyebrow">
                <MapPin size={14} strokeWidth={2.5} />
                {eyebrow}
            </span>

            <h1 class="hero__heading">
                {headingLeft} <span class="hero__accent">{headingAccent}</span>{#if headingRight} {headingRight}{/if}
            </h1>
            {#if subtitle}
                <p class="hero__subtitle">{subtitle}</p>
            {/if}

            <p class="hero__lead">
                Was im Angebot steht, ist der Preis am Umzugstag — schriftlich, ohne Stundenzähler, ohne Nachforderung.
            </p>

            <div class="hero__callback" id="rueckruf">
                <CallbackForm />
            </div>

            <ul class="hero__badges">
                {#each badges as b (b.title)}
                    {@const Icon = b.icon}
                    <li class="hero__badge">
                        <span class="hero__badge-icon" aria-hidden="true">
                            <Icon size={20} strokeWidth={2.25} />
                        </span>
                        <span class="hero__badge-text">
                            <strong>{b.title}</strong>
                            <span>{b.sub}</span>
                        </span>
                    </li>
                {/each}
            </ul>

            <div class="hero__ctas">
                <a class="hero__cta hero__cta--secondary" href={phoneHref}>
                    <Phone size={16} strokeWidth={2.5} />
                    Lieber direkt anrufen: {phoneDisplay}
                </a>
            </div>
        </div>

        <div class="hero__right">
            <figure class="hero__owner">
                <div class="hero__owner-image">
                    <img
                        src={`${ownerImageBase}.webp`}
                        srcset={srcset}
                        sizes="(max-width: 1023px) 80vw, 480px"
                        alt={ownerImageAlt}
                        width="800"
                        height="1000"
                        loading="eager"
                        fetchpriority="high"
                        decoding="sync"
                    />
                </div>
                <figcaption class="hero__owner-caption">
                    <strong>{ownerName}</strong>
                    <span>{ownerRole}</span>
                </figcaption>
            </figure>

            <blockquote class="hero__quote">
                <div class="hero__quote-mark" aria-hidden="true">„</div>
                <p>{testimonialQuote}</p>
                <footer>
                    <div class="hero__quote-stars" aria-label="5 von 5 Sternen">
                        {#each Array(5) as _, i (i)}
                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        {/each}
                    </div>
                    <cite>
                        <strong>{testimonialAuthor}</strong>
                        <a class="hero__quote-link" href={testimonialUrl} target="_blank" rel="noopener noreferrer">
                            {testimonialMeta}
                            <ExternalLink size={11} strokeWidth={2.5} aria-hidden="true" />
                        </a>
                    </cite>
                </footer>
            </blockquote>
        </div>
    </div>
</section>

<style>
    .hero {
        --hero-navy: #1e3a5f;
        --hero-navy-deep: #14283f;
        --hero-orange: var(--color-nav-accent, #c44100);
        --hero-ink: #1a1f2e;
        --hero-mute: #5b6478;
        --hero-line: #e6e8ed;
        --hero-surface: #fafafa;
        --hero-card: #ffffff;

        background: var(--hero-surface);
        color: var(--hero-ink);
        position: relative;
        overflow: hidden;
        padding: 2rem 1rem 3rem;
    }
    @media (min-width: 768px) { .hero { padding: 5rem 2rem 6rem; } }

    .hero__rail {
        position: absolute;
        inset: 0 auto 0 0;
        width: 6px;
        background: var(--hero-orange);
    }
    @media (max-width: 640px) { .hero__rail { width: 3px; } }

    .hero__container {
        max-width: var(--container-max, 1440px);
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.1fr 1fr;
        gap: 4rem;
        align-items: center;
    }
    @media (max-width: 1023px) {
        .hero__container { grid-template-columns: 1fr; gap: 1.75rem; }
    }
    @media (max-width: 1023px) {
        .hero__heading   { margin-bottom: 0.25rem; }
        .hero__owner     { margin-top: 0.5rem; }
        .hero__lead      { margin-top: 0.5rem; }
        .hero__callback  { margin-top: 0.25rem; }
        .hero__badges    { margin-top: 0.25rem; }
        .hero__ctas      { margin-top: 0.25rem; }
    }
    @media (max-width: 640px) {
        .hero__heading { font-size: clamp(1.65rem, 8vw, 2.1rem); }
        .hero__lead { font-size: 0.95rem; line-height: 1.5; }
        .hero__callback { padding: 1rem 0.95rem 0.9rem; }
        .hero__badge { padding: 0.55rem 0.75rem; gap: 0.65rem; }
        .hero__badge-icon { width: 1.75rem; height: 1.75rem; }
        .hero__badge-text strong { font-size: 0.88rem; }
        .hero__badge-text span { font-size: 0.78rem; line-height: 1.3; }
        .hero__cta { padding: 0.85rem 1.1rem; font-size: 0.92rem; }
        .hero__cta--secondary { width: 100%; justify-content: center; }
        .hero__owner { max-width: 100%; }
        .hero__owner-image img { aspect-ratio: 4 / 3; }
        .hero__owner-caption { left: 1rem; top: 0.9rem; }
        .hero__owner-caption strong { font-size: 1.05rem; }
        .hero__owner-caption span { font-size: 0.78rem; }
    }

    /* LEFT */
    .hero__left {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        min-width: 0;
    }
    .hero__eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--hero-orange);
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .hero__heading {
        font-size: clamp(1.9rem, 4.8vw, 3.25rem);
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.025em;
        color: var(--hero-navy);
        margin: 0;
    }
    .hero__accent { color: var(--hero-orange); }
    .hero__subtitle {
        margin: -0.5rem 0 0;
        font-size: 1.05rem;
        font-weight: 600;
        color: var(--hero-navy);
        letter-spacing: -0.01em;
    }
    .hero__lead {
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--hero-mute);
        max-width: 52ch;
        margin: 0;
    }

    /* Mobile reorder: heading → portrait → quote → lead → form → badges → CTA.
       hero__left & hero__right become display:contents so children participate
       directly in the parent flex column with explicit `order`. */
    @media (max-width: 1023px) {
        .hero__container {
            display: flex;
            flex-direction: column;
        }
        .hero__left, .hero__right { display: contents; }
        .hero__eyebrow   { order: 1; }
        .hero__heading   { order: 2; }
        .hero__subtitle  { order: 3; }
        .hero__owner     { order: 4; }
        .hero__quote     { order: 5; }
        .hero__lead      { order: 6; }
        .hero__callback  { order: 7; }
        .hero__badges    { order: 8; }
        .hero__ctas      { order: 9; }
    }

    .hero__badges {
        list-style: none;
        margin: 0.25rem 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }
    .hero__badge {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        background: var(--hero-card);
        border: 1px solid var(--hero-line);
        border-left: 3px solid var(--hero-orange);
        border-radius: 0.6rem;
        padding: 0.7rem 0.95rem;
        box-shadow: 0 1px 2px rgba(20, 40, 63, 0.04);
    }
    .hero__badge-icon {
        flex-shrink: 0;
        width: 2.1rem;
        height: 2.1rem;
        border-radius: 0.5rem;
        background: rgba(196, 65, 0, 0.1);
        color: var(--hero-orange);
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    .hero__badge-text {
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        min-width: 0;
    }
    .hero__badge-text strong {
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--hero-navy);
        letter-spacing: -0.01em;
        line-height: 1.25;
    }
    .hero__badge-text span {
        font-size: 0.78rem;
        color: var(--hero-mute);
        line-height: 1.3;
    }

    .hero__ctas {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
    }
    .hero__cta {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.95rem 1.4rem;
        border-radius: 0.7rem;
        font-weight: 700;
        font-size: 0.98rem;
        text-decoration: none;
        transition: background 0.15s, transform 0.15s, border-color 0.15s, color 0.15s;
    }
    .hero__cta--secondary {
        background: transparent;
        color: var(--hero-navy);
        border: 1.5px solid var(--hero-navy);
    }
    .hero__cta--secondary:hover { background: var(--hero-navy); color: #fff; }

    /* Callback card — primary lead capture */
    .hero__callback {
        background: var(--hero-card);
        border: 1px solid var(--hero-line);
        border-top: 3px solid var(--hero-orange);
        border-radius: 0.85rem;
        box-shadow: 0 12px 28px -10px rgba(20, 40, 63, 0.18);
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        padding: 1.1rem 1.15rem 1rem;
    }


    /* RIGHT */
    .hero__right {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
    }
    .hero__owner {
        position: relative;
        margin: 0;
        width: 100%;
        max-width: 480px;
    }
    .hero__owner-image {
        position: relative;
        border-radius: 1.25rem;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(20, 40, 63, 0.35);
        background: var(--hero-navy-deep);
    }
    .hero__owner-image::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(20, 40, 63, 0.85) 0%, rgba(20, 40, 63, 0.35) 30%, transparent 50%);
        pointer-events: none;
    }
    .hero__owner-image img {
        width: 100%;
        aspect-ratio: 4 / 5;
        object-fit: cover;
        display: block;
    }
    .hero__owner-caption {
        position: absolute;
        left: 1.25rem;
        top: 1.1rem;
        color: #fff;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }
    .hero__owner-caption strong {
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: -0.01em;
    }
    .hero__owner-caption span {
        font-size: 0.82rem;
        opacity: 0.92;
        font-weight: 500;
    }

    .hero__quote {
        position: relative;
        margin: -2.25rem 0 0;
        align-self: stretch;
        max-width: 440px;
        margin-left: auto;
        margin-right: 0;
        background: var(--hero-card);
        border: 1px solid var(--hero-line);
        border-left: 4px solid var(--hero-orange);
        border-radius: 0.85rem;
        padding: 1.5rem 1.4rem 1.1rem 2.6rem;
        box-shadow: 0 12px 28px -8px rgba(20, 40, 63, 0.18);
    }
    @media (max-width: 1023px) {
        .hero__quote {
            margin: -1.5rem auto 0;
            max-width: 480px;
        }
    }
    @media (max-width: 640px) {
        .hero__quote {
            margin: -2rem 0 0 auto;
            max-width: 88%;
            padding: 1.1rem 1rem 0.9rem 2.1rem;
        }
        .hero__quote-mark { font-size: 2rem; left: 0.7rem; top: 0.3rem; }
        .hero__quote p { font-size: 0.9rem; line-height: 1.5; }
        .hero__quote footer { gap: 0.6rem; padding-top: 0.6rem; }
    }
    .hero__quote-mark {
        position: absolute;
        top: 0.4rem;
        left: 0.95rem;
        font-size: 2.5rem;
        line-height: 1;
        color: var(--hero-orange);
        font-weight: 800;
        font-family: Georgia, serif;
    }
    .hero__quote p {
        font-size: 0.95rem;
        line-height: 1.55;
        color: var(--hero-ink);
        font-style: italic;
        margin: 0 0 0.85rem;
        font-weight: 500;
    }
    .hero__quote footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 0.7rem;
        border-top: 1px solid var(--hero-line);
    }
    .hero__quote-stars { display: flex; gap: 1px; color: var(--hero-orange); }
    .hero__quote-stars svg { width: 14px; height: 14px; }
    .hero__quote cite {
        font-style: normal;
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 0.05rem;
        line-height: 1.2;
    }
    .hero__quote cite strong {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--hero-navy);
    }
    .hero__quote-link {
        font-size: 0.7rem;
        color: var(--hero-mute);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        transition: color 0.15s;
    }
    .hero__quote-link:hover {
        color: var(--hero-orange);
    }
</style>
