<script lang="ts">
  import "../styles/global.css";
  import InfoBar from "$lib/components/InfoBar.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import ContactCTA from "$lib/components/ContactCTA.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<InfoBar />
<Navbar />

{@render children()}

<ContactCTA />
<Footer />
