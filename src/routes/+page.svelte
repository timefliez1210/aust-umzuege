<script lang="ts">
  import Hero from "$lib/components/HeroV2.svelte";
  import TrustSignals from "$lib/components/TrustSignals.svelte";
  import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
  import RatgeberTeaser from "$lib/components/RatgeberTeaser.svelte";
  import MetaTags from "$lib/components/MetaTags.svelte";
  import StructuredData from "$lib/components/StructuredData.svelte";
  import { businessInfo, website, createBreadcrumbs } from "$lib/data/structuredData";

  const breadcrumbs = createBreadcrumbs([
    { name: "Home", url: "https://www.aust-umzuege.de/" }
  ]);
</script>

<svelte:head>
  <!-- Preload the real LCP element: HeroV2 owner image -->
  <link
    rel="preload"
    as="image"
    href="/seniorenumzuege-hildesheim-carousel-6.webp"
    imagesrcset="/seniorenumzuege-hildesheim-carousel-6-400w.webp 400w, /seniorenumzuege-hildesheim-carousel-6-600w.webp 600w, /seniorenumzuege-hildesheim-carousel-6-800w.webp 800w"
    imagesizes="(max-width: 1023px) 80vw, 480px"
    type="image/webp"
    fetchpriority="high"
  />
</svelte:head>

<MetaTags
  title="Umzugsunternehmen Hildesheim · Umzugsfirma mit Festpreis | Aust"
  description="Ihr Umzugsunternehmen in Hildesheim — Festpreis, kostenlose Vor-Ort-Besichtigung, verbindliches Angebot in 48 h. Jetzt unverbindlich anfragen."
  keywords="Umzugsunternehmen Hildesheim, Umzugsfirma Hildesheim, Aust Umzüge"
  canonical="https://www.aust-umzuege.de/"
  ogType="website"
/>

<StructuredData schema={businessInfo} />
<StructuredData schema={website} />
<StructuredData schema={breadcrumbs} />

<main>
  <Hero />
  <TrustSignals />
  <AboutSection />
  <ReviewsSection />
  <ServicesCarousel />
  <RatgeberTeaser />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }
</style>
