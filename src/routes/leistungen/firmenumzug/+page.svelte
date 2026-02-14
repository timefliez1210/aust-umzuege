<script lang="ts">
    import { Building2, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Firmenumzug" }
    ]);

    const faqs = [
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
    title="Firmenumzug Hildesheim | Aust Umzüge"
    description="Professionelle Firmen- und Büroumzüge. Minimale Ausfallzeiten, IT-Transport und Wochenendservice für Ihr Unternehmen."
    keywords="Firmenumzug Hildesheim, Büroumzug, Geschäftsumzug, IT-Umzug, Betriebsumzug"
    canonical="https://www.aust-umzuege.de/leistungen/firmenumzug"
/>

<StructuredData schema={services.firmenumzug} />
<StructuredData schema={breadcrumbs} />

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
            <h1 class="service-title">Firmenumzug</h1>
            <p class="service-subtitle">
                Effiziente Standortwechsel für Büros, Praxen und Betriebe.
            </p>
        </header>

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

                <h2 class="section-title">Firmenumzug: Effizient geplant, schnell umgesetzt</h2>
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

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Viele Firmenumzüge benötigen eine <a href="/leistungen/halteverbot">Halteverbotszone</a> an der alten und neuen Adresse – wir beantragen diese für Sie. Falls Sie IT-Equipment oder Akten vorübergehend lagern müssen, bieten wir sichere <a href="/leistungen/lagerung">Lagerräume</a>. Und für die Montage komplexer Büromöbelsysteme steht unser <a href="/leistungen/montage">Montageservice</a> bereit.
                </p>
            </div>

            <div class="cta-column">
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
                            ariaLabel="Kostenloses Angebot für Firmenumzug anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Beratungsgespräch"
                            href="/kontakt"
                            ariaLabel="Kontakt für Firmenumzug aufnehmen"
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
</style>
