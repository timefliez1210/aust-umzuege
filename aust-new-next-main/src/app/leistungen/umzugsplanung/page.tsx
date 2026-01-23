import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Umzugsplanung Hildesheim & Hannover | Umzugsberatung",
  description: "Professionelle Umzugsplanung und -beratung in Hildesheim und Hannover. Wir erstellen einen detaillierten Plan für Ihren Umzug, damit am großen Tag alles reibungslos läuft. Kontaktieren Sie uns für eine kostenlose Beratung.",
  keywords: "umzugsplanung, umzugsberatung, umzugscheckliste, umzug organisieren, umzugsfirma, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/umzugsplanung",
  },
};

const UmzugsplanungPage = () => {
  return (
    <ContentHolder
      imageUrl="/umzugsplanung-service.svg"
      heading="Detaillierte Umzugsplanung in Hildesheim & Hannover"
      text={`Ein erfolgreicher Umzug beginnt mit einer professionellen Planung. Wir unterstützen Sie mit unserer Erfahrung und unserem Know-how bei der Organisation Ihres Umzugs in Hildesheim und Hannover, damit am Umzugstag alles reibungslos verläuft.

### Unsere Leistungen in der Umzugsplanung:
- **Persönliche Umzugsberatung:** Wir besprechen mit Ihnen alle Details Ihres Umzugs und erstellen ein individuelles Konzept.
- **Erstellung einer Umzugscheckliste:** Wir helfen Ihnen, den Überblick zu behalten und an alles Wichtige zu denken.
- **Koordination von Terminen:** Wir koordinieren alle beteiligten Dienstleister und sorgen für einen reibungslosen Zeitplan.
- **Beantragung von Halteverbotszonen:** Wir kümmern uns um die notwendigen Genehmigungen, damit am Umzugstag genügend Platz für den LKW vorhanden ist.
- **Ermittlung des Umzugsvolumens:** Wir helfen Ihnen bei der Einschätzung des Umzugsvolumens, um die richtige Fahrzeuggröße und die benötigte Anzahl an Helfern zu planen.

Eine gute Planung ist die Basis für einen stressfreien Umzug. Überlassen Sie die Organisation uns und freuen Sie sich auf Ihr neues Zuhause.`}
      showButton={true}
      buttonText="Jetzt kostenlos beraten lassen"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default UmzugsplanungPage;