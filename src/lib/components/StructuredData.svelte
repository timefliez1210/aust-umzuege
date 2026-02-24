<script lang="ts">
	/**
	 * Reusable Structured Data Component
	 * Renders JSON-LD schema.org structured data for SEO
	 */

	interface Props {
		schema: any; // Schema.org object(s) - can be single object or array
	}

	let { schema }: Props = $props();

	// Convert schema to JSON-LD string
	const schemaJson = $derived(JSON.stringify(
		{
			"@context": "https://schema.org",
			...(Array.isArray(schema) ? schema[0] : schema)
		},
		null,
		2
	));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${schemaJson}</script>`}
</svelte:head>
