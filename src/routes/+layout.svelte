<script lang="ts">
  import "../styles/global.css";
  import { page } from "$app/stores";
  import InfoBar from "$lib/components/InfoBar.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import ContactCTA from "$lib/components/ContactCTA.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import CookieBanner from "$lib/components/CookieBanner.svelte";
  import ConsentManager from "$lib/components/ConsentManager.svelte";

  let { children } = $props();

  const siteUrl = "https://www.aust-umzuege.de";
  const siteName = "Aust Umzüge";
  const defaultImage = "/umzuege-haushaltsaufloesungen-hildesheim-umgebung.webp";
</script>

<svelte:head>
  <!-- Canonical URL -->
  <link rel="canonical" href="{siteUrl}{$page.url.pathname}" />

  <!-- Open Graph -->
  <meta property="og:site_name" content={siteName} />
  <meta property="og:locale" content="de_DE" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="{siteUrl}{defaultImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="{siteUrl}{defaultImage}" />
</svelte:head>

<!-- Skip link for accessibility -->
<a href="#main-content" class="skip-link">Zum Inhalt springen</a>

<InfoBar />
<Navbar />

<div id="main-content">
  {@render children()}
</div>

<ContactCTA />
<Footer />
<CookieBanner />
<ConsentManager />

<style>
  #main-content {
    padding-top: 120px; /* Height of fixed InfoBar (~40px) + Navbar (80px) */
  }

  /* On mobile, InfoBar is hidden */
  @media (max-width: 767px) {
    #main-content {
      padding-top: 80px; /* Only navbar height */
    }
  }

  .skip-link {
    position: absolute;
    top: -100%;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-info-bar);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 0 0 0.5rem 0.5rem;
    z-index: 9999;
    text-decoration: none;
    font-weight: 600;
    transition: top 0.2s;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
