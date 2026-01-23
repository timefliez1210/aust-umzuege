import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Überseeumzug Hildesheim & Hannover | Weltweite Umzüge",
  description: "Planen Sie einen Umzug nach Übersee? Wir sind Ihr erfahrener Partner für internationale und weltweite Umzüge ab Hildesheim und Hannover. Sicher, zuverlässig und mit kompletter Zollabwicklung.",
  keywords: "überseeumzug, internationaler umzug, weltweit umziehen, auswandern, umzugsfirma, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/Ueberseeumzug",
  },
};

const UeberseeumzugPage = () => {
  return (
    <ContentHolder
      imageUrl="/weltweite-umzuege.svg"
      heading="Überseeumzüge ab Hildesheim & Hannover"
      text={`Ein Umzug ins Ausland, insbesondere nach Übersee, ist ein großes Projekt, das eine sorgfältige Planung und Organisation erfordert. Als Ihr erfahrener Partner für internationale Umzüge ab Hildesheim und Hannover begleiten wir Sie bei jedem Schritt.

### Unser Service für Ihren Überseeumzug:
- **Weltweite Logistik:** Wir organisieren den Transport Ihres Umzugsguts per See- oder Luftfracht in Ihr Zielland.
- **Professionelle Verpackung:** Wir verpacken Ihr gesamtes Hab und Gut transportsicher und nach internationalen Standards.
- **Zollabwicklung:** Wir kümmern uns um die gesamte Zollabwicklung und alle erforderlichen Dokumente.
- **Partnernetzwerk:** Dank unseres weltweiten Netzwerks von Partnerfirmen können wir Ihnen auch am Zielort einen umfassenden Service bieten.
- **Persönliche Beratung:** Wir beraten Sie umfassend zu allen Fragen rund um Ihren Überseeumzug und erstellen Ihnen ein individuelles Angebot.

Mit uns wird Ihr Traum vom Leben im Ausland Wirklichkeit. Wir sorgen dafür, dass Ihr Umzug reibungslos und stressfrei verläuft, damit Sie sich ganz auf Ihr neues Leben konzentrieren können.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default UeberseeumzugPage;