import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Entrümpelung Hildesheim & Hannover | Schnell & Besenrein",
  description: "Professionelle Entrümpelungen von Keller, Dachboden oder ganzen Wohnungen in Hildesheim und Hannover. Wir schaffen Platz – schnell, diskret und besenrein. Kontaktieren Sie uns für eine kostenlose Besichtigung.",
  keywords: "entrümpelung, haushaltsauflösung, sperrmüll, kellerentrümpelung, wohnungsauflösung, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/entruempelungen",
  },
};

const EntruempelungenPage = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Entrümpelung Hildesheim & Hannover | Schnell & Besenrein",
            "description": "Professionelle Entrümpelungen von Keller, Dachboden oder ganzen Wohnungen in Hildesheim und Hannover. Wir schaffen Platz – schnell, diskret und besenrein. Kontaktieren Sie uns für eine kostenlose Besichtigung.",
            "serviceType": "Entrümpelung",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Aufraeumhelden",
              "url": "https://www.aufraeumhelden.com"
            },
            "areaServed": [
              {
                "@type": "State",
                "name": "Niedersachsen"
              },
              {
                "@type": "City",
                "name": "Hildesheim"
              },
              {
                "@type": "City",
                "name": "Hannover"
              },
              {
                "@type": "Country",
                "name": "Deutschland"
              }
            ],
            "url": "https://www.aufraeumhelden.com/leistungen/entruempelungen",
            "image": "https://www.aufraeumhelden.com/haushaltsentruempelungen-hildesheim-hannover.svg"
          })
        }}
      />
      <ContentHolder
      imageUrl="/haushaltsentruempelungen-hildesheim-hannover.svg"
      heading="Entrümpelungen in Hildesheim & Hannover"
      text={`Schaffen Sie Platz und Ordnung mit unserem professionellen **Entrümpelungsservice in Hildesheim und Hannover**. Ob Keller, Dachboden, Garage oder eine komplette Wohnung – wir übernehmen die schnelle und besenreine Räumung.

### Unser Service für Ihre Entrümpelung:
- **Kostenlose Besichtigung:** Wir kommen zu Ihnen und erstellen Ihnen ein unverbindliches Festpreisangebot für Ihre **Entrümpelung in Hildesheim oder Hannover**.
- **Fachgerechte Entsorgung:** Wir trennen Wertstoffe von **Sperrmüll** und führen alles dem fachgerechten Recycling oder der Entsorgung zu.
- **Diskrete und schnelle Abwicklung:** Wir arbeiten schnell, diskret und zuverlässig, um Sie so wenig wie möglich zu belasten.
- **Besenreine Übergabe:** Wir hinterlassen die geräumten Flächen sauber und ordentlich.
- **Wertanrechnung:** Verwertbare Gegenstände können wir auf Wunsch auf den Preis anrechnen.

Egal ob Sie Platz für Neues schaffen oder eine Immobilie für die Übergabe vorbereiten müssen – wir sind Ihr zuverlässiger Partner für Entrümpelungen aller Art. Wir bieten auch komplette **Haushaltsauflösungen** an.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
    </>
  );
};

export default EntruempelungenPage;