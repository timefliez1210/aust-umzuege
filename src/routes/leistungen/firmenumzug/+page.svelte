<script lang="ts">
    import { Building2, CheckCircle, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
    <title>Firmenumzug Hildesheim | Aust Umzüge</title>
    <meta
        name="description"
        content="Professionelle Firmen- und Büroumzüge. Minimale Ausfallzeiten, IT-Transport und Wochenendservice für Ihr Unternehmen."
    />
</svelte:head>

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Building2 size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Firmenumzug</h1>
            <p class="service-subtitle">
                Effiziente Standortwechsel für Büros, Praxen und Betriebe.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Geschäftsumzüge mit System</h2>
                <p>
                    Ein Firmenumzug erfordert Präzision und perfektes Timing.
                    Jeder Tag Stillstand kostet Geld. Deshalb planen wir Ihren
                    Standortwechsel so, dass Ihr Geschäftsbetrieb so wenig wie
                    möglich beeinträchtigt wird.
                </p>
                <p>
                    Ob kleines Büro oder großes Verwaltungsgebäude: Wir
                    erstellen einen detaillierten Ablaufplan, koordinieren alle
                    Gewerke und sorgen dafür, dass am neuen Standort pünktlich
                    wieder gearbeitet werden kann – gerne auch über das
                    Wochenende oder in der Nacht.
                </p>

                <h3 class="highlight-title">Unsere B2B-Leistungen:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Detaillierte Projektplanung und Logistikkonzepte</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Professioneller Akten- und Archivtransport
                            (Datenschutzkonform)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >De- und Remontage von Büromöbelsystemen (USM, etc.)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Sicherer Transport von IT-Equipment und Servern</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Entsorgung von Altmobiliar</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Projekt anfragen?</h3>
                    <p>
                        Gerne erstellen wir Ihnen ein individuelles Angebot für
                        Ihr Unternehmen.
                    </p>
                    <a href="/kostenloses-angebot" class="cta-button primary">
                        Angebot anfordern
                    </a>
                    <div class="divider">oder</div>
                    <a href="/kontakt" class="cta-button secondary">
                        Beratungsgespräch
                    </a>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    .service-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .service-detail__container {
        max-width: 1000px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #64748b;
        text-decoration: none;
        font-size: var(--text-sm);
        margin-bottom: var(--space-8);
        transition: color var(--transition-fast);
    }

    .back-link:hover {
        color: var(--color-nav-accent);
    }

    .service-header {
        text-align: center;
        margin-bottom: var(--space-12);
        padding-bottom: var(--space-8);
        border-bottom: 1px solid #f1f5f9;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .icon-wrapper {
        color: var(--color-nav-accent);
        background-color: #eff6ff; /* Blue tint for business */
        width: 80px;
        height: 80px;
        border-radius: var(--radius-full);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-4);
    }

    .service-title {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 4vw, var(--text-5xl));
        font-weight: var(--font-bold);
        margin-bottom: var(--space-2);
    }

    .service-subtitle {
        color: #64748b;
        font-size: var(--text-xl);
    }

    .service-content {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-10);
    }

    @media (min-width: 768px) {
        .service-content {
            grid-template-columns: 2fr 1fr;
        }
    }

    .section-title {
        color: var(--color-info-bar);
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-4);
    }

    .text-column p {
        color: #4a5568;
        line-height: 1.7;
        margin-bottom: var(--space-4);
        font-size: var(--text-lg);
    }

    .highlight-title {
        color: var(--color-info-bar);
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        margin-top: var(--space-8);
        margin-bottom: var(--space-4);
    }

    .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .feature-list li {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        color: #4a5568;
        font-size: var(--text-base);
    }

    .feature-list :global(.check-icon) {
        color: var(--color-nav-accent);
        flex-shrink: 0;
    }

    /* CTA Box */
    .cta-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        text-align: center;
        position: sticky;
        top: 100px;
    }

    .cta-box h3 {
        color: var(--color-info-bar);
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        margin-bottom: var(--space-2);
    }

    .cta-box p {
        color: #64748b;
        margin-bottom: var(--space-6);
    }

    .cta-button {
        display: block;
        width: 100%;
        padding: var(--space-3);
        border-radius: var(--radius-md);
        text-align: center;
        text-decoration: none;
        font-weight: var(--font-semibold);
        transition: all var(--transition-fast);
        box-sizing: border-box;
    }

    .cta-button.primary {
        background-color: var(--color-nav-accent);
        color: #fff;
    }

    .cta-button.primary:hover {
        background-color: #d84a00;
        transform: translateY(-2px);
    }

    .cta-button.secondary {
        background-color: #fff;
        color: var(--color-info-bar);
        border: 1px solid #cbd5e0;
    }

    .cta-button.secondary:hover {
        background-color: #f1f5f9;
        border-color: var(--color-info-bar);
    }

    .divider {
        margin: var(--space-3) 0;
        color: #94a3b8;
        font-size: var(--text-sm);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
