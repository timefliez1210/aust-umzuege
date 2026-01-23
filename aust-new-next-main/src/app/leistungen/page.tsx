import Hero from "../../components/Hero";
import ServiceContainer from "../../components/ServiceContainer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsere Umzugsleistungen für Sie | Hildesheim & Hannover",
  description:
    "Ihr Umzugspartner in Hildesheim & Hannover bietet: Privatumzüge, Firmenumzüge (lokal, national, international), Haushaltsauflösungen, Entrümpelungen, Montage & mehr. Entdecken Sie unsere Services!",
};

const LeistungenPage = () => {
  const heroData = {
    title: "Unsere Services: Alles für Ihren reibungslosen Umzug",
    subtitle:
      "Von der Planung bis zur Durchführung – Ihr Partner in Hildesheim & Hannover.",
    image: "/umzugsleistungen-hildesheim-hannover.jpg",
    ctaText: "Jetzt anfragen",
    ctaLink: "/kontakt",
  };

  return (
    <>
      <Hero heroData={heroData} />
      <ServiceContainer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "http://schema.org",
            "@type": "Service",
            serviceType: "Umzugsunternehmen",
            name: "Aufraeumhelden",
            description:
              "Ihr zuverlässiger Partner für Umzüge und Haushaltsauflösungen in Hildesheim, Hannover und Umgebung.",
            areaServed: [
              {
                "@type": "State",
                name: "Niedersachsen",
              },
              {
                "@type": "City",
                name: "Hildesheim",
              },
              {
                "@type": "City",
                name: "Hannover",
              },
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Unsere Umzugsdienstleistungen",
              itemListElement: [
                {
                  "@type": "OfferCatalog",
                  name: "Umzüge",
                  itemListElement: [
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Lokaler Umzug",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Fernumzug",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Firmenumzug",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Überseeumzug",
                      },
                    },
                  ],
                },
                {
                  "@type": "OfferCatalog",
                  name: "Haushaltsauflösungen & Entrümpelungen",
                  itemListElement: [
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Haushaltsauflösungen",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Entrümpelungen",
                      },
                    },
                  ],
                },
                {
                  "@type": "OfferCatalog",
                  name: "Zusatzleistungen",
                  itemListElement: [
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Möbelmontage",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Verpackungsservice",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Umzugsplanung",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Umzugskartons",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Malerarbeiten",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Installation",
                      },
                    },
                    {
                      "@type": "Offer",
                      itemOffered: {
                        "@type": "Service",
                        name: "Aufhängen von Gegenständen",
                      },
                    },
                  ],
                },
              ],
            },
          }),
        }}
      />
    </>
  );
};

export default LeistungenPage;
