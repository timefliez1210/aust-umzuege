<script lang="ts">
	import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { INQUIRY_STATUS_LABELS } from '$lib/utils/status';
	import { formatTime, normalizeTimeInput } from '$lib/utils/format';
	import { breakHoursToMinutes, breakMinutesToHours } from '$lib/utils/time';
	import { calculateBruttoCents } from '$lib/utils/pricing';
	import { X, Save, Trash2, Plus, Check, ExternalLink } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import CapacityEditor from './_components/CapacityEditor.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import EmployeeAssignmentPanel from '$lib/components/admin/EmployeeAssignmentPanel.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import KeyValue from '$lib/components/ui/KeyValue.svelte';
	import { Users, User, MapPin, Search, ArrowLeft } from 'lucide-svelte';
	import type {
		InquiryItem,
		CalendarItem,
		ScheduleCalendarItem,
		ScheduleAppointment,
		DaySchedule,
		DayEmployee,
		InquiryDay,
		TerminDay,
		PanelDay,
		PanelInquiry,
		PanelTermin,
		PanelSelection
	} from '$lib/types/calendar';

	// ─── Constants ───────────────────────────────────────────────────────────────

	const CATEGORY_LABELS: Record<string, string> = {
		intern: 'Intern',
		umzug: 'Umzug',
		entruempelung: 'Entrümpelung',
		montage: 'Montage',
		streichen: 'Streichen',
		kartons_auslieferung: 'Kartons Auslieferung',
		kartons_abholung: 'Kartons Abholung'
	};

	const INQUIRY_STATUSES = [
		'pending', 'info_requested', 'estimating', 'estimated',
		'offer_ready', 'offer_sent', 'accepted', 'rejected', 'expired',
		'cancelled', 'scheduled', 'completed', 'invoiced', 'paid'
	];

	// ─── Props ────────────────────────────────────────────────────────────────────

	/**
	 * Lifted panel selection state — shared with parent via $bindable so the parent
	 * can open the panel (set to a selection object) and the component can close it (set to null).
	 *
	 * Called by: Parent sets it on entry click; component clears it on close
	 * Purpose: Single source of truth for which panel content to show
	 */
	let {
		panelSelection = $bindable<PanelSelection>(null),
		schedule,
		onLoadSchedule,
		onAddAppointment,
		onOpenAppointment
	}: {
		panelSelection: PanelSelection;
		schedule: DaySchedule[];
		onLoadSchedule: () => Promise<void>;
		/** Opens the calendar's appointment quick-create pre-linked to this inquiry. */
		onAddAppointment?: (inquiryId: string, label: string, dateStr?: string) => void;
		/** Opens the inquiry that a day-panel appointment belongs to. */
		onOpenAppointment?: (a: ScheduleAppointment) => void;
	} = $props();

	// ─── Helper functions ─────────────────────────────────────────────────────────

	/**
	 * Formats a YYYY-MM-DD date string to German locale display.
	 *
	 * Called by: Template (day panel header date display)
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

	// ─── Panel state ──────────────────────────────────────────────────────────────

	// Inquiry panel edit state
	let inqEditStatus = $state('');
	let inqEditNotes = $state('');
	let inqEditEmployeeNotes = $state('');
	let inqEditPreferredDate = $state('');
	let inqEditStartTime = $state('');
	let inqEditEndTime = $state('');
	let savingInquiry = $state(false);
	let deletingInquiry = $state(false);
	let showDeleteInquiryDialog = $state(false);

	// Available employees — loaded once when first needed for day-level assignment
	let allEmployees = $state<{ id: string; first_name: string; last_name: string }[]>([]);
	let allEmployeesLoaded = $state(false);

	// Shared state for the "add employee to a day" popover (used for both inq and termin days)
	let addEmpDayTarget = $state<string | null>(null); // e.g. "inq-0" or "term-2"
	let addEmpId = $state('');
	let addEmpStart = $state('');
	let addEmpEnd = $state('');

	/**
	 * Compute net planned hours and mandatory break minutes from a start/end time pair.
	 *
	 * German law (ArbZG §4): shifts >6h require 30min break, >9h require 45min break.
	 * We apply the stricter 30min threshold at 8h so an 09:00-17:00 day yields 7.5h + 30m.
	 *
	 * Returns null planned_hours when inputs are missing or invalid so callers can keep the
	 * employee's existing values. break_minutes is only suggested; it never downgrades a
	 * value the user already raised above the legal minimum.
	 */
	function computeHoursAndBreak(
		start: string | null | undefined,
		end: string | null | undefined,
		currentBreak: number | null | undefined,
	): { planned_hours: number | null; break_minutes: number } {
		const parse = (t: string | null | undefined) => {
			if (!t) return null;
			const [hh, mm] = t.split(':').map(Number);
			if (isNaN(hh) || isNaN(mm)) return null;
			return hh + mm / 60;
		};
		const s = parse(start);
		const e = parse(end);
		if (s == null || e == null || e <= s) {
			return { planned_hours: null, break_minutes: currentBreak ?? 0 };
		}
		const gross = e - s;
		const legalBreak = gross > 9 ? 45 : gross > 6 ? 30 : 0;
		const breakMin = Math.max(currentBreak ?? 0, legalBreak);
		const planned = Math.max(0, gross - breakMin / 60);
		return { planned_hours: Math.round(planned * 100) / 100, break_minutes: breakMin };
	}

	// Inquiry days (multi-day editor)
	let inqDays = $state<InquiryDay[]>([]);
	let inqDaysLoading = $state(false);
	let inqDaysSaving = $state(false);
	let inqUntilDate = $state('');

	// Inquiry appointments (Besichtigung etc. — separate, non-consecutive dates)
	interface Appointment {
		id: string;
		kind: string;
		scheduled_date: string;
		start_time: string | null;
		end_time: string | null;
		assignee_id: string | null;
		assignee_name: string | null;
		location: string | null;
		notes: string | null;
		status: string;
		employees?: { employee_id: string; first_name: string; last_name: string }[];
	}
	let inqAppointments = $state<Appointment[]>([]);
	let inqApptLoading = $state(false);
	const APPT_KIND_LABELS: Record<string, string> = { besichtigung: 'Besichtigung', nachtermin: 'Nachtermin' };
	function apptKindLabel(k: string): string {
		return APPT_KIND_LABELS[k] ?? (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Termin');
	}
	function apptDateLabel(d: string): string {
		return d.slice(0, 10).split('-').reverse().join('.');
	}

	/** Loads the inquiry's linked appointments for the panel's schedule section. */
	async function loadInquiryAppointments(inqId: string) {
		inqApptLoading = true;
		try {
			inqAppointments = await apiGet<Appointment[]>(`/api/v1/inquiries/${inqId}/appointments`);
		} catch {
			inqAppointments = [];
		} finally {
			inqApptLoading = false;
		}
	}

	async function deleteInqAppointment(inqId: string, apptId: string) {
		if (!confirm('Diesen Termin löschen?')) return;
		try {
			await apiDelete(`/api/v1/inquiries/${inqId}/appointments/${apptId}`);
			showToast('Termin gelöscht', 'success');
			await loadInquiryAppointments(inqId);
			await onLoadSchedule();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Opens the shared "Zusatztermin bearbeiten" editor for an appointment picked from the
	 * inquiry panel's own list, instead of only allowing delete-and-recreate.
	 *
	 * Called by: Template (clicking an appointment row in the inquiry panel's appointment list)
	 * Purpose: Switches panelSelection to the existing appointment-edit branch (reusing its
	 *          seeding/save logic) and remembers the originating inquiry for a "back" link.
	 */
	function openInqAppointmentEdit(ap: Appointment) {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inqItem = panelSelection.item;
		apptReturnInquiry = panelSelection;
		panelSelection = {
			kind: 'appointment',
			item: {
				appointment_id: ap.id,
				inquiry_id: inqItem.inquiry_id,
				kind: ap.kind,
				customer_name: inqItem.customer_name,
				start_time: ap.start_time,
				end_time: ap.end_time,
				assignee_name: ap.assignee_name,
				location: ap.location,
				notes: ap.notes,
				status: ap.status,
				scheduled_date: ap.scheduled_date,
			},
		};
	}

	// Termin days (multi-day editor — mirrors inquiry days)
	let termDays = $state<TerminDay[]>([]);
	let termDaysLoading = $state(false);
	let termDaysSaving = $state(false);
	let termUntilDate = $state('');

	// Termin panel edit state
	let termEditTitle = $state('');
	let termEditCategory = $state('intern');
	let termEditStatus = $state('scheduled');
	let termEditDate = $state('');
	// Matches the 08:00 default used when creating a Termin (report 62702b57).
	let termEditStartTime = $state('08:00');
	let termEditEndTime = $state('');
	let termEditDuration = $state('0');
	let termEditLocation = $state('');
	let termEditDescription = $state('');
	let savingTermin = $state(false);
	let deletingTermin = $state(false);
	let showDeleteTerminDialog = $state(false);

	// Appointment (Zusatztermin) panel edit state
	// Set when the appointment editor is opened from within the inquiry panel's own
	// appointment list, so the panel can offer a way back to that inquiry.
	let apptReturnInquiry = $state<PanelInquiry | null>(null);
	let apptEditKind = $state('besichtigung');
	let apptEditStatus = $state('scheduled');
	let apptEditDate = $state('');
	let apptEditStartTime = $state('');
	let apptEditEndTime = $state('');
	let apptEditLocation = $state('');
	let apptEditDescription = $state('');
	let apptEditEmployeeNotes = $state('');
	let apptEditNotes = $state('');
	let apptDetailLoading = $state(false);

	/** Address shape as returned by the inquiry endpoint (subset we render). */
	type ApptInquiryAddress = {
		street: string;
		house_number?: string | null;
		postal_code: string;
		city: string;
		floor?: string | null;
	};
	/**
	 * Outline of the parent inquiry, shown at the bottom of the appointment panel
	 * so the Zusatztermin can be judged without opening the Auftrag.
	 */
	let apptInquiry = $state<{
		id: string;
		status: string;
		scheduled_date?: string | null;
		start_time?: string | null;
		volume_m3?: number | null;
		customer?: { name?: string | null; email?: string | null; phone?: string | null } | null;
		origin_address?: ApptInquiryAddress | null;
		destination_address?: ApptInquiryAddress | null;
		offer?: { total_brutto_cents?: number | null } | null;
		employees?: Array<{ first_name?: string | null; last_name?: string | null }>;
	} | null>(null);

	/** "Sarlinenstr. 8, 31162 Bad Salzdetfurth (2. OG)" */
	function formatApptAddress(a: ApptInquiryAddress | null | undefined): string {
		if (!a) return '—';
		const street = [a.street, a.house_number].filter(Boolean).join(' ');
		const city = [a.postal_code, a.city].filter(Boolean).join(' ');
		const base = [street, city].filter(Boolean).join(', ');
		return a.floor ? `${base} (${a.floor})` : base;
	}
	let savingAppt = $state(false);
	let deletingAppt = $state(false);
	let showDeleteApptDialog = $state(false);

	// ─── Derived ─────────────────────────────────────────────────────────────────

	/** Returns the inquiry customer name from panelSelection for the delete dialog message. */
	const pendingDeleteInquiryName = $derived(
		panelSelection?.kind === 'inquiry' ? (panelSelection.item.customer_name ?? 'diese Anfrage') : ''
	);

	/** Returns the termin title from panelSelection for the delete dialog message. */
	const pendingDeleteTerminTitle = $derived(
		panelSelection?.kind === 'termin' ? panelSelection.item.title : ''
	);

	/** Returns the appointment label from panelSelection for the delete dialog message. */
	const pendingDeleteApptTitle = $derived(
		panelSelection?.kind === 'appointment' ? apptKindLabel(panelSelection.item.kind) : ''
	);

	// ─── Selection change effect ──────────────────────────────────────────────────

	// Non-reactive guard: tracks the last seeded selection ID to avoid redundant re-seeding
	let _lastSeededId = '';

	/**
	 * Reacts to panelSelection changes by seeding edit state and loading async data.
	 *
	 * Called by: $effect (automatically whenever panelSelection reference changes)
	 * Purpose: Decouples the parent's "click to open panel" from loading/seeding logic —
	 *          the parent just sets panelSelection, this effect handles the rest.
	 */
	$effect(() => {
		const sel = panelSelection;
		const id = !sel ? ''
		         : sel.kind === 'inquiry' ? `inq:${sel.item.inquiry_id}`
		         : sel.kind === 'termin' ? `term:${sel.item.id}`
		         : sel.kind === 'appointment' ? `appt:${sel.item.appointment_id}`
		         : `day:${sel.date}`;
		if (id === _lastSeededId) return;
		_lastSeededId = id;
		if (!sel) return;
		if (sel.kind === 'inquiry') {
			inqEditStatus = sel.item.status;
			inqEditNotes = sel.item.notes ?? '';
			inqEditEmployeeNotes = sel.item.employee_notes ?? '';
			inqEditPreferredDate = sel.item.scheduled_date?.slice(0, 10) ?? '';
			inqEditStartTime = formatTime(sel.item.start_time);
			inqEditEndTime = formatTime(sel.item.end_time);
			addEmpDayTarget = null;
			loadInquiryDays(sel.item.inquiry_id);
			loadInquiryAppointments(sel.item.inquiry_id);
			ensureEmployeesLoaded();
		} else if (sel.kind === 'termin') {
			termEditTitle = sel.item.title;
			termEditCategory = sel.item.category;
			termEditStatus = sel.item.status;
			termEditDate = sel.item.scheduled_date ?? '';
			termEditStartTime = formatTime(sel.item.start_time);
			termEditEndTime = formatTime(sel.item.end_time);
			termEditDuration = String(sel.item.duration_hours);
			termEditLocation = sel.item.location ?? '';
			termEditDescription = sel.item.description ?? '';
			addEmpDayTarget = null;
			loadTerminDays(sel.item.id);
			ensureEmployeesLoaded();
		} else if (sel.kind === 'appointment') {
			// Seed immediately from the schedule chip, then load the fields the chip
			// doesn't carry (description, employee_notes) from the full record.
			apptEditKind = sel.item.kind ?? 'besichtigung';
			apptEditStatus = sel.item.status ?? 'scheduled';
			apptEditDate = sel.item.scheduled_date?.slice(0, 10) ?? '';
			apptEditStartTime = formatTime(sel.item.start_time);
			apptEditEndTime = formatTime(sel.item.end_time);
			apptEditLocation = sel.item.location ?? '';
			apptEditNotes = sel.item.notes ?? '';
			apptEditDescription = '';
			apptEditEmployeeNotes = '';
			loadAppointmentDetail(sel.item.inquiry_id, sel.item.appointment_id);
			ensureEmployeesLoaded();
		}
	});

	// ─── Close panel ─────────────────────────────────────────────────────────────

	/**
	 * Closes the side panel by clearing panelSelection.
	 *
	 * Called by: Template (× button, drag handle, backdrop), ConfirmationDialog after delete
	 * Purpose: Hides the panel and resets selection state.
	 */
	function closePanel() {
		panelSelection = null;
	}

	// ─── Employees: shared helpers ────────────────────────────────────────────────

	/**
	 * Loads all active employees once; no-ops on subsequent calls.
	 *
	 * Called by: $effect (when inquiry or termin panel opens)
	 * Purpose: Populates the per-day employee dropdown without repeated fetches.
	 */
	async function ensureEmployeesLoaded() {
		if (allEmployeesLoaded) return;
		try {
			const res = await apiGet<{ employees: { id: string; first_name: string; last_name: string; active: boolean }[] }>(
				'/api/v1/admin/employees'
			);
			const list = Array.isArray(res) ? res : (res?.employees ?? []);
			allEmployees = list.filter(e => e.active !== false);
			allEmployeesLoaded = true;
		} catch {
			// Non-fatal — dropdowns just stay empty
		}
	}

	/**
	 * Opens the "add employee" popover for a specific day slot.
	 *
	 * Called by: Template (Mitarbeiter button per day)
	 * Purpose: Toggles the inline add-employee form for the clicked day.
	 *
	 * @param target - Identifier string like "inq-0" or "term-2"
	 */
	function openAddEmp(target: string, defaultStart?: string, defaultEnd?: string) {
		addEmpDayTarget = target;
		addEmpId = '';
		addEmpStart = defaultStart ?? '';
		addEmpEnd = defaultEnd ?? '';
	}

	/**
	 * Adds the selected employee to a specific inquiry day.
	 *
	 * Called by: Template (confirm button in add-employee popover)
	 * Purpose: Appends a DayEmployee entry to inqDays[index].employees without saving yet.
	 *
	 * @param dayIndex - Index into inqDays[]
	 */
	function confirmAddInqDayEmployee(dayIndex: number) {
		if (!addEmpId) return;
		const emp = allEmployees.find(e => e.id === addEmpId);
		if (!emp) return;
		const computed = computeHoursAndBreak(addEmpStart, addEmpEnd, 0);
		inqDays[dayIndex].employees = [
			...inqDays[dayIndex].employees,
			{
				employee_id: emp.id,
				first_name: emp.first_name,
				last_name: emp.last_name,
				notes: null,
				start_time: addEmpStart || null,
				end_time: addEmpEnd || null,
				clock_in: addEmpStart || null,
				clock_out: addEmpEnd || null,
				break_minutes: computed.break_minutes,
			},
		];
		addEmpDayTarget = null;
	}

	/**
	 * Removes an employee from a specific inquiry day (local state only, not saved yet).
	 *
	 * Called by: Template (× button on employee chip)
	 * Purpose: Allows the admin to unassign an employee before saving the full day list.
	 *
	 * @param dayIndex - Index into inqDays[]
	 * @param employeeId - UUID of the employee to remove
	 */
	function removeInqDayEmployee(dayIndex: number, employeeId: string) {
		inqDays[dayIndex].employees = inqDays[dayIndex].employees.filter(
			e => e.employee_id !== employeeId
		);
	}

	/**
	 * Adds the selected employee to a specific termin day.
	 *
	 * Called by: Template (confirm button in add-employee popover for termin days)
	 * Purpose: Appends a DayEmployee entry to termDays[index].employees without saving yet.
	 *
	 * @param dayIndex - Index into termDays[]
	 */
	function confirmAddTermDayEmployee(dayIndex: number) {
		if (!addEmpId) return;
		const emp = allEmployees.find(e => e.id === addEmpId);
		if (!emp) return;
		const computed = computeHoursAndBreak(addEmpStart, addEmpEnd, 0);
		termDays[dayIndex].employees = [
			...termDays[dayIndex].employees,
			{
				employee_id: emp.id,
				first_name: emp.first_name,
				last_name: emp.last_name,
				notes: null,
				start_time: addEmpStart || null,
				end_time: addEmpEnd || null,
				clock_in: addEmpStart || null,
				clock_out: addEmpEnd || null,
				break_minutes: computed.break_minutes,
			},
		];
		addEmpDayTarget = null;
	}

	/**
	 * Removes an employee from a specific termin day (local state only, not saved yet).
	 *
	 * Called by: Template (× button on employee chip for termin days)
	 *
	 * @param dayIndex - Index into termDays[]
	 * @param employeeId - UUID of the employee to remove
	 */
	function removeTermDayEmployee(dayIndex: number, employeeId: string) {
		termDays[dayIndex].employees = termDays[dayIndex].employees.filter(
			e => e.employee_id !== employeeId
		);
	}

	// ─── Inquiry: multi-day editor ────────────────────────────────────────────────

	/**
	 * Formats a YYYY-MM-DD date string to a short German display (DD.MM.).
	 *
	 * Called by: Template (day row labels in multi-day editors)
	 * Purpose: Compact date label that fits in the narrow day list.
	 *
	 * @param d - ISO date string YYYY-MM-DD
	 */
	function formatDayDate(d: string): string {
		if (!d) return '';
		const [, m, day] = d.split('-');
		return `${day}.${m}.`;
	}

	/**
	 * Loads scheduled days for the currently selected inquiry.
	 *
	 * Called by: $effect (when panelSelection changes to kind='inquiry')
	 * Purpose: Populates inqDays (with per-day times and employees) for the multi-day editor.
	 * Uses flat GET /employees endpoint and groups by job_date.
	 *
	 * @param inqId - UUID of the inquiry
	 */
	async function loadInquiryDays(inqId: string) {
		inqDaysLoading = true;
		try {
			const flat = await apiGet<Array<DayEmployee & { job_date: string }>>(`/api/v1/inquiries/${inqId}/employees`);
			const rows = Array.isArray(flat) ? flat : [];
			// Group flat rows by date, preserving order
			const byDate = new Map<string, DayEmployee[]>();
			for (const r of rows) {
				const emp: DayEmployee = {
					employee_id:   r.employee_id,
					first_name:    r.first_name,
					last_name:     r.last_name,
					notes:         r.notes ?? null,
					start_time:    r.start_time ? r.start_time.slice(0, 5) : null,
					end_time:      r.end_time   ? r.end_time.slice(0, 5)   : null,
					clock_in:      r.clock_in   ? r.clock_in.slice(0, 5)   : null,
					clock_out:     r.clock_out  ? r.clock_out.slice(0, 5)  : null,
					break_minutes: r.break_minutes ?? 0,
				};
				const list = byDate.get(r.job_date) ?? [];
				list.push(emp);
				byDate.set(r.job_date, list);
			}
			const fillEmp = (e: DayEmployee): DayEmployee => {
				const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
				return {
					...e,
					clock_in:      e.clock_in  ?? e.start_time,
					clock_out:     e.clock_out ?? e.end_time,
					break_minutes: e.break_minutes > 0 ? e.break_minutes : computed.break_minutes,
				};
			};
			const sortedDates = Array.from(byDate.keys()).sort();
			const originStr = panelSelection?.kind === 'inquiry' ? (panelSelection.item.scheduled_date?.slice(0, 10) ?? '') : '';
			inqDays = sortedDates.map((date, i) => {
				const employees = (byDate.get(date) ?? []).map(fillEmp);
				return {
					day_date:   date,
					day_number: i + 1,
					notes:      null,
					start_time: commonEmpTime(employees, 'clock_in'),
					end_time:   commonEmpTime(employees, 'clock_out'),
					employees,
				};
			});
			inqUntilDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : (originStr ?? '');
		} catch {
			inqDays = [];
		} finally {
			inqDaysLoading = false;
		}
	}

	/**
	 * Generates/updates the inquiry day list from the inquiry's origin date to inqUntilDate.
	 *
	 * Called by: Template (oninput on the "Bis" date picker) and saveInquiryDays
	 * Purpose: Auto-generates date entries for the range; preserves times and employees
	 *          for dates that already exist in inqDays so edits are not lost on resize.
	 */
	function applyInquiryDateRange() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const originStr = panelSelection.item.scheduled_date?.slice(0, 10) ?? '';
		if (!originStr || !inqUntilDate) return;
		const origin = new Date(originStr + 'T00:00:00');
		const until  = new Date(inqUntilDate + 'T00:00:00');
		if (until < origin) return;

		const defaultStart = formatTime(panelSelection.item.start_time) || null;
		const defaultEnd   = formatTime(panelSelection.item.end_time)   || null;

		// Build a lookup of existing day data keyed by date string
		const existing = new Map(inqDays.map(d => [d.day_date, d]));
		const templateEmps = (inqDays[0]?.employees ?? []).map(e => {
			const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
			return {
				...e,
				// New days start with blank clock times — admin fills them when the day occurs.
				clock_in: null,
				clock_out: null,
				notes: null,
				break_minutes: computed.break_minutes,
			};
		});

		const fillEmp = (e: DayEmployee): DayEmployee => {
			const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
			return {
				...e,
				clock_in:      e.clock_in  ?? e.start_time,
				clock_out:     e.clock_out ?? e.end_time,
				break_minutes: e.break_minutes > 0 ? e.break_minutes : computed.break_minutes,
			};
		};

		const days: InquiryDay[] = [];
		const cur = new Date(origin);
		let num = 1;
		while (cur <= until) {
			const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
			const prev = existing.get(iso);
			days.push({
				day_date:   iso,
				day_number: num++,
				notes:      prev?.notes      ?? null,
				start_time: prev?.start_time ?? defaultStart,
				end_time:   prev?.end_time   ?? defaultEnd,
				employees:  prev ? prev.employees.map(fillEmp) : templateEmps.map(e => ({ ...e })),
			});
			cur.setDate(cur.getDate() + 1);
		}
		inqDays = days;
	}

	/**
	 * Auto-saves a single field for a multi-day employee assignment on input blur.
	 *
	 * Called by: Template (clock_in, clock_out, break_minutes onblur in multi-day rows).
	 * Purpose: PATCHes the individual per-day assignment so "Zeitraum speichern" is optional.
	 */
	async function saveMultiDayField(
		entityType: 'inquiry' | 'calendar_item',
		entityId: string,
		empId: string,
		dayDate: string,
		field: string,
		value: string | number | null
	) {
		const baseUrl = entityType === 'inquiry'
			? `/api/v1/inquiries/${entityId}/employees`
			: `/api/v1/admin/calendar-items/${entityId}/employees`;
		try {
			await apiPatch(`${baseUrl}/${empId}`, { [field]: value, day_date: dayDate });
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Returns the time shared by every employee on a day (for the day-level Start/Ende
	 * display), or null if the day is empty or the employees' times differ.
	 */
	function commonEmpTime(emps: DayEmployee[], field: 'clock_in' | 'clock_out'): string | null {
		if (emps.length === 0) return null;
		const first = emps[0][field] ?? null;
		if (first === null) return null;
		return emps.every((e) => (e[field] ?? null) === first) ? first : null;
	}

	/**
	 * Day-level Start/Ende: bulk-apply one time to every employee's Ist (clock_in or
	 * clock_out) for that day and persist each row immediately.
	 *
	 * Called by: Template (onblur on a day's Start/Ende input, inquiry + termin).
	 * Purpose: Lets Alex set the whole day's window once instead of per employee.
	 *          Individual employee edits afterwards overwrite just that row, because
	 *          every change (here and per-row) saves independently — the last write wins.
	 */
	// Snapshot of a day-level Start/Ende field when it gains focus, so a blur that
	// didn't actually change the value does NOT re-broadcast (which would clobber an
	// individual employee's manually-adjusted time, e.g. someone who came late).
	let dayBulkBefore = '';

	/** onblur for a day-level field: only bulk-apply if the value was actually edited. */
	function maybeApplyDayTime(
		entityType: 'inquiry' | 'calendar_item',
		dayIndex: number,
		field: 'clock_in' | 'clock_out',
		raw: string
	) {
		if (raw === dayBulkBefore) return;
		applyDayTime(entityType, dayIndex, field, raw);
	}

	async function applyDayTime(
		entityType: 'inquiry' | 'calendar_item',
		dayIndex: number,
		field: 'clock_in' | 'clock_out',
		raw: string
	) {
		const days = entityType === 'inquiry' ? inqDays : termDays;
		const day = days[dayIndex];
		if (!day || !panelSelection) return;
		const entityId = entityType === 'inquiry'
			? (panelSelection.kind === 'inquiry' ? panelSelection.item.inquiry_id : '')
			: (panelSelection.kind === 'termin' ? panelSelection.item.id : '');
		if (!entityId) return;

		const norm = normalizeTimeInput(raw || null);
		const display = norm ? norm.slice(0, 5) : null;
		// Reflect the normalized value back into the day-level field.
		if (field === 'clock_in') day.start_time = display;
		else day.end_time = display;

		// Push to every assigned employee on this day and save each.
		for (const emp of day.employees) {
			emp[field] = display;
			await saveMultiDayField(entityType, entityId, emp.employee_id, day.day_date, field, norm);
		}
		// Trigger reactivity for the mutated nested array.
		days[dayIndex] = day;
	}

	/**
	 * Persists the current inquiry day list via PATCH (end_date) + PUT /employees (flat array).
	 *
	 * Called by: Template (Zeitraum speichern button in inquiry panel)
	 * Purpose: Full-replace semantics — sets end_date on the inquiry then replaces all
	 *          employee assignment rows with one row per (employee, job_date).
	 */
	async function saveInquiryDays() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		if (!inqUntilDate) { showToast('Enddatum fehlt', 'error'); return; }
		// Reject retroactive expansion: if the origin is today or future, the until
		// date must also be today or future. Past-origin inquiries are still editable
		// for historical record-keeping.
		const originStr = panelSelection.item.scheduled_date?.slice(0, 10) ?? '';
		const today = new Date().toISOString().slice(0, 10);
		if (originStr >= today && inqUntilDate < today) {
			showToast('Enddatum darf nicht in der Vergangenheit liegen', 'error');
			return;
		}
		applyInquiryDateRange();
		const inqId = panelSelection.item.inquiry_id;
		inqDaysSaving = true;
		try {
			const isMultiDay = inqDays.length > 1;
			// Update end_date on the inquiry
			await apiPatch(`/api/v1/inquiries/${inqId}`, isMultiDay
				? { end_date: inqDays[inqDays.length - 1].day_date }
				: { clear_end_date: true });

			// Build flat assignment array: one entry per (employee, job_date)
			const flatAssignments = inqDays.flatMap(d =>
				d.employees.map(e => ({
					employee_id:   e.employee_id,
					job_date:      d.day_date,
					notes:         e.notes ?? null,
					clock_in:      normalizeTimeInput(e.clock_in),
					clock_out:     normalizeTimeInput(e.clock_out),
					break_minutes: parseInt(String(e.break_minutes)) || 0,
				}))
			);
			await apiPut(`/api/v1/inquiries/${inqId}/employees`, flatAssignments);
			showToast('Tage gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqDaysSaving = false;
		}
	}

	// ─── Termin: multi-day editor ─────────────────────────────────────────────────

	/**
	 * Loads scheduled days for the currently selected calendar item (Termin).
	 *
	 * Called by: $effect (when panelSelection changes to kind='termin')
	 * Purpose: Populates termDays grouped by date from the flat /employees endpoint.
	 *
	 * @param itemId - UUID of the calendar item
	 */
	async function loadTerminDays(itemId: string) {
		termDaysLoading = true;
		try {
			const flat = await apiGet<Array<DayEmployee & { job_date: string }>>(`/api/v1/admin/calendar-items/${itemId}/employees`);
			const rows = Array.isArray(flat) ? flat : [];
			const byDate = new Map<string, DayEmployee[]>();
			for (const r of rows) {
				const emp: DayEmployee = {
					employee_id:   r.employee_id,
					first_name:    r.first_name,
					last_name:     r.last_name,
					notes:         r.notes ?? null,
					start_time:    r.start_time ? r.start_time.slice(0, 5) : null,
					end_time:      r.end_time   ? r.end_time.slice(0, 5)   : null,
					clock_in:      r.clock_in   ? r.clock_in.slice(0, 5)   : null,
					clock_out:     r.clock_out  ? r.clock_out.slice(0, 5)  : null,
					break_minutes: r.break_minutes ?? 0,
				};
				const list = byDate.get(r.job_date) ?? [];
				list.push(emp);
				byDate.set(r.job_date, list);
			}
			const fillEmp = (e: DayEmployee): DayEmployee => {
				const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
				return {
					...e,
					clock_in:      e.clock_in  ?? e.start_time,
					clock_out:     e.clock_out ?? e.end_time,
					break_minutes: e.break_minutes > 0 ? e.break_minutes : computed.break_minutes,
				};
			};
			const sortedDates = Array.from(byDate.keys()).sort();
			termDays = sortedDates.map((date, i) => {
				const employees = (byDate.get(date) ?? []).map(fillEmp);
				return {
					day_date:   date,
					day_number: i + 1,
					notes:      null,
					start_time: commonEmpTime(employees, 'clock_in'),
					end_time:   commonEmpTime(employees, 'clock_out'),
					employees,
				};
			});
			termUntilDate = sortedDates.length > 1 ? sortedDates[sortedDates.length - 1] : '';
		} catch {
			termDays = [];
		} finally {
			termDaysLoading = false;
		}
	}

	/**
	 * Generates/updates the termin day list from the termin's date to termUntilDate.
	 *
	 * Called by: Template (oninput on the "Bis" date picker for termins)
	 * Purpose: Mirrors applyInquiryDateRange for calendar items.
	 */
	function applyTerminDateRange() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const originStr = panelSelection.item.scheduled_date ?? '';
		if (!originStr || !termUntilDate) return;
		const origin = new Date(originStr + 'T00:00:00');
		const until  = new Date(termUntilDate + 'T00:00:00');
		if (until < origin) return;

		const defaultStart = formatTime(panelSelection.item.start_time) || null;
		const defaultEnd   = formatTime(panelSelection.item.end_time)   || null;

		const existing = new Map(termDays.map(d => [d.day_date, d]));
		const templateEmps = (termDays[0]?.employees ?? []).map(e => {
			const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
			return {
				...e,
				clock_in: e.start_time,
				clock_out: e.end_time,
				break_minutes: computed.break_minutes,
			};
		});

		const fillEmp = (e: DayEmployee): DayEmployee => {
			const computed = computeHoursAndBreak(e.start_time, e.end_time, e.break_minutes);
			return {
				...e,
				clock_in:      e.clock_in  ?? e.start_time,
				clock_out:     e.clock_out ?? e.end_time,
				break_minutes: e.break_minutes > 0 ? e.break_minutes : computed.break_minutes,
			};
		};

		const days: TerminDay[] = [];
		const cur = new Date(origin);
		let num = 1;
		while (cur <= until) {
			const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
			const prev = existing.get(iso);
			days.push({
				day_date:   iso,
				day_number: num++,
				notes:      prev?.notes      ?? null,
				start_time: prev?.start_time ?? defaultStart,
				end_time:   prev?.end_time   ?? defaultEnd,
				employees:  prev ? prev.employees.map(fillEmp) : templateEmps.map(e => ({ ...e })),
			});
			cur.setDate(cur.getDate() + 1);
		}
		termDays = days;
	}

	/**
	 * Persists the termin day list via PUT /api/v1/admin/calendar-items/{id}/days.
	 *
	 * Called by: Template (Zeitraum speichern button in termin panel)
	 * Purpose: Full-replace semantics — sends the complete day list with per-day
	 *          times and employees, then reloads the schedule.
	 */
	async function saveTerminDays() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		if (!termUntilDate) { showToast('Enddatum fehlt', 'error'); return; }
		const originStr = panelSelection.item.scheduled_date ?? '';
		const today = new Date().toISOString().slice(0, 10);
		if (originStr >= today && termUntilDate < today) {
			showToast('Enddatum darf nicht in der Vergangenheit liegen', 'error');
			return;
		}
		applyTerminDateRange();
		const itemId = panelSelection.item.id;
		termDaysSaving = true;
		try {
			const isMultiDay = termDays.length > 1;
			// Update end_date on the calendar item
			await apiPatch(`/api/v1/admin/calendar-items/${itemId}`, isMultiDay
				? { end_date: termDays[termDays.length - 1].day_date }
				: { end_date: null });

			// Build flat assignment array
			const flatAssignments = termDays.flatMap(d =>
				d.employees.map(e => ({
					employee_id:   e.employee_id,
					job_date:      d.day_date,
					notes:         e.notes ?? null,
					clock_in:      normalizeTimeInput(e.clock_in),
					clock_out:     normalizeTimeInput(e.clock_out),
					break_minutes: parseInt(String(e.break_minutes)) || 0,
				}))
			);
			await apiPut(`/api/v1/admin/calendar-items/${itemId}/employees`, flatAssignments);
			showToast('Tage gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			termDaysSaving = false;
		}
	}

	// ─── Inquiry: save / delete ───────────────────────────────────────────────────

	/**
	 * Saves editable inquiry fields (status, dates, times) via PATCH.
	 *
	 * Called by: Template (Speichern button in inquiry panel)
	 * Purpose: PATCHes /api/v1/inquiries/{id} with updated status and dates,
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
				employee_notes: inqEditEmployeeNotes || null,
				scheduled_date: inqEditPreferredDate || null,
				start_time: normalizeTimeInput(inqEditStartTime) ?? undefined,
				end_time: normalizeTimeInput(inqEditEndTime),
			});
			showToast('Anfrage gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingInquiry = false;
		}
	}

	/**
	 * Shows the delete confirmation dialog for the selected inquiry.
	 *
	 * Called by: Template (Löschen button in inquiry panel)
	 * Purpose: Records intent and shows dialog before the destructive action.
	 */
	function deleteInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		showDeleteInquiryDialog = true;
	}

	/**
	 * Executes the inquiry deletion after dialog confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm)
	 * Purpose: DELETEs /api/v1/inquiries/{id}, closes panel and reloads calendar.
	 */
	async function confirmDeleteInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inq = panelSelection.item;
		deletingInquiry = true;
		try {
			await apiDelete(`/api/v1/inquiries/${inq.inquiry_id}`);
			showToast('Anfrage gelöscht', 'success');
			closePanel();
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingInquiry = false;
		}
	}

	// ─── Termin: save / delete ────────────────────────────────────────────────────

	/**
	 * Saves editable termin fields via PATCH.
	 *
	 * Called by: Template (Speichern button in termin panel)
	 * Purpose: PATCHes /api/v1/admin/calendar-items/{id} with updated fields,
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
				start_time: normalizeTimeInput(termEditStartTime) ?? undefined,
				end_time: normalizeTimeInput(termEditEndTime),
				duration_hours: parseFloat(termEditDuration) || 0,
				location: termEditLocation,
				description: termEditDescription,
			});
			showToast('Termin gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingTermin = false;
		}
	}

	/**
	 * Shows the delete confirmation dialog for the selected termin.
	 *
	 * Called by: Template (Löschen button in termin panel)
	 * Purpose: Shows confirmation dialog before the destructive delete.
	 */
	function deleteTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		showDeleteTerminDialog = true;
	}

	/**
	 * Executes the termin deletion after dialog confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm)
	 * Purpose: DELETEs /api/v1/admin/calendar-items/{id}, closes panel and reloads.
	 */
	async function confirmDeleteTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ci = panelSelection.item;
		deletingTermin = true;
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${ci.id}`);
			showToast('Termin gelöscht', 'success');
			closePanel();
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingTermin = false;
		}
	}

	// ─── Appointment (Zusatztermin) panel ──────────────────────────────────────

	/**
	 * Loads the full appointment record for the fields the schedule chip omits
	 * (description, employee_notes), by fetching the inquiry's appointment list
	 * and picking the matching entry.
	 *
	 * Called by: selection effect when an appointment panel opens.
	 */
	async function loadAppointmentDetail(inquiryId: string, apptId: string) {
		apptDetailLoading = true;
		apptInquiry = null;
		try {
			const list = await apiGet<Array<{
				id: string; description: string | null; employee_notes: string | null; notes: string | null;
			}>>(`/api/v1/inquiries/${inquiryId}/appointments`);
			const full = list.find((a) => a.id === apptId);
			if (full) {
				apptEditDescription = full.description ?? '';
				apptEditEmployeeNotes = full.employee_notes ?? '';
				apptEditNotes = full.notes ?? '';
			}
		} catch {
			// Non-fatal — the fields the chip already carries stay usable.
		} finally {
			apptDetailLoading = false;
		}
		// Separate try: the outline is decoration, a failure here must not hide
		// the appointment fields loaded above.
		try {
			apptInquiry = await apiGet(`/api/v1/inquiries/${inquiryId}`);
		} catch {
			apptInquiry = null;
		}
	}

	/**
	 * Saves the appointment's own fields (not crew — that autosaves in the panel).
	 *
	 * Called by: Template (Speichern button in appointment panel).
	 * Purpose: PATCHes /api/v1/inquiries/{inquiryId}/appointments/{apptId}, reloads.
	 */
	async function saveAppt() {
		if (!panelSelection || panelSelection.kind !== 'appointment') return;
		const a = panelSelection.item;
		if (!apptEditDate) { showToast('Bitte ein Datum wählen', 'error'); return; }
		savingAppt = true;
		try {
			await apiPatch(`/api/v1/inquiries/${a.inquiry_id}/appointments/${a.appointment_id}`, {
				kind: apptEditKind.trim() || 'besichtigung',
				scheduled_date: apptEditDate,
				start_time: apptEditStartTime ? normalizeTimeInput(apptEditStartTime) : null,
				end_time: apptEditEndTime ? normalizeTimeInput(apptEditEndTime) : null,
				location: apptEditLocation.trim() || null,
				description: apptEditDescription.trim() || null,
				employee_notes: apptEditEmployeeNotes.trim() || null,
				notes: apptEditNotes.trim() || null,
				status: apptEditStatus,
			});
			showToast('Zusatztermin gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingAppt = false;
		}
	}

	/** Shows the delete confirmation for the selected appointment. */
	function deleteAppt() {
		if (!panelSelection || panelSelection.kind !== 'appointment') return;
		showDeleteApptDialog = true;
	}

	/** Executes the appointment deletion after dialog confirmation. */
	async function confirmDeleteAppt() {
		if (!panelSelection || panelSelection.kind !== 'appointment') return;
		const a = panelSelection.item;
		deletingAppt = true;
		try {
			await apiDelete(`/api/v1/inquiries/${a.inquiry_id}/appointments/${a.appointment_id}`);
			showToast('Zusatztermin gelöscht', 'success');
			closePanel();
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingAppt = false;
		}
	}

	// Same colour logic as the calendar grid, for the day plan list.
	const PRE_ACCEPTED_PANEL = new Set(['pending', 'info_requested', 'estimating', 'estimated', 'offer_ready', 'offer_sent']);
	function inquiryClass(status: string): string {
		return PRE_ACCEPTED_PANEL.has(status) ? 'entry-yellow' : 'entry-green';
	}
	function terminClass(category: string): string {
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
</script>

<!-- Section inside the panel: optional micro title, content. -->
{#snippet section(title: string | null, body: import('svelte').Snippet)}
	<section class="flex flex-col gap-3 border-b border-line px-4 py-4 last:border-b-0">
		{#if title}<h3 class="label-xs text-faint">{title}</h3>{/if}
		{@render body()}
	</section>
{/snippet}

<!-- Multi-day editor rows (Anfragen and Termine share the layout). -->
{#snippet dayRows(
	kind: 'inquiry' | 'calendar_item',
	days: typeof inqDays,
	targetPrefix: string,
	entityId: string,
	onRemove: (i: number, employeeId: string) => void,
	onConfirmAdd: (i: number) => void
)}
	<div class="flex flex-col gap-2.5">
		{#each days as day, i (day.day_date)}
			<div class="flex flex-col gap-2 rounded-sm border border-line p-2.5">
				<span class="text-[13px] font-medium">Tag {day.day_number} — {formatDayDate(day.day_date)}</span>
				<div class="grid grid-cols-2 gap-2">
					<Field label="Start" for="{targetPrefix}-start-{i}">
						<Input
							id="{targetPrefix}-start-{i}"
							class="num"
							inputmode="decimal"
							placeholder="HH:MM"
							maxlength={5}
							bind:value={days[i].start_time}
							onfocus={(e) => (dayBulkBefore = (e.target as HTMLInputElement).value)}
							onblur={(e) => maybeApplyDayTime(kind, i, 'clock_in', (e.target as HTMLInputElement).value)}
						/>
					</Field>
					<Field label="Ende" for="{targetPrefix}-end-{i}">
						<Input
							id="{targetPrefix}-end-{i}"
							class="num"
							inputmode="decimal"
							placeholder="HH:MM"
							maxlength={5}
							bind:value={days[i].end_time}
							onfocus={(e) => (dayBulkBefore = (e.target as HTMLInputElement).value)}
							onblur={(e) => maybeApplyDayTime(kind, i, 'clock_out', (e.target as HTMLInputElement).value)}
						/>
					</Field>
				</div>
				{#each day.employees as emp, ei (emp.employee_id)}
					<div class="flex flex-wrap items-center gap-1.5 text-xs">
						<span class="min-w-16 font-medium">{emp.first_name} {emp.last_name[0]}.</span>
						<span class="text-faint">Ist</span>
						<input
							type="text"
							inputmode="decimal"
							placeholder="--:--"
							maxlength="5"
							aria-label="Ist von"
							class="num h-7 w-14 rounded-xs border border-line bg-transparent px-1 text-center text-[12px] outline-none hover:border-line-strong focus:border-fg"
							bind:value={days[i].employees[ei].clock_in}
							onblur={(e) => {
								const norm = normalizeTimeInput((e.target as HTMLInputElement).value || null);
								days[i].employees[ei].clock_in = norm ? norm.slice(0, 5) : null;
								saveMultiDayField(kind, entityId, emp.employee_id, days[i].day_date, 'clock_in', norm);
							}}
						/>
						<span class="text-faint">–</span>
						<input
							type="text"
							inputmode="decimal"
							placeholder="--:--"
							maxlength="5"
							aria-label="Ist bis"
							class="num h-7 w-14 rounded-xs border border-line bg-transparent px-1 text-center text-[12px] outline-none hover:border-line-strong focus:border-fg"
							bind:value={days[i].employees[ei].clock_out}
							onblur={(e) => {
								const norm = normalizeTimeInput((e.target as HTMLInputElement).value || null);
								days[i].employees[ei].clock_out = norm ? norm.slice(0, 5) : null;
								saveMultiDayField(kind, entityId, emp.employee_id, days[i].day_date, 'clock_out', norm);
							}}
						/>
						<span class="text-faint">P (h)</span>
						<input
							type="text"
							inputmode="decimal"
							placeholder="0"
							maxlength="5"
							aria-label="Pause (h)"
							class="num h-7 w-14 rounded-xs border border-line bg-transparent px-1 text-center text-[12px] outline-none hover:border-line-strong focus:border-fg w-12"
							value={breakMinutesToHours(days[i].employees[ei].break_minutes)}
							onblur={(e) => {
								const v = breakHoursToMinutes((e.target as HTMLInputElement).value);
								days[i].employees[ei].break_minutes = v;
								saveMultiDayField(kind, entityId, emp.employee_id, days[i].day_date, 'break_minutes', v);
							}}
						/>
						<Button variant="ghost" size="icon-sm" class="ml-auto hover:text-danger" aria-label="Mitarbeiter entfernen" onclick={() => onRemove(i, emp.employee_id)}><X size={13} /></Button>
					</div>
				{/each}
				{#if addEmpDayTarget === `${targetPrefix}-${i}`}
					<div class="flex flex-wrap items-center gap-1.5">
						<Select class="h-8 min-w-36 flex-1 text-[13px]" aria-label="Mitarbeiter" bind:value={addEmpId}>
							<option value="">— wählen —</option>
							{#each allEmployees.filter((e) => !day.employees.some((de) => de.employee_id === e.id)) as e (e.id)}
								<option value={e.id}>{e.first_name} {e.last_name}</option>
							{/each}
						</Select>
						<input type="text" inputmode="decimal" placeholder="Start" maxlength="5" aria-label="Start" class="num h-7 w-14 rounded-xs border border-line bg-transparent px-1 text-center text-[12px] outline-none hover:border-line-strong focus:border-fg h-8" bind:value={addEmpStart} />
						<span class="text-faint">–</span>
						<input type="text" inputmode="decimal" placeholder="Ende" maxlength="5" aria-label="Ende" class="num h-7 w-14 rounded-xs border border-line bg-transparent px-1 text-center text-[12px] outline-none hover:border-line-strong focus:border-fg h-8" bind:value={addEmpEnd} />
						<Button size="icon-sm" variant="solid" aria-label="Hinzufügen" onclick={() => onConfirmAdd(i)} disabled={!addEmpId}><Check size={13} /></Button>
						<Button size="icon-sm" variant="ghost" aria-label="Abbrechen" onclick={() => (addEmpDayTarget = null)}><X size={13} /></Button>
					</div>
				{:else}
					<Button size="xs" variant="ghost" class="self-start" onclick={() => openAddEmp(`${targetPrefix}-${i}`, day.start_time ?? '', day.end_time ?? '')}>
						<Plus size={12} /> Mitarbeiter
					</Button>
				{/if}
			</div>
		{/each}
	</div>
{/snippet}

<!-- Desktop (md+): sticky side panel that slides open. Phones: bottom sheet above the tab bar. -->
<aside
	class="fixed inset-x-0 bottom-0 z-[510] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-lg border-t border-line bg-panel shadow-2xl transition-[transform,width,opacity] duration-300 ease-out
		md:sticky md:top-4 md:z-auto md:max-h-[calc(100dvh-120px)] md:shrink-0 md:translate-y-0 md:rounded-md md:shadow-none
		{panelSelection !== null ? 'translate-y-0 md:w-[360px] md:border md:opacity-100' : 'translate-y-[105%] md:w-0 md:border-0 md:opacity-0'}"
	aria-label="Details"
>
	<button class="flex shrink-0 justify-center py-2 md:hidden" onclick={closePanel} aria-label="Schließen">
		<span class="h-1 w-10 rounded-full bg-line-strong"></span>
	</button>

	{#if panelSelection}
		<header class="flex shrink-0 items-start justify-between gap-3 border-b border-line px-4 pt-1 pb-3 md:pt-3.5">
			<div class="flex min-w-0 flex-col gap-0.5">
				{#if panelSelection.kind === 'day'}
					<h2 class="truncate text-base font-semibold">{formatDateDE(panelSelection.date)}</h2>
				{:else if panelSelection.kind === 'inquiry'}
					<h2 class="truncate text-base font-semibold">{panelSelection.item.customer_name ?? 'Anfrage'}</h2>
					{#if panelSelection.item.scheduled_date}
						<span class="num text-xs text-faint">{(panelSelection.item.scheduled_date?.slice(0, 10) ?? '').split('-').reverse().join('.')}</span>
					{/if}
				{:else if panelSelection.kind === 'appointment'}
					<h2 class="truncate text-base font-semibold">{apptKindLabel(panelSelection.item.kind)}</h2>
				{:else}
					<h2 class="truncate text-base font-semibold">{panelSelection.item.title}</h2>
				{/if}
			</div>
			<Button variant="ghost" size="icon-sm" aria-label="Schließen" title="Schließen" onclick={closePanel}><X size={16} /></Button>
		</header>

		<div class="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
			{#if panelSelection.kind === 'day'}
				{@const ds = panelSelection.schedule}
				{@const dayTermine = (ds.calendar_items ?? []).map((ci) => ({
					id: ci.calendar_item_id,
					title: ci.title,
					category: ci.category,
					location: ci.location,
					description: ci.description ?? null,
					scheduled_date: ds.date.split('T')[0],
					start_time: ci.start_time ?? '',
					end_time: ci.end_time,
					duration_hours: 0,
					status: 'scheduled' as const,
					customer_id: null as string | null,
					customer_name: ci.customer_name ?? null,
					customer_phone: ci.customer_phone ?? null
				}))}
				{@const dayAppts = ds.appointments ?? []}

				{#snippet capacity()}
					<div class="grid grid-cols-2 gap-3">
						<div class="flex flex-col gap-0.5">
							<span class="label-xs text-faint">Gebucht</span>
							<span class="num text-xl font-medium {ds.booked > ds.capacity ? 'text-danger' : ''}">{ds.booked} / {ds.capacity}</span>
						</div>
						<div class="flex flex-col gap-0.5">
							<span class="label-xs text-faint">Frei</span>
							<span class="num text-xl font-medium">{ds.remaining}</span>
						</div>
					</div>
					<CapacityEditor
						date={ds.date.split('T')[0]}
						currentCapacity={ds.capacity}
						onSaved={async () => {
							await onLoadSchedule();
							const dateStr = ds.date.split('T')[0];
							const updated = schedule.find((s) => s.date.split('T')[0] === dateStr);
							if (updated) panelSelection = { kind: 'day', date: dateStr, schedule: updated };
						}}
					/>
				{/snippet}
				{@render section(null, capacity)}

				{#snippet plan()}
					{#if ds.inquiries.length + dayTermine.length + dayAppts.length === 0}
						<p class="text-[13px] text-faint">Keine Einträge</p>
					{/if}
					{#each ds.inquiries as inq (inq.inquiry_id)}
						<div class="flex flex-col gap-1 rounded-sm px-3 py-2 {inquiryClass(inq.status)}">
							<span class="flex items-center justify-between gap-2">
								<button class="truncate text-left text-sm font-semibold hover:underline" onclick={(e) => { e.stopPropagation(); panelSelection = { kind: 'inquiry', item: inq }; }}>
									{inq.customer_name || 'Unbekannt'}
								</button>
								<StatusBadge status={inq.status} />
							</span>
							<span class="num text-xs opacity-75">{formatTime(inq.start_time)} – {formatTime(inq.end_time)}</span>
							<PhoneLink phone={inq.customer_phone} class="self-start text-xs" />
							{#if inq.departure_address || inq.arrival_address}
								<span class="text-xs opacity-80">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
							{/if}
							<a href="/admin/inquiries/{inq.inquiry_id}" class="flex items-center gap-1 self-start text-xs opacity-75 hover:underline"><ExternalLink size={11} /> Detail öffnen</a>
						</div>
					{/each}
					{#each dayTermine as ci (ci.id)}
						<div class="flex flex-col gap-1 rounded-sm px-3 py-2 {terminClass(ci.category)}">
							<span class="flex items-center justify-between gap-2">
								<button class="truncate text-left text-sm font-semibold hover:underline" onclick={(e) => { e.stopPropagation(); panelSelection = { kind: 'termin', item: ci }; }}>
									{ci.title}
								</button>
								<span class="text-xs font-medium">{CATEGORY_LABELS[ci.category] ?? ci.category}</span>
							</span>
							<span class="num text-xs opacity-75">{formatTime(ci.start_time)}{ci.end_time ? ' – ' + formatTime(ci.end_time) : ''}</span>
							{#if ci.customer_name}<span class="text-xs opacity-80">{ci.customer_name}</span>{/if}
							<PhoneLink phone={ci.customer_phone} class="self-start text-xs" />
							{#if ci.location}<span class="flex items-center gap-1 text-xs opacity-80"><MapPin size={11} />{ci.location}</span>{/if}
							<a href="/admin/calendar-items/{ci.id}" class="flex items-center gap-1 self-start text-xs opacity-75 hover:underline"><ExternalLink size={11} /> Detail öffnen</a>
						</div>
					{/each}
					{#each dayAppts as ap (ap.appointment_id)}
						<div class="entry-appt flex flex-col gap-1 rounded-sm px-3 py-2">
							<span class="flex items-center justify-between gap-2">
								<button class="truncate text-left text-sm font-semibold hover:underline" onclick={(e) => { e.stopPropagation(); onOpenAppointment?.(ap); }}>
									{apptKindLabel(ap.kind)}{ap.customer_name ? ' · ' + ap.customer_name : ''}
								</button>
							</span>
							{#if ap.start_time}<span class="num text-xs opacity-75">{formatTime(ap.start_time)}{ap.end_time ? ' – ' + formatTime(ap.end_time) : ''}</span>{/if}
							<PhoneLink phone={ap.customer_phone} class="self-start text-xs" />
							{#if ap.assignee_name || ap.location}
								<span class="flex flex-wrap items-center gap-2 text-xs opacity-80">
									{#if ap.assignee_name}<span class="flex items-center gap-1"><User size={11} />{ap.assignee_name}</span>{/if}
									{#if ap.location}<span class="flex items-center gap-1"><MapPin size={11} />{ap.location}</span>{/if}
								</span>
							{/if}
							<a href="/admin/inquiries/{ap.inquiry_id}" class="flex items-center gap-1 self-start text-xs opacity-75 hover:underline"><ExternalLink size={11} /> Zur Anfrage</a>
						</div>
					{/each}
				{/snippet}
				{@render section(`Tagesplan (${ds.inquiries.length + dayTermine.length + dayAppts.length})`, plan)}
			{:else if panelSelection.kind === 'inquiry'}
				{@const inq = panelSelection.item}

				{#snippet contact()}
					<dl class="-my-1.5">
						<KeyValue label="E-Mail">{#if inq.customer_email}<a href="mailto:{inq.customer_email}" class="hover:underline">{inq.customer_email}</a>{:else}—{/if}</KeyValue>
						<KeyValue label="Telefon">{#if inq.customer_phone}<PhoneLink phone={inq.customer_phone} icon={false} />{:else}—{/if}</KeyValue>
						{#if inq.departure_address || inq.arrival_address}
							<KeyValue label="Route">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</KeyValue>
						{/if}
						{#if inq.volume_m3}<KeyValue label="Volumen"><span class="num">{inq.volume_m3.toFixed(1)} m³</span></KeyValue>{/if}
						{#if inq.offer_price_cents}
							<KeyValue label="Angebot"><span class="num">{(calculateBruttoCents(inq.offer_price_cents) / 100).toFixed(0)} € brutto</span></KeyValue>
						{/if}
					</dl>
				{/snippet}
				{@render section(null, contact)}

				{#snippet editInquiry()}
					<Field label="Status" for="inq-status">
						<Select id="inq-status" bind:value={inqEditStatus}>
							{#each INQUIRY_STATUSES as st (st)}<option value={st}>{INQUIRY_STATUS_LABELS[st] ?? st}</option>{/each}
						</Select>
					</Field>
					<Field label="Datum" for="inq-pref-date"><Input id="inq-pref-date" type="date" bind:value={inqEditPreferredDate} /></Field>
					<div class="grid grid-cols-2 gap-2">
						<Field label="Startzeit" for="inq-start">
							<Input id="inq-start" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={inqEditStartTime} />
						</Field>
						<Field label="Endzeit" for="inq-end">
							<Input id="inq-end" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={inqEditEndTime} />
						</Field>
					</div>
					<Field label="Notizen (intern)" for="inq-notes"><Textarea id="inq-notes" rows={2} bind:value={inqEditNotes} /></Field>
					<Field label="Hinweise für Mitarbeiter" for="inq-employee-notes"><Textarea id="inq-employee-notes" rows={2} bind:value={inqEditEmployeeNotes} /></Field>
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant="solid" onclick={saveInquiry} disabled={savingInquiry}><Save size={13} /> {savingInquiry ? 'Speichern …' : 'Speichern'}</Button>
						<Button size="sm" href="/admin/inquiries/{inq.inquiry_id}"><ExternalLink size={13} /> Detail</Button>
						<Button size="sm" variant="danger" class="ml-auto" onclick={deleteInquiry} disabled={deletingInquiry}>{deletingInquiry ? '…' : 'Löschen'}</Button>
					</div>
				{/snippet}
				{@render section('Bearbeiten', editInquiry)}

				{#if inqDays.length <= 1}
					{#snippet crew()}
						<EmployeeAssignmentPanel
							entityId={inq.inquiry_id}
							entityType="inquiry"
							preferredDate={inq.scheduled_date}
							onUpdated={async () => {
								await onLoadSchedule();
								if (panelSelection?.kind === 'inquiry') loadInquiryDays(panelSelection.item.inquiry_id);
							}}
						/>
					{/snippet}
					{@render section(null, crew)}
				{/if}

				{#snippet multiDay()}
					{#if inqDaysLoading}
						<p class="text-[13px] text-faint">Laden …</p>
					{:else}
						{@const inqSel = panelSelection as PanelInquiry}
						{@const originStr = inqSel.item.scheduled_date?.slice(0, 10) ?? ''}
						<div class="grid grid-cols-2 gap-2">
							<div class="flex flex-col gap-1.5">
								<span class="text-xs font-medium text-muted">Von</span>
								<span class="num flex h-9 items-center text-sm">{originStr ? originStr.split('-').reverse().join('.') : '—'}</span>
							</div>
							<Field label="Bis" for="inq-until">
								<Input
									id="inq-until"
									type="date"
									min={originStr}
									bind:value={inqUntilDate}
									oninput={applyInquiryDateRange}
									onfocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
								/>
							</Field>
						</div>
						{#if inqDays.length > 1}
							{@render dayRows('inquiry', inqDays, 'inq', inqSel.item.inquiry_id, removeInqDayEmployee, confirmAddInqDayEmployee)}
						{/if}
						<Button size="sm" variant="solid" class="self-start" onclick={saveInquiryDays} disabled={inqDaysSaving || !inqUntilDate}>
							{inqDaysSaving ? '…' : 'Zeitraum speichern'}
						</Button>
					{/if}
				{/snippet}
				{@render section('Mehrtägiger Termin', multiDay)}

				{#snippet appts()}
					{#if inqApptLoading}
						<p class="text-[13px] text-faint">Laden …</p>
					{:else if inqAppointments.length > 0}
						{#each inqAppointments as ap (ap.id)}
							<div class="entry-appt flex items-start gap-2 rounded-sm px-3 py-2">
								<button class="flex min-w-0 flex-1 flex-col gap-0.5 text-left" title="Termin bearbeiten" onclick={() => openInqAppointmentEdit(ap)}>
									<span class="flex flex-wrap items-center gap-2 text-[13px]">
										<span class="font-semibold">{apptKindLabel(ap.kind)}</span>
										<span class="num opacity-75">{apptDateLabel(ap.scheduled_date)}</span>
										{#if ap.start_time}<span class="num opacity-75">{ap.start_time.slice(0, 5)}{ap.end_time ? '–' + ap.end_time.slice(0, 5) : ''}</span>{/if}
									</span>
									{#if (ap.employees?.length ?? 0) > 0}
										<span class="flex items-center gap-1 text-xs opacity-80"><Users size={11} />{ap.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(', ')}</span>
									{:else if ap.assignee_name}
										<span class="flex items-center gap-1 text-xs opacity-80"><User size={11} />{ap.assignee_name}</span>
									{/if}
									{#if ap.location}<span class="flex items-center gap-1 text-xs opacity-80"><MapPin size={11} />{ap.location}</span>{/if}
									{#if ap.notes}<span class="text-xs italic opacity-70">{ap.notes}</span>{/if}
								</button>
								<Button variant="ghost" size="icon-sm" aria-label="Termin löschen" title="Löschen" onclick={() => deleteInqAppointment(inq.inquiry_id, ap.id)}><X size={13} /></Button>
							</div>
						{/each}
					{:else}
						<p class="text-[13px] text-faint">Keine weiteren Termine.</p>
					{/if}
					{#if onAddAppointment}
						<Button size="sm" variant="ghost" class="self-start" onclick={() => onAddAppointment?.(inq.inquiry_id, inq.customer_name ?? 'Anfrage')}>
							<Search size={13} /> Besichtigung hinzufügen
						</Button>
					{/if}
				{/snippet}
				{@render section('Besichtigungen & Zusatztermine', appts)}
			{:else if panelSelection.kind === 'termin'}
				{@const ci = panelSelection.item}

				{#snippet editTermin()}
					<Field label="Titel" for="term-title"><Input id="term-title" bind:value={termEditTitle} /></Field>
					<div class="grid grid-cols-2 gap-2">
						<Field label="Kategorie" for="term-cat">
							<Input id="term-cat" list="cal-categories" bind:value={termEditCategory} placeholder="Intern, Umzug, eigene …" />
							<datalist id="cal-categories">
								{#each Object.entries(CATEGORY_LABELS) as [v, l] (v)}<option value={v}>{l}</option>{/each}
							</datalist>
						</Field>
						<Field label="Status" for="term-status">
							<Select id="term-status" bind:value={termEditStatus}>
								<option value="scheduled">Geplant</option>
								<option value="completed">Erledigt</option>
								<option value="cancelled">Abgesagt</option>
							</Select>
						</Field>
						<Field label="Datum" for="term-date"><Input id="term-date" type="date" bind:value={termEditDate} /></Field>
						<Field label="Dauer (h)" for="term-dur"><Input id="term-dur" class="num" type="number" step="0.5" min="0" bind:value={termEditDuration} /></Field>
						<Field label="Startzeit" for="term-start">
							<Input id="term-start" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={termEditStartTime} />
						</Field>
						<Field label="Endzeit" for="term-end">
							<Input id="term-end" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} pattern="[0-9]{2}:[0-5][0-9]" bind:value={termEditEndTime} />
						</Field>
					</div>
					<Field label="Ort" for="term-loc"><Input id="term-loc" bind:value={termEditLocation} /></Field>
					<Field label="Beschreibung" for="term-desc"><Textarea id="term-desc" rows={3} bind:value={termEditDescription} /></Field>
					{#if ci.customer_name}
						<div class="flex flex-wrap items-center gap-1.5 text-sm">
							<span class="label-xs text-faint">Kunde</span>
							{#if ci.customer_type === 'business'}<Badge>Gewerbe</Badge>{/if}
							<span class="font-medium">{ci.customer_name}</span>
							{#if ci.company_name}<span class="text-xs text-muted">({ci.company_name})</span>{/if}
							<PhoneLink phone={ci.customer_phone} class="text-[13px]" />
						</div>
					{/if}
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant="solid" onclick={saveTermin} disabled={savingTermin}><Save size={13} /> {savingTermin ? 'Speichern …' : 'Speichern'}</Button>
						<Button size="sm" href="/admin/calendar-items/{ci.id}"><ExternalLink size={13} /> Detail</Button>
						<Button size="sm" variant="danger" class="ml-auto" onclick={deleteTermin} disabled={deletingTermin}><Trash2 size={13} /> {deletingTermin ? '…' : 'Löschen'}</Button>
					</div>
				{/snippet}
				{@render section('Bearbeiten', editTermin)}

				{#if termDays.length <= 1}
					{#snippet termCrew()}
						<EmployeeAssignmentPanel entityId={ci.id} entityType="calendar_item" onUpdated={() => onLoadSchedule()} />
					{/snippet}
					{@render section(null, termCrew)}
				{/if}

				{#snippet termMultiDay()}
					{#if termDaysLoading}
						<p class="text-[13px] text-faint">Laden …</p>
					{:else}
						{@const termSel = panelSelection as PanelTermin}
						{@const originStr = termSel.item.scheduled_date ?? ''}
						<div class="grid grid-cols-2 gap-2">
							<div class="flex flex-col gap-1.5">
								<span class="text-xs font-medium text-muted">Von</span>
								<span class="num flex h-9 items-center text-sm">{originStr ? originStr.split('-').reverse().join('.') : '—'}</span>
							</div>
							<Field label="Bis" for="term-until">
								<Input
									id="term-until"
									type="date"
									min={originStr}
									bind:value={termUntilDate}
									oninput={applyTerminDateRange}
									onfocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
								/>
							</Field>
						</div>
						{#if termDays.length > 1}
							{@render dayRows('calendar_item', termDays, 'term', termSel.item.id, removeTermDayEmployee, confirmAddTermDayEmployee)}
						{/if}
						<Button size="sm" variant="solid" class="self-start" onclick={saveTerminDays} disabled={termDaysSaving || !termUntilDate}>
							{termDaysSaving ? '…' : 'Zeitraum speichern'}
						</Button>
					{/if}
				{/snippet}
				{@render section('Mehrtägiger Termin', termMultiDay)}
			{:else if panelSelection.kind === 'appointment'}
				{@const appt = panelSelection.item}

				{#snippet editAppt()}
					{#if apptReturnInquiry && apptReturnInquiry.item.inquiry_id === appt.inquiry_id}
						<Button size="xs" variant="ghost" class="self-start" onclick={() => (panelSelection = apptReturnInquiry)}><ArrowLeft size={13} /> Zurück zur Anfrage</Button>
					{/if}
					<p class="text-xs text-muted">Eigener Termin zum Auftrag (z. B. Halteverbotszone) — mit eigenem Datum, Adresse und bezahltem Team.</p>
					<div class="grid grid-cols-2 gap-2">
						<Field label="Art" for="appt-kind">
							<Input id="appt-kind" list="appt-kinds" bind:value={apptEditKind} placeholder="z. B. Halteverbot" />
							<datalist id="appt-kinds">
								<option value="besichtigung">Besichtigung</option>
								<option value="halteverbot">Halteverbot</option>
								<option value="nachtermin">Nachtermin</option>
							</datalist>
						</Field>
						<Field label="Status" for="appt-status">
							<Select id="appt-status" bind:value={apptEditStatus}>
								<option value="scheduled">Geplant</option>
								<option value="done">Erledigt</option>
								<option value="cancelled">Storniert</option>
							</Select>
						</Field>
						<Field label="Datum" for="appt-date" class="col-span-2"><Input id="appt-date" type="date" bind:value={apptEditDate} /></Field>
						<Field label="Von" for="appt-start"><Input id="appt-start" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} bind:value={apptEditStartTime} /></Field>
						<Field label="Bis" for="appt-end"><Input id="appt-end" class="num" inputmode="decimal" placeholder="HH:MM" maxlength={5} bind:value={apptEditEndTime} /></Field>
					</div>
					<Field label="Ort" for="appt-loc"><Input id="appt-loc" bind:value={apptEditLocation} placeholder="Adresse (optional, sonst Auszugsadresse)" /></Field>
					<Field label="Beschreibung" for="appt-desc"><Textarea id="appt-desc" rows={2} bind:value={apptEditDescription} placeholder="Was ist zu tun?" /></Field>
					<Field label="Notiz für Mitarbeiter" for="appt-emp-notes">
						<Textarea id="appt-emp-notes" rows={2} bind:value={apptEditEmployeeNotes} placeholder="Hinweis, den alle Zugewiesenen sehen" />
					</Field>
					<!-- Fallback only: once the outline below has loaded it names the Auftrag. -->
					{#if appt.customer_name && !apptInquiry}
						<span class="text-sm"><span class="label-xs mr-2 text-faint">Auftrag</span>{appt.customer_name}</span>
					{/if}
					<div class="flex flex-wrap gap-1.5">
						<Button size="sm" variant="solid" onclick={saveAppt} disabled={savingAppt || apptDetailLoading}><Save size={13} /> {savingAppt ? 'Speichern …' : 'Speichern'}</Button>
						<Button size="sm" href="/admin/inquiries/{appt.inquiry_id}"><ExternalLink size={13} /> Auftrag</Button>
						<Button size="sm" variant="danger" class="ml-auto" onclick={deleteAppt} disabled={deletingAppt}><Trash2 size={13} /> {deletingAppt ? '…' : 'Löschen'}</Button>
					</div>
				{/snippet}
				{@render section('Zusatztermin bearbeiten', editAppt)}

				{#snippet apptCrew()}
					<EmployeeAssignmentPanel
						entityType="appointment"
						entityId={appt.appointment_id}
						inquiryId={appt.inquiry_id}
						preferredDate={apptEditDate}
						onUpdated={() => onLoadSchedule()}
					/>
				{/snippet}
				{@render section('Bezahltes Team', apptCrew)}

				<!-- Outline of the parent Auftrag: context without leaving the editor. -->
				{#if apptInquiry}
					{#snippet outline()}
						<dl class="-my-1.5">
							<KeyValue label="Kunde">{apptInquiry?.customer?.name || appt.customer_name || '—'}</KeyValue>
							<KeyValue label="Status">{INQUIRY_STATUS_LABELS[apptInquiry!.status] ?? apptInquiry!.status}</KeyValue>
							{#if apptInquiry?.scheduled_date}
								<KeyValue label="Umzug">
									<span class="num">{new Date(apptInquiry.scheduled_date).toLocaleDateString('de-DE')}{#if apptInquiry.start_time} · {formatTime(apptInquiry.start_time)}{/if}</span>
								</KeyValue>
							{/if}
							<KeyValue label="Von">{formatApptAddress(apptInquiry!.origin_address)}</KeyValue>
							<KeyValue label="Nach">{formatApptAddress(apptInquiry!.destination_address)}</KeyValue>
							{#if apptInquiry?.volume_m3}<KeyValue label="Volumen"><span class="num">{apptInquiry.volume_m3.toFixed(1)} m³</span></KeyValue>{/if}
							{#if apptInquiry?.offer?.total_brutto_cents}
								<KeyValue label="Angebot"><span class="num">{(apptInquiry.offer.total_brutto_cents / 100).toFixed(0)} € brutto</span></KeyValue>
							{/if}
							{#if apptInquiry?.employees && apptInquiry.employees.length > 0}
								<KeyValue label="Team">
									{apptInquiry.employees.map((e) => [e.first_name, e.last_name].filter(Boolean).join(' ')).filter(Boolean).join(', ')}
								</KeyValue>
							{/if}
							{#if apptInquiry?.customer?.phone || apptInquiry?.customer?.email}
								<KeyValue label="Kontakt">
									{#if apptInquiry.customer.phone}
										<PhoneLink phone={apptInquiry.customer.phone} icon={false} />
									{:else}
										<a href="mailto:{apptInquiry.customer.email}" class="hover:underline">{apptInquiry.customer.email}</a>
									{/if}
								</KeyValue>
							{/if}
						</dl>
					{/snippet}
					{@render section('Zugehöriger Auftrag', outline)}
				{/if}
			{/if}
		</div>
	{:else}
		<p class="hidden px-4 py-10 text-center text-sm text-faint md:block">Klicke auf einen Eintrag</p>
	{/if}
</aside>

<ConfirmationDialog
	bind:open={showDeleteInquiryDialog}
	title="Anfrage löschen"
	message={`Anfrage von „${pendingDeleteInquiryName}“ löschen?`}
	confirmLabel="Löschen"
	loading={deletingInquiry}
	onConfirm={confirmDeleteInquiry}
/>

<ConfirmationDialog
	bind:open={showDeleteTerminDialog}
	title="Termin löschen"
	message={`Termin „${pendingDeleteTerminTitle}“ löschen?`}
	confirmLabel="Löschen"
	loading={deletingTermin}
	onConfirm={confirmDeleteTermin}
/>

<ConfirmationDialog
	bind:open={showDeleteApptDialog}
	title="Zusatztermin löschen"
	message={`„${pendingDeleteApptTitle}“ löschen?`}
	confirmLabel="Löschen"
	loading={deletingAppt}
	onConfirm={confirmDeleteAppt}
/>
