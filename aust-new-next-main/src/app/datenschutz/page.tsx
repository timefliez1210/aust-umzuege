import type { Metadata } from 'next';
import styles from './datenschutz.module.css';

export const metadata: Metadata = {
  title: "Datenschutzerklärung (DSGVO) | Aufraeumhelden",
  description: "Lesen Sie unsere Datenschutzerklärung gemäß DSGVO für unsere Website.",
};

const DatenschutzPage = () => {
  return (
    <div className={styles['impressum-container']}>
      <div className={styles['disclaimer-section']}>
        <h2 className={styles.heading2}>Datenschutzerklärung (DSGVO)</h2>

        <h3>1. Datenschutz auf einen Blick</h3>
        <div className={styles['disclaimer-text']}>
          <p>Allgemeine Hinweise</p>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
            Datenerfassung auf unserer Website
            Wer ist verantwortlich für die Datenerfassung auf dieser Website?
            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
          </p>
        </div>

        <h3>2. Allgemeine Hinweise und Pflichtinformationen</h3>
        <div className={styles['disclaimer-text']}>
          <p>Datenschutz</p>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht. Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.
          </p>
          <p>Hinweis zur verantwortlichen Stelle</p>
          <p>
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
          </p>
          <p>
            Alexander Aust<br />
            Telefon: 05121 – 7558379<br />
            Mobil: 0159 - 01443839<br />
            E-Mail: info@aust-umzuege.de
          </p>
          <p>Widerruf Ihrer Einwilligung zur Datenverarbeitung</p>
          <p>
            Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
          </p>
          <p>Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen Direktwerbung (Art. 21 DSGVO)</p>
          <p>
            Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Die jeweilige Rechtsgrundlage, auf denen eine Verarbeitung beruht, entnehmen Sie dieser Datenschutzerklärung. Wenn Sie Widerspruch einlegen, werden wir Ihre betroffenen personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen (Widerspruch nach Art. 21 Abs. 1 DSGVO).
          </p>
          <p>
            Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Sie betreffender personenbezogener Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wenn Sie widersprechen, werden Ihre personenbezogenen Daten anschließend nicht mehr zum Zwecke der Direktwerbung verwendet (Widerspruch nach Art. 21 Abs. 2 DSGVO).
          </p>
          <p>Beschwerderecht bei der zuständigen Aufsichtsbehörde</p>
          <p>
            Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder gerichtlicher Rechtsbehelfe. Eine Liste der Datenschutzbeauftragten sowie deren Kontaktdaten können folgendem Link entnommen werden: <a className={styles.link} href="https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html">https://www.bfdi.bund.de/DE/Infothek/Anschriften_Links/anschriften_links-node.html</a> (Deutschland) und <a className={styles.link} href="https://www.dsb.gv.at/kontakt">https://www.dsb.gv.at/kontakt</a> (Österreich).
          </p>
          <p>Recht auf Datenübertragbarkeit</p>
          <p>
            Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
          </p>
          <p>SSL- bzw. TLS-Verschlüsselung</p>
          <p>
            Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL-bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
          </p>
          <p>
            Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
          </p>
          <p>Verschlüsselter Zahlungsverkehr</p>
          <p>
            Besteht nach dem Abschluss eines kostenpflichtigen Vertrags eine Verpflichtung, uns Ihre Zahlungsdaten (z. B. Kontonummer bei Einzugsermächtigung) zu übermitteln, werden diese Daten zur Zahlungsabwicklung benötigt. Der Zahlungsverkehr über die gängigen Zahlungsmittel (Visa/MasterCard, Lastschriftverfahren) erfolgt ausschließlich über eine verschlüsselte SSL- bzw. TLS-Verbindung. Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://“ auf „https://“ wechselt und an dem Schloss-Symbol in Ihrer Browserzeile. Bei verschlüsselter Kommunikation können Ihre Zahlungsdaten, die Sie an uns übermitteln, nicht von Dritten mitgelesen werden.
          </p>
          <p>Auskunft, Sperrung, Löschung und Berichtigung</p>
          <p>
            Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
          </p>
          <p>Recht auf Einschränkung der Verarbeitung</p>
          <p>
            Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Hierzu können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Das Recht auf Einschränkung der Verarbeitung besteht in folgenden Fällen:
          </p>
          <p>
            Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht, können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen. Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen. Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats verarbeitet werden.
          </p>
          <p>Widerspruch gegen Werbe-Mails</p>
          <p>
            Der Nutzung von im Rahmen der Impressumspflicht veröffentlichten Kontaktdaten zur Übersendung von nicht ausdrücklich angeforderter Werbung und Informationsmaterialien wird hiermit widersprochen. Die Betreiber der Seiten behalten sich ausdrücklich rechtliche Schritte im Falle der unverlangten Zusendung von Werbeinformationen, etwa durch Spam-E-Mails, vor.
          </p>
        </div>

        <h3>3. Datenerfassung auf unserer Website</h3>
        <div className={styles['disclaimer-text']}>
          <p>Cookies</p>
          <p>
            Die Internetseiten verwenden teilweise sogenannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
          </p>
          <p>
            Die meisten der von uns verwendeten Cookies sind sogenannte „Session-Cookies“. Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.
          </p>
          <p>
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
          </p>
          <p>
            Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs oder zur Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z. B. Warenkorbfunktion) erforderlich sind, werden auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO gespeichert. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste. Soweit andere Cookies (z. B. Cookies zur Analyse Ihres Surfverhaltens) gespeichert werden, werden diese in dieser Datenschutzerklärung gesondert behandelt.
          </p>
          <p>Server-Log-Dateien</p>
          <p>
            Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
          </p>
          <p>
            Browsertyp und Browserversion<br />
            verwendetes Betriebssystem<br />
            Referrer URL<br />
            Hostname des zugreifenden Rechners<br />
            Uhrzeit der Serveranfrage<br />
            IP-Adresse
          </p>
          <p>
            Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files erfasst werden.
          </p>
          <p>Kontaktformular</p>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter. Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt somit ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können diese Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt. Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihrer Anfrage). Zwingende gesetzliche Bestimmungen – insbesondere Aufbewahrungsfristen – bleiben unberührt.
          </p>
          <p>Anfrage per E-Mail, Telefon oder Telefax</p>
          <p>
            Wenn Sie uns per E-Mail, Telefon oder Telefax kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
          </p>
          <p>
            Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen beruht die Verarbeitung auf Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) und/oder auf unseren berechtigten Interessen (Art. 6 Abs. 1 lit. f DSGVO), da wir ein berechtigtes Interesse an der effektiven Bearbeitung der an uns gerichteten Anfragen haben.
          </p>
          <p>
            Die von Ihnen an uns per Kontaktanfragen übersandten Daten verbleiben bei uns, bis Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt (z. B. nach abgeschlossener Bearbeitung Ihres Anliegens). Zwingende gesetzliche Bestimmungen – insbesondere gesetzliche Aufbewahrungsfristen – bleiben unberührt.
          </p>
          <p>Registrierung auf dieser Website</p>
          <p>
            Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. Anderenfalls werden wir die Registrierung ablehnen.
          </p>
          <p>
            Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
          </p>
          <p>
            Die Verarbeitung der bei der Registrierung eingegebenen Daten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können eine von Ihnen erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bereits erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
          </p>
          <p>
            Die bei der Registrierung erfassten Daten werden von uns gespeichert, solange Sie auf unserer Website registriert sind und werden anschließend gelöscht. Gesetzliche Aufbewahrungsfristen bleiben unberührt.
          </p>
          <p>Verarbeiten von Daten (Kunden- und Vertragsdaten)</p>
          <p>
            Wir erheben, verarbeiten und nutzen personenbezogene Daten nur, soweit sie für die Begründung, inhaltliche Ausgestaltung oder Änderung des Rechtsverhältnisses erforderlich sind (Bestandsdaten). Dies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet. Personenbezogene Daten über die Inanspruchnahme unserer Internetseiten (Nutzungsdaten) erheben, verarbeiten und nutzen wir nur, soweit dies erforderlich ist, um dem Nutzer die Inanspruchnahme des Dienstes zu ermöglichen oder abzurechnen.
          </p>
          <p>
            Die erhobenen Kundendaten werden nach Abschluss des Auftrags oder Beendigung der Geschäftsbeziehung gelöscht. Gesetzliche Aufbewahrungsfristen bleiben unberührt.
          </p>
          <p>Datenübermittlung bei Vertragsschluss für Online-Shops, Händler und Warenversand</p>
          <p>
            Wir übermitteln personenbezogene Daten an Dritte nur dann, wenn dies im Rahmen der Vertragsabwicklung notwendig ist, etwa an die mit der Lieferung der Ware betrauten Unternehmen oder das mit der Zahlungsabwicklung beauftragte Kreditinstitut. Eine weitergehende Übermittlung der Daten erfolgt nicht bzw. nur dann, wenn Sie der Übermittlung ausdrücklich zugestimmt haben. Eine Weitergabe Ihrer Daten an Dritte ohne ausdrückliche Einwilligung, etwa zu Zwecken der Werbung, erfolgt nicht.
          </p>
          <p>
            Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.
          </p>
          <p>Datenübermittlung bei Vertragsschluss für Dienstleistungen und digitale Inhalte</p>
          <p>
            Wir übermitteln personenbezogene Daten an Dritte nur dann, wenn dies im Rahmen der Vertragsabwicklung notwendig ist, etwa an das mit der Zahlungsabwicklung beauftragte Kreditinstitut. Eine weitergehende Übermittlung der Daten erfolgt nicht bzw. nur dann, wenn Sie der Übermittlung ausdrücklich zugestimmt haben. Eine Weitergabe Ihrer Daten an Dritte ohne ausdrückliche Einwilligung, etwa zu Zwecken der Werbung, erfolgt nicht. Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.
          </p>
          <p>Registrierung mit Facebook Connect</p>
          <p>
            Statt einer direkten Registrierung auf unserer Website können Sie sich mit Facebook Connect registrieren. Anbieter dieses Dienstes ist die Facebook Ireland Limited, 4 Grand Canal Square, Dublin 2, Irland.
          </p>
          <p>
            Wenn Sie sich für die Registrierung mit Facebook Connect entscheiden und auf den „Login with Facebook“-/„Connect with Facebook“-Button klicken, werden Sie automatisch auf die Plattform von Facebook weitergeleitet. Dort können Sie sich mit Ihren Nutzungsdaten anmelden. Dadurch wird Ihr Facebook-Profil mit unserer Website bzw. unseren Diensten verknüpft. Durch diese Verknüpfung erhalten wir Zugriff auf Ihre bei Facebook hinterlegten Daten. Dies sind vor allem:
          </p>
          <p>
            Facebook-Name<br />
            Facebook-Profil- und Titelbild<br />
            Facebook-Titelbild<br />
            bei Facebook hinterlegte E-Mail-Adresse<br />
            Facebook-ID<br />
            Facebook-Freundeslisten<br />
            Facebook Likes („Gefällt-mir“-Angaben)<br />
            Geburtstag<br />
            Geschlecht<br />
            Land<br />
            Sprache<br />
            Diese Daten werden zur Einrichtung, Bereitstellung und Personalisierung Ihres Accounts genutzt.
          </p>
          <p>
            Die Registrierung mit Facebook-Connect und die damit verbundenen Datenverarbeitungsvorgänge erfolgen auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Diese Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen.
          </p>
          <p>
            Weitere Informationen finden Sie in den Facebook-Nutzungsbedingungen und den Facebook-Datenschutzbestimmungen. Diese finden Sie unter: <a href="https://de-de.facebook.com/about/privacy/">https://de-de.facebook.com/about/privacy/</a> und <a href="https://de-de.facebook.com/legal/terms/">https://de-de.facebook.com/legal/terms/</a>.
          </p>
          <p>Kommentarfunktion auf dieser Website</p>
          <p>
            Für die Kommentarfunktion auf dieser Seite werden neben Ihrem Kommentar auch Angaben zum Zeitpunkt der Erstellung des Kommentars, Ihre E-Mail-Adresse und, wenn Sie nicht anonym posten, der von Ihnen gewählte Nutzername gespeichert.
          </p>
          <p>Rechtsgrundlage</p>
          <p>
            Die Speicherung der Kommentare erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können eine von Ihnen erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bereits erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt.
          </p>
        </div>

        <h3>4. Plugins und Tools</h3>
        <div className={styles['disclaimer-text']}>
          <p>Google Web Fonts</p>
          <p>
            Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Web Fonts, die von Google bereitgestellt werden. Die Google Fonts sind lokal installiert. Eine Verbindung zu Servern von Google findet dabei nicht statt.
          </p>
          <p>Google Maps</p>
          <p>
            Diese Seite nutzt über eine API den Kartendienst Google Maps. Anbieter ist die Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.
          </p>
          <p>
            Zur Nutzung der Funktionen von Google Maps ist es notwendig, Ihre IP Adresse zu speichern. Diese Informationen werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert. Der Anbieter dieser Seite hat keinen Einfluss auf diese Datenübertragung.
          </p>
          <p>
            Die Nutzung von Google Maps erfolgt im Interesse einer ansprechenden Darstellung unserer Online-Angebote und an einer leichten Auffindbarkeit der von uns auf der Website angegebenen Orte. Dies stellt ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO dar.
          </p>
          <p>
            Mehr Informationen zum Umgang mit Nutzerdaten finden Sie in der Datenschutzerklärung von Google: <a href="https://policies.google.com/privacy?hl=de">https://policies.google.com/privacy?hl=de</a>.
          </p>
        </div>
        <h3>5. Soziale Medien</h3>
        <div className={styles['disclaimer-text']}>
          <p>Google+ Plugin</p>
          <p>
            Anbieter ist die Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.
          </p>
          <p>
            Erfassung und Weitergabe von Informationen: Mithilfe der Google+-Schaltfläche können Sie Informationen weltweit veröffentlichen. Über die Google+-Schaltfläche erhalten Sie und andere Nutzer personalisierte Inhalte von Google und unseren Partnern. Google speichert sowohl die Information, dass Sie für einen Inhalt +1 gegeben haben, als auch Informationen über die Seite, die Sie beim Klicken auf +1 angesehen haben. Ihre +1 können als Hinweise zusammen mit Ihrem Profilnamen und Ihrem Foto in Google-Diensten, wie etwa in Suchergebnissen oder in Ihrem Google-Profil, oder an anderen Stellen auf Websites und Anzeigen im Internet eingeblendet werden.
          </p>
          <p>
            Google zeichnet Informationen über Ihre +1-Aktivitäten auf, um die Google-Dienste für Sie und andere zu verbessern. Um die Google+-Schaltfläche verwenden zu können, benötigen Sie ein weltweit sichtbares, öffentliches Google-Profil, das zumindest den für das Profil gewählten Namen enthalten muss. Dieser Name wird in allen Google-Diensten verwendet. In manchen Fällen kann dieser Name auch einen anderen Namen ersetzen, den Sie beim Teilen von Inhalten über Ihr Google-Konto verwendet haben. Die Identität Ihres Google-Profils kann Nutzern angezeigt werden, die Ihre E-Mail-Adresse kennen oder über andere identifizierende Informationen von Ihnen verfügen.
          </p>
          <p>
            Verwendung der erfassten Informationen: Neben den oben erläuterten Verwendungszwecken werden die von Ihnen bereitgestellten Informationen gemäß den geltenden Google-Datenschutzbestimmungen genutzt. Google veröffentlicht möglicherweise zusammengefasste Statistiken über die +1-Aktivitäten der Nutzer bzw. gibt diese an Nutzer und Partner weiter, wie etwa Publisher, Inserenten oder verbundene Websites. Die Verwendung des Google+-Plugins erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an einer möglichst umfangreichen Sichtbarkeit in den Sozialen Medien.
          </p>
          <p>Instagram Plugin</p>
          <p>
            Auf unseren Seiten sind Funktionen des Dienstes Instagram eingebunden. Diese Funktionen werden angeboten durch die Instagram Inc., 1601 Willow Road, Menlo Park, CA 94025, USA integriert.
          </p>
          <p>
            Wenn Sie in Ihrem Instagram-Account eingeloggt sind, können Sie durch Anklicken des Instagram-Buttons die Inhalte unserer Seiten mit Ihrem Instagram-Profil verlinken. Dadurch kann Instagram den Besuch unserer Seiten Ihrem Benutzerkonto zuordnen. Wir weisen darauf hin, dass wir als Anbieter der Seiten keine Kenntnis vom Inhalt der übermittelten Daten sowie deren Nutzung durch Instagram erhalten.Die Verwendung des Instagram-Plugins erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an einer möglichst umfangreichen Sichtbarkeit in den Sozialen Medien.
          </p>
          <p>
            Weitere Informationen hierzu finden Sie in der Datenschutzerklärung von Instagram: <a href="https://instagram.com/about/legal/privacy/">https://instagram.com/about/legal/privacy/</a>.
          </p>
          <p>Google Analytics</p>
          <p>
            Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.
          </p>
          <p>
            Google Analytics verwendet so genannte „Cookies“. Das sind Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert.
          </p>
          <p>
            Die Speicherung von Google-Analytics-Cookies und die Nutzung dieses Analyse-Tools erfolgen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der Analyse des Nutzerverhaltens, um sowohl sein Webangebot als auch seine Werbung zu optimieren.
          </p>
          <p>IP-Anonymisierung</p>
          <p>
            Wir haben auf dieser Website die Funktion IP-Anonymisierung aktiviert. Dadurch wird Ihre IP-Adresse von Google innerhalb von Mitgliedstaaten der Europäischen Union oder in anderen Vertragsstaaten des Abkommens über den Europäischen Wirtschaftsraum vor der Übermittlung in die USA gekürzt. Nur in Ausnahmefällen wird die volle IP-Adresse an einen Server von Google in den USA übertragen und dort gekürzt. Im Auftrag des Betreibers dieser Website wird Google diese Informationen benutzen, um Ihre Nutzung der Website auszuwerten, um Reports über die Websiteaktivitäten zusammenzustellen und um weitere mit der Websitenutzung und der Internetnutzung verbundene Dienstleistungen gegenüber dem Websitebetreiber zu erbringen. Die im Rahmen von Google Analytics von Ihrem Browser übermittelte IP-Adresse wird nicht mit anderen Daten von Google zusammengeführt.
          </p>
          <p>Browser Plugin</p>
          <p>
            Sie können die Speicherung der Cookies durch eine entsprechende Einstellung Ihrer Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website vollumfänglich werden nutzen können. Sie können darüber hinaus die Erfassung der durch den Cookie erzeugten und auf Ihre Nutzung der Website bezogenen Daten (inkl. Ihrer IP-Adresse) an Google sowie die Verarbeitung dieser Daten durch Google verhindern, indem Sie das unter dem folgenden Link verfügbare Browser-Plugin herunterladen und installieren: <a href="https://tools.google.com/dlpage/gaoptout?hl=de">https://tools.google.com/dlpage/gaoptout?hl=de</a>.
          </p>
          <p>Widerspruch gegen Datenerfassung</p>
          <p>
            Sie können die Erfassung Ihrer Daten durch Google Analytics verhindern, indem Sie auf folgenden Link klicken. Es wird ein Opt-Out-Cookie gesetzt, der die Erfassung Ihrer Daten bei zukünftigen Besuchen dieser Website verhindert: Google Analytics deaktivieren.
          </p>
          <p>
            Mehr Informationen zum Umgang mit Nutzerdaten bei Google Analytics finden Sie in der Datenschutzerklärung von Google: <a href="https://support.google.com/analytics/answer/6004245?hl=de">https://support.google.com/analytics/answer/6004245?hl=de</a>.
          </p>
          <p>Auftragsverarbeitung</p>
          <p>
            Wir haben mit Google einen Vertrag zur Auftragsverarbeitung abgeschlossen und setzen die strengen Vorgaben der deutschen Datenschutzbehörden bei der Nutzung von Google Analytics vollständig um.
          </p>
          <p>Demografische Merkmale bei Google Analytics</p>
          <p>
            Diese Website nutzt die Funktion „demografische Merkmale“ von Google Analytics. Dadurch können Berichte erstellt werden, die Aussagen zu Alter, Geschlecht und Interessen der Seitenbesucher enthalten. Diese Daten stammen aus interessenbezogener Werbung von Google sowie aus Besucherdaten von Drittanbietern. Diese Daten können keiner bestimmten Person zugeordnet werden. Sie können diese Funktion jederzeit über die Anzeigeneinstellungen in Ihrem Google-Konto deaktivieren oder die Erfassung Ihrer Daten durch Google Analytics wie im Punkt „Widerspruch gegen Datenerfassung“ dargestellt generell untersagen.
          </p>
          <p>Speicherdauer</p>
          <p>
            Bei Google gespeicherte Daten auf Nutzer- und Ereignisebene, die mit Cookies, Nutzerkennungen (z. B. User ID) oder Werbe-IDs (z. B. DoubleClick-Cookies, Android-Werbe-ID) verknüpft sind, werden nach 14 Monaten anonymisiert bzw. gelöscht. Details hierzu ersehen Sie unter folgendem Link: <a href="https://support.google.com/analytics/answer/7667196?hl=de">https://support.google.com/analytics/answer/7667196?hl=de</a>.
          </p>
          <p>Google Analytics Remarketing</p>
          <p>
            Unsere Websites nutzen die Funktionen von Google Analytics Remarketing in Verbindung mit den geräteübergreifenden Funktionen von Google AdWords und Google DoubleClick. Anbieter ist die Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.
          </p>
          <p>
            Diese Funktion ermöglicht es die mit Google Analytics Remarketing erstellten Werbe-Zielgruppen mit den geräteübergreifenden Funktionen von Google AdWords und Google DoubleClick zu verknüpfen. Auf diese Weise können interessenbezogene, personalisierte Werbebotschaften, die in Abhängigkeit Ihres früheren Nutzungs- und Surfverhaltens auf einem Endgerät (z. B. Handy) an Sie angepasst wurden auch auf einem anderen Ihrer Endgeräte (z. B. Tablet oder PC) angezeigt werden.
          </p>
          <p>
            Haben Sie eine entsprechende Einwilligung erteilt, verknüpft Google zu diesem Zweck Ihren Web- und App-Browserverlauf mit Ihrem Google-Konto. Auf diese Weise können auf jedem Endgerät auf dem Sie sich mit Ihrem Google-Konto anmelden, dieselben personalisierten Werbebotschaften geschaltet werden.
          </p>
          <p>
            Zur Unterstützung dieser Funktion erfasst Google Analytics google-authentifizierte IDs der Nutzer, die vorübergehend mit unseren Google-Analytics-Daten verknüpft werden, um Zielgruppen für die geräteübergreifende Anzeigenwerbung zu definieren und zu erstellen.
          </p>
          <p>
            Sie können dem geräteübergreifenden Remarketing/Targeting dauerhaft widersprechen, indem Sie personalisierte Werbung deaktivieren; folgen Sie hierzu diesem Link: <a href="https://www.google.com/settings/ads/onweb/">https://www.google.com/settings/ads/onweb/</a>.
          </p>
          <p>
            Die Zusammenfassung der erfassten Daten in Ihrem Google-Konto erfolgt ausschließlich auf Grundlage Ihrer Einwilligung, die Sie bei Google abgeben oder widerrufen können (Art. 6 Abs. 1 lit. a DSGVO). Bei Datenerfassungsvorgängen, die nicht in Ihrem Google-Konto zusammengeführt werden (z. B. weil Sie kein Google-Konto haben oder der Zusammenführung widersprochen haben) beruht die Erfassung der Daten auf Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse ergibt sich daraus, dass der Websitebetreiber ein Interesse an der anonymisierten Analyse der Websitebesucher zu Werbezwecken hat.
          </p>
          <p>
            Weitergehende Informationen und die Datenschutzbestimmungen finden Sie in der Datenschutzerklärung von Google unter: <a href="https://policies.google.com/technologies/ads?hl=de">https://policies.google.com/technologies/ads?hl=de</a>.
          </p>
          <p>Google AdSense</p>
          <p>
            Diese Website benutzt Google AdSense, einen Dienst zum Einbinden von Werbeanzeigen der Google Inc. („Google“). Anbieter ist die Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA. Google AdSense verwendet sogenannte „Cookies“, Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website ermöglichen. Google AdSense verwendet auch so genannte Web Beacons (unsichtbare Grafiken). Durch diese Web Beacons können Informationen wie der Besucherverkehr auf diesen Seiten ausgewertet werden. Die durch Cookies und Web Beacons erzeugten Informationen über die Benutzung dieser Website (einschließlich Ihrer IP-Adresse) und Auslieferung von Werbeformaten werden an einen Server von Google in den USA übertragen und dort gespeichert. Diese Informationen können von Google an Vertragspartner von Google weiter gegeben werden. Google wird Ihre IP-Adresse jedoch nicht mit anderen von Ihnen gespeicherten Daten zusammenführen. Die Speicherung von AdSense-Cookies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der Analyse des Nutzerverhaltens, um sowohl sein Webangebot als auch seine Werbung zu optimieren. Sie können die Installation der Cookies durch eine entsprechende Einstellung Ihrer Browser Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website voll umfänglich nutzen können. Durch die Nutzung dieser Website erklären Sie sich mit der Bearbeitung der über Sie erhobenen Daten durch Google in der zuvor beschriebenen Art und Weise und zu dem zuvor benannten Zweck einverstanden.
          </p>
          <p>Google AdWords und Google Conversion-Tracking</p>
          <p>
            Diese Website verwendet Google AdWords. AdWords ist ein Online-Werbeprogramm der Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.
          </p>
          <p>
            Im Rahmen von Google AdWords nutzen wir das so genannte Conversion-Tracking. Wenn Sie auf eine von Google geschaltete Anzeige klicken wird ein Cookie für das Conversion-Tracking gesetzt. Bei Cookies handelt es sich um kleine Textdateien, die der Internet-Browser auf dem Computer des Nutzers ablegt. Diese Cookies verlieren nach 30 Tagen ihre Gültigkeit und dienen nicht der persönlichen Identifizierung der Nutzer. Besucht der Nutzer bestimmte Seiten dieser Website und das Cookie ist noch nicht abgelaufen, können Google und wir erkennen, dass der Nutzer auf die Anzeige geklickt hat und zu dieser Seite weitergeleitet wurde.
          </p>
          <p>
            Jeder Google AdWords-Kunde erhält ein anderes Cookie. Die Cookies können nicht über die Websites von AdWords-Kunden nachverfolgt werden. Die mithilfe des Conversion-Cookies eingeholten Informationen dienen dazu, Conversion-Statistiken für AdWords-Kunden zu erstellen, die sich für Conversion-Tracking entschieden haben. Die Kunden erfahren die Gesamtanzahl der Nutzer, die auf ihre Anzeige geklickt haben und zu einer mit einem Conversion-Tracking-Tag versehenen Seite weitergeleitet wurden. Sie erhalten jedoch keine Informationen, mit denen sich Nutzer persönlich identifizieren lassen. Wenn Sie nicht am Tracking teilnehmen möchten, können Sie dieser Nutzung widersprechen, indem Sie das Cookie des Google Conversion-Trackings über ihren Internet-Browser unter Nutzereinstellungen leicht deaktivieren. Sie werden sodann nicht in die Conversion-Tracking Statistiken aufgenommen.
          </p>
          <p>
            Die Speicherung von „Conversion-Cookies“ und die Nutzung dieses Tracking-Tools erfolgen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der Websitebetreiber hat ein berechtigtes Interesse an der Analyse des Nutzerverhaltens, um sowohl sein Webangebot als auch seine Werbung zu optimieren.
          </p>
          <p>
            Mehr Informationen zu Google AdWords und Google Conversion-Tracking finden Sie in den Datenschutzbestimmungen von Google: <a href="https://policies.google.com/privacy?hl=de">https://policies.google.com/privacy?hl=de</a>.
          </p>
          <p>
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des Browser aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website eingeschränkt sein.
          </p>
        </div>
        <h3>7. Newsletter</h3>
        <div className={styles['disclaimer-text']}>
          <p>
            Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind. Weitere Daten werden nicht bzw. nur auf freiwilliger Basis erhoben. Diese Daten verwenden wir ausschließlich für den Versand der angeforderten Informationen und geben diese nicht an Dritte weiter.
          </p>
          <p>
            Die Verarbeitung der in das Newsletteranmeldeformular eingegebenen Daten erfolgt ausschließlich auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung zum Versand des Newsletters können Sie jederzeit widerrufen, etwa über den „Austragen“-Link im Newsletter. Die Rechtmäßigkeit der bereits erfolgten Datenverarbeitungsvorgänge bleibt vom Widerruf unberührt.
          </p>
          <p>
            Die von Ihnen zum Zwecke des Newsletter-Bezugs bei uns hinterlegten Daten werden von uns bis zu Ihrer Austragung aus dem Newsletter gespeichert und nach der Abbestellung des Newsletters gelöscht. Daten, die zu anderen Zwecken bei uns gespeichert wurden bleiben hiervon unberührt.
          </p>
        </div>
        <h3>8. Eigene Dienste</h3>
        <div className={styles['disclaimer-text']}>
          <p>Bewerbungen</p>
          <p>
            Wir bieten Ihnen die Möglichkeit, sich bei uns zu bewerben (z. B. per E-Mail, postalisch oder via Online-Bewerberformular). Im Folgenden informieren wir Sie über Umfang, Zweck und Verwendung Ihrer im Rahmen des Bewerbungsprozesses erhobenen personenbezogenen Daten. Wir versichern, dass die Erhebung, Verarbeitung und Nutzung Ihrer Daten in Übereinstimmung mit geltendem Datenschutzrecht und allen weiteren gesetzlichen Bestimmungen erfolgt und Ihre Daten streng vertraulich behandelt werden.
          </p>
          <p>Umfang und Zweck der Datenerhebung</p>
          <p>
            Wenn Sie uns eine Bewerbung zukommen lassen, verarbeiten wir Ihre damit verbundenen personenbezogenen Daten (z. B. Kontakt- und Kommunikationsdaten, Bewerbungsunterlagen, Notizen im Rahmen von Bewerbungsgesprächen etc.), soweit dies zur Entscheidung über die Begründung eines Beschäftigungsverhältnisses erforderlich ist. Rechtsgrundlage hierfür ist § 26 BDSG-neu nach deutschem Recht (Anbahnung eines Beschäftigungsverhältnisses), Art. 6 Abs. 1 lit. b DSGVO (allgemeine Vertragsanbahnung) und – sofern Sie eine Einwilligung erteilt haben – Art. 6 Abs. 1 lit. a DSGVO. Die Einwilligung ist jederzeit widerrufbar. Ihre personenbezogenen Daten werden innerhalb unseres Unternehmens ausschließlich an Personen weitergegeben, die an der Bearbeitung Ihrer Bewerbung beteiligt sind.
          </p>
          <p>
            Sofern die Bewerbung erfolgreich ist, werden die von Ihnen eingereichten Daten auf Grundlage von § 26 BDSG-neu und Art. 6 Abs. 1 lit. b DSGVO zum Zwecke der Durchführung des Beschäftigungsverhältnisses in unseren Datenverarbeitungssystemen gespeichert.
          </p>
          <p>Aufbewahrungsdauer der Daten</p>
          <p>
            Wenn wir Ihnen kein Stellenangebot machen können, Sie ein Stellenangebot ablehnen, Ihre Bewerbung zurückziehen, Ihre Einwilligung zur Datenverarbeitung widerrufen oder uns zur Löschung der Daten auffordern, werden die von Ihnen übermittelten Daten inkl. ggf. verbleibender physischer Bewerbungsunterlagen für maximal 6 Monate nach Abschluss des Bewerbungsverfahrens gespeichert bzw. aufbewahrt (Aufbewahrungsfrist), um die Einzelheiten des Bewerbungsprozesses im Falle von Unstimmigkeiten nachvollziehen zu können (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
          <p>
            DIESER SPEICHERUNG KÖNNEN SIE WIDERSPRECHEN, SOFERN IHRERSEITS BERECHTIGTE INTERESSEN VORLIEGEN, DIE UNSERE INTERESSEN ÜBERWIEGEN.
          </p>
          <p>
            Nach Ablauf der Aufbewahrungsfrist werden die Daten gelöscht, sofern keine gesetzliche Aufbewahrungspflicht oder ein sonstiger Rechtsgrund zur weiteren Speicherung vorliegt. Sofern ersichtlich ist, dass die Aufbewahrung Ihrer Daten nach Ablauf der Aufbewahrungsfrist erforderlich sein wird (z. B. aufgrund eines drohenden oder anhängigen Rechtsstreits), findet eine Löschung erst statt, wenn die Daten gegenstandslos geworden sind. Sonstige gesetzliche Aufbewahrungspflichten bleiben unberührt.
          </p>
        </div>
        <h3>9. Unsere Social–Media–Auftritte</h3>
        <div className={styles['disclaimer-text']}>
          <p>Datenverarbeitung durch soziale Netzwerke</p>
          <p>
            Wir unterhalten öffentlich zugängliche Profile in sozialen Netzwerken. Die im Einzelnen von uns genutzten sozialen Netzwerke finden Sie weiter unten.
          </p>
          <p>
            Soziale Netzwerke wie Facebook, Google+ etc. können Ihr Nutzerverhalten in der Regel umfassend analysieren, wenn Sie deren Webseite oder eine Webseite mit integrierten Social-Media-Inhalten (z. B. Like-Buttons oder Werbebannern) besuchen. Durch den Besuch unserer Social-Media-Präsenzen werden zahlreiche datenschutzrelevante Verarbeitungsvorgänge ausgelöst. Im Einzelnen:
          </p>
          <p>
            Wenn Sie in Ihrem Social-Media-Account eingeloggt sind und unsere Social-Media-Präsenz besuchen, kann der Betreiber des Social-Media-Portals diesen Besuch Ihrem Benutzerkonto zuordnen. Ihre personenbezogenen Daten können unter Umständen aber auch dann erfasst werden, wenn Sie nicht eingeloggt sind oder keinen Account beim jeweiligen Social-Media-Portal besitzen. Diese Datenerfassung erfolgt in diesem Fall beispielsweise über Cookies, die auf Ihrem Endgerät gespeichert werden oder durch Erfassung Ihrer IP-Adresse.
          </p>
          <p>
            Mit Hilfe der so erfassten Daten können die Betreiber der Social-Media-Portale Nutzerprofile erstellen, in denen Ihre Präferenzen und Interessen hinterlegt sind. Auf diese Weise kann Ihnen interessenbezogene Werbung in- und außerhalb der jeweiligen Social-Media-Präsenz angezeigt werden. Sofern Sie über einen Account beim jeweiligen sozialen Netzwerk verfügen, kann die interessenbezogene Werbung auf allen Geräten angezeigt werden, auf denen Sie eingeloggt sind oder eingeloggt waren.
          </p>
          <p>
            Bitte beachten Sie außerdem, dass wir nicht alle Verarbeitungsprozesse auf den Social-Media-Portalen nachvollziehen können. Je nach Anbieter können daher ggf. weitere Verarbeitungsvorgänge von den Betreibern der Social-Media-Portale durchgeführt werden. Details hierzu entnehmen Sie den Nutzungsbedingungen und Datenschutzbestimmungen der jeweiligen Social-Media-Portale.
          </p>
          <p>Rechtsgrundlage</p>
          <p>
            Unsere Social-Media-Auftritte sollen eine möglichst umfassende Präsenz im Internet gewährleisten. Hierbei handelt es sich um ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO. Die von den sozialen Netzwerken initiierten Analyseprozesse beruhen ggf. auf abweichenden Rechtsgrundlagen, die von den Betreibern der sozialen Netzwerke anzugeben sind (z. B. Einwilligung im Sinne des Art. 6 Abs. 1 lit. a DSGVO).
          </p>
          <p>Verantwortlicher und Geltendmachung von Rechten</p>
          <p>
            Wenn Sie einen unserer Social-Media-Auftritte (z. B. Facebook) besuchen, sind wir gemeinsam mit dem Betreiber der Social-Media-Plattform für die bei diesem Besuch ausgelösten Datenverarbeitungsvorgänge verantwortlich. Sie können Ihre Rechte (Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Beschwerde) grundsätzlich sowohl ggü. uns als auch ggü. dem Betreiber des jeweiligen Social-Media-Portals (z. B. ggü. Facebook) geltend machen.
          </p>
          <p>
            Bitte beachten Sie, dass wir trotz der gemeinsamen Verantwortlichkeit mit den Social-Media-Portal-Betreibern nicht vollumfänglich Einfluss auf die Datenverarbeitungsvorgänge der Social-Media-Portale haben. Unsere Möglichkeiten richten sich maßgeblich nach der Unternehmenspolitik des jeweiligen Anbieters.
          </p>
          <p>Speicherdauer</p>
          <p>
            Die unmittelbar von uns über die Social-Media-Präsenz erfassten Daten werden von unseren Systemen gelöscht, sobald der Zweck für ihre Speicherung entfällt, Sie uns zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck für die Datenspeicherung entfällt. Gespeicherte Cookies verbleiben auf Ihrem Endgerät, bis Sie sie löschen. Zwingende gesetzliche Bestimmungen – insb. Aufbewahrungsfristen – bleiben unberührt.
          </p>
          <p>
            Auf die Speicherdauer Ihrer Daten, die von den Betreibern der sozialen Netzwerke zu eigenen Zwecken gespeichert werden, haben wir keinen Einfluss. Für Einzelheiten dazu informieren Sie sich bitte direkt bei den Betreibern der sozialen Netzwerke (z. B. in deren Datenschutzerklärung, siehe unten).
          </p>
          <p>Soziale Netzwerke im Einzelnen</p>
          <p>
            Facebook
          </p>
          <p>
            Wir verfügen über ein Profil bei Facebook. Anbieter ist die Facebook Inc., 1 Hacker Way, Menlo Park, California 94025, USA. Facebook verfügt über eine Zertifizierung nach dem EU-US-Privacy-Shield.
          </p>
          <p>
            Wir haben mit Facebook eine Vereinbarung über gemeinsame Verarbeitung (Controller Addendum) geschlossen. In dieser Vereinbarung wird festgelegt, für welche Datenverarbeitungsvorgänge wir bzw. Facebook verantwortlich ist, wenn Sie unsere Facebook-Page besuchen. Diese Vereinbarung können Sie unter folgendem Link einsehen: <a href="https://www.facebook.com/legal/terms/page_controller_addendum">https://www.facebook.com/legal/terms/page_controller_addendum</a>.
          </p>
          <p>
            Sie können Ihre Werbeeinstellungen selbstständig in Ihrem Nutzer-Account anpassen. Klicken Sie hierzu auf folgenden Link und loggen Sie sich ein:<a href="https://www.facebook.com/settings?tab=ads">https://www.facebook.com/settings?tab=ads</a>.
          </p>
          <p>
            Details entnehmen Sie der Datenschutzerklärung von Facebook: <a href="https://www.facebook.com/about/privacy/">https://www.facebook.com/about/privacy/</a>.
          </p>
          <p>Google+</p>
          <p>
            Wir verfügen über ein Profil bei Google+. Anbieter ist die Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland. Google verfügt über eine Zertifizierung nach dem EU-US-Privacy-Shield:
          </p>
          <p>
            Sie können Ihre Werbeeinstellungen selbstständig in Ihrem Nutzer-Account anpassen. Klicken Sie hierzu auf folgenden Link und loggen Sie sich ein: <a href="https://adssettings.google.com/authenticated">https://adssettings.google.com/authenticated</a>.
          </p>
          <p>
            Details entnehmen Sie der Datenschutzerklärung von Google: <a href="https://policies.google.com/privacy">https://policies.google.com/privacy</a>.
          </p>
          <p>Twitter</p>
          <p>
            Wir nutzen den Kurznachrichtendienst Twitter. Anbieter ist die Twitter Inc., 1355 Market Street, Suite 900, San Francisco, CA 94103, USA. Twitter verfügt über eine Zertifizierung nach dem EU-US-Privacy-Shield.
          </p>
          <p>
            Sie können Ihre Twitter-Datenschutzeinstellungen selbstständig in Ihrem Nutzer-Account anpassen. Klicken Sie hierzu auf folgenden Link und loggen Sie sich ein: <a href="https://twitter.com/personalization">https://twitter.com/personalization</a>.
          </p>
          <p>
            Details entnehmen Sie der Datenschutzerklärung von Twitter: <a href="https://twitter.com/de/privacy">https://twitter.com/de/privacy</a>.
          </p>
          <p>Instagram</p>
          <p>
            Wir verfügen über ein Profil bei Instagram. Anbieter ist die Instagram Inc., 1601 Willow Road, Menlo Park, CA, 94025, USA. Details zu deren Umgang mit Ihren personenbezogenen Daten entnehmen Sie der Datenschutzerklärung von Instagram: <a href="https://help.instagram.com/519522125107875">https://help.instagram.com/519522125107875</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatenschutzPage;
