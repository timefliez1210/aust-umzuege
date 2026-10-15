/**
 * Order-size bands and per-channel size figures for the Conversion tab.
 * Bands roughly follow the quartiles of Aust's KVAs (median ≈ 1.800 € netto).
 */
import type { Lead } from './types';

export const BANDS: { label: string; from: number; to: number }[] = [
	{ label: 'unter 1.000 €', from: 0, to: 100_000 },
	{ label: '1.000 – 2.500 €', from: 100_000, to: 250_000 },
	{ label: '2.500 – 5.000 €', from: 250_000, to: 500_000 },
	{ label: 'ab 5.000 €', from: 500_000, to: Number.POSITIVE_INFINITY }
];

/** "Großer Auftrag" from here on (netto cents). */
export const BIG_FROM_CENTS = 250_000;

/** Index into BANDS for a KVA netto amount in cents. */
export function bandOf(cents: number): number {
	return BANDS.findIndex((b) => cents >= b.from && cents < b.to);
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const v = [...values].sort((a, b) => a - b);
	const mid = Math.floor(v.length / 2);
	return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2);
}

/** Size figures for a set of leads that all have a KVA value. */
export function sizeStats(leads: Lead[]) {
	const values = leads.map((l) => l.value_cents ?? 0);
	const won = leads.filter((l) => l.outcome === 'won');
	const wonValues = won.map((l) => l.value_cents ?? 0);
	const big = wonValues.filter((v) => v >= BIG_FROM_CENTS);
	const wonCents = wonValues.reduce((s, v) => s + v, 0);
	return {
		kvas: leads.length,
		medianKva: median(values),
		won: won.length,
		wonCents,
		avgWon: won.length ? Math.round(wonCents / won.length) : null,
		bigWon: big.length,
		bigWonCents: big.reduce((s, v) => s + v, 0),
		maxWon: wonValues.length ? Math.max(...wonValues) : null
	};
}
