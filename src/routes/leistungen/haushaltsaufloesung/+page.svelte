<script lang="ts">
    import { Trash2, CheckCircle, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
    <title>Haushaltsauflösung & Entrümpelung | Aust Umzüge</title>
    <meta
        name="description"
        content="Diskrete Haushaltsauflösungen und Entrümpelungen in Hildesheim. Besenreine Räumung und fachgerechte Entsorgung."
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
                <Trash2 size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Haushaltsauflösungen</h1>
            <p class="service-subtitle">
                Schnell, diskret und besenrein – wir schaffen Platz.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Kompletträumung vom Fachmann</h2>
                <p>
                    Ob Wohnungsauflösung nach einem Todesfall, Räumung einer
                    Messie-Wohnung oder die Entrümpelung von Keller und
                    Dachboden: Wir erledigen diese schweren Aufgaben seriös und
                    zuverlässig für Sie.
                </p>
                <p>
                    Wir sortieren Verwertbares von Müll, kümmern uns um die
                    fachgerechte Entsorgung nach gesetzlichen Vorschriften und
                    übergeben Ihnen das Objekt garantiert besenrein. Auf Wunsch
                    rechnen wir gut erhaltene Gegenstände auf den Preis an.
                </p>

                <h3 class="highlight-title">Unser Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Kostenlose Besichtigung und Festpreisangebot</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Besenreine Übergabe der Räumlichkeiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fachgerechte Entsorgung und Recycling mit Nachweis</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Wertanrechnung für verkaufsfähige
                            Möbel/Antiquitäten</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Entfernung von Tapeten, Teppichen und Einbauten
                            (auf Wunsch)</span
                        >
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Objekt zu räumen?</h3>
                    <p>
                        Wir erstellen Ihnen ein faires Angebot für die
                        Auflösung.
                    </p>
                    <a href="/kostenloses-angebot" class="cta-button primary">
                        Angebot anfordern
                    </a>
                    <div class="divider">oder</div>
                    <a href="/kontakt" class="cta-button secondary">
                        Kontakt aufnehmen
                    </a>
                </div>
            </div>
        </div>
    </div>
</main>

<style>
    /* Consistent Styles */
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
        transition: color 0.2s;
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
        background-color: #fee2e2;
        width: 80px;
        height: 80px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-4);
    }
    .service-title {
        color: var(--color-info-bar);
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }
    .service-subtitle {
        color: #64748b;
        font-size: 1.25rem;
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
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-4);
    }
    .text-column p {
        color: #4a5568;
        line-height: 1.7;
        margin-bottom: var(--space-4);
        font-size: 1.125rem;
    }
    .highlight-title {
        color: var(--color-info-bar);
        font-size: 1.25rem;
        font-weight: 600;
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
        font-size: 1rem;
    }
    .feature-list :global(.check-icon) {
        color: var(--color-nav-accent);
        flex-shrink: 0;
    }
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
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .cta-box p {
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    .cta-button {
        display: block;
        width: 100%;
        padding: 0.75rem;
        border-radius: var(--radius-md);
        text-align: center;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;
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
        margin: 0.75rem 0;
        color: #94a3b8;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
