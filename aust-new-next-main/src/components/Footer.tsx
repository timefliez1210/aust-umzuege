"use client";

import React from "react";
import Link from "next/link";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles["footer-content"]}>
        <div className={styles["footer-section"]}>
          <h3>Kontakt</h3>
          <address>
            <p>
              <a href="tel:+4951217558379">Tel: 05121 – 7558379</a>
              <br />
              <a href="tel:+4915901443839">Mobil: 0159 - 01443839</a>
              <br />
              <a href="mailto:info@aufraeumhelden.com">
                info@aufraeumhelden.com
              </a>
            </p>
          </address>
        </div>

        <div className={styles["footer-section"]}>
          <h3>Öffnungszeiten</h3>
          <div className={styles["opening-hours"]}>
            <p>Montag - Freitag</p>
            <p>09:00 - 17:00 Uhr</p>
            <p className={styles.note}>An Feiertagen geschlossen</p>
          </div>
        </div>

        <div className={styles["footer-section"]}>
          <h3>Links</h3>
          <ul>
            <li>
              <Link href="/leistungen">Leistungen</Link>
            </li>
            <li>
              <Link href="/kostenloses-angebot">Kostenloses Angebot</Link>
            </li>
            <li>
              <Link href="/datenschutz">Datenschutz</Link>
            </li>
            <li>
              <Link href="/impressum">Impressum</Link>
            </li>
            <li>
              <Link href="/agb">AGB</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles["footer-bottom"]}>
        <p>&copy; {currentYear} Aufraeumhelden. Alle Rechte vorbehalten.</p>
      </div>
    </footer>
  );
};

export default Footer;
