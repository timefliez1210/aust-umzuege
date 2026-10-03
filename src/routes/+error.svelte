<script lang="ts">
	/**
	 * Root error page — only reached by URLs that match no route at all.
	 *
	 * Deliberately imports nothing: SvelteKit loads the root error component on every
	 * page, so any stylesheet imported here (global.css, the site navbar) would leak
	 * into the console. Errors *inside* the marketing site use `(site)/+error.svelte`,
	 * which has the full site chrome.
	 */
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Seite nicht gefunden | Aust Umzüge</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<section class="error-page">
	<p class="code">{$page.status}</p>
	<h1>Wir haben hier leider keine Seite gefunden</h1>
	<p class="hint">Die Seite existiert nicht mehr oder die Adresse wurde falsch eingegeben.</p>
	<div class="actions">
		<a class="primary" href="/">Zur Startseite</a>
		<a href="/kostenloses-angebot">Kostenloses Angebot</a>
	</div>
</section>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		min-height: 100vh;
		margin: 0;
		padding: 2rem;
		text-align: center;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
		background: #f7f7f5;
		color: #111;
	}

	.code {
		margin: 0;
		font-size: 5rem;
		font-weight: 700;
		line-height: 1;
		color: #1e3a5f;
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.hint {
		margin: 0 0 1.25rem;
		color: #555;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}

	.actions a {
		padding: 0.75rem 1.25rem;
		border: 1px solid #1e3a5f;
		border-radius: 6px;
		color: #1e3a5f;
		font-weight: 600;
		text-decoration: none;
	}

	.actions a.primary {
		background: #ff6b00;
		border-color: #ff6b00;
		color: #fff;
	}
</style>
