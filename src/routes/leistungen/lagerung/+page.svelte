<script lang="ts">
    import { Warehouse, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { services, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Lagerung & Einlagerung" }
    ]);

    const faqs = [
        {
            question: "Was kostet die Einlagerung von Möbeln pro Monat?",
            answer: "Die Kosten richten sich nach dem benötigten Platz. Als Richtwert: Ein 2-Zimmer-Haushalt (ca. 15-20 Kubikmeter) kostet bei uns etwa 150-250 Euro pro Monat. Einzelne Möbelstücke oder Kartons lagern wir ab ca. 50 Euro monatlich ein. Nach einer Besichtigung oder Fotobewertung nennen wir Ihnen den genauen Preis."
        },
        {
            question: "Wie sicher ist mein eingelagertes Umzugsgut?",
            answer: "Unsere Lagerräume sind trocken, belüftet und gegen Feuchtigkeit geschützt. Ihr Lagergut ist über unsere Versicherung abgedeckt. Anders als bei Selfstorage lagern wir Ihre Möbel auf Paletten oder in Regalen – professionell geschützt und inventarisiert. Auf Wunsch ist eine Zusatzversicherung für Wertsachen möglich."
        },
        {
            question: "Gibt es eine Mindestmietdauer?",
            answer: "Nein, wir bieten flexible Laufzeiten ohne lange Vertragsbindung. Sie können monatlich kündigen. Ob Sie nur 2 Wochen während einer Renovierung oder 2 Jahre während eines Auslandsaufenthalts einlagern möchten – wir passen uns Ihrem Bedarf an. Ab 6 Monaten Laufzeit gewähren wir Rabatte."
        },
        {
            question: "Was ist der Unterschied zwischen Ihrem Lagerservice und Selfstorage?",
            answer: "Bei Selfstorage mieten Sie einen leeren Raum und müssen Transport, Verpackung und Einlagerung selbst organisieren. Bei uns erhalten Sie alles aus einer Hand: Wir holen Ihre Möbel ab, verpacken sie fachgerecht, lagern sie sicher ein und liefern sie später direkt an die neue Adresse. Das spart Ihnen Zeit und schützt Ihre Möbel besser."
        },
        {
            question: "Kann ich jederzeit auf mein Lagergut zugreifen?",
            answer: "Ja, nach Terminabsprache können Sie Ihr Lagergut jederzeit einsehen, Teile entnehmen oder ergänzen. Wir bitten um 24 Stunden Voranmeldung, damit wir den Zugang für Sie vorbereiten können."
        },
        {
            question: "Für welche Situationen ist Einlagerung sinnvoll?",
            answer: "Typische Situationen sind: Zwischenlagerung bei Umzug (neue Wohnung noch nicht fertig), Renovierung, beruflicher Auslandsaufenthalt, Trennung/Scheidung, Erbschaft oder einfach Platzmangel. Wir beraten Sie zur optimalen Lösung – oft ist eine Kombination aus Umzug und Einlagerung am günstigsten."
        },
        {
            question: "Liefern Sie das Lagergut später an eine neue Adresse?",
            answer: "Ja. Wir holen Ihre Sachen ab, lagern sie sicher ein und liefern sie später direkt an die neue Adresse – auch bundesweit. So sparen Sie sich doppelte Fahrten und das Organisieren eines separaten Transports. Alles aus einer Hand."
        }
    ];
</script>

<MetaTags
    title="Lagerung & Einlagerung | Aust Umzüge Hildesheim"
    description="Sichere Möbellagerung in Hildesheim. Zwischenlagerung beim Umzug, Langzeitlagerung, flexible Laufzeiten. Abholung und Lieferung möglich."
    keywords="Möbellagerung Hildesheim, Einlagerung, Zwischenlagerung, Lagerhalle, Langzeitlagerung"
    canonical="https://www.aust-umzuege.de/leistungen/lagerung"
/>

<StructuredData schema={services.lagerung} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <Warehouse size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Lagerung & Einlagerung</h1>
            <p class="service-subtitle">
                Sicher verwahrt – ob für Wochen oder Jahre.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">
                <h2 class="section-title">Flexible Lagerung für jeden Bedarf</h2>
                <p>
                    Manchmal passt nicht alles auf einmal: Die neue Wohnung ist
                    noch nicht bezugsfertig, Sie renovieren oder brauchen
                    einfach mehr Platz. Unsere Lagerräume bieten Ihnen die
                    Lösung – sicher, trocken und jederzeit zugänglich.
                </p>
                <p>
                    Ob Zwischenlagerung für wenige Wochen oder Langzeitlagerung
                    über Monate und Jahre: Wir bewahren Ihre Möbel und
                    persönlichen Gegenstände sorgfältig auf. Auf Wunsch holen
                    wir Ihr Lagergut ab und liefern es später direkt an die neue
                    Adresse.
                </p>

                <h3 class="highlight-title">Unser Lagerservice:</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Sichere, trockene Lagerräume</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Flexible Laufzeiten ohne lange Bindung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Abholung und Lieferung auf Wunsch</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Faire, transparente Konditionen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Ideal bei Umzug, Renovierung oder Auslandsaufenthalt</span>
                    </li>
                </ul>

                <h2 class="section-title">So funktioniert unsere Möbellagerung</h2>
                <p>
                    Lagerung ist mehr als nur ein leerer Raum. Bei uns erhalten Sie einen professionellen Service, der Ihre Möbel schützt und Ihnen volle Flexibilität bietet.
                </p>
                <p>
                    <strong>1. Beratung und Volumenberechnung:</strong> Wie viel Platz brauchen Sie? Wir besichtigen Ihr Lagergut oder schätzen anhand von Fotos den benötigten Raum. So zahlen Sie nur für den Platz, den Sie wirklich nutzen.
                </p>
                <p>
                    <strong>2. Abholung und Transport:</strong> Wir holen Ihre Möbel direkt bei Ihnen ab, verpacken sie fachgerecht und transportieren sie in unser Lager. Sie müssen sich um nichts kümmern – kein Transporter mieten, kein Schleppen, kein Organisieren.
                </p>
                <p>
                    <strong>3. Professionelle Lagerung:</strong> Ihre Möbel werden in trockenen, belüfteten Räumen gelagert. Wir stapeln nicht einfach wild übereinander, sondern lagern strukturiert auf Paletten oder in Regalen. Das schützt vor Feuchtigkeit, Schädlingen und Beschädigungen.
                </p>
                <p>
                    <strong>4. Inventarliste und Versicherung:</strong> Sie erhalten eine detaillierte Liste aller eingelagerten Gegenstände. Ihr Lagergut ist über unsere Versicherung abgedeckt – Sie können ruhig schlafen.
                </p>
                <p>
                    <strong>5. Zugriff bei Bedarf:</strong> Sie möchten etwas aus dem Lager holen oder weitere Gegenstände einlagern? Kein Problem. Nach kurzer Terminabsprache (24 Stunden Vorlauf) bereiten wir den Zugang für Sie vor.
                </p>
                <p>
                    <strong>6. Auslieferung an neue Adresse:</strong> Wenn Sie Ihre Möbel wieder brauchen, liefern wir sie direkt an die neue Adresse – auch bundesweit. Auf Wunsch bauen wir sie dort wieder auf. Alles aus einer Hand.
                </p>

                <h2 class="section-title">Warum Lagerung bei Aust und nicht Selfstorage?</h2>
                <p>
                    Selfstorage-Anbieter vermieten Ihnen einen leeren Raum. Sie müssen selbst Transport, Verpackung und Einlagerung organisieren. Das klingt flexibel, ist in der Praxis aber oft umständlich und teuer.
                </p>
                <p>
                    Bei uns bekommen Sie ein Rundum-Paket: Wir holen ab, lagern fachgerecht ein und liefern später aus. Sie sparen sich die Miete eines Transporters, das Schleppen schwerer Möbel und das Tetris-Spiel im Lagerraum.
                </p>
                <p>
                    Außerdem lagern wir professioneller: Möbel stehen bei uns nicht einfach auf dem Boden, sondern auf Paletten oder in Regalen. Das schützt vor Bodenfeuchtigkeit und erleichtert den Zugriff. Empfindliche Stücke werden einzeln verpackt, schwere Gegenstände sicher abgestellt.
                </p>
                <p>
                    Und dann ist da noch die Versicherung: Bei Selfstorage müssen Sie sich selbst um den Versicherungsschutz kümmern. Bei uns ist Ihr Lagergut automatisch über unsere Betriebshaftpflicht abgedeckt. Auf Wunsch vermitteln wir auch eine Zusatzversicherung für besonders wertvolle Stücke.
                </p>

                <h3 class="highlight-title">Typische Situationen für Einlagerung</h3>
                <p>
                    Die häufigste Situation: Die neue Wohnung ist noch nicht fertig, aber die alte muss bereits geräumt werden. In diesem Fall lagern wir Ihre Möbel für wenige Wochen oder Monate zwischen – und liefern sie pünktlich zur Fertigstellung der neuen Wohnung.
                </p>
                <p>
                    Auch bei Renovierungen macht Einlagerung Sinn: Wenn Maler, Elektriker und Bodenleger arbeiten, stehen Möbel nur im Weg. Wir räumen alles aus, lagern es ein und bringen es nach Abschluss der Arbeiten zurück.
                </p>
                <p>
                    Beruflicher Auslandsaufenthalt? Viele unserer Kunden lagern ihre Möbel für 1-2 Jahre ein, während sie im Ausland arbeiten. So müssen sie nichts verkaufen und haben nach der Rückkehr alles wieder.
                </p>
                <p>
                    Trennung oder Scheidung: Wenn einer der Partner auszieht, aber noch keine endgültige Wohnung hat, ist Zwischenlagerung die praktische Lösung. Auch bei Erbschaften lagern Familien oft erst einmal ein, bis geklärt ist, wer was bekommt.
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Lagerung wird häufig mit einem <a href="/leistungen/privatumzug">Privatumzug</a> oder <a href="/leistungen/seniorenumzug">Seniorenumzug</a> kombiniert. Falls Sie eine komplette Wohnung auflösen, aber Teile davon einlagern möchten, ist unsere <a href="/leistungen/haushaltsaufloesung">Haushaltsauflösung</a> der richtige Ansprechpartner. Und wenn Sie Möbel später wieder aufbauen lassen möchten, steht unser <a href="/leistungen/montage">Montageservice</a> bereit.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Lagerplatz benötigt?</h3>
                    <p>
                        Wir beraten Sie gerne und erstellen ein individuelles
                        Angebot.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Angebot anfordern"
                            href="/kostenloses-angebot"
                            ariaLabel="Kostenloses Angebot für Lagerung anfordern"
                            showArrow={false}
                        />
                    </div>
                    <div class="divider">oder</div>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            href="/kontakt"
                            ariaLabel="Kontakt für Lagerung aufnehmen"
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
    .divider {
        margin: 0.75rem 0;
        color: #1a202c;
        font-size: 0.875rem;
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
</style>
