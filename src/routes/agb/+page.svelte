<script lang="ts">
    // AGB - Allgemeine Geschäftsbedingungen (Terms and Conditions)
    import MetaTags from "$lib/components/MetaTags.svelte";
    import StructuredData from "$lib/components/StructuredData.svelte";
    import { createBreadcrumbs } from "$lib/data/structuredData";

    const breadcrumbs = createBreadcrumbs([
        { name: "Home", url: "https://www.aust-umzuege.de/" },
        { name: "AGB" }
    ]);
</script>

<MetaTags
    title="AGB | Aust Umzüge Hildesheim"
    description="Allgemeine Geschäftsbedingungen (AGB) von Aust Umzüge und Haushaltsauflösungen in Hildesheim."
    canonical="https://www.aust-umzuege.de/agb"
    noindex
/>

<StructuredData schema={breadcrumbs} />

<main class="agb">
    <div class="agb__container">
        <h1 class="agb__heading">Allgemeine Geschäftsbedingungen</h1>

        <section class="agb__section">
            <p class="agb__version">Fassung 2.0 · Stand: 04.09.2026</p>
        </section>

        <section class="agb__section">
            <h2>§ 1 Geltungsbereich und Vertragspartner</h2>
            <p>(1) Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen Aust Umzüge und Haushaltsauflösungen, Inhaber Alex Aust, Kaiserstr. 32, 31134 Hildesheim (nachfolgend „Aust Umzüge") und dem Auftraggeber über Umzugs-, Transport-, Verpackungs-, Montage-, Lager- und Entrümpelungsleistungen.</p>
            <p>(2) Verbraucher ist jede natürliche Person, die den Vertrag zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB). Unternehmer ist, wer bei Vertragsschluss in Ausübung seiner gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).</p>
            <p>(3) Abweichende Bedingungen des Auftraggebers werden nicht Vertragsbestandteil, es sei denn, Aust Umzüge stimmt ihrer Geltung ausdrücklich in Textform zu.</p>
            <p>(4) Soweit diese Bedingungen keine Regelung enthalten, gelten die Vorschriften über den Umzugsvertrag (§§ 451 ff. HGB) und im Übrigen deutsches Recht.</p>
        </section>
        <section class="agb__section">
            <h2>§ 2 Angebot und Vertragsschluss</h2>
            <p>(1) Kostenvoranschläge sind freibleibend, sofern sie nicht ausdrücklich als verbindlich bezeichnet sind. Ein Kostenvoranschlag ist 14 Tage ab Ausstellungsdatum gültig, sofern nichts anderes angegeben ist.</p>
            <p>(2) Der Vertrag kommt zustande, wenn der Auftraggeber den Kostenvoranschlag in Textform annimmt und Aust Umzüge den Auftrag bestätigt.</p>
            <p>(3) Grundlage der Preisbildung sind die Angaben des Auftraggebers zu Umfang, Zugänglichkeit und Terminlage. Weichen die tatsächlichen Verhältnisse hiervon wesentlich ab, gilt § 4.</p>
            <p>(4) Aust Umzüge übermittelt dem Auftraggeber eine Bestätigung des Vertrags auf einem dauerhaften Datenträger, die den Vertragsinhalt, die bei Vertragsschluss geltende Fassung dieser Bedingungen und die Informationen nach § 9 enthält (§ 312f BGB).</p>
        </section>
        <section class="agb__section">
            <h2>§ 3 Leistungsumfang</h2>
            <p>(1) Aust Umzüge erbringt die vereinbarten Leistungen mit der verkehrsüblichen Sorgfalt eines ordentlichen Möbelspediteurs.</p>
            <p>(2) Der Umfang der Leistung ergibt sich aus dem Kostenvoranschlag und der Auftragsbestätigung.</p>
            <p>(3) Die Mitarbeiter sind nicht berechtigt, Elektro-, Gas-, Wasser-, Dübel- und sonstige Installationsarbeiten vorzunehmen, sofern dies nicht ausdrücklich vereinbart ist.</p>
        </section>
        <section class="agb__section">
            <h2>§ 4 Zusatzleistungen und Nebenkosten</h2>
            <p>(1) Zusätzlich zu vergüten sind Leistungen und Aufwendungen, die bei Vertragsschluss nicht vorhersehbar waren, sowie Erweiterungen des Leistungsumfangs nach Vertragsschluss. Dies betrifft insbesondere Wartezeiten, die der Auftraggeber zu vertreten hat, Halteverbotszonen, einen Trageweg von mehr als 20 Metern zwischen Fahrzeug und Wohnungstür, Parkgebühren, eine zweite Anfahrt sowie Entsorgungskosten.</p>
            <p>(2) Aust Umzüge weist den Auftraggeber vor Ausführung solcher Leistungen auf die voraussichtlichen Zusatzkosten hin und holt seine Zustimmung in Textform ein. Ohne diese Zustimmung werden die Leistungen nicht ausgeführt und nicht berechnet.</p>
            <p>(3) Ist eine vorherige Verständigung aus zeitlichen Gründen nicht möglich und duldet die Leistung keinen Aufschub, unterrichtet Aust Umzüge den Auftraggeber unverzüglich. Berechnet werden in diesem Fall ausschließlich die tatsächlich entstandenen, nachgewiesenen Kosten.</p>
            <p>(4) Kann die Leistung am vereinbarten Termin aus Gründen, die der Auftraggeber zu vertreten hat, nicht oder nicht vollständig ausgeführt werden, gilt § 8 entsprechend.</p>
        </section>
        <section class="agb__section">
            <h2>§ 5 Mitwirkungspflichten des Auftraggebers</h2>
            <p>(1) Transportsicherung: Der Auftraggeber lässt bewegliche und elektronische Teile an hochempfindlichen Geräten (z. B. Waschmaschinen, Plattenspieler, Fernseh-, Radio- und HiFi-Geräte, EDV-Anlagen) fachgerecht für den Transport sichern. Aust Umzüge ist zur Überprüfung der Sicherung nicht verpflichtet.</p>
            <p>(2) Gefährliches Gut: Zählt zum Umzugsgut gefährliches Gut (z. B. Benzin, Öle, Gasflaschen, Chemikalien), zeigt der Auftraggeber rechtzeitig vor Beginn in Textform an, welcher Art die Gefahr ist.</p>
            <p>(3) Wertsachen: Edelmetalle, Juwelen, Edelsteine, Geld, Briefmarken, Münzen, Wertpapiere und Urkunden sollte der Auftraggeber selbst befördern; zur Haftung siehe § 13.</p>
            <p>(4) Zugang: Der Auftraggeber sorgt dafür, dass die Zugänge frei und benutzbar sind und erforderliche Genehmigungen vorliegen, soweit Aust Umzüge deren Beschaffung nicht vertraglich übernommen hat.</p>
            <p>(5) Nachprüfung: Bei Abholung und bei Ablieferung soll der Auftraggeber prüfen, dass kein Gegenstand irrtümlich mitgenommen oder zurückgelassen wird. Unterlässt er dies, berührt das seine Ansprüche nicht; die Kosten einer allein dadurch veranlassten zusätzlichen Fahrt trägt jedoch der Auftraggeber.</p>
        </section>
        <section class="agb__section">
            <h2>§ 6 Einsatz weiterer Frachtführer</h2>
            <p>Aust Umzüge kann zur Durchführung des Umzuges weitere Frachtführer heranziehen. Die Haftung nach § 13 bleibt hiervon unberührt.</p>
        </section>
        <section class="agb__section">
            <h2>§ 7 Termin und Terminverschiebung</h2>
            <p>(1) Als verbindlich bezeichnete Termine sind verbindlich.</p>
            <p>(2) Der Auftraggeber kann den Termin einmalig kostenfrei verschieben, wenn er dies spätestens 14 Tage vor dem vereinbarten Termin in Textform mitteilt und innerhalb von drei Monaten ein Ersatztermin vereinbart wird. Ein Anspruch auf einen bestimmten Ersatztermin besteht nicht; maßgeblich ist die Verfügbarkeit.</p>
            <p>(3) Bei einer späteren oder jeder weiteren Verschiebung trägt der Auftraggeber die bereits entstandenen, nicht mehr stornierbaren Fremdkosten, insbesondere für Halteverbotszonen und Genehmigungen. Weitere Kosten werden nicht berechnet.</p>
            <p>(4) Kommt innerhalb von drei Monaten kein Ersatztermin zustande, gilt der Vertrag als vom Auftraggeber gekündigt. Es gilt dann § 8; nach Absatz 3 gezahlte Beträge werden angerechnet.</p>
            <p>(5) Wird ein Termin aus Gründen nicht eingehalten, die Aust Umzüge zu vertreten hat, entstehen dem Auftraggeber hierdurch keine Kosten. Weitergehende gesetzliche Ansprüche bleiben unberührt.</p>
        </section>
        <section class="agb__section">
            <h2>§ 8 Kündigung und Stornokosten</h2>
            <p>(1) Der Auftraggeber kann den Vertrag jederzeit kündigen (§ 415 Abs. 1 HGB). Die Kündigung bedarf der Textform (z. B. E-Mail); maßgeblich ist der Zugang bei Aust Umzüge.</p>
            <p>(2) Kündigt der Auftraggeber, ohne dass Aust Umzüge den Kündigungsgrund zu vertreten hat, kann Aust Umzüge nach seiner Wahl verlangen:</p>
            <ul>
                <li>a) die vereinbarte Vergütung abzüglich ersparter Aufwendungen und abzüglich dessen, was Aust Umzüge durch anderweitige Verwendung der frei gewordenen Kapazität erwirbt oder böswillig zu erwerben unterlässt, zuzüglich der nicht mehr stornierbaren Fremdkosten für Halteverbotszonen, Genehmigungen und angemietete Geräte (§ 415 Abs. 2 Nr. 1 HGB); oder</li>
                <li>b) eine pauschale Entschädigung nach Absatz 3.</li>
            </ul>
            <p>(3) Die pauschale Entschädigung beträgt, bezogen auf das im Kostenvoranschlag veranschlagte Gesamtentgelt:</p>
            <div class="agb__table-wrap">
                <table class="agb__table">
                    <thead><tr><th>Zugang der Kündigung bei Aust Umzüge</th><th>Pauschale</th></tr></thead>
                    <tbody>
                    <tr><td>mehr als 30 Tage vor dem Termin</td><td>10 %</td></tr>
                    <tr><td>30 bis 15 Tage vor dem Termin</td><td>20 %</td></tr>
                    <tr><td>14 bis 8 Tage vor dem Termin</td><td>25 %</td></tr>
                    <tr><td>weniger als 8 Tage vor dem Termin</td><td>33 %</td></tr>
                    </tbody>
                </table>
            </div>
            <p>(4) Die Pauschale nach Absatz 3 übersteigt in keinem Fall ein Drittel der vereinbarten Vergütung und bleibt damit hinter dem gesetzlichen Betrag des § 415 Abs. 2 Nr. 2 HGB zurück.</p>
            <p>(5) Dem Auftraggeber bleibt ausdrücklich der Nachweis vorbehalten, dass Aust Umzüge kein Schaden oder ein wesentlich geringerer Schaden entstanden ist. Aust Umzüge bleibt der Nachweis eines höheren tatsächlich entstandenen Schadens vorbehalten.</p>
            <p>(6) Mit der Pauschale nach Absatz 3 sind alle kündigungsbedingten Nachteile abgegolten. Fremdkosten nach Absatz 2 Buchstabe a können daneben nicht verlangt werden.</p>
            <p>(7) Ist die Pauschale nach Absatz 3 ganz oder teilweise unwirksam, bleibt der gesetzliche Anspruch aus § 415 Abs. 2 HGB unberührt.</p>
            <p>(8) Kündigt der Auftraggeber aus einem wichtigen Grund, den Aust Umzüge zu vertreten hat, entfällt jede Entschädigung.</p>
            <p>(9) Steht dem Auftraggeber ein Widerrufsrecht nach § 9 zu und übt er es fristgerecht aus, entstehen keine Stornokosten nach dieser Klausel; es gilt allein § 9.</p>
        </section>
        <section class="agb__section">
            <h2>§ 9 Widerrufsrecht für Verbraucher</h2>
            <p>(1) Wird der Vertrag ausschließlich unter Verwendung von Fernkommunikationsmitteln oder außerhalb der Geschäftsräume von Aust Umzüge geschlossen, gilt für Verbraucher Folgendes.</p>
            <div class="agb__box">
                <h3>Information über das Nichtbestehen des Widerrufsrechts</h3>
                <p>Bei Verträgen über Umzugs- und Transportleistungen, für die ein bestimmter Umzugstermin oder ein bestimmter Zeitraum vereinbart ist, besteht nach § 312g Abs. 2 Nr. 9 BGB kein Widerrufsrecht. Sie können Ihre Vertragserklärung insoweit nicht widerrufen.</p>
            </div>
            <p>(2) Für alle übrigen Leistungen — insbesondere Aufträge ohne vereinbarten Termin sowie gesondert beauftragte Leistungen ohne Beförderungsbezug wie Entrümpelung, Haushaltsauflösung, Möbelmontage, Einlagerung oder Reinigung — besteht ein Widerrufsrecht nach Maßgabe der nachstehenden Belehrung.</p>
            <p>(3) Umfasst ein Auftrag sowohl Beförderungs- als auch sonstige Leistungen, werden diese im Kostenvoranschlag als gesonderte Positionen ausgewiesen. Die Belehrung nach Absatz 2 gilt für die widerrufsfähigen Positionen.</p>
            <div class="agb__box">
                <h3>Widerrufsbelehrung</h3>
                <p>Widerrufsrecht</p>
                <p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.</p>
                <p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Aust Umzüge und Haushaltsauflösungen, Inhaber Alex Aust, Kaiserstr. 32, 31134 Hildesheim, Telefon 05121 – 755 83 79, E-Mail info@aust-umzuege.de) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.</p>
                <p>Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.</p>
                <p>Folgen des Widerrufs</p>
                <p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.</p>
                <p>Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.</p>
                <p>Ende der Widerrufsbelehrung</p>
            </div>
            <p>(4) Soll die Leistung vor Ablauf der Widerrufsfrist beginnen, bedarf es des ausdrücklichen Verlangens des Auftraggebers; bei einem außerhalb von Geschäftsräumen geschlossenen Vertrag ist dieses Verlangen auf einem dauerhaften Datenträger zu übermitteln (§ 357a Abs. 2 BGB). Das Widerrufsrecht erlischt nach § 356 Abs. 5 BGB bei einer vollständig erbrachten Dienstleistung, wenn Aust Umzüge mit der Ausführung erst begonnen hat, nachdem der Auftraggeber dies ausdrücklich verlangt und zugleich bestätigt hat, dass ihm bekannt ist, dass er sein Widerrufsrecht mit vollständiger Vertragserfüllung verliert.</p>
            <div class="agb__box">
                <h3>Muster-Widerrufsformular</h3>
                <p>(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>
                <p>An: Aust Umzüge und Haushaltsauflösungen, Inhaber Alex Aust, Kaiserstr. 32, 31134 Hildesheim, E-Mail: info@aust-umzuege.de</p>
                <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*):</p>
                <p>Beauftragt am (*) / erhalten am (*):</p>
                <p>Name des/der Verbraucher(s):</p>
                <p>Anschrift des/der Verbraucher(s):</p>
                <p>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):</p>
                <p>Datum:</p>
                <p>(*) Unzutreffendes streichen.</p>
            </div>
        </section>
        <section class="agb__section">
            <h2>§ 10 Preise, Zahlung, Verzug</h2>
            <p>(1) Alle Preise verstehen sich in Euro. Gegenüber Verbrauchern werden Endpreise einschließlich der gesetzlichen Umsatzsteuer ausgewiesen.</p>
            <p>(2) Die Vergütung ist mit vollständiger Ablieferung des Umzugsgutes und Zugang einer ordnungsgemäßen Rechnung fällig und ohne Abzug binnen 14 Tagen zu zahlen, sofern im Kostenvoranschlag nichts anderes vereinbart ist.</p>
            <p>(3) Bei einem Auftragswert ab 2.000 Euro kann eine Anzahlung von höchstens 30 % des vereinbarten Gesamtentgelts vereinbart werden. Sie wird im Kostenvoranschlag betragsmäßig ausgewiesen und auf die Schlussrechnung angerechnet.</p>
            <p>(4) Barauslagen in ausländischer Währung sind nach dem abgerechneten Wechselkurs zu erstatten.</p>
            <p>(5) Gerät der Auftraggeber in Verzug, gelten die gesetzlichen Verzugszinsen nach § 288 BGB. Die Geltendmachung weitergehender Ansprüche bleibt unberührt.</p>
        </section>
        <section class="agb__section">
            <h2>§ 11 Aufrechnung und Zurückbehaltung</h2>
            <p>Gegen Ansprüche von Aust Umzüge kann der Auftraggeber nur mit unbestrittenen oder rechtskräftig festgestellten Gegenansprüchen aufrechnen. Ein Zurückbehaltungsrecht steht ihm nur zu, soweit sein Gegenanspruch auf demselben Vertragsverhältnis beruht.</p>
        </section>
        <section class="agb__section">
            <h2>§ 12 Pfandrecht</h2>
            <p>Aust Umzüge steht wegen aller Forderungen aus dem Umzugsvertrag ein Pfandrecht am Umzugsgut zu (§ 441 HGB). Kommt der Auftraggeber seiner Zahlungspflicht nicht nach, kann Aust Umzüge das Umzugsgut zurückbehalten oder nach Beginn der Beförderung auf Kosten des Auftraggebers einlagern. Vor einer Verwertung setzt Aust Umzüge dem Auftraggeber eine angemessene Frist.</p>
        </section>
        <section class="agb__section">
            <h2>§ 13 Haftung — Haftungsinformation gemäß § 451g HGB</h2>
            <h3>HAFTUNGSINFORMATION</h3>
            <p>Des Möbelspediteurs gemäß § 451g HGB</p>
            <h3>Anwendungsbereich</h3>
            <p>Der Frachtführer (im folgenden Möbelspediteur genannt) haftet nach dem Umzugsvertrag und dem Handelsgesetzbuch (HGB). Für Beförderungen von Umzugsgut von und nach Orten außerhalb Deutschlands finden dieselben Haftungsgrundsätze Anwendung. Dies gilt auch, wenn verschiedenartige Beförderungsmittel zum Einsatz kommen.</p>
            <h3>Haftungsgrundsätze</h3>
            <p>Der Möbelspediteur haftet für den Schaden, der durch Verlust oder Beschädigung des Umzugsgutes in der Zeit von der Übernahme zur Beförderung bis zur Ablieferung oder durch Überschreitung der Lieferfrist entsteht (Obhutshaftung).</p>
            <h3>Haftungshöchstbetrag</h3>
            <p>Die Haftung des Möbelspediteurs wegen Verlust oder Beschädigung ist auf einen Betrag von € 620,00 je Kubikmeter Laderaum, der zu Erfüllung des Vertrages benötigt wird beschränkt. Wegen Überschreitung der Lieferfrist ist die Haftung des Möbelspediteurs auf den dreifachen Betrag der Fracht begrenzt. Haftet der Möbelspediteur wegen der Verletzung einer mit der Ausführung des Umzuges zusammenhängenden vertraglichen Pflicht für Schäden, die nicht durch den Verlust oder Beschädigung des Umzugsgutes oder durch Überschreiten der Lieferfrist entstehen, und handelt es sich um andere Schäden als Sach- und Personenschäden so ist in diesem Fall die Haftung auf das Dreifache des Betrages begrenzt, der bei Verlust des Gutes zu zahlen wäre.</p>
            <h3>Wertersatz</h3>
            <p>Hat der Möbelspediteur Schadenersatz zu leisten, so ist der Wert am Ort und zur Zeit der Übernahme zur Beförderung zu ersetzen. Der Wert des Umzugsgutes bestimmt sich in der Regel nach dem Marktpreis. Zusätzlich sind alle Kosten der Schadensfeststellung zu ersetzen.</p>
            <h3>Haftungsausschluss</h3>
            <p>Der Möbelspediteur ist von der Haftung befreit soweit der Verlust, die Beschädigung oder die Überschreitung der Lieferfrist auf Umständen beruht, die der Möbelspediteur auch bei größter Sorgfalt nicht vermeiden und deren Folgen er nicht abwenden konnte (unabwendbares Ereignis).</p>
            <h3>Besondere Haftungsausschlussgründe</h3>
            <p>Der Möbelspediteur ist von seiner Haftung befreit, soweit der Verlust oder die Beschädigung auf eine der folgenden Gefahren zurückzuführen ist:</p>
            <ol>
                <li>Beförderung von Edelmetallen, Juwelen, Edelsteinen, Geld, Briefmarken, Münzen, Wertpapiere oder Urkunden</li>
                <li>Ungenügende Verpackung oder Kennzeichnung durch den Absender</li>
                <li>Behandeln, Verladen oder Entladen des Umzugsgutes durch den Absender</li>
                <li>Beförderung von nicht vom Möbelspediteur verpacktem Gut in Behältern</li>
                <li>Verladen oder Entladen von Umzugsgut, dessen Größe oder Gewicht den Raumverhältnissen an der Ladestelle oder Entladestelle nicht entspricht, sofern der Möbelspediteur den Absender auf die Gefahr einer Beschädigung vorher hingewiesen und der Absender auf die Durchführung der Leistung bestanden hat</li>
                <li>Beförderung lebender Tiere und Pflanzen</li>
                <li>Natürliche oder mangelhafte Beschaffenheit des Umzugsgutes, der zufolge es besonders leicht Schäden, insbesondere durch Bruch, Funktionsstörungen, Rost, inneren Verderb oder Auslaufen erleidet</li>
            </ol>
            <p>Der Möbelspediteur kann sich auf die besonderen Haftungsausschlussgründe nur berufen, wenn er alle nach den Umständen obliegenden Maßnahmen getroffen und besondere Weisungen beachtet hat.</p>
            <h3>Außervertragliche Ansprüche</h3>
            <p>Die Haftungsbefreiung und Haftungsbegrenzungen gelten auch für einen außervertraglichen Anspruch des Absenders oder des Empfängers gegen den Möbelspediteur wegen Verlust oder Beschädigung des Umzugsgutes oder wegen Überschreitung der Lieferfrist.</p>
            <h3>Wegfall der Haftungsbefreiungen und -Begrenzungen</h3>
            <p>Die Haftungsbefreiungen und Haftungsbegrenzungen gelten nicht, wenn der Schaden auf eine Handlung oder Unterlassung zurückzuführen ist, die der Möbelspediteur vorsätzlich oder leichtfertig und in dem Bewusstsein, dass ein Schaden mit Wahrscheinlichkeit eintreten werde, begangen hat.</p>
            <h3>Haftung der Leute</h3>
            <p>Werden Schadenersatzansprüche aus außervertraglicher Haftung wegen Verlust oder Beschädigung des Umzugsgutes oder wegen Überschreitung der Lieferfrist gegen einen der Leute des Möbelspediteurs erhoben, so kann sich auch jener auf die Haftungsbefreiungen und -begrenzungen berufen. Das gilt auch, wenn er vorsätzlich oder leichtfertig und in dem Bewusstsein, dass ein Schaden mit Wahrscheinlichkeit eintreten werde, gehandelt hat.</p>
            <h3>Ausführender Möbelspediteur</h3>
            <p>Wird der Umzug ganz oder teilweise durch einen Dritten ausgeführt (ausführender Möbelspediteur), so haftet dieser für den Schaden, der durch den Verlust oder Beschädigung des Gutes oder durch Überschreitung der Lieferfrist während der durch ihn ausgeführten Beförderung entsteht, in gleicher Weise wie der Möbelspediteur. Der ausführende Möbelspediteur kann alle Einwendungen geltend machen, die dem Möbelspediteur aus dem Frachtvertrag zustehen. Möbelspediteur und ausführender Möbelspediteur haften als Gesamtschuldner. Werden Leute des ausführenden Möbelspediteurs in Anspruch genommen, so gelten für diese die Bestimmungen über Haftung der Leute.</p>
            <h3>Haftungsvereinbarung</h3>
            <p>Der Möbelspediteur weist den Absender auf die Möglichkeit hin, mit ihm gegen Bezahlung eines entsprechenden Entgeltes eine weitergehende als die gesetzlich vorgesehene Haftung zu vereinbaren.</p>
            <h3>Transportversicherung</h3>
            <p>Der Möbelspediteur weist den Absender auf die Möglichkeit hin, das Gut gegen Bezahlung einer besonderen Prämie zu versichern.</p>
            <h3>Schadensanzeige</h3>
            <p>Um das Erlöschen von Ersatzansprüchen zu verhindern, ist folgendes zu beachten:</p>
            <ul>
                <li>Der Absender ist verpflichtet, das Gut sofort bei Ablieferung auf äußerlich erkennbare Beschädigungen oder Verlust zu untersuchen.</li>
                <li>Diese sind auf dem Ablieferungsbeleg oder einem Schadensprotokoll spezifiziert festzuhalten und dem Möbelspediteur spätestens am Tag nach der Ablieferung anzuzeigen.</li>
                <li>Äußerlich nicht erkennbare Beschädigungen oder Verluste, die der Absender erst beim Auspacken des Umzugsgutes feststellt, müssen dem Möbelspediteur innerhalb 14 Tagen nach Ablieferung spezifiziert angezeigt werden.</li>
                <li>Pauschale Schadenanzeige genügen in keinem Fall.</li>
                <li>Ansprüche wegen Überschreitung der Lieferfrist erlöschen wenn der Empfänger dem Möbelspediteur die Überschreitung nicht innerhalb von 14 Tagen nach Ablieferung anzeigt.</li>
            </ul>
            <p>Wird eine Anzeige nach Ablieferung erstattet, muss sie – um den Anspruchsverlust zu verhindern – in jedem Fall in Textform und innerhalb der vorgesehenen Fristen erfolgen. Zur Wahrung der Fristen genügt die rechtzeitige Absendung.</p>
        </section>
        <section class="agb__section">
            <h2>§ 14 Erstattung der Umzugskosten durch Dritte</h2>
            <p>Hat der Auftraggeber gegenüber einer Dienststelle oder einem Arbeitgeber Anspruch auf Umzugskostenvergütung, weist er diese Stelle an, die vereinbarte und fällige Vergütung abzüglich geleisteter Anzahlungen auf Anforderung unmittelbar an Aust Umzüge auszuzahlen.</p>
        </section>
        <section class="agb__section">
            <h2>§ 15 Trinkgelder, Handwerkervermittlung, Abtretung</h2>
            <p>(1) Trinkgelder sind mit der Rechnung von Aust Umzüge nicht verrechenbar.</p>
            <p>(2) Bei Leistungen zusätzlich vermittelter Handwerker haftet Aust Umzüge nur für deren sorgfältige Auswahl.</p>
            <p>(3) Aust Umzüge ist auf Verlangen des Ersatzberechtigten verpflichtet, die ihm aus dem abzuschließenden Versicherungsvertrag zustehenden Rechte an den Ersatzberechtigten abzutreten.</p>
        </section>
        <section class="agb__section">
            <h2>§ 16 Erklärungen und Kommunikation</h2>
            <p>(1) Erklärungen, Weisungen und Mitteilungen des Auftraggebers sollen in Textform erfolgen. Mündliche und telefonische Erklärungen sind wirksam; Aust Umzüge bestätigt sie unverzüglich in Textform.</p>
            <p>(2) Weisungen gegenüber Personen, die erkennbar nicht zur Entgegennahme bevollmächtigt sind, wirken nur, wenn sie Aust Umzüge tatsächlich erreichen.</p>
            <p>(3) Auf ein Missverständnis kann sich Aust Umzüge nicht berufen, soweit es auf einem Umstand beruht, den Aust Umzüge zu vertreten hat.</p>
        </section>
        <section class="agb__section">
            <h2>§ 17 Gerichtsstand, Rechtswahl, Verbraucherschlichtung</h2>
            <p>(1) Es gilt deutsches Recht. Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit dadurch nicht der Schutz zwingender Vorschriften des Staates entzogen wird, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.</p>
            <p>(2) Ist der Auftraggeber Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist Hildesheim ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag. Dasselbe gilt, wenn der Auftraggeber keinen allgemeinen Gerichtsstand im Inland hat, nach Vertragsschluss seinen Wohnsitz oder gewöhnlichen Aufenthalt ins Ausland verlegt oder sein Wohnsitz im Zeitpunkt der Klageerhebung nicht bekannt ist.</p>
            <p>(3) Aust Umzüge ist zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle weder bereit noch verpflichtet.</p>
        </section>
        <section class="agb__section">
            <h2>§ 18 Salvatorische Klausel und Fassung</h2>
            <p>(1) Sollte eine Bestimmung dieser Bedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung treten die gesetzlichen Vorschriften.</p>
            <p>(2) Es gilt die bei Vertragsschluss aktuelle Fassung dieser Bedingungen.</p>
            <p><strong>Stand: 04.09.2026 · Fassung 2.0</strong></p>
        </section>

        <section class="agb__section">
            <p>
                Bitte beachten Sie auch unser <a href="/impressum">Impressum</a>
                und unsere <a href="/datenschutz">Datenschutzerklärung</a>.
            </p>
        </section>
    </div>
</main>

<style>
    .agb {
        padding-block: var(--space-16);
        background-color: var(--color-text);
        min-height: 60vh;
    }

    .agb__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    .agb__heading {
        color: var(--color-info-bar);
        font-size: clamp(var(--text-3xl), 5vw, var(--text-5xl));
        font-weight: var(--font-bold);
        margin: 0 0 var(--space-10);
        position: relative;
        padding-bottom: var(--space-4);
    }

    .agb__heading::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-nav-accent), #ff8a3d);
        border-radius: var(--radius-full);
    }

    .agb__section {
        margin-bottom: var(--space-8);
    }

    .agb__section h2 {
        color: var(--color-info-bar);
        font-size: var(--text-lg);
        font-weight: var(--font-bold);
        margin: 0 0 var(--space-3);
    }

    .agb__section h3 {
        color: var(--color-info-bar);
        font-size: var(--text-base);
        font-weight: var(--font-semibold);
        margin: var(--space-5) 0 var(--space-2);
    }

    .agb__section p {
        color: #4a5568;
        font-size: var(--text-base);
        line-height: 1.75;
        margin: 0 0 var(--space-3);
    }

    .agb__section ul,
    .agb__section ol {
        color: #4a5568;
        font-size: var(--text-base);
        line-height: 1.75;
        margin: 0 0 var(--space-4);
        padding-left: var(--space-6);
    }

    .agb__section li {
        margin-bottom: var(--space-2);
    }

    .agb__section a {
        color: var(--color-info-bar); /* Blue for better contrast */
        text-decoration: underline; /* Always underlined for accessibility */
        transition: color var(--transition-fast);
        font-weight: var(--font-semibold); /* Slightly bolder for visibility */
    }

    .agb__section a:hover {
        color: var(--color-nav-accent);
        text-decoration: underline;
    }




    @media (max-width: 767px) {
        .agb {
            padding-block: var(--space-10);
        }

        .agb__section {
            margin-bottom: var(--space-6);
        }
    }
    .agb__table-wrap {
        overflow-x: auto;
        margin: 0 0 var(--space-4);
    }

    .agb__table {
        border-collapse: collapse;
        width: 100%;
        min-width: 380px;
        font-size: var(--text-base);
        color: #4a5568;
    }

    .agb__table th {
        background: var(--color-info-bar);
        color: #fff;
        text-align: left;
        padding: var(--space-2) var(--space-3);
        font-weight: var(--font-semibold);
    }

    .agb__table td {
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid #e2e8f0;
    }

    .agb__table td:last-child {
        text-align: right;
        font-weight: var(--font-semibold);
        white-space: nowrap;
    }

    .agb__box {
        border: 1px solid #e2e8f0;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: var(--radius-md, 6px);
        padding: var(--space-4) var(--space-5);
        margin: 0 0 var(--space-4);
        background: #f8fafc;
    }

    .agb__box h3 {
        margin-top: 0;
    }

    .agb__version {
        color: #718096;
        font-size: var(--text-sm, 0.875rem);
        margin: 0;
    }
    .agb__table-wrap {
        overflow-x: auto;
        margin: 0 0 var(--space-4);
    }

    .agb__table {
        border-collapse: collapse;
        width: 100%;
        min-width: 380px;
        font-size: var(--text-base);
        color: #4a5568;
    }

    .agb__table th {
        background: var(--color-info-bar);
        color: #fff;
        text-align: left;
        padding: var(--space-2) var(--space-3);
        font-weight: var(--font-semibold);
    }

    .agb__table td {
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid #e2e8f0;
    }

    .agb__table td:last-child {
        text-align: right;
        font-weight: var(--font-semibold);
        white-space: nowrap;
    }

    .agb__box {
        border: 1px solid #e2e8f0;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: var(--radius-md, 6px);
        padding: var(--space-4) var(--space-5);
        margin: 0 0 var(--space-4);
        background: #f8fafc;
    }

    .agb__box h3 {
        margin-top: 0;
    }

    .agb__version {
        color: #718096;
        font-size: var(--text-sm, 0.875rem);
        margin: 0;
    }
    .agb__table-wrap {
        overflow-x: auto;
        margin: 0 0 var(--space-4);
    }

    .agb__table {
        border-collapse: collapse;
        width: 100%;
        min-width: 380px;
        font-size: var(--text-base);
        color: #4a5568;
    }

    .agb__table th {
        background: var(--color-info-bar);
        color: #fff;
        text-align: left;
        padding: var(--space-2) var(--space-3);
        font-weight: var(--font-semibold);
    }

    .agb__table td {
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid #e2e8f0;
    }

    .agb__table td:last-child {
        text-align: right;
        font-weight: var(--font-semibold);
        white-space: nowrap;
    }

    .agb__box {
        border: 1px solid #e2e8f0;
        border-left: 4px solid var(--color-nav-accent);
        border-radius: var(--radius-md, 6px);
        padding: var(--space-4) var(--space-5);
        margin: 0 0 var(--space-4);
        background: #f8fafc;
    }

    .agb__box h3 {
        margin-top: 0;
    }

    .agb__version {
        color: #718096;
        font-size: var(--text-sm, 0.875rem);
        margin: 0;
    }
</style>
