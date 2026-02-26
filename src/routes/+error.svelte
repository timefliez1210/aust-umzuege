<script lang="ts">
	import CTAButton from "$lib/components/CTAButton.svelte";
</script>

<svelte:head>
	<title>Seite nicht gefunden | Aust Umzüge</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<section class="error-page">
	<h1>404</h1>
	<p class="error-message">Wir haben hier leider keine Seite gefunden</p>
	<p class="error-hint">Die Seite existiert nicht mehr oder die Adresse wurde falsch eingegeben.</p>
	<CTAButton text="Zur Startseite" href="/" />
</section>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin: 0 0 0.5rem;
		line-height: 1;
	}

	.error-message {
		font-size: 1.25rem;
		color: #333;
		margin: 0 0 0.5rem;
	}

	.error-hint {
		font-size: 1rem;
		color: #666;
		margin-bottom: 2rem;
	}
</style>
