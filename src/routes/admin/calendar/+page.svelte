<script lang="ts">
	import { apiGet, apiPatch, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { buildCalendar, getISOWeek } from '$lib/utils/calendar';
	import { draggable } from '$lib/utils/draggable';
	import { formatTime } from '$lib/utils/format';
	import { calculateBruttoCents } from '$lib/utils/pricing';
	import { ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import CalendarSidePanel from './CalendarSidePanel.svelte';

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

	const PRE_ACCEPTED = new Set(['pending', 'info_requested', 'estimating', 'estimated', 'offer_ready', 'offer_sent']);

	const CATEGORY_LABELS: Record<string, string> = {
		internal: 'Intern',
		maintenance: 'Wartung',
		training: 'Schulung',
		other: 'Sonstiges'
	};

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
				const pad = (n: number) => String(n).padStart(2, '0');
				// Extend fetch range to cover the full grid (including overflow days from adjacent months)
				const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				const trailing = (7 - ((firstDow + daysInMonth) % 7)) % 7;
				const gridStart = new Date(year, month, 1 - firstDow);
				const gridEnd = new Date(year, month + 1, trailing);
				from = `${gridStart.getFullYear()}-${pad(gridStart.getMonth() + 1)}-${pad(gridStart.getDate())}`;
				to = `${gridEnd.getFullYear()}-${pad(gridEnd.getMonth() + 1)}-${pad(gridEnd.getDate())}`;
				itemMonths = [`${year}-${pad(month + 1)}`];
				if (firstDow > 0) {
					const prevYM = `${gridStart.getFullYear()}-${pad(gridStart.getMonth() + 1)}`;
					if (!itemMonths.includes(prevYM)) itemMonths.unshift(prevYM);
				}
				if (trailing > 0) {
					const nextYM = `${gridEnd.getFullYear()}-${pad(gridEnd.getMonth() + 1)}`;
					if (!itemMonths.includes(nextYM)) itemMonths.push(nextYM);
				}
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
	 * Opens the side panel for the clicked inquiry.
	 *
	 * Called by: Template (left-click on inquiry chip)
	 * Purpose: Sets panelSelection so CalendarSidePanel reacts via $effect and loads detail.
	 *
	 * @param e - The click event (stopped from bubbling to day cell handler)
	 * @param inq - The InquiryItem from the calendar schedule
	 */
	function openInquiryPanel(e: MouseEvent, inq: InquiryItem) {
		e.stopPropagation();
		panelSelection = { kind: 'inquiry', item: inq };
	}

	/**
	 * Opens the side panel for the clicked termin.
	 *
	 * Called by: Template (left-click on termin chip)
	 * Purpose: Sets panelSelection so CalendarSidePanel reacts via $effect and loads detail.
	 *
	 * @param e - The click event (stopped from bubbling to day cell handler)
	 * @param ci - The CalendarItem from the calendar items list
	 */
	function openTerminPanel(e: MouseEvent, ci: CalendarItem) {
		e.stopPropagation();
		panelSelection = { kind: 'termin', item: ci };
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
				await apiPatch(`/api/v1/inquiries/${id}`, { scheduled_date: dateStr });
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
				scheduled_date: quickCreateDate,
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
					<div class="cal-kw cal-kw-header"></div>
					{#each weekdays as day}
						<div class="cal-header">{day}</div>
					{/each}

					{#each calendarDays as day, i}
						{#if i % 7 === 0}
							<div class="cal-kw">KW {getISOWeek(day.dateStr)}</div>
						{/if}
							{@const dateStr = day.dateStr}
							{@const allEntries = buildDayEntries(dateStr)}
							{@const booked = day.schedule?.booked || 0}
							{@const capacity = day.schedule?.capacity || 1}
							{@const overbooked = booked > capacity}
							{@const publicHol = publicHolidayMap.get(dateStr)}
							{@const schoolHol = schoolHolidayMap.get(dateStr)}
							<button
								class="cal-cell"
								class:overflow={day.isOverflow}
								class:today={day.isToday}
								class:overbooked
								class:school-holiday={!!schoolHol}
								class:public-holiday={!!publicHol}
								class:drag-over={dragOverDate === dateStr}
								onclick={() => openDayPanel(day.schedule, null, day.dateStr)}
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
								{#each [{ mdEntries: allEntries.filter(e => e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1).sort((a, b) => a.item.inquiry_id.localeCompare(b.item.inquiry_id)), sdEntries: allEntries.filter(e => !(e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1)) }] as { mdEntries, sdEntries }}
									{@const sdCap = Math.max(2, 4 - mdEntries.length)}
									{#each mdEntries as entry}
										{@const dayNum = entry.item.day_number ?? 1}
										{@const totalDays = entry.item.total_days ?? 1}
										{@const dow = new Date(entry.item.scheduled_date ?? dateStr).getDay()}
										{@const isVisualStart = dayNum === 1 || dow === 1}
										{@const isVisualEnd = dayNum === totalDays || dow === 0}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="md-bar {inquiryEntryClass(entry.item.status)}"
											class:md-bar-start={isVisualStart}
											class:md-bar-end={isVisualEnd}
											title="{entry.item.customer_name ?? ''} · Tag {dayNum}/{totalDays}"
											draggable="true"
											ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
											onclick={(e) => openInquiryPanel(e, entry.item)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
										>
											{#if isVisualStart}<span class="md-bar-text">{truncate(entry.item.customer_name, 12)}</span>{/if}
										</div>
									{/each}
									<div class="cal-entries">
										{#each sdEntries.slice(0, sdCap) as entry}
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
												<span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.customer_name, 10)}
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
									{#if sdEntries.length > sdCap}
										<span class="cal-more">+{sdEntries.length - sdCap} mehr</span>
									{/if}
								</div>
								{/each}
							</button>
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
							class:public-holiday={!!wPublicHol}
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

		<CalendarSidePanel bind:panelSelection {calendarItems} {schedule} onLoadSchedule={loadSchedule} />
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
		<div class="modal modal-wide" use:draggable>
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
		<div class="modal" use:draggable>
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
		grid-template-columns: 36px repeat(7, 1fr);
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

	.cal-kw {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--dt-outline);
		background: var(--dt-surface-container);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		letter-spacing: 0.04em;
	}
	.cal-kw-header {
		background: var(--dt-surface-container);
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
	.cal-cell.overflow { background: var(--dt-surface-container); opacity: 0.55; }
	.cal-cell.overflow:hover { background: var(--dt-surface-container-low); opacity: 0.75; }
	.cal-cell.overflow .cal-date { color: var(--dt-outline); }
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

	/* ─── Multi-day spanning bars (month view) ─────────────────────────────────── */
	.md-bar {
		display: block;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 0;
		white-space: nowrap;
		overflow: hidden;
		cursor: pointer;
		/* extend through cell padding (left 0.375rem, right 0.25rem) to fill cell edge-to-edge */
		margin: 1px -0.25rem 1px -0.375rem;
		border-radius: 0;
		min-height: 14px;
		transition: opacity var(--dt-transition);
	}
	.md-bar:hover { opacity: 0.8; }
	.md-bar.md-bar-start {
		margin-left: 1px;
		border-top-left-radius: 3px;
		border-bottom-left-radius: 3px;
	}
	.md-bar.md-bar-end {
		margin-right: 1px;
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
	}
	.md-bar.md-bar-start.md-bar-end {
		margin: 1px;
		border-radius: 3px;
	}
	.md-bar-text { padding-left: 5px; }

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
		cursor: grab;
	}
	.modal h3:active {
		cursor: grabbing;
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

	/* ─── Holidays & school breaks ─────────────────────────────────────────────── */
	.cal-cell.school-holiday,
	.week-cell.school-holiday { background: linear-gradient(135deg, #fffbeb, #fef9c3); }
	.cal-cell.public-holiday,
	.week-cell.public-holiday { background: linear-gradient(135deg, #fee2e2, #fecaca); }
	/* Public holiday takes precedence when both apply */
	.cal-cell.school-holiday.public-holiday,
	.week-cell.school-holiday.public-holiday { background: linear-gradient(135deg, #fee2e2, #fecaca); }
	.holiday-badge {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		color: #991b1b;
		background: #fecaca;
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
	.legend-public { background: #fecaca; }
	.legend-school { background: #fffbeb; }
</style>
