<script lang="ts">
  import "../styles/global.css";
  import { page } from "$app/stores";
  import InfoBar from "$lib/components/InfoBar.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import ContactCTA from "$lib/components/ContactCTA.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import CookieBanner from "$lib/components/CookieBanner.svelte";
  import ConsentManager from "$lib/components/ConsentManager.svelte";
  import WhatsAppButton from "$lib/components/WhatsAppButton.svelte";
  import CallButton from "$lib/components/CallButton.svelte";

  let { children } = $props();
</script>

<svelte:head>
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  {#if !$page.url.pathname.startsWith('/admin') && !$page.url.pathname.startsWith('/worker')}
    <!-- Google Analytics (deferred until after user interaction or idle) -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-9QT7TKENKZ');
      (function(){
        var loaded = false;
        function load(){
          if (loaded) return;
          loaded = true;
          var s = document.createElement('script');
          s.src = 'https://www.googletagmanager.com/gtag/js?id=G-9QT7TKENKZ';
          s.async = true;
          document.head.appendChild(s);
        }
        var events = ['scroll','click','touchstart','keydown'];
        events.forEach(function(e){document.addEventListener(e, load, {once:true,passive:true});});
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(function(){setTimeout(load, 3000);}, {timeout: 8000});
        } else {
          setTimeout(load, 8000);
        }
      })();
    </script>
  {/if}
</svelte:head>

{#if $page.url.pathname.startsWith('/admin') || $page.url.pathname.startsWith('/worker')}
  {@render children()}
{:else}

  <!-- Skip link for accessibility -->
  <a href="#main-content" class="skip-link">Zum Inhalt springen</a>

  <InfoBar />
  <Navbar />

  <div id="main-content">
    {@render children()}
  </div>

  <ContactCTA />
  <Footer />
  <WhatsAppButton />
  <CallButton />
  <CookieBanner />
  <ConsentManager />
{/if}

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
