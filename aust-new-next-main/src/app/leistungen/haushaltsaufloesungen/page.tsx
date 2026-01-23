import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Haushaltsauflösung Hildesheim & Hannover | Diskret & mit Wertanrechnung",
  description: "Professionelle Haushaltsauflösungen in Hildesheim und Hannover. Wir arbeiten diskret, schnell und bieten eine faire Wertanrechnung. Kontaktieren Sie uns für eine kostenlose Besichtigung und ein unverbindliches Angebot.",
  keywords: "haushaltsauflösung, wohnungsauflösung, entrümpelung, wertanrechnung, umzugsfirma, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/haushaltsaufloesungen",
  },
};

const HaushaltsaufloesungenPage = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Haushaltsauflösung Hildesheim & Hannover | Diskret & mit Wertanrechnung",
            "description": "Professionelle Haushaltsauflösungen in Hildesheim und Hannover. Wir arbeiten diskret, schnell und bieten eine faire Wertanrechnung. Kontaktieren Sie uns für eine kostenlose Besichtigung und ein unverbindliches Angebot.",
            "serviceType": "Haushaltsauflösung",
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
            "url": "https://www.aufraeumhelden.com/leistungen/haushaltsaufloesungen",
            "image": "https://www.aufraeumhelden.com/Haushaltsauflosungen-in-Hannover-und-Hildesheim.svg"
          })
        }}
      />
      <ContentHolder
      imageUrl="/Haushaltsauflosungen-in-Hannover-und-Hildesheim.svg"
      heading="Haushaltsauflösungen in Hildesheim & Hannover"
      text={`Eine Haushaltsauflösung ist oft eine emotionale und organisatorische Herausforderung. Wir stehen Ihnen in dieser Situation als verständnisvoller und professioneller Partner in **Hildesheim und Hannover** zur Seite.

### Unser Komplettservice für Haushaltsauflösungen:
- **Kostenlose und unverbindliche Besichtigung:** Wir verschaffen uns vor Ort einen Überblick und beraten Sie umfassend zu Ihrer **Wohnungsauflösung**.
- **Faire Wertanrechnung:** Wir bewerten Ihre wiederverwertbaren Möbel, Antiquitäten und Wertgegenstände und rechnen diese auf den Gesamtpreis an.
- **Fachgerechte Räumung und Entsorgung:** Wir räumen das gesamte Objekt und kümmern uns um die umweltgerechte **Entsorgung** von nicht mehr verwertbaren Gegenständen.
- **Besenreine Übergabe:** Wir übergeben Ihnen das Objekt in einem sauberen und ordentlichen Zustand.
- **Diskrete und respektvolle Abwicklung:** Wir arbeiten stets diskret und mit dem nötigen Respekt vor Ihrem Eigentum.

Ob bei einem Umzug ins Pflegeheim, einer Auswanderung oder im Trauerfall – wir entlasten Sie und sorgen für eine reibungslose und sorgenfreie Abwicklung. Wir bieten auch **Entrümpelungen** von Kellern und Dachböden an.`}
      showButton={true}
      buttonText="Jetzt kostenlose Besichtigung"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
    </>
  );
};

export default HaushaltsaufloesungenPage;