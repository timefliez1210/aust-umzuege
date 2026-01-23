import type { Metadata } from "next";
import Link from "next/link";
import styles from "./impressum.module.css";

export const metadata: Metadata = {
  title: "Impressum | Aufraeumhelden",
  description: "Impressum der Aufraeumhelden Website.",
};

const ImpressumPage = () => {
  return (
    <div className={styles["impressum-container"]}>
      <h1 className={styles.heading1}>Impressum</h1>

      <div className={styles["company-info"]}>
        <h2>Website: Aufraeumhelden Hannover & Hildesheim</h2>
        <ul className={styles["info-list"]}>
          <li>
            <strong>Betrieben von:</strong> Aust Umzuge und Haushaltsauflösungen
          </li>
          <li>
            <strong>Ansprechpartner:</strong> Alex Aust
          </li>
          <li>
            <strong>Anschrift:</strong> Ehrlicherstr. 38, 31135 Hildesheim
          </li>
          <li>
            <strong>Telefon:</strong> 05121 – 7558379
          </li>
          <li>
            <strong>Steuer-ID:</strong> 30/101/22146
          </li>
          <li>
            <strong>Internet:</strong>{" "}
            <a
              href="https://www.aufraeumhelden.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              www.aufraeumhelden.com
            </a>
          </li>
        </ul>
      </div>

      <div className={styles["disclaimer-section"]}>
        <h2>Haftungsausschluss (Disclaimer)</h2>

        <h3>Haftung für Inhalte</h3>
        <div className={styles["disclaimer-text"]}>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §
          8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
          übermittelte oder gespeicherte fremde Informationen zu überwachen oder
          nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
          hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung
          von Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
          Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </div>

        <h3>Haftung für Links</h3>
        <div className={styles["disclaimer-text"]}>
          Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
          Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine
          permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne
          konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
          Bekanntwerden von Rechtsverletzungen werden wir derartige Links
          umgehend entfernen.
        </div>

        <h3>Urheberrecht</h3>
        <div className={styles["disclaimer-text"]}>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors oder Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
          wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
          Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf
          eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
          entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
          werden wir derartige Inhalte umgehend entfernen.
        </div>

        <h3>Online-Streitbeilegung gemäß Art. 14 Abs. 1 ODR-VO</h3>
        <div className={styles["disclaimer-text"]}>
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit, die Sie unter{" "}
          <a
            href="https://ec.europa.eu/consumers/odr/"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://ec.europa.eu/consumers/odr/
          </a>{" "}
          finden. Darüber hinaus nimmt unser Betrieb an einem
          Verbraucherstreitigkeit-verfahren nicht teil.
        </div>

        <div className={styles["disclaimer-text"]}>
          Bitte beachten Sie auch unsere{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </div>
      </div>
    </div>
  );
};

export default ImpressumPage;
