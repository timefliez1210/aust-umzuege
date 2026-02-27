<script lang="ts">
	import { onMount } from 'svelte';

	const WHATSAPP_NUMBER = '4917670745281';
	const WHATSAPP_URL = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;

	let visible = $state(false);

	onMount(() => {
		const timer = setTimeout(() => { visible = true; }, 1500);
		return () => clearTimeout(timer);
	});
</script>

<a
	href={WHATSAPP_URL}
	target="_blank"
	rel="noopener noreferrer"
	class="wa-fab"
	class:wa-fab--visible={visible}
	aria-label="Aust Umzüge über WhatsApp kontaktieren"
	title="Jetzt per WhatsApp schreiben"
>
	<span class="wa-fab__pulse"></span>
	<svg class="wa-fab__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
	</svg>
	<span class="wa-fab__label">WhatsApp</span>
</a>

<style>
	.wa-fab {
		position: fixed;
		bottom: 1.75rem;
		right: 1.75rem;
		z-index: 9990;
		display: flex;
		align-items: center;
		gap: 0;
		height: 56px;
		min-width: 56px;
		width: auto;
		padding: 0;
		border-radius: 28px;
		background: #25d366;
		color: #fff;
		text-decoration: none;
		box-shadow:
			0 4px 14px rgba(37, 211, 102, 0.4),
			0 2px 6px rgba(0, 0, 0, 0.12);
		cursor: pointer;
		transform: translateY(100px);
		opacity: 0;
		transition:
			transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
			opacity 0.4s ease,
			box-shadow 0.25s ease,
			gap 0.3s ease,
			padding 0.3s ease;
	}

	.wa-fab--visible {
		transform: translateY(0);
		opacity: 1;
	}

	.wa-fab:hover {
		gap: 0.25rem;
		padding: 0 1rem 0 0;
		box-shadow:
			0 8px 28px rgba(37, 211, 102, 0.5),
			0 4px 10px rgba(0, 0, 0, 0.15);
	}

	.wa-fab:active {
		transform: translateY(0) scale(0.95);
		box-shadow:
			0 2px 8px rgba(37, 211, 102, 0.35),
			0 1px 3px rgba(0, 0, 0, 0.1);
	}

	/* Icon */
	.wa-fab__icon {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		margin: 14px;
		color: #fff;
	}

	/* Text label — collapsed by default, expands on hover via max-width */
	.wa-fab__label {
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		white-space: nowrap;
		max-width: 0;
		overflow: hidden;
		opacity: 0;
		transition:
			max-width 0.3s ease,
			opacity 0.25s ease;
	}

	.wa-fab:hover .wa-fab__label {
		max-width: 120px;
		opacity: 1;
	}

	/* Pulse ring */
	.wa-fab__pulse {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 2px solid rgba(37, 211, 102, 0.5);
		animation: wa-ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
		pointer-events: none;
	}

	.wa-fab:hover .wa-fab__pulse {
		animation: none;
		opacity: 0;
	}

	@keyframes wa-ping {
		0% {
			transform: scale(1);
			opacity: 0.6;
		}
		50% {
			transform: scale(1.25);
			opacity: 0;
		}
		100% {
			transform: scale(1.25);
			opacity: 0;
		}
	}

	/* Reduced motion: disable all animations */
	@media (prefers-reduced-motion: reduce) {
		.wa-fab {
			transition: none;
			transform: none;
			opacity: 1;
		}

		.wa-fab__pulse {
			animation: none;
			display: none;
		}

		.wa-fab__label {
			transition: none;
		}

		.wa-fab:active {
			transform: none;
		}
	}

	/* Mobile */
	@media (max-width: 767px) {
		.wa-fab {
			bottom: 1.25rem;
			right: 1.25rem;
			height: 52px;
			min-width: 52px;
			border-radius: 26px;
		}

		.wa-fab__icon {
			width: 26px;
			height: 26px;
			margin: 13px;
		}

		.wa-fab:hover {
			gap: 0;
			padding: 0;
		}

		.wa-fab:hover .wa-fab__label {
			max-width: 0;
			opacity: 0;
		}
	}
</style>
