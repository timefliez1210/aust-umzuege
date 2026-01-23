'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Hauptnavigation">
      <div className={styles['navbar-container']}>
        <Link href="/" className={styles['brand-text']}>
          Aufräumhelden
        </Link>
        <button className={styles['menu-toggle']} onClick={toggleMenu} aria-expanded={isMenuOpen} aria-label="Menü öffnen">
          <span className={styles.hamburger}>{isMenuOpen ? '✕' : '☰'}</span>
        </button>
        <ul className={`${styles.ul} ${isMenuOpen ? styles.active : ''}`} role="menu" aria-hidden={!isMenuOpen}>
          <li role="none"><Link href="/" onClick={() => setIsMenuOpen(false)} role="menuitem">Home</Link></li>
          <li role="none"><Link href="/leistungen" onClick={() => setIsMenuOpen(false)} role="menuitem">Leistungen</Link></li>
          <li role="none"><Link href="/ratgeber" onClick={() => setIsMenuOpen(false)} role="menuitem">Ratgeber</Link></li>
          <li role="none"><Link href="/about" onClick={() => setIsMenuOpen(false)} role="menuitem">Über Uns</Link></li>
          <li role="none"><Link href="/standorte" onClick={() => setIsMenuOpen(false)} role="menuitem">Standorte</Link></li>
          <li role="none"><Link href="/kontakt" onClick={() => setIsMenuOpen(false)} role="menuitem">Kontakt</Link></li>
          <li role="none"><Link href="/kostenloses-angebot" className={styles.buttonLink} onClick={() => setIsMenuOpen(false)} role="menuitem">Kostenloses Angebot</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
