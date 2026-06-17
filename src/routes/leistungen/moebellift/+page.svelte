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
            answer: "Bei uns starten die Preise für den Möbellift bei 90 € pro Stunde. Das gilt für die Selbstabholung, bei der Sie den Lift bei uns in Hildesheim abholen, selbst aufbauen und wieder zurückbringen. Wenn wir den Möbellift liefern, aufbauen und abholen, kommt eine entfernungsabhängige Anfahrtspauschale hinzu. Soll ein geschulter Mitarbeiter den Lift bedienen, rechnen wir die Bedienzeit zusätzlich ab. Abgerechnet wird stundengenau – Sie zahlen nur die tatsächliche Einsatzzeit. Nach einem kurzen Telefonat nennen wir Ihnen einen festen Preis für Ihre Situation, ohne versteckte Kosten."
        },
        {
            question: "Kann ich den Möbellift auch ohne Bedienpersonal mieten?",
            answer: "Ja. Sie können den Möbellift komplett allein mieten und selbst bedienen – das ist die günstigste Variante ab 90 € pro Stunde. Vor der Übergabe weisen wir Sie gründlich in die Bedienung ein und erklären Ihnen die Sicherheitsvorkehrungen. Wenn Sie sich das nicht zutrauen oder sich auf den Umzug konzentrieren möchten, stellen wir Ihnen gegen Aufpreis einen erfahrenen Bediener zur Seite."
        },
        {
            question: "Kann ich den Möbellift selbst abholen oder wird er geliefert?",
            answer: "Beides ist möglich. Zur Selbstabholung holen Sie den Möbellift mit einem geeigneten Anhänger bei uns in Hildesheim ab – das hält den Preis niedrig. Alternativ liefern wir den Lift direkt zu Ihrer Adresse, bauen ihn betriebsbereit auf und holen ihn nach dem Umzug wieder ab. Gerade bei beengten Innenstadtlagen oder ohne passendes Zugfahrzeug ist die Lieferung die entspannteste Lösung."
        },
        {
            question: "Warum ist ein elektrischer Möbellift besser als ein Benziner?",
            answer: "Unser Möbellift wird elektrisch angetrieben. Das bringt drei klare Vorteile: Er arbeitet abgasfrei, stößt also keine giftigen Verbrennungsabgase aus – ein wichtiger Punkt, wenn der Lift direkt vor der Haustür oder unter offenen Fenstern steht. Er ist außerdem deutlich leiser als ein Benzinmotor, was Nachbarn in Wohngebieten und der Hildesheimer Innenstadt entgegenkommt. Und er ist umweltfreundlicher, weil kein Kraftstoff verbrannt wird. Sie können ihn an jeder normalen Steckdose betreiben."
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
            answer: "Ja. Der Möbellift wird stundengenau ab 90 € pro Stunde abgerechnet – Sie zahlen nur die tatsächliche Einsatzzeit. Das ist fair und planbar: Wenn das Hochziehen schneller geht als gedacht, zahlen Sie weniger. Für längere Einsätze über einen ganzen Umzugstag nennen wir Ihnen vorab eine realistische Gesamtspanne, damit Sie Ihr Budget jederzeit im Blick haben."
        },
        {
            question: "Wie wird der Möbellift mit Strom versorgt?",
            answer: "Der elektrische Möbellift läuft über eine normale Stromversorgung und lässt sich an einer haushaltsüblichen Steckdose betreiben. Eine spezielle Starkstromversorgung ist nicht nötig. Vor dem Einsatz besprechen wir kurz, wo der nächste Stromanschluss liegt, damit am Umzugstag alles reibungslos läuft."
        },
        {
            question: "Mieten auch andere Umzugsfirmen oder Handwerker den Lift bei Ihnen?",
            answer: "Ja. Neben Privatkunden vermieten wir den Möbellift auch an Umzugsunternehmen, Maler, Dachdecker und Handwerksbetriebe in Hildesheim und Umgebung, die kurzfristig einen elektrischen Aufzug für einen Auftrag benötigen. Melden Sie sich einfach mit Termin, Adresse und gewünschter Förderhöhe – wir prüfen die Verfügbarkeit und nennen Ihnen den Preis."
        }
    ];
</script>

<MetaTags
    title="Möbellift mieten Hildesheim – elektrisch & ab 90 € | Aust Umzüge"
    description="Elektrischen Möbellift mieten in Hildesheim: leise, abgasfrei & umweltfreundlich. Ab 90 €/Std. – zur Selbstabholung, mit Lieferung oder inkl. Bedienpersonal."
    keywords="Möbellift mieten Hildesheim, Möbelaufzug mieten, Umzugslift, elektrischer Möbellift, Außenaufzug Umzug"
    canonical="https://www.aust-umzuege.de/leistungen/moebellift"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.moebellift} />
<StructuredData schema={breadcrumbs} />
<!-- TODO: re-enable once the hero images exist in static/
     (moebellift-mieten-hildesheim-elektrisch[-400w|-600w|-800w].webp)
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/moebellift-mieten-hildesheim-elektrisch.webp",
    "url": "https://www.aust-umzuege.de/leistungen/moebellift",
    "name": "Möbellift mieten Hildesheim – elektrischer Möbelaufzug von Aust Umzüge im Einsatz",
    "description": "Elektrischer Möbellift von Aust Umzüge Hildesheim transportiert Möbel leise und abgasfrei in obere Stockwerke. Ab 90 € pro Stunde mietbar.",
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
-->

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
                Elektrisch, leise und abgasfrei – schwere Möbel mühelos in jedes Stockwerk. Ab 90 € pro Stunde.
            </p>
        </header>

        <!-- TODO: re-enable once the hero images exist in static/
             (moebellift-mieten-hildesheim-elektrisch[-400w|-600w|-800w].webp)
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
        -->

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
                    angetriebenen Möbellift</strong> investiert – und vermietet
                    ihn jetzt auch an Privatkunden, Umzugsunternehmen und
                    Handwerksbetriebe in Hildesheim und Umgebung. Sie mieten ihn
                    flexibel: nur den Lift zur Selbstabholung, mit Lieferung und
                    Aufbau oder komplett inklusive geschultem Bedienpersonal.
                </p>

                <h3 class="highlight-title">Ihre Vorteile auf einen Blick:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Elektrisch betrieben – leise und komplett abgasfrei</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Schon ab 90 € pro Stunde mietbar – stundengenau abgerechnet</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Selbstabholung, Lieferung oder mit Bediener – Sie entscheiden</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Transportiert Sofas, Schränke, Klaviere und Großgeräte sicher in obere Etagen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Schont Treppenhaus, Türrahmen und Ihr Umzugsgut</span>
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

                <h2 class="section-title" style="margin-top: var(--space-10);">Drei Wege, den Möbellift zu mieten</h2>
                <p>
                    Sie zahlen nur das, was Sie wirklich brauchen. Wählen Sie die
                    Variante, die zu Ihrem Umzug passt – vom reinen Lift bis zum
                    Rundum-sorglos-Paket mit Bedienung.
                </p>

                <div class="tier-grid">
                    <div class="tier-card">
                        <div class="tier-card__icon"><Package size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Nur Lift – Selbstabholung</h3>
                        <p class="tier-card__price">ab <strong>90 €</strong> / Std.</p>
                        <p class="tier-card__desc">
                            Sie holen den Möbellift bei uns in Hildesheim ab,
                            bauen ihn selbst auf und bringen ihn zurück. Vor der
                            Übergabe weisen wir Sie gründlich ein. Die günstigste
                            Variante.
                        </p>
                    </div>
                    <div class="tier-card tier-card--featured">
                        <div class="tier-card__badge">Beliebt</div>
                        <div class="tier-card__icon"><Truck size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Lift mit Lieferung</h3>
                        <p class="tier-card__price"><strong>90 €</strong> / Std. <span>+ Anfahrt</span></p>
                        <p class="tier-card__desc">
                            Wir liefern den Lift zu Ihrer Adresse, bauen ihn
                            betriebsbereit auf und holen ihn nach dem Umzug wieder
                            ab. Ideal ohne passendes Zugfahrzeug.
                        </p>
                    </div>
                    <div class="tier-card">
                        <div class="tier-card__icon"><UserCheck size={28} strokeWidth={1.5} /></div>
                        <h3 class="tier-card__title">Lift mit Bedienpersonal</h3>
                        <p class="tier-card__price"><strong>90 €</strong> / Std. <span>+ Bediener</span></p>
                        <p class="tier-card__desc">
                            Ein erfahrener Mitarbeiter bedient den Möbellift und
                            nimmt Ihre Möbel sicher an. Sie konzentrieren sich
                            ganz auf Ihren Umzug.
                        </p>
                    </div>
                </div>

                <div class="price-note">
                    <p>
                        <strong>Transparent kalkuliert:</strong> Die Stundenmiete
                        des Lifts beträgt 90 € und wird stundengenau abgerechnet.
                        Anfahrt für Lieferung und Abholung berechnen wir
                        entfernungsabhängig, die Bedienzeit nach tatsächlichem
                        Aufwand. Nach einem kurzen Telefonat nennen wir Ihnen einen
                        festen Preis – ohne versteckte Kosten.
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
                    Termin, Adresse, gewünschtes Stockwerk und ob Sie den Lift
                    selbst bedienen möchten. Wir prüfen Verfügbarkeit und die
                    passende Förderhöhe für Ihr Gebäude und nennen Ihnen einen
                    festen Preis.
                </p>
                <p>
                    <strong>2. Stellplatz und Halteverbot klären:</strong> Der
                    Lift braucht eine freie Fläche vor dem Haus. Auf Wunsch
                    beantragen wir gleich die passende <a href="/leistungen/halteverbot">Halteverbotszone</a>, damit
                    der Platz am Umzugstag frei ist.
                </p>
                <p>
                    <strong>3. Übergabe oder Lieferung:</strong> Je nach Variante
                    holen Sie den Lift bei uns ab oder wir liefern und bauen ihn
                    betriebsbereit auf. Bei Selbstabholung weisen wir Sie
                    gründlich in Bedienung und Sicherheit ein.
                </p>
                <p>
                    <strong>4. Einsatz am Umzugstag:</strong> Der elektrische
                    Antrieb läuft leise und abgasfrei. Möbel und Kartons fahren
                    sicher nach oben oder unten – Sie oder unser Bediener steuern
                    den Lift.
                </p>
                <p>
                    <strong>5. Rückgabe oder Abholung:</strong> Nach dem Umzug
                    bringen Sie den Lift zurück oder wir holen ihn wieder ab.
                    Fertig.
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
                        <li><Leaf size={16} /> Abgasfrei & umweltfreundlich</li>
                        <li><CheckCircle size={16} /> Ab 90 € pro Stunde</li>
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
    .tier-card--featured {
        border-color: #16a34a;
        box-shadow: 0 4px 14px -6px rgba(22, 163, 74, 0.4);
    }
    .tier-card__badge {
        position: absolute;
        top: -11px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #16a34a;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        padding: 3px 10px;
        border-radius: var(--radius-full);
        white-space: nowrap;
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
    .tier-card__price {
        color: #166534;
        font-size: 1.05rem;
        margin-bottom: var(--space-2) !important;
    }
    .tier-card__price strong {
        font-size: 1.6rem;
        font-weight: 800;
    }
    .tier-card__price span {
        font-size: 0.95rem;
        color: #64748b;
        font-weight: 600;
    }
    .tier-card__desc {
        color: #4a5568 !important;
        font-size: 0.95rem !important;
        line-height: 1.55 !important;
        margin-bottom: 0 !important;
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
