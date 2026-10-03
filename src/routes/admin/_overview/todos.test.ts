import { describe, it, expect } from 'vitest';
import { buildTodos, shortDay, waitingSince } from './todos';
import type { Overview } from './types';

function overview(attention: Partial<Overview['attention']>): Overview {
	return {
		today: '2026-10-02',
		attention: {
			flash_contacts: 0,
			flash_contacts_oldest: null,
			unread_emails: 0,
			unread_emails_oldest: null,
			unread_email_senders: [],
			new_inquiries: 0,
			open_inquiries: 0,
			kva_followups: 0,
			kva_followups_netto_cents: 0,
			overdue_invoices: 0,
			overdue_cents: 0,
			oldest_overdue_days: null,
			unstaffed: [],
			overbooked: [],
			invoice_reminders_due: 0,
			review_requests_due: null,
			...attention
		},
		jobs: [],
		revenue: [],
		pipeline: {
			open_count: 0,
			open_netto_cents: 0,
			win_rate: null,
			win_rate_previous: null,
			avg_won_netto_cents: null,
			win_rate_trend: []
		},
		funnel: { inquiries: 0, estimated: 0, offered: 0, won: 0, invoiced: 0 },
		capacity: [],
		receivables: {
			open_cents: 0,
			current_cents: 0,
			overdue_1_30_cents: 0,
			overdue_31_60_cents: 0,
			overdue_60_plus_cents: 0,
			overdue: []
		}
	};
}

describe('buildTodos', () => {
	it('is empty when nothing needs doing', () => {
		expect(buildTodos(overview({}))).toEqual([]);
	});

	it('puts a job without crew before unread mail and new inquiries', () => {
		const todos = buildTodos(
			overview({
				open_inquiries: 3,
				new_inquiries: 1,
				unread_emails: 2,
				unread_email_senders: ['Schulz', 'Krämer'],
				unstaffed: [{ inquiry_id: 'x', date: '2026-10-03', customer_name: 'Fam. Yilmaz', volume_m3: 32 }]
			})
		);
		expect(todos.map((t) => t.key)).toEqual(['unstaffed', 'mail', 'inquiries']);
		expect(todos[0]).toMatchObject({
			title: 'Einsatz ohne Team',
			meta: 'Sa 03.10. · Fam. Yilmaz · 32 m³',
			href: '/admin/inquiries/x'
		});
		expect(todos[2].meta).toBe('davon 1 neu');
	});

	it('names the first senders and counts the rest', () => {
		const [mail] = buildTodos(
			overview({ unread_emails: 4, unread_email_senders: ['Schulz', 'Krämer', 'Lange'] })
		);
		expect(mail.meta).toBe('Schulz, Krämer, Lange, +1');
	});

	it('sends several unstaffed jobs to the calendar rather than one inquiry', () => {
		const [t] = buildTodos(
			overview({
				unstaffed: [
					{ inquiry_id: 'a', date: '2026-10-02', customer_name: null, volume_m3: null },
					{ inquiry_id: 'b', date: '2026-10-03', customer_name: null, volume_m3: null }
				]
			})
		);
		expect(t.href).toBe('/admin/calendar');
		expect(t.title).toBe('Einsätze ohne Team');
	});
});

describe('date wording', () => {
	it('formats a calendar day without timezone drift', () => {
		expect(shortDay('2026-10-03')).toBe('Sa 03.10.');
	});

	it('says how long something waited in office words', () => {
		const now = new Date(2026, 9, 2, 12, 0);
		expect(waitingSince(new Date(2026, 9, 2, 8, 12).toISOString(), now)).toBe('seit 08:12');
		expect(waitingSince(new Date(2026, 9, 1, 17, 0).toISOString(), now)).toBe('seit gestern');
		expect(waitingSince(new Date(2026, 8, 30, 9, 0).toISOString(), now)).toBe('seit Mi 30.09.');
	});
});
