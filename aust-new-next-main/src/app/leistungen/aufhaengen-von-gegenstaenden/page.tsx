import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Aufhängeservice Hildesheim & Hannover | Bilder, Lampen & mehr",
  description: "Professioneller Aufhängeservice in Hildesheim und Hannover. Wir montieren Bilder, Lampen, Spiegel und andere Gegenstände sicher und fachgerecht. Ihr zuverlässiger Partner nach dem Umzug.",
  keywords: "aufhängeservice, bilder aufhängen, lampen montieren, spiegel befestigen, umzugsservice, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/aufhaengen-von-gegenstaenden",
  },
};

const AufhaengenVonGegenstaendenPage = () => {
  return (
    <ContentHolder
      imageUrl="/aufhaengen-service.svg"
      heading="Professioneller Aufhängeservice in Hildesheim & Hannover"
      text={`Nach dem Umzug sind es die Details, die ein neues Haus in ein Zuhause verwandeln. Unser professioneller Aufhängeservice in Hildesheim und Hannover nimmt Ihnen die mühsame Arbeit ab, Bilder, Spiegel, Lampen, Regale und Gardinenstangen sicher und präzise zu montieren. Wir sorgen dafür, dass alles perfekt hängt, damit Sie sich sofort wohlfühlen können.

### Unsere Leistungen im Überblick:
- **Bilder und Spiegel:** Wir hängen Ihre Bilder und Spiegel sicher auf – egal ob einzeln oder als komplexe Bilderwand. Wir achten auf die richtige Höhe, den passenden Abstand und die Beschaffenheit Ihrer Wände.
- **Lampen und Leuchten:** Von der einfachen Deckenlampe bis zum komplexen Schienensystem – unsere Fachkräfte schließen Ihre Leuchten sicher an und montieren sie fachgerecht.
- **Regale und Schränke:** Wir befestigen Ihre Regale und Hängeschränke stabil und sicher an der Wand, damit Sie Ihren Stauraum optimal nutzen können.
- **Gardinen und Vorhänge:** Wir montieren Gardinenstangen und -schienen, damit Ihre Fensterdekoration perfekt sitzt.

Vertrauen Sie auf unsere Erfahrung und unser handwerkliches Geschick. Wir bringen das nötige Werkzeug und Befestigungsmaterial mit und hinterlassen alles sauber und ordentlich.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default AufhaengenVonGegenstaendenPage;
