<script lang="ts">
    import { Archive, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import ServiceReviews from "$lib/components/ServiceReviews.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Entrümpelung" }
    ]);

    const faqs = [
        {
            question: "Was kostet eine Entrümpelung in Hildesheim?",
            answer: "Die Kosten richten sich nach Umfang, Zugänglichkeit und Zustand der Räumlichkeiten. Ein einzelner Keller liegt oft zwischen 200 und 600 Euro, eine vollständige Wohnungsentrümpelung zwischen 800 und 2.500 Euro. Gut erhaltene Gegenstände rechnen wir gegen die Kosten an – das senkt Ihren Preis spürbar. Nach einer kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot."
        },
        {
            question: "Was ist der Unterschied zwischen Entrümpelung und Haushaltsauflösung?",
            answer: "Die Entrümpelung ist in der Regel schneller und weniger komplex: Wir räumen einen oder mehrere Räume aus, sortieren, entsorgen fachgerecht und übergeben besenrein. Die Haushaltsauflösung ist umfangreicher – sie umfasst das vollständige Auflösen eines Haushalts, oft nach einem Todesfall oder Umzug ins Pflegeheim, mit besonderer Sorgfalt für persönliche Gegenstände und Dokumente. Für welche Leistung Sie sich entscheiden sollten, besprechen wir gerne bei der kostenlosen Besichtigung."
        },
        {
            question: "Können Sie auch Messie-Wohnungen entrümpeln?",
            answer: "Ja, wir haben umfangreiche Erfahrung mit Messie-Wohnungen und gehen dabei absolut diskret und professionell vor. Unser Team arbeitet zuverlässig, wertungsfrei und kennt die besonderen Anforderungen – von der Schädlingsbekämpfung bis zur Grundreinigung. Sprechen Sie uns vertraulich an."
        },
        {
            question: "Entrümpeln Sie auch einzelne Räume wie Keller, Dachboden oder Garage?",
            answer: "Ja, gerne. Wir übernehmen auch Teilentrümpelungen – ob einzelner Keller, Dachboden, Garage oder Abstellraum. Kein Auftrag ist zu klein. Wir kommen zur Besichtigung, schätzen den Aufwand realistisch ein und machen Ihnen ein faires Festpreisangebot."
        },
        {
            question: "Wie schnell können Sie mit der Entrümpelung beginnen?",
            answer: "Bei freien Kapazitäten können wir kurzfristig reagieren – manchmal schon innerhalb weniger Tage. Rufen Sie uns an oder schreiben Sie uns, und wir vereinbaren so schnell wie möglich einen Besichtigungstermin. Gerade wenn ein Mietvertrag ausläuft oder eine Wohnung schnell übergeben werden muss, helfen wir Ihnen zügig."
        },
        {
            question: "Was passiert mit noch brauchbaren Gegenständen?",
            answer: "Gut erhaltene Möbel, Elektrogeräte und Hausrat verkaufen wir an Händler oder spenden sie an soziale Einrichtungen in Hildesheim. Den Erlös rechnen wir transparent gegen unsere Kosten auf. So zahlen Sie am Ende weniger und brauchbare Dinge bekommen ein zweites Leben."
        },
        {
            question: "Bekomme ich einen Entsorgungsnachweis?",
            answer: "Ja, auf Wunsch erhalten Sie Entsorgungsnachweise für alle fachgerecht entsorgten Materialien – Sperrmüll, Elektrogeräte, Sondermüll. Besonders für Vermieter, Behörden oder Nachlasspfleger ist das häufig wichtig. Sprechen Sie uns bei der Besichtigung einfach darauf an."
        }
    ];
</script>

<MetaTags
    title="Entrümpelung Hildesheim – Keller, Dachboden & Messie | Aust Umzüge"
    description="Entrümpelung in Hildesheim: Keller, Dachboden, Garage oder Messie-Wohnung. Festpreis nach kostenloser Besichtigung. Schnell, diskret, besenrein."
    keywords="Entrümpelung Hildesheim, Keller entrümpeln, Dachboden entrümpeln, Messie Wohnung, Garage entrümpeln"
    canonical="https://www.aust-umzuege.de/leistungen/entruempelung"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.entruempelung} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Dennis Hansen" },
    "datePublished": "2023-03-01",
    "reviewBody": "Wir hatten eine Entrümpelung beauftragt, welche absolut schnell und reibungslos verlief. Sehr faire Preise, einfache und nette Kommunikation...absolute Weiterempfehlung unsererseits! Vielen Dank!"
}} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Piero Capo" },
    "datePublished": "2023-03-01",
    "reviewBody": "Einfach super Service, sehr freundlich und auch vor allem sehr kompetent! Ich war sehr zufrieden und es ging auch super schnell ich kann mich absolut nicht beschweren. Kann ich auf jeden Fall nur weiter empfehlen!!!"
}} />
<StructuredData schema={breadcrumbs} />
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/entruempelung-hildesheim-aust-umzuege.webp",
    "url": "https://www.aust-umzuege.de/leistungen/entruempelung",
    "name": "Entrümpelung Hildesheim – Aust Umzüge Mitarbeiter bei der Arbeit",
    "description": "Aust Umzüge Mitarbeiter in Arbeitskleidung bei einer Entrümpelung in Hildesheim. Professionelles Räumen von Keller, Dachboden, Garage und Wohnungen.",
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
    "width": 1500,
    "height": 946
}} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Archive size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Entrümpelung Hildesheim</h1>
            <p class="service-subtitle">
                Schnell und zuverlässig Platz schaffen – von Keller und Dachboden bis zur Messie-Wohnung.
            </p>
        </header>

        <div class="hero-image">
            <img
                src="/entruempelung-hildesheim-aust-umzuege.webp"
                srcset="/entruempelung-hildesheim-aust-umzuege-400w.webp 400w,
                        /entruempelung-hildesheim-aust-umzuege-600w.webp 600w,
                        /entruempelung-hildesheim-aust-umzuege-800w.webp 800w,
                        /entruempelung-hildesheim-aust-umzuege.webp 1500w"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 960px"
                alt="Aust Umzüge Mitarbeiter bei einer Entrümpelung in Hildesheim – im Firmen-Shirt bei der Arbeit"
                width="1500"
                height="946"
                fetchpriority="high"
            />
        </div>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Platz schaffen – professionell und unkompliziert</h2>
                <p>
                    Ob überfüllter Keller, verstaubter Dachboden, vollgestopfte Garage oder eine Wohnung, die grundlegend geräumt werden muss: Wir schaffen schnell, zuverlässig und ohne Wertung Platz – von einzelnen Räumen bis zur vollständigen Immobilie.
                </p>
                <p>
                    Mit geeignetem Werkzeug, Schutzkleidung und zertifizierten Entsorgungswegen erledigen wir auch herausfordernde Situationen diskret und effizient. Brauchbares trennen wir von Müll und rechnen den Wert verwertbarer Gegenstände transparent gegen die Kosten an.
                </p>

                <h3 class="highlight-title">Unser Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Kostenlose Besichtigung und verbindliches Festpreisangebot</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Keller, Dachboden, Garage, Abstellraum – auch Teilentrümpelung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Messie-Wohnungen: diskret, wertungsfrei, professionell</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Wertanrechnung für gut erhaltene Möbel und Gegenstände</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Fachgerechte Entsorgung mit Nachweis auf Wunsch</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Besenreine Übergabe – bereit für neue Nutzung</span>
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So läuft eine Entrümpelung ab</h2>
                <p>
                    Eine Entrümpelung muss nicht kompliziert sein. Unser Ablauf ist klar, verlässlich und auf Ihr Tempo abgestimmt.
                </p>
                <p>
                    <strong>1. Kostenlose Besichtigung:</strong> Wir kommen zu Ihnen, schauen uns den Umfang an – ob einzelner Raum oder mehrere – und erstellen Ihnen ein verbindliches Festpreisangebot. Keine Überraschungen bei der Abrechnung.
                </p>
                <p>
                    <strong>2. Sortierung:</strong> Brauchbares trennen wir konsequent von Müll. Was sich verkaufen oder spenden lässt, wird gesondert behandelt und gegen unsere Kosten angerechnet. Sie zahlen am Ende oft deutlich weniger.
                </p>
                <p>
                    <strong>3. Räumung:</strong> Schnell und effizient räumen wir den Raum oder die Räume vollständig aus. Auch bei schwieriger Zugänglichkeit – enge Treppenhäuser, Keller ohne Aufzug – finden wir einen Weg.
                </p>
                <p>
                    <strong>4. Fachgerechte Entsorgung:</strong> Sperrmüll, Elektroschrott, Farben, Chemikalien – alles wird nach gesetzlichen Vorschriften über zertifizierte Entsorgungsbetriebe entsorgt. Auf Wunsch erhalten Sie Entsorgungsnachweise.
                </p>
                <p>
                    <strong>5. Besenreine Übergabe:</strong> Der Raum ist leer, gefegt und bereit für die nächste Nutzung – ob Vermieterübergabe, Renovierung oder neuer Zweck.
                </p>

                <h2 class="section-title">Entrümpelung in Hildesheim und Umgebung</h2>
                <p>
                    Als lokales Unternehmen kennen wir Hildesheim und die Eigenheiten seiner Gebäude genau. Enge Kellertreppen, Dachböden ohne Licht, Garagen ohne Zufahrt – für uns kein Problem. Wir bringen das richtige Werkzeug mit und finden für jede Situation eine Lösung.
                </p>
                <p>
                    Auch im Umland sind wir tätig: Sarstedt, Alfeld, Bad Salzdetfurth, Elze und weitere Orte in der Region. Kurzfristige Termine sind bei freien Kapazitäten möglich – rufen Sie uns einfach an.
                </p>
                <p>
                    Besonders bei Messie-Wohnungen oder stark vernachlässigten Räumen arbeiten wir mit der nötigen Diskretion. Unser Team ist auf solche Situationen vorbereitet, geht wertungsfrei vor und sorgt für eine hygienisch einwandfreie Übergabe.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Wenn ein gesamter Haushalt aufgelöst werden soll – zum Beispiel nach einem Todesfall oder beim Umzug ins Pflegeheim – ist unsere <a href="/leistungen/haushaltsaufloesung">Haushaltsauflösung</a> die richtige Wahl. Möbel, die nach der Räumung vorübergehend untergebracht werden müssen, lagern wir sicher in unseren <a href="/leistungen/lagerung">Lagerräumen</a>.
                </p>
            </div>

            <div class="cta-column">
                <ServiceReviews reviews={[
                    {
                        author: "Dennis Hansen",
                        text: "Wir hatten eine Entrümpelung beauftragt, welche absolut schnell und reibungslos verlief. Sehr faire Preise, einfache und nette Kommunikation...absolute Weiterempfehlung unsererseits! Vielen Dank!",
                        url: "https://share.google/YcMNHQg8pbNGziAWU"
                    },
                    {
                        author: "Piero Capo",
                        text: "Einfach super Service, sehr freundlich und auch vor allem sehr kompetent! Ich war sehr zufrieden und es ging auch super schnell ich kann mich absolut nicht beschweren. Kann ich auf jeden Fall nur weiter empfehlen!!!",
                        url: "https://share.google/eOWJpkEIrbuoFiawG"
                    },
                ]} />
                <div class="cta-box">
                    <h3>Raum zu räumen?</h3>
                    <p>
                        Wir erstellen Ihnen ein faires Festpreisangebot nach Besichtigung.
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
                            text="Kontakt aufnehmen"
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
