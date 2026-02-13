<script lang="ts">
  import Hero from "$lib/components/Hero.svelte";
  import ServiceBoxes from "$lib/components/ServiceBoxes.svelte";
  // import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
</script>

<svelte:head>
  <title>Aust Umzüge | Ihr Partner für Umzüge in Hildesheim und Umgebung</title>
  <meta
    name="description"
    content="Professionelle Umzüge, Haushaltsauflösungen und Montagen in Hildesheim und Umgebung. Unverbindlich anfragen und kostenloses Angebot erhalten."
  />
</svelte:head>

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
