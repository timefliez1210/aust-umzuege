<script lang="ts">
    import { Home, CheckCircle, ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
    <title>Privatumzug Hildesheim | Aust Umzüge</title>
    <meta
        name="description"
        content="Stressfreier Privatumzug in Hildesheim und Umgebung. Wir bieten Full-Service, Montage und faire Preise für Ihren Wohnungswechsel."
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
                <Home size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Privatumzug</h1>
            <p class="service-subtitle">
                Ihr Start in ein neues Zuhause – entspannt und professionell.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Unser Service für Ihren Umzug</h2>
                <p>
                    Ein Umzug ist mehr als nur der Transport von Möbeln – er ist
                    der Beginn eines neuen Lebensabschnitts. Damit Sie diesen
                    entspannt angehen können, übernehmen wir für Sie die gesamte
                    Planung und Durchführung.
                </p>
                <p>
                    Egal ob Single-Appartement oder Einfamilienhaus: Wir
                    behandeln Ihr Eigentum so sorgfältig wie unser eigenes.
                    Unser erfahrenes Team sorgt dafür, dass alles sicher
                    verpackt, transportiert und am neuen Ort wieder aufgebaut
                    wird.
                </p>

                <h3 class="highlight-title">Unsere Leistungen im Detail:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Kostenlose Vor-Ort-Besichtigung & Festpreisangebot</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Professioneller Einpackservice (auf
                            Wunsch)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Demontage und Montage aller Möbel und Küchen</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Einrichtung von Halteverbotszonen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Versicherungsschutz für Ihr gesamtes Inventar</span
                        >
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Bereit für den Umzug?</h3>
                    <p>
                        Lassen Sie sich jetzt ein unverbindliches Angebot
                        erstellen.
                    </p>
                    <a href="/kostenloses-angebot" class="cta-button primary">
                        Kostenloses Angebot
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
        background-color: #fff7ed;
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
        box-sizing: border-box; /* Ensure padding doesn't affect width calculation */
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
