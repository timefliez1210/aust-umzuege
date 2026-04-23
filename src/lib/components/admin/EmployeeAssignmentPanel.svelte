<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDelete } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { Plus, Trash2, Check, X } from 'lucide-svelte';

	// ---------------------------------------------------------------------------
	// Interfaces
	// ---------------------------------------------------------------------------

	/** A single employee option returned by GET /admin/employees. */
	interface EmployeeOption {
		id: string;
		first_name: string;
		last_name: string;
		email: string;
	}

	/**
	 * An employee assignment as returned by the API.
	 * Time fields are HH:MM:SS strings (not ISO timestamps) after the unified-time migration.
	 */
	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		job_date?: string | null;
		planned_hours: number;
		actual_hours: number | null;
		notes: string | null;
		start_time?: string | null;
		end_time?: string | null;
		clock_in?: string | null;
		clock_out?: string | null;
		break_minutes?: number;
		employee_clock_in?: string | null;
		employee_clock_out?: string | null;
		employee_actual_hours?: number | null;
		transport_mode?: string | null;
		travel_costs_cents?: number | null;
		accommodation_cents?: number | null;
		misc_costs_cents?: number | null;
		meal_deduction?: string | null;
	}

	interface EmployeeSummary {
		employee_id: string;
		first_name: string;
		last_name: string;
		total_hours: number | null;
		day_count: number;
	}

	// ---------------------------------------------------------------------------
	// Props
	// ---------------------------------------------------------------------------

	/**
	 * Component props.
	 *
	 * @prop entityId      - UUID of the inquiry or calendar item this panel is bound to.
	 * @prop entityType    - Which resource the employees are assigned to.
	 *                       'inquiry'       → /api/v1/inquiries/{id}/employees
	 *                       'calendar_item' → /api/v1/admin/calendar-items/{id}/employees
	 * @prop preferredDate - (Optional) ISO date string used to build clock timestamps for
	 *                       inquiry assignments (YYYY-MM-DD portion). Ignored for calendar items.
	 * @prop onUpdated     - (Optional) callback invoked after any successful mutation
	 *                       (add, save, remove). The parent can use this to refresh its own state.
	 */
	let {
		entityId,
		entityType,
		preferredDate = undefined,
		hasPauschale = false,
		onUpdated = undefined
	}: {
		entityId: string;
		entityType: 'inquiry' | 'calendar_item';
		preferredDate?: string | null;
		hasPauschale?: boolean;
		onUpdated?: () => void;
	} = $props();

	// ---------------------------------------------------------------------------
	// Derived base URL
	// ---------------------------------------------------------------------------

	/**
	 * API base path derived from entityType.
	 *
	 * Called by: all API functions.
	 * Purpose: Single source of truth so the URL never diverges from the entityType prop.
	 */
	const baseUrl = $derived(
		entityType === 'inquiry'
			? `/api/v1/inquiries/${entityId}/employees`
			: `/api/v1/admin/calendar-items/${entityId}/employees`
	);

	// ---------------------------------------------------------------------------
	// State
	// ---------------------------------------------------------------------------

	let assignments = $state<EmployeeAssignment[]>([]);
	let allEmployees = $state<EmployeeOption[]>([]);
	let loadingPanel = $state(true);

	// Add-employee form
	let showAddForm = $state(false);
	let addEmployeeId = $state('');
	let addPlannedHours = $state('');
	let addNotes = $state('');
	let adding = $state(false);

	// Per-row inline edit state (calendar_item mode)
	let editingEmp = $state<Record<string, {
		planned: string; actual: string; notes: string;
		clockIn: string; clockOut: string;
		breakMin: string;
		transportMode: string;
		travelCosts: string;
		accommodation: string;
		miscCosts: string;
		mealDeduction: string;
	}>>({});
	let savingEmp = $state<Record<string, boolean>>({});

	// Per-row saving for inquiry mode (blur-to-save)
	let inquerySaving = $state<string | null>(null);

	// Remove-employee confirmation dialog
	let showRemoveDialog = $state(false);
	let pendingRemove = $state<{ id: string; name: string } | null>(null);
	let removingEmp = $state(false);

	// ---------------------------------------------------------------------------
	// Load on mount
	// ---------------------------------------------------------------------------

	$effect(() => {
		if (entityId) {
			loadAssignments();
			loadAllEmployees();
		}
	});

	// ---------------------------------------------------------------------------
	// Data loading
	// ---------------------------------------------------------------------------

	/**
	 * Loads the current employee assignment list for this entity.
	 *
	 * Called by: $effect on mount, after add/remove operations.
	 * Purpose: Populates the assignments table with fresh data from the API.
	 */
	async function loadAssignments() {
		loadingPanel = true;
		try {
			const res = await apiGet<EmployeeAssignment[] | { employees: EmployeeAssignment[] }>(baseUrl);
			// The inquiry endpoint returns an array; calendar-item returns {employees:[]}
			assignments = Array.isArray(res) ? res : (res as { employees: EmployeeAssignment[] }).employees ?? [];
			// Seed inline edit state for calendar_item mode
			if (entityType === 'calendar_item') {
				const state: typeof editingEmp = {};
				for (const e of assignments) {
					state[e.employee_id] = {
						planned: String(e.planned_hours),
						actual: e.actual_hours != null ? String(e.actual_hours) : '',
						notes: e.notes ?? '',
						clockIn: fmtTime(e.clock_in),
						clockOut: fmtTime(e.clock_out),
						breakMin: String(e.break_minutes ?? 0),
						transportMode: e.transport_mode ?? '',
						travelCosts: e.travel_costs_cents != null ? String(e.travel_costs_cents) : '',
						accommodation: e.accommodation_cents != null ? String(e.accommodation_cents) : '',
						miscCosts: e.misc_costs_cents != null ? String(e.misc_costs_cents) : '',
						mealDeduction: e.meal_deduction ?? '',
					};
				}
				editingEmp = state;
			}
		} catch {
			// Silent — panel shows as empty
		} finally {
			loadingPanel = false;
		}
	}

	/**
	 * Loads all active employees for the add-employee dropdown.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Fills the employee picker so the user can choose who to assign.
	 */
	async function loadAllEmployees() {
		try {
			const res = await apiGet<{ employees: EmployeeOption[] }>(
				'/api/v1/admin/employees?active=true&limit=100'
			);
			allEmployees = res.employees;
		} catch {
			allEmployees = [];
		}
	}

	// ---------------------------------------------------------------------------
	// Derived: unassigned employees (for dropdown)
	// ---------------------------------------------------------------------------

	/**
	 * Filters out employees already assigned to this entity.
	 *
	 * Called by: Template (add-employee select options).
	 * Purpose: Prevents the same employee being assigned twice.
	 *
	 * @returns Array of EmployeeOption not yet present in assignments.
	 */
	const unassigned = $derived(() => {
		const assigned = new Set(assignments.map((a) => a.employee_id));
		return allEmployees.filter((e) => !assigned.has(e.id));
	});

	// Grouped summary for inquiry multi-day mode
	const isMultiDay = $derived(
		entityType === 'inquiry' &&
		new Set(assignments.map(a => a.job_date).filter(Boolean)).size > 1
	);

	const employeeSummaries = $derived((): EmployeeSummary[] => {
		const map = new Map<string, EmployeeSummary>();
		for (const a of assignments) {
			let s = map.get(a.employee_id);
			if (!s) {
				s = { employee_id: a.employee_id, first_name: a.first_name, last_name: a.last_name, total_hours: null, day_count: 0 };
				map.set(a.employee_id, s);
			}
			s.day_count++;
			const hours = a.actual_hours ?? deriveActualHours(a.clock_in, a.clock_out, a.break_minutes ?? 0);
			if (hours != null) {
				s.total_hours = (s.total_hours ?? 0) + hours;
			}
		}
		return Array.from(map.values());
	});

	// ---------------------------------------------------------------------------
	// Add employee
	// ---------------------------------------------------------------------------

	/**
	 * Opens the add-employee form and pre-selects the first available employee.
	 *
	 * Called by: Template (Zuweisen button onclick).
	 * Purpose: Prepopulates the form to reduce clicks.
	 */
	function openAddForm() {
		const available = unassigned();
		addEmployeeId = available[0]?.id ?? '';
		addPlannedHours = '';
		addNotes = '';
		showAddForm = true;
	}

	/**
	 * POSTs a new employee assignment and reloads the list.
	 *
	 * Called by: Template (add form submit).
	 * Purpose: Assigns the selected employee with planned_hours (and optional notes) to this entity.
	 */
	async function handleAdd() {
		if (!addEmployeeId) return;
		adding = true;
		try {
			await apiPost(baseUrl, {
				employee_id: addEmployeeId,
				planned_hours: parseFloat(addPlannedHours) || 0,
				notes: addNotes || null
			});
			showToast('Mitarbeiter zugewiesen', 'success');
			showAddForm = false;
			await loadAssignments();
			onUpdated?.();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			adding = false;
		}
	}

	// ---------------------------------------------------------------------------
	// Inquiry-mode: blur-to-save helpers
	// ---------------------------------------------------------------------------

	/**
	 * PATCHes planned_hours for an inquiry assignment on input blur.
	 *
	 * Called by: Template (planned_hours input onblur, inquiry mode only).
	 * Purpose: PATCH /api/v1/inquiries/{id}/employees/{emp_id} with the new value.
	 *
	 * @param empId - Employee UUID whose planned_hours to update.
	 * @param value - Raw string from the input element.
	 */
	async function updatePlannedHours(empId: string, value: string) {
		const numValue = parseFloat(value);
		if (isNaN(numValue)) return;
		inquerySaving = empId;
		try {
			const updated = await apiPatch<EmployeeAssignment>(`${baseUrl}/${empId}`, {
				planned_hours: numValue
			});
			const idx = assignments.findIndex((e) => e.employee_id === empId);
			if (idx !== -1) assignments[idx] = { ...assignments[idx], ...updated };
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inquerySaving = null;
		}
	}

	/**
	 * PATCHes a time field for an inquiry assignment on input blur.
	 *
	 * Called by: Template (time inputs onblur, inquiry mode).
	 * Purpose: PATCH /api/v1/inquiries/{id}/employees/{emp_id} with HH:MM:SS value.
	 *
	 * @param empId - Employee UUID.
	 * @param field - One of start_time | end_time | clock_in | clock_out.
	 * @param time  - HH:MM string from the input (seconds appended automatically).
	 */
	async function updateTimeField(empId: string, field: string, time: string) {
		inquerySaving = empId;
		try {
			const value = time ? time + ':00' : null;
			const updated = await apiPatch<EmployeeAssignment>(`${baseUrl}/${empId}`, { [field]: value });
			const idx = assignments.findIndex((e) => e.employee_id === empId);
			if (idx !== -1) assignments[idx] = { ...assignments[idx], ...updated };
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inquerySaving = null;
		}
	}

	/**
	 * PATCHes break_minutes or actual_hours for an inquiry assignment on input blur.
	 */
	async function updateNumericField(empId: string, field: 'break_minutes' | 'actual_hours', value: string) {
		inquerySaving = empId;
		try {
			const num = field === 'break_minutes' ? (parseInt(value) || 0) : (value !== '' ? parseFloat(value) : null);
			const updated = await apiPatch<EmployeeAssignment>(`${baseUrl}/${empId}`, { [field]: num });
			const idx = assignments.findIndex((e) => e.employee_id === empId);
			if (idx !== -1) assignments[idx] = { ...assignments[idx], ...updated };
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inquerySaving = null;
		}
	}

	// ---------------------------------------------------------------------------
	// Calendar-item mode: explicit save button per row
	// ---------------------------------------------------------------------------

	/**
	 * PATCHes planned_hours, actual_hours, and notes for a calendar-item assignment.
	 *
	 * Called by: Template (save icon button per row, calendar_item mode only).
	 * Purpose: PATCH /api/v1/admin/calendar-items/{id}/employees/{emp_id} with all editable fields.
	 *
	 * @param empId - Employee UUID whose assignment to update.
	 */
	async function handleSaveEmp(empId: string, silent = false) {
		const s = editingEmp[empId];
		if (!s) return;
		savingEmp = { ...savingEmp, [empId]: true };
		try {
			await apiPatch(`${baseUrl}/${empId}`, {
				planned_hours: parseFloat(s.planned) || 0,
				actual_hours: s.actual !== '' ? parseFloat(s.actual) : null,
				notes: s.notes || null,
				clock_in: s.clockIn ? s.clockIn + ':00' : null,
				clock_out: s.clockOut ? s.clockOut + ':00' : null,
				break_minutes: parseInt(s.breakMin) || 0,
				transport_mode: s.transportMode || null,
				travel_costs_cents: s.travelCosts !== '' ? parseInt(s.travelCosts) : null,
				accommodation_cents: s.accommodation !== '' ? parseInt(s.accommodation) : null,
				misc_costs_cents: s.miscCosts !== '' ? parseInt(s.miscCosts) : null,
				meal_deduction: s.mealDeduction || null,
			});
			if (!silent) {
				await loadAssignments();
				showToast('Gespeichert', 'success');
			}
			onUpdated?.();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			savingEmp = { ...savingEmp, [empId]: false };
		}
	}

	/**
	 * Saves all employee assignments in calendar-item mode in parallel.
	 *
	 * Called by: Template ("Alle speichern" button, calendar_item mode only).
	 * Purpose: Lets admins fill all rows at once and save with a single click
	 *          instead of clicking the per-row save icon for each employee.
	 */
	let savingAll = $state(false);
	async function handleSaveAll() {
		if (savingAll) return;
		savingAll = true;
		try {
			await Promise.all(assignments.map(e => handleSaveEmp(e.employee_id, true)));
			await loadAssignments();
			showToast('Alle gespeichert', 'success');
			onUpdated?.();
		} finally {
			savingAll = false;
		}
	}

	// ---------------------------------------------------------------------------
	// Remove
	// ---------------------------------------------------------------------------

	/**
	 * Opens the remove-employee confirmation dialog.
	 *
	 * Called by: Template (remove button onclick).
	 * Purpose: Records which employee is pending removal and shows the dialog,
	 *          replacing the browser's native confirm() with a styled modal.
	 *
	 * @param empId - Employee UUID to remove.
	 * @param name  - Display name used in the confirm dialog message.
	 */
	function openRemoveDialog(empId: string, name: string) {
		pendingRemove = { id: empId, name };
		showRemoveDialog = true;
	}

	/**
	 * Executes the employee removal after the ConfirmationDialog is confirmed.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: DELETE /api/v1/inquiries|calendar-items/{id}/employees/{emp_id},
	 *          then reloads assignments and notifies the parent via onUpdated.
	 */
	async function handleRemoveEmp() {
		if (!pendingRemove) return;
		const { id: empId } = pendingRemove;
		removingEmp = true;
		try {
			await apiDelete(`${baseUrl}/${empId}`);
			showToast('Mitarbeiter entfernt', 'success');
			showRemoveDialog = false;
			pendingRemove = null;
			await loadAssignments();
			onUpdated?.();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			removingEmp = false;
		}
	}

	// ---------------------------------------------------------------------------
	// Helpers
	// ---------------------------------------------------------------------------

	/**
	 * Formats a TIME field (HH:MM:SS) to HH:MM for display in inputs.
	 *
	 * Called by: Template (time inputs), loadAssignments state seeding.
	 * Purpose: Strip seconds from the API's HH:MM:SS format for compact display.
	 *
	 * @param t - HH:MM:SS string or null/undefined.
	 * @returns HH:MM string, or empty string if t is falsy.
	 */
	function fmtTime(t: string | null | undefined): string {
		if (!t) return '';
		return t.slice(0, 5);
	}

	/**
	 * Derives actual_hours from clock_in, clock_out and break_minutes for display badge.
	 * Returns null if either time is missing.
	 */
	function deriveActualHours(clockIn: string | null | undefined, clockOut: string | null | undefined, breakMin: number): number | null {
		if (!clockIn || !clockOut) return null;
		const [ih, im] = clockIn.split(':').map(Number);
		const [oh, om] = clockOut.split(':').map(Number);
		const totalMin = (oh * 60 + om) - (ih * 60 + im) - breakMin;
		return totalMin > 0 ? Math.round(totalMin) / 60 : null;
	}

	/**
	 * Formats decimal hours as "Xh Ym" for display badges.
	 *
	 * Called by: Template (hours-badge in inquiry mode, actual_hours cells).
	 * Purpose: Human-readable duration instead of decimal number.
	 *
	 * Math: totalMinutes = hours * 60; h = floor(total / 60); m = total % 60
	 *
	 * @param hours - Decimal hours (e.g. 3.75) or null.
	 * @returns "3h 45m" or "—".
	 */
	function fmtHours(hours: number | null | undefined): string {
		if (hours == null) return '—';
		const totalMin = Math.round(hours * 60);
		const h = Math.floor(totalMin / 60);
		const m = totalMin % 60;
		return m > 0 ? `${h}h ${m}m` : `${h}h`;
	}

</script>

<div class="emp-panel">
	<!-- Header row -->
	<div class="card-header">
		<h3>Mitarbeiter ({assignments.length})</h3>
		{#if !showAddForm}
			<button class="btn btn-sm" onclick={openAddForm} disabled={unassigned().length === 0}>
				<Plus size={14} />
				Zuweisen
			</button>
		{/if}
	</div>

	{#if loadingPanel}
		<p class="empty-hint">Laden...</p>
	{:else if assignments.length === 0}
		<p class="empty-hint">Noch keine Mitarbeiter zugewiesen.</p>
	{:else if entityType === 'inquiry'}
		{#if isMultiDay}
			<!-- ── Inquiry multi-day mode: one summary row per employee ── -->
			<div class="inq-emp-list">
				<div class="inq-summary-header">
					<span>Name</span>
					<span>Tage</span>
					<span>Stunden Ist</span>
				</div>
				{#each employeeSummaries() as emp}
					<div class="inq-summary-row">
						<span class="inq-name">{emp.first_name} {emp.last_name[0]}.</span>
						<span class="inq-days">{emp.day_count}</span>
						<span class="inq-hours">
							{#if emp.total_hours != null}
								<span class="hours-badge">{fmtHours(emp.total_hours)}</span>
							{:else}
								<span class="inq-muted">—</span>
							{/if}
						</span>
					</div>
				{/each}
				<div class="inq-total">
					{#if employeeSummaries().some(e => e.total_hours != null)}
						<span class="hours-badge">{fmtHours(employeeSummaries().reduce((s, e) => s + (e.total_hours ?? 0), 0))} Ist gesamt</span>
					{:else}
						{employeeSummaries().length} Mitarbeiter · {assignments.length} Einträge
					{/if}
				</div>
				<p class="inq-multiday-hint">Mehrtägig — Zuweisung über den Kalender bearbeiten</p>
			</div>
		{:else}
		<!-- ── Inquiry mode: compact rows with planned + actual times ── -->
		<div class="inq-emp-list">
			<div class="inq-emp-header">
				<span>Name</span>
				<span>Von–Bis</span>
				<span>P.</span>
				<span></span>
			</div>
			{#each assignments as emp}
				{@const derived = deriveActualHours(emp.clock_in, emp.clock_out, emp.break_minutes ?? 0)}
				<div class="inq-emp-row" class:saving-row={inquerySaving === emp.employee_id}>
					<span class="inq-name">{emp.first_name} {emp.last_name[0]}.</span>
					<!-- Von–Bis (clock_in/clock_out) -->
					<div class="inq-times">
						<input
							class="inq-input inq-time"
							type="text"
							inputmode="decimal"
							placeholder="--:--"
							maxlength="5"
							value={fmtTime(emp.clock_in)}
							onblur={(e) => updateTimeField(emp.employee_id, 'clock_in', (e.target as HTMLInputElement).value)}
						/>
						<span class="inq-sep">–</span>
						<input
							class="inq-input inq-time"
							type="text"
							inputmode="decimal"
							placeholder="--:--"
							maxlength="5"
							value={fmtTime(emp.clock_out)}
							onblur={(e) => updateTimeField(emp.employee_id, 'clock_out', (e.target as HTMLInputElement).value)}
						/>
						{#if emp.actual_hours != null}
							<span class="hours-badge">{fmtHours(emp.actual_hours)}</span>
						{:else if derived != null}
							<span class="hours-badge hours-badge--derived">{fmtHours(derived)}</span>
						{/if}
					</div>
					<!-- Break minutes -->
					<input
						class="inq-input inq-break"
						type="text"
						inputmode="numeric"
						placeholder="0"
						maxlength="3"
						value={emp.break_minutes ?? 0}
						onblur={(e) => updateNumericField(emp.employee_id, 'break_minutes', (e.target as HTMLInputElement).value)}
					/>
					<button
						class="btn-icon danger"
						title="Entfernen"
						onclick={() => openRemoveDialog(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
					>
						<Trash2 size={13} />
					</button>
				</div>
			{/each}
			<div class="inq-total">
				{#if assignments.some((e) => e.actual_hours != null || (e.clock_in && e.clock_out))}
					{@const totalH = assignments.reduce((s, e) => {
						if (e.actual_hours != null) return s + e.actual_hours;
						const d = deriveActualHours(e.clock_in, e.clock_out, e.break_minutes ?? 0);
						return s + (d ?? 0);
					}, 0)}
					<span class="hours-badge">{fmtHours(totalH)} Ist</span>
				{:else}
					{assignments.length} Mitarbeiter zugewiesen
				{/if}
			</div>
		</div>
		{/if}
	{:else}
		<!-- ── Calendar-item mode: card list with explicit save ── -->
		<div class="emp-list">
			{#each assignments as emp}
				{@const s = editingEmp[emp.employee_id] ?? { planned: '0', actual: '', notes: '', clockIn: '', clockOut: '', breakMin: '0', transportMode: '', travelCosts: '', accommodation: '', miscCosts: '', mealDeduction: '' }}
				{@const derived = deriveActualHours(s.clockIn || null, s.clockOut || null, parseInt(s.breakMin) || 0)}
				<div class="emp-row">
					<div class="emp-name">{emp.first_name} {emp.last_name}</div>
					<div class="emp-fields">
						<label class="tiny-label">Von</label>
						<input class="time-input" type="text" inputmode="decimal" placeholder="--:--" maxlength="5"
							value={s.clockIn}
							oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, clockIn: (e.target as HTMLInputElement).value } }; }}
						/>
						<span class="sep">–</span>
						<label class="tiny-label">Bis</label>
						<input class="time-input" type="text" inputmode="decimal" placeholder="--:--" maxlength="5"
							value={s.clockOut}
							oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, clockOut: (e.target as HTMLInputElement).value } }; }}
						/>
						{#if s.actual !== ''}
							<span class="hours-badge">{fmtHours(parseFloat(s.actual))}</span>
						{:else if derived != null}
							<span class="hours-badge hours-badge--derived">{fmtHours(derived)}</span>
						{/if}
						<label class="tiny-label" style="margin-left:0.5rem">P.min</label>
						<input class="break-input" type="text" inputmode="numeric" placeholder="0" maxlength="3"
							value={s.breakMin}
							oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, breakMin: (e.target as HTMLInputElement).value } }; }}
						/>
						<label class="tiny-label" style="margin-left:0.5rem">Notiz</label>
						<input
							class="notes-input"
							type="text"
							value={s.notes}
							oninput={(e) => {
								editingEmp = {
									...editingEmp,
									[emp.employee_id]: {
										...s,
										notes: (e.target as HTMLInputElement).value
									}
								};
							}}
						/>
						{#if hasPauschale}
							<label class="tiny-label" style="margin-left:0.5rem">Transport</label>
							<select
								class="break-input"
								style="width:80px"
								value={s.transportMode}
								onchange={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, transportMode: (e.target as HTMLSelectElement).value } }; }}
							>
								<option value="">—</option>
								<option value="PKW">PKW</option>
								<option value="Bahn">Bahn</option>
								<option value="Flugzeug">Flugzeug</option>
								<option value="Taxi">Taxi</option>
								<option value="Sonstiges">Sonstiges</option>
							</select>
							<label class="tiny-label" style="margin-left:0.5rem">Fahrtk. (€)</label>
							<input class="break-input" type="text" inputmode="numeric" placeholder="0" maxlength="5"
								value={s.travelCosts}
								oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, travelCosts: (e.target as HTMLInputElement).value } }; }}
							/>
							<label class="tiny-label" style="margin-left:0.5rem">Übern. (€)</label>
							<input class="break-input" type="text" inputmode="numeric" placeholder="0" maxlength="5"
								value={s.accommodation}
								oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, accommodation: (e.target as HTMLInputElement).value } }; }}
							/>
							<label class="tiny-label" style="margin-left:0.5rem">Sonst. (€)</label>
							<input class="break-input" type="text" inputmode="numeric" placeholder="0" maxlength="5"
								value={s.miscCosts}
								oninput={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, miscCosts: (e.target as HTMLInputElement).value } }; }}
							/>
							<label class="tiny-label" style="margin-left:0.5rem">Abzug</label>
							<select
								class="break-input"
								style="width:90px"
								value={s.mealDeduction}
								onchange={(e) => { editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, mealDeduction: (e.target as HTMLSelectElement).value } }; }}
							>
								<option value="">—</option>
								<option value="breakfast">Frühstück</option>
								<option value="lunch">Mittag</option>
								<option value="dinner">Abend</option>
								<option value="breakfast_lunch">Frühstück + Mittag</option>
								<option value="breakfast_dinner">Frühstück + Abend</option>
								<option value="lunch_dinner">Mittag + Abend</option>
								<option value="all">Alle</option>
							</select>
						{/if}
					</div>
					<div class="emp-actions">
						<button
							class="btn-icon btn-save"
							onclick={() => handleSaveEmp(emp.employee_id)}
							disabled={savingEmp[emp.employee_id]}
							title="Speichern"
						>
							<Check size={14} />
						</button>
						<button
							class="btn-icon btn-remove"
							onclick={() =>
								openRemoveDialog(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
							disabled={savingEmp[emp.employee_id]}
							title="Entfernen"
						>
							<X size={14} />
						</button>
					</div>
				</div>
			{/each}
		</div>
		{#if assignments.length > 1}
			<div class="save-all-row">
				<button class="btn btn-sm btn-primary" onclick={handleSaveAll} disabled={savingAll}>
					{savingAll ? '...' : 'Alle speichern'}
				</button>
			</div>
		{/if}
	{/if}

	<!-- Add employee form (modal overlay) -->
	{#if showAddForm}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={() => (showAddForm = false)}>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="modal" onclick={(e) => e.stopPropagation()}>
				<h2>Mitarbeiter zuweisen</h2>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleAdd();
					}}
				>
					<div class="field" style="margin-bottom:0.75rem">
						<label for="emp-select">Mitarbeiter</label>
						<select id="emp-select" bind:value={addEmployeeId}>
							{#each unassigned() as emp}
								<option value={emp.id}>{emp.first_name} {emp.last_name} ({emp.email})</option>
							{/each}
						</select>
					</div>
					<div class="field" style="margin-bottom:0.75rem">
						<label for="emp-notes">Notizen</label>
						<input id="emp-notes" type="text" bind:value={addNotes} placeholder="Optional" />
					</div>
					<div class="modal-actions">
						<button type="button" class="btn-cancel" onclick={() => (showAddForm = false)}>
							Abbrechen
						</button>
						<button type="submit" class="btn-primary" disabled={adding || !addEmployeeId}>
							{#if adding}
								<svg
									class="spinner"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<circle
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-dasharray="31.4 31.4"
									/>
								</svg>
							{/if}
							Zuweisen
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>

<ConfirmationDialog
	bind:open={showRemoveDialog}
	title="Mitarbeiter entfernen"
	message={pendingRemove ? `${pendingRemove.name} aus diesem Eintrag entfernen?` : ''}
	confirmLabel="Entfernen"
	loading={removingEmp}
	onConfirm={handleRemoveEmp}
	onCancel={() => { pendingRemove = null; }}
/>

<style>
	.emp-panel {
		/* Wrapper — the parent page provides the .card container */
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.empty-hint {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-align: center;
		padding: 1rem 0;
		margin: 0;
	}

	.hours-badge {
		display: inline-block;
		font-size: 0.6875rem;
		background: #e0e7ff;
		color: #4338ca;
		border-radius: 999px;
		padding: 0.1rem 0.4rem;
		margin-left: 0.25rem;
		font-weight: 600;
	}

	.btn-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		border: none;
		background: transparent;
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.btn-icon.danger:hover,
	.btn-remove:hover {
		color: var(--dt-secondary);
		background: var(--dt-surface-container);
	}

	.btn-icon.btn-save:hover {
		color: #15803d;
		background: var(--dt-surface-container);
	}

	.saving-row {
		opacity: 0.6;
		pointer-events: none;
	}

	/* ── Card list (both modes) ── */

	.emp-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.emp-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		flex-wrap: wrap;
	}

	.emp-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		min-width: 120px;
	}

	.emp-fields {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		flex: 1;
	}

	.tiny-label {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.hour-input {
		width: 64px;
		padding: 0.25rem 0.375rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		outline: none;
		transition: border-color var(--dt-transition);
	}

	.hour-input:focus {
		border-bottom-color: var(--dt-primary);
	}

	.notes-input {
		flex: 1;
		min-width: 80px;
		padding: 0.25rem 0.375rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		outline: none;
		transition: border-color var(--dt-transition);
	}

	.notes-input:focus {
		border-bottom-color: var(--dt-primary);
	}

	.emp-actions {
		display: flex;
		gap: 0.25rem;
	}

	.save-all-row {
		display: flex;
		justify-content: flex-end;
		padding: 0.5rem 0.75rem 0.75rem;
	}

	/* ── Spinner ── */

	.spinner {
		width: 16px;
		height: 16px;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}

	/* ── Inquiry mode: compact rows ── */

	.inq-emp-list {
		display: flex;
		flex-direction: column;
	}

	.inq-emp-header {
		display: grid;
		grid-template-columns: minmax(60px, 1fr) 1fr 36px 24px;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		border-bottom: 1px solid var(--dt-outline-variant);
		margin-bottom: 0.25rem;
	}

	.inq-emp-row {
		display: grid;
		grid-template-columns: minmax(60px, 1fr) 1fr 36px 24px;
		gap: 0.25rem;
		align-items: center;
		padding: 0.3rem 0.5rem;
		border-radius: var(--dt-radius-sm);
		transition: background var(--dt-transition);
	}

	.inq-emp-row:hover {
		background: var(--dt-surface-container-low);
	}

	.inq-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.inq-input {
		padding: 0.2rem 0.3rem;
		border: 1px solid var(--dt-outline-variant);
		border-radius: 4px;
		background: var(--dt-surface-container-high);
		font-size: 0.8125rem;
		outline: none;
		transition: border-color var(--dt-transition);
		width: 100%;
		box-sizing: border-box;
	}

	.inq-input:focus {
		border-color: var(--dt-primary);
	}


	.inq-times {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.inq-time {
		width: 56px;
		text-align: center;
		flex-shrink: 0;
	}

	.inq-sep {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		flex-shrink: 0;
	}

	.inq-break {
		width: 36px;
		text-align: center;
	}

	/* ── Inquiry multi-day summary ── */
	.inq-summary-header {
		display: grid;
		grid-template-columns: 1fr 2.5rem 5rem;
		gap: 0.25rem;
		padding: 0.25rem 0.5rem;
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		border-bottom: 1px solid var(--dt-outline-variant);
		margin-bottom: 0.25rem;
	}

	.inq-summary-row {
		display: grid;
		grid-template-columns: 1fr 2.5rem 5rem;
		gap: 0.25rem;
		align-items: center;
		padding: 0.3rem 0.5rem;
		border-radius: var(--dt-radius-sm);
	}

	.inq-multiday-hint {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		padding: 0.375rem 0.5rem 0;
		margin: 0;
	}

	.inq-summary-row:hover {
		background: var(--dt-surface-container-low);
	}

	.inq-days {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		text-align: center;
	}

	.inq-hours {
		display: flex;
		align-items: center;
	}

	.inq-muted {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.inq-total {
		padding: 0.375rem 0.5rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		border-top: 1px solid var(--dt-outline-variant);
		margin-top: 0.25rem;
	}

	/* Calendar-item mode: additional time inputs */
	.time-input {
		width: 52px;
		padding: 0.2rem 0.25rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		outline: none;
		text-align: center;
		transition: border-color var(--dt-transition);
	}

	.time-input:focus {
		border-bottom-color: var(--dt-primary);
	}

	.break-input {
		width: 40px;
		padding: 0.2rem 0.25rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		outline: none;
		text-align: center;
		transition: border-color var(--dt-transition);
	}

	.break-input:focus {
		border-bottom-color: var(--dt-primary);
	}

	.sep {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		flex-shrink: 0;
	}

	.hours-badge--derived {
		background: #f0fdf4;
		color: #15803d;
	}
</style>
