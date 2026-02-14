<script lang="ts">
    import { Warehouse, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
</script>

<svelte:head>
    <title>Lagerung & Einlagerung | Aust Umzüge Hildesheim</title>
    <meta
        name="description"
        content="Sichere Möbellagerung in Hildesheim. Zwischenlagerung beim Umzug, Langzeitlagerung, flexible Laufzeiten. Abholung und Lieferung möglich."
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
                <Warehouse size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Lagerung & Einlagerung</h1>
            <p class="service-subtitle">
                Sicher verwahrt – ob für Wochen oder Jahre.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Flexible Lagerung für jeden Bedarf</h2>
                <p>
                    Manchmal passt nicht alles auf einmal: Die neue Wohnung ist
                    noch nicht bezugsfertig, Sie renovieren oder brauchen
                    einfach mehr Platz. Unsere Lagerräume bieten Ihnen die
                    Lösung – sicher, trocken und jederzeit zugänglich.
                </p>
                <p>
                    Ob Zwischenlagerung für wenige Wochen oder Langzeitlagerung
                    über Monate und Jahre: Wir bewahren Ihre Möbel und
                    persönlichen Gegenstände sorgfältig auf. Auf Wunsch holen
                    wir Ihr Lagergut ab und liefern es später direkt an die neue
                    Adresse.
                </p>

                <h3 class="highlight-title">Unser Lagerservice:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Sichere, trockene Lagerräume</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Flexible Laufzeiten ohne lange Bindung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Abholung und Lieferung auf Wunsch</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Faire, transparente Konditionen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Ideal bei Umzug, Renovierung oder Auslandsaufenthalt</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Lagerplatz benötigt?</h3>
                    <p>
                        Wir beraten Sie gerne und erstellen ein individuelles
                        Angebot.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Lagerung anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Lagerung aufnehmen"
                            showArrow={false}
                        />
                    </div>
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
        background-color: #fef3c7;
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
        color: #1a202c;
        margin-bottom: 1.5rem;
    }
    .cta-button-wrapper {
        width: 100%;
    }
    .cta-button-wrapper :global(.cta-button) {
        width: 100%;
        justify-content: center;
    }
    .divider {
        margin: 0.75rem 0;
        color: #1a202c;
        font-size: 0.875rem;
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
