<script lang="ts">
	import { untrack } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, apiFetch, apiDownload, formatDate } from '$lib/utils/api.svelte';
	import { normalizeTimeInput } from '$lib/utils/format';
	import { breakHoursToMinutes, breakMinutesToHours } from '$lib/utils/time';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, RotateCw } from 'lucide-svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';

	interface Assignment {
		inquiry_id: string;
		customer_name: string | null;
		customer_phone?: string | null;
		origin_city: string | null;
		destination_city: string | null;
		booking_date: string | null;
		actual_hours: number | null;
		worked_hours: number | null;
		paid_hours: number | null;
		deactivated: boolean;
		paid_clock_in: string | null;
		paid_clock_out: string | null;
		paid_break_minutes: number | null;
		clock_in: string | null;
		clock_out: string | null;
		break_minutes: number;
		start_time: string | null;
		end_time: string | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_break_minutes: number | null;
		notes: string | null;
		status: string;
	}

	interface CalendarItemAssignment {
		calendar_item_id: string;
		title: string;
		customer_name?: string | null;
		customer_phone?: string | null;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		actual_hours: number | null;
		worked_hours: number | null;
		paid_hours: number | null;
		deactivated: boolean;
		paid_clock_in: string | null;
		paid_clock_out: string | null;
		paid_break_minutes: number | null;
		clock_in: string | null;
		clock_out: string | null;
		break_minutes: number;
		start_time: string | null;
		end_time: string | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_break_minutes: number | null;
		status: string;
	}

	/** A paid Zusatztermin (Halteverbotszone etc.) assignment for this employee. */
	interface AppointmentAssignment {
		appointment_id: string;
		inquiry_id: string | null;
		kind: string;
		customer_name: string | null;
		customer_phone?: string | null;
		location: string | null;
		scheduled_date: string | null;
		actual_hours: number | null;
		worked_hours: number | null;
		paid_hours: number | null;
		clock_in: string | null;
		clock_out: string | null;
		break_minutes: number;
		start_time: string | null;
		end_time: string | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_break_minutes: number | null;
		status: string;
	}

	interface TimeDraft {
		clock_in: string;
		clock_out: string;
		break_minutes: number;
		saving: boolean;
		/** Edited locally and not yet confirmed by the server — survives reloads. */
		dirty?: boolean;
		/** Last save attempt failed (bad connection); row is highlighted with a retry. */
		failed?: boolean;
		/** Blurred again while a save was in flight — save once more with the latest values. */
		resave?: boolean;
	}

	interface HoursSummary {
		from: string;
		to: string;
		target_hours: number;
		actual_hours: number;
		worked_total: number;
		paid_total: number;
		hour_account: number;
		all_days_confirmed: boolean;
		assignment_count: number;
		assignments: Assignment[];
		calendar_items: CalendarItemAssignment[];
		appointments: AppointmentAssignment[];
	}

	/** Per-day payroll override draft, edited live in payroll edit mode. */
	interface PayrollDraft {
		deactivated: boolean;
		clock_in: string;
		clock_out: string;
		break_minutes: number;
		/** Recorded worked hours for this day; the fallback when no paid override is set. */
		worked: number;
	}

	let { employeeId, lastName, firstName }: { employeeId: string; lastName: string; firstName: string } =
		$props();

	let hoursSummary = $state<HoursSummary | null>(null);
	let timeDrafts = $state<Record<string, TimeDraft>>({});
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	// Each load gets a number; only the newest one may write state, so a slow
	// response for an older month can't overwrite the month now on screen.
	let loadSeq = 0;
	// URL of the data currently shown — on a failed load we only keep it on
	// screen when it is still the data that was asked for.
	let loadedUrl: string | null = null;

	// --- Payroll edit mode (Stundenkonto) ---
	// When active, Von/Bis/Pause edit the PAID times (not the recorded worked
	// times) and a per-day deactivate toggle appears. Nothing is persisted until
	// "Speichern & Beenden"; totals recompute live from these drafts.
	let payrollEditMode = $state(false);
	let payrollDrafts = $state<Record<string, PayrollDraft>>({});
	let savingPayroll = $state(false);
	let showCleanupDialog = $state(false);
	let cleaningUp = $state(false);

	// Hours view mode: '7d' shows rolling 7-day window from today; 'month' shows calendar month
	let viewMode = $state<'7d' | 'month'>('7d');
	const initialMonth = new Date().toISOString().slice(0, 7);
	let selectedMonth = $state(initialMonth);
	// Last month that was actually loaded — restored when a switch is cancelled.
	let currentMonth = initialMonth;

	const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

	const failedKeys = $derived(Object.keys(timeDrafts).filter((k) => timeDrafts[k].failed));
	const anySaving = $derived(Object.values(timeDrafts).some((d) => d.saving));

	let exportingXlsx = $state(false);
	let exportingPdf = $state(false);

	function fmtTimestamp(ts: string | null): string {
		if (!ts) return '—';
		const d = new Date(ts);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	/**
	 * Returns today and today+6 as ISO date strings.
	 *
	 * Called by: loadHours (7-day mode)
	 * Purpose: Computes the rolling 7-day window anchored to the current date.
	 *
	 * @returns { from, to } — YYYY-MM-DD strings
	 */
	function getWeekRange(): { from: string; to: string } {
		const today = new Date();
		const from = today.toISOString().slice(0, 10);
		const to = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		return { from, to };
	}

	// Only the employee id may trigger a reload here. loadHours reads viewMode and
	// selectedMonth too; tracking those fired a request on every keystroke in the
	// month field (Safari shows it as plain text), including invalid "2026-0".
	$effect(() => {
		if (employeeId) untrack(() => loadHours(employeeId));
	});

	// Back online → retry the rows that failed to save.
	$effect(() => {
		const onOnline = () => {
			if (failedKeys.length) retryFailed();
		};
		window.addEventListener('online', onOnline);
		return () => window.removeEventListener('online', onOnline);
	});

	// Warn before closing/reloading the tab while times are unsaved.
	$effect(() => {
		if (!failedKeys.length && !anySaving) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	});

	beforeNavigate(({ cancel, willUnload }) => {
		if (willUnload) return; // handled by beforeunload
		if (!confirmDiscardUnsaved()) cancel();
	});

	/**
	 * Asks before an action that would drop times whose save failed.
	 * (Saves still in flight finish on their own, so they don't need a prompt.)
	 *
	 * @returns true when nothing is lost or the user accepts the loss
	 */
	function confirmDiscardUnsaved(): boolean {
		const n = failedKeys.length;
		if (n === 0) return true;
		return confirm(
			`${n === 1 ? '1 Zeit wurde' : `${n} Zeiten wurden`} wegen der Verbindung nicht gespeichert und ${n === 1 ? 'geht' : 'gehen'} verloren. Trotzdem fortfahren?`
		);
	}

	/**
	 * Loads hours summary for the active view mode (7-day or month).
	 *
	 * Called by: $effect on mount, view mode toggle, month picker change, after saves
	 * Purpose: Fetches hours aggregation for either the rolling 7-day window or a calendar month.
	 * On a bad connection the error is shown inline with a retry button; drafts the
	 * user changed but the server hasn't confirmed yet are kept across the reload.
	 *
	 * @returns true when fresh data was applied
	 */
	async function loadHours(id: string): Promise<boolean> {
		if (viewMode === 'month' && !MONTH_RE.test(selectedMonth)) return false;
		let url: string;
		if (viewMode === '7d') {
			const { from, to } = getWeekRange();
			url = `/api/v1/admin/employees/${id}/hours?from=${from}&to=${to}`;
		} else {
			url = `/api/v1/admin/employees/${id}/hours?month=${selectedMonth}`;
		}
		const seq = ++loadSeq;
		loading = true;
		try {
			const summary = await apiGet<HoursSummary>(url);
			if (seq !== loadSeq) return false;
			hoursSummary = summary;
			loadedUrl = url;
			loadError = null;

			// Initialise inline-edit drafts from server values
			// Pre-fill Von/Bis from the planned start/end so admins only edit when reality differs.
			// Key includes booking_date / scheduled_date so multi-day rows don't overwrite each other.
			const drafts: Record<string, TimeDraft> = {};
			const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');
			for (const a of hoursSummary.assignments ?? []) {
				drafts[`inq:${a.inquiry_id}:${a.booking_date ?? ''}`] = {
					clock_in: hhmm(a.clock_in ?? a.start_time),
					clock_out: hhmm(a.clock_out ?? a.end_time),
					break_minutes: a.break_minutes ?? 0,
					saving: false
				};
			}
			for (const ci of hoursSummary.calendar_items ?? []) {
				drafts[`ci:${ci.calendar_item_id}:${ci.scheduled_date ?? ''}`] = {
					clock_in: hhmm(ci.clock_in ?? ci.start_time),
					clock_out: hhmm(ci.clock_out ?? ci.end_time),
					break_minutes: ci.break_minutes ?? 0,
					saving: false
				};
			}
			// Appointment keys carry the owning inquiry id (needed for the crew PATCH URL).
			for (const ap of hoursSummary.appointments ?? []) {
				drafts[`appt:${ap.inquiry_id ?? ''}:${ap.appointment_id}`] = {
					clock_in: hhmm(ap.clock_in ?? ap.start_time),
					clock_out: hhmm(ap.clock_out ?? ap.end_time),
					break_minutes: ap.break_minutes ?? 0,
					saving: false
				};
			}
			// Keep rows that are being typed in, saving, or failed to save.
			for (const [k, d] of Object.entries(timeDrafts)) {
				if (k in drafts && (d.dirty || d.saving || d.failed)) drafts[k] = d;
			}
			timeDrafts = drafts;
			return true;
		} catch (e: unknown) {
			if (seq !== loadSeq) return false;
			loadError = e instanceof Error ? e.message : 'Stunden konnten nicht geladen werden.';
			if (loadedUrl !== url) {
				// Don't show last month's numbers under this month's label.
				hoursSummary = null;
				loadedUrl = null;
				timeDrafts = {};
			}
			return false;
		} finally {
			if (seq === loadSeq) loading = false;
		}
	}

	/** Converts loose time input ("7", "7:30", "07:30") to "HH:MM:SS" for the API, or null if empty. */
	function toTimeStr(val: string): string | null {
		return normalizeTimeInput(val);
	}

	/** PATCHes one row's current draft values to the matching crew endpoint. */
	async function patchTime(key: string, draft: TimeDraft) {
		const [type, id, third] = key.split(':');
		const payload: Record<string, unknown> = {
			clock_in: toTimeStr(draft.clock_in),
			clock_out: toTimeStr(draft.clock_out),
			break_minutes: draft.break_minutes
		};
		if (type === 'appt') {
			// key = appt:{inquiry_id}:{appointment_id} — single day, no day_date.
			await apiPatch(`/api/v1/inquiries/${id}/appointments/${third}/employees/${employeeId}`, payload);
		} else if (type === 'inq') {
			if (third) payload.day_date = third;
			await apiPatch(`/api/v1/inquiries/${id}/employees/${employeeId}`, payload);
		} else {
			if (third) payload.day_date = third;
			await apiPatch(`/api/v1/admin/calendar-items/${id}/employees/${employeeId}`, payload);
		}
	}

	/**
	 * Saves clock_in / clock_out / break_minutes for one assignment row via PATCH.
	 *
	 * Called by: onblur on any time/break input in the assignments table, the
	 *            per-row retry button, retryFailed().
	 * Purpose: Persists per-day time tracking without a dedicated save button.
	 * Robust against a slow connection: a blur during an in-flight save queues one
	 * more save with the latest values (instead of being dropped), and a failed
	 * save keeps the typed values, marks the row and offers a retry.
	 *
	 * @param key - "inq:{inquiry_id}:{date}", "ci:{calendar_item_id}:{date}" or "appt:{inquiry_id}:{appointment_id}"
	 */
	async function saveTime(key: string) {
		const draft = timeDrafts[key];
		if (!draft) return;
		if (draft.saving) {
			draft.resave = true;
			return;
		}
		draft.saving = true;
		try {
			do {
				draft.resave = false;
				await patchTime(key, draft);
			} while (draft.resave);
			draft.dirty = false;
			draft.failed = false;
			draft.saving = false;
			// Reload to refresh the computed actual_hours column
			await loadHours(employeeId);
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			draft.failed = true;
			draft.saving = false;
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error', {
				action: { label: 'Erneut versuchen', onClick: () => saveTime(key) }
			});
		}
	}

	/** Re-sends every row whose save failed. Called by the banner button and on reconnect. */
	async function retryFailed() {
		for (const key of failedKeys) await saveTime(key);
	}

	/** Moves the month picker by ±1 month and loads it. */
	function shiftMonth(delta: number) {
		const base = MONTH_RE.test(selectedMonth) ? selectedMonth : currentMonth;
		const [y, m] = base.split('-').map(Number);
		const d = new Date(y, m - 1 + delta, 1);
		selectedMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		onHoursMonthChange();
	}

	/**
	 * Handles month picker change in hours card.
	 *
	 * Called by: Template (month input onchange, ‹/› buttons)
	 * Purpose: Reloads hours summary for the new month — only once the value is a
	 * complete YYYY-MM, and only after confirming if unsaved times would be lost.
	 */
	function onHoursMonthChange() {
		if (!MONTH_RE.test(selectedMonth) || selectedMonth === currentMonth) return;
		if (!confirmDiscardUnsaved()) {
			selectedMonth = currentMonth;
			return;
		}
		currentMonth = selectedMonth;
		cancelPayrollEdit();
		loadHours(employeeId);
	}

	/**
	 * Switches between 7-day and month view modes and reloads hours.
	 *
	 * Called by: Template (view mode toggle buttons)
	 * Purpose: Lets admin switch between rolling 7-day window and calendar month view.
	 *
	 * @param mode - '7d' for rolling week view, 'month' for calendar month view
	 */
	function setViewMode(mode: '7d' | 'month') {
		if (mode === viewMode || !confirmDiscardUnsaved()) return;
		viewMode = mode;
		cancelPayrollEdit();
		loadHours(employeeId);
	}

	/** Loose "HH:MM" → fractional hours, or null if incomplete. */
	function timeToHours(t: string): number | null {
		const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
		if (!m) return null;
		return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
	}

	/** Paid hours for one payroll draft: 0 if deactivated, derived from paid times, else worked. */
	function paidHoursForDraft(d: PayrollDraft): number {
		if (d.deactivated) return 0;
		const ci = timeToHours(d.clock_in);
		const co = timeToHours(d.clock_out);
		if (ci != null && co != null) {
			return Math.max(0, co - ci - (d.break_minutes || 0) / 60);
		}
		return d.worked;
	}

	// Live totals while editing: worked stays fixed, paid + account react to drafts.
	const liveWorked = $derived(Object.values(payrollDrafts).reduce((s, d) => s + d.worked, 0));
	const livePaid = $derived(
		Object.values(payrollDrafts).reduce((s, d) => s + paidHoursForDraft(d), 0)
	);
	const liveAccount = $derived(liveWorked - livePaid);

	/**
	 * Enters payroll edit mode, seeding drafts from the current month's rows.
	 *
	 * Called by: Template ("Bearbeiten" button, month view, all days confirmed).
	 * Purpose: Prefills paid Von/Bis/Pause from any saved override, else the
	 * recorded clock times, so Alex only changes what differs.
	 */
	function enterPayrollEdit() {
		if (!hoursSummary || blockedByPendingSaves()) return;
		const drafts: Record<string, PayrollDraft> = {};
		const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '');
		for (const a of hoursSummary.assignments ?? []) {
			drafts[`inq:${a.inquiry_id}:${a.booking_date ?? ''}`] = {
				deactivated: a.deactivated,
				clock_in: hhmm(a.paid_clock_in ?? a.clock_in),
				clock_out: hhmm(a.paid_clock_out ?? a.clock_out),
				break_minutes: a.paid_break_minutes ?? a.break_minutes ?? 0,
				worked: a.worked_hours ?? 0
			};
		}
		for (const ci of hoursSummary.calendar_items ?? []) {
			drafts[`ci:${ci.calendar_item_id}:${ci.scheduled_date ?? ''}`] = {
				deactivated: ci.deactivated,
				clock_in: hhmm(ci.paid_clock_in ?? ci.clock_in),
				clock_out: hhmm(ci.paid_clock_out ?? ci.clock_out),
				break_minutes: ci.paid_break_minutes ?? ci.break_minutes ?? 0,
				worked: ci.worked_hours ?? 0
			};
		}
		payrollDrafts = drafts;
		payrollEditMode = true;
	}

	/** Discards payroll drafts and leaves edit mode without saving. */
	function cancelPayrollEdit() {
		payrollEditMode = false;
		payrollDrafts = {};
	}

	/**
	 * Persists payroll overrides for the month, then reloads and exits edit mode.
	 *
	 * Called by: Template ("Speichern & Beenden").
	 * Purpose: Saves deactivations + paid-time adjustments via the adjustments
	 * endpoint. The recorded worked hours are never touched.
	 */
	async function savePayroll() {
		if (savingPayroll) return;
		savingPayroll = true;
		try {
			const body = Object.entries(payrollDrafts).map(([key, d]) => {
				const [type, id, jobDate] = key.split(':');
				const ci = toTimeStr(d.clock_in);
				const co = toTimeStr(d.clock_out);
				return {
					entry_type: type === 'inq' ? 'inquiry' : 'calendar_item',
					inquiry_id: type === 'inq' ? id : null,
					calendar_item_id: type === 'ci' ? id : null,
					job_date: jobDate,
					deactivated: d.deactivated,
					paid_clock_in: ci,
					paid_clock_out: co,
					paid_break_minutes: d.break_minutes
				};
			});
			await apiFetch(`/api/v1/admin/employees/${employeeId}/hours/adjustments?month=${selectedMonth}`, {
				method: 'PUT',
				body
			});
			payrollEditMode = false;
			payrollDrafts = {};
			await loadHours(employeeId);
			showToast('Stunden gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingPayroll = false;
		}
	}

	// True when the month has any saved override (deactivated day or paid-time
	// adjustment) — i.e. there is something to "säubern".
	const hasAdjustments = $derived(
		!!hoursSummary &&
			[...(hoursSummary.assignments ?? []), ...(hoursSummary.calendar_items ?? [])].some(
				(r) => r.deactivated || r.paid_clock_in != null || r.paid_clock_out != null
			)
	);

	/**
	 * Destructive "Stundenkonto säubern": finalize the month's overrides.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: Permanently bakes the sorted-out month into the recorded data —
	 * deactivated days remove the employee's assignment, adjusted days overwrite
	 * the recorded clock times — then discards the override layer. Irreversible.
	 */
	async function cleanupStundenkonto() {
		if (cleaningUp) return;
		cleaningUp = true;
		try {
			await apiPost(`/api/v1/admin/employees/${employeeId}/hours/cleanup?month=${selectedMonth}`);
			showCleanupDialog = false;
			await loadHours(employeeId);
			showToast('Stundenkonto gesäubert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Säubern', 'error');
		} finally {
			cleaningUp = false;
		}
	}

	/**
	 * Stops exports / payroll editing while times are still saving or failed to
	 * save — otherwise the Stundenzettel would silently miss them.
	 *
	 * @returns true (and shows a toast) when the action must wait
	 */
	function blockedByPendingSaves(): boolean {
		if (anySaving) {
			showToast('Zeiten werden noch gespeichert – bitte kurz warten.', 'info');
			return true;
		}
		if (failedKeys.length) {
			showToast('Erst die rot markierten Zeiten speichern (Verbindung prüfen).', 'error', {
				action: { label: 'Erneut speichern', onClick: retryFailed }
			});
			return true;
		}
		return false;
	}

	/**
	 * Downloads the employee's Stundenzettel as an XLSX file for the selected month.
	 *
	 * Called by: Template (export button, month view only)
	 * Purpose: Generates the monthly timesheet document Alex uses for payroll.
	 */
	async function exportStundenzettel() {
		if (blockedByPendingSaves()) return;
		exportingXlsx = true;
		try {
			const filename = `Stundenzettel_${lastName}_${firstName}_${selectedMonth}.xlsx`;
			await apiDownload(
				`/api/v1/admin/employees/${employeeId}/hours/export?month=${selectedMonth}`,
				filename
			);
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Export fehlgeschlagen', 'error');
		} finally {
			exportingXlsx = false;
		}
	}

	async function exportStundenzettelPdf() {
		if (blockedByPendingSaves()) return;
		exportingPdf = true;
		try {
			const filename = `Stundenzettel_${lastName}_${firstName}_${selectedMonth}.pdf`;
			await apiDownload(
				`/api/v1/admin/employees/${employeeId}/hours/export?month=${selectedMonth}&format=pdf`,
				filename
			);
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'PDF-Export fehlgeschlagen', 'error');
		} finally {
			exportingPdf = false;
		}
	}

	/**
	 * Calculates progress bar width percentage.
	 *
	 * Called by: Template (progress bar)
	 * Purpose: Visual representation of target vs planned/actual.
	 *
	 * Math: width = min(100, (value / target) * 100)
	 */
	function progressPct(value: number, target: number): number {
		if (target <= 0) return 0;
		return Math.min(100, (value / target) * 100);
	}
</script>

<!-- Von / Bis / Pause cells, shared by Umzüge, Termine and Zusatztermine. In payroll-edit
     mode they edit the payroll override (pdraft); otherwise the recorded times (draft). -->
{#snippet timeCells(key: string, draft: TimeDraft | undefined, pdraft: PayrollDraft | undefined, payrollAllowed: boolean)}
	{#each ['clock_in', 'clock_out'] as const as f (f)}
		<td class="px-1.5 py-1.5" onclick={(e) => e.stopPropagation()}>
			{#if payrollEditMode}
				{#if payrollAllowed && pdraft}
					<input
						type="text"
						inputmode="numeric"
						pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
						placeholder="HH:MM"
						maxlength="5"
						aria-label={f === 'clock_in' ? 'Von' : 'Bis'}
						class="num h-7 w-16 rounded-xs border border-line bg-transparent px-1.5 text-center text-[13px] outline-none hover:border-line-strong focus:border-fg disabled:opacity-40"
						disabled={pdraft.deactivated}
						bind:value={pdraft[f]}
					/>
				{/if}
			{:else if draft}
				<input
					type="text"
					inputmode="numeric"
					pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
					placeholder="HH:MM"
					maxlength="5"
					aria-label={f === 'clock_in' ? 'Von' : 'Bis'}
					class="num h-7 w-16 rounded-xs border bg-transparent px-1.5 text-center text-[13px] outline-none hover:border-line-strong focus:border-fg disabled:opacity-40 {draft.failed ? 'border-danger text-danger' : 'border-line'} {draft.saving ? 'opacity-50' : ''}"
					title={draft.failed ? 'Nicht gespeichert – Verbindung prüfen' : undefined}
					bind:value={draft[f]}
					oninput={() => (draft.dirty = true)}
					onblur={() => saveTime(key)}
				/>
			{/if}
		</td>
	{/each}
	<td class="px-1.5 py-1.5" onclick={(e) => e.stopPropagation()}>
		{#if payrollEditMode}
			{#if payrollAllowed && pdraft}
				<input
					type="text"
					inputmode="decimal"
					placeholder="0"
					maxlength="5"
					aria-label="Pause (h)"
					class="num h-7 w-16 rounded-xs border border-line bg-transparent px-1.5 text-center text-[13px] outline-none hover:border-line-strong focus:border-fg disabled:opacity-40"
					disabled={pdraft.deactivated}
					value={breakMinutesToHours(pdraft.break_minutes)}
					onblur={(e) => {
						pdraft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value);
					}}
				/>
			{/if}
		{:else if draft}
			<div class="flex items-center gap-1">
				<input
					type="text"
					inputmode="decimal"
					placeholder="0"
					maxlength="5"
					aria-label="Pause (h)"
					class="num h-7 w-16 rounded-xs border bg-transparent px-1.5 text-center text-[13px] outline-none hover:border-line-strong focus:border-fg disabled:opacity-40 {draft.failed ? 'border-danger text-danger' : 'border-line'} {draft.saving ? 'opacity-50' : ''}"
					value={breakMinutesToHours(draft.break_minutes)}
					oninput={() => (draft.dirty = true)}
					onblur={(e) => {
						draft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value);
						saveTime(key);
					}}
				/>
				{#if draft.failed && !draft.saving}
					<button
						type="button"
						class="grid size-7 place-items-center rounded-xs text-danger hover:bg-sunk"
						title="Nicht gespeichert – erneut versuchen"
						aria-label="Erneut speichern"
						onclick={() => saveTime(key)}
					>
						<RotateCw size={14} />
					</button>
				{/if}
			</div>
		{/if}
	</td>
{/snippet}

{#snippet employeeTimes(clockIn: string | null, clockOut: string | null, breakMin: number | null)}
	<td class="num px-1.5 py-1.5 text-xs text-faint">{clockIn ? fmtTimestamp(clockIn) : '—'}</td>
	<td class="num px-1.5 py-1.5 text-xs text-faint">{clockOut ? fmtTimestamp(clockOut) : '—'}</td>
	<td class="num px-1.5 py-1.5 text-xs text-faint">{breakMin != null ? `${breakMinutesToHours(breakMin) || '0'} h` : '—'}</td>
{/snippet}

{#snippet activeToggle(pdraft: PayrollDraft | undefined)}
	{#if payrollEditMode}
		<td class="px-3 py-1.5" onclick={(e) => e.stopPropagation()}>
			{#if pdraft}
				<input
					type="checkbox"
					class="size-4 accent-[var(--accent)]"
					checked={!pdraft.deactivated}
					onchange={(e) => (pdraft.deactivated = !e.currentTarget.checked)}
					title="Tag in Abrechnung aktiv"
					aria-label="Tag in Abrechnung aktiv"
				/>
			{/if}
		</td>
	{/if}
{/snippet}

<div class="flex min-w-0 flex-col gap-3.5">
	<Panel title="Stunden">
		{#snippet actions()}
			<Segmented
				size="sm"
				label="Zeitraum"
				options={[
					{ value: '7d', label: '7 Tage' },
					{ value: 'month', label: 'Monat' }
				]}
				value={viewMode}
				onchange={(v) => setViewMode(v)}
			/>
		{/snippet}

		{#if viewMode === 'month'}
			<div class="mb-4 flex flex-wrap items-center gap-2">
				<div class="flex items-center gap-1">
					<Button size="icon-sm" variant="ghost" onclick={() => shiftMonth(-1)} title="Vormonat" aria-label="Vormonat">
						<ChevronLeft size={14} />
					</Button>
					<input
						type="month"
						aria-label="Monat"
						placeholder="JJJJ-MM"
						bind:value={selectedMonth}
						onchange={onHoursMonthChange}
						class="h-8 w-36 rounded-sm border border-line-strong bg-panel px-2 text-[13px] outline-none focus:border-fg"
					/>
					<Button size="icon-sm" variant="ghost" onclick={() => shiftMonth(1)} title="Nächster Monat" aria-label="Nächster Monat">
						<ChevronRight size={14} />
					</Button>
				</div>
				{#if payrollEditMode}
					<Button size="sm" variant="solid" onclick={savePayroll} disabled={savingPayroll} title="Anpassungen speichern und Bearbeitungsmodus verlassen">
						{savingPayroll ? 'Speichern …' : 'Speichern & beenden'}
					</Button>
					<Button size="sm" variant="ghost" onclick={cancelPayrollEdit} disabled={savingPayroll}>Abbrechen</Button>
				{:else}
					<Button
						size="sm"
						onclick={enterPayrollEdit}
						disabled={!hoursSummary?.all_days_confirmed}
						title={hoursSummary?.all_days_confirmed ? 'Stunden für die Abrechnung bearbeiten' : 'Erst möglich, wenn alle Tage Von/Bis-Zeiten haben'}
					>
						Für Abrechnung bearbeiten
					</Button>
					<Button size="icon-sm" onclick={exportStundenzettel} disabled={exportingXlsx} title="Stundenzettel als XLSX herunterladen" aria-label="Stundenzettel XLSX">
						{#if exportingXlsx}…{:else}<FileSpreadsheet size={14} />{/if}
					</Button>
					<Button size="icon-sm" onclick={exportStundenzettelPdf} disabled={exportingPdf} title="Stundenzettel als PDF herunterladen" aria-label="Stundenzettel PDF">
						{#if exportingPdf}…{:else}<FileText size={14} />{/if}
					</Button>
					{#if hasAdjustments}
						<Button
							size="sm"
							variant="danger"
							onclick={() => {
								showCleanupDialog = true;
							}}
							title="Anpassungen endgültig übernehmen und Stundenkonto leeren (destruktiv)"
						>
							Stundenkonto säubern
						</Button>
					{/if}
				{/if}
			</div>
		{/if}

		{#if loadError}
			<div role="alert" class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-sm border border-danger/40 bg-danger/5 px-3 py-2 text-[13px] text-danger">
				<span>{loadError}</span>
				<Button size="sm" onclick={() => loadHours(employeeId)} disabled={loading}>
					{loading ? 'Lädt …' : 'Erneut laden'}
				</Button>
			</div>
		{:else if loading && !hoursSummary}
			<p class="mb-3 text-[13px] text-faint">Lädt …</p>
		{/if}

		{#if hoursSummary}
			{@const paid = payrollEditMode ? livePaid : hoursSummary.paid_total}
			{@const worked = payrollEditMode ? liveWorked : hoursSummary.worked_total}
			{@const account = payrollEditMode ? liveAccount : hoursSummary.hour_account}
			<div class="flex flex-col gap-3">
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div class="flex flex-col gap-1">
						<span class="label-xs text-faint">{viewMode === 'month' ? 'Bezahlt' : 'Ist'}</span>
						<span class="num text-2xl font-medium">{paid.toFixed(1)}<span class="text-sm text-faint"> h</span></span>
					</div>
					<div class="flex flex-col gap-1">
						<span class="label-xs text-faint">Ziel</span>
						<span class="num text-2xl font-medium text-muted">{hoursSummary.target_hours}<span class="text-sm text-faint"> h</span></span>
					</div>
					{#if viewMode === 'month'}
						<div class="flex flex-col gap-1">
							<span class="label-xs text-faint">Gearbeitet</span>
							<span class="num text-2xl font-medium text-muted">{worked.toFixed(1)}<span class="text-sm text-faint"> h</span></span>
						</div>
						<div class="flex flex-col gap-1">
							<span class="label-xs text-faint">Stundenkonto</span>
							<span class="num text-2xl font-medium {account > 0 ? 'text-ok' : account < 0 ? 'text-danger' : ''}"
								>{account >= 0 ? '+' : ''}{account.toFixed(1)}<span class="text-sm text-faint"> h</span></span
							>
						</div>
					{/if}
				</div>
				<div class="h-1.5 overflow-hidden rounded-full bg-sunk">
					<div class="h-full bg-accent" style="width: {progressPct(paid, hoursSummary.target_hours)}%"></div>
				</div>
				<span class="num text-xs text-faint">{hoursSummary.assignment_count} Einsätze</span>
			</div>
		{:else if !loading && !loadError}
			<p class="text-[13px] text-faint">{viewMode === '7d' ? 'Keine Einsätze in den nächsten 7 Tagen.' : 'Keine Daten für diesen Monat.'}</p>
		{/if}
	</Panel>

	<Panel title="Einsätze" bodyClass="p-0">
		{#if failedKeys.length}
			<div role="alert" class="flex flex-wrap items-center justify-between gap-2 border-b border-danger/40 bg-danger/5 px-4 py-2 text-[13px] text-danger">
				<span>
					{failedKeys.length === 1 ? '1 Zeit' : `${failedKeys.length} Zeiten`} wegen der Verbindung nicht gespeichert (rot markiert).
				</span>
				<Button size="sm" onclick={retryFailed} disabled={anySaving}>
					{anySaving ? 'Speichern …' : 'Alle erneut speichern'}
				</Button>
			</div>
		{/if}
		{#if hoursSummary && (hoursSummary.assignments.length > 0 || hoursSummary.calendar_items?.length > 0 || hoursSummary.appointments?.length > 0)}
			<div class="overflow-x-auto">
				<table class="w-full min-w-[960px] border-collapse text-sm">
					<thead>
						<tr class="label-xs border-b border-line text-faint">
							{#if payrollEditMode}<th class="px-3 py-2 text-left font-normal">Aktiv</th>{/if}
							<th class="px-3 py-2 text-left font-normal">Datum</th>
							<th class="px-3 py-2 text-left font-normal">Beschreibung</th>
							<th class="px-3 py-2 text-left font-normal">Details</th>
							<th class="px-1.5 py-2 text-left font-normal">Von</th>
							<th class="px-1.5 py-2 text-left font-normal">Bis</th>
							<th class="px-1.5 py-2 text-left font-normal">Pause (h)</th>
							<th class="px-3 py-2 text-right font-normal">{payrollEditMode ? 'Bezahlt' : 'Ist'} (h)</th>
							<th class="px-1.5 py-2 text-left font-normal" title="vom Mitarbeiter erfasst">MA-Von</th>
							<th class="px-1.5 py-2 text-left font-normal">MA-Bis</th>
							<th class="px-1.5 py-2 text-left font-normal">MA-Pause</th>
							<th class="px-3 py-2 text-left font-normal">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each hoursSummary.assignments as a (`inq:${a.inquiry_id}:${a.booking_date ?? ''}`)}
							{@const key = `inq:${a.inquiry_id}:${a.booking_date ?? ''}`}
							{@const pdraft = payrollDrafts[key]}
							{@const inactive = payrollEditMode ? pdraft?.deactivated : a.deactivated}
							<tr
								class="cursor-pointer border-b border-line hover:bg-sunk/60 {inactive ? 'text-faint line-through' : ''}"
								onclick={() => {
									if (!payrollEditMode && a.inquiry_id && !window.getSelection()?.toString()) goto(`/admin/inquiries/${a.inquiry_id}`);
								}}
							>
								{@render activeToggle(pdraft)}
								<td class="num px-3 py-1.5 text-[13px] whitespace-nowrap">{a.booking_date ? formatDate(a.booking_date) : '—'}</td>
								<td class="px-3 py-1.5">
									<span class="block font-medium">{a.customer_name ?? '—'}</span>
									<PhoneLink phone={a.customer_phone} class="text-xs text-muted" />
								</td>
								<td class="px-3 py-1.5 text-[13px] text-muted">{a.origin_city && a.destination_city ? `${a.origin_city} → ${a.destination_city}` : '—'}</td>
								{@render timeCells(key, timeDrafts[key], pdraft, true)}
								<td class="num px-3 py-1.5 text-right font-medium">
									{payrollEditMode ? (pdraft ? paidHoursForDraft(pdraft).toFixed(1) : '—') : ((a.paid_hours ?? a.actual_hours)?.toFixed(1) ?? '—')}
								</td>
								{@render employeeTimes(a.employee_clock_in, a.employee_clock_out, a.employee_break_minutes)}
								<td class="px-3 py-1.5"><StatusBadge status={a.status} /></td>
							</tr>
						{/each}
						{#each hoursSummary.calendar_items ?? [] as ci (`ci:${ci.calendar_item_id}:${ci.scheduled_date ?? ''}`)}
							{@const key = `ci:${ci.calendar_item_id}:${ci.scheduled_date ?? ''}`}
							{@const pdraft = payrollDrafts[key]}
							{@const inactive = payrollEditMode ? pdraft?.deactivated : ci.deactivated}
							<tr
								class="cursor-pointer border-b border-line hover:bg-sunk/60 {inactive ? 'text-faint line-through' : ''}"
								onclick={() => {
									if (!payrollEditMode && !window.getSelection()?.toString()) goto(`/admin/calendar-items/${ci.calendar_item_id}`);
								}}
							>
								{@render activeToggle(pdraft)}
								<td class="num px-3 py-1.5 text-[13px] whitespace-nowrap">{ci.scheduled_date ? formatDate(ci.scheduled_date) : '—'}</td>
								<td class="px-3 py-1.5">
										<Badge tone="info" class="mr-1.5">Termin</Badge><span class="font-medium">{ci.title}</span>
										{#if ci.customer_name}<span class="block text-xs text-muted">{ci.customer_name}</span>{/if}
										<PhoneLink phone={ci.customer_phone} class="text-xs text-muted" />
									</td>
								<td class="px-3 py-1.5 text-[13px] text-muted">{ci.location ?? '—'}</td>
								{@render timeCells(key, timeDrafts[key], pdraft, true)}
								<td class="num px-3 py-1.5 text-right font-medium">
									{payrollEditMode ? (pdraft ? paidHoursForDraft(pdraft).toFixed(1) : '—') : ((ci.paid_hours ?? ci.actual_hours)?.toFixed(1) ?? '—')}
								</td>
								{@render employeeTimes(ci.employee_clock_in, ci.employee_clock_out, ci.employee_break_minutes)}
								<td class="px-3 py-1.5"><StatusBadge status={ci.status} /></td>
							</tr>
						{/each}
						{#each hoursSummary.appointments ?? [] as ap (`appt:${ap.inquiry_id ?? ''}:${ap.appointment_id}`)}
							{@const key = `appt:${ap.inquiry_id ?? ''}:${ap.appointment_id}`}
							<!-- Paid Zusatztermine have no payroll-override layer yet: no Aktiv toggle,
							     paid = worked, times stay inline-editable outside payroll mode. -->
							<tr
								class="cursor-pointer border-b border-line hover:bg-sunk/60"
								onclick={() => {
									if (!payrollEditMode && ap.inquiry_id && !window.getSelection()?.toString()) goto(`/admin/inquiries/${ap.inquiry_id}`);
								}}
							>
								{#if payrollEditMode}<td></td>{/if}
								<td class="num px-3 py-1.5 text-[13px] whitespace-nowrap">{ap.scheduled_date ? formatDate(ap.scheduled_date) : '—'}</td>
								<td class="px-3 py-1.5">
									<Badge tone="warn" class="mr-1.5">Zusatztermin</Badge><span class="font-medium">{ap.customer_name ?? ap.kind}</span>
									<PhoneLink phone={ap.customer_phone} class="flex w-fit text-xs text-muted" />
								</td>
								<td class="px-3 py-1.5 text-[13px] text-muted">{ap.location ?? '—'}</td>
								{@render timeCells(key, timeDrafts[key], undefined, false)}
								<td class="num px-3 py-1.5 text-right font-medium">{(ap.paid_hours ?? ap.actual_hours)?.toFixed(1) ?? '—'}</td>
								{@render employeeTimes(ap.employee_clock_in, ap.employee_clock_out, ap.employee_break_minutes)}
								<td class="px-3 py-1.5"><StatusBadge status={ap.status} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else if !loading && !loadError}
			<p class="px-4 py-6 text-[13px] text-faint">{viewMode === '7d' ? 'Keine Einsätze in den nächsten 7 Tagen.' : 'Keine Einsätze in diesem Monat.'}</p>
		{/if}
	</Panel>
</div>

<ConfirmationDialog
	bind:open={showCleanupDialog}
	title="Stundenkonto säubern"
	message={`Achtung: Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden. Deaktivierte Tage werden aus den Einsätzen entfernt, angepasste Zeiten überschreiben die erfassten Zeiten. Für ${selectedMonth} fortfahren?`}
	confirmLabel="Endgültig säubern"
	loading={cleaningUp}
	onConfirm={cleanupStundenkonto}
/>
