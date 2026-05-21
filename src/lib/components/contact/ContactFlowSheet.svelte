<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { X, Check, ArrowRight } from 'lucide-svelte';
	import { contactFlow, closeContactFlow, openContactFlow } from '$lib/stores/contactFlow.svelte';
	import { hours } from '$lib/utils/officeHours.svelte';
	import { API_BASE } from '$lib/utils/api.svelte';
	import { PHONE_HREF, PHONE_DISPLAY } from './constants';
	import ContactFlowCard from './ContactFlowCard.svelte';

	let open = $derived(contactFlow.mode !== null);
	let mode = $derived(contactFlow.mode);

	let firstFocus: HTMLElement | undefined = $state();
	let dialogEl: HTMLDivElement | undefined = $state();

	type Step = 'form' | 'success';
	let step = $state<Step>('form');

	let name = $state('');
	let phone = $state('');
	let email = $state('');
	let message = $state('');
	let when = $state<'gleich' | 'vormittag' | 'nachmittag'>('gleich');
	let consent = $state(false);
	let company = $state(''); // honeypot
	let submitting = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		// Reset when mode changes
		if (contactFlow.mode) {
			step = 'form';
			error = null;
			// focus first field after tick
			tick().then(() => firstFocus?.focus());
		}
	});

	onMount(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && contactFlow.mode) {
				e.preventDefault();
				closeContactFlow();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$effect(() => {
		// Lock body scroll while open
		if (typeof document === 'undefined') return;
		if (open) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => { document.body.style.overflow = prev; };
		}
	});

	const title = $derived(
		mode === 'picker' ? 'Kontakt aufnehmen'
		: mode === 'callback' ? 'Rückruf anfordern'
		: mode === 'message' ? 'Nachricht schreiben'
		: '',
	);

	const sub = $derived(
		mode === 'picker' ? 'Wählen Sie, wie Sie uns am liebsten erreichen.'
		: mode === 'callback'
			? (hours.open
				? 'Wir rufen Sie innerhalb von 30 Minuten zurück.'
				: `Wir rufen Sie ${hours.reopens ?? 'morgen ab 09:00 Uhr'} zurück.`)
		: mode === 'message' ? 'Antwort am gleichen Werktag — versprochen.'
		: '',
	);

	function handlePick(m: 'callback' | 'message') {
		openContactFlow(m);
	}

	function onBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) closeContactFlow();
	}

	async function submitCallback() {
		const res = await fetch(`${API_BASE}/api/v1/flash-contact`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), phone: phone.trim(), time_preference: when }),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		try { sessionStorage.setItem('aust:contactflow:submitted-callback', '1'); } catch { /* noop */ }
		try { window.dispatchEvent(new CustomEvent('aust:callback:submitted')); } catch { /* noop */ }
	}

	async function submitMessage() {
		const body = new URLSearchParams();
		// send-mail.php only routes known form-names; 'kontakt' is the
		// simple-message branch (name + email + nachricht). 'message'
		// would fall through to the 400 "Unknown form" handler.
		body.set('form-name', 'kontakt');
		body.set('name', name.trim());
		body.set('email', email.trim());
		if (phone.trim()) body.set('phone', phone.trim());
		body.set('nachricht', message.trim());
		body.set('datenschutz-akzeptiert', '1');
		const res = await fetch('/send-mail.php', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		try { sessionStorage.setItem('aust:contactflow:submitted-message', '1'); } catch { /* noop */ }
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		if (submitting) return;
		error = null;
		if (company) { step = 'success'; return; } // honeypot
		if (!consent) { error = 'Bitte stimmen Sie der Datenschutzerklärung zu.'; return; }
		submitting = true;
		try {
			if (mode === 'callback') await submitCallback();
			else if (mode === 'message') await submitMessage();
			step = 'success';
		} catch {
			error = 'Senden fehlgeschlagen. Bitte später erneut versuchen oder direkt anrufen.';
		} finally {
			submitting = false;
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={onBackdrop}>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			bind:this={dialogEl}
		>
			<button class="sheet__x" type="button" onclick={closeContactFlow} aria-label="Schließen">
				<X size={18} strokeWidth={2.4} />
			</button>

			{#if mode === 'picker'}
				<ContactFlowCard onPick={handlePick} showStep={false} showFoot={true} />
			{:else if step === 'form'}
				<div class="sheet__hd">
					<h2 class="sheet__title">{title}</h2>
					<p class="sheet__sub">{sub}</p>
				</div>

				<form class="sheet__form" onsubmit={onSubmit} novalidate>
					<label class="field">
						<span class="field__lbl">Ihr Name</span>
						<input
							bind:this={firstFocus}
							type="text"
							required
							bind:value={name}
							placeholder="Max Mustermann"
							autocomplete="name"
							maxlength="120"
						/>
					</label>

					{#if mode === 'callback'}
						<label class="field">
							<span class="field__lbl">Telefonnummer</span>
							<input
								type="tel"
								required
								inputmode="tel"
								bind:value={phone}
								placeholder="0151 23 45 67 89"
								autocomplete="tel"
								maxlength="40"
							/>
						</label>
						<div class="field">
							<span class="field__lbl">Wann sollen wir anrufen?</span>
							<div class="seg" role="radiogroup" aria-label="Anrufzeit">
								{#each [['gleich', hours.open ? 'Sofort' : 'Bei Öffnung'], ['vormittag', 'Vormittags'], ['nachmittag', 'Nachmittags']] as [k, l] (k)}
									<button
										type="button"
										class="seg__b"
										class:seg__b--on={when === k}
										onclick={() => (when = k as typeof when)}
										aria-pressed={when === k}
									>
										{l}
									</button>
								{/each}
							</div>
						</div>
					{:else if mode === 'message'}
						<label class="field">
							<span class="field__lbl">E-Mail</span>
							<input
								type="email"
								required
								bind:value={email}
								placeholder="ihre@email.de"
								autocomplete="email"
							/>
						</label>
						<label class="field">
							<span class="field__lbl">Telefon <span class="field__opt">optional</span></span>
							<input
								type="tel"
								inputmode="tel"
								bind:value={phone}
								placeholder="0151 23 45 67 89"
								autocomplete="tel"
								maxlength="40"
							/>
						</label>
						<label class="field">
							<span class="field__lbl">Ihre Nachricht</span>
							<textarea
								required
								rows={5}
								bind:value={message}
								placeholder="Worum geht's? Adresse von und nach, Datum, Zimmeranzahl…"
							></textarea>
						</label>
					{/if}

					<!-- honeypot -->
					<div class="hp" aria-hidden="true">
						<label>Firma (bitte freilassen)
							<input type="text" tabindex="-1" autocomplete="off" bind:value={company} />
						</label>
					</div>

					<label class="consent">
						<input type="checkbox" bind:checked={consent} />
						<span>
							Ich akzeptiere die
							<a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a>.
						</span>
					</label>

					{#if error}
						<p class="error" role="alert">{error}</p>
					{/if}

					<button type="submit" class="sheet__submit" disabled={submitting}>
						{submitting ? 'Sende …' : 'Absenden'}
						{#if !submitting}<ArrowRight size={18} strokeWidth={2.5} />{/if}
					</button>
				</form>
			{:else}
				<div class="success">
					<div class="success__mark"><Check size={32} strokeWidth={3} /></div>
					<h2 class="sheet__title">Danke, {name.split(' ')[0] || 'Sie'}!</h2>
					<p class="sheet__sub">
						{#if mode === 'callback'}
							{hours.open
								? 'Wir rufen Sie innerhalb der nächsten 30 Minuten zurück.'
								: `Wir rufen Sie ${hours.reopens} zurück.`}
						{:else}
							Wir haben Ihre Nachricht erhalten und melden uns am gleichen Werktag.
						{/if}
					</p>
					<button class="sheet__submit" type="button" onclick={closeContactFlow}>Verstanden</button>
					<p class="success__meta">
						Nicht warten wollen? <a href={PHONE_HREF}>{PHONE_DISPLAY} anrufen</a>
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(15, 31, 51, 0.55);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		animation: fade 200ms ease;
	}
	@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
	@media (min-width: 720px) {
		.backdrop { align-items: center; }
	}

	.sheet {
		position: relative;
		background: #fff;
		width: 100%;
		max-width: 540px;
		max-height: 90vh;
		border-radius: 24px 24px 0 0;
		padding: 32px 32px 28px;
		overflow-y: auto;
		box-shadow: 0 -20px 60px -20px rgba(0, 0, 0, 0.25);
		animation: slideup 280ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	@media (min-width: 720px) {
		.sheet { border-radius: 20px; max-height: 86vh; }
	}
	@keyframes slideup {
		from { transform: translateY(40px); opacity: 0; }
		to   { transform: translateY(0);    opacity: 1; }
	}
	@media (prefers-reduced-motion: reduce) {
		.backdrop, .sheet { animation: none; }
	}

	.sheet__x {
		position: absolute;
		top: 14px;
		right: 14px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: transparent;
		border: none;
		color: var(--muted-on-light);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: background 120ms ease, color 120ms ease;
		z-index: 1;
	}
	.sheet__x:hover { background: rgba(0, 0, 0, 0.06); color: #1a1f2e; }
	.sheet__x:focus-visible { outline: 2px solid var(--orange-bright); outline-offset: 2px; }

	.sheet__hd { margin-bottom: 22px; padding-right: 32px; }
	.sheet__title {
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.015em;
		color: #1e3a5f;
		margin: 0 0 8px;
	}
	.sheet__sub {
		font-size: 15px;
		line-height: 1.5;
		color: var(--muted-on-light);
		margin: 0;
	}

	.sheet__form { display: flex; flex-direction: column; gap: 16px; }

	.field { display: flex; flex-direction: column; gap: 6px; }
	.field__lbl {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted-on-light);
		font-weight: 600;
	}
	.field__opt {
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		color: var(--muted-on-light);
		opacity: 0.7;
	}
	.field input, .field textarea {
		width: 100%;
		font: inherit;
		padding: 12px 14px;
		border: 1.5px solid var(--line);
		border-radius: 10px;
		background: #fff;
		color: #1a1f2e;
		outline: none;
		transition: border-color 120ms ease, box-shadow 120ms ease;
	}
	.field input:focus, .field textarea:focus {
		border-color: var(--orange-bright);
		box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.12);
	}
	.field textarea { resize: vertical; min-height: 120px; }

	.seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
	.seg__b {
		padding: 12px 8px;
		border: 1.5px solid var(--line);
		border-radius: 10px;
		background: #fff;
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		color: #1a1f2e;
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease, color 120ms ease;
	}
	.seg__b:hover { border-color: #1e3a5f; }
	.seg__b--on {
		background: #1e3a5f;
		border-color: #1e3a5f;
		color: #fff;
	}

	.hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }

	.consent {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 13px;
		color: var(--muted-on-light);
		line-height: 1.45;
	}
	.consent input { margin-top: 3px; flex-shrink: 0; }
	.consent a { color: var(--orange-bright); text-decoration: underline; }

	.error { font-size: 13px; color: #dc2626; margin: 0; }

	.sheet__submit {
		margin-top: 4px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 15px 24px;
		background: var(--orange-bright);
		color: #fff;
		font: inherit;
		font-weight: 700;
		font-size: 15px;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		transition: background 150ms ease, transform 150ms ease;
	}
	.sheet__submit:hover:not(:disabled) { background: #e85f00; transform: translateY(-1px); }
	.sheet__submit:disabled { opacity: 0.6; cursor: not-allowed; }

	.success { text-align: center; padding: 12px 8px 8px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
	.success__mark {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(47, 125, 79, 0.12);
		color: var(--green-status);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
	}
	.success .sheet__title { margin-bottom: 0; }
	.success__meta { font-size: 13px; color: var(--muted-on-light); margin-top: 6px; }
	.success__meta a { color: var(--orange-bright); font-weight: 600; text-decoration: underline; }

	@media (max-width: 540px) {
		.sheet { padding: 24px 20px 22px; }
		.sheet__hd { padding-right: 36px; }
		.sheet__title { font-size: 21px; }
	}
</style>
