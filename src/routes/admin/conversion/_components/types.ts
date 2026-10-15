/**
 * Conversion tab — response shape of GET /api/v1/admin/conversion plus the German
 * labels and fixed channel colours. Attribution rules live in the backend
 * (crates/api/src/services/conversion_service.rs).
 */

export type Channel = 'telefon' | 'kontaktformular' | 'angebotsformular' | 'rueckruf' | 'email' | 'app';
export type Outcome = 'won' | 'lost' | 'open' | 'duplicate';
export type LostReason =
	| 'keine_anfrage'
	| 'abgesagt_vor_kva'
	| 'kein_kva'
	| 'kva_abgelehnt'
	| 'kva_abgelaufen'
	| 'keine_rueckmeldung'
	| 'storniert'
	| 'storniert_nach_zusage';

export interface ChannelStats {
	channel: Channel | null;
	leads: number;
	duplicates: number;
	/** reached[s] = leads that got at least to stage s (see STAGES). */
	reached: number[];
	won: number;
	lost: number;
	open: number;
	lost_by_reason: Partial<Record<LostReason, number>>;
	won_value_cents: number;
	avg_won_value_cents: number | null;
	median_days_to_kva: number | null;
	median_days_to_order: number | null;
}

export interface Lead {
	id: string;
	channel: Channel;
	at: string;
	name: string | null;
	inquiry_id: string | null;
	stage: number;
	outcome: Outcome;
	reason: LostReason | null;
	value_cents: number | null;
	days_to_kva: number | null;
	days_to_order: number | null;
}

export interface MonthRow {
	month: string;
	channels: { channel: Channel; leads: number; won: number }[];
}

export interface ConversionReport {
	from: string | null;
	to: string | null;
	total: ChannelStats;
	channels: ChannelStats[];
	months: MonthRow[];
	leads: Lead[];
}

/**
 * Channels in their fixed order. `color` is the series token: a channel keeps its
 * colour no matter which others are shown.
 */
export const CHANNELS: { key: Channel; label: string; short: string; hint: string; color: string; dot: string }[] = [
	{ key: 'telefon', label: 'Telefon', short: 'Telefon', hint: 'Anfrage von Hand angelegt, ohne Formular davor', color: 'var(--series-1)', dot: 'bg-series-1' },
	{ key: 'kontaktformular', label: 'Kontaktformular', short: 'Kontakt', hint: 'Nachricht über das Kontaktformular', color: 'var(--series-2)', dot: 'bg-series-2' },
	{ key: 'angebotsformular', label: 'Kostenloses Angebot', short: 'Angebot', hint: 'Formular „Kostenloses Angebot“', color: 'var(--series-3)', dot: 'bg-series-3' },
	{ key: 'rueckruf', label: 'Rückruf (Flash)', short: 'Rückruf', hint: 'Rückruf-Wunsch über das Flash-Formular', color: 'var(--series-4)', dot: 'bg-series-4' },
	{ key: 'email', label: 'E-Mail direkt', short: 'E-Mail', hint: 'Freie E-Mail ohne Formular', color: 'var(--series-5)', dot: 'bg-series-5' },
	{ key: 'app', label: 'Foto / App', short: 'App', hint: 'Foto-Upload oder Kunden-App', color: 'var(--series-6)', dot: 'bg-series-6' }
];

export const CHANNEL: Record<Channel, (typeof CHANNELS)[number]> = Object.fromEntries(CHANNELS.map((c) => [c.key, c])) as Record<
	Channel,
	(typeof CHANNELS)[number]
>;

/** Funnel stages by index, matching the backend. */
export const STAGES = ['Eingang', 'Anfrage', 'KVA erstellt', 'KVA versendet', 'Zusage', 'Durchgeführt', 'Bezahlt'] as const;
export const STAGE_ORDER_INDEX = 4;
export const STAGE_SENT_INDEX = 3;

/** Drop-off reasons, grouped by where in the funnel they happen. */
export const REASONS: { key: LostReason; label: string; hint: string; phase: string }[] = [
	{ key: 'keine_anfrage', label: 'Keine Anfrage entstanden', hint: 'Formular oder Rückruf kam an, aber nach 14 Tagen gab es keine Anfrage', phase: 'Vor der Anfrage' },
	{ key: 'abgesagt_vor_kva', label: 'Abgesagt vor dem KVA', hint: 'Anfrage abgelehnt, bevor ein KVA rausging', phase: 'Vor dem KVA' },
	{ key: 'kein_kva', label: 'Kein KVA verschickt', hint: 'Anfrage liegt seit über 30 Tagen ohne versendeten KVA', phase: 'Vor dem KVA' },
	{ key: 'kva_abgelehnt', label: 'KVA abgelehnt', hint: 'Kunde hat den KVA abgelehnt', phase: 'Nach dem KVA' },
	{ key: 'kva_abgelaufen', label: 'KVA abgelaufen', hint: 'KVA ist ohne Zusage abgelaufen', phase: 'Nach dem KVA' },
	{ key: 'keine_rueckmeldung', label: 'Keine Rückmeldung', hint: 'KVA versendet, seit über 30 Tagen keine Antwort', phase: 'Nach dem KVA' },
	{ key: 'storniert', label: 'Storniert', hint: 'Anfrage vor der Zusage storniert', phase: 'Vor der Zusage' },
	{ key: 'storniert_nach_zusage', label: 'Storniert nach Zusage', hint: 'Auftrag war bestätigt und wurde storniert', phase: 'Nach der Zusage' }
];

export const REASON_LABEL: Record<LostReason, string> = Object.fromEntries(REASONS.map((r) => [r.key, r.label])) as Record<
	LostReason,
	string
>;

export const OUTCOME_LABEL: Record<Outcome, string> = {
	won: 'Auftrag',
	lost: 'Abgesprungen',
	open: 'Offen',
	duplicate: 'Doppelt'
};

/** Below this many leads a channel's percentages are shown but flagged as thin. */
export const MIN_LEADS = 10;

/** "43,8 %" — or "—" when there is nothing to divide by. */
export function pct(part: number, whole: number, digits = 1): string {
	if (!whole) return '—';
	return `${((part / whole) * 100).toLocaleString('de-DE', { maximumFractionDigits: digits, minimumFractionDigits: 0 })} %`;
}

/** "1,5 Tage" / "< 1 Tag" / "—". */
export function fmtDays(days: number | null): string {
	if (days === null || days === undefined) return '—';
	if (days < 1) return '< 1 Tag';
	const rounded = Math.round(days * 10) / 10;
	return `${rounded.toLocaleString('de-DE')} ${rounded === 1 ? 'Tag' : 'Tage'}`;
}

export type RangeKey = '90d' | 'jahr' | '12m' | 'gesamt';

export const RANGES: { value: RangeKey; label: string }[] = [
	{ value: '90d', label: '90 Tage' },
	{ value: 'jahr', label: 'Dieses Jahr' },
	{ value: '12m', label: '12 Monate' },
	{ value: 'gesamt', label: 'Gesamt' }
];

function iso(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Query string for a range preset, relative to `today`. */
export function rangeQuery(key: RangeKey, today = new Date()): string {
	const to = iso(today);
	if (key === 'gesamt') return '';
	if (key === 'jahr') return `?from=${today.getFullYear()}-01-01&to=${to}`;
	const from = new Date(today);
	if (key === '90d') from.setDate(from.getDate() - 89);
	else {
		from.setMonth(from.getMonth() - 11);
		from.setDate(1);
	}
	return `?from=${iso(from)}&to=${to}`;
}

const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

/** "2026-06" → "Jun 26". */
export function monthShort(ym: string): string {
	const [y, m] = ym.split('-');
	return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}
