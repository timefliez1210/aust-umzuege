<script lang="ts">
    import { Users, CheckCircle, ArrowLeft } from "lucide-svelte";
    import CTAButton from "$lib/components/CTAButton.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import PriceCards from "$lib/components/PriceCards.svelte";
    import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Leistungen", url: "https://www.aust-umzuege.de/leistungen" },
        { name: "Umzugshelfer" }
    ]);

    const faqs = [
        {
            question: "Hafte ich, wenn sich ein privater Umzugshelfer bei mir verletzt?",
            answer: "Ja, das ist ein häufig unterschätztes Risiko. Hilft ein Freund oder Bekannter beim Umzug ohne Entgelt, gilt er rechtlich als sogenannter 'Gefälligkeitshelfer'. Verletzt er sich dabei ernsthaft, greift weder die gesetzliche Unfallversicherung noch Ihre Privathaftpflicht automatisch. Nach §823 BGB können Sie persönlich für Behandlungskosten und Verdienstausfall haftbar gemacht werden. Unsere Mitarbeiter sind über unsere Betriebshaftpflicht vollständig versichert – das Risiko liegt bei uns."
        },
        {
            question: "Was kosten Umzugshelfer pro Stunde in Hildesheim?",
            answer: "Unsere professionellen Umzugshelfer kosten 30–35 Euro pro Person und Stunde – je nach Teamgröße. Ab 7 Helfern gilt der günstigste Satz von 30 Euro pro Person. Hinzu kommt die An- und Abfahrtszeit. Private Helfer sind zwar günstiger (10–15 Euro), arbeiten aber ohne Haftpflichtversicherung und Erfahrung. Für ein konkretes Angebot rufen Sie uns einfach kurz an."
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
            question: "Gibt es Umzugshelfer in Hildesheim auch für kleine Budgets oder Studentenumzüge?",
            answer: "Ja, gerade dafür ist unser stundenweises Helfer-Modell gemacht. Sie buchen nur die Zeit und die Anzahl Helfer, die Sie wirklich brauchen – ab 2 Stunden, ab einem Helfer. Für Studenten, Auszubildende oder Single-Haushalte mit eigenem Sprinter liegt der typische Einsatz zwischen 200 € und 350 €. Wir nennen Ihnen vorab eine realistische Spanne, und Sie zahlen am Ende nur die tatsächlich geleisteten Stunden – nicht mehr."
        },
        {
            question: "Wie bleibt der Umzug mit Aust planbar – ohne Pauschalfallen?",
            answer: "Wir arbeiten ohne Pauschalen und ohne versteckte Kosten. Vor dem Termin besprechen wir Umfang, Anzahl der Helfer und voraussichtliche Dauer und nennen Ihnen eine konkrete Preisspanne. Abgerechnet wird stundengenau ab Abfahrt von unserem Standort bis zur Rückkehr. Wenn es schneller geht, zahlen Sie weniger. Falls vor Ort etwas dazukommt, sprechen wir das offen an, bevor die Uhr weiterläuft – damit Sie jederzeit die Kontrolle über Ihr Budget behalten."
        },
        {
            question: "Lohnt sich eine Umzugsfirma für eine kleine Wohnung oder als Single?",
            answer: "Ja, oft mehr als gedacht. Viele rechnen mit 200–500 € und erschrecken bei Online-Vergleichen über Pauschalen ab 1.000 €. Bei uns zahlen Sie nur die tatsächliche Zeit: Ein typischer Single-Umzug (1-Zimmer-Wohnung, eigener Transporter, 2 Helfer für 3 Stunden) liegt inklusive An- und Abfahrt bei rund 245 €. Profis arbeiten zudem etwa doppelt so schnell wie Laien – am Ende ist der Stundensatz höher, die Rechnung aber oft niedriger als gedacht."
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
    title="Umzugshelfer in Hildesheim – stundenweise & versichert | Aust Umzüge"
    description="Mit unseren Umzugshelfern gelingt Ihnen ein stressfreier Umzug – flexibel buchbar und passend zu jedem Budget. Profis ab 30 €/Std., Transporter ab 60 €/Tag."
    keywords="Umzugshelfer Hildesheim, Umzugskräfte mieten, Tragehilfe Umzug, stundenweise Helfer"
    canonical="https://www.aust-umzuege.de/leistungen/umzugshelfer"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.umzugshelfer} />
<StructuredData schema={breadcrumbs} />
<StructuredData schema={{
    "@type": "ImageObject",
    "contentUrl": "https://www.aust-umzuege.de/umzugshelfer-hildesheim-moebelpacker.webp",
    "url": "https://www.aust-umzuege.de/leistungen/umzugshelfer",
    "name": "Umzugshelfer Hildesheim – Aust Umzüge professionelle Umzugskräfte im Einsatz",
    "description": "Professionelle Umzugshelfer von Aust Umzüge Hildesheim beim Möbeltransport. Versicherte Umzugskräfte stundenweise mieten – zuverlässig und kurzfristig verfügbar.",
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
    "width": 903,
    "height": 609
}} />

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
            <h1 class="service-title">Umzugshelfer Hildesheim</h1>
            <p class="service-subtitle">
                Stressfreier Umzug für jedes Budget – stundengenau abgerechnet, ohne Überraschungen.
            </p>
        </header>

        <div class="hero-image">
            <img
                src="/umzugshelfer-hildesheim-moebelpacker.webp"
                srcset="/umzugshelfer-hildesheim-moebelpacker-400w.webp 400w,
                        /umzugshelfer-hildesheim-moebelpacker-600w.webp 600w,
                        /umzugshelfer-hildesheim-moebelpacker-800w.webp 800w,
                        /umzugshelfer-hildesheim-moebelpacker.webp 903w"
                sizes="(max-width: 600px) 100vw, (max-width: 900px) 90vw, 960px"
                alt="Umzugshelfer von Aust Umzüge Hildesheim – professionelle Umzugskräfte beim Möbeltransport"
                width="903"
                height="609"
                fetchpriority="high"
            />
        </div>

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

                <div class="hook-box">
                    <p class="hook-box__lead">Wichtig: Wer private Helfer beim Umzug verletzt, haftet persönlich.</p>
                    <p>
                        Hilft ein Freund beim Umzug und verletzt sich dabei, besteht in der Regel kein gesetzlicher Versicherungsschutz – weder über die Unfallversicherung noch über Ihre Privathaftpflicht. Als Organisator des Umzugs können Sie nach <strong>§823 BGB</strong> für Behandlungskosten, Verdienstausfall und im schlimmsten Fall Dauerrente haftbar gemacht werden. Unsere Mitarbeiter dagegen sind über unsere <strong>Betriebshaftpflicht</strong> vollständig abgesichert – das Risiko liegt bei uns, nicht bei Ihnen.
                    </p>
                </div>

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

                <h2 class="section-title" style="margin-top: var(--space-10);">Stressfreier Umzug für jedes Budget</h2>
                <p>
                    Ob kleine Studentenwohnung, Single-Umzug mit gemietetem Sprinter oder voller Familienhaushalt – bei uns sagen Sie, wie viel Sie selbst übernehmen wollen. Den Rest erledigen unsere Helfer. Sie buchen <strong>stundenweise und stundengenau</strong>: Wenn der Umzug schneller geht als geplant, zahlen Sie weniger. Keine Pauschalfallen, keine Mindestpauschale ab 1.000 €, kein Kleingedrucktes.
                </p>
                <p>
                    So bleibt Ihr Umzug in Hildesheim und Umgebung planbar – egal ob das Budget bei 250 € oder bei 2.500 € liegt. Wir nennen Ihnen vorab eine realistische Spanne und halten uns daran.
                </p>

                <PriceCards
                    service="umzugshelfer"
                    title="Komplettpakete – Helfer inkl. LKW"
                    intro="Sie brauchen Helfer und einen Transporter? Wählen Sie eines unserer fertigen Pakete – mit klarer Stundenstaffel und Pauschale für jede weitere Stunde. Ohne Kleingedrucktes."
                />

                <h2 class="section-title" style="margin-top: var(--space-10);">Nur Helfer buchen – ohne unseren LKW</h2>
                <p>Sie haben bereits einen Transporter gemietet oder einen Sprinter zur Verfügung? Dann buchen Sie nur die Helfer – stundenweise und stundengenau. Je mehr Helfer Sie buchen, desto günstiger wird der Stundensatz pro Person:</p>

                <div class="example-box">
                    <p class="example-box__lead">Rechenbeispiel: Kleiner Umzug mit eigenem Transporter</p>
                    <p>1-Zimmer-Wohnung, Sie haben einen Sprinter gemietet und brauchen 2 Helfer für ca. 3 Stunden. Anfahrt 15 Minuten, Rückfahrt 15 Minuten:</p>
                    <ul class="example-calc">
                        <li><span>2 Helfer × 3,5 Std. (inkl. An-/Abfahrt) × 35 €</span><strong>245 €</strong></li>
                    </ul>
                    <p class="example-box__note">Statt einer 1.000-€-Pauschale aus Online-Vergleichsportalen zahlen Sie nur die tatsächliche Zeit. Mehr Möbel oder mehr Stockwerke? Wir nennen Ihnen vorab eine realistische Spanne – ohne versteckte Kosten.</p>
                </div>

                <div class="price-table-wrapper">
                    <table class="price-table">
                        <thead>
                            <tr>
                                <th>Anzahl Helfer</th>
                                <th>Stundensatz / Person</th>
                                <th>Ersparnis</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1–2 Helfer</td>
                                <td class="price-cell">35,00 €</td>
                                <td class="savings-cell">–</td>
                            </tr>
                            <tr>
                                <td>3–4 Helfer</td>
                                <td class="price-cell">33,00 €</td>
                                <td class="savings-cell">– 2 € / Person</td>
                            </tr>
                            <tr>
                                <td>5–6 Helfer</td>
                                <td class="price-cell">31,00 €</td>
                                <td class="savings-cell">– 4 € / Person</td>
                            </tr>
                            <tr class="price-best">
                                <td>7+ Helfer</td>
                                <td class="price-cell">30,00 €</td>
                                <td class="savings-cell">– 5 € / Person</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="anfahrt-notice">
                    <div class="anfahrt-notice__icon">⏱</div>
                    <div>
                        <p class="anfahrt-notice__title">Wichtig: An- und Abfahrt wird berechnet</p>
                        <p>Die Arbeitszeit beginnt bei der Abfahrt von unserem Standort und endet bei der Rückkehr – nicht erst wenn unsere Helfer bei Ihnen anklingeln. <strong>Beispiel:</strong> Sie wohnen 15 Minuten von uns entfernt und benötigen Helfer für 3 Stunden? Die Gesamtzeit beträgt dann 3 Stunden + 30 Minuten An- und Abfahrt = <strong>3,5 Stunden pro Helfer</strong>. Wir nennen Ihnen die voraussichtliche Gesamtdauer vorab – keine bösen Überraschungen auf der Rechnung.</p>
                    </div>
                </div>

                <h2 class="section-title" style="margin-top: var(--space-10);">So arbeiten unsere Umzugshelfer</h2>
                <p>
                    Umzugshelfer buchen – das klingt simpel. Aber zwischen „irgendwelchen Helfern" und professionellen Umzugskräften liegen Welten. Unsere Mitarbeiter sind geschult, versichert und wissen genau, wie man Möbel sicher trägt, LKWs optimal belädt und Schäden vermeidet.
                </p>
                <p>
                    <strong>1. Planung und Zeitabsprache:</strong> Sie sagen uns, wann Sie Helfer brauchen und für welche Aufgaben. Nur zum Beladen? Nur zum Entladen? Oder für den gesamten Umzug? Wir schätzen gemeinsam, wie viele Helfer Sie benötigen und wie lange der Einsatz dauert.
                </p>
                <p>
                    <strong>2. Pünktlicher Start:</strong> Unsere Helfer kommen pünktlich zum vereinbarten Termin – mit Tragegurten, Sackkarren und Möbeldecken ausgestattet. Sie müssen nichts vorbereiten, keine Ausrüstung besorgen, nichts organisieren.
                </p>
                <p>
                    <strong>3. Fachgerechtes Beladen:</strong> Ein gut beladener LKW nutzt den Platz optimal und schützt die Möbel vor Transportschäden. Unsere Helfer wissen, wie man schwere Teile nach unten, leichte nach oben packt und alles mit Spanngurten sichert. Das verhindert Verrutschen und Kratzer.
                </p>
                <p>
                    <strong>4. Sicheres Tragen:</strong> Schwere Möbel die Treppe hinunter zu tragen, erfordert Technik und Erfahrung. Unsere Helfer arbeiten im Team, nutzen Tragegurte für Waschmaschinen und Kühlschränke und achten darauf, dass Treppenhaus und Türrahmen unbeschädigt bleiben.
                </p>
                <p>
                    <strong>5. Flexible Unterstützung:</strong> Wenn vor Ort spontan etwas dazukommt – ein Schrank muss doch noch auseinander gebaut werden, ein zusätzlicher Raum soll ausgeräumt werden – kein Problem. Unsere Helfer sind flexibel und packen mit an, wo es nötig ist.
                </p>
                <p>
                    <strong>6. Abrechnung nach tatsächlichem Aufwand:</strong> Sie zahlen nur die tatsächlich geleisteten Stunden. Wenn der Umzug schneller geht als geplant, sparen Sie Geld. Fair und transparent.
                </p>

                <h2 class="section-title">Privater Helfer oder Profi? Der ehrliche Vergleich</h2>
                <p>
                    Auf Kleinanzeigen finden Sie Helfer für 10–15 € pro Stunde. Bei uns kosten sie 30–35 €. Warum der Unterschied – und warum die Profi-Variante am Ende oft sogar günstiger ist:
                </p>

                <div class="compare-table-wrapper">
                    <table class="compare-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Privater Helfer<br><span class="compare-sub">(Kleinanzeigen, Freunde)</span></th>
                                <th class="compare-aust">Aust Umzugshelfer</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Stundensatz</td>
                                <td>10–15 €</td>
                                <td class="compare-aust">30–35 €</td>
                            </tr>
                            <tr>
                                <td>Tempo (1-Zi-Wohnung)</td>
                                <td>5–6 Std.</td>
                                <td class="compare-aust">3–4 Std.</td>
                            </tr>
                            <tr>
                                <td>Versicherung bei Schäden</td>
                                <td>keine</td>
                                <td class="compare-aust">Betriebshaftpflicht</td>
                            </tr>
                            <tr>
                                <td>Haftung bei Verletzung</td>
                                <td>Sie persönlich (§823 BGB)</td>
                                <td class="compare-aust">vollständig bei uns</td>
                            </tr>
                            <tr>
                                <td>Tragegurte, Decken, Sackkarre</td>
                                <td>selbst besorgen</td>
                                <td class="compare-aust">inklusive</td>
                            </tr>
                            <tr class="compare-total">
                                <td>Endpreis (2 Helfer, kleiner Umzug)</td>
                                <td>~150 € + Risiko</td>
                                <td class="compare-aust">~245 € versichert</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <p>
                    Der Aufpreis von rund 100 € ist im Grunde Ihre Versicherungsprämie: Geht ein Möbelstück oder eine Tür zu Bruch, ist das gedeckt. Verletzt sich jemand, haften nicht Sie. Und Sie sparen sich den ganzen Tag Schleppen – am Abend sind Sie fit für die erste Nacht in der neuen Wohnung statt völlig erledigt.
                </p>

                <h3 class="highlight-title">Was Kunden an unserem Service schätzen</h3>
                <p>
                    „Die Helfer waren super freundlich und haben mitgedacht", hören wir oft von unseren Kunden. „Als wir nicht wussten, wie wir das Sofa durch die enge Tür bekommen, hatten die Jungs sofort eine Lösung."
                </p>
                <p>
                    Genau das ist der Unterschied: Unsere Helfer sind nicht nur kräftig, sondern auch erfahren. Sie wissen, wie man ein Klavier sicher die Treppe herunterträgt, wie man eine Waschmaschine ohne Kratzer durch den Flur bugsiert und wie man zerbrechliche Gegenstände schützt.
                </p>
                <p>
                    Auch die Zuverlässigkeit wird immer wieder gelobt: „Die waren pünktlich auf die Minute – und haben durchgezogen, bis alles fertig war." Kein Verschleppen, kein Trödeln, kein „Ach, das schaffen wir morgen".
                </p>

                <h3 class="highlight-title">Verwandte Leistungen</h3>
                <p>
                    Sie überlegen, ob Umzugshelfer ausreichen oder ob Sie doch lieber einen <a href="/leistungen/privatumzug">Vollservice-Umzug</a> buchen sollten? Wir beraten Sie gerne. Falls schwere Möbel ab- oder aufgebaut werden müssen, bieten wir zusätzlich unseren <a href="/leistungen/montage">Montageservice</a> an. Und wenn Sie einen Parkplatz vor der Tür brauchen, organisieren wir eine <a href="/leistungen/halteverbot">Halteverbotszone</a> für Sie.
                </p>
            </div>

            <div class="cta-column">
                <div class="cta-box">
                    <h3>Hilfe benötigt?</h3>
                    <p>
                        Sagen Sie uns, wann und wie viele Helfer Sie brauchen.
                    </p>
                    <div class="cta-button-wrapper">
                        <CTAButton
                            text="Kontakt aufnehmen"
                            openFlow
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

    .hook-box {
        background-color: #eff6ff;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        padding: var(--space-4) var(--space-5);
        margin-block: var(--space-6);
    }

    .hook-box p {
        color: #1e3a5f;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: var(--space-2);
    }

    .hook-box p:last-child {
        margin-bottom: 0;
    }

    .hook-box__lead {
        font-weight: 700;
        font-size: 1.05rem !important;
        color: #1e3a5f !important;
    }

    /* Price Table */
    .price-table-wrapper {
        overflow-x: auto;
        margin-block: var(--space-6);
        border-radius: var(--radius-lg);
        border: 1px solid #e2e8f0;
    }

    .price-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 1rem;
    }

    .price-table thead {
        background-color: var(--color-info-bar);
        color: #fff;
    }

    .price-table th {
        padding: var(--space-3) var(--space-5);
        text-align: left;
        font-weight: 600;
        font-size: 0.9rem;
        letter-spacing: 0.02em;
    }

    .price-table td {
        padding: var(--space-3) var(--space-5);
        color: #1a202c;
        border-bottom: 1px solid #f1f5f9;
    }

    .price-table tbody tr:last-child td {
        border-bottom: none;
    }

    .price-table tbody tr:hover {
        background-color: #f8fafc;
    }

    .price-cell {
        font-weight: 700;
        color: var(--color-info-bar) !important;
        font-size: 1.05rem;
    }

    .savings-cell {
        color: #16a34a !important;
        font-weight: 600;
    }

    .price-best {
        background-color: #f0fdf4;
    }

    .price-best td {
        color: #166534 !important;
    }

    .price-best .price-cell {
        color: #166534 !important;
    }

    /* An- und Abfahrt notice */
    .anfahrt-notice {
        display: flex;
        gap: var(--space-4);
        align-items: flex-start;
        background-color: #fff7ed;
        border: 1px solid #fed7aa;
        border-left: 4px solid #ea580c;
        border-radius: var(--radius-md);
        padding: var(--space-4) var(--space-5);
        margin-block: var(--space-6);
    }

    .anfahrt-notice__icon {
        font-size: 1.5rem;
        flex-shrink: 0;
        line-height: 1;
        margin-top: 2px;
    }

    .anfahrt-notice__title {
        font-weight: 700;
        color: #9a3412 !important;
        margin-bottom: var(--space-2) !important;
        font-size: 1.05rem !important;
    }

    .anfahrt-notice p:not(.anfahrt-notice__title) {
        color: #7c2d12 !important;
        font-size: 0.975rem !important;
        margin-bottom: 0 !important;
    }

    /* Rechenbeispiel-Box */
    .example-box {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-left: 4px solid #16a34a;
        border-radius: var(--radius-md);
        padding: var(--space-5) var(--space-5);
        margin-block: var(--space-6);
    }
    .example-box p {
        color: #14532d !important;
        font-size: 1rem !important;
        line-height: 1.6;
        margin-bottom: var(--space-3) !important;
    }
    .example-box__lead {
        font-weight: 700;
        font-size: 1.05rem !important;
    }
    .example-box__note {
        font-size: 0.95rem !important;
        margin-bottom: 0 !important;
    }
    .example-calc {
        list-style: none;
        padding: 0;
        margin: var(--space-3) 0;
    }
    .example-calc li {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: var(--space-4);
        padding: var(--space-3) var(--space-4);
        background: #fff;
        border-radius: var(--radius-md);
        color: #14532d;
        font-size: 1rem;
    }
    .example-calc strong {
        font-size: 1.25rem;
        color: #166534;
        font-weight: 700;
        white-space: nowrap;
    }

    /* Vergleichstabelle privat vs. Aust */
    .compare-table-wrapper {
        overflow-x: auto;
        margin-block: var(--space-6);
        border-radius: var(--radius-lg);
        border: 1px solid #e2e8f0;
    }
    .compare-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.975rem;
    }
    .compare-table thead th {
        padding: var(--space-3) var(--space-4);
        text-align: left;
        font-weight: 600;
        background-color: #f8fafc;
        color: #1a202c;
        border-bottom: 2px solid #e2e8f0;
    }
    .compare-table th.compare-aust {
        background-color: var(--color-info-bar);
        color: #fff;
    }
    .compare-sub {
        font-weight: 400;
        font-size: 0.8rem;
        color: #64748b;
    }
    .compare-table td {
        padding: var(--space-3) var(--space-4);
        color: #4a5568;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
    }
    .compare-table td:first-child {
        font-weight: 600;
        color: #1a202c;
    }
    .compare-table td.compare-aust {
        background-color: #eff6ff;
        color: #1e3a5f;
        font-weight: 600;
    }
    .compare-table tbody tr:last-child td {
        border-bottom: none;
    }
    .compare-table tr.compare-total td {
        background-color: #f8fafc;
        font-weight: 700;
        color: #1a202c;
        border-top: 2px solid #e2e8f0;
    }
    .compare-table tr.compare-total td.compare-aust {
        background-color: #dbeafe;
        color: #1e3a5f;
    }
</style>
