<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, apiFetch, apiDownload, formatDate } from '$lib/utils/api.svelte';
	import { normalizeTimeInput } from '$lib/utils/format';
	import { breakHoursToMinutes, breakMinutesToHours } from '$lib/utils/time';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { FileSpreadsheet, FileText } from 'lucide-svelte';

	interface Assignment {
		inquiry_id: string;
		customer_name: string | null;
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

	interface TimeDraft {
		clock_in: string;
		clock_out: string;
		break_minutes: number;
		saving: boolean;
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
	let selectedMonth = $state(new Date().toISOString().slice(0, 7));

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

	$effect(() => {
		if (employeeId) loadHours(employeeId);
	});

	/**
	 * Loads hours summary for the active view mode (7-day or month).
	 *
	 * Called by: $effect on mount, view mode toggle, month picker change
	 * Purpose: Fetches hours aggregation for either the rolling 7-day window or a calendar month.
	 */
	async function loadHours(id: string) {
		try {
			let url: string;
			if (viewMode === '7d') {
				const { from, to } = getWeekRange();
				url = `/api/v1/admin/employees/${id}/hours?from=${from}&to=${to}`;
			} else {
				url = `/api/v1/admin/employees/${id}/hours?month=${selectedMonth}`;
			}
			hoursSummary = await apiGet<HoursSummary>(url);

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
			timeDrafts = drafts;
		} catch {
			hoursSummary = null;
			timeDrafts = {};
		}
	}

	/** Converts loose time input ("7", "7:30", "07:30") to "HH:MM:SS" for the API, or null if empty. */
	function toTimeStr(val: string): string | null {
		return normalizeTimeInput(val);
	}

	/**
	 * Saves clock_in / clock_out / break_minutes for one assignment row via PATCH.
	 *
	 * Called by: onblur on any time/break input in the assignments table.
	 * Purpose: Persists per-day time tracking without a dedicated save button.
	 *
	 * @param key - "inq:{inquiry_id}" or "ci:{calendar_item_id}"
	 */
	async function saveTime(key: string) {
		const draft = timeDrafts[key];
		if (!draft || draft.saving) return;
		draft.saving = true;
		try {
			const [type, id, dayDate] = key.split(':');
			const payload: Record<string, unknown> = {
				clock_in: toTimeStr(draft.clock_in),
				clock_out: toTimeStr(draft.clock_out),
				break_minutes: draft.break_minutes
			};
			if (dayDate) payload.day_date = dayDate;
			if (type === 'inq') {
				await apiPatch(`/api/v1/inquiries/${id}/employees/${employeeId}`, payload);
			} else {
				await apiPatch(`/api/v1/admin/calendar-items/${id}/employees/${employeeId}`, payload);
			}
			// Reload to refresh the computed actual_hours column
			await loadHours(employeeId);
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			draft.saving = false;
		}
	}

	/**
	 * Handles month picker change in hours card.
	 *
	 * Called by: Template (month input onchange)
	 * Purpose: Reloads hours summary for the new month.
	 */
	function onHoursMonthChange() {
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
		if (!hoursSummary) return;
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
	 * Downloads the employee's Stundenzettel as an XLSX file for the selected month.
	 *
	 * Called by: Template (export button, month view only)
	 * Purpose: Generates the monthly timesheet document Alex uses for payroll.
	 */
	async function exportStundenzettel() {
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

<!-- Hours Card (7-day or monthly) -->
<div class="card">
	<div class="card-header">
		<h2>Stunden</h2>
		<div class="view-toggle">
			<button class="toggle-btn" class:active={viewMode === '7d'} onclick={() => setViewMode('7d')}
				>7 Tage</button
			>
			<button
				class="toggle-btn"
				class:active={viewMode === 'month'}
				onclick={() => setViewMode('month')}>Monat</button
			>
			{#if viewMode === 'month'}
				<input type="month" bind:value={selectedMonth} onchange={onHoursMonthChange} class="month-input" />
				{#if payrollEditMode}
					<button
						class="btn btn-sm btn-primary-sm"
						onclick={savePayroll}
						disabled={savingPayroll}
						title="Anpassungen speichern und Bearbeitungsmodus verlassen"
					>
						{savingPayroll ? 'Speichern…' : 'Speichern & Beenden'}
					</button>
					<button class="btn btn-sm" onclick={cancelPayrollEdit} disabled={savingPayroll}>
						Abbrechen
					</button>
				{:else}
					<button
						class="btn btn-sm"
						onclick={enterPayrollEdit}
						disabled={!hoursSummary?.all_days_confirmed}
						title={hoursSummary?.all_days_confirmed
							? 'Stunden für die Abrechnung bearbeiten'
							: 'Erst möglich, wenn alle Tage Von/Bis-Zeiten haben'}
					>
						Bearbeiten
					</button>
					<button
						class="btn btn-sm export-btn"
						onclick={exportStundenzettel}
						disabled={exportingXlsx}
						title="Stundenzettel als XLSX herunterladen"
					>
						{#if exportingXlsx}
							…
						{:else}
							<FileSpreadsheet size={14} />
						{/if}
					</button>
					<button
						class="btn btn-sm export-btn"
						onclick={exportStundenzettelPdf}
						disabled={exportingPdf}
						title="Stundenzettel als PDF herunterladen"
					>
						{#if exportingPdf}
							…
						{:else}
							<FileText size={14} />
						{/if}
					</button>
					{#if hasAdjustments}
						<button
							class="btn btn-sm btn-danger-sm"
							onclick={() => { showCleanupDialog = true; }}
							title="Anpassungen endgültig übernehmen und Stundenkonto leeren (destruktiv)"
						>
							Stundenkonto säubern
						</button>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
	{#if hoursSummary}
		{@const paid = payrollEditMode ? livePaid : hoursSummary.paid_total}
		{@const worked = payrollEditMode ? liveWorked : hoursSummary.worked_total}
		{@const account = payrollEditMode ? liveAccount : hoursSummary.hour_account}
		<div class="hours-summary">
			<div class="hours-row">
				<span class="hours-label">Ziel</span>
				<span class="hours-value">{hoursSummary.target_hours} h</span>
			</div>
			{#if viewMode === 'month'}
				<div class="hours-row muted">
					<span class="hours-label">Gearbeitet</span>
					<span class="hours-value">{worked.toFixed(1)} h</span>
				</div>
			{/if}
			<div class="hours-row">
				<span class="hours-label">{viewMode === 'month' ? 'Bezahlt' : 'Ist'}</span>
				<span class="hours-value">{paid.toFixed(1)} h</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill actual" style="width: {progressPct(paid, hoursSummary.target_hours)}%"
				></div>
			</div>
			{#if viewMode === 'month'}
				<div class="hours-row account-row">
					<span class="hours-label">Stundenkonto</span>
					<span class="hours-value">{account >= 0 ? '+' : ''}{account.toFixed(1)} h</span>
				</div>
			{/if}
			<div class="hours-row muted">
				<span>{hoursSummary.assignment_count} Einsaetze</span>
			</div>
		</div>
	{:else}
		<div class="empty-state">
			{viewMode === '7d' ? 'Keine Einsaetze in den naechsten 7 Tagen.' : 'Keine Daten fuer diesen Monat.'}
		</div>
	{/if}
</div>

<!-- Assignments Table -->
<div class="card full-width">
	<div class="card-header">
		<h2>Einsaetze</h2>
	</div>
	{#if hoursSummary && (hoursSummary.assignments.length > 0 || hoursSummary.calendar_items?.length > 0)}
		<div class="table-wrapper">
			<table class="data-table">
				<thead>
					<tr>
						{#if payrollEditMode}<th class="time-col">Aktiv</th>{/if}
						<th>Datum</th>
						<th>Beschreibung</th>
						<th>Details</th>
						<th class="time-col">Von</th>
						<th class="time-col">Bis</th>
						<th class="time-col">Pause (h)</th>
						<th class="num">{payrollEditMode ? 'Bezahlt (h)' : 'Ist (h)'}</th>
						<th class="time-col muted-col">MA-Von</th>
						<th class="time-col muted-col">MA-Bis</th>
						<th class="time-col muted-col">MA-Pause</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each hoursSummary.assignments as a}
						{@const key = `inq:${a.inquiry_id}:${a.booking_date ?? ''}`}
						{@const draft = timeDrafts[key]}
						{@const pdraft = payrollDrafts[key]}
						{@const inactive = payrollEditMode ? pdraft?.deactivated : a.deactivated}
						<tr
							class="clickable-row"
							class:inactive-row={inactive}
							onclick={() => { if (!payrollEditMode && a.inquiry_id && !window.getSelection()?.toString()) goto(`/admin/inquiries/${a.inquiry_id}`); }}
						>
							{#if payrollEditMode}
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if pdraft}
										<input type="checkbox" checked={!pdraft.deactivated} onchange={(e) => (pdraft.deactivated = !e.currentTarget.checked)} title="Tag in Abrechnung aktiv" />
									{/if}
								</td>
							{/if}
							<td>{a.booking_date ? formatDate(a.booking_date) : '—'}</td>
							<td>{a.customer_name ?? '—'}</td>
							<td>
								{#if a.origin_city && a.destination_city}
									{a.origin_city} → {a.destination_city}
								{:else}
									—
								{/if}
							</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" disabled={pdraft.deactivated} bind:value={pdraft.clock_in} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" class:saving={draft.saving} bind:value={draft.clock_in} onblur={() => saveTime(key)} />
								{/if}
							</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" disabled={pdraft.deactivated} bind:value={pdraft.clock_out} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" class:saving={draft.saving} bind:value={draft.clock_out} onblur={() => saveTime(key)} />
								{/if}
							</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="decimal" class="break-input" placeholder="0" maxlength="5" disabled={pdraft.deactivated} value={breakMinutesToHours(pdraft.break_minutes)} onblur={(e) => { pdraft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value); }} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="decimal" class="break-input" class:saving={draft.saving} placeholder="0" maxlength="5" value={breakMinutesToHours(draft.break_minutes)} onblur={(e) => { draft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value); saveTime(key); }} />
								{/if}
							</td>
							<td class="num">{payrollEditMode ? (pdraft ? paidHoursForDraft(pdraft).toFixed(1) : '—') : (a.paid_hours ?? a.actual_hours)?.toFixed(1) ?? '—'}</td>
							<td class="time-col muted-col">{a.employee_clock_in ? fmtTimestamp(a.employee_clock_in) : '—'}</td>
							<td class="time-col muted-col">{a.employee_clock_out ? fmtTimestamp(a.employee_clock_out) : '—'}</td>
							<td class="time-col muted-col">{a.employee_break_minutes != null ? `${breakMinutesToHours(a.employee_break_minutes) || '0'} h` : '—'}</td>
							<td><StatusBadge status={a.status} /></td>
						</tr>
					{/each}
					{#each (hoursSummary.calendar_items ?? []) as ci}
						{@const key = `ci:${ci.calendar_item_id}:${ci.scheduled_date ?? ''}`}
						{@const draft = timeDrafts[key]}
						{@const pdraft = payrollDrafts[key]}
						{@const inactive = payrollEditMode ? pdraft?.deactivated : ci.deactivated}
						<tr
							class="clickable-row item-row"
							class:inactive-row={inactive}
							onclick={() => { if (!payrollEditMode && !window.getSelection()?.toString()) goto(`/admin/calendar-items/${ci.calendar_item_id}`); }}
						>
							{#if payrollEditMode}
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if pdraft}
										<input type="checkbox" checked={!pdraft.deactivated} onchange={(e) => (pdraft.deactivated = !e.currentTarget.checked)} title="Tag in Abrechnung aktiv" />
									{/if}
								</td>
							{/if}
							<td>{ci.scheduled_date ? formatDate(ci.scheduled_date) : '—'}</td>
							<td>
								<span class="item-badge">Termin</span>
								{ci.title}
							</td>
							<td>{ci.location ?? '—'}</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" disabled={pdraft.deactivated} bind:value={pdraft.clock_in} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" class:saving={draft.saving} bind:value={draft.clock_in} onblur={() => saveTime(key)} />
								{/if}
							</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" disabled={pdraft.deactivated} bind:value={pdraft.clock_out} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" class="time-input" class:saving={draft.saving} bind:value={draft.clock_out} onblur={() => saveTime(key)} />
								{/if}
							</td>
							<td class="time-cell" onclick={(e) => e.stopPropagation()}>
								{#if payrollEditMode}
									{#if pdraft}
										<input type="text" inputmode="decimal" class="break-input" placeholder="0" maxlength="5" disabled={pdraft.deactivated} value={breakMinutesToHours(pdraft.break_minutes)} onblur={(e) => { pdraft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value); }} />
									{/if}
								{:else if draft}
									<input type="text" inputmode="decimal" class="break-input" class:saving={draft.saving} placeholder="0" maxlength="5" value={breakMinutesToHours(draft.break_minutes)} onblur={(e) => { draft.break_minutes = breakHoursToMinutes((e.target as HTMLInputElement).value); saveTime(key); }} />
								{/if}
							</td>
							<td class="num">{payrollEditMode ? (pdraft ? paidHoursForDraft(pdraft).toFixed(1) : '—') : (ci.paid_hours ?? ci.actual_hours)?.toFixed(1) ?? '—'}</td>
							<td class="time-col muted-col">{ci.employee_clock_in ? fmtTimestamp(ci.employee_clock_in) : '—'}</td>
							<td class="time-col muted-col">{ci.employee_clock_out ? fmtTimestamp(ci.employee_clock_out) : '—'}</td>
							<td class="time-col muted-col">{ci.employee_break_minutes != null ? `${breakMinutesToHours(ci.employee_break_minutes) || '0'} h` : '—'}</td>
							<td><StatusBadge status={ci.status} /></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="empty-state">
			{viewMode === '7d' ? 'Keine Einsaetze in den naechsten 7 Tagen.' : 'Keine Einsaetze in diesem Monat.'}
		</div>
	{/if}
</div>

<ConfirmationDialog
	bind:open={showCleanupDialog}
	title="Stundenkonto säubern"
	message={`Achtung: Diese Aktion ist endgültig und kann nicht rückgängig gemacht werden. Deaktivierte Tage werden aus den Einsätzen entfernt, angepasste Zeiten überschreiben die erfassten Zeiten. Für ${selectedMonth} fortfahren?`}
	confirmLabel="Endgültig säubern"
	loading={cleaningUp}
	onConfirm={cleanupStundenkonto}
/>

<style>
	.card {
		padding: 1.25rem;
		box-shadow: none;
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		margin: 0;
	}

	.view-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.toggle-btn {
		padding: 0.25rem 0.6rem;
		font-size: 0.8125rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.toggle-btn.active {
		background: var(--dt-primary);
		color: var(--dt-on-primary);
	}

	.toggle-btn:hover:not(.active) {
		background: var(--dt-surface-container);
	}

	.export-btn {
		padding: 0.25rem 0.5rem;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		display: inline-flex;
		align-items: center;
	}

	.export-btn:hover:not(:disabled) {
		background: var(--dt-surface-container);
		color: var(--dt-on-surface);
	}

	.month-input {
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
	}

	.hours-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.hours-label {
		color: var(--dt-on-surface-variant);
		font-weight: 500;
	}

	.hours-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface);
	}

	.hours-row.muted {
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
		margin-top: 0.25rem;
	}

	.account-row .hours-value {
		font-weight: 600;
	}

	.progress-bar {
		height: 8px;
		background: var(--dt-surface-container-high);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width var(--dt-transition-panel);
	}

	.progress-fill.actual {
		background: #34d399;
	}

	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		text-align: left;
		padding: 0.75rem;
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		font-weight: 600;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem;
		color: var(--dt-on-surface);
	}

	.data-table tbody tr:nth-child(even) td {
		background: var(--dt-surface-container-low);
	}

	.data-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.clickable-row {
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.clickable-row:hover td {
		background: var(--dt-surface-container) !important;
	}

	.item-row td {
		background: rgba(252, 96, 24, 0.04);
	}

	.item-row:hover td {
		background: rgba(252, 96, 24, 0.08) !important;
	}

	.item-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
		padding: 0.1rem 0.35rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.35rem;
		vertical-align: middle;
	}

	.time-col {
		text-align: center;
		white-space: nowrap;
	}

	.muted-col {
		color: #94a3b8;
		font-size: 0.8125rem;
	}

	.time-cell {
		padding: 0.25rem 0.5rem;
	}

	.time-input,
	.break-input {
		padding: 0.25rem 0.375rem;
		font-size: 0.8125rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		outline: none;
		width: 100%;
		min-width: 0;
		font-variant-numeric: tabular-nums;
		transition: border-color var(--dt-transition), opacity var(--dt-transition);
	}

	.time-input:focus,
	.break-input:focus {
		border-color: var(--dt-primary);
		background: var(--dt-surface-container);
	}

	.time-input.saving,
	.break-input.saving {
		opacity: 0.5;
	}

	.break-input {
		width: 5rem;
	}

	.empty-state {
		padding: 2rem;
	}

	/* Payroll edit mode: deactivated (soft-deleted) day. */
	.inactive-row {
		opacity: 0.45;
		text-decoration: line-through;
	}
	.inactive-row :global(input) {
		text-decoration: none;
	}
</style>
