import Hero from "../components/Hero";
import ContentHolder from "../components/ContentHolder";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ihre Umzugsfirma für Hildesheim & Hannover | Umzüge nah & fern",
  description:
    "Professionelle Umzüge in Hildesheim, Hannover und weltweit. Ob Privatumzug oder Firmenumzug, lokal oder international – wir sind Ihr Partner für einen stressfreien Start. Fordern Sie Ihr unverbindliches Angebot an!",
  keywords:
    "Umzugsfirma Hildesheim, Umzugsunternehmen Hannover, Umzüge, Haushaltsauflösung, Entrümpelung, Firmenumzug, Privatumzug, internationaler Umzug",
  alternates: {
    canonical: "https://www.aufraeumhelden.com",
  },
};

const HomePage = () => {
  const heroData = {
    title: "Umzüge & Haushaltsauflösungen in Hildesheim & Hannover",
    subtitle:
      "Ihr zuverlässiger Partner für einen entspannten Start – lokal und weltweit.",
    image: "/Professionelle-Umzuege-Hildesheim.webp",
    ctaText: "Jetzt kostenloses Angebot anfordern",
    ctaLink: "/kostenloses-angebot",
  };

  return (
    <>
      <Hero heroData={heroData} />
      <ContentHolder
        imageUrl="/Umzugsunternehmen-in-Hannover-und-Hildesheim.webp"
        altText="Team von Aufraeumhelden bei der Arbeit in Hannover"
        heading="Ihr Umzugsunternehmen für Hannover & Hildesheim: Regional und Weltweit"
        text={`Suchen Sie ein erfahrenes <a href="/leistungen/umzuege">**Umzugsunternehmen in Hannover oder Hildesheim**</a>? Aufraeumhelden ist Ihr kompetenter Partner für maßgeschneiderte <a href="/leistungen/umzuege">**Umzugslösungen**</a>. Ob ein <a href="/leistungen/lokaler-umzug">**Privatumzug**</a> innerhalb von Niedersachsen oder ein komplexer <a href="/leistungen/firmenumzug">**Firmenumzug**</a> – wir sorgen für einen reibungslosen Ablauf.

Unser engagiertes Team aus qualifizierten Umzugsexperten begleitet Sie von der ersten **kostenfreien Beratung** über die detaillierte Planung bis zur fachgerechten Durchführung. Mit moderner Ausstattung und langjähriger Erfahrung garantieren wir einen sicheren und effizienten <a href="/leistungen/umzuege">**Umzugsservice**</a>.

**Unsere Umzugsleistungen im Überblick:**
- <a href="/leistungen/lokaler-umzug">**Privatumzüge:**</a> Sicher und sorgfältig, vom kleinen Apartment bis zum Einfamilienhaus.
- <a href="/leistungen/firmenumzug">**Firmen- & Büroumzüge:**</a> Termingerecht und professionell, um Ausfallzeiten zu minimieren.
- <a href="/leistungen/montage">**Möbelmontage**</a> & <a href="/leistungen/demontage">**-demontage:**</a> Fachgerechter Auf- und Abbau Ihrer Einrichtung.
- <a href="/leistungen/einpackservice">**Verpackungsservice:**</a> Wir schützen Ihr Hab und Gut mit hochwertigem Material.

Vertrauen Sie auf den führenden <a href="/leistungen/umzuege">**Umzugsdienstleister in Hildesheim und Hannover**</a>. Sprechen Sie uns für Ihr persönliches, unverbindliches Angebot an.`}
        showButton={true}
        buttonText="Kostenlos beraten lassen"
        buttonLink="/kontakt"
        centerButton={true}
        isLink={false}
      />
      <ContentHolder
        imageUrl="/Haushaltsaufloesungen-und-Entruempelungen-Hannover-und-Hildesheim.webp"
        altText="Entrümpeltes Zimmer nach einer Haushaltsauflösung durch Aufraeumhelden"
        heading="Haushaltsauflösung & Entrümpelung in Hannover & Hildesheim"
        text={`Benötigen Sie professionelle Unterstützung bei einer <a href="/leistungen/haushaltsaufloesungen">**Haushaltsauflösung**</a> oder <a href="/leistungen/entruempelungen">**Entrümpelung in Hannover oder Hildesheim**</a>? Unser erfahrenes Team ist im Umkreis von ca. 60 km für Sie da – von Celle bis Hameln. Wir bieten einen diskreten und zuverlässigen Komplettservice.

**Unser Service für Haushaltsauflösungen und Entrümpelungen:**
- <a href="/leistungen/haushaltsaufloesungen">**Fachgerechte Wohnungsauflösungen:**</a> Inklusive besenreiner Übergabe.
- <a href="/leistungen/entruempelungen">**Komplette Entrümpelungen:**</a> Vom Keller bis zum Dachboden, für private und gewerbliche Objekte.
- **Faire Wertanrechnung:** Wir rechnen verwertbare Gegenstände auf den Preis an.
- **Kostenlose Erstbesichtigung:** Unverbindlich und transparent.

Nachhaltigkeit ist uns wichtig: Wiederverwertbares wird dem Recycling zugeführt. Verlassen Sie sich auf unsere über 15-jährige Erfahrung für eine zügige und sorgfältige <a href="/leistungen/entruempelungen">**Sperrmüllentsorgung**</a> und Auflösung. Kontaktieren Sie uns für einen kostenlosen Besichtigungstermin.`}
        showButton={true}
        buttonText="Kostenlos bewerten lassen"
        buttonLink="/kontakt"
        centerButton={true}
      />
    </>
  );
};

export default HomePage;
