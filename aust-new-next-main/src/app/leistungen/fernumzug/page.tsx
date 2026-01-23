import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Fernumzüge Hildesheim & Hannover | Deutschland- & Europaweit",
  description: "Planen Sie einen Fernumzug? Wir sind Ihr zuverlässiger Partner für Umzüge innerhalb Deutschlands und Europas. Sicher, pünktlich und professionell. Fordern Sie jetzt Ihr individuelles Angebot an.",
  keywords: "fernumzug, umzug deutschland, umzug europa, internationaler umzug, umzugsfirma, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/fernumzug",
  },
};

const FernumzugPage = () => {
  return (
    <ContentHolder
      imageUrl="/ueberregionale-und-weltweite-umzuege.svg"
      heading="Fernumzüge ab Hildesheim & Hannover"
      text={`Ein Umzug in eine andere Stadt oder ein anderes Land ist eine besondere Herausforderung. Als Ihr Spezialist für Fernumzüge ab Hildesheim und Hannover sorgen wir dafür, dass Ihr Hab und Gut sicher und pünktlich am neuen Wohnort ankommt.

### Unser Service für Ihren Fernumzug:
- **Deutschland- und europaweite Transporte:** Wir führen Umzüge innerhalb ganz Deutschlands sowie in alle Länder Europas durch.
- **Moderne und sichere Fahrzeugflotte:** Unsere Fahrzeuge sind für lange Strecken bestens ausgestattet und gewährleisten einen sicheren Transport.
- **Detaillierte Planung und Logistik:** Wir planen Ihren Fernumzug bis ins kleinste Detail, um einen reibungslosen Ablauf zu garantieren.
- **Full-Service-Optionen:** Auf Wunsch übernehmen wir auch das Ein- und Auspacken, die Möbelmontage sowie die Zollabwicklung bei internationalen Umzügen.

Egal, wie weit Ihr Weg auch ist – mit uns an Ihrer Seite wird Ihr Fernumzug zu einem entspannten Erlebnis. Kontaktieren Sie uns für eine umfassende Beratung und ein individuelles Angebot.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default FernumzugPage;