import Hero from "../../components/Hero";
import type { Metadata } from "next";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "Über Uns | Aufraeumhelden",
  description:
    "Lernen Sie uns kennen: Ihre zuverlässige Umzugsfirma für Hildesheim, Hannover und weltweite Umzüge. Erfahrung, Sorgfalt und Flexibilität für Privat- & Firmenkunden.",
  keywords:
    "über uns umzugsfirma, umzugsunternehmen hildesheim, umzugsfirma hannover, erfahrung umzüge, firmenphilosophie umzug, umzugsteam",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/about",
  },
};

const AboutPage = () => {
  const heroData = {
    title: "Ihr starker Partner für Umzüge: Lernen Sie uns kennen",
    subtitle:
      "Mit Erfahrung, Sorgfalt und Flexibilität machen wir Ihren Umzug einfach – lokal und weltweit.",
    image: "/umzuege-und-haushaltsaufloesungen-ueber-uns.jpg",
    ctaText: "Unverbindlich anfragen",
    ctaLink: "/kontakt",
  };

  return (
    <>
      <Hero heroData={heroData} />

      <div className={styles.content}>
        <h2 className={styles.heading2}>
          Mehr als ein Jahrzehnt Umzugserfahrung – Ihr Vorteil
        </h2>
        <p className={styles.paragraph}>
          Seit über zehn Jahren sind wir in der Umzugsbranche tätig und haben
          uns in Hildesheim, Hannover und darüber hinaus einen Namen gemacht.
          Dieses Know-how setzen wir täglich ein, um Ihren Privat- oder
          Firmenumzug – ob lokal, national oder international – reibungslos und
          effizient zu gestalten. Unser Team ist mit bewährten Methoden ebenso
          vertraut wie mit modernen Techniken, damit Sie stets den besten
          Service erhalten. Jeder erfolgreich abgeschlossene Umzug erweitert
          unseren Erfahrungsschatz, der direkt Ihnen zugutekommt.
        </p>

        <h2 className={styles.heading2}>
          Sorgfalt bis ins Detail – Für einen Umzug ohne Überraschungen
        </h2>
        <p className={styles.paragraph}>
          Bei uns wird nichts dem Zufall überlassen. Von der umfassenden
          Erstberatung und detaillierten Planung bis zum sorgfältigen Verpacken
          und dem umsichtigen Transport Ihrer Güter – wir achten auf jedes
          Detail. Ihr Hab und Gut, ob wertvolle Erbstücke oder wichtige
          Büroausstattung, wird von uns mit größter Umsicht behandelt.
          Hochwertige Verpackungsmaterialien und unsere geschulten Mitarbeiter
          sorgen dafür, dass alles sicher und unversehrt am Zielort ankommt.
        </p>

        <h2 className={styles.heading2}>
          Flexibel und anpassungsfähig – Ihre Bedürfnisse im Mittelpunkt
        </h2>
        <p className={styles.paragraph}>
          Das Leben ist nicht immer planbar – Ihr Umzugspartner sollte es sein.
          Ob kurzfristiger Umzugstermin, spezielle Transportanforderungen für
          Ihr Unternehmen oder besondere Wünsche für Ihren privaten
          Wohnortwechsel: Wir sind flexibel und passen unsere Leistungen Ihren
          individuellen Bedürfnissen an. Unser Ziel ist es, Ihnen auch bei
          komplexen Herausforderungen stets die optimale Lösung zu bieten und
          Sie umfassend zu unterstützen.
        </p>

        <h2 className={styles.heading2}>
          Verantwortungsvoll handeln – Unser Beitrag zur Nachhaltigkeit
        </h2>
        <p className={styles.paragraph}>
          Als modernes Dienstleistungsunternehmen sind wir uns unserer
          ökologischen Verantwortung bewusst. Daher setzen wir auf nachhaltige
          Praktiken: von der Verwendung wiederverwendbarer oder recycelbarer
          Verpackungsmaterialien über eine optimierte Routenplanung zur
          Reduzierung von Fahrstrecken bis hin zur fachgerechten Entsorgung
          nicht mehr benötigter Gegenstände. So leisten wir unseren Beitrag zum
          Umweltschutz, ohne Kompromisse bei der Qualität unserer
          Umzugsdienstleistungen einzugehen.
        </p>

        <h2 className={styles.heading2}>Ihr Vertrauen ist unser Antrieb</h2>
        <p className={styles.paragraph}>
          Professionalität, Zuverlässigkeit und eine persönliche Betreuung
          stehen bei uns an erster Stelle. Wir hören Ihnen genau zu, verstehen
          Ihre individuellen Anforderungen – sei es für den Umzug Ihrer Familie
          oder die Verlagerung Ihres Unternehmens – und arbeiten eng mit Ihnen
          zusammen. Ihr Vertrauen motiviert uns täglich, Ihren Umzug in
          Hildesheim, Hannover oder an jeden anderen Ort der Welt zu einem
          positiven und stressfreien Erlebnis zu machen. Überzeugen Sie sich
          selbst!
        </p>
      </div>
    </>
  );
};

export default AboutPage;
