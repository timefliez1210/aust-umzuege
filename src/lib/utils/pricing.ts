/**
 * German VAT multiplier (19%).
 *
 * Used by: calculateBruttoCents, bruttoCentsToNetto, formatBrutto, reverseCalculateRate
 * Purpose: Single constant so all VAT arithmetic in the admin uses the same rate
 *          and a rate change only needs updating in one place.
 */
export const VAT_RATE = 1.19;

/**
 * Converts brutto cents (including 19% VAT) to netto cents and rounds to the nearest cent.
 *
 * Called by: calendar/+page.svelte (price display), inquiries/[id]/+page.svelte (rate back-calc)
 * Purpose: Reverses the VAT addition so the netto amount can be stored or used in further
 *          pricing calculations; complements calculateBruttoCents.
 *
 * @param bruttoCents - Gross amount including 19% VAT, in cents
 * @returns Net amount before tax, in cents, rounded to nearest integer
 *
 * Math: nettoCents = round(bruttoCents / 1.19)
 */
export function bruttoCentsToNetto(bruttoCents: number): number {
	return Math.round(bruttoCents / VAT_RATE);
}

/**
 * Formats a netto cent amount as a brutto Euro display string with German locale formatting.
 *
 * Called by: any page that needs to show a customer-facing gross price as a formatted string
 * Purpose: Applies VAT and formats in one step, producing strings like "1.234 €" suitable
 *          for compact display contexts where decimal cents are not needed.
 *
 * @param nettoCents - Net amount before tax, in cents
 * @returns Brutto (gross) amount formatted as a German locale string, e.g. "1.234 €"
 *
 * Math: bruttoEuros = round(nettoCents * 1.19) / 100
 */
export function formatBrutto(nettoCents: number): string {
	return (Math.round(nettoCents * VAT_RATE) / 100).toLocaleString('de-DE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}) + ' €';
}

export interface RowOption {
	row: number;
	label: string;
}

export const ROW_OPTIONS: RowOption[] = [
	{ row: 31, label: 'Demontage' },
	{ row: 32, label: 'Montage' },
	{ row: 33, label: 'Halteverbotszone' },
	{ row: 34, label: 'Umzugsmaterial' },
	{ row: 35, label: 'Möbellift' },
	{ row: 36, label: 'Verleih Kleiderboxen' },
	{ row: 37, label: 'Verkauf U-Karton' },
	{ row: 38, label: 'Verkauf B-Karton' },
	{ row: 99, label: 'Sonstiges' },
];

/**
 * Resolves a numeric row code to its human-readable German label.
 *
 * Called by: offers/[id]/+page.svelte (on load when populating editable line items)
 * Purpose: Maps backend row codes (integers) to the display labels shown in the
 *          offer editor; falls back to "Sonstiges" for any unrecognised code
 *
 * @param row - Numeric row identifier from the backend line-item schema
 * @returns The matching label string, or "Sonstiges" if the row code is unknown
 */
export function rowToLabel(row: number): string {
	return ROW_OPTIONS.find(r => r.row === row)?.label || 'Sonstiges';
}

export const COST_PER_PERSON_HOUR = 18.23;

/**
 * Calculates the total labour cost in cents for a job.
 *
 * Called by: offers/[id]/+page.svelte (as a reactive $derived value)
 * Purpose: Provides the euro amount charged to the customer for labour so it can
 *          be displayed in the offer editor and included in totals
 *
 * @param persons - Number of workers on the job
 * @param hours - Duration of the job in hours
 * @param rateCents - Hourly rate per person in cents
 * @returns Total labour cost in cents
 *
 * Math: laborCents = persons * hours * rateCents
 */
export function calculateLaborCents(persons: number, hours: number, rateCents: number): number {
	return persons * hours * rateCents;
}

/**
 * Calculates the total cost of all non-labour line items in cents.
 *
 * Called by: offers/[id]/+page.svelte (as a reactive $derived value)
 * Purpose: Sums material, transport, and other ancillary costs so they can be
 *          shown separately from labour and combined into the netto total
 *
 * @param lineItems - Array of line items with quantity and unit_price_cents fields
 * @returns Sum of (quantity * unit_price_cents) across all line items, in cents
 *
 * Math: nonLaborCents = sum(item.quantity * item.unit_price_cents)
 *       Note: flat-total items (qty=0, price=0) must be normalised with
 *       normalizeFlatTotalItem() before being passed to this function.
 */
export function calculateNonLaborCents(
	lineItems: { quantity: number; unit_price_cents: number }[]
): number {
	return lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price_cents, 0);
}

/**
 * Applies German VAT (19%) to a netto amount and rounds to the nearest cent.
 *
 * Called by: offers/[id]/+page.svelte (as a reactive $derived value)
 * Purpose: Produces the gross (brutto) price shown on customer-facing offers
 *
 * @param nettoCents - Net amount before tax, in cents
 * @returns Gross amount including 19% VAT, in cents, rounded to nearest integer
 *
 * Math: bruttoCents = round(nettoCents * 1.19)
 */
export function calculateBruttoCents(nettoCents: number): number {
	return Math.round(nettoCents * VAT_RATE);
}

/**
 * Calculates the profit contribution of the labour component in euros.
 *
 * Called by: offers/[id]/+page.svelte (as a reactive $derived value for internal margin display)
 * Purpose: Gives the admin visibility into how much profit the labour portion of
 *          an offer generates after subtracting the internal cost per person-hour
 *
 * @param persons - Number of workers on the job
 * @param hours - Duration of the job in hours
 * @param rateCents - Hourly rate per person charged to the customer, in cents
 * @param costPerPersonHour - Internal cost per person per hour in euros (defaults to COST_PER_PERSON_HOUR)
 * @returns Labour profit in euros (not cents)
 *
 * Math: profit = persons * hours * (rateCents / 100 - costPerPersonHour)
 *       e.g. 2 persons * 3 hours * (30.00 EUR/h - 18.23 EUR/h) = 70.62 EUR
 */
export function calculateLaborProfit(
	persons: number,
	hours: number,
	rateCents: number,
	costPerPersonHour: number = COST_PER_PERSON_HOUR
): number {
	return persons * hours * (rateCents / 100 - costPerPersonHour);
}

/**
 * Detect flat-total line items (backend Fahrkostenpauschale pattern: qty=0, price=0, total>0)
 *
 * Called by: offers/[id]/+page.svelte (template rendering to choose display branch),
 *            normalizeFlatTotalItem (internally)
 * Purpose: Identifies the special "flat fee" line-item pattern used by the backend
 *          for lump-sum items such as travel surcharges, which cannot be expressed
 *          as quantity * unit_price because both are zero
 *
 * @param li - Line item object with quantity, unit_price_cents, and total_cents fields
 * @returns True when quantity and unit_price_cents are both zero but total_cents is positive
 */
export function isFlatTotalItem(li: { quantity: number; unit_price_cents: number; total_cents: number }): boolean {
	return li.quantity === 0 && li.unit_price_cents === 0 && li.total_cents > 0;
}

/**
 * Convert flat-total items to qty=1, price=total so they work in edit calculations
 *
 * Called by: offers/[id]/+page.svelte (on load when building editable line item list),
 *            quotes/[id]/+page.svelte (on load when building editable line item list)
 * Purpose: Transforms backend flat-fee items into a format compatible with
 *          calculateNonLaborCents and the line-item editor, which both expect
 *          quantity * unit_price_cents to yield the correct total
 *
 * @param li - Line item of generic type T extending the base line item shape
 * @returns The original item unchanged if it is not a flat-total item, otherwise
 *          a copy with quantity set to 1 and unit_price_cents set to total_cents
 */
export function normalizeFlatTotalItem<T extends { quantity: number; unit_price_cents: number; total_cents: number }>(li: T): T {
	if (isFlatTotalItem(li)) {
		return { ...li, quantity: 1, unit_price_cents: li.total_cents };
	}
	return li;
}

/**
 * Back-calculates the per-person hourly rate in cents from a desired brutto total.
 *
 * Called by: offers/[id]/+page.svelte (when admin sets a target brutto price directly)
 * Purpose: Allows the admin to start from a desired customer-facing price and
 *          derive the implied hourly rate rather than adjusting the rate manually;
 *          returns 0 when the calculation is degenerate (zero persons, hours, or
 *          remaining labour budget)
 *
 * @param bruttoCents - Desired gross total including VAT, in cents
 * @param nonLaborCents - Sum of all non-labour line items, in cents
 * @param persons - Number of workers on the job
 * @param hours - Duration of the job in hours
 * @returns Derived per-person hourly rate in cents, rounded to the nearest cent, or 0
 *
 * Math: targetNetto = round(bruttoCents / 1.19)
 *       availableForLabor = targetNetto - nonLaborCents
 *       rateCents = round(availableForLabor / (persons * hours))
 */
export function reverseCalculateRate(
	bruttoCents: number,
	nonLaborCents: number,
	persons: number,
	hours: number
): number {
	const targetNetto = Math.round(bruttoCents / VAT_RATE);
	const availableForLabor = targetNetto - nonLaborCents;
	if (persons > 0 && hours > 0 && availableForLabor > 0) {
		return Math.round(availableForLabor / (persons * hours));
	}
	return 0;
}
