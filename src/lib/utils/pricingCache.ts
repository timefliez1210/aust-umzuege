/**
 * Pricing cache — the admin's unsaved KVA inputs, parked on `inquiries.custom_fields`.
 *
 * Used by: admin/inquiries/[id]/+page.svelte
 * Purpose: An inquiry with no offer yet has nowhere to persist the pricing the admin
 *          is working on, so a reload (or a failed offer generation) used to discard
 *          it and fall back to the floor/elevator heuristic (feedback 10d9cc36).
 *          These helpers define the shape that goes into `custom_fields.cached_pricing`
 *          and read it back, so the write and read sides cannot drift apart.
 *
 * Once an offer exists the offer is the source of truth and the cache is cleared —
 * see `shouldCachePricing`.
 */

/** Line-item kinds the KVA editor distinguishes. */
export type ItemKind = 'labor' | 'fahrt' | 'insurance' | 'item';

/** A line item as persisted in the cache — prices in **Euro**, matching the offer API. */
export interface CachedLineItem {
	description: string;
	quantity: number;
	unit_price: number;
	remark?: string;
}

/** The full cached pricing payload stored under `custom_fields.cached_pricing`. */
export interface CachedPricing {
	persons: number;
	hours: number;
	rate_cents: number;
	brutto_cents: number;
	line_items: CachedLineItem[];
}

/** Pricing values held in the editor — prices in **cents**, as the UI works in cents. */
export interface PricingInputs {
	persons: number;
	hours: number;
	rateCents: number;
	bruttoCents: number;
}

/** Defaults applied when a cached field is missing, so a partial cache still loads. */
export const PRICING_DEFAULTS: PricingInputs = {
	persons: 2,
	hours: 3,
	rateCents: 3000,
	bruttoCents: 0,
};

/**
 * Classifies a line item by its label.
 *
 * Purpose: The editor treats labour, travel and insurance rows specially (they survive
 *          a quantity of 0 and bind to the persons/rate controls). After a reload only
 *          the description survives, so the kind has to be recoverable from it.
 *
 * Note the labour match is a suffix, not equality: `serializeLineItems` rewrites labour
 * rows as "3 Umzugshelfer", so the person count is part of the description.
 */
export function classifyKind(label: string): ItemKind {
	if (label === 'Fahrkostenpauschale') return 'fahrt';
	if (label === 'Nürnbergerversicherung') return 'insurance';
	if (label.endsWith('Umzugshelfer')) return 'labor';
	return 'item';
}

/**
 * Whether pricing should be cached for this inquiry.
 *
 * Caching is only meaningful before an offer exists; afterwards the offer carries the
 * agreed numbers and a stale cache could resurface superseded values.
 */
export function shouldCachePricing(hasOffer: boolean): boolean {
	return !hasOffer;
}

/**
 * Reads a cached pricing payload back into editor values.
 *
 * @param raw - `custom_fields.cached_pricing`, which may be absent, null, or malformed
 * @returns the restored inputs, or `null` when there is nothing usable to restore
 *          (the caller then falls back to the floor/elevator heuristic)
 */
export function restorePricingInputs(raw: unknown): PricingInputs | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const c = raw as Partial<CachedPricing>;
	return {
		persons: c.persons ?? PRICING_DEFAULTS.persons,
		hours: c.hours ?? PRICING_DEFAULTS.hours,
		rateCents: c.rate_cents ?? PRICING_DEFAULTS.rateCents,
		bruttoCents: c.brutto_cents ?? PRICING_DEFAULTS.bruttoCents,
	};
}

/**
 * Reads the cached line items back into editor rows.
 *
 * Converts `unit_price` (Euro) back to cents — the inverse of the serialisation done
 * when saving. Returns an empty array when there is nothing cached, which the caller
 * treats as "recompute the rows from the notes".
 */
export function restoreCachedLineItems(
	raw: unknown,
): Array<{ kind: ItemKind; label: string; quantity: number; unitPriceCents: number; remark: string }> {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
	const items = (raw as Partial<CachedPricing>).line_items;
	if (!Array.isArray(items)) return [];
	return items.map((li) => ({
		kind: classifyKind(li.description),
		label: li.description,
		quantity: li.quantity,
		unitPriceCents: Math.round((li.unit_price ?? 0) * 100),
		remark: li.remark ?? '',
	}));
}

/**
 * Builds the `custom_fields` patch body for an inquiry save.
 *
 * Purpose: `PATCH /inquiries/{id}` replaces `custom_fields` wholesale, so the existing
 *          object must be spread through — dropping it would silently discard sibling
 *          keys such as the volume/item list written by the submission handlers.
 *
 * @param existing - the inquiry's current `custom_fields`
 * @param headlineOverride - the A29 headline override, or null to clear it
 * @param pricing - the pricing payload to cache, or null once an offer exists
 */
export function buildCustomFieldsPatch(
	existing: Record<string, unknown> | null | undefined,
	headlineOverride: string | null,
	pricing: CachedPricing | null,
): Record<string, unknown> {
	return {
		...(existing ?? {}),
		offer_headline_override: headlineOverride,
		cached_pricing: pricing,
	};
}
