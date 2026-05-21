<script lang="ts">
  import Hero from "$lib/components/HeroV2.svelte";
  import TrustSignals from "$lib/components/TrustSignals.svelte";
  import ReviewsSection from "$lib/components/ReviewsSection.svelte";
  import AboutSection from "$lib/components/AboutSection.svelte";
  import ServicesCarousel from "$lib/components/ServicesCarousel.svelte";
  import RatgeberTeaser from "$lib/components/RatgeberTeaser.svelte";
  import ReadyCloser from "$lib/components/contact/ReadyCloser.svelte";
  import MetaTags from "$lib/components/MetaTags.svelte";
  import StructuredData from "$lib/components/StructuredData.svelte";
  import { businessInfo, website, createBreadcrumbs } from "$lib/data/structuredData";

  const breadcrumbs = createBreadcrumbs([
    { name: "Home", url: "https://www.aust-umzuege.de/" }
  ]);
</script>

<MetaTags
  title="Umzugsunternehmen Hildesheim · Festpreis & 71× ★★★★★ | Aust"
  description="Umzug Hildesheim zum Festpreis vom Inhaber Alex Aust. 71× ★★★★★ auf Google, kostenlose Vor-Ort-Besichtigung, verbindliches Angebot in 48 h. ☎ 05121 755 83 79 · Mo–Fr 8–18 Uhr."
  keywords="Umzugsunternehmen Hildesheim, Umzugsfirma Hildesheim, Umzug Hildesheim, Aust Umzüge"
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
  <ReadyCloser />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
  }
</style>
