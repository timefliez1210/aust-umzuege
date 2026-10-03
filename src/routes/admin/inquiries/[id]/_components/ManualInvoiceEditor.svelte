<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
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

<div class="flex flex-col gap-2">
	<div class="label-xs hidden grid-cols-[minmax(0,1fr)_80px_120px_100px_32px] gap-2 text-faint sm:grid">
		<span>Beschreibung</span><span class="text-right">Menge</span><span class="text-right">Einzelpreis (netto)</span><span
			class="text-right">Betrag</span
		><span></span>
	</div>

	{#each rows as row, idx (idx)}
		<div class="grid grid-cols-[minmax(0,1fr)_32px] gap-2 sm:grid-cols-[minmax(0,1fr)_80px_120px_100px_32px] sm:items-center">
			<input
				type="text"
				class="h-8 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg min-w-0"
				placeholder="z. B. Umzugsarbeiten (Stunden)"
				aria-label="Beschreibung"
				bind:value={rows[idx].description}
			/>
			<Button variant="ghost" size="icon-sm" class="sm:order-last" aria-label="Position entfernen" onclick={() => removeRow(idx)}><X size={13} /></Button>
			<div class="col-span-2 grid grid-cols-3 gap-2 sm:contents">
				<input type="text" inputmode="decimal" class="h-8 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg num text-right" placeholder="12,5" aria-label="Menge" bind:value={rows[idx].quantity} />
				<input
					type="text"
					inputmode="decimal"
					class="h-8 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg num text-right"
					placeholder="45,00"
					aria-label="Einzelpreis (netto)"
					bind:value={rows[idx].unitPriceEur}
				/>
				<span class="num self-center text-right text-[13px] font-medium">{formatEuro(rowNettoCents(row))}</span>
			</div>
		</div>
	{/each}

	<Button size="xs" variant="ghost" class="self-start" onclick={addRow}><Plus size={12} /> Position hinzufügen</Button>

	<div class="num flex flex-wrap justify-end gap-x-5 gap-y-1 border-t border-line pt-2 text-[13px] text-muted">
		<span>Netto <strong class="text-fg">{formatEuro(totalNettoCents)}</strong></span>
		<span>MwSt 19 % <strong class="text-fg">{formatEuro(totalMwstCents)}</strong></span>
		<span>Brutto <strong class="text-fg">{formatEuro(totalBruttoCents)}</strong></span>
	</div>

	<div class="flex justify-end gap-2">
		<Button size="sm" onclick={onCancel} disabled={saving}>Abbrechen</Button>
		<Button size="sm" variant="solid" onclick={save} disabled={saving}>
			<Save size={13} />
			{saving ? 'Speichere …' : 'Speichern & PDF erzeugen'}
		</Button>
	</div>
</div>
