<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDownload, formatEuro } from "$lib/utils/api.svelte";
	import { calculateBruttoCents } from "$lib/utils/pricing";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { ChevronRight, Plus, Pencil, Download, Send, X } from "lucide-svelte";
	import ManualInvoiceEditor from "./ManualInvoiceEditor.svelte";

	interface InvoiceExtraService {
		description: string;
		price_cents: number;
	}

	interface InvoiceLineItem {
		description: string;
		quantity: number;
		unit_price_cents: number;
		remark?: string | null;
	}

	interface Invoice {
		id: string;
		inquiry_id: string;
		invoice_number: string;
		invoice_type: string;
		partial_group_id: string | null;
		partial_percent: number | null;
		status: string;
		extra_services: InvoiceExtraService[];
		is_manual: boolean;
		line_items: InvoiceLineItem[];
		total_netto_cents: number;
		total_brutto_cents: number;
		pdf_s3_key: string | null;
		sent_at: string | null;
		paid_at: string | null;
		created_at: string;
	}

	let {
		inquiryId,
		status,
		offerNettoCents,
		open = $bindable(),
		onToggle,
		onStatusChange,
	}: {
		inquiryId: string;
		status: string;
		offerNettoCents: number | null;
		open: boolean;
		onToggle: () => void;
		onStatusChange: () => void | Promise<void>;
	} = $props();

	const invoiceStatuses = ['accepted', 'scheduled', 'completed', 'invoiced', 'paid'];
	let showInvoiceCard = $derived(invoiceStatuses.includes(status));

	let invoices = $state<Invoice[]>([]);
	let invoicesLoading = $state(false);
	let invoiceCreating = $state(false);
	let showPartialForm = $state(false);
	let partialPercent = $state(30);

	// Extra services editor state — keyed by invoice id
	let editingExtras = $state<Record<string, boolean>>({});
	let extrasDraft = $state<Record<string, InvoiceExtraService[]>>({});

	/**
	 * Load all invoices for the current inquiry.
	 *
	 * Called by: $effect (on mount when showInvoiceCard becomes true)
	 * Purpose: Populates the Rechnungen card with existing invoices.
	 */
	async function loadInvoices() {
		invoicesLoading = true;
		try {
			const result = await apiGet(`/api/v1/inquiries/${inquiryId}/invoices`);
			invoices = (result ?? []) as Invoice[];
		} catch {
			showToast('Rechnungen konnten nicht geladen werden', 'error');
		} finally {
			invoicesLoading = false;
		}
	}

	/**
	 * Create a single full invoice for the inquiry.
	 *
	 * Called by: Template ("Rechnung Erstellen" button)
	 * Purpose: Triggers XLSX + PDF generation for the full job amount.
	 */
	async function createFullInvoice() {
		invoiceCreating = true;
		try {
			const result = await apiPost(`/api/v1/inquiries/${inquiryId}/invoices`, { invoice_type: 'full' });
			invoices = (result ?? []) as Invoice[];
			showToast('Rechnung erstellt', 'success');
		} catch {
			showToast('Rechnung konnte nicht erstellt werden', 'error');
		} finally {
			invoiceCreating = false;
		}
	}

	/**
	 * Create a partial invoice pair (Anzahlung + Restbetrag).
	 *
	 * Called by: Template (Partielle Rechnung form submit)
	 * Purpose: Creates two linked invoices — partial_first sendable immediately,
	 *          partial_final sendable after inquiry is completed.
	 *
	 * @param e - Submit event (prevented by caller)
	 */
	async function createPartialInvoice(e: Event) {
		e.preventDefault();
		if (partialPercent < 1 || partialPercent > 99) {
			showToast('Prozentsatz muss zwischen 1 und 99 liegen', 'error');
			return;
		}
		invoiceCreating = true;
		try {
			const result = await apiPost(`/api/v1/inquiries/${inquiryId}/invoices`, {
				invoice_type: 'partial',
				partial_percent: partialPercent,
			});
			invoices = (result ?? []) as Invoice[];
			showPartialForm = false;
			showToast('Teilrechnungen erstellt', 'success');
		} catch {
			showToast('Teilrechnungen konnten nicht erstellt werden', 'error');
		} finally {
			invoiceCreating = false;
		}
	}

	/**
	 * Send a specific invoice by email to the customer.
	 *
	 * Called by: Template ("Senden" button per invoice)
	 * Purpose: Attaches the invoice PDF and sends via SMTP.
	 *          Gated by sendability rules (partial_final requires completed status).
	 *
	 * @param invId - UUID of the invoice to send
	 */
	async function sendInvoice(invId: string) {
		try {
			const updated = await apiPost(`/api/v1/inquiries/${inquiryId}/invoices/${invId}/send`);
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			showToast('Rechnung gesendet', 'success');
			// Reload inquiry to pick up status transition (→ invoiced)
			await onStatusChange();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Rechnung konnte nicht gesendet werden';
			showToast(msg, 'error');
		}
	}

	/**
	 * Mark a specific invoice as paid.
	 *
	 * Called by: Template ("Als bezahlt markieren" button)
	 * Purpose: Sets paid_at and updates status to 'paid'.
	 *          Auto-transitions inquiry to 'paid' when all invoices are paid.
	 *
	 * @param invId - UUID of the invoice to mark as paid
	 */
	async function markInvoicePaid(invId: string) {
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${invId}`, { status: 'paid' });
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			showToast('Rechnung als bezahlt markiert', 'success');
			await onStatusChange();
		} catch {
			showToast('Konnte nicht als bezahlt markiert werden', 'error');
		}
	}

	/**
	 * Overwrite an invoice's number (recovery path).
	 *
	 * Called by: Template (number edit control per invoice)
	 * Purpose: When the in-system counter falls out of sync with manually-sent
	 *          invoices, lets Alex correct the number on a generated invoice. The
	 *          server regenerates the PDF with the new number and nudges the counter
	 *          forward so the next generated number won't collide.
	 */
	let editingNumberId = $state<string | null>(null);
	let numberDraft = $state('');
	let numberSaving = $state(false);

	function startEditNumber(inv: Invoice) {
		editingNumberId = inv.id;
		numberDraft = inv.invoice_number;
	}

	function cancelEditNumber() {
		editingNumberId = null;
		numberDraft = '';
	}

	async function saveInvoiceNumber(invId: string) {
		const next = numberDraft.trim();
		if (!next) { showToast('Rechnungsnummer darf nicht leer sein', 'error'); return; }
		numberSaving = true;
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${invId}/number`, {
				invoice_number: next,
			});
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			editingNumberId = null;
			numberDraft = '';
			showToast('Rechnungsnummer aktualisiert', 'success');
		} catch (e) {
			showToast((e as Error).message || 'Rechnungsnummer konnte nicht geändert werden', 'error');
		} finally {
			numberSaving = false;
		}
	}

	/**
	 * Begin editing extra services for a specific invoice.
	 *
	 * Called by: Template ("Zusatzleistungen bearbeiten" toggle)
	 * Purpose: Copies current extra_services into draft state for inline editing.
	 *
	 * @param inv - Invoice object whose extras are being edited
	 */
	function startEditExtras(inv: Invoice) {
		extrasDraft[inv.id] = inv.extra_services.map((e) => ({ ...e }));
		editingExtras[inv.id] = true;
	}

	/**
	 * Add an empty row to the extras draft for a given invoice.
	 *
	 * Called by: Template ("+ Zusatzleistung" button)
	 * Purpose: Lets admin add a new on-site extra service line.
	 *
	 * @param invId - Invoice ID
	 */
	function addExtraRow(invId: string) {
		if (!extrasDraft[invId]) extrasDraft[invId] = [];
		extrasDraft[invId] = [...extrasDraft[invId], { description: '', price_cents: 0 }];
	}

	/**
	 * Remove an extra service row from the draft.
	 *
	 * Called by: Template (× button per row)
	 * Purpose: Removes a single extra service from the pending edit.
	 *
	 * @param invId - Invoice ID
	 * @param idx - Row index to remove
	 */
	function removeExtraRow(invId: string, idx: number) {
		extrasDraft[invId] = extrasDraft[invId].filter((_, i) => i !== idx);
	}

	/**
	 * Save the edited extra services for an invoice and regenerate the PDF.
	 *
	 * Called by: Template ("Speichern" button in extras editor)
	 * Purpose: Persists the updated extras list and triggers server-side PDF regeneration.
	 *
	 * @param invId - Invoice ID
	 */
	async function saveExtras(invId: string) {
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${invId}`, {
				extra_services: extrasDraft[invId] ?? [],
			});
			invoices = invoices.map((inv) => (inv.id === invId ? (updated as Invoice) : inv));
			editingExtras[invId] = false;
			showToast('Zusatzleistungen gespeichert', 'success');
		} catch {
			showToast('Zusatzleistungen konnten nicht gespeichert werden', 'error');
		}
	}

	// ─── Manual invoice mode (Stunden ausweisen) ──────────────────────────────
	// Which full invoices currently have the manual editor open. An invoice that
	// is already `is_manual` always shows the editor; this tracks the transient
	// "opened but not yet saved" state for a not-yet-manual invoice.
	let manualOpen = $state<Record<string, boolean>>({});

	/** Whether to render the manual editor for this invoice. */
	function isManualEditorOpen(inv: Invoice): boolean {
		return inv.is_manual || manualOpen[inv.id] === true;
	}

	/**
	 * Toggle the "Manuelle Rechnung" switch for a full invoice.
	 *
	 * Turning ON just opens the editor (nothing persists until Speichern).
	 * Turning OFF an already-manual invoice reverts it to the offer-derived form
	 * via PATCH `{ is_manual: false }` (with confirmation, since it discards the
	 * hand-edited lines). Turning OFF a not-yet-saved editor just closes it.
	 */
	async function toggleManual(inv: Invoice, on: boolean) {
		if (on) {
			manualOpen[inv.id] = true;
			return;
		}
		if (inv.is_manual) {
			if (!confirm('Manuelle Positionen verwerfen und Rechnung wieder aus dem Angebot erzeugen?')) {
				return;
			}
			try {
				const updated = await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}`, {
					is_manual: false,
				});
				invoices = invoices.map((i) => (i.id === inv.id ? (updated as Invoice) : i));
				showToast('Rechnung aus Angebot neu erzeugt', 'success');
			} catch {
				showToast('Umstellung fehlgeschlagen', 'error');
				return;
			}
		}
		manualOpen[inv.id] = false;
	}

	/** Apply the saved invoice returned by the manual editor and close it. */
	function onManualSaved(invId: string, updated: Invoice) {
		invoices = invoices.map((i) => (i.id === invId ? updated : i));
		manualOpen[invId] = false;
	}

	$effect(() => {
		if (showInvoiceCard) loadInvoices();
	});

	/**
	 * Returns a human-readable German label for an invoice status.
	 *
	 * Called by: Template (status badge rendering)
	 * Purpose: Maps internal status strings to display labels.
	 *
	 * @param status - Invoice status string
	 * @returns German label
	 */
	function invoiceStatusLabel(s: string): string {
		return { draft: 'Entwurf', ready: 'Offen', sent: 'Gesendet', paid: 'Bezahlt' }[s] ?? s;
	}

	/**
	 * Returns a CSS class suffix for an invoice status badge.
	 *
	 * Called by: Template (class binding on status badge)
	 * Purpose: Colours the badge: grey=draft, orange=ready, blue=sent, green=paid.
	 *
	 * @param status - Invoice status string
	 * @returns CSS class suffix
	 */
	function invoiceStatusClass(s: string): string {
		return { draft: 'grey', ready: 'orange', sent: 'blue', paid: 'green' }[s] ?? 'grey';
	}

	/**
	 * Returns true if a given invoice can be sent right now.
	 * partial_first: always sendable; full / partial_final: require completed status.
	 *
	 * Called by: Template (Senden button disabled state)
	 * Purpose: Enforces business rule that final invoices are only sent after job completion.
	 *
	 * @param inv - Invoice object
	 * @returns Whether sending is currently allowed
	 */
	function canSendInvoice(inv: Invoice): boolean {
		if (inv.invoice_type === 'partial_first') return true;
		return status === 'completed';
	}

	/**
	 * Compute a preview of Anzahlung / Restbetrag amounts for the partial form.
	 * Uses the active offer's brutto price.
	 *
	 * Called by: Template (partial invoice preview)
	 * Purpose: Shows Alex what the split will look like before confirming.
	 *
	 * @returns { first, remaining } in cents, or null if no offer
	 *
	 * Math: first = round(offer_brutto * percent / 100)
	 *       remaining = offer_brutto - first
	 */
	function partialPreview(): { first: number; remaining: number } | null {
		if (!offerNettoCents) return null;
		// offer total_netto_cents is netto; brutto = netto * VAT_RATE
		const brutto = calculateBruttoCents(offerNettoCents);
		const first = Math.round(brutto * partialPercent / 100);
		return { first, remaining: brutto - first };
	}

	/**
	 * Opens the browser PDF download for a specific invoice.
	 *
	 * Called by: Template ("PDF" button per invoice)
	 * Purpose: Triggers authenticated download of the invoice PDF.
	 *
	 * @param inv - Invoice whose PDF should be downloaded
	 */
	async function downloadInvoicePdf(inv: Invoice) {
		await apiDownload(
			`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}/pdf`,
			`Rechnung_${inv.invoice_number}.pdf`
		);
	}
</script>

<!-- Rechnungen Card (visible for accepted+ statuses) -->
{#if showInvoiceCard}
	<div class="invoices-section">
		<div class="card" class:card--collapsed={!open}>
			<div class="card-header card-header--toggleable">
				<button class="card-toggle" onclick={onToggle} aria-expanded={open}>
					<span class="card-toggle-chev" class:open><ChevronRight size={16} /></span>
					<h3>Rechnungen</h3>
				</button>
				{#if open && invoices.length === 0}
					<div class="invoice-create-btns">
						<button
							class="btn btn-sm btn-primary"
							disabled={invoiceCreating}
							onclick={createFullInvoice}
						>
							<Plus size={14} />
							Rechnung Erstellen
						</button>
						<button
							class="btn btn-sm"
							onclick={() => (showPartialForm = !showPartialForm)}
						>
							<Plus size={14} />
							Partielle Rechnung
						</button>
					</div>
				{/if}
			</div>
			{#if open}

			<!-- Partial invoice form -->
			{#if showPartialForm && invoices.length === 0}
				<form class="partial-form" onsubmit={createPartialInvoice}>
					<div class="partial-form-row">
						<label for="partial-pct">Anzahlungsprozentsatz (%)</label>
						<input
							id="partial-pct"
							type="number"
							min="1"
							max="99"
							class="inline-input"
							bind:value={partialPercent}
						/>
					</div>
					{#if partialPreview()}
						{@const preview = partialPreview()!}
						<div class="partial-preview">
							<span>Anzahlung: <strong>{formatEuro(preview.first)}</strong></span>
							<span>Restbetrag: <strong>{formatEuro(preview.remaining)}</strong></span>
						</div>
					{/if}
					<div class="partial-form-actions">
						<button type="button" class="btn btn-sm" onclick={() => (showPartialForm = false)}>Abbrechen</button>
						<button type="submit" class="btn btn-sm btn-primary" disabled={invoiceCreating}>
							{invoiceCreating ? 'Erstelle...' : 'Erstellen'}
						</button>
					</div>
				</form>
			{/if}

			{#if invoicesLoading}
				<p class="empty-hint">Rechnungen werden geladen...</p>
			{:else if invoices.length === 0}
				<p class="empty-hint">Noch keine Rechnung erstellt.</p>
			{:else}
				<div class="invoices-list">
					{#each invoices as inv}
						<div class="invoice-row">
							<div class="invoice-row-header">
								<div class="invoice-row-meta">
									{#if editingNumberId === inv.id}
										<span class="invoice-number">Nr.</span>
										<input
											class="inline-input invoice-number-input"
											bind:value={numberDraft}
											placeholder="z.B. 2026-0053"
											onkeydown={(e) => { if (e.key === 'Enter') saveInvoiceNumber(inv.id); if (e.key === 'Escape') cancelEditNumber(); }}
										/>
										<button class="btn btn-sm btn-primary" disabled={numberSaving} onclick={() => saveInvoiceNumber(inv.id)}>
											{numberSaving ? '...' : 'Speichern'}
										</button>
										<button class="btn btn-sm" onclick={cancelEditNumber}>Abbrechen</button>
									{:else}
										<span class="invoice-number">Nr. {inv.invoice_number}</span>
										{#if inv.status !== 'paid'}
											<button class="btn-icon" title="Rechnungsnummer korrigieren" onclick={() => startEditNumber(inv)}>
												<Pencil size={13} />
											</button>
										{/if}
									{/if}
									<span class="invoice-type-label">
										{#if inv.invoice_type === 'full'}Vollrechnung
										{:else if inv.invoice_type === 'partial_first'}Anzahlung ({inv.partial_percent}%)
										{:else}Restbetrag
										{/if}
									</span>
									<span class="invoice-amount">{formatEuro(inv.total_brutto_cents)}</span>
								</div>
								<div class="invoice-row-actions">
									<span class="inv-status inv-status--{invoiceStatusClass(inv.status)}">
										{invoiceStatusLabel(inv.status)}
									</span>
									<button
										class="btn btn-sm"
										title="PDF herunterladen"
										onclick={() => downloadInvoicePdf(inv)}
									>
										<Download size={13} />
										PDF
									</button>
									{#if inv.status !== 'sent' && inv.status !== 'paid'}
										<button
											class="btn btn-sm btn-primary"
											disabled={!canSendInvoice(inv)}
											title={!canSendInvoice(inv) ? 'Erst nach Auftragsabschluss sendbar' : 'Rechnung senden'}
											onclick={() => sendInvoice(inv.id)}
										>
											<Send size={13} />
											Senden
										</button>
									{/if}
									{#if inv.status === 'sent'}
										<button
											class="btn btn-sm"
											onclick={() => markInvoicePaid(inv.id)}
										>
											Als bezahlt markieren
										</button>
									{/if}
								</div>
							</div>

							<!-- Manual invoice mode (full invoices only): free line-item editing -->
							{#if inv.invoice_type === 'full'}
								<div class="manual-section">
									<label class="manual-toggle">
										<input
											type="checkbox"
											checked={isManualEditorOpen(inv)}
											disabled={inv.status === 'paid'}
											onchange={(e) => toggleManual(inv, (e.currentTarget as HTMLInputElement).checked)}
										/>
										<span>Manuelle Rechnung — Positionen frei bearbeiten (z.B. Stunden ausweisen)</span>
									</label>
									{#if isManualEditorOpen(inv)}
										<ManualInvoiceEditor
											inquiryId={inv.inquiry_id}
											invoice={inv}
											onSaved={(u) => onManualSaved(inv.id, u as Invoice)}
											onCancel={() => toggleManual(inv, false)}
										/>
									{/if}
								</div>
							{/if}

							<!-- Extra services (full / partial_final) — hidden while manual editor is open -->
							{#if inv.invoice_type !== 'partial_first' && !isManualEditorOpen(inv)}
								<div class="extras-section">
									{#if !editingExtras[inv.id]}
										<div class="extras-header">
											<span class="extras-label">Zusatzleistungen</span>
											<button
												class="btn-link"
												onclick={() => startEditExtras(inv)}
											>Bearbeiten</button>
										</div>
										{#if inv.extra_services.length > 0}
											<ul class="extras-list">
												{#each inv.extra_services as extra}
													<li>
														<span>{extra.description}</span>
														<span class="extras-price">{formatEuro(extra.price_cents)}</span>
													</li>
												{/each}
											</ul>
										{:else}
											<p class="empty-hint extras-empty">Keine Zusatzleistungen</p>
										{/if}
									{:else}
										<div class="extras-editor">
											{#each extrasDraft[inv.id] ?? [] as extra, idx}
												<div class="extras-editor-row">
													<input
														type="text"
														placeholder="Beschreibung"
														class="extras-input"
														bind:value={extrasDraft[inv.id][idx].description}
													/>
													<input
														type="number"
														placeholder="Preis (Netto €)"
														class="extras-input extras-input--price"
														value={(extrasDraft[inv.id][idx].price_cents / 100).toFixed(2)}
														onchange={(e) => {
															extrasDraft[inv.id][idx].price_cents = Math.round(
																parseFloat((e.target as HTMLInputElement).value) * 100
															);
														}}
													/>
													<button
														class="btn-icon danger"
														onclick={() => removeExtraRow(inv.id, idx)}
													><X size={13} /></button>
												</div>
											{/each}
											<div class="extras-editor-footer">
												<button class="btn-link" onclick={() => addExtraRow(inv.id)}>
													<Plus size={12} /> Hinzufügen
												</button>
												<div class="extras-editor-actions">
													<button class="btn btn-sm" onclick={() => { editingExtras[inv.id] = false; }}>Abbrechen</button>
													<button class="btn btn-sm btn-primary" onclick={() => saveExtras(inv.id)}>Speichern</button>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.inline-input {
		width: 60px;
		padding: 0.25rem 0.375rem;
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		text-align: right;
		font-variant-numeric: tabular-nums;
		outline: none;
		transition: border-bottom var(--dt-transition), background var(--dt-transition);
	}

	.inline-input:focus {
		border-bottom-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.btn-icon.danger:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container);
	}

	.empty-hint {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem 0;
		margin: 0;
	}

	/* ── Rechnungen Section ─────────────────────────────────────────── */

	.invoices-section {
		margin-bottom: 1.5rem;
	}

	.invoice-create-btns {
		display: flex;
		gap: 0.5rem;
	}

	.partial-form {
		padding: 1rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.partial-form-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.partial-form-row label {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.partial-preview {
		display: flex;
		gap: 2rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.partial-form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.invoices-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.invoice-row {
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		padding: 0.875rem 1rem;
	}

	.invoice-row-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.invoice-row-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.invoice-number {
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.invoice-number-input {
		max-width: 150px;
	}

	.invoice-type-label {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.invoice-amount {
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.invoice-row-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.inv-status {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.6875rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.inv-status--grey   { background: var(--dt-surface-container); color: var(--dt-on-surface-variant); }
	.inv-status--orange { background: var(--dt-surface-container-high); color: var(--dt-secondary); }
	.inv-status--blue   { background: var(--dt-info-bg); color: var(--dt-info-text); }
	.inv-status--green  { background: var(--dt-success-bg); color: var(--dt-success-text); }

	.manual-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-surface-container-high);
	}

	.manual-toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		cursor: pointer;
		user-select: none;
	}

	.manual-toggle input {
		width: 1rem;
		height: 1rem;
		cursor: pointer;
	}

	.extras-section {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-surface-container-high);
	}

	.extras-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.extras-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
	}

	.extras-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.extras-list li {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: var(--dt-on-surface);
	}

	.extras-price {
		font-weight: 500;
	}

	.extras-empty {
		margin: 0.25rem 0 0;
	}

	.extras-editor {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.extras-editor-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.extras-input {
		flex: 1;
		padding: 0.3rem 0.5rem;
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		transition: border-bottom var(--dt-transition), background var(--dt-transition);
	}

	.extras-input:focus {
		border-bottom-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
	}

	.extras-input--price {
		flex: 0 0 9rem;
	}

	.extras-editor-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.25rem;
	}

	.extras-editor-actions {
		display: flex;
		gap: 0.4rem;
	}

	@media (max-width: 768px) {
		.invoice-row-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.invoice-row-actions {
			width: 100%;
		}

		.extras-editor-row {
			flex-wrap: wrap;
		}

		.extras-input--price {
			flex: 1 1 100%;
		}
	}
</style>
