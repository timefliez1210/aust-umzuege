<script lang="ts">
	/**
	 * Reusable Meta Tags Component
	 * Handles title, description, keywords, canonical, and Open Graph tags
	 */

	interface Props {
		title: string;
		description: string;
		keywords?: string;
		canonical?: string;
		ogType?: "website" | "article" | "profile";
		ogImage?: string;
		noindex?: boolean;
	}

	let {
		title,
		description,
		keywords,
		canonical,
		ogType = "website",
		ogImage = "https://www.aust-umzuege.de/LogoName_transparent.webp",
		noindex = false
	}: Props = $props();
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={ogType} />
	{#if canonical}
		<meta property="og:url" content={canonical} />
	{/if}
	<meta property="og:image" content={ogImage} />
	<meta property="og:locale" content="de_DE" />
	<meta property="og:site_name" content="Aust Umzüge" />
</svelte:head>
