import type { Metadata } from 'next';
import Link from 'next/link';
import styles from '../ratgeber.module.css'; // Assuming a shared ratgeber.module.css for styling

export const metadata: Metadata = {
  title: "Umzug Checkliste: Ihr Leitfaden für einen stressfreien Umzug",
  description: "Eine detaillierte Checkliste für Ihren Umzug in Deutschland. Von der Planung bis zum Einzug – alles, was Sie wissen müssen für einen reibungslosen Ablauf.",
  keywords: "umzug checkliste, umzugsplanung, umzug tipps, stressfreier umzug, umzug vorbereiten, umzug deutschland",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/ratgeber/umzug-checkliste",
  },
};

const UmzugChecklistePage = () => {
  return (
    <main className={styles['ratgeber-container']}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Umzug Checkliste: Ihr Leitfaden für einen stressfreien Umzug",
            "description": "Eine detaillierte Checkliste für Ihren Umzug in Deutschland. Von der Planung bis zum Einzug – alles, was Sie wissen müssen für einen reibungslosen Ablauf.",
            "image": "https://www.aufraeumhelden.com/ratgeber-fur-ihren-umzug-in-hildesheim.jpg", // Placeholder image
            "datePublished": "2025-07-02T08:00:00+01:00", // Today's date
            "author": {
              "@type": "Organization",
              "name": "Aufraeumhelden",
              "url": "https://www.aufraeumhelden.com"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Aufraeumhelden",
              "logo": {
                "@type": "ImageObject",
                "url": "https://www.aufraeumhelden.com/favicon.svg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://www.aufraeumhelden.com/ratgeber/umzug-checkliste"
            }
          })
        }}
      />
      <h1 className={styles.heading1}>Umzug Checkliste: Ihr Leitfaden für einen stressfreien Umzug</h1>

      <p className={styles.paragraph}>
        Ein Umzug kann eine aufregende, aber auch stressige Zeit sein. Mit der richtigen Planung und einer detaillierten <Link href="/ratgeber/checkliste">Checkliste</Link> behalten Sie den Überblick und sorgen für einen reibungslosen Ablauf. Hier finden Sie eine umfassende Anleitung, die Ihnen hilft, nichts zu vergessen.
      </p>

      <h2 className={styles.heading2}>Phase 1: 8-12 Wochen vor dem Umzug</h2>
      <h3 className={styles.heading3}>Umzugsunternehmen auswählen</h3>
      <p className={styles.paragraph}>
        Beginnen Sie frühzeitig mit der Suche nach einem zuverlässigen Umzugsunternehmen. Holen Sie mehrere Angebote ein und vergleichen Sie Leistungen sowie Preise. Achten Sie auf Referenzen und Versicherungen. <Link href="/leistungen/umzuege">Erfahren Sie mehr über unsere Umzugsservices.</Link>
      </p>

      <h3 className={styles.heading3}>Mietvertrag prüfen und kündigen</h3>
      <p className={styles.paragraph}>
        Überprüfen Sie die Kündigungsfristen Ihres aktuellen Mietvertrags und senden Sie die Kündigung fristgerecht ab. Vereinbaren Sie einen Termin für die Wohnungsübergabe.
      </p>

      <h3 className={styles.heading3}>Neuen Mietvertrag unterschreiben</h3>
      <p className={styles.paragraph}>
        Stellen Sie sicher, dass alle Details im neuen Mietvertrag klar sind, bevor Sie unterschreiben.
      </p>

      <h2 className={styles.heading2}>Phase 2: 4-6 Wochen vor dem Umzug</h2>
      <h3 className={styles.heading3}>Ummeldungen und Adressänderungen</h3>
      <p className={styles.paragraph}>
        Informieren Sie alle wichtigen Stellen über Ihre neue Adresse: Post, Banken, Versicherungen, Arbeitgeber, Schulen, Kindergärten, Ärzte, Vereine, Abonnements. Beantragen Sie einen Nachsendeauftrag bei der Post.
      </p>

      <h3 className={styles.heading3}>Versorger informieren</h3>
      <p className={styles.paragraph}>
        Melden Sie Strom, Gas, Wasser und Internet/Telefon um oder kündigen Sie diese und melden Sie sich neu an. Notieren Sie die Zählerstände am Umzugstag.
      </p>

      <h3 className={styles.heading3}>Umzugskartons besorgen</h3>
      <p className={styles.paragraph}>
        Beginnen Sie, Umzugskartons zu sammeln oder zu kaufen. Beschriften Sie diese deutlich mit Inhalt und Zielraum. <Link href="/leistungen/umzugskartons">Wir bieten auch Umzugskartons an.</Link>
      </p>

      <h2 className={styles.heading2}>Phase 3: 1-2 Wochen vor dem Umzug</h2>
      <h3 className={styles.heading3}>Packen beginnen</h3>
      <p className={styles.paragraph}>
        Beginnen Sie mit dem Packen von Dingen, die Sie nicht täglich benötigen. Schützen Sie zerbrechliche Gegenstände gut. <Link href="/leistungen/einpackservice">Nutzen Sie unseren professionellen Einpackservice.</Link>
      </p>

      <h3 className={styles.heading3}>Halteverbotszone einrichten</h3>
      <p className={styles.paragraph}>
        Beantragen Sie rechtzeitig eine Halteverbotszone vor Ihrer alten und neuen Wohnung, falls nötig.
      </p>

      <h3 className={styles.heading3}>Wohnung vorbereiten</h3>
      <p className={styles.paragraph}>
        Führen Sie kleinere Reparaturen durch und beginnen Sie mit der Reinigung. <Link href="/leistungen/malerarbeiten">Wir unterstützen Sie auch bei Malerarbeiten.</Link>
      </p>

      <h2 className={styles.heading2}>Phase 4: Am Umzugstag</h2>
      <h3 className={styles.heading3}>Zählerstände notieren</h3>
      <p className={styles.paragraph}>
        Notieren Sie alle Zählerstände (Strom, Gas, Wasser) in der alten und neuen Wohnung.
      </p>

      <h3 className={styles.heading3}>Übergabeprotokoll</h3>
      <p className={styles.paragraph}>
        Füllen Sie das Übergabeprotokoll sorgfältig aus und lassen Sie es von allen Parteien unterschreiben.
      </p>

      <h3 className={styles.heading3}>Letzte Kontrolle</h3>
      <p className={styles.paragraph}>
        Gehen Sie ein letztes Mal durch alle Räume, um sicherzustellen, dass nichts vergessen wurde.
      </p>

      <h2 className={styles.heading2}>Phase 5: Nach dem Umzug</h2>
      <h3 className={styles.heading3}>Wohnsitz ummelden</h3>
      <p className={styles.paragraph}>
        Melden Sie Ihren Wohnsitz innerhalb der gesetzlichen Frist am neuen Ort an.
      </p>

      <h3 className={styles.heading3}>Auspacken und einrichten</h3>
      <p className={styles.paragraph}>
        Beginnen Sie mit dem Auspacken und Einrichten. <Link href="/leistungen/auspackservice">Unser Auspackservice hilft Ihnen gerne.</Link>
      </p>

      <p className={styles.paragraph}>
        Mit dieser Checkliste wird Ihr Umzug deutlich entspannter. Bei Fragen oder für professionelle Unterstützung stehen wir Ihnen jederzeit zur Verfügung.
      </p>

      <Link className={styles['back-link']} href="/ratgeber">Zurück zum Ratgeber</Link>
    </main>
  );
};

export default UmzugChecklistePage;
