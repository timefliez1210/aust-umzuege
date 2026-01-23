import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Auspackservice Hildesheim & Hannover | Stressfrei ankommen",
  description: "Starten Sie entspannt in Ihrem neuen Zuhause mit unserem professionellen Auspackservice in Hildesheim und Hannover. Wir packen aus, Sie leben sich ein. Kontaktieren Sie uns für ein individuelles Angebot.",
  keywords: "auspackservice, umzugshilfe, kisten auspacken, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/auspackservice",
  },
};

const AuspackservicePage = () => {
  return (
    <ContentHolder
      imageUrl="/auspackservice.svg"
      heading="Professioneller Auspackservice in Hildesheim & Hannover"
      text={`Der Umzug ist geschafft, doch die Arbeit ist noch nicht vorbei. Berge von Umzugskartons warten darauf, ausgepackt zu werden. Mit unserem professionellen Auspackservice in Hildesheim und Hannover können Sie sich entspannt zurücklehnen und den Start in Ihrem neuen Zuhause genießen.

### Unser Auspackservice im Detail:
- **Systematisches Auspacken:** Wir packen Ihre Kartons nach einem klaren System aus und stellen den Inhalt in die dafür vorgesehenen Räume und Schränke.
- **Einräumen nach Wunsch:** Ob Bücher ins Regal, Geschirr in die Küche oder Kleidung in den Schrank – wir richten uns ganz nach Ihren Wünschen.
- **Möbelmontage:** Auf Wunsch übernehmen wir auch die Montage von Kleinmöbeln.
- **Entsorgung des Verpackungsmaterials:** Wir nehmen das gesamte Verpackungsmaterial wie Kartons, Papier und Folie wieder mit und entsorgen es fachgerecht.

Unser Ziel ist es, Ihnen einen schnellen und reibungslosen Übergang zu ermöglichen. Während wir uns um das Auspacken kümmern, haben Sie Zeit für die wichtigen Dinge: das Einleben in Ihrer neuen Umgebung.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default AuspackservicePage;