<script lang="ts">
	import { Building2, CheckCircle } from "lucide-svelte";
	import CTAButton from "$lib/components/CTAButton.svelte";
	import MetaTags from "$lib/components/MetaTags.svelte";
	import StructuredData from "$lib/components/StructuredData.svelte";
	import FAQSection from "$lib/components/FAQSection.svelte";
	import ServiceReviews from "$lib/components/ServiceReviews.svelte";
	import { services, businessInfoSlim, createBreadcrumbs } from "$lib/data/structuredData";

	const breadcrumbs = createBreadcrumbs([
		{ name: "Home", url: "https://www.aust-umzuege.de/" },
		{ name: "Firmenumzug Wolfsburg" }
	]);

	const faqs = [
		{
			question: "Wie weit ist Wolfsburg von Ihrem Standort entfernt?",
			answer: "Wolfsburg liegt rund 65 Kilometer von unserem Standort in Hildesheim entfernt – gut erreichbar über die A2 oder A39. Für Firmenumzüge in der Wolfsburger Region planen wir Anfahrt und Logistik von Anfang an mit ein. Kein Aufpreis-Überraschungen, alles im Festpreis."
		},
		{
			question: "Wie minimieren Sie die Ausfallzeit unseres Betriebs?",
			answer: "Durch vorausschauende Planung. Wir erstellen einen detaillierten Ablaufplan, stimmen uns eng mit Ihrem Ansprechpartner ab und führen Firmenumzüge bevorzugt am Wochenende oder außerhalb der Geschäftszeiten durch. Ziel ist, dass Sie am nächsten Werktag wieder voll arbeitsfähig sind. Bei größeren Umzügen setzen wir einen Projektkoordinator ein, der den gesamten Tag steuert."
		},
		{
			question: "Können Sie auch IT-Ausstattung und Server transportieren?",
			answer: "Ja. Computer, Monitore, Server, Netzwerktechnik und Drucker werden fachgerecht demontiert, antistatisch verpackt, sicher transportiert und am neuen Standort wieder angeschlossen. Auf Wunsch koordinieren wir den IT-Transport eng mit Ihrem IT-Verantwortlichen, damit die Systeme so schnell wie möglich wieder laufen."
		},
		{
			question: "Sind Firmenumzugskosten steuerlich absetzbar?",
			answer: "Ja, vollständig als Betriebsausgaben. Das gilt für Transport, Möbelmontage, Halteverbotszone, Verpackungsmaterial und Projektkoordination. Sie erhalten von uns eine detaillierte Rechnung, die Ihre Buchhaltung direkt verarbeiten kann – aufgeschlüsselt nach Leistungsarten."
		},
		{
			question: "Wie gehen Sie mit vertraulichen Unterlagen und sensiblen Daten um?",
			answer: "Vertrauliche Dokumente transportieren wir in versiegelten, nummerierten Behältern – nur autorisierte Personen erhalten Zugriff. Auf Wunsch können sensible Unterlagen von Ihren Mitarbeitern direkt transportiert werden. Unser Team ist in datenschutzkonformem Umgang mit Geschäftsunterlagen geschult."
		},
		{
			question: "Was kostet ein Firmenumzug in Wolfsburg?",
			answer: "Das hängt vom Umfang ab: Anzahl der Arbeitsplätze, zu transportierende IT-Ausstattung, Archivmaterial, Sondermöbel. Ein kleines Büro mit fünf bis zehn Arbeitsplätzen liegt erfahrungsgemäß zwischen 2.000 und 5.000 Euro, größere Standortverlagerungen können mehr kosten. Nach einer kostenfreien Besichtigung erhalten Sie ein verbindliches Festpreisangebot, das Sie sicher budgetieren können."
		},
		{
			question: "Bieten Sie einen persönlichen Projektkoordinator?",
			answer: "Ja. Jeder Firmenumzug erhält einen festen Ansprechpartner von uns: für die Planung, für die Kommunikation mit Ihren Mitarbeitern und für die Regie am Umzugstag selbst. So haben Sie den Kopf frei für Ihr Kerngeschäft."
		},
		{
			question: "Können Sie auch Praxis- oder Ladenumzüge in Wolfsburg durchführen?",
			answer: "Ja. Wir haben Erfahrung mit Arztpraxen, Zahnarztpraxen, Kanzleien und Einzelhandelsgeschäften. Medizinische Geräte, Ladeneinrichtungen und empfindliche Technik transportieren wir fachgerecht. Auch hier planen wir den Umzug so, dass Ihre Ausfallzeit minimal bleibt."
		}
	];
</script>

<MetaTags
	title="Firmenumzug Wolfsburg – Büro & Betrieb | Aust Umzüge"
	description="Professioneller Firmenumzug in Wolfsburg: minimale Ausfallzeit, sicherer IT-Transport, Wochenendservice. Festpreisgarantie nach Besichtigung – für Büros, Praxen und Gewerbebetriebe."
	keywords="Firmenumzug Wolfsburg, Büroumzug Wolfsburg, Betriebsumzug Wolfsburg, Gewerbeumzug Wolfsburg, IT-Umzug Wolfsburg, Firmensitz verlegen Wolfsburg, Büroumzug Wolfsburg Festpreis"
	canonical="https://www.aust-umzuege.de/firmenumzug-wolfsburg"
	ogType="website"
/>

<StructuredData schema={businessInfoSlim} />
<StructuredData schema={services.firmenumzugWolfsburg} />
<StructuredData schema={breadcrumbs} />
<StructuredData schema={{
	"@type": "Review",
	"itemReviewed": { "@id": "https://www.aust-umzuege.de/#organization" },
	"reviewRating": { "@type": "Rating", "ratingValue": 5, "bestRating": 5, "worstRating": 1 },
	"author": { "@type": "Person", "name": "Günther Otto" },
	"datePublished": "2023-03-01",
	"reviewBody": "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc. Selbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Der Preis: unschlagbar. Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich. Mit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe."
}} />

<main class="service-detail">
	<div class="service-detail__container">

		<header class="service-header">
			<div class="icon-wrapper">
				<Building2 size={48} strokeWidth={1.5} />
			</div>
			<h1 class="service-title">Firmenumzug Wolfsburg</h1>
			<p class="service-subtitle">
				Minimale Ausfallzeit. Sichere IT. Festpreis. Für Büros, Praxen und Gewerbebetriebe in der VW-Region.
			</p>
		</header>

		<div class="service-content">
			<div class="text-column">
				<h2 class="section-title">Betriebsumzüge in Wolfsburg – was wirklich zählt</h2>
				<p>
					Wolfsburg ist eine Stadt im Wandel. Unternehmen wachsen, ziehen in neue Flächen, konsolidieren Standorte oder reagieren auf veränderte Anforderungen. Was bei einem Privatumzug Stress bedeutet, bedeutet bei einem Firmenumzug Ausfallzeit – und Ausfallzeit kostet.
				</p>
				<p>
					Wir wissen das. Deshalb arbeiten wir anders als ein Standard-Umzugsunternehmen, das Büroumzüge nebenher macht: mit strukturierter Vorabplanung, einem festen Projektkoordinator und dem ausdrücklichen Ziel, dass Ihr Betrieb am nächsten Werktag wieder vollständig arbeitsfähig ist.
				</p>
				<p>
					Wir kommen von Hildesheim, rund 65 Kilometer entfernt, gut erreichbar über die A2. Für Firmenaufträge planen wir Anfahrt und Logistik von Anfang an ein – transparent und im Festpreis enthalten.
				</p>

				<h3 class="highlight-title">Unsere Leistungen für Ihren Firmenumzug in Wolfsburg:</h3>
				<ul class="feature-list">
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Kostenlose Vor-Ort-Besichtigung & verbindliches Festpreisangebot</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Persönlicher Projektkoordinator für Planung und Umzugstag</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Wochenend- und Nachtservice zur Minimierung der Ausfallzeit</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Fachgerechter IT-Transport – antistatisch verpackt, koordiniert mit Ihrer IT</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Demontage und Montage aller Büromöbel, Trennwände und Küchen</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Transport vertraulicher Unterlagen in versiegelten Behältern</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Halteverbotszone – Beantragung und Aufstellung inklusive</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Detaillierte Rechnung für direkte Verbuchung als Betriebsausgabe</span>
					</li>
				</ul>

				<h2 class="section-title" style="margin-top: var(--space-16);">Was einen professionellen Firmenumzug auszeichnet</h2>
				<p>
					Ein Firmenumzug ist kein größerer Privatumzug. Er hat andere Anforderungen, andere Risiken und andere Erfolgskriterien. Was für Sie zählt, ist nicht, ob eine Pflanze heil ankommt – sondern ob Ihre Mitarbeiter am Montag arbeiten können.
				</p>
				<p>
					<strong>Ausfallzeit ist der teuerste Posten.</strong> Jeder Tag, an dem Ihr Büro nicht produktiv ist, kostet. Deshalb planen wir Firmenumzüge so, dass der eigentliche Umzug außerhalb der Kernarbeitszeiten stattfindet – am Wochenende, nachts oder phasenweise. Wir erstellen einen Ablaufplan, der Ihr Team so wenig wie möglich stört.
				</p>
				<p>
					<strong>IT ist Chefsache.</strong> Server, Netzwerktechnik und Workstations werden von uns antistatisch verpackt, sicher transportiert und am neuen Standort nach Plan wieder aufgestellt. Wir koordinieren das direkt mit Ihrem IT-Verantwortlichen – damit keine Systemkomponente an der falschen Stelle landet.
				</p>
				<p>
					<strong>Festpreis ist keine Zahl, die sich noch ändert.</strong> Wir kalkulieren nach Besichtigung vollständig. Was im Angebot steht, zahlen Sie. Ihre Buchhaltung kann planen, ohne nachzufragen.
				</p>

				<h2 class="section-title" style="margin-top: var(--space-16);">Für welche Unternehmen wir tätig sind</h2>
				<p>
					Wolfsburg ist eine ungewöhnliche Stadt: ein dominanter Arbeitgeber, ein dichtes Netz aus Zulieferern, Dienstleistern und mittelständischen Betrieben – und ein Markt, der sich schnell verändert. Standortentscheidungen werden hier häufiger getroffen als in anderen Regionen.
				</p>
				<p>
					Wir arbeiten für:
				</p>
				<ul class="feature-list">
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Büros und Verwaltungseinheiten jeder Größe</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Arzt- und Zahnarztpraxen sowie Therapiezentren</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Kanzleien, Steuerberatungen und Notariate</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Einzelhandelsgeschäfte und Ladenlokale</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Produktions- und Werkstattbetriebe mit Büroanteil</span>
					</li>
					<li>
						<CheckCircle size={20} class="check-icon" />
						<span>Schulungs- und Seminarräume</span>
					</li>
				</ul>

				<h2 class="section-title" style="margin-top: var(--space-16);">So läuft ein Firmenumzug mit uns ab</h2>
				<p>
					<strong>1. Erstgespräch und Bedarfsanalyse</strong><br>
					Wir hören zu. Was umzieht, was empfindlich ist, was nicht angerührt werden darf und welche Termine eingehalten werden müssen. Erst dann planen wir.
				</p>
				<p>
					<strong>2. Kostenlose Vor-Ort-Besichtigung in Wolfsburg</strong><br>
					Wir kommen zu Ihnen, schauen uns die aktuellen und neuen Räumlichkeiten an und identifizieren potenzielle Engpässe – Treppen, Türbreiten, Aufzüge, Parkflächen, Leitungswege.
				</p>
				<p>
					<strong>3. Detaillierter Ablaufplan und Festpreisangebot</strong><br>
					Sie erhalten einen Zeitplan für den gesamten Umzug sowie ein vollständiges, schriftliches Festpreisangebot. Alles drin, nichts versteckt.
				</p>
				<p>
					<strong>4. Vorbereitung mit Ihrem Team</strong><br>
					Wir liefern auf Wunsch Umzugskisten-Systeme mit Nummernkennzeichnung aus, bereiten Checklisten für Ihre Mitarbeiter vor und koordinieren Zugang und Schlüsselübergabe.
				</p>
				<p>
					<strong>5. Umzugsdurchführung</strong><br>
					Pünktlich, strukturiert, ruhig. Unser Projektkoordinator ist den gesamten Tag vor Ort. Jede Kiste, jeder Schreibtisch, jeder Server landet am richtigen Platz.
				</p>
				<p>
					<strong>6. Abnahme und Übergabe</strong><br>
					Nach Abschluss gehen wir gemeinsam durch. Erst wenn alles stimmt, gilt der Auftrag als erledigt.
				</p>

				<h3 class="highlight-title">Verwandte Leistungen</h3>
				<p>
					Brauchen Sie während der Umbauphase des neuen Standorts eine Zwischenlösung für Mobiliar oder Archivmaterial? Wir bieten <a href="/leistungen/lagerung">sichere Zwischenlagerung</a>. Für komplexe Büroeinrichtungen mit Trennwandsystemen, Stehschreibtischen oder Konferenzraummöbeln übernimmt unser <a href="/leistungen/montage">Montage-Team</a> Auf- und Abbau. Und wenn Sie noch nicht sicher sind, was der Umzug umfasst, starten Sie mit einem <a href="/kontakt">unverbindlichen Beratungsgespräch</a>.
				</p>
			</div>

			<div class="cta-column">
				<ServiceReviews reviews={[
					{
						author: "Günther Otto",
						text: "Wir hatten einen Firmenumzug mit Maschinen und sperrigen, schweren Mobiliar etc. Einfach super gut gelaufen. Nicht eine Beschädigung an den Transportgütern noch an Gebäuden, Türen etc. Selbst kleine Schrauben, Plastikteile usw. die beim Transport aus den Möbeln kullerten wurden gesammelt und mir übergeben. Alle Mitarbeiter ohne Ausnahme waren konzentriert und mit Umsicht bei der Sache. Herr Aust war stets präsent, offen für Kundenhinweise, ruhig und sachlich. Mit Abstand das beste Umzugsunternehmen, das ich je bisher beauftragt habe.",
						url: "https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6"
					},
					{
						author: "Stephan Sausel",
						text: "Fachkundiges Unternehmen. Nicht nur für Umzüge von Haus zu Haus. Hat das Verpacken und die Sicherung verschiedener Werkzeuge, Möbel, Geräte und Maschinen für das Verschiffen in einem Container nach Afrika erfolgreich übernommen. Kann für solche Aufgaben empfohlen werden.",
						url: "https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6"
					},
					{
						author: "Werner Ströer",
						text: "Wir haben in der letzten Woche mit Firma Aust unseren Umzug vollzogen. Es hat alles vorzüglich geklappt. Die Mitarbeiter waren pünktlich vor Ort, haben sofort angepackt. Die Möbel wurden fachmännisch abgebaut, ordentlich verstaut und ohne irgendeinen Schaden wieder aufgebaut. Mein Fazit: Super Arbeit, immer wieder. Hier gebe ich eine volle Empfehlung.",
						url: "https://maps.app.goo.gl/z5e8m7QrGPa5Cssp6"
					}
				]} />
				<div class="cta-box">
					<h3>Firmenumzug in Wolfsburg?</h3>
					<p>Kostenloses Erstgespräch – wir melden uns am selben Tag zurück.</p>
					<div class="cta-button-wrapper">
						<CTAButton
							text="Beratungsgespräch anfragen"
							href="/kontakt"
							showArrow={false}
						/>
					</div>
					<div class="divider">oder</div>
					<div class="cta-button-wrapper">
						<CTAButton
							text="Angebot anfordern"
							href="/kostenloses-angebot"
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
		max-width: 640px;
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
