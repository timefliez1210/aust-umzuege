import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Umzugskartons Hildesheim & Hannover | Verpackungsmaterial",
  description: "Hochwertige Umzugskartons und Verpackungsmaterial in Hildesheim und Hannover. Wir liefern Ihnen alles, was Sie für einen sicheren Umzug benötigen. Kontaktieren Sie uns für eine Bestellung.",
  keywords: "umzugskartons, verpackungsmaterial, kleiderboxen, seidenpapier, luftpolsterfolie, umzug, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/umzugskartons",
  },
};

const UmzugskartonsPage = () => {
  return (
    <ContentHolder
      imageUrl="/umzugskartons-hildesheim-hannover.svg"
      heading="Umzugskartons & Verpackungsmaterial in Hildesheim & Hannover"
      text={`Für einen sicheren und organisierten Umzug ist das richtige Verpackungsmaterial unerlässlich. Bei uns erhalten Sie alles, was Sie für den Schutz Ihres Hab und Guts benötigen – in hoher Qualität und zu fairen Preisen.

### Unser Sortiment an Verpackungsmaterial:
- **Stabile Umzugskartons:** In verschiedenen Größen, ideal für Bücher, Geschirr, Kleidung und vieles mehr.
- **Kleiderboxen:** Für den knitterfreien Transport Ihrer hängenden Garderobe.
- **Seidenpapier und Packpapier:** Zum Einwickeln von zerbrechlichen Gegenständen wie Gläsern und Porzellan.
- **Luftpolsterfolie:** Für den optimalen Schutz von empfindlichen Oberflächen, Elektrogeräten und Kunstgegenständen.
- **Matratzenhüllen und Schutzbezüge:** Zum Schutz Ihrer Matratzen und Polstermöbel vor Schmutz und Beschädigungen.
- **Klebeband und weiteres Zubehör:** Alles, was Sie zum sicheren Verschließen Ihrer Kartons benötigen.

Wir liefern Ihnen das gewünschte Verpackungsmaterial direkt nach Hause. Gerne beraten wir Sie auch bei der Auswahl und der benötigten Menge.`}
      showButton={true}
      buttonText="Jetzt Material anfragen"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default UmzugskartonsPage;