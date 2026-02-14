<script lang="ts">
    import { Wrench, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Montage & Demontage" }
    ]);

    const faqs = [
        {
            question: "Was kostet die Möbelmontage?",
            answer: "Einfache Montagen wie Regale oder Betten starten ab ca. 50 Euro. Ein großer Kleiderschrank (PAX, Nolte o.ä.) liegt bei 80-200 Euro. Küchenmontagen kosten je nach Länge 150-300 Euro pro Laufmeter. Bei einer Buchung zusammen mit einem Umzug erhalten Sie einen vergünstigten Paketpreis. Fragen Sie uns nach einem Angebot."
        },
        {
            question: "Welche Möbel können Sie montieren?",
            answer: "Wir montieren alle gängigen Systeme: IKEA (PAX, KALLAX, BESTA), Nolte, Hülsta, Rolf Benz, Einbauküchen aller Hersteller, Wohnwände, Betten, Regalsysteme und Büromöbel. Unsere Monteure haben jahrelange Erfahrung mit allen bekannten Herstellern und Systemen."
        },
        {
            question: "Können Sie Küchen komplett anschließen (Wasser, Strom)?",
            answer: "Ja, wir haben zertifizierte Fachkräfte im Team, die Wasseranschlüsse, Spülmaschinen und elektrische Geräte (Herd, Backofen, Dunstabzug) fachgerecht anschließen. Für größere Elektroinstallationen vermitteln wir bei Bedarf einen Elektriker aus unserem Netzwerk."
        },
        {
            question: "Wie lange dauert eine Küchenmontage?",
            answer: "Eine Standardküche (3-4 Meter) montieren wir in 4-6 Stunden, eine größere Küche mit Insel oder vielen Geräten in einem vollen Arbeitstag. Wichtig: Wir prüfen die Anschlüsse vorab, damit am Montagetag alles reibungslos läuft. Den genauen Zeitrahmen besprechen wir bei der Besichtigung."
        },
        {
            question: "Bauen Sie auch neu gekaufte Möbel auf (z.B. nach IKEA-Lieferung)?",
            answer: "Ja, wir bieten Möbelaufbau auch unabhängig vom Umzug an. Egal ob IKEA, Höffner, XXXLutz oder Online-Bestellung: Wir bauen Ihre neuen Möbel fachgerecht auf und entsorgen das Verpackungsmaterial. Oft sind wir schneller und günstiger als der Montageservice des Möbelhauses."
        },
        {
            question: "Was passiert, wenn beim Abbau Teile fehlen oder kaputt sind?",
            answer: "Beim Abbau sammeln wir alle Schrauben, Dübel und Kleinteile in beschrifteten Beuteln. Sollten Teile fehlen oder beschädigt sein, haben wir gängiges Ersatzmaterial dabei. Bei Spezialbeschlägen bestellen wir das passende Teil – damit Ihr Möbelstück sicher steht."
        },
        {
            question: "Kann ich die Montage auch ohne Umzug buchen?",
            answer: "Selbstverständlich. Viele unserer Kunden buchen uns ausschließlich für Montagearbeiten: Küchen einbauen, Kleiderschränke aufbauen, Lampen anhängen oder Gardinenstangen befestigen. Rufen Sie uns an oder schreiben Sie uns – wir vereinbaren zeitnah einen Termin."
        }
    ];
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
