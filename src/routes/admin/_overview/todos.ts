import { formatEuroWhole } from '$lib/utils/format';
import type { Tone } from '$lib/components/ui/tone';
import type { Overview } from './types';

/** One line of the "Zu tun" list. */
export interface Todo {
	key: string;
	tone: Tone;
	count: number;
	title: string;
	meta: string;
	href: string;
	action: string;
}

const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** "Sa 03.10." for an ISO date (YYYY-MM-DD), read as a calendar day, not an instant. */
export function shortDay(iso: string): string {
	const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
	const date = new Date(y, m - 1, d);
	return `${WEEKDAY[date.getDay()]} ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.`;
}

/**
 * How long something has been waiting, in office words: "seit 08:12" today,
 * "seit gestern", otherwise "seit Mi 30.09.".
 */
export function waitingSince(instant: string, now: Date = new Date()): string {
	const t = new Date(instant);
	const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const diffDays = Math.round((day(now) - day(t)) / 86_400_000);
	if (diffDays <= 0) return `seit ${t.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
	if (diffDays === 1) return 'seit gestern';
	const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
	return `seit ${shortDay(iso)}`;
}

const TONE_RANK: Record<Tone, number> = { danger: 0, warn: 1, accent: 2, info: 3, ok: 4, neutral: 5 };

/**
 * Turns the overview's raw counts into the to-do list, most urgent first.
 * Lines with a zero count are left out — an empty list means "nothing to do".
 */
export function buildTodos(o: Overview, now: Date = new Date()): Todo[] {
	const a = o.attention;
	const todos: Todo[] = [];

	if (a.unstaffed.length) {
		const first = a.unstaffed[0];
		const vol = first.volume_m3 ? ` · ${Math.round(first.volume_m3)} m³` : '';
		todos.push({
			key: 'unstaffed',
			tone: 'danger',
			count: a.unstaffed.length,
			title: a.unstaffed.length === 1 ? 'Einsatz ohne Team' : 'Einsätze ohne Team',
			meta: `${shortDay(first.date)} · ${first.customer_name ?? 'Unbekannt'}${vol}`,
			href: a.unstaffed.length === 1 ? `/admin/inquiries/${first.inquiry_id}` : '/admin/calendar',
			action: 'Team zuweisen'
		});
	}
	if (a.overbooked.length) {
		todos.push({
			key: 'overbooked',
			tone: 'danger',
			count: a.overbooked.length,
			title: a.overbooked.length === 1 ? 'Tag überbucht' : 'Tage überbucht',
			meta: a.overbooked
				.slice(0, 3)
				.map((d) => `${shortDay(d.date)} ${d.booked}/${d.capacity}`)
				.join(' · '),
			href: '/admin/calendar',
			action: 'Kalender'
		});
	}
	if (a.flash_contacts) {
		todos.push({
			key: 'flash',
			tone: 'danger',
			count: a.flash_contacts,
			title: a.flash_contacts === 1 ? 'Rückruf offen' : 'Rückrufe offen',
			meta: a.flash_contacts_oldest ? `wartet ${waitingSince(a.flash_contacts_oldest, now)}` : 'Schnellkontakt',
			href: '/admin/flash-contacts',
			action: 'Anrufen'
		});
	}
	if (a.overdue_invoices) {
		const oldest = a.oldest_overdue_days ? ` · älteste ${a.oldest_overdue_days} Tage über Ziel` : '';
		todos.push({
			key: 'overdue',
			tone: 'danger',
			count: a.overdue_invoices,
			title: a.overdue_invoices === 1 ? 'Rechnung überfällig' : 'Rechnungen überfällig',
			meta: `${formatEuroWhole(a.overdue_cents)} offen${oldest}`,
			href: '/admin/rechnungsausgangsbuch',
			action: 'Ansehen'
		});
	}
	if (a.unread_emails) {
		const names = a.unread_email_senders;
		const more = a.unread_emails > names.length ? `, +${a.unread_emails - names.length}` : '';
		const since = a.unread_emails_oldest ? `älteste ${waitingSince(a.unread_emails_oldest, now)}` : '';
		todos.push({
			key: 'mail',
			tone: 'warn',
			count: a.unread_emails,
			title: a.unread_emails === 1 ? 'E-Mail ungelesen' : 'E-Mails ungelesen',
			meta: [since, names.length ? names.join(', ') + more : ''].filter(Boolean).join(' · '),
			href: '/admin/emails',
			action: 'Öffnen'
		});
	}
	if (a.kva_followups) {
		todos.push({
			key: 'kva',
			tone: 'warn',
			count: a.kva_followups,
			title: 'KVA nachfassen',
			meta: `ohne Antwort · ${formatEuroWhole(a.kva_followups_netto_cents)} netto im Feld`,
			href: '/admin/kva-buch',
			action: 'KVA-Buch'
		});
	}
	if (a.open_inquiries) {
		todos.push({
			key: 'inquiries',
			tone: 'accent',
			count: a.open_inquiries,
			title: a.open_inquiries === 1 ? 'Anfrage ohne Angebot' : 'Anfragen ohne Angebot',
			meta: a.new_inquiries ? `davon ${a.new_inquiries} neu` : 'in Bearbeitung',
			href: '/admin/inquiries',
			action: 'Bearbeiten'
		});
	}

	return todos.sort((x, y) => TONE_RANK[x.tone] - TONE_RANK[y.tone]);
}
