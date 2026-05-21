<script lang="ts">
	import { Phone } from 'lucide-svelte';
	import { hours } from '$lib/utils/officeHours.svelte';
	import { openContactFlow } from '$lib/stores/contactFlow.svelte';
</script>

<div class="launcher">
	<button
		type="button"
		class="launcher__main"
		onclick={() => openContactFlow('picker')}
		aria-label="Kontakt aufnehmen"
	>
		<span class="launcher__icon" aria-hidden="true">
			<Phone size={18} strokeWidth={2.25} />
		</span>
		<span class="launcher__text">
			Kontakt aufnehmen
			<small>
				{#if hours.open}
					Geöffnet · sofort Antwort
				{:else}
					Geschlossen · {hours.reopens}
				{/if}
			</small>
		</span>
	</button>
</div>

<style>
	.launcher {
		position: fixed;
		right: 24px;
		bottom: 24px;
		z-index: 40;
	}
	.launcher__main {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 14px 22px 14px 16px;
		background: var(--orange-bright);
		color: #fff;
		border: none;
		border-radius: 999px;
		font: inherit;
		font-weight: 700;
		font-size: 15px;
		cursor: pointer;
		box-shadow: 0 18px 40px -10px rgba(255, 107, 0, 0.55), 0 4px 12px rgba(0, 0, 0, 0.18);
		transition: background 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.launcher__main:hover { background: #e85f00; transform: translateY(-2px); }
	.launcher__main:focus-visible {
		outline: 3px solid #fff;
		outline-offset: 2px;
	}

	.launcher__icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.22);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		animation: bell 4s ease-in-out infinite;
	}
	.launcher__text {
		display: flex;
		flex-direction: column;
		text-align: left;
		line-height: 1.2;
	}
	.launcher__text small {
		font-weight: 500;
		opacity: 0.88;
		font-size: 11px;
		margin-top: 2px;
	}

	@keyframes bell {
		0%, 92%, 100% { transform: rotate(0); }
		94% { transform: rotate(-12deg); }
		96% { transform: rotate(10deg); }
		98% { transform: rotate(-6deg); }
	}

	@media (max-width: 600px) {
		.launcher { right: 14px; bottom: 14px; }
		.launcher__main { padding: 12px 18px 12px 14px; font-size: 14px; }
		.launcher__icon { width: 30px; height: 30px; }
	}
	@media (max-width: 420px) {
		.launcher__text small { display: none; }
	}
	@media (prefers-reduced-motion: reduce) {
		.launcher__icon { animation: none; }
		.launcher__main { transition: none; }
		.launcher__main:hover { transform: none; }
	}
</style>
