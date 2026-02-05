<script lang="ts">
    import { ClipboardList, ArrowLeft, CheckCircle } from "lucide-svelte";

    const checklistSections = [
        {
            title: "4 Wochen vor dem Umzug",
            items: [
                {
                    title: "Telefon und Internet kündigen oder ummelden",
                    description:
                        "Stellen Sie Ihre Erreichbarkeit in der neuen Wohnung sicher und kümmern Sie sich rechtzeitig um die Ummeldung von Telefon und Internet. Da die Umstellung etwas länger dauern kann und dies oft nur mit dem Monatswechsel möglich ist, sollten Sie das jetzt machen.",
                },
                {
                    title: "Stromanbieter / Gasanbieter kündigen oder ummelden",
                    description:
                        "Melden Sie Ihren Wohnortwechsel bei Ihrem Stromanbieter an. Dieser stellt dann alles mit dem nächsten Monatswechsel um. Bei einem Umzug haben Sie zudem die Möglichkeit von Ihrem Sonderkündigungsrecht Gebrauch zu machen. Anbieter vergleichen lohnt sich!",
                },
                {
                    title: "Rundfunkgebühren (GEZ) ummelden",
                    description:
                        "Jeder Haushalt in Deutschland muss die Rundfunkgebühren (GEZ) bezahlen. Bei einem Umzug können Sie die Ummeldung ganz bequem und kostenlos online vornehmen. Kümmern Sie sich darum und ersparen Sie sich unnötige und lästige Briefe.",
                },
                {
                    title: "Abonnements kündigen",
                    description:
                        "Bestehende Abonnements am besten rechtzeitig vor dem Monatswechsel kündigen. Zeitungsabonnements können Sie ummelden und erhalten alles wie gewohnt an Ihrer neuen Anschrift.",
                },
                {
                    title: "Arbeitgeber informieren",
                    description:
                        "Teilen Sie Ihrem Arbeitgeber Ihre neue Anschrift mit, dies ist nicht nur für Ihre Gehaltsabrechnung elementar wichtig! In den meisten Arbeitsverträgen ist dies auch schriftlich festgehalten.",
                },
                {
                    title: "Behörden und Ämter informieren",
                    description:
                        "Vergessen Sie das Finanzamt nicht! Dies erfährt nicht automatisch von Ihrer Adressänderung. Melden Sie dies und Ihre neue Steuernummer Ihrem alten Finanzamt. Falls Sie Leistungen von Behörden beziehen, informieren Sie die Stellen um Ausfälle oder Kürzungen zu vermeiden.",
                },
                {
                    title: "Termin zur Wohnungsübergabe vereinbaren (alt/neu)",
                    description:
                        "Damit Sie schnell Ihre Mietkaution wieder bekommen und die alte Wohnung ordnungsgemäß übergeben können, vereinbaren Sie einen Termin zur Übergabe. Dies gilt auch für die neue Wohnung, so wissen Sie ganz genau, wann Sie in die Wohnung können.",
                },
            ],
        },
        {
            title: "3 Wochen vor dem Umzug",
            items: [
                {
                    title: "Umzugsmaterial beschaffen",
                    description:
                        "Nachdem Sie aufgelistet haben, was alles mit umziehen soll, benötigen Sie ausreichend Umzugsmaterial. Vergleichen Sie vorher die Preise der Anbieter. Besorgen Sie sich ausreichend Umzugskartons, Kleiderboxen, Polsterfolie, Paketband etc.",
                },
                {
                    title: "Schönheitsreparaturen in der alten Wohnung",
                    description:
                        "Achten Sie auf Türen, Wände und Fußboden und nehmen Sie vor dem Auszug Schönheitsreparaturen vor, bevor Ihnen die Mängel von der Mietkaution abgezogen werden. Verschließen Sie bspw. Dübellöcher, säubern Sie die Wohnung für eine besenreine Übergabe.",
                },
                {
                    title: "Kinderbetreuung für den Umzugstag organisieren",
                    description:
                        "Falls Sie kleine Kinder in Ihrem Haushalt haben, ist es ratsam sich um eine Kinderbetreuung am Umzugstag zu kümmern. Sie werden am Umzugstag sehr eingespannt sein und keine Zeit haben, sich großartig um Ihre Kleinsten zu kümmern.",
                },
            ],
        },
        {
            title: "2 Wochen vor dem Umzug",
            items: [
                {
                    title: "Renovierung der neuen Wohnung, falls notwendig",
                    description:
                        "Falls die neue Wohnung unrenoviert übergeben wird und Sie schon einen Schlüssel haben, können Sie nun mit den Renovierungsarbeiten beginnen. Streichen Sie die Wände in Ihre Wunschfarbe und sie haben nun genügend Zeit zum Trocknen.",
                },
                {
                    title: "Möbeldemontage",
                    description:
                        "Demontieren Sie große und sperrige Möbelstücke, die nicht in einem Stück verladen und transportiert werden können. Unterschätzen Sie die Küchendemontage dabei nicht, die nimmt viel Zeit in Anspruch. Holen Sie sich am besten Handwerker dazu.",
                },
                {
                    title: "Einrichtung einer Halteverbotszone für den Umzugstag",
                    description:
                        "Ersparen Sie sich die ewige Parkplatzsuche, lange Laufwege am Umzugstag oder sogar Strafzettel wegen falsch parken. Beantragen Sie eine Halteverbotszone am Umzugstag bei der Stadt. Am besten gleich für beide Anschriften, falls ein Parkproblem herrscht.",
                },
            ],
        },
        {
            title: "1 Woche vor dem Umzug",
            items: [
                {
                    title: "Gardinenstangen, Lampen, etc. demontieren",
                    description:
                        "Nehmen Sie Gardinen und Gardinenstangen in der jetzigen Wohnung ab. Deinstallieren Sie Lampen oder andere elektrische Geräte. Prüfen Sie vorher, dass der Strom ausgeschaltet ist. Verspachteln Sie im Anschluss alle Löcher in den Wänden und an der Decke.",
                },
                {
                    title: "Alles transportsicher verpacken",
                    description:
                        "Machen Sie Ihr Umzugsgut transportsicher. Die Schränke sind leer geräumt, nun sichern Sie Schubladen, Einsätze, Schranktüren etc., damit diese nicht beim Transport aufgehen oder herausfallen. Einlegeböden empfehlen wir deshalb herauszunehmen.",
                },
                {
                    title: "Einkäufe vor dem Umzug",
                    description:
                        "Damit Ihnen am Umzugstag nichts fehlt sollten Sie jetzt noch einmal einkaufen gehen. Prüfen Sie Reinigungsmittel, Einmalhandschuhe, Küchenpapier und natürlich Verpflegung. Sollten Sie noch Umzugsmaterial benötigen, ist dies die letzte Chance vor dem Umzugstag.",
                },
            ],
        },
        {
            title: "Direkt nach dem Umzug",
            items: [
                {
                    title: "Möbelmontage",
                    description:
                        "Montieren Sie Ihre Möbel selber oder engagieren Sie Handwerker für den Möbelaufbau und die Küchenmontage. Falls Sie mit Ihrer Küche umziehen muss diese unter Umständen angepasst werden, hierzu sollten Sie unbedingt Handwerker heranziehen.",
                },
                {
                    title: "Alles auspacken und verräumen",
                    description:
                        "Packen Sie nun Ihre Umzugskartons aus und verräumen Sie alles wieder an seinen Platz in die aufgebauten Schränke. Wenn Sie Ihre Umzugskartons vorher entsprechend beschriftet haben, geht das Auspacken sehr schnell.",
                },
                {
                    title: "Verpackungsmaterial entsorgen",
                    description:
                        "Benutztes Umzugsmaterial und das Verpackungsmaterial von Ihren bestellten Möbeln können Sie nun fachgerecht und vorschriftsmäßig entsorgen. Insofern Sie eine Umzugsfirma beauftragt haben, wird dies auf Wunsch auch von der beauftragten Firma übernommen.",
                },
            ],
        },
        {
            title: "1 Woche nach dem Umzug",
            items: [
                {
                    title: "Wohnsitz ummelden",
                    description:
                        "In Deutschland gibt es eine Meldepflicht, die jeden dazu verpflichtet seinen aktuellen Wohnsitz anzumelden. Dafür gibt es eine Meldefrist (zwei Wochen), die allerdings je nach Bundesland unterschiedlich ist. Die Ummeldung erfolgt beim Einwohnermeldeamt.",
                },
                {
                    title: "KFZ-Ummeldung",
                    description:
                        "Für die KFZ-Ummeldung gilt das Gleiche wie für die Wohnsitzummeldung nach einem Umzug. Wenden Sie sich an die KFZ-Zulassungsstelle. Ihre Nummernschilder dürfen Sie jedoch behalten und müssen nach der neuen Verordnung nicht mehr getauscht werden.",
                },
                {
                    title: "Hund ummelden",
                    description:
                        "Auch Ihren geliebten Vierbeiner müssen Sie zeitnah nach Ihrem Umzug ummelden. Sie zahlen Hundesteuer, daher muss das Finanzamt hier informiert sein und Ihr Hund umgemeldet sein.",
                },
                {
                    title: "Adressänderung bekannt geben",
                    description:
                        "Informieren Sie alle über Ihren Wohnsitzwechsel und geben Sie Ihre neue Anschrift bekannt. Dies reicht in der Regel telefonisch oder per E-Mail. Nur in wenigen Fällen benötigen Sie einen Wohnsitznachweis.",
                },
                {
                    title: "Nachsendeantrag bei der Post stellen",
                    description:
                        "Mit einem Nachsendeantrag von der Post stellen Sie sicher, dass Sie Ihre Post auch dann erhalten, falls Sie jemanden vergessen haben zu informieren. Den Nachsendeantrag können Sie für 6, 12 oder 24 Monate bei der Post stellen.",
                },
            ],
        },
    ];
</script>

<svelte:head>
    <title>Umzugs-Checkliste | Aust Umzüge Ratgeber</title>
    <meta
        name="description"
        content="Kostenlose Umzugs-Checkliste: Was Sie 4 Wochen bis 1 Woche nach dem Umzug erledigen sollten. Telefon, Strom, Ummeldung und mehr."
    />
</svelte:head>

<main class="guide-detail">
    <div class="guide-detail__container">
        <a href="/ratgeber" class="back-link">
            <ArrowLeft size={16} />
            Zurück zur Übersicht
        </a>

        <article class="guide-article">
            <header class="guide-header">
                <div class="icon-wrapper">
                    <ClipboardList size={48} strokeWidth={1.5} />
                </div>
                <h1>Die ultimative Umzugs-Checkliste</h1>
                <p class="subtitle">Schritt für Schritt ins neue Zuhause</p>
            </header>

            <div class="guide-intro">
                <p>
                    Ein Umzug will gut geplant sein. Mit unserer Checkliste behalten Sie den Überblick und vergessen nichts Wichtiges. Von der Kündigung bis zur Ummeldung – hier finden Sie alle Aufgaben im zeitlichen Ablauf.
                </p>
            </div>

            <div class="guide-content">
                {#each checklistSections as section}
                    <section class="checklist-section">
                        <h2 class="section-title">{section.title}</h2>
                        <div class="checklist-items">
                            {#each section.items as item}
                                <div class="checklist-item">
                                    <div class="checklist-item__icon">
                                        <CheckCircle size={24} />
                                    </div>
                                    <div class="checklist-item__content">
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </section>
                {/each}
            </div>

            <div class="guide-cta">
                <h2>Umzug geplant?</h2>
                <p>Wir übernehmen die schwere Arbeit für Sie – von der Planung bis zur Montage.</p>
                <a href="/kostenloses-angebot" class="cta-button">Kostenloses Angebot anfordern</a>
            </div>
        </article>
    </div>
</main>

<style>
    .guide-detail {
        padding-block: var(--space-12);
        background-color: #fff;
    }

    .guide-detail__container {
        max-width: 900px;
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        color: #64748b;
        text-decoration: none;
        margin-bottom: var(--space-8);
        font-size: var(--text-sm);
        transition: color 0.2s;
    }

    .back-link:hover {
        color: var(--color-nav-accent);
    }

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
        color: #64748b;
    }

    .guide-intro {
        background-color: #f8fafc;
        border-left: 4px solid var(--color-info-bar);
        padding: var(--space-6);
        margin-bottom: var(--space-10);
        border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .guide-intro p {
        color: #4a5568;
        font-size: 1.125rem;
        line-height: 1.7;
        margin: 0;
    }

    .checklist-section {
        margin-bottom: var(--space-12);
    }

    .section-title {
        color: var(--color-info-bar);
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-3);
        border-bottom: 2px solid var(--color-nav-accent);
    }

    .checklist-items {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
    }

    .checklist-item {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-5);
        background-color: #f8fafc;
        border-radius: var(--radius-md);
        border: 1px solid #e2e8f0;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .checklist-item:hover {
        border-color: var(--color-info-bar);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .checklist-item__icon {
        flex-shrink: 0;
        color: var(--color-nav-accent);
        margin-top: 2px;
    }

    .checklist-item__content h3 {
        color: var(--color-info-bar);
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
    }

    .checklist-item__content p {
        color: #4a5568;
        font-size: 1rem;
        line-height: 1.6;
        margin: 0;
    }

    .guide-cta {
        background: linear-gradient(135deg, var(--color-info-bar) 0%, #2d5a87 100%);
        border-radius: var(--radius-lg);
        padding: var(--space-10);
        text-align: center;
        margin-top: var(--space-12);
    }

    .guide-cta h2 {
        color: #fff;
        font-size: 1.75rem;
        font-weight: 700;
        margin-bottom: var(--space-3);
    }

    .guide-cta p {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.125rem;
        margin-bottom: var(--space-6);
    }

    .cta-button {
        display: inline-block;
        background-color: var(--color-nav-accent);
        color: #fff;
        padding: var(--space-4) var(--space-8);
        border-radius: var(--radius-md);
        font-weight: 600;
        text-decoration: none;
        transition: background-color 0.2s, transform 0.2s;
    }

    .cta-button:hover {
        background-color: #d84a00;
        transform: translateY(-2px);
    }

    @media (max-width: 640px) {
        .checklist-item {
            flex-direction: column;
            gap: var(--space-3);
        }

        .checklist-item__icon {
            margin-top: 0;
        }
    }
</style>
