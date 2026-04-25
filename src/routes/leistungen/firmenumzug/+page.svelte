<script lang="ts">
    import { Building2, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import ServiceReviews from "$lib/components/ServiceReviews.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Firmenumzug" }
    ]);

    const faqs = [
        {
            question: "Wer haftet, wenn beim Firmenumzug etwas beschädigt wird?",
            answer: "Die gesetzliche Spediteushaftung ist ohne schriftliche Wertdeklaration stark begrenzt: §431 HGB deckt nur 8,33 Sonderziehungsrechte pro Kilogramm des beschädigten Gutes – das sind etwa 10–12 Euro pro Kilogramm. Ein 3 kg schweres Notebook mit einem Neupreis von 1.500 Euro wäre damit mit rund 35 Euro abgedeckt. Für Server, Spezialtechnik oder hochwertige Büroausstattung ist das ein erhebliches Risiko. Die Lösung: eine schriftliche Wertdeklaration vor dem Umzug, die den tatsächlichen Wert der Güter festhält. Wir klären das mit Ihnen bei der Besichtigung – verbindlich und dokumentiert."
        },
        {
            question: "Was kostet ein Firmenumzug in Hildesheim?",
            answer: "Die Kosten richten sich nach Bürogröße, Arbeitsplatzzahl und Zusatzleistungen wie IT-Transport oder Archivierung. Ein kleines Büro (5-10 Arbeitsplätze) liegt zwischen 2.000 und 5.000 Euro, größere Standortwechsel können 10.000 Euro und mehr kosten. Wir erstellen nach einer Besichtigung ein detailliertes Festpreisangebot, das Sie sicher budgetieren können."
        },
        {
            question: "Wie minimieren Sie die Ausfallzeit unseres Unternehmens?",
            answer: "Wir planen Firmenumzüge bevorzugt am Wochenende oder nachts. Durch präzise Ablaufpläne, vorbereitete Umzugskisten-Systeme und ein erfahrenes Team ist Ihr Betrieb am nächsten Werktag wieder voll einsatzbereit. Bei größeren Umzügen setzen wir einen Projektkoordinator ein, der alle Gewerke steuert."
        },
        {
            question: "Sind Firmenumzugskosten steuerlich absetzbar?",
            answer: "Ja, die Kosten eines Firmenumzugs sind vollständig als Betriebsausgaben absetzbar. Das gilt für Transport, Montage, Halteverbotszone, Verpackung und unsere Projektkoordination. Sie erhalten von uns eine detaillierte Rechnung, die Ihre Buchhaltung direkt verarbeiten kann."
        },
        {
            question: "Können Sie auch IT-Equipment und Server transportieren?",
            answer: "Ja. Computer, Server, Netzwerktechnik und Drucker werden fachgerecht demontiert, antistatisch verpackt, sicher transportiert und am neuen Standort wieder angeschlossen. Auf Wunsch koordinieren wir den IT-Umzug mit Ihrem Administrator, damit die Systeme schnellstmöglich wieder laufen."
        },
        {
            question: "Bieten Sie einen persönlichen Umzugskoordinator?",
            answer: "Ja. Bei jedem Firmenumzug erhalten Sie einen festen Ansprechpartner, der den gesamten Prozess steuert: Zeitpläne erstellen, Mitarbeiter informieren, Gewerke koordinieren und am Umzugstag vor Ort die Regie führen. So haben Sie den Kopf frei für Ihr Kerngeschäft."
        },
        {
            question: "Wie gehen Sie mit vertraulichen Dokumenten um?",
            answer: "Vertrauliche Unterlagen transportieren wir auf Wunsch in versiegelten Behältern, die nur von autorisierten Personen geöffnet werden. Alternativ können sensible Dokumente von Ihren Mitarbeitern selbst transportiert werden. Unser Team ist im datenschutzkonformen Umgang mit Geschäftsunterlagen geschult."
        },
        {
            question: "Können Sie auch Praxis- oder Ladenumzüge durchführen?",
            answer: "Ja, wir haben Erfahrung mit Arztpraxen, Zahnarztpraxen, Anwaltskanzleien und Einzelhandelsgeschäften. Medizinische Geräte, Ladeneinrichtungen und empfindliche Technik transportieren wir fachgerecht. Auch hier planen wir den Umzug so, dass Ihre Ausfallzeit minimal bleibt."
        }
    ];
</script>

<MetaTags
    title="Firmenumzug Hildesheim – Büro & Gewerbe | Aust Umzüge"
    description="§431 HGB begrenzt die Spediteushaftung auf 8,33 SDR/kg – ein 3kg-Laptop wäre mit ~35 € versichert. Firmenumzug Hildesheim mit schriftlicher Wertdeklaration und Festpreis."
    keywords="Firmenumzug Hildesheim, Büroumzug, Geschäftsumzug, IT-Umzug, Betriebsumzug"
    canonical="https://www.aust-umzuege.de/leistungen/firmenumzug"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.firmenumzug} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Günther Otto" },
    "datePublished": "2023-03-01",
    "reviewBody": "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc. Selbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Der Preis: unschlagbar. Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich. Mit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe."
}} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Stephan Sausel" },
    "datePublished": "2025-05-01",
    "reviewBody": "Fachkundiges Unternehmen. Nicht nur für Umzüge von Haus zu Haus. Hat das Verpacken und die Sicherung verschiedener Werkzeuge, Möbel, Geräte und Machinen für das Verschiffen in einem Container nach Afrika erfolgreich übernommen. Kann für solche Aufgaben empfohlen werden."
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
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/firmenumzug-hildesheim-umzugshelfer-bueroumzug.webp",
    "url": "https://www.aust-umzuege.de/leistungen/firmenumzug",
    "name": "Firmenumzug Hildesheim – Aust Umzüge Team beim Büroumzug",
    "description": "Zwei Mitarbeiter von Aust Umzüge koordinieren einen Firmenumzug in Hildesheim. Professioneller Büro- und Gewerbeumzug mit minimaler Ausfallzeit.",
    "author": {
        "@type": "Organization",
        "name": "Aust Umzüge",
        "url": "https://www.aust-umzuege.de"
    },
    "license": "https://www.aust-umzuege.de/impressum",
    "acquireLicensePage": "https://www.aust-umzuege.de/kontakt",
    "creditText": "Aust Umzüge Hildesheim",
    "creator": { "@type": "Organization", "name": "Aust Umzüge und Haushaltsauflösungen", "url": "https://www.aust-umzuege.de" },
    "copyrightNotice": "© 2026 Aust Umzüge und Haushaltsauflösungen. Alle Rechte vorbehalten.",
    "width": 2252,
    "height": 1643
}} />

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
            <h1 class="service-title">Firmenumzug Hildesheim</h1>
            <p class="service-subtitle">
                Effiziente Standortwechsel für Büros, Praxen und Betriebe.
            </p>
        </header>

        <div class="hero-image">
            <img
                src="/firmenumzug-hildesheim-umzugshelfer-bueroumzug.webp"
                srcset="/firmenumzug-hildesheim-umzugshelfer-bueroumzug-400w.webp 400w,
                        /firmenumzug-hildesheim-umzugshelfer-bueroumzug-600w.webp 600w,
                        /firmenumzug-hildesheim-umzugshelfer-bueroumzug-800w.webp 800w,
                        /firmenumzug-hildesheim-umzugshelfer-bueroumzug.webp 2252w"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 960px"
                alt="Aust Umzüge Mitarbeiter koordinieren Firmenumzug in Hildesheim"
                width="2252"
                height="1643"
                fetchpriority="high"
            />
        </div>

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

                <div class="hook-box">
                    <p class="hook-box__lead">Wichtig: Die gesetzliche Spediteushaftung ist ohne schriftliche Wertdeklaration stark begrenzt.</p>
                    <p>
                        Nach §431 HGB haftet der Spediteur nur für <strong>8,33 Sonderziehungsrechte
                        pro Kilogramm</strong> – rund 10–12 Euro je Kilo. Ein 3 kg schweres Notebook
                        mit 1.500 Euro Neupreis wäre damit mit etwa <strong>35 Euro</strong> abgedeckt.
                        Für Server, Spezialtechnik und hochwertige Ausstattung ist das eine erhebliche Lücke.
                    </p>
                    <p>
                        Eine schriftliche <strong>Wertdeklaration</strong> vor dem Umzug schließt diese Lücke
                        und hält den tatsächlichen Warenwert verbindlich fest. Wir klären das gemeinsam
                        bei der Besichtigung – dokumentiert, bevor der erste Karton bewegt wird.
                    </p>
                </div>

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

                <h2 class="section-title" style="margin-top: var(--space-16);">Firmenumzug: Effizient geplant, schnell umgesetzt</h2>
                <p>
                    Ein Firmenumzug ist kein normaler Umzug. Hier zählt jede Stunde – denn jeder Tag Stillstand kostet Ihr Unternehmen Geld. Deshalb planen wir Ihren Standortwechsel mit militärischer Präzision.
                </p>
                <p>
                    <strong>1. Projektplanung und Bestandsaufnahme:</strong> Wir besuchen Ihre Räumlichkeiten, erfassen alle Möbel, IT-Systeme, Aktenbestände und Spezialgeräte. Gemeinsam erstellen wir einen detaillierten Zeitplan: Wann wird was abgebaut? In welcher Reihenfolge werden die Abteilungen umgezogen? Welche Bereiche müssen zuerst einsatzbereit sein?
                </p>
                <p>
                    <strong>2. Umzug am Wochenende oder nachts:</strong> Die meisten unserer Firmenumzüge finden außerhalb der Geschäftszeiten statt – am Freitagnachmittag, über das Wochenende oder in der Nacht. So starten Ihre Mitarbeiter am Montagmorgen direkt am neuen Standort in die Arbeitswoche.
                </p>
                <p>
                    <strong>3. IT- und Servertransport:</strong> Computer, Netzwerktechnik und Server werden fachgerecht demontiert, antistatisch verpackt und sicher transportiert. Am neuen Standort bauen wir alles nach Ihrem Plan wieder auf. Auf Wunsch koordinieren wir den Prozess mit Ihrem IT-Administrator, damit die Systeme schnellstmöglich wieder laufen.
                </p>
                <p>
                    <strong>4. Akten- und Archivtransport:</strong> Vertrauliche Unterlagen transportieren wir in versiegelten Behältern. Jede Kiste wird inventarisiert und beschriftet, damit am neuen Standort alles sofort am richtigen Platz ist. Auf Wunsch übernehmen wir auch die datenschutzkonforme Aktenvernichtung.
                </p>
                <p>
                    <strong>5. Montage von Büromöbelsystemen:</strong> Moderne Büromöbel wie USM, Vitra oder Steelcase erfordern Fachwissen beim Ab- und Aufbau. Unsere Monteure kennen die gängigen Systeme und bauen Ihre Arbeitsplätze schnell und sauber wieder auf.
                </p>
                <p>
                    <strong>6. Entsorgung und Neuausstattung:</strong> Alte Möbel, die nicht mehr benötigt werden, entsorgen wir fachgerecht. Falls Sie neue Büromöbel bestellt haben, koordinieren wir die Anlieferung und den Aufbau direkt mit den Lieferanten.
                </p>

                <h2 class="section-title">Warum Hildesheimer Unternehmen uns vertrauen</h2>
                <p>
                    Als lokales Umzugsunternehmen kennen wir die Hildesheimer Wirtschaft. Viele Firmen, Arztpraxen, Anwaltskanzleien und Einzelhändler in der Region haben bereits mit uns zusammengearbeitet – und empfehlen uns weiter.
                </p>
                <p>
                    Der Vorteil eines lokalen Partners: Kurze Wege, schnelle Reaktionszeiten und persönliche Betreuung. Wenn am Umzugstag spontan etwas fehlt, sind wir in 15 Minuten wieder da. Wenn Sie vorab noch Fragen haben, kommen wir vorbei. Diese Nähe macht den Unterschied.
                </p>
                <p>
                    Wir haben Erfahrung mit allen Arten von Geschäftsumzügen: Büros in der Innenstadt, Praxen im Ärztehaus, Produktionsbetriebe im Gewerbegebiet, Einzelhandelsgeschäfte in der Fußgängerzone. Jede Branche hat ihre eigenen Anforderungen – und wir kennen sie.
                </p>
                <p>
                    Besonders wichtig: Wir verstehen, dass Diskretion bei Firmenumzügen entscheidend ist. Oft soll der Umzug nicht öffentlich kommuniziert werden, bevor er abgeschlossen ist. Wir arbeiten unauffällig und professionell – ohne große Schilder am LKW oder Werbung an Ihrer alten Adresse.
                </p>

                <h3 class="highlight-title">Häufige Herausforderungen bei Firmenumzügen</h3>
                <p>
                    Das größte Problem bei Firmenumzügen ist die Koordination. Viele Gewerke müssen gleichzeitig arbeiten: Elektriker, IT-Techniker, Maler, Telefonanbieter. Wir übernehmen die zentrale Koordination und sorgen dafür, dass alles reibungslos abläuft.
                </p>
                <p>
                    Eine weitere Herausforderung: der Zeitdruck. Oft sind die neuen Räume erst kurz vor dem Umzug fertig – dann muss alles sehr schnell gehen. Wir sind darauf vorbereitet und können bei Bedarf auch mit mehreren Teams parallel arbeiten.
                </p>
                <p>
                    Und dann gibt es noch die Frage der Ausfallzeit: Wie lange steht der Betrieb still? Unser Ziel ist immer: maximal ein Wochenende. Bei kleineren Büros schaffen wir es oft sogar, den Umzug so zu organisieren, dass am Montag normal weitergearbeitet werden kann.
                </p>

                <h3 class="highlight-title">Firmenumzüge in der Region</h3>
                <p>
                    Wir führen Firmenumzüge nicht nur in Hildesheim durch. Regelmäßig sind wir im Einsatz für Betriebe in der gesamten Region – auch für einen <a href="/firmenumzug-wolfsburg">Firmenumzug in Wolfsburg</a> kommen wir zur kostenlosen Besichtigung.
                </p>
                <p>
                    Betreiben Sie eine Arzt- oder Zahnarztpraxis? Für den Transport medizinischer Geräte und den datenschutzkonformen Umzug von Patientenakten haben wir einen eigenen <a href="/leistungen/praxisumzug">Praxisumzug-Service</a>.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Viele Firmenumzüge benötigen eine <a href="/leistungen/halteverbot">Halteverbotszone</a> an der alten und neuen Adresse – wir beantragen diese für Sie. Falls Sie IT-Equipment oder Akten vorübergehend lagern müssen, bieten wir sichere <a href="/leistungen/lagerung">Lagerräume</a>. Und für die Montage komplexer Büromöbelsysteme steht unser <a href="/leistungen/montage">Montageservice</a> bereit.
                </p>
            </div>

            <div class="cta-column">
                <ServiceReviews reviews={[
                    {
                        author: "Günther Otto",
                        text: "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Wichtig: Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc.\n\nSelbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Der Preis: unschlagbar. Selbst wenn dieser höher gewesen wäre, wäre jeder Euro die Arbeit wert: Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Perfektes Teamwork: 2 Männer mit Tragegurt tragen schweren Drucker durch einen engen Gang, werden dabei von hinten eng umschlungen von zwei weiteren im Rückgrat gestützt im Gänsemarsch unterstützt. Sah zwar lustig aus, zeugt aber von Professionalität, Vertrauen untereinander und Teamwork. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich mit Anweisungen, fair zu seinen Mitarbeitern und packte selbst persönlich an.\n\nMit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe. Kann ich wärmstens weiterempfehlen.",
                        url: "https://share.google/e6uoSp91dO84iF2Iy"
                    },
                    {
                        author: "Stephan Sausel",
                        text: "Fachkundiges Unternehmen. Nicht nur für Umzüge von Haus zu Haus. Hat das Verpacken und die Sicherung verschiedener Werkzeuge, Möbel, Geräte und Machinen für das Verschiffen in einem Container nach Afrika erfolgreich übernommen. Kann für solche Aufgaben empfohlen werden.",
                        url: "https://share.google/NgfgSR4Qtab61P0oA"
                    },
                    {
                        author: "Werner Ströer, Hildesheim",
                        text: "Wir haben in der letzten Woche mit Firma Aust unseren Umzug vollzogen. Es hat alles vorzüglich geklappt. Die Mitarbeiter waren pünktlich vor Ort, haben sofort angepackt. Die Möbel (teilweise kompliziert) wurden fachmännisch abgebaut, ordentlich verstaut und ohne irgendeinen Schaden wieder aufgebaut. Selbst nach einem sehr anstrengenden Arbeitstag haben die Mitarbeiter mir noch die Freude gemacht und große, schwere Bilder aufgehangen.\n\nMein Fazit: Super Arbeit, immer wieder. Ich bin normalerweise zurückhaltend und vorsichtig. Hier aber gebe ich eine volle Empfehlung.",
                        url: "https://share.google/hiPith7uQXcwi9c2F"
                    }
                ]} />
                <div class="cta-box">
                    <h3>Projekt anfragen?</h3>
                    <p>
                        Gerne erstellen wir Ihnen ein individuelles Angebot für
                        Ihr Unternehmen.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Beratungsgespräch"
                            href="/kontakt"
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
    .service-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .service-detail__container {
        max-width: 1000px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .hero-image {
        margin-bottom: var(--space-12);
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .hero-image img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
        aspect-ratio: 16 / 9;
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
