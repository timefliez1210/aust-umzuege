<script lang="ts">
    // Navbar - Main navigation with mobile hamburger menu
    import { page } from "$app/stores";

    interface NavLink {
        label: string;
        href: string;
        hasDropdown?: boolean;
    }

    interface Props {
        links?: NavLink[];
    }

    let {
        links = [
            { label: "Leistungen", href: "/leistungen", hasDropdown: true },
            { label: "Ratgeber", href: "/ratgeber", hasDropdown: true },
            { label: "Kontakt", href: "/kontakt" },
        ],
    }: Props = $props();

    let mobileMenuOpen = $state(false);

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
    }
</script>

<nav class="navbar" aria-label="Hauptnavigation">
    <div class="navbar__container">
        <!-- Logo -->
        <a href="/" class="navbar__logo" aria-label="Zur Startseite">
            <img
                src="/umzuege-hildesheim-logo-aust.webp"
                alt="Aust Umzüge Logo"
                width="150"
                height="50"
                loading="eager"
            />
        </a>

        <!-- Desktop Navigation -->
        <ul class="navbar__links" role="menubar">
            {#each links as link}
                <li role="none">
                    <a
                        href={link.href}
                        class="navbar__link"
                        class:active={$page.url.pathname.startsWith(link.href)}
                        role="menuitem"
                    >
                        {link.label}
                        {#if link.hasDropdown}
                            <svg
                                class="navbar__chevron"
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        {/if}
                    </a>
                </li>
            {/each}
        </ul>

        <!-- CTA Button -->
        <a href="/angebot" class="navbar__cta">
            Kostenfreies Angebot
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        </a>

        <!-- Mobile Menu Button -->
        <button
            class="navbar__toggle"
            onclick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
        >
            <span class="navbar__toggle-bar" class:open={mobileMenuOpen}></span>
            <span class="navbar__toggle-bar" class:open={mobileMenuOpen}></span>
            <span class="navbar__toggle-bar" class:open={mobileMenuOpen}></span>
        </button>
    </div>

    <!-- Mobile Menu -->
    <div
        id="mobile-menu"
        class="navbar__mobile"
        class:open={mobileMenuOpen}
        aria-hidden={!mobileMenuOpen}
    >
        <ul class="navbar__mobile-links">
            {#each links as link}
                <li>
                    <a
                        href={link.href}
                        class="navbar__mobile-link"
                        onclick={closeMobileMenu}
                    >
                        {link.label}
                    </a>
                </li>
            {/each}
            <li>
                <a
                    href="/angebot"
                    class="navbar__mobile-cta"
                    onclick={closeMobileMenu}
                >
                    Kostenfreies Angebot
                </a>
            </li>
        </ul>
    </div>
</nav>

<style>
    .navbar {
        background-color: var(--color-text);
        position: sticky;
        top: 0;
        z-index: var(--z-sticky);
        box-shadow: var(--shadow-sm);
    }

    .navbar__container {
        width: 100%;
        max-width: var(--container-max);
        margin-inline: auto;
        padding-inline: var(--container-padding);
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 80px;
        gap: var(--space-8);
    }

    .navbar__logo {
        display: flex;
        align-items: center;
        flex-shrink: 0;
    }

    .navbar__logo img {
        width: auto;
        height: 78px;
        object-fit: contain;
    }

    .navbar__links {
        display: none;
        list-style: none;
        gap: var(--space-8);
        margin: 0;
        padding: 0;
    }

    .navbar__link {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: var(--color-primary);
        font-weight: var(--font-medium);
        font-size: var(--text-base);
        text-decoration: none;
        padding: var(--space-2) 0;
        transition: color var(--transition-fast);
    }

    .navbar__link:hover,
    .navbar__link.active {
        color: var(--color-nav-accent, #e65100);
    }

    .navbar__chevron {
        transition: transform var(--transition-fast);
    }

    .navbar__link:hover .navbar__chevron {
        transform: rotate(180deg);
    }

    .navbar__cta {
        display: none;
        align-items: center;
        gap: var(--space-2);
        background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
        color: var(--color-text);
        padding: var(--space-3) var(--space-6);
        border-radius: var(--radius-md);
        font-weight: var(--font-semibold);
        font-size: var(--text-sm);
        text-decoration: none;
        transition:
            transform var(--transition-fast),
            box-shadow var(--transition-fast);
        white-space: nowrap;
    }

    .navbar__cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(230, 81, 0, 0.3);
        color: var(--color-text);
    }

    /* Mobile Toggle */
    .navbar__toggle {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
    }

    .navbar__toggle-bar {
        display: block;
        width: 100%;
        height: 2px;
        background-color: var(--color-primary);
        border-radius: var(--radius-full);
        transition:
            transform var(--transition-base),
            opacity var(--transition-base);
    }

    .navbar__toggle-bar.open:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
    }

    .navbar__toggle-bar.open:nth-child(2) {
        opacity: 0;
    }

    .navbar__toggle-bar.open:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
    }

    /* Mobile Menu */
    .navbar__mobile {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows var(--transition-base);
        background-color: var(--color-text);
        border-top: 1px solid var(--color-border);
    }

    .navbar__mobile.open {
        grid-template-rows: 1fr;
    }

    .navbar__mobile-links {
        overflow: hidden;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .navbar__mobile.open .navbar__mobile-links {
        padding: var(--space-4) var(--container-padding);
    }

    .navbar__mobile-link {
        display: block;
        color: var(--color-primary);
        font-weight: var(--font-medium);
        padding: var(--space-3) 0;
        text-decoration: none;
        border-bottom: 1px solid var(--color-border);
    }

    .navbar__mobile-cta {
        display: block;
        background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
        color: var(--color-text);
        padding: var(--space-4);
        border-radius: var(--radius-md);
        font-weight: var(--font-semibold);
        text-align: center;
        text-decoration: none;
        margin-top: var(--space-4);
    }

    /* Desktop Styles */
    @media (min-width: 768px) {
        .navbar__links {
            display: flex;
        }

        .navbar__cta {
            display: flex;
        }

        .navbar__toggle {
            display: none;
        }

        .navbar__mobile {
            display: none;
        }
    }
</style>
