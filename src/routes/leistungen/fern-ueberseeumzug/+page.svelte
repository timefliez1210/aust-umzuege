<script lang="ts">
    import { Globe, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Fern- & Überseeumzug" }
    ]);

    const faqs = [
        {
            question: "Was kostet ein internationaler Umzug?",
            answer: "Die Kosten variieren stark: Ein Umzug innerhalb Europas per LKW liegt bei 3.000-7.000 Euro, ein Überseeumzug per Seecontainer bei 5.000-13.000 Euro. Die Faktoren sind Zielland, Volumen und Transportart (LKW, See- oder Luftfracht). Eine Beiladung ist oft deutlich günstiger. Nach einer Besichtigung erstellen wir ein transparentes Angebot mit allen Kosten."
        },
        {
            question: "Wie lange dauert ein Umzug ins Ausland?",
            answer: "Innerhalb Europas per LKW: 3-7 Tage. Per Seefracht nach Übersee: 4-12 Wochen je nach Zielhafen. Luftfracht ist mit 1-2 Wochen deutlich schneller, aber teurer. Wir nennen Ihnen bei der Beratung die realistische Lieferzeit für Ihr Zielland, damit Sie den Einzug planen können."
        },
        {
            question: "Wer kümmert sich um Zoll und Einfuhrbestimmungen?",
            answer: "Wir koordinieren mit unseren Partneragenturen vor Ort und unterstützen Sie bei allen Dokumenten: Inventarlisten, Zollanmeldungen, Einfuhrgenehmigungen und länderspezifische Vorschriften. In vielen Fällen übernehmen wir die Verzollung komplett. Sie müssen sich um die Bürokratie nicht kümmern."
        },
        {
            question: "Brauche ich eine spezielle Transportversicherung für Übersee?",
            answer: "Ja, für See- und Luftfracht empfehlen wir eine Transportversicherung, die über die gesetzliche Haftung hinausgeht. Wir beraten Sie zu passenden Policen und vermitteln auf Wunsch direkt eine Versicherung, die Ihr Umzugsgut zum Neuwert absichert – für maximale Sicherheit auf langen Transportwegen."
        },
        {
            question: "Was ist eine Beiladung und wann lohnt sie sich?",
            answer: "Bei einer Beiladung wird Ihr Umzugsgut zusammen mit anderen Sendungen im Container transportiert. Das ist deutlich günstiger als ein eigener Container und ideal, wenn Sie nur wenige Kubikmeter versenden (z.B. einzelne Möbelstücke oder Kartons). Wir organisieren Beiladungen nach vielen Ländern weltweit."
        },
        {
            question: "Wie wird mein Umzugsgut für den Seetransport verpackt?",
            answer: "Für Überseetransporte verwenden wir seefeste Exportverpackungen: Spezialkartons, Luftpolsterfolie, Antikorrosionsschutz und containergerechte Ladungssicherung. Empfindliche Gegenstände wie Glas, Elektronik und Antiquitäten werden zusätzlich in maßgeschneiderten Holzkisten gesichert."
        },
        {
            question: "In welche Länder führen Sie Umzüge durch?",
            answer: "Wir organisieren Umzüge in alle Länder weltweit – von europäischen Nachbarländern wie Schweiz, Österreich und Niederlande bis zu Überseezielen wie USA, Kanada, Australien und den Nahen Osten. Durch unser internationales Partnernetzwerk sind wir an jedem Zielort vertreten. Nennen Sie uns Ihr Zielland und wir beraten Sie."
        }
    ];
</script>

<MetaTags
    title="Fern- & Überseeumzug | Aust Umzüge Hildesheim"
    description="Sicherer Umzug ins Ausland oder Übersee. Wir kümmern uns um Zollformalitäten, Verpackung und Logistik weltweit."
    keywords="Fernumzug, Überseeumzug, Auslandsumzug, internationaler Umzug, Umzug weltweit"
    canonical="https://www.aust-umzuege.de/leistungen/fern-ueberseeumzug"
/>

<StructuredData schema={services.fernUebersee} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Globe size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Fern- & Überseeumzug</h1>
            <p class="service-subtitle">
                Grenzenlos umziehen – sicher, pünktlich und gut organisiert.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Internationaler Umzugsservice</h2>
                <p>
                    Ein Umzug ins Ausland stellt besondere Anforderungen an
                    Logistik und Planung. Andere Gesetze, Zollbestimmungen und
                    lange Transportwege erfordern einen erfahrenen Partner.
                </p>
                <p>
                    Mit unserem weltweiten Partnernetzwerk bringen wir Ihr Hab
                    und Gut sicher an jeden Ort der Erde. Egal ob per LKW durch
                    Europa oder im Container nach Übersee: Wir kümmern uns um
                    die fachgerechte Exportverpackung und alle notwendigen
                    Formalitäten.
                </p>

                <h3 class="highlight-title">Unser Weltweit-Service:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Individuelle Beratung zu Ein- und
                            Ausfuhrbestimmungen</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Fachgerechte Exportverpackung (Luftpolster,
                            Spezialkartons)</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Koordination von See- und Luftfracht</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Erledigung aller Zollformalitäten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Verlade- und Entladeservice am Zielort</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Wohin soll es gehen?</h3>
                    <p>
                        Sprechen Sie mit uns über Ihr internationales Vorhaben.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Fern- und Überseeumzug anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Fern- und Überseeumzug aufnehmen"
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
    /* Same styles as previous pages to ensure consistency */
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
