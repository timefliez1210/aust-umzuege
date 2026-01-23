import Hero from "../../components/Hero";
import type { Metadata } from "next";
import styles from "./standorte.module.css";

export const metadata: Metadata = {
  title:
    "Aufräumhelden Standorte | Umzüge & Entrümpelung in Hildesheim & Hannover",
  description:
    "Ihre Experten für Umzüge und Haushaltsauflösungen in Hildesheim und Hannover. ✓ Lokale Expertise ✓ Fachgerechte Entrümpelung ✓ Spezialisiert auf historische Altbauten & moderne Wohnungen. Jetzt anfragen!",
  keywords:
    "Umzug Hildesheim, Umzug Hannover, Entrümpelung Hildesheim, Haushaltsauflösung Hannover, Umzugsunternehmen Niedersachsen",
};

const StandortePage = () => {
  const heroData = {
    title: "Unsere Standorte",
    subtitle:
      "Professionelle Umzüge und Entrümpelungen in Hildesheim und Hannover",
    image: "/standorte-fur-ihren-umzug-hildesheim-und-hannover.jpg",
    ctaText: "Jetzt anfragen",
    ctaLink: "/kontakt",
  };

  const locations = [
    {
      city: "Hildesheim",
      address: "Ehrlicherstr. 38, 31135 Hildesheim",
      phone: "+49 (0) 176 707 452 81",
      email: "hildesheim@aufraeumhelden.com",
      description:
        "Im Herzen der historischen Fachwerkstadt Hildesheim sind wir Ihr verlässlicher Partner für professionelle Umzüge und Haushaltsauflösungen. Unser erfahrenes Team kennt die besonderen Herausforderungen der mittelalterlichen Stadtarchitektur und engen Gassen der Altstadt.",
      cityInfo: `Hildesheim, bekannt für sein UNESCO-Weltkulturerbe und historische Architektur, stellt besondere Anforderungen an Umzüge und Entrümpelungen. Die charakteristischen Fachwerkbauten und engen Gassen der Altstadt erfordern spezielle Expertise und angepasste Ausrüstung.\n\n        Unsere Erfahrung zeigt: Bei Umzügen in Hildesheim müssen oft kreative Lösungen gefunden werden, besonders wenn es um die Navigation durch die schmalen Straßen des historischen Stadtkerns geht. Die mittelalterliche Stadtstruktur und denkmalgeschützten Gebäude erfordern besondere Sorgfalt und Planung.\n\n        Für Haushaltsauflösungen in Hildesheim beachten wir die strengen Entsorgungsrichtlinien der Stadt und arbeiten eng mit lokalen Recyclinghöfen zusammen. Besonders in den historischen Gebäuden finden sich oft wertvolle Antiquitäten, die wir fachmännisch bewerten und entsprechend behandeln.`,
      funFacts: [
        "Die engen Gassen der Altstadt erfordern oft spezielle, schmale Umzugswagen",
        "In den historischen Fachwerkhäusern gibt es häufig keine Aufzüge - unsere Teams sind auf Treppen-Transport spezialisiert",
        "Viele Wohnungen befinden sich in denkmalgeschützten Gebäuden, was besondere Vorsicht beim Transport erfordert",
      ],
    },
    {
      city: "Hannover",
      address: "30159 Hannover",
      phone: "+49 (0) 176 707 452 81",
      email: "hannover@aufraeumhelden.com",
      description:
        "In der Landeshauptstadt Hannover bieten wir umfassende Umzugs- und Entrümpelungsservices an. Von der List bis zur Südstadt, vom Zooviertel bis nach Linden - wir kennen jeden Stadtteil und seine spezifischen Anforderungen.",
      cityInfo: `Hannover, als moderne Großstadt und Messestandort, bietet eine Vielfalt an Wohnsituationen - von historischen Altbauten in der List bis zu modernen Wohnkomplexen in der Nordstadt. Diese Vielfalt spiegelt sich in den unterschiedlichen Anforderungen an Umzüge und Entrümpelungen wider.\n\n        Die Stadt ist bekannt für ihre großzügigen Straßen und gute Infrastruktur, dennoch gibt es in beliebten Wohnvierteln wie Linden oder der Südstadt spezielle Herausforderungen. Parkplatzknappheit und verkehrsberuhigte Zonen erfordern präzise Planung und Timing.\n\n        Besonders bei Messeterminen oder Großveranstaltungen ist eine vorausschauende Umzugsplanung wichtig, da Hotels und Straßen dann stark ausgelastet sind. Wir berücksichtigen den Messekalender bei unserer Terminplanung.`,
      funFacts: [
        "Während der großen Messen kann es zu erheblichen Verkehrseinschränkungen kommen - wir planen Umzüge entsprechend",
        "In der Nordstadt gibt es viele Studenten-WGs, was zu saisonalen Umzugsspitzen führt",
        "Die beliebten Altbauwohnungen in der List haben oft überraschend breite Türen und hohe Decken - ein Vorteil beim Möbeltransport",
      ],
    },
  ];

  return (
    <>
      <Hero heroData={heroData} />
      <section className={styles["standorte-container"]}>
        <div className={styles["content-container"]}>
          {locations.map((location) => (
            <div className={styles["location-card"]} key={location.city}>
              <h2>{location.city}</h2>
              <div className={styles["contact-info"]}>
                <p>
                  <strong>Adresse:</strong> {location.address}
                </p>
                <p>
                  <strong>Telefon:</strong> {location.phone}
                </p>
                <p>
                  <strong>E-Mail:</strong> {location.email}
                </p>
              </div>
              <p className={styles.description}>{location.description}</p>

              <div className={styles["city-info"]}>
                <h3>Umzüge und Entrümpelungen in {location.city}</h3>
                <p>{location.cityInfo}</p>

                <div className={styles["fun-facts"]}>
                  <h4>Besonderheiten in {location.city}</h4>
                  <ul>
                    {location.funFacts.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default StandortePage;
