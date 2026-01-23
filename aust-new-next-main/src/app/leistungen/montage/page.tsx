import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Möbelmontage Hildesheim & Hannover | Fachgerecht & Schnell",
  description: "Professionelle Montage Ihrer Möbel in Hildesheim und Hannover. Wir bauen Ihre Einrichtung fachgerecht und schnell wieder auf. Kontaktieren Sie uns für ein unverbindliches Angebot.",
  keywords: "möbelmontage, möbel aufbauen, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/montage",
  },
};

const MontagePage = () => {
  return (
    <ContentHolder
      imageUrl="/montage-service.svg"
      heading="Professionelle Möbelmontage in Hildesheim & Hannover"
      text={`Nach dem Transport Ihrer Möbel steht der Wiederaufbau an. Unser professioneller Montageservice in Hildesheim und Hannover sorgt dafür, dass Ihre Einrichtung schnell und fachgerecht montiert wird, damit Sie sich in Ihrem neuen Zuhause sofort wohlfühlen.

### Unser Montageservice im Überblick:
- **Möbel aller Art:** Wir montieren Möbelstücke aller Hersteller und Typen, von der einfachen Kommode bis zur komplexen Schrankwand.
- **Küchenmontage:** Unsere erfahrenen Monteure übernehmen den kompletten Aufbau Ihrer Küche, inklusive der Anpassung von Arbeitsplatten und dem Einbau von Elektrogeräten.
- **Büromöbel:** Wir montieren Schreibtische, Regalsysteme und andere Büromöbel schnell und effizient.
- **Passgenauer Aufbau:** Wir achten auf eine präzise und stabile Montage, damit alles perfekt passt und sicher steht.

Sparen Sie sich den Stress und die Mühe des Möbelaufbaus. Mit unserem Montageservice können Sie sicher sein, dass Ihre Möbel in besten Händen sind. Wir arbeiten schnell, sauber und zuverlässig.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default MontagePage;