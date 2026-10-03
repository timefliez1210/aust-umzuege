<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiDownload, formatEuro, formatDate } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { Plus, X, GripVertical, Download, RotateCcw, FileOutput } from "lucide-svelte";
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
		isCustomLabel: boolean;
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
		costPerPersonHour = 18.5,
		hourlyFloor = null,
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
		costPerPersonHour?: number;
		hourlyFloor?: { break_even_cents: number; target_rate_cents: number; inaccurate: boolean } | null;
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

{#snippet euroInput(li: (typeof editLineItems)[number])}
	<input
		type="number"
		aria-label="Einzelpreis (EUR)"
		class="num h-8 w-24 rounded-sm border border-line bg-transparent px-2 text-right text-[13px] outline-none hover:border-line-strong focus:border-fg"
		min={0}
		step={0.5}
		value={li._editing ? li._priceText : (li.unitPriceCents / 100).toFixed(2)}
		oninput={(e) => {
			const t = e.target as HTMLInputElement;
			li._priceText = t.value;
			const v = parseFloat(t.value);
			if (!isNaN(v)) li.unitPriceCents = Math.round(v * 100);
		}}
		onfocus={() => {
			li._editing = true;
		}}
		onblur={() => {
			li._editing = false;
		}}
	/>
{/snippet}

{#snippet qtyRemark(li: (typeof editLineItems)[number])}
	<div class="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
		<input
			type="text"
			class="col-span-2 h-8 min-w-0 rounded-sm border border-line bg-transparent px-2 text-[13px] outline-none placeholder:text-faint hover:border-line-strong focus:border-fg sm:col-span-1"
			bind:value={li.remark}
			placeholder="Bemerkung"
			aria-label="Bemerkung"
		/>
		<span class="flex items-center gap-1.5 text-xs text-faint">
			<input
				type="number"
				aria-label="Menge"
				class="num h-8 w-16 rounded-sm border border-line bg-transparent px-2 text-right text-[13px] text-fg outline-none hover:border-line-strong focus:border-fg"
				min={0}
				step={1}
				bind:value={li.quantity}
			/>
			×
			{@render euroInput(li)}
			€
		</span>
		<span class="num min-w-24 text-right text-sm font-medium">{formatEuro(li.quantity * li.unitPriceCents)}</span>
	</div>
{/snippet}

<Panel title="Preisgestaltung" open={pricingOpen} onToggle={onTogglePricing}>
	<div class="flex flex-col gap-4">
		<PriceInput bind:bruttoCents={editBruttoCents} label="Gesamtpreis" />

		<div class="grid grid-cols-3 gap-3">
			<Field label="Helfer" for="persons"><Input id="persons" type="number" min={1} max={10} bind:value={editPersons} class="num" /></Field>
			<Field label="Stunden" for="hours">
				<Input id="hours" type="number" min={1} max={24} step={0.5} bind:value={editHours} class="num" />
			</Field>
			<Field label="Stundensatz (€)" for="rate">
				<Input
					id="rate"
					type="number"
					step={0.5}
					class="num"
					value={rateEditing ? rateText : (editRateCents / 100).toFixed(2)}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						rateText = target.value;
						const val = parseFloat(target.value);
						if (!isNaN(val)) editRateCents = Math.round(val * 100);
					}}
					onfocus={() => {
						rateEditing = true;
					}}
					onblur={() => {
						rateEditing = false;
					}}
				/>
			</Field>
		</div>

		<div class="flex flex-wrap items-center justify-between gap-2">
			<Button size="sm" variant="ghost" onclick={onBruttoChange}>Rate aus Gesamtpreis berechnen</Button>
			<span
				class="num text-sm font-medium {laborProfit < 0 ? 'text-danger' : 'text-ok'}"
				title="Marge auf die Arbeitsstunden: Personen × Stunden × (Stundensatz − {costPerPersonHour.toFixed(2)} € Lohnkosten/h)"
				>Marge {laborProfit.toFixed(2)} €</span
			>
		</div>
		{#if hourlyFloor && editRateCents < hourlyFloor.target_rate_cents}
			{@const below = editRateCents < hourlyFloor.break_even_cents}
			<p class="text-xs {below ? 'text-danger' : 'text-warn'}">
				{below ? 'Unter dem Vollkostensatz' : 'Unter dem Ziel-Stundensatz'}
				({((below ? hourlyFloor.break_even_cents : hourlyFloor.target_rate_cents) / 100).toFixed(2)} €/h netto{hourlyFloor.inaccurate
					? ', vorläufig'
					: ''}) — {below
					? 'jede verkaufte Stunde deckt Löhne, Miete und Fixkosten nicht.'
					: 'deckt die Kosten, aber nicht den Zielgewinn.'}
			</p>
		{/if}

		<Field
			label="KVA-Überschrift überschreiben"
			for="kva-headline"
			hint="Leer lassen für Standard. Praktisch für Umzugshelfer, Lagerung u. ä. ohne Volumenangabe."
		>
			<Input
				id="kva-headline"
				bind:value={editHeadlineOverride}
				placeholder={editVolume != null ? `Umzugspauschale ${editVolume.toFixed(1)} m³` : 'Umzugspauschale'}
				onblur={onHeadlineBlur}
			/>
		</Field>
	</div>
</Panel>

<Panel title="Positionen" open={positionsOpen} onToggle={onTogglePositions} bodyClass="px-0 py-0">
	{#snippet actions()}
		<Button size="sm" onclick={addLineItem}><Plus size={14} /> Position</Button>
	{/snippet}
	<div role="list">
		{#each editLineItems as li, idx (li._id)}
			<div
				class="flex gap-2 border-b border-line py-3 pr-4 pl-2 transition-colors {dragOverIdx === idx
					? 'bg-accent/10 shadow-[inset_0_2px_0_var(--accent)]'
					: ''} {dragIdx === idx ? 'opacity-40' : ''}"
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
					class="flex w-5 shrink-0 cursor-grab items-start justify-center pt-1.5 text-faint hover:text-fg active:cursor-grabbing"
					title="Ziehen zum Sortieren"
					onmousedown={() => armDrag(idx)}
					onmouseup={disarmDrag}
				>
					<GripVertical size={14} />
				</span>

				<div class="min-w-0 flex-1">
					{#if li.kind === 'labor'}
						<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<span class="text-sm font-medium">{editPersons} Umzugshelfer</span>
							<span class="num flex items-baseline gap-3 text-[13px] text-muted">
								{editHours} Std. × {(editRateCents / 100).toFixed(2)} €
								<span class="min-w-24 text-right text-sm font-medium text-fg">{formatEuro(laborCents)}</span>
							</span>
						</div>
					{:else if li.kind === 'insurance'}
						<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<span class="text-sm font-medium">Nürnbergerversicherung</span>
							<span class="flex items-center gap-2 text-[13px] text-muted">
								{li.remark || 'Deckungssumme: 620,00 Euro / m³'}
								<span class="min-w-24 text-right text-sm text-fg">inklusive</span>
								<Button variant="ghost" size="icon-sm" onclick={() => removeLineItem(idx)} aria-label="Versicherung entfernen"
									><X size={14} /></Button
								>
							</span>
						</div>
					{:else if li.kind === 'fahrt'}
						<span class="text-sm font-medium">Fahrkostenpauschale</span>
						{@render qtyRemark(li)}
					{:else}
						<div class="flex items-center gap-2">
							<select
								bind:value={li.label}
								onchange={() => onCustomLabelChange(idx)}
								aria-label="Position"
								class="h-8 min-w-0 flex-1 rounded-sm border border-line bg-panel px-2 text-sm font-medium text-fg outline-none hover:border-line-strong focus:border-fg"
							>
								<option value="" disabled>Position wählen…</option>
								{#each customLabelOptions as opt (opt)}
									<option value={opt}>{opt}</option>
								{/each}
							</select>
							<Button variant="ghost" size="icon-sm" onclick={() => removeLineItem(idx)} aria-label="Entfernen"><X size={14} /></Button>
						</div>
						{#if li.isCustomLabel}
							<input
								type="text"
								class="mt-2 h-8 w-full rounded-sm border border-line bg-transparent px-2 text-sm outline-none focus:border-fg"
								bind:value={li.label}
								placeholder="Bezeichnung"
								aria-label="Bezeichnung"
							/>
						{/if}
						{@render qtyRemark(li)}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if !editLineItems.some((li) => li.kind === 'insurance')}
		<div class="px-4 pt-2">
			<Button size="sm" variant="ghost" onclick={addInsurance}><Plus size={14} /> Versicherung hinzufügen</Button>
		</div>
	{/if}

	<dl class="num flex flex-col gap-1 px-4 pt-3 pb-4 text-sm">
		<div class="flex justify-between text-muted"><dt>Netto</dt><dd>{formatEuro(calculatedNettoCents)}</dd></div>
		<div class="flex justify-between text-base font-semibold">
			<dt>Brutto <span class="text-xs font-normal text-faint">inkl. 19 % MwSt.</span></dt>
			<dd>{formatEuro(calculatedBruttoCents)}</dd>
		</div>
	</dl>
</Panel>

{#if offer}
	<Panel title="Angebot" open={offerOpen} onToggle={onToggleOffer} class="lg:col-span-2">
		{#snippet actions()}
			<Button size="sm" onclick={downloadPdf} disabled={downloadingPdf}>
				<Download size={14} />
				{downloadingPdf ? 'Wird geladen …' : 'PDF herunterladen'}
			</Button>
		{/snippet}
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
			<span class="num text-sm text-muted">{formatDate(offer.created_at)}</span>
			<span class="num text-base font-semibold">{offer.total_brutto_cents != null ? formatEuro(offer.total_brutto_cents) : '—'}</span>
			<StatusBadge status={offer.status} />
		</div>
	</Panel>
{/if}

<div class="lg:col-span-2">
	{#if latestOffer}
		<Button variant="solid" size="lg" class="w-full" onclick={reEstimateOffer}><RotateCcw size={18} /> Neu berechnen</Button>
	{:else}
		<Button variant="accent" size="lg" class="w-full" onclick={generateOffer}><FileOutput size={18} /> Angebot erstellen</Button>
	{/if}
</div>
