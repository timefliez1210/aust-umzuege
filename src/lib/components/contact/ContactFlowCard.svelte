<script lang="ts">
	import { Phone, RotateCcw, MessageCircle, Mail, FileText, ArrowRight } from 'lucide-svelte';
	import { hours } from '$lib/utils/officeHours.svelte';
	import StatusPill from './StatusPill.svelte';
	import { PHONE_HREF, PHONE_SHORT, WHATSAPP_HREF, KOSTENLOSES_ANGEBOT_HREF } from './constants';

	interface Props {
		onPick?: (step: 'callback' | 'message') => void;
		showFoot?: boolean;
		showHeader?: boolean;
		showStep?: boolean;
	}
	let {
		onPick = () => {},
		showFoot = true,
		showHeader = true,
		showStep = true,
	}: Props = $props();

	const isClosed = $derived(!hours.open);
</script>

<div class="flow">
	{#if showHeader}
		<div class="flow__hd">
			{#if showStep}<span class="flow__step">Schritt 1 von 2</span>{/if}
			<StatusPill />
		</div>
		<h3 class="flow__title">Wie können wir Sie am besten erreichen?</h3>
		<p class="flow__sub">
			Wählen Sie eine Option — wir antworten persönlich. Kostenlos, unverbindlich, kein Callcenter.
		</p>
	{/if}

	<div class="flow-list">
		{#if !isClosed}
			<a href={PHONE_HREF} class="flow-btn flow-btn--primary flow-btn--call">
				<div class="flow-btn__icon"><Phone size={22} strokeWidth={2} /></div>
				<div class="flow-btn__body">
					<div class="flow-btn__title">
						Jetzt anrufen
						<span class="flow-btn__badge">Schnellste Antwort</span>
					</div>
					<span class="flow-btn__num">{PHONE_SHORT}</span>
				</div>
				<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
			</a>
		{:else}
			<button type="button" class="flow-btn flow-btn--primary" onclick={() => onPick('callback')}>
				<div class="flow-btn__icon"><RotateCcw size={22} strokeWidth={2} /></div>
				<div class="flow-btn__body">
					<div class="flow-btn__title">
						Rückruf anfordern
						<span class="flow-btn__badge">Empfohlen</span>
					</div>
					<span class="flow-btn__sub">Wir rufen Sie {hours.reopens ?? 'ab 09:00 Uhr'} zurück</span>
				</div>
				<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
			</button>
		{/if}

		<div class="flow__divider"><span>oder</span></div>

		{#if !isClosed}
			<button type="button" class="flow-btn" onclick={() => onPick('callback')}>
				<div class="flow-btn__icon"><RotateCcw size={22} strokeWidth={2} /></div>
				<div class="flow-btn__body">
					<div class="flow-btn__title">Rückruf in 30 Min</div>
					<div class="flow-btn__sub">Wir melden uns telefonisch zurück</div>
				</div>
				<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
			</button>
		{/if}

		<a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" class="flow-btn">
			<div class="flow-btn__icon flow-btn__icon--wa"><MessageCircle size={22} strokeWidth={2} /></div>
			<div class="flow-btn__body">
				<div class="flow-btn__title">WhatsApp</div>
				<div class="flow-btn__sub">Antwort meist in wenigen Minuten</div>
			</div>
			<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
		</a>

		<button type="button" class="flow-btn" onclick={() => onPick('message')}>
			<div class="flow-btn__icon"><Mail size={22} strokeWidth={2} /></div>
			<div class="flow-btn__body">
				<div class="flow-btn__title">Nachricht schreiben</div>
				<div class="flow-btn__sub">Antwort am gleichen Werktag</div>
			</div>
			<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
		</button>

		<a href={KOSTENLOSES_ANGEBOT_HREF} class="flow-btn">
			<div class="flow-btn__icon"><FileText size={22} strokeWidth={2} /></div>
			<div class="flow-btn__body">
				<div class="flow-btn__title">Kostenloses Angebot</div>
				<div class="flow-btn__sub">Mit Foto-Upload — verbindliches Angebot in 48 h</div>
			</div>
			<ArrowRight size={20} strokeWidth={2.5} class="flow-btn__arrow" />
		</a>
	</div>

	{#if isClosed}
		<div class="flow__closed">
			<RotateCcw size={18} strokeWidth={2} />
			<div>
				<strong>Außerhalb der Geschäftszeiten</strong>
				Rufen Sie uns trotzdem an — oder bitten Sie um Rückruf. Wir melden uns {hours.reopens}.
			</div>
		</div>
	{/if}

	{#if showFoot}
		<div class="flow__foot">
			<span><strong>Mo–Fr 09–19 Uhr</strong> · {PHONE_SHORT}</span>
			<span>Kaiserstr. 32 · 31134 Hildesheim</span>
		</div>
	{/if}
</div>

<style>
	.flow {
		background: #fff;
		color: #1a1f2e;
		border-radius: 22px;
		padding: 28px;
		box-shadow: 0 30px 60px -20px rgba(0, 0, 0, 0.18);
	}
	.flow__hd {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 4px;
	}
	.flow__step {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted-on-light);
	}
	.flow__title {
		font-size: 22px;
		font-weight: 700;
		color: #1e3a5f;
		letter-spacing: -0.015em;
		margin: 8px 0 4px;
	}
	.flow__sub {
		font-size: 14px;
		color: var(--muted-on-light);
		margin: 0 0 20px;
		line-height: 1.5;
	}

	.flow-list { display: flex; flex-direction: column; gap: 8px; }

	.flow-btn {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto;
		gap: 14px;
		align-items: center;
		padding: 14px 16px;
		border: 1.5px solid var(--line);
		border-radius: 10px;
		background: #fff;
		text-align: left;
		width: 100%;
		font: inherit;
		cursor: pointer;
		text-decoration: none;
		color: inherit;
		transition: border-color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease;
	}
	.flow-btn:hover {
		border-color: #1e3a5f;
		background: #fbfcfe;
		transform: translateX(2px);
	}
	.flow-btn:focus-visible {
		outline: 3px solid var(--orange-bright);
		outline-offset: 2px;
	}
	.flow-btn__icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: #f1f4f9;
		color: #1e3a5f;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.flow-btn__icon--wa { background: rgba(37, 211, 102, 0.12); color: #128c4a; }
	.flow-btn__body { min-width: 0; }
	.flow-btn__title {
		font-size: 15px;
		font-weight: 600;
		color: #1e3a5f;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.flow-btn__sub {
		display: block;
		font-size: 12.5px;
		color: var(--muted-on-light);
		margin-top: 1px;
	}
	:global(.flow-btn__arrow) {
		color: var(--muted-on-light);
		transition: transform 160ms ease, color 160ms ease;
	}
	.flow-btn:hover :global(.flow-btn__arrow) {
		transform: translateX(3px);
		color: var(--orange-bright);
	}
	.flow-btn__badge {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 2px 7px;
		border-radius: 4px;
		background: var(--orange-soft);
		color: var(--orange-bright);
		font-weight: 700;
	}

	.flow-btn--primary {
		background: var(--orange-bright);
		border-color: var(--orange-bright);
		color: #fff;
		padding: 18px 20px;
	}
	.flow-btn--primary:hover {
		background: #e85f00;
		border-color: #e85f00;
		transform: translateY(-2px);
		box-shadow: 0 12px 30px -10px rgba(255, 107, 0, 0.5);
	}
	.flow-btn--primary .flow-btn__icon {
		background: rgba(255, 255, 255, 0.18);
		color: #fff;
	}
	.flow-btn--primary .flow-btn__title { color: #fff; font-size: 18px; }
	.flow-btn--primary .flow-btn__sub { color: rgba(255, 255, 255, 0.85); font-size: 13.5px; }
	.flow-btn--primary :global(.flow-btn__arrow) { color: rgba(255, 255, 255, 0.9); }
	.flow-btn--primary .flow-btn__badge { background: rgba(0, 0, 0, 0.18); color: #fff; }
	.flow-btn--call .flow-btn__num {
		display: block;
		font-weight: 700;
		font-size: 22px;
		letter-spacing: -0.015em;
		margin-top: 4px;
		color: #fff;
	}

	.flow__divider {
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted-on-light);
		margin: 14px 0;
	}
	.flow__divider::before, .flow__divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}

	.flow__foot {
		margin-top: 20px;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		font-size: 12.5px;
		color: var(--muted-on-light);
	}
	.flow__foot strong { color: #1a1f2e; font-weight: 600; }

	.flow__closed {
		margin-top: 14px;
		padding: 11px 14px;
		border-radius: 10px;
		background: rgba(176, 112, 0, 0.08);
		color: var(--amber-status);
		font-size: 13px;
		line-height: 1.45;
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}
	.flow__closed strong { color: #1a1f2e; display: block; }

	@media (max-width: 540px) {
		.flow { padding: 22px 18px; border-radius: 16px; }
		.flow__title { font-size: 19px; }
	}
	@media (prefers-reduced-motion: reduce) {
		.flow-btn, .flow-btn--primary { transition: none; }
		.flow-btn:hover { transform: none; }
	}
</style>
