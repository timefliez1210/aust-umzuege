<script lang="ts">
    import { Wrench, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Montage & Demontage" }
    ]);
</script>

<MetaTags
    title="Montage & Demontage | Aust Umzüge Hildesheim"
    description="Fachgerechter Möbelaufbau und Küchenmontage. Unsere Schreiner im Team sorgen für den perfekten Sitz Ihrer Einrichtung."
    keywords="Möbelmontage Hildesheim, Küchenmontage, Möbelaufbau, Schrankaufbau, Demontage"
    canonical="https://www.aust-umzuege.de/leistungen/montage"
/>

<StructuredData schema={services.montage} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Wrench size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Demontage & Montage</h1>
            <p class="service-subtitle">
                Nicht nur schleppen, sondern auch schrauben – fachgerecht und
                sauber.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Möbelmontage vom Profi</h2>
                <p>
                    Große Kleiderschränke, komplexe Wohnwände oder die
                    Einbauküche: Viele Möbel lassen sich nicht am Stück
                    transportieren. Unsere erfahrenen Monteure und Schreiner im
                    Team übernehmen den fachgerechten Abbau und den stabilen
                    Aufbau am neuen Standort.
                </p>
                <p>
                    Dabei achten wir auf jedes Detail, justieren Türen und
                    Schubladen neu und passen bei Bedarf auch
                    Küchenarbeitsplatten an. Ihr Umzug ist erst fertig, wenn
                    alles an seinem Platz steht und funktioniert.
                </p>

                <h3 class="highlight-title">Montage-Kompetenz:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >De- und Remontage aller gängigen Möbelsysteme</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Küchenmontage inklusive Arbeitsplatten-Anpassung</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Anschluss von Wasser und Elektro durch
                            zertifiziertes Personal</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Befestigung von Lampen, Gardinenstangen und Regalen</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Neumöbelmontage nach Lieferung</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Montage gewünscht?</h3>
                    <p>
                        Buchen Sie unseren Montageservice direkt zu Ihrem Umzug
                        dazu.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Montageservice anfordern"
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
        background-color: #f3f4f6;
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
</style>
