/** `GET /api/v1/admin/overview` — mirrors `crates/api/src/routes/overview.rs`. */

export interface CapacityDay {
	date: string;
	booked: number;
	capacity: number;
}

export interface Overview {
	today: string;
	attention: {
		flash_contacts: number;
		flash_contacts_oldest: string | null;
		unread_emails: number;
		unread_emails_oldest: string | null;
		unread_email_senders: string[];
		new_inquiries: number;
		open_inquiries: number;
		kva_followups: number;
		kva_followups_netto_cents: number;
		overdue_invoices: number;
		overdue_cents: number;
		oldest_overdue_days: number | null;
		unstaffed: { inquiry_id: string; date: string; customer_name: string | null; volume_m3: number | null }[];
		overbooked: CapacityDay[];
		invoice_reminders_due: number;
		review_requests_due: number | null;
	};
	jobs: {
		inquiry_id: string;
		date: string;
		start_time: string;
		customer_name: string | null;
		departure_address: string | null;
		arrival_address: string | null;
		volume_m3: number | null;
		crew: string[];
		day_number: number;
		total_days: number;
		status: string;
		service_type: string | null;
	}[];
	revenue: { month: string; revenue_cents: number; result_cents: number | null }[];
	pipeline: {
		open_count: number;
		open_netto_cents: number;
		win_rate: number | null;
		win_rate_previous: number | null;
		avg_won_netto_cents: number | null;
		win_rate_trend: (number | null)[];
	};
	funnel: { inquiries: number; estimated: number; offered: number; won: number; invoiced: number };
	capacity: CapacityDay[];
	receivables: {
		open_cents: number;
		current_cents: number;
		overdue_1_30_cents: number;
		overdue_31_60_cents: number;
		overdue_60_plus_cents: number;
		overdue: {
			invoice_number: string;
			inquiry_id: string | null;
			customer_name: string | null;
			days_overdue: number;
			open_cents: number;
		}[];
	};
}
