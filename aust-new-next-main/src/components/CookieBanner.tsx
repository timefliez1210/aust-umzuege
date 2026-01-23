'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './CookieBanner.module.css';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  // Initialize Google Analytics with consent mode
  const loadGTM = () => {
    if (document.getElementById('gtm-script')) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-JBNB80SRNT';
    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }
      window.gtag = gtag;

      window.gtag('js', new Date());
      window.gtag('config', 'G-JBNB80SRNT', { 'send_page_view': false });
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    };
  };

  const initGA = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    window.gtag('js', new Date());
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
    });
  };

  const enableAnalytics = useCallback(() => {
    loadGTM();
  }, []);

  const acceptAllCookies = () => {
    const settings = {
      necessary: true,
      analytics: true,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    setAnalyticsEnabled(true);
    enableAnalytics();
    setShowBanner(false);
  };

  const acceptNecessaryCookies = () => {
    const settings = {
      necessary: true,
      analytics: false,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    setAnalyticsEnabled(false);
    setShowBanner(false);
  };

  const openCookieSettings = () => {
    setShowModal(true);
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      const settings = JSON.parse(consent);
      setAnalyticsEnabled(settings.analytics);
    }
  };

  const saveSettings = () => {
    const settings = {
      necessary: true,
      analytics: analyticsEnabled,
    };
    localStorage.setItem('cookieConsent', JSON.stringify(settings));
    if (settings.analytics) {
      enableAnalytics();
    } else {
      // If analytics are disabled, ensure GTM script is not loaded or removed if already present
      const gtmScript = document.getElementById('gtm-script');
      if (gtmScript) {
        gtmScript.remove();
      }
    }
    setShowModal(false);
    setShowBanner(false);
  };

  const handleModalClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setShowModal(false);
    }
  };

  const handleModalKeydown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowModal(false);
    }
  };

  useEffect(() => {
    initGA(); // Initialize gtag and dataLayer

    const checkCookieConsent = () => {
      const consent = localStorage.getItem('cookieConsent');
      if (!consent) {
        setShowBanner(true);
      } else {
        const settings = JSON.parse(consent);
        setAnalyticsEnabled(settings.analytics);
        if (settings.analytics) {
          enableAnalytics();
        }
      }
    };
    checkCookieConsent();
  }, [enableAnalytics]);

  return (
    <>
      <div className={`${styles['cookie-banner']} ${showBanner ? styles.active : ''}`}>
        <div className={styles['cookie-content']}>
          <div className={styles['cookie-text']}>
            <p>
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. Durch die Nutzung unserer Website stimmen Sie der Verwendung von Cookies gemäß unserer{' '}
              <Link href="/datenschutz" className={styles['privacy-link']}>
                Datenschutzerklärung
              </Link>{' '}
              zu.
            </p>
          </div>
          <div className={styles['cookie-buttons']}>
            <button className={`${styles['accept-all']} button`} onClick={acceptAllCookies} aria-label="Alle Cookies akzeptieren">
              Alle akzeptieren
            </button>
            <button className={`${styles['accept-necessary']} button`} onClick={acceptNecessaryCookies} aria-label="Nur notwendige Cookies akzeptieren">
              Nur notwendige
            </button>
            <button className={`${styles['cookie-settings']} button`} onClick={openCookieSettings} aria-label="Cookie-Einstellungen anpassen">
              Einstellungen
            </button>
          </div>
        </div>
      </div>

      <div
        className={`${styles['cookie-modal']} ${showModal ? styles.active : ''}`}
        onClick={handleModalClick}
        onKeyDown={handleModalKeydown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-settings-title"
        tabIndex={-1}
      >
        <div className={styles['modal-content']}>
          <h2 id="cookie-settings-title">Cookie-Einstellungen</h2>
          <p>Hier können Sie Ihre Cookie-Präferenzen anpassen. Bitte beachten Sie, dass einige Cookies aus technischen Gründen notwendig sind.</p>

          <div className={`${styles['cookie-group']} ${styles.required}`}>
            <div className={styles['cookie-group-header']}>
              <div>
                <h3>Notwendige Cookies</h3>
                <p>Diese Cookies sind für die Grundfunktionen der Website erforderlich.</p>
              </div>
              <label className={styles['cookie-switch']} aria-label="Notwendige Cookies (immer aktiviert)">
                <input type="checkbox" checked disabled />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles['cookie-group']}>
            <div className={styles['cookie-group-header']}>
              <div>
                <h3>Analyse Cookies</h3>
                <p>Diese Cookies helfen uns, die Nutzung der Website zu verstehen und zu verbessern (Google Analytics).</p>
              </div>
              <label className={styles['cookie-switch']} aria-label="Analyse Cookies">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <div className={styles['cookie-buttons']}>
            <button className={`${styles['accept-all']} button`} onClick={saveSettings} aria-label="Einstellungen speichern">
              Einstellungen speichern
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieBanner;