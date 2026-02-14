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

                <h2 class="section-title" style="margin-top: var(--space-16);">Möbelmontage: Vom Abbau bis zum perfekten Sitz</h2>
                <p>
                    Große Kleiderschränke, Einbauküchen, modulare Wohnwände – viele Möbel lassen sich nur zerlegt transportieren. Und genau hier beginnt die Herausforderung: Ein fachgerechter Abbau und Aufbau erfordert Erfahrung, das richtige Werkzeug und ein gutes Auge für Details.
                </p>
                <p>
                    <strong>1. Professioneller Abbau:</strong> Wir demontieren Ihre Möbel sorgfältig, sammeln alle Schrauben und Beschläge in beschrifteten Beuteln und dokumentieren bei komplexen Systemen die Reihenfolge. So wissen wir beim Aufbau genau, was wohin gehört.
                </p>
                <p>
                    <strong>2. Sichere Verpackung:</strong> Abgebaute Teile werden einzeln verpackt, um Kratzer und Beschädigungen zu vermeiden. Glaselemente, Spiegel und empfindliche Oberflächen schützen wir mit Spezialverpackungen.
                </p>
                <p>
                    <strong>3. Transport und Aufbau:</strong> Am neuen Standort bauen wir Ihre Möbel fachgerecht wieder auf. Dabei achten wir darauf, dass Schranktüren gerade hängen, Schubladen sauber laufen und alles stabil steht.
                </p>
                <p>
                    <strong>4. Ausrichtung und Justierung:</strong> Nach dem Aufbau justieren wir Scharniere, richten Regale aus und prüfen die Standfestigkeit. Besonders bei Küchen ist Präzision wichtig – damit Arbeitsplatten passgenau sitzen und Elektrogeräte einwandfrei eingebaut sind.
                </p>
                <p>
                    <strong>5. Anschluss von Geräten:</strong> Waschmaschinen, Spülmaschinen, Herde und Dunstabzugshauben schließen wir fachgerecht an. Unsere zertifizierten Mitarbeiter kennen sich mit Wasser- und Elektroanschlüssen aus – und wissen, wann ein Elektriker hinzugezogen werden muss.
                </p>
                <p>
                    <strong>6. Entsorgung des Verpackungsmaterials:</strong> Wenn alles steht, räumen wir auf und entsorgen Kartons, Folien und Verpackungsmaterial. Sie müssen sich um nichts kümmern.
                </p>

                <h2 class="section-title">Montage auch ohne Umzug</h2>
                <p>
                    Viele unserer Kunden buchen uns ausschließlich für Montagearbeiten – unabhängig von einem Umzug. Sie haben bei IKEA, Höffner oder online neue Möbel bestellt und brauchen jemanden, der sie aufbaut? Wir sind Ihre Lösung.
                </p>
                <p>
                    Besonders bei großen Schranksystemen wie IKEA PAX, KALLAX oder BESTA lohnt sich der Profi: Was in der Aufbauanleitung einfach aussieht, entpuppt sich oft als stundenlange Fummelarbeit. Unsere Monteure kennen diese Systeme in- und auswendig und bauen sie routiniert auf.
                </p>
                <p>
                    Auch Küchenmontagen übernehmen wir gerne. Vom einfachen IKEA-Küchenblock bis zur hochwertigen Markenküche – wir passen Arbeitsplatten an, installieren Spülen, schließen Geräte an und sorgen dafür, dass alles perfekt sitzt.
                </p>
                <p>
                    Und wenn Sie nur Kleinigkeiten erledigt haben möchten – Lampen aufhängen, Regale anbringen, Gardinenstangen befestigen – auch das machen wir. Oft kombinieren Kunden mehrere Aufgaben in einem Termin, um die Anfahrtskosten optimal zu nutzen.
                </p>

                <h3 class="highlight-title">Häufige Montage-Herausforderungen</h3>
                <p>
                    Die größte Schwierigkeit bei Möbelmontagen ist oft nicht der Aufbau selbst, sondern die Anpassung an die örtlichen Gegebenheiten. Schiefe Wände, unebene Böden, niedrige Decken – in Altbauten ist selten etwas im rechten Winkel.
                </p>
                <p>
                    Unsere Monteure kennen diese Probleme und wissen, wie man Möbel auch in schwierigen Situationen stabil montiert. Wir unterlegen, justieren und passen an – bis alles perfekt steht.
                </p>
                <p>
                    Eine weitere Herausforderung: fehlende Teile. Gerade bei gebrauchten Möbeln oder nach mehreren Umzügen fehlen manchmal Schrauben, Dübel oder Beschläge. Wir haben gängiges Ersatzmaterial dabei und können oft vor Ort weiterhelfen. Bei Spezialteilen bestellen wir das Fehlende nach.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Montage wird oft zusammen mit einem <a href="/leistungen/privatumzug">Privatumzug</a> oder <a href="/leistungen/firmenumzug">Firmenumzug</a> gebucht. Falls Sie nur einzelne Möbelstücke transportieren lassen möchten, helfen unsere <a href="/leistungen/umzugshelfer">Umzugshelfer</a>. Und wenn Sie eine komplette Wohnung ausräumen lassen, ist unsere <a href="/leistungen/haushaltsaufloesung">Haushaltsauflösung</a> die richtige Wahl.
                </p>
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
