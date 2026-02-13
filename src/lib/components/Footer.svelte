<script lang="ts">
    // Footer - Site footer with social links, contact info, and legal links
    import { Facebook, Instagram } from "lucide-svelte";
</script>

<footer class="footer">
    <!-- Social Section -->
    <div class="footer__social">
        <div class="footer__container">
            <p class="footer__social-text">Folgt uns jetzt auf Social Media:</p>
            <div class="footer__social-icons">
                <a
                    href="https://facebook.com/austumzuege"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__social-link"
                    aria-label="Facebook"
                >
                    <Facebook size={22} />
                </a>
                <a
                    href="https://instagram.com/austumzuege"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__social-link"
                    aria-label="Instagram"
                >
                    <Instagram size={22} />
                </a>
                <a
                    href="https://tiktok.com/@austumzuege"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="footer__social-link"
                    aria-label="TikTok"
                >
                    <!-- TikTok icon (not in Lucide) -->
                    <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                        />
                    </svg>
                </a>
            </div>
        </div>
    </div>

    <!-- Main Footer Content -->
    <div class="footer__main">
        <div class="footer__container footer__grid">
            <!-- Anfahrt -->
            <div class="footer__column">
                <h4 class="footer__heading">Anfahrt</h4>
                <p class="footer__text">
                    Aust Umzüge & Haushaltsauflösungen<br />
                    Kaiserstr. 32<br />
                    31134 Hildesheim
                </p>
            </div>

            <!-- Kontakt -->
            <div class="footer__column">
                <h4 class="footer__heading">Kontakt</h4>
                <p class="footer__text">
                    Telefon: <a href="tel:+4951217558379">05121 – 7558379</a><br
                    />
                    Mobil: <a href="tel:+4917670745281">0176 – 70745281</a><br
                    />
                    E-Mail:
                    <a href="mailto:info@aust-umzuege.de"
                        >info@aust-umzuege.de</a
                    >
                </p>
            </div>

            <!-- Bürozeiten -->
            <div class="footer__column">
                <h4 class="footer__heading">Bürozeiten</h4>
                <p class="footer__text">
                    Montag – Freitag: 09:00 – 19:00 Uhr<br />
                    Samstag nach Vereinbarung<br />
                    Sonntag geschlossen
                </p>
            </div>

            <!-- Badge -->
            <div class="footer__column footer__badge">
                <img
                    src="/aust-umzuege-check-24-profi.webp"
                    alt="Check24 Profi seit 2019"
                    width="100"
                    height="100"
                    loading="lazy"
                />
            </div>
        </div>
    </div>

    <!-- Bottom Bar -->
    <div class="footer__bottom">
        <div class="footer__container footer__bottom-content">
            <p class="footer__copyright">
                Aust Umzüge und Haushaltsauflösungen
            </p>
            <nav class="footer__legal" aria-label="Rechtliche Links">
                <a href="/impressum">Impressum</a>
                <span class="footer__legal-divider">|</span>
                <a href="/datenschutz">Datenschutz</a>
                <span class="footer__legal-divider">|</span>
                <a href="/agb">AGB</a>
                <span class="footer__legal-divider">|</span>
                <a href="/cookie-einstellungen">Cookie-Einstellungen</a>
            </nav>
        </div>
    </div>
</footer>

<style>
    .footer {
        background-color: var(--color-info-bar);
        color: var(--color-text);
    }

    .footer__container {
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
    }

    /* Social Section */
    .footer__social {
        padding-block: var(--space-6);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .footer__social-text {
        color: rgba(255, 255, 255, 0.8);
        font-size: var(--text-sm);
        margin: 0 0 var(--space-4);
    }

    .footer__social-icons {
        display: flex;
        gap: var(--space-3);
    }

    .footer__social-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background-color: var(--color-nav-accent);
        color: var(--color-text);
        border-radius: var(--radius-full);
        transition:
            background-color var(--transition-fast),
            transform var(--transition-fast);
    }

    .footer__social-link:hover {
        background-color: #d84a00;
        transform: scale(1.1);
    }

    /* Main Footer */
    .footer__main {
        padding-block: var(--space-10);
    }

    .footer__grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-8);
    }

    .footer__column {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .footer__heading {
        color: var(--color-text);
        font-size: var(--text-base);
        font-weight: var(--font-bold);
        margin: 0;
    }

    .footer__text {
        color: rgba(255, 255, 255, 0.75);
        font-size: var(--text-sm);
        line-height: 1.7;
        margin: 0;
    }

    .footer__text a {
        color: rgba(255, 255, 255, 0.75);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .footer__text a:hover {
        color: var(--color-text);
    }

    .footer__badge {
        align-items: flex-end;
        justify-content: flex-start;
    }

    .footer__badge img {
        width: 100px;
        height: auto;
    }

    /* Bottom Bar */
    .footer__bottom {
        padding-block: var(--space-4);
        background-color: var(--color-text);
    }

    .footer__bottom-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-4);
    }

    .footer__copyright {
        color: var(--color-primary);
        font-size: var(--text-sm);
        margin: 0;
    }

    .footer__legal {
        display: flex;
        align-items: center;
        gap: var(--space-3);
    }

    .footer__legal a {
        color: var(--color-primary);
        font-size: var(--text-sm);
        text-decoration: none;
        transition: color var(--transition-fast);
    }

    .footer__legal a:hover {
        color: var(--color-nav-accent);
    }

    .footer__legal-divider {
        color: #94a3b8;
    }

    /* Tablet */
    @media (max-width: 900px) {
        .footer__grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .footer__badge {
            align-items: flex-start;
        }
    }

    /* Mobile */
    @media (max-width: 500px) {
        .footer__grid {
            grid-template-columns: 1fr;
            gap: var(--space-6);
        }

        .footer__bottom-content {
            flex-direction: column;
            text-align: center;
        }
    }
</style>
