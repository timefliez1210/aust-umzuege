import type { Metadata } from 'next';
import ContentHolder from '../../../components/ContentHolder';

export const metadata: Metadata = {
  title: "Firmenumzug Hildesheim & Hannover | Büro- & Objektumzüge",
  description: "Professionelle Firmenumzüge in Hildesheim und Hannover. Wir planen und realisieren Ihren Büro- oder Objektumzug termingerecht und effizient, um Ausfallzeiten zu minimieren. Kontaktieren Sie uns für eine individuelle Beratung.",
  keywords: "firmenumzug, büroumzug, objektumzug, geschäftsumzug, umzugsfirma, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/leistungen/firmenumzug",
  },
};

const FirmenumzugPage = () => {
  return (
    <ContentHolder
      imageUrl="/firmenumzuege-niedersachsen-und-deutschlandweit.svg"
      heading="Firmenumzüge in Hildesheim & Hannover"
      text={`Ein Firmenumzug erfordert eine präzise Planung und eine schnelle, effiziente Durchführung, um die Betriebsabläufe so wenig wie möglich zu stören. Als Ihr Spezialist für Firmen- und Büroumzüge in Hildesheim und Hannover bieten wir Ihnen einen maßgeschneiderten Service.

### Unser Leistungsportfolio für Geschäftskunden:
- **Detaillierte Umzugsplanung:** Wir erstellen in enger Absprache mit Ihnen einen detaillierten Zeit- und Ablaufplan.
- **IT- und Technik-Transport:** Wir sorgen für den sicheren Transport Ihrer sensiblen IT-Infrastruktur und technischen Geräte.
- **Akten- und Datenträgertransport:** Wir gewährleisten einen sicheren und diskreten Transport Ihrer vertraulichen Unterlagen.
- **Möbelmontage und -demontage:** Unsere Teams demontieren und montieren Ihre Büromöbel schnell und fachgerecht.
- **Minimierung von Ausfallzeiten:** Durch eine effiziente Planung und Durchführung, auch am Wochenende oder nachts, reduzieren wir die Ausfallzeiten Ihres Unternehmens auf ein Minimum.

Vertrauen Sie auf unsere Erfahrung und unser Know-how bei der Realisierung von Firmenumzügen jeder Größenordnung. Wir sorgen für einen reibungslosen Start an Ihrem neuen Standort.`}
      showButton={true}
      buttonText="Jetzt Angebot anfordern"
      buttonLink="/kostenloses-angebot"
      centerButton={true}
    />
  );
};

export default FirmenumzugPage;