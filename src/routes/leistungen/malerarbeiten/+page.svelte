<script lang="ts">
    import { Paintbrush, CheckCircle, ArrowLeft, Scale, AlertTriangle, Handshake } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Malerarbeiten beim Umzug" }
    ]);

    const serviceSchema = {
        "@type": "Service",
        serviceType: "Malerarbeiten beim Umzug – Koordination und kleine Übergabe-Ausbesserungen",
        name: "Malerarbeiten rund um Ihren Umzug | Aust Umzüge Hildesheim",
        description:
            "Kleine Ausbesserungen für die Wohnungsübergabe machen wir selbst – komplette Streich-, Tapezier- und Spachtelarbeiten koordinieren wir über eingetragene Meisterbetriebe. Hildesheim, Hannover, Braunschweig, Hameln, Goslar.",
        provider: { "@id": "https://www.aust-umzuege.de/#organization" },
        areaServed: [
            { "@type": "City", name: "Hildesheim" },
            { "@type": "City", name: "Hannover" },
            { "@type": "City", name: "Braunschweig" },
            { "@type": "City", name: "Hameln" },
            { "@type": "City", name: "Goslar" },
            { "@type": "AdministrativeArea", name: "Niedersachsen" }
        ],
        url: "https://www.aust-umzuege.de/leistungen/malerarbeiten",
        offers: { "@type": "Offer", priceCurrency: "EUR" }
    };

    const tier1 = [
        "Dübel- und Bohrlöcher zuspachteln",
        "Punktuelle Farbausbesserungen mit der vorhandenen Wandfarbe",
        "Kleinere Stoßstellen und Kratzer, die beim Auszug entstanden sind",
        "Beschläge nachziehen, lose Türgriffe befestigen",
        "Klebereste von Postern, Hakenleisten und Aufklebern entfernen"
    ];

    const tier2 = [
        "Komplette Räume streichen – Wände und Decken",
        "Tapezieren, Tapeten entfernen, Untergrund vorbereiten",
        "Großflächiges Spachteln und Schleifen vor dem Anstrich",
        "Türen, Fenster, Heizkörper lackieren",
        "Fassadenarbeiten, Außenanstriche, Holzschutz",
        "Dekorative Techniken: Lasur, Wischtechnik, Spachtelputz, Airless-Spritzen"
    ];

    const faqs = [
        {
            question: "Was zählt für Sie als kleine Ausbesserung, was als richtiges Streichen?",
            answer: "Als Ausbesserung im Rahmen der Übergabe sehen wir punktuelle Arbeiten: einzelne Bohrlöcher, vereinzelte Schadstellen, Klebereste. Sobald Wände, Decken oder ganze Flächen gestrichen, tapeziert oder gespachtelt werden müssen, ist das Malerhandwerk im Sinne der Handwerksordnung. Diese Arbeiten gibt unser Partner-Meisterbetrieb für Sie ab."
        },
        {
            question: "Warum darf ein Umzugsunternehmen nicht selbst streichen?",
            answer: "Maler und Lackierer ist ein zulassungspflichtiges Handwerk nach Anlage A Nr. 10 der Handwerksordnung. Wesentliche Tätigkeiten – also der Kernbereich des Handwerks – dürfen nur eingetragene Meisterbetriebe ausführen. Wir sind ein eingetragenes Umzugsunternehmen, aber kein Malerbetrieb. Punktuelle Ausbesserungen im Rahmen einer Wohnungsübergabe sind als Annex zur Umzugsleistung möglich; alles darüber hinaus wäre nicht zulässig – und genau deshalb leiten wir es weiter."
        },
        {
            question: "Was ist, wenn ich nur Malerarbeiten brauche – ganz ohne Umzug?",
            answer: "Dann sind wir nicht der richtige Vertragspartner für die Ausführung. Wir vermitteln Sie aber gerne an einen Meisterbetrieb aus unserem Netzwerk – persönlich, mit Ansprechpartner, ohne dass Sie selbst auf die Suche gehen müssen. Ein kurzer Anruf reicht."
        },
        {
            question: "Wer haftet, wenn bei den kleinen Ausbesserungen etwas schiefgeht?",
            answer: "Für die Ausbesserungen, die wir im Rahmen Ihres Umzugs übernehmen, haften wir über unsere Betriebshaftpflicht – wie für jede andere Umzugsleistung auch. Bei Renovierungsarbeiten unseres Partners ist der Meisterbetrieb Ihr Vertragspartner und haftet entsprechend seiner Berufshaftpflicht. Beide Versicherungen sind dafür da, voneinander getrennt."
        },
        {
            question: "Übernimmt mein Vermieter die Kosten für die Ausbesserungen?",
            answer: "Schönheitsreparaturen sind im Mietvertrag häufig auf den Mieter abgewälzt – ob die Klausel wirksam ist, hängt vom Einzelfall ab. Bohrlöcher und kleinere Gebrauchsspuren muss der Mieter in der Regel selbst beheben. Was darüber hinausgeht (z. B. starre Renovierungspflichten ohne Berücksichtigung der Wohndauer), ist nach BGH-Rechtsprechung oft unwirksam. Im Zweifel: Mietvertrag prüfen lassen."
        },
        {
            question: "Bekomme ich für Umzug und Renovierung eine Rechnung oder zwei?",
            answer: "Zwei. Sie haben dann zwei Vertragspartner: Aust Umzüge für den Umzug einschließlich der Übergabe-Ausbesserungen, und den Meisterbetrieb für die Malerarbeiten. Das ist sauber getrennt, transparent und für die Steuer (z. B. § 35a EStG für haushaltsnahe Handwerkerleistungen) eindeutig zuzuordnen."
        },
        {
            question: "Wie schnell bekomme ich einen Termin beim Maler-Partner?",
            answer: "Üblicherweise innerhalb von ein bis zwei Wochen für ein erstes Aufmaß. Wenn Ihr Umzugstermin steht, koordinieren wir die Reihenfolge so, dass die Renovierung in das leere Zeitfenster zwischen Auszug und Wiedereinzug bzw. Übergabe passt – das spart Zeit, weil parallel gearbeitet werden kann."
        },
        {
            question: "Was kostet die Vermittlung?",
            answer: "Die Vermittlung an unseren Meisterbetrieb ist für Sie kostenfrei. Sie zahlen ausschließlich die Leistung des Meisterbetriebs zum dort kalkulierten Preis. Wir verdienen daran nichts – uns geht es darum, dass Ihr Umzug rundläuft und Sie keine Wohnung mit halb fertiger Wand übergeben müssen."
        }
    ];
</script>

<MetaTags
    title="Malerarbeiten beim Umzug – Hildesheim & Region | Aust Umzüge"
    description="Kleine Übergabe-Ausbesserungen erledigen wir im Rahmen Ihres Umzugs. Komplette Streich-, Tapezier- und Spachtelarbeiten koordinieren wir über eingetragene Meisterbetriebe. Hildesheim, Hannover, Braunschweig."
    keywords="Malerarbeiten Umzug, Schönheitsreparaturen Auszug, Wohnungsübergabe streichen, Maler Hildesheim, Malermeister Hannover, Renovierung Umzug"
    canonical="https://www.aust-umzuege.de/leistungen/malerarbeiten"
/>

<StructuredData schema={serviceSchema} />
<StructuredData schema={businessInfoSlim} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Paintbrush size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Malerarbeiten rund um Ihren Umzug</h1>
            <p class="service-subtitle">
                Ehrlich gesagt: Wir sind ein Umzugsunternehmen, kein Malerbetrieb. Was das für Sie bedeutet – und warum es trotzdem aus einer Hand klappt.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">

                <!-- TRANSPARENCY BLOCK -->
                <div class="legal-box">
                    <div class="legal-box__header">
                        <Scale size={20} />
                        <span>Was wir dürfen – und was nicht</span>
                    </div>
                    <p>
                        Aust Umzüge ist ein eingetragenes Umzugsunternehmen – kein Malerbetrieb. <strong>Maler und Lackierer</strong> ist ein zulassungspflichtiges Handwerk nach Anlage A Nr. 10 der Handwerksordnung. Wesentliche Tätigkeiten dieses Handwerks – ganze Räume streichen, tapezieren, großflächig spachteln – dürfen nur eingetragene Meisterbetriebe ausführen.
                    </p>
                    <p>
                        Wir verschweigen das nicht und arbeiten deshalb mit einer klaren Zwei-Ebenen-Logik. Kleine Ausbesserungen, die unmittelbar mit Ihrem Umzug zusammenhängen, machen wir selbst. Alles andere koordinieren wir über einen eingetragenen Meisterbetrieb aus unserem Netzwerk – Sie bekommen einen Ansprechpartner, einen Termin, ein klares Angebot.
                    </p>
                </div>

                <!-- TIER 1 -->
                <h2 class="section-title">Was wir im Rahmen Ihres Umzugs selbst übernehmen</h2>
                <p>
                    Wenn beim Auszug ein paar Dübellöcher zurückbleiben oder eine Stoßstelle ausgebessert werden muss, damit die Wohnung übergabefertig ist, dann gehört das für uns zum Umzug. Es ist Bestandteil Ihres Umzugsauftrags – kein separater Malerservice und auch nicht so kalkuliert.
                </p>
                <ul class="feature-list">
                    {#each tier1 as item}
                        <li>
                            <CheckCircle size={20} class="check-icon" />
                            <span>{item}</span>
                        </li>
                    {/each}
                </ul>
                <p class="muted-note">
                    Punktuelle Arbeiten, keine Vollrenovierung. Sobald eine ganze Wand, eine Decke oder mehrere Flächen am Stück gestrichen werden müssten, übergeben wir an unseren Maler-Partner – aus rechtlichen Gründen und weil das Ergebnis sonst nicht das ist, was Sie verdient haben.
                </p>

                <!-- TIER 2 -->
                <h2 class="section-title">Was unser Partner-Meisterbetrieb übernimmt</h2>
                <p>
                    Für alle Arbeiten, die in den Kernbereich des Malerhandwerks fallen, arbeiten wir mit eingetragenen Meisterbetrieben zusammen. Sie kennen unsere Partner persönlich – wir bringen den Kontakt zustande, koordinieren die Schnittstelle zwischen Umzug und Renovierung und sorgen dafür, dass die Termine ineinandergreifen.
                </p>
                <ul class="feature-list">
                    {#each tier2 as item}
                        <li>
                            <CheckCircle size={20} class="check-icon" />
                            <span>{item}</span>
                        </li>
                    {/each}
                </ul>

                <!-- HANDSHAKE BOX -->
                <div class="handshake-box">
                    <div class="handshake-box__header">
                        <Handshake size={20} />
                        <span>So läuft die Vermittlung</span>
                    </div>
                    <ol class="handshake-steps">
                        <li><strong>Wir hören zu.</strong> Beim Aufmaß für Ihren Umzug fragen wir nach: Wie soll die Wohnung übergeben werden? Was steht beim Einzug an?</li>
                        <li><strong>Wir trennen sauber.</strong> Was wir selbst machen, machen wir. Was über das Malerhandwerk hinausgeht, geht an den Meisterbetrieb.</li>
                        <li><strong>Wir bringen den Kontakt zustande.</strong> Sie bekommen Namen, Telefonnummer und einen abgestimmten Termin – kein Zettel mit fünf Empfehlungen, sondern einen verbindlichen Ansprechpartner.</li>
                        <li><strong>Wir koordinieren die Reihenfolge.</strong> Auszug → Renovierung → Übergabe oder Einzug. Damit nichts doppelt passiert und niemand auf den anderen warten muss.</li>
                    </ol>
                </div>

                <!-- WARUM TRENNUNG -->
                <h2 class="section-title">Warum diese Trennung?</h2>
                <p>
                    Weil sie die einzige saubere Lösung ist. Das Bundesverwaltungsgericht hat in ständiger Rechtsprechung festgehalten, dass eine Tätigkeit dann zum Kernbereich eines zulassungspflichtigen Handwerks gehört, wenn sie diesem Handwerk sein wesentliches Gepräge verleiht (sog. Kernbereichstheorie, § 1 Abs. 2 HwO). Streichen, tapezieren und spachteln ganzer Flächen fällt darunter.
                </p>
                <p>
                    Ein Umzugsunternehmen, das diese Arbeiten selbst übernimmt, riskiert Abmahnungen durch die Wettbewerbszentrale (UWG § 3a i. V. m. § 1 Abs. 2 HwO), Bußgelder nach dem Schwarzarbeitsbekämpfungsgesetz und – im Schadensfall – Probleme mit der Versicherung, weil Berufshaftpflichten Schäden aus unzulässiger Handwerksausübung üblicherweise nicht decken.
                </p>
                <p>
                    Für Sie als Kundin oder Kunde heißt das: Bei einem Anbieter, der Ihnen Komplettrenovierungen nebenbei verspricht, ohne einen Meisterbetrieb dahinter, sollten Sie zwei Mal hinschauen. Nicht weil das Ergebnis schlecht sein muss – sondern weil Sie im Schadensfall ungeschützt sind.
                </p>

                <!-- RISK -->
                <div class="risk-box">
                    <div class="risk-box__header">
                        <AlertTriangle size={20} />
                        <span>Worauf Sie bei Anbietern achten sollten</span>
                    </div>
                    <ul class="risk-list">
                        <li>Wer streicht? Ist der ausführende Betrieb in der Handwerksrolle eingetragen? (Kostenlos prüfbar bei der zuständigen Handwerkskammer.)</li>
                        <li>Liegt für Ihre Renovierung eine eigene Berufshaftpflicht des ausführenden Betriebs vor – nicht nur die des Umzugsunternehmens?</li>
                        <li>Bekommen Sie für die Renovierung eine separate, ordentliche Rechnung mit USt-Ausweis vom Meisterbetrieb? Das ist auch für die steuerliche Absetzbarkeit nach § 35a EStG entscheidend.</li>
                    </ul>
                </div>

                <h2 class="section-title">Region und Verfügbarkeit</h2>
                <p>
                    Wir arbeiten primär in Hildesheim und im Umkreis von rund 100 Kilometern – also Hannover, Braunschweig, Hameln, Goslar und kleinere Orte dazwischen. Unsere Partner-Meisterbetriebe sind in derselben Region aktiv, einige zusätzlich überregional. Wenn Ihr Umzug aus dieser Region herausführt oder hineinkommt, finden wir auch dort einen passenden Ansprechpartner.
                </p>

                <div class="cta-inline">
                    <p>Sie ziehen um und brauchen die Wohnung übergabefertig – mit oder ohne Komplettrenovierung?</p>
                    <CTAButton text="Kontakt aufnehmen" openFlow showArrow={false} />
                </div>
            </div>
        </div>

        <FAQSection {faqs} title="Häufige Fragen zu Malerarbeiten beim Umzug" />

    </div>
</main>

<style>
    .service-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .service-detail__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #1a202c;
        text-decoration: none;
        margin-bottom: var(--space-8);
        font-size: var(--text-sm);
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--color-nav-accent);
    }

    .service-header {
        text-align: center;
        margin-bottom: var(--space-10);
    }

    .icon-wrapper {
        display: inline-flex;
        padding: var(--space-4);
        background-color: #f0f9ff;
        color: var(--color-info-bar);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-4);
    }

    .service-title {
        font-size: clamp(2rem, 4vw, 3rem);
        color: var(--color-info-bar);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .service-subtitle {
        font-size: 1.2rem;
        color: #1a202c;
        max-width: 720px;
        margin-inline: auto;
        line-height: 1.6;
    }

    .service-content {
        margin-bottom: var(--space-10);
    }

    .text-column p {
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.75;
        margin-bottom: var(--space-4);
    }

    .muted-note {
        font-size: 0.95rem !important;
        color: #475569 !important;
        font-style: italic;
        border-left: 3px solid #cbd5e1;
        padding-left: var(--space-4);
    }

    .section-title {
        color: var(--color-info-bar);
        font-size: 1.5rem;
        font-weight: 700;
        margin: var(--space-10) 0 var(--space-5) 0;
        padding-bottom: var(--space-3);
        border-bottom: 2px solid var(--color-nav-accent);
    }

    .feature-list {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--space-6) 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .feature-list li {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        font-size: 1rem;
        color: #1a202c;
        line-height: 1.55;
    }

    .feature-list li :global(.check-icon) {
        color: var(--color-nav-accent);
        flex-shrink: 0;
        margin-top: 2px;
    }

    .legal-box {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin: var(--space-8) 0;
    }

    .legal-box__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-info-bar);
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: var(--space-4);
    }

    .legal-box p {
        font-size: 1rem;
        margin-bottom: var(--space-3);
    }

    .legal-box p:last-child {
        margin-bottom: 0;
    }

    .handshake-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin: var(--space-8) 0;
    }

    .handshake-box__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-info-bar);
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: var(--space-4);
    }

    .handshake-steps {
        list-style: decimal;
        padding-left: var(--space-5);
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .handshake-steps li {
        color: #1a202c;
        font-size: 1rem;
        line-height: 1.6;
    }

    .risk-box {
        background-color: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin: var(--space-8) 0;
    }

    .risk-box__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: #9a3412;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: var(--space-4);
    }

    .risk-list {
        list-style: disc;
        padding-left: var(--space-5);
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .risk-list li {
        color: #1a202c;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    .cta-inline {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-top: var(--space-10);
        text-align: center;
    }

    .cta-inline p {
        color: #1a202c;
        font-size: 1.0625rem;
        font-weight: 500;
        margin-bottom: var(--space-4);
    }

    @media (max-width: 640px) {
        .service-title {
            font-size: 1.75rem;
        }
    }
</style>
