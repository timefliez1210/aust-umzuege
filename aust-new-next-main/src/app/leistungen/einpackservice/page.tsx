import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Einpackservice Hildesheim & Hannover | Sicher & Effizient",
  description: "Sparen Sie Zeit und schützen Sie Ihr Hab und Gut mit unserem professionellen Einpackservice in Hildesheim und Hannover. Wir verpacken alles sicher und systematisch für Ihren Umzug. Fordern Sie jetzt Ihr Angebot an.",
  keywords: "einpackservice, umzugshilfe, kisten packen, verpackungsservice, umzug, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/einpackservice",
  },
};

const EinpackservicePage = () => {
  return (
    <ContentHolder
      imageUrl="/einpackservice.svg"
      heading="Professioneller Einpackservice in Hildesheim & Hannover"
      text={`Das richtige Verpacken ist entscheidend für einen schadensfreien Umzug. Unser professioneller Einpackservice in Hildesheim und Hannover nimmt Ihnen diese zeitaufwendige und anspruchsvolle Aufgabe ab.

### So schützen wir Ihr Hab und Gut:
- **Hochwertiges Verpackungsmaterial:** Wir verwenden stabile Umzugskartons, Seidenpapier für Zerbrechliches, Luftpolsterfolie für empfindliche Gegenstände und spezielle Kleiderboxen für Ihre Garderobe.
- **Systematisches Packen:** Wir packen Raum für Raum und beschriften alle Kartons detailliert. So wissen Sie im neuen Zuhause sofort, was sich wo befindet.
- **Schutz von Möbeln und Elektrogeräten:** Große Möbelstücke und empfindliche Elektrogeräte werden von uns sorgfältig mit Decken und Folie für den Transport gesichert.
- **Individuelle Lösungen:** Ob Sie nur Ihr zerbrechliches Geschirr oder den gesamten Hausrat verpacken lassen möchten – wir bieten flexible Lösungen, die auf Ihre Bedürfnisse zugeschnitten sind.

Vertrauen Sie auf unsere Erfahrung und Sorgfalt. Mit unserem Einpackservice kommt Ihr gesamtes Inventar sicher und unversehrt am Ziel an.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default EinpackservicePage;