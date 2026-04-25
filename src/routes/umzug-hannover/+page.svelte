<script lang="ts">
	import { Home, CheckCircle } from "lucide-svelte";
	import CTAButton from "$lib/components/CTAButton.svelte";
	import MetaTags from "$lib/components/MetaTags.svelte";
	import StructuredData from "$lib/components/StructuredData.svelte";
	import FAQSection from "$lib/components/FAQSection.svelte";
	import ServiceReviews from "$lib/components/ServiceReviews.svelte";
	import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

	const breadcrumbs = createBreadcrumbs([
		{ name: "Home", url: "https://www.aust-umzuege.de/" },
		{ name: "Umzug Hannover" }
	]);

	const faqs = [
		{
			question: "Fahren Sie wirklich bis nach Hannover?",
			answer: "Ja, regelmäßig. Hannover liegt rund 30 Kilometer von unserem Standort in Hildesheim entfernt – das ist für uns kein weiter Weg, sondern ein ganz normaler Auftrag. Wir arbeiten auf dieser Strecke seit Jahren und kennen die typischen Herausforderungen in der Stadt."
		},
		{
			question: "Was kostet ein Umzug in Hannover?",
			answer: "Das hängt von Wohnungsgröße, Stockwerk, Entfernung zwischen Ausgangs- und Zielwohnung sowie dem gewünschten Leistungsumfang ab. Wir kalkulieren erst nach einer kostenlosen Vor-Ort-Besichtigung – dann erhalten Sie ein verbindliches Festpreisangebot. Kein Kleingedrucktes, keine Überraschungen am Umzugstag."
		},
		{
			question: "Was ist der Unterschied zwischen einem Festpreis und einem Stundenpreis?",
			answer: "Bei einem Stundenpreis zahlen Sie, wie lange der Umzug dauert – egal ob der LKW im Stau steht oder das Team länger für eine enge Treppe braucht. Unser Festpreis steht nach der Besichtigung fest. Was wir nennen, ist der Preis, den Sie zahlen. Auch wenn der Umzug mal eine Stunde länger dauert als geplant."
		},
		{
			question: "Übernehmen Sie die Halteverbotszone in Hannover?",
			answer: "Ja. Wir beantragen die Halteverbotszone bei der Straßenverkehrsbehörde der Region Hannover, stellen die Schilder rechtzeitig auf und holen sie nach dem Umzug wieder ab. Das ist in vielen Stadtteilen Hannovers – besonders in der List, der Südstadt oder Linden – fast immer nötig, um direkten Zugang zum Gebäude zu haben."
		},
		{
			question: "Können Sie auch Möbel ab- und wieder aufbauen?",
			answer: "Ja, das gehört bei uns zum Standardservice. Unser Team baut alle gängigen Möbelsysteme fachgerecht ab und am neuen Ort wieder auf – von IKEA bis Massivholzküche. Küchenmon­tage, Schrankwände, Betten: alles aus einer Hand."
		},
		{
			question: "Wie früh muss ich buchen?",
			answer: "Vier bis sechs Wochen Vorlauf sind ideal – besonders Samstage in den Sommermonaten sind schnell vergeben. Bei kurzfristigen Anfragen prüfen wir immer, was möglich ist. Rufen Sie einfach an, wir finden eine Lösung."
		},
		{
			question: "Sind meine Möbel während des Transports versichert?",
			answer: "Ja. Ihr gesamtes Inventar ist während des Transports über unsere Betriebshaftpflicht- und Transportversicherung abgesichert. Das ist ein wesentlicher Vorteil gegenüber einem Umzug in Eigenregie, bei dem Sie für Schäden persönlich haften."
		},
		{
			question: "Kann ich Umzugskosten von der Steuer absetzen?",
			answer: "Bei beruflich bedingten Umzügen ja – als Werbungskosten. Die Umzugskostenpauschale beträgt aktuell 964 Euro pro Person. Auch privat veranlasste Umzüge lassen sich teilweise als haushaltsnahe Dienstleistung geltend machen (20 % der Arbeitskosten, max. 4.000 Euro pro Jahr). Sie erhalten von uns eine ordnungsgemäße Rechnung."
		}
	];
</script>

<MetaTags
	title="Umzugsfirma Hannover – Professionell, Zuverlässig & Festpreis | Aust Umzüge"
	description="Umzug in Hannover mit Festpreisgarantie: professionelles Team, sorgfältiger Transport, Möbelmontage und Halteverbotszone aus einer Hand. Jetzt kostenlos Angebot anfordern."
	keywords="Umzugsfirma Hannover, Umzug Hannover, Privatumzug Hannover, Wohnungsumzug Hannover, zuverlässige Umzugsfirma Hannover, Umzug Hannover Festpreis, seriöse Umzugsfirma Hannover"
	canonical="https://www.aust-umzuege.de/umzug-hannover"
	ogType="website"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.umzugHannover} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
	<div class="service-detail__container">

		<header class="service-header">
			<div class="icon-wrapper">
				<Home size={48} strokeWidth={1.5} />
			</div>
			<h1 class="service-title">Umzugsfirma Hannover</h1>
			<p class="service-subtitle">
				Professionell, zuverlässig, Festpreis. Von Hildesheim aus regelmäßig in der Landeshauptstadt.
			</p>
		</header>

		<div class="service-content">
			<div class="text-column">
				<h2 class="section-title">Ihr Umzug in Hannover – ohne Überraschungen</h2>
				<p>
					Ein Umzug ist eine der aufwendigsten Aktionen im Leben. Nicht wegen der Kisten – sondern wegen allem, was drumherum passiert: Wohnung kündigen, Schule anmelden, Ummeldung, der Vermieter, der noch auf die Übergabe wartet. Zu diesem Moment brauchen Sie kein Team, das Ihnen noch Sorgen macht. Sie brauchen eines, das einfach funktioniert.
				</p>
				<p>
					Wir kommen von Hildesheim – rund 30 Kilometer von Hannover entfernt. Diese Strecke fahren wir regelmäßig, in beide Richtungen. Hannover ist uns nicht fremd. Wir kennen die typischen Herausforderungen: enge Innenhöfe in der Südstadt, Altbauten ohne Aufzug in der List und Vahrenwald, die Parkplatzsituation rund um das Lister Platz-Viertel und Misburg.
				</p>
				<p>
					Was uns von einem x-beliebigen Dienstleister unterscheidet: Wir kommen nach Ihrer Anfrage nicht mit einem Telefonangebot. Wir kommen zu Ihnen. Wir schauen uns an, was Sie haben, wo es eng wird und was Sie sich wünschen. Erst dann machen wir ein Angebot – und das steht dann auch.
				</p>

				<h3 class="highlight-title">Unsere Leistungen für Ihren Hannover-Umzug:</h3>
				<ul class="feature-list">
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Kostenlose Vor-Ort-Besichtigung & verbindliches Festpreisangebot</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Professionelles Ein- und Auspacken auf Wunsch</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Demontage und Montage aller Möbel, Küchen und Einbauschränke</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Beantragung und Aufstellung der Halteverbotszone in Hannover</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Transport- und Haftpflichtversicherung für Ihr gesamtes Inventar</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Zwischenlagerung bei Lieferlücke oder Renovierung</span>
					</li>
				</ul>

				<h2 class="section-title" style="margin-top: var(--space-16);">Warum Hannoveraner uns beauftragen</h2>
				<p>
					Hannover hat viele Umzugsunternehmen. Manche davon sind gut. Andere machen ein günstiges Telefonangebot, erscheinen mit zu wenig Personal und stellen am Ende eine höhere Rechnung als besprochen. Wir arbeiten anders.
				</p>
				<p>
					<strong>Kein Telefonangebot ohne Besichtigung.</strong> Wer Ihren Haushalt nicht gesehen hat, kann ihn nicht seriös kalkulieren. Bei uns kommt jemand zu Ihnen – kostenlos und unverbindlich. Erst dann nennen wir eine Zahl.
				</p>
				<p>
					<strong>Festpreis heißt Festpreis.</strong> Was wir Ihnen nach der Besichtigung nennen, zahlen Sie. Egal ob der Umzug am Ende eine Stunde länger dauert oder eine Etage kniffliger ist als gedacht. Keine Nachberechnungen, kein Kleingedrucktes.
				</p>
				<p>
					<strong>Dasselbe Team, das besichtigt, arbeitet auch.</strong> Wir schicken Ihnen nicht ein Gesicht zur Besichtigung und am Umzugstag kommen Fremde. Herr Aust ist bei jedem Auftrag dabei oder direkt erreichbar.
				</p>

				<h2 class="section-title" style="margin-top: var(--space-16);">Stadtteile in Hannover – was Sie wissen sollten</h2>
				<p>
					Hannover ist keine homogene Stadt. Jeder Stadtteil hat seine eigene Struktur – und damit eigene Herausforderungen beim Umzug.
				</p>
				<p>
					<strong>Linden und Südstadt:</strong> Viele Altbauten mit schmalen Treppenhäusern und kaum Parkmöglichkeiten direkt am Haus. Eine Halteverbotszone ist hier fast immer nötig. Aufzüge sind die Ausnahme, nicht die Regel.
				</p>
				<p>
					<strong>List und Östliche Innenstadt:</strong> Gründerzeithäuser mit breiten Treppenhäusern, aber dichten Parkflächen. Große Möbel kommen in der Regel durch – Planung lohnt sich trotzdem.
				</p>
				<p>
					<strong>Vahrenwald, Ricklingen, Döhren:</strong> Stärker durchmischte Bebauung. Neubauten mit Aufzug wechseln sich mit Bauten der 60er und 70er ab. Hier variiert der Aufwand stark – deshalb besichtigen wir jeden Auftrag vor Ort.
				</p>
				<p>
					<strong>Misburg, Anderten, Lahe:</strong> Ruhigere Wohnlagen, oft Einfamilienhäuser oder Reihenhäuser. Parkfläche in der Regel vorhanden, aber große Gartenmöbel oder Werkzeug brauchen eigene Planung.
				</p>
				<p>
					<strong>Hannover Mitte und Nordstadt:</strong> Dichtes Wohnquartier, enge Straßen, viel Betrieb. Hier ist ein früh beantragtes Halteverbot Gold wert – wir übernehmen das für Sie.
				</p>

				<h2 class="section-title" style="margin-top: var(--space-16);">So läuft Ihr Umzug ab</h2>
				<p>
					<strong>1. Erstes Gespräch</strong><br>
					Sie melden sich per Telefon oder über unser Angebotsformular. Wir melden uns in der Regel am selben Tag zurück und vereinbaren einen Besichtigungstermin.
				</p>
				<p>
					<strong>2. Kostenlose Vor-Ort-Besichtigung</strong><br>
					Wir kommen zu Ihnen – nach Hannover, unverbindlich und kostenlos. Wir schauen uns gemeinsam an, was umzieht, wo es eng werden könnte und welche Leistungen Sie wünschen. Das dauert meist 30 bis 45 Minuten.
				</p>
				<p>
					<strong>3. Festpreisangebot</strong><br>
					Innerhalb von ein bis zwei Tagen erhalten Sie Ihr schriftliches Angebot per Mail. Klar, vollständig und verbindlich.
				</p>
				<p>
					<strong>4. Vorbereitung</strong><br>
					Wir beantragen die Halteverbotszone, bringen Verpackungsmaterial mit und schützen Treppenhäuser und Türrahmen. Bevor der erste Karton bewegt wird, ist alles vorbereitet.
				</p>
				<p>
					<strong>5. Umzugstag</strong><br>
					Einpacken, abbauen, verladen, transportieren, entladen, aufbauen. Systematisch, sorgfältig, pünktlich. Erst wenn Sie sagen „alles gut", ist der Umzug für uns erledigt.
				</p>

				<h3 class="highlight-title">Verwandte Leistungen</h3>
				<p>
					Brauchen Sie eine Zwischenlösung, weil die neue Wohnung noch nicht bezugsfertig ist? Wir bieten <a href="/leistungen/lagerung">sichere Zwischenlagerung</a> mit flexiblen Laufzeiten. Für die Halteverbotszone übernehmen wir alles – von der <a href="/leistungen/halteverbot">Beantragung bis zur Abholung der Schilder</a>. Und wenn Sie sich unsicher sind, was genau Sie brauchen, hilft eine <a href="/leistungen/umzugsberatung">kostenlose Umzugsberatung</a>.
				</p>
			</div>

			<div class="cta-column">
				<ServiceReviews reviews={[
					{
						author: "Luca Wulf",
						text: "Meine Frau und ich haben unseren Umzug mit Aust Umzüge durchführen lassen. Der Umzug verlief reibungslos und außergewöhnlich zügig. Wir sind über 100km weit weg gezogen und es ist beim Transport kein Möbelstück zu schaden gekommen. Wir können Aust Umzüge bedenkenlos weiterempfehlen! Vielen Dank!",
						url: "https://maps.app.goo.gl/qKpZhMhBTjvAdHLu9"
					},
					{
						author: "Bea",
						text: "Ich bin letzte Woche mit Aust Umzüge umgezogen und ich bin absolut begeistert! Das Team war pünktlich, super freundlich und extrem fleißig. Alles wurde sorgfältig und ordentlich eingepackt, abgebaut, transportiert und wieder aufgebaut. Die Jungs haben richtig tolle Arbeit geleistet – schnell, professionell und mit viel Engagement. Ich kann Aust Umzüge wirklich uneingeschränkt weiterempfehlen.",
						url: "https://maps.app.goo.gl/KNcwFdaD9wWhzHZV9"
					},
					{
						author: "Hagen Dittmer",
						text: "Ich habe sehr gute Erfahrungen mit der Firma Aust gemacht. Schnelles unkompliziertes Abchecken des Umzugsvolumens, sehr schnell lag der Kostenvoranschlag vor, Herr Aust war immer schnell zu erreichen, die Möbel wurden sorgfältig verpackt, das Team hat effizient gearbeitet und war sehr freundlich und zuvorkommend. Der Umzug begann pünktlich und blieb im Zeitrahmen.",
						url: "https://maps.app.goo.gl/DtDtuZzKhnRgj8yg9"
					}
				]} />
				<div class="cta-box">
					<h3>Umzug in Hannover planen?</h3>
					<p>Jetzt kostenlose Besichtigung vereinbaren – wir melden uns am selben Tag.</p>
					<div class="cta-button-wrapper">
						<CTAButton
							text="Kostenloses Angebot"
							href="/kostenloses-angebot"
							showArrow={false}
						/>
					</div>
					<div class="divider">oder</div>
					<div class="cta-button-wrapper">
						<CTAButton
							text="Kontakt aufnehmen"
							href="/kontakt"
							showArrow={false}
						/>
					</div>
				</div>
			</div>
		</div>

		<FAQSection {faqs} />
	</div>
</main>

<style>
	.service-detail {
		padding-block: var(--space-12);
		background-color: #fff;
	}

	.service-detail__container {
		max-width: 1000px;
		margin-inline: auto;
		padding-inline: var(--container-padding);
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
		background-color: #fff7ed;
		width: 80px;
		height: 80px;
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-4);
	}

	.service-title {
		color: var(--color-info-bar);
		font-size: clamp(var(--text-3xl), 4vw, var(--text-5xl));
		font-weight: var(--font-bold);
		margin-bottom: var(--space-2);
	}

	.service-subtitle {
		color: #64748b;
		font-size: var(--text-xl);
		max-width: 600px;
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
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		margin-bottom: var(--space-4);
	}

	.text-column p {
		color: #4a5568;
		line-height: 1.7;
		margin-bottom: var(--space-4);
		font-size: var(--text-lg);
	}

	.text-column p strong {
		color: var(--color-info-bar);
	}

	.text-column a {
		color: #c44100;
		text-decoration: underline;
	}

	.highlight-title {
		color: var(--color-info-bar);
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
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
		font-size: var(--text-base);
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
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
		margin-bottom: var(--space-2);
	}

	.cta-box p {
		color: #1a202c;
		margin-bottom: var(--space-6);
	}

	.cta-button-wrapper {
		width: 100%;
	}

	.cta-button-wrapper :global(.cta-button) {
		width: 100%;
		justify-content: center;
	}

	.divider {
		margin: var(--space-3) 0;
		color: #1a202c;
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
