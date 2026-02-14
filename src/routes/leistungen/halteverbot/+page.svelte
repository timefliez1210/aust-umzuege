<script lang="ts">
    import { Ban, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Halteverbot" }
    ]);

    const faqs = [
        {
            question: "Was kostet eine Halteverbotszone für den Umzug?",
            answer: "Die Kosten liegen je nach Stadt und Dauer bei ca. 100-200 € pro Halteverbotszone (inkl. Genehmigung, Schilder und Aufstellung). In Hildesheim können wir Ihnen nach Absprache ein konkretes Angebot erstellen."
        },
        {
            question: "Wie lange vor dem Umzug muss das Halteverbot beantragt werden?",
            answer: "Die Schilder müssen mindestens 72 Stunden vor dem Umzugstermin aufgestellt werden, damit parkende Autos rechtzeitig umparken können. Wir empfehlen eine Beauftragung mindestens 2 Wochen im Voraus, da die behördliche Genehmigung Zeit braucht."
        },
        {
            question: "Wer stellt die Halteverbotsschilder auf?",
            answer: "Wir übernehmen das Aufstellen und Abbau der Schilder für Sie. Die Schilder werden mit Ständern befestigt und müssen fristgerecht (72h vorher) positioniert werden. Nach dem Umzug holen wir sie wieder ab."
        },
        {
            question: "Was passiert, wenn trotzdem jemand in der Halteverbotszone parkt?",
            answer: "Ordnungswidrig parkende Fahrzeuge dürfen abgeschleppt werden. Die Kosten trägt der Falschparker. Sollte dies nötig sein, kontaktieren wir für Sie das Ordnungsamt oder die Polizei."
        },
        {
            question: "Brauche ich auch für die neue Wohnung ein Halteverbot?",
            answer: "Ja, idealerweise sollten Sie sowohl an der alten als auch an der neuen Adresse eine Halteverbotszone einrichten lassen. So haben Sie an beiden Orten kurze Laufwege und der Umzug läuft deutlich schneller."
        },
        {
            question: "Kann ich auch als Privatperson ohne Umzugsfirma ein Halteverbot beantragen?",
            answer: "Ja, grundsätzlich kann jeder ein Halteverbot beantragen. Allerdings ist der Prozess zeitaufwendig und fehleranfällig. Wir kümmern uns professionell um alle Formalitäten und sparen Ihnen den Behördengang."
        }
    ];
</script>

<MetaTags
    title="Halteverbot einrichten | Aust Umzüge Hildesheim"
    description="Offizielle Halteverbotszonen für Ihren Umzug. Wir kümmern uns um Antrag, Aufstellung und Abbau der Schilder."
    keywords="Halteverbot Umzug Hildesheim, Halteverbotszone, Parkplatz Umzug, Halteverbotsschilder"
    canonical="https://www.aust-umzuege.de/leistungen/halteverbot"
/>

<StructuredData schema={services.halteverbot} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Ban size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Halteverbot</h1>
            <p class="service-subtitle">
                Freie Fahrt für Ihren Umzugswagen – ohne Stress und
                Parkplatzsuche.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Rechtzeitig Platz schaffen</h2>
                <p>
                    Nichts ist ärgerlicher als ein Umzugswagen, der keinen
                    Parkplatz findet. Lange Tragewege kosten Zeit, Kraft und
                    Nerven. In engen Stadtgebieten ist eine offizielle
                    Halteverbotszone daher unverzichtbar.
                </p>
                <p>
                    Wir übernehmen für Sie den kompletten Behördengang. Wir
                    beantragen die Genehmigung, stellen die Schilder
                    fristgerecht auf und holen sie nach dem Umzug wieder ab. So
                    ist der Parkplatz vor Ihrer Tür garantiert.
                </p>

                <h3 class="highlight-title">Unser Service umfasst:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Beantragung der behördlichen Genehmigung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fristgerechtes Aufstellen der Halteverbotsschilder
                            (mind. 72h vorher)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Erstellung des Aufstellungsprotokolls</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Abbau und Abtransport der Schilder nach dem Umzug</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Auch für Selbstumzieher buchbar</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Parkplatz benötigt?</h3>
                    <p>
                        Bestellen Sie Ihre Halteverbotszone rechtzeitig bei uns.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Jetzt bestellen"
                            href="/kontakt"
                            ariaLabel="Halteverbot für Umzug bestellen"
                            showArrow={false}
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- FAQ Section -->
        <FAQSection {faqs} />
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
</style>
