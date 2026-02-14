<script lang="ts">
    import { Ban, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Halteverbot" }
    ]);

    const faqs = [
        {
            question: "Was kostet eine Halteverbotszone für den Umzug in Hildesheim?",
            answer: "In Hildesheim kostet eine Halteverbotszone inklusive behördlicher Genehmigung, Schilder und Aufstellung zwischen 100 und 200 Euro pro Zone. Wenn Sie sowohl an der alten als auch der neuen Adresse eine Zone benötigen, bieten wir ein Paketangebot. Im Vergleich zu den Zeit- und Kostenersparnissen am Umzugstag rechnet sich das schnell."
        },
        {
            question: "Wie lange vorher muss das Halteverbot beantragt werden?",
            answer: "Die Schilder müssen mindestens 72 Stunden (3 volle Tage) vor dem Umzug aufgestellt sein. Für die behördliche Genehmigung beim Ordnungsamt benötigen wir 2-3 Wochen Vorlauf. Beauftragen Sie uns daher idealerweise 3-4 Wochen vor dem Umzug, damit alles rechtzeitig genehmigt und aufgestellt ist."
        },
        {
            question: "Was passiert, wenn trotzdem jemand in der Halteverbotszone parkt?",
            answer: "Ordnungswidrig parkende Fahrzeuge dürfen abgeschleppt werden – die Kosten trägt der Falschparker. Sollte am Umzugstag ein Auto in der Zone stehen, kontaktieren wir umgehend das Ordnungsamt oder die Polizei. Dank des dokumentierten Aufstellungsprotokolls (mit Fotos und Datum) sind Sie rechtlich auf der sicheren Seite."
        },
        {
            question: "Brauche ich ein Halteverbot an beiden Adressen?",
            answer: "Wir empfehlen es dringend. Halteverbotszonen an alter und neuer Adresse verkürzen die Tragewege erheblich und können den Umzug um 1-2 Stunden beschleunigen. Das spart Ihnen bei einem stundenbasierten Umzug oft mehr, als die zweite Zone kostet."
        },
        {
            question: "Kann ich das Halteverbot auch selbst beantragen?",
            answer: "Ja, grundsätzlich können Sie die Genehmigung selbst beim Ordnungsamt beantragen und Schilder mieten. Allerdings ist der Prozess zeitaufwendig und Fehler (falsche Maße, fehlende Protokolle) können dazu führen, dass das Halteverbot ungültig ist. Wir übernehmen den kompletten Prozess zuverlässig für Sie – inklusive aller Formalitäten."
        },
        {
            question: "Wie groß sollte die Halteverbotszone sein?",
            answer: "Die Standardgröße ist 15 Meter (Platz für einen großen Umzugs-LKW). Bei größeren Umzügen mit zwei Fahrzeugen oder bei engen Straßen beantragen wir entsprechend mehr Platz. Wir kennen die örtlichen Gegebenheiten in Hildesheim und beantragen immer die optimale Größe."
        },
        {
            question: "Gilt das Halteverbot auch am Wochenende und an Feiertagen?",
            answer: "Ja, ein genehmigtes Halteverbot gilt an allen Tagen, auch am Wochenende und an Feiertagen. Wir beantragen das Halteverbot genau für den Zeitraum, den Sie benötigen – ob Samstag, Sonntag oder unter der Woche. Die Kosten sind unabhängig vom Wochentag."
        }
    ];
</script>

<MetaTags
    title="Halteverbot einrichten | Aust Umzüge Hildesheim"
    description="Offizielle Halteverbotszonen für Ihren Umzug. Wir kümmern uns um Antrag, Aufstellung und Abbau der Schilder."
    keywords="Halteverbot Umzug Hildesheim, Halteverbotszone, Parkplatz Umzug, Halteverbotsschilder"
    canonical="https://www.aust-umzuege.de/leistungen/halteverbot"
/>

<StructuredData schema={services.halteverbot} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Ban size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Halteverbot</h1>
            <p class="service-subtitle">
                Freie Fahrt für Ihren Umzugswagen – ohne Stress und
                Parkplatzsuche.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Rechtzeitig Platz schaffen</h2>
                <p>
                    Nichts ist ärgerlicher als ein Umzugswagen, der keinen
                    Parkplatz findet. Lange Tragewege kosten Zeit, Kraft und
                    Nerven. In engen Stadtgebieten ist eine offizielle
                    Halteverbotszone daher unverzichtbar.
                </p>
                <p>
                    Wir übernehmen für Sie den kompletten Behördengang. Wir
                    beantragen die Genehmigung, stellen die Schilder
                    fristgerecht auf und holen sie nach dem Umzug wieder ab. So
                    ist der Parkplatz vor Ihrer Tür garantiert.
                </p>

                <h3 class="highlight-title">Unser Service umfasst:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Beantragung der behördlichen Genehmigung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fristgerechtes Aufstellen der Halteverbotsschilder
                            (mind. 72h vorher)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Erstellung des Aufstellungsprotokolls</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Abbau und Abtransport der Schilder nach dem Umzug</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Auch für Selbstumzieher buchbar</span>
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So organisieren wir Ihre Halteverbotszone</h2>
                <p>
                    Eine offizielle Halteverbotszone sorgt dafür, dass Ihr Umzugswagen direkt vor der Tür parken kann. Ohne lange Tragewege, ohne Parkplatzsuche, ohne Stress. Wir übernehmen den gesamten Prozess für Sie.
                </p>
                <p>
                    <strong>1. Bedarfsklärung:</strong> Wie groß soll die Zone sein? An welchen Adressen benötigen Sie Halteverbot (alte und/oder neue Wohnung)? Welcher Zeitraum ist nötig? Wir besprechen alle Details und planen die optimale Lösung.
                </p>
                <p>
                    <strong>2. Beantragung beim Ordnungsamt:</strong> Wir stellen den offiziellen Antrag bei der Stadt Hildesheim, reichen alle erforderlichen Unterlagen ein und warten auf die Genehmigung. Das dauert in der Regel 2-3 Wochen – deshalb sollten Sie uns frühzeitig beauftragen.
                </p>
                <p>
                    <strong>3. Aufstellung der Schilder:</strong> Mindestens 72 Stunden vor dem Umzug stellen wir die Halteverbotsschilder auf. Wir dokumentieren Datum, Uhrzeit und Position mit Fotos – als rechtliche Absicherung. So ist sichergestellt, dass die Zone offiziell gilt.
                </p>
                <p>
                    <strong>4. Protokoll und Dokumentation:</strong> Sie erhalten von uns ein Aufstellungsprotokoll mit allen relevanten Daten. Falls am Umzugstag trotzdem jemand in der Zone parkt, können wir das Ordnungsamt oder die Polizei kontaktieren – die Abschleppkosten trägt der Falschparker.
                </p>
                <p>
                    <strong>5. Umzugstag:</strong> Ihre Halteverbotszone ist frei, der Umzugswagen kann direkt vor der Tür parken. Kurze Tragewege bedeuten weniger Zeit, weniger Kraft und weniger Kosten.
                </p>
                <p>
                    <strong>6. Abbau der Schilder:</strong> Nach dem Umzug holen wir die Schilder wieder ab und geben sie zurück. Sie müssen sich um nichts kümmern.
                </p>

                <h2 class="section-title">Warum eine Halteverbotszone in Hildesheim wichtig ist</h2>
                <p>
                    Hildesheim ist eine gewachsene Stadt mit vielen engen Straßen, besonders in der Altstadt. Wer hier schon einmal einen Parkplatz gesucht hat, weiß: Es ist eng. Und genau deshalb ist eine Halteverbotszone bei Umzügen oft unverzichtbar.
                </p>
                <p>
                    Stellen Sie sich vor: Der Umzugswagen muss 200 Meter entfernt parken, weil direkt vor Ihrer Wohnung kein Platz ist. Jedes Möbelstück muss diese 200 Meter getragen werden – hin und zurück. Bei einem 3-Zimmer-Haushalt sind das schnell 50 Gänge. Das kostet Zeit, Kraft und am Ende auch Geld, weil die Helfer länger brauchen.
                </p>
                <p>
                    Mit einer Halteverbotszone steht der LKW direkt vor Ihrer Tür. Die Tragewege sind minimal, der Umzug geht schneller – und Sie sparen am Ende mehr, als die Halteverbotszone kostet.
                </p>
                <p>
                    Besonders in engen Straßen oder bei schweren Möbeln ist die Zone Gold wert. Ein Klavier, ein Flügel, ein schwerer Tresor – solche Stücke trägt man nicht gerne 200 Meter weit. Und auch bei Umzügen in höhere Stockwerke ohne Aufzug ist jeder eingesparte Meter ein Segen.
                </p>

                <h3 class="highlight-title">Häufige Fragen zu Halteverbotszonen</h3>
                <p>
                    „Wie groß sollte die Zone sein?" Die Standardgröße ist 15 Meter – genug Platz für einen großen Umzugs-LKW. Bei größeren Umzügen mit zwei Fahrzeugen oder besonders engen Straßen beantragen wir entsprechend mehr Platz. Wir kennen die Hildesheimer Straßen und schätzen die optimale Größe für Sie ein.
                </p>
                <p>
                    „Was passiert, wenn trotzdem jemand in der Zone parkt?" Dann rufen wir das Ordnungsamt oder die Polizei. Das ordnungswidrig parkende Fahrzeug darf abgeschleppt werden – auf Kosten des Falschparkers. Dank unseres Aufstellungsprotokolls sind Sie rechtlich auf der sicheren Seite.
                </p>
                <p>
                    „Kann ich die Zone auch nur für einen halben Tag beantragen?" Nein, Halteverbotszonen gelten immer tageweise. Aber das ist auch sinnvoll: Oft dauern Umzüge länger als geplant, und mit einer ganztägigen Zone haben Sie einen Puffer.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Halteverbot wird meist zusammen mit einem <a href="/leistungen/privatumzug">Privatumzug</a>, <a href="/leistungen/firmenumzug">Firmenumzug</a> oder <a href="/leistungen/seniorenumzug">Seniorenumzug</a> gebucht. Aber auch Selbstumzieher, die einen Transporter gemietet haben, nutzen unseren Service – denn eine Halteverbotszone können Sie auch einzeln bei uns bestellen.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Parkplatz benötigt?</h3>
                    <p>
                        Bestellen Sie Ihre Halteverbotszone rechtzeitig bei uns.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Jetzt bestellen"
                            href="/kontakt"
                            ariaLabel="Halteverbot für Umzug bestellen"
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
        background-color: #fef3c7;
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
</style>
