<script lang="ts">
	import CTASection from "$lib/components/CTASection.svelte";
	import MetaTags from "$lib/components/MetaTags.svelte";
	import StructuredData from "$lib/components/StructuredData.svelte";
	import { articles, howToKuecheUmzug, createBreadcrumbs } from "$lib/data/structuredData";

	const breadcrumbs = createBreadcrumbs([
		{ name: "Home", url: "https://www.aust-umzuege.de/" },
		{ name: "Ratgeber", url: "https://www.aust-umzuege.de/ratgeber" },
		{ name: "Küche beim Umzug" }
	]);
</script>

<MetaTags
	title="Küche beim Umzug: Abbau, Transport & Montage | Aust Umzüge"
	description="Küche umziehen: Spülmaschine & Waschmaschine richtig abklemmen, Einbauküche demontieren, Granit transportieren. Fehler kosten oft mehr als der Profi."
	keywords="Küche umziehen, Einbauküche abbauen, Küche transportieren, Spülmaschine abklemmen Umzug, Küchenabbau Umzug, Küchendemontage, Küchenmontage Hildesheim"
	canonical="https://www.aust-umzuege.de/ratgeber/kueche-umzug"
	ogType="article"
/>

<StructuredData schema={articles.kuecheUmzug} />
<StructuredData schema={howToKuecheUmzug} />
<StructuredData schema={breadcrumbs} />

<main class="guide-detail">
	<div class="guide-detail__container">
		<a href="/ratgeber" class="back-link">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			Zurück zur Übersicht
		</a>

		<article class="guide-article">
			<header class="guide-header">
				<div class="icon-wrapper">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<path d="M3 2h18v8H3z"></path>
						<path d="M3 10h18v12H3z"></path>
						<path d="M12 10v12"></path>
						<path d="M8 2v8"></path>
					</svg>
				</div>
				<h1>Küche beim Umzug: Abbau, Transport und Montage – was Sie wissen müssen</h1>
				<p class="subtitle">Einbauküchen richtig demontieren, Geräte sicher abklemmen und am neuen Standort fachgerecht montieren</p>
				<p class="author-byline">Von Alex Aust, Geschäftsführer bei Aust Umzüge</p>
			</header>

			<div class="guide-intro">
				<p>
					Die Küche ist das teuerste und komplizierteste Möbelstück in den meisten Haushalten.
					Eine Einbauküche für 8.000 Euro lässt sich in vier Stunden abbauen – und in vier
					schlechten Stunden dauerhaft beschädigen. <strong>Der häufigste und teuerste Fehler</strong>
					passiert nicht beim Transport, sondern davor: Wer Spülmaschine oder Waschmaschine
					unsachgemäß abklemmt, riskiert am neuen Standort einen Wasserschaden – und eine
					Hausratversicherung, die nicht zahlt.
				</p>
			</div>

			<div class="article-content">
				<section>
					<h2>Der unterschätzte Risikofaktor: Wasser vor dem Umzug</h2>
					<p>
						Spülmaschinen, Waschmaschinen und Geschirrspüler haben Restwasser in Schläuchen,
						Pumpen und Laugenbehältern – auch wenn der letzte Spülgang Stunden zurückliegt.
						Wer diese Geräte einfach abklemmt, transportiert und anschließt, riskiert, dass
						dieses Restwasser beim Anschluss unkontrolliert austritt.
					</p>
					<p>
						Das eigentliche Problem: <strong>Viele Hausratversicherungen schließen Wasserschäden aus,
						die durch unsachgemäßen Anschluss entstehen</strong> – und „unsachgemäß" beginnt oft
						schon beim Abklemmen. Ein nasses Laminat im neuen Wohnzimmer, ein durchfeuchteter
						Kellerboden beim Nachbarn – solche Schäden können schnell fünfstellig werden.
					</p>
					<div class="tip-box">
						<strong>Wichtig:</strong> Lassen Sie Spülmaschine und Waschmaschine von einem Fachbetrieb
						ab- und wieder anklemmen. Der Aufwand beträgt 30–45 Minuten pro Gerät. Die Alternative
						bei einem Schaden ist deutlich teurer – und die Versicherung fragt im Schadensfall
						gezielt nach, wer den Anschluss vorgenommen hat.
					</div>

					<h3>So entleeren Sie Geräte vor dem Transport richtig</h3>
					<p>
						Wenn Sie die Abklemmarbeiten selbst vornehmen, gibt es einen Mindeststandard,
						der Schäden deutlich reduziert:
					</p>
					<ul>
						<li><strong>Spülmaschine:</strong> Letzten Spülgang mit leerem Innenraum und heißem Wasser durchführen. Anschließend die Filtersiebeeinheit herausnehmen und trocken schütteln. Zu- und Ablaufschlauch abklemmen und senkrecht halten – nie waagerecht transportieren.</li>
						<li><strong>Waschmaschine:</strong> Schleudergang ohne Wäsche laufen lassen. Ablaufschlauch in einen Eimer führen und manuell entleeren. Transportsicherungen, sofern noch vorhanden, wieder einsetzen – ohne sie kann die Trommel beim Transport beschädigt werden.</li>
						<li><strong>Geschirrspüler mit Warmwasseranschluss:</strong> Beide Schläuche absperren, bevor sie abgezogen werden. Restdruck am Schlauch durch kurzes Öffnen des Hahns ablassen.</li>
					</ul>
				</section>

				<section>
					<h2>Einbauküche abbauen: Was geht selbst, was nicht</h2>
					<p>
						Nicht jede Küche ist gleich – und nicht jeder Abbauschritt ist gleich riskant.
						Eine realistische Einschätzung, was Laien tun können und wo Fachwissen gefragt ist:
					</p>

					<h3>Das können Sie in der Regel selbst</h3>
					<ul>
						<li>Oberschränke und Wandschränke abhängen (Dübellöcher zuvor prüfen)</li>
						<li>Schubladeneinsätze und Auszüge demontieren</li>
						<li>Sockelsleisten und Blenden entfernen</li>
						<li>Hängeschienen lösen</li>
						<li>Kleines Mobiliar und freistehende Elemente zerlegen</li>
					</ul>

					<h3>Hier sollten Sie auf Profis setzen</h3>
					<ul>
						<li><strong>Arbeitsflächen aus Naturstein (Granit, Marmor, Quarzkomposit):</strong> Diese Platten sind schwer, spröde und brechen bei falscher Unterstützung durch. Ein Bruch ist irreparabel. Mindestens zwei Personen mit Saug­hebern und Kantenschutz – oder ein Fachbetrieb.</li>
						<li><strong>Eingebundene Spülen:</strong> Unterfahrspülen und eingeklebte Auflagespülen sind mit Silikon oder Montagekleber befestigt. Ohne das richtige Werkzeug reißen Sie die Arbeitsfläche oder den Unterschrank mit heraus.</li>
						<li><strong>Elektrogeräte mit 400V-Anschluss:</strong> Herd, Backofen und Ceranfeld laufen häufig auf Drehstrom. Das Abklemmen ist nicht lebens­gefährlich, wenn der Sicherungskasten korrekt abgesichert ist – aber ohne Kenntnisse ist die Fehlerquote hoch.</li>
						<li><strong>Dunstabzugshauben mit Mauerkanal:</strong> Der Mauerkanal ist oft eingemörtelt oder durch eine Wand geführt. Falsch demontiert entstehen Löcher, die Sie beim Auszug teuer bezahlen.</li>
					</ul>

					<div class="tip-box">
						<strong>Tipp aus der Praxis:</strong> Fotografieren Sie jeden Schritt des Abbaus –
						besonders Kabelführungen, Wasseranschlüsse und die Reihenfolge, in der Schränke
						hängen. Diese Fotos sind beim Wiederaufbau unbezahlbar, wenn die Montagefirma
						(oder Sie selbst) nicht dabei war.
					</div>
				</section>

				<section>
					<h2>Küche transportieren: Was beim Verladen wirklich schiefgeht</h2>
					<p>
						Die meisten Transportschäden an Küchen entstehen nicht durch grobe Unachtsamkeit,
						sondern durch drei vermeidbare Fehler.
					</p>

					<h3>Fehler 1: Fronten und Türen nicht demontiert</h3>
					<p>
						Küchenfronten sind meistens die teuersten Einzelteile einer Einbauküche.
						Hochglanzlacke, Holzfurniere und bedruckte Glas­fronten kratzen bei jeder
						Berührung. <strong>Alle Türen und Schubladen vor dem Transport demontieren
						und separat in Decken einwickeln</strong> – nie im montierten Zustand transportieren.
					</p>

					<h3>Fehler 2: Korpusse stehend statt liegend geladen</h3>
					<p>
						Küchenkorpusse aus Spanplatte sind in Stehposition stabil – nicht beim
						Kippen. Wer einen 80er-Unterschrank hochkant auf die Ladefläche legt, riskiert
						ausgerissene Dübel und gebrochene Rückwände. <strong>Korpusse immer flach
						lagern, Öffnungen nach oben, und mit Spanngurten sichern.</strong>
					</p>

					<h3>Fehler 3: Arbeitsplatten ohne Kantenschutz</h3>
					<p>
						Laminatarbeitsplatten brechen an den Kanten – besonders an den bereits
						gesägten Ausschnitten für Spüle und Herd. Jede Ecke bekommt einen
						Kantenschutz aus Schaumstoff oder Pappe, bevor die Platte auf dem
						Fahrzeug liegt. Natursteinplatten transportieren Sie grundsätzlich
						hochkant auf Weichschaum, niemals flach.
					</p>
				</section>

				<section>
					<h2>Küchenmontage am neuen Standort: Der häufig unterschätzte Aufwand</h2>
					<p>
						Den Abbau unterschätzen die meisten – den Wiederaufbau unterschätzen fast alle.
						Was Sie beim Einbau an neuem Standort einplanen sollten:
					</p>

					<h3>Wände und Boden zuerst prüfen</h3>
					<p>
						Neue Küchen­wände sind selten gerade. Bevor der erste Schrank hängt, prüfen Sie
						mit der Wasserwaage, ob Boden und Wand eben sind. <strong>Eine schiefe Küche
						lässt sich nicht nachträglich korrigieren</strong> – alle Schränke müssen von
						Anfang an auf der gleichen Höhe beginnen. Bodenbelag und Sockelleiste der
						neuen Wohnung schützen Sie mit Klebeband vor Kratzern.
					</p>

					<h3>Dübel, Wasseranschluss, Strom – in dieser Reihenfolge</h3>
					<p>
						Hängen Sie zuerst alle Oberschränke, bevor die Unterschränke stehen –
						sonst müssen Sie über die Arbeitsplatte hinwegarbeiten. Verlegen Sie
						dann die Unterschränke und richten Sie sie aus. <strong>Erst wenn alle
						Korpusse sitzen, kommen Wasseranschluss und Elektro</strong> – nicht
						umgekehrt, sonst montieren Sie zweimal.
					</p>

					<h3>Wann ein Profi beim Aufbau Pflicht ist</h3>
					<p>
						Manche Küchen sind nach dem Umzug nicht mehr identisch aufzubauen:
						Wenn die neue Wohnung einen anderen Grundriss hat, Schränke an neuen
						Positionen sitzen oder neue Bohrungen gesetzt werden müssen, brauchen
						Sie einen <a href="/leistungen/montage">erfahrenen Monteur</a>.
						Auch bei Natursteinarbeitsplatten, fest verdrahteten Elektrogeräten
						und Gasherden ist der Profi gesetzlich vorgeschrieben oder haftungsrechtlich
						notwendig.
					</p>

					<div class="tip-box">
						<strong>Kosten der Küchenmontage:</strong> Ein erfahrener Monteur benötigt
						für eine durchschnittliche Einbauküche (10–12 Schränke, Spüle, Herd) etwa
						4–6 Stunden. Hinzu kommt die Anschlusszeit für Wasser und Elektro. Planen
						Sie realistisch: Ein Küchentag mit Profis ist gut investiertes Geld –
						verglichen mit den Kosten einer beschädigten Natursteinplatte oder einem
						Wasserschaden beim Erstbetrieb.
					</div>
				</section>

				<section>
					<h2>Sonderfall: Einbauküche mitnehmen oder zurücklassen?</h2>
					<p>
						Eine Frage, die viele Mieter beschäftigt – und die rechtlich klarer ist,
						als viele denken.
					</p>

					<h3>Was gehört wem?</h3>
					<p>
						<strong>Einbauküchen, die Sie selbst auf eigene Kosten eingebaut haben,
						dürfen Sie mitnehmen</strong> – auch wenn sie „fest eingebaut" sind.
						Voraussetzung: Sie hinterlassen die Wohnung im gleichen Zustand wie beim
						Einzug. Das bedeutet: Dübellöcher schließen, Wasseranschlüsse sorgfältig
						verschließen, Elektroanschlüsse fachgerecht kappen.
					</p>
					<p>
						<strong>Küchen, die im Mietvertrag als Bestandteil der Wohnung aufgeführt
						oder vom Vermieter gestellt wurden</strong>, verbleiben in der Wohnung.
						Hier kommt es auf den Einzelfall an – im Zweifel lohnt sich eine kurze
						Rückfrage beim Vermieter, bevor der Abbau beginnt.
					</p>

					<h3>Küche verkaufen statt mitnehmen</h3>
					<p>
						Nicht jede Küche lässt sich in eine andere Wohnung übertragen – andere
						Grundrisse, andere Maße, andere Elektroanschlüsse. Manchmal ist der
						Wiederverkauf an den Nachmieter oder über eine Kleinanzeige die bessere
						Entscheidung: Sie sparen Abbau-, Transport- und Montagekosten und bekommen
						einen fairen Preis für eine gepflegte Einbauküche.
					</p>
				</section>

				<section>
					<h2>Checkliste: Küche beim Umzug – von Planung bis Erstbetrieb</h2>

					<div class="checklist-grid">
						<div class="checklist-block">
							<h3>2–3 Wochen vorher</h3>
							<ul>
								<li>Grundriss der neuen Küche aufzeichnen – passen alle Schränke?</li>
								<li>Monteur oder Küchenservice buchen, falls nötig</li>
								<li>Herd- und Wasseranschlüsse der neuen Wohnung prüfen (Gas? Drehstrom? 1-Phasen?)</li>
								<li>Fotos aller aktuellen Anschlüsse, Kabelführungen und Schrankreihenfolgen machen</li>
								<li>Halteverbotszone beantragen falls nötig</li>
							</ul>
						</div>
						<div class="checklist-block">
							<h3>Tag vor dem Umzug</h3>
							<ul>
								<li>Spülmaschine: Leergang, Filter heraus, Restwasser entleeren</li>
								<li>Waschmaschine: Schleudergang, Ablaufschlauch leeren, Transportsicherung rein</li>
								<li>Kühlschrank: leer, Tür 24h offen – niemals mit Restwasser transportieren</li>
								<li>Türen und Schubfronten abmontieren, in Decken einwickeln</li>
								<li>Sockelblenden und Abdeckleisten lösen</li>
							</ul>
						</div>
						<div class="checklist-block">
							<h3>Am Umzugstag</h3>
							<ul>
								<li>Oberschränke zuerst, Unterschränke zuletzt</li>
								<li>Korpusse flach lagern, Öffnungen nach oben</li>
								<li>Arbeitsplatten hochkant (Naturstein) oder flach mit Kantenschutz</li>
								<li>Eingebaute Geräte separat und polsternd verpacken</li>
							</ul>
						</div>
						<div class="checklist-block">
							<h3>Am neuen Standort</h3>
							<ul>
								<li>Wand- und Bodenebene prüfen (Wasserwaage)</li>
								<li>Oberschränke hängen, bevor Unterschränke stehen</li>
								<li>Wasseranschluss und Elektro erst nach Korpusmontage</li>
								<li>Spülmaschine/Waschmaschine vom Fachbetrieb anklemmen lassen</li>
								<li>Erstbetrieb aller Geräte im Beisein – Leckagen sofort erkennen</li>
							</ul>
						</div>
					</div>
				</section>

				<section>
					<h2>Häufig gestellte Fragen</h2>

					<h3>Kann ich meine Einbauküche beim Umzug selbst abbauen?</h3>
					<p>
						Ja, Schränke und Blenden können Sie in der Regel selbst demontieren.
						Bei Wasseranschlüssen, 400V-Elektro­geräten, Natursteinarbeitsplatten
						und eingemörtelten Dunstabzügen empfehlen wir Fachleute – nicht wegen
						der Schwierigkeit, sondern wegen des Schadenpotenzials bei Fehlern.
					</p>

					<h3>Was kostet es, eine Küche professionell ab- und aufzubauen?</h3>
					<p>
						Eine vollständige Küchendemontage und -montage durch einen erfahrenen
						Monteur liegt je nach Küchengröße und Ausstattung zwischen 400 und 1.200 Euro.
						Hinzu kommen Anschlussarbeiten für Wasser und Elektro. Das klingt nach viel –
						bis man es gegen eine zerbrochene Granitplatte (ab 800 Euro) oder einen
						Wasserschaden (Trockenlegung ab 2.000 Euro) rechnet.
					</p>

					<h3>Wie transportiere ich eine Granitarbeitsplatte sicher?</h3>
					<p>
						Granitplatten transportieren Sie immer hochkant – niemals flach liegend,
						da sie ohne Unterstützung durch das Eigengewicht brechen können.
						Weichschaummatten unter der Platte und an beiden Seiten. Mindestens zwei
						Personen, bei langen Platten drei. Saugheber erleichtern das Handling erheblich.
					</p>

					<h3>Muss ich die Küche bei einem Mieterwechsel zurücklassen?</h3>
					<p>
						Nur wenn sie im Mietvertrag als Bestandteil der Wohnung geführt wird oder
						vom Vermieter gestellt wurde. Eine auf eigene Kosten eingebaute Küche
						dürfen Sie mitnehmen – müssen aber den Originalzustand der Wohnung
						(Dübellöcher, Anschlüsse) wiederherstellen.
					</p>

					<h3>Wer klemmt Spülmaschine und Waschmaschine beim Umzug ab?</h3>
					<p>
						Viele Umzugsunternehmen bieten das als Zusatzleistung an – oder koordinieren
						einen Installateur. Bei uns übernehmen wir die Koordination: Wasser- und
						Elektroanschlüsse werden fachgerecht getrennt und am neuen Standort
						korrekt hergestellt, bevor die erste Maschine läuft.
					</p>
				</section>

				<section>
					<h2>Fazit: Die Küche ist kein normales Umzugsgut</h2>
					<p>
						Wer eine Einbauküche umzieht, bewegt kein Möbelstück – er bewegt
						ein kleines Gewerk. Wasseranschlüsse, Elektroleitungen, Natursteinplatten
						und empfindliche Fronten erfordern mehr Sorgfalt als jedes andere
						Möbelstück im Haushalt.
					</p>
					<ul>
						<li><strong>Wasser zuerst:</strong> Spülmaschine und Waschmaschine vollständig entleeren und fachgerecht abklemmen – Wasserschäden am neuen Ort sind das teuerste Umzugsrisiko.</li>
						<li><strong>Dokumentieren:</strong> Fotos vor dem Abbau sparen beim Aufbau Stunden.</li>
						<li><strong>Fronten demontieren:</strong> Was nicht transportiert wird, kann nicht kratzen.</li>
						<li><strong>Naturstein hochkant:</strong> Granitplatten liegend zu transportieren ist die häufigste Ursache für irreparable Brüche.</li>
						<li><strong>Profi für Anschlüsse:</strong> Der Installateur beim Auf- und Abbau kostet wenig – im Vergleich zu dem, was ein Leck anrichtet.</li>
					</ul>
					<p>
						Wenn Sie Unterstützung beim Küchenabbau, Transport oder der Montage
						am neuen Standort brauchen, hilft unser <a href="/leistungen/montage">Montageservice</a>
						weiter. Für den gesamten Umzug stehen wir Ihnen mit einem
						<a href="/leistungen/privatumzug">Festpreisangebot nach Besichtigung</a> zur Seite.
					</p>
				</section>
			</div>

			<CTASection
				heading="Küche beim Umzug in guten Händen"
				description="Küchenabbau, Transport und Montage am neuen Standort – wir koordinieren alles aus einer Hand, inklusive fachgerechtem Wasseranschluss."
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
		max-width: 900px;
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

	.guide-header {
		text-align: center;
		margin-bottom: var(--space-8);
	}

	.icon-wrapper {
		display: inline-flex;
		padding: var(--space-4);
		background-color: #fff7ed;
		color: #c2410c;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-4);
	}

	h1 {
		font-size: clamp(2rem, 4vw, 2.5rem);
		color: var(--color-info-bar);
		font-weight: 700;
		margin-bottom: var(--space-2);
		line-height: 1.2;
	}

	.subtitle {
		font-size: 1.25rem;
		color: #1a202c;
		margin: 0;
	}

	.author-byline {
		color: #64748b;
		font-size: var(--text-sm);
		margin-top: var(--space-2);
	}

	.guide-intro {
		background-color: #f8fafc;
		border-left: 4px solid var(--color-info-bar);
		padding: var(--space-6);
		margin-bottom: var(--space-10);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
	}

	.guide-intro p {
		color: #1a202c;
		font-size: 1.125rem;
		line-height: 1.7;
		margin: 0;
	}

	.article-content {
		color: #1a202c;
		line-height: 1.8;
	}

	.article-content section {
		margin-bottom: var(--space-12);
	}

	.article-content h2 {
		color: var(--color-info-bar);
		font-size: 1.75rem;
		font-weight: 700;
		margin-top: var(--space-10);
		margin-bottom: var(--space-6);
		padding-bottom: var(--space-3);
		border-bottom: 2px solid var(--color-nav-accent);
	}

	.article-content h3 {
		color: var(--color-info-bar);
		font-size: 1.375rem;
		font-weight: 600;
		margin-top: var(--space-8);
		margin-bottom: var(--space-4);
	}

	.article-content p {
		margin-bottom: var(--space-4);
		font-size: 1.0625rem;
		color: #1a202c;
	}

	.article-content ul {
		margin-bottom: var(--space-6);
		padding-left: var(--space-6);
	}

	.article-content li {
		margin-bottom: var(--space-2);
		font-size: 1.0625rem;
	}

	.article-content strong {
		color: var(--color-info-bar);
		font-weight: 600;
	}

	.article-content a {
		color: #c44100;
		text-decoration: underline;
		font-weight: 500;
	}

	.article-content a:hover {
		color: #b93d00;
	}

	.tip-box {
		background-color: #fff7ed;
		border-left: 4px solid #f59e0b;
		padding: var(--space-5);
		margin: var(--space-6) 0;
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
	}

	.tip-box strong {
		color: #92400e;
	}

	.checklist-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-6);
		margin: var(--space-6) 0;
	}

	.checklist-block {
		background-color: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: var(--radius-md);
		padding: var(--space-5);
	}

	.checklist-block h3 {
		color: var(--color-info-bar);
		font-size: 1rem;
		font-weight: 700;
		margin-top: 0;
		margin-bottom: var(--space-3);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.checklist-block ul {
		padding-left: var(--space-4);
		margin-bottom: 0;
	}

	.checklist-block li {
		font-size: 0.9375rem;
		margin-bottom: var(--space-2);
		color: #374151;
	}

	@media (max-width: 640px) {
		.checklist-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
