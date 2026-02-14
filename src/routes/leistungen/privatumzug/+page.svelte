<script lang="ts">
    import { Home, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Privatumzug" }
    ]);

    const faqs = [
        {
            question: "Was kostet ein Privatumzug in Hildesheim?",
            answer: "Die Kosten richten sich nach Wohnungsgröße, Etage, Entfernung und gewünschten Leistungen. In Hildesheim liegt ein 2-Zimmer-Umzug erfahrungsgemäß zwischen 400 und 800 Euro, ein 4-Zimmer-Haushalt zwischen 1.200 und 2.500 Euro. Wir erstellen Ihnen nach einer kostenlosen Vor-Ort-Besichtigung ein verbindliches Festpreisangebot – ohne versteckte Kosten. Fordern Sie jetzt Ihr unverbindliches Angebot an."
        },
        {
            question: "Lohnt sich eine Umzugsfirma oder soll ich selbst umziehen?",
            answer: "Sobald Sie mehr als zwei Zimmer umziehen, lohnt sich eine Umzugsfirma fast immer. Sie sparen sich Transporter-Miete, Versicherungsrisiko und oft mehrere Tage Arbeit. Professionelle Möbelpacker arbeiten schneller, sicherer und Ihr Inventar ist während des Transports versichert. Bei uns erhalten Sie ein Festpreisangebot – so wissen Sie vorab genau, was der Umzug kostet."
        },
        {
            question: "Wie lange dauert ein Privatumzug?",
            answer: "Ein 2-Zimmer-Umzug innerhalb Hildesheims dauert in der Regel 4-6 Stunden, ein 4-Zimmer-Haushalt 8-10 Stunden. Bei längeren Strecken oder Dachgeschoss ohne Aufzug kann es länger dauern. Wir schätzen den Zeitbedarf bei der kostenlosen Besichtigung realistisch ein, damit Sie Ihren Tag planen können."
        },
        {
            question: "Wann sollte ich eine Umzugsfirma buchen?",
            answer: "Idealerweise 4-6 Wochen vor dem Umzugstermin. Zur Hochsaison (Sommer, Monatsende, Quartalsende) empfehlen wir 6-8 Wochen Vorlauf. So sichern Sie sich Ihren Wunschtermin. Kurzfristige Anfragen sind bei freien Kapazitäten ebenfalls möglich – rufen Sie uns einfach an."
        },
        {
            question: "Sind meine Möbel während des Umzugs versichert?",
            answer: "Ja, Ihr gesamtes Inventar ist während des Transports über unsere Betriebshaftpflicht- und Transportversicherung geschützt. Das ist ein entscheidender Vorteil gegenüber einem Umzug in Eigenregie mit privaten Helfern, bei dem Sie für Schäden selbst haften. Die genauen Konditionen besprechen wir bei der Angebotserstellung."
        },
        {
            question: "Kann ich Umzugskosten von der Steuer absetzen?",
            answer: "Ja, bei beruflich bedingten Umzügen können Sie die Kosten als Werbungskosten absetzen. Die Umzugskostenpauschale liegt aktuell bei 964 Euro pro Person. Auch privat veranlasste Umzüge lassen sich teilweise als haushaltsnahe Dienstleistung geltend machen (20% der Arbeitskosten, max. 4.000 Euro). Sie erhalten von uns eine ordnungsgemäße Rechnung."
        },
        {
            question: "Brauche ich eine Halteverbotszone für den Umzug?",
            answer: "In den meisten Fällen ja – besonders in Innenstadtlagen und engen Straßen. Eine Halteverbotszone spart erheblich Zeit und Kosten, weil der LKW direkt vor der Tür parken kann. Wir übernehmen auf Wunsch die komplette Beantragung und Aufstellung. Der Service kostet in Hildesheim ca. 100-200 Euro pro Zone."
        }
    ];
</script>

<MetaTags
    title="Privatumzug Hildesheim | Aust Umzüge"
    description="Stressfreier Privatumzug in Hildesheim und Umgebung. Wir bieten Full-Service, Montage und faire Preise für Ihren Wohnungswechsel."
    keywords="Privatumzug Hildesheim, Umzug Privatpersonen, Wohnungsumzug, Umzugsfirma Hildesheim"
    canonical="https://www.aust-umzuege.de/leistungen/privatumzug"
/>

<StructuredData schema={services.privatumzug} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Home size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Privatumzug</h1>
            <p class="service-subtitle">
                Ihr Start in ein neues Zuhause – entspannt und professionell.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Unser Service für Ihren Umzug</h2>
                <p>
                    Ein Umzug ist mehr als nur der Transport von Möbeln – er ist
                    der Beginn eines neuen Lebensabschnitts. Damit Sie diesen
                    entspannt angehen können, übernehmen wir für Sie die gesamte
                    Planung und Durchführung.
                </p>
                <p>
                    Egal ob Single-Appartement oder Einfamilienhaus: Wir
                    behandeln Ihr Eigentum so sorgfältig wie unser eigenes.
                    Unser erfahrenes Team sorgt dafür, dass alles sicher
                    verpackt, transportiert und am neuen Ort wieder aufgebaut
                    wird.
                </p>

                <h3 class="highlight-title">Unsere Leistungen im Detail:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Kostenlose Vor-Ort-Besichtigung & Festpreisangebot</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Professioneller Einpackservice (auf
                            Wunsch)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Demontage und Montage aller Möbel und Küchen</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Einrichtung von Halteverbotszonen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Versicherungsschutz für Ihr gesamtes Inventar</span
                        >
                    </li>
                </ul>

                <h2 class="section-title" style="margin-top: var(--space-16);">So läuft Ihr Privatumzug mit Aust Umzüge ab</h2>
                <p>
                    Einen Umzug zu planen kann sich anfühlen wie ein zweiter Job. Zwischen Mietvertrag, Ummeldung, Kisten packen und den alten Schlüssel abgeben bleibt kaum Luft zum Atmen. Genau deshalb nehmen wir Ihnen so viel wie möglich ab. Hier sehen Sie, wie ein typischer Privatumzug mit uns abläuft.
                </p>
                <p>
                    <strong>1. Erstes Gespräch und Besichtigung</strong><br>
                    Sie rufen an oder schreiben uns -- wir melden uns in der Regel am selben Tag zurück. Dann vereinbaren wir einen Termin bei Ihnen zu Hause. Wir schauen uns gemeinsam an, was mitgenommen werden soll, wo es knifflig werden kann (Dachgeschoss? Klavier? Enge Treppe?) und was Sie sich wünschen. Das dauert meistens eine halbe Stunde, manchmal etwas länger.
                </p>
                <p>
                    <strong>2. Festpreisangebot</strong><br>
                    Innerhalb von ein bis zwei Tagen erhalten Sie ein klares Angebot per Mail. Kein Kleingedrucktes, keine versteckten Zuschläge. Der Preis, den wir nennen, steht. Auch wenn der Umzug mal eine Stunde länger dauert als geplant.
                </p>
                <p>
                    <strong>3. Vorbereitung am Umzugstag</strong><br>
                    Wir bringen Verpackungsmaterial mit, stellen auf Wunsch eine Halteverbotszone auf und schützen Treppenhäuser und Türrahmen. Bevor ein einziger Karton ins Auto kommt, ist alles vorbereitet.
                </p>
                <p>
                    <strong>4. Einpacken, Abbauen, Verladen</strong><br>
                    Ob Sie selbst packen oder das uns überlassen -- wir stellen uns darauf ein. Möbel, die nicht am Stück passen, werden fachgerecht abgebaut. Unsere Schreiner im Team kennen sich mit allen gängigen Systemen aus. Dann laden wir ein. Systematisch, nicht wahllos.
                </p>
                <p>
                    <strong>5. Transport und Entladen</strong><br>
                    Am neuen Ort wird entladen und jede Kiste genau in den richtigen Raum gestellt. Sie sagen, wo was hin soll -- wir tragen es dorthin.
                </p>
                <p>
                    <strong>6. Aufbau und Feinschliff</strong><br>
                    Möbel wieder zusammenbauen, Küche anschließen, Lampen aufhängen. Erst wenn Sie sagen "alles gut", ist der Umzug für uns erledigt. Nicht vorher.
                </p>

                <h2 class="section-title">Privatumzug in Hildesheim und Umgebung</h2>
                <p>
                    Wer in Hildesheim umzieht, braucht ein Team, das die Stadt kennt. Und wir kennen sie. Die schmalen Durchfahrten in der Altstadt rund um den Marktplatz. Die engen Treppenhäuser in den Gründerzeithäusern an der Schuhstraße. Die Parkplatzsituation in der Nordstadt, wo ein Umzugswagen ohne Halteverbot manchmal drei Straßen weiter stehen müsste.
                </p>
                <p>
                    Wir wissen, bei welchen Straßen in der Oststadt das Ordnungsamt unkompliziert ist und wo man besser zwei Wochen vorher den Antrag stellt. Wir kennen die typischen Herausforderungen in den verschiedenen Vierteln -- ob Moritzberg mit seinen steilen Auffahrten, die Nordstadt mit ihren Altbauten oder die Neubauviertel in Ochtersum und Itzum.
                </p>
                <p>
                    Auch ins Umland fahren wir regelmäßig. Sarstedt, Giesen, Harsum, Bockenem, Alfeld, Bad Salzdetfurth -- für uns alles Heimspiel. Und wenn es mal weiter gehen soll, nach Hannover oder Göttingen zum Beispiel, sind wir genauso dabei.
                </p>
                <p>
                    Weil wir hier verwurzelt sind, können wir Ihren Umzug besser einschätzen als ein überregionaler Anbieter. Wir wissen, wo es eng wird, wo man aufpassen muss und wo es besonders flott geht. Das spart am Ende Zeit und Geld.
                </p>

                <h3 class="highlight-title">Häufige Herausforderungen beim Privatumzug</h3>
                <p>
                    <strong>"Ich weiß gar nicht, wo ich anfangen soll."</strong><br>
                    Das hören wir oft. Die Antwort: mit einem Anruf bei uns. Wir geben Ihnen schon am Telefon eine grobe Orientierung, was auf Sie zukommt, und bei der Besichtigung erstellen wir gemeinsam einen Plan. Danach wissen Sie genau, was Sie selbst machen und was wir übernehmen.
                </p>
                <p>
                    <strong>"Meine Waschmaschine passt nicht durchs Treppenhaus."</strong><br>
                    Kein seltenes Problem, gerade in Altbauten. Wir prüfen vorher, ob alles durch die Türen und ums Eck passt. Falls nötig, setzen wir einen Möbellift ein oder nehmen einen alternativen Weg. An solche Dinge denken wir, bevor sie zum Problem werden.
                </p>
                <p>
                    <strong>"Ich habe kaum Urlaub und will das an einem Tag schaffen."</strong><br>
                    Verstehen wir. Deshalb planen wir so, dass der Umzug möglichst in einem Tag über die Bühne geht. Mit genug Leuten und einem klaren Ablaufplan ist das auch bei einer Vier-Zimmer-Wohnung machbar. In Einzelfällen empfehlen wir einen Umzug über zwei Tage -- aber nur, wenn es wirklich nötig ist.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Ihr Privatumzug ist unser Kerngeschäft, aber manchmal braucht es noch ein bisschen mehr. Wenn Ihre Küche ab- und wieder aufgebaut werden muss, übernimmt das unser <a href="/leistungen/montage">Montage-Team</a> direkt mit. Brauchen Sie einen garantierten Parkplatz vor der Tür? Wir kümmern uns um die <a href="/leistungen/halteverbot">Halteverbotszone</a>, von der Beantragung bis zum Schilderabbau.
                </p>
                <p>
                    Wenn die neue Wohnung noch nicht fertig ist und Sie eine Zwischenlösung brauchen, bieten wir <a href="/leistungen/lagerung">Einlagerung</a> mit flexiblen Laufzeiten an. Und falls Sie sich unsicher sind, was genau Sie brauchen, starten Sie am besten mit einer <a href="/leistungen/umzugsberatung">kostenlosen Umzugsberatung</a>. Dann klären wir alles in Ruhe bei Ihnen vor Ort.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Bereit für den Umzug?</h3>
                    <p>
                        Lassen Sie sich jetzt ein unverbindliches Angebot
                        erstellen.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kostenloses Angebot"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Privatumzug anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Privatumzug aufnehmen"
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
        background-color: #fff7ed;
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
