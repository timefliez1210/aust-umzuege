import { describe, it, expect } from 'vitest';
import {
	classifyKind,
	shouldCachePricing,
	restorePricingInputs,
	restoreCachedLineItems,
	buildCustomFieldsPatch,
	PRICING_DEFAULTS,
	type CachedLineItem,
} from './pricingCache';

/**
 * Mirrors `serializeLineItems()` in admin/inquiries/[id]/+page.svelte so the
 * round-trip can be exercised without mounting the page. Kept deliberately close
 * to the original: labour rows are re-described with the current person count.
 */
function serialize(
	items: Array<{ kind: string; label: string; quantity: number; unitPriceCents: number; remark?: string }>,
	persons: number,
): CachedLineItem[] {
	return items
		.filter((li) => li.kind === 'labor' || li.kind === 'fahrt' || li.kind === 'insurance' || li.quantity > 0)
		.map((li) => ({
			description: li.kind === 'labor' ? `${persons} Umzugshelfer` : li.label,
			quantity: li.quantity,
			unit_price: li.unitPriceCents / 100,
			...(li.remark ? { remark: li.remark } : {}),
		}));
}

describe('classifyKind', () => {
	it('recovers the labour row after serialisation renamed it with the person count', () => {
		// serializeLineItems rewrites labour rows as "<n> Umzugshelfer". If this stopped
		// matching, a reloaded labour row would degrade to a plain item and silently
		// detach from the persons/rate controls.
		expect(classifyKind('3 Umzugshelfer')).toBe('labor');
		expect(classifyKind('12 Umzugshelfer')).toBe('labor');
	});

	it('classifies the fixed-label special rows', () => {
		expect(classifyKind('Fahrkostenpauschale')).toBe('fahrt');
		expect(classifyKind('Nürnbergerversicherung')).toBe('insurance');
	});

	it('treats everything else as a plain item', () => {
		expect(classifyKind('Halteverbotszone')).toBe('item');
		expect(classifyKind('')).toBe('item');
	});

	it('does not mistake a custom label merely containing the word for a labour row', () => {
		expect(classifyKind('Umzugshelfer Zuschlag Samstag')).toBe('item');
	});
});

describe('shouldCachePricing', () => {
	it('caches while the inquiry has no offer', () => {
		expect(shouldCachePricing(false)).toBe(true);
	});

	it('stops caching once an offer exists, so stale values cannot resurface', () => {
		expect(shouldCachePricing(true)).toBe(false);
	});
});

describe('restorePricingInputs', () => {
	it('restores every field from a full cache', () => {
		const restored = restorePricingInputs({
			persons: 4,
			hours: 6,
			rate_cents: 3500,
			brutto_cents: 99960,
			line_items: [],
		});
		expect(restored).toEqual({ persons: 4, hours: 6, rateCents: 3500, bruttoCents: 99960 });
	});

	it('returns null when there is nothing cached, so the caller falls back to the heuristic', () => {
		expect(restorePricingInputs(undefined)).toBeNull();
		expect(restorePricingInputs(null)).toBeNull();
	});

	it('returns null for malformed caches rather than throwing', () => {
		// custom_fields is free-form JSONB — a non-object here must not break the page.
		expect(restorePricingInputs('nonsense')).toBeNull();
		expect(restorePricingInputs(42)).toBeNull();
		expect(restorePricingInputs([1, 2, 3])).toBeNull();
	});

	it('fills missing fields from the defaults so a partial cache still loads', () => {
		expect(restorePricingInputs({ persons: 5 })).toEqual({
			persons: 5,
			hours: PRICING_DEFAULTS.hours,
			rateCents: PRICING_DEFAULTS.rateCents,
			bruttoCents: PRICING_DEFAULTS.bruttoCents,
		});
	});

	it('preserves a zero rate instead of substituting the default', () => {
		// ?? must be used rather than ||, otherwise a deliberate 0 would silently
		// become 30,00 € on the next reload.
		expect(restorePricingInputs({ rate_cents: 0 })?.rateCents).toBe(0);
		expect(restorePricingInputs({ persons: 0 })?.persons).toBe(0);
	});
});

describe('restoreCachedLineItems', () => {
	it('converts unit_price back from Euro to cents', () => {
		const restored = restoreCachedLineItems({
			line_items: [{ description: 'Halteverbotszone', quantity: 2, unit_price: 120.5 }],
		});
		expect(restored).toEqual([
			{ kind: 'item', label: 'Halteverbotszone', quantity: 2, unitPriceCents: 12050, remark: '' },
		]);
	});

	it('rounds prices that cannot be represented exactly in binary floating point', () => {
		// 8.35 * 100 is 834.9999… — without the round this would persist as 834 cents
		// and the price would drift down by a cent on every save/reload cycle.
		const restored = restoreCachedLineItems({
			line_items: [{ description: 'Karton', quantity: 1, unit_price: 8.35 }],
		});
		expect(restored[0].unitPriceCents).toBe(835);
	});

	it('returns an empty list when nothing is cached', () => {
		expect(restoreCachedLineItems(undefined)).toEqual([]);
		expect(restoreCachedLineItems(null)).toEqual([]);
		expect(restoreCachedLineItems({})).toEqual([]);
		expect(restoreCachedLineItems({ line_items: 'not-an-array' })).toEqual([]);
	});

	it('defaults a missing remark to the empty string', () => {
		const restored = restoreCachedLineItems({
			line_items: [{ description: 'Karton', quantity: 1, unit_price: 5 }],
		});
		expect(restored[0].remark).toBe('');
	});
});

describe('serialize → restore round-trip', () => {
	const rows = [
		{ kind: 'labor', label: 'Umzugshelfer', quantity: 6, unitPriceCents: 3000 },
		{ kind: 'fahrt', label: 'Fahrkostenpauschale', quantity: 1, unitPriceCents: 12000 },
		{ kind: 'item', label: 'Halteverbotszone', quantity: 2, unitPriceCents: 12050, remark: 'Beladestelle' },
	];

	it('preserves kind, quantity and price across a save and reload', () => {
		const restored = restoreCachedLineItems({ line_items: serialize(rows, 3) });

		expect(restored.map((r) => r.kind)).toEqual(['labor', 'fahrt', 'item']);
		expect(restored.map((r) => r.quantity)).toEqual([6, 1, 2]);
		expect(restored.map((r) => r.unitPriceCents)).toEqual([3000, 12000, 12050]);
	});

	it('carries the person count into the labour row label', () => {
		const restored = restoreCachedLineItems({ line_items: serialize(rows, 3) });
		expect(restored[0].label).toBe('3 Umzugshelfer');
	});

	it('preserves remarks, and only on the rows that had one', () => {
		const restored = restoreCachedLineItems({ line_items: serialize(rows, 3) });
		expect(restored[2].remark).toBe('Beladestelle');
		expect(restored[0].remark).toBe('');
	});

	it('keeps zero-quantity special rows but drops zero-quantity plain items', () => {
		const withZeros = [
			{ kind: 'labor', label: 'Umzugshelfer', quantity: 0, unitPriceCents: 3000 },
			{ kind: 'insurance', label: 'Nürnbergerversicherung', quantity: 0, unitPriceCents: 5000 },
			{ kind: 'item', label: 'Klaviertransport', quantity: 0, unitPriceCents: 25000 },
		];
		const restored = restoreCachedLineItems({ line_items: serialize(withZeros, 2) });
		expect(restored.map((r) => r.label)).toEqual(['2 Umzugshelfer', 'Nürnbergerversicherung']);
	});

	it('survives repeated save/reload cycles without drifting', () => {
		const once = serialize(rows, 3);
		const twice = serialize(restoreCachedLineItems({ line_items: once }), 3);
		expect(twice).toEqual(once);
	});
});

describe('buildCustomFieldsPatch', () => {
	const pricing = { persons: 3, hours: 4, rate_cents: 3000, brutto_cents: 42840, line_items: [] };

	it('preserves sibling keys written by other parts of the system', () => {
		// The submission handlers park the customer-stated volume and item list here;
		// PATCH replaces custom_fields wholesale, so dropping them would lose data.
		const patch = buildCustomFieldsPatch(
			{ volumen: 15, umzugsgut: ['Sofa', 'Schrank'] },
			'Entrümpelung',
			pricing,
		);
		expect(patch.volumen).toBe(15);
		expect(patch.umzugsgut).toEqual(['Sofa', 'Schrank']);
	});

	it('writes the headline override and the pricing cache', () => {
		const patch = buildCustomFieldsPatch({}, 'Entrümpelung', pricing);
		expect(patch.offer_headline_override).toBe('Entrümpelung');
		expect(patch.cached_pricing).toEqual(pricing);
	});

	it('clears the cache with null once an offer exists', () => {
		const patch = buildCustomFieldsPatch({ cached_pricing: pricing }, null, null);
		expect(patch.cached_pricing).toBeNull();
		expect(patch.offer_headline_override).toBeNull();
	});

	it('overwrites a previously cached value rather than merging into it', () => {
		const patch = buildCustomFieldsPatch({ cached_pricing: pricing }, null, {
			...pricing,
			persons: 9,
		});
		expect((patch.cached_pricing as typeof pricing).persons).toBe(9);
	});

	it('handles a missing custom_fields object', () => {
		expect(buildCustomFieldsPatch(null, null, null)).toEqual({
			offer_headline_override: null,
			cached_pricing: null,
		});
		expect(buildCustomFieldsPatch(undefined, null, null)).toEqual({
			offer_headline_override: null,
			cached_pricing: null,
		});
	});
});
