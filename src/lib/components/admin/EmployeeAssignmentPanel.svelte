<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { Loader } from 'lucide-svelte';
	import { apiGet, apiPost, apiPatch, apiDelete } from '$lib/utils/api.svelte';
	import { normalizeTimeInput } from '$lib/utils/format';
	import { breakHoursToMinutes, breakMinutesToHours } from '$lib/utils/time';
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
		inquiryId = undefined,
		preferredDate = undefined,
		hasPauschale = false,
		onUpdated = undefined
	}: {
		entityId: string;
		entityType: 'inquiry' | 'calendar_item' | 'appointment';
		/** Required for `appointment` mode — the inquiry that owns the appointment. */
		inquiryId?: string | null;
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
			: entityType === 'appointment'
				? `/api/v1/inquiries/${inquiryId}/appointments/${entityId}/employees`
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
	let addNotes = $state('');
	let adding = $state(false);

	// Per-row inline edit state (calendar_item mode)
	let editingEmp = $state<Record<string, {
		actual: string; notes: string;
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
						actual: e.actual_hours != null ? String(e.actual_hours) : '',
						notes: e.notes ?? '',
						clockIn: fmtTime(e.clock_in),
						clockOut: fmtTime(e.clock_out),
						breakMin: breakMinutesToHours(e.break_minutes ?? 0),
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
	 * PATCHes a time field for an inquiry assignment on input blur.
	 *
	 * Called by: Template (time inputs onblur, inquiry mode).
	 * Purpose: PATCH /api/v1/inquiries/{id}/employees/{emp_id} with HH:MM:SS value.
	 *
	 * @param empId - Employee UUID.
	 * @param field - One of start_time | end_time | clock_in | clock_out.
	 * @param time  - HH:MM string from the input (seconds appended automatically).
	 * @returns true when the save succeeded — callers revert the input on false,
	 *          so a rejected value can never sit in the field looking "saved".
	 */
	async function updateTimeField(empId: string, field: string, time: string): Promise<boolean> {
		inquerySaving = empId;
		try {
			const value = normalizeTimeInput(time);
			const updated = await apiPatch<EmployeeAssignment>(`${baseUrl}/${empId}`, { [field]: value });
			const idx = assignments.findIndex((e) => e.employee_id === empId);
			if (idx !== -1) assignments[idx] = { ...assignments[idx], ...updated };
			return true;
		} catch (e: unknown) {
			showToast(
				`Zeit nicht gespeichert: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`,
				'error'
			);
			return false;
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
			// Break is typed as decimal hours but persisted as integer minutes.
			const num = field === 'break_minutes' ? breakHoursToMinutes(value) : (value !== '' ? parseFloat(value) : null);
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
				actual_hours: s.actual !== '' ? parseFloat(s.actual) : null,
				notes: s.notes || null,
				clock_in: normalizeTimeInput(s.clockIn),
				clock_out: normalizeTimeInput(s.clockOut),
				break_minutes: breakHoursToMinutes(s.breakMin),
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

{#snippet hours(h: number, derived = false)}
	<span
		class="num inline-flex h-5 items-center rounded-xs px-1.5 text-[11px] whitespace-nowrap {derived
			? 'border border-dashed border-line-strong text-muted'
			: 'bg-ok/12 text-ok'}"
		title={derived ? 'aus Von–Bis berechnet' : 'erfasst'}>{fmtHours(h)}</span
	>
{/snippet}

<!-- Small inline time/number cell; the class names inq-* are test hooks. -->
{#snippet cell(cls: string, value: string, onblur: (el: HTMLInputElement) => void, label: string, width = 'w-16')}
	<input
		class="{cls} num h-8 rounded-sm border border-line bg-transparent px-2 text-center text-[13px] outline-none hover:border-line-strong focus:border-fg {width}"
		type="text"
		inputmode="decimal"
		placeholder={cls.includes('break') ? '0' : '--:--'}
		maxlength="5"
		aria-label={label}
		{value}
		onblur={(e) => onblur(e.target as HTMLInputElement)}
	/>
{/snippet}

<!-- Container queries, not viewport breakpoints: the panel also lives in the narrow calendar
     side panel on a wide screen, where the desktop grid squeezed names under the time inputs. -->
<div class="@container flex flex-col gap-3">
	<div class="flex items-center justify-between gap-3">
		<h4 class="text-sm font-medium">Zugewiesen <span class="num text-faint">({assignments.length})</span></h4>
		{#if !showAddForm}
			<Button size="sm" onclick={openAddForm} disabled={unassigned().length === 0}><Plus size={14} /> Zuweisen</Button>
		{/if}
	</div>

	{#if loadingPanel}
		<p class="text-sm text-muted">Laden …</p>
	{:else if assignments.length === 0}
		<p class="rounded-sm border border-dashed border-line-strong px-3 py-4 text-center text-[13px] text-muted">
			Noch keine Mitarbeiter zugewiesen.
		</p>
	{:else if entityType !== 'calendar_item'}
		{#if isMultiDay}
			<div class="rounded-sm border border-line">
				<div class="label-xs hidden grid-cols-[minmax(0,1fr)_60px_100px] gap-3 border-b border-line px-3 py-2 text-faint @lg:grid">
					<span>Name</span><span class="text-right">Tage</span><span class="text-right">Stunden Ist</span>
				</div>
				{#each employeeSummaries() as emp (emp.employee_id)}
					<div class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0 @lg:grid-cols-[minmax(0,1fr)_60px_100px]">
						<span class="font-medium">{emp.first_name} {emp.last_name[0]}.</span>
						<span class="num text-right text-muted"><span class="@lg:hidden">Tage </span>{emp.day_count}</span>
						<span class="text-right">
							{#if emp.total_hours != null}{@render hours(emp.total_hours)}{:else}<span class="text-faint">—</span>{/if}
						</span>
					</div>
				{/each}
			</div>
			<div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
				<span>
					{#if employeeSummaries().some((e) => e.total_hours != null)}
						{@render hours(employeeSummaries().reduce((s, e) => s + (e.total_hours ?? 0), 0))} Ist gesamt
					{:else}
						{employeeSummaries().length} Mitarbeiter · {assignments.length} Einträge
					{/if}
				</span>
				<span>Mehrtägig — Zuweisung über den Kalender bearbeiten</span>
			</div>
		{:else}
			<div class="rounded-sm border border-line">
				<div class="label-xs hidden grid-cols-[minmax(0,1fr)_auto_80px_36px] gap-3 border-b border-line px-3 py-2 text-faint @lg:grid">
					<span>Name</span><span>Von–Bis</span><span>Pause (h)</span><span></span>
				</div>
				{#each assignments as emp (emp.employee_id)}
					{@const derived = deriveActualHours(emp.clock_in, emp.clock_out, emp.break_minutes ?? 0)}
					<div
						class="grid grid-cols-[minmax(0,1fr)_36px] items-center gap-x-3 gap-y-2 border-b border-line px-3 py-2 last:border-b-0 @lg:grid-cols-[minmax(0,1fr)_auto_80px_36px] {inquerySaving ===
						emp.employee_id
							? 'opacity-60'
							: ''}"
					>
						<span class="text-sm font-medium">{emp.first_name} {emp.last_name[0]}.</span>
						<span class="flex items-center gap-1.5 @max-lg:order-3 @max-lg:col-span-2">
							{@render cell(
								'inq-time',
								fmtTime(emp.clock_in),
								async (el) => {
									if (!(await updateTimeField(emp.employee_id, 'clock_in', el.value))) el.value = fmtTime(emp.clock_in);
								},
								'Von'
							)}
							<span class="text-faint">–</span>
							{@render cell(
								'inq-time',
								fmtTime(emp.clock_out),
								async (el) => {
									if (!(await updateTimeField(emp.employee_id, 'clock_out', el.value))) el.value = fmtTime(emp.clock_out);
								},
								'Bis'
							)}
							{#if emp.actual_hours != null}{@render hours(emp.actual_hours)}{:else if derived != null}{@render hours(
									derived,
									true
								)}{/if}
							<span class="ml-auto flex items-center gap-1.5 text-xs text-faint @lg:hidden">
								Pause
								{@render cell(
									'inq-break',
									breakMinutesToHours(emp.break_minutes ?? 0),
									(el) => updateNumericField(emp.employee_id, 'break_minutes', el.value),
									'Pause (h)',
									'w-14'
								)}
							</span>
						</span>
						<span class="hidden @lg:block">
							{@render cell(
								'inq-break',
								breakMinutesToHours(emp.break_minutes ?? 0),
								(el) => updateNumericField(emp.employee_id, 'break_minutes', el.value),
								'Pause (h)'
							)}
						</span>
						<Button
							variant="ghost"
							size="icon-sm"
							class="hover:text-danger @max-lg:order-2"
							aria-label="Entfernen"
							onclick={() => openRemoveDialog(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
						>
							<Trash2 size={13} />
						</Button>
					</div>
				{/each}
			</div>
			<div class="text-xs text-muted">
				{#if assignments.some((e) => e.actual_hours != null || (e.clock_in && e.clock_out))}
					{@const totalH = assignments.reduce((s, e) => {
						if (e.actual_hours != null) return s + e.actual_hours;
						const d = deriveActualHours(e.clock_in, e.clock_out, e.break_minutes ?? 0);
						return s + (d ?? 0);
					}, 0)}
					{@render hours(totalH)} Ist
				{:else}
					{assignments.length} Mitarbeiter zugewiesen
				{/if}
			</div>
		{/if}
	{:else}
		<!-- Calendar-item mode: every field editable, explicit save per row -->
		<div class="flex flex-col gap-2">
			{#each assignments as emp (emp.employee_id)}
				{@const s = editingEmp[emp.employee_id] ?? {
					actual: '',
					notes: '',
					clockIn: '',
					clockOut: '',
					breakMin: '0',
					transportMode: '',
					travelCosts: '',
					accommodation: '',
					miscCosts: '',
					mealDeduction: ''
				}}
				{@const derived = deriveActualHours(s.clockIn || null, s.clockOut || null, breakHoursToMinutes(s.breakMin))}
				{@const set = (patch: Partial<typeof s>) => {
					editingEmp = { ...editingEmp, [emp.employee_id]: { ...s, ...patch } };
				}}
				{@const small =
					'num h-8 rounded-sm border border-line bg-transparent px-2 text-[13px] outline-none hover:border-line-strong focus:border-fg'}
				<div class="flex flex-col gap-2 rounded-sm border border-line p-3">
					<div class="flex items-center justify-between gap-2">
						<span class="text-sm font-medium">{emp.first_name} {emp.last_name}</span>
						<span class="flex gap-1">
							<Button
								variant="ghost"
								size="icon-sm"
								onclick={() => handleSaveEmp(emp.employee_id)}
								disabled={savingEmp[emp.employee_id]}
								aria-label="Speichern"
								title="Speichern"
							>
								<Check size={14} />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								class="hover:text-danger"
								onclick={() => openRemoveDialog(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
								disabled={savingEmp[emp.employee_id]}
								aria-label="Entfernen"
								title="Entfernen"
							>
								<X size={14} />
							</Button>
						</span>
					</div>
					<div class="flex flex-wrap items-end gap-x-3 gap-y-2 text-xs text-faint">
						<label class="flex flex-col gap-1" for="ci-{emp.employee_id}">
							Von
							<input
								id="ci-{emp.employee_id}"
								class="{small} w-16 text-center text-fg"
								type="text"
								inputmode="decimal"
								placeholder="--:--"
								maxlength="5"
								value={s.clockIn}
								oninput={(e) => set({ clockIn: (e.target as HTMLInputElement).value })}
							/>
						</label>
						<label class="flex flex-col gap-1" for="co-{emp.employee_id}">
							Bis
							<input
								id="co-{emp.employee_id}"
								class="{small} w-16 text-center text-fg"
								type="text"
								inputmode="decimal"
								placeholder="--:--"
								maxlength="5"
								value={s.clockOut}
								oninput={(e) => set({ clockOut: (e.target as HTMLInputElement).value })}
							/>
						</label>
						<span class="pb-1.5">
							{#if s.actual !== ''}{@render hours(parseFloat(s.actual))}{:else if derived != null}{@render hours(derived, true)}{/if}
						</span>
						<label class="flex flex-col gap-1" for="brk-{emp.employee_id}">
							Pause (h)
							<input
								id="brk-{emp.employee_id}"
								class="{small} w-14 text-center text-fg"
								type="text"
								inputmode="decimal"
								placeholder="0"
								maxlength="5"
								value={s.breakMin}
								oninput={(e) => set({ breakMin: (e.target as HTMLInputElement).value })}
							/>
						</label>
						<label class="flex min-w-40 flex-1 flex-col gap-1" for="note-{emp.employee_id}">
							Notiz
							<input
								id="note-{emp.employee_id}"
								class="{small} w-full font-sans text-fg"
								type="text"
								value={s.notes}
								oninput={(e) => set({ notes: (e.target as HTMLInputElement).value })}
							/>
						</label>
					</div>
					{#if hasPauschale}
						<div class="flex flex-wrap items-end gap-x-3 gap-y-2 border-t border-line pt-2 text-xs text-faint">
							<label class="flex flex-col gap-1" for="trns-{emp.employee_id}">
								Transport
								<select
									id="trns-{emp.employee_id}"
									class="{small} w-24 bg-panel font-sans text-fg"
									value={s.transportMode}
									onchange={(e) => set({ transportMode: (e.target as HTMLSelectElement).value })}
								>
									<option value="">—</option>
									<option value="PKW">PKW</option>
									<option value="Bahn">Bahn</option>
									<option value="Flugzeug">Flugzeug</option>
									<option value="Taxi">Taxi</option>
									<option value="Sonstiges">Sonstiges</option>
								</select>
							</label>
							{#each [['trvl', 'Fahrtk. (€)', 'travelCosts'], ['acmd', 'Übern. (€)', 'accommodation'], ['misc', 'Sonst. (€)', 'miscCosts']] as const as [id, label, key] (id)}
								<label class="flex flex-col gap-1" for="{id}-{emp.employee_id}">
									{label}
									<input
										id="{id}-{emp.employee_id}"
										class="{small} w-20 text-right text-fg"
										type="text"
										inputmode="numeric"
										placeholder="0"
										maxlength="5"
										value={s[key]}
										oninput={(e) => set({ [key]: (e.target as HTMLInputElement).value })}
									/>
								</label>
							{/each}
							<label class="flex flex-col gap-1" for="meal-{emp.employee_id}">
								Abzug
								<select
									id="meal-{emp.employee_id}"
									class="{small} w-40 bg-panel font-sans text-fg"
									value={s.mealDeduction}
									onchange={(e) => set({ mealDeduction: (e.target as HTMLSelectElement).value })}
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
							</label>
						</div>
					{/if}
				</div>
			{/each}
		</div>
		{#if assignments.length > 1}
			<Button size="sm" variant="solid" class="self-end" onclick={handleSaveAll} disabled={savingAll}>
				{savingAll ? '…' : 'Alle speichern'}
			</Button>
		{/if}
	{/if}
</div>

{#if showAddForm}
	<Modal title="Mitarbeiter zuweisen" size="sm" onclose={() => (showAddForm = false)}>
		<form
			id="emp-add-form"
			class="flex flex-col gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				handleAdd();
			}}
		>
			<Field label="Mitarbeiter" for="emp-select">
				<Select id="emp-select" bind:value={addEmployeeId}>
					{#each unassigned() as emp (emp.id)}
						<option value={emp.id}>{emp.first_name} {emp.last_name} ({emp.email})</option>
					{/each}
				</Select>
			</Field>
			<Field label="Notizen" for="emp-notes"><Input id="emp-notes" bind:value={addNotes} placeholder="Optional" /></Field>
		</form>
		{#snippet footer()}
			<Button onclick={() => (showAddForm = false)}>Abbrechen</Button>
			<Button type="submit" form="emp-add-form" variant="solid" disabled={adding || !addEmployeeId}>
				{#if adding}<Loader size={15} class="animate-spin" />{/if}
				Zuweisen
			</Button>
		{/snippet}
	</Modal>
{/if}

<ConfirmationDialog
	bind:open={showRemoveDialog}
	title="Mitarbeiter entfernen"
	message={pendingRemove ? `${pendingRemove.name} aus diesem Eintrag entfernen?` : ''}
	confirmLabel="Entfernen"
	loading={removingEmp}
	onConfirm={handleRemoveEmp}
	onCancel={() => {
		pendingRemove = null;
	}}
/>
