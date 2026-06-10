// Shared calendar types extracted from admin/calendar route

export interface InquiryItem {
	inquiry_id: string;
	customer_name: string | null;
	customer_email?: string | null;
	customer_type?: string | null;
	company_name?: string | null;
	departure_address: string | null;
	arrival_address: string | null;
	volume_m3: number | null;
	status: string;
	notes: string | null;
	employee_notes?: string | null;
	offer_price_cents: number | null;
	start_time: string;
	end_time: string;
	employees_assigned: number;
	employee_names: string | null;
	day_number?: number | null;
	total_days?: number | null;
	day_notes?: string | null;
	service_type?: string | null;
	scheduled_date?: string | null;
}

export interface CalendarItem {
	id: string;
	title: string;
	category: string;
	location: string | null;
	description?: string | null;
	scheduled_date: string;
	start_time: string;
	end_time: string | null;
	duration_hours: number;
	status: string;
	customer_id?: string | null;
	customer_name?: string | null;
	customer_type?: string | null;
	company_name?: string | null;
}

/** Per-day calendar item row from the schedule API. */
export interface ScheduleCalendarItem {
	calendar_item_id: string;
	title: string;
	category: string;
	location: string | null;
	start_time: string | null;
	end_time: string | null;
	employees_assigned: number;
	employee_names: string | null;
	day_number?: number | null;
	total_days?: number | null;
	day_notes?: string | null;
	description?: string | null;
}

export interface DaySchedule {
	date: string;
	available: boolean;
	capacity: number;
	booked: number;
	remaining: number;
	inquiries: InquiryItem[];
	calendar_items?: ScheduleCalendarItem[];
}

export interface DayEmployee {
	employee_id: string;
	first_name: string;
	last_name: string;
	notes: string | null;
	start_time: string | null;
	end_time: string | null;
	clock_in: string | null;
	clock_out: string | null;
	break_minutes: number;
}

export interface InquiryDay {
	day_date: string;
	day_number: number;
	notes: string | null;
	/** Per-day start time ("HH:MM") — null means inherit from parent. */
	start_time: string | null;
	/** Per-day end time ("HH:MM") — null means inherit from parent. */
	end_time: string | null;
	employees: DayEmployee[];
}

export type TerminDay = InquiryDay;

export interface PanelDay {
	kind: 'day';
	date: string;
	schedule: DaySchedule;
}

export interface PanelInquiry {
	kind: 'inquiry';
	item: InquiryItem;
}

export interface PanelTermin {
	kind: 'termin';
	item: CalendarItem;
}

export type PanelSelection = PanelDay | PanelInquiry | PanelTermin | null;
