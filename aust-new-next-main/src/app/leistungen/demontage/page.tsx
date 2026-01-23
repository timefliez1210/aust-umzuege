import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Möbeldemontage Hildesheim & Hannover | Fachgerecht & Sicher",
  description: "Professionelle Demontage Ihrer Möbel für einen reibungslosen Umzug in Hildesheim und Hannover. Wir zerlegen Ihre Einrichtung fachgerecht und sicher. Kontaktieren Sie uns für ein unverbindliches Angebot.",
  keywords: "möbeldemontage, möbel abbauen, umzugsvorbereitung, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/demontage",
  },
};

const DemontagePage = () => {
  return (
    <ContentHolder
      imageUrl="/demontage-service.svg"
      heading="Fachgerechte Möbeldemontage in Hildesheim & Hannover"
      text={`Eine sorgfältige Demontage ist der erste Schritt für einen gelungenen Umzug. Unsere erfahrenen Möbelpacker in Hildesheim und Hannover übernehmen die fachgerechte Demontage Ihrer Möbel und Einrichtungsgegenstände.

### Unser Demontage-Service umfasst:
- **Schränke und Regale:** Wir demontieren Kleiderschränke, Wohnwände und Regalsysteme jeder Art und Größe.
- **Betten und Sofas:** Auch komplexe Bettgestelle oder große Wohnlandschaften werden von uns sicher zerlegt.
- **Küchen:** Wir übernehmen die Demontage von Küchenzeilen und Einbauküchen, inklusive der fachgerechten Trennung von Wasser- und Stromanschlüssen durch qualifizierte Partner.
- **Systemmöbel:** Büromöbel und andere Systemeinrichtungen werden von uns sorgfältig und systematisch demontiert.

Wir achten darauf, dass alle Teile sorgfältig behandelt und für den Transport sicher verpackt werden. Schrauben und Kleinteile werden von uns beschriftet, um eine reibungslose Montage am neuen Wohnort zu gewährleisten.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default DemontagePage;