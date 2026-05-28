<script lang="ts">
    import { HandCoins, ArrowLeft } from "lucide-svelte";
    import CTASection from "$lib/components/CTASection.svelte";
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import FAQSection from "$lib/components/FAQSection.svelte";
    import { createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "Ratgeber", url: "https://www.aust-umzuege.de/ratgeber" },
        { name: "Umzug mit Bürgergeld" }
    ]);

    const articleSchema = {
        "@type": "Article",
        headline: "Umzug mit Bürgergeld 2026 – Jobcenter, Zusicherung & Mietkaution erklärt",
        description:
            "Das Jobcenter übernimmt Umzugskosten, Mietkaution und Wohnungsbeschaffungskosten – aber nur mit vorheriger Zusicherung nach § 22 Abs. 6 SGB II. Alle Voraussetzungen, Fallstricke und der genaue Antragsweg.",
        author: {
            "@type": "Person",
            name: "Alexander Aust",
            url: "https://www.aust-umzuege.de/impressum"
        },
        publisher: {
            "@type": "Organization",
            "@id": "https://www.aust-umzuege.de/#organization",
            name: "Aust Umzüge und Haushaltsauflösungen",
            logo: {
                "@type": "ImageObject",
                url: "https://www.aust-umzuege.de/LogoName_transparent.webp"
            }
        },
        datePublished: "2026-05-04",
        dateModified: "2026-05-04",
        image: "https://www.aust-umzuege.de/umziehen-leicht-gemacht-hildesheim-hannover-braunschweig-600w.webp",
        url: "https://www.aust-umzuege.de/ratgeber/umzug-mit-buergergeld",
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": "https://www.aust-umzuege.de/ratgeber/umzug-mit-buergergeld"
        },
        articleSection: "Ratgeber"
    };

    const faqs = [
        {
            question: "Übernimmt das Jobcenter wirklich die kompletten Umzugskosten?",
            answer:
                "Ja – aber nur, wenn der Umzug notwendig ist und vor Vertragsabschluss eine schriftliche Zusicherung nach § 22 Abs. 6 Satz 1 SGB II vorliegt. Übernommen werden Umzugsunternehmen, Transportermiete inklusive Sprit, Verpackungsmaterial sowie Wohnungsbeschaffungskosten wie Maklerprovision oder Doppelmiete während der Übergangsphase. Ohne vorherige Zusicherung tragen Sie die Kosten selbst."
        },
        {
            question: "Bekomme ich die Mietkaution geschenkt oder muss ich sie zurückzahlen?",
            answer:
                "Die Mietkaution wird nach § 22 Abs. 6 Satz 2 SGB II in Verbindung mit § 42a SGB II grundsätzlich als zinsloses Darlehen gewährt – nicht als Zuschuss. Die Rückzahlung erfolgt durch monatliche Aufrechnung von bis zu 5 % des Regelbedarfs. Beim aktuellen Regelbedarf für Alleinstehende sind das rund 28 Euro im Monat. Genossenschaftsanteile werden auf demselben Weg behandelt."
        },
        {
            question: "Was passiert, wenn ich umziehe, ohne vorher die Zusicherung einzuholen?",
            answer:
                "Drei Konsequenzen, die zusammenwirken: Erstens werden die Umzugskosten selbst nicht erstattet. Zweitens wird die Mietkaution nicht als Darlehen gewährt. Drittens greift bei einem nicht erforderlichen Umzug § 22 Abs. 1 Satz 2 SGB II – das Jobcenter erkennt nur den bisherigen (niedrigeren) Bedarf für Unterkunft und Heizung an, selbst wenn die neue Wohnung innerhalb der Angemessenheitsgrenzen liegt. Die Differenz zahlen Sie unbefristet aus dem Regelbedarf."
        },
        {
            question: "Wie lange dauert die Bearbeitung des Zusicherungsantrags?",
            answer:
                "Eine gesetzliche Frist gibt es nicht. In der Praxis schwankt die Bearbeitung zwischen einer und mehreren Wochen, je nach Auslastung des Jobcenters und Vollständigkeit der Unterlagen. Planen Sie mindestens drei bis vier Wochen Puffer ein, bevor Sie einen Mietvertrag unterschreiben müssen. Mündliche Zusagen am Telefon sind rechtlich angreifbar – beharren Sie auf einem schriftlichen Bescheid."
        },
        {
            question: "Reicht ein längerer Arbeitsweg als Umzugsgrund?",
            answer:
                "Ein täglicher Pendelweg von mehr als 2,5 Stunden gilt nach gefestigter Rechtsprechung der Sozialgerichte als unzumutbar und begründet die Notwendigkeit eines Umzugs (vgl. u.a. LSG-Urteile zu § 22 SGB II). Wichtig: Diese 2,5-Stunden-Schwelle steht nicht im Gesetz, sondern ist ein von der Rechtsprechung entwickelter Richtwert. Auch deutlich kürzere Pendelzeiten können im Einzelfall ausreichen, wenn besondere Umstände hinzukommen – etwa Schichtdienst, fehlender ÖPNV oder gesundheitliche Einschränkungen."
        },
        {
            question: "Muss ich drei Wohnungsangebote vergleichen?",
            answer:
                "Eine gesetzliche Pflicht zu drei Vergleichsangeboten gibt es nicht. In der Praxis verlangen viele Jobcenter Kostenvoranschläge von zwei bis drei Umzugsunternehmen, um das wirtschaftlichste auszuwählen. Wenn Sie selbst mit Helfern umziehen, werden Mietwagenkosten, Sprit und eine Pauschale für Helferverpflegung übernommen. Klären Sie das genaue Anforderungsprofil vorab schriftlich mit Ihrem Sachbearbeiter."
        },
        {
            question: "Was zählt zu den Wohnungsbeschaffungskosten?",
            answer:
                "Wohnungsbeschaffungskosten nach § 22 Abs. 6 Satz 1 SGB II umfassen alle Kosten, die mit der Anmietung der neuen Wohnung in Zusammenhang stehen: Maklerprovision, doppelte Miete während der Übergangsphase, Schönheitsreparaturen in der alten Wohnung soweit vertraglich geschuldet, sowie Inserats- und Fahrtkosten zur Wohnungsbesichtigung. Die Übernahme setzt – wie bei Umzugskosten – eine vorherige Zusicherung voraus."
        },
        {
            question: "Kann das Jobcenter Mietschulden übernehmen, um Wohnungslosigkeit zu verhindern?",
            answer:
                "Ja, nach § 22 Abs. 8 SGB II können Schulden übernommen werden, soweit dies zur Sicherung der Unterkunft oder zur Behebung einer vergleichbaren Notlage gerechtfertigt ist. In der Praxis greift die Regelung vor allem bei drohender Räumungsklage oder Stromsperren. Die Übernahme erfolgt regelmäßig als Darlehen. Reagieren Sie sofort, sobald Sie eine Mahnung oder Kündigung erhalten – je früher der Antrag, desto höher die Bewilligungschance."
        }
    ];

    const angemessenheitsTabelle = [
        { stadt: "München", p1: "ca. 750–820 €", p2: "ca. 950–1.050 €", p3: "ca. 1.150–1.300 €" },
        { stadt: "Hamburg", p1: "ca. 540–620 €", p2: "ca. 670–760 €", p3: "ca. 810–920 €" },
        { stadt: "Berlin", p1: "ca. 460–520 €", p2: "ca. 580–660 €", p3: "ca. 730–830 €" },
        { stadt: "Köln", p1: "ca. 510–570 €", p2: "ca. 640–710 €", p3: "ca. 800–890 €" },
        { stadt: "Hannover", p1: "ca. 420–470 €", p2: "ca. 520–590 €", p3: "ca. 640–720 €" },
        { stadt: "Hildesheim", p1: "ca. 330–380 €", p2: "ca. 410–470 €", p3: "ca. 510–570 €" },
        { stadt: "Chemnitz", p1: "ca. 280–320 €", p2: "ca. 370–420 €", p3: "ca. 460–510 €" }
    ];
</script>

<MetaTags
    title="Umzug mit Bürgergeld 2026 – Jobcenter zahlt? § 22 SGB II erklärt"
    description="Jobcenter übernimmt Umzugskosten, Kaution & Wohnungsbeschaffungskosten nach § 22 SGB II – aber nur mit vorheriger Zusicherung. Voraussetzungen, Antrag & Fallstricke."
    keywords="Umzug Bürgergeld, Jobcenter Umzugskosten, Mietkaution Jobcenter, § 22 SGB II, Zusicherung Umzug, Wohnungsbeschaffungskosten, Bürgergeld Umzug 2026"
    canonical="https://www.aust-umzuege.de/ratgeber/umzug-mit-buergergeld"
    ogType="article"
/>

<StructuredData schema={articleSchema} />
<StructuredData schema={breadcrumbs} />

<main class="guide-detail">
    <div class="guide-detail__container">
        <a href="/ratgeber" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <article class="guide-article">
            <header class="guide-header">
                <div class="icon-wrapper">
                    <HandCoins size={48} strokeWidth={1.5} />
                </div>
                <h1>Umzug mit Bürgergeld 2026</h1>
                <p class="subtitle">Wie das Jobcenter Umzugskosten, Mietkaution und Wohnungsbeschaffungskosten übernimmt – und wie Sie die Zusicherung sicher bekommen</p>
                <p class="author-byline">Von Alexander Aust, Geschäftsführer bei Aust Umzüge · Stand: Mai 2026</p>
            </header>

            <div class="disclaimer disclaimer--top">
                <p>
                    <strong>Rechtlicher Hinweis:</strong> Dieser Ratgeber dient der allgemeinen Information und ersetzt keine Rechts- oder Sozialberatung. Das SGB II und die kommunalen Angemessenheitssatzungen unterliegen regelmäßigen Änderungen. Klären Sie Ihren konkreten Fall vor jedem Schritt mit Ihrem Jobcenter, einer Sozialberatung oder einer Anwältin / einem Anwalt für Sozialrecht.
                </p>
            </div>

            <div class="guide-intro">
                <p>
                    Wer Bürgergeld bezieht und umziehen muss, steht vor einer entscheidenden Frage: Zahlt das Jobcenter den Umzug – und wenn ja, unter welchen Bedingungen? Die Antwort steckt in einem einzigen Paragrafen: § 22 SGB II. Er regelt nicht nur, dass Umzugskosten übernommen werden können, sondern auch <em>wann</em>, <em>von welchem Träger</em> und in welcher Form (Zuschuss oder Darlehen).
                </p>
                <p>
                    Der häufigste – und teuerste – Fehler ist, den Mietvertrag zu unterschreiben, bevor das Jobcenter eine Zusicherung erteilt hat. Wer das tut, bleibt auf den Kosten sitzen und zahlt im schlimmsten Fall jahrelang die Mietdifferenz aus dem Regelbedarf. Dieser Ratgeber zeigt den exakten Ablauf, die rechtlichen Grundlagen mit Originalzitaten aus dem SGB II und die Stellschrauben, an denen Sie ansetzen können.
                </p>
            </div>

            <div class="tldr-box">
                <p class="tldr-label">Kurzfassung</p>
                <p>
                    Das Jobcenter übernimmt Umzugskosten und Wohnungsbeschaffungskosten als <strong>Zuschuss</strong>, die Mietkaution und Genossenschaftsanteile als <strong>zinsloses Darlehen</strong>. Voraussetzung ist immer eine <strong>vorherige schriftliche Zusicherung</strong> nach § 22 Abs. 6 SGB II – eingeholt <em>bevor</em> Sie den Mietvertrag unterschreiben. Die Notwendigkeit des Umzugs muss belegt sein (Aufforderung zur Kostensenkung, Arbeitsaufnahme, gesundheitliche Gründe, drohende Wohnungslosigkeit). Wer ohne Zusicherung umzieht, riskiert dauerhaft eine Deckelung der anerkannten Miete auf das alte Niveau (§ 22 Abs. 1 Satz 2 SGB II).
                </p>
            </div>

            <!-- OVERVIEW CARDS -->
            <div class="two-paths">
                <div class="path-card path-card--blue">
                    <p class="path-badge">Zuschuss</p>
                    <h2 class="path-title">Umzugs- &amp; Wohnungsbeschaffungskosten</h2>
                    <p class="path-subtitle">§ 22 Abs. 6 Satz 1 SGB II</p>
                    <ul class="path-list">
                        <li>Umzugsunternehmen oder Mietwagen + Helfer</li>
                        <li>Verpackungsmaterial, Sprit, Helferverpflegung</li>
                        <li>Maklerprovision, Doppelmiete, Schönheitsreparaturen</li>
                        <li>Zusicherung durch <em>bisherigen</em> kommunalen Träger</li>
                        <li>Wird als Zuschuss erbracht – keine Rückzahlung</li>
                    </ul>
                </div>
                <div class="path-card path-card--orange">
                    <p class="path-badge">Darlehen</p>
                    <h2 class="path-title">Mietkaution &amp; Genossenschaftsanteile</h2>
                    <p class="path-subtitle">§ 22 Abs. 6 Satz 2 i.V.m. § 42a SGB II</p>
                    <ul class="path-list">
                        <li>Zinsloses Darlehen, kein Zuschuss</li>
                        <li>Zusicherung durch Träger am <em>neuen</em> Wohnort</li>
                        <li>Tilgung durch Aufrechnung mit dem Regelbedarf</li>
                        <li>Bis zu 5 % des Regelbedarfs monatlich</li>
                        <li>Rest wird bei Auszug verrechnet</li>
                    </ul>
                </div>
            </div>

            <div class="guide-content">

                <!-- ===== GESETZ ===== -->
                <section class="content-section">
                    <h2>Was § 22 SGB II wirklich sagt</h2>

                    <p>
                        Der zentrale Paragraf für jeden Umzug unter Bürgergeld ist § 22 SGB II („Bedarfe für Unterkunft und Heizung"). Drei Absätze sind entscheidend – und werden in vielen Online-Ratgebern vermischt oder falsch zitiert. Hier die Originalformulierungen:
                    </p>

                    <h3>§ 22 Abs. 6 SGB II – Zusicherung</h3>
                    <ul class="content-list">
                        <li>
                            <strong>Satz 1:</strong> „Wohnungsbeschaffungskosten und Umzugskosten können bei vorheriger Zusicherung durch den bis zum Umzug örtlich zuständigen kommunalen Träger als Bedarf anerkannt werden."
                        </li>
                        <li>
                            <strong>Satz 2:</strong> „Aufwendungen für eine Mietkaution und für den Erwerb von Genossenschaftsanteilen können bei vorheriger Zusicherung durch den am Ort der neuen Unterkunft zuständigen kommunalen Träger als Bedarf anerkannt werden."
                        </li>
                        <li>
                            <strong>Satz 3:</strong> „Die Zusicherung soll erteilt werden, wenn der Umzug durch den kommunalen Träger veranlasst oder aus anderen Gründen notwendig ist und wenn ohne die Zusicherung eine Unterkunft in einem angemessenen Zeitraum nicht gefunden werden kann."
                        </li>
                    </ul>

                    <p>
                        Zwei Punkte werden oft missverstanden: Erstens ist <em>Satz 3</em> die Soll-Vorschrift – nicht Satz 2. Zweitens unterscheidet das Gesetz präzise zwischen dem <strong>bisherigen</strong> Träger (Umzugskosten, Satz 1) und dem Träger am <strong>neuen</strong> Wohnort (Mietkaution, Satz 2). Bei einem Umzug zwischen zwei Jobcenter-Bezirken müssen also zwei Anträge bei zwei Trägern gestellt werden.
                    </p>

                    <p>
                        Die Soll-Vorschrift in Satz 3 ist verwaltungsrechtlich stark: Liegen Notwendigkeit und Zusicherungsbedürftigkeit vor, hat das Jobcenter praktisch kein Ermessen mehr – es <em>muss</em> zusichern, sofern keine atypischen Umstände vorliegen.
                    </p>

                    <h3>§ 42a SGB II – Darlehen</h3>
                    <p>
                        Die Form, in der die Mietkaution erbracht wird, regelt nicht § 22 selbst, sondern § 42a SGB II („Darlehen"). Demnach werden Mietkautionen und Genossenschaftsanteile als <strong>zinsloses Darlehen</strong> erbracht und durch monatliche Aufrechnung mit dem Regelbedarf in Höhe von <strong>bis zu 5 %</strong> getilgt (§ 42a Abs. 2 SGB II). Bei aktuellem Regelbedarf für Alleinstehende sind das rund 28 € pro Monat. Der nicht getilgte Rest wird beim Auszug aus der neuen Wohnung verrechnet.
                    </p>

                    <h3>§ 22 Abs. 1 Satz 2 SGB II – die Kostenfalle</h3>
                    <p>
                        Wer ohne Notwendigkeit umzieht, erlebt häufig eine böse Überraschung. § 22 Abs. 1 Satz 2 SGB II legt fest:
                    </p>
                    <blockquote class="quote-block">
                        „Erhöhen sich nach einem nicht erforderlichen Umzug die Aufwendungen für Unterkunft und Heizung, wird nur der bisherige Bedarf anerkannt."
                    </blockquote>
                    <p>
                        Das bedeutet: Selbst wenn die neue Wohnung innerhalb der Angemessenheitsgrenzen Ihres neuen Wohnorts liegt, deckelt das Jobcenter die übernommene Miete dauerhaft auf den alten Betrag. Ziehen Sie ohne anerkannten Grund von 500 € warm in 650 € warm, zahlen Sie die 150 € Differenz Monat für Monat aus dem Regelbedarf – ohne zeitliche Befristung, solange Sie in der neuen Wohnung leben.
                    </p>

                    <h3>§ 22 Abs. 8 SGB II – Mietschulden bei drohender Wohnungslosigkeit</h3>
                    <p>
                        Bei Räumungsklage, Stromsperren oder vergleichbarer Notlage greift Absatz 8: „Sofern Bürgergeld für den Bedarf für Unterkunft und Heizung erbracht wird, können auch Schulden übernommen werden, soweit dies zur Sicherung der Unterkunft oder zur Behebung einer vergleichbaren Notlage gerechtfertigt ist." Die Übernahme erfolgt regelmäßig als Darlehen und ist nur sinnvoll, wenn die Wohnung mittelfristig auch tatsächlich gehalten werden kann.
                    </p>

                    <div class="insight-box">
                        <p class="insight-label">Praxiserfahrung</p>
                        <p>
                            Aus unserer Zusammenarbeit mit Jobcentern in Niedersachsen und Sachsen-Anhalt: Bearbeitungszeiten von Zusicherungsanträgen schwanken zwischen einer Woche und über einem Monat. Mündliche Zusagen am Telefon sind rechtlich nicht belastbar – wir empfehlen ausnahmslos den schriftlichen Bescheid abzuwarten, bevor Mietverträge unterschrieben werden.
                        </p>
                    </div>
                </section>

                <!-- ===== NOTWENDIGKEIT ===== -->
                <section class="content-section">
                    <h2>Wann ist ein Umzug „notwendig" – und wann nicht?</h2>

                    <p>
                        Die Notwendigkeit ist das Nadelöhr der gesamten Kostenübernahme. Die Sozialgerichte haben hierzu ein dichtes Fallrecht entwickelt. Grob lassen sich anerkannte und nicht anerkannte Gründe wie folgt einordnen:
                    </p>

                    <div class="cost-grid">
                        <div class="cost-card cost-card--yes">
                            <h3>Regelmäßig anerkannte Gründe</h3>
                            <ul>
                                <li>Aufforderung zur Kostensenkung wegen unangemessener Miete (§ 22 Abs. 1)</li>
                                <li>Arbeitsaufnahme an einem entfernten Ort</li>
                                <li>Pendelweg von mehr als 2,5 Stunden täglich (Rechtsprechung)</li>
                                <li>Ärztlich attestierte gesundheitliche Gründe (z.&nbsp;B. Treppensteigen, Schimmel)</li>
                                <li>Geburt eines Kindes oder Familienzusammenführung</li>
                                <li>Drohende Wohnungslosigkeit, Räumungsklage</li>
                                <li>Häusliche Gewalt mit Anzeige oder Frauenhaus-Aufenthalt</li>
                                <li>Trennung / Scheidung mit Auszug aus gemeinsamer Wohnung</li>
                            </ul>
                        </div>
                        <div class="cost-card cost-card--no">
                            <h3>Regelmäßig <em>nicht</em> anerkannt</h3>
                            <ul>
                                <li>Wunsch nach besserer Wohnlage</li>
                                <li>Wohnung „zu klein" innerhalb der Angemessenheitsgrenzen</li>
                                <li>Lärmbelästigung ohne behördliche Dokumentation</li>
                                <li>Näher zum Partner ziehen ohne Bedarfsgemeinschaftsbildung</li>
                                <li>Streit mit Vermieter oder Nachbarn ohne Eskalation</li>
                                <li>Reine Modernisierungsgründe an der bisherigen Wohnung</li>
                            </ul>
                        </div>
                    </div>

                    <h3>Sonderfall Pendelzeit</h3>
                    <p>
                        Die Sozialgerichte erkennen einen täglichen Pendelweg von mehr als 2,5 Stunden grundsätzlich als unzumutbar an. Diese Schwelle steht <em>nicht</em> im SGB II selbst, sondern wurde von der Rechtsprechung entwickelt und orientiert sich u.&nbsp;a. an § 121 Abs. 4 SGB III (Zumutbarkeit von Beschäftigungen). Auch deutlich kürzere Pendelzeiten können im Einzelfall ausreichen, etwa bei Schichtdienst, Kinderbetreuungspflichten oder fehlender ÖPNV-Anbindung. Halten Sie Routen-Ausdrucke (Google Maps oder Bahnverbindung, jeweils zur tatsächlichen Arbeitszeit) als Beleg bereit.
                    </p>

                    <div class="insight-box">
                        <p class="insight-label">Unterschätzter Fallstrick</p>
                        <p>
                            Wer ohne anerkannten Grund umzieht, bekommt nicht nur keine Umzugskosten – nach § 22 Abs. 1 Satz 2 SGB II wird dauerhaft nur der bisherige Bedarf anerkannt. Eine Differenz von 150 € monatlich summiert sich auf 1.800 € pro Jahr, die aus dem Regelbedarf bezahlt werden müssen. Über fünf Jahre hinweg sind das 9.000 €.
                        </p>
                    </div>
                </section>

                <!-- ===== ANGEMESSENHEIT ===== -->
                <section class="content-section">
                    <h2>Angemessenheitsgrenzen – die zweite zentrale Hürde</h2>

                    <p>
                        Selbst bei anerkannter Notwendigkeit übernimmt das Jobcenter die laufenden Kosten der neuen Wohnung nur, soweit sie <strong>angemessen</strong> sind (§ 22 Abs. 1 Satz 1 SGB II). Was angemessen ist, legen die Kommunen in eigenen Satzungen oder Verwaltungsanweisungen fest – die Werte unterscheiden sich massiv zwischen Landkreisen und Großstädten und werden meist jährlich angepasst.
                    </p>

                    <div class="table-wrapper">
                        <p class="table-caption">Orientierungswerte Bruttokaltmiete (Schätzungen, Stand Anfang 2026)</p>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Kommune</th>
                                    <th>1 Person</th>
                                    <th>2 Personen</th>
                                    <th>3 Personen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each angemessenheitsTabelle as row}
                                    <tr>
                                        <td>{row.stadt}</td>
                                        <td class="amount">{row.p1}</td>
                                        <td class="amount">{row.p2}</td>
                                        <td class="amount">{row.p3}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                        <p class="table-note">
                            Diese Werte sind Orientierungsschätzungen auf Basis kommunaler Satzungen und sozialgerichtlicher Rechtsprechung. Sie variieren je nach Stadtteil, Baujahr, Heizungsart und konkreter Familiensituation. Erfragen Sie die <em>exakten</em> Richtwerte schriftlich bei Ihrem zuständigen Jobcenter, bevor Sie Wohnungsbesichtigungen wahrnehmen – nur die schriftliche Auskunft ist verbindlich.
                        </p>
                    </div>

                    <p>
                        Die angemessene Wohnungsgröße orientiert sich in den meisten Bundesländern an den Vorgaben der sozialen Wohnraumförderung: 50 m² für eine Person, 65 m² für zwei Personen, 80 m² für drei, jeweils plus 12–15 m² für jede weitere Person. Auch hier sind kommunale Abweichungen möglich.
                    </p>

                    <h3>Bruttokaltmiete oder Warmmiete?</h3>
                    <p>
                        Die meisten Jobcenter prüfen die Angemessenheit der <strong>Bruttokaltmiete</strong> (Kaltmiete + kalte Nebenkosten ohne Heizung). Die Heizkosten werden separat in tatsächlicher Höhe übernommen, soweit sie nicht offensichtlich überhöht sind. Strom zählt nicht zur Unterkunft, sondern wird aus dem Regelbedarf bezahlt.
                    </p>
                </section>

                <!-- ===== ANTRAGSWEG ===== -->
                <section class="content-section">
                    <h2>Schritt-für-Schritt: Der vollständige Antragsweg</h2>

                    <p>
                        Der Prozess ist streng formalisiert. Ein einziger Schritt in falscher Reihenfolge kann den gesamten Anspruch kosten. Nehmen Sie sich vor jedem Schritt Zeit – ein Bürgergeld-Umzug ist kein Wochenend-Projekt.
                    </p>

                    <ol class="content-list content-list--numbered">
                        <li>
                            <strong>Notwendigkeit dokumentieren.</strong> Sammeln Sie alle Belege, die den Umzugsgrund stützen: Aufforderungsschreiben des Jobcenters zur Kostensenkung, Arbeitsvertrag oder Einstellungszusage, ärztliche Atteste, Räumungsklage, Polizeiprotokoll bei häuslicher Gewalt. Ohne dokumentierten Grund kein Anspruch.
                        </li>
                        <li>
                            <strong>Angemessenheitsgrenzen schriftlich erfragen.</strong> Stellen Sie einen kurzen schriftlichen Antrag (formlos, per Post oder über das Online-Postfach) auf Auskunft zur angemessenen Bruttokaltmiete für Ihre Haushaltsgröße – sowohl am alten als auch am neuen Wohnort. Antworten Sie nicht auf telefonische Auskünfte.
                        </li>
                        <li>
                            <strong>Wohnung suchen, aber NICHT unterschreiben.</strong> Wenn Sie eine geeignete Wohnung gefunden haben, lassen Sie sich vom Vermieter ein <em>Wohnungsangebot</em> oder einen <em>Mietvertragsentwurf</em> mit allen Konditionen aushändigen – ohne zu unterschreiben.
                        </li>
                        <li>
                            <strong>Zusicherung beantragen.</strong> Stellen Sie einen schriftlichen Antrag nach § 22 Abs. 6 SGB II beim alten Träger (Umzugs- und Wohnungsbeschaffungskosten) und beim neuen Träger (Mietkaution). Fügen Sie bei: Notwendigkeitsnachweise, Mietvertragsentwurf, Auflistung der Umzugsoptionen mit Kostenvoranschlägen.
                        </li>
                        <li>
                            <strong>Schriftlichen Bescheid abwarten.</strong> Akzeptieren Sie nur einen schriftlichen Zusicherungsbescheid – keine Telefonate, keine SMS. Der Bescheid muss eindeutig benennen, welche Posten in welcher Höhe übernommen werden und ob es sich um Zuschuss oder Darlehen handelt.
                        </li>
                        <li>
                            <strong>Mietvertrag unterschreiben und Umzug planen.</strong> Erst nach Vorlage der schriftlichen Zusicherung sollten Sie den Mietvertrag unterzeichnen. Holen Sie für den Umzug selbst zwei bis drei Kostenvoranschläge ein, sofern das Jobcenter dies verlangt.
                        </li>
                        <li>
                            <strong>Belege einreichen und abrechnen.</strong> Nach dem Umzug reichen Sie alle Originalrechnungen ein: Umzugsfirma, Materialbelege, Maklerprovision, Doppelmietnachweis. Das Jobcenter zahlt die zugesicherten Beträge gegen Beleg aus oder direkt an die Dienstleister.
                        </li>
                    </ol>

                    <div class="insight-box">
                        <p class="insight-label">Tipp aus der Praxis</p>
                        <p>
                            Wenn Sie ein Umzugsunternehmen wie uns beauftragen, stellen wir die Rechnung mit allen Einzelpositionen (Personal, Fahrzeug, Material) so aus, wie es das Jobcenter zur Prüfung benötigt. Auf Wunsch rechnen wir auch direkt mit dem Jobcenter ab, sodass Sie nicht in Vorleistung treten müssen.
                        </p>
                    </div>
                </section>

                <!-- ===== KOSTEN ===== -->
                <section class="content-section">
                    <h2>Was übernimmt das Jobcenter konkret?</h2>

                    <p>
                        Die Bandbreite der erstattungsfähigen Kosten ist größer, als viele Bürgergeld-Empfänger annehmen. Maßgeblich ist immer, dass die Kosten <em>notwendig</em> und <em>angemessen</em> sind und im Zusicherungsbescheid abgedeckt wurden.
                    </p>

                    <div class="cost-grid">
                        <div class="cost-card cost-card--yes">
                            <h3>Übernahmefähig</h3>
                            <ul>
                                <li>Rechnung des Umzugsunternehmens (Personal + Fahrzeug)</li>
                                <li>Mietwagen (Transporter) inkl. Versicherung</li>
                                <li>Treibstoffkosten bei Selbstumzug</li>
                                <li>Verpackungsmaterial (Kartons, Folie, Decken)</li>
                                <li>Helferverpflegung (pauschal pro Helfer und Tag)</li>
                                <li>Mietkaution (als zinsloses Darlehen)</li>
                                <li>Genossenschaftsanteile (als Darlehen)</li>
                                <li>Maklerprovision für die neue Wohnung</li>
                                <li>Doppelmiete für maximal einen Übergangsmonat</li>
                                <li>Schönheitsreparaturen, soweit vertraglich geschuldet</li>
                                <li>Anschlussgebühren für Strom, Gas, Internet</li>
                            </ul>
                        </div>
                        <div class="cost-card cost-card--no">
                            <h3>Nicht übernahmefähig</h3>
                            <ul>
                                <li>Anschaffung neuer Möbel oder Haushaltsgeräte (gesonderte Erstausstattung möglich, § 24 Abs. 3 SGB II)</li>
                                <li>Renovierungen über die vertragliche Pflicht hinaus</li>
                                <li>Möbel-Einlagerung ohne triftigen Grund</li>
                                <li>Trinkgeld für Möbelträger</li>
                                <li>Strafzahlungen wegen vorzeitiger Kündigung</li>
                                <li>Nicht abgesprochene Eigenleistungen Dritter</li>
                            </ul>
                        </div>
                    </div>

                    <h3>Sonderfall doppelte Miete im Übergangsmonat</h3>
                    <p>
                        Die gesetzliche Kündigungsfrist von drei Monaten und der Wunschtermin des neuen Vermieters passen selten zusammen – ein Übergangsmonat mit zwei laufenden Mietverhältnissen ist oft unvermeidbar. Auch diese <strong>Doppelmiete</strong> zählt zu den Wohnungsbeschaffungskosten nach § 22 Abs. 6 Satz 1 SGB II und kann übernommen werden, wenn drei Voraussetzungen erfüllt sind: Der Umzug ist anerkannt notwendig, die Überlappung ist <em>unvermeidbar</em> (kein Nachmieter findbar, keine Aufhebungsvereinbarung mit dem alten Vermieter erreichbar), und sie wurde in der schriftlichen Zusicherung ausdrücklich aufgenommen.
                    </p>
                    <p>
                        In der Praxis erkennen die meisten Jobcenter <strong>einen Übergangsmonat</strong> an. Längere Überlappungen werden nur bei besonderem Begründungsbedarf bewilligt. Reichen Sie zur Beantragung ein: alten Mietvertrag mit Kündigungsschreiben und Eingangsbestätigung, neuen Mietvertrag bzw. Wohnungsangebot, sowie eine kurze schriftliche Begründung, warum eine zeitliche Überschneidung nicht vermeidbar war (z.&nbsp;B. erfolglose Nachmietersuche, dokumentiert durch Inserate). Wichtig: Der Posten muss <em>vor</em> dem Umzug im Zusicherungsbescheid stehen – eine nachträgliche Erstattung der bereits gezahlten Doppelmiete wird in der Regel abgelehnt.
                    </p>

                    <p>
                        Sonderfall <strong>Erstausstattung</strong>: Für Personen, die erstmals einen eigenen Haushalt gründen oder durch besondere Umstände ohne Hausrat dastehen (z.&nbsp;B. nach Frauenhaus-Aufenthalt), greift § 24 Abs. 3 Nr. 1 SGB II. Möbel, Haushaltsgeräte und Einrichtungsgegenstände können dann zusätzlich als Zuschuss oder Darlehen gewährt werden – als eigenständiger Antrag, getrennt vom Umzugskostenantrag.
                    </p>

                    <p>
                        Lesen Sie auch: <a href="/ratgeber/seriose-umzugsfirma" class="inline-link">Woran Sie eine seriöse Umzugsfirma erkennen</a> und unsere <a href="/ratgeber/umzugs-checkliste" class="inline-link">Umzugs-Checkliste</a> für die operative Vorbereitung.
                    </p>
                </section>

                <!-- ===== KAUTION ===== -->
                <section class="content-section">
                    <h2>Die Mietkaution im Detail – Darlehen statt Zuschuss</h2>

                    <p>
                        Die Mietkaution ist der Posten, bei dem die meisten Bürgergeld-Empfänger negativ überrascht werden. Sie wird nicht erlassen, sondern als zinsloses Darlehen ausgezahlt – und sofort beginnt die Tilgung.
                    </p>

                    <h3>Wie die Tilgung funktioniert</h3>
                    <p>
                        Nach § 42a Abs. 2 SGB II wird das Darlehen durch monatliche Aufrechnung mit dem Regelbedarf in Höhe von <strong>bis zu 5 %</strong> getilgt. Bei einem Regelbedarf für Alleinstehende von 563 € (Stand 2026) sind das maximal etwa 28 € pro Monat. Eine Kaution in Höhe von drei Kaltmieten zu je 350 € (= 1.050 €) wäre damit über rund 38 Monate getilgt.
                    </p>

                    <div class="calc-box">
                        <p class="calc-label">Rechenbeispiel Mietkaution</p>
                        <div class="calc-rows">
                            <div class="calc-row">
                                <span>Drei Kaltmieten Mietkaution</span>
                                <span>1.050 €</span>
                            </div>
                            <div class="calc-row">
                                <span>Auszahlung als Darlehen ans Jobcenter / direkt an Vermieter</span>
                                <span>1.050 €</span>
                            </div>
                            <div class="calc-row">
                                <span>Monatliche Tilgung (5 % Regelbedarf à 563 €)</span>
                                <span>– 28,15 €</span>
                            </div>
                            <div class="calc-row">
                                <span>Tilgungszeitraum</span>
                                <span>ca. 38 Monate</span>
                            </div>
                            <div class="calc-row calc-row--total">
                                <span>Effektive monatliche Belastung aus Regelbedarf</span>
                                <span>28,15 €</span>
                            </div>
                        </div>
                    </div>

                    <h3>Was passiert beim Auszug?</h3>
                    <p>
                        Beim Auszug aus der neuen Wohnung wird die Kaution vom Vermieter zurückgezahlt – meist direkt an das Jobcenter, da dieses als Darlehensgeber auf der Auszahlungsanweisung steht. Die Restschuld wird mit der Rückzahlung verrechnet; ein darüber hinausgehendes Guthaben wird Ihnen ausgekehrt. Wenn der Vermieter die Kaution wegen Mängeln einbehält, müssen Sie den Restbetrag des Darlehens weiter tilgen.
                    </p>

                    <div class="insight-box">
                        <p class="insight-label">Vermieter direkt ansprechen</p>
                        <p>
                            Viele Vermieter akzeptieren statt einer Barkaution auch eine <em>Mietkautionsbürgschaft</em> oder eine Ratenzahlung über drei Monate (§ 551 BGB). Das spart die Darlehensaufnahme komplett. Verhandeln Sie das aktiv – gerade in entspannteren Mietmärkten ist es üblicher, als viele denken.
                        </p>
                    </div>
                </section>

                <!-- ===== FEHLER ===== -->
                <section class="content-section">
                    <h2>Die fünf häufigsten Fehler – und wie Sie sie vermeiden</h2>

                    <ol class="content-list content-list--numbered">
                        <li>
                            <strong>Mietvertrag vor Zusicherung unterschreiben.</strong> Konsequenz: kein Umzugskostenzuschuss, keine Mietkaution als Darlehen, eventuell dauerhafte Mietdeckelung. Lösung: Wohnungsangebot statt Mietvertrag, Zusicherung schriftlich abwarten.
                        </li>
                        <li>
                            <strong>Sich auf telefonische Zusagen verlassen.</strong> Mündliche Auskünfte sind im Streitfall vor dem Sozialgericht wertlos. Lösung: Jeden Schritt schriftlich – per Post, Fax oder über das Bürgergeld-Online-Postfach.
                        </li>
                        <li>
                            <strong>Notwendigkeit nicht ausreichend belegen.</strong> Aussagen wie „Ich brauche eine ruhigere Wohnung" reichen nicht. Lösung: Konkrete Belege sammeln – Atteste, Polizeiprotokolle, Arbeitsverträge, Kostensenkungsschreiben.
                        </li>
                        <li>
                            <strong>Umzugskosten überhöht ansetzen.</strong> Wer ohne Vergleichsangebote die teuerste Umzugsfirma wählt, bekommt nur die wirtschaftlichste Variante erstattet. Lösung: Zwei bis drei schriftliche Kostenvoranschläge einholen und dem Antrag beilegen.
                        </li>
                        <li>
                            <strong>Nach Ablehnung resignieren.</strong> Gegen jeden Bescheid kann innerhalb eines Monats Widerspruch eingelegt werden. Bei sozialgerichtlicher Klage entstehen Ihnen keine Gerichtskosten. Lösung: Bei Ablehnung sofort Sozialberatung oder Anwalt für Sozialrecht aufsuchen – Beratungshilfe ist kostenfrei.
                        </li>
                    </ol>

                    <div class="example-box">
                        <p class="example-label">Beispielfall</p>
                        <p>
                            Eine alleinerziehende Mutter mit zwei Kindern in Hildesheim erhält wegen einer neuen Stelle in Hannover (Pendelweg 2 Stunden 50 Minuten täglich) die Aufforderung, näher zur Arbeit zu ziehen. Sie beantragt schriftlich die Zusicherung mit Arbeitsvertrag, Routenausdruck und Mietangebot. Das Jobcenter sichert binnen drei Wochen Umzugskosten (1.800 €), Maklerprovision (1.450 €), eine Doppelmiete (520 €) sowie eine Mietkaution von 1.560 € als Darlehen zu. Effektive Belastung aus dem Regelbedarf: rund 28 € monatlich für Kautions-Tilgung – alles übrige wird als Zuschuss erstattet.
                        </p>
                    </div>
                </section>

                <!-- ===== WIDERSPRUCH ===== -->
                <section class="content-section">
                    <h2>Wenn das Jobcenter ablehnt: Widerspruch und Klage</h2>

                    <p>
                        Eine Ablehnung der Zusicherung ist nicht das Ende. § 84 SGG (Sozialgerichtsgesetz) gibt Ihnen eine <strong>Widerspruchsfrist von einem Monat</strong> nach Bekanntgabe des Bescheids. Der Widerspruch muss schriftlich oder zur Niederschrift bei der Behörde eingelegt werden. Eine Begründung ist hilfreich, aber nicht zwingend zur Fristwahrung.
                    </p>

                    <h3>Der typische Ablauf</h3>
                    <ol class="content-list content-list--numbered">
                        <li><strong>Widerspruch einlegen</strong> innerhalb eines Monats – auch ohne ausführliche Begründung, um die Frist zu wahren.</li>
                        <li><strong>Begründung nachreichen</strong> mit allen Belegen, idealerweise unter Bezugnahme auf konkrete Rechtsprechung (Urteile des BSG / der LSG).</li>
                        <li><strong>Widerspruchsbescheid abwarten</strong>. Bei Stillschweigen über drei Monate ist Untätigkeitsklage möglich (§ 88 SGG).</li>
                        <li><strong>Klage zum Sozialgericht</strong> innerhalb eines Monats nach Widerspruchsbescheid. Gerichtskosten entstehen Ihnen nicht (§ 183 SGG).</li>
                        <li><strong>Eilantrag</strong> bei akut drohender Wohnungslosigkeit oder kurz vor Ablauf eines Mietangebots: einstweilige Anordnung nach § 86b SGG.</li>
                    </ol>

                    <p>
                        Für die Beratung steht Ihnen <strong>Beratungshilfe</strong> nach dem Beratungshilfegesetz zu – Sie erhalten beim Amtsgericht einen Berechtigungsschein, mit dem Sie eine anwaltliche Erstberatung gegen 15 € Eigenanteil bekommen. Bei laufender Klage greift die <strong>Prozesskostenhilfe</strong> (§ 73a SGG i.V.m. §§ 114 ff. ZPO).
                    </p>
                </section>

                <!-- ===== FAQ ===== -->
                <FAQSection {faqs} title="Häufige Fragen zum Umzug mit Bürgergeld" />

            </div>

            <CTASection
                heading="Umzug mit Bürgergeld in Hildesheim oder Hannover geplant?"
                description="Wir kennen den Ablauf mit den Jobcentern in der Region und stellen Kostenvoranschläge so aus, wie Ihr Sachbearbeiter sie braucht. Auf Wunsch rechnen wir direkt mit dem Jobcenter ab – ohne Vorleistung."
                buttonText="Kostenloses Angebot anfordern"
                buttonHref="/kostenloses-angebot"
            />
        </article>
    </div>
</main>

<style>
    .guide-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .guide-detail__container {
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
    .guide-header {
        text-align: center;
        margin-bottom: var(--space-8);
    }

    .icon-wrapper {
        display: inline-flex;
        padding: var(--space-4);
        background-color: #f0f9ff;
        color: var(--color-info-bar);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-4);
    }

    h1 {
        font-size: clamp(2rem, 4vw, 3rem);
        color: var(--color-info-bar);
        font-weight: 700;
        margin-bottom: var(--space-2);
    }

    .subtitle {
        font-size: 1.25rem;
        color: #1a202c;
    }

    .author-byline {
        color: #64748b;
        font-size: var(--text-sm);
        margin-top: var(--space-2);
    }

    /* Intro */
    .guide-intro {
        background-color: #f8fafc;
        border-left: 4px solid var(--color-info-bar);
        padding: var(--space-6);
        margin-bottom: var(--space-6);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .guide-intro p {
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.75;
        margin: 0 0 var(--space-3) 0;
    }

    .guide-intro p:last-child {
        margin-bottom: 0;
    }

    /* TL;DR */
    .tldr-box {
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: var(--radius-md);
        padding: var(--space-5) var(--space-6);
        margin-bottom: var(--space-8);
    }

    .tldr-label {
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--color-info-bar);
        margin: 0 0 var(--space-2) 0;
    }

    .tldr-box p:last-child {
        color: #1e3a5f;
        font-size: var(--text-base);
        line-height: 1.65;
        margin: 0;
    }

    /* Two paths overview */
    .two-paths {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-5);
        margin-bottom: var(--space-12);
    }

    .path-card {
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        border: 2px solid transparent;
    }

    .path-card--blue {
        background-color: #eff6ff;
        border-color: #bfdbfe;
    }

    .path-card--orange {
        background-color: #fff7ed;
        border-color: #fed7aa;
    }

    .path-badge {
        display: inline-block;
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.07em;
        padding: 2px var(--space-2);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-3);
    }

    .path-card--blue .path-badge {
        background-color: #dbeafe;
        color: #1d4ed8;
    }

    .path-card--orange .path-badge {
        background-color: #ffedd5;
        color: #c2410c;
    }

    .path-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 var(--space-1) 0;
        border: none;
        padding: 0;
    }

    .path-card--blue .path-title { color: #1e40af; }
    .path-card--orange .path-title { color: #9a3412; }

    .path-subtitle {
        font-size: var(--text-sm);
        color: #64748b;
        margin: 0 0 var(--space-4) 0;
    }

    .path-list {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: var(--text-sm);
        line-height: 1.6;
    }

    .path-list li {
        padding: var(--space-1) 0 var(--space-1) var(--space-5);
        position: relative;
        color: #1a202c;
    }

    .path-list li::before {
        content: "→";
        position: absolute;
        left: 0;
        font-weight: 600;
    }

    .path-card--blue .path-list li::before { color: #2563eb; }
    .path-card--orange .path-list li::before { color: #ea580c; }

    /* Content sections */
    .guide-content {
        margin-top: var(--space-4);
    }

    .content-section {
        margin-bottom: var(--space-12);
    }

    .content-section h2 {
        color: var(--color-info-bar);
        font-size: 1.6rem;
        font-weight: 700;
        margin-bottom: var(--space-5);
        padding-bottom: var(--space-3);
        border-bottom: 2px solid var(--color-nav-accent);
    }

    .content-section h3 {
        color: var(--color-info-bar);
        font-size: 1.125rem;
        font-weight: 600;
        margin: var(--space-6) 0 var(--space-3) 0;
    }

    .content-section p {
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.75;
        margin-bottom: var(--space-4);
    }

    .content-section p:last-child {
        margin-bottom: 0;
    }

    /* Lists */
    .content-list {
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.7;
        padding-left: var(--space-6);
        margin: var(--space-4) 0;
    }

    .content-list li {
        margin-bottom: var(--space-2);
    }

    .content-list--numbered {
        list-style: decimal;
    }

    /* Quote block */
    .quote-block {
        background-color: #f8fafc;
        border-left: 4px solid var(--color-info-bar);
        padding: var(--space-4) var(--space-5);
        margin: var(--space-4) 0;
        font-style: italic;
        color: #1a202c;
        font-size: 1.0625rem;
        line-height: 1.7;
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    /* Calculation box */
    .calc-box {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: var(--radius-md);
        padding: var(--space-5);
        margin: var(--space-6) 0;
    }

    .calc-label {
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #15803d;
        margin: 0 0 var(--space-4) 0;
    }

    .calc-rows {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
    }

    .calc-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--text-sm);
        color: #1a202c;
        padding: var(--space-2) 0;
        border-bottom: 1px solid #dcfce7;
    }

    .calc-row:last-child {
        border-bottom: none;
    }

    .calc-row--total {
        font-weight: 700;
        color: #15803d;
        font-size: var(--text-base);
        padding-top: var(--space-3);
        margin-top: var(--space-1);
        border-top: 2px solid #86efac;
        border-bottom: none;
    }

    /* Cost grid */
    .cost-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        margin: var(--space-6) 0;
    }

    .cost-card {
        border-radius: var(--radius-md);
        padding: var(--space-5);
        border: 1px solid #e2e8f0;
    }

    .cost-card h3 {
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 var(--space-3) 0;
    }

    .cost-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: var(--text-sm);
        line-height: 1.6;
    }

    .cost-card ul li {
        padding: var(--space-1) 0;
        padding-left: var(--space-5);
        position: relative;
        color: #1a202c;
    }

    .cost-card ul li::before {
        position: absolute;
        left: 0;
        font-weight: 700;
    }

    .cost-card--yes { background-color: #f0fdf4; border-color: #bbf7d0; }
    .cost-card--yes h3 { color: #15803d; }
    .cost-card--yes ul li::before { content: "✓"; color: #15803d; }

    .cost-card--no { background-color: #fef2f2; border-color: #fecaca; }
    .cost-card--no h3 { color: #b91c1c; }
    .cost-card--no ul li::before { content: "✗"; color: #b91c1c; }

    /* Table */
    .table-wrapper {
        margin: var(--space-6) 0;
        overflow-x: auto;
    }

    .table-caption {
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--color-info-bar);
        margin-bottom: var(--space-3);
    }

    .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--text-base);
    }

    .data-table th {
        background-color: var(--color-info-bar);
        color: #fff;
        text-align: left;
        padding: var(--space-3) var(--space-4);
        font-weight: var(--font-semibold);
    }

    .data-table td {
        padding: var(--space-3) var(--space-4);
        border-bottom: 1px solid #e2e8f0;
        color: #1a202c;
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:nth-child(even) td { background-color: #f8fafc; }

    .data-table td.amount {
        font-weight: var(--font-semibold);
        color: var(--color-info-bar);
        white-space: nowrap;
    }

    .table-note {
        font-size: var(--text-xs);
        color: #64748b;
        margin-top: var(--space-2);
        line-height: 1.5;
    }

    /* Callout boxes */
    .insight-box {
        background-color: #fffbeb;
        border-left: 4px solid #f59e0b;
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        padding: var(--space-4) var(--space-5);
        margin: var(--space-5) 0;
    }

    .insight-label,
    .example-label,
    .calc-label {
        font-size: var(--text-xs);
        font-weight: var(--font-semibold);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 var(--space-2) 0;
    }

    .insight-label { color: #92400e; }

    .insight-box p:last-child {
        color: #1a202c;
        font-size: var(--text-sm);
        line-height: 1.65;
        margin: 0;
    }

    .example-box {
        background-color: #f0f9ff;
        border-left: 4px solid var(--color-info-bar);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
        padding: var(--space-4) var(--space-5);
        margin: var(--space-5) 0;
    }

    .example-label { color: #1e3a5f; }

    .example-box p:last-child {
        color: #1a202c;
        font-size: var(--text-sm);
        line-height: 1.65;
        margin: 0;
    }

    /* Inline link */
    .inline-link {
        color: #ff6b00;
        font-weight: 500;
        text-decoration: underline;
        text-decoration-color: rgba(196, 65, 0, 0.3);
        transition: color 0.2s, text-decoration-color 0.2s;
    }

    .inline-link:hover {
        color: #b93d00;
        text-decoration-color: rgba(185, 61, 0, 0.6);
    }

    /* Disclaimer */
    .disclaimer {
        background-color: #fefce8;
        border: 1px solid #fde047;
        border-left: 4px solid #eab308;
        border-radius: var(--radius-md);
        padding: var(--space-4) var(--space-5);
        margin-bottom: var(--space-6);
    }

    .disclaimer p {
        color: #713f12;
        font-size: var(--text-sm);
        line-height: 1.6;
        margin: 0;
    }

    /* Responsive */
    @media (max-width: 700px) {
        .two-paths,
        .cost-grid {
            grid-template-columns: 1fr;
        }

        .content-section h2 {
            font-size: 1.35rem;
        }
    }
</style>
