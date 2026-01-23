import Hero from "../../components/Hero";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./ratgeber.module.css";

export const metadata: Metadata = {
  title: "Ihr Umzugsratgeber: Tipps für Umzug & Haushaltsauflösung | Aufraeumhelden",
  description:
    "Finden Sie hilfreiche Tipps und Checklisten für Ihren Umzug (lokal, Deutschland, EU) und Haushaltsauflösungen. Ihr Ratgeber für eine stressfreie Planung und Durchführung mit Ihrem Umzugsunternehmen.",
  keywords:
    "umzugsratgeber, umzugstipps, checkliste umzug, haushaltsauflösung hilfe, büroumzug planen, umzug EU, umzugsfirma ratgeber, Hildesheim, Hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/ratgeber",
  },
};

const RatgeberPage = () => {
  const heroData = {
    title: "Ihr Umzugs- & Entrümpelungsratgeber für Hildesheim und Hannover",
    subtitle:
      "Wertvolle Tipps und praktische Antworten für einen reibungslosen Ablauf.",
    image: "/ratgeber-fur-ihren-umzug-in-hildesheim.jpg",
    ctaText: "Jetzt anfragen",
    ctaLink: "/kontakt",
  };

  return (
    <>
      <Hero heroData={heroData} />
      <div className={styles["summary-container"]}>
        <h2>Ratgeber: Büroumzüge clever meistern</h2>
        <p>
          Ein <Link href="/leistungen/firmenumzug"><strong>Firmenumzug</strong></Link> steht an? Entdecken Sie hier alles Wissenswerte für
          einen erfolgreichen Büroumzug – von der strategischen Planung bis zur
          finalen Einrichtung. Unser Ratgeber versorgt Sie mit praxisnahen Tipps
          und klaren Antworten, damit Ihr Unternehmensumzug effizient und
          störungsfrei verläuft.
        </p>
        <Link href="/ratgeber/buro-umzuege">
          <button className={`${styles["summary-link"]} button`}>
            Mehr erfahren
          </button>
        </Link>
      </div>
      <div className={styles["summary-container"]}>
        <h2>Ratgeber: Entrümpelungen leicht gemacht</h2>
        <p>
          Sie möchten Platz schaffen? Hier finden Sie praktische Antworten auf
          Ihre Fragen rund ums <Link href="/leistungen/entruempelungen"><strong>Entrümpeln</strong></Link>. Erfahren Sie mehr über den
          Unterschied zur <Link href="/leistungen/haushaltsaufloesungen"><strong>Haushaltsauflösung</strong></Link>, wichtige Aspekte bei der Planung
          und was es rechtlich zu beachten gilt. Mit unseren Tipps für
          Hildesheim und Hannover wird Ihre Entrümpelung stressfrei und
          effizient.
        </p>
        <Link href="/ratgeber/entruempelungen">
          <button className={`${styles["summary-link"]} button`}>
            Mehr erfahren
          </button>
        </Link>
      </div>

      <div className={styles["summary-container"]}>
        <h2>Ratgeber: Haushaltsauflösungen im Blick</h2>
        <p>
          Steht eine <Link href="/leistungen/haushaltsaufloesungen"><strong>Haushaltsauflösung</strong></Link> bevor? Wir beantworten Ihre wichtigsten
          Fragen – von der sorgfältigen Planung über rechtliche
          Rahmenbedingungen bis hin zu einem reibungslosen Ablauf. Entdecken Sie
          unsere praxisnahen Tipps für Hildesheim und Hannover, damit Sie diesen
          Schritt stressfrei meistern und sich auf das Wesentliche konzentrieren
          können.
        </p>
        <Link href="/ratgeber/haushaltsaufloesungen">
          <button className={`${styles["summary-link"]} button`}>
            Mehr erfahren
          </button>
        </Link>
      </div>
      <div className={styles["summary-container"]}>
        <h2>Ihr Wegweiser: Umzug ins EU-Ausland</h2>
        <p>
          Planen Sie einen <Link href="/leistungen/umzuege"><strong>Umzug</strong></Link> in ein anderes EU-Land? Unser Ratgeber
          informiert Sie umfassend über alle wichtigen rechtlichen, logistischen
          und sozialen Aspekte. Wir geben Ihnen wertvolle Tipps und praxisnahe
          Antworten für einen gelungenen Start – ganz gleich, ob Ihr Weg von
          Hildesheim, Hannover oder anderswo beginnt. So sind Sie bestens
          vorbereitet.
        </p>
        <Link href="/ratgeber/umziehen-im-euro-raum">
          <button className={`${styles["summary-link"]} button`}>
            Mehr erfahren
          </button>
        </Link>
      </div>
      <div className={styles["summary-container"]}>
        <h2>Ihre Umzugscheckliste zum Ausdrucken</h2>
        <p>
          Gut geplant ist halb umgezogen! Nutzen Sie unsere detaillierte,
          druckbare Checkliste für Ihren Umzug innerhalb Deutschlands. Diese
          begleitet Sie Schritt für Schritt bei Ihrer Umzugsplanung in
          Hildesheim, Hannover und Umgebung – von der ersten Kiste bis zum
          Ankommen im neuen Zuhause. Behalten Sie stets den Überblick und
          vergessen Sie kein wichtiges Detail.
        </p>
        <Link href="./ratgeber/checkliste">
          <button className={`${styles["summary-link"]} button`}>
            Checkliste anzeigen
          </button>
        </Link>
      </div>
      <div className={styles["summary-container"]}>
        <h2>Ratgeber: Umzug in Deutschland – Gut zu wissen</h2>
        <p>
          Ein Umzug innerhalb Deutschlands steht bevor? Entdecken Sie unsere
          gesammelten Tipps und Antworten für einen reibungslosen Ablauf. Von
          der Ummeldung Ihres Wohnsitzes über die Wahl des passenden
          Umzugsunternehmens bis hin zur detaillierten Planung – wir informieren
          Sie umfassend, damit Ihr Umzug in Hildesheim, Hannover oder einer
          anderen Stadt stressfrei gelingt.
        </p>
        <Link href="./ratgeber/faq">
          <button className={`${styles["summary-link"]} button`}>
            Mehr erfahren
          </button>
        </Link>
      </div>
    </>
  );
};

export default RatgeberPage;
