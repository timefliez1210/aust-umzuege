<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface Employee {
		id: string;
		salutation: string | null;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		monthly_hours_target: number;
		active: boolean;
		planned_hours_month: number | null;
		actual_hours_month: number | null;
		created_at: string;
	}

	interface EmployeesResponse {
		employees: Employee[];
		total: number;
	}

	let employees = $state<Employee[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	// Month picker — defaults to current month
	let selectedMonth = $state(new Date().toISOString().slice(0, 7));

	// Create form state
	let showCreateForm = $state(false);
	let createSalutation = $state('');
	let createFirstName = $state('');
	let createLastName = $state('');
	let createEmail = $state('');
	let createPhone = $state('');
	let createTarget = $state('160');
	let createError = $state('');
	let createLoading = $state(false);

	const columns = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'email', label: 'E-Mail', sortable: true },
		{ key: 'phone', label: 'Telefon', width: '120px' },
		{ key: 'target', label: 'Ziel (h)', width: '80px' },
		{ key: 'planned', label: 'Geplant (h)', width: '90px' },
		{ key: 'actual', label: 'Ist (h)', width: '80px' },
		{ key: 'utilization', label: 'Auslastung', width: '100px' },
		{ key: 'status', label: 'Status', width: '80px' }
	];

	$effect(() => {
		loadEmployees();
	});

	/**
	 * Fetches a paginated, optionally filtered list of employees from the API.
	 *
	 * Called by: $effect (on mount and whenever searchQuery, offset, or selectedMonth changes)
	 * Purpose: Populates the DataTable with employee records including monthly hours.
	 */
	async function loadEmployees() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set('search', searchQuery);
			params.set('month', selectedMonth);
			params.set('limit', String(limit));
			params.set('offset', String(offset));
			params.set('active', 'true');
			const res = await apiGet<EmployeesResponse>(`/api/v1/admin/employees?${params}`);
			employees = res.employees;
			total = res.total;
		} catch {
			employees = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	/**
	 * Resets pagination and triggers a fresh search.
	 *
	 * Called by: Template (search input onkeydown Enter)
	 * Purpose: Start search from page 1.
	 */
	function handleSearch() {
		offset = 0;
		loadEmployees();
	}

	/**
	 * Navigate to previous page.
	 *
	 * Called by: Template (prev page button)
	 * Purpose: Offset-based pagination backward.
	 */
	function prevPage() {
		if (offset >= limit) {
			offset -= limit;
			loadEmployees();
		}
	}

	/**
	 * Navigate to next page.
	 *
	 * Called by: Template (next page button)
	 * Purpose: Offset-based pagination forward.
	 */
	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadEmployees();
		}
	}

	/**
	 * Handles month picker change.
	 *
	 * Called by: Template (month input onchange)
	 * Purpose: Reloads employees with hours for the newly selected month.
	 */
	function onMonthChange() {
		offset = 0;
		loadEmployees();
	}

	/**
	 * Creates a new employee via the API.
	 *
	 * Called by: Template (create form submit)
	 * Purpose: Registers a new employee in the system.
	 */
	async function handleCreate() {
		createError = '';
		if (!createFirstName.trim() || !createLastName.trim() || !createEmail.trim()) {
			createError = 'Vorname, Nachname und E-Mail sind Pflichtfelder.';
			return;
		}
		createLoading = true;
		try {
			await apiPost('/api/v1/admin/employees', {
				salutation: createSalutation || null,
				first_name: createFirstName.trim(),
				last_name: createLastName.trim(),
				email: createEmail.trim(),
				phone: createPhone.trim() || null,
				monthly_hours_target: parseFloat(createTarget) || 160
			});
			showToast('Mitarbeiter erstellt', 'success');
			showCreateForm = false;
			createSalutation = '';
			createFirstName = '';
			createLastName = '';
			createEmail = '';
			createPhone = '';
			createTarget = '160';
			loadEmployees();
		} catch (e: unknown) {
			createError = e instanceof Error ? e.message : 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	/**
	 * Calculates utilization percentage.
	 *
	 * Called by: Template (row rendering)
	 * Purpose: Shows how much of the monthly target is planned/used.
	 *
	 * Math: utilization = (planned_hours / target) * 100
	 */
	function utilization(emp: Employee): number | null {
		if (emp.planned_hours_month == null || emp.monthly_hours_target <= 0) return null;
		return Math.round((emp.planned_hours_month / emp.monthly_hours_target) * 100);
	}
</script>

<svelte:head>
	<title>Mitarbeiter | AUST Admin</title>
</svelte:head>

<div class="page-header">
	<div class="page-header-left">
		<h1>Mitarbeiter</h1>
		{#if total > 0}
			<span class="count-badge">{total}</span>
		{/if}
	</div>
	<button class="btn btn-primary" onclick={() => (showCreateForm = true)}>
		<Plus size={16} />
		Neuer Mitarbeiter
	</button>
</div>

<!-- Toolbar -->
<div class="toolbar">
	<div class="search-box">
		<Search size={16} />
		<input
			type="text"
			placeholder="Suchen..."
			bind:value={searchQuery}
			onkeydown={(e) => e.key === 'Enter' && handleSearch()}
		/>
	</div>
	<div class="month-picker">
		<label for="month-select">Monat:</label>
		<input
			id="month-select"
			type="month"
			bind:value={selectedMonth}
			onchange={onMonthChange}
		/>
	</div>
</div>

<!-- Create Modal -->
{#if showCreateForm}
	<div class="modal-overlay" onclick={() => (showCreateForm = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>Neuer Mitarbeiter</h2>
			{#if createError}
				<div class="alert alert-error">{createError}</div>
			{/if}
			<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
				<div class="form-grid">
					<div class="field">
						<label for="create-sal">Anrede</label>
						<select id="create-sal" bind:value={createSalutation}>
							<option value="">—</option>
							<option value="Herr">Herr</option>
							<option value="Frau">Frau</option>
							<option value="D">Divers</option>
						</select>
					</div>
					<div class="field">
						<label for="create-target">Monatsstunden</label>
						<input id="create-target" type="number" step="0.5" bind:value={createTarget} />
					</div>
					<div class="field">
						<label for="create-fn">Vorname *</label>
						<input id="create-fn" type="text" bind:value={createFirstName} required />
					</div>
					<div class="field">
						<label for="create-ln">Nachname *</label>
						<input id="create-ln" type="text" bind:value={createLastName} required />
					</div>
					<div class="field">
						<label for="create-email">E-Mail *</label>
						<input id="create-email" type="email" bind:value={createEmail} required />
					</div>
					<div class="field">
						<label for="create-phone">Telefon</label>
						<input id="create-phone" type="text" bind:value={createPhone} />
					</div>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn" onclick={() => (showCreateForm = false)}>Abbrechen</button>
					<button type="submit" class="btn btn-primary" disabled={createLoading}>
						{createLoading ? 'Erstelle...' : 'Erstellen'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Table -->
{#if loading}
	<div class="loading">Laden...</div>
{:else if employees.length === 0}
	<div class="empty-state">Keine Mitarbeiter gefunden.</div>
{:else}
	<div class="table-wrapper">
		<table class="data-table">
			<thead>
				<tr>
					{#each columns as col}
						<th style={col.width ? `width:${col.width}` : ''}>{col.label}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each employees as emp}
					{@const util = utilization(emp)}
					<tr class="clickable-row" onclick={() => goto(`/admin/employees/${emp.id}`)}>
						<td>
							{#if emp.salutation}{emp.salutation} {/if}{emp.first_name} {emp.last_name}
						</td>
						<td>{emp.email}</td>
						<td>{emp.phone ?? '—'}</td>
						<td class="num">{emp.monthly_hours_target}</td>
						<td class="num">{emp.planned_hours_month?.toFixed(1) ?? '—'}</td>
						<td class="num">{emp.actual_hours_month?.toFixed(1) ?? '—'}</td>
						<td>
							{#if util != null}
								<span
									class="utilization-badge"
									class:low={util < 50}
									class:medium={util >= 50 && util < 90}
									class:high={util >= 90 && util <= 110}
									class:over={util > 110}
								>
									{util}%
								</span>
							{:else}
								—
							{/if}
						</td>
						<td>
							{#if emp.active}
								<span class="status-badge active">Aktiv</span>
							{:else}
								<span class="status-badge inactive">Inaktiv</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if total > limit}
		<div class="pagination">
			<button class="btn btn-sm" onclick={prevPage} disabled={offset === 0}>
				<ChevronLeft size={16} />
			</button>
			<span class="page-info">
				{offset + 1}–{Math.min(offset + limit, total)} von {total}
			</span>
			<button class="btn btn-sm" onclick={nextPage} disabled={offset + limit >= total}>
				<ChevronRight size={16} />
			</button>
		</div>
	{/if}
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.page-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--dt-on-surface);
		margin: 0;
	}

	.count-badge {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.5rem;
		border-radius: var(--dt-radius-sm);
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-md);
		padding: 0.5rem 0.75rem;
		flex: 1;
		min-width: 200px;
		max-width: 400px;
		color: var(--dt-on-surface-variant);
	}

	.search-box input {
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.875rem;
		width: 100%;
		color: var(--dt-on-surface);
	}

	.search-box input::placeholder {
		color: var(--dt-outline-variant);
	}

	.month-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.month-picker label {
		color: var(--dt-on-surface-variant);
		font-weight: 500;
	}

	.month-picker input {
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
	}

	.table-wrapper {
		overflow-x: auto;
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

	.utilization-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.5rem;
		border-radius: var(--dt-radius-sm);
	}

	.utilization-badge.low {
		background: rgba(146, 64, 14, 0.10);
		color: #92400e;
	}

	.utilization-badge.medium {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.utilization-badge.high {
		background: rgba(22, 101, 52, 0.10);
		color: #166534;
	}

	.utilization-badge.over {
		background: rgba(168, 57, 0, 0.10);
		color: var(--dt-secondary);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: 0.125rem 0.5rem;
		border-radius: var(--dt-radius-sm);
	}

	.status-badge.active {
		background: rgba(22, 101, 52, 0.10);
		color: #166534;
	}

	.status-badge.inactive {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.page-info {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(2, 36, 72, 0.4);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.5rem;
		width: 90%;
		max-width: 520px;
		box-shadow: var(--dt-shadow-ambient);
	}

	.modal h2 {
		margin: 0 0 1rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
	}

	.field input,
	.field select {
		padding: 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		transition: background var(--dt-transition), border-color var(--dt-transition);
	}

	.field input:focus,
	.field select:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.alert-error {
		background: rgba(168, 57, 0, 0.08);
		color: var(--dt-secondary);
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

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

	.btn:hover {
		background: var(--dt-surface-container);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: linear-gradient(135deg, #022448, #1e3a5f);
		color: var(--dt-on-primary);
		border: none;
	}

	.btn-primary:hover {
		opacity: 0.9;
		background: linear-gradient(135deg, #022448, #1e3a5f);
	}

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
	}

	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}

		.search-box {
			max-width: none;
		}
	}
</style>
