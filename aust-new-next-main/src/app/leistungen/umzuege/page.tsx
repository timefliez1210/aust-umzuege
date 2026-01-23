import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Umzüge Hildesheim & Hannover | Privat- & Firmenumzüge",
  description: "Ihr professionelles Umzugsunternehmen für Privat- und Firmenumzüge in Hildesheim, Hannover und Umgebung. Wir bieten maßgeschneiderte Lösungen für einen stressfreien Umzug. Fordern Sie jetzt Ihr Angebot an.",
  keywords: "umzüge, umzugsfirma, umzugsunternehmen, privatumzug, firmenumzug, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/umzuege",
  },
};

const UmzuegePage = () => {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Umzüge Hildesheim & Hannover | Privat- & Firmenumzüge",
            "description": "Ihr professionelles Umzugsunternehmen für Privat- und Firmenumzüge in Hildesheim, Hannover und Umgebung. Wir bieten maßgeschneiderte Lösungen für einen stressfreien Umzug. Fordern Sie jetzt Ihr Angebot an.",
            "serviceType": "Umzüge",
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
              },
              {
                "@type": "Continent",
                "name": "Europa"
              }
            ],
            "url": "https://www.aufraeumhelden.com/leistungen/umzuege",
            "image": "https://www.aufraeumhelden.com/Professionelle-Umzuege-Hildesheim.webp"
          })
        }}
      />
      <ContentHolder
      imageUrl="/Professionelle-Umzuege-Hildesheim.webp"
      heading="Professionelle Umzüge in Hildesheim & Hannover"
      text={`Ein Umzug ist mehr als nur der Transport von Möbeln. Es ist der Beginn eines neuen Lebensabschnitts. Als Ihr professionelles **Umzugsunternehmen in Hildesheim und Hannover** begleiten wir Sie bei diesem wichtigen Schritt und sorgen für einen reibungslosen und stressfreien Ablauf.

### Unser Umzugsservice für Sie:
- **Privatumzüge:** Ob Single-Wohnung oder großes Einfamilienhaus – wir planen und organisieren Ihren Privatumzug ganz nach Ihren individuellen Bedürfnissen in **Hildesheim, Hannover und Umgebung**.
- **Firmenumzüge:** Wir realisieren Büro- und Objektumzüge jeder Größenordnung und minimieren dabei die Ausfallzeiten Ihres Unternehmens.
- **Seniorenumzüge:** Mit besonderem Einfühlungsvermögen und Geduld unterstützen wir Senioren beim Umzug in ein neues Zuhause.
- **Nah- und Fernumz��ge:** Wir sind Ihr Partner für Umzüge innerhalb der Region, deutschlandweit und in ganz Europa.
- **Full-Service-Umzug:** Lehnen Sie sich zurück und überlassen Sie uns die komplette Organisation und Durchführung Ihres Umzugs – vom **Einpackservice** bis zur **Endreinigung**.

Unser Ziel ist es, Ihnen einen Umzug zu bieten, der so angenehm und unkompliziert wie möglich ist. Vertrauen Sie auf unsere Erfahrung, unsere Sorgfalt und unser Engagement. Für einen reibungslosen Ablauf bieten wir auch die **professionelle Möbelmontage** und die Lieferung von **Umzugskartons** an.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
    </>
  );
};

export default UmzuegePage;