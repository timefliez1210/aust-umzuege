<script lang="ts">
	import { apiPost, apiPatch, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { X, Plus, Trash2, Download } from 'lucide-svelte';

	interface Props {
		inquiryId: string;
		inquiryStatus: string;
		customerName: string | null;
		/** Called after the invoice has been sent successfully. */
		onSent: () => void;
		onClose: () => void;
	}

	let { inquiryId, inquiryStatus, customerName, onSent, onClose }: Props = $props();

	// ── Types ────────────────────────────────────────────────────────────────

	interface ExtraLine {
		description: string;
		/** Brutto in euros (user input) — converted to netto cents on submit */
		brutto_eur: string;
	}

	interface InvoiceResponse {
		id: string;
		invoice_number: string;
		total_brutto_cents: number;
	}

	// ── Step machine: 'extras' → 'email' → 'done' ────────────────────────────

	type Step = 'extras' | 'email';
	let step = $state<Step>('extras');
	let busy = $state(false);

	// ── Step 1: extras ────────────────────────────────────────────────────────

	const PRESETS: ExtraLine[] = [
		{ description: 'Halteverbotszone (Auszug)', brutto_eur: '59.50' },
		{ description: 'Halteverbotszone (Einzug)', brutto_eur: '59.50' },
		{ description: 'Möbelmontage', brutto_eur: '95.20' },
		{ description: 'Verpackungsservice', brutto_eur: '119.00' },
		{ description: 'Entsorgung', brutto_eur: '59.50' },
	];

	let extras = $state<ExtraLine[]>([]);

	function addPreset(p: ExtraLine) {
		extras = [...extras, { ...p }];
	}

	function addBlank() {
		extras = [...extras, { description: '', brutto_eur: '' }];
	}

	function removeExtra(i: number) {
		extras = extras.filter((_, idx) => idx !== i);
	}

	// ── Step 2: email ─────────────────────────────────────────────────────────

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

	/** Netto cents from a brutto-EUR string (÷ 1.19, rounded). */
	function bruttoToNettoCents(eur: string): number {
		const val = parseFloat(eur.replace(',', '.'));
		if (isNaN(val) || val <= 0) return 0;
		return Math.round((val / 1.19) * 100);
	}

	function formatEuro(cents: number): string {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	// ── Transitions ───────────────────────────────────────────────────────────

	async function goToEmail() {
		busy = true;
		try {
			// 1. Mark inquiry as completed if needed
			if (!['completed', 'invoiced', 'paid'].includes(inquiryStatus)) {
				await apiPatch(`/api/v1/inquiries/${inquiryId}`, { status: 'completed' });
				inquiryStatus = 'completed';
			}

			// 2. Create invoice (full)
			const created = await apiPost<InvoiceResponse[]>(
				`/api/v1/inquiries/${inquiryId}/invoices`,
				{ invoice_type: 'full' }
			);
			invoice = created[0];

			// 3. Apply extras if any
			const validExtras = extras
				.filter(e => e.description.trim() && e.brutto_eur)
				.map(e => ({
					description: e.description.trim(),
					price_cents: bruttoToNettoCents(e.brutto_eur),
				}));

			if (validExtras.length > 0) {
				const updated = await apiPatch<InvoiceResponse>(
					`/api/v1/inquiries/${inquiryId}/invoices/${invoice.id}`,
					{ extra_services: validExtras }
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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose}>
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal" onclick={(e) => e.stopPropagation()}>

		<div class="modal-header">
			<h2>
				{#if step === 'extras'}
					Rechnung vorbereiten
				{:else}
					E-Mail prüfen & senden
				{/if}
			</h2>
			<button class="close-btn" onclick={onClose} title="Abbrechen"><X size={18} /></button>
		</div>

		{#if step === 'extras'}
			<!-- ── Step 1: Extra services ── -->
			<div class="modal-body">
				<p class="hint">Zusatzleistungen oder Gutschriften hinzufügen, die auf der Rechnung erscheinen sollen. Preise als Brutto eingeben.</p>

				<div class="presets">
					{#each PRESETS as p}
						<button class="preset-chip" onclick={() => addPreset(p)}>{p.description}</button>
					{/each}
				</div>

				{#if extras.length > 0}
					<div class="extras-list">
						{#each extras as ex, i}
							<div class="extra-row">
								<input
									class="extra-desc"
									type="text"
									placeholder="Beschreibung"
									bind:value={ex.description}
								/>
								<div class="extra-price-wrap">
									<input
										class="extra-price"
										type="text"
										inputmode="decimal"
										placeholder="0,00"
										bind:value={ex.brutto_eur}
									/>
									<span class="extra-currency">€ brutto</span>
								</div>
								<button class="del-btn" onclick={() => removeExtra(i)} title="Entfernen">
									<Trash2 size={14} />
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<button class="btn-link add-btn" onclick={addBlank}>
					<Plus size={14} /> Zeile hinzufügen
				</button>
			</div>

			<div class="modal-footer">
				<button class="btn" onclick={onClose} disabled={busy}>Abbrechen</button>
				<button class="btn btn-primary" onclick={goToEmail} disabled={busy}>
					{busy ? 'Erstelle Rechnung…' : 'Weiter →'}
				</button>
			</div>

		{:else}
			<!-- ── Step 2: Email review ── -->
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
		background: none;
		border: none;
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
	}

	.close-btn:hover {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface);
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
		width: 5rem;
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

	.add-btn {
		align-self: flex-start;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
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
