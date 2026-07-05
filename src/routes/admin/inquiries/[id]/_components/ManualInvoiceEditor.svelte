<script lang="ts">
	import { apiPatch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { formatEuro } from '$lib/utils/format';
	import { Plus, X, Save } from 'lucide-svelte';

	/**
	 * A single hand-edited invoice line item as sent to the backend.
	 * `unit_price_cents` is netto — the invoice adds 19% MwSt on top.
	 */
	interface ManualLineItem {
		description: string;
		quantity: number;
		unit_price_cents: number;
		remark?: string | null;
	}

	/** Minimal invoice shape this editor needs from the parent. */
	interface InvoiceLike {
		id: string;
		is_manual: boolean;
		line_items: ManualLineItem[];
		total_netto_cents: number;
	}

	/**
	 * Manual invoice line-item editor ("Stunden ausweisen" for business customers).
	 *
	 * Called by: inquiries/[id]/+page.svelte (Rechnungen card, full invoices only).
	 * Purpose: Lets Alex fully edit an invoice's line items by hand — description,
	 *          Menge (e.g. 12,5 hours) and Einzelpreis (netto) — with live totals.
	 *          On save it PATCHes `{ line_items }`, switching the invoice into manual
	 *          mode so the server renders these lines instead of recomputing from the
	 *          offer. Returns the updated invoice via onSaved.
	 *
	 * @prop inquiryId - Parent inquiry UUID
	 * @prop invoice   - The full invoice being edited
	 * @prop onSaved   - Called with the updated invoice after a successful save
	 * @prop onCancel  - Called when the user cancels without saving
	 */
	interface Props {
		inquiryId: string;
		invoice: InvoiceLike;
		onSaved: (updated: InvoiceLike) => void;
		onCancel: () => void;
	}

	let { inquiryId, invoice, onSaved, onCancel }: Props = $props();

	/** UI draft row — prices held as strings so partial input (e.g. "45,") is allowed. */
	interface DraftRow {
		description: string;
		quantity: string;
		unitPriceEur: string;
	}

	/** Parse a German/English decimal string ("12,5" or "12.5") to a number, or 0. */
	function num(s: string): number {
		const v = parseFloat(s.replace(',', '.'));
		return isNaN(v) ? 0 : v;
	}

	function seedRows(): DraftRow[] {
		if (invoice.is_manual && invoice.line_items.length > 0) {
			return invoice.line_items.map((it) => ({
				description: it.description,
				quantity: String(it.quantity).replace('.', ','),
				unitPriceEur: (it.unit_price_cents / 100).toFixed(2).replace('.', ',')
			}));
		}
		// Not yet manual: seed one row carrying the current netto total as a starting
		// point Alex can rewrite into an hours breakdown.
		return [
			{
				description: '',
				quantity: '1',
				unitPriceEur: (invoice.total_netto_cents / 100).toFixed(2).replace('.', ',')
			}
		];
	}

	let rows = $state<DraftRow[]>(seedRows());
	let saving = $state(false);

	function addRow() {
		rows = [...rows, { description: '', quantity: '1', unitPriceEur: '' }];
	}

	function removeRow(idx: number) {
		rows = rows.filter((_, i) => i !== idx);
	}

	/** Netto cents for one row = round(Menge × Einzelpreis). */
	function rowNettoCents(r: DraftRow): number {
		return Math.round(num(r.quantity) * num(r.unitPriceEur) * 100);
	}

	const totalNettoCents = $derived(rows.reduce((sum, r) => sum + rowNettoCents(r), 0));
	const totalMwstCents = $derived(Math.round(totalNettoCents * 0.19));
	const totalBruttoCents = $derived(Math.round(totalNettoCents * 1.19));

	async function save() {
		const items: ManualLineItem[] = rows
			.filter((r) => r.description.trim() !== '')
			.map((r) => ({
				description: r.description.trim(),
				quantity: num(r.quantity),
				unit_price_cents: Math.round(num(r.unitPriceEur) * 100)
			}));

		if (items.length === 0) {
			showToast('Mindestens eine Position mit Beschreibung erforderlich', 'error');
			return;
		}
		if (items.length > 20) {
			showToast('Maximal 20 Positionen möglich', 'error');
			return;
		}

		saving = true;
		try {
			const updated = await apiPatch<InvoiceLike>(
				`/api/v1/inquiries/${inquiryId}/invoices/${invoice.id}`,
				{ line_items: items }
			);
			showToast('Manuelle Rechnung gespeichert', 'success');
			onSaved(updated);
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Speichern fehlgeschlagen';
			showToast(msg, 'error');
		} finally {
			saving = false;
		}
	}
</script>

<div class="manual-editor">
	<div class="manual-editor__head">
		<span class="col-desc">Beschreibung</span>
		<span class="col-qty">Menge</span>
		<span class="col-price">Einzelpreis (Netto)</span>
		<span class="col-total">Betrag</span>
		<span class="col-del"></span>
	</div>

	{#each rows as row, idx}
		<div class="manual-editor__row">
			<input
				type="text"
				class="me-input col-desc"
				placeholder="z.B. Umzugsarbeiten (Stunden)"
				bind:value={rows[idx].description}
			/>
			<input
				type="text"
				inputmode="decimal"
				class="me-input col-qty"
				placeholder="12,5"
				bind:value={rows[idx].quantity}
			/>
			<input
				type="text"
				inputmode="decimal"
				class="me-input col-price"
				placeholder="45,00"
				bind:value={rows[idx].unitPriceEur}
			/>
			<span class="col-total me-total">{formatEuro(rowNettoCents(row))}</span>
			<button class="btn-icon danger col-del" title="Position entfernen" onclick={() => removeRow(idx)}>
				<X size={13} />
			</button>
		</div>
	{/each}

	<button class="btn-link me-add" onclick={addRow}>
		<Plus size={12} /> Position hinzufügen
	</button>

	<div class="manual-editor__totals">
		<span>Netto <strong>{formatEuro(totalNettoCents)}</strong></span>
		<span>MwSt 19% <strong>{formatEuro(totalMwstCents)}</strong></span>
		<span>Brutto <strong>{formatEuro(totalBruttoCents)}</strong></span>
	</div>

	<div class="manual-editor__actions">
		<button class="btn btn-sm" onclick={onCancel} disabled={saving}>Abbrechen</button>
		<button class="btn btn-sm btn-primary" onclick={save} disabled={saving}>
			<Save size={13} />
			{saving ? 'Speichere...' : 'Speichern & PDF erzeugen'}
		</button>
	</div>
</div>

<style>
	.manual-editor {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-top: 0.5rem;
	}
	.manual-editor__head,
	.manual-editor__row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 4.5rem 7rem 5.5rem 1.6rem;
		gap: 0.4rem;
		align-items: center;
	}
	.manual-editor__head {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		opacity: 0.7;
	}
	.me-input {
		width: 100%;
		min-width: 0;
		padding: 0.3rem 0.45rem;
		border: 1px solid var(--dt-outline, #c4c7c5);
		border-radius: 6px;
		background: var(--dt-surface, #fff);
		color: var(--dt-on-surface, #191c1e);
		font-size: 0.85rem;
	}
	.col-qty,
	.col-price {
		text-align: right;
	}
	.me-total {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
	}
	.me-add {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.manual-editor__totals {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		justify-content: flex-end;
		padding-top: 0.35rem;
		border-top: 1px solid var(--dt-outline-variant, #e1e3e1);
		font-size: 0.85rem;
	}
	.manual-editor__actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	/* Phone: stack columns so the table doesn't overflow the card. */
	@media (max-width: 768px) {
		.manual-editor__head {
			display: none;
		}
		.manual-editor__row {
			grid-template-columns: 1fr 1fr;
			gap: 0.35rem 0.5rem;
			padding: 0.5rem;
			border: 1px solid var(--dt-outline-variant, #e1e3e1);
			border-radius: 8px;
		}
		.col-desc {
			grid-column: 1 / -1;
		}
		.col-total {
			text-align: left;
		}
		.col-del {
			justify-self: end;
		}
	}
</style>
