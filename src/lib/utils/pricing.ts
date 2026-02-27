export interface RowOption {
	row: number;
	label: string;
}

export const ROW_OPTIONS: RowOption[] = [
	{ row: 31, label: 'De/Montage' },
	{ row: 32, label: 'Halteverbotszone' },
	{ row: 33, label: 'Umzugsmaterial' },
	{ row: 39, label: 'Transporter' },
	{ row: 42, label: 'Anfahrt/Abfahrt' },
	{ row: 99, label: 'Sonstiges' },
];

export function rowToLabel(row: number): string {
	return ROW_OPTIONS.find(r => r.row === row)?.label || 'Sonstiges';
}

export const COST_PER_PERSON_HOUR = 18.23;

export function calculateLaborCents(persons: number, hours: number, rateCents: number): number {
	return persons * hours * rateCents;
}

export function calculateNonLaborCents(
	lineItems: { quantity: number; unit_price_cents: number }[]
): number {
	return lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price_cents, 0);
}

export function calculateBruttoCents(nettoCents: number): number {
	return Math.round(nettoCents * 1.19);
}

export function calculateLaborProfit(
	persons: number,
	hours: number,
	rateCents: number,
	costPerPersonHour: number = COST_PER_PERSON_HOUR
): number {
	return persons * hours * (rateCents / 100 - costPerPersonHour);
}

export function reverseCalculateRate(
	bruttoCents: number,
	nonLaborCents: number,
	persons: number,
	hours: number
): number {
	const targetNetto = Math.round(bruttoCents / 1.19);
	const availableForLabor = targetNetto - nonLaborCents;
	if (persons > 0 && hours > 0 && availableForLabor > 0) {
		return Math.round(availableForLabor / (persons * hours));
	}
	return 0;
}
