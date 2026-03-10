<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ServiceBoxes from "$lib/components/ServiceBoxes.svelte";
  import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
  import RatgeberTeaser from "$lib/components/RatgeberTeaser.svelte";
  import MetaTags from "$lib/components/MetaTags.svelte";
  import StructuredData from "$lib/components/StructuredData.svelte";
  import { businessInfo, website, createBreadcrumbs } from "$lib/data/structuredData";

  const breadcrumbs = createBreadcrumbs([
    { name: "Home" }
  ]);
</script>

<MetaTags
  title="Umzugsunternehmen Hildesheim, Aust Umzüge & Haushaltsauflösungen"
  description="Umzugsfirma Hildesheim mit über 71 Fünf-Sterne-Bewertungen. Festpreisgarantie, kostenlose Besichtigung und persönliche Beratung. Jetzt anfragen."
  keywords="Umzugsunternehmen Hildesheim, Umzugsfirma Hildesheim, Privatumzug, Firmenumzug, Seniorenumzug, Haushaltsauflösung, Möbelmontage"
  canonical="https://www.aust-umzuege.de/"
  ogType="website"
/>

<StructuredData schema={businessInfo} />
<StructuredData schema={website} />
<StructuredData schema={breadcrumbs} />

<main>
  <Hero />
  <ServiceBoxes />
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
