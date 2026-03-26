<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Search, Plus } from 'lucide-svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';
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

	{#if total > limit}
		<PaginationControls
			page={Math.floor(offset / limit)}
			total={total}
			limit={limit}
			onPrev={() => { offset = Math.max(0, offset - limit); loadEmployees(); }}
			onNext={() => { offset += limit; loadEmployees(); }}
		/>
	{/if}
{/if}

<style>
	.page-header {
		justify-content: space-between;
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

	.search-box {
		flex: 1;
		min-width: 200px;
		max-width: 400px;
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

	.page-info {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	/* Modal */
	.alert-error {
		background: rgba(168, 57, 0, 0.08);
		color: var(--dt-secondary);
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
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
