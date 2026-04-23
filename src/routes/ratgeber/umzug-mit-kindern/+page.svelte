<script lang="ts">
	import CTASection from "$lib/components/CTASection.svelte";
	import MetaTags from "$lib/components/MetaTags.svelte";
	import StructuredData from "$lib/components/StructuredData.svelte";
	import { articles, howToUmzugMitKindern, createBreadcrumbs } from "$lib/data/structuredData";

	const breadcrumbs = createBreadcrumbs([
		{ name: "Home", url: "https://www.aust-umzuege.de/" },
		{ name: "Ratgeber", url: "https://www.aust-umzuege.de/ratgeber" },
		{ name: "Umzug mit Kindern" }
	]);
</script>

<MetaTags
	title="Umzug mit Kindern – So gelingt der Neuanfang als Familie | Aust Umzüge"
	description="Umzug mit Kindern richtig planen: Wie Sie Kinder je nach Alter auf einen Wohnungswechsel vorbereiten, den Schulwechsel meistern und den Abschied von Freunden begleiten."
	keywords="Umzug mit Kindern, Umzug mit Kleinkind, Schulwechsel Hildesheim, Umzug Kinder beteiligen, Kinder Umzug vorbereiten, Umzug Familie"
	canonical="https://www.aust-umzuege.de/ratgeber/umzug-mit-kindern"
	ogType="article"
/>

<StructuredData schema={articles.umzugMitKindern} />
<StructuredData schema={howToUmzugMitKindern} />
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
						<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
						<circle cx="9" cy="7" r="4"></circle>
						<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
						<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
					</svg>
				</div>
				<h1>Umzug mit Kindern – So meistert Ihre Familie den Wohnungswechsel</h1>
				<p class="subtitle">Altergerechte Vorbereitung, Abschiedsrituale und Tipps für den Schulwechsel in Hildesheim</p>
				<p class="author-byline">Von Alex Aust, Geschäftsführer und Vater bei Aust Umzüge</p>
			</header>

			<div class="guide-intro">
				<p>
					Für Erwachsene ist ein Umzug schon eine große Herausforderung. Für Kinder ist
					es oft noch mehr: <strong>Ihr ganzes Universum verschiebt sich.</strong> Der
					geliebte Kletterbaum im Garten, die beste Freundin von nebenan, das
					vertraute Zimmer mit den Höhlen an der Wand – all das bleibt zurück.
					In diesem Ratgeber erfahren Sie, wie Sie Kinder je nach Alter auf einen
					Umzug vorbereiten, den Abschied von liebgewonnenen Orten begleiten und den
					Start in der neuen Stadt zu einem Erlebnis machen.
				</p>
			</div>

			<div class="article-content">
				<section>
					<h2>Warum ein Umzug für Kinder anders ist als für Erwachsene</h2>
					<p>
						Kinder erleben ihren Lebensraum als festen Rahmen, der Sicherheit gibt.
						<strong>Wohnung, Kindergarten, Spielplatz und Nachbarschaft</strong> bilden ein
						Netz aus vertrauten Orten und Personen. Ein Umzug reißt dieses Netz auf –
						auch wenn die neuen Verhältnisse objektiv „besser" sind.
					</p>
					<p>
						Eltern sehen oft die Vorteile: mehr Platz, bessere Lage, größerer Garten.
						Kinder sehen primär das, was sie verlieren: den besten Freund, das Ritual
						mit Oma um die Ecke, das Lieblingsversteck. Das ist kein Trotz, sondern
						<strong>wirklicher Verlust</strong>, der Trauer und Wut auslösen darf.
					</p>
					<p>
						Wir begleiten Familien seit Jahren bei Umzügen in und um Hildesheim
						und sehen immer wieder: Je besser die emotionale Vorbereitung gelingt,
						desto schneller fühlen sich Kinder in der neuen Umgebung zu Hause.
						Der Umzugstag selbst ist dabei oft gar nicht das größte Problem –
						es ist die Zeit davor und danach.
					</p>
				</section>

				<section>
					<h2>Wann und wie erzählen Sie es Ihrem Kind?</h2>
					<p>
						Der richtige Zeitpunkt und die Art, wie Sie die Nachricht überbringen,
						prägen das gesamte Gefühl zum Umzug.
					</p>
					<ul>
						<li>
							<strong>Bei Kleinkindern (unter 3):</strong> Erklären Sie erst kurz vor
							dem Umzug – zu frühes Wissen erzeugt nur Unsicherheit. Nutzen Sie
							einfache Bilder: „Wir fahren mit unseren Sachen in ein neues Haus,
							das auch schön ist."
						</li>
						<li>
							<strong>Im Kindergartenalter (3–6):</strong> Drei bis vier Wochen Vorlauf
							sind ideal. Zu früh erzeugt Angst, zu spät fühlt es sich wie eine
							Überrumpelung an. Erklären Sie konkret, was sich ändert und was
							bleibt: „Dein Bett kommt mit. Deine Kuscheltiere auch."
						</li>
						<li>
							<strong>Grundschulkinder (6–10):</strong> Nehmen Sie das Kind mindestens
							sechs Wochen vorher in Vertrauen. Das Gefühl, gehört zu werden,
							senkt Widerstand massiv.
						</li>
						<li>
							<strong>Teenager (ab 10):</strong> Je älter, desto früher. Zehn bis zwölf Wochen
							Vorlauf sind nicht zu viel. Teenager brauchen Zeit für Abschiedsrituale
							und das Aufrechterhalten von Freundschaften.
						</li>
					</ul>
					<div class="tip-box">
						<strong>Wichtig:</strong> Erzählen Sie es nicht als schlechte Nachricht.
						Düsteres Gesicht und „Das wird schon schwer für dich" verstärken Angst.
						Bleiben Sie sachlich-freundlich: „Wir ziehen um, und wir machen das
						zusammen gut." Kinder nehmen die emotionale Bewertung der Eltern als Maßstab.
					</div>
				</section>

				<section>
					<h2>Altergerechte Vorbereitung: Was bei jedem Stadium hilft</h2>

					<h3>Kleinkinder (1–3 Jahre) – Sicherheit durch Vertrautes</h3>
					<p>
						Kleinkinder verstehen kaum, was „Umzug" bedeutet. Was sie merken:
						Papa und Mama sind gestresst, Kisten stehen überall. Packen Sie das
						Kinderzimmer <strong>zuletzt</strong> und lassen Sie Plüschtiere
						<strong>nie in Kisten</strong> verschwinden – sie fahren im Auto mit.
						Essens- und Schlafenszeiten bleiben gleich, egal wie chaotisch es wird.
					</p>

					<h3>Kindergartenalter (4–6 Jahre) – Spielerisch verstehen</h3>
					<p>
						In diesem Alter ist Fantasie stark ausgeprägt. Nutzen Sie sie:
						zeichnen Sie gemeinsam die neue Wohnung, basteln Sie ein Karton-Haus
						für Kuscheltiere, besuchen Sie den neuen Spielplatz schon vorher.
						Lassen Sie das Kind seinen Umzugskarton selbst bemalen – das schafft
						<strong>Zugehörigkeit statt Ohnmacht</strong>.
					</p>

					<h3>Grundschulkinder (7–10 Jahre) – Mitmachen statt mitgemacht werden</h3>
					<p>
						Grundschulkinder wollen <strong>Teilhabe</strong>, nicht nur Bescheid
						wissen. Lassen Sie das Kind sein neues Zimmer planen, Etiketten aufkleben
						und die Zimmerliste abhaken. Bei Schulwechsel: gemeinsam die neue Schule
						besichtigen – <strong>am besten vor dem Einzug</strong>.
					</p>

					<h3>Teenager (11–18 Jahre) – Respekt vor ihrem Netzwerk</h3>
					<p>
						Für Teenager sind Freunde oft Familienersatz und der Verein ist Identität.
						Ein Umzug wird als Bedrohung empfunden – nicht wegen der Wohnung,
						sondern wegen der <strong>sozialen Verluste</strong>. Helfen Sie beim
						Aufrechterhalten von Kontakten, suchen Sie neue Angebote gemeinsam vorab
						aus und nehmen Sie Wut und Trauer ernst – auch wenn sie scharf formuliert ist.
					</p>
				</section>

				<section>
					<h2>Schulwechsel in Hildesheim: Das müssen Sie beachten</h2>
					<p>
						Wenn Kinder die Schule wechseln, ist das der emotional schwierigste
						Teil eines Umzugs. Eine frühe Auseinandersetzung mit der Bürokratie
						erspart Stress.
					</p>

					<h3>Anmeldefristen und Unterlagen</h3>
					<p>
						Die Anmeldung läuft über das <strong>Schulamt der Stadt
						Hildesheim</strong> oder direkt bei der Wunschschule. Unterlagen:
					</p>
					<ul>
						<li>Meldebescheinigung der neuen Wohnung</li>
						<li>Zeugnis des aktuellen halben oder ganzen Schuljahrs</li>
						<li>Versetzungsbescheinigung der alten Schule</li>
						<li>Impfpass und Gesundheitszeugnis (bei Kitawechsel)</li>
						<li>Sorgerechtserklärung, falls nicht beide Elternteile anmelden</li>
					</ul>
					<div class="tip-box">
						<strong>Tipp aus der Praxis:</strong> Melden Sie Ihr Kind frühzeitig an –
						<strong>idealerweise vor den Sommerferien</strong>. Kurz vor Schulbeginn
						sind viele Schulen bereits voll und die Klassenauswahl begrenzt.
					</div>

					<h3>Besondere Herausforderungen</h3>
					<ul>
						<li>
							<strong>Grundschulwechsel:</strong> Hildesheim hat
							Grundschuleinzugsgebiete. Wohnen Sie außerhalb des
							Wunschgebietes, brauchen Sie eine „Begrenzte Empfehlung"
							vom Schulamt. Laufen Sie das früh an.
						</li>
						<li>
							<strong>Weiterführende Schulen:</strong> Bei Umzug innerhalb
							Niedersachsens ist der Schulformwechsel meist unproblematisch,
							bei Umzug aus einem anderen Bundesland kann es zu
							Anpassungsprüfungen kommen.
						</li>
						<li>
							<strong>Inklusion:</strong> Hat Ihr Kind ein Förderkonzept,
							informieren Sie <strong>früh beide Schulen</strong>.
							Der Übergang muss nahtlos sein.
						</li>
					</ul>
					<p>
						<a href="https://www.hildesheim.de/Bildung-Schule/">Weitere Infos zum Schulsystem Hildesheim</a>
					</p>
				</section>

				<section>
					<h2>Abschied gestalten: Warum das wichtiger ist als der Umzugtag</h2>
					<p>
						Viele Eltern vernachlässigen den Abschied, weil sie ihn vermeiden
						möchten. Aber ein nicht gelebter Abschied wird zu einem
						stillen Trauma, das nachts im neuen Zimmer hochkommt.
					</p>
					<ul>
						<li>
							<strong>Abschiedsrundgang:</strong> Gehen Sie mit dem Kind die
							wichtigsten Orte noch einmal durch: Spielplatz, Eisdiele,
							Kindergarten, der Lieblingsbaum. Fotos machen, Erinnerungen festhalten.
						</li>
						<li>
							<strong>Abschiedsfest:</strong> Für die drei bis vier
							wichtigsten Freunde. Pizza, Telefonnummern tauschen, Abschiedsbriefe.
						</li>
						<li>
							<strong>Erinnerungskiste:</strong> Steine vom Spielplatz,
							Zweig vom Lieblingsbaum, Klassenfoto. Dinge, die man anfassen
							kann, wenn das Heimweh kommt.
						</li>
						<li>
							<strong>Symbolische Übergabe:</strong> Rituelle Handlungen
							helfen Kleinkindern, den Schlussstrich zu ziehen:
							„Wir übergeben jetzt das Schlüsselkindsein an das nächste Kind.
							Du bist jetzt das große Kind im neuen Haus."
						</li>
					</ul>
					<p>
						Trauer ist kein Fehler. Wenn Ihr Kind weint, weinen Sie mit.
						Das sagt nicht „der Umzug war ein Fehler", sondern „dein Schmerz
						ist mir wichtig". Das gibt dem Kind die Kraft, weiterzumachen.
					</p>
				</section>

				<section>
					<h2>Der Umzugstag selbst: So bleiben Kinder stabil</h2>
					<p>
						Der Umzugstag ist für Erwachsene logistisch stressig. Für Kinder
						ist er emotional zerreißend, wenn sie das Chaos nicht verstehen.
						Planen Sie bewusst:
					</p>
					<ul>
						<li>
							<strong>Rückzugsort:</strong> Egal ob bei Oma, beim besten
							Freund oder im abgesperrten Kinderzimmer bis zuletzt – Kinder
							brauchen einen Ort, an dem kein fremder Mann mit Kisten steht.
						</li>
						<li>
							<strong>Erste-Hilfe-Box fürs Kind:</strong> Snacks, Trinken,
							Lieblingsbuch, Spielzeug, Ladekabel für Tablet. Diese Kiste
							kommt <strong>als Letztes raus und als Erstes rein</strong>.
						</li>
						<li>
							<strong>Das neue Zimmer zuerst:</strong> Beim Auspacken
							priorisieren Sie das Kinderzimmer. Ein aufgebautes Bett,
							Lieblingstiere auf dem Kissen und das vertraute Nachtlicht
							machen den ersten Abend erträglich.
						</li>
						<li>
							<strong>Routine sofort wiederherstellen:</strong> Gleiches
							Essen, gleiche Schlafenszeit, gleiche Gutenachtgeschichte –
							<strong>seit dem ersten Tag</strong>. Ausnahmen machen den
							Umzug nicht besser, sie machen ihn nur unübersichtlicher.
						</li>
					</ul>
					<div class="tip-box">
						<strong>Hinweis:</strong> Wenn Sie selbst Umzug machen mit
						Hilfe von Freunden, ist der Stress oft höher als bei einem
						Profiteam, das strukturiert arbeitet. Kinder spüren den Stress
						der Eltern – ein reibungsloser Ablauf beruhigt die ganze Familie.
						<a href="/ratgeber/umzugs-checkliste">Unsere Checkliste hilft</a>.
					</div>
				</section>

				<section>
					<h2>Ankommen in der neuen Stadt: Integration Schritt für Schritt</h2>
					<p>
						Der erste Monat ist entscheidend. Was Sie in den ersten Wochen tun,
						prägt das Gefühl der neuen Stadt für Jahre.
					</p>
					<ul>
						<li>
							<strong>Woche 1 – Sicherheit:</strong> Nichts Neues erfinden.
							Gleiche Routinen, gleiche Essen, gleiche Bettzeiten. Kinder
							brauchen <strong>Zeit, um zu begreifen, dass das neue Haus
							tatsächlich ihr Zuhause ist</strong>. Noch kein Druck,
							Freunde zu finden oder den Verein zu wechseln.
						</li>
						<li>
							<strong>Woche 2 – Entdecken:</strong> Gemeinsam den Stadtteil
							erkunden: der nächste Spielplatz, die nächste Eisdiele,
							die nächste Bücherei. Nicht alles auf einmal – ein Ort pro Tag.
						</li>
						<li>
							<strong>Woche 3 – Soziale Kontakte:</strong> In Hildesheim gibt
							es zahlreiche Angebote: die <strong>Jugendfreizeiteinrichtungen</strong>,
							Sportvereine, die Musikschule, die Stadtbibliothek mit
							Kinderangeboten. Schauen Sie sich online um und besuchen
							Sie zusammen ein Schnuppertraining.
						</li>
						<li>
							<strong>Woche 4 – Zurück in die alte Stadt:</strong>
							Wenn möglich, besuchen Sie ein Wochenende lang die alte
							Stadt. Nicht als „Rückkehr", sondern als Brückebauen.
							Kinder merken dann: Die alten Freunde sind nicht weg,
							sie sind nur woanders.
						</li>
					</ul>
				</section>

				<section>
					<h2>Schwierige Sonderfälle: Scheidung, Zwangsumzug, häufige Umzüge</h2>

					<h3>Umzug nach Trennung oder Scheidung</h3>
					<p>
						Trennungsumzüge sind doppelt belastend: Das Kind verliert nicht nur
						das Zuhause, sondern auch die Alltagspräsenz eines Elternteils.
						<strong>Stabilität ist hier wichtiger als Optimierung:</strong>
					</p>
					<ul>
						<li>Wenn möglich, bleibt der Schul- oder Kitaweg gleich – Trennung UND Schulwechsel sind zu viel.</li>
						<li>Beide Elternteile sollten beim Einzug dabei sein, auch wenn nur einer umzieht.</li>
						<li>Neue Wohnung so schnell wie möglich mit vertrauten Gegenständen einrichten – nicht perfekt, sondern vertraut.</li>
					</ul>

					<h3>Zwangsumzug wegen Jobwechsel oder Wohnungskündigung</h3>
					<p>
						Wenn der Umzug unvermeidlich ist und der Druck von außen kommt,
						fühlen sich Kinder hilflos. Gib dem Kind Entscheidungsmacht
						in kleinen Dingen: „Wir <strong>müssen</strong> umziehen, aber
						<strong>du darfst</strong> entscheiden, welche Wandfarbe dein Zimmer
						bekommt."
					</p>

					<h3>Häufige Umzüge (Jobnomaden, militärische Familien)</h3>
					<p>
						Kinder, die alle ein bis zwei Jahre umziehen, entwickeln oft eine
						„Wurzellosigkeit". Das kann flexibel machen, aber auch
						bindungsunsicher. Legen Sie bewusst <strong>Anker</strong>:
						Wiederkehrende Rituelle (gleiche Kissen, gleiche Gutenachtgeschichte),
						digitale Kontakte zu alten Freunden und bewusste Entscheidungen,
						wo es länger möglich ist zu bleiben.
					</p>
				</section>

				<section>
					<h2>Häufig gestellte Fragen</h2>

					<h3>Wie früh sollte man Kindern vom Umzug erzählen?</h3>
					<p>
						Kleinkinder erst eine Woche vorher, Kindergartenkinder drei bis vier
						Wochen vorher, Grundschulkinder sechs Wochen und Teenager zehn bis
						zwölf Wochen. Je älter, desto mehr Zeit brauchen sie für
						mentale Vorbereitung und Abschiedsrituale.
					</p>

					<h3>Soll das Kind beim Umzug dabei sein?</h3>
					<p>
						<strong>Nur, wenn es will.</strong> Kinder unter sechs profitieren
						meist davon, den Umzugstag bei Großeltern oder Freunden zu verbringen.
						Ab der Grundschule können viele Kinder dabei sein, wenn ein
						Rückzugsort garantiert ist. Teenager sollten beteiligt werden –
						sie fühlen sich sonst entmündigt.
					</p>

					<h3>Was tun, wenn das Kind sich weigert umzuziehen?</h3>
					<p>
						Das ist bei Teenagern normal, bei jüngeren Kindern ein Warnsignal.
						Hören Sie genau hin: Was genau ist das Problem? Ist es die Schule,
						bestimmte Freunde, die Angst vor der neuen Stadt? Adressieren Sie
						<strong>den konkreten Punkt</strong>, nicht den Umzug insgesamt.
						Berufsberatung, Jugendamt oder schulpsychologischer Dienst
						können bei hartnäckigem Widerstand unterstützen – das ist kein
						Versagen der Eltern.
					</p>

					<h3>Wie kann man Freundschaften über den Umzug hinweg retten?</h3>
					<p>
						Setzen Sie auf regelmäßigen Kontakt: Videochats alle zwei Wochen,
						Besuche in den Ferien, gemeinsame Chatgruppen. Bei jüngeren
						Kindern helfen Briefe und Bilder: „Ich male dir, wie mein
						neues Zimmer aussieht." Das hält die Beziehung lebendig, ohne
						dass sie auf die Distanz festgelegt ist.
					</p>

					<h3>Wie lange dauert es, bis sich ein Kind eingewöhnt hat?</h3>
					<p>
						Regelbasiert: <strong>Ein Monat pro Lebensjahr</strong>. Ein
						Fünfjähriger braucht etwa fünf Monate, bis er sich wirklich
						heimisch fühlt. Ein Teenager kann ein bis anderthalb Jahre
						brauchen. Drängen Sie nicht. Kinder, die sich eingewöhnt
						fühlen müssen, fühlen sich fremd – länger.
					</p>
				</section>

				<section>
					<h2>Fazit: Ein Umzug mit Kindern ist kein Logistikproblem – er ist ein Gefühlsthema</h2>
					<p>
						Wenn Sie als Eltern eines mitnehmen, dann das hier: Kinder brauchen
						<strong>nicht den perfekten Umzug</strong>. Sie brauchen Eltern,
						die ihre Angst ernst nehmen, den Abschied respektieren und den
						Neuanfang gemeinsam gestalten.
					</p>
					<ul>
						<li>
							<strong>Erzählen Sie früh und positiv,</strong> aber nicht aufdringlich.
							Ein Umzug ist keine Feier – aber auch kein Drama.
						</li>
						<li>
							<strong>Nach Alter vorbereiten:</strong> Kleinkinder brauchen
							Konstanz, Teenager brauchen Entscheidungsmacht.
						</li>
						<li>
							<strong>Abschied leben:</strong> Ohne Abschied kein Neuanfang.
							Erinnerungskisten, Abschiedsfeste und gemeinsames Weinen
							sind therapeutisch.
						</li>
						<li>
							<strong>Schule früh klären:</strong> Anmeldung, Unterlagen,
							Evtl. Förderbedarf – je früher, desto reibungsloser.
						</li>
						<li>
							<strong>Erster Monat ohne Druck:</strong> Routine aufbauen,
							nicht perfektionieren. Die neuen Freunde kommen von allein,
							wenn das Kind sicher ist.
						</li>
					</ul>
					<p>
						In Hildesheim und Umgebung begleiten wir Familien seit Jahren bei
						Umzügen. Was wir gelernt haben: Ein gelingender Familienumzug ist
						keiner, bei dem nichts kaputt geht. Es ist einer, bei dem die
						Kinder am Abend des Einzugstags in einem aufgebauten Bett einschlafen
						und wissen: <strong>„Hier bin ich zu Hause – auch wenn es noch
						anders riecht."</strong>
					</p>
				</section>
			</div>

			<CTASection
				heading="Umzug mit Kindern in Hildesheim?"
				description="Wir helfen Familien seit Jahren beim stressfreien Umzug – mit Erfahrung, Geduld und einem Team, das weiß, wie wichtig Routine und Rücksichtnahme sind."
				buttonText="Unverbindliches Beratungsgespräch"
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
		background-color: #fef2f2;
		color: #dc2626;
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
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: var(--space-3);
	}

	.cons h4 {
		color: #991b1b;
		font-size: 1.125rem;
		font-weight: 600;
		margin-bottom: var(--space-3);
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

	@media (max-width: 640px) {
		.pros-cons {
			grid-template-columns: 1fr;
		}
	}
</style>
