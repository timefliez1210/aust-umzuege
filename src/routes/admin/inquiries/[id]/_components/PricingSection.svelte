<script lang="ts">
	import { apiDownload, formatEuro, formatDate } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { ChevronRight, Plus, X, GripVertical, Download, RotateCcw, FileOutput } from "lucide-svelte";
	import PriceInput from "$lib/components/admin/PriceInput.svelte";
	import StatusBadge from "$lib/components/admin/StatusBadge.svelte";

	type ItemKind = 'labor' | 'fahrt' | 'insurance' | 'item';

	interface EditLineItem {
		_id: number;
		kind: ItemKind;
		label: string;
		remark: string;
		quantity: number;
		unitPriceCents: number;
		_priceText: string;
		_editing: boolean;
	}

	interface OfferSnapshot {
		id: string;
		offer_number: string | null;
		status: string;
		total_brutto_cents: number;
		created_at: string;
	}

	interface CustomerSnapshot {
		name: string | null;
		last_name: string | null;
	}

	let {
		// Pricing fields (owned at page level — shared with header generateOffer/reEstimateOffer)
		editBruttoCents = $bindable(),
		editPersons = $bindable(),
		editHours = $bindable(),
		editRateCents = $bindable(),
		rateText = $bindable(),
		rateEditing = $bindable(),
		editHeadlineOverride = $bindable(),
		editVolume,
		laborProfit,
		laborCents,
		calculatedNettoCents,
		calculatedBruttoCents,
		// Line items (owned at page level — serializeLineItems() is read by generateOffer)
		editLineItems = $bindable(),
		dragIdx = $bindable(),
		dragOverIdx = $bindable(),
		armedIdx = $bindable(),
		customLabelOptions,
		// Offer / inquiry
		inquiryId,
		customer,
		offer,
		latestOffer,
		// Card open state
		pricingOpen = $bindable(),
		positionsOpen = $bindable(),
		offerOpen = $bindable(),
		onTogglePricing,
		onTogglePositions,
		onToggleOffer,
		// Callbacks for page-owned logic
		onBruttoChange,
		addLineItem,
		removeLineItem,
		addInsurance,
		onCustomLabelChange,
		armDrag,
		disarmDrag,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onDragEnd,
		onHeadlineBlur,
		generateOffer,
		reEstimateOffer,
	}: {
		editBruttoCents: number;
		editPersons: number;
		editHours: number;
		editRateCents: number;
		rateText: string;
		rateEditing: boolean;
		editHeadlineOverride: string;
		editVolume: number | null;
		laborProfit: number;
		laborCents: number;
		calculatedNettoCents: number;
		calculatedBruttoCents: number;
		editLineItems: EditLineItem[];
		dragIdx: number | null;
		dragOverIdx: number | null;
		armedIdx: number | null;
		customLabelOptions: string[];
		inquiryId: string;
		customer: CustomerSnapshot | null;
		offer: OfferSnapshot | null;
		latestOffer: OfferSnapshot | null;
		pricingOpen: boolean;
		positionsOpen: boolean;
		offerOpen: boolean;
		onTogglePricing: () => void;
		onTogglePositions: () => void;
		onToggleOffer: () => void;
		onBruttoChange: () => void;
		addLineItem: () => void;
		removeLineItem: (idx: number) => void;
		addInsurance: () => void;
		onCustomLabelChange: (idx: number) => void;
		armDrag: (idx: number) => void;
		disarmDrag: () => void;
		onDragStart: (e: DragEvent, idx: number) => void;
		onDragOver: (e: DragEvent, idx: number) => void;
		onDragLeave: () => void;
		onDrop: (e: DragEvent, idx: number) => void;
		onDragEnd: () => void;
		onHeadlineBlur: () => void | Promise<void>;
		generateOffer: () => void | Promise<void>;
		reEstimateOffer: () => void | Promise<void>;
	} = $props();

	// PDF download state — local to this card, not needed elsewhere on the page.
	let downloadingPdf = $state(false);

	/**
	 * Downloads the offer PDF for the current inquiry via authenticated fetch.
	 *
	 * Called by: Template (onclick on the "PDF herunterladen" button in the offer card)
	 * Purpose: Uses apiDownload so the Authorization header is included — a plain <a href> tag
	 *          cannot attach the Bearer token required by the protected endpoint.
	 *          Calls GET /api/v1/inquiries/{id}/pdf and triggers a browser file download.
	 *
	 * @returns void (side-effect: triggers browser PDF download, shows error toast on failure)
	 */
	async function downloadPdf() {
		downloadingPdf = true;
		try {
			// Build "{seq}-{year} {last_name}.pdf", e.g. "1113-2026 Spatz.pdf"
			// offer_number format from backend: "{year}-{seq:04}" e.g. "2026-1113"
			const offerNum = offer?.offer_number ?? '';
			const [year, seqStr] = offerNum.includes('-') ? offerNum.split('-') : ['', offerNum];
			const seq = seqStr ? String(parseInt(seqStr, 10)) : inquiryId.slice(0, 8);
			const lastName = customer?.last_name ?? customer?.name?.split(' ').pop() ?? 'Angebot';
			const filename = year ? `${seq}-${year} ${lastName}.pdf` : `angebot_${offerNum || inquiryId.slice(0, 8)}.pdf`;
			await apiDownload(
				`/api/v1/inquiries/${inquiryId}/pdf`,
				filename,
			);
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			downloadingPdf = false;
		}
	}
</script>

<!-- Pricing Editor -->
<div class="card" class:card--collapsed={!pricingOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onTogglePricing} aria-expanded={pricingOpen}>
			<span class="card-toggle-chev" class:open={pricingOpen}><ChevronRight size={16} /></span>
			<h3>Preisgestaltung</h3>
		</button>
	</div>
	{#if pricingOpen}
	<div class="pricing-section">
		<PriceInput
			bind:bruttoCents={editBruttoCents}
			label="Gesamtpreis"
		/>

		<div class="pricing-fields">
			<div class="field">
				<label for="persons">Helfer</label>
				<input
					id="persons"
					type="number"
					min={1}
					max={10}
					bind:value={editPersons}
				/>
			</div>
			<div class="field">
				<label for="hours">Stunden</label>
				<input
					id="hours"
					type="number"
					min={1}
					max={24}
					step={0.5}
					bind:value={editHours}
				/>
			</div>
			<div class="field">
				<label for="rate">Stundensatz (EUR)</label>
				<input
					id="rate"
					type="number"
					step={0.5}
					value={rateEditing
						? rateText
						: (editRateCents / 100).toFixed(2)}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						rateText = target.value;
						const val = parseFloat(target.value);
						if (!isNaN(val))
							editRateCents = Math.round(val * 100);
					}}
					onfocus={() => {
						rateEditing = true;
					}}
					onblur={() => {
						rateEditing = false;
					}}
				/>
			</div>
		</div>

		<button class="btn-link" onclick={onBruttoChange}>
			Rate aus Gesamtpreis berechnen
		</button>
		<span class="labor-profit" class:negative={laborProfit < 0}
			>{laborProfit.toFixed(2)} &euro;</span
		>

		<div class="field" style="margin-top: 0.75rem">
			<label for="kva-headline">KVA-Überschrift überschreiben</label>
			<input
				id="kva-headline"
				type="text"
				bind:value={editHeadlineOverride}
				placeholder={editVolume != null ? `Umzugspauschale ${editVolume.toFixed(1)} m³` : "Umzugspauschale"}
				onblur={onHeadlineBlur}
			/>
			<small class="hint">Leer lassen für Standard. Praktisch für Umzugshelfer, Lagerung u.ä. ohne Volumenangabe.</small>
		</div>
	</div>
	{/if}
</div>

<!-- Line Items (Editable) -->
<div class="card" class:card--collapsed={!positionsOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onTogglePositions} aria-expanded={positionsOpen}>
			<span class="card-toggle-chev" class:open={positionsOpen}><ChevronRight size={16} /></span>
			<h3>Positionen</h3>
		</button>
		{#if positionsOpen}
			<div class="header-actions">
				<button class="btn btn-sm" onclick={addLineItem}>
					<Plus size={14} />
					Position
				</button>
			</div>
		{/if}
	</div>
	{#if positionsOpen}
	<div class="line-items">
		{#each editLineItems as li, idx (li._id)}
		<div
			class="line-item editable"
			class:drag-over={dragOverIdx === idx}
			class:dragging={dragIdx === idx}
			draggable={armedIdx === idx}
			role="listitem"
			ondragstart={(e) => onDragStart(e, idx)}
			ondragover={(e) => onDragOver(e, idx)}
			ondragleave={onDragLeave}
			ondrop={(e) => onDrop(e, idx)}
			ondragend={onDragEnd}
		>
			<span
				role="button"
				tabindex="-1"
				aria-label="Ziehen zum Sortieren"
				class="drag-handle"
				title="Ziehen zum Sortieren"
				onmousedown={() => armDrag(idx)}
				onmouseup={disarmDrag}
			>
				<GripVertical size={14} />
			</span>

			{#if li.kind === 'labor'}
				<div class="li-fixed">
					<span class="li-name">{editPersons} Umzugshelfer</span>
					<div class="li-detail">
						<span class="li-qty">{editHours} Std.</span>
						<span class="li-unit">&times; {(editRateCents / 100).toFixed(2)} EUR</span>
						<span class="li-total">{formatEuro(laborCents)}</span>
					</div>
				</div>
			{:else if li.kind === 'insurance'}
				<div class="li-fixed">
					<span class="li-name">Nürnbergerversicherung</span>
					<div class="li-detail">
						<span class="li-qty">{li.remark || 'Deckungssumme: 620,00 Euro / m³'}</span>
						<span class="li-total">inklusive</span>
					</div>
				</div>
				<button class="del-btn" onclick={() => removeLineItem(idx)} title="Versicherung entfernen"><X size={14} /></button>
			{:else if li.kind === 'fahrt'}
				<div class="li-edit-top"><span class="li-name">Fahrkostenpauschale</span></div>
				<div class="li-edit-bottom">
					<input type="text" class="edit-li-remark" bind:value={li.remark} placeholder="Bemerkung" />
					<input type="number" class="edit-li-qty" min={0} step={1} bind:value={li.quantity} />
					<span class="li-times">&times;</span>
					<input type="number" class="edit-li-price" min={0} step={0.5} value={li._editing ? li._priceText : (li.unitPriceCents / 100).toFixed(2)} oninput={(e) => { const t = e.target as HTMLInputElement; li._priceText = t.value; const v = parseFloat(t.value); if (!isNaN(v)) li.unitPriceCents = Math.round(v * 100); }} onfocus={() => { li._editing = true; }} onblur={() => { li._editing = false; }} />
					<span class="li-eur">EUR</span>
					<span class="li-total">{formatEuro(li.quantity * li.unitPriceCents)}</span>
				</div>
			{:else}
				<div class="li-edit-top">
					<select bind:value={li.label} onchange={() => onCustomLabelChange(idx)}>
						<option value="" disabled>Position wählen…</option>
						{#each customLabelOptions as opt}
							<option value={opt}>{opt}</option>
						{/each}
					</select>
					{#if li.label === '' || li.label === 'Sonstiges'}
						<input type="text" class="edit-li-label" bind:value={li.label} placeholder="Bezeichnung" />
					{/if}
					<button class="del-btn" onclick={() => removeLineItem(idx)} title="Entfernen"><X size={14} /></button>
				</div>
				<div class="li-edit-bottom">
					<input type="text" class="edit-li-remark" bind:value={li.remark} placeholder="Bemerkung" />
					<input type="number" class="edit-li-qty" min={0} step={1} bind:value={li.quantity} />
					<span class="li-times">&times;</span>
					<input type="number" class="edit-li-price" min={0} step={0.5} value={li._editing ? li._priceText : (li.unitPriceCents / 100).toFixed(2)} oninput={(e) => { const t = e.target as HTMLInputElement; li._priceText = t.value; const v = parseFloat(t.value); if (!isNaN(v)) li.unitPriceCents = Math.round(v * 100); }} onfocus={() => { li._editing = true; }} onblur={() => { li._editing = false; }} />
					<span class="li-eur">EUR</span>
					<span class="li-total">{formatEuro(li.quantity * li.unitPriceCents)}</span>
				</div>
			{/if}
		</div>
	{/each}

	{#if !editLineItems.some((li) => li.kind === 'insurance')}
		<button class="btn-link" onclick={addInsurance}><Plus size={14} /> Versicherung hinzufügen</button>
	{/if}

		<div class="line-item total">
			<span class="li-name">Netto</span>
			<span class="li-total"
				>{formatEuro(calculatedNettoCents)}</span
			>
		</div>
		<div class="line-item total grand">
			<span class="li-name">Brutto (inkl. 19% MwSt.)</span>
			<span class="li-total"
				>{formatEuro(calculatedBruttoCents)}</span
			>
		</div>
	</div>
	{/if}
</div>

<!-- Linked Offer -->
{#if offer}
	<div class="card full-width" class:card--collapsed={!offerOpen}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onToggleOffer} aria-expanded={offerOpen}>
				<span class="card-toggle-chev" class:open={offerOpen}><ChevronRight size={16} /></span>
				<h3>Angebot</h3>
			</button>
			{#if offerOpen}
				<button
					class="btn btn-sm"
					onclick={downloadPdf}
					disabled={downloadingPdf}
				>
					<Download size={14} />
					{downloadingPdf
						? "Wird geladen..."
						: "PDF herunterladen"}
				</button>
			{/if}
		</div>
		{#if offerOpen}
		<div class="offers-list">
			<div class="offer-row">
				<span class="offer-date"
					>{formatDate(offer.created_at)}</span
				>
				<span class="offer-price"
					>{offer.total_brutto_cents != null
						? formatEuro(offer.total_brutto_cents)
						: "—"}</span
				>
				<StatusBadge status={offer.status} />
			</div>
		</div>
		{/if}
	</div>
{/if}

{#if latestOffer}
	<button class="btn-generate-bottom" onclick={reEstimateOffer}>
		<RotateCcw size={20} />
		Neu berechnen
	</button>
{:else}
	<button class="btn-generate-bottom" onclick={generateOffer}>
		<FileOutput size={20} />
		Angebot erstellen
	</button>
{/if}

<style>
	.pricing-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.pricing-fields {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.75rem;
	}

	.labor-profit {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		font-family: "JetBrains Mono", "Fira Code", monospace;
	}

	.labor-profit.negative {
		color: var(--dt-secondary);
	}

	/* Line Items */
	.line-items {
		display: flex;
		flex-direction: column;
	}

	.line-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 0;
		border-bottom: 1px solid var(--dt-surface-container);
	}

	.line-item.total {
		border-bottom: none;
		border-top: 1px solid var(--dt-outline-variant);
		padding-top: 0.75rem;
	}

	.line-item.grand {
		border-top: none;
		padding-top: 0.25rem;
	}

	.line-item.grand .li-name,
	.line-item.grand .li-total {
		font-size: 1rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.li-name {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.li-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.li-qty {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.li-unit {
		font-size: 0.8125rem;
		color: var(--dt-outline-variant);
	}

	.li-total {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		min-width: 80px;
		text-align: right;
		font-family: "JetBrains Mono", "Fira Code", monospace;
	}

	.offers-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.offer-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		text-decoration: none;
		transition: background var(--dt-transition);
	}

	.offer-row:hover {
		background: var(--dt-surface-container-low);
	}

	.offer-date {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.offer-price {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		flex: 1;
	}

	/* Editable line items */
	.line-item.editable {
		padding: 0.5rem 0;
		padding-left: 1.5rem;
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.375rem;
		transition: background var(--dt-transition), opacity var(--dt-transition);
		border-radius: var(--dt-radius-sm);
	}

	.line-item.editable.dragging {
		opacity: 0.4;
	}

	.line-item.editable.drag-over {
		background: var(--dt-surface-container-high);
		box-shadow: inset 0 2px 0 0 var(--dt-primary);
	}

	.drag-handle {
		position: absolute;
		left: 0;
		top: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--dt-on-surface-variant);
		cursor: grab;
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.drag-handle:hover {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface);
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.li-fixed {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex: 1;
	}

	.li-fixed .li-detail {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.li-edit-top {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.li-edit-top select {
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		min-width: 140px;
		transition: background var(--dt-transition);
	}

	.li-edit-top select:focus {
		background: var(--dt-surface-container-lowest);
		outline: 2px solid var(--dt-primary);
	}

	.li-edit-bottom {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.edit-li-qty,
	.edit-li-price {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		width: 70px;
		text-align: right;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-qty:focus,
	.edit-li-price:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-li-label {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		flex: 1;
		min-width: 100px;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-label:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-li-remark {
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		outline: none;
		flex: 1;
		min-width: 80px;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-li-remark:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.li-times {
		color: var(--dt-outline-variant);
		font-size: 0.8125rem;
	}

	.li-eur {
		color: var(--dt-on-surface-variant);
		font-size: 0.75rem;
	}

	.btn-generate-bottom {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		border: none;
		border-radius: var(--dt-radius-lg);
		cursor: pointer;
		box-shadow: var(--dt-shadow-ambient);
		transition: opacity var(--dt-transition);
	}

	.btn-generate-bottom:hover {
		opacity: 0.88;
	}

	@media (max-width: 768px) {
		.pricing-fields {
			grid-template-columns: 1fr;
		}

		.li-edit-top select {
			min-width: 0;
			flex: 1;
		}

		.edit-li-qty,
		.edit-li-price {
			width: 60px;
		}

		.line-items {
			max-width: 100%;
			overflow-x: auto;
		}
	}
</style>
