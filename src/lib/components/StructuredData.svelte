<script lang="ts">
	/**
	 * Reusable Structured Data Component
	 * Renders JSON-LD schema.org structured data for SEO
	 */

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		schema: any; // Schema.org object(s) - can be single object or array
	}

	let { schema }: Props = $props();

	// One JSON-LD string per schema — arrays render every entry instead of
	// silently dropping all but the first.
	const schemaJsons = $derived(
		(Array.isArray(schema) ? schema : [schema]).map((s) =>
			JSON.stringify({ '@context': 'https://schema.org', ...s }, null, 2)
		)
	);
</script>

<svelte:head>
	{#each schemaJsons as schemaJson (schemaJson)}
		{@html `<script type="application/ld+json">${schemaJson}</script>`}
	{/each}
</svelte:head>
