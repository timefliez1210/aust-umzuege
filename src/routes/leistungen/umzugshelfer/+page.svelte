<script lang="ts">
    import { Users, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Umzugshelfer" }
    ]);

    const faqs = [
        {
            question: "Was kosten Umzugshelfer pro Stunde in Hildesheim?",
            answer: "Unsere professionellen Umzugshelfer kosten zwischen 25 und 35 Euro pro Person und Stunde, inklusive Versicherung und Ausrüstung. Private Helfer sind zwar günstiger (10-15 Euro), arbeiten aber ohne Haftpflichtversicherung und Erfahrung. Für ein konkretes Angebot rufen Sie uns kurz an – wir beraten Sie innerhalb von Minuten."
        },
        {
            question: "Wie viele Umzugshelfer brauche ich?",
            answer: "Als Faustregel: 2 Helfer für eine 2-Zimmer-Wohnung, 3 Helfer für 3-4 Zimmer, 4 Helfer für ein Einfamilienhaus. Bei vielen schweren Möbeln, Treppen oder ohne Aufzug empfehlen wir eher einen Helfer mehr. Wir beraten Sie gerne telefonisch und schlagen die optimale Teamgröße vor."
        },
        {
            question: "Sind Ihre Umzugshelfer versichert?",
            answer: "Ja, alle unsere Umzugshelfer sind über unsere Betriebshaftpflichtversicherung abgesichert. Schäden an Möbeln, Wohnungen oder Treppenhäusern werden übernommen. Das unterscheidet uns deutlich von privaten Helfern oder Plattform-Angeboten, wo Sie bei Schäden auf den Kosten sitzen bleiben."
        },
        {
            question: "Kann ich Helfer auch nur für einzelne Aufgaben buchen?",
            answer: "Selbstverständlich. Ob nur zum Beladen des Transporters, zum Tragen eines Klaviers die Treppe hinunter oder zum kompletten Be- und Entladen – wir passen uns flexibel Ihrem Bedarf an. Auch stundenweise Buchungen ab 2 Stunden sind möglich."
        },
        {
            question: "Wie kurzfristig kann ich Umzugshelfer buchen?",
            answer: "Bei freien Kapazitäten stellen wir auch innerhalb von 24-48 Stunden Helfer. Am Monatsende und in der Sommersaison empfehlen wir 1-2 Wochen Vorlauf. Rufen Sie uns einfach an – wir sagen Ihnen sofort, ob wir an Ihrem Wunschtermin verfügbar sind."
        },
        {
            question: "Was ist der Unterschied zwischen Umzugshelfern und einem Vollservice-Umzug?",
            answer: "Bei Umzugshelfern bringen Sie Ihren eigenen Transporter mit und wir stellen die Arbeitskraft. Beim Vollservice-Umzug übernehmen wir alles: LKW, Verpackung, Transport, Montage und auf Wunsch Halteverbot. Wenn Sie unsicher sind, beraten wir Sie gerne – oft ist der Vollservice überraschend günstig."
        },
        {
            question: "Bringen Ihre Helfer eigenes Werkzeug und Ausrüstung mit?",
            answer: "Ja, unsere Helfer kommen mit Tragegurten, Möbeldecken, Sackkarren, Spanngurten und grundlegendem Montagewerkzeug. Sie müssen nichts vorbereiten. Falls spezielle Werkzeuge benötigt werden (z.B. für Küchen), sprechen wir das vorab ab."
        }
    ];
</script>

<MetaTags
    title="Umzugshelfer Hildesheim | Aust Umzüge"
    description="Kräftige Umzugshelfer mieten. Unterstützung beim Tragen, Beladen und Entladen – stundenweise buchbar."
    keywords="Umzugshelfer Hildesheim, Möbelpacker, Tragehilfe Umzug, stundenweise Helfer"
    canonical="https://www.aust-umzuege.de/leistungen/umzugshelfer"
/>

<StructuredData schema={services.umzugshelfer} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Users size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Umzugshelfer</h1>
            <p class="service-subtitle">
                Starke Hände für Ihren Umzug – flexibel und zuverlässig.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Sie organisieren, wir packen an</h2>
                <p>
                    Sie haben einen Transporter gemietet und den Umzug selbst
                    organisiert, brauchen aber noch Unterstützung beim
                    Schleppen? Kein Problem! Unsere erfahrenen Umzugshelfer
                    greifen Ihnen unter die Arme.
                </p>
                <p>
                    Egal ob es nur um das Tragen der schweren Waschmaschine geht
                    oder um das komplette Be- und Entladen des LKW: Unsere
                    Mitarbeiter sind körperlich fit, handwerklich geschickt und
                    wissen genau, wie man Möbel sicher bewegt.
                </p>

                <h3 class="highlight-title">Unser Helfer-Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Erfahrene, versicherte Umzugsprofis</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fachgerechtes Beladen des LKW zur optimalen
                            Raumnutzung</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Tragehilfe für schwere Einzelstücke (Klavier,
                            Tresor etc.)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Unterstützung bei Montagearbeiten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Flexible stundenweise Buchung möglich</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Hilfe benötigt?</h3>
                    <p>
                        Sagen Sie uns, wann und wie viele Helfer Sie brauchen.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Umzugshelfer anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Umzugshelfer aufnehmen"
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
    /* Styles consistent with other pages */
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
        background-color: #eff6ff;
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
