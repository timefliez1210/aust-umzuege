<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ServiceBoxes from "$lib/components/ServiceBoxes.svelte";
  // import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
  import MetaTags from "$lib/components/MetaTags.svelte";
  import StructuredData from "$lib/components/StructuredData.svelte";
  import { businessInfo } from "$lib/data/structuredData";
</script>

<MetaTags
  title="Aust Umzüge | Ihr Partner für Umzüge in Hildesheim und Umgebung"
  description="Professionelle Umzüge, Haushaltsauflösungen und Montagen in Hildesheim und Umgebung. Unverbindlich anfragen und kostenloses Angebot erhalten."
  keywords="Umzüge Hildesheim, Umzugsfirma Hildesheim, Privatumzug, Firmenumzug, Haushaltsauflösung, Möbelmontage"
  canonical="https://www.aust-umzuege.de/"
  ogType="website"
/>

<StructuredData schema={businessInfo} />

<main>
  <Hero />
  <ServiceBoxes />
  <!-- <ReviewsSection /> -->
  <AboutSection />
  <ServicesCarousel />

  <!-- Additional sections will be added here -->
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }
</style>
