<script lang="ts">
    import { BookMarked, CheckCircle, ArrowLeft, ShieldCheck, AlertTriangle, FileText } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Archiv-Montage & Demontage" }
    ]);

    const serviceSchema = {
        "@type": "Service",
        serviceType: "Archiv-Montage und Demontage",
        name: "Archiv-Montage & Demontage Hildesheim",
        description:
            "Fachgerechte Montage, Demontage und Verlagerung von Archivregalen – Standregale, Fachregale und mobile Rollregalsysteme. DGUV-konform, mit befähigtem Personal und vollständiger Abnahmedokumentation.",
        provider: { "@id": "https://www.aust-umzuege.de/#organization" },
        areaServed: [
            { "@type": "City", name: "Hildesheim" },
            { "@type": "AdministrativeArea", name: "Niedersachsen" }
        ],
        url: "https://www.aust-umzuege.de/leistungen/archiv-montage",
        offers: { "@type": "Offer", priceCurrency: "EUR" }
    };

    const faqs = [
        {
            question: "Wer darf Archivregale montieren oder demontieren?",
            answer: "Laut DGUV Information 208-043 muss jede Regalmontage durch eine befähigte Person ausgeführt und abgenommen werden. Das bedeutet: nachgewiesene Fachkenntnisse durch Ausbildung, Berufserfahrung und aktuelle Tätigkeit im Bereich Regalmontage. Hilfskräfte ohne diese Qualifikation dürfen Archivregale weder montieren noch demontieren. Unser Team erfüllt diese Anforderungen."
        },
        {
            question: "Was passiert, wenn die Bodenplatte nicht tragfähig genug ist?",
            answer: "Archivregale erzeugen Bodenbelastungen von 7,5 bis 15 kN/m² – je nach System. Ist der Untergrund nicht geeignet (falscher Beton, Asphalt, zu dünn, nicht bewehrt), können wir nicht einfach montieren. Wir prüfen vor der Montage Bodenqualität und Statik und empfehlen bei Bedarf eine statische Begutachtung. Damit vermeiden wir unerwartete Mehrkosten und Einsturzrisiken."
        },
        {
            question: "Muss das Archiv während der Umbauarbeiten geschlossen bleiben?",
            answer: "Nicht zwingend. Wir arbeiten wo möglich im Parallel-Verfahren: Demontage am alten Standort und Aufbau am neuen laufen gleichzeitig. So bleibt Ihr Betrieb so lange wie möglich verfügbar. Ist ein kompletter Betriebsstillstand unvermeidlich, planen wir diesen gemeinsam so kurz wie möglich – auf Wunsch auch am Wochenende."
        },
        {
            question: "Wie schützen Sie das Archivgut während der Montagearbeiten?",
            answer: "Archivgut reagiert empfindlich auf Erschütterungen, Temperaturschwankungen, Staub und Feuchtigkeit. Wir arbeiten mit staubdichten Abdeckungen, vermeiden unnötige Erschütterungen und koordinieren die Klimabedingungen im Magazin. Alle Regalkomponenten werden vor dem Transport sorgfältig verpackt und gekennzeichnet – keine verlorenen Teile, keine Nachbestellungen."
        },
        {
            question: "Was bedeutet die DGUV-Abnahme nach der Montage?",
            answer: "Nach DGUV Information 208-043 muss jedes Regal nach Montage durch eine befähigte Person geprüft und protokolliert abgenommen werden, bevor es in Betrieb genommen wird. Wir führen diese Erstprüfung durch und übergeben Ihnen die vollständige Dokumentation – mit Angabe der prüfenden Person, Datum und Ergebnis. Diese Unterlagen müssen Sie gemäß §14 BetrSichV über die gesamte Betriebsdauer aufbewahren."
        },
        {
            question: "Können Sie auch mobile Rollregalsysteme demontieren und wieder aufbauen?",
            answer: "Ja. Rollregale stellen die höchsten Anforderungen: besonders hohe Bodenlasten, präzise auszurichtende Führungsschienen und Antrieb sowie Sicherheitsabschaltungen, die nach der Demontage neu justiert werden müssen. Wir haben Erfahrung mit verschiedenen Rollregalsystemen und führen nach dem Wiederaufbau eine vollständige Funktions- und Sicherheitsprüfung durch."
        },
        {
            question: "Bleibt die Regalgarantie nach einer Demontage und Wiedermontage erhalten?",
            answer: "Das hängt vom Hersteller ab. Grundsätzlich muss eine Wiedermontage die Tragfähigkeit des Neuzustands wiederherstellen – das ist in der Regel durch Berechnung oder Versuch nachzuweisen. Wir montieren nach Herstellervorgaben und dokumentieren die Arbeiten vollständig, was Ihnen gegenüber Versicherung und Hersteller die beste Ausgangslage verschafft."
        },
        {
            question: "Was kostet die Montage oder Demontage von Archivregalen?",
            answer: "Die Kosten richten sich nach Regaltyp (Standregale, Fachregale, Rollregale), Anzahl der Felder, Zustand des Bodenuntergrunds und Zugänglichkeit. Aufwände für Statikprüfung, Bodenvorbereitung oder besondere Höhenarbeit werden separat ausgewiesen. Wir besichtigen vor Ort und erstellen ein vollständiges Festpreisangebot – ohne versteckte Nachträge."
        }
    ];

    const risks = [
        {
            label: "Statik & Boden",
            text: "Archivregale erzeugen 7,5–15 kN/m² Bodenbelastung. Nicht jeder Untergrund trägt das. Wir prüfen Bodenqualität und Tragfähigkeit, bevor ein einziges Bauteil montiert wird."
        },
        {
            label: "Einsturzgefahr",
            text: "Schiefstellung über 0,5%, fehlende Verbände oder falsche Lastverteilung können die Tragfähigkeit um bis zu 30% reduzieren und im Extremfall zum Einsturz führen."
        },
        {
            label: "Archivgut",
            text: "Das Bundesarchiv stuft Bauarbeiten in Magazinen als Hochrisikosituationen ein. Erschütterungen, Klimaschwankungen und Staub können Kulturgut irreversibel schädigen."
        },
        {
            label: "Rechtliche Pflichten",
            text: "§14 BetrSichV schreibt Prüfdokumentation über die gesamte Lebensdauer vor. Fehlt die DGUV-Abnahme, erlischt möglicherweise der Versicherungsschutz."
        }
    ];
</script>

<MetaTags
    title="Archiv-Montage & Demontage Hildesheim – DGUV-konform | Aust Umzüge"
    description="Fachgerechte Montage und Demontage von Archivregalen: Standregale, Fachregale, mobile Rollregale. DGUV 208-043, befähigtes Personal, Abnahmeprotokoll. Hildesheim & Region."
    keywords="Archiv Montage, Archiv Demontage, Archivregale montieren, Rollregale Montage, DGUV 208-043, Regalmontage Hildesheim"
    canonical="https://www.aust-umzuege.de/leistungen/archiv-montage"
/>

<StructuredData schema={serviceSchema} />
<StructuredData schema={businessInfoSlim} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
    <div class="service-detail__container">
        <a href="/leistungen" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <header class="service-header">
            <div class="icon-wrapper">
                <BookMarked size={48} strokeWidth={1.5} />
            </div>
            <h1 class="service-title">Archiv-Montage & Demontage</h1>
            <p class="service-subtitle">
                Fachgerechter Aufbau, Abbau und Umzug von Archivregalsystemen – sicher, dokumentiert und DGUV-konform.
            </p>
        </header>

        <div class="service-content">
            <div class="text-column">

                <h2 class="section-title">Wenn das Regal mehr ist als ein Regal</h2>
                <p>
                    Archivregale sind keine Büromöbel. Sie tragen hunderte Kilogramm Kulturgut, stehen jahrzehntelang und müssen präzise verankert, ausgerichtet und belastet sein. Ein Fehler bei der Montage – eine schiefe Stütze, ein fehlender Verband, ein falscher Bodenanker – kann die Tragfähigkeit um bis zu 30 Prozent reduzieren. Im schlimmsten Fall endet das mit einem Einsturz.
                </p>
                <p>
                    Alexander Aust und sein Team führen Archiv-Montagen und -Demontagen regelmäßig durch. Wir kennen die Normen, arbeiten mit befähigtem Personal nach DGUV Information 208-043 und übergeben jede Anlage mit vollständigem Abnahmeprotokoll. Das schützt Ihr Archivgut, Ihre Mitarbeiter – und Sie rechtlich.
                </p>

                <!-- RISK ALERT BOX -->
                <div class="risk-box">
                    <div class="risk-box__header">
                        <AlertTriangle size={20} />
                        <span>Warum Archivmontage Facharbeit ist</span>
                    </div>
                    <div class="risk-grid">
                        {#each risks as risk}
                            <div class="risk-item">
                                <p class="risk-item__label">{risk.label}</p>
                                <p class="risk-item__text">{risk.text}</p>
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- SERVICES -->
                <h2 class="section-title">Was wir übernehmen</h2>

                <h3 class="sub-title">Montage von Archivregalsystemen</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Standregale, Fachregale und Hochregale aller gängigen Hersteller</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Mobile Rollregalsysteme inkl. Führungsschienen, Antrieb und Sicherheitsabschaltung</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Vor-Ort-Prüfung von Bodenqualität, Ebenheit (DIN 18202 Kl. 3) und Statik vor der Montage</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Lotrechte Ausrichtung aller Stützen (max. 0,5 % Toleranz), korrekte Verankerung und Verbände</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Montage nach Herstellervorgaben – Garantie und Produkthaftung bleiben erhalten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Erstprüfung und Abnahmeprotokoll durch befähigte Person (DGUV 208-043) vor Inbetriebnahme</span>
                    </li>
                </ul>

                <h3 class="sub-title">Demontage und Verlagerung</h3>
                <ul class="feature-list">
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Fachgerechter Abbau bestehender Anlagen – keine Provisorien, keine abgebrochenen Komponenten</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Systematische Kennzeichnung und Verpackung aller Bauteile</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Parallelbetrieb: Demontage am Altstandort und Aufbau am Neustandort gleichzeitig</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Schutz des Archivguts während der gesamten Umbauphase (Abdeckung, Klimaschutz, erschütterungsarmes Arbeiten)</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Austausch beschädigter Komponenten vor dem Wiederaufbau – keine provisorischen Schweißreparaturen</span>
                    </li>
                    <li>
                        <CheckCircle size={20} class="check-icon" />
                        <span>Funktions- und Sicherheitsprüfung nach Wiederaufbau mit vollständiger Dokumentation</span>
                    </li>
                </ul>

                <!-- COMPLIANCE BOX -->
                <div class="compliance-box">
                    <div class="compliance-box__header">
                        <ShieldCheck size={20} />
                        <span>Rechtliche Sicherheit für Betreiber</span>
                    </div>
                    <p>
                        Nach §14 BetrSichV müssen Regalbetreiber Prüfnachweise über die gesamte Betriebsdauer aufbewahren: Wer hat gepruft, wann, was wurde repariert oder geändert. Wir übergeben Ihnen nach jeder Montage ein vollständiges Protokoll – unterschrieben von der befähigten Person. Das ist keine Formalie. Es ist Ihre Absicherung gegenüber Versicherung, Gewerbeaufsicht und Haftpflicht.
                    </p>
                    <ul class="compliance-list">
                        <li>
                            <FileText size={16} />
                            <span>Abnahmeprotokoll gemäß DGUV 208-043</span>
                        </li>
                        <li>
                            <FileText size={16} />
                            <span>Prüfnachweis durch namentlich benannte befähigte Person</span>
                        </li>
                        <li>
                            <FileText size={16} />
                            <span>Dokumentation aller ausgetauschten oder geänderten Komponenten</span>
                        </li>
                        <li>
                            <FileText size={16} />
                            <span>Aufbewahrungsfähige Unterlagen für §14 BetrSichV</span>
                        </li>
                    </ul>
                </div>

                <h2 class="section-title">Für welche Archive und Einrichtungen?</h2>
                <p>
                    Wir arbeiten für Kommunal- und Stadtarchive, Behörden, Unternehmen mit eigenem Aktenarchiv, Bibliotheken und private Sammlungen. Gleichgültig ob Sie ein kleines Fachregalsystem umstellen oder ein komplettes Rollregalmagazin verlagern müssen: Wir besichtigen vorab, bewerten die technischen Gegebenheiten und erstellen Ihnen ein vollständiges Festpreisangebot.
                </p>
                <p>
                    Unerwartete Mehraufwände – etwa für Statikgutachten, Bodenausgleich oder den Austausch beschädigter Stützen – weisen wir nach der Besichtigung transparent aus. Kein Nachtrag, der Sie überrascht.
                </p>

                <div class="cta-inline">
                    <p>Sie planen eine Archivmontage oder müssen ein bestehendes System verlagern?</p>
                    <CTAButton href="/kostenloses-angebot" text="Besichtigung & Angebot anfragen" />
                </div>
            </div>
        </div>

        <FAQSection {faqs} title="Häufige Fragen zur Archiv-Montage" />

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

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #1a202c;
        text-decoration: none;
        margin-bottom: var(--space-8);
        font-size: var(--text-sm);
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--color-nav-accent);
    }

    /* Header */
    .service-header {
        text-align: center;
        margin-bottom: var(--space-10);
    }

    .icon-wrapper {
        display: inline-flex;
        padding: var(--space-4);
        background-color: #f0f9ff;
        color: var(--color-info-bar);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-4);
    }

    .service-title {
        font-size: clamp(2rem, 4vw, 3rem);
        color: var(--color-info-bar);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .service-subtitle {
        font-size: 1.2rem;
        color: #1a202c;
        max-width: 640px;
        margin-inline: auto;
        line-height: 1.6;
    }

    /* Content */
    .service-content {
        margin-bottom: var(--space-10);
    }

    .text-column p {
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.75;
        margin-bottom: var(--space-4);
    }

    .section-title {
        color: var(--color-info-bar);
        font-size: 1.5rem;
        font-weight: 700;
        margin: var(--space-10) 0 var(--space-5) 0;
        padding-bottom: var(--space-3);
        border-bottom: 2px solid var(--color-nav-accent);
    }

    .sub-title {
        color: var(--color-info-bar);
        font-size: 1.1rem;
        font-weight: 600;
        margin: var(--space-6) 0 var(--space-3) 0;
    }

    /* Feature list */
    .feature-list {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--space-6) 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .feature-list li {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        font-size: 1rem;
        color: #1a202c;
        line-height: 1.55;
    }

    .feature-list li :global(.check-icon) {
        color: var(--color-nav-accent);
        flex-shrink: 0;
        margin-top: 2px;
    }

    /* Risk box */
    .risk-box {
        background-color: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin: var(--space-8) 0;
    }

    .risk-box__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: #9a3412;
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: var(--space-5);
    }

    .risk-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
    }

    .risk-item {
        background-color: #fff;
        border: 1px solid #fed7aa;
        border-radius: var(--radius-md);
        padding: var(--space-4);
    }

    .risk-item__label {
        font-weight: 700;
        font-size: var(--text-sm);
        color: #9a3412;
        margin: 0 0 var(--space-2) 0;
    }

    .risk-item__text {
        font-size: var(--text-sm);
        color: #1a202c;
        line-height: 1.6;
        margin: 0;
    }

    /* Compliance box */
    .compliance-box {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin: var(--space-8) 0;
    }

    .compliance-box__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-info-bar);
        font-weight: 700;
        font-size: 1rem;
        margin-bottom: var(--space-4);
    }

    .compliance-box p {
        color: #1a202c;
        font-size: var(--text-sm);
        line-height: 1.7;
        margin-bottom: var(--space-4);
    }

    .compliance-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .compliance-list li {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--color-info-bar);
        font-weight: 500;
    }

    /* CTA inline */
    .cta-inline {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-top: var(--space-10);
        text-align: center;
    }

    .cta-inline p {
        color: #1a202c;
        font-size: 1.0625rem;
        font-weight: 500;
        margin-bottom: var(--space-4);
    }

    /* Responsive */
    @media (max-width: 640px) {
        .risk-grid {
            grid-template-columns: 1fr;
        }

        .service-title {
            font-size: 1.75rem;
        }
    }
</style>
