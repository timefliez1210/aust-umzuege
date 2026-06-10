<script lang="ts">
    import { Building2, ArrowLeft, MapPin, Truck, Shield, Star, Users, Award } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { businessInfoSlim, aggregateRating, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Über uns" }
    ]);

    const aboutPage = {
        "@type": "AboutPage",
        "@id": "https://www.aust-umzuege.de/ueber-uns",
        url: "https://www.aust-umzuege.de/ueber-uns",
        name: "Über Aust Umzüge – Umzugsunternehmen aus Hildesheim",
        description:
            "Aust Umzüge: inhabergeführtes Umzugsunternehmen aus Hildesheim. Gegründet 2019 von Alex Aust. 7 festangestellte Mitarbeiter, 5,0 Sterne aus über 70 Bewertungen.",
        mainEntity: {
            "@id": "https://www.aust-umzuege.de/#organization"
        }
    };
</script>

<MetaTags
    title="Über Aust Umzüge – Umzugsunternehmen aus Hildesheim"
    description="Inhabergeführtes Umzugsunternehmen aus Hildesheim, gegründet 2019 von Alex Aust. 7 festangestellte Mitarbeiter, eigener Fuhrpark, voll versichert. 5,0 Sterne aus über 70 Bewertungen."
    keywords="Aust Umzüge, Über uns, Umzugsunternehmen Hildesheim, Alex Aust, Umzugsfirma Geschichte"
    canonical="https://www.aust-umzuege.de/ueber-uns"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={aboutPage} />
<StructuredData schema={breadcrumbs} />

<main class="about-page">
    <div class="about-page__container">
        <a href="/" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Startseite
        </a>

        <header class="about-header">
            <div class="icon-wrapper">
                <Building2 size={48} strokeWidth={1.5} />
            </div>
            <h1 class="about-title">Über Aust Umzüge</h1>
            <p class="about-subtitle">
                Inhabergeführtes Umzugsunternehmen aus Hildesheim – seit 2019.
            </p>
        </header>

        <div class="team-photo">
            <img
                src="/team-aust-umzuege-hildesheim.jpg"
                alt="Das Team von Aust Umzüge vor dem Umzugs-LKW in Hildesheim"
                width="1200"
                height="800"
                loading="eager"
            />
        </div>

        <section class="stats-grid">
            <div class="stat">
                <Star size={28} strokeWidth={1.8} />
                <span class="stat__value">{aggregateRating.ratingValue.toFixed(1)} ★</span>
                <span class="stat__label">aus {aggregateRating.reviewCount}+ Bewertungen</span>
            </div>
            <div class="stat">
                <Users size={28} strokeWidth={1.8} />
                <span class="stat__value">7</span>
                <span class="stat__label">festangestellte Mitarbeiter</span>
            </div>
            <div class="stat">
                <Award size={28} strokeWidth={1.8} />
                <span class="stat__value">2019</span>
                <span class="stat__label">in Hildesheim gegründet</span>
            </div>
            <div class="stat">
                <MapPin size={28} strokeWidth={1.8} />
                <span class="stat__value">DE / EU</span>
                <span class="stat__label">bundesweit & europaweit</span>
            </div>
        </section>

        <div class="about-content">
            <section>
                <h2 class="section-title">Wie alles angefangen hat</h2>
                <p>
                    Aust Umzüge wurde 2019 in Hildesheim von Alex Aust gegründet. Die Idee
                    dahinter: Umzüge ohne Überraschungen auf der Endrechnung, ohne wechselnde
                    Tagelöhner am Umzugstag und ohne pauschal überdimensionierte LKWs, die den
                    Preis künstlich nach oben treiben. Aus einem Ein-Mann-Betrieb mit angemietetem
                    Transporter ist seither ein Team aus sieben festangestellten Mitarbeitern mit
                    eigenem Fuhrpark geworden – und über 70 Fünf-Sterne-Bewertungen auf Google,
                    die in fast jedem Text dieselben drei Worte wiederholen: pünktlich, sorgfältig,
                    freundlich.
                </p>
                <p>
                    Unser Sitz ist die Kaiserstraße 32 in Hildesheim. Wir sind hier verwurzelt.
                    Wir kennen die schmalen Durchfahrten in der Altstadt, die engen Treppenhäuser
                    am Moritzberg und die Vorlaufzeiten beim Bauamt für Halteverbotszonen. Von hier
                    aus arbeiten wir täglich für Kunden in der Region und weit darüber hinaus.
                </p>
            </section>

            <section>
                <h2 class="section-title">Wo wir arbeiten</h2>
                <p>
                    Unsere Heimat ist Hildesheim und Umgebung – Sarstedt, Giesen, Harsum, Bockenem,
                    Alfeld, Bad Salzdetfurth, Elze – alles Heimspiel. Genauso regelmäßig fahren wir
                    nach <a href="/umzug-hannover">Hannover</a> und <a href="/umzug-braunschweig">Braunschweig</a>,
                    nach Wolfsburg und in den gesamten Großraum Niedersachsen.
                </p>
                <p>
                    Auch deutschlandweit sind wir unterwegs: Umzüge über 100, 240, 350 Kilometer
                    Distanz haben wir bereits abgewickelt – Niedersachsen nach Nordrhein-Westfalen,
                    Hildesheim nach Bayern, quer durch Deutschland. Über die Grenzen hinaus
                    organisieren wir <a href="/leistungen/fern-ueberseeumzug">Fern- und Überseeumzüge</a> –
                    bis hin zu Container-Verschiffungen nach Afrika, fachgerecht verpackt und
                    transportgesichert.
                </p>
            </section>

            <section>
                <h2 class="section-title">Fuhrpark und Ausrüstung</h2>
                <p>
                    Wir arbeiten mit eigenem Fuhrpark – verschiedene LKW-Größen vom 3,5-Tonner bis
                    zum großen Möbelwagen. Das hat einen Grund: Wir wählen das Fahrzeug nach Bedarf
                    aus, statt pauschal das größte anzubieten. Eine wiederkehrende Bewertung
                    beschreibt es so – „Wo andere mit einem 7,5-Tonner kommen wollten, sagte er, ein
                    3,5-Tonner reicht. Alles hat reingepasst." Das spart unseren Kunden bares Geld,
                    weil sie nicht für Volumen bezahlen, das niemand braucht.
                </p>
                <p>
                    Ergänzt wird das durch professionelle Ausrüstung: Tragegurte, Sackkarren,
                    Möbeldecken, Spanngurte, Umzugskartons in allen gängigen Größen,
                    Verpackungsmaterial und Werkzeug für Möbelmontage und Küchen-Anschluss. Wenn
                    der Standardweg nicht reicht – etwa wenn ein Klavier oder Tresor in den dritten
                    Stock soll und das Treppenhaus zu eng ist – setzen wir einen Möbellift ein. So
                    gehen Möbel auch dann sauber durchs Fenster, wenn sie nicht durch die Tür
                    passen.
                </p>
            </section>

            <section>
                <h2 class="section-title">Versicherung – das Risiko liegt bei uns</h2>
                <p>
                    Jeder Umzug ist über unsere <strong>Betriebshaftpflichtversicherung</strong> und
                    <strong>Transportversicherung</strong> vollständig abgesichert. Schäden an Ihrem
                    Inventar, an Ihrer Wohnung oder am Treppenhaus werden über uns reguliert – Sie
                    haften nicht und müssen nicht selbst nachverhandeln.
                </p>
                <p>
                    Das ist ein deutlicher Unterschied zu Hilfe durch Freunde oder Plattform-Helfer:
                    Verletzt sich dort jemand beim Tragen Ihres Sofas, können Sie als Auftraggeber
                    persönlich nach §823 BGB haftbar gemacht werden. Bei uns ist das Risiko Teil
                    des Auftragspreises, nicht Ihrer Privatsache.
                </p>
            </section>

            <section>
                <h2 class="section-title">Was wir besonders gut können</h2>
                <p>
                    Standard-Privatumzüge erledigen wir mit der gleichen Sorgfalt wie alle anderen.
                    Aber es gibt ein paar Bereiche, in denen unsere Erfahrung besonders trägt:
                </p>
                <ul class="strengths-list">
                    <li>
                        <strong><a href="/leistungen/seniorenumzug">Seniorenumzüge</a> ins betreute Wohnen oder Pflegeheim</strong> –
                        einfühlsam, mit Zeit für Aussortieren und Erinnerungsstücke. Die häufigste Lobreihe
                        in unseren Bewertungen.
                    </li>
                    <li>
                        <strong><a href="/leistungen/haushaltsaufloesung">Haushaltsauflösungen</a> nach Todesfall oder Pflegeheim-Umzug</strong> –
                        diskret, mit Wertanrechnung, oft als Nachlassverbindlichkeit steuerlich absetzbar.
                    </li>
                    <li>
                        <strong>Komplexe Möbelmontagen</strong> – Einbauküchen mit Arbeitsplatten-Anpassung,
                        Wasser- und Elektroanschluss durch erfahrene Monteure im Team.
                    </li>
                    <li>
                        <strong><a href="/leistungen/praxisumzug">Praxis- und Büroumzüge</a></strong> mit DSGVO-konformem
                        Aktentransport und Wochenendservice für minimale Ausfallzeit.
                    </li>
                    <li>
                        <strong>Übersee-Container und Auslandsumzüge</strong> – professionelle
                        Verpackung und Sicherung von Möbeln, Maschinen und Werkzeugen für lange
                        Schiffspassagen.
                    </li>
                    <li>
                        <strong>Schwere und empfindliche Einzelstücke</strong> – Klavier, Tresor,
                        Antiquitäten, hochwertige Möbel mit besonderer Sorgfalt.
                    </li>
                </ul>
            </section>

            <section>
                <h2 class="section-title">Wer Sie betreut – und wer am Umzugstag arbeitet</h2>
                <p>
                    Aust Umzüge ist inhabergeführt, und das merken Sie schon vor dem ersten
                    Kistenkleben: Bei der kostenlosen Vor-Ort-Besichtigung kommt Alex Aust selbst
                    vorbei. Er schätzt das Volumen ein, klärt Sonderwünsche, erstellt das
                    Festpreisangebot und koordiniert den Auftrag. Auch danach ist er per Telefon
                    und WhatsApp direkt erreichbar – das ist der Punkt, den unsere Kunden in den
                    Bewertungen am häufigsten loben: „Herr Aust war immer schnell zu erreichen",
                    „die Kommunikation war hervorragend".
                </p>
                <p>
                    Am Umzugstag selbst läuft die Ausführung über unser festangestelltes Team.
                    Sieben Mitarbeiter, eingespielt, mit derselben Schulung und denselben
                    Standards. Kein Tagelöhner-Karussell, keine fremden Gesichter, die sich morgens
                    am LKW kennenlernen. Diese Trennung ist gewollt: Wer plant, plant
                    konzentriert. Wer ausführt, hat den Tag dafür frei.
                </p>
                <p>
                    Mehrere Bewertungen heben hervor, dass das Team „fair zueinander" arbeitet und
                    sich „gegenseitig den Rücken stützt" – einmal ganz wörtlich: Zwei Mitarbeiter
                    trugen mit Gurten eine schwere Druckmaschine durch einen engen Flur, zwei
                    weitere stützten ihnen dabei den Rücken. Das ist Teil dessen, warum die Arbeit
                    am Ende stimmt: ohne Schäden, im Zeitrahmen, zum vereinbarten Festpreis.
                </p>
            </section>

            <section>
                <h2 class="section-title">Wenn Sie mehr wissen möchten</h2>
                <p>
                    Eine vollständige Übersicht unserer Leistungen finden Sie auf der
                    <a href="/leistungen">Leistungsseite</a>. Konkrete Erfahrungsberichte unserer
                    Kunden lesen Sie in unseren <a href="https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6" target="_blank" rel="noopener">Google-Bewertungen</a>.
                    Und wenn Sie einen Umzug planen: Eine Vor-Ort-Besichtigung mit Festpreisangebot
                    ist immer kostenlos und unverbindlich – sprechen Sie uns einfach an.
                </p>
            </section>
        </div>

        <div class="cta-block">
            <h2>Wir freuen uns auf Ihren Umzug</h2>
            <p>Kostenlose Besichtigung mit Festpreisangebot – persönlich, vor Ort.</p>
            <div class="cta-buttons">
                <CTAButton text="Kostenloses Angebot" href="/kostenloses-angebot" showArrow={false} />
                <CTAButton text="Kontakt aufnehmen" openFlow showArrow={false} />
            </div>
        </div>
    </div>
</main>

<style>
    .about-page {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .about-page__container {
        max-width: var(--container-max);
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

    .about-header {
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
        background-color: #eff6ff;
        width: 80px;
        height: 80px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: var(--space-4);
    }

    .about-title {
        color: var(--color-info-bar);
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .about-subtitle {
        color: #64748b;
        font-size: 1.25rem;
    }

    .team-photo {
        margin-bottom: var(--space-12);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    .team-photo img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
        max-height: 520px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);
        margin-bottom: var(--space-12);
    }

    @media (min-width: 768px) {
        .stats-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    .stat {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-5);
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-info-bar);
    }

    .stat__value {
        font-size: clamp(1.5rem, 3vw, 2rem);
        font-weight: var(--font-bold);
        color: var(--color-info-bar);
    }

    .stat__label {
        color: #64748b;
        font-size: var(--text-sm);
    }

    .about-content {
        max-width: 820px;
        margin: 0 auto;
    }

    .about-content section {
        margin-bottom: var(--space-12);
    }

    .section-title {
        color: var(--color-info-bar);
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-4);
    }

    .about-content p {
        color: #4a5568;
        line-height: 1.7;
        margin-bottom: var(--space-4);
        font-size: 1.125rem;
    }

    .about-content a {
        color: var(--color-nav-accent);
        text-decoration: underline;
        font-weight: var(--font-semibold);
    }

    .about-content a:hover {
        color: var(--color-info-bar);
    }

    .strengths-list {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .strengths-list li {
        background-color: #f8fafc;
        border-left: 4px solid var(--color-nav-accent);
        padding: var(--space-4) var(--space-5);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        color: #4a5568;
        line-height: 1.6;
        font-size: 1rem;
    }

    .strengths-list li strong {
        color: var(--color-info-bar);
    }

    .cta-block {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-10) var(--space-6);
        text-align: center;
        max-width: 820px;
        margin: 0 auto;
    }

    .cta-block h2 {
        color: var(--color-info-bar);
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .cta-block p {
        color: #4a5568;
        margin-bottom: var(--space-6);
    }

    .cta-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
        max-width: 320px;
        margin: 0 auto;
    }

    @media (min-width: 600px) {
        .cta-buttons {
            flex-direction: row;
            max-width: none;
            justify-content: center;
        }
    }
</style>
