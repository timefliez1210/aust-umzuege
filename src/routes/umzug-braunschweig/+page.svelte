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
		{ name: "Umzug Braunschweig" }
	]);

	const faqs = [
		{
			question: "Fahren Sie auch nach Braunschweig?",
			answer: "Ja, regelmäßig. Braunschweig liegt rund 45 Kilometer von unserem Standort in Hildesheim entfernt – eine Strecke, die wir in beide Richtungen gut kennen. Ob Umzug von Braunschweig nach Hildesheim, innerhalb Braunschweigs oder von Braunschweig in eine andere Stadt: Wir sind dabei."
		},
		{
			question: "Was kostet ein Umzug in Braunschweig?",
			answer: "Das lässt sich ohne Besichtigung nicht seriös beantworten. Die Kosten hängen von Wohnungsgröße, Stockwerk, Entfernung und Leistungsumfang ab. Wir kommen kostenlos zu Ihnen, schauen uns alles an und machen dann ein verbindliches Festpreisangebot – ohne Nachberechnungen."
		},
		{
			question: "Was bedeutet Festpreisgarantie genau?",
			answer: "Der Preis, den wir Ihnen nach der Besichtigung schriftlich nennen, ist der Preis, den Sie zahlen. Nicht mehr – auch wenn der Umzug länger dauert, eine Etage mehr Aufwand macht oder wir mehr Verpackungsmaterial brauchen als kalkuliert. Diese Klarheit ist uns wichtig, weil wir wissen, wie stressig ein Umzugstag ohnehin ist."
		},
		{
			question: "Kümmern Sie sich um die Halteverbotszone in Braunschweig?",
			answer: "Ja. Wir beantragen die Halteverbotszone beim Ordnungsamt der Stadt Braunschweig, stellen die Schilder auf und räumen sie wieder ab. Besonders in dicht bebauten Stadtteilen wie dem Ringgebiet oder der Weststadt ist das oft entscheidend für einen reibungslosen Ablauf."
		},
		{
			question: "Ich ziehe zum ersten Mal um – was muss ich wissen?",
			answer: "Wir begleiten Sie durch alles. Bei der kostenlosen Besichtigung erklären wir Ihnen, was wie verpackt wird, was Sie selbst tun können und wo wir das Steuer übernehmen. Viele unserer Kunden machen ihren ersten richtigen Umzug mit uns – danach wissen sie genau, warum ein professionelles Team den Unterschied macht."
		},
		{
			question: "Kann ich Teile des Umzugs selbst erledigen?",
			answer: "Natürlich. Viele Kunden packen ihre persönlichen Sachen selbst und lassen uns Möbel, Küche und schwere Gegenstände übernehmen. Das reduziert die Kosten und Sie behalten die Kontrolle über Ihre persönlichen Sachen. Wir stellen uns auf Ihren Bedarf ein."
		},
		{
			question: "Was passiert, wenn beim Transport etwas zu Schaden kommt?",
			answer: "Wir arbeiten sorgfältig – aber für den Fall der Fälle ist Ihr Inventar über unsere Transport- und Betriebshaftpflichtversicherung abgesichert. Schäden werden dokumentiert und geregelt. Sie sind nicht auf dem Trockenen."
		},
		{
			question: "Wie lange im Voraus muss ich buchen?",
			answer: "Vier bis sechs Wochen Vorlauf sind gut. Samstage im Sommer und an Monatsenden sind am schnellsten ausgebucht. Kurzfristige Anfragen nehmen wir trotzdem entgegen – melden Sie sich, wir schauen, was möglich ist."
		}
	];
</script>

<MetaTags
	title="Umzugsfirma Braunschweig – Zuverlässig, Professionell & Festpreis | Aust Umzüge"
	description="Umzug in Braunschweig mit Festpreisgarantie: sorgfältiger Transport, Möbelmontage, Halteverbotszone – alles aus einer Hand. Kostenlose Vor-Ort-Besichtigung, keine Überraschungen."
	keywords="Umzugsfirma Braunschweig, Umzug Braunschweig, Privatumzug Braunschweig, Wohnungsumzug Braunschweig, zuverlässige Umzugsfirma Braunschweig, Umzug Braunschweig Festpreis, seriöse Umzugsfirma Braunschweig"
	canonical="https://www.aust-umzuege.de/umzug-braunschweig"
	ogType="website"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.umzugBraunschweig} />
<StructuredData schema={breadcrumbs} />

<main class="service-detail">
	<div class="service-detail__container">

		<header class="service-header">
			<div class="icon-wrapper">
				<Home size={48} strokeWidth={1.5} />
			</div>
			<h1 class="service-title">Umzugsfirma Braunschweig</h1>
			<p class="service-subtitle">
				Sorgfältig, zuverlässig, Festpreis. Auf der Strecke Hildesheim–Braunschweig seit Jahren zu Hause.
			</p>
		</header>

		<div class="service-content">
			<div class="text-column">
				<h2 class="section-title">Ihr Umzug in Braunschweig – professionell von Anfang bis Ende</h2>
				<p>
					Braunschweig ist eine Stadt, in der viel bewegt wird. Studierende, die zum ersten Mal eine eigene Wohnung beziehen. Familien, die mehr Platz brauchen. Menschen, die in den Ruhestand gehen und verkleinern. Und Berufstätige, die für einen neuen Job den Standort wechseln.
				</p>
				<p>
					Für jeden dieser Umzüge gilt dasselbe: Ein guter Dienstleister macht den Unterschied zwischen einem stressigen Tag und einem, an den man sich kaum erinnert – weil alles einfach lief.
				</p>
				<p>
					Wir kommen von Hildesheim, rund 45 Kilometer entfernt. Diese Strecke ist für uns kein Sonderfall, sondern Alltag. Wir kennen Braunschweig, seine Stadtteile und die typischen Herausforderungen vor Ort. Bevor wir ein Angebot machen, kommen wir zu Ihnen – kostenlos und unverbindlich.
				</p>

				<h3 class="highlight-title">Unsere Leistungen für Ihren Braunschweig-Umzug:</h3>
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
						<span>Halteverbotszone in Braunschweig – Beantragung und Aufstellung inklusive</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Transport- und Haftpflichtversicherung für Ihr gesamtes Inventar</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Zwischenlagerung bei Renovierung oder Lieferlücke</span>
					</li>
				</ul>

				<h2 class="section-title" style="margin-top: var(--space-16);">Was einen guten Umzug ausmacht</h2>
				<p>
					Viele Umzüge fangen mit einem Telefonangebot an. Der Preis klingt gut. Am Umzugstag kommen mehr oder weniger Leute als erwartet, das Team kennt die Adresse nicht, und am Ende steht eine Rechnung, die höher ist als besprochen. Das ist kein seltenes Muster – es ist ein verbreitetes Problem in der Branche.
				</p>
				<p>
					<strong>Deshalb machen wir das anders:</strong> Kein Angebot ohne Besichtigung. Kein Festpreis ohne vollständige Kalkulation. Keine Überraschungen am Ende.
				</p>
				<p>
					Wir besichtigen Ihren Haushalt persönlich – in Braunschweig, kostenlos. Wir schauen, was umzieht, wo es knifflig wird und was Sie sich wünschen. Dann schicken wir Ihnen ein schriftliches Angebot. Was dort steht, gilt. Punkt.
				</p>

				<h2 class="section-title" style="margin-top: var(--space-16);">Stadtteile in Braunschweig – was beim Umzug relevant ist</h2>
				<p>
					Braunschweig hat eine heterogene Bebauung. Was in einem Stadtteil problemlos geht, kann im nächsten eine echte Herausforderung sein.
				</p>
				<p>
					<strong>Innenstadt und Östliches Ringgebiet:</strong> Typische Gründerzeit- und Nachkriegsbebauung. Oft enge Treppenhäuser, begrenzte Parkmöglichkeiten, kein Aufzug. Eine Halteverbotszone ist hier fast immer sinnvoll.
				</p>
				<p>
					<strong>Weststadt und Lehndorf:</strong> Durchmischte Wohnbebauung mit Vor- und Gartenhäusern aus verschiedenen Epochen. Häufig mehr Platz zum Rangieren, aber Zugänge variieren stark.
				</p>
				<p>
					<strong>Stöckheim und Rüningen:</strong> Neuere Bebauung, oft mit Aufzug. Hier läuft vieles flüssiger – dafür sind Wohnungen oft größer und der Umzug umfangreicher.
				</p>
				<p>
					<strong>Gliesmarode und Querum:</strong> Ruhige Wohnlagen, viele Einfamilienhäuser. Gut zugänglich, aber Gartenmöbel, Werkzeugkeller und Dachböden erfordern eigene Planung.
				</p>
				<p>
					Wir besichtigen deshalb jeden Auftrag vor Ort – weil Karten lügen und Erfahrungswerte nicht für jedes Haus gelten.
				</p>

				<h2 class="section-title" style="margin-top: var(--space-16);">So läuft Ihr Umzug ab</h2>
				<p>
					<strong>1. Erstes Gespräch</strong><br>
					Sie melden sich per Telefon, Mail oder über unser Angebotsformular. Wir antworten am selben Tag.
				</p>
				<p>
					<strong>2. Kostenlose Besichtigung in Braunschweig</strong><br>
					Wir kommen zu Ihnen. Wir schauen uns an, was mitgenommen wird, wo es eng werden könnte und was Sie benötigen. Das dauert etwa 30 bis 45 Minuten.
				</p>
				<p>
					<strong>3. Schriftliches Festpreisangebot</strong><br>
					Sie erhalten Ihr Angebot binnen ein bis zwei Tagen per Mail. Vollständig, klar, verbindlich.
				</p>
				<p>
					<strong>4. Vorbereitung</strong><br>
					Wir beantragen Halteverbotszone, bringen Verpackungsmaterial und schützen Türrahmen und Treppenhäuser.
				</p>
				<p>
					<strong>5. Umzugstag</strong><br>
					Einpacken, abbauen, verladen, transportieren, entladen, aufbauen. Erst wenn Sie zufrieden sind, ist der Tag für uns beendet.
				</p>

				<h3 class="highlight-title">Verwandte Leistungen</h3>
				<p>
					Wenn die neue Wohnung erst nach dem Auszug bezugsfertig ist, bieten wir <a href="/leistungen/lagerung">kurz- oder mittelfristige Zwischenlagerung</a> an. Für Küchen, Einbauschränke und komplexe Möbelsysteme ist unser <a href="/leistungen/montage">Montage-Team</a> direkt dabei. Und wer noch nie umgezogen ist und nicht weiß, wo er anfangen soll, startet am besten mit einer <a href="/leistungen/umzugsberatung">kostenlosen Umzugsberatung</a>.
				</p>
			</div>

			<div class="cta-column">
				<ServiceReviews reviews={[
					{
						author: "Jan-Luca Jendrossek",
						text: "Super Umzugsservice! Das Team von Aust Umzüge war pünktlich, freundlich und sehr sorgfältig mit unseren Möbeln. Der gesamte Umzug lief reibungslos und deutlich stressfreier als erwartet. Vielen Dank für den tollen Service, klare Weiterempfehlung!",
						url: "https://share.google/dnrprN9jk4ujJdKCD"
					},
					{
						author: "Isa Sit",
						text: "Ich bin vollends begeistert von dem Service von Aust Umzüge. Ich habe diesmal meinen Umzug in andere (professionelle) Hände gegeben und werde mich beim nächsten wieder an Aust wenden. Die Absprachen waren unkompliziert und einfach, die Beratung kompetent und ich konnte mich völlig auf das Unternehmen verlassen. Die Mitarbeiter vor Ort waren freundlich, zugewandt und strahlten eine vollkommene Ruhe aus, die man an einem solch hektischen Tag braucht.",
						url: "https://share.google/M03sVYvwkXTlrSvUK"
					},
					{
						author: "Nicole Stein",
						text: "Klare Weiterempfehlung! Herr Aust und sein Team haben den Umzug meiner Mutter in eine betreute Wohnung wunderbar gemacht. Sehr hilfsbereit, zuverlässig und schnell. Die Kommunikation mit Herrn Aust war auch hervorragend. Kann ich uneingeschränkt weiterempfehlen!",
						url: "https://maps.app.goo.gl/Dy1aFNHwmrhYvE4v7"
					}
				]} />
				<div class="cta-box">
					<h3>Umzug in Braunschweig planen?</h3>
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
