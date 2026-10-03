<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import { apiGet, apiPost, apiPatch, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { X, Plus, Trash2, Download } from 'lucide-svelte';

	interface Props {
		inquiryId: string;
		inquiryStatus: string;
		customerName: string | null;
		/** Offer netto price in cents from the active offer, or null if no offer exists. */
		offerPriceCents: number | null;
		/** Called after the invoice has been sent successfully. */
		onSent: () => void;
		onClose: () => void;
	}

	let { inquiryId, inquiryStatus, customerName, offerPriceCents, onSent, onClose }: Props = $props();

	// ── Types ────────────────────────────────────────────────────────────────

	interface LineItem {
		description: string;
		/** Brutto in euros (user input, may be negative for Gutschrift) — converted to netto cents on submit */
		brutto_eur: string;
	}

	interface InvoiceResponse {
		id: string;
		invoice_number: string;
		invoice_type: string;
		partial_percent: number | null;
		extra_services: { description: string; price_cents: number }[];
		total_brutto_cents: number;
	}

	// ── Step machine: 'type' → 'lineitems' → 'email' ─────────────────────────

	type Step = 'type' | 'lineitems' | 'email';
	let step = $state<Step>('type');
	let busy = $state(false);

	// ── Manual amount (used when no active offer exists) ─────────────────────

	/** Brutto EUR string for manual price entry (pre-filled from offer if available). */
	function defaultManualBrutto(priceCents: number | null): string {
		return priceCents != null ? ((priceCents * 1.19) / 100).toFixed(2).replace('.', ',') : '';
	}
	// svelte-ignore state_referenced_locally -- intentional one-time seed; user edits take over afterwards
	let manualBruttoEur = $state(defaultManualBrutto(offerPriceCents));

	// ── Step 1: invoice type ──────────────────────────────────────────────────

	/** 'full' or 'partial' */
	let invoiceType = $state<'full' | 'partial'>('full');
	/** Anzahlung percent for partial invoices (1–99). */
	let partialPercent = $state(30);

	/** Offer brutto in euros (derived from offerPriceCents or manualBruttoEur). */
	const baseBruttoEur = $derived.by((): number => {
		if (offerPriceCents != null) {
			return (offerPriceCents * 1.19) / 100;
		}
		const v = parseFloat(manualBruttoEur.replace(',', '.'));
		return isNaN(v) ? 0 : v;
	});

	const anzahlungEur = $derived(Math.round(baseBruttoEur * partialPercent / 100 * 100) / 100);
	const schlussEur = $derived(Math.round((baseBruttoEur - anzahlungEur) * 100) / 100);

	// ── Step 2: line items ────────────────────────────────────────────────────

	const PRESETS: LineItem[] = [
		{ description: 'Halteverbotszone (Auszug)', brutto_eur: '59.50' },
		{ description: 'Halteverbotszone (Einzug)', brutto_eur: '59.50' },
		{ description: 'Möbelmontage', brutto_eur: '95.20' },
		{ description: 'Verpackungsservice', brutto_eur: '119.00' },
		{ description: 'Entsorgung', brutto_eur: '59.50' },
	];

	let lineItems = $state<LineItem[]>([]);

	/**
	 * Format signed netto cents back into a brutto-EUR string for the form.
	 * Uses a comma decimal separator so it round-trips through `bruttoToNettoCents`.
	 */
	function nettoCentsToBruttoStr(cents: number): string {
		const brutto = (cents * 1.19) / 100;
		return brutto.toFixed(2).replace('.', ',');
	}

	/**
	 * On open: fetch existing invoices and seed the modal state so re-editing
	 * preserves prior extras instead of wiping them via a blank PATCH.
	 */
	$effect(() => {
		let cancelled = false;
		(async () => {
			try {
				const list = await apiGet<InvoiceResponse[]>(
					`/api/v1/inquiries/${inquiryId}/invoices`
				);
				if (cancelled || !list || list.length === 0) return;

				// Pick the main editable invoice: full or partial_final (never partial_first).
				const main =
					list.find((i) => i.invoice_type === 'partial_final') ??
					list.find((i) => i.invoice_type === 'full');
				if (!main) return;

				// Reflect the stored invoice type + percent so the type step isn't misleading.
				if (main.invoice_type === 'partial_final') {
					invoiceType = 'partial';
					const pct = list.find((i) => i.invoice_type === 'partial_first')?.partial_percent
						?? main.partial_percent;
					if (pct != null) partialPercent = pct;
				} else {
					invoiceType = 'full';
				}

				// Seed line items from the stored extras.
				lineItems = main.extra_services.map((e) => ({
					description: e.description,
					brutto_eur: nettoCentsToBruttoStr(e.price_cents),
				}));
			} catch {
				// Non-fatal — modal still works in create-new mode.
			}
		})();
		return () => { cancelled = true; };
	});

	function addPreset(p: LineItem) {
		lineItems = [...lineItems, { ...p }];
	}

	function addZusatz() {
		lineItems = [...lineItems, { description: '', brutto_eur: '' }];
	}

	function addGutschrift() {
		lineItems = [...lineItems, { description: '', brutto_eur: '-' }];
	}

	function removeItem(i: number) {
		lineItems = lineItems.filter((_, idx) => idx !== i);
	}

	// ── Live totals ───────────────────────────────────────────────────────────

	/** Netto cents from a brutto-EUR string (÷ 1.19, rounded). Allows signed values. */
	function bruttoToNettoCents(eur: string): number {
		const val = parseFloat(eur.replace(',', '.'));
		if (isNaN(val) || val === 0) return 0;
		return Math.round((val / 1.19) * 100);
	}

	function formatEuro(cents: number): string {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	/** Sum of all valid line item netto cents (signed). */
	const extraNettoCents = $derived.by((): number => {
		return lineItems.reduce((sum, item) => {
			if (!item.description.trim() || !item.brutto_eur || item.brutto_eur === '-') return sum;
			return sum + bruttoToNettoCents(item.brutto_eur);
		}, 0);
	});

	/** Base netto cents (full or partial-final base). */
	const baseNettoCents = $derived(offerPriceCents != null ? offerPriceCents : bruttoToNettoCents(manualBruttoEur));

	/** Total netto for the "main" invoice (full or Schlussrechnung). */
	const totalNettoCents = $derived(baseNettoCents + extraNettoCents);
	const totalMwstCents = $derived(Math.round(totalNettoCents * 0.19));
	const totalBruttoCents = $derived(Math.round(totalNettoCents * 1.19));

	// ── Step 3: email ─────────────────────────────────────────────────────────

	let invoice: InvoiceResponse | null = $state(null);
	let emailSubject = $state('');
	let emailBody = $state('');
	let downloadingPdf = $state(false);

	async function downloadPdf() {
		if (!invoice) return;
		downloadingPdf = true;
		try {
			await apiDownload(
				`/api/v1/inquiries/${inquiryId}/invoices/${invoice.id}/pdf`,
				`Rechnung_${invoice.invoice_number}.pdf`
			);
		} catch (e) {
			showToast((e as Error).message ?? 'Download fehlgeschlagen', 'error');
		} finally {
			downloadingPdf = false;
		}
	}

	function defaultSubject(num: string) {
		return `Ihre Rechnung Nr. ${num} — Aust Umzüge & Haushaltsauflösungen`;
	}

	function defaultBody(num: string, name: string) {
		return `Sehr geehrte/r ${name},\n\nim Anhang finden Sie Ihre Rechnung Nr. ${num}.\n\nBitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen unter Angabe der Rechnungsnummer auf unser Konto.\n\nMit freundlichen Grüßen\nAust Umzüge & Haushaltsauflösungen`;
	}

	// ── Transitions ───────────────────────────────────────────────────────────

	function goToLineitems() {
		if (offerPriceCents == null) {
			const cents = bruttoToNettoCents(manualBruttoEur);
			if (cents <= 0) {
				alert('Bitte einen Rechnungsbetrag (Brutto) eingeben.');
				return;
			}
		}
		if (invoiceType === 'partial' && (partialPercent < 1 || partialPercent > 99)) {
			alert('Prozentwert muss zwischen 1 und 99 liegen.');
			return;
		}
		step = 'lineitems';
	}

	async function goToEmail() {
		busy = true;
		try {
			// 1. Mark inquiry as completed if needed
			if (!['completed', 'invoiced', 'paid'].includes(inquiryStatus)) {
				await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });
				inquiryStatus = 'completed';
			}

			// 2. Create invoice — pass manual price when no offer exists
			const createBody: Record<string, unknown> = { invoice_type: invoiceType };
			if (invoiceType === 'partial') {
				createBody.partial_percent = partialPercent;
			}
			if (offerPriceCents == null) {
				createBody.price_cents_netto = bruttoToNettoCents(manualBruttoEur);
			}
			const created = await apiPost<InvoiceResponse[]>(
				`/api/v1/inquiries/${inquiryId}/invoices`,
				createBody
			);

			// For partial: created[0] = partial_first, created[1] = partial_final
			// Extras go on the final (or the only invoice for full).
			// We send the email for the "main" invoice: partial_final or full.
			const mainInvoice = invoiceType === 'partial' ? created[1] : created[0];
			invoice = mainInvoice;

			// 3. Apply line items if any
			const validItems = lineItems
				.filter(item => item.description.trim() && item.brutto_eur && item.brutto_eur !== '-')
				.map(item => ({
					description: item.description.trim(),
					price_cents: bruttoToNettoCents(item.brutto_eur),
				}))
				.filter(item => item.price_cents !== 0);

			if (validItems.length > 0) {
				const updated = await apiPatch<InvoiceResponse>(
					`/api/v1/inquiries/${inquiryId}/invoices/${invoice.id}`,
					{ extra_services: validItems }
				);
				invoice = updated;
			}

			// 4. Seed email template
			const name = customerName ?? 'Kunde';
			emailSubject = defaultSubject(invoice.invoice_number);
			emailBody = defaultBody(invoice.invoice_number, name);

			step = 'email';
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			busy = false;
		}
	}

	async function send() {
		if (!invoice) return;
		busy = true;
		try {
			await apiPost(
				`/api/v1/inquiries/${inquiryId}/invoices/${invoice.id}/send`,
				{ subject: emailSubject, body: emailBody }
			);
			showToast('Rechnung gesendet', 'success');
			onSent();
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler beim Senden', 'error');
		} finally {
			busy = false;
		}
	}

	// ── Step title ────────────────────────────────────────────────────────────

	const stepTitle = $derived.by((): string => {
		if (step === 'type') return 'Rechnungstyp wählen';
		if (step === 'lineitems') return 'Positionen bearbeiten';
		return 'E-Mail prüfen & senden';
	});
</script>

<Modal title={stepTitle} onclose={onClose}>
	{#if step === 'type'}
		<div class="flex flex-col gap-4">
			{#if offerPriceCents == null}
				<Field label="Rechnungsbetrag (Brutto) *" for="manual-brutto">
					<span class="flex items-center gap-2">
						<input id="manual-brutto" class="num h-9 w-32 rounded-sm border border-line-strong bg-panel px-2.5 text-right text-sm outline-none focus:border-fg" type="text" inputmode="decimal" placeholder="0,00" bind:value={manualBruttoEur} />
						<span class="text-xs text-faint">€ brutto</span>
					</span>
				</Field>
			{/if}

			<p class="text-[13px] text-muted">Vollrechnung oder Teilrechnung (Anzahlung + Schlussrechnung)?</p>

			<div class="grid gap-2 sm:grid-cols-2">
				{#each [{ v: 'full', label: 'Vollrechnung', desc: 'Einmalige Rechnung über den Gesamtbetrag' }, { v: 'partial', label: 'Teilrechnung', desc: 'Anzahlung + Schlussrechnung' }] as o (o.v)}
					<label
						class="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors {invoiceType === o.v
							? 'border-fg bg-sunk'
							: 'border-line hover:border-line-strong'}"
					>
						<input type="radio" name="invoice-type" value={o.v} class="mt-0.5 accent-[var(--accent)]" bind:group={invoiceType} />
						<span class="flex flex-col gap-0.5">
							<span class="text-sm font-semibold">{o.label}</span>
							<span class="text-xs text-muted">{o.desc}</span>
						</span>
					</label>
				{/each}
			</div>

			{#if invoiceType === 'partial'}
				<div class="flex flex-col gap-3 rounded-md border border-line bg-sunk/50 p-3">
					<label class="flex items-center justify-between gap-3 text-sm" for="partial-percent">
						Anzahlungsprozentsatz
						<span class="flex items-center gap-1.5">
							<input
								id="partial-percent"
								class="num h-9 w-20 rounded-sm border border-line-strong bg-panel px-2 text-right outline-none focus:border-fg"
								type="number"
								min="1"
								max="99"
								bind:value={partialPercent}
							/>
							<span class="text-xs text-faint">%</span>
						</span>
					</label>
					{#if baseBruttoEur > 0}
						<dl class="num flex flex-col gap-1 text-[13px]">
							<div class="flex justify-between">
								<dt class="text-muted">Anzahlung ({partialPercent} %)</dt>
								<dd>{anzahlungEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € brutto</dd>
							</div>
							<div class="flex justify-between">
								<dt class="text-muted">Schlussrechnung ({100 - partialPercent} %)</dt>
								<dd>{schlussEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € brutto</dd>
							</div>
						</dl>
					{/if}
				</div>
			{/if}
		</div>
	{:else if step === 'lineitems'}
		<div class="flex flex-col gap-4">
			<p class="text-[13px] text-muted">
				{#if invoiceType === 'partial'}
					Zusatzleistungen und Gutschriften erscheinen auf der <strong class="text-fg">Schlussrechnung</strong>.
				{:else}
					Zusatzleistungen oder Gutschriften hinzufügen, die auf der Rechnung erscheinen sollen.
				{/if}
				Preise als Brutto eingeben.
			</p>

			<div class="flex flex-wrap gap-1.5">
				{#each PRESETS as p (p.description)}
					<button
						class="h-7 rounded-full border border-line-strong px-3 text-xs hover:border-fg hover:bg-sunk"
						onclick={() => addPreset(p)}>{p.description}</button
					>
				{/each}
			</div>

			{#if lineItems.length > 0}
				<div class="flex flex-col gap-2">
					{#each lineItems as item, i (i)}
						<div class="grid grid-cols-[minmax(0,1fr)_auto_32px] items-center gap-2 {item.brutto_eur.startsWith('-') ? 'text-danger' : ''}">
							<Input placeholder="Beschreibung" aria-label="Beschreibung" bind:value={item.description} />
							<span class="flex items-center gap-1.5">
								<input
									class="num h-9 w-32 rounded-sm border border-line-strong bg-panel px-2.5 text-right text-sm outline-none focus:border-fg w-28"
									type="text"
									inputmode="decimal"
									aria-label="Preis brutto"
									placeholder={item.brutto_eur.startsWith('-') ? '-0,00' : '0,00'}
									bind:value={item.brutto_eur}
								/>
								<span class="hidden text-xs text-faint sm:inline">€</span>
							</span>
							<Button variant="ghost" size="icon-sm" aria-label="Entfernen" title="Entfernen" onclick={() => removeItem(i)}><Trash2 size={14} /></Button>
						</div>
					{/each}
				</div>
			{/if}

			<div class="flex gap-2">
				<Button size="sm" variant="ghost" onclick={addZusatz}><Plus size={14} /> Zusatzleistung</Button>
				<Button size="sm" variant="ghost" class="text-danger" onclick={addGutschrift}><Plus size={14} /> Gutschrift</Button>
			</div>

			<div class="num flex flex-col gap-1 rounded-md border border-line bg-sunk/50 p-3 text-sm">
				{#if invoiceType === 'partial'}
					<div class="flex justify-between text-muted">
						<span>Anzahlung ({partialPercent} %)</span>
						<span>{formatEuro(Math.round(((baseBruttoEur * partialPercent) / 100) * 100))}</span>
					</div>
					<p class="label-xs mt-2 border-t border-line pt-2 text-faint">Schlussrechnung</p>
				{/if}
				<div class="flex justify-between text-muted"><span>Netto</span><span>{formatEuro(totalNettoCents)}</span></div>
				<div class="flex justify-between text-muted"><span>MwSt. (19 %)</span><span>{formatEuro(totalMwstCents)}</span></div>
				<div class="flex justify-between border-t border-line pt-1.5 text-base font-semibold">
					<span>Gesamt (brutto)</span><span>{formatEuro(totalBruttoCents)}</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#if invoice}
				<div class="flex items-center justify-between gap-3 rounded-md border border-line bg-sunk/50 px-3 py-2.5">
					<span class="num text-sm font-semibold">Rechnung {invoice.invoice_number}</span>
					<span class="flex items-center gap-2">
						<span class="num text-sm">{formatEuro(invoice.total_brutto_cents)}</span>
						<Button size="xs" onclick={downloadPdf} disabled={downloadingPdf} title="PDF herunterladen">
							<Download size={13} />
							{downloadingPdf ? '…' : 'PDF'}
						</Button>
					</span>
				</div>
			{/if}
			<Field label="Betreff" for="email-subject"><Input id="email-subject" bind:value={emailSubject} /></Field>
			<Field label="Nachricht" for="email-body"><Textarea id="email-body" rows={10} bind:value={emailBody} /></Field>
		</div>
	{/if}

	{#snippet footer()}
		{#if step === 'type'}
			<Button onclick={onClose} disabled={busy}>Abbrechen</Button>
			<Button variant="solid" onclick={goToLineitems}>Weiter →</Button>
		{:else if step === 'lineitems'}
			<Button onclick={() => (step = 'type')} disabled={busy}>← Zurück</Button>
			<Button variant="solid" onclick={goToEmail} disabled={busy}>{busy ? 'Erstelle Rechnung …' : 'Rechnung erstellen →'}</Button>
		{:else}
			<Button onclick={onClose} disabled={busy}>Abbrechen</Button>
			<Button variant="accent" onclick={send} disabled={busy}>{busy ? 'Sende …' : 'Rechnung senden'}</Button>
		{/if}
	{/snippet}
</Modal>
