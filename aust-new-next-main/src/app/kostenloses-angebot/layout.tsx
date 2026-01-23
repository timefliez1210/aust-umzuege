import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Umzugsvolumen Rechner & Angebot | Ihre Umzugsfirma Hildesheim & Hannover",
  description: "Berechnen Sie Ihr Umzugsvolumen mit unserem praktischen Rechner und fordern Sie ein kostenloses Angebot für Ihren Umzug in Hildesheim, Hannover oder weltweit an.",
  keywords: "umzugsvolumen rechner, kostenloses angebot umzug, umzugsrechner, umzugskosten kalkulieren, umzugsfirma angebot, hildesheim, hannover",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/kostenloses-angebot",
  },
};

export default function KostenlosesAngebotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}