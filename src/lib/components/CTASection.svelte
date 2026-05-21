<script lang="ts">
	import CTAButton from "$lib/components/CTAButton.svelte";

	interface Props {
		heading: string;
		description: string;
		buttonText: string;
		/** Optional fallback link target. Ignored when openFlow is true (default). */
		buttonHref?: string;
		/** Open the site-wide contact flow on click instead of navigating. */
		openFlow?: boolean;
	}

	let {
		heading,
		description,
		buttonText,
		buttonHref,
		openFlow = true,
	}: Props = $props();
</script>

<section class="cta-section">
	<h2 class="cta-section__heading">{heading}</h2>
	<p class="cta-section__text">{description}</p>
	<CTAButton
		text={buttonText}
		href={buttonHref}
		showArrow={false}
		openFlow={openFlow}
	/>
</section>

<style>
	.cta-section {
		background: linear-gradient(135deg, var(--color-info-bar) 0%, #2d5a87 100%);
		border-radius: var(--radius-lg);
		padding: var(--space-10);
		text-align: center;
		margin-top: var(--space-12);
	}

	.cta-section__heading {
		color: #fff;
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: var(--space-3);
	}

	.cta-section__text {
		font-size: 1.125rem;
		font-weight: var(--font-medium);
		margin-bottom: var(--space-8);
		max-width: 600px;
		margin-inline: auto;
		color: #fff;
	}
</style>
