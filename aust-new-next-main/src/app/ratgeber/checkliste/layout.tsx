import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ihre Umzugscheckliste für Deutschland: Alles im Blick",
  description: "Mit unserer praktischen Umzugscheckliste planen Sie Ihren Umzug in Deutschland optimal. Einfach ausdrucken und alle wichtigen Schritte abhaken – von der Ummeldung bis zur Organisation am Umzugstag.",
  keywords: "umzugscheckliste, checkliste umzug deutschland, umzugsplanung hilfe, umzug vorbereiten, wohnsitz ummelden, kfz ummelden checkliste, packliste umzug",
  alternates: {
    canonical: "https://www.aufraeumhelden.com/ratgeber/checkliste",
  },
};

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
