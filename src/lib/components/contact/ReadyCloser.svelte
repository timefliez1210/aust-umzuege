<script lang="ts">
	import ContactFlowCard from './ContactFlowCard.svelte';
	import { openContactFlow } from '$lib/stores/contactFlow.svelte';

	interface Props {
		title?: string;
		lede?: string;
		eyebrow?: string;
	}
	let {
		title = 'Reden wir 5 Minuten. Den Rest erledigen wir.',
		lede = 'Ob Anruf, Rückruf, WhatsApp oder Nachricht — wir antworten persönlich, am gleichen Werktag. Kostenlos, unverbindlich, kein Callcenter.',
		eyebrow = 'Bereit?',
	}: Props = $props();
</script>

<section class="ready">
	<div class="ready__inner">
		<div class="ready__copy">
			<span class="ready__eyebrow">{eyebrow}</span>
			<h2 class="ready__title">{title}</h2>
			<p class="ready__lede">{lede}</p>
			<div class="ready__person">
				<div class="ready__person-meta">
					<span class="ready__person-hello">Persönlich erreichbar</span>
					<span class="ready__person-name">Alex Aust</span>
					<span class="ready__person-role">Inhaber, Aust Umzüge Hildesheim</span>
				</div>
			</div>
		</div>
		<div class="ready__card">
			<ContactFlowCard onPick={(s) => openContactFlow(s)} showStep={false} showFoot={true} />
		</div>
	</div>
</section>

<style>
	.ready {
		background: #1e3a5f;
		color: #fff;
		position: relative;
		overflow: hidden;
	}
	.ready::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(700px 500px at 88% -10%, rgba(255, 107, 0, 0.22), transparent 60%),
			radial-gradient(500px 300px at 0% 100%, rgba(255, 107, 0, 0.10), transparent 60%);
		pointer-events: none;
	}
	.ready__inner {
		position: relative;
		z-index: 1;
		max-width: 1280px;
		margin: 0 auto;
		padding: 88px 32px;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
		gap: 56px;
		align-items: center;
	}
	.ready__copy { min-width: 0; }
	.ready__eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--orange-bright);
		margin-bottom: 18px;
	}
	.ready__eyebrow::before {
		content: '';
		width: 28px;
		height: 1px;
		background: var(--orange-bright);
	}
	.ready__title {
		font-size: clamp(28px, 3.6vw, 48px);
		line-height: 1.05;
		letter-spacing: -0.022em;
		font-weight: 700;
		margin: 0 0 16px;
		text-wrap: balance;
	}
	.ready__lede {
		font-size: 17px;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.72);
		margin: 0 0 30px;
		max-width: 48ch;
	}
	.ready__person {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-top: 22px;
		border-top: 1px solid rgba(255, 255, 255, 0.14);
	}
	.ready__person-meta { display: flex; flex-direction: column; gap: 3px; }
	.ready__person-hello {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.5);
	}
	.ready__person-name { font-size: 15px; font-weight: 600; }
	.ready__person-role { font-size: 12px; color: rgba(255, 255, 255, 0.6); }
	.ready__card { min-width: 0; }

	@media (max-width: 1023px) {
		.ready__inner {
			grid-template-columns: 1fr;
			padding: 56px 20px;
			gap: 32px;
		}
		.ready__lede { max-width: none; }
	}
</style>
