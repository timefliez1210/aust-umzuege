<script lang="ts">
	import { apiGet, apiPut, apiPatch, apiPost, apiDelete, formatEuro } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { buildCalendar } from '$lib/utils/calendar';
	import { INQUIRY_STATUS_LABELS, formatStatus } from '$lib/utils/status';
	import { formatTime } from '$lib/utils/format';
	import { calculateBruttoCents } from '$lib/utils/pricing';
	import { ChevronLeft, ChevronRight, X, Save, Trash2, Plus, Check, ExternalLink } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import CapacityEditor from './_components/CapacityEditor.svelte';

	// ─── Interfaces ──────────────────────────────────────────────────────────────

	interface InquiryItem {
		inquiry_id: string;
		customer_name: string | null;
		customer_email?: string | null;
		departure_address: string | null;
		arrival_address: string | null;
		volume_m3: number | null;
		status: string;
		notes: string | null;
		offer_price_cents: number | null;
		start_time: string;
		end_time: string;
		employees_assigned: number;
		employee_names: string | null;
		day_number?: number | null;
		total_days?: number | null;
		day_notes?: string | null;
		preferred_date?: string | null;
		scheduled_date?: string | null;
	}

	interface CalendarItem {
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
	}

	interface HolidayEntry {
		startDate: string;
		endDate: string;
		name: Array<{ language: string; text: string }>;
	}

	interface DaySchedule {
		date: string;
		available: boolean;
		capacity: number;
		booked: number;
		remaining: number;
		inquiries: InquiryItem[];
	}

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		planned_hours: number;
		clock_in: string | null;
		clock_out: string | null;
		actual_hours: number | null;
		notes: string | null;
	}

	interface EmployeeOption {
		id: string;
		first_name: string;
		last_name: string;
	}

	// Side panel selection types
	type PanelKind = 'day' | 'inquiry' | 'termin';

	interface PanelDay {
		kind: 'day';
		date: string;
		schedule: DaySchedule;
	}

	interface PanelInquiry {
		kind: 'inquiry';
		item: InquiryItem;
	}

	interface PanelTermin {
		kind: 'termin';
		item: CalendarItem;
	}

	type PanelSelection = PanelDay | PanelInquiry | PanelTermin | null;

	// ─── Constants ───────────────────────────────────────────────────────────────

	const CATEGORY_LABELS: Record<string, string> = {
		internal: 'Intern',
		maintenance: 'Wartung',
		training: 'Schulung',
		other: 'Sonstiges'
	};

	const INQUIRY_STATUSES = [
		'pending', 'info_requested', 'estimating', 'estimated',
		'offer_ready', 'offer_sent', 'accepted', 'rejected', 'expired',
		'cancelled', 'scheduled', 'completed', 'invoiced', 'paid'
	];

	const PRE_ACCEPTED = new Set(['pending', 'info_requested', 'estimating', 'estimated', 'offer_ready', 'offer_sent']);

	// ─── Helper functions ────────────────────────────────────────────────────────

	/**
	 * Returns the CSS class for an inquiry calendar entry based on its status.
	 *
	 * Called by: Template (calendar cell entry rendering)
	 * Purpose: Visually distinguishes pre-accepted inquiries (yellow) from accepted/operational ones (green)
	 *
	 * @param status - The inquiry status string
	 * @returns CSS class name string
	 */
	function inquiryEntryClass(status: string): string {
		return PRE_ACCEPTED.has(status) ? 'entry-yellow' : 'entry-green';
	}

	/**
	 * Returns the CSS class for a calendar item (Termin) entry based on its category.
	 *
	 * Called by: Template (calendar cell entry rendering)
	 * Purpose: Color-codes termine by category for at-a-glance visual differentiation
	 *
	 * @param category - The CalendarItem category string
	 * @returns CSS class name string
	 */
	function termineEntryClass(category: string): string {
		const map: Record<string, string> = {
			internal: 'entry-violet',
			maintenance: 'entry-orange',
			training: 'entry-blue',
			other: 'entry-pink'
		};
		return map[category] ?? 'entry-violet';
	}

	/**
	 * Returns the first 8 characters of a UUID for compact display.
	 *
	 * Called by: Template (inquiry entry short ID label)
	 * Purpose: Shows enough of the ID to identify an inquiry without overflowing narrow cell entries
	 *
	 * @param id - Full UUID string
	 * @returns First 8 characters of the ID
	 */
	function shortId(id: string): string {
		return id.slice(0, 8);
	}

	/**
	 * Truncates a string to a maximum length, appending an ellipsis if needed.
	 *
	 * Called by: Template (calendar cell entry label truncation)
	 * Purpose: Keeps entry labels within the narrow cell width without layout overflow
	 *
	 * @param s - The string to truncate, or null
	 * @param max - Maximum character length before truncation
	 * @returns Truncated string or '—' if null/empty
	 */
	function truncate(s: string | null, max: number): string {
		if (!s) return '—';
		return s.length > max ? s.slice(0, max - 1) + '…' : s;
	}

	/**
	 * Converts a UTC ISO 8601 timestamp to a local HH:MM string for time inputs.
	 *
	 * Called by: Employee state seeding (openInquiryPanel, openTerminPanel, inqSaveEmp)
	 * Purpose: Display stored UTC clock times in the browser's local timezone for editing.
	 *
	 * @param iso - ISO 8601 timestamp or null
	 * @returns "HH:MM" in local time, or empty string
	 */
	function isoToLocalTime(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
	}

	/**
	 * Formats decimal hours as "Xh Ym" for display.
	 *
	 * Called by: Template (actual hours display in employee rows)
	 * Purpose: Show human-readable duration computed from clock_in/clock_out.
	 *
	 * Math: totalMinutes = hours * 60; h = floor(totalMinutes / 60); m = totalMinutes % 60
	 *
	 * @param hours - Decimal hours or null
	 * @returns Formatted string like "3h 45m" or "—"
	 */
	function fmtActualHours(hours: number | null): string {
		if (hours == null) return '—';
		const totalMin = Math.round(hours * 60);
		const h = Math.floor(totalMin / 60);
		const m = totalMin % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

	/**
	 * Formats a YYYY-MM-DD date string to German locale display.
	 *
	 * Called by: Template (side panel date display)
	 * Purpose: Shows dates in German format (Montag, 19. März 2026)
	 *
	 * @param d - ISO date string YYYY-MM-DD
	 * @returns German formatted date string
	 */
	function formatDateDE(d: string): string {
		if (!d) return '';
		const [y, m, day] = d.split('-').map(Number);
		return new Date(y, m - 1, day).toLocaleDateString('de-DE', {
			weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
		});
	}

	// ─── Core calendar state ─────────────────────────────────────────────────────

	let currentDate = $state(new Date());
	let schedule = $state<DaySchedule[]>([]);
	let calendarItems = $state<CalendarItem[]>([]);
	let loading = $state(true);

	// Side panel
	let panelSelection = $state<PanelSelection>(null);
	let panelLoading = $state(false);

	// Inquiry panel edit state
	let inqEditStatus = $state('');
	let inqEditNotes = $state('');
	let inqEditPreferredDate = $state('');
	let inqEditStartTime = $state('');
	let inqEditEndTime = $state('');
	let savingInquiry = $state(false);
	let deletingInquiry = $state(false);

	// Inquiry employee state
	let inqEmployees = $state<EmployeeAssignment[]>([]);
	let inqEmpLoading = $state(false);
	let inqEditingEmp = $state<Record<string, { planned: string; clock_in: string; clock_out: string; notes: string }>>({}); 
	let inqSavingEmp = $state<Record<string, boolean>>({});
	let inqRemovingEmp = $state<Record<string, boolean>>({});
	let inqAddEmpId = $state('');
	let inqAddPlannedHours = $state('0');
	let inqAddingEmp = $state(false);

	// Inquiry days (multi-day editor)
	interface InquiryDay {
		day_date: string;
		day_number: number;
		notes: string | null;
	}
	let inqDays = $state<InquiryDay[]>([]);
	let inqDaysLoading = $state(false);
	let inqDaysSaving = $state(false);
	let inqDaysDirty = $state(false);
	let inqUntilDate = $state('');

	// Termin panel edit state
	let termEditTitle = $state('');
	let termEditCategory = $state('internal');
	let termEditStatus = $state('scheduled');
	let termEditDate = $state('');
	let termEditStartTime = $state('09:00');
	let termEditEndTime = $state('');
	let termEditDuration = $state('0');
	let termEditLocation = $state('');
	let termEditDescription = $state('');
	let savingTermin = $state(false);
	let deletingTermin = $state(false);

	// Termin employee state
	let termEmployees = $state<EmployeeAssignment[]>([]);
	let termEmpLoading = $state(false);
	let termEditingEmp = $state<Record<string, { planned: string; clock_in: string; clock_out: string; notes: string }>>({}); 
	let termSavingEmp = $state<Record<string, boolean>>({});
	let termRemovingEmp = $state<Record<string, boolean>>({});
	let termAddEmpId = $state('');
	let termAddPlannedHours = $state('0');
	let termAddingEmp = $state(false);

	// Shared: all active employees
	let allEmployees = $state<EmployeeOption[]>([]);

	// Mobile detection
	let isMobile = $state(false);
	let fabOpen = $state(false);
	$effect(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		isMobile = mq.matches;
		const handler = (ev: MediaQueryListEvent) => { isMobile = ev.matches; };
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// Touch swipe state
	let touchStartX = 0;
	let touchStartY = 0;

	// Drag-and-drop state
	let draggingId = $state<string | null>(null);
	let draggingType = $state<'inquiry' | 'termin' | null>(null);
	let draggingFromDate = $state<string | null>(null);
	let dragOverDate = $state<string | null>(null);
	let navDragOver = $state<'prev' | 'next' | null>(null);
	let navDragTimer: ReturnType<typeof setTimeout> | null = null;

	// Context menu
	let contextMenu = $state<{ x: number; y: number; dateStr: string } | null>(null);

	// Holidays (DE-NI / Niedersachsen)
	let publicHolidays = $state<HolidayEntry[]>([]);
	let schoolHolidays = $state<HolidayEntry[]>([]);
	let loadedHolidayYear = $state(0);

	// Quick-create mode
	let quickCreateMode = $state<'inquiry' | 'termin' | null>(null);
	let quickCreateDate = $state('');
	let quickCreateLoading = $state(false);
	let quickCreateError = $state('');

	// Quick-inquiry form fields
	let qiCustomerMode = $state<'existing' | 'new'>('existing');
	let qiCustomerSearch = $state('');
	let qiCustomerResults = $state<{ id: string; name: string | null; email: string }[]>([]);
	let qiCustomerSearching = $state(false);
	let qiCustomerId = $state<string | null>(null);
	let qiCustomerLabel = $state('');
	let qiEmail = $state('');
	let qiName = $state('');
	let qiPhone = $state('');
	let qiOriginStreet = $state('');
	let qiOriginCity = $state('');
	let qiOriginPostal = $state('');
	let qiDestStreet = $state('');
	let qiDestCity = $state('');
	let qiDestPostal = $state('');
	let qiNotes = $state('');

	// Quick-termin form fields
	let qtTitle = $state('');
	let qtCategory = $state('internal');
	let qtLocation = $state('');
	let qtDuration = $state(8);
	let qtCustomerMode = $state<'none' | 'existing' | 'new'>('none');
	let qtCustomerSearch = $state('');
	let qtCustomerResults = $state<{ id: string; name: string | null; email: string }[]>([]);
	let qtCustomerSearching = $state(false);
	let qtCustomerId = $state<string | null>(null);
	let qtCustomerLabel = $state('');
	let qtNewCustEmail = $state('');
	let qtNewCustName = $state('');
	let qtNewCustPhone = $state('');
	let qtStartTime = $state('09:00');
	let qtEndTime = $state('');

	// ─── Derived ─────────────────────────────────────────────────────────────────

	let year = $derived(currentDate.getFullYear());
	let month = $derived(currentDate.getMonth());
	let monthName = $derived(
		new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(currentDate)
	);

	let calendarDays = $derived(buildCalendar(year, month, schedule));

	let panelOpen = $derived(panelSelection !== null);

	/** Maps each public holiday date → German name. */
	let publicHolidayMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const h of publicHolidays) {
			const name = h.name.find(n => n.language === 'DE')?.text ?? '';
			map.set(h.startDate, name);
		}
		return map;
	});

	/** Maps each date within a school holiday range → holiday name. */
	let schoolHolidayMap = $derived.by(() => {
		const map = new Map<string, string>();
		for (const h of schoolHolidays) {
			const name = h.name.find(n => n.language === 'DE')?.text ?? '';
			const start = new Date(h.startDate + 'T00:00:00');
			const end = new Date(h.endDate + 'T00:00:00');
			for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
				map.set(d.toISOString().slice(0, 10), name);
			}
		}
		return map;
	});

	// ─── View mode ────────────────────────────────────────────────────────────────

	let viewMode = $state<'month' | 'week' | 'day'>('month');

	/** ISO date string for today, e.g. "2026-03-19". Used for isToday checks in week view. */
	let todayStr = $derived.by(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	});

	/**
	 * The Monday of the week containing currentDate.
	 *
	 * Called by: weekDays, weekLabel deriveds
	 * Purpose: Anchor for computing the 7-day window shown in week view.
	 */
	let weekStart = $derived.by(() => {
		const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
		const dow = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
		const diff = dow === 0 ? -6 : 1 - dow;
		d.setDate(d.getDate() + diff);
		return d;
	});

	/**
	 * Array of 7 ISO date strings (Mon–Sun) for the current week.
	 *
	 * Called by: loadSchedule, week grid template
	 * Purpose: Provides the date strings needed to fetch and render each day column.
	 */
	let weekDays = $derived.by(() => {
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(weekStart);
			d.setDate(d.getDate() + i);
			const y = d.getFullYear();
			const m = String(d.getMonth() + 1).padStart(2, '0');
			const day = String(d.getDate()).padStart(2, '0');
			return `${y}-${m}-${day}`;
		});
	});

	/**
	 * Human-readable label for the current week, e.g. "18. März – 24. März 2026".
	 *
	 * Called by: Template (nav label when viewMode === 'week')
	 * Purpose: Replaces the month name in the nav bar during week view.
	 */
	let weekLabel = $derived.by(() => {
		if (weekDays.length === 0) return '';
		const fmt = (ds: string) => {
			const [y, m, d] = ds.split('-').map(Number);
			return new Date(y, m - 1, d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
		};
		const endYear = weekDays[6].split('-')[0];
		return `${fmt(weekDays[0])} – ${fmt(weekDays[6])} ${endYear}`;
	});

	/** ISO date string currently shown in day view. Defaults to today. */
	const _now = new Date();
	let dayViewDate = $state(`${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`);

	/** The most relevant date for the current view — used by FAB to pre-fill the create form. */
	let currentContextDate = $derived(viewMode === 'day' ? dayViewDate : todayStr);

	/**
	 * Returns employees not yet assigned to the currently selected inquiry.
	 *
	 * Called by: Template (inquiry panel add-employee dropdown)
	 * Purpose: Prevents duplicate employee assignments on an inquiry.
	 *
	 * @returns Array of unassigned EmployeeOption
	 */
	function inqUnassignedEmployees(): EmployeeOption[] {
		const assigned = new Set(inqEmployees.map(e => e.employee_id));
		return allEmployees.filter(e => !assigned.has(e.id));
	}

	/**
	 * Returns employees not yet assigned to the currently selected termin.
	 *
	 * Called by: Template (termin panel add-employee dropdown)
	 * Purpose: Prevents duplicate employee assignments on a termin.
	 *
	 * @returns Array of unassigned EmployeeOption
	 */
	function termUnassignedEmployees(): EmployeeOption[] {
		const assigned = new Set(termEmployees.map(e => e.employee_id));
		return allEmployees.filter(e => !assigned.has(e.id));
	}

	/**
	 * Loads scheduled days for the currently selected inquiry.
	 *
	 * Called by: openInquiryPanel (when inquiry has multi-day data)
	 * Purpose: Populates the InquiryDaysEditor so Alex can view and edit the day list.
	 *
	 * @param inqId - UUID of the inquiry
	 */
	async function loadInquiryDays(inqId: string) {
		inqDaysLoading = true;
		inqDaysDirty = false;
		try {
			const res = await apiGet<InquiryDay[]>(`/api/v1/inquiries/${inqId}/days`);
			const days = Array.isArray(res) ? res : [];
			inqDays = days;
			// Initialise until date: last existing day if multi-day, else blank
			inqUntilDate = days.length > 1 ? days[days.length - 1].day_date : '';
		} catch {
			inqDays = [];
		} finally {
			inqDaysLoading = false;
		}
	}

	/**
	 * Persists the current inquiry day list via PUT /api/v1/inquiries/{id}/days.
	 *
	 * Called by: Template (Tage speichern button in inquiry panel days section)
	 * Purpose: Full-replace semantics — sends the complete day list to the API.
	 */
	async function saveInquiryDays() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		if (!applyInquiryDateRange()) {
			showToast('Ungültiger Zeitraum', 'error');
			return;
		}
		const inqId = panelSelection.item.inquiry_id;
		inqDaysSaving = true;
		try {
			await apiPut(`/api/v1/inquiries/${inqId}/days`, { days: inqDays });
			inqDaysDirty = false;
			showToast('Tage gespeichert', 'success');
			await loadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqDaysSaving = false;
		}
	}

	/**
	 * Generates the inquiry day list from the inquiry's origin date to inqUntilDate.
	 *
	 * Called by: saveInquiryDays
	 * Purpose: User picks an end date; all dates from origin through that date are
	 *          generated automatically instead of adding days one by one.
	 *
	 * @returns false if the range is invalid (until before origin, or no origin)
	 */
	function applyInquiryDateRange(): boolean {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return false;
		const originStr = panelSelection.item.scheduled_date?.slice(0, 10)
			?? panelSelection.item.preferred_date?.slice(0, 10) ?? '';
		if (!originStr) return false;
		const origin = new Date(originStr + 'T00:00:00');
		const until  = inqUntilDate ? new Date(inqUntilDate + 'T00:00:00') : origin;
		if (until < origin) return false;
		const days: InquiryDay[] = [];
		const cur = new Date(origin);
		let num = 1;
		while (cur <= until) {
			const y = cur.getFullYear();
			const m = String(cur.getMonth() + 1).padStart(2, '0');
			const d = String(cur.getDate()).padStart(2, '0');
			days.push({ day_date: `${y}-${m}-${d}`, day_number: num++, notes: null });
			cur.setDate(cur.getDate() + 1);
		}
		inqDays = days;
		inqDaysDirty = true;
		return true;
	}

	/**
	 * Navigates the day view to the previous day.
	 *
	 * Called by: Template (left chevron when viewMode === 'day')
	 * Purpose: Moves dayViewDate back by one calendar day.
	 */
	function prevDay() {
		const d = new Date(dayViewDate + 'T00:00:00');
		d.setDate(d.getDate() - 1);
		dayViewDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/**
	 * Navigates the day view to the next day.
	 *
	 * Called by: Template (right chevron when viewMode === 'day')
	 * Purpose: Moves dayViewDate forward by one calendar day.
	 */
	function nextDay() {
		const d = new Date(dayViewDate + 'T00:00:00');
		d.setDate(d.getDate() + 1);
		dayViewDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/**
	 * Returns the German label for the day view date header.
	 *
	 * Called by: Template (nav label when viewMode === 'day')
	 * Purpose: Shows "Montag, 21. März 2026" in the navigation bar.
	 *
	 * @returns Localized German date string
	 */
	function dayViewLabel(): string {
		return formatDateDE(dayViewDate);
	}

	/**
	 * Merges and sorts all entries (inquiries + termine) for a given date by start_time ascending.
	 *
	 * Called by: Month grid template (for sorted chips), week grid template (for full sorted list)
	 * Purpose: Ensures the first appointment of the day appears at the top in both view modes.
	 *
	 * @param dateStr - ISO date string YYYY-MM-DD
	 * @returns Sorted array of discriminated-union entries
	 */
	function buildDayEntries(dateStr: string): Array<{ type: 'inquiry'; item: InquiryItem } | { type: 'termin'; item: CalendarItem }> {
		const sched = schedule.find(s => s.date === dateStr || s.date.startsWith(dateStr));
		const inqEntries = (sched?.inquiries ?? []).map(i => ({ type: 'inquiry' as const, item: i }));
		const termEntries = calendarItems
			.filter(ci => ci.scheduled_date?.startsWith(dateStr))
			.map(ci => ({ type: 'termin' as const, item: ci }));
		return [...inqEntries, ...termEntries].sort((a, b) =>
			(a.item.start_time || '').localeCompare(b.item.start_time || '')
		);
	}

	// ─── Schedule loading ────────────────────────────────────────────────────────

	$effect(() => {
		loadSchedule();
	});

	// ─── Holiday loading (DE-NI / Niedersachsen) ──────────────────────────────────

	$effect(() => {
		const y = year;
		if (y !== loadedHolidayYear) loadHolidays(y);
	});

	/**
	 * Fetches public holidays and school holidays for Niedersachsen (DE-NI) from
	 * the OpenHolidays API for the given year.
	 *
	 * Called by: $effect (on mount and whenever the displayed year changes)
	 * Purpose: Populates publicHolidays / schoolHolidays so the calendar can show
	 *          Feiertage and Schulferien overlays without a backend round-trip.
	 */
	async function loadHolidays(y: number) {
		loadedHolidayYear = y;
		const base = 'https://openholidaysapi.org';
		const params = `countryIsoCode=DE&languageIsoCode=DE&validFrom=${y}-01-01&validTo=${y}-12-31&subdivisionCode=DE-NI`;
		try {
			const [pub, school] = await Promise.all([
				fetch(`${base}/PublicHolidays?${params}`).then(r => r.json()),
				fetch(`${base}/SchoolHolidays?${params}`).then(r => r.json()),
			]);
			publicHolidays = pub;
			schoolHolidays = school;
		} catch {
			// informational only — silently ignore network errors
		}
	}

	/**
	 * Fetches the inquiry schedule for the currently displayed calendar month.
	 *
	 * Called by: $effect (on mount and whenever currentDate changes), prevMonth, nextMonth, CapacityEditor.onSaved
	 * Purpose: Requests the full month's day schedules from
	 *          GET /api/v1/calendar/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD and stores them
	 *          so the calendar grid stays consistent with server state.
	 */
	async function loadSchedule() {
		loading = true;
		try {
			let from: string, to: string;
			let itemMonths: string[];
			if (viewMode === 'week') {
				from = weekDays[0];
				to = weekDays[6];
				const m0 = weekDays[0].slice(0, 7);
				const m6 = weekDays[6].slice(0, 7);
				itemMonths = m0 === m6 ? [m0] : [m0, m6];
			} else if (viewMode === 'day') {
				from = dayViewDate;
				to = dayViewDate;
				itemMonths = [dayViewDate.slice(0, 7)];
			} else {
				from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
				const lastDay = new Date(year, month + 1, 0).getDate();
				to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
				itemMonths = [`${year}-${String(month + 1).padStart(2, '0')}`];
			}
			const schedRes = await apiGet<DaySchedule[] | { dates: DaySchedule[] }>(`/api/v1/calendar/schedule?from=${from}&to=${to}`);
			schedule = Array.isArray(schedRes) ? schedRes : ((schedRes as { dates?: DaySchedule[] }).dates ?? []);
			const itemResults = await Promise.all(
				itemMonths.map(m => apiGet<CalendarItem[]>(`/api/v1/admin/calendar-items?month=${m}`).catch(() => [] as CalendarItem[]))
			);
			calendarItems = itemResults.flat();
		} catch {
			schedule = [];
			calendarItems = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Loads all active employees for assignment dropdowns.
	 *
	 * Called by: openInquiryPanel, openTerminPanel (on first load)
	 * Purpose: Populates the "Mitarbeiter hinzufügen" dropdown in both panel modes.
	 */
	async function ensureEmployeesLoaded() {
		if (allEmployees.length > 0) return;
		try {
			const res = await apiGet<{ employees: EmployeeOption[] }>('/api/v1/admin/employees?active=true&limit=100');
			allEmployees = res.employees;
		} catch {
			allEmployees = [];
		}
	}

	/**
	 * Navigates the calendar view to the previous month and reloads its schedule.
	 *
	 * Called by: Template (left chevron navigation button click)
	 * Purpose: Moves currentDate back by one month.
	 */
	function prevMonth() {
		currentDate = new Date(year, month - 1, 1);
	}

	/**
	 * Navigates the calendar view to the next month and reloads its schedule.
	 *
	 * Called by: Template (right chevron navigation button click)
	 * Purpose: Moves currentDate forward by one month.
	 */
	function nextMonth() {
		currentDate = new Date(year, month + 1, 1);
	}

	/**
	 * Navigates the calendar to the previous week.
	 *
	 * Called by: Template (left chevron when viewMode === 'week')
	 * Purpose: Moves currentDate back 7 days so weekStart shifts to the prior week.
	 */
	function prevWeek() {
		const d = new Date(currentDate);
		d.setDate(d.getDate() - 7);
		currentDate = d;
	}

	/**
	 * Navigates the calendar to the next week.
	 *
	 * Called by: Template (right chevron when viewMode === 'week')
	 * Purpose: Moves currentDate forward 7 days so weekStart shifts to the next week.
	 */
	function nextWeek() {
		const d = new Date(currentDate);
		d.setDate(d.getDate() + 7);
		currentDate = d;
	}

	// ─── Side panel openers ───────────────────────────────────────────────────────

	/**
	 * Opens the side panel in "day" mode showing date, capacity, and entry list.
	 *
	 * Called by: Template (left-click on calendar cell background)
	 * Purpose: Shows the day's capacity override input and a summary of all events
	 *          without forcing a full-page navigation.
	 *
	 * @param day - The DaySchedule from the API for this date, or null if no data
	 * @param dateNum - The day-of-month number (1–31), or null for a padding cell
	 */
	function openDayPanel(day: DaySchedule | null, dateNum: number | null, dateStrOverride?: string) {
		const dateStr = dateStrOverride ?? (dateNum
			? `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`
			: null);
		if (!dateStr) return;
		const schedule = day || { date: dateStr, inquiries: [], available: true, capacity: 1, booked: 0, remaining: 1 };
		panelSelection = { kind: 'day', date: dateStr, schedule };
	}

	/**
	 * Opens the side panel in "inquiry" mode with full editable detail for the clicked inquiry.
	 *
	 * Called by: Template (left-click on inquiry chip)
	 * Purpose: Lets Alex view and edit inquiry status, dates, and employee assignments
	 *          without leaving the calendar page.
	 *
	 * @param e - The click event (stopped from bubbling to day cell handler)
	 * @param inq - The InquiryItem from the calendar schedule
	 */
	async function openInquiryPanel(e: MouseEvent, inq: InquiryItem) {
		e.stopPropagation();
		inqEditStatus = inq.status;
		inqEditNotes = inq.notes ?? '';
		inqEditPreferredDate = inq.scheduled_date?.slice(0, 10) ?? inq.preferred_date?.slice(0, 10) ?? '';
		inqEditStartTime = formatTime(inq.start_time);
		inqEditEndTime = formatTime(inq.end_time);
		panelSelection = { kind: 'inquiry', item: inq };
		// Load employees
		inqEmpLoading = true;
		inqEmployees = [];
		inqEditingEmp = {};
		inqAddEmpId = '';
		inqAddPlannedHours = '8';
		try {
			await ensureEmployeesLoaded();
			const res = await apiGet<{ assignments: EmployeeAssignment[] }>(`/api/v1/inquiries/${inq.inquiry_id}/employees`);
			inqEmployees = res.assignments ?? [];
			// Pre-fill add-form hours from first existing assignment
			if (inqEmployees.length > 0) inqAddPlannedHours = String(inqEmployees[0].planned_hours);
			const empState: typeof inqEditingEmp = {};
			const defaultClockIn = formatTime(inq.start_time);
			const defaultClockOut = formatTime(inq.end_time ?? '');
			for (const emp of inqEmployees) {
				empState[emp.employee_id] = {
					planned: String(emp.planned_hours),
					clock_in: isoToLocalTime(emp.clock_in) || defaultClockIn,
					clock_out: isoToLocalTime(emp.clock_out) || defaultClockOut,
					notes: emp.notes ?? ''
				};
			}
			inqEditingEmp = empState;
			// Load inquiry days for multi-day editor
			await loadInquiryDays(inq.inquiry_id);
		} catch {
			inqEmployees = [];
		} finally {
			inqEmpLoading = false;
		}
	}

	/**
	 * Opens the side panel in "termin" mode with full editable detail for the clicked CalendarItem.
	 *
	 * Called by: Template (left-click on termin chip)
	 * Purpose: Lets Alex view and edit termin fields and employee assignments
	 *          without leaving the calendar page.
	 *
	 * @param e - The click event (stopped from bubbling to day cell handler)
	 * @param ci - The CalendarItem from the calendar items list
	 */
	async function openTerminPanel(e: MouseEvent, ci: CalendarItem) {
		e.stopPropagation();
		termEditTitle = ci.title;
		termEditCategory = ci.category;
		termEditStatus = ci.status;
		termEditDate = ci.scheduled_date ?? '';
		termEditStartTime = formatTime(ci.start_time);
		termEditEndTime = formatTime(ci.end_time);
		termEditDuration = String(ci.duration_hours);
		termEditLocation = ci.location ?? '';
		termEditDescription = ci.description ?? '';
		panelSelection = { kind: 'termin', item: ci };
		// Load detail with employees
		termEmpLoading = true;
		termEmployees = [];
		termEditingEmp = {};
		termAddEmpId = '';
		termAddPlannedHours = '0';
		try {
			await ensureEmployeesLoaded();
			const detail = await apiGet<CalendarItem & { employees: EmployeeAssignment[] }>(`/api/v1/admin/calendar-items/${ci.id}`);
			termEmployees = detail.employees ?? [];
			const empState: typeof termEditingEmp = {};
			for (const emp of termEmployees) {
				empState[emp.employee_id] = {
					planned: String(emp.planned_hours),
					clock_in: isoToLocalTime(emp.clock_in),
					clock_out: isoToLocalTime(emp.clock_out),
					notes: emp.notes ?? ''
				};
			}
			termEditingEmp = empState;
		} catch {
			termEmployees = [];
		} finally {
			termEmpLoading = false;
		}
	}

	/**
	 * Closes the side panel.
	 *
	 * Called by: Template (× button, Escape key)
	 * Purpose: Hides the panel and resets panel state.
	 */
	function closePanel() {
		panelSelection = null;
	}

	// ─── Inquiry panel: save ─────────────────────────────────────────────────────

	/**
	 * Saves editable inquiry fields (status, dates, times) via PATCH.
	 *
	 * Called by: Template (Save button in inquiry panel)
	 * Purpose: PATCHes PATCH /api/v1/inquiries/{id} with updated status and dates,
	 *          then reloads the calendar schedule to keep chips in sync.
	 */
	async function saveInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inq = panelSelection.item;
		savingInquiry = true;
		try {
			await apiPatch(`/api/v1/inquiries/${inq.inquiry_id}`, {
				status: inqEditStatus || undefined,
				notes: inqEditNotes || null,
				preferred_date: inqEditPreferredDate || null,
				start_time: inqEditStartTime ? (inqEditStartTime.length === 5 ? inqEditStartTime + ':00' : inqEditStartTime) : undefined,
				end_time: inqEditEndTime ? (inqEditEndTime.length === 5 ? inqEditEndTime + ':00' : inqEditEndTime) : null,
			});
			showToast('Anfrage gespeichert', 'success');
			await loadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingInquiry = false;
		}
	}

	/**
	 * Permanently deletes the currently selected inquiry after confirmation.
	 *
	 * Called by: Template (Delete button in inquiry panel)
	 * Purpose: DELETEs DELETE /api/v1/inquiries/{id}, then closes the panel
	 *          and reloads the calendar.
	 */
	async function deleteInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inq = panelSelection.item;
		if (!confirm(`Anfrage von "${inq.customer_name}" löschen?`)) return;
		deletingInquiry = true;
		try {
			await apiDelete(`/api/v1/inquiries/${inq.inquiry_id}`);
			showToast('Anfrage gelöscht', 'success');
			closePanel();
			await loadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingInquiry = false;
		}
	}

	// ─── Inquiry panel: employees ────────────────────────────────────────────────

	/**
	 * Saves inline hour/notes edits for an assigned inquiry employee.
	 *
	 * Called by: Template (check icon per inquiry employee row)
	 * Purpose: PATCHes PATCH /api/v1/inquiries/{id}/employees/{emp_id} with updated hours.
	 *
	 * @param empId - The employee UUID to update
	 */
	async function inqSaveEmp(empId: string) {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inqId = panelSelection.item.inquiry_id;
		inqSavingEmp = { ...inqSavingEmp, [empId]: true };
		const s = inqEditingEmp[empId];
		const date = panelSelection.item.scheduled_date?.slice(0, 10)
			?? panelSelection.item.preferred_date?.slice(0, 10)
			?? new Date().toISOString().slice(0, 10);
		try {
			await apiPatch(`/api/v1/inquiries/${inqId}/employees/${empId}`, {
				planned_hours: parseFloat(s.planned) || 0,
				clock_in: s.clock_in ? new Date(`${date}T${s.clock_in}:00`).toISOString() : undefined,
				clock_out: s.clock_out ? new Date(`${date}T${s.clock_out}:00`).toISOString() : undefined,
				notes: s.notes || null
			});
			const res = await apiGet<{ assignments: EmployeeAssignment[] }>(`/api/v1/inquiries/${inqId}/employees`);
			inqEmployees = res.assignments ?? [];
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqSavingEmp = { ...inqSavingEmp, [empId]: false };
		}
	}

	/**
	 * Removes an employee assignment from the currently selected inquiry.
	 *
	 * Called by: Template (× icon per inquiry employee row)
	 * Purpose: DELETEs DELETE /api/v1/inquiries/{id}/employees/{emp_id} after confirmation.
	 *
	 * @param empId - The employee UUID to remove
	 * @param name - Employee display name for the confirm dialog
	 */
	async function inqRemoveEmp(empId: string, name: string) {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		if (!confirm(`${name} aus dieser Anfrage entfernen?`)) return;
		const inqId = panelSelection.item.inquiry_id;
		inqRemovingEmp = { ...inqRemovingEmp, [empId]: true };
		try {
			await apiDelete(`/api/v1/inquiries/${inqId}/employees/${empId}`);
			const res = await apiGet<{ assignments: EmployeeAssignment[] }>(`/api/v1/inquiries/${inqId}/employees`);
			inqEmployees = res.assignments ?? [];
			showToast('Mitarbeiter entfernt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqRemovingEmp = { ...inqRemovingEmp, [empId]: false };
		}
	}

	/**
	 * Assigns a new employee to the currently selected inquiry.
	 *
	 * Called by: Template (Hinzufügen button in inquiry employee section)
	 * Purpose: POSTs POST /api/v1/inquiries/{id}/employees with employee_id and planned_hours.
	 */
	async function inqAddEmployee() {
		if (!panelSelection || panelSelection.kind !== 'inquiry' || !inqAddEmpId) return;
		const inqId = panelSelection.item.inquiry_id;
		inqAddingEmp = true;
		try {
			await apiPost(`/api/v1/inquiries/${inqId}/employees`, {
				employee_id: inqAddEmpId,
				planned_hours: parseFloat(inqAddPlannedHours) || 0
			});
			inqAddEmpId = '';
			const res = await apiGet<{ assignments: EmployeeAssignment[] }>(`/api/v1/inquiries/${inqId}/employees`);
			inqEmployees = res.assignments ?? [];
			// Keep hours pre-filled from first assignment for the next employee
			inqAddPlannedHours = inqEmployees.length > 0 ? String(inqEmployees[0].planned_hours) : '8';
			// Seed edit state for the new employee
			const empState: typeof inqEditingEmp = { ...inqEditingEmp };
			for (const emp of inqEmployees) {
				if (!empState[emp.employee_id]) {
					empState[emp.employee_id] = {
						planned: String(emp.planned_hours),
						clock_in: isoToLocalTime(emp.clock_in) || inqEditStartTime,
						clock_out: isoToLocalTime(emp.clock_out) || inqEditEndTime,
						notes: emp.notes ?? ''
					};
				}
			}
			inqEditingEmp = empState;
			showToast('Mitarbeiter hinzugefügt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqAddingEmp = false;
		}
	}

	// ─── Termin panel: save / delete ─────────────────────────────────────────────

	/**
	 * Saves editable termin fields via PATCH.
	 *
	 * Called by: Template (Save button in termin panel)
	 * Purpose: PATCHes PATCH /api/v1/admin/calendar-items/{id} with updated fields,
	 *          then reloads the calendar schedule.
	 */
	async function saveTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ci = panelSelection.item;
		savingTermin = true;
		try {
			await apiPatch(`/api/v1/admin/calendar-items/${ci.id}`, {
				title: termEditTitle,
				category: termEditCategory,
				status: termEditStatus,
				scheduled_date: termEditDate || null,
				start_time: termEditStartTime ? (termEditStartTime.length === 5 ? termEditStartTime + ':00' : termEditStartTime) : undefined,
				end_time: termEditEndTime ? (termEditEndTime.length === 5 ? termEditEndTime + ':00' : termEditEndTime) : null,
				duration_hours: parseFloat(termEditDuration) || 0,
				location: termEditLocation || null,
				description: termEditDescription || null,
			});
			showToast('Termin gespeichert', 'success');
			await loadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingTermin = false;
		}
	}

	/**
	 * Deletes the currently selected termin after confirmation.
	 *
	 * Called by: Template (Delete button in termin panel)
	 * Purpose: DELETEs DELETE /api/v1/admin/calendar-items/{id}, then closes the panel
	 *          and reloads the calendar.
	 */
	async function deleteTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ci = panelSelection.item;
		if (!confirm(`Termin "${ci.title}" löschen?`)) return;
		deletingTermin = true;
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${ci.id}`);
			showToast('Termin gelöscht', 'success');
			closePanel();
			await loadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingTermin = false;
		}
	}

	// ─── Termin panel: employees ─────────────────────────────────────────────────

	/**
	 * Saves inline hour/notes edits for an assigned termin employee.
	 *
	 * Called by: Template (check icon per termin employee row)
	 * Purpose: PATCHes PATCH /api/v1/admin/calendar-items/{id}/employees/{emp_id}.
	 *
	 * @param empId - The employee UUID to update
	 */
	async function termSaveEmp(empId: string) {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ciId = panelSelection.item.id;
		termSavingEmp = { ...termSavingEmp, [empId]: true };
		const s = termEditingEmp[empId];
		const date = panelSelection.item.scheduled_date.slice(0, 10);
		try {
			await apiPatch(`/api/v1/admin/calendar-items/${ciId}/employees/${empId}`, {
				planned_hours: parseFloat(s.planned) || 0,
				clock_in: s.clock_in ? new Date(`${date}T${s.clock_in}:00`).toISOString() : undefined,
				clock_out: s.clock_out ? new Date(`${date}T${s.clock_out}:00`).toISOString() : undefined,
				notes: s.notes || null
			});
			const detail = await apiGet<{ employees: EmployeeAssignment[] }>(`/api/v1/admin/calendar-items/${ciId}`);
			termEmployees = detail.employees ?? [];
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			termSavingEmp = { ...termSavingEmp, [empId]: false };
		}
	}

	/**
	 * Removes an employee assignment from the currently selected termin.
	 *
	 * Called by: Template (× icon per termin employee row)
	 * Purpose: DELETEs DELETE /api/v1/admin/calendar-items/{id}/employees/{emp_id}.
	 *
	 * @param empId - The employee UUID to remove
	 * @param name - Display name for confirm dialog
	 */
	async function termRemoveEmp(empId: string, name: string) {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		if (!confirm(`${name} aus diesem Termin entfernen?`)) return;
		const ciId = panelSelection.item.id;
		termRemovingEmp = { ...termRemovingEmp, [empId]: true };
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${ciId}/employees/${empId}`);
			const detail = await apiGet<{ employees: EmployeeAssignment[] }>(`/api/v1/admin/calendar-items/${ciId}`);
			termEmployees = detail.employees ?? [];
			showToast('Mitarbeiter entfernt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			termRemovingEmp = { ...termRemovingEmp, [empId]: false };
		}
	}

	/**
	 * Assigns a new employee to the currently selected termin.
	 *
	 * Called by: Template (Hinzufügen button in termin employee section)
	 * Purpose: POSTs POST /api/v1/admin/calendar-items/{id}/employees.
	 */
	async function termAddEmployee() {
		if (!panelSelection || panelSelection.kind !== 'termin' || !termAddEmpId) return;
		const ciId = panelSelection.item.id;
		termAddingEmp = true;
		try {
			await apiPost(`/api/v1/admin/calendar-items/${ciId}/employees`, {
				employee_id: termAddEmpId,
				planned_hours: parseFloat(termAddPlannedHours) || 0
			});
			termAddEmpId = '';
			termAddPlannedHours = '0';
			const detail = await apiGet<{ employees: EmployeeAssignment[] }>(`/api/v1/admin/calendar-items/${ciId}`);
			termEmployees = detail.employees ?? [];
			const empState: typeof termEditingEmp = { ...termEditingEmp };
			for (const emp of termEmployees) {
				if (!empState[emp.employee_id]) {
					empState[emp.employee_id] = {
						planned: String(emp.planned_hours),
						clock_in: isoToLocalTime(emp.clock_in) || termEditStartTime,
						clock_out: isoToLocalTime(emp.clock_out) || termEditEndTime,
						notes: emp.notes ?? ''
					};
				}
			}
			termEditingEmp = empState;
			showToast('Mitarbeiter hinzugefügt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			termAddingEmp = false;
		}
	}

	// ─── Drag and drop ────────────────────────────────────────────────────────────

	/**
	 * Initiates a drag operation for a calendar entry.
	 *
	 * Called by: Template (ondragstart on cal-entry span)
	 * Purpose: Records which item is being dragged and from which date so the drop
	 *          handler knows what to reschedule and can skip no-op drops.
	 *
	 * @param e - The DragEvent
	 * @param id - UUID of the item being dragged
	 * @param type - 'inquiry' or 'termin'
	 * @param fromDate - ISO date string of the source cell
	 */
	function onEntryDragStart(e: DragEvent, id: string, type: 'inquiry' | 'termin', fromDate: string) {
		draggingId = id;
		draggingType = type;
		draggingFromDate = fromDate;
		e.dataTransfer!.effectAllowed = 'move';
	}

	/**
	 * Allows a calendar cell to accept a drop and highlights it.
	 *
	 * Called by: Template (ondragover on cal-cell)
	 * Purpose: Prevents default browser behavior (which disallows drops) and sets
	 *          dragOverDate so the hovered cell gets a visual highlight class.
	 *
	 * @param e - The DragEvent
	 * @param dateStr - ISO date string of the target cell
	 */
	function onCellDragOver(e: DragEvent, dateStr: string) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverDate = dateStr;
	}

	/**
	 * Clears the drag-over highlight when the dragged item leaves a cell.
	 *
	 * Called by: Template (ondragleave on cal-cell)
	 * Purpose: Removes the visual drop-target highlight when cursor exits a cell.
	 */
	function onCellDragLeave() {
		dragOverDate = null;
	}

	/**
	 * Highlights a nav arrow and schedules a month change after 700 ms when dragging over it.
	 *
	 * Called by: Template (ondragover on prev/next month buttons while dragging)
	 * Purpose: Allows Alex to drag an entry past the month boundary by hovering over
	 *          the navigation arrows.
	 *
	 * @param e - The DragEvent
	 * @param direction - 'prev' or 'next'
	 */
	function onNavDragOver(e: DragEvent, direction: 'prev' | 'next') {
		if (!draggingId) return;
		e.preventDefault();
		navDragOver = direction;
		if (navDragTimer) return;
		navDragTimer = setTimeout(() => {
			navDragTimer = null;
			if (direction === 'prev') prevMonth();
			else nextMonth();
		}, 700);
	}

	/**
	 * Cancels the pending month-change timer when the dragged item leaves a nav arrow.
	 *
	 * Called by: Template (ondragleave on prev/next month buttons)
	 * Purpose: Prevents accidental month flip when cursor briefly passes over an arrow.
	 */
	function onNavDragLeave() {
		navDragOver = null;
		if (navDragTimer) { clearTimeout(navDragTimer); navDragTimer = null; }
	}

	/**
	 * Handles dropping an inquiry or termin onto a target date cell and persists the new date.
	 *
	 * Called by: Template (ondrop on cal-cell)
	 * Purpose: PATCHes the item's date to the drop target date, then reloads the schedule.
	 *
	 * @param e - The DragEvent
	 * @param dateStr - ISO date string of the target cell
	 */
	async function onCellDrop(e: DragEvent, dateStr: string) {
		e.preventDefault();
		dragOverDate = null;
		const id = draggingId;
		const type = draggingType;
		const fromDate = draggingFromDate;
		draggingId = null;
		draggingType = null;
		draggingFromDate = null;
		if (!id || fromDate === dateStr) return;
		try {
			if (type === 'termin') {
				await apiPatch(`/api/v1/admin/calendar-items/${id}`, { scheduled_date: dateStr });
			} else {
				await apiPatch(`/api/v1/inquiries/${id}`, { preferred_date: dateStr });
			}
			showToast('Termin verschoben', 'success');
			await loadSchedule();
		} catch (err) {
			showToast((err as Error).message, 'error');
		}
	}

	// ─── Context menu ─────────────────────────────────────────────────────────────

	/**
	 * Opens the right-click context menu anchored to the cursor position.
	 *
	 * Called by: Template (oncontextmenu on cal-cell)
	 * Purpose: Shows a mini popup with "Anfrage erstellen" / "Termin erstellen" options.
	 *
	 * @param e - The MouseEvent from right-click
	 * @param dateStr - ISO date string of the clicked cell
	 */
	function onCellContextMenu(e: MouseEvent, dateStr: string) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, dateStr };
	}

	/**
	 * Closes the context menu.
	 *
	 * Called by: Template (onclick on backdrop, onkeydown Escape)
	 * Purpose: Hides the floating context menu without taking any action.
	 */
	function closeContextMenu() {
		contextMenu = null;
	}

	/**
	 * Opens a quick-create form for the given type, pre-seeded with the context menu date.
	 *
	 * Called by: Template (context menu option click)
	 * Purpose: Transitions from the context menu to the appropriate creation form.
	 *
	 * @param mode - 'inquiry' or 'termin'
	 */
	function openQuickCreate(mode: 'inquiry' | 'termin', dateOverride?: string) {
		quickCreateDate = dateOverride ?? contextMenu!.dateStr;
		contextMenu = null;
		quickCreateMode = mode;
		quickCreateError = '';
		qiCustomerMode = 'existing'; qiCustomerSearch = ''; qiCustomerResults = []; qiCustomerId = null; qiCustomerLabel = '';
		qiEmail = ''; qiName = ''; qiPhone = '';
		qiOriginStreet = ''; qiOriginCity = ''; qiOriginPostal = '';
		qiDestStreet = ''; qiDestCity = ''; qiDestPostal = '';
		qiNotes = '';
		qtTitle = ''; qtCategory = 'internal'; qtLocation = ''; qtDuration = 8;
		qtStartTime = '09:00'; qtEndTime = '';
		qtCustomerMode = 'none'; qtCustomerSearch = ''; qtCustomerResults = []; qtCustomerId = null; qtCustomerLabel = '';
		qtNewCustEmail = ''; qtNewCustName = ''; qtNewCustPhone = '';
	}

	/**
	 * Searches for existing customers for the inquiry quick-create customer field.
	 *
	 * Called by: Template (oninput on customer search in inquiry form)
	 * Purpose: Lets Alex find and link an existing customer to the new inquiry.
	 *
	 * @param q - Search query string
	 */
	async function searchQiCustomers(q: string) {
		if (q.trim().length < 2) { qiCustomerResults = []; return; }
		qiCustomerSearching = true;
		try {
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			qiCustomerResults = res.customers;
		} catch { qiCustomerResults = []; }
		finally { qiCustomerSearching = false; }
	}

	/**
	 * Creates a customer (if new mode selected) then an inquiry via the API, and reloads the calendar.
	 *
	 * Called by: Template (form submit in quick-inquiry modal)
	 * Purpose: Allows Alex to quickly schedule a new inquiry directly from the calendar.
	 */
	async function submitQuickInquiry() {
		if (!qiOriginStreet.trim() || !qiOriginCity.trim()) { quickCreateError = 'Auszugsadresse (Straße, Stadt) erforderlich'; return; }
		if (!qiDestStreet.trim() || !qiDestCity.trim()) { quickCreateError = 'Einzugsadresse (Straße, Stadt) erforderlich'; return; }
		if (qiCustomerMode === 'existing' && !qiCustomerId) { quickCreateError = 'Bitte einen Kunden auswählen'; return; }
		if (qiCustomerMode === 'new' && !qiEmail.trim()) { quickCreateError = 'E-Mail ist erforderlich'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			let customerId = qiCustomerId;
			if (qiCustomerMode === 'new') {
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qiEmail.trim(),
					name: qiName.trim() || null,
					phone: qiPhone.trim() || null,
				});
				customerId = c.id;
			}
			await apiPost('/api/v1/inquiries', {
				customer_id: customerId,
				preferred_date: quickCreateDate,
				origin: {
					street: qiOriginStreet.trim(),
					city: qiOriginCity.trim(),
					postal_code: qiOriginPostal.trim() || null,
				},
				destination: {
					street: qiDestStreet.trim(),
					city: qiDestCity.trim(),
					postal_code: qiDestPostal.trim() || null,
				},
				notes: qiNotes.trim() || null,
			});
			showToast('Anfrage erstellt', 'success');
			quickCreateMode = null;
			await loadSchedule();
		} catch (err) {
			quickCreateError = (err as Error).message;
		} finally {
			quickCreateLoading = false;
		}
	}

	/**
	 * Searches for existing customers for the termin quick-create customer field.
	 *
	 * Called by: Template (oninput on customer search in termin form)
	 * Purpose: Lets Alex find and link an existing customer to the new Termin.
	 *
	 * @param q - Search query string
	 */
	async function searchQtCustomers(q: string) {
		if (q.trim().length < 2) { qtCustomerResults = []; return; }
		qtCustomerSearching = true;
		try {
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			qtCustomerResults = res.customers;
		} catch { qtCustomerResults = []; }
		finally { qtCustomerSearching = false; }
	}

	/**
	 * Creates a calendar item (Termin) via the API and reloads the calendar.
	 *
	 * Called by: Template (form submit in quick-termin modal)
	 * Purpose: Allows Alex to schedule internal events directly from the calendar grid.
	 */
	async function submitQuickTermin() {
		if (!qtTitle.trim()) { quickCreateError = 'Titel ist erforderlich'; return; }
		if (!qtStartTime) { quickCreateError = 'Startzeit ist erforderlich'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			let customerId: string | null = qtCustomerId;
			if (qtCustomerMode === 'new') {
				if (!qtNewCustEmail.trim()) { quickCreateError = 'E-Mail ist erforderlich'; return; }
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qtNewCustEmail.trim(),
					name: qtNewCustName.trim() || null,
					phone: qtNewCustPhone.trim() || null,
				});
				customerId = c.id;
			}
			await apiPost('/api/v1/admin/calendar-items', {
				title: qtTitle.trim(),
				category: qtCategory,
				location: qtLocation.trim() || null,
				scheduled_date: quickCreateDate,
				start_time: qtStartTime.length === 5 ? qtStartTime + ':00' : qtStartTime,
				end_time: qtEndTime ? (qtEndTime.length === 5 ? qtEndTime + ':00' : qtEndTime) : null,
				duration_hours: qtDuration,
				customer_id: customerId,
			});
			showToast('Termin erstellt', 'success');
			quickCreateMode = null;
			await loadSchedule();
		} catch (err) {
			quickCreateError = (err as Error).message;
		} finally {
			quickCreateLoading = false;
		}
	}

	/**
	 * Records the touch start position for swipe detection.
	 *
	 * Called by: Template (ontouchstart on calendar-scroll)
	 * Purpose: Captures X/Y so onTouchEnd can compute swipe direction.
	 */
	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	/**
	 * Detects horizontal swipe and navigates the calendar accordingly.
	 *
	 * Called by: Template (ontouchend on calendar-scroll)
	 * Purpose: Left swipe → next period, right swipe → previous period.
	 * Ignores vertical scrolls and swipes shorter than 50px.
	 */
	function onTouchEnd(e: TouchEvent) {
		const dx = e.changedTouches[0].clientX - touchStartX;
		const dy = e.changedTouches[0].clientY - touchStartY;
		if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx) * 1.5) return;
		if (dx < 0) {
			if (viewMode === 'month') nextMonth();
			else if (viewMode === 'week') nextWeek();
			else nextDay();
		} else {
			if (viewMode === 'month') prevMonth();
			else if (viewMode === 'week') prevWeek();
			else prevDay();
		}
	}

	const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') { closePanel(); closeContextMenu(); quickCreateMode = null; } }} />

<div class="page">
	<div class="page-header">
		<h1>Kalender</h1>
	</div>

	<!-- Main layout: calendar + side panel -->
	<div class="main-layout" class:panel-open={panelOpen}>
		<!-- Calendar column -->
		<div class="calendar-col">
			<div class="cal-nav">
				<div class="view-toggle">
					<button class="view-btn" class:view-btn-active={viewMode === 'month'} onclick={() => { viewMode = 'month'; }}>Monat</button>
					<button class="view-btn" class:view-btn-active={viewMode === 'week'} onclick={() => { viewMode = 'week'; }}>Woche</button>
					<button class="view-btn" class:view-btn-active={viewMode === 'day'} onclick={() => { viewMode = 'day'; }}>Tag</button>
				</div>
				<div class="nav-row">
					<button
						onclick={viewMode === 'month' ? prevMonth : viewMode === 'week' ? prevWeek : prevDay}
						ondragover={(e) => onNavDragOver(e, 'prev')}
						ondragleave={onNavDragLeave}
						class:nav-drag-active={navDragOver === 'prev'}
					><ChevronLeft size={20} /></button>
					<span class="month-label">{viewMode === 'month' ? monthName : viewMode === 'week' ? weekLabel : dayViewLabel()}</span>
					<button
						onclick={viewMode === 'month' ? nextMonth : viewMode === 'week' ? nextWeek : nextDay}
						ondragover={(e) => onNavDragOver(e, 'next')}
						ondragleave={onNavDragLeave}
						class:nav-drag-active={navDragOver === 'next'}
					><ChevronRight size={20} /></button>
				</div>
			</div>

			<div class="calendar-scroll" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
				{#if viewMode === 'month'}
				<div class="calendar-grid">
					{#each weekdays as day}
						<div class="cal-header">{day}</div>
					{/each}

					{#each calendarDays as day}
						{#if day.date === null}
							<div class="cal-cell empty"></div>
						{:else}
							{@const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`}
							{@const allEntries = buildDayEntries(dateStr)}
							{@const booked = day.schedule?.booked || 0}
							{@const capacity = day.schedule?.capacity || 1}
							{@const overbooked = booked > capacity}
							{@const publicHol = publicHolidayMap.get(dateStr)}
							{@const schoolHol = schoolHolidayMap.get(dateStr)}
							<button
								class="cal-cell"
								class:today={day.isToday}
								class:overbooked
								class:school-holiday={!!schoolHol}
								class:drag-over={dragOverDate === dateStr}
								onclick={() => openDayPanel(day.schedule, day.date)}
								ondragover={(e) => onCellDragOver(e, dateStr)}
								ondragleave={onCellDragLeave}
								ondrop={(e) => onCellDrop(e, dateStr)}
								oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
							>
								<div class="cal-cell-header">
									<span class="cal-date" class:cal-date-today={day.isToday}>{day.date}</span>
									{#if overbooked}<span class="cal-overbooked-icon" title="Überbucht">⚠</span>{/if}
									{#if publicHol}<span class="holiday-badge">🎉 {publicHol}</span>{/if}
								</div>
								{#if schoolHol}<div class="school-holiday-label">{schoolHol}</div>{/if}
								<div class="cal-entries">
									{#each allEntries.slice(0, 4) as entry}
										{#if entry.type === 'inquiry'}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<span
												class="cal-entry {inquiryEntryClass(entry.item.status)}"
												title="{entry.item.customer_name ?? ''} · {entry.item.inquiry_id}"
												draggable="true"
												ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
												onclick={(e) => openInquiryPanel(e, entry.item)}
												role="button"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
											>
												<span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.customer_name, 10)}{#if entry.item.day_number && entry.item.total_days && entry.item.total_days > 1}<span class="multiday-badge"> T{entry.item.day_number}/{entry.item.total_days}</span>{/if}
											</span>
										{:else}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<span
												class="cal-entry {termineEntryClass(entry.item.category)}"
												title="{entry.item.title}{entry.item.location ? ' @ ' + entry.item.location : ''}"
												draggable="true"
												ondragstart={(e) => onEntryDragStart(e, entry.item.id, 'termin', dateStr)}
												onclick={(e) => openTerminPanel(e, entry.item)}
												role="button"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, entry.item)}
											>
												<span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.title, 14)}
											</span>
										{/if}
									{/each}
									{#if allEntries.length > 4}
										<span class="cal-more">+{allEntries.length - 4} mehr</span>
									{/if}
								</div>
							</button>
						{/if}
					{/each}
				</div>
				{:else if viewMode === 'week'}
				<!-- ─── Week view ─────────────────────────────────────────────── -->
				<div class="week-grid">
					{#each weekDays as dateStr}
						{@const sched = schedule.find(s => s.date === dateStr || s.date.startsWith(dateStr))}
						{@const allEntries = buildDayEntries(dateStr)}
						{@const booked = sched?.booked ?? 0}
						{@const capacity = sched?.capacity ?? 1}
						{@const overbooked = booked > capacity}
						{@const isToday = dateStr === todayStr}
						{@const [wy, wm, wd] = dateStr.split('-').map(Number)}
						{@const weekDayLabel = new Date(wy, wm - 1, wd).toLocaleDateString('de-DE', { weekday: 'short' })}
						{@const wPublicHol = publicHolidayMap.get(dateStr)}
						{@const wSchoolHol = schoolHolidayMap.get(dateStr)}
						<button
							class="week-cell"
							class:today={isToday}
							class:overbooked
							class:school-holiday={!!wSchoolHol}
							class:drag-over={dragOverDate === dateStr}
							onclick={() => openDayPanel(sched ?? null, null, dateStr)}
							ondragover={(e) => onCellDragOver(e, dateStr)}
							ondragleave={onCellDragLeave}
							ondrop={(e) => onCellDrop(e, dateStr)}
							oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
						>
							<div class="week-cell-header">
								<span class="week-day-name">{weekDayLabel}</span>
								<span class="week-day-num" class:week-day-today={isToday}>{wd}.</span>
								{#if booked > 0}
									<span class="week-cap-badge" class:week-cap-over={overbooked}>{booked}/{capacity}</span>
								{/if}
								{#if overbooked}<span class="cal-overbooked-icon">⚠</span>{/if}
								{#if wPublicHol}<span class="holiday-badge">🎉 {wPublicHol}</span>{/if}
								{#if wSchoolHol}<span class="school-holiday-label">{wSchoolHol}</span>{/if}
							</div>
															<div class="week-entries">
									{#each allEntries as entry}
										{#if entry.type === 'inquiry'}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="week-card {inquiryEntryClass(entry.item.status)}"
												draggable="true"
												ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
												onclick={(e) => openInquiryPanel(e, entry.item)}
												role="button"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
											>
												{#if entry.item.total_days && entry.item.total_days > 1}
													<div class="wc-multiday-bar">
														{#if entry.item.day_number && entry.item.day_number > 1}<span class="wc-md-arrow wc-md-left">←</span>{/if}
														<span class="wc-md-label">Tag {entry.item.day_number ?? 1}/{entry.item.total_days}</span>
														{#if entry.item.day_number && entry.item.day_number < entry.item.total_days}<span class="wc-md-arrow wc-md-right">→</span>{/if}
													</div>
												{/if}
												<div class="wc-header">
													<span class="wc-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
													<StatusBadge status={entry.item.status} />
												</div>
												<div class="wc-name">{entry.item.customer_name ?? '—'}</div>
												{#if entry.item.departure_address || entry.item.arrival_address}
													<div class="wc-route">{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</div>
												{/if}
												{#if entry.item.offer_price_cents || entry.item.volume_m3}
													<div class="wc-meta">
														{#if entry.item.offer_price_cents}<span class="wc-price">{(calculateBruttoCents(entry.item.offer_price_cents) / 100).toFixed(0)} €</span>{/if}
														{#if entry.item.volume_m3}<span class="wc-vol">{entry.item.volume_m3.toFixed(1)} m³</span>{/if}
													</div>
												{/if}
												{#if entry.item.employee_names}
													<div class="wc-employees">👥 {entry.item.employee_names}</div>
												{/if}
												{#if entry.item.notes}
													<div class="wc-notes">{truncate(entry.item.notes, 70)}</div>
												{/if}
											</div>
										{:else}
											<!-- svelte-ignore a11y_no_static_element_interactions -->
											<div
												class="week-card {termineEntryClass(entry.item.category)}"
												draggable="true"
												ondragstart={(e) => onEntryDragStart(e, entry.item.id, 'termin', dateStr)}
												onclick={(e) => openTerminPanel(e, entry.item)}
												role="button"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, entry.item)}
											>
												<div class="wc-header">
													<span class="wc-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
													<span class="cat-badge">{CATEGORY_LABELS[entry.item.category] ?? entry.item.category}</span>
												</div>
												<div class="wc-name">{entry.item.title}</div>
												{#if entry.item.location}
													<div class="wc-route">📍 {entry.item.location}</div>
												{/if}
												{#if entry.item.duration_hours > 0}
													<div class="wc-meta"><span class="wc-vol">⏱ {entry.item.duration_hours} h</span></div>
												{/if}
												{#if entry.item.description}
													<div class="wc-notes">{truncate(entry.item.description, 70)}</div>
												{/if}
											</div>
										{/if}
									{/each}
									{#if allEntries.length === 0}
										<span class="week-no-entries">—</span>
									{/if}
								</div>
						</button>
					{/each}
				</div>
				{:else}
				<!-- ─── Day timeline view ──────────────────────────────────────────── -->
				{@const daySched = schedule.find(s => s.date === dayViewDate || s.date.startsWith(dayViewDate))}
				{@const dayAllEntries = buildDayEntries(dayViewDate)}
				{@const dayTermineList = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dayViewDate))}
				<div class="day-timeline">
					<div class="day-tl-header">
						<div class="day-tl-meta">
							{#if daySched}
								<span class="day-tl-cap">Kapazität: {daySched.booked}/{daySched.capacity}</span>
							{/if}
							{#if publicHolidayMap.get(dayViewDate)}
								<span class="holiday-badge">🎉 {publicHolidayMap.get(dayViewDate)}</span>
							{/if}
							{#if schoolHolidayMap.get(dayViewDate)}
								<span class="school-holiday-label">{schoolHolidayMap.get(dayViewDate)}</span>
							{/if}
						</div>
						<button
							class="btn btn-sm btn-ghost"
							onclick={() => onCellContextMenu({ clientX: 0, clientY: 60, preventDefault: () => {} } as MouseEvent, dayViewDate)}
						>+ Eintrag</button>
					</div>

					<div class="day-tl-grid">
						{#each Array.from({ length: 14 }, (_, i) => i + 6) as hour}
							<div class="tl-row">
								<div class="tl-time">{String(hour).padStart(2, '0')}:00</div>
								<div class="tl-lane">
									{#each dayAllEntries as entry}
										{@const startH = parseInt((entry.item.start_time || '06:00').slice(0, 2))}
										{@const endH = parseInt((entry.item.end_time || (String(startH + 1).padStart(2, '0') + ':00')).slice(0, 2))}
										{#if startH === hour}
											<button
												class="tl-block {entry.type === 'inquiry' ? inquiryEntryClass(entry.item.status) : termineEntryClass(entry.type === 'termin' ? entry.item.category : 'other')}"
												onclick={(e) => entry.type === 'inquiry' ? openInquiryPanel(e, entry.item) : openTerminPanel(e, entry.item)}
												style="height:{Math.max(1, endH - startH) * 48}px"
											>
												<span class="tl-block-time">{formatTime(entry.item.start_time)}–{formatTime(entry.item.end_time)}</span>
												<span class="tl-block-name">{entry.type === 'inquiry' ? (entry.item.customer_name ?? '—') : entry.item.title}</span>
												{#if entry.type === 'inquiry' && entry.item.employee_names}
													<span class="tl-block-emp">👥 {entry.item.employee_names}</span>
												{/if}
											</button>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
						{#if dayAllEntries.length === 0}
							<div class="day-tl-empty">Keine Einträge für diesen Tag</div>
						{/if}
					</div>
				</div>
				{/if}

			<!-- Holiday legend -->
			{#if publicHolidays.length > 0 || schoolHolidays.length > 0}
				<div class="holiday-legend">
					<span class="legend-item"><span class="legend-dot legend-public"></span> Feiertag</span>
					<span class="legend-item"><span class="legend-dot legend-school"></span> Schulferien (NI)</span>
				</div>
			{/if}
			</div>
		</div>

		<!-- Mobile panel backdrop -->
		{#if isMobile && panelOpen}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="sheet-backdrop" onclick={closePanel} onkeydown={(e) => e.key === 'Escape' && closePanel()}></div>
		{/if}

		<!-- Side panel (desktop) / bottom sheet (mobile) -->
		<aside class="side-panel" class:panel-visible={panelOpen} aria-label="Details">
			<!-- Drag handle (mobile only) -->
			<div class="sheet-handle-bar" onclick={closePanel} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && closePanel()}>
				<span class="sheet-handle"></span>
			</div>
			{#if !panelSelection}
				<div class="panel-placeholder">
					<span class="placeholder-icon">📋</span>
					<p>Klicke auf einen Eintrag</p>
				</div>
			{:else}
				<div class="panel-header">
					{#if panelSelection.kind === 'day'}
						<h2 class="panel-title">{formatDateDE(panelSelection.date)}</h2>
					{:else if panelSelection.kind === 'inquiry'}
						<div class="panel-title-block">
							<h2 class="panel-title">{panelSelection.item.customer_name ?? 'Anfrage'}</h2>
							{#if panelSelection.item.scheduled_date || panelSelection.item.preferred_date}
								<span class="panel-subtitle">{(panelSelection.item.scheduled_date?.slice(0,10) ?? panelSelection.item.preferred_date?.slice(0,10) ?? '').split('-').reverse().join('.')}</span>
							{/if}
						</div>
					{:else}
						<h2 class="panel-title">{panelSelection.item.title}</h2>
					{/if}
					<button class="panel-close" onclick={closePanel} title="Schließen"><X size={16} /></button>
				</div>

				<div class="panel-body">

					<!-- ─── DAY PANEL ──────────────────────────────────────────── -->
					{#if panelSelection.kind === 'day'}
						{@const ds = panelSelection.schedule}
						{@const dayPanelDate = panelSelection.date}
						{@const dayTermine = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dayPanelDate))}

						<div class="panel-section">
							<div class="panel-kv">
								<span class="kv-label">Gebucht</span>
								<span class="kv-value">{ds.booked} / {ds.capacity}</span>
							</div>
							<div class="panel-kv">
								<span class="kv-label">Verbleibend</span>
								<span class="kv-value">{ds.remaining}</span>
							</div>
						</div>

						<CapacityEditor
							date={ds.date.split('T')[0]}
							currentCapacity={ds.capacity}
							onSaved={async (newCapacity) => {
								await loadSchedule();
								const dateStr = ds.date.split('T')[0];
								const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
								if (updated) {
									panelSelection = { kind: 'day', date: dateStr, schedule: updated };
								}
							}}
						/>

						{#if ds.inquiries.length > 0 || dayTermine.length > 0}
							<div class="panel-section">
								<div class="section-title">Tagesplan ({ds.inquiries.length + dayTermine.length})</div>
								{#each ds.inquiries as inq}
									<div class="day-entry">
										<div class="day-entry-top">
											<button class="entry-link-btn" onclick={(e) => openInquiryPanel(e, inq)}>
												{inq.customer_name || 'Unbekannt'}
											</button>
											<StatusBadge status={inq.status} />
											<span class="time-badge">{formatTime(inq.start_time)} – {formatTime(inq.end_time)}</span>
										</div>
										{#if inq.departure_address || inq.arrival_address}
											<span class="entry-route">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
										{/if}
										<a href="/admin/inquiries/{inq.inquiry_id}" class="entry-detail-link">
											<ExternalLink size={11} /> Detail öffnen
										</a>
									</div>
								{/each}
								{#each dayTermine as ci}
									<div class="day-entry day-entry-termin">
										<div class="day-entry-top">
											<button class="entry-link-btn" onclick={(e) => openTerminPanel(e, ci)}>
												{ci.title}
											</button>
											<span class="cat-badge">{CATEGORY_LABELS[ci.category] ?? ci.category}</span>
											<span class="time-badge">{formatTime(ci.start_time)}{ci.end_time ? ' – ' + formatTime(ci.end_time) : ''}</span>
										</div>
										{#if ci.location}
											<span class="entry-route">{ci.location}</span>
										{/if}
										<a href="/admin/calendar-items/{ci.id}" class="entry-detail-link">
											<ExternalLink size={11} /> Detail öffnen
										</a>
									</div>
								{/each}
							</div>
						{:else}
							<p class="panel-empty">Keine Einträge</p>
						{/if}

					<!-- ─── INQUIRY PANEL ───────────────────────────────────────── -->
					{:else if panelSelection.kind === 'inquiry'}
						{@const inq = panelSelection.item}

						<div class="panel-section">
							<div class="panel-kv">
								<span class="kv-label">E-Mail</span>
								<span class="kv-value kv-muted">{inq.customer_email ?? '—'}</span>
							</div>
							{#if inq.departure_address || inq.arrival_address}
								<div class="panel-kv">
									<span class="kv-label">Route</span>
									<span class="kv-value kv-muted">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
								</div>
							{/if}
							{#if inq.volume_m3}
								<div class="panel-kv">
									<span class="kv-label">Volumen</span>
									<span class="kv-value">{inq.volume_m3.toFixed(1)} m³</span>
								</div>
							{/if}
							{#if inq.offer_price_cents}
								<div class="panel-kv">
									<span class="kv-label">Angebotspreis</span>
									<span class="kv-value">{(calculateBruttoCents(inq.offer_price_cents) / 100).toFixed(0)} € brutto</span>
								</div>
							{/if}
						</div>

						<div class="panel-section">
							<div class="section-title">Bearbeiten</div>
							<div class="field">
								<label for="inq-status">Status</label>
								<select id="inq-status" class="neu-input" bind:value={inqEditStatus}>
									{#each INQUIRY_STATUSES as s}
										<option value={s}>{INQUIRY_STATUS_LABELS[s] ?? s}</option>
									{/each}
								</select>
							</div>
							<div class="field">
								<label for="inq-pref-date">Datum</label>
								<input id="inq-pref-date" type="date" class="neu-input" bind:value={inqEditPreferredDate} />
							</div>
							<div class="field-row">
								<div class="field">
									<label for="inq-start">Startzeit</label>
									<input id="inq-start" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={inqEditStartTime} />
								</div>
								<div class="field">
									<label for="inq-end">Endzeit</label>
									<input id="inq-end" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={inqEditEndTime} />
								</div>
							</div>
						<div class="field">
							<label for="inq-notes">Notizen</label>
							<textarea id="inq-notes" rows={3} class="neu-input" bind:value={inqEditNotes}></textarea>
						</div>
							<div class="panel-actions">
								<button class="btn btn-primary btn-sm" onclick={saveInquiry} disabled={savingInquiry}>
									<Save size={13} />
									{savingInquiry ? 'Speichern...' : 'Speichern'}
								</button>
								<a href="/admin/inquiries/{inq.inquiry_id}" class="btn btn-ghost btn-sm">
									<ExternalLink size={13} /> Detail
								</a>
								<button class="btn btn-danger btn-sm" onclick={deleteInquiry} disabled={deletingInquiry}>
									{deletingInquiry ? '...' : 'Löschen'}
								</button>
							</div>
						</div>

						<!-- Employee assignments -->
						<div class="panel-section">
							<div class="section-title">Mitarbeiter ({inqEmployees.length})</div>

							{#if inqEmpLoading}
								<p class="panel-loading">Laden...</p>
							{:else}
								{#if inqEmployees.length > 0}
									<div class="emp-list">
										{#each inqEmployees as emp}
											{@const s = inqEditingEmp[emp.employee_id] ?? { planned: '0', clock_in: '', clock_out: '', notes: '' }}
											<div class="emp-row">
												<div class="emp-name">{emp.first_name} {emp.last_name}</div>
												<div class="emp-hours">
													<input
														class="hour-input neu-input"
														type="number"
														step="0.5"
														min="0"
														title="Geplant (h)"
														placeholder="Geplant"
														value={s.planned}
														oninput={(e) => {
															inqEditingEmp = { ...inqEditingEmp, [emp.employee_id]: { ...s, planned: (e.target as HTMLInputElement).value } };
														}}
													/>
													<input
														class="time-input neu-input"
														type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
														title="Arbeitsbeginn"
														value={s.clock_in}
														oninput={(e) => {
															inqEditingEmp = { ...inqEditingEmp, [emp.employee_id]: { ...s, clock_in: (e.target as HTMLInputElement).value } };
														}}
													/>
													<input
														class="time-input neu-input"
														type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
														title="Arbeitsende"
														value={s.clock_out}
														oninput={(e) => {
															inqEditingEmp = { ...inqEditingEmp, [emp.employee_id]: { ...s, clock_out: (e.target as HTMLInputElement).value } };
														}}
													/>
													<span class="emp-actual" title="Ist">{fmtActualHours(emp.actual_hours)}</span>
												</div>
												<div class="emp-actions">
													<button class="btn-icon btn-save" onclick={() => inqSaveEmp(emp.employee_id)} disabled={inqSavingEmp[emp.employee_id]} title="Speichern"><Check size={12} /></button>
													<button class="btn-icon btn-remove" onclick={() => inqRemoveEmp(emp.employee_id, `${emp.first_name} ${emp.last_name}`)} disabled={inqRemovingEmp[emp.employee_id]} title="Entfernen"><X size={12} /></button>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="panel-empty">Keine Mitarbeiter zugewiesen.</p>
								{/if}

								{#if inqUnassignedEmployees().length > 0}
									<div class="add-emp">
										<select class="neu-input" bind:value={inqAddEmpId}>
											<option value="">— Mitarbeiter wählen —</option>
											{#each inqUnassignedEmployees() as e}
												<option value={e.id}>{e.first_name} {e.last_name}</option>
											{/each}
										</select>
										<input class="hour-input neu-input" type="number" step="0.5" min="0" placeholder="h" bind:value={inqAddPlannedHours} />
										<button class="btn btn-primary btn-sm" onclick={inqAddEmployee} disabled={!inqAddEmpId || inqAddingEmp}>
											<Plus size={13} />{inqAddingEmp ? '...' : ''}
										</button>
									</div>
								{/if}
							{/if}
						</div>

						<!-- Multi-day scheduling section -->
						<div class="panel-section">
							<div class="section-title">Mehrtägiger Termin</div>
							{#if inqDaysLoading}
								<p class="panel-loading">Laden...</p>
							{:else}
								{@const originStr = panelSelection.item.scheduled_date?.slice(0,10) ?? panelSelection.item.preferred_date?.slice(0,10) ?? ''}
								<div class="field-row">
									<div class="field">
										<label>Von</label>
										<span class="day-origin-label">{originStr ? originStr.split('-').reverse().join('.') : '—'}</span>
									</div>
									<div class="field">
										<label for="inq-until">Bis</label>
										<input id="inq-until" type="date" class="neu-input" min={originStr} bind:value={inqUntilDate} />
									</div>
								</div>
								{#if inqDays.length > 1}
									<p class="day-range-summary">{inqDays.length} Tage geplant</p>
								{/if}
								<div class="days-actions">
									<button class="btn btn-primary btn-sm" onclick={saveInquiryDays} disabled={inqDaysSaving || !inqUntilDate}>
										{inqDaysSaving ? '...' : 'Zeitraum speichern'}
									</button>
								</div>
							{/if}
						</div>

					<!-- ─── TERMIN PANEL ────────────────────────────────────────── -->
					{:else if panelSelection.kind === 'termin'}
						{@const ci = panelSelection.item}

						<div class="panel-section">
							<div class="section-title">Bearbeiten</div>
							<div class="field">
								<label for="term-title">Titel</label>
								<input id="term-title" type="text" class="neu-input" bind:value={termEditTitle} />
							</div>
							<div class="field-row">
								<div class="field">
									<label for="term-cat">Kategorie</label>
									<select id="term-cat" class="neu-input" bind:value={termEditCategory}>
										<option value="internal">Intern</option>
										<option value="maintenance">Wartung</option>
										<option value="training">Schulung</option>
										<option value="other">Sonstiges</option>
									</select>
								</div>
								<div class="field">
									<label for="term-status">Status</label>
									<select id="term-status" class="neu-input" bind:value={termEditStatus}>
										<option value="scheduled">Geplant</option>
										<option value="completed">Abgeschlossen</option>
										<option value="cancelled">Abgesagt</option>
									</select>
								</div>
							</div>
							<div class="field">
								<label for="term-date">Datum</label>
								<input id="term-date" type="date" class="neu-input" bind:value={termEditDate} />
							</div>
							<div class="field-row">
								<div class="field">
									<label for="term-start">Startzeit</label>
									<input id="term-start" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={termEditStartTime} />
								</div>
								<div class="field">
									<label for="term-end">Endzeit</label>
									<input id="term-end" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={termEditEndTime} />
								</div>
							</div>
							<div class="field">
								<label for="term-dur">Dauer (h)</label>
								<input id="term-dur" type="number" step="0.5" min="0" class="neu-input" bind:value={termEditDuration} />
							</div>
							<div class="field">
								<label for="term-loc">Ort</label>
								<input id="term-loc" type="text" class="neu-input" bind:value={termEditLocation} />
							</div>
							<div class="field">
								<label for="term-desc">Beschreibung</label>
								<textarea id="term-desc" rows={3} class="neu-input" bind:value={termEditDescription}></textarea>
							</div>
							{#if ci.customer_name}
								<div class="panel-kv">
									<span class="kv-label">Kunde</span>
									<span class="kv-value">{ci.customer_name}</span>
								</div>
							{/if}
							<div class="panel-actions">
								<button class="btn btn-primary btn-sm" onclick={saveTermin} disabled={savingTermin}>
									<Save size={13} />
									{savingTermin ? 'Speichern...' : 'Speichern'}
								</button>
								<a href="/admin/calendar-items/{ci.id}" class="btn btn-ghost btn-sm">
									<ExternalLink size={13} /> Detail
								</a>
								<button class="btn btn-danger btn-sm" onclick={deleteTermin} disabled={deletingTermin}>
									<Trash2 size={13} />
									{deletingTermin ? '...' : 'Löschen'}
								</button>
							</div>
						</div>

						<!-- Employee assignments -->
						<div class="panel-section">
							<div class="section-title">Mitarbeiter ({termEmployees.length})</div>

							{#if termEmpLoading}
								<p class="panel-loading">Laden...</p>
							{:else}
								{#if termEmployees.length > 0}
									<div class="emp-list">
										{#each termEmployees as emp}
											{@const s = termEditingEmp[emp.employee_id] ?? { planned: '0', clock_in: '', clock_out: '', notes: '' }}
											<div class="emp-row">
												<div class="emp-name">{emp.first_name} {emp.last_name}</div>
												<div class="emp-hours">
													<input
														class="hour-input neu-input"
														type="number"
														step="0.5"
														min="0"
														title="Geplant (h)"
														placeholder="Geplant"
														value={s.planned}
														oninput={(e) => {
															termEditingEmp = { ...termEditingEmp, [emp.employee_id]: { ...s, planned: (e.target as HTMLInputElement).value } };
														}}
													/>
													<input
														class="time-input neu-input"
														type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
														title="Arbeitsbeginn"
														value={s.clock_in}
														oninput={(e) => {
															termEditingEmp = { ...termEditingEmp, [emp.employee_id]: { ...s, clock_in: (e.target as HTMLInputElement).value } };
														}}
													/>
													<input
														class="time-input neu-input"
														type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]"
														title="Arbeitsende"
														value={s.clock_out}
														oninput={(e) => {
															termEditingEmp = { ...termEditingEmp, [emp.employee_id]: { ...s, clock_out: (e.target as HTMLInputElement).value } };
														}}
													/>
													<span class="emp-actual" title="Ist">{fmtActualHours(emp.actual_hours)}</span>
												</div>
												<div class="emp-actions">
													<button class="btn-icon btn-save" onclick={() => termSaveEmp(emp.employee_id)} disabled={termSavingEmp[emp.employee_id]} title="Speichern"><Check size={12} /></button>
													<button class="btn-icon btn-remove" onclick={() => termRemoveEmp(emp.employee_id, `${emp.first_name} ${emp.last_name}`)} disabled={termRemovingEmp[emp.employee_id]} title="Entfernen"><X size={12} /></button>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="panel-empty">Keine Mitarbeiter zugewiesen.</p>
								{/if}

								{#if termUnassignedEmployees().length > 0}
									<div class="add-emp">
										<select class="neu-input" bind:value={termAddEmpId}>
											<option value="">— Mitarbeiter wählen —</option>
											{#each termUnassignedEmployees() as e}
												<option value={e.id}>{e.first_name} {e.last_name}</option>
											{/each}
										</select>
										<input class="hour-input neu-input" type="number" step="0.5" min="0" placeholder="h" bind:value={termAddPlannedHours} />
										<button class="btn btn-primary btn-sm" onclick={termAddEmployee} disabled={!termAddEmpId || termAddingEmp}>
											<Plus size={13} />{termAddingEmp ? '...' : ''}
										</button>
									</div>
								{/if}
							{/if}
						</div>
					{/if}

				</div>
			{/if}
		</aside>
	</div>
</div>

<!-- FAB: mobile quick-create -->
{#if isMobile && !quickCreateMode}
	{#if fabOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fab-backdrop" onclick={() => fabOpen = false} onkeydown={(e) => e.key === 'Escape' && (fabOpen = false)}></div>
		<div class="fab-menu">
			<button class="fab-item" onclick={() => { fabOpen = false; openQuickCreate('inquiry', currentContextDate); }}>
				<span class="fab-item-icon">📋</span> Anfrage erstellen
			</button>
			<button class="fab-item" onclick={() => { fabOpen = false; openQuickCreate('termin', currentContextDate); }}>
				<span class="fab-item-icon">📅</span> Termin erstellen
			</button>
		</div>
	{/if}
	<button class="fab" class:fab-active={fabOpen} onclick={() => fabOpen = !fabOpen} aria-label="Eintrag erstellen">
		<Plus size={22} />
	</button>
{/if}

<!-- Context menu -->
{#if contextMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="ctx-backdrop" onclick={closeContextMenu} onkeydown={(e) => e.key === 'Escape' && closeContextMenu()}></div>
	<div class="ctx-menu" style="left:{contextMenu.x}px;top:{contextMenu.y}px;">
		<button class="ctx-item" onclick={() => openQuickCreate('inquiry')}>
			<span class="ctx-icon">📋</span> Anfrage erstellen
		</button>
		<button class="ctx-item" onclick={() => openQuickCreate('termin')}>
			<span class="ctx-icon">📅</span> Termin erstellen
		</button>
	</div>
{/if}

<!-- Quick-create: inquiry -->
{#if quickCreateMode === 'inquiry'}
	<div class="modal-backdrop modal-backdrop-clear" onclick={(e) => { if (e.target === e.currentTarget) quickCreateMode = null; }} onkeydown={(e) => { if (e.key === 'Escape') quickCreateMode = null; }} role="dialog" tabindex="-1">
		<div class="modal modal-wide">
			<h3>Neue Anfrage — {quickCreateDate}</h3>

			<div class="qc-section-label">Kunde *</div>
			{#if qiCustomerId}
				<div class="qt-customer-badge">
					<span>{qiCustomerLabel}</span>
					<button class="qt-customer-remove" onclick={() => { qiCustomerId = null; qiCustomerLabel = ''; qiCustomerSearch = ''; }}>×</button>
				</div>
			{:else}
				<div class="qc-customer-tabs">
					<button class="tab-sm" class:tab-sm-active={qiCustomerMode === 'existing'} onclick={() => qiCustomerMode = 'existing'}>Suchen</button>
					<button class="tab-sm" class:tab-sm-active={qiCustomerMode === 'new'} onclick={() => qiCustomerMode = 'new'}>Neu</button>
				</div>
				{#if qiCustomerMode === 'existing'}
					<div class="qc-row" style="flex-direction:column;gap:0.25rem">
						<input type="text" bind:value={qiCustomerSearch} oninput={(e) => searchQiCustomers((e.target as HTMLInputElement).value)} placeholder="Name oder E-Mail..." />
						{#if qiCustomerSearching}<span style="font-size:0.75rem;color:#94a3b8">Suche...</span>{/if}
						{#if qiCustomerResults.length > 0}
							<div class="qt-results">
								{#each qiCustomerResults as c}
									<button class="qt-result-item" onclick={() => { qiCustomerId = c.id; qiCustomerLabel = c.name ?? c.email; qiCustomerResults = []; }}>
										<span class="cr-name">{c.name ?? c.email}</span>
										{#if c.name}<span class="cr-email">{c.email}</span>{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qi-email">E-Mail *</label>
							<input id="qi-email" type="email" bind:value={qiEmail} placeholder="kunde@example.com" />
						</div>
					</div>
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qi-name">Name</label>
							<input id="qi-name" type="text" bind:value={qiName} placeholder="Max Mustermann" />
						</div>
						<div class="qc-field">
							<label for="qi-phone">Telefon</label>
							<input id="qi-phone" type="tel" bind:value={qiPhone} placeholder="+49 ..." />
						</div>
					</div>
				{/if}
			{/if}

			<div class="qc-section-label">Auszug *</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-os">Straße</label>
					<input id="qi-os" type="text" bind:value={qiOriginStreet} placeholder="Musterstraße 1" />
				</div>
				<div class="qc-field">
					<label for="qi-op">PLZ</label>
					<input id="qi-op" type="text" bind:value={qiOriginPostal} placeholder="31134" style="width:90px" />
				</div>
				<div class="qc-field qc-field-grow">
					<label for="qi-oc">Stadt</label>
					<input id="qi-oc" type="text" bind:value={qiOriginCity} placeholder="Hildesheim" />
				</div>
			</div>

			<div class="qc-section-label">Einzug *</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-ds">Straße</label>
					<input id="qi-ds" type="text" bind:value={qiDestStreet} placeholder="Zielstraße 2" />
				</div>
				<div class="qc-field">
					<label for="qi-dp">PLZ</label>
					<input id="qi-dp" type="text" bind:value={qiDestPostal} placeholder="31134" style="width:90px" />
				</div>
				<div class="qc-field qc-field-grow">
					<label for="qi-dc">Stadt</label>
					<input id="qi-dc" type="text" bind:value={qiDestCity} placeholder="Hannover" />
				</div>
			</div>

			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-notes">Notizen</label>
					<textarea id="qi-notes" bind:value={qiNotes} placeholder="Besonderheiten..." rows="2"></textarea>
				</div>
			</div>

			{#if quickCreateError}<p class="qc-error">{quickCreateError}</p>{/if}
			<div class="qc-actions">
				<button class="btn btn-secondary" onclick={() => quickCreateMode = null}>Abbrechen</button>
				<button class="btn btn-primary" onclick={submitQuickInquiry} disabled={quickCreateLoading}>
					{quickCreateLoading ? 'Wird erstellt...' : 'Anfrage erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Quick-create: termin -->
{#if quickCreateMode === 'termin'}
	<div class="modal-backdrop modal-backdrop-clear" onclick={(e) => { if (e.target === e.currentTarget) quickCreateMode = null; }} onkeydown={(e) => { if (e.key === 'Escape') quickCreateMode = null; }} role="dialog" tabindex="-1">
		<div class="modal">
			<h3>Neuer Termin — {quickCreateDate}</h3>

			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qt-title">Titel *</label>
					<input id="qt-title" type="text" bind:value={qtTitle} placeholder="z.B. Fahrerschulung" />
				</div>
			</div>
			<div class="qc-row">
				<div class="qc-field">
					<label for="qt-cat">Kategorie</label>
					<select id="qt-cat" bind:value={qtCategory}>
						<option value="internal">Intern</option>
						<option value="maintenance">Wartung</option>
						<option value="training">Schulung</option>
						<option value="other">Sonstiges</option>
					</select>
				</div>
				<div class="qc-field">
					<label for="qt-dur">Dauer (h)</label>
					<input id="qt-dur" type="number" min="0.5" step="0.5" bind:value={qtDuration} style="width:80px" />
				</div>
			</div>
			<div class="qc-row">
				<div class="qc-field">
					<label for="qt-start">Startzeit *</label>
					<input id="qt-start" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" bind:value={qtStartTime} required />
				</div>
				<div class="qc-field">
					<label for="qt-end">Endzeit</label>
					<input id="qt-end" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" bind:value={qtEndTime} />
				</div>
			</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qt-loc">Ort</label>
					<input id="qt-loc" type="text" bind:value={qtLocation} placeholder="optional" />
				</div>
			</div>

			<div class="qc-section-label">Kunde (optional)</div>
			{#if qtCustomerId}
				<div class="qt-customer-badge">
					<span>{qtCustomerLabel}</span>
					<button class="qt-customer-remove" onclick={() => { qtCustomerId = null; qtCustomerLabel = ''; qtCustomerMode = 'none'; }}>×</button>
				</div>
			{:else}
				<div class="qc-customer-tabs">
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'none'} onclick={() => qtCustomerMode = 'none'}>Kein Kunde</button>
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'existing'} onclick={() => qtCustomerMode = 'existing'}>Suchen</button>
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'new'} onclick={() => qtCustomerMode = 'new'}>Neu</button>
				</div>
				{#if qtCustomerMode === 'existing'}
					<div class="qc-row" style="flex-direction:column;gap:0.25rem">
						<input type="text" bind:value={qtCustomerSearch} oninput={(e) => searchQtCustomers((e.target as HTMLInputElement).value)} placeholder="Name oder E-Mail..." />
						{#if qtCustomerSearching}<span style="font-size:0.75rem;color:#94a3b8">Suche...</span>{/if}
						{#if qtCustomerResults.length > 0}
							<div class="qt-results">
								{#each qtCustomerResults as c}
									<button class="qt-result-item" onclick={() => { qtCustomerId = c.id; qtCustomerLabel = c.name ?? c.email; qtCustomerResults = []; }}>
										<span class="cr-name">{c.name ?? c.email}</span>
										{#if c.name}<span class="cr-email">{c.email}</span>{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else if qtCustomerMode === 'new'}
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qtc-email">E-Mail *</label>
							<input id="qtc-email" type="email" bind:value={qtNewCustEmail} placeholder="kunde@example.com" />
						</div>
					</div>
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qtc-name">Name</label>
							<input id="qtc-name" type="text" bind:value={qtNewCustName} placeholder="Max Mustermann" />
						</div>
						<div class="qc-field">
							<label for="qtc-phone">Telefon</label>
							<input id="qtc-phone" type="tel" bind:value={qtNewCustPhone} placeholder="+49 ..." />
						</div>
					</div>
				{/if}
			{/if}

			{#if quickCreateError}<p class="qc-error">{quickCreateError}</p>{/if}
			<div class="qc-actions">
				<button class="btn btn-secondary" onclick={() => quickCreateMode = null}>Abbrechen</button>
				<button class="btn btn-primary" onclick={submitQuickTermin} disabled={quickCreateLoading}>
					{quickCreateLoading ? 'Wird erstellt...' : 'Termin erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ─── Page wrapper ─────────────────────────────────────────────────────────── */
	.page { max-width: 1400px; }
	.page-header { margin-bottom: 1.5rem; }
	.page-header h1 { font-size: 1.5rem; font-weight: 700; color: var(--dt-on-surface); }

	/* ─── Main layout: calendar + panel ───────────────────────────────────────── */
	.main-layout {
		display: flex;
		align-items: flex-start;
		gap: 1.25rem;
	}

	.calendar-col {
		flex: 1;
		min-width: 0;
		transition: flex var(--dt-transition-panel);
	}

	/* ─── Nav + view toggle ────────────────────────────────────────────────────── */
	.cal-nav { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
	.nav-row { display: flex; align-items: center; gap: 1rem; }
	.nav-row > button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-md);
		flex-shrink: 0;
		transition: background var(--dt-transition), color var(--dt-transition), transform var(--dt-transition);
	}
	.nav-row > button:hover { background: var(--dt-surface-container); color: var(--dt-on-surface); }
	.nav-row > button.nav-drag-active {
		color: var(--dt-on-primary);
		background: var(--dt-primary-container);
		transform: scale(1.2);
	}
	.month-label { font-size: 1.125rem; font-weight: 600; color: var(--dt-on-surface); min-width: 260px; text-align: center; text-transform: capitalize; }

	.view-toggle {
		display: flex;
		gap: 0.2rem;
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-md);
		padding: 0.2rem;
	}
	.view-btn {
		padding: 0.3rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}
	.view-btn-active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
		font-weight: 600;
	}

	/* ─── Calendar grid ────────────────────────────────────────────────────────── */
	.calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-lg);
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}
	.cal-header {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container);
		text-transform: uppercase;
	}

	.cal-cell {
		padding: 0.375rem 0.25rem 0.375rem 0.375rem;
		min-height: 80px;
		background: var(--dt-surface-container-lowest);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		transition: background var(--dt-transition);
		cursor: pointer;
		text-align: left;
		width: 100%;
	}
	.cal-cell:hover { background: var(--dt-surface-container-low); }
	.cal-cell.empty { background: var(--dt-surface-container); cursor: default; pointer-events: none; }
	.cal-cell.today { background: rgba(2, 36, 72, 0.06); }
	.cal-cell.today:hover { background: rgba(2, 36, 72, 0.10); }
	.cal-cell.overbooked { background: rgba(168, 57, 0, 0.06); }
	.cal-cell.overbooked:hover { background: rgba(168, 57, 0, 0.10); }
	.cal-cell.drag-over { background: rgba(2, 36, 72, 0.10); outline: 2px dashed var(--dt-primary); outline-offset: -2px; }

	.cal-entry[draggable="true"] { cursor: grab; }
	.cal-entry[draggable="true"]:active { cursor: grabbing; opacity: 0.6; }

	.cal-cell-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.125rem; }
	.cal-date { font-size: 0.8125rem; font-weight: 600; color: var(--dt-on-surface-variant); line-height: 1; }
	.cal-date-today { color: var(--dt-primary); font-weight: 700; }
	.cal-overbooked-icon { font-size: 0.65rem; color: var(--dt-secondary); line-height: 1; }

	.cal-entries { display: flex; flex-direction: column; gap: 2px; width: 100%; }

	.cal-entry {
		display: block;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 4px;
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.4;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}
	.cal-entry:hover { opacity: 0.8; }

	/* Entry colour classes */
	.entry-yellow { background: rgba(2, 36, 72, 0.12); color: var(--dt-primary); }
	.entry-green  { background: #dcfce7; color: #14532d; }
	.entry-violet { background: #e0e7ff; color: #3730a3; }
	.entry-orange { background: #ffedd5; color: #9a3412; }
	.entry-blue   { background: #dbeafe; color: #1e40af; }
	.entry-pink   { background: #fce7f3; color: #9d174d; }

	.entry-id { font-weight: 400; opacity: 0.7; font-size: 0.55rem; }
	.cal-more { font-size: 0.6rem; color: var(--dt-on-surface-variant); font-weight: 500; padding: 1px 3px; }

	/* ─── Week view grid ───────────────────────────────────────────────────────── */
	.week-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-lg);
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}

	.week-cell {
		background: var(--dt-surface-container-lowest);
		display: flex;
		flex-direction: column;
		padding: 0.375rem 0.3rem 0.5rem;
		min-height: 160px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background var(--dt-transition);
		gap: 0.25rem;
	}
	.week-cell:hover { background: var(--dt-surface-container-low); }
	.week-cell.today { background: rgba(2, 36, 72, 0.06); }
	.week-cell.today:hover { background: rgba(2, 36, 72, 0.10); }
	.week-cell.overbooked { background: rgba(168, 57, 0, 0.06); }
	.week-cell.overbooked:hover { background: rgba(168, 57, 0, 0.10); }
	.week-cell.drag-over { background: rgba(2, 36, 72, 0.10); outline: 2px dashed var(--dt-primary); outline-offset: -2px; }

	.week-cell-header {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding-bottom: 0.25rem;
		margin-bottom: 0.125rem;
		background: var(--dt-surface-container);
		margin: -0.375rem -0.3rem 0.25rem;
		padding: 0.375rem 0.3rem;
	}
	.week-day-name {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--dt-on-surface-variant);
		letter-spacing: 0.04em;
	}
	.week-day-num {
		font-size: 0.9rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		line-height: 1;
	}
	.week-day-today { color: var(--dt-primary); }
	.week-cap-badge {
		margin-left: auto;
		font-size: 0.6rem;
		font-weight: 700;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		padding: 0.1rem 0.3rem;
		border-radius: 4px;
	}
	.week-cap-over { background: rgba(168, 57, 0, 0.15); color: var(--dt-secondary); }

	.week-entries {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex: 1;
	}

	.week-entry {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.6875rem;
		padding: 3px 5px;
	}

	.entry-time {
		font-size: 0.6rem;
		font-weight: 700;
		opacity: 0.75;
		margin-right: 3px;
		font-variant-numeric: tabular-nums;
	}

	.week-no-entries {
		font-size: 0.75rem;
		color: var(--dt-outline-variant);
		padding: 0.25rem 0;
	}

	.week-card {
		border-radius: var(--dt-radius-sm);
		padding: 7px 9px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 3px;
		transition: box-shadow var(--dt-transition);
	}
	.week-card:hover {
		box-shadow: var(--dt-shadow-ambient);
	}

	.wc-header {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.wc-time {
		font-size: 0.65rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		opacity: 0.8;
		white-space: nowrap;
	}

	.wc-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wc-route {
		font-size: 0.65rem;
		opacity: 0.75;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wc-meta {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		align-items: center;
	}

	.wc-price {
		font-size: 0.65rem;
		font-weight: 700;
		background: rgba(0,0,0,0.1);
		border-radius: 4px;
		padding: 1px 5px;
		white-space: nowrap;
	}

	.wc-vol {
		font-size: 0.65rem;
		opacity: 0.75;
		white-space: nowrap;
	}

	.wc-employees {
		font-size: 0.65rem;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wc-notes {
		font-size: 0.65rem;
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-style: italic;
	}

	/* ─── Side panel ───────────────────────────────────────────────────────────── */
	.side-panel {
		width: 0;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		transition: width 280ms ease, opacity 280ms ease;
		opacity: 0;
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 140px);
		position: sticky;
		top: 1rem;
	}

	.side-panel.panel-visible {
		width: 380px;
		opacity: 1;
	}

	.panel-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--dt-on-surface-variant);
		gap: 0.5rem;
	}
	.placeholder-icon { font-size: 2rem; }
	.panel-placeholder p { font-size: 0.875rem; }

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 1rem 0.75rem;
		flex-shrink: 0;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border-bottom: var(--dt-glass-border);
		border-radius: var(--dt-radius-lg) var(--dt-radius-lg) 0 0;
	}
	.panel-title-block {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.panel-subtitle {
		font-size: 0.75rem;
		font-weight: 400;
		color: rgba(255,255,255,0.7);
		margin: 0;
	}
	.panel-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--dt-on-primary);
		margin: 0;
		line-height: 1.3;
		word-break: break-word;
	}
	.panel-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--dt-radius-sm);
		color: rgba(255,255,255,0.7);
		background: rgba(255,255,255,0.12);
		border: var(--dt-glass-border);
		transition: background var(--dt-transition), color var(--dt-transition);
	}
	.panel-close:hover { background: rgba(255,255,255,0.22); color: var(--dt-on-primary); }

	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* Panel sections */
	.panel-section {
		padding: 0.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.panel-section + .panel-section {
		border-top: 1px solid var(--dt-surface-container);
	}

	.section-title {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--dt-primary);
		margin-bottom: 0.125rem;
	}

	.panel-kv { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
	.kv-label { font-size: 0.75rem; font-weight: 600; color: var(--dt-on-surface-variant); flex-shrink: 0; }
	.kv-value { font-size: 0.8125rem; color: var(--dt-on-surface); font-weight: 500; text-align: right; }
	.kv-muted { color: var(--dt-on-surface-variant); font-weight: 400; }

	.panel-empty { font-size: 0.8125rem; color: var(--dt-on-surface-variant); margin: 0; }
	.panel-loading { font-size: 0.8125rem; color: var(--dt-on-surface-variant); margin: 0; }

	/* Day panel entries */
	.day-entry {
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		padding: 0.5rem 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.day-entry-termin { background: rgba(168, 57, 0, 0.06); }
	.day-entry-top { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
	.entry-link-btn {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color var(--dt-transition);
	}
	.entry-link-btn:hover { color: var(--dt-secondary); text-decoration: underline; }
	.entry-route { font-size: 0.7rem; color: var(--dt-on-surface-variant); }
	.entry-detail-link {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.7rem;
		color: var(--dt-secondary);
		text-decoration: none;
		align-self: flex-start;
		transition: color var(--dt-transition);
	}
	.entry-detail-link:hover { text-decoration: underline; }
	.cat-badge {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}
	.time-badge {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-left: auto;
		white-space: nowrap;
	}

	/* Token-based input (replaces .neu-input) */
	.neu-input {
		padding: 0.4rem 0.6rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		font-size: 0.8125rem;
		outline: none;
		width: 100%;
		font-family: inherit;
		resize: vertical;
		transition: var(--dt-transition);
	}
	.neu-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	select.neu-input { appearance: auto; }

	/* Capacity row in day panel */
	.capacity-row { display: flex; gap: 0.5rem; align-items: center; }
	.capacity-input { width: 80px; flex-shrink: 0; }

	/* Form fields in panel */
	.field { display: flex; flex-direction: column; gap: 0.2rem; }
	.field label { font-size: 0.6875rem; font-weight: 600; color: var(--dt-on-surface-variant); text-transform: uppercase; }
	.field-row { display: flex; gap: 0.5rem; }
	.field-row .field { flex: 1; }

	/* Panel action buttons row */
	.panel-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.25rem; }

	/* Buttons */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.5rem 1rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background var(--dt-transition);
		white-space: nowrap;
		border: var(--dt-ghost-border);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface);
		text-decoration: none;
	}
	.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; border-radius: var(--dt-radius-sm); }
	.btn-primary {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--dt-primary-container), var(--dt-primary));
	}
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-ghost {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		border: none;
		text-decoration: none;
	}
	.btn-ghost:hover { background: var(--dt-surface-container); color: var(--dt-on-surface); }
	.btn-danger {
		background: linear-gradient(135deg, var(--dt-secondary), #8a2e00);
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-danger:hover:not(:disabled) {
		background: linear-gradient(135deg, #8a2e00, var(--dt-secondary));
	}
	.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

	/* ── Holidays ──────────────────────────────────────────────────────────────── */
	.cal-cell.school-holiday,
	.week-cell.school-holiday { background: linear-gradient(135deg, #fffbeb, #fef9c3); }
	.holiday-badge {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		color: #92400e;
		background: #fef3c7;
		border-radius: 3px;
		padding: 0 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.school-holiday-label {
		font-size: 0.6rem;
		color: #92400e;
		opacity: 0.85;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0 2px 2px;
	}
	.holiday-legend {
		display: flex;
		gap: 16px;
		padding: 6px 4px 2px;
		font-size: 0.7rem;
		color: var(--dt-on-surface-variant);
	}
	.legend-item { display: flex; align-items: center; gap: 5px; }
	.legend-dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
	.legend-public { background: #fef3c7; }
	.legend-school { background: #fffbeb; }
	.btn-secondary {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		border: var(--dt-ghost-border);
	}
	.btn-secondary:hover { background: var(--dt-surface-container); color: var(--dt-on-surface); }

	/* Employee list in panel */
	.emp-list { display: flex; flex-direction: column; gap: 0.375rem; }
	.emp-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.4rem;
		padding: 0.4rem 0.5rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
	}
	.emp-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		width: 100%;
	}
	.emp-hours { display: flex; gap: 0.25rem; flex-shrink: 0; }
	.hour-input {
		width: 52px;
		padding: 0.25rem 0.35rem;
		font-size: 0.75rem;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		border: none;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		transition: var(--dt-transition);
	}
	.hour-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	.time-input {
		width: 72px;
		padding: 0.25rem 0.3rem;
		font-size: 0.75rem;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-high);
		border: none;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		transition: var(--dt-transition);
	}
	.time-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	.emp-actual {
		font-size: 0.7rem;
		color: var(--dt-primary);
		font-weight: 600;
		min-width: 36px;
		text-align: right;
		align-self: center;
	}
	.emp-actions { display: flex; gap: 0.2rem; flex-shrink: 0; }
	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: all var(--dt-transition);
		padding: 0;
	}
	.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-save:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; color: #14532d; }
	.btn-remove:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }

	.add-emp { display: flex; gap: 0.375rem; align-items: center; margin-top: 0.25rem; }
	.add-emp .neu-input { flex: 1; }

	/* ─── Context menu ─────────────────────────────────────────────────────────── */
	.ctx-backdrop { position: fixed; inset: 0; z-index: 600; }
	.ctx-menu {
		position: fixed;
		z-index: 601;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-md);
		box-shadow: var(--dt-shadow-ambient);
		padding: 0.25rem;
		min-width: 200px;
	}
	.ctx-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		text-align: left;
		transition: background var(--dt-transition);
	}
	.ctx-item:hover { background: var(--dt-surface-container-low); }
	.ctx-icon { font-size: 1rem; }

	/* ─── Quick-create modals ──────────────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 500;
	}
	.modal {
		background: var(--dt-surface-container-lowest);
		border: none;
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		padding: 1.5rem;
		width: 90%;
		max-width: 440px;
		max-height: 88vh;
		overflow-y: auto;
	}
	.modal h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		margin-bottom: 1rem;
	}

	.modal-backdrop-clear {
		background: transparent;
		backdrop-filter: none;
		align-items: flex-start;
		justify-content: flex-end;
		padding: 1rem;
		pointer-events: none;
	}
	.modal-backdrop-clear .modal { pointer-events: all; margin-top: 3rem; }
	.modal-wide { max-width: 560px; }

	.qc-section-label {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--dt-primary);
		margin: 0.75rem 0 0.25rem;
		letter-spacing: 0.05em;
	}
	.qc-section-label:first-of-type { margin-top: 0; }
	.qc-row { display: flex; gap: 0.5rem; margin-bottom: 0.375rem; flex-wrap: wrap; }
	.qc-field { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.qc-field-grow { flex: 1; }
	.qc-field label { font-size: 0.7rem; font-weight: 600; color: var(--dt-on-surface-variant); text-transform: uppercase; }
	.qc-field input, .qc-field select, .qc-field textarea {
		padding: 0.4rem 0.6rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		font-size: 0.8125rem;
		outline: none;
		width: 100%;
		font-family: inherit;
		transition: var(--dt-transition);
	}
	.qc-field input:focus, .qc-field select:focus, .qc-field textarea:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	.qc-field textarea { resize: vertical; }
	.qc-error { font-size: 0.8rem; color: var(--dt-secondary); margin: 0.5rem 0 0; }
	.qc-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }

	.qc-customer-tabs { display: flex; gap: 0.25rem; margin-bottom: 0.375rem; }
	.tab-sm {
		padding: 0.25rem 0.6rem;
		font-size: 0.75rem;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		transition: background var(--dt-transition), color var(--dt-transition);
	}
	.tab-sm-active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
		font-weight: 600;
	}
	.qt-results {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		margin-top: 0.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}
	.qt-result-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0.375rem 0.6rem;
		text-align: left;
		transition: background var(--dt-transition);
		color: var(--dt-on-surface);
	}
	.qt-result-item + .qt-result-item { border-top: 1px solid var(--dt-surface-container); }
	.qt-result-item:hover { background: var(--dt-surface-container-low); }
	.qt-customer-badge {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.6rem;
		background: var(--dt-primary-container);
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-primary);
		margin-bottom: 0.25rem;
	}
	.qt-customer-remove { font-size: 1rem; color: var(--dt-on-primary); padding: 0 0.125rem; line-height: 1; opacity: 0.7; }
	.cr-name { font-size: 0.8125rem; font-weight: 500; color: var(--dt-on-surface); }
	.cr-email { font-size: 0.7rem; color: var(--dt-on-surface-variant); }
	.qc-row input[type="text"]:not(.qc-field input) {
		width: 100%;
		padding: 0.4rem 0.6rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		outline: none;
		color: var(--dt-on-surface);
		font-family: inherit;
		transition: var(--dt-transition);
	}
	.qc-row input[type="text"]:not(.qc-field input):focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	/* ─── Responsive ───────────────────────────────────────────────────────────── */

	/* Tablet: stack panel below calendar */
	@media (min-width: 769px) and (max-width: 900px) {
		.main-layout { flex-direction: column; }
		.side-panel { width: 100%; max-height: none; position: static; opacity: 1; transition: none; }
		.side-panel:not(.panel-visible) { display: none; }
		.sheet-handle-bar { display: none; }
	}

	/* Mobile: bottom sheet layout */
	@media (max-width: 768px) {
		/* Calendar nav */
		.cal-nav { gap: 0.5rem; }
		.nav-row > button { min-height: 44px; min-width: 44px; justify-content: center; }
		.month-label { font-size: 0.9375rem; min-width: 160px; }

		/* Month grid: fit screen, no forced width */
		.calendar-grid { min-width: unset; }
		.cal-cell { min-height: 52px; padding: 0.25rem 0.2rem; }
		.cal-header { font-size: 0.6875rem; padding: 0.3rem 0.1rem; }
		/* Show entries as colored dots */
		.cal-entry {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			padding: 0;
			font-size: 0;
			flex-shrink: 0;
			min-width: 0;
		}
		.cal-entries { flex-direction: row; flex-wrap: wrap; gap: 2px; align-items: center; }
		.entry-time { display: none; }
		.cal-more { font-size: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--dt-outline-variant); padding: 0; }

		/* Week view: one day per row */
		.week-grid { grid-template-columns: 1fr; }
		.week-cell {
			min-height: auto;
			flex-direction: row;
			align-items: flex-start;
			padding: 0.625rem 0.75rem;
		}
		.week-cell-header {
			flex-direction: column;
			margin: -0.625rem -0.75rem 0 -0.75rem;
			padding: 0.375rem 0.75rem;
			background: var(--dt-surface-container);
			width: 64px;
			min-width: 64px;
			flex-shrink: 0;
			align-items: flex-start;
			gap: 0.15rem;
		}
		.week-day-name { font-size: 0.6rem; }
		.week-day-num { font-size: 1.1rem; }
		.week-cap-badge { margin-left: 0; }
		.week-entries { flex: 1; }
		.week-card { border-radius: var(--dt-radius-sm); }

		/* Day timeline */
		.day-tl-grid { max-height: calc(100vh - 180px); }

		/* Bottom sheet panel */
		.main-layout { display: block; }
		.side-panel {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			max-height: 85vh;
			border-radius: 20px 20px 0 0;
			top: auto;
			transform: translateY(105%);
			opacity: 1;
			transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
			z-index: 510;
			overflow-y: auto;
		}
		.side-panel.panel-visible {
			transform: translateY(0);
			width: 100%;
		}

		/* Page padding at bottom so FAB doesn't obscure content */
		.page { padding-bottom: 80px; }

		/* Modal full-screen on mobile */
		.modal, .modal-wide { max-width: 100%; width: 100%; border-radius: 16px 16px 0 0; margin: 0; max-height: 90vh; }
		.modal-backdrop { align-items: flex-end; padding: 0; }
		.modal-backdrop-clear { align-items: flex-end; padding: 0; }
	}

	/* ─── Multi-day badge ─────────────────────────────────────────────────────── */
	.multiday-badge {
		font-size: 0.55rem;
		font-weight: 700;
		background: rgba(0,0,0,0.15);
		border-radius: 2px;
		padding: 0 2px;
		margin-left: 2px;
	}

	/* ─── InquiryDaysEditor ───────────────────────────────────────────────────── */
	.days-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.25rem; }
	.day-origin-label { font-size: 0.875rem; font-weight: 600; color: var(--dt-on-surface); display: block; padding: 0.25rem 0; }
	.day-range-summary { font-size: 0.75rem; color: var(--dt-on-surface-variant); margin: 0.25rem 0 0; }

	/* ─── Day timeline view ───────────────────────────────────────────────────── */
	.day-timeline {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		overflow: hidden;
	}
	.day-tl-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--dt-surface-container);
	}
	.day-tl-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
	.day-tl-cap { font-size: 0.75rem; font-weight: 600; color: var(--dt-on-surface-variant); }
	.day-tl-empty { padding: 2rem; text-align: center; color: var(--dt-on-surface-variant); font-size: 0.875rem; grid-column: 1 / -1; }

	.day-tl-grid {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		max-height: calc(100vh - 280px);
	}
	.tl-row {
		display: flex;
		min-height: 48px;
	}
	.tl-row + .tl-row { border-top: 1px solid var(--dt-surface-container); }
	.tl-time {
		width: 52px;
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		padding: 0.25rem 0.5rem 0;
		font-variant-numeric: tabular-nums;
		background: var(--dt-surface-container-low);
	}
	.tl-lane {
		flex: 1;
		position: relative;
		padding: 2px 4px;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 3px;
	}
	.tl-block {
		flex: 1;
		min-width: 0;
		border-radius: var(--dt-radius-sm);
		padding: 4px 7px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-align: left;
		overflow: hidden;
		transition: box-shadow var(--dt-transition);
		border: none;
	}
	.tl-block:hover { box-shadow: var(--dt-shadow-ambient); }
	.tl-block-time { font-size: 0.6rem; font-weight: 700; opacity: 0.8; font-variant-numeric: tabular-nums; }
	.tl-block-name { font-size: 0.75rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.tl-block-emp { font-size: 0.6rem; opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

	/* ─── Mobile: responsive month grid ──────────────────────────────────────── */
	@media (max-width: 600px) {
		.calendar-grid { min-width: unset; }
		.cal-cell { min-height: 52px; padding: 0.25rem; }
		.cal-header { font-size: 0.6rem; padding: 0.25rem 0.1rem; }
		.cal-entry { display: none; }
		.cal-entries::after { content: ''; }
		.cal-cell:has(.cal-entry) .cal-entries {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 2px;
			padding-top: 2px;
		}
		.cal-cell:has(.cal-entry) .cal-entries .cal-entry:first-child {
			display: block;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			padding: 0;
			font-size: 0;
			flex-shrink: 0;
		}
	}

	/* ─── Multi-day spanning band (week view) ─────────────────────────────────── */
	.wc-multiday-bar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.6rem;
		font-weight: 700;
		background: rgba(0,0,0,0.12);
		border-radius: 3px;
		padding: 1px 5px;
		margin-bottom: 3px;
	}
	.wc-md-label { flex: 1; text-align: center; opacity: 0.9; }
	.wc-md-arrow { opacity: 0.7; font-size: 0.65rem; }
	.wc-md-left { margin-right: auto; }
	.wc-md-right { margin-left: auto; }

	/* ─── Bottom sheet handle ──────────────────────────────────────────────────── */
	.sheet-handle-bar {
		display: none;
		justify-content: center;
		padding: 10px 0 6px;
		cursor: pointer;
		flex-shrink: 0;
	}
	.sheet-handle {
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: var(--dt-outline-variant);
	}
	@media (max-width: 768px) {
		.sheet-handle-bar { display: flex; }
	}

	/* ─── Mobile panel backdrop ────────────────────────────────────────────────── */
	.sheet-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(2, 36, 72, 0.4);
		z-index: 509;
		backdrop-filter: blur(4px);
	}

	/* ─── FAB ──────────────────────────────────────────────────────────────────── */
	.fab {
		position: fixed;
		bottom: 20px;
		right: 20px;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 16px rgba(2, 36, 72, 0.4);
		z-index: 520;
		border: none;
		cursor: pointer;
		transition: transform 200ms, box-shadow var(--dt-transition);
	}
	.fab:hover { box-shadow: 0 6px 24px rgba(2, 36, 72, 0.5); }
	.fab.fab-active {
		transform: rotate(45deg);
		background: linear-gradient(135deg, var(--dt-secondary), #8a2e00);
		box-shadow: 0 4px 16px rgba(168, 57, 0, 0.4);
	}

	.fab-backdrop {
		position: fixed;
		inset: 0;
		z-index: 518;
	}
	.fab-menu {
		position: fixed;
		bottom: 86px;
		right: 16px;
		z-index: 519;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-end;
	}
	.fab-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--dt-surface-container-lowest);
		border: var(--dt-ghost-border);
		border-radius: 24px;
		padding: 0.6rem 1rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		box-shadow: var(--dt-shadow-ambient);
		cursor: pointer;
		white-space: nowrap;
		transition: background var(--dt-transition);
	}
	.fab-item:hover { background: var(--dt-surface-container-low); }
	.fab-item-icon { font-size: 1.1rem; }
</style>