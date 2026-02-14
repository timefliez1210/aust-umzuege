<script lang="ts">
    import { Trash2, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Haushaltsauflösung" }
    ]);

    const faqs = [
        {
            question: "Was kostet eine Haushaltsauflösung in Hildesheim?",
            answer: "Die Kosten liegen je nach Wohnungsgröße und Zustand zwischen 20 und 60 Euro pro Quadratmeter. Eine 3-Zimmer-Wohnung kostet erfahrungsgemäß zwischen 1.500 und 3.000 Euro. Gut erhaltene Möbel und Wertsachen rechnen wir gegen die Kosten auf – das senkt Ihren Preis spürbar. Nach einer kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot."
        },
        {
            question: "Wie läuft eine Haushaltsauflösung nach einem Todesfall ab?",
            answer: "Wir gehen besonders sensibel vor: Zunächst sichern wir gemeinsam persönliche Erinnerungsstücke und Wertgegenstände. Dann räumen wir die Wohnung zügig und diskret, entsorgen fachgerecht und übergeben besenrein. Wir können den gesamten Ablauf auch mit Ihrem Nachlassverwalter oder Vermieter koordinieren, wenn Sie nicht vor Ort sein können."
        },
        {
            question: "Wie lange dauert eine Haushaltsauflösung?",
            answer: "Eine durchschnittliche 3-Zimmer-Wohnung räumen wir in 1-2 Tagen komplett. Bei größeren Objekten, Häusern oder stark vermüllten Wohnungen kann es länger dauern. Wir nennen Ihnen den genauen Zeitrahmen nach der Besichtigung, damit Sie die Wohnungsübergabe zuverlässig planen können."
        },
        {
            question: "Was passiert mit noch brauchbaren Gegenständen?",
            answer: "Verkaufbare Möbel, Antiquitäten und Gebrauchsgüter verkaufen wir an Händler oder spenden sie an soziale Einrichtungen in Hildesheim. Den Erlös rechnen wir transparent gegen unsere Kosten auf. So zahlen Sie weniger und gut Erhaltenes bekommt ein zweites Leben."
        },
        {
            question: "Ist die Räumung wirklich besenrein?",
            answer: "Ja, garantiert. Besenrein bedeutet bei uns: Alle Gegenstände entfernt, Böden gefegt, Schränke und Regale geräumt. Die Wohnung ist direkt bereit für die Vermieterübergabe. Auf Wunsch entfernen wir auch Tapeten, Teppichböden und Einbauten – für eine komplett renovierungsfertige Übergabe."
        },
        {
            question: "Wer kümmert sich um die fachgerechte Entsorgung?",
            answer: "Wir übernehmen die komplette Entsorgung nach gesetzlichen Vorschriften: Sperrmüll, Elektrogeräte, Sondermüll und Bauschutt entsorgen wir über zertifizierte Entsorgungsstellen in Hildesheim. Auf Wunsch erhalten Sie Entsorgungsnachweise für Ihre Unterlagen."
        },
        {
            question: "Können Sie auch Messie-Wohnungen entrümpeln?",
            answer: "Ja, wir haben umfangreiche Erfahrung mit Messie-Wohnungen und gehen dabei absolut diskret und professionell vor. Unser Team arbeitet zuverlässig, wertungsfrei und kennt die besonderen Anforderungen – von der Schädlingsbekämpfung bis zur Grundreinigung. Sprechen Sie uns vertraulich an."
        }
    ];
</script>

<MetaTags
    title="Haushaltsauflösung & Entrümpelung Hildesheim | Aust Umzüge"
    description="Diskrete Haushaltsauflösungen und Entrümpelungen in Hildesheim. Besenreine Räumung und fachgerechte Entsorgung."
    keywords="Haushaltsauflösung Hildesheim, Entrümpelung, Wohnungsräumung, besenreine Übergabe"
    canonical="https://www.aust-umzuege.de/leistungen/haushaltsaufloesung"
/>

<StructuredData schema={services.haushaltsaufloesung} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Trash2 size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Haushaltsauflösungen</h1>
            <p class="service-subtitle">
                Schnell, diskret und besenrein – wir schaffen Platz.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Kompletträumung vom Fachmann</h2>
                <p>
                    Ob Wohnungsauflösung nach einem Todesfall, Räumung einer
                    Messie-Wohnung oder die Entrümpelung von Keller und
                    Dachboden: Wir erledigen diese schweren Aufgaben seriös und
                    zuverlässig für Sie.
                </p>
                <p>
                    Wir sortieren Verwertbares von Müll, kümmern uns um die
                    fachgerechte Entsorgung nach gesetzlichen Vorschriften und
                    übergeben Ihnen das Objekt garantiert besenrein. Auf Wunsch
                    rechnen wir gut erhaltene Gegenstände auf den Preis an.
                </p>

                <h3 class="highlight-title">Unser Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Kostenlose Besichtigung und Festpreisangebot</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Besenreine Übergabe der Räumlichkeiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fachgerechte Entsorgung und Recycling mit Nachweis</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Wertanrechnung für verkaufsfähige
                            Möbel/Antiquitäten</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Entfernung von Tapeten, Teppichen und Einbauten
                            (auf Wunsch)</span
                        >
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So läuft eine Haushaltsauflösung professionell ab</h2>
                <p>
                    Eine Haushaltsauflösung ist oft eine Ausnahmesituation – ob nach einem Todesfall, bei einem Umzug ins Pflegeheim oder nach einer Trennung. In solchen Momenten hilft ein klarer, verlässlicher Ablauf.
                </p>
                <p>
                    <strong>1. Kostenlose Besichtigung vor Ort:</strong> Wir kommen zu Ihnen, schauen uns die Wohnung oder das Haus an und verschaffen uns einen Überblick. Wie viele Räume? Welche Möbel? Gibt es Wertsachen, die verkauft werden können? Gibt es Sondermüll? Auf Basis dieser Besichtigung erstellen wir Ihnen ein verbindliches Festpreisangebot.
                </p>
                <p>
                    <strong>2. Sicherung persönlicher Gegenstände:</strong> Bevor wir mit der Räumung beginnen, sortieren wir gemeinsam alle Erinnerungsstücke, Dokumente, Schmuck und Wertgegenstände aus. Diese werden gesondert verpackt und Ihnen übergeben – oder auf Wunsch sicher gelagert.
                </p>
                <p>
                    <strong>3. Verkauf und Wertanrechnung:</strong> Gut erhaltene Möbel, Antiquitäten oder Sammlungen verkaufen wir an Händler oder spenden sie an soziale Einrichtungen. Den Erlös rechnen wir transparent gegen unsere Kosten auf. So zahlen Sie am Ende oft deutlich weniger.
                </p>
                <p>
                    <strong>4. Fachgerechte Entsorgung:</strong> Alles, was nicht mehr verwertbar ist, entsorgen wir nach gesetzlichen Vorschriften: Sperrmüll, Elektroschrott, Farben, Chemikalien. Wir arbeiten mit zertifizierten Entsorgungsbetrieben zusammen und können Ihnen auf Wunsch Nachweise für Ihre Unterlagen ausstellen.
                </p>
                <p>
                    <strong>5. Besenreine Übergabe:</strong> Am Ende ist die Wohnung leer, gefegt und bereit für die Schlüsselübergabe. Auf Wunsch entfernen wir auch Tapeten, Teppichböden oder Einbauten – sodass die Wohnung renovierungsbereit ist.
                </p>
                <p>
                    <strong>6. Schnelle Abwicklung:</strong> Eine durchschnittliche 3-Zimmer-Wohnung räumen wir in 1-2 Tagen komplett. Bei größeren Objekten oder komplexeren Situationen planen wir entsprechend mehr Zeit ein. Sie erhalten von uns einen verbindlichen Termin, auf den Sie sich verlassen können.
                </p>

                <h2 class="section-title">Haushaltsauflösung in Hildesheim und Umgebung</h2>
                <p>
                    Als lokales Unternehmen kennen wir die Gegebenheiten in Hildesheim genau. Enge Altstadtgassen, Häuser ohne Aufzug, verwinkelte Treppenhäuser – für uns kein Problem. Wir wissen, wo wir mit dem LKW parken können und welche Zufahrtswege möglich sind.
                </p>
                <p>
                    Auch im Umland sind wir tätig: Sarstedt, Alfeld, Bad Salzdetfurth, Elze – überall dort, wo Menschen unsere Unterstützung brauchen. Die Nähe zu unseren Kunden ist uns wichtig, denn oft entstehen während der Räumung noch Fragen oder es müssen Entscheidungen getroffen werden. Dann sind wir schnell vor Ort.
                </p>
                <p>
                    Besonders bei Haushaltsauflösungen nach einem Todesfall arbeiten wir diskret und respektvoll. Wir wissen, wie emotional belastend diese Situation ist – und geben Ihnen die Zeit, die Sie brauchen. Unser Team ist geschult im sensiblen Umgang mit Trauernden und geht behutsam mit den Hinterlassenschaften um.
                </p>

                <h3 class="highlight-title">Herausforderungen bei Haushaltsauflösungen</h3>
                <p>
                    Jede Haushaltsauflösung ist anders. Manche Wohnungen sind gut sortiert, andere völlig überfüllt. Wir haben Erfahrung mit allen Situationen – auch mit sogenannten Messie-Wohnungen, die besondere Anforderungen stellen.
                </p>
                <p>
                    Bei stark vermüllten Wohnungen arbeiten wir mit Schutzkleidung, sorgen für fachgerechte Desinfektion und entsorgen alles hygienisch einwandfrei. Schädlingsbefall? Auch kein Problem – wir koordinieren bei Bedarf mit Kammerjägern und Reinigungsfirmen.
                </p>
                <p>
                    Eine weitere Herausforderung: die kurzen Fristen. Oft muss eine Wohnung innerhalb weniger Tage geräumt werden, weil der Mietvertrag ausläuft. Wir richten uns nach Ihrem Zeitplan und organisieren auch kurzfristige Räumungen.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Oft kombinieren Kunden die Haushaltsauflösung mit einem <a href="/leistungen/seniorenumzug">Seniorenumzug</a>, wenn nicht alles entsorgt, sondern ein Teil in ein neues, kleineres Zuhause gebracht werden soll. Falls Sie Möbel vorübergehend lagern möchten, bieten wir Ihnen sichere <a href="/leistungen/lagerung">Lagerräume</a>. Und wenn Sie nur Teile der Wohnung auflösen wollen, ist unser <a href="/leistungen/privatumzug">Privatumzug</a> die richtige Wahl.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Objekt zu räumen?</h3>
                    <p>
                        Wir erstellen Ihnen ein faires Angebot für die
                        Auflösung.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Haushaltsauflösung anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Haushaltsauflösung aufnehmen"
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
