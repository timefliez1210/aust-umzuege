import type { Metadata } from "next";
import { Roboto, Lato } from "next/font/google";
import "./global.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: {
    default: "Aufraeumhelden | Hildesheim & Hannover",
    template: "%s | Aufraeumhelden",
  },
  description:
    "Ihr zuverlässiger Partner für Umzüge, Haushaltsauflösungen und Entrümpelungen in Hildesheim, Hannover und Umgebung. Wir bieten professionelle Dienstleistungen für Privat- und Firmenkunden.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aufraeumhelden",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export const generateViewport = () => ({
  width: "device-width",
  initialScale: 1,
  themeColor: "#cc4d00",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "http://schema.org",
              "@type": "LocalBusiness",
              name: "Aufraeumhelden",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Ehrlicherstr. 38",
                addressLocality: "Hildesheim",
                postalCode: "31135",
                addressCountry: "DE",
              },
              telephone: "0159 - 01443839",
              url: "https://www.aufraeumhelden.com",
              openingHours: "Mo-Fr 08:00-18:00",
              image:
                "https://www.aufraeumhelden.com/Professionelle-Umzuege-Hildesheim.webp",
              priceRange: "$",
              hasMap:
                "https://www.google.com/maps/search/Aufraeumhelden+Ehrlicherstr.+38,+31135+Hildesheim",
            }),
          }}
        />
        <meta name="theme-color" content="#cc4d00" />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <CookieBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
