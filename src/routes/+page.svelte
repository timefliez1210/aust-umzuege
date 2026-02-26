<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ServiceBoxes from "$lib/components/ServiceBoxes.svelte";
  import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
  import RatgeberTeaser from "$lib/components/RatgeberTeaser.svelte";
  import MetaTags from "$lib/components/MetaTags.svelte";
  import StructuredData from "$lib/components/StructuredData.svelte";
  import { businessInfo } from "$lib/data/structuredData";
</script>

<MetaTags
  title="Umzugsunternehmen Hildesheim | Aust Umzüge"
  description="Ihr Umzugsunternehmen in Hildesheim: Privatumzug, Firmenumzug, Seniorenumzug, Haushaltsauflösungen und Montagen. Festpreisgarantie und kostenlose Beratung."
  keywords="Umzugsunternehmen Hildesheim, Umzugsfirma Hildesheim, Privatumzug, Firmenumzug, Seniorenumzug, Haushaltsauflösung, Möbelmontage"
  canonical="https://www.aust-umzuege.de/"
  ogType="website"
/>

<StructuredData schema={businessInfo} />

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
