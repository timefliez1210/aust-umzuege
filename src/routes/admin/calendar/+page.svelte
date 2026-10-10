<script lang="ts">
	import { apiGet, apiPatch, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { buildCalendar } from '$lib/utils/calendar';
	import { draggable } from '$lib/utils/draggable';
	import { formatTime, normalizeTimeInput } from '$lib/utils/format';
	import { DEFAULT_START_TIME, DEFAULT_END_TIME } from '$lib/utils/time';
	import { calculateBruttoCents } from '$lib/utils/pricing';
	import { ChevronLeft, ChevronRight, Plus, X, Users, User, MapPin, Clock, ClipboardList, CalendarPlus, Search } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';
	import CalendarSidePanel from './CalendarSidePanel.svelte';
	import { SERVICE_TYPE_LABELS, SERVICE_ADDRESS_CONFIG } from '$lib/utils/constants';
	import KnownAddressPicker from '$lib/components/admin/KnownAddressPicker.svelte';
	import { fetchKnownAddresses, knownAddressStreetLine, type KnownAddress } from '$lib/utils/addressBook';
	import CalendarGrid from './_components/CalendarGrid.svelte';
	import MonthAgenda from './_components/MonthAgenda.svelte';
	import type {
		InquiryItem,
		CalendarItem,
		ScheduleCalendarItem,
		ScheduleAppointment,
		DaySchedule,
		PanelDay,
		PanelInquiry,
		PanelTermin,
		PanelSelection
	} from '$lib/types/calendar';

	const APPT_KIND_LABELS: Record<string, string> = {
		besichtigung: 'Besichtigung',
		nachtermin: 'Nachtermin'
	};

	/** Human label for an appointment kind (free-text; capitalised fallback). */
	function apptKindLabel(kind: string): string {
		return APPT_KIND_LABELS[kind] ?? (kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : 'Termin');
	}

	/** Opens the dedicated appointment (Zusatztermin) edit panel with crew + hours. */
	function openAppointmentPanel(a: ScheduleAppointment) {
		panelSelection = { kind: 'appointment', item: a };
	}

	/** Chip handler: stop the click bubbling to the day cell, then open the panel. */
	function openAppointmentInquiry(e: Event, a: ScheduleAppointment) {
		e.stopPropagation();
		openAppointmentPanel(a);
	}

	const PRE_ACCEPTED = new Set(['pending', 'info_requested', 'estimating', 'estimated', 'offer_ready', 'offer_sent']);

	const CATEGORY_LABELS: Record<string, string> = {
		intern: 'Intern',
		umzug: 'Umzug',
		entruempelung: 'Entrümpelung',
		montage: 'Montage',
		streichen: 'Streichen',
		kartons_auslieferung: 'Kartons Auslieferung',
		kartons_abholung: 'Kartons Abholung'
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
			intern: 'entry-violet',
			umzug: 'entry-green',
			entruempelung: 'entry-orange',
			montage: 'entry-blue',
			streichen: 'entry-pink',
			kartons_auslieferung: 'entry-kartons',
			kartons_abholung: 'entry-kartons'
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
	let loading = $state(true);
	// Monotonic counter incremented per loadSchedule call; stale awaits compare and bail.
	let loadToken = 0;

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
	let draggingType = $state<'inquiry' | 'termin' | 'appointment' | null>(null);
	let draggingFromDate = $state<string | null>(null);
	let draggingDayNumber = $state<number>(1);
	/** For appointment drags: the parent inquiry_id (appointment PATCH is nested under it). */
	let draggingApptInquiryId = $state<string | null>(null);
	let dragOverDate = $state<string | null>(null);
	let navDragOver = $state<'prev' | 'next' | null>(null);
	let navDragTimer: ReturnType<typeof setTimeout> | null = null;

	// Context menu
	let contextMenu = $state<{ x: number; y: number; dateStr: string } | null>(null);

	// Holidays (DE-NI / Niedersachsen) — shape follows the OpenHolidays API response
	interface HolidayEntry {
		startDate: string;
		endDate: string;
		name: Array<{ language: string; text: string }>;
	}
	let publicHolidays = $state<HolidayEntry[]>([]);
	let schoolHolidays = $state<HolidayEntry[]>([]);
	let loadedHolidayYear = $state(0);

	// Quick-create mode
	let quickCreateMode = $state<'inquiry' | 'termin' | 'appointment' | null>(null);
	let quickCreateDate = $state('');
	let quickCreateLoading = $state(false);
	let quickCreateError = $state('');

	// Quick-appointment (Besichtigung / Zusatztermin linked to an existing inquiry)
	let qaInquirySearch = $state('');
	let qaInquiryResults = $state<{ id: string; customer_name: string | null; origin_city: string | null; destination_city: string | null; status: string }[]>([]);
	let qaInquirySearching = $state(false);
	let qaInquiryId = $state<string | null>(null);
	let qaInquiryLabel = $state('');
	let qaKind = $state('besichtigung');
	let qaStartTime = $state('');
	let qaEndTime = $state('');
	let qaAssigneeId = $state('');
	let qaLocation = $state('');
	let qaNotes = $state('');
	let qaEmployees = $state<{ id: string; first_name: string; last_name: string }[]>([]);
	let qaEmployeesLoaded = $state(false);

	// Quick-inquiry form fields
	let qiServiceType = $state<string>('privatumzug');
	const QI_SERVICE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS) as [string, string][];
	let qiAddrCfg = $derived(SERVICE_ADDRESS_CONFIG[qiServiceType] ?? SERVICE_ADDRESS_CONFIG['privatumzug']);
	let qiCustomerMode = $state<'existing' | 'new'>('existing');
	let qiCustomerSearch = $state('');
	let qiCustomerResults = $state<{ id: string; name: string | null; email: string | null }[]>([]);
	let qiCustomerSearching = $state(false);
	let qiCustomerId = $state<string | null>(null);
	let qiCustomerLabel = $state('');
	let qiEmail = $state('');
	let qiName = $state('');
	let qiPhone = $state('');
	let qiSalutation = $state('');
	let qiOriginStreet = $state('');
	let qiOriginCity = $state('');
	let qiOriginPostal = $state('');
	let qiDestStreet = $state('');
	let qiDestCity = $state('');
	let qiDestPostal = $state('');
	let qiNotes = $state('');

	// Known addresses of the linked customer, for the quick-inquiry address picker.
	let qiKnownAddresses = $state<KnownAddress[]>([]);
	$effect(() => {
		if (qiCustomerId) {
			fetchKnownAddresses(qiCustomerId).then((list) => { qiKnownAddresses = list; });
		} else {
			qiKnownAddresses = [];
		}
	});

	/** Pre-fill the quick-inquiry origin fields from a picked known address. */
	function applyQiOrigin(a: KnownAddress) {
		qiOriginStreet = knownAddressStreetLine(a);
		qiOriginCity = a.city;
		qiOriginPostal = a.postal_code ?? '';
	}

	/** Pre-fill the quick-inquiry destination fields from a picked known address. */
	function applyQiDestination(a: KnownAddress) {
		qiDestStreet = knownAddressStreetLine(a);
		qiDestCity = a.city;
		qiDestPostal = a.postal_code ?? '';
	}

	// Quick-termin form fields
	let qtTitle = $state('');
	let qtCategory = $state('intern');
	let qtLocation = $state('');
	let qtDuration = $state(8);
	let qtCustomerMode = $state<'none' | 'existing' | 'new'>('none');
	let qtCustomerSearch = $state('');
	let qtCustomerResults = $state<{ id: string; name: string | null; email: string | null }[]>([]);
	let qtCustomerSearching = $state(false);
	let qtCustomerId = $state<string | null>(null);
	let qtCustomerLabel = $state('');
	let qtNewCustEmail = $state('');
	let qtNewCustName = $state('');
	let qtNewCustPhone = $state('');
	let qtNewCustSalutation = $state('');
	// Alex's working day starts at 08:00 (feedback report 62702b57).
	let qtStartTime = $state(DEFAULT_START_TIME);
	let qtEndTime = $state(DEFAULT_END_TIME);

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
				map.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, name);
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
	function buildDayEntries(dateStr: string): Array<{ type: 'inquiry'; item: InquiryItem } | { type: 'termin'; item: CalendarItem } | { type: 'schedule-termin'; item: ScheduleCalendarItem } | { type: 'appointment'; item: ScheduleAppointment }> {
		const sched = schedule.find(s => s.date === dateStr || s.date.startsWith(dateStr));
		const inqEntries = (sched?.inquiries ?? []).map(i => ({ type: 'inquiry' as const, item: i }));
		const schedTermEntries = (sched?.calendar_items ?? []).map(ci => ({ type: 'schedule-termin' as const, item: ci }));
		const apptEntries = (sched?.appointments ?? []).map(a => ({ type: 'appointment' as const, item: a }));
		return [...inqEntries, ...schedTermEntries, ...apptEntries].sort((a, b) =>
			(a.item.start_time || '').localeCompare(b.item.start_time || '')
		);
	}

	/**
	 * Returns an ordered list of multi-day event IDs for a given week (7 dates).
	 * Events are ordered by ID for determinism; the same order is used for all
	 * 7 days so each event stays pinned to its lane even on days it is absent.
	 */
	function getWeekLanes(weekDates: string[]): string[] {
		const seen = new Set<string>();
		const lanes: string[] = [];
		for (const dateStr of weekDates) {
			const entries = buildDayEntries(dateStr);
			type MDEntry = { type: 'inquiry'; item: InquiryItem } | { type: 'schedule-termin'; item: ScheduleCalendarItem };
		const md = (entries
				.filter(e =>
					(e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1) ||
					(e.type === 'schedule-termin' && e.item.total_days && e.item.total_days > 1)
				) as MDEntry[])
				.sort((a, b) => {
					const idA = a.type === 'inquiry' ? a.item.inquiry_id : a.item.calendar_item_id;
					const idB = b.type === 'inquiry' ? b.item.inquiry_id : b.item.calendar_item_id;
					return idA.localeCompare(idB);
				});
			for (const entry of md) {
				const id = entry.type === 'inquiry' ? entry.item.inquiry_id : entry.item.calendar_item_id;
				if (!seen.has(id)) { seen.add(id); lanes.push(id); }
			}
		}
		return lanes;
	}

	/** Maps every dateStr in the current calendar to its week's stable lane order. */
	let dayLaneMap = $derived.by(() => {
		const map = new Map<string, string[]>();
		for (let i = 0; i < calendarDays.length; i += 7) {
			const week = calendarDays.slice(i, i + 7);
			const lanes = getWeekLanes(week.map(d => d.dateStr));
			for (const d of week) map.set(d.dateStr, lanes);
		}
		return map;
	});

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
		const myToken = ++loadToken;
		loading = true;
		try {
			let from: string, to: string;
			if (viewMode === 'week') {
				from = weekDays[0];
				to = weekDays[6];
			} else if (viewMode === 'day') {
				from = dayViewDate;
				to = dayViewDate;
			} else {
				const pad = (n: number) => String(n).padStart(2, '0');
				const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
				const daysInMonth = new Date(year, month + 1, 0).getDate();
				const trailing = (7 - ((firstDow + daysInMonth) % 7)) % 7;
				const gridStart = new Date(year, month, 1 - firstDow);
				const gridEnd = new Date(year, month + 1, trailing);
				from = `${gridStart.getFullYear()}-${pad(gridStart.getMonth() + 1)}-${pad(gridStart.getDate())}`;
				to = `${gridEnd.getFullYear()}-${pad(gridEnd.getMonth() + 1)}-${pad(gridEnd.getDate())}`;
			}
			const schedRes = await apiGet<DaySchedule[] | { dates: DaySchedule[] }>(`/api/v1/calendar/schedule?from=${from}&to=${to}`);
			if (myToken !== loadToken) return;
			schedule = (Array.isArray(schedRes) ? schedRes : ((schedRes as { dates?: DaySchedule[] }).dates ?? [])).map(d => ({ ...d, calendar_items: d.calendar_items ?? [], appointments: d.appointments ?? [] }));
		} catch {
			if (myToken !== loadToken) return;
			schedule = [];
		} finally {
			if (myToken === loadToken) loading = false;
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
		const schedule = day || { date: dateStr, inquiries: [], available: true, capacity: 1, booked: 0, remaining: 1, calendar_items: [], appointments: [] };
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
	function onEntryDragStart(e: DragEvent, id: string, type: 'inquiry' | 'termin' | 'appointment', fromDate: string, dayNumber: number = 1, apptInquiryId: string | null = null) {
		draggingId = id;
		draggingType = type;
		draggingFromDate = fromDate;
		draggingDayNumber = dayNumber;
		draggingApptInquiryId = apptInquiryId;
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
		const dayNumber = draggingDayNumber;
		const apptInquiryId = draggingApptInquiryId;
		draggingId = null;
		draggingType = null;
		draggingFromDate = null;
		draggingDayNumber = 1;
		draggingApptInquiryId = null;
		if (!id || fromDate === dateStr) return;

		// Multi-day items: grabbing day N and dropping on D means the whole span shifts so
		// that day N lands on D — i.e. new scheduled_date = D - (N - 1) days.
		let newScheduledDate = dateStr;
		if (dayNumber > 1) {
			const [yy, mm, dd] = dateStr.split('-').map(Number);
			const shifted = new Date(yy, mm - 1, dd - (dayNumber - 1));
			const pad = (n: number) => String(n).padStart(2, '0');
			newScheduledDate = `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
		}

		// Optimistic merge: move the entry between days in local state immediately so it
		// never disappears between PATCH and reload. The subsequent loadSchedule confirms.
		const ensureDay = (d: string): DaySchedule => {
			let day = schedule.find(s => s.date === d);
			if (!day) {
				day = { date: d, available: true, capacity: 1, booked: 0, remaining: 1, inquiries: [], calendar_items: [], appointments: [] };
				schedule = [...schedule, day];
			}
			return day;
		};
		// Snapshot for rollback on PATCH failure (avoids the flicker where the item
		// moves, then the error toast fires, then loadSchedule snaps it back).
		const scheduleSnapshot = schedule.map(d => ({
			...d,
			inquiries: [...d.inquiries],
			calendar_items: [...d.calendar_items],
			appointments: [...(d.appointments ?? [])],
		}));
		const byStartTime = <T extends { start_time?: string | null }>(a: T, b: T) =>
			(a.start_time || '').localeCompare(b.start_time || '');
		if (type === 'inquiry') {
			const fromDay = fromDate ? schedule.find(s => s.date === fromDate) : undefined;
			const idx = fromDay?.inquiries.findIndex(i => i.inquiry_id === id) ?? -1;
			if (fromDay && idx >= 0) {
				const moved = { ...fromDay.inquiries[idx], scheduled_date: dateStr };
				fromDay.inquiries = fromDay.inquiries.filter((_, i) => i !== idx);
				const toDay = ensureDay(dateStr);
				toDay.inquiries = [...toDay.inquiries, moved].sort(byStartTime);
				schedule = [...schedule];
			}
		} else if (type === 'termin') {
			const fromDay = fromDate ? schedule.find(s => s.date === fromDate) : undefined;
			const idx = fromDay?.calendar_items.findIndex(c => c.calendar_item_id === id) ?? -1;
			if (fromDay && idx >= 0) {
				const moved = { ...fromDay.calendar_items[idx] };
				fromDay.calendar_items = fromDay.calendar_items.filter((_, i) => i !== idx);
				const toDay = ensureDay(dateStr);
				toDay.calendar_items = [...toDay.calendar_items, moved].sort(byStartTime);
				schedule = [...schedule];
			}
		} else if (type === 'appointment') {
			// Appointments are single-date and live independently of the move — moving
			// one never touches the inquiry's move day(s) or any other appointment.
			const fromDay = fromDate ? schedule.find(s => s.date === fromDate) : undefined;
			const idx = fromDay?.appointments.findIndex(a => a.appointment_id === id) ?? -1;
			if (fromDay && idx >= 0) {
				const moved = { ...fromDay.appointments[idx], scheduled_date: dateStr };
				fromDay.appointments = fromDay.appointments.filter((_, i) => i !== idx);
				const toDay = ensureDay(dateStr);
				toDay.appointments = [...toDay.appointments, moved].sort(byStartTime);
				schedule = [...schedule];
			}
		}

		// If the drop target falls outside the currently-viewed month, jump to that month
		// so Alex visually lands on the new location.
		const [dy, dm] = dateStr.split('-').map(Number);
		const movedOutOfView =
			viewMode === 'month' && (dy !== year || dm - 1 !== month);
		if (movedOutOfView) {
			currentDate = new Date(dy, dm - 1, 1);
		}

		// Appointments PATCH their own nested endpoint; moves/termine patch the entity.
		const patchUrl = type === 'termin'
			? `/api/v1/admin/calendar-items/${id}`
			: type === 'appointment'
				? `/api/v1/inquiries/${apptInquiryId}/appointments/${id}`
				: `/api/v1/inquiries/${id}`;
		try {
			await apiPatch(patchUrl, { scheduled_date: newScheduledDate });
			// Offer a 5s undo window — PATCHes the entity back to its original
			// scheduled_date. The end_date-shift logic on the backend preserves
			// the span on the way back as well.
			if (fromDate && fromDate !== newScheduledDate) {
				const undoUrl = patchUrl;
				const originalDate = fromDate;
				showToast('Verschoben', 'success', {
					durationMs: 5000,
					action: {
						label: 'Rückgängig',
						onClick: async () => {
							try {
								await apiPatch(undoUrl, { scheduled_date: originalDate });
								await loadSchedule();
							} catch (e) {
								showToast((e as Error).message, 'error');
							}
						},
					},
				});
			} else {
				showToast('Termin verschoben', 'success');
			}
			if (!movedOutOfView) await loadSchedule();
		} catch (err) {
			// Roll back the optimistic move before reloading so the user sees a single
			// transition (snap back to origin + toast) instead of the item flickering
			// at the new spot first.
			schedule = scheduleSnapshot;
			showToast((err as Error).message, 'error');
			await loadSchedule();
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
	function openQuickCreate(mode: 'inquiry' | 'termin' | 'appointment', dateOverride?: string) {
		quickCreateDate = dateOverride ?? contextMenu!.dateStr;
		contextMenu = null;
		quickCreateMode = mode;
		quickCreateError = '';
		qiServiceType = 'privatumzug';
		qiCustomerMode = 'existing'; qiCustomerSearch = ''; qiCustomerResults = []; qiCustomerId = null; qiCustomerLabel = '';
		qiEmail = ''; qiName = ''; qiPhone = ''; qiSalutation = '';
		qiOriginStreet = ''; qiOriginCity = ''; qiOriginPostal = '';
		qiDestStreet = ''; qiDestCity = ''; qiDestPostal = '';
		qiNotes = '';
		qtTitle = ''; qtCategory = 'intern'; qtLocation = ''; qtDuration = 8;
		qtStartTime = DEFAULT_START_TIME; qtEndTime = DEFAULT_END_TIME;
		qtCustomerMode = 'none'; qtCustomerSearch = ''; qtCustomerResults = []; qtCustomerId = null; qtCustomerLabel = '';
		qtNewCustEmail = ''; qtNewCustName = ''; qtNewCustPhone = ''; qtNewCustSalutation = '';
		qaInquirySearch = ''; qaInquiryResults = []; qaInquiryId = null; qaInquiryLabel = '';
		qaKind = 'besichtigung'; qaStartTime = ''; qaEndTime = ''; qaAssigneeId = ''; qaLocation = ''; qaNotes = '';
		if (mode === 'appointment') loadQaEmployees();
	}

	/**
	 * Opens the appointment quick-create pre-linked to a known inquiry (e.g. from
	 * the side panel of an inquiry you're already looking at), so Alex skips the
	 * search step and only picks the visit date + details.
	 */
	function openAppointmentForInquiry(inquiryId: string, label: string, dateStr: string = '') {
		openQuickCreate('appointment', dateStr);
		qaInquiryId = inquiryId;
		qaInquiryLabel = label;
	}

	/** Searches existing inquiries to link a new appointment to. */
	async function searchQaInquiries(q: string) {
		if (q.trim().length < 2) { qaInquiryResults = []; return; }
		qaInquirySearching = true;
		try {
			const res = await apiGet<{ inquiries: { id: string; customer_name: string | null; origin_city: string | null; destination_city: string | null; status: string }[] }>(`/api/v1/inquiries?search=${encodeURIComponent(q)}&limit=8`);
			qaInquiryResults = res.inquiries;
		} catch { qaInquiryResults = []; }
		finally { qaInquirySearching = false; }
	}

	/** Lazily loads active employees for the appointment assignee dropdown. */
	async function loadQaEmployees() {
		if (qaEmployeesLoaded) return;
		try {
			const res = await apiGet<{ employees: { id: string; first_name: string; last_name: string }[] }>('/api/v1/admin/employees?active=true&limit=100');
			qaEmployees = res.employees;
			qaEmployeesLoaded = true;
		} catch { /* non-fatal: dropdown just stays empty */ }
	}

	/**
	 * Creates an appointment linked to the chosen inquiry on the pre-seeded date,
	 * reloads the calendar, then opens its panel so the team can be added at once.
	 */
	async function submitQuickAppointment() {
		if (!qaInquiryId) { quickCreateError = 'Bitte eine Anfrage auswählen'; return; }
		if (!quickCreateDate) { quickCreateError = 'Datum fehlt'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			const created = await apiPost<{ id: string }>(`/api/v1/inquiries/${qaInquiryId}/appointments`, {
				kind: qaKind.trim() || 'besichtigung',
				scheduled_date: quickCreateDate,
				start_time: qaStartTime ? normalizeTimeInput(qaStartTime) : null,
				end_time: qaEndTime ? normalizeTimeInput(qaEndTime) : null,
				assignee_id: qaAssigneeId || null,
				location: qaLocation.trim() || null,
				notes: qaNotes.trim() || null,
			});
			showToast('Zusatztermin angelegt — jetzt Team zuweisen', 'success');
			quickCreateMode = null;
			await loadSchedule();
			// Jump straight into the panel so crew + hours can be added immediately.
			openAppointmentPanel({
				appointment_id: created.id,
				inquiry_id: qaInquiryId,
				kind: qaKind.trim() || 'besichtigung',
				customer_name: qaInquiryLabel || null,
				start_time: qaStartTime ? normalizeTimeInput(qaStartTime) : null,
				end_time: qaEndTime ? normalizeTimeInput(qaEndTime) : null,
				assignee_name: null,
				location: qaLocation.trim() || null,
				notes: qaNotes.trim() || null,
				status: 'scheduled',
				scheduled_date: quickCreateDate,
			});
		} catch (err) {
			quickCreateError = (err as Error).message;
		} finally {
			quickCreateLoading = false;
		}
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
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string | null }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
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
		if (qiAddrCfg.showOrigin && (!qiOriginStreet.trim() || !qiOriginCity.trim())) { quickCreateError = `${qiAddrCfg.originLabel} (Straße, Stadt) erforderlich`; return; }
		if (qiAddrCfg.showDestination && !qiAddrCfg.optionalDestination && (!qiDestStreet.trim() || !qiDestCity.trim())) { quickCreateError = `${qiAddrCfg.destinationLabel} (Straße, Stadt) erforderlich`; return; }
		if (qiCustomerMode === 'existing' && !qiCustomerId) { quickCreateError = 'Bitte einen Kunden auswählen'; return; }
		if (qiCustomerMode === 'new' && !qiName.trim() && !qiEmail.trim() && !qiPhone.trim()) { quickCreateError = 'Bitte mindestens Name, E-Mail oder Telefon angeben'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			let customerId = qiCustomerId;
			if (qiCustomerMode === 'new') {
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qiEmail.trim() || null,
					name: qiName.trim() || null,
					phone: qiPhone.trim() || null,
					salutation: qiSalutation || null,
				});
				customerId = c.id;
			}
			const body: Record<string, unknown> = {
				customer_id: customerId,
				service_type: qiServiceType,
				scheduled_date: quickCreateDate,
				notes: qiNotes.trim() || null,
			};
			if (qiAddrCfg.showOrigin) {
				body.origin = {
					street: qiOriginStreet.trim(),
					city: qiOriginCity.trim(),
					postal_code: qiOriginPostal.trim() || null,
				};
			}
			if (qiAddrCfg.showDestination && (!qiAddrCfg.optionalDestination || qiDestStreet.trim() || qiDestCity.trim())) {
				body.destination = {
					street: qiDestStreet.trim(),
					city: qiDestCity.trim(),
					postal_code: qiDestPostal.trim() || null,
				};
			}
			await apiPost('/api/v1/inquiries', body);
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
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string | null }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
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
				if (!qtNewCustName.trim() && !qtNewCustEmail.trim() && !qtNewCustPhone.trim()) { quickCreateError = 'Bitte mindestens Name, E-Mail oder Telefon angeben'; return; }
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qtNewCustEmail.trim() || null,
					name: qtNewCustName.trim() || null,
					phone: qtNewCustPhone.trim() || null,
					salutation: qtNewCustSalutation || null,
				});
				customerId = c.id;
			}
			await apiPost('/api/v1/admin/calendar-items', {
				title: qtTitle.trim(),
				category: qtCategory,
				location: qtLocation.trim() || null,
				scheduled_date: quickCreateDate,
				start_time: normalizeTimeInput(qtStartTime),
				end_time: normalizeTimeInput(qtEndTime),
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

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			closePanel();
			closeContextMenu();
			quickCreateMode = null;
		}
	}}
/>

<svelte:head><title>Kalender</title></svelte:head>

{#snippet md(item: { day_number?: number | null; total_days?: number | null })}
	{#if item.total_days && item.total_days > 1}
		<span class="label-xs mb-1 flex items-center gap-1 text-[10px] opacity-75">
			{#if item.day_number && item.day_number > 1}←{/if}
			Tag {item.day_number ?? 1}/{item.total_days}
			{#if item.day_number && item.day_number < item.total_days}→{/if}
		</span>
	{/if}
{/snippet}

<!-- Customer picker shared by the quick-create dialogs. -->
{#snippet customerResults(results: { id: string; name: string | null; email: string | null }[], pick: (c: { id: string; name: string | null; email: string | null }) => void)}
	{#if results.length > 0}
		<div class="flex max-h-48 flex-col overflow-y-auto rounded-md border border-line bg-panel p-1">
			{#each results as c (c.id)}
				<button type="button" class="flex flex-col items-start rounded-sm px-2.5 py-1.5 text-left hover:bg-sunk" onclick={() => pick(c)}>
					<span class="text-sm">{c.name ?? c.email ?? 'Kunde'}</span>
					{#if c.name && c.email}<span class="text-xs text-muted">{c.email}</span>{/if}
				</button>
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet pickedBadge(label: string, clear: () => void)}
	<div class="flex items-center gap-2 rounded-sm border border-line-strong bg-sunk px-3 py-1.5">
		<span class="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
		<Button variant="ghost" size="icon-sm" aria-label="Entfernen" onclick={clear}><X size={14} /></Button>
	</div>
{/snippet}

<!-- Desktop dialogs are draggable (use:draggable) and sit over a clear backdrop so the
     calendar stays readable while you type; phones get a bottom sheet. -->
{#snippet dialog(title: string, body: import('svelte').Snippet, submit: () => void, submitLabel: string, wide = false)}
	<div
		class="fixed inset-0 z-[600] flex items-end justify-center bg-black/30 sm:items-center sm:bg-black/10 sm:p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) quickCreateMode = null;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') quickCreateMode = null;
		}}
		role="dialog"
		aria-modal="true"
		aria-label={title}
		tabindex="-1"
	>
		<div
			class="flex max-h-[92dvh] w-full flex-col rounded-t-lg border border-line bg-panel text-fg shadow-2xl sm:rounded-md {wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}"
			use:draggable
		>
			<header class="flex shrink-0 cursor-move items-center justify-between gap-3 border-b border-line px-5 py-3.5">
				<h3 class="text-base font-semibold">{title}</h3>
				<Button variant="ghost" size="icon-sm" aria-label="Schließen" onclick={() => (quickCreateMode = null)}><X size={16} /></Button>
			</header>
			<div class="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-4">
				{@render body()}
				{#if quickCreateError}<Notice tone="danger">{quickCreateError}</Notice>{/if}
			</div>
			<footer class="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3">
				<Button onclick={() => (quickCreateMode = null)}>Abbrechen</Button>
				<Button variant="solid" onclick={submit} disabled={quickCreateLoading}>{quickCreateLoading ? 'Wird erstellt …' : submitLabel}</Button>
			</footer>
		</div>
	</div>
{/snippet}

<PageHeader title="Kalender">
	{#snippet actions()}
		<Segmented
			label="Ansicht"
			options={[
				{ value: 'month', label: 'Monat' },
				{ value: 'week', label: 'Woche' },
				{ value: 'day', label: 'Tag' }
			]}
			bind:value={viewMode}
		/>
	{/snippet}
</PageHeader>

<div class="flex items-start gap-5 {panelOpen ? '' : ''}">
	<div class="min-w-0 flex-1">
		<div class="mb-4 flex items-center justify-between gap-3">
			<div class="flex items-center gap-1">
				<button
					class="inline-flex size-9 items-center justify-center rounded-sm border border-line-strong hover:bg-sunk {navDragOver === 'prev'
						? 'bg-accent/15 ring-2 ring-accent'
						: ''}"
					aria-label="Zurück"
					onclick={viewMode === 'month' ? prevMonth : viewMode === 'week' ? prevWeek : prevDay}
					ondragover={(e) => onNavDragOver(e, 'prev')}
					ondragleave={onNavDragLeave}><ChevronLeft size={18} /></button
				>
				<button
					class="inline-flex size-9 items-center justify-center rounded-sm border border-line-strong hover:bg-sunk {navDragOver === 'next'
						? 'bg-accent/15 ring-2 ring-accent'
						: ''}"
					aria-label="Weiter"
					onclick={viewMode === 'month' ? nextMonth : viewMode === 'week' ? nextWeek : nextDay}
					ondragover={(e) => onNavDragOver(e, 'next')}
					ondragleave={onNavDragLeave}><ChevronRight size={18} /></button
				>
				<h2 class="ml-2 text-lg font-semibold tracking-tight sm:text-xl">
					{viewMode === 'month' ? monthName : viewMode === 'week' ? weekLabel : dayViewLabel()}
				</h2>
			</div>
			{#if publicHolidays.length > 0 || schoolHolidays.length > 0}
				<span class="hidden items-center gap-3 text-xs text-muted sm:flex">
					<span class="flex items-center gap-1.5"><span class="size-2.5 rounded-xs bg-danger/40"></span>Feiertag</span>
					<span class="flex items-center gap-1.5"><span class="size-2.5 rounded-xs bg-warn/40"></span>Schulferien (NI)</span>
				</span>
			{/if}
		</div>

		<div role="region" aria-label="Kalenderbereich" ontouchstart={onTouchStart} ontouchend={onTouchEnd}>
			{#if viewMode === 'month'}
				{#if isMobile}
					<MonthAgenda
						{calendarDays}
						{publicHolidayMap}
						{schoolHolidayMap}
						{buildDayEntries}
						{inquiryEntryClass}
						{termineEntryClass}
						{truncate}
						{apptKindLabel}
						{openInquiryPanel}
						{openTerminPanel}
						onAppointmentClick={openAppointmentInquiry}
					/>
				{:else}
					<CalendarGrid
						{calendarDays}
						{weekdays}
						{publicHolidayMap}
						{schoolHolidayMap}
						{dayLaneMap}
						{dragOverDate}
						{buildDayEntries}
						{inquiryEntryClass}
						{termineEntryClass}
						{truncate}
						{apptKindLabel}
						{openDayPanel}
						{onCellDragOver}
						{onCellDragLeave}
						{onCellDrop}
						{onCellContextMenu}
						{onEntryDragStart}
						{openInquiryPanel}
						{openTerminPanel}
						onAppointmentClick={openAppointmentInquiry}
					/>
				{/if}
			{:else if viewMode === 'week'}
				<div class="grid grid-cols-1 overflow-hidden rounded-md border border-line bg-line gap-px md:grid-cols-7">
					{#each weekDays as dateStr (dateStr)}
						{@const sched = schedule.find((s) => s.date === dateStr || s.date.startsWith(dateStr))}
						{@const allEntries = buildDayEntries(dateStr)}
						{@const booked = sched?.booked ?? 0}
						{@const capacity = sched?.capacity ?? 1}
						{@const overbooked = booked > capacity}
						{@const isToday = dateStr === todayStr}
						{@const [wy, wm, wd] = dateStr.split('-').map(Number)}
						{@const weekDayLabel = new Date(wy, wm - 1, wd).toLocaleDateString('de-DE', { weekday: 'short' })}
						{@const wPublicHol = publicHolidayMap.get(dateStr)}
						{@const wSchoolHol = schoolHolidayMap.get(dateStr)}
						<!-- A div, not a <button>: the entries inside carry tap-to-call links, and
						     interactive content inside a <button> is invalid / swallowed by browsers. -->
						<div
							role="button"
							tabindex="0"
							onkeydown={(e) => e.target === e.currentTarget && e.key === 'Enter' && openDayPanel(sched ?? null, null, dateStr)}
							class="flex min-h-40 min-w-0 cursor-pointer flex-col gap-1.5 p-2 text-left transition-colors md:min-h-[60dvh]
								{wPublicHol ? 'bg-danger/8' : wSchoolHol ? 'bg-warn/8' : overbooked ? 'bg-danger/5' : 'bg-panel'}
								{isToday ? 'shadow-[inset_0_2px_0_var(--accent)]' : ''}
								{dragOverDate === dateStr ? 'bg-accent/10 outline-2 -outline-offset-2 outline-accent outline-dashed' : ''}"
							onclick={() => openDayPanel(sched ?? null, null, dateStr)}
							ondragover={(e) => onCellDragOver(e, dateStr)}
							ondragleave={onCellDragLeave}
							ondrop={(e) => onCellDrop(e, dateStr)}
							oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
						>
							<span class="flex flex-wrap items-center gap-1.5">
								<span class="label-xs text-[10px] text-faint">{weekDayLabel}</span>
								<span class="num inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-sm font-semibold {isToday ? 'bg-fg text-bg' : ''}">{wd}</span>
								{#if booked > 0}
									<span class="num ml-auto text-[11px] {overbooked ? 'font-semibold text-danger' : 'text-faint'}">{booked}/{capacity}</span>
								{/if}
							</span>
							{#if wPublicHol}<span class="truncate text-[11px] font-medium text-danger">{wPublicHol}</span>{/if}
							{#if wSchoolHol}<span class="truncate text-[11px] text-warn">{wSchoolHol}</span>{/if}
							<span class="flex flex-col gap-1.5">
								{#each allEntries as entry, ei (ei)}
									{#if entry.type === 'inquiry'}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="block w-full cursor-grab rounded-sm px-2.5 py-2 text-left hover:brightness-95 active:cursor-grabbing {inquiryEntryClass(entry.item.status)}"
											draggable="true"
											ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
											onclick={(e) => openInquiryPanel(e, entry.item)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
										>
											{@render md(entry.item)}
											<span class="flex items-center justify-between gap-1">
												<span class="num text-[11px] opacity-75"
													>{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span
												>
												<StatusBadge status={entry.item.status} />
											</span>
											<span class="mt-0.5 block truncate text-[13px] font-semibold">{entry.item.customer_name ?? '—'}</span>
											<PhoneLink phone={entry.item.customer_phone} class="text-[11px]" />
											{#if entry.item.departure_address || entry.item.arrival_address}
												<span class="block text-[11px] leading-snug opacity-80">{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</span>
											{/if}
											{#if entry.item.offer_price_cents || entry.item.volume_m3}
												<span class="num mt-1 flex gap-2 text-[11px] opacity-80">
													{#if entry.item.offer_price_cents}<span>{(calculateBruttoCents(entry.item.offer_price_cents) / 100).toFixed(0)} €</span>{/if}
													{#if entry.item.volume_m3}<span>{entry.item.volume_m3.toFixed(1)} m³</span>{/if}
												</span>
											{/if}
											{#if entry.item.employee_names}
												<span class="mt-1 flex items-start gap-1 text-[11px] opacity-80"><Users size={11} class="mt-0.5 shrink-0" />{entry.item.employee_names}</span>
											{/if}
											{#if entry.item.notes}<span class="mt-1 block text-[11px] italic opacity-70">{truncate(entry.item.notes, 70)}</span>{/if}
										</div>
									{:else if entry.type === 'termin'}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="block w-full cursor-grab rounded-sm px-2.5 py-2 text-left hover:brightness-95 active:cursor-grabbing {termineEntryClass(entry.item.category)}"
											draggable="true"
											ondragstart={(e) => onEntryDragStart(e, entry.item.id, 'termin', dateStr)}
											onclick={(e) => openTerminPanel(e, entry.item)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, entry.item)}
										>
											<span class="flex items-center justify-between gap-1 text-[11px]">
												<span class="num opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
												<span class="font-medium">{CATEGORY_LABELS[entry.item.category] ?? entry.item.category}</span>
											</span>
											<span class="mt-0.5 block truncate text-[13px] font-semibold">{entry.item.title}</span>
											{#if entry.item.location}<span class="flex items-center gap-1 text-[11px] opacity-80"><MapPin size={11} />{entry.item.location}</span>{/if}
											{#if entry.item.duration_hours > 0}<span class="num flex items-center gap-1 text-[11px] opacity-80"><Clock size={11} />{entry.item.duration_hours} h</span>{/if}
											{#if entry.item.description}<span class="mt-1 block text-[11px] italic opacity-70">{truncate(entry.item.description, 70)}</span>{/if}
										</div>
									{:else if entry.type === 'appointment'}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="block w-full cursor-grab rounded-sm px-2.5 py-2 text-left hover:brightness-95 active:cursor-grabbing entry-appt"
											draggable="true"
											ondragstart={(e) => onEntryDragStart(e, entry.item.appointment_id, 'appointment', dateStr, 1, entry.item.inquiry_id)}
											onclick={(e) => openAppointmentInquiry(e, entry.item)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && openAppointmentInquiry(e, entry.item)}
										>
											<span class="flex items-center justify-between gap-1 text-[11px]">
												<span class="num opacity-75">{entry.item.start_time ? formatTime(entry.item.start_time) : ''}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
												<span class="font-medium">{apptKindLabel(entry.item.kind)}</span>
											</span>
											<span class="mt-0.5 block truncate text-[13px] font-semibold">{entry.item.customer_name ?? '—'}</span>
											<PhoneLink phone={entry.item.customer_phone} class="text-[11px]" />
											{#if entry.item.assignee_name}<span class="flex items-center gap-1 text-[11px] opacity-80"><User size={11} />{entry.item.assignee_name}</span>{/if}
											{#if entry.item.location}<span class="flex items-center gap-1 text-[11px] opacity-80"><MapPin size={11} />{entry.item.location}</span>{/if}
											{#if entry.item.notes}<span class="mt-1 block text-[11px] italic opacity-70">{truncate(entry.item.notes, 70)}</span>{/if}
										</div>
									{:else}
										{@const terminArg = {
											id: entry.item.calendar_item_id,
											title: entry.item.title,
											category: entry.item.category,
											location: entry.item.location,
											description: entry.item.description ?? null,
											customer_name: entry.item.customer_name ?? null,
											customer_phone: entry.item.customer_phone ?? null,
											scheduled_date: dateStr,
											start_time: entry.item.start_time,
											end_time: entry.item.end_time ?? null,
											duration_hours: 0,
											status: 'scheduled'
										}}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div
											class="block w-full cursor-grab rounded-sm px-2.5 py-2 text-left hover:brightness-95 active:cursor-grabbing {termineEntryClass(entry.item.category)}"
											draggable="true"
											ondragstart={(e) => onEntryDragStart(e, entry.item.calendar_item_id, 'termin', dateStr)}
											onclick={(e) => openTerminPanel(e, terminArg)}
											role="button"
											tabindex="0"
											onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, terminArg)}
										>
											{@render md(entry.item)}
											<span class="flex items-center justify-between gap-1 text-[11px]">
												<span class="num opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
												<span class="font-medium">{CATEGORY_LABELS[entry.item.category] ?? entry.item.category}</span>
											</span>
											<span class="mt-0.5 block truncate text-[13px] font-semibold">{entry.item.title}</span>
											{#if entry.item.customer_name}<span class="block truncate text-[11px] opacity-80">{entry.item.customer_name}</span>{/if}
											<PhoneLink phone={entry.item.customer_phone} class="text-[11px]" />
											{#if entry.item.location}<span class="flex items-center gap-1 text-[11px] opacity-80"><MapPin size={11} />{entry.item.location}</span>{/if}
											{#if entry.item.employee_names}<span class="flex items-start gap-1 text-[11px] opacity-80"><Users size={11} class="mt-0.5 shrink-0" />{entry.item.employee_names}</span>{/if}
										</div>
									{/if}
								{/each}
								{#if allEntries.length === 0}<span class="text-xs text-faint">—</span>{/if}
							</span>
						</div>
					{/each}
				</div>
			{:else}
				{@const daySched = schedule.find((s) => s.date === dayViewDate || s.date.startsWith(dayViewDate))}
				{@const dayAllEntries = buildDayEntries(dayViewDate)}
				<div class="overflow-hidden rounded-md border border-line bg-panel">
					<div class="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
						<span class="flex flex-wrap items-center gap-3 text-[13px] text-muted">
							{#if daySched}<span class="num">Kapazität {daySched.booked}/{daySched.capacity}</span>{/if}
							{#if publicHolidayMap.get(dayViewDate)}<span class="font-medium text-danger">{publicHolidayMap.get(dayViewDate)}</span>{/if}
							{#if schoolHolidayMap.get(dayViewDate)}<span class="text-warn">{schoolHolidayMap.get(dayViewDate)}</span>{/if}
						</span>
						<Button
							size="sm"
							variant="ghost"
							onclick={() => onCellContextMenu({ clientX: 0, clientY: 60, preventDefault: () => {} } as MouseEvent, dayViewDate)}
						>
							<Plus size={14} /> Eintrag
						</Button>
					</div>
					<div class="flex flex-col">
						{#each Array.from({ length: 14 }, (_, i) => i + 6) as hour (hour)}
							<div class="grid min-h-12 grid-cols-[56px_minmax(0,1fr)] border-b border-line last:border-b-0">
								<div class="num border-r border-line px-2 py-1 text-right text-[11px] text-faint">{String(hour).padStart(2, '0')}:00</div>
								<div class="relative flex gap-1 p-1">
									{#each dayAllEntries as entry, ei (ei)}
										{@const startH = parseInt((entry.item.start_time || '06:00').slice(0, 2))}
										{@const endH = parseInt((entry.item.end_time || String(startH + 1).padStart(2, '0') + ':00').slice(0, 2))}
										{#if startH === hour}
											<div
												role="button"
												tabindex="0"
												onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
												class="z-[1] flex min-w-32 flex-1 cursor-pointer flex-col items-start gap-0.5 rounded-sm px-2.5 py-1.5 text-left hover:brightness-95 {entry.type === 'inquiry'
													? inquiryEntryClass(entry.item.status)
													: entry.type === 'appointment'
														? 'entry-appt'
														: termineEntryClass(entry.item.category || 'intern')}"
												style="height:{Math.max(1, endH - startH) * 48 - 8}px"
												onclick={(e) => {
													if (entry.type === 'inquiry') {
														openInquiryPanel(e, entry.item);
													} else if (entry.type === 'schedule-termin') {
														const sci = entry.item as ScheduleCalendarItem;
														openTerminPanel(e, {
															id: sci.calendar_item_id,
															title: sci.title,
															category: sci.category,
															location: sci.location,
															description: sci.description ?? null,
															customer_name: sci.customer_name ?? null,
															customer_phone: sci.customer_phone ?? null,
															scheduled_date: dayViewDate,
															start_time: sci.start_time ?? '',
															end_time: sci.end_time ?? null,
															duration_hours: 0,
															status: 'scheduled'
														});
													} else if (entry.type === 'appointment') {
														openAppointmentInquiry(e, entry.item);
													} else {
														openTerminPanel(e, entry.item as CalendarItem);
													}
												}}
											>
												<span class="num text-[11px] opacity-75">{formatTime(entry.item.start_time)}–{formatTime(entry.item.end_time)}</span>
												<span class="truncate text-[13px] font-semibold"
													>{entry.type === 'inquiry'
														? (entry.item.customer_name ?? '—')
														: entry.type === 'appointment'
															? apptKindLabel(entry.item.kind)
															: entry.item.title}</span
												>
												{#if entry.type === 'appointment' && entry.item.customer_name}
													<span class="truncate text-[11px] opacity-80">{entry.item.customer_name}</span>
												{:else if entry.type === 'schedule-termin' && entry.item.customer_name}
													<span class="truncate text-[11px] opacity-80">{entry.item.customer_name}</span>
												{/if}
												<PhoneLink phone={entry.item.customer_phone} class="text-[11px]" />
												{#if entry.type === 'inquiry' && entry.item.employee_names}
													<span class="flex items-center gap-1 text-[11px] opacity-80"><Users size={11} />{entry.item.employee_names}</span>
												{/if}
											</div>
										{/if}
									{/each}
								</div>
							</div>
						{/each}
						{#if dayAllEntries.length === 0}
							<p class="px-4 py-6 text-center text-sm text-muted">Keine Einträge für diesen Tag</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if isMobile && panelOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[509] bg-black/40" onclick={closePanel} onkeydown={(e) => e.key === 'Escape' && closePanel()}></div>
	{/if}

	<CalendarSidePanel
		bind:panelSelection
		{schedule}
		onLoadSchedule={loadSchedule}
		onAddAppointment={openAppointmentForInquiry}
		onOpenAppointment={openAppointmentPanel}
	/>
</div>

<!-- Phones: quick-create button above the tab bar. -->
{#if isMobile && !quickCreateMode}
	{#if fabOpen}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-[440]" onclick={() => (fabOpen = false)} onkeydown={(e) => e.key === 'Escape' && (fabOpen = false)}></div>
		<div class="fixed right-4 bottom-[calc(140px+env(safe-area-inset-bottom))] z-[441] flex flex-col gap-1 rounded-md border border-line bg-panel p-1 shadow-2xl">
			{#each [{ mode: 'inquiry', label: 'Anfrage erstellen', icon: ClipboardList }, { mode: 'termin', label: 'Termin erstellen', icon: CalendarPlus }, { mode: 'appointment', label: 'Besichtigung', icon: Search }] as const as item (item.mode)}
				<button
					class="flex h-11 items-center gap-3 rounded-sm px-3 text-sm hover:bg-sunk"
					onclick={() => {
						fabOpen = false;
						openQuickCreate(item.mode, currentContextDate);
					}}
				>
					<item.icon size={16} class="text-muted" />{item.label}
				</button>
			{/each}
		</div>
	{/if}
	<button
		class="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[441] inline-flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-xl transition-transform {fabOpen
			? 'rotate-45'
			: ''}"
		onclick={() => (fabOpen = !fabOpen)}
		aria-label="Eintrag erstellen"
	>
		<Plus size={24} />
	</button>
{/if}

{#if contextMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[620]" onclick={closeContextMenu} onkeydown={(e) => e.key === 'Escape' && closeContextMenu()}></div>
	<div class="fixed z-[621] flex min-w-56 flex-col rounded-md border border-line bg-panel p-1 shadow-2xl" style="left:{contextMenu.x}px;top:{contextMenu.y}px;">
		<button class="flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-left text-sm hover:bg-sunk" onclick={() => openQuickCreate('inquiry')}>
			<ClipboardList size={15} class="text-muted" /> Anfrage erstellen
		</button>
		<button class="flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-left text-sm hover:bg-sunk" onclick={() => openQuickCreate('termin')}>
			<CalendarPlus size={15} class="text-muted" /> Termin erstellen
		</button>
		<button class="flex h-9 items-center gap-2.5 rounded-sm px-2.5 text-left text-sm hover:bg-sunk" onclick={() => openQuickCreate('appointment')}>
			<Search size={15} class="text-muted" /> Besichtigung / Zusatztermin
		</button>
	</div>
{/if}

{#snippet inquiryBody()}
	<div class="flex flex-col gap-2">
		<span class="label-xs text-faint">Auftragsart *</span>
		<div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
			{#each QI_SERVICE_OPTIONS as [id, label] (id)}
				<button
					type="button"
					aria-pressed={qiServiceType === id}
					class="h-8 rounded-sm border px-2 text-[13px] {qiServiceType === id ? 'border-fg bg-fg text-bg' : 'border-line text-muted hover:text-fg'}"
					onclick={() => (qiServiceType = id)}>{label}</button
				>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<span class="label-xs text-faint">Kunde *</span>
		{#if qiCustomerId}
			{@render pickedBadge(qiCustomerLabel, () => {
				qiCustomerId = null;
				qiCustomerLabel = '';
				qiCustomerSearch = '';
			})}
		{:else}
			<Segmented
				size="sm"
				label="Kunde"
				class="self-start"
				options={[
					{ value: 'existing', label: 'Suchen' },
					{ value: 'new', label: 'Neu' }
				]}
				bind:value={qiCustomerMode}
			/>
			{#if qiCustomerMode === 'existing'}
				<Input
					bind:value={qiCustomerSearch}
					oninput={(e) => searchQiCustomers((e.target as HTMLInputElement).value)}
					placeholder="Name oder E-Mail (mind. 2 Zeichen) …"
				/>
				{#if qiCustomerSearching}
					<span class="text-xs text-faint">Suche …</span>
				{:else if qiCustomerResults.length === 0 && qiCustomerSearch.trim().length >= 2}
					<span class="text-xs text-faint">Keine Treffer</span>
				{/if}
				{@render customerResults(qiCustomerResults, (c) => {
					qiCustomerId = c.id;
					qiCustomerLabel = c.name ?? c.email ?? 'Kunde';
					qiCustomerResults = [];
					qiCustomerSearch = '';
				})}
			{:else}
				<div class="grid grid-cols-2 gap-2">
					<Field label="Anrede" for="qi-salutation">
						<Select id="qi-salutation" bind:value={qiSalutation}>
							<option value="">—</option>
							<option value="Herr">Herr</option>
							<option value="Frau">Frau</option>
							<option value="D">Divers</option>
						</Select>
					</Field>
					<Field label="Telefon" for="qi-phone"><Input id="qi-phone" type="tel" bind:value={qiPhone} placeholder="+49 …" /></Field>
					<Field label="Name" for="qi-name"><Input id="qi-name" bind:value={qiName} placeholder="Max Mustermann" /></Field>
					<Field label="E-Mail" for="qi-email"><Input id="qi-email" type="email" bind:value={qiEmail} placeholder="kunde@example.com" /></Field>
				</div>
			{/if}
		{/if}
	</div>

	{#each [qiAddrCfg.showOrigin ? 'origin' : null, qiAddrCfg.showDestination ? 'dest' : null].filter(Boolean) as which (which)}
		<div class="flex flex-col gap-2">
			<span class="label-xs text-faint">{which === 'origin' ? qiAddrCfg.originLabel : qiAddrCfg.destinationLabel} *</span>
			<KnownAddressPicker addresses={qiKnownAddresses} onselect={which === 'origin' ? applyQiOrigin : applyQiDestination} />
			{#if which === 'origin'}
				<div class="grid grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] gap-2">
					<Input aria-label="Straße" bind:value={qiOriginStreet} placeholder="Musterstraße 1" />
					<Input aria-label="PLZ" bind:value={qiOriginPostal} placeholder="31134" />
					<Input aria-label="Stadt" bind:value={qiOriginCity} placeholder="Hildesheim" />
				</div>
			{:else}
				<div class="grid grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)] gap-2">
					<Input aria-label="Straße" bind:value={qiDestStreet} placeholder="Zielstraße 2" />
					<Input aria-label="PLZ" bind:value={qiDestPostal} placeholder="31134" />
					<Input aria-label="Stadt" bind:value={qiDestCity} placeholder="Hannover" />
				</div>
			{/if}
		</div>
	{/each}

	<Field label="Notizen" for="qi-notes"><Textarea id="qi-notes" bind:value={qiNotes} placeholder="Besonderheiten …" rows={2} /></Field>
{/snippet}

{#snippet terminBody()}
	<Field label="Titel *" for="qt-title"><Input id="qt-title" bind:value={qtTitle} placeholder="z. B. Fahrerschulung" /></Field>
	<div class="grid grid-cols-2 gap-3">
		<Field label="Kategorie" for="qt-cat">
			<Input id="qt-cat" list="cal-categories" bind:value={qtCategory} placeholder="Intern, Umzug, eigene …" />
			<datalist id="cal-categories">
				{#each Object.entries(CATEGORY_LABELS) as [v, l] (v)}<option value={v}>{l}</option>{/each}
			</datalist>
		</Field>
		<Field label="Dauer (h)" for="qt-dur"><Input id="qt-dur" class="num" type="number" min="0.5" step="0.5" bind:value={qtDuration} /></Field>
		<Field label="Startzeit *" for="qt-start">
			<Input id="qt-start" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={qtStartTime} required />
		</Field>
		<Field label="Endzeit" for="qt-end">
			<Input id="qt-end" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={qtEndTime} />
		</Field>
	</div>
	<Field label="Ort" for="qt-loc"><Input id="qt-loc" bind:value={qtLocation} placeholder="optional" /></Field>

	<div class="flex flex-col gap-2">
		<span class="label-xs text-faint">Kunde (optional)</span>
		{#if qtCustomerId}
			{@render pickedBadge(qtCustomerLabel, () => {
				qtCustomerId = null;
				qtCustomerLabel = '';
				qtCustomerMode = 'none';
			})}
		{:else}
			<Segmented
				size="sm"
				label="Kunde"
				class="self-start"
				options={[
					{ value: 'none', label: 'Kein Kunde' },
					{ value: 'existing', label: 'Suchen' },
					{ value: 'new', label: 'Neu' }
				]}
				bind:value={qtCustomerMode}
			/>
			{#if qtCustomerMode === 'existing'}
				<Input bind:value={qtCustomerSearch} oninput={(e) => searchQtCustomers((e.target as HTMLInputElement).value)} placeholder="Name oder E-Mail …" />
				{#if qtCustomerSearching}<span class="text-xs text-faint">Suche …</span>{/if}
				{@render customerResults(qtCustomerResults, (c) => {
					qtCustomerId = c.id;
					qtCustomerLabel = c.name ?? c.email ?? 'Kunde';
					qtCustomerResults = [];
				})}
			{:else if qtCustomerMode === 'new'}
				<div class="grid grid-cols-2 gap-2">
					<Field label="Anrede" for="qtc-salutation">
						<Select id="qtc-salutation" bind:value={qtNewCustSalutation}>
							<option value="">—</option>
							<option value="Herr">Herr</option>
							<option value="Frau">Frau</option>
							<option value="D">Divers</option>
						</Select>
					</Field>
					<Field label="Telefon" for="qtc-phone"><Input id="qtc-phone" type="tel" bind:value={qtNewCustPhone} placeholder="+49 …" /></Field>
					<Field label="Name" for="qtc-name"><Input id="qtc-name" bind:value={qtNewCustName} placeholder="Max Mustermann" /></Field>
					<Field label="E-Mail" for="qtc-email"><Input id="qtc-email" type="email" bind:value={qtNewCustEmail} placeholder="kunde@example.com" /></Field>
				</div>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet appointmentBody()}
	<p class="text-xs text-muted">
		Ein eigener Termin zu einer bestehenden Anfrage — z. B. eine Besichtigung vor dem Umzug. Unabhängig vom Umzugstermin.
	</p>
	<div class="flex flex-col gap-2">
		<span class="label-xs text-faint">Anfrage *</span>
		{#if qaInquiryId}
			{@render pickedBadge(qaInquiryLabel, () => {
				qaInquiryId = null;
				qaInquiryLabel = '';
			})}
		{:else}
			<Input bind:value={qaInquirySearch} oninput={(e) => searchQaInquiries((e.target as HTMLInputElement).value)} placeholder="Kunde oder Ort suchen …" />
			{#if qaInquirySearching}<span class="text-xs text-faint">Suche …</span>{/if}
			{#if qaInquiryResults.length > 0}
				<div class="flex max-h-48 flex-col overflow-y-auto rounded-md border border-line bg-panel p-1">
					{#each qaInquiryResults as inq (inq.id)}
						<button
							type="button"
							class="flex flex-col items-start rounded-sm px-2.5 py-1.5 text-left hover:bg-sunk"
							onclick={() => {
								qaInquiryId = inq.id;
								qaInquiryLabel = (inq.customer_name ?? 'Anfrage') + (inq.origin_city ? ' · ' + inq.origin_city : '');
								qaInquiryResults = [];
							}}
						>
							<span class="text-sm">{inq.customer_name ?? 'Anfrage'}</span>
							{#if inq.origin_city || inq.destination_city}<span class="text-xs text-muted">{inq.origin_city ?? '?'} → {inq.destination_city ?? '?'}</span>{/if}
						</button>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
	<div class="grid grid-cols-2 gap-3">
		<Field label="Datum *" for="qa-date"><Input id="qa-date" type="date" bind:value={quickCreateDate} /></Field>
		<Field label="Art" for="qa-kind">
			<Input id="qa-kind" list="qa-kinds" bind:value={qaKind} placeholder="besichtigung" />
			<datalist id="qa-kinds"><option value="besichtigung">Besichtigung</option><option value="nachtermin">Nachtermin</option></datalist>
		</Field>
		<Field label="Von" for="qa-start"><Input id="qa-start" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} bind:value={qaStartTime} /></Field>
		<Field label="Bis" for="qa-end"><Input id="qa-end" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} bind:value={qaEndTime} /></Field>
		<Field label="Mitarbeiter" for="qa-assignee" class="col-span-2">
			<Select id="qa-assignee" bind:value={qaAssigneeId}>
				<option value="">— keiner —</option>
				{#each qaEmployees as e (e.id)}<option value={e.id}>{e.first_name} {e.last_name}</option>{/each}
			</Select>
		</Field>
	</div>
	<Field label="Ort" for="qa-loc"><Input id="qa-loc" bind:value={qaLocation} placeholder="optional (sonst Auszugsadresse)" /></Field>
	<Field label="Notiz" for="qa-notes"><Input id="qa-notes" bind:value={qaNotes} placeholder="optional" /></Field>
{/snippet}

{#if quickCreateMode === 'inquiry'}
	{@render dialog(`Neue Anfrage — ${quickCreateDate}`, inquiryBody, submitQuickInquiry, 'Anfrage erstellen', true)}
{:else if quickCreateMode === 'termin'}
	{@render dialog(`Neuer Termin — ${quickCreateDate}`, terminBody, submitQuickTermin, 'Termin erstellen')}
{:else if quickCreateMode === 'appointment'}
	{@render dialog('Besichtigung / Zusatztermin', appointmentBody, submitQuickAppointment, 'Anlegen')}
{/if}
