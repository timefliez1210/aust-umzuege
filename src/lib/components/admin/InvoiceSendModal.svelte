<script lang="ts">
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
	let manualBruttoEur = $state(
		offerPriceCents != null
			? ((offerPriceCents * 1.19) / 100).toFixed(2).replace('.', ',')
			: ''
	);

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

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal" onclick={(e) => e.stopPropagation()}>

		<div class="modal-header">
			<h2>{stepTitle}</h2>
			<button class="close-btn" onclick={onClose} title="Abbrechen"><X size={18} /></button>
		</div>

		{#if step === 'type'}
			<!-- ── Step 1: Rechnungstyp ── -->
			<div class="modal-body">
				{#if offerPriceCents == null}
					<div class="manual-amount-row">
						<label class="field-label" for="manual-brutto">Rechnungsbetrag (Brutto) <span class="required">*</span></label>
						<div class="extra-price-wrap">
							<input
								id="manual-brutto"
								class="extra-price manual-price"
								type="text"
								inputmode="decimal"
								placeholder="0,00"
								bind:value={manualBruttoEur}
							/>
							<span class="extra-currency">€ brutto</span>
						</div>
					</div>
				{/if}

				<p class="hint">Wählen Sie, ob eine Vollrechnung oder eine Teilrechnung (Anzahlung + Schlussrechnung) erstellt werden soll.</p>

				<div class="type-selector">
					<label class="type-option" class:selected={invoiceType === 'full'}>
						<input type="radio" name="invoice-type" value="full" bind:group={invoiceType} />
						<div class="type-content">
							<span class="type-label">Vollrechnung</span>
							<span class="type-desc">Einmalige Rechnung über den Gesamtbetrag</span>
						</div>
					</label>
					<label class="type-option" class:selected={invoiceType === 'partial'}>
						<input type="radio" name="invoice-type" value="partial" bind:group={invoiceType} />
						<div class="type-content">
							<span class="type-label">Teilrechnung</span>
							<span class="type-desc">Anzahlung + Schlussrechnung</span>
						</div>
					</label>
				</div>

				{#if invoiceType === 'partial'}
					<div class="partial-config">
						<div class="partial-row">
							<label class="field-label" for="partial-percent">Anzahlungsprozentsatz</label>
							<div class="partial-input-wrap">
								<input
									id="partial-percent"
									class="percent-input"
									type="number"
									min="1"
									max="99"
									bind:value={partialPercent}
								/>
								<span class="extra-currency">%</span>
							</div>
						</div>
						{#if baseBruttoEur > 0}
							<div class="partial-preview">
								<div class="preview-row">
									<span class="preview-label">Anzahlung ({partialPercent}%):</span>
									<span class="preview-value">{anzahlungEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € brutto</span>
								</div>
								<div class="preview-row">
									<span class="preview-label">Schlussrechnung ({100 - partialPercent}%):</span>
									<span class="preview-value">{schlussEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € brutto</span>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn" onclick={onClose} disabled={busy}>Abbrechen</button>
				<button class="btn btn-primary" onclick={goToLineitems}>
					Weiter →
				</button>
			</div>

		{:else if step === 'lineitems'}
			<!-- ── Step 2: Positionen ── -->
			<div class="modal-body">
				<p class="hint">
					{#if invoiceType === 'partial'}
						Zusatzleistungen und Gutschriften erscheinen auf der <strong>Schlussrechnung</strong>.
					{:else}
						Zusatzleistungen oder Gutschriften hinzufügen, die auf der Rechnung erscheinen sollen.
					{/if}
					Preise als Brutto eingeben.
				</p>

				<div class="presets">
					{#each PRESETS as p}
						<button class="preset-chip" onclick={() => addPreset(p)}>{p.description}</button>
					{/each}
				</div>

				{#if lineItems.length > 0}
					<div class="extras-list">
						{#each lineItems as item, i}
							<div class="extra-row" class:negative={item.brutto_eur.startsWith('-')}>
								<input
									class="extra-desc"
									type="text"
									placeholder="Beschreibung"
									bind:value={item.description}
								/>
								<div class="extra-price-wrap">
									<input
										class="extra-price"
										type="text"
										inputmode="decimal"
										placeholder={item.brutto_eur.startsWith('-') ? '-0,00' : '0,00'}
										bind:value={item.brutto_eur}
									/>
									<span class="extra-currency">€ brutto</span>
								</div>
								<button class="del-btn" onclick={() => removeItem(i)} title="Entfernen">
									<Trash2 size={14} />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<div class="add-row">
					<button class="btn-link add-btn" onclick={addZusatz}>
						<Plus size={14} /> Zusatzleistung
					</button>
					<button class="btn-link add-btn gutschrift-btn" onclick={addGutschrift}>
						<Plus size={14} /> Gutschrift
					</button>
				</div>

				<!-- Live totals -->
				<div class="totals-box">
					{#if invoiceType === 'partial'}
						<div class="totals-row totals-muted">
							<span>Anzahlung ({partialPercent}%)</span>
							<span>{formatEuro(Math.round(baseBruttoEur * partialPercent / 100 * 100))}</span>
						</div>
						<div class="totals-divider"></div>
						<p class="totals-section-label">Schlussrechnung</p>
					{/if}
					<div class="totals-row">
						<span>Netto</span>
						<span>{formatEuro(totalNettoCents)}</span>
					</div>
					<div class="totals-row">
						<span>MwSt. (19%)</span>
						<span>{formatEuro(totalMwstCents)}</span>
					</div>
					<div class="totals-row totals-total">
						<span>Gesamt (Brutto)</span>
						<span>{formatEuro(totalBruttoCents)}</span>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<button class="btn" onclick={() => step = 'type'} disabled={busy}>← Zurück</button>
				<button class="btn btn-primary" onclick={goToEmail} disabled={busy}>
					{busy ? 'Erstelle Rechnung…' : 'Rechnung erstellen →'}
				</button>
			</div>

		{:else}
			<!-- ── Step 3: Email review ── -->
			<div class="modal-body">
				{#if invoice}
					<div class="invoice-summary">
						<span class="inv-num">Rechnung {invoice.invoice_number}</span>
						<div class="inv-right">
							<span class="inv-total">{formatEuro(invoice.total_brutto_cents)}</span>
							<button
								class="btn-download"
								onclick={downloadPdf}
								disabled={downloadingPdf}
								title="PDF herunterladen"
							>
								<Download size={15} />
								{downloadingPdf ? '…' : 'PDF'}
							</button>
						</div>
					</div>
				{/if}

				<label class="field-label" for="email-subject">Betreff</label>
				<input
					id="email-subject"
					class="text-input"
					type="text"
					bind:value={emailSubject}
				/>

				<label class="field-label" for="email-body">Nachricht</label>
				<textarea
					id="email-body"
					class="text-input body-input"
					rows={10}
					bind:value={emailBody}
				></textarea>
			</div>

			<div class="modal-footer">
				<button class="btn" onclick={onClose} disabled={busy}>Abbrechen</button>
				<button class="btn btn-primary" onclick={send} disabled={busy}>
					{busy ? 'Sende…' : 'Rechnung senden'}
				</button>
			</div>
		{/if}

	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
	}

	.modal {
		background: var(--dt-surface);
		border-radius: var(--dt-radius-lg);
		width: min(600px, calc(100vw - 2rem));
		max-height: calc(100dvh - 4rem);
		display: flex;
		flex-direction: column;
		box-shadow: var(--dt-shadow-lg, 0 8px 32px rgba(0,0,0,.25));
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem 1rem;
		border-bottom: 1px solid var(--dt-outline-variant);
		flex-shrink: 0;
	}

	.modal-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.close-btn {
		background: var(--dt-surface-container-high);
		border: 1px solid var(--dt-outline-variant);
		cursor: pointer;
		color: var(--dt-on-surface);
		padding: 0.3rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
	}

	.close-btn:hover {
		background: var(--dt-surface-container-highest, #ddd);
	}

	.modal-body {
		padding: 1.25rem 1.5rem;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--dt-outline-variant);
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
		flex-shrink: 0;
	}

	.hint {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
	}

	/* Type selector */

	.type-selector {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.type-option {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		transition: background var(--dt-transition), border-color var(--dt-transition);
	}

	.type-option:hover {
		background: var(--dt-surface-container-low);
	}

	.type-option.selected {
		border-color: var(--dt-primary);
		background: color-mix(in srgb, var(--dt-primary) 8%, transparent);
	}

	.type-option input[type="radio"] {
		margin-top: 0.15rem;
		accent-color: var(--dt-primary);
		flex-shrink: 0;
	}

	.type-content {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.type-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.type-desc {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	/* Partial config */

	.partial-config {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		border: 1px solid var(--dt-outline-variant);
	}

	.partial-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.partial-row .field-label {
		margin: 0;
		flex-shrink: 0;
	}

	.partial-input-wrap {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.percent-input {
		width: 4rem;
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		text-align: right;
		outline: none;
	}

	.percent-input:focus {
		border-color: var(--dt-primary);
	}

	.partial-preview {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8125rem;
	}

	.preview-label {
		color: var(--dt-on-surface-variant);
	}

	.preview-value {
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	/* Presets */

	.presets {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.preset-chip {
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		border: 1px solid var(--dt-outline-variant);
		background: var(--dt-surface-container-low);
		color: var(--dt-on-surface);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.preset-chip:hover {
		background: var(--dt-surface-container-high);
	}

	/* Extras list */

	.extras-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.extra-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.extra-row.negative .extra-desc {
		border-color: color-mix(in srgb, var(--dt-secondary, #e65) 40%, var(--dt-outline-variant));
	}

	.extra-row.negative .extra-price {
		color: var(--dt-secondary, #c0392b);
	}

	.extra-desc {
		flex: 1;
		padding: 0.375rem 0.625rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
	}

	.extra-desc:focus {
		border-color: var(--dt-primary);
	}

	.extra-price-wrap {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.extra-price {
		width: 5.5rem;
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		text-align: right;
		outline: none;
	}

	.extra-price:focus {
		border-color: var(--dt-primary);
	}

	.extra-currency {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.del-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.del-btn:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container-high);
	}

	.add-row {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
	}

	.gutschrift-btn {
		color: var(--dt-secondary, #c0392b);
	}

	/* Totals box */

	.totals-box {
		margin-top: 0.25rem;
		padding: 0.75rem 1rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.totals-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.totals-row.totals-total {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		padding-top: 0.375rem;
		border-top: 1px solid var(--dt-outline-variant);
		margin-top: 0.125rem;
	}

	.totals-row.totals-muted {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		opacity: 0.75;
	}

	.totals-divider {
		height: 1px;
		background: var(--dt-outline-variant);
		margin: 0.25rem 0;
	}

	.totals-section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.manual-amount-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		border: 1px solid var(--dt-outline-variant);
	}

	.manual-amount-row .field-label {
		margin: 0;
		flex-shrink: 0;
	}

	.manual-price {
		width: 7rem;
	}

	.required {
		color: var(--dt-error, #b3261e);
	}

	/* Email step */

	.invoice-summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0.875rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
	}

	.inv-right {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.btn-download {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.2rem 0.6rem;
		border-radius: var(--dt-radius-sm);
		border: 1px solid var(--dt-outline-variant);
		background: var(--dt-surface-container);
		color: var(--dt-on-surface);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.btn-download:hover:not(:disabled) {
		background: var(--dt-surface-container-high);
	}

	.btn-download:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.inv-num {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.inv-total {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--dt-primary);
	}

	.field-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: -0.5rem;
	}

	.text-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		font-family: inherit;
		outline: none;
		box-sizing: border-box;
	}

	.text-input:focus {
		border-color: var(--dt-primary);
	}

	.body-input {
		resize: vertical;
		line-height: 1.5;
	}

	/* Buttons */

	.btn-link {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--dt-primary);
		font-size: 0.875rem;
		padding: 0;
	}

	.btn-link:hover {
		text-decoration: underline;
	}
</style>
