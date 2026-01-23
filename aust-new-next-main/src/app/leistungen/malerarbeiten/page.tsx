import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Malerarbeiten Hildesheim & Hannover | Renovierungsservice",
  description: "Professionelle Malerarbeiten und Renovierungsservice in Hildesheim und Hannover. Wir übergeben Ihre alte Wohnung besenrein und renoviert. Kontaktieren Sie uns für ein individuelles Angebot.",
  keywords: "malerarbeiten, renovierung, wohnungsübergabe, streichen, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/malerarbeiten",
  },
};

const MalerarbeitenPage = () => {
  return (
    <ContentHolder
      imageUrl="/malerarbeiten-service.svg"
      heading="Maler- und Renovierungsarbeiten in Hildesheim & Hannover"
      text={`Für eine reibungslose Wohnungsübergabe sind oft Maler- und Renovierungsarbeiten erforderlich. Wir bieten Ihnen einen professionellen Service aus einer Hand, damit Sie sich ganz auf Ihr neues Zuhause konzentrieren können.

### Unser Renovierungsservice im Detail:
- **Malerarbeiten:** Wir streichen Wände und Decken in hoher Qualität und sorgen für ein sauberes und frisches Erscheinungsbild.
- **Spachtel- und Ausbesserungsarbeiten:** Wir verschließen Bohrlöcher und bessern kleine Schäden an den Wänden aus.
- **Lackierarbeiten:** Auf Wunsch lackieren wir auch Türen, Fensterrahmen und Heizkörper.
- **Bodenbelagsarbeiten:** Wir entfernen alte Bodenbeläge und bereiten den Untergrund für die Neuverlegung vor.

Mit unserem Renovierungsservice sparen Sie Zeit und Mühe und können sicher sein, dass Ihre alte Wohnung in einem einwandfreien Zustand übergeben wird. Wir arbeiten sauber, schnell und zuverlässig.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default MalerarbeitenPage;