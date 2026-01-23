import Hero from "../../components/Hero";
import ContactForm from "../../components/Contact";
import type { Metadata } from "next";
import styles from "./kontakt.module.css";

export const metadata: Metadata = {
  title: "Kontaktieren Sie uns | Aufraeumhelden",
  description:
    "Haben Sie Fragen oder wünschen ein Angebot? Kontaktieren Sie Ihre Umzugsfirma für Hildesheim, Hannover und weltweite Umzüge. Wir freuen uns auf Ihre Nachricht!",
};

const KontaktPage = () => {
  const heroData = {
    title: "Nehmen Sie Kontakt mit uns auf",
    subtitle:
      "Wir beraten Sie gerne zu Ihrem Umzug oder Ihrer Haushaltsauflösung.",
    image: "/buchen-haushaltsaufloesung-und-umzug-hildesheim.jpg",
    ctaText: "",
    ctaLink: "",
  };

  return (
    <>
      <Hero heroData={heroData} />
      <div className={styles["kontakt-container"]}>
        <ContactForm showButton={true} />
      </div>
    </>
  );
};

export default KontaktPage;
