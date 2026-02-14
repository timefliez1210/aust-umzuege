<script lang="ts">
	interface Props {
		text: string;
		href: string;
		ariaLabel: string;
		showArrow?: boolean;
	}

	let { text, href, ariaLabel, showArrow = true }: Props = $props();
</script>

<a {href} class="cta-button" aria-label={ariaLabel}>
	{text}
	{#if showArrow}
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<line x1="5" y1="12" x2="19" y2="12"></line>
			<polyline points="12 5 19 12 12 19"></polyline>
		</svg>
	{/if}
</a>

<style>
	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4) var(--space-8);
		background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
		color: var(--color-text);
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		text-decoration: none;
		border-radius: var(--radius-md);
		transition:
			transform var(--transition-fast),
			box-shadow var(--transition-fast);
		box-shadow: 0 4px 14px rgba(230, 81, 0, 0.35);
	}

	.cta-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 6px 20px rgba(230, 81, 0, 0.45);
		color: var(--color-text);
	}

	.cta-button svg {
		transition: transform var(--transition-fast);
	}

	.cta-button:hover svg {
		transform: translateX(4px);
	}
</style>
