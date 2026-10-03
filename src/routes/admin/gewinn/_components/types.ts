/**
 * Shapes returned by `/api/v1/admin/profit/*` (crates/api/src/routes/profit.rs).
 * All money is in cents; netto unless the field says brutto.
 */

export type RateSource = 'belegt' | 'betrieb' | 'standard';
export type LaborSource = 'gebucht' | 'uebernommen' | 'vorlaeufig' | 'keine';
export type RevenueSource = 'rechnung' | 'angebot' | 'keine';
export type CategoryKind = 'fixed' | 'variable' | 'wages';

export interface RealRate {
	rate_cents: number;
	months: number;
	hours: number;
	wages_cents: number;
}

export interface RatesSummary {
	default_cents: number;
	company: RealRate | null;
	company_rate_cents: number;
	company_source: RateSource;
}

export interface MonthRow {
	month: string;
	revenue_cents: number;
	labor_cents: number;
	labor_source: LaborSource;
	labor_hours: number;
	fixed_cents: number;
	variable_cents: number;
	draft_cents: number;
	result_cents: number;
	is_future: boolean;
	is_current: boolean;
}

export interface Overview {
	year: number;
	months: MonthRow[];
	totals: {
		revenue_cents: number;
		labor_cents: number;
		fixed_cents: number;
		variable_cents: number;
		result_cents: number;
	};
	break_even: {
		revenue_cents: number;
		fixed_cents: number;
		contribution_ratio: number;
		months: string[];
	} | null;
	vehicles: {
		vehicle_id: string;
		label: string;
		kennzeichen: string;
		total_cents: number;
		per_month_cents: number;
	}[];
	open_drafts: number;
	rates: RatesSummary;
}

export interface CrewLine {
	employee_id: string;
	name: string;
	hours: number;
	rate_cents: number;
	rate_source: RateSource;
	cost_cents: number;
	planned: boolean;
}

export interface JobMargin {
	inquiry_id: string;
	customer_name: string | null;
	route: string | null;
	status: string;
	scheduled_date: string | null;
	end_date: string | null;
	revenue_cents: number;
	revenue_source: RevenueSource;
	labor_cents: number;
	labor_hours: number;
	labor_planned: boolean;
	direct_cents: number;
	margin_cents: number;
	margin_pct: number | null;
	crew: CrewLine[];
}

export interface JobsResponse {
	month: string;
	jobs: JobMargin[];
	totals: { revenue_cents: number; labor_cents: number; direct_cents: number; margin_cents: number };
}

export interface Category {
	id: string;
	name: string;
	kind: CategoryKind;
	default_vat_rate: number;
	active: boolean;
	/** Loaded onto the Stundensatz-Kalkulation — true exactly when not recharged. */
	in_hourly_rate: boolean;
	/** KVA/invoice positions customers pay this cost through; empty = Eigene Kosten. */
	recharge_positions: string[];
}

export interface Expense {
	id: string;
	category_id: string;
	category_name: string;
	category_kind: CategoryKind;
	status: 'draft' | 'booked';
	receipt_date: string;
	paid_on: string | null;
	period_month: string;
	supplier: string | null;
	receipt_number: string | null;
	description: string | null;
	netto_cents: number;
	vat_rate: number;
	vat_cents: number;
	brutto_cents: number;
	vehicle_id: string | null;
	vehicle_label: string | null;
	inquiry_id: string | null;
	inquiry_label: string | null;
	employee_id: string | null;
	employee_name: string | null;
	recurring_id: string | null;
	receipt_s3_key: string | null;
	receipt_filename: string | null;
	storno_of: string | null;
	storno_id: string | null;
	created_at: string;
}

export interface Recurring {
	id: string;
	category_id: string;
	category_name: string;
	category_kind: CategoryKind;
	label: string;
	supplier: string | null;
	netto_cents: number;
	vat_rate: number;
	brutto_cents: number;
	interval_months: number;
	day_of_month: number;
	start_month: string;
	end_month: string | null;
	vehicle_id: string | null;
	vehicle_label: string | null;
	active: boolean;
	notes: string | null;
}

export interface EmployeeMonth {
	month: string;
	hours: number;
	transferred: boolean;
	wages_cents: number;
	rate_cents: number | null;
}

export interface EmployeeCost {
	employee_id: string;
	name: string;
	active: boolean;
	rate_cents: number;
	rate_source: RateSource;
	real: RealRate | null;
	months: EmployeeMonth[];
	warnings: string[];
}

export interface EmployeesResponse {
	months: string[];
	employees: EmployeeCost[];
	rates: RatesSummary;
}

export interface TransferLine {
	employee_id: string;
	name: string;
	paid_hours: number;
	worked_hours: number;
	unconfirmed_days: number;
	planned_days: number;
	rate_cents: number;
	rate_source: RateSource;
	cost_cents: number;
	transferred_hours: number | null;
	transferred_cost_cents: number | null;
	changed: boolean;
}

export interface TransferPreview {
	month: string;
	lines: TransferLine[];
	total_hours: number;
	total_cost_cents: number;
	transferred_at: string | null;
	has_changes: boolean;
	month_complete: boolean;
}

export interface Vehicle {
	id: string;
	label: string;
	kennzeichen: string;
}

export const RATE_SOURCE_LABELS: Record<RateSource, string> = {
	belegt: 'belegt',
	betrieb: 'Betriebsschnitt',
	standard: 'Standard'
};

export const LABOR_SOURCE_LABELS: Record<LaborSource, string> = {
	gebucht: 'Lohn gebucht',
	uebernommen: 'Stunden übernommen',
	vorlaeufig: 'vorläufig',
	keine: '—'
};

export const KIND_LABELS: Record<CategoryKind, string> = {
	fixed: 'Fixkosten',
	variable: 'Variable Kosten',
	wages: 'Löhne'
};

export const MONTH_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
export const MONTH_LONG = [
	'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
	'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

/** "2026-09-01" → "2026-09" */
export function monthKey(iso: string): string {
	return iso.slice(0, 7);
}

/** "2026-09-01" or "2026-09" → "September 2026" */
export function monthLabel(iso: string): string {
	const [y, m] = iso.split('-');
	return `${MONTH_LONG[Number(m) - 1]} ${y}`;
}

/** Current month as "YYYY-MM" in local time. */
export function currentMonthKey(): string {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Shift a "YYYY-MM" key by n months. */
export function shiftMonth(key: string, n: number): string {
	const [y, m] = key.split('-').map(Number);
	const d = new Date(y, m - 1 + n, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Hours with German decimal comma, e.g. 7,5 h. */
export function fmtHours(h: number): string {
	return `${h.toLocaleString('de-DE', { maximumFractionDigits: 2 })} h`;
}

/** €/h from cents, e.g. "18,50 €/h". */
export function fmtRate(cents: number): string {
	return `${(cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €/h`;
}

/** Badge tone for every source / state pill on the Gewinn tab. */
export const SOURCE_TONE: Record<string, 'ok' | 'info' | 'warn' | 'danger' | 'neutral'> = {
	belegt: 'ok',
	gebucht: 'ok',
	rechnung: 'ok',
	betrieb: 'info',
	uebernommen: 'info',
	standard: 'warn',
	vorlaeufig: 'warn',
	angebot: 'warn',
	draft: 'warn',
	storno: 'danger',
	keine: 'neutral'
};

/** `GET /admin/profit/hourly-rate` — the Stundensatz-Kalkulation (all cents netto). */
export interface HourlyRate {
	months: string[];
	window_months: number;
	inaccurate: boolean;
	warnings: string[];
	wage_per_hour_cents: number;
	variable_per_hour_cents: number;
	fixed_per_month_cents: number;
	excluded_per_month_cents: number;
	target_profit_cents: number;
	avg_sold_hours: number;
	planned_hours: number | null;
	basis_hours: number;
	capacity_hours: number;
	capacity_crew: number;
	break_even_cents: number;
	target_rate_cents: number;
	capacity_break_even_cents: number;
	current_rate_cents: number;
	hours_needed_break_even: number | null;
	hours_needed_target: number | null;
	result_at_current_cents: number;
	components: { label: string; kind: 'wages' | 'variable' | 'fixed'; per_month_cents: number; per_hour_cents: number }[];
	volumes: {
		hours: number;
		kind: 'low' | 'average' | 'high' | 'plan' | 'capacity';
		fixed_share_cents: number;
		break_even_cents: number;
		with_profit_cents: number;
		result_at_current_cents: number;
	}[];
}

export interface HourlyCalcSettings {
	target_profit_cents: number;
	window_months: number;
	planned_hours_per_month: number | null;
	capacity_crew: number | null;
	capacity_hours_per_day: number;
	capacity_days_per_month: number;
}

export interface ProfitSettings {
	default_rate_cents: number;
	hourly: HourlyCalcSettings;
}

export const VOLUME_LABELS: Record<HourlyRate['volumes'][number]['kind'], string> = {
	low: 'ruhiger Monat',
	average: 'Ø bisher',
	high: 'guter Monat',
	plan: 'Plan',
	capacity: 'volle Auslastung'
};

export type RechargeVerdict = 'gewinn' | 'durchlauf' | 'verlust' | 'unklar';

/** `GET /admin/profit/recharge?year=` — recharged costs vs. what their positions brought in. */
export interface RechargeReport {
	year: number;
	legacy_invoices: number;
	rows: {
		category_id: string;
		category_name: string;
		positions: string[];
		revenue_cents: number;
		cost_cents: number;
		result_cents: number;
		verdict: RechargeVerdict;
		months: { month: string; revenue_cents: number; cost_cents: number }[];
	}[];
}

export const VERDICT_LABELS: Record<RechargeVerdict, string> = {
	gewinn: 'bringt Gewinn',
	durchlauf: 'Durchlaufposten',
	verlust: 'Verlust',
	unklar: 'unvollständig'
};

export const VERDICT_TONE: Record<RechargeVerdict, 'ok' | 'info' | 'danger' | 'warn'> = {
	gewinn: 'ok',
	durchlauf: 'info',
	verlust: 'danger',
	unklar: 'warn'
};
