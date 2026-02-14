<script lang="ts">
    import { MessageSquare, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Umzugsberatung" }
    ]);

    const faqs = [
        {
            question: "Ist die Umzugsberatung wirklich kostenlos und unverbindlich?",
            answer: "Ja, komplett. Die Vor-Ort-Besichtigung, Beratung und Angebotserstellung sind kostenlos. Sie gehen keine Verpflichtung ein. Erst wenn Sie unser Angebot annehmen und den Auftrag erteilen, entstehen Kosten. Wir wollen Sie durch Qualität überzeugen, nicht durch Kleingedrucktes."
        },
        {
            question: "Wie lange dauert eine Besichtigung?",
            answer: "In der Regel 30-45 Minuten. Wir schauen uns alle Räume an, notieren Besonderheiten (Klavier, enges Treppenhaus, Dachgeschoss) und beantworten Ihre Fragen. Bei größeren Objekten oder komplexen Umzügen kann es etwas länger dauern. Wir nehmen uns die Zeit, die nötig ist."
        },
        {
            question: "Wann erhalte ich das Angebot nach der Besichtigung?",
            answer: "Innerhalb von 24-48 Stunden nach der Besichtigung erhalten Sie Ihr individuelles Festpreisangebot per E-Mail – transparent aufgeschlüsselt nach Leistungen, ohne versteckte Posten. In dringenden Fällen erstellen wir das Angebot noch am selben Tag."
        },
        {
            question: "Was sollte ich vor der Besichtigung wissen?",
            answer: "Sie müssen nichts vorbereiten. Hilfreich ist, wenn Sie ungefähr wissen, welche Möbel mitgenommen und welche entsorgt werden sollen. Außerdem: Gibt es einen Aufzug? In welchem Stockwerk liegt die Wohnung? Wie sieht die Parksituation aus? Je mehr Details wir kennen, desto genauer wird das Angebot."
        },
        {
            question: "Warum ist ein Festpreisangebot besser als ein Kostenvoranschlag?",
            answer: "Ein Kostenvoranschlag darf um bis zu 20% überschritten werden – böse Überraschungen sind möglich. Unser Festpreis steht. Der vereinbarte Preis ist der Endpreis, unabhängig davon, ob der Umzug länger dauert als geplant. Das gibt Ihnen volle Kostensicherheit."
        },
        {
            question: "Kann die Beratung auch telefonisch oder per Video erfolgen?",
            answer: "Für eine grobe Kostenschätzung reicht ein Telefonat oder Videocall oft aus. Für ein verbindliches Festpreisangebot empfehlen wir die Vor-Ort-Besichtigung, da nur so alle Details (Treppenhaus, Parkplatzsituation, schwere Möbelstücke) zuverlässig erfasst werden. Beides ist selbstverständlich kostenlos."
        },
        {
            question: "Wie vergleiche ich Umzugsangebote richtig?",
            answer: "Achten Sie darauf, dass die Angebote dieselben Leistungen umfassen: Verpackung, Transport, Montage, Versicherung und Halteverbot. Vergleichen Sie Festpreise statt Stundenpreise. Prüfen Sie, ob die Firma versichert ist und lesen Sie Bewertungen. Wir scheuen keinen Vergleich – holen Sie sich ruhig mehrere Angebote ein."
        }
    ];
</script>

<MetaTags
    title="Umzugsberatung Hildesheim | Aust Umzüge"
    description="Kostenlose und unverbindliche Umzugsberatung vor Ort. Wir planen Ihren Umzug individuell und erstellen ein Festpreisangebot."
    keywords="Umzugsberatung Hildesheim, kostenlose Beratung, Festpreis Umzug, Umzugsplanung"
    canonical="https://www.aust-umzuege.de/leistungen/umzugsberatung"
/>

<StructuredData schema={services.umzugsberatung} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <MessageSquare size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Umzugsberatung</h1>
            <p class="service-subtitle">
                Gute Planung ist der halbe Umzug – kostenlos & unverbindlich.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Wir nehmen uns Zeit für Sie</h2>
                <p>
                    Jeder Umzug ist anders. Damit es am Umzugstag keine bösen
                    Überraschungen gibt, ist eine sorgfältige Planung das A und
                    O. Wir kommen zu Ihnen nach Hause, besichtigen das Umzugsgut
                    und besprechen alle Details persönlich.
                </p>
                <p>
                    Auf Basis dieser Besichtigung erstellen wir Ihnen ein
                    maßgeschneidertes Festpreisangebot. So haben Sie volle
                    Kostentransparenz und die Sicherheit, dass an alles gedacht
                    wurde.
                </p>

                <h3 class="highlight-title">Ihr Vorteil:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Kostenloser Besichtigungstermin bei Ihnen vor Ort</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Exakte Einschätzung des Umzugsvolumens</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Beratung zu Verpackung, Montage und
                            Zusatzleistungen</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Verbindliches Festpreisangebot ohne versteckte
                            Kosten</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Persönlicher Ansprechpartner für alle Fragen</span
                        >
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">Was Sie von unserer Umzugsberatung erwarten können</h2>
                <p>
                    Eine gute Beratung ist der Grundstein für einen stressfreien Umzug. Wir nehmen uns Zeit, schauen uns alles genau an und planen gemeinsam mit Ihnen jeden Schritt.
                </p>
                <p>
                    <strong>1. Terminvereinbarung:</strong> Sie rufen uns an oder schreiben uns, und wir vereinbaren einen Termin für die Besichtigung – bei Ihnen zu Hause, zu einem Zeitpunkt, der Ihnen passt. Die Besichtigung ist komplett kostenlos und unverbindlich.
                </p>
                <p>
                    <strong>2. Vor-Ort-Besichtigung:</strong> Wir kommen zu Ihnen nach Hause und schauen uns alles genau an: Wie viele Zimmer? Welche Möbel? Gibt es besondere Herausforderungen wie enge Treppenhäuser, schwere Einzelstücke oder ein Klavier? Wie sieht die Parksituation aus? Gibt es einen Aufzug?
                </p>
                <p>
                    <strong>3. Bedarfsanalyse:</strong> Gemeinsam besprechen wir, was Sie alles benötigen: Verpackungsmaterial? Montage von Möbeln? Entsorgung alter Sachen? Halteverbotszone? Lagerung? Wir hören zu, beraten ehrlich und schlagen die optimale Lösung vor.
                </p>
                <p>
                    <strong>4. Festpreisangebot:</strong> Innerhalb von 24-48 Stunden erhalten Sie ein detailliertes Angebot mit allen Leistungen und einem verbindlichen Festpreis. Keine Überraschungen, keine versteckten Kosten. Der Preis steht – egal ob der Umzug länger dauert als geplant.
                </p>
                <p>
                    <strong>5. Planung und Koordination:</strong> Wenn Sie unser Angebot annehmen, planen wir den Umzug im Detail: Welches Team? Wie viele Helfer? Welche Fahrzeuge? Welche Materialien? Sie bekommen einen festen Ansprechpartner, der Sie bis zum Umzugstag begleitet.
                </p>
                <p>
                    <strong>6. Nachbetreuung:</strong> Auch nach dem Umzug sind wir für Sie da. Wenn etwas nicht passt, ein Möbelstück nachträglich montiert werden muss oder Sie noch Fragen haben – wir sind erreichbar.
                </p>

                <h2 class="section-title">Warum eine Beratung vor Ort so wichtig ist</h2>
                <p>
                    Viele Umzugsfirmen erstellen Angebote am Telefon oder per E-Mail. Das Problem: Ohne Besichtigung werden wichtige Details übersehen. Das enge Treppenhaus, das schwere Klavier im zweiten Stock, die fehlende Parkmöglichkeit vor der Tür – solche Dinge sieht man erst vor Ort.
                </p>
                <p>
                    Und genau hier entstehen später böse Überraschungen: Der Preis wird nachträglich erhöht, weil der Aufwand größer ist als gedacht. Bei uns passiert das nicht, denn wir schauen uns alles vorher genau an.
                </p>
                <p>
                    Ein weiterer Vorteil der Vor-Ort-Beratung: Sie lernen uns persönlich kennen. Sie sehen, mit wem Sie es zu tun haben, können Fragen stellen und bekommen ein Gefühl dafür, ob die Chemie stimmt. Vertrauen ist bei einem Umzug wichtig – schließlich lassen Sie fremde Menschen in Ihr Zuhause.
                </p>
                <p>
                    Außerdem können wir bei der Besichtigung direkt Tipps geben: Welche Möbel passen in die neue Wohnung? Was sollten Sie vorher aussortieren? Wie können Sie Kosten sparen, indem Sie selbst schon ein paar Kartons packen? Diese Beratung ist Gold wert – und bei uns kostenlos.
                </p>

                <h3 class="highlight-title">Festpreis vs. Kostenvoranschlag: Der Unterschied</h3>
                <p>
                    Viele Umzugsfirmen arbeiten mit Kostenvoranschlägen. Das klingt erst mal gut – aber Vorsicht: Ein Kostenvoranschlag darf gesetzlich um bis zu 20% überschritten werden. Aus 1.000 Euro werden dann schnell 1.200 Euro. Und Sie können nichts dagegen tun.
                </p>
                <p>
                    Wir arbeiten grundsätzlich mit Festpreisen. Der vereinbarte Preis steht – egal was kommt. Wenn der Umzug länger dauert, wenn unerwartete Probleme auftauchen, wenn es regnet oder schneit: Der Preis bleibt. Das gibt Ihnen volle Kostensicherheit.
                </p>
                <p>
                    Natürlich gilt das nur, wenn sich am Umfang nichts ändert. Wenn Sie uns bei der Besichtigung nicht erzählen, dass noch ein Keller ausgeräumt werden muss, können wir das nicht einkalkulieren. Aber solange alle Informationen auf dem Tisch liegen, ist der Preis fix.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Nach der Beratung entscheiden Sie, welche Leistungen Sie buchen möchten: <a href="/leistungen/privatumzug">Privatumzug</a>, <a href="/leistungen/firmenumzug">Firmenumzug</a>, <a href="/leistungen/seniorenumzug">Seniorenumzug</a> oder einzelne Services wie <a href="/leistungen/montage">Montage</a>, <a href="/leistungen/halteverbot">Halteverbot</a> oder <a href="/leistungen/lagerung">Lagerung</a>. Wir erstellen Ihnen ein maßgeschneidertes Angebot – genau passend zu Ihrem Bedarf.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Termin vereinbaren?</h3>
                    <p>
                        Rufen Sie uns an oder schreiben Sie uns für Ihren
                        kostenlosen Beratungstermin.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Termin anfragen"
                            href="/kontakt"
                            ariaLabel="Termin für Umzugsberatung anfragen"
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
        background-color: #e0f2fe;
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
