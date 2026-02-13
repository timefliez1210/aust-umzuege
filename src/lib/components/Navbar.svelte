<script lang="ts">
    // Navbar - Main navigation with mobile hamburger menu
    import { page } from "$app/stores";
    import { Plus, Minus } from "lucide-svelte";

    interface DropdownItem {
        label: string;
        href: string;
    }

    interface NavLink {
        label: string;
        href: string;
        hasDropdown?: boolean;
        dropdownItems?: DropdownItem[];
    }

    interface Props {
        links?: NavLink[];
    }

    let {
        links = [
            {
                label: "Leistungen",
                href: "/leistungen",
                hasDropdown: true,
                dropdownItems: [
                    { label: "Privatumzug", href: "/leistungen/privatumzug" },
                    { label: "Firmenumzug", href: "/leistungen/firmenumzug" },
                    {
                        label: "Fern- & Überseeumzug",
                        href: "/leistungen/fern-ueberseeumzug",
                    },
                    {
                        label: "Seniorenumzug",
                        href: "/leistungen/seniorenumzug",
                    },
                    { label: "Umzugshelfer", href: "/leistungen/umzugshelfer" },
                    { label: "Halteverbot", href: "/leistungen/halteverbot" },
                    {
                        label: "Umzugsberatung",
                        href: "/leistungen/umzugsberatung",
                    },
                    {
                        label: "Demontage & Montage",
                        href: "/leistungen/montage",
                    },
                    {
                        label: "Haushaltsauflösungen",
                        href: "/leistungen/haushaltsaufloesung",
                    },
                    {
                        label: "Lagerung & Einlagerung",
                        href: "/leistungen/lagerung",
                    },
                ],
            },
            {
                label: "Ratgeber",
                href: "/ratgeber",
                hasDropdown: true,
                dropdownItems: [
                    {
                        label: "Umzugs-Checkliste",
                        href: "/ratgeber/umzugs-checkliste",
                    },
                    {
                        label: "Verpackungstipps",
                        href: "/ratgeber/verpackungstipps",
                    },
                    {
                        label: "Haushaltsauflösungen",
                        href: "/ratgeber/haushaltsaufloesungen-entruempelungen",
                    },
                    {
                        label: "Seriöse Umzugsfirma erkennen",
                        href: "/ratgeber/seriose-umzugsfirma",
                    },
                ],
            },
            { label: "Kontakt", href: "/kontakt" },
        ],
    }: Props = $props();

    let mobileMenuOpen = $state(false);
    let activeMobileDropdown = $state<string | null>(null);

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
        if (!mobileMenuOpen) {
            activeMobileDropdown = null; // Reset submenus on close
        }
    }

    function closeMobileMenu() {
        mobileMenuOpen = false;
        activeMobileDropdown = null;
    }

    function toggleMobileDropdown(label: string) {
        if (activeMobileDropdown === label) {
            activeMobileDropdown = null;
        } else {
            activeMobileDropdown = label;
        }
    }
</script>

<header>
<nav class="navbar" aria-label="Hauptnavigation">
    <div class="navbar__container">
        <!-- Logo -->
        <a href="/" class="navbar__logo" aria-label="Zur Startseite">
            <img
                src="/LogoName_transparent.webp"
                alt="Aust Umzüge Logo"
                width="150"
                height="50"
                loading="eager"
            />
        </a>

        <!-- Desktop Navigation -->
        <ul class="navbar__links" role="menubar">
            {#each links as link}
                <li role="none" class="navbar__item">
                    <a
                        href={link.href}
                        class="navbar__link"
                        class:active={$page.url.pathname.startsWith(link.href)}
                        role="menuitem"
                        aria-haspopup={link.hasDropdown ? "true" : undefined}
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

                    <!-- Desktop Dropdown Menu -->
                    {#if link.hasDropdown && link.dropdownItems}
                        <div class="navbar__dropdown">
                            {#each link.dropdownItems as item}
                                <a
                                    href={item.href}
                                    class="navbar__dropdown-link"
                                >
                                    {item.label}
                                </a>
                            {/each}
                        </div>
                    {/if}
                </li>
            {/each}
        </ul>

        <!-- CTA Button -->
        <a href="/kostenloses-angebot" class="navbar__cta">
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
                    <div class="navbar__mobile-row">
                        <a
                            href={link.href}
                            class="navbar__mobile-link"
                            onclick={closeMobileMenu}
                        >
                            {link.label}
                        </a>
                        {#if link.hasDropdown}
                            <button
                                class="navbar__mobile-dropdown-btn"
                                onclick={() => toggleMobileDropdown(link.label)}
                                aria-label="{link.label} Untermenü öffnen"
                                aria-expanded={activeMobileDropdown ===
                                    link.label}
                            >
                                {#if activeMobileDropdown === link.label}
                                    <Minus size={20} />
                                {:else}
                                    <Plus size={20} />
                                {/if}
                            </button>
                        {/if}
                    </div>

                    {#if link.hasDropdown && link.dropdownItems && activeMobileDropdown === link.label}
                        <ul class="navbar__mobile-sublinks">
                            {#each link.dropdownItems as item}
                                <li>
                                    <a
                                        href={item.href}
                                        class="navbar__mobile-sublink"
                                        onclick={closeMobileMenu}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </li>
            {/each}
            <li>
                <a
                    href="/kostenloses-angebot"
                    class="navbar__mobile-cta"
                    onclick={closeMobileMenu}
                >
                    Kostenfreies Angebot
                </a>
            </li>
        </ul>
    </div>
</nav>
</header>

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
        height: 76px;
        object-fit: contain;
    }

    .navbar__links {
        display: none;
        list-style: none;
        gap: var(--space-8);
        margin: 0;
        padding: 0;
    }

    .navbar__item {
        position: relative; /* For dropdown positioning */
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

    .navbar__link:hover {
        color: var(--color-nav-accent, #e65100);
    }

    .navbar__link.active {
        color: #fff; /* White for sufficient contrast on dark background */
        font-weight: var(--font-semibold);
    }

    .navbar__chevron {
        transition: transform var(--transition-fast);
    }

    .navbar__item:hover .navbar__chevron {
        transform: rotate(180deg);
    }

    /* Dropdown Menu Desktop */
    .navbar__dropdown {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        background-color: #fff;
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-radius: var(--radius-md);
        padding: var(--space-2) 0;
        min-width: 220px;
        opacity: 0;
        visibility: hidden;
        transition: all var(--transition-fast);
        border: 1px solid #f1f5f9;
        z-index: 100;
        padding-top: var(--space-2);
    }

    .navbar__item:hover .navbar__dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }

    .navbar__dropdown-link {
        display: block;
        padding: 10px 16px;
        color: #4a5568;
        text-decoration: none;
        font-size: 0.95rem; /* ~15px */
        transition:
            background-color var(--transition-fast),
            color var(--transition-fast);
        white-space: nowrap;
    }

    .navbar__dropdown-link:hover {
        background-color: #f8fafc;
        color: var(--color-nav-accent);
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

    /* Mobile Row Layout */
    .navbar__mobile-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-border);
    }

    .navbar__mobile-link {
        flex: 1;
        display: block;
        color: var(--color-primary);
        font-weight: var(--font-medium);
        padding: var(--space-3) 0;
        text-decoration: none;
    }

    .navbar__mobile-dropdown-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: none;
        border: none;
        color: var(--color-info-bar);
        cursor: pointer;
        border-left: 1px solid var(--color-border);
    }

    /* Mobile Sublinks */
    .navbar__mobile-sublinks {
        list-style: none;
        padding: 0;
        margin: 0;
        padding-left: var(--space-4);
        background-color: #f9fafb;
        border-bottom: 1px solid var(--color-border); /* Close gap */
    }

    .navbar__mobile-sublink {
        display: block;
        color: #64748b;
        padding: var(--space-3) 0; /* Slightly more touch-friendly */
        text-decoration: none;
        font-size: 0.95rem;
        border-bottom: 1px dashed #e2e8f0;
    }

    .navbar__mobile-sublink:last-child {
        border-bottom: none;
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
