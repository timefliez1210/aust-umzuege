<script lang="ts">
	import { Phone, ArrowRight } from 'lucide-svelte';
	import { openContactFlow } from '$lib/stores/contactFlow.svelte';

	interface Props {
		variant?: 'default' | 'primary';
		title: string;
		sub: string;
		buttonLabel?: string;
	}
	let {
		variant = 'default',
		title,
		sub,
		buttonLabel = 'Kontakt aufnehmen',
	}: Props = $props();
</script>

<button
	type="button"
	class="acta"
	class:acta--primary={variant === 'primary'}
	onclick={() => openContactFlow('picker')}
>
	<span class="acta__icon" aria-hidden="true">
		<Phone size={variant === 'primary' ? 18 : 20} strokeWidth={2.25} />
	</span>
	<span class="acta__text">
		<span class="acta__title">{title}</span>
		<span class="acta__sub">{sub}</span>
	</span>
	<span class="acta__btn">
		{buttonLabel}
		<ArrowRight size={16} strokeWidth={2.5} />
	</span>
</button>

<style>
	.acta {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 18px 22px;
		border: 1.5px dashed var(--line-strong);
		border-radius: 16px;
		background: #fff;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color 180ms ease, background 180ms ease;
	}
	.acta:hover {
		border-color: var(--orange-bright);
		border-style: solid;
		background: var(--orange-soft);
	}
	.acta:focus-visible {
		outline: 3px solid var(--orange-bright);
		outline-offset: 2px;
	}
	.acta__icon {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--orange-soft);
		color: var(--orange-bright);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 180ms ease, color 180ms ease;
	}
	.acta:hover .acta__icon { background: var(--orange-bright); color: #fff; }
	.acta__text { flex: 1; min-width: 0; }
	.acta__title { font-size: 15px; font-weight: 600; color: #1e3a5f; display: block; margin-bottom: 1px; }
	.acta__sub { font-size: 13px; color: var(--muted-on-light); }
	.acta__btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #1e3a5f;
		color: #fff;
		padding: 11px 18px;
		border-radius: 10px;
		font-weight: 600;
		font-size: 14px;
		white-space: nowrap;
		transition: background 150ms ease, transform 150ms ease;
	}
	.acta:hover .acta__btn { background: var(--orange-bright); transform: translateY(-1px); }

	/* Primary pill (hero only) */
	.acta--primary {
		border: 0;
		background: #fff;
		box-shadow: 0 12px 40px -16px rgba(15, 31, 51, 0.18);
		padding: 8px 8px 8px 22px;
		border-radius: 999px;
	}
	.acta--primary:hover { background: #fff; }
	.acta--primary .acta__btn {
		background: var(--orange-bright);
		padding: 14px 22px;
		border-radius: 999px;
		font-size: 15px;
	}
	.acta--primary .acta__btn:hover { background: #e85f00; }
	.acta--primary .acta__icon {
		background: var(--orange-bright);
		color: #fff;
		width: 36px;
		height: 36px;
	}

	@media (max-width: 720px) {
		.acta {
			flex-direction: column;
			align-items: stretch;
			gap: 14px;
		}
		.acta--primary { border-radius: 16px; padding: 16px; }
		.acta__btn { width: 100%; justify-content: center; }
	}
	@media (prefers-reduced-motion: reduce) {
		.acta, .acta__icon, .acta__btn { transition: none; }
		.acta:hover .acta__btn { transform: none; }
	}
</style>
