<script lang="ts">
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		const timer = setTimeout(() => { visible = true; }, 1800);
		return () => clearTimeout(timer);
	});
</script>

<a
	href="tel:+4917670745281"
	class="call-fab"
	class:call-fab--visible={visible}
	aria-label="Aust Umzüge anrufen"
	title="Jetzt anrufen"
>
	<span class="call-fab__pulse"></span>
	<svg class="call-fab__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
	</svg>
	<span class="call-fab__label">Anrufen</span>
</a>

<style>
	/* Desktop: hidden */
	.call-fab {
		display: none;
	}

	/* Mobile only */
	@media (max-width: 767px) {
		.call-fab {
			display: flex;
			position: fixed;
			bottom: 5.5rem;
			right: 1.25rem;
			z-index: 9990;
			align-items: center;
			gap: 0;
			height: 52px;
			min-width: 52px;
			padding: 0;
			border-radius: 26px;
			background: linear-gradient(135deg, #ff6b00 0%, #e65100 100%);
			color: #1e3a5f;
			text-decoration: none;
			box-shadow:
				0 4px 14px rgba(255, 107, 0, 0.45),
				0 2px 6px rgba(0, 0, 0, 0.15);
			transform: translateY(100px);
			opacity: 0;
			transition:
				transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
				opacity 0.4s ease,
				box-shadow 0.25s ease;
		}

		.call-fab--visible {
			transform: translateY(0);
			opacity: 1;
		}

		.call-fab:active {
			transform: translateY(0) scale(0.95);
			box-shadow:
				0 2px 8px rgba(255, 107, 0, 0.3),
				0 1px 3px rgba(0, 0, 0, 0.1);
		}

		.call-fab__icon {
			width: 26px;
			height: 26px;
			flex-shrink: 0;
			margin: 13px;
		}

		.call-fab__label {
			font-size: 0.9375rem;
			font-weight: 600;
			white-space: nowrap;
			max-width: 0;
			overflow: hidden;
			opacity: 0;
		}

		.call-fab__pulse {
			position: absolute;
			inset: -4px;
			border-radius: 50%;
			border: 2px solid rgba(255, 107, 0, 0.6);
			animation: call-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
			animation-delay: 0.5s;
			pointer-events: none;
		}
	}

	@keyframes call-ping {
		0%   { transform: scale(1);    opacity: 0.6; }
		50%  { transform: scale(1.25); opacity: 0; }
		100% { transform: scale(1.25); opacity: 0; }
	}

	@media (max-width: 767px) and (prefers-reduced-motion: reduce) {
		.call-fab {
			transition: none;
			transform: translateY(0);
			opacity: 1;
		}
		.call-fab__pulse {
			animation: none;
			display: none;
		}
	}
</style>
