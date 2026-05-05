<script lang="ts">
    import { Hammer, CheckCircle, ArrowLeft, Scale, AlertTriangle, Handshake, Layers } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Renovierungsarbeiten beim Umzug" }
    ]);

    const serviceSchema = {
        "@type": "Service",
        serviceType: "Renovierungsarbeiten beim Umzug – Koordination über Meisterbetriebe",
        name: "Renovierungsarbeiten rund um Ihren Umzug | Aust Umzüge Hildesheim",
        description:
            "Renovierungen beim Umzug aus einer Hand: Wir koordinieren Maler, Bodenleger, Trockenbau, Fliesen, Elektro und Sanitär über eingetragene Meisterbetriebe. Hildesheim, Hannover, Braunschweig, Hameln, Goslar.",
        provider: { "@id": "https://www.aust-umzuege.de/#organization" },
        areaServed: [
            { "@type": "City", name: "Hildesheim" },
            { "@type": "City", name: "Hannover" },
            { "@type": "City", name: "Braunschweig" },
            { "@type": "City", name: "Hameln" },
            { "@type": "City", name: "Goslar" },
            { "@type": "AdministrativeArea", name: "Niedersachsen" }
        ],
        url: "https://www.aust-umzuege.de/leistungen/renovierungsarbeiten",
        offers: { "@type": "Offer", priceCurrency: "EUR" }
    };

    const tier1 = [
        "Möbeldemontage und -montage – auch komplexe Schrankwände, Einbauküchen und Betten",
        "Schwerlasttransport innerhalb der Wohnung – Klavier, Tresor, Großgeräte",
        "Vorbereitende Räumarbeiten vor der Renovierung",
        "Entsorgung von Altmöbeln, Sperrmüll und Renovierungsabfall",
        "Aufräumen und besenreines Übergeben nach Abschluss der Arbeiten",
        "Logistik zwischen Lager, Zwischenstandort und Renovierungsbaustelle"
    ];

    const tradePartners = [
        {
            label: "Maler und Lackierer",
            text: "Streichen, Tapezieren, Spachteln, Lackieren von Türen und Fenstern. Anlage A Nr. 10 der Handwerksordnung."
        },
        {
            label: "Bodenleger und Parkettleger",
            text: "Laminat, Vinyl, Designboden, Parkett, Teppich. Inkl. Untergrundvorbereitung und Sockelleisten."
        },
        {
            label: "Fliesenleger",
            text: "Wand- und Bodenfliesen, Verfugung, Abdichtung. Bad, Küche, Flur, Außenbereich."
        },
        {
            label: "Stuckateure & Trockenbau",
            text: "Trennwände, abgehängte Decken, Dämmung, Spachtelarbeiten ganzer Flächen. Anlage A Nr. 9 der Handwerksordnung."
        },
        {
            label: "Elektrotechnik",
            text: "Steckdosen, Schalter, Beleuchtung, Verteiler. Auch DGUV-V3-Prüfungen vor Übergabe."
        },
        {
            label: "Sanitär, Heizung, Klima",
            text: "Bad, WC, Küche, Heizungsanschlüsse, Wasseranschlüsse für Geräte."
        },
        {
            label: "Tischler und Schreiner",
            text: "Türen, Einbauschränke, Maßanfertigungen, Reparaturen an Einbaumöbeln."
        }
    ];

    const faqs = [
        {
            question: "Welche Renovierungsleistungen koordinieren Sie?",
            answer: "Wir arbeiten mit eingetragenen Meisterbetrieben aus den klassischen Renovierungsgewerken: Maler, Bodenleger, Fliesenleger, Trockenbau, Elektro und Sanitär. Tischlerarbeiten und Sonderleistungen wie Klimaanlagen oder Smart-Home-Installationen können wir ebenfalls vermitteln. Was wir nicht selbst koordinieren, sagen wir Ihnen offen."
        },
        {
            question: "Bekomme ich einen Festpreis für die Komplettrenovierung?",
            answer: "Pro Gewerk gibt es ein eigenes Angebot des jeweiligen Meisterbetriebs. Eine pauschale Komplettzahl ohne Aufmaß ist unseriös – jedes Gewerk braucht eine eigene Bewertung von Aufwand, Material und Untergrund. Wir helfen Ihnen, die einzelnen Angebote zu lesen, zu vergleichen und in eine sinnvolle Reihenfolge zu bringen."
        },
        {
            question: "Wer ist mein Vertragspartner – Aust Umzüge oder der Handwerksbetrieb?",
            answer: "Für den Umzug sind wir Ihr Vertragspartner. Für jede Renovierungsleistung schließen Sie einen separaten Vertrag direkt mit dem ausführenden Meisterbetrieb. Damit ist klar geregelt, wer für was haftet, welche Versicherung greift und wer Ihre Steuerbescheinigung nach § 35a EStG ausstellt. Diese Trennung schützt Sie."
        },
        {
            question: "Warum macht ein Umzugsunternehmen die Renovierung nicht selbst?",
            answer: "Maler und Lackierer (Anlage A Nr. 10), Stuckateure (Nr. 9), Elektrotechniker, Installateur und Heizungsbauer sowie weitere Renovierungsgewerke sind zulassungspflichtige Handwerke nach Anlage A der Handwerksordnung. Wesentliche Tätigkeiten dürfen nur eingetragene Meisterbetriebe ausführen. Aust Umzüge ist als Umzugsunternehmen eingetragen, nicht als Renovierungsbetrieb. Wer Ihnen das anders verspricht, läuft in eine rechtliche und versicherungstechnische Falle – und Sie als Auftraggeber gleich mit."
        },
        {
            question: "Wie wird die Schnittstelle zwischen Umzug und Renovierung organisiert?",
            answer: "In der Regel so: Auszug aus der alten Wohnung, Renovierung im leeren Zustand (alte oder neue Wohnung – je nach Ihrem Plan), dann Einzug bzw. Übergabe. Wir übernehmen die Terminkette, halten Kontakt zu allen Beteiligten und sorgen dafür, dass z. B. der Bodenleger nicht anrückt, bevor der Maler fertig ist. Sie haben einen Ansprechpartner, nicht fünf."
        },
        {
            question: "Können Sie auch Bäder oder Küchen komplett renovieren?",
            answer: "Ja – über die zuständigen Gewerke. Ein Komplettbad braucht in der Regel Sanitär, Fliesen, Elektro, Maler und ggf. Trockenbau. Wir bündeln das für Sie und stimmen Reihenfolge und Termine ab. Ähnlich bei der Küche: Möbelaufbau übernehmen wir oft selbst, der Wasseranschluss läuft über den Sanitär-Partner, die Dunstabzugshaube ggf. über den Elektriker."
        },
        {
            question: "Was passiert, wenn die Renovierung länger dauert als geplant?",
            answer: "Wir bauen Pufferzeiten in die Terminkette ein. Trotzdem: Renovierungen können sich verzögern, etwa wenn beim Aufnehmen alter Bodenbeläge Feuchtigkeit oder Asbest auftaucht. Wir kommunizieren solche Funde sofort mit Ihnen und passen die Logistik an – z. B. durch eine kurze Zwischenlagerung Ihrer Möbel in unserem Lager. Lieber einmal kurz warten als auf einer feuchten Estrichfläche neu verlegen."
        },
        {
            question: "Was kostet die Koordination?",
            answer: "Die Koordination berechnen wir nicht separat. Sie zahlen den Umzug zum vereinbarten Festpreis und die Handwerksleistungen direkt zu den Konditionen der Meisterbetriebe. Wir verdienen an der Vermittlung selbst nichts – uns geht es darum, dass Ihr Umzug rundläuft und Sie nicht zwischen drei Gewerken hin- und herrennen müssen."
        }
    ];
</script>

<MetaTags
    title="Renovierungsarbeiten beim Umzug – Hildesheim & Region | Aust Umzüge"
    description="Renovierung beim Umzug aus einer Hand: Maler, Boden, Fliesen, Trockenbau, Elektro, Sanitär – koordiniert über eingetragene Meisterbetriebe. Hildesheim, Hannover, Braunschweig."
    keywords="Renovierungsarbeiten Umzug, Renovierung Hildesheim, Komplettrenovierung Auszug, Handwerker Vermittlung Umzug, Wohnung renovieren Übergabe"
    canonical="https://www.aust-umzuege.de/leistungen/renovierungsarbeiten"
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
                <Hammer size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Renovierungsarbeiten rund um Ihren Umzug</h1>
            <p class="service-subtitle">
                Komplettrenovierung beim Umzug – aus einer Hand koordiniert, ausgeführt von eingetragenen Meisterbetrieben in Hildesheim und Region.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">

                <!-- TRANSPARENCY BLOCK -->
                <div class="legal-box">
                    <div class="legal-box__header">
                        <Scale size={20} />
                        <span>Wer macht was – und warum</span>
                    </div>
                    <p>
                        Renovierungsarbeiten berühren mehrere zulassungspflichtige Handwerke der Anlage A der Handwerksordnung: Maler und Lackierer (Nr. 10), Stuckateure (Nr. 9, einschließlich Trockenbau), Fliesenleger, Elektrotechniker, Installateur und Heizungsbauer. Wesentliche Tätigkeiten dieser Gewerke dürfen nur eingetragene Meisterbetriebe ausführen.
                    </p>
                    <p>
                        Aust Umzüge ist ein eingetragenes Umzugsunternehmen, kein Renovierungsbetrieb. Das ist kein Manko – das ist ein Versprechen. Wir geben jedes Gewerk an einen eingetragenen Meisterbetrieb aus unserem Netzwerk ab und koordinieren die Schnittstelle zu Ihrem Umzug. Sie bekommen das Komplettpaket, ohne dass jemand Leistungen erbringt, für die er nicht eingetragen ist.
                    </p>
                </div>

                <!-- TIER 1 -->
                <h2 class="section-title">Was wir als Umzugsunternehmen selbst übernehmen</h2>
                <p>
                    Rund um die Renovierung gibt es eine Reihe von Aufgaben, die zum Umzugshandwerk gehören und die wir vollständig selbst abwickeln – ohne Subunternehmer, mit eigenem Personal und unter eigener Haftung.
                </p>
                <ul class="feature-list">
                    {#each tier1 as item}
                        <li>
                            <CheckCircle size={20} class="check-icon" />
                            <span>{item}</span>
                        </li>
                    {/each}
                </ul>

                <!-- TIER 2 -->
                <h2 class="section-title">Welche Gewerke wir über Meisterbetriebe koordinieren</h2>
                <p>
                    Für die handwerkliche Renovierung selbst arbeiten wir mit einem festen Netz aus eingetragenen Meisterbetrieben zusammen. Sie müssen nicht selbst recherchieren, telefonieren und Termine jonglieren – wir machen den Kontakt, geben das Aufmaß weiter und stimmen die Reihenfolge auf Ihren Umzugstermin ab.
                </p>
                <div class="trade-grid">
                    {#each tradePartners as trade}
                        <div class="trade-item">
                            <div class="trade-item__head">
                                <Layers size={16} />
                                <span>{trade.label}</span>
                            </div>
                            <p>{trade.text}</p>
                        </div>
                    {/each}
                </div>
                <p class="muted-note">
                    Nicht jedes Gewerk ist in jedem Projekt nötig. Beim Aufmaß für Ihren Umzug klären wir gemeinsam, was tatsächlich gebraucht wird – und was nicht. Wir verkaufen Ihnen keine Renovierung, die Sie nicht brauchen.
                </p>

                <!-- HANDSHAKE BOX -->
                <div class="handshake-box">
                    <div class="handshake-box__header">
                        <Handshake size={20} />
                        <span>Wie wir die Renovierung koordinieren</span>
                    </div>
                    <ol class="handshake-steps">
                        <li><strong>Aufnahme.</strong> Beim Umzugs-Aufmaß erfassen wir, welche Renovierungsleistungen anstehen – alte oder neue Wohnung, Umfang, Dringlichkeit.</li>
                        <li><strong>Aufteilung.</strong> Wir verteilen die Gewerke auf die passenden Meisterbetriebe und holen Angebote ein. Sie bekommen pro Gewerk ein eigenes, sauberes Angebot.</li>
                        <li><strong>Reihenfolge.</strong> Erst die Arbeiten, die Trocknungs- oder Aushärtungszeit brauchen (Estrich, Fliesen, Spachtel). Dann die Anstriche, dann die Bodenbeläge, am Schluss die Möblierung.</li>
                        <li><strong>Schnittstelle Umzug.</strong> Wir takten die Auszug- und Einzugstermine so, dass die Renovierung dazwischen passt. Bei längeren Arbeiten lagern wir Ihre Möbel in unserem Lager.</li>
                        <li><strong>Übergabe.</strong> Nach Abschluss aller Arbeiten räumen wir die Wohnung besenrein – egal ob alte Wohnung an Vermieter oder neue Wohnung an Sie.</li>
                    </ol>
                </div>

                <!-- WARUM TRENNUNG -->
                <h2 class="section-title">Warum diese saubere Trennung?</h2>
                <p>
                    Weil sie Sie schützt. Bei jedem Renovierungsgewerk gilt: Nur ein eingetragener Meisterbetrieb hat eine passende Berufshaftpflicht, kann Sie korrekt abrechnen, kann eine Steuerbescheinigung nach § 35a EStG ausstellen und stellt im Schadensfall Mängelansprüche nicht infrage. Ein Umzugsunternehmen, das Ihnen das nebenbei verkauft, kann das schlicht nicht leisten – seine Versicherung würde im Streitfall nicht zahlen.
                </p>
                <p>
                    Die Kernbereichstheorie des Bundesverwaltungsgerichts (st. Rspr. zu § 1 Abs. 2 HwO) macht klar, dass jeder Eingriff in den eigentlichen Kernbereich eines zulassungspflichtigen Handwerks dem eingetragenen Betrieb vorbehalten ist. Verstöße werden nach § 8 SchwarzArbG geahndet und sind über die Wettbewerbszentrale (UWG § 3a) abmahnfähig. Das ist kein theoretisches Risiko – das ist gelebte Aufsichtspraxis.
                </p>

                <!-- WHAT TO LOOK OUT FOR -->
                <div class="risk-box">
                    <div class="risk-box__header">
                        <AlertTriangle size={20} />
                        <span>Worauf Sie bei „All-in"-Anbietern achten sollten</span>
                    </div>
                    <ul class="risk-list">
                        <li>Lassen Sie sich für jedes Renovierungsgewerk den ausführenden Betrieb mit Namen und Sitz nennen. Eingetragen oder nicht? (Prüfung über die Handwerkskammer Ihrer Region.)</li>
                        <li>Verlangen Sie eine separate Rechnung pro Gewerk. Eine pauschale „Renovierungsposition" auf der Umzugsrechnung ist steuerlich angreifbar und versicherungstechnisch ein Warnsignal.</li>
                        <li>Berufshaftpflicht-Nachweis pro ausführendem Betrieb – nicht nur die des Umzugsunternehmens. Ohne das stehen Sie im Schadensfall allein da.</li>
                        <li>Festpreisversprechen ohne Aufmaß sind ein Vertriebs-Trick. Seriöse Renovierungsangebote brauchen eine Besichtigung jeder Fläche.</li>
                    </ul>
                </div>

                <h2 class="section-title">Region und Verfügbarkeit</h2>
                <p>
                    Wir arbeiten in Hildesheim und im Umkreis von rund 100 Kilometern: Hannover, Braunschweig, Hameln, Goslar und kleinere Orte dazwischen. Unser Netz an Meisterbetrieben deckt diese Region zuverlässig ab; für Umzüge, die aus der Region heraus oder hinein gehen, finden wir auch dort einen passenden Ansprechpartner. Wir versprechen Ihnen keine Schnellschüsse – wir versprechen Ihnen, dass die Leute, die bei Ihnen arbeiten, eingetragen, versichert und für genau das ausgebildet sind.
                </p>

                <div class="cta-inline">
                    <p>Sie ziehen um und brauchen die alte oder neue Wohnung renoviert?</p>
                    <CTAButton href="/kostenloses-angebot" text="Umzug & Renovierung anfragen" />
                </div>
            </div>
        </div>

        <FAQSection {faqs} title="Häufige Fragen zur Renovierung beim Umzug" />

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

    .trade-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        margin: var(--space-6) 0;
    }

    .trade-item {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-md);
        padding: var(--space-4);
    }

    .trade-item__head {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-info-bar);
        font-weight: 700;
        font-size: var(--text-sm);
        margin-bottom: var(--space-2);
    }

    .trade-item p {
        font-size: 0.9rem !important;
        line-height: 1.55 !important;
        color: #1a202c;
        margin: 0 !important;
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
        .trade-grid {
            grid-template-columns: 1fr;
        }
        .service-title {
            font-size: 1.75rem;
        }
    }
</style>
