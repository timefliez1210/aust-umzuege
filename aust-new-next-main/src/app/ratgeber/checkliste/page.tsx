'use client';

import Link from 'next/link';
import React from 'react';
import styles from './checkliste.module.css';

const ChecklistPage = () => {
  const checklistItems = [
    // Behörden & Verträge
    "Neuen Wohnsitz beim Einwohnermeldeamt anmelden (Termin vereinbaren!)",
    "Fahrzeug bei der Kfz-Zulassungsstelle ummelden",
    "Banken, Versicherungen, Arbeitgeber über neue Adresse informieren",
    "Weitere wichtige Institutionen (Abos, Vereine etc.) benachrichtigen",
    "Nachsendeauftrag bei der Post einrichten",
    "Telefon-, Internet- und Stromanbieter über Umzug informieren (Verträge prüfen/kündigen/ummelden)",
    // Umzugsplanung & Organisation
    "Umzugsunternehmen recherchieren und Angebote einholen/vergleichen",
    "Umzugstermin festlegen und ggf. Urlaub beantragen",
    "Umzugskartons und ausreichend Verpackungsmaterial besorgen",
    "Unterstützung für Pack-, Demontage- und Montagearbeiten planen (ggf. Service buchen)",
    "Transport für den Umzugstag organisieren (z.B. Transporter mieten, Halteverbotszone beantragen)",
    "Ausgaben für den Umzug kalkulieren und ein Budget festlegen",
    // Vorbereitung & Durchführung
    "Wichtige Dokumente, Wertsachen und Schlüssel sicher verwahren",
    "Notfallkoffer packen (Medikamente, Hygieneartikel, Werkzeug für den ersten Tag)",
    "Entrümpeln: Nicht mehr Benötigtes aussortieren, verkaufen, spenden oder entsorgen",
    "Übergabetermin für die alte Wohnung vereinbaren und Zählerstände ablesen",
    "Reinigung der alten Wohnung organisieren",
    "Verpflegung für Umzugshelfer bereitstellen",
    "Alle Schlüssel der alten Wohnung zurückgeben",
    // Nach dem Umzug
    "Namensschilder an Briefkasten und Klingel anbringen",
    "Ggf. Mängel im neuen Zuhause dokumentieren und Vermieter informieren",
    "Freunden und Familie die neue Adresse mitteilen"
  ];

  const printChecklist = () => {
    window.print();
  };

  const replaceKeywordsWithLinks = (text: string) => {
    const replacements: { [key: string]: string } = {
      "Umzugsunternehmen": "/leistungen/umzuege",
      "Umzugskartons": "/leistungen/umzugskartons",
      "Verpackungsmaterial": "/leistungen/einpackservice",
      "Pack-": "/leistungen/einpackservice",
      "Demontage-": "/leistungen/demontage",
      "Montagearbeiten": "/leistungen/montage",
      "Entrümpeln": "/leistungen/entruempelungen",
      "Reinigung": "/leistungen/malerarbeiten",
    };

    let result: (string | React.ReactNode)[] = [text];

    Object.entries(replacements).forEach(([keyword, url]) => {
      result = result.flatMap((segment) => {
        if (typeof segment !== 'string') {
          return segment;
        }
        const parts = segment.split(new RegExp(`(${keyword})`, 'gi'));
        return parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <Link href={url} key={`${keyword}-${i}`}>
              {part}
            </Link>
          ) : (
            part
          )
        );
      });
    });
    return result;
  };

  return (
    <main className={styles['checklist-container']}>
      <h1 className={styles.heading1}>Ihre Umzugscheckliste für einen entspannten Start</h1>
      <p className={styles.paragraph}>Ein Umzug will gut geplant sein! Diese Checkliste begleitet Sie bei allen wichtigen Schritten für Ihren Umzug innerhalb Deutschlands. Einfach ausdrucken und abhaken und nichts Wichtiges vergessen – für einen möglichst stressfreien Start in Ihrem neuen Zuhause.</p>
      <ul className={styles.unorderedList}>
        {checklistItems.map((item, index) => (
          <li className={styles.listItem} key={index}>
            <input type="checkbox" id={item} name={item} />
            <label htmlFor={item}>{replaceKeywordsWithLinks(item)}</label>
          </li>
        ))}
      </ul>
      <button onClick={printChecklist} className={`${styles['print-button']} button`}>Drucken</button>
      <Link className={styles['back-link']} href="/ratgeber"><button className="button">Zurück zum Ratgeber</button></Link>
    </main>
  );
};

export default ChecklistPage;
