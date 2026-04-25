<script lang="ts">
    import { Stethoscope, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import ServiceReviews from "$lib/components/ServiceReviews.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Praxisumzug" }
    ]);

    const faqs = [
        {
            question: "Müssen medizinische Geräte nach einem Praxisumzug erneut geprüft werden?",
            answer: "Ja. Die Medizinprodukte-Betreiberverordnung (MPBetreibV) schreibt vor, dass aktive Medizinprodukte – also Geräte mit elektrischen Bauteilen wie Behandlungsstühle, Sterilisatoren, Röntgenanlagen oder Ultraschallgeräte – nach einem Standortwechsel und Neuinstallation einer Sicherheitstechnischen Kontrolle (STK) unterzogen werden müssen, bevor sie wieder in Betrieb genommen werden dürfen. Wer diesen Schritt überspringt, riskiert im Schadensfall persönliche Haftung und möglicherweise erloschene Wartungsverträge. Wir planen STK-Termine fest in den Umzugsablauf ein und koordinieren direkt mit Ihrem Geräteservice oder dem Gerätehersteller."
        },
        {
            question: "Was kostet ein Praxisumzug in Hildesheim?",
            answer: "Die Kosten richten sich nach Praxisgröße, Anzahl der Behandlungszimmer und dem Umfang der medizintechnischen Ausstattung. Eine Einzelpraxis mit 2–3 Behandlungsräumen liegt je nach Aufwand zwischen 2.500 und 6.000 Euro. Nach einer kostenlosen Vor-Ort-Besichtigung erhalten Sie ein verbindliches Festpreisangebot – ohne versteckte Nachberechnungen."
        },
        {
            question: "Wie transportieren Sie empfindliche medizinische Geräte sicher?",
            answer: "Medizinische Geräte werden einzeln inventarisiert, mit Spezialpolsterung gesichert und aufrecht transportiert. Schwere Geräte wie Behandlungsstühle, Röntgenanlagen oder Ultraschallgeräte werden fachgerecht demontiert, in Schutzfolie eingeschlagen und erschütterungsarm verladen. Beim Aufbau arbeiten wir eng mit Ihren Techniker- oder Gerätehersteller-Vorgaben zusammen."
        },
        {
            question: "Wie minimieren Sie die Praxis-Ausfallzeit?",
            answer: "Die meisten Praxisumzüge finden am Wochenende statt – Freitagnachmittag bis Sonntag. So können Sie am Montagmorgen planmäßig Patienten empfangen. Wir erstellen vorab einen detaillierten Ablaufplan: Welche Räume werden zuerst umgezogen? Was muss am neuen Standort als Erstes funktionieren? So kommen keine Überraschungen."
        },
        {
            question: "Wie gehen Sie mit Patientenakten und sensiblen Unterlagen um?",
            answer: "Patientenakten und alle DSGVO-relevanten Unterlagen werden ausschließlich in verschlossenen, versiegelten Behältern transportiert. Jede Kiste wird inventarisiert und kann nur von autorisierten Personen geöffnet werden. Alternativ können sensible Dokumente von Ihrem Praxisteam selbst gesichert und übergeben werden."
        },
        {
            question: "Können Sie auch Zahnarztpraxen mit schweren Behandlungsstühlen umziehen?",
            answer: "Ja. Zahnarztstühle, Behandlungseinheiten und Sterilisationsgeräte gehören zu den anspruchsvollsten Transportgütern – und wir haben Erfahrung damit. Behandlungseinheiten werden fachgerecht demontiert, alle Flüssigkeitsanschlüsse gesichert, und der Aufbau erfolgt nach Herstellervorgaben oder in Abstimmung mit dem Geräteservice."
        },
        {
            question: "Bieten Sie auch Praxisumzüge außerhalb von Hildesheim an?",
            answer: "Ja, wir führen Praxisumzüge im gesamten Großraum Niedersachsen durch – darunter Hannover, Braunschweig, Wolfsburg, Göttingen und Salzgitter. Für eine kostenlose Besichtigung kommen wir selbstverständlich auch zu Ihnen."
        },
        {
            question: "Wer ist mein Ansprechpartner während des Umzugs?",
            answer: "Sie erhalten einen festen Projektkoordinator, der vom ersten Besichtigungstermin bis zur vollständigen Einrichtung am neuen Standort Ihr persönlicher Ansprechpartner ist. Er koordiniert alle Abläufe, überwacht den Umzugstag vor Ort und ist für Ihr Team jederzeit erreichbar."
        },
        {
            question: "Ist der Praxisumzug steuerlich absetzbar?",
            answer: "Ja, die Kosten eines betrieblichen Praxisumzugs sind vollständig als Betriebsausgabe steuerlich absetzbar – Transport, Montage, Halteverbotszone und Projektkoordination. Sie erhalten von uns eine detaillierte Rechnung mit allen Einzelpositionen, die Ihr Steuerberater direkt verwenden kann."
        }
    ];
</script>

<MetaTags
    title="Praxisumzug Hildesheim – Arzt & Zahnarzt | Aust Umzüge"
    description="Nach einem Praxisumzug schreibt die MPBetreibV eine Sicherheitsprüfung vor – wir koordinieren STK-Termine mit Ihrem Geräteservice. Festpreis, DSGVO-konform, Wochenendservice."
    keywords="Praxisumzug Hildesheim, Arztpraxis umziehen, Zahnarztpraxis umziehen, medizinische Geräte transportieren, Praxisverlegung, MPBetreibV STK Praxisumzug"
    canonical="https://www.aust-umzuege.de/leistungen/praxisumzug"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.praxisumzug} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Günther Otto" },
    "datePublished": "2023-03-01",
    "reviewBody": "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc. Selbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich. Mit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe."
}} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Werner Ströer" },
    "datePublished": "2025-05-01",
    "reviewBody": "Wir haben in der letzten Woche mit Firma Aust unseren Umzug vollzogen. Es hat alles vorzüglich geklappt. Die Mitarbeiter waren pünktlich vor Ort, haben sofort angepackt. Die Möbel wurden fachmännisch abgebaut, ordentlich verstaut und ohne irgendeinen Schaden wieder aufgebaut. Mein Fazit: Super Arbeit, immer wieder. Hier gebe ich eine volle Empfehlung."
}} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Stethoscope size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Praxisumzug Hildesheim</h1>
            <p class="service-subtitle">
                Arzt- und Zahnarztpraxen umziehen – sicher, diskret, ohne lange Ausfallzeit.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Medizinische Praxen umziehen – ein Spezialgebiet</h2>
                <p>
                    Ein Praxisumzug ist kein gewöhnlicher Büroumzug. Behandlungsstühle, Röntgenanlagen,
                    Ultraschallgeräte und Sterilisatoren sind teuer, empfindlich und teils schwer zu demontieren.
                    Patientenakten unterliegen dem Datenschutz. Und jeder Tag, an dem die Praxis nicht geöffnet
                    ist, bedeutet entgangene Einnahmen und wartende Patienten.
                </p>
                <div class="hook-box">
                    <p class="hook-box__lead">Was viele Praxisinhaber erst nach dem Umzug erfahren:</p>
                    <p>
                        Medizinische Geräte dürfen nach einem Standortwechsel nicht einfach wieder eingeschaltet werden.
                        Die Medizinprodukte-Betreiberverordnung (MPBetreibV) schreibt nach jeder Neuinstallation eine
                        Sicherheitstechnische Kontrolle (STK) vor – ohne diese Prüfung erlischt im Schadensfall die
                        Betreiberhaftung. Wir planen STK-Termine fest in den Umzugsablauf ein und koordinieren direkt
                        mit Ihrem Geräteservice, bevor die erste Sprechstunde beginnt.
                    </p>
                </div>
                <p>
                    Wir planen Praxisumzüge mit derselben Sorgfalt, die Sie von Ihrer eigenen Arbeit kennen:
                    strukturiert, ohne Improvisation, mit klaren Verantwortlichkeiten. Ihr Festpreisangebot erhalten
                    Sie nach einer kostenlosen Vor-Ort-Besichtigung – kein Telefonangebot ins Blaue.
                </p>

                <h3 class="highlight-title">Unsere Leistungen beim Praxisumzug:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Fachgerechter Transport medizintechnischer Geräte und Behandlungseinheiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>DSGVO-konformer Transport von Patientenakten in versiegelten Behältern</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Demontage und Montage von Praxismobiliar und Einbauschränken</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Wochenend- und Nachtservice für minimale Patientenausfallzeit</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Persönlicher Projektkoordinator von Planung bis Fertigstellung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Halteverbotszone an alter und neuer Adresse – wir beantragen alles für Sie</span>
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So läuft ein Praxisumzug mit uns ab</h2>

                <p>
                    <strong>1. Kostenlose Besichtigung und Bestandsaufnahme:</strong> Wir kommen in Ihre Praxis,
                    erfassen alle Geräte, Möbel, Aktenbestände und Besonderheiten. Gemeinsam legen wir fest,
                    welche Geräte von externen Technikern demontiert werden müssen und was wir direkt übernehmen
                    können. Das Ergebnis: ein realistischer Zeitplan und ein verbindlicher Festpreis.
                </p>
                <p>
                    <strong>2. Planung des Umzugswochenendes:</strong> Die meisten Praxen ziehen freitags nach
                    Dienstschluss um, sodass am Montagmorgen planmäßig Sprechstunde stattfinden kann. Wir
                    erstellen einen detaillierten Raumplan für den neuen Standort: Was kommt wohin? Welches Zimmer
                    wird zuerst eingerichtet? So gibt es am Umzugstag keinen Leerlauf.
                </p>
                <p>
                    <strong>3. Transport und STK-Koordination:</strong> Behandlungseinheiten, Röntgengeräte,
                    Ultraschall und Sterilisationsgeräte werden einzeln dokumentiert, mit Spezialpolsterung
                    gesichert und erschütterungsarm verladen. Gleichzeitig vereinbaren wir die gesetzlich
                    vorgeschriebene Sicherheitstechnische Kontrolle (STK nach MPBetreibV) mit Ihrem Geräteservice –
                    so steht alles am Montagmorgen nicht nur an Ort und Stelle, sondern darf auch betrieben werden.
                </p>
                <p>
                    <strong>4. Datenschutzkonformer Aktentransport:</strong> Alle Patientenakten und sonstigen
                    sensiblen Unterlagen werden in verschlossenen, nummerierten Behältern transportiert und nur
                    an autorisierte Personen übergeben. Auf Wunsch führen wir ein lückenloses Übergabeprotokoll.
                </p>
                <p>
                    <strong>5. Aufbau und Einrichtung am neuen Standort:</strong> Praxismobiliar, Einbauschränke
                    und Empfangstheken werden nach Ihrem Raumkonzept aufgebaut. Wir räumen das Lager, stellen
                    die Wartezimmermöbel auf und sorgen dafür, dass Ihre Praxis betriebsbereit ist, bevor wir gehen.
                </p>
                <p>
                    <strong>6. Nachbereitung:</strong> Altes Mobiliar, das nicht mehr benötigt wird, entsorgen
                    oder lagern wir auf Wunsch. Die alte Praxisfläche wird besenrein übergeben, damit Sie sich
                    voll auf den Neustart konzentrieren können.
                </p>

                <h2 class="section-title">Welche Praxistypen wir umziehen</h2>
                <p>
                    Jede Fachrichtung hat ihre eigenen Anforderungen – und wir kennen sie:
                </p>
                <ul class="feature-list" style="margin-bottom: var(--space-6);">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Allgemein- und Facharztpraxen</strong> – Behandlungsliegen, EKG-Geräte, Ultraschall</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Zahnarztpraxen</strong> – Behandlungsstühle, Sterilisatoren, Röntgeneinheiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Physio- und Ergotherapiepraxen</strong> – Behandlungsliegen, Trainingsgeräte, Großmobiliar</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Augenarztpraxen</strong> – Spaltlampen, Perimeter, empfindliche Optik</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Psychotherapeutische Praxen</strong> – schonender, diskreter Transport</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span><strong>Tierarztpraxen</strong> – Diagnose- und Behandlungsgeräte, Apothekenlager</span>
                    </li>
                </ul>

                <h3 class="highlight-title">Warum Praxen in Hildesheim uns vertrauen</h3>
                <p>
                    Als lokales Unternehmen sind wir schnell vor Ort – für die kostenlose Besichtigung, für
                    die Planung und am Umzugstag selbst. Wir kennen die Hildesheimer Ärztehaus-Standorte,
                    die Parksituationen in der Innenstadt und die baurechtlichen Besonderheiten älterer
                    Praxisgebäude. Diese lokale Kenntnis spart Zeit und verhindert Überraschungen.
                </p>
                <p>
                    Wichtig: Wir arbeiten diskret. Kein Werbeschild am LKW, keine auffälligen Aufkleber.
                    Praxisumzüge finden häufig statt, wenn Patienten und Mitbewerber noch nichts davon wissen
                    sollen – das respektieren wir.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Benötigen Sie eine <a href="/leistungen/halteverbot">Halteverbotszone</a> vor dem Ärztehaus?
                    Wir beantragen diese für Sie. Falls Geräte oder Akten vorübergehend eingelagert werden müssen,
                    bieten wir sichere <a href="/leistungen/lagerung">Lagerräume</a> mit flexiblen Laufzeiten.
                    Für Büro- und Betriebsumzüge steht Ihnen unser <a href="/leistungen/firmenumzug">Firmenumzug-Service</a> zur Verfügung.
                </p>
            </div>

            <div class="cta-column">
                <ServiceReviews reviews={[
                    {
                        author: "Günther Otto",
                        text: "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc.\n\nSelbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Perfektes Teamwork – Professionalität und Vertrauen untereinander auf jedem Schritt. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich.\n\nMit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe. Kann ich wärmstens weiterempfehlen.",
                        url: "https://share.google/e6uoSp91dO84iF2Iy"
                    },
                    {
                        author: "Stephan Sausel",
                        text: "Fachkundiges Unternehmen. Nicht nur für Umzüge von Haus zu Haus. Hat das Verpacken und die Sicherung verschiedener Werkzeuge, Möbel, Geräte und Machinen für das Verschiffen in einem Container nach Afrika erfolgreich übernommen. Kann für solche Aufgaben empfohlen werden.",
                        url: "https://share.google/NgfgSR4Qtab61P0oA"
                    },
                    {
                        author: "Werner Ströer",
                        text: "Wir haben in der letzten Woche mit Firma Aust unseren Umzug vollzogen. Es hat alles vorzüglich geklappt. Die Mitarbeiter waren pünktlich vor Ort, haben sofort angepackt. Die Möbel (teilweise kompliziert) wurden fachmännisch abgebaut, ordentlich verstaut und ohne irgendeinen Schaden wieder aufgebaut.\n\nMein Fazit: Super Arbeit, immer wieder. Hier gebe ich eine volle Empfehlung.",
                        url: "https://share.google/hiPith7uQXcwi9c2F"
                    }
                ]} />
                <div class="cta-box">
                    <h3>Praxisumzug planen?</h3>
                    <p>
                        Kostenlose Besichtigung und verbindliches Festpreisangebot – wir kommen zu Ihnen.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Beratungsgespräch anfragen"
                            href="/kontakt"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            showArrow={false}
                        />
                    </div>
                </div>
            </div>
        </div>

        <FAQSection {faqs} />
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
        background-color: #f0fdf4;
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
        color: #1a202c;
        margin-bottom: var(--space-6);
    }

    .cta-button-wrapper {
        width: 100%;
    }

    .cta-button-wrapper :global(.cta-button) {
        width: 100%;
        justify-content: center;
    }

    .divider {
        margin: var(--space-3) 0;
        color: #1a202c;
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .hook-box {
        background-color: #eff6ff;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        padding: var(--space-5) var(--space-6);
        margin-bottom: var(--space-6);
    }

    .hook-box__lead {
        font-weight: var(--font-semibold);
        color: var(--color-info-bar);
        margin-bottom: var(--space-2) !important;
        font-size: var(--text-base) !important;
    }

    .hook-box p:last-child {
        margin-bottom: 0 !important;
    }
</style>
