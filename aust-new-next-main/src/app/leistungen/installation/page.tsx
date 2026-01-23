import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Installationsservice Hildesheim & Hannover | Lampen, Küchen & mehr",
  description: "Professioneller Installationsservice in Hildesheim und Hannover. Wir übernehmen die Montage von Lampen, den Anschluss von Küchengeräten und weitere Elektroinstallationen. Sicher und zuverlässig.",
  keywords: "installationsservice, lampen anschließen, küchenmontage, elektroinstallation, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/installation",
  },
};

const InstallationPage = () => {
  return (
    <ContentHolder
      imageUrl="/installations-service.svg"
      heading="Installationsservice in Hildesheim & Hannover"
      text={`Damit in Ihrem neuen Zuhause alles auf Anhieb funktioniert, bieten wir Ihnen unseren professionellen Installationsservice in Hildesheim und Hannover an. Unsere erfahrenen Handwerker kümmern sich um alle anfallenden Anschluss- und Montagearbeiten.

### Unsere Installationsleistungen:
- **Lampen und Leuchten:** Wir montieren und schließen alle Arten von Lampen sicher an, von der Deckenleuchte bis zur Wandlampe.
- **Küchengeräte:** Wir übernehmen den fachgerechten Anschluss von Herd, Spülmaschine, Waschmaschine und anderen Elektrogeräten.
- **Gardinen und Rollos:** Wir montieren Ihre Gardinenstangen, Rollos und Jalousien passgenau und sicher.
- **Weitere Kleinmontagen:** Auch bei anderen kleinen Montagearbeiten, wie dem Anbringen von Bad-Accessoires oder dem Aufbau von Kleinmöbeln, sind wir Ihnen gerne behilflich.

Verlassen Sie sich auf unsere Expertise und genießen Sie den Komfort eines voll funktionsfähigen Zuhauses vom ersten Tag an. Wir arbeiten schnell, sauber und sicher.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default InstallationPage;