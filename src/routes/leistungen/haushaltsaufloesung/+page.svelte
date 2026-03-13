<script lang="ts">
    import { Trash2, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import ServiceReviews from "$lib/components/ServiceReviews.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

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
            answer: "Wir gehen besonders sensibel vor: Zunächst sichern wir gemeinsam persönliche Erinnerungsstücke, Dokumente und Wertgegenstände. Dann räumen wir die Wohnung zügig und diskret, entsorgen fachgerecht und übergeben besenrein. Wir können den gesamten Ablauf auch direkt mit Ihrem Nachlassverwalter oder Vermieter koordinieren, wenn Sie nicht vor Ort sein können."
        },
        {
            question: "Wie lange dauert eine Haushaltsauflösung?",
            answer: "Eine durchschnittliche 3-Zimmer-Wohnung räumen wir in 1–2 Tagen komplett. Bei größeren Objekten oder ganzen Häusern planen wir entsprechend mehr Zeit ein. Wir nennen Ihnen den genauen Zeitrahmen nach der Besichtigung, damit Sie die Wohnungsübergabe zuverlässig planen können."
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
            question: "Können Sie auch im Namen von Erben oder Nachlassverwaltern tätig werden?",
            answer: "Ja, sehr gerne. Wir koordinieren regelmäßig direkt mit Nachlassverwaltern, Notaren und Vermietern – auch wenn die Angehörigen nicht vor Ort sein können. Wir halten Sie oder Ihren Bevollmächtigten über jeden Schritt informiert und arbeiten so diskret und zuverlässig, dass Sie sich keine Sorgen machen müssen."
        },
        {
            question: "Was passiert mit persönlichen Dokumenten und Papieren?",
            answer: "Persönliche Dokumente – Ausweise, Verträge, Fotos, Briefe – werden immer gesondert gesammelt und Ihnen übergeben, niemals entsorgt. Wir sichern diese Unterlagen bereits vor Beginn der eigentlichen Räumung. Falls Sie nicht vor Ort sein können, werden die Dokumente sicher verpackt und Ihnen auf dem Postweg oder persönlich übergeben."
        }
    ];
</script>

<MetaTags
    title="Haushaltsauflösung Hildesheim – Diskret & Festpreis | Aust Umzüge"
    description="Haushaltsauflösung in Hildesheim – einfühlsam und diskret. Wertgegenstände werden angerechnet, besenreine Übergabe garantiert. Jetzt Termin vereinbaren."
    keywords="Haushaltsauflösung Hildesheim, Wohnungsauflösung, Nachlassräumung, besenreine Übergabe"
    canonical="https://www.aust-umzuege.de/leistungen/haushaltsaufloesung"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.haushaltsaufloesung} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Michael Sack" },
    "datePublished": "2025-11-01",
    "reviewBody": "Die Haushaltsauflösung hat prima geklappt - von der Kontaktaufnahme über die gemeinsame Besichtigung und das Angebot bis zur Durchführung und Abrechnung. Das Team war pünktlich und sehr sorgfältig und freundlich. Kann ich gutenGewissens weiter empfehlen."
}} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Heinz Kruse" },
    "datePublished": "2022-03-01",
    "reviewBody": "Es musste ein Nachlass aus einer Wohnung im 3.Stock komplett entleert und entsorgt werden, wobei es sich um enorme Mengen handelte. Herr Alex Aust hat alles persönlich gesteuert und kräftig mit angepackt, alles wurde zu unserer vollsten Zufriedenheit erledigt, und das zu einem attraktiven Festpreis. Die Übergabe erfolgte besenrein zum vereinbarten Zeitpunkt. Dank an Herrn Aust und dem Team, eine wirklich saubere Sache."
}} />
<StructuredData schema={{
    "@type": "Review",
    "itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
    "reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
    "author": { "@type": "Person", "name": "Mathias M." },
    "datePublished": "2020-02-19",
    "reviewBody": "Junger Unternehmer, der seine Arbeit sehr gewissenhaft, schnell und zuverlässig erledigt. Fairer Preis, zeitnahe Absprache und schnelle Erledigung. Bei mir wurde eine Wohnung aufgelöst, was Herr Aust und sein Team sehr schnell erledigt haben. Danke dafür. Sehr zu empfehlen und weiterhin viel Erfolg."
}} />
<StructuredData schema={breadcrumbs} />
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/haushaltsaufloesung-hildesheim-entrumpeln-container.webp",
    "url": "https://www.aust-umzuege.de/leistungen/haushaltsaufloesung",
    "name": "Haushaltsauflösung Hildesheim – Aust Umzüge Team bei der Arbeit",
    "description": "Drei Mitarbeiter von Aust Umzüge beladen einen Container bei einer Haushaltsauflösung in Hildesheim. Professionelle Wohnungsauflösung und Nachlassräumung aus einer Hand.",
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
    "height": 845
}} />

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
            <h1 class="service-title">Haushaltsauflösung Hildesheim</h1>
            <p class="service-subtitle">
                Einfühlsam, diskret und zum Festpreis – wir kümmern uns um alles.
            </p>
        </header>

        <div class="hero-image">
            <img
                src="/haushaltsaufloesung-hildesheim-entrumpeln-container.webp"
                srcset="/haushaltsaufloesung-hildesheim-entrumpeln-container-400w.webp 400w,
                        /haushaltsaufloesung-hildesheim-entrumpeln-container-600w.webp 600w,
                        /haushaltsaufloesung-hildesheim-entrumpeln-container-800w.webp 800w,
                        /haushaltsaufloesung-hildesheim-entrumpeln-container.webp 1500w"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 960px"
                alt="Aust Umzüge Team bei einer Haushaltsauflösung in Hildesheim – drei Mitarbeiter beim Beladen eines Containers"
                width="1500"
                height="845"
                fetchpriority="high"
            />
        </div>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Wenn ein Haushalt aufgelöst werden muss</h2>
                <p>
                    Eine Haushaltsauflösung ist fast immer mit einer besonderen Lebenssituation verbunden: ein Todesfall in der Familie, der Umzug eines Angehörigen ins Pflegeheim, eine Erbschaft oder die Übergabe einer geerbten Wohnung. Wir wissen, dass diese Momente emotional belastend sind – und gehen entsprechend behutsam vor.
                </p>
                <p>
                    Wir sichern zuerst persönliche Erinnerungsstücke, Dokumente und Wertsachen, sortieren verkaufsfähige Möbel transparent aus und rechnen deren Wert gegen unsere Kosten an. Am Ende übergeben wir das Objekt garantiert besenrein – termingerecht und zum vereinbarten Festpreis.
                </p>

                <h3 class="highlight-title">Unser Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Kostenlose Besichtigung und verbindliches Festpreisangebot</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Sicherung persönlicher Erinnerungsstücke und Dokumente</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Wertanrechnung für gut erhaltene Möbel und Antiquitäten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Besenreine Übergabe der Räumlichkeiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Fachgerechte Entsorgung mit Nachweis</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Koordination mit Nachlassverwalter und Vermieter möglich</span>
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So läuft eine Haushaltsauflösung ab</h2>
                <p>
                    Jede Haushaltsauflösung ist anders. Was bei uns immer gleich bleibt: ein klarer, verlässlicher Ablauf – damit Sie sich auf das Wesentliche konzentrieren können.
                </p>
                <p>
                    <strong>1. Kostenlose Besichtigung vor Ort:</strong> Wir kommen zu Ihnen, sehen uns die Wohnung oder das Haus an und schaffen uns einen realistischen Überblick. Wie viele Räume? Welche Möbel? Gibt es Wertsachen oder Antiquitäten? Auf Basis dieser Besichtigung erstellen wir Ihnen ein verbindliches Festpreisangebot – ohne versteckte Kosten.
                </p>
                <p>
                    <strong>2. Sicherung persönlicher Gegenstände:</strong> Bevor wir mit der Räumung beginnen, sortieren wir gemeinsam alle Erinnerungsstücke, Dokumente, Schmuck und Wertgegenstände aus. Diese werden gesondert verpackt und Ihnen übergeben – oder auf Wunsch sicher gelagert.
                </p>
                <p>
                    <strong>3. Wertanrechnung:</strong> Gut erhaltene Möbel, Antiquitäten oder Sammlungen verkaufen wir an Händler oder spenden sie an soziale Einrichtungen in Hildesheim. Den Erlös rechnen wir transparent gegen unsere Kosten auf. So zahlen Sie am Ende oft deutlich weniger.
                </p>
                <p>
                    <strong>4. Fachgerechte Entsorgung:</strong> Alles, was nicht mehr verwertbar ist, entsorgen wir nach gesetzlichen Vorschriften: Sperrmüll, Elektroschrott, Farben, Chemikalien – über zertifizierte Entsorgungsbetriebe. Auf Wunsch erhalten Sie Nachweise für Ihre Unterlagen.
                </p>
                <p>
                    <strong>5. Besenreine Übergabe:</strong> Am Ende ist die Wohnung leer, gefegt und bereit für die Schlüsselübergabe. Auf Wunsch entfernen wir auch Tapeten, Teppichböden oder Einbauten – sodass die Wohnung renovierungsbereit ist.
                </p>
                <p>
                    <strong>6. Schnelle Abwicklung:</strong> Eine durchschnittliche 3-Zimmer-Wohnung räumen wir in 1–2 Tagen komplett. Bei größeren Objekten planen wir entsprechend mehr Zeit ein. Sie erhalten einen verbindlichen Termin, auf den Sie sich verlassen können.
                </p>

                <h2 class="section-title">Haushaltsauflösung in Hildesheim und Umgebung</h2>
                <p>
                    Als lokales Unternehmen kennen wir die Gegebenheiten in Hildesheim genau. Enge Altstadtgassen, Häuser ohne Aufzug, verwinkelte Treppenhäuser – für uns kein Problem. Wir wissen, wo wir mit dem LKW parken können und welche Zufahrtswege möglich sind.
                </p>
                <p>
                    Auch im Umland sind wir tätig: Sarstedt, Alfeld, Bad Salzdetfurth, Elze – überall dort, wo Menschen unsere Unterstützung brauchen. Die Nähe zu unseren Kunden ist uns wichtig, denn oft entstehen während der Räumung noch Fragen oder es müssen Entscheidungen getroffen werden. Dann sind wir schnell vor Ort.
                </p>
                <p>
                    Besonders bei Haushaltsauflösungen nach einem Todesfall arbeiten wir diskret und respektvoll. Wir wissen, wie emotional belastend diese Situation ist – und geben Ihnen die Zeit, die Sie brauchen. Unser Team geht behutsam mit den Hinterlassenschaften um und behandelt jeden Gegenstand mit der Sorgfalt, die er verdient.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Oft kombinieren Kunden die Haushaltsauflösung mit einem <a href="/leistungen/seniorenumzug">Seniorenumzug</a>, wenn nicht alles entsorgt, sondern ein Teil in ein neues, kleineres Zuhause gebracht werden soll. Falls Sie einzelne Räume wie Keller, Dachboden oder Garage räumen möchten, ist unsere <a href="/leistungen/entruempelung">Entrümpelung</a> die richtige Wahl. Möbel, die vorübergehend untergebracht werden müssen, lagern wir sicher in unseren <a href="/leistungen/lagerung">Lagerräumen</a>.
                </p>
            </div>

            <div class="cta-column">
                <ServiceReviews reviews={[
                    {
                        author: "Michael Sack",
                        text: "Die Haushaltsauflösung hat prima geklappt - von der Kontaktaufnahme über die gemeinsame Besichtigung und das Angebot bis zur Durchführung und Abrechnung. Das Team war pünktlich und sehr sorgfältig und freundlich. Kann ich guten Gewissens weiter empfehlen.\n\n(3-Zimmer-Wohnung und Keller mit z.T. noch gut gefüllten Schränken)",
                        url: "https://share.google/U5XOIm6w0B25gJllz"
                    },
                    {
                        author: "Heinz Kruse",
                        text: "Es musste ein Nachlass aus einer Wohnung im 3.Stock komplett entleert und entsorgt werden, wobei es sich um enorme Mengen handelte, z.B. allein an Büchern ca. 1,2 Tonnen Gewicht.\n\nHerr Alex Aust hat alles persönlich gesteuert und kräftig mit angepackt, alles wurde zu unserer vollsten Zufriedenheit erledigt, und das zu einem attraktiven Festpreis. Das 6-köpfige Team hatte wirklich Schwerstarbeit zu verrichten, viele Dinge mussten von den Wänden demontiert werden und selbst Nägel und Dübel wurden aus den Wänden entfernt.\n\nDie Übergabe erfolgte besenrein zum vereinbarten Zeitpunkt. Dank an Herrn Aust und dem Team, eine wirklich saubere Sache.",
                        url: "https://share.google/1REFp0ZOMjpkFY7YO"
                    },
                    {
                        author: "Mathias M.",
                        text: "Junger Unternehmer, der seine Arbeit sehr gewissenhaft, schnell und zuverlässig erledigt. Fairer Preis, zeitnahe Absprache und schnelle Erledigung. Bei mir wurde eine Wohnung aufgelöst, was Herr Aust und sein Team sehr schnell erledigt haben. Danke dafür. Sehr zu empfehlen.",
                        url: "https://maps.app.goo.gl/qNzfcMr4NYGdrMow5"
                    }
                ]} />
                <div class="cta-box">
                    <h3>Objekt zu räumen?</h3>
                    <p>
                        Wir erstellen Ihnen ein faires Angebot für die Auflösung.
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
