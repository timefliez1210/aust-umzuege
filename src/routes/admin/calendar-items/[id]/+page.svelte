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
		start_time: string;
		end_time: string | null;
		duration_hours: number;
		status: string;
		created_at: string;
		customer_id: string | null;
		customer_name: string | null;
		employees: EmployeeAssignment[];
	}

	interface CustomerOption {
		id: string;
		name: string | null;
		email: string;
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
	let editStartTime = $state('09:00');
	let editEndTime = $state('');
	let editStatus = $state('scheduled');

	// Employee assignment
	let allEmployees = $state<EmployeeOption[]>([]);
	let addEmployeeId = $state('');
	let addPlannedHours = $state('0');
	let addingEmployee = $state(false);

	// Customer assignment
	let customerSearch = $state('');
	let customerResults = $state<CustomerOption[]>([]);
	let customerSearching = $state(false);
	let customerMode = $state<'view' | 'search' | 'create'>('view');
	let newCustEmail = $state('');
	let newCustName = $state('');
	let newCustPhone = $state('');
	let savingCustomer = $state(false);

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
				start_time: editStartTime ? (editStartTime.length === 5 ? editStartTime + ':00' : editStartTime) : undefined,
				end_time: editEndTime ? (editEndTime.length === 5 ? editEndTime + ':00' : editEndTime) : null,
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

	/**
	 * Searches customers by name or email for the customer assignment input.
	 *
	 * Called by: Template (oninput on customer search field)
	 * Purpose: Lets Alex find an existing customer to link to this Termin.
	 *
	 * @param q - Search query string
	 */
	async function searchCustomers(q: string) {
		if (q.trim().length < 2) { customerResults = []; return; }
		customerSearching = true;
		try {
			const res = await apiGet<{ customers: CustomerOption[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			customerResults = res.customers;
		} catch { customerResults = []; }
		finally { customerSearching = false; }
	}

	/**
	 * Assigns a customer (or creates a new one) to this calendar item via PATCH.
	 *
	 * Called by: Template (select from search results or create form submit)
	 * Purpose: Links a customer to the Termin so Alex knows which client this appointment is for.
	 *
	 * @param customerId - UUID of the existing or newly created customer
	 */
	async function assignCustomer(customerId: string) {
		if (!data) return;
		savingCustomer = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, { customer_id: customerId });
			data = { ...data, customer_id: updated.customer_id, customer_name: updated.customer_name };
			customerMode = 'view';
			customerSearch = '';
			customerResults = [];
			newCustEmail = ''; newCustName = ''; newCustPhone = '';
			showToast('Kunde zugewiesen', 'success');
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
	}

	/**
	 * Creates a new customer then immediately assigns them to this calendar item.
	 *
	 * Called by: Template (create form submit in customer section)
	 * Purpose: Allows Alex to register a new customer directly from the Termin detail page.
	 */
	async function createAndAssignCustomer() {
		if (!newCustEmail.trim()) { showToast('E-Mail ist erforderlich', 'error'); return; }
		savingCustomer = true;
		try {
			const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
				email: newCustEmail.trim(),
				name: newCustName.trim() || null,
				phone: newCustPhone.trim() || null,
			});
			await assignCustomer(c.id);
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
	}

	/**
	 * Removes the customer assignment from this calendar item.
	 *
	 * Called by: Template (× button on the current customer badge)
	 * Purpose: Clears the customer link when a Termin is no longer associated with a specific customer.
	 */
	async function removeCustomer() {
		if (!data) return;
		savingCustomer = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, { remove_customer: true });
			data = { ...data, customer_id: updated.customer_id, customer_name: updated.customer_name };
			showToast('Kunde entfernt', 'success');
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
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
					<label for="e-start">Startzeit *</label>
					<input id="e-start" type="time" bind:value={editStartTime} />
				</div>
				<div class="field">
					<label for="e-end">Endzeit</label>
					<input id="e-end" type="time" bind:value={editEndTime} />
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

		<!-- Customer assignment -->
		<div class="card">
			<div class="card-header"><h2>Kunde</h2></div>

			{#if data.customer_id}
				<div class="customer-assigned">
					<a href="/admin/customers/{data.customer_id}" class="customer-link">
						{data.customer_name ?? data.customer_id}
					</a>
					<button class="btn-icon btn-remove" onclick={removeCustomer} disabled={savingCustomer} title="Kunde entfernen">
						<X size={14} />
					</button>
				</div>
				<button class="btn-text" onclick={() => customerMode = customerMode === 'search' ? 'view' : 'search'}>
					Anderen Kunden zuweisen
				</button>
			{:else}
				<p class="muted">Kein Kunde zugewiesen.</p>
			{/if}

			{#if !data.customer_id || customerMode === 'search'}
				<div class="customer-mode-tabs">
					<button class="tab-btn" class:active={customerMode !== 'create'} onclick={() => { customerMode = 'search'; }}>Suchen</button>
					<button class="tab-btn" class:active={customerMode === 'create'} onclick={() => { customerMode = 'create'; }}>Neu anlegen</button>
				</div>

				{#if customerMode !== 'create'}
					<div class="customer-search">
						<input
							type="text"
							placeholder="Name oder E-Mail..."
							bind:value={customerSearch}
							oninput={(e) => searchCustomers((e.target as HTMLInputElement).value)}
						/>
						{#if customerSearching}<span class="muted" style="font-size:0.75rem">Suche...</span>{/if}
						{#if customerResults.length > 0}
							<div class="customer-results">
								{#each customerResults as c}
									<button class="customer-result-item" onclick={() => assignCustomer(c.id)} disabled={savingCustomer}>
										<span class="cr-name">{c.name ?? c.email}</span>
										{#if c.name}<span class="cr-email">{c.email}</span>{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div class="customer-create">
						<div class="field">
							<label for="nc-email">E-Mail *</label>
							<input id="nc-email" type="email" bind:value={newCustEmail} placeholder="kunde@example.com" />
						</div>
						<div class="field">
							<label for="nc-name">Name</label>
							<input id="nc-name" type="text" bind:value={newCustName} placeholder="Max Mustermann" />
						</div>
						<div class="field">
							<label for="nc-phone">Telefon</label>
							<input id="nc-phone" type="tel" bind:value={newCustPhone} placeholder="+49 ..." />
						</div>
						<button class="btn btn-primary" onclick={createAndAssignCustomer} disabled={savingCustomer}>
							{savingCustomer ? 'Wird erstellt...' : 'Kunde anlegen & zuweisen'}
						</button>
					</div>
				{/if}
			{/if}
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
	.layout > .card:first-child { grid-column: span 2; }

	/* Customer assignment */
	.customer-assigned { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
	.customer-link {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-primary);
		text-decoration: none;
		transition: color var(--dt-transition);
	}
	.customer-link:hover { color: var(--dt-secondary); text-decoration: underline; }
	.customer-mode-tabs {
		display: flex;
		gap: 0.25rem;
		margin: 0.75rem 0 0.5rem;
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-sm);
		padding: 0.2rem;
	}
	.tab-btn {
		padding: 0.3rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		border-radius: var(--dt-radius-sm);
		transition: background var(--dt-transition), color var(--dt-transition);
	}
	.tab-btn.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
		font-weight: 600;
	}
	.customer-search { display: flex; flex-direction: column; gap: 0.375rem; }
	.customer-search input {
		padding: 0.5rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		transition: var(--dt-transition);
	}
	.customer-search input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	.customer-results {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}
	.customer-result-item {
		display: flex;
		flex-direction: column;
		width: 100%;
		padding: 0.5rem 0.75rem;
		text-align: left;
		transition: background var(--dt-transition);
		color: var(--dt-on-surface);
	}
	.customer-result-item + .customer-result-item {
		border-top: 1px solid var(--dt-surface-container);
	}
	.customer-result-item:hover { background: var(--dt-surface-container-low); }
	.cr-name { font-size: 0.875rem; font-weight: 500; color: var(--dt-on-surface); }
	.cr-email { font-size: 0.75rem; color: var(--dt-on-surface-variant); }
	.customer-create { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
	.btn-text {
		font-size: 0.8125rem;
		color: var(--dt-secondary);
		padding: 0;
		text-decoration: underline;
		cursor: pointer;
		background: none;
		border: none;
		transition: color var(--dt-transition);
	}
	.btn-text:hover { color: var(--dt-on-secondary-container); }

	.card {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}

	.card-header {
		display: flex;
		align-items: center;
		padding: 0.875rem 1.25rem;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border-bottom: var(--dt-glass-border);
	}

	.card-header h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		margin: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		padding: 1.25rem;
	}

	.field { display: flex; flex-direction: column; gap: 0.25rem; }
	.field.span-2 { grid-column: span 2; }

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		font-family: inherit;
		color: var(--dt-on-surface);
		resize: vertical;
		outline: none;
		transition: var(--dt-transition);
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.meta {
		margin: 0 1.25rem 1.25rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-surface-container);
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	/* Employee list */
	.emp-list { display: flex; flex-direction: column; gap: 0.5rem; margin: 0 1.25rem 0.75rem; }

	.emp-row {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-md);
	}

	.emp-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
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
		color: var(--dt-on-surface-variant);
		font-weight: 600;
		white-space: nowrap;
	}

	.hour-input {
		padding: 0.3rem 0.4rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		width: 100%;
		transition: var(--dt-transition);
	}
	.hour-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.notes-input {
		padding: 0.3rem 0.4rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		width: 100%;
		transition: var(--dt-transition);
	}
	.notes-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.emp-actions { display: flex; flex-direction: column; gap: 0.25rem; padding-top: 1.25rem; }

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: all var(--dt-transition);
	}

	.btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-save:hover:not(:disabled) { background: #dcfce7; border-color: #86efac; color: #14532d; }
	.btn-remove:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }

	.add-emp {
		padding: 1rem 1.25rem;
		margin-top: 0;
		background: var(--dt-surface-container);
	}

	.add-emp h3 {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin: 0 0 0.625rem;
	}

	.add-emp-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.emp-select {
		flex: 1;
		padding: 0.5rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		font-family: inherit;
		color: var(--dt-on-surface);
		outline: none;
		transition: var(--dt-transition);
	}
	.emp-select:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.muted { color: var(--dt-on-surface-variant); font-size: 0.875rem; margin: 0 1.25rem 1rem; }

	.loading { text-align: center; padding: 3rem; color: var(--dt-on-surface-variant); }

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.btn:hover { background: var(--dt-surface-container-low); }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-primary {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--dt-primary-container), var(--dt-primary));
	}
	.btn-back { color: var(--dt-on-surface-variant); border: var(--dt-ghost-border); }
	.btn-back:hover { color: var(--dt-on-surface); background: var(--dt-surface-container-low); }
	.btn-danger {
		background: linear-gradient(135deg, var(--dt-secondary), #8a2e00);
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-danger:hover:not(:disabled) {
		background: linear-gradient(135deg, #8a2e00, var(--dt-secondary));
	}

	@media (max-width: 900px) {
		.layout { grid-template-columns: 1fr; }
		.layout > .card:first-child { grid-column: span 1; }
		.form-grid { grid-template-columns: 1fr; }
		.field.span-2 { grid-column: span 1; }
		.emp-fields { grid-template-columns: auto 4rem auto 4rem; }
	}
</style>
