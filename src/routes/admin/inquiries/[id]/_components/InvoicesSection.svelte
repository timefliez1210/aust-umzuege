<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Check from '$lib/components/ui/Check.svelte';
	import type { Tone } from '$lib/components/ui/tone';
	import { apiGet, apiPost, apiPatch, apiDownload, formatEuro } from "$lib/utils/api.svelte";
	import { calculateBruttoCents } from "$lib/utils/pricing";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { Plus, Pencil, Download, Send, X } from "lucide-svelte";
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
		/** Day paid in cash (YYYY-MM-DD) — the PDF then reads "in bar beglichen". */
		cash_paid_on: string | null;
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

	// Barzahlung editor state — keyed by invoice id. `cashOpen` is the transient
	// "checkbox ticked but not saved yet" state; a saved cash invoice is always open.
	let cashOpen = $state<Record<string, boolean>>({});
	let cashDateDraft = $state<Record<string, string>>({});
	let cashSaving = $state<Record<string, boolean>>({});

	function isCashOpen(inv: Invoice): boolean {
		return inv.cash_paid_on !== null || cashOpen[inv.id] === true;
	}

	function todayIso(): string {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/**
	 * Toggle "Bar Zahlung" for an invoice.
	 *
	 * Turning ON opens the date field (nothing persists until Speichern).
	 * Turning OFF a saved cash invoice restores the bank details on the PDF via
	 * PATCH `{ cash_paid: false }`; the payment itself stays booked.
	 */
	async function toggleCash(inv: Invoice, on: boolean) {
		if (on) {
			cashDateDraft[inv.id] = inv.cash_paid_on ?? todayIso();
			cashOpen[inv.id] = true;
			return;
		}
		if (inv.cash_paid_on !== null) {
			if (!confirm('Barzahlung entfernen? Die Rechnung zeigt dann wieder die Bankverbindung.')) {
				return;
			}
			await saveCash(inv, false);
		}
		cashOpen[inv.id] = false;
	}

	/** Persist the Barzahlung date (or clear it) and apply the regenerated invoice. */
	async function saveCash(inv: Invoice, cashPaid: boolean) {
		const date = cashDateDraft[inv.id] ?? inv.cash_paid_on ?? '';
		if (cashPaid && !date) {
			showToast('Bitte das Datum der Barzahlung angeben', 'error');
			return;
		}
		cashSaving[inv.id] = true;
		try {
			const updated = await apiPatch(`/api/v1/inquiries/${inquiryId}/invoices/${inv.id}`, {
				cash_paid: cashPaid,
				cash_paid_on: cashPaid ? date : null,
			});
			invoices = invoices.map((i) => (i.id === inv.id ? (updated as Invoice) : i));
			showToast(cashPaid ? 'Barzahlung gespeichert — Rechnung ist jetzt Quittung' : 'Barzahlung entfernt', 'success');
			if (cashPaid) await onStatusChange();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Barzahlung konnte nicht gespeichert werden';
			showToast(msg, 'error');
		} finally {
			cashSaving[inv.id] = false;
		}
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
	 * Returns the badge tone for an invoice status.
	 *
	 * Called by: Template (class binding on status badge)
	 * Purpose: Colours the badge: neutral=draft, warn=ready, info=sent, ok=paid.
	 *
	 * @param status - Invoice status string
	 * @returns Badge tone
	 */
	function invoiceStatusTone(s: string): Tone {
		return ({ draft: 'neutral', ready: 'warn', sent: 'info', paid: 'ok' } as Record<string, Tone>)[s] ?? 'neutral';
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

{#if showInvoiceCard}
	<Panel title="Rechnungen" {open} {onToggle}>
		{#snippet actions()}
			{#if invoices.length === 0}
				<Button size="sm" variant="solid" disabled={invoiceCreating} onclick={createFullInvoice}><Plus size={14} /> Rechnung erstellen</Button>
				<Button size="sm" onclick={() => (showPartialForm = !showPartialForm)}><Plus size={14} /> Partielle Rechnung</Button>
			{/if}
		{/snippet}

		<div class="flex flex-col gap-3">
			{#if showPartialForm && invoices.length === 0}
				<form class="flex flex-col gap-3 rounded-sm border border-line bg-sunk/50 p-3" onsubmit={createPartialInvoice}>
					<label class="flex items-center justify-between gap-3 text-sm" for="partial-pct">
						Anzahlungsprozentsatz (%)
						<input
							id="partial-pct"
							type="number"
							min="1"
							max="99"
							class="num h-9 w-20 rounded-sm border border-line-strong bg-panel px-2 text-right outline-none focus:border-fg"
							bind:value={partialPercent}
						/>
					</label>
					{#if partialPreview()}
						{@const preview = partialPreview()!}
						<div class="num flex flex-wrap gap-x-5 text-[13px] text-muted">
							<span>Anzahlung <strong class="text-fg">{formatEuro(preview.first)}</strong></span>
							<span>Restbetrag <strong class="text-fg">{formatEuro(preview.remaining)}</strong></span>
						</div>
					{/if}
					<div class="flex justify-end gap-2">
						<Button size="sm" onclick={() => (showPartialForm = false)}>Abbrechen</Button>
						<Button size="sm" type="submit" variant="solid" disabled={invoiceCreating}>{invoiceCreating ? 'Erstelle …' : 'Erstellen'}</Button>
					</div>
				</form>
			{/if}

			{#if invoicesLoading}
				<p class="text-sm text-muted">Rechnungen werden geladen …</p>
			{:else if invoices.length === 0}
				<p class="text-[13px] text-faint">Noch keine Rechnung erstellt.</p>
			{:else}
				{#each invoices as inv (inv.id)}
					<article class="flex flex-col divide-y divide-line rounded-sm border border-line">
						<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
							<div class="flex flex-wrap items-center gap-2">
								{#if editingNumberId === inv.id}
									<span class="text-sm">Nr.</span>
									<input
										class="num h-8 w-32 rounded-sm border border-line-strong bg-panel px-2 text-sm outline-none focus:border-fg"
										bind:value={numberDraft}
										placeholder="z. B. 2026-53"
										aria-label="Rechnungsnummer"
										onkeydown={(e) => {
											if (e.key === 'Enter') saveInvoiceNumber(inv.id);
											if (e.key === 'Escape') cancelEditNumber();
										}}
									/>
									<Button size="xs" variant="solid" disabled={numberSaving} onclick={() => saveInvoiceNumber(inv.id)}>
										{numberSaving ? '…' : 'Speichern'}
									</Button>
									<Button size="xs" onclick={cancelEditNumber}>Abbrechen</Button>
								{:else}
									<span class="num text-sm font-semibold">Nr. {inv.invoice_number}</span>
									{#if inv.status !== 'paid'}
										<Button variant="ghost" size="icon-sm" aria-label="Rechnungsnummer korrigieren" title="Rechnungsnummer korrigieren" onclick={() => startEditNumber(inv)}>
											<Pencil size={13} />
										</Button>
									{/if}
								{/if}
								<span class="text-xs text-muted">
									{#if inv.invoice_type === 'full'}Vollrechnung{:else if inv.invoice_type === 'partial_first'}Anzahlung ({inv.partial_percent} %){:else}Restbetrag{/if}
								</span>
								<span class="num text-sm font-medium">{formatEuro(inv.total_brutto_cents)}</span>
							</div>
							<div class="flex flex-wrap items-center gap-1.5">
								<Badge tone={invoiceStatusTone(inv.status)}>{invoiceStatusLabel(inv.status)}</Badge>
								<Button size="xs" onclick={() => downloadInvoicePdf(inv)} title="PDF herunterladen"><Download size={13} /> PDF</Button>
								{#if inv.status !== 'sent' && inv.status !== 'paid'}
									<Button
										size="xs"
										variant="solid"
										disabled={!canSendInvoice(inv)}
										title={!canSendInvoice(inv) ? 'Erst nach Auftragsabschluss sendbar' : 'Rechnung senden'}
										onclick={() => sendInvoice(inv.id)}
									>
										<Send size={13} /> Senden
									</Button>
								{/if}
								{#if inv.status === 'sent'}
									<Button size="xs" onclick={() => markInvoicePaid(inv.id)}>Als bezahlt markieren</Button>
								{/if}
							</div>
						</div>

						<!-- Barzahlung: the PDF prints "in bar beglichen" instead of the bank details -->
						<div class="flex flex-col gap-2 px-3 py-2">
							<Check
								checked={isCashOpen(inv)}
								disabled={cashSaving[inv.id]}
								onchange={(e) => toggleCash(inv, (e.currentTarget as HTMLInputElement).checked)}
							>
								Barzahlung — Rechnung gilt als Quittung
							</Check>
							{#if isCashOpen(inv)}
								<div class="flex flex-wrap items-center gap-2 pl-6 text-[13px]">
									<label for="cash-date-{inv.id}" class="text-muted">Bezahlt am</label>
									<input
										id="cash-date-{inv.id}"
										type="date"
										class="h-8 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg"
										required
										value={cashDateDraft[inv.id] ?? inv.cash_paid_on ?? ''}
										oninput={(e) => (cashDateDraft[inv.id] = (e.currentTarget as HTMLInputElement).value)}
									/>
									<Button
										size="xs"
										variant="solid"
										disabled={cashSaving[inv.id] || !(cashDateDraft[inv.id] ?? inv.cash_paid_on)}
										onclick={() => saveCash(inv, true)}
									>
										{cashSaving[inv.id] ? '…' : 'Speichern'}
									</Button>
								</div>
							{/if}
						</div>

						{#if inv.invoice_type === 'full'}
							<div class="flex flex-col gap-2 px-3 py-2">
								<Check
									checked={isManualEditorOpen(inv)}
									disabled={inv.status === 'paid'}
									onchange={(e) => toggleManual(inv, (e.currentTarget as HTMLInputElement).checked)}
								>
									Manuelle Rechnung — Positionen frei bearbeiten (z. B. Stunden ausweisen)
								</Check>
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

						{#if inv.invoice_type !== 'partial_first' && !isManualEditorOpen(inv)}
							<div class="flex flex-col gap-2 px-3 py-2.5">
								{#if !editingExtras[inv.id]}
									<div class="flex items-center justify-between gap-2">
										<span class="label-xs text-faint">Zusatzleistungen</span>
										<Button size="xs" variant="ghost" onclick={() => startEditExtras(inv)}>Bearbeiten</Button>
									</div>
									{#if inv.extra_services.length > 0}
										<ul class="flex flex-col gap-1 text-[13px]">
											{#each inv.extra_services as extra, i (i)}
												<li class="flex justify-between gap-3">
													<span>{extra.description}</span>
													<span class="num">{formatEuro(extra.price_cents)}</span>
												</li>
											{/each}
										</ul>
									{:else}
										<p class="text-xs text-faint">Keine Zusatzleistungen</p>
									{/if}
								{:else}
									<div class="flex flex-col gap-2">
										{#each extrasDraft[inv.id] ?? [] as extra, idx (idx)}
											<div class="grid grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-2">
												<input
													type="text"
													placeholder="Beschreibung"
													aria-label="Beschreibung"
													class="h-8 min-w-0 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg"
													bind:value={extrasDraft[inv.id][idx].description}
												/>
												<input
													type="number"
													placeholder="Netto €"
													aria-label="Preis (Netto €)"
													class="num h-8 rounded-sm border border-line-strong bg-panel px-2 text-right text-[13px] outline-none focus:border-fg"
													value={(extrasDraft[inv.id][idx].price_cents / 100).toFixed(2)}
													onchange={(e) => {
														extrasDraft[inv.id][idx].price_cents = Math.round(parseFloat((e.target as HTMLInputElement).value) * 100);
													}}
												/>
												<Button variant="ghost" size="icon-sm" aria-label="Entfernen" onclick={() => removeExtraRow(inv.id, idx)}><X size={13} /></Button>
											</div>
										{/each}
										<div class="flex flex-wrap items-center justify-between gap-2">
											<Button size="xs" variant="ghost" onclick={() => addExtraRow(inv.id)}><Plus size={12} /> Hinzufügen</Button>
											<span class="flex gap-1.5">
												<Button
													size="xs"
													onclick={() => {
														editingExtras[inv.id] = false;
													}}>Abbrechen</Button
												>
												<Button size="xs" variant="solid" onclick={() => saveExtras(inv.id)}>Speichern</Button>
											</span>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</article>
				{/each}
			{/if}
		</div>
	</Panel>
{/if}
