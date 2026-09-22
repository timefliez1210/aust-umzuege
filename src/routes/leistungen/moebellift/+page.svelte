<script lang="ts">
    import {
        ArrowUpFromLine,
        CheckCircle,
        ArrowLeft,
        Leaf,
        VolumeX,
        Package,
        Truck,
        UserCheck,
        ShieldCheck,
    } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Möbellift mieten" }
    ]);

    const faqs = [
        {
            question: "Was kostet es, einen Möbellift zu mieten?",
            answer: "Bei uns starten die Preise für den Möbellift bei 95 € pro Stunde. Dazu kommen eine entfernungsabhängige Anfahrtspauschale für Lieferung, Aufbau und Abholung sowie die Bedienzeit unseres Mitarbeiters, der den Lift am Einsatztag steuert. Abgerechnet wird stundengenau – Sie zahlen nur die tatsächliche Einsatzzeit. Nach einem kurzen Telefonat nennen wir Ihnen einen festen Preis für Ihre Situation, ohne versteckte Kosten."
        },
        {
            question: "Kann ich den Möbellift ohne Bedienpersonal mieten?",
            answer: "Nein. Wir vermieten den Möbellift ausschließlich mit einem eigenen, geschulten Mitarbeiter, der den Lift aufbaut, bedient und wieder abbaut. Eine Vermietung zur Selbstabholung oder Selbstbedienung bieten wir nicht an – aus Sicherheits- und Haftungsgründen. Ein Möbellift arbeitet hoch über dem Gehweg, unter Last und im öffentlichen Raum; falsch aufgestellt oder falsch bedient wird er schnell gefährlich. Mit unserem Bediener ist der Einsatz versichert, korrekt abgestützt und fachgerecht durchgeführt."
        },
        {
            question: "Was ist bei der Miete alles enthalten?",
            answer: "Alles rund um den Lift: Wir liefern ihn zu Ihrer Adresse, stellen ihn sicher auf, bauen ihn betriebsbereit auf, bedienen ihn während des gesamten Einsatzes, bauen ihn danach wieder ab und nehmen ihn wieder mit. Sie müssen weder ein Zugfahrzeug organisieren noch sich mit Aufbau, Absicherung oder Technik beschäftigen. Auf Wunsch beantragen wir zusätzlich die Halteverbotszone für den Stellplatz."
        },
        {
            question: "Warum ist ein elektrischer Möbellift besser als ein Benziner?",
            answer: "Unser Möbellift wird elektrisch angetrieben. Das bringt drei klare Vorteile: Er arbeitet abgasfrei, stößt also keine giftigen Verbrennungsabgase aus – ein wichtiger Punkt, wenn der Lift direkt vor der Haustür oder unter offenen Fenstern steht. Er ist außerdem deutlich leiser als ein Benzinmotor, was Nachbarn in Wohngebieten und der Hildesheimer Innenstadt entgegenkommt. Und er ist umweltfreundlicher, weil kein Kraftstoff verbrannt wird. Betrieben wird er an einer ganz normalen Steckdose."
        },
        {
            question: "Bis in welches Stockwerk reicht der Möbellift?",
            answer: "Ein Möbellift transportiert Möbel, Kartons und schwere Geräte außen an der Fassade entlang bis in obere Stockwerke – typischerweise bis zum vierten oder fünften Obergeschoss. Damit ersetzt er das mühsame Tragen über enge Treppenhäuser komplett. Sagen Sie uns einfach, in welche Etage es gehen soll, dann prüfen wir vorab, ob der Lift für Ihr Gebäude die passende Reichweite und Tragkraft hat."
        },
        {
            question: "Für welche Möbel und Gegenstände lohnt sich ein Möbellift?",
            answer: "Ein Möbellift lohnt sich immer dann, wenn sperrige oder schwere Stücke nicht durchs Treppenhaus passen oder das Tragen zu gefährlich wäre: Sofas, Schränke, Boxspringbetten, Waschmaschinen, Kühlschränke, Klaviere oder große Kartonmengen. Über den Lift gehen die Sachen schnell, sicher und ohne Kratzer an Wänden und Treppengeländern nach oben oder unten. Das spart Zeit, Kraft und schont Ihr Umzugsgut."
        },
        {
            question: "Brauche ich für den Möbellift eine Genehmigung oder Halteverbotszone?",
            answer: "Der Möbellift wird auf der Straße oder dem Gehweg vor dem Haus aufgestellt und benötigt dafür eine freie Fläche. In vielen Fällen ist eine Halteverbotszone sinnvoll oder vorgeschrieben, damit der Stellplatz am Umzugstag frei ist. Wir kümmern uns auf Wunsch um die Beantragung und Aufstellung der Halteverbotszone gleich mit – so ist alles aus einer Hand organisiert."
        },
        {
            question: "Wird der Möbellift stundenweise abgerechnet?",
            answer: "Ja. Der Möbellift wird stundengenau ab 95 € pro Stunde abgerechnet – Sie zahlen nur die tatsächliche Einsatzzeit. Das ist fair und planbar: Wenn das Hochziehen schneller geht als gedacht, zahlen Sie weniger. Für längere Einsätze über einen ganzen Umzugstag nennen wir Ihnen vorab eine realistische Gesamtspanne, damit Sie Ihr Budget jederzeit im Blick haben."
        },
        {
            question: "Wie wird der Möbellift mit Strom versorgt?",
            answer: "Der elektrische Möbellift läuft über eine normale Stromversorgung und lässt sich an einer haushaltsüblichen Steckdose betreiben. Eine spezielle Starkstromversorgung ist nicht nötig. Vor dem Einsatz besprechen wir kurz, wo der nächste Stromanschluss liegt, damit am Umzugstag alles reibungslos läuft."
        },
        {
            question: "Können auch Umzugsfirmen oder Handwerker den Lift buchen?",
            answer: "Ja. Neben Privatkunden stellen wir den Möbellift auch Umzugsunternehmen, Malern, Dachdeckern und Handwerksbetrieben in Hildesheim und Umgebung zur Verfügung – ebenfalls immer mit unserem Bediener, der den Lift aufbaut und steuert. Melden Sie sich einfach mit Termin, Adresse und gewünschter Förderhöhe, dann prüfen wir die Verfügbarkeit und nennen Ihnen den Preis."
        }
    ];
</script>

<MetaTags
    title="Möbellift mieten Hildesheim – elektrisch, ab 95 € | Aust"
    description="Möbellift mieten in Hildesheim: elektrisch, leise und abgasfrei – ab 95 €/Std. inklusive Lieferung, Aufbau und Bedienung durch unseren geschulten Mitarbeiter."
    keywords="Möbellift mieten Hildesheim, Möbelaufzug mieten, Umzugslift, elektrischer Möbellift, Außenaufzug Umzug"
    canonical="https://www.aust-umzuege.de/leistungen/moebellift"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.moebellift} />
<StructuredData schema={breadcrumbs} />
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/moebellift-mieten-hildesheim-elektrisch.webp",
    "url": "https://www.aust-umzuege.de/leistungen/moebellift",
    "name": "Möbellift mieten Hildesheim – elektrischer Möbelaufzug von Aust Umzüge im Einsatz",
    "description": "Elektrischer Möbellift von Aust Umzüge Hildesheim transportiert Möbel leise und abgasfrei in obere Stockwerke. Ab 95 € pro Stunde inklusive Bedienung durch unseren Mitarbeiter.",
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
    "width": 1200,
    "height": 675
}} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <ArrowUpFromLine size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Möbellift mieten in Hildesheim</h1>
            <p class="service-subtitle">
                Elektrisch, leise und abgasfrei – schwere Möbel mühelos in jedes Stockwerk.
                Inklusive Lieferung, Aufbau und Bedienung. Ab 95 € pro Stunde.
            </p>
        </header>

        <div class="hero-image">
            <img
                src="/moebellift-mieten-hildesheim-elektrisch.webp"
                srcset="/moebellift-mieten-hildesheim-elektrisch-400w.webp 400w,
                        /moebellift-mieten-hildesheim-elektrisch-600w.webp 600w,
                        /moebellift-mieten-hildesheim-elektrisch-800w.webp 800w,
                        /moebellift-mieten-hildesheim-elektrisch.webp 1200w"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 960px"
                alt="Elektrischer Möbellift von Aust Umzüge Hildesheim transportiert Möbel in ein oberes Stockwerk"
                width="1200"
                height="675"
                fetchpriority="high"
            />
        </div>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Schwere Möbel ohne Treppenstress</h2>
                <p>
                    Ein enges Treppenhaus, kein Aufzug, ein sperriges Sofa oder
                    ein schweres Klavier im dritten Stock – das ist der Moment,
                    in dem ein Möbellift Gold wert ist. Statt Möbel mühsam und
                    mit Kratzgefahr über die Treppe zu wuchten, fahren sie außen
                    an der Fassade entlang sicher nach oben oder unten.
                </p>
                <p>
                    Alex Aust hat in einen modernen, <strong>elektrisch
                    angetriebenen Möbellift</strong> investiert – und stellt ihn
                    Privatkunden, Umzugsunternehmen und Handwerksbetrieben in
                    Hildesheim und Umgebung zur Verfügung. Und zwar immer als
                    Komplettleistung: <strong>Wir liefern den Lift, bauen ihn auf,
                    bedienen ihn mit einem eigenen geschulten Mitarbeiter und
                    holen ihn danach wieder ab.</strong> Sie brauchen weder ein
                    Zugfahrzeug noch technisches Vorwissen – nur zu sagen, was
                    nach oben oder unten soll.
                </p>

                <h3 class="highlight-title">Ihre Vorteile auf einen Blick:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Elektrisch betrieben – leise und komplett abgasfrei</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Schon ab 95 € pro Stunde – stundengenau abgerechnet</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Lieferung, Aufbau, Bedienung und Abholung – alles aus einer Hand</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Transportiert Sofas, Schränke, Klaviere und Großgeräte sicher in obere Etagen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Schont Treppenhaus, Türrahmen und Ihr Umzugsgut</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Bedient von unserem eigenen Personal – sicher und versichert</span>
                    </li>
                </ul>

                <div class="eco-box">
                    <div class="eco-box__icon"><Leaf size={28} strokeWidth={1.75} /></div>
                    <div>
                        <p class="eco-box__lead">Elektrisch statt Benzin – gut für Nachbarn und Umwelt</p>
                        <p>
                            Unser Möbellift fährt mit einem Elektroantrieb statt
                            mit einem Verbrennungsmotor. Das heißt: <strong>keine
                            giftigen Abgase</strong> direkt vor Ihrer Haustür und
                            unter offenen Fenstern, ein <strong>deutlich
                            leiserer Betrieb</strong> in Wohngebieten und der
                            Hildesheimer Innenstadt und ein <strong>geringerer
                            CO₂-Fußabdruck</strong> Ihres Umzugs. Betrieben wird
                            er an einer ganz normalen Steckdose.
                        </p>
                    </div>
                </div>

                <h2 class="section-title" style="margin-top: var(--space-10);">Immer inklusive: Lieferung, Aufbau und Bedienung</h2>
                <p>
                    Bei uns gibt es den Möbellift nur im Komplettpaket – mit
                    eigenem Bediener. Sie buchen einen Termin, alles andere
                    übernehmen wir.
                </p>

                <div class="tier-grid">
                    <div class="tier-card">
                        <div class="tier-card__icon"><Truck size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Lieferung &amp; Aufbau</h3>
                        <p class="tier-card__desc">
                            Wir bringen den Möbellift zu Ihrer Adresse, stellen ihn
                            sicher auf dem Stellplatz ab, stützen ihn fachgerecht
                            ab und bauen ihn betriebsbereit auf.
                        </p>
                    </div>
                    <div class="tier-card">
                        <div class="tier-card__icon"><UserCheck size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Bedienung durch uns</h3>
                        <p class="tier-card__desc">
                            Ein erfahrener Mitarbeiter steuert den Lift während des
                            gesamten Einsatzes und nimmt Ihre Möbel am Fenster oder
                            Balkon sicher an.
                        </p>
                    </div>
                    <div class="tier-card">
                        <div class="tier-card__icon"><Package size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Abbau &amp; Abholung</h3>
                        <p class="tier-card__desc">
                            Nach dem Einsatz bauen wir den Lift wieder ab und nehmen
                            ihn mit. Sie müssen nichts zurückbringen und nichts
                            reinigen.
                        </p>
                    </div>
                </div>

                <div class="notice-box">
                    <div class="notice-box__icon"><ShieldCheck size={28} strokeWidth={1.75} /></div>
                    <div>
                        <p class="notice-box__lead">Keine Vermietung zur Selbstbedienung</p>
                        <p>
                            Wir geben den Möbellift <strong>nicht ohne unser
                            Personal heraus</strong> – weder zur Selbstabholung noch
                            zur Bedienung in Eigenregie. Ein Möbellift arbeitet
                            unter Last, mehrere Stockwerke hoch und im öffentlichen
                            Verkehrsraum. Standsicherheit, Abstützung, Windlast und
                            Lastaufnahme sind nichts, was man in einer kurzen
                            Einweisung lernt. Mit unserem geschulten Bediener ist der
                            Einsatz fachgerecht aufgebaut, versichert und für alle
                            Beteiligten sicher – für Sie, Ihre Möbel und die
                            Menschen auf dem Gehweg.
                        </p>
                    </div>
                </div>

                <div class="price-note">
                    <p>
                        <strong>Transparent kalkuliert:</strong> Die Stundenmiete
                        des Lifts beträgt 95 € und wird stundengenau abgerechnet.
                        Hinzu kommen die Anfahrt für Lieferung und Abholung
                        (entfernungsabhängig) sowie die Bedienzeit unseres
                        Mitarbeiters nach tatsächlichem Aufwand. Nach einem kurzen
                        Telefonat nennen wir Ihnen einen festen Preis – ohne
                        versteckte Kosten.
                    </p>
                </div>

                <h2 class="section-title" style="margin-top: var(--space-10);">Wann sich ein Möbellift wirklich lohnt</h2>
                <p>
                    Nicht jeder Umzug braucht einen Möbellift – aber in vielen
                    Situationen spart er Zeit, Kraft und teure Schäden. Diese
                    Fälle erleben wir in Hildesheim immer wieder:
                </p>
                <p>
                    <strong>Altbau ohne Aufzug:</strong> Gerade die schönen
                    Gründerzeithäuser am Moritzberg oder in der Nordstadt haben
                    oft hohe Decken, enge Treppenhäuser und keinen Lift. Ein Sofa
                    oder ein Kleiderschrank ist hier kaum durchs Treppenhaus zu
                    bekommen – über die Fassade dagegen in Minuten.
                </p>
                <p>
                    <strong>Schwere Einzelstücke:</strong> Klaviere,
                    Boxspringbetten, Tresore, Waschmaschinen oder massive
                    Eichenschränke sind zu zweit kaum sicher zu tragen. Der
                    Möbellift nimmt das Gewicht auf und bringt sie kontrolliert
                    ins Stockwerk.
                </p>
                <p>
                    <strong>Enge oder verwinkelte Treppenhäuser:</strong> Wo es
                    keine Kurve gibt, durch die das Sofa passt, ist der Weg außen
                    herum die einzige saubere Lösung – ganz ohne demontieren oder
                    Wand und Geländer zu beschädigen.
                </p>
                <p>
                    <strong>Viele Kartons, wenig Zeit:</strong> Auch große
                    Kartonmengen lassen sich gebündelt nach oben fahren, statt sie
                    einzeln über mehrere Etagen zu schleppen. Das beschleunigt den
                    Umzugstag spürbar.
                </p>

                <h2 class="section-title">So läuft die Möbellift-Miete bei uns ab</h2>
                <p>
                    <strong>1. Anfrage und Beratung:</strong> Sie sagen uns
                    Termin, Adresse, gewünschtes Stockwerk und was transportiert
                    werden soll. Wir prüfen Verfügbarkeit und die passende
                    Förderhöhe für Ihr Gebäude und nennen Ihnen einen festen
                    Preis.
                </p>
                <p>
                    <strong>2. Stellplatz und Halteverbot klären:</strong> Der
                    Lift braucht eine freie Fläche vor dem Haus. Auf Wunsch
                    beantragen wir gleich die passende <a href="/leistungen/halteverbot">Halteverbotszone</a>, damit
                    der Platz am Umzugstag frei ist.
                </p>
                <p>
                    <strong>3. Lieferung und Aufbau:</strong> Wir kommen zum
                    vereinbarten Termin, stellen den Lift auf dem Stellplatz ab,
                    stützen ihn fachgerecht ab und bauen ihn betriebsbereit auf.
                </p>
                <p>
                    <strong>4. Einsatz am Umzugstag:</strong> Unser Mitarbeiter
                    bedient den Lift während des gesamten Einsatzes. Der
                    elektrische Antrieb läuft leise und abgasfrei, Möbel und
                    Kartons fahren sicher nach oben oder unten.
                </p>
                <p>
                    <strong>5. Abbau und Abholung:</strong> Nach dem Umzug bauen
                    wir den Lift wieder ab und nehmen ihn mit. Fertig – Sie
                    müssen sich um nichts kümmern.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Der Möbellift ist die perfekte Ergänzung zu unserem
                    <a href="/leistungen/privatumzug">Privatumzug</a> und zu
                    unseren <a href="/leistungen/umzugshelfer">Umzugshelfern</a> –
                    gemeinsam wird selbst der Umzug in den fünften Stock zur
                    Routine. Damit der Stellplatz vor dem Haus frei bleibt,
                    organisieren wir Ihre <a href="/leistungen/halteverbot">Halteverbotszone</a>, und für
                    den fachgerechten Auf- und Abbau Ihrer Möbel ist unser
                    <a href="/leistungen/montage">Montageservice</a> zur Stelle.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Möbellift anfragen</h3>
                    <p>
                        Nennen Sie uns Termin, Adresse und Stockwerk – wir prüfen
                        die Verfügbarkeit und den Preis.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            openFlow
                            showArrow={false}
                        />
                    </div>
                    <ul class="cta-facts">
                        <li><VolumeX size={16} /> Leiser Elektroantrieb</li>
                        <li><Leaf size={16} /> Abgasfrei &amp; umweltfreundlich</li>
                        <li><UserCheck size={16} /> Inkl. Aufbau &amp; Bedienung</li>
                        <li><CheckCircle size={16} /> Ab 95 € pro Stunde</li>
                    </ul>
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
        max-width: var(--container-max);
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
        color: #16a34a;
        background-color: #ecfdf5;
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
    .text-column a {
        color: var(--color-nav-accent);
        text-decoration: underline;
        font-weight: 600;
    }
    .text-column a:hover {
        color: var(--color-info-bar);
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
        color: #16a34a;
        flex-shrink: 0;
    }

    /* Eco highlight box */
    .eco-box {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        background-color: #ecfdf5;
        border: 1px solid #a7f3d0;
        border-left: 4px solid #16a34a;
        border-radius: var(--radius-md);
        padding: var(--space-5) var(--space-5);
        margin-block: var(--space-6);
    }
    .eco-box__icon {
        color: #16a34a;
        flex-shrink: 0;
        margin-top: 2px;
    }
    .eco-box p {
        color: #14532d !important;
        font-size: 1rem !important;
        line-height: 1.6;
        margin-bottom: var(--space-2) !important;
    }
    .eco-box p:last-child {
        margin-bottom: 0 !important;
    }
    .eco-box__lead {
        font-weight: 700;
        font-size: 1.05rem !important;
    }

    /* Rental variant tier cards */
    .tier-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-4);
        margin-block: var(--space-6);
    }
    @media (min-width: 640px) {
        .tier-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    .tier-card {
        position: relative;
        background-color: #fff;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-5);
        display: flex;
        flex-direction: column;
    }
    .tier-card__icon {
        color: #16a34a;
        margin-bottom: var(--space-2);
    }
    .tier-card__title {
        color: var(--color-info-bar);
        font-size: 1.05rem;
        font-weight: 700;
        margin-bottom: var(--space-2);
    }
    .tier-card__desc {
        color: #4a5568 !important;
        font-size: 0.95rem !important;
        line-height: 1.55 !important;
        margin-bottom: 0 !important;
    }
    /* Safety notice box */
    .notice-box {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        background-color: #fffbeb;
        border: 1px solid #fde68a;
        border-left: 4px solid #d97706;
        border-radius: var(--radius-md);
        padding: var(--space-5) var(--space-5);
        margin-block: var(--space-6);
    }
    .notice-box__icon {
        color: #d97706;
        flex-shrink: 0;
        margin-top: 2px;
    }
    .notice-box p {
        color: #78350f !important;
        font-size: 1rem !important;
        line-height: 1.6;
        margin-bottom: var(--space-2) !important;
    }
    .notice-box p:last-child {
        margin-bottom: 0 !important;
    }
    .notice-box__lead {
        font-weight: 700;
        font-size: 1.05rem !important;
    }

    .price-note {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-md);
        padding: var(--space-4) var(--space-5);
        margin-block: var(--space-6);
    }
    .price-note p {
        color: #1a202c !important;
        font-size: 0.975rem !important;
        line-height: 1.6;
        margin-bottom: 0 !important;
    }

    /* CTA box */
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
    .cta-facts {
        list-style: none;
        padding: var(--space-4) 0 0;
        margin: var(--space-4) 0 0;
        border-top: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        text-align: left;
    }
    .cta-facts li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: #4a5568;
        font-size: 0.9rem;
        font-weight: 600;
    }
    .cta-facts :global(svg) {
        color: #16a34a;
        flex-shrink: 0;
    }
</style>
