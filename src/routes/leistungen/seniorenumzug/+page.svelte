<script lang="ts">
    import { HeartHandshake, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Seniorenumzug" }
    ]);

    const faqs = [
        {
            question: "Was kostet ein Seniorenumzug?",
            answer: "Die Kosten hängen vom Umfang ab: Reiner Transport, Verpackung, Montage und Einrichtungsservice lassen sich individuell kombinieren. Ein typischer Seniorenumzug in Hildesheim liegt zwischen 1.200 und 3.500 Euro. In vielen Fällen übernimmt die Pflegekasse bis zu 4.180 Euro – damit kann der Umzug für Sie sogar kostenfrei sein. Wir erstellen Ihnen ein detailliertes Festpreisangebot nach einer persönlichen Besichtigung."
        },
        {
            question: "Zahlt die Pflegekasse einen Zuschuss für den Seniorenumzug?",
            answer: "Ja. Bei einem anerkannten Pflegegrad (1-5) können Sie nach §40 SGB XI bis zu 4.180 Euro als Zuschuss für wohnumfeldverbessernde Maßnahmen erhalten. Das gilt beim Umzug in eine barrierefreie Wohnung, ins betreute Wohnen oder in ein Pflegeheim. Wir helfen Ihnen beim Antrag und erstellen die benötigten Kostenvoranschläge für die Pflegekasse."
        },
        {
            question: "Wie läuft ein Seniorenumzug bei Aust ab?",
            answer: "Wir beginnen mit einem persönlichen Gespräch bei Ihnen zu Hause. Gemeinsam entscheiden wir, was mitgenommen wird und was nicht. Am Umzugstag verpacken wir alles sorgfältig, transportieren es sicher und richten die neue Wohnung komplett ein – bis hin zu Bildern und Gardinen. Nicht benötigte Möbel entsorgen wir fachgerecht. So können Sie sich sofort wohlfühlen."
        },
        {
            question: "Können Sie auch die alte Wohnung auflösen?",
            answer: "Ja, wir bieten den kompletten Service aus einer Hand: Transport der gewünschten Möbel in die neue Wohnung, fachgerechte Entsorgung nicht benötigter Gegenstände und besenreine Übergabe der alten Wohnung. So ersparen Sie sich den Aufwand, mehrere Dienstleister zu koordinieren."
        },
        {
            question: "Wie gehen Sie mit persönlichen Erinnerungsstücken um?",
            answer: "Wir behandeln alle Gegenstände mit besonderer Sorgfalt und Respekt. Persönliche und wertvolle Stücke werden separat und besonders geschützt verpackt. Unser Team ist im einfühlsamen Umgang mit Senioren geschult und nimmt sich die Zeit, die Sie brauchen."
        },
        {
            question: "Können meine Angehörigen den Umzug für mich organisieren?",
            answer: "Selbstverständlich. In den meisten Fällen organisieren Kinder oder Enkel den Seniorenumzug. Wir stimmen alle Details mit Ihren Angehörigen ab, führen die Besichtigung gemeinsam durch und halten alle Beteiligten auf dem Laufenden. Sie müssen am Umzugstag nicht einmal anwesend sein, wenn Sie das wünschen."
        },
        {
            question: "Wie lange im Voraus sollte ich einen Seniorenumzug planen?",
            answer: "Wir empfehlen 4-6 Wochen Vorlauf für die gründliche Planung und Beantragung des Pflegekassenzuschusses. Bei einem Umzug ins Pflegeheim mit festem Einzugstermin passen wir uns Ihrem Zeitplan an. In dringenden Fällen sind auch kürzere Fristen möglich – sprechen Sie uns an."
        }
    ];
</script>

<MetaTags
    title="Seniorenumzug Hildesheim | Aust Umzüge"
    description="Einfühlsamer Seniorenumzug in Hildesheim und Umgebung. Wir helfen beim Umzug ins betreute Wohnen mit Full-Service, Montage und Entsorgung."
    keywords="Seniorenumzug Hildesheim, Umzug Senioren, betreutes Wohnen, Seniorenheim Umzug"
    canonical="https://www.aust-umzuege.de/leistungen/seniorenumzug"
/>

<StructuredData schema={services.seniorenumzug} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <HeartHandshake size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Seniorenumzug</h1>
            <p class="service-subtitle">
                Mit Herz und Verstand – Umzüge für die ältere Generation.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">
                    Einfühlsame Begleitung im neuen Lebensabschnitt
                </h2>
                <p>
                    Der Umzug vom langjährigen Zuhause in eine kleinere Wohnung
                    oder ein Seniorenheim ist oft ein großer und emotionaler
                    Schritt. Wir begleiten Sie oder Ihre Angehörigen dabei mit
                    viel Geduld, Respekt und tatkräftiger Unterstützung.
                </p>
                <p>
                    Unser Team nimmt sich Zeit für Ihre Wünsche. Wir helfen beim
                    Aussortieren, verpacken liebgewonnene Erinnerungsstücke
                    sicher und richten Ihr neues Zuhause so ein, dass Sie sich
                    von Anfang an wohlfühlen.
                </p>

                <h3 class="highlight-title">
                    Unser Sorglos-Paket für Senioren:
                </h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Persönliche Beratung vor Ort mit viel Zeit</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Kompletter Ein- und Auspackservice</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Abbau und passgenauer Aufbau der Möbel am neuen Ort</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span
                            >Entsorgung / Haushaltsauflösung der alten Wohnung</span
                        >
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Anschluss von Lampen und Elektrogeräten</span>
                    </li>
                </ul>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Wir beraten Sie gerne</h3>
                    <p>
                        Vereinbaren Sie einen kostenlosen Besichtigungstermin.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Seniorenumzug anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Seniorenumzug aufnehmen"
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
    /* Minimized styles for brevity, exact copy of previous */
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
        background-color: #fce7f3;
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
