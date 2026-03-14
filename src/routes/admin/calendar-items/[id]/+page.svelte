<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiPatch, apiDelete, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { ArrowLeft, Save, Trash2, Plus, X, Check } from 'lucide-svelte';

	interface CalendarItemDetail {
		id: string;
		title: string;
		description: string | null;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		duration_hours: number;
		status: string;
		created_at: string;
		employees: EmployeeAssignment[];
	}

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		planned_hours: number;
		actual_hours: number | null;
		notes: string | null;
	}

	interface EmployeeOption {
		id: string;
		first_name: string;
		last_name: string;
	}

	let data = $state<CalendarItemDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editCategory = $state('internal');
	let editDate = $state('');
	let editDuration = $state('0');
	let editLocation = $state('');
	let editDescription = $state('');
	let editStatus = $state('scheduled');

	// Employee assignment
	let allEmployees = $state<EmployeeOption[]>([]);
	let addEmployeeId = $state('');
	let addPlannedHours = $state('0');
	let addingEmployee = $state(false);

	// Inline edit state per assigned employee
	let editingEmp = $state<Record<string, { planned: string; actual: string; notes: string }>>({});
	let savingEmp = $state<Record<string, boolean>>({});
	let removingEmp = $state<Record<string, boolean>>({});

	$effect(() => {
		const id = $page.params.id;
		if (id) {
			loadItem(id);
			loadAllEmployees();
		}
	});

	/**
	 * Loads the calendar item detail from the API.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Fetches item + assigned employees from GET /admin/calendar-items/{id}.
	 */
	async function loadItem(id: string) {
		loading = true;
		try {
			const res = await apiGet<CalendarItemDetail>(`/api/v1/admin/calendar-items/${id}`);
			data = res;
			editTitle = res.title;
			editCategory = res.category;
			editDate = res.scheduled_date ?? '';
			editDuration = String(res.duration_hours);
			editLocation = res.location ?? '';
			editDescription = res.description ?? '';
			editStatus = res.status;
			// Seed inline edit state
			const empState: typeof editingEmp = {};
			for (const e of res.employees) {
				empState[e.employee_id] = {
					planned: String(e.planned_hours),
					actual: e.actual_hours != null ? String(e.actual_hours) : '',
					notes: e.notes ?? ''
				};
			}
			editingEmp = empState;
		} catch {
			showToast('Termin nicht gefunden', 'error');
			goto('/admin/calendar-items');
		} finally {
			loading = false;
		}
	}

	/**
	 * Loads all active employees for the assignment dropdown.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Populates the "Mitarbeiter hinzufügen" dropdown.
	 */
	async function loadAllEmployees() {
		try {
			const res = await apiGet<{ employees: EmployeeOption[] }>('/api/v1/admin/employees?active=true&limit=100');
			allEmployees = res.employees;
		} catch {
			allEmployees = [];
		}
	}

	/**
	 * Saves updated item fields via PATCH.
	 *
	 * Called by: Template (Save button).
	 * Purpose: Persists title, category, date, duration, location, description, status.
	 */
	async function handleSave() {
		if (!data) return;
		saving = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, {
				title: editTitle,
				category: editCategory,
				scheduled_date: editDate || null,
				duration_hours: parseFloat(editDuration) || 0,
				location: editLocation || null,
				description: editDescription || null,
				status: editStatus
			});
			data = { ...data, ...updated };
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			saving = false;
		}
	}

	/**
	 * Deletes the calendar item and navigates back to the list.
	 *
	 * Called by: Template (Delete button).
	 * Purpose: Removes the item permanently after confirmation.
	 */
	async function handleDelete() {
		if (!data || !confirm(`Termin "${data.title}" löschen?`)) return;
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${data.id}`);
			showToast('Termin gelöscht', 'success');
			goto('/admin/calendar-items');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Returns employees not yet assigned to this item.
	 *
	 * Called by: Template (assignment dropdown).
	 * Purpose: Prevents double-assigning the same employee.
	 */
	function unassignedEmployees(): EmployeeOption[] {
		if (!data) return allEmployees;
		const assigned = new Set(data.employees.map((e) => e.employee_id));
		return allEmployees.filter((e) => !assigned.has(e.id));
	}

	/**
	 * Assigns a new employee to this calendar item.
	 *
	 * Called by: Template (Hinzufügen button).
	 * Purpose: POSTs new assignment with planned hours.
	 */
	async function handleAddEmployee() {
		if (!data || !addEmployeeId) return;
		addingEmployee = true;
		try {
			await apiPost(`/api/v1/admin/calendar-items/${data.id}/employees`, {
				employee_id: addEmployeeId,
				planned_hours: parseFloat(addPlannedHours) || 0
			});
			addEmployeeId = '';
			addPlannedHours = '0';
			await loadItem(data.id);
			showToast('Mitarbeiter hinzugefügt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			addingEmployee = false;
		}
	}

	/**
	 * Saves inline edits (hours/notes) for an assigned employee.
	 *
	 * Called by: Template (save icon per assignment row).
	 * Purpose: PATCHes planned_hours, actual_hours, notes for the assignment.
	 *
	 * @param empId - The employee UUID to update
	 */
	async function handleSaveEmp(empId: string) {
		if (!data) return;
		savingEmp = { ...savingEmp, [empId]: true };
		const s = editingEmp[empId];
		try {
			await apiPatch(`/api/v1/admin/calendar-items/${data.id}/employees/${empId}`, {
				planned_hours: parseFloat(s.planned) || 0,
				actual_hours: s.actual !== '' ? parseFloat(s.actual) : null,
				notes: s.notes || null
			});
			await loadItem(data.id);
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			savingEmp = { ...savingEmp, [empId]: false };
		}
	}

	/**
	 * Removes an employee assignment from this calendar item.
	 *
	 * Called by: Template (× button per assignment row).
	 * Purpose: DELETEs the assignment after confirmation.
	 *
	 * @param empId - The employee UUID to remove
	 * @param name  - Employee display name for the confirm dialog
	 */
	async function handleRemoveEmp(empId: string, name: string) {
		if (!data || !confirm(`${name} aus diesem Termin entfernen?`)) return;
		removingEmp = { ...removingEmp, [empId]: true };
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${data.id}/employees/${empId}`);
			await loadItem(data.id);
			showToast('Mitarbeiter entfernt', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			removingEmp = { ...removingEmp, [empId]: false };
		}
	}
</script>

<svelte:head>
	<title>{data?.title ?? 'Termin'} | AUST Admin</title>
</svelte:head>

<div class="page-header">
	<button class="btn btn-back" onclick={() => goto('/admin/calendar-items')}>
		<ArrowLeft size={16} />
		Termine
	</button>
	{#if data}
		<div class="header-actions">
			<button class="btn btn-primary" onclick={handleSave} disabled={saving}>
				<Save size={16} />
				{saving ? 'Speichern...' : 'Speichern'}
			</button>
			<button class="btn btn-danger" onclick={handleDelete}>
				<Trash2 size={16} />
				Löschen
			</button>
		</div>
	{/if}
</div>

{#if loading}
	<div class="loading">Laden...</div>
{:else if data}
	<div class="layout">
		<!-- Edit form -->
		<div class="card">
			<div class="card-header"><h2>Details</h2></div>
			<div class="form-grid">
				<div class="field span-2">
					<label for="e-title">Titel</label>
					<input id="e-title" type="text" bind:value={editTitle} />
				</div>
				<div class="field">
					<label for="e-cat">Kategorie</label>
					<select id="e-cat" bind:value={editCategory}>
						<option value="internal">Intern</option>
						<option value="maintenance">Wartung</option>
						<option value="training">Schulung</option>
						<option value="other">Sonstiges</option>
					</select>
				</div>
				<div class="field">
					<label for="e-status">Status</label>
					<select id="e-status" bind:value={editStatus}>
						<option value="scheduled">Geplant</option>
						<option value="completed">Abgeschlossen</option>
						<option value="cancelled">Abgesagt</option>
					</select>
				</div>
				<div class="field">
					<label for="e-date">Datum</label>
					<input id="e-date" type="date" bind:value={editDate} />
				</div>
				<div class="field">
					<label for="e-dur">Dauer (h)</label>
					<input id="e-dur" type="number" step="0.5" min="0" bind:value={editDuration} />
				</div>
				<div class="field span-2">
					<label for="e-loc">Ort</label>
					<input id="e-loc" type="text" bind:value={editLocation} />
				</div>
				<div class="field span-2">
					<label for="e-desc">Beschreibung</label>
					<textarea id="e-desc" rows={3} bind:value={editDescription}></textarea>
				</div>
			</div>
			<div class="meta">Erstellt: {formatDate(data.created_at)}</div>
		</div>

		<!-- Employee assignment -->
		<div class="card">
			<div class="card-header"><h2>Mitarbeiter ({data.employees.length})</h2></div>

			{#if data.employees.length > 0}
				<div class="emp-list">
					{#each data.employees as emp}
						{@const s = editingEmp[emp.employee_id] ?? { planned: '0', actual: '', notes: '' }}
						<div class="emp-row">
							<div class="emp-name">{emp.first_name} {emp.last_name}</div>
							<div class="emp-fields">
								<label class="tiny-label">Geplant (h)</label>
								<input
									class="hour-input"
									type="number"
									step="0.5"
									min="0"
									value={s.planned}
									oninput={(e) => {
										editingEmp = {
											...editingEmp,
											[emp.employee_id]: { ...s, planned: (e.target as HTMLInputElement).value }
										};
									}}
								/>
								<label class="tiny-label">Ist (h)</label>
								<input
									class="hour-input"
									type="number"
									step="0.5"
									min="0"
									placeholder="—"
									value={s.actual}
									oninput={(e) => {
										editingEmp = {
											...editingEmp,
											[emp.employee_id]: { ...s, actual: (e.target as HTMLInputElement).value }
										};
									}}
								/>
								<label class="tiny-label">Notiz</label>
								<input
									class="notes-input"
									type="text"
									value={s.notes}
									oninput={(e) => {
										editingEmp = {
											...editingEmp,
											[emp.employee_id]: { ...s, notes: (e.target as HTMLInputElement).value }
										};
									}}
								/>
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
									onclick={() => handleRemoveEmp(emp.employee_id, `${emp.first_name} ${emp.last_name}`)}
									disabled={removingEmp[emp.employee_id]}
									title="Entfernen"
								>
									<X size={14} />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="muted">Noch keine Mitarbeiter zugewiesen.</p>
			{/if}

			<!-- Add employee -->
			{#if unassignedEmployees().length > 0}
				{@const available = unassignedEmployees()}
				<div class="add-emp">
					<h3>Mitarbeiter hinzufügen</h3>
					<div class="add-emp-row">
						<select bind:value={addEmployeeId} class="emp-select">
							<option value="">— Mitarbeiter wählen —</option>
							{#each available as e}
								<option value={e.id}>{e.first_name} {e.last_name}</option>
							{/each}
						</select>
						<input
							class="hour-input"
							type="number"
							step="0.5"
							min="0"
							placeholder="Stunden"
							bind:value={addPlannedHours}
						/>
						<button
							class="btn btn-primary"
							onclick={handleAddEmployee}
							disabled={!addEmployeeId || addingEmployee}
						>
							<Plus size={14} />
							{addingEmployee ? '...' : 'Hinzufügen'}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header-actions { display: flex; gap: 0.5rem; }

	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.card {
		background: #fff;
		border: 1px solid #f1f5f9;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.06);
	}

	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field { display: flex; flex-direction: column; gap: 0.25rem; }
	.field.span-2 { grid-column: span 2; }

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
	}

	.meta {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f1f5f9;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	/* Employee list */
	.emp-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem; }

	.emp-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f8fafc;
		border: 1px solid #f1f5f9;
		border-radius: 0.5rem;
	}

	.emp-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1e293b;
		width: 7rem;
		flex-shrink: 0;
		padding-top: 1.25rem;
	}

	.emp-fields {
		flex: 1;
		display: grid;
		grid-template-columns: auto 4rem auto 4rem auto 1fr;
		align-items: center;
		gap: 0.375rem;
	}

	.tiny-label {
		font-size: 0.6875rem;
		color: #94a3b8;
		font-weight: 600;
		white-space: nowrap;
	}

	.hour-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		width: 100%;
	}

	.notes-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		width: 100%;
	}

	.emp-actions { display: flex; flex-direction: column; gap: 0.25rem; padding-top: 1.25rem; }

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		background: #fff;
		cursor: pointer;
		transition: all 150ms;
	}

	.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-save:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; color: #16a34a; }
	.btn-remove:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; color: #dc2626; }

	.add-emp {
		border-top: 1px solid #f1f5f9;
		padding-top: 1rem;
		margin-top: 0.5rem;
	}

	.add-emp h3 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #64748b;
		margin: 0 0 0.625rem;
	}

	.add-emp-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.emp-select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.muted { color: #94a3b8; font-size: 0.875rem; margin: 0 0 1rem; }

	.loading { text-align: center; padding: 3rem; color: #94a3b8; }

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.btn:hover { background: #f8fafc; }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
	.btn-primary:hover:not(:disabled) { background: #4338ca; }
	.btn-back { color: #64748b; }
	.btn-back:hover { color: #1e293b; }
	.btn-danger { color: #dc2626; border-color: #fecaca; }
	.btn-danger:hover { background: #fef2f2; }

	@media (max-width: 900px) {
		.layout { grid-template-columns: 1fr; }
		.form-grid { grid-template-columns: 1fr; }
		.field.span-2 { grid-column: span 1; }
		.emp-fields { grid-template-columns: auto 4rem auto 4rem; }
	}
</style>
