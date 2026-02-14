<script lang="ts">
	interface Props {
		heading: string;
		description: string;
		buttonText: string;
		buttonHref: string;
	}

	let { heading, description, buttonText, buttonHref }: Props = $props();
</script>

<section class="cta-section">
	<h2 class="cta-section__heading">{heading}</h2>
	<p class="cta-section__text">{description}</p>
	<a href={buttonHref} class="cta-section__button">
		{buttonText}
	</a>
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

	.cta-section__button {
		display: inline-block;
		background-color: var(--color-nav-accent);
		color: #fff;
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius-md);
		font-weight: 700;
		text-decoration: none;
		transition:
			background-color 0.2s,
			transform 0.2s;
	}

	.cta-section__button:hover {
		background-color: #d84a00;
		transform: translateY(-2px);
	}
</style>
