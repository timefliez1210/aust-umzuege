'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './ServiceContainer.module.css';

interface Service {
  title: string;
  description: string;
  icon: string;
  image?: string; // Optional image property
  href: string; // Added href for navigation
}

interface ServiceContainerProps {
  services?: Service[];
}

const defaultServices: Service[] = [
  {
    "title": "Lokaler Umzug",
    "description": "Ob innerhalb von Hildesheim, Hannover oder im nahen Umland – wir gestalten Ihren lokalen Umzug einfach, schnell und zuverlässig. Vertrauen Sie auf unseren maßgeschneiderten Service für einen stressfreien Start im neuen Zuhause. Fordern Sie jetzt Ihr individuelles Angebot an.",
    "icon": "/locale-umzuege-hildesheim.svg",
    "href": "/leistungen/lokaler-umzug"
  },
  {
    "title": "Firmenumzug",
    "description": "Ihr Firmenumzug in Hildesheim, Hannover und Umgebung: Wir bieten professionelle, maßgeschneiderte Lösungen für einen reibungslosen und effizienten Ablauf mit minimaler Störung Ihres Betriebs. Profitieren Sie von unserer Expertise – fragen Sie unverbindlich an.",
    "icon": "/firmenumzuege-niedersachsen-und-deutschlandweit.svg",
    "href": "/leistungen/firmenumzug"
  },
  {
    "title": "Fernumzug",
    "description": "Ihr Umzug führt Sie weiter weg? Ob deutschland- oder europaweit, wir sind Ihr Partner für Fernumzüge. Unser Service deckt jeden Schritt professionell ab – für einen sorgenfreien Wechsel an Ihren neuen Wohnort. Verlassen Sie sich auf unsere Erfahrung.",
    "icon": "/ueberregionale-und-weltweite-umzuege.svg",
    "href": "/leistungen/fernumzug" 
  },
  {
    "title": "Überseeumzug",
    "description": "Ein Umzug über Kontinente hinweg? Mit unserem globalen Netzwerk sorgen wir für einen sicheren und termingerechten Überseeumzug. Starten Sie sorgenfrei ins Abenteuer – wir beraten Sie individuell und umfassend.",
    "icon": "/weltweite-umzuege.svg",
    "href": "/leistungen/Ueberseeumzug"
  },
  {
    "title": "Haushaltsauflösungen",
    "description": "Haushaltsauflösung in Hildesheim, Hannover und Region: Ob bei Umzug, Nachlass oder einfach um Platz zu schaffen – wir arbeiten schnell, diskret und zuverlässig. Vertrauen Sie auf unsere professionelle Unterstützung und fordern Sie Ihr Angebot an.",
    "icon": "/Haushaltsauflosungen-in-Hannover-und-Hildesheim.svg",
    "href": "/leistungen/haushaltsaufloesungen"
  },
  {
    "title": "Entrümpelungen",
    "description": "Mehr Platz benötigt? Unser Entrümpelungsservice schafft Ordnung – vom Keller bis zum Dachboden. Wir entsorgen ungenutzte Gegenstände fachgerecht und umweltbewusst für private Haushalte und Betriebe in Hildesheim, Hannover und Umgebung.",
    "icon": "/haushaltsentruempelungen-hildesheim-hannover.svg",
    "href": "/leistungen/entruempelungen"
  },
  {
    "title": "Stabile Umzugskartons",
    "description": "Hochwertige Umzugskartons zum Mieten oder Kaufen für optimalen Schutz Ihres Umzugsguts. Stabil, umweltfreundlich und passend für jeden Bedarf – verfügbar in Hildesheim, Hannover und Umgebung.",
    "icon": "/umzugskartons-hildesheim-hannover.svg",
    "href": "/leistungen/umzugskartons"
  },
  {
    "title": "Professioneller Montageservice",
    "description": "Überlassen Sie uns den Möbelaufbau! Unser Montageservice in Hildesheim und Hannover sorgt für eine fachgerechte und stabile Installation Ihrer Einrichtung – damit Sie sich direkt wohlfühlen.",
    "icon": "/montage-service.svg",
    "href": "/leistungen/montage"
  },
  {
    "title": "Sicherer Demontageservice",
    "description": "Wir bereiten Ihre Möbel optimal für den Transport vor. Unser Demontageservice in Hildesheim und Hannover arbeitet schnell, sicher und fachgerecht – für einen stressfreien Umzugsstart.",
    "icon": "/demontage-service.svg",
    "href": "/leistungen/demontage"
  },
  {
    "title": "Einpackservice",
    "description": "Sicher verpackt, entspannt umgezogen. Unser professioneller Einpackservice schützt Ihr Hab und Gut mit hochwertigem Material und geübten Händen – für Umzüge in Hildesheim, Hannover und darüber hinaus.",
    "icon": "/einpackservice.svg",
    "href": "/leistungen/einpackservice"
  },
  {
    "title": "AuspackService",
    "description": "Ankommen und wohlfühlen! Unser Auspackservice nimmt Ihnen das Ausräumen der Kartons ab und hilft, Ihr neues Zuhause in Hildesheim oder Hannover schnell wohnlich zu gestalten.",
    "icon": "/auspackservice.svg",
    "href": "/leistungen/auspackservice"
  },
  {
    "title": "Fachgerechte Installationen",
    "description": "Von der Waschmaschine bis zur Unterhaltungselektronik: Unsere Experten sorgen für den fachgerechten Anschluss Ihrer Geräte in Hildesheim, Hannover und Umgebung – für einen reibungslosen Start.",
    "icon": "/installations-service.svg",
    "href": "/leistungen/installation"
  },
  {
    "title": "Aufhängen von Gegenständen",
    "description": "Bilder, Regale, Lampen oder TV-Wandhalterungen – wir bringen alles sicher und ästhetisch an die Wand. Verlassen Sie sich auf unseren Aufhängservice in Hildesheim und Hannover.",
    "icon": "/aufhaengen-service.svg",
    "href": "/leistungen/aufhaengen-von-gegenstaenden"
  },
  {
    "title": "Malerarbeiten",
    "description": "Frische Farbe für Ihr Zuhause? Unsere Malerarbeiten umfassen hochwertige Renovierungsanstriche und Lackierungen, die Ihre Räume in Hildesheim und Hannover neu erstrahlen lassen. Wir beraten Sie gerne.",
    "icon": "/malerarbeiten-service.svg",
    "href": "/leistungen/malerarbeiten"
  },
  {
    "title": "Umzugsplanung",
    "description": "Jeder gute Umzug beginnt mit einer perfekten Planung. Wir unterstützen Sie dabei – von der ersten Idee bis zum Umzugstag. Gemeinsam entwickeln wir ein maßgeschneidertes Konzept für Ihren stressfreien Umzug in Hildesheim, Hannover und darüber hinaus.",
    "icon": "/umzugsplanung-service.svg",
    "href": "/leistungen/umzugsplanung"
  }
];

const ServiceContainer: React.FC<ServiceContainerProps> = ({ services = defaultServices }) => {
  return (
    <div className={styles['services-container']}>
      {services.map((service) => (
          <div key={service.title} className={styles['service-card']} role="article">
            <div>
              <Image
                src={service.icon}
                alt={`${service.title} Icon`}
                className={styles['service-icon']}
                width={64}
                height={64}
                loading="lazy"
              />
              <h2 className={styles['service-title']}>{service.title}</h2>
              <p className={styles['service-description']}>{service.description}</p>
              <Link href={service.href} className={`${styles['read-more-button']} button`}>
                Mehr erfahren
              </Link>
            </div>
            {service.image && (
              <Image
                src={service.image}
                alt={`${service.title} Bild`}
                width={400}
                height={300}
                loading="lazy"
                className={styles['service-image']}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              />
            )}
          </div>
      ))}
    </div>
  );
};

export default ServiceContainer;
