<script lang="ts">
	import { ArrowLeft, Home } from 'lucide-svelte';
	import CTASection from "$lib/components/CTASection.svelte";
</script>

<svelte:head>
	<title
		>Haushaltsauflösungen und Entrümpelungen - Praktischer Ratgeber | Aust Umzüge</title
	>
	<meta
		name="description"
		content="Praktischer Ratgeber für Haushaltsauflösungen: Tipps zu Herausforderungen, Transport (PKW vs. Transporter), Entsorgungsmöglichkeiten und realistischer Zeitplanung."
	/>
	<meta
		name="keywords"
		content="Haushaltsauflösungen, Entrümpelungen, Hildesheim, Niedersachsen, Wertstoffhof, Sperrmüll"
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
					<Home size={48} strokeWidth={1.5} />
				</div>
				<h1>Haushaltsauflösungen und Entrümpelungen</h1>
				<p class="subtitle">Praktischer Ratgeber für die komplette Wohnungsräumung</p>
			</header>

			<div class="guide-intro">
				<p>
					Du stehst vor einer Haushaltsauflösung? Mit der richtigen Planung und
					diesen praktischen Tipps wird die Entrümpelung deutlich entspannter. Von der
					Zeitplanung über Transport bis zur Entsorgung – hier erfährst du alles Wichtige.
				</p>
			</div>

			<div class="article-content">
				<section>
					<h2>Wenn die Wohnung geräumt werden muss – So meisterst du die Herausforderung</h2>
					<p>
						Du stehst vor einer Haushaltsauflösung? Dann weißt du vermutlich
						schon: Das ist keine Kleinigkeit. Ob nach einem Todesfall, vor einem
						Umzug ins Altersheim, bei einer Trennung oder einfach, weil sich über
						die Jahre zu viel angesammelt hat – eine Entrümpelung ist immer eine
						emotionale und körperliche Herausforderung. Aber keine Sorge: Mit der
						richtigen Planung und ein paar praktischen Tipps wird die Sache
						deutlich entspannter.
					</p>
					<p>
						Besonders in größeren Häusern mit Keller und Dachboden sammelt sich
						über Jahrzehnte eine Menge an. Lass uns gemeinsam durchgehen, worauf
						du achten solltest.
					</p>
				</section>

				<section>
					<h2>Die größten Herausforderungen bei einer Haushaltsauflösung</h2>

					<h3>Zeit – der unterschätzte Faktor</h3>
					<p>
						Die meisten Menschen verschätzen sich komplett, wie lange eine
						Haushaltsauflösung dauert. Eine Drei-Zimmer-Wohnung? "Schaffen wir an
						einem Wochenende", denken viele. Die Realität sieht anders aus.
					</p>
					<p>
						Rechne realistisch mit <strong>mindestens einer Woche</strong> für eine
						durchschnittliche Wohnung, wenn du es nebenher machst. Bei einem ganzen
						Haus mit Keller und Dachboden können es auch schnell zwei bis drei Wochen
						werden. Warum dauert das so lange?
					</p>
					<p>
						<strong>Jeder Gegenstand muss durch deine Hände:</strong> Ist das wertvoll?
						Kann das weg? Wer könnte das gebrauchen? Soll ich das behalten? Diese Entscheidungen
						kosten Zeit – und Kraft. Besonders bei Haushaltsauflösungen nach einem
						Todesfall kommen die Emotionen dazu. Jedes Foto, jeder Brief, jede Kaffeetasse
						weckt Erinnerungen.
					</p>

					<h3>Sortieren, sortieren, sortieren</h3>
					<p>Das eigentliche Ausräumen ist nur die halbe Miete. Die größere Herausforderung ist das Sortieren:</p>
					<ul>
						<li><strong>Behalten:</strong> Was hat emotionalen oder materiellen Wert?</li>
						<li><strong>Verkaufen:</strong> Was ist noch gut und bringt vielleicht Geld?</li>
						<li><strong>Spenden:</strong> Was können andere noch gebrauchen?</li>
						<li><strong>Entsorgen:</strong> Was muss zum Wertstoffhof oder in den Müll?</li>
					</ul>
					<p>
						Diese vier Kategorien solltest du von Anfang an strikt trennen. Am
						besten richtest du dir gleich verschiedene Bereiche oder Boxen ein.
						Sonst steht am Ende wieder alles durcheinander.
					</p>

					<h3>Die körperliche Belastung</h3>
					<p>
						Unterschätz nicht, wie anstrengend so eine Entrümpelung ist. Möbel
						schleppen, Kisten tragen, Treppen rauf und runter – nach ein paar
						Stunden merkst du Muskeln, von denen du nicht wusstest, dass du sie
						hast.
					</p>
					<p>
						Besonders in Altbauten mit schmalen Treppenhäusern und ohne Aufzug
						wird jedes Möbelstück zur Herausforderung. Und der alte Kleiderschrank
						aus Eiche wiegt definitiv mehr als du denkst.
					</p>
				</section>

				<section>
					<h2>Eigenes Auto vs. Transporter mieten – Was macht wirklich Sinn?</h2>
					<p>
						Diese Frage stellen sich viele zu Beginn. Lass uns die Optionen
						ehrlich durchgehen.
					</p>

					<h3>Mit dem eigenen PKW</h3>
					<div class="pros-cons">
						<div class="pros">
							<h4>Vorteile:</h4>
							<ul>
								<li>Keine Mietkosten</li>
								<li>Du kannst spontan fahren, wann immer du möchtest</li>
								<li>Kein Stress mit Abgabe- und Rückgabezeiten</li>
								<li>Keine Kaution nötig</li>
							</ul>
						</div>
						<div class="cons">
							<h4>Nachteile:</h4>
							<ul>
								<li>Du brauchst <strong>viel mehr Fahrten</strong>. Was mit einem Transporter in zwei Touren erledigt ist, bedeutet mit dem PKW zehn bis fünfzehn Fahrten</li>
								<li>Sperrige Möbel passen einfach nicht rein</li>
								<li>Der Benzinverbrauch summiert sich schnell</li>
								<li>Zeitverschwendung: Ständig hin und her fahren kostet Nerven</li>
								<li>Dein Auto wird dreckig (Staub, Kratzer)</li>
							</ul>
						</div>
					</div>
					<p>
						Rechne mal realistisch: Vom Wohnort zum Wertstoffhof und zurück sind
						je nach Entfernung schnell 20-30 Minuten. Bei zehn Fahrten bist du
						<strong>fünf Stunden nur unterwegs</strong> – ohne die Zeit zum Be- und
						Entladen.
					</p>

					<h3>Transporter mieten</h3>
					<div class="pros-cons">
						<div class="pros">
							<h4>Vorteile:</h4>
							<ul>
								<li>Alles passt rein: Möbel, Kartons, Elektrogeräte</li>
								<li>Deutlich <strong>weniger Fahrten</strong> (meist zwei bis drei reichen)</li>
								<li>Zeitersparnis: Was du an Miete zahlst, holst du an Zeit zurück</li>
								<li>Professionelle Ausstattung (Zurrgurte, Decken)</li>
								<li>Einfaches Be- und Entladen auf einer Höhe</li>
							</ul>
						</div>
						<div class="cons">
							<h4>Nachteile:</h4>
							<ul>
								<li>Mietkosten (ab ca. 50-80 Euro pro Tag)</li>
								<li>Gewöhnungsbedürftig zu fahren (besonders in engen Straßen)</li>
								<li>Tanken musst du selbst</li>
								<li>Zeitfenster für Abholung und Rückgabe</li>
							</ul>
						</div>
					</div>

					<div class="tip-box">
						<strong>Unser Tipp aus der Praxis:</strong> Ab einer Zwei-Zimmer-Wohnung
						lohnt sich der Transporter fast immer. Rechne nicht nur die reinen Kosten,
						sondern auch <strong>deine Zeit</strong>. Wenn du zwei Tage Urlaub nehmen
						musst statt einem – was ist das wert?
					</div>
				</section>

				<section>
					<h2>Wohin mit all den Sachen? Entsorgung und Abgabe</h2>
					<p>
						Eine der häufigsten Fragen: "Wo kann ich das alles hinbringen?" Hier
						der praktische Überblick über deine Möglichkeiten.
					</p>

					<h3>Wertstoffhof und Recyclinghöfe</h3>
					<p>
						In Hildesheim findest du mehrere Wertstoffhöfe, die fast alles
						annehmen:
					</p>
					<p><strong>Was wird angenommen:</strong></p>
					<ul>
						<li>Elektrogeräte (Kühlschränke, Waschmaschinen, Fernseher)</li>
						<li>Holz und Holzmöbel</li>
						<li>Metalle</li>
						<li>Bauschutt (bei Renovierungen)</li>
						<li>Grünabfall</li>
						<li>Sperrmüll</li>
					</ul>
					<p><strong>Wichtig zu wissen:</strong></p>
					<ul>
						<li>Bring deinen Personalausweis mit (Nachweis, dass du aus Hildesheim kommst)</li>
						<li>Manche Sachen sind kostenlos, für andere fallen Gebühren an</li>
						<li>Öffnungszeiten beachten (meist nur bis nachmittags, samstags kürzer)</li>
						<li>Am Samstag ist immer viel los – geh lieber unter der Woche</li>
					</ul>
					<div class="tip-box">
						<strong>Profi-Tipp:</strong> Ruf vorher an und frag, ob spezielle Gegenstände
						(z.B. Gasflaschen, Farben, Chemikalien) angenommen werden. Nicht alles
						darf in den normalen Wertstoffhof.
					</div>

					<h3>Sperrmüll-Abholung</h3>
					<p>
						Die Stadt Hildesheim bietet Sperrmüll-Abholungen an. Du meldest dich
						an, gibst an was raus soll, und es wird abgeholt.
					</p>
					<p><strong>Vorteile:</strong></p>
					<ul>
						<li>Bequem, du musst nichts selbst fahren</li>
						<li>Für Menschen ohne Auto ideal</li>
					</ul>
					<p><strong>Nachteile:</strong></p>
					<ul>
						<li>Begrenzte Menge</li>
						<li>Wartezeit (oft mehrere Wochen)</li>
						<li>Nur bestimmte Sachen erlaubt</li>
						<li>Du musst alles zur Straße bringen</li>
					</ul>
					<p>
						Bei einer kompletten Haushaltsauflösung reicht die reguläre
						Sperrmüll-Abholung meist nicht aus.
					</p>

					<h3>Sozialkaufhäuser und Spenden</h3>
					<p>
						Nicht alles muss in den Müll! Es gibt viele Anlaufstellen für gut
						erhaltene Sachen.
					</p>
					<p><strong>Sozialkaufhäuser:</strong></p>
					<ul>
						<li>Nehmen Möbel, Hausrat, Kleidung, Bücher</li>
						<li>Holen bei größeren Mengen auch ab</li>
						<li>Helfen Menschen mit kleinem Budget</li>
						<li>Du bekommst oft eine Spendenbescheinigung</li>
					</ul>
				</section>

				<section>
					<h2>Zeit und Planung – Der Schlüssel zum Erfolg</h2>
					<p>
						Eine Haushaltsauflösung ist ein Projekt. Und wie jedes Projekt braucht
						es einen Plan.
					</p>

					<h3>Realistische Zeitplanung</h3>
					<p><strong>Woche 1: Sichtung und Sortierung</strong></p>
					<ul>
						<li>Raum für Raum durchgehen</li>
						<li>Grobe Kategorien bilden</li>
						<li>Wertsachen sichern</li>
						<li>Dokumente sammeln</li>
					</ul>

					<p><strong>Woche 2: Entsorgung und Verkauf</strong></p>
					<ul>
						<li>Anzeigen online stellen</li>
						<li>Wertstoffhof-Touren</li>
						<li>Sozialkaufhaus kontaktieren</li>
						<li>Sperrmüll anmelden</li>
					</ul>

					<p><strong>Woche 3: Endspurt</strong></p>
					<ul>
						<li>Möbel ausräumen</li>
						<li>Renovierung (falls nötig)</li>
						<li>Endreinigung</li>
						<li>Schlüsselübergabe</li>
					</ul>

					<p>
						Das ist ein straffer Plan für eine durchschnittliche Wohnung. Bei
						größeren Objekten oder wenn du berufstätig bist, plan lieber vier bis
						sechs Wochen ein.
					</p>

					<h3>Hilfe holen ist keine Schwäche</h3>
					<p>
						Viele denken: "Das schaffe ich alleine." Aber ehrlich: Warum solltest
						du?
					</p>
					<p>
						<strong>Familie und Freunde einspannen</strong> macht die Sache nicht
						nur schneller, sondern auch erträglicher. Pack Day machen, Pizza bestellen,
						zusammen durchziehen. Zu zweit trägt sich ein Sofa auch deutlich besser.
					</p>
					<p>
						<strong>Professionelle Entrümpelungsfirmen</strong> kennen sich aus.
						Die wissen genau, was wohin muss, haben die richtigen Transporter und
						erledigen in zwei Tagen, wofür du zwei Wochen bräuchtest.
					</p>
					<p>Ja, das kostet Geld. Aber rechne mal durch:</p>
					<ul>
						<li>Deine Urlaubstage</li>
						<li>Transporter-Miete</li>
						<li>Benzinkosten</li>
						<li>Entsorgungsgebühren</li>
						<li>Deine Nerven und Gesundheit</li>
					</ul>
					<p>
						Oft ist der Unterschied kleiner als gedacht. Und manchmal übernimmt
						bei Erbfällen auch die Nachlassverwaltung die Kosten.
					</p>
				</section>

				<section>
					<h2>Fazit: Mit Plan und realistischen Erwartungen klappt's</h2>
					<p>
						Eine Haushaltsauflösung oder Entrümpelung ist kein Spaziergang – aber
						mit der richtigen Vorbereitung absolut machbar. Die wichtigsten
						Erkenntnisse nochmal zusammengefasst:
					</p>
					<ul>
						<li>
							<strong>Zeit:</strong> Plan mindestens das Doppelte ein, was du ursprünglich
							dachtest. Besser zu viel Puffer als Zeitdruck.
						</li>
						<li>
							<strong>Transport:</strong> Ab einer Zwei-Zimmer-Wohnung lohnt sich der
							Transporter. Deine Zeit ist wertvoll.
						</li>
						<li>
							<strong>Entsorgung:</strong> Nutze die vielen Anlaufstellen – Wertstoffhof,
							Sozialkaufhäuser, Online-Plattformen. Nicht alles muss in den Müll.
						</li>
						<li>
							<strong>Hilfe:</strong> Hol dir Unterstützung, ob von Freunden oder professionell.
							Niemand hat gesagt, dass du das allein schaffen musst.
						</li>
					</ul>
					<p>
						Und noch ein letzter Tipp aus der Praxis: <strong>Fang früh genug an.</strong>
						Wenn du weißt, dass eine Haushaltsauflösung ansteht, schieb's nicht vor
						dir her. Je früher du anfängst, desto entspannter wird die ganze Sache.
					</p>
					<p>
						Du schaffst das! Und wenn du zwischendrin mal nicht weiterweißt – es
						gibt genug Profis, die dir unter die Arme greifen können.
					</p>
				</section>
			</div>

			<CTASection
				heading="Haushaltsauflösung geplant?"
				description="Wir übernehmen die komplette Entrümpelung für dich – von der Sortierung bis zur fachgerechten Entsorgung."
				buttonText="Kostenloses Angebot anfordern"
				buttonHref="/kostenloses-angebot"
				buttonAriaLabel="Kostenloses Angebot für Haushaltsauflösung anfordern"
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
		background-color: #f0f9ff;
		color: var(--color-info-bar);
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

	.article-content h4 {
		color: var(--color-info-bar);
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: var(--space-3);
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

	.pros-cons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-6);
		margin: var(--space-6) 0;
	}

	.pros,
	.cons {
		padding: var(--space-5);
		border-radius: var(--radius-md);
		border: 2px solid #e2e8f0;
	}

	.pros {
		background-color: #f0fdf4;
		border-color: #86efac;
	}

	.cons {
		background-color: #fef2f2;
		border-color: #fca5a5;
	}

	.pros h4 {
		color: #166534;
	}

	.cons h4 {
		color: #991b1b;
	}

	.tip-box {
		background-color: #fff7ed;
		border-left: 4px solid #f59e0b;
		padding: var(--space-5);
		margin: var(--space-6) 0;
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
	}

	@media (max-width: 640px) {
		.pros-cons {
			grid-template-columns: 1fr;
		}
	}
</style>
