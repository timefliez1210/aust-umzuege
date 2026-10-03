<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Plus } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';

	interface Employee {
		id: string;
		salutation: string | null;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		monthly_hours_target: number;
		active: boolean;
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

	// Once on mount; search/month/paging reload explicitly (untrack: not on every keystroke).
	$effect(() => {
		untrack(loadEmployees);
	});

	/** "2026-10" ± n months. */
	function shiftMonth(key: string, n: number): string {
		const [y, m] = key.split('-').map(Number);
		const d = new Date(y, m - 1 + n, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}
	const monthLabel = $derived(
		new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
	);
	function stepMonth(n: number) {
		selectedMonth = shiftMonth(selectedMonth, n);
		onMonthChange();
	}

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
		if (emp.actual_hours_month == null || emp.monthly_hours_target <= 0) return null;
		return Math.round((emp.actual_hours_month / emp.monthly_hours_target) * 100);
	}
</script>

<svelte:head><title>Mitarbeiter</title></svelte:head>

<PageHeader title="Mitarbeiter" count={total ? `${total} aktiv` : undefined}>
	{#snippet actions()}
		<Button variant="accent" onclick={() => (showCreateForm = true)}><Plus size={16} /> Neuer Mitarbeiter</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
	<Stepper label={monthLabel} onprev={() => stepMonth(-1)} onnext={() => stepMonth(1)} prevLabel="Vorheriger Monat" nextLabel="Nächster Monat" />
	<SearchInput bind:value={searchQuery} onsearch={handleSearch} placeholder="Name, E-Mail …" class="sm:ml-auto sm:w-72" />
</div>

{#if loading}
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
		{#each Array(6) as _, i (i)}<div class="h-32 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if employees.length === 0}
	<EmptyState title="Keine Mitarbeiter gefunden" />
{:else}
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each employees as emp (emp.id)}
			{@const util = utilization(emp)}
			{@const tone = util == null ? 'bg-bar-strong' : util > 110 ? 'bg-danger' : util >= 90 ? 'bg-ok' : util >= 50 ? 'bg-accent' : 'bg-warn'}
			<a href="/admin/employees/{emp.id}" class="flex flex-col gap-3 rounded-md border border-line bg-panel p-4 transition-colors hover:border-line-strong">
				<span class="flex items-center gap-3">
					<span class="num inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-sunk text-sm" aria-hidden="true">
						{emp.first_name[0]}{emp.last_name[0]}
					</span>
					<span class="flex min-w-0 flex-col">
						<span class="truncate font-semibold">{emp.first_name} {emp.last_name}</span>
						<span class="truncate text-xs text-muted">{emp.email}</span>
					</span>
				</span>
				<span class="flex flex-col gap-1.5">
					<span class="num flex items-baseline justify-between text-xs text-muted">
						<span><span class="text-base font-medium text-fg">{emp.actual_hours_month?.toFixed(1) ?? '—'}</span> / {emp.monthly_hours_target} h</span>
						<span>{util != null ? `${util} %` : ''}</span>
					</span>
					<span class="h-1.5 overflow-hidden rounded-full bg-sunk">
						<span class="block h-full {tone}" style="width: {Math.min(100, util ?? 0)}%"></span>
					</span>
				</span>
				{#if emp.phone}<span class="num text-xs text-faint">{emp.phone}</span>{/if}
			</a>
		{/each}
	</div>

	{#if total > limit}
		<PaginationControls
			page={Math.floor(offset / limit)}
			{total}
			{limit}
			onPrev={() => {
				offset = Math.max(0, offset - limit);
				loadEmployees();
			}}
			onNext={() => {
				offset += limit;
				loadEmployees();
			}}
		/>
	{/if}
{/if}

{#if showCreateForm}
	<Modal title="Neuer Mitarbeiter" onclose={() => (showCreateForm = false)}>
		<form
			id="emp-create"
			class="grid grid-cols-2 gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
		>
			{#if createError}<Notice tone="danger" class="col-span-2">{createError}</Notice>{/if}
			<Field label="Anrede" for="create-sal">
				<Select id="create-sal" bind:value={createSalutation}>
					<option value="">—</option>
					<option value="Herr">Herr</option>
					<option value="Frau">Frau</option>
					<option value="D">Divers</option>
				</Select>
			</Field>
			<Field label="Monatsstunden" for="create-target"><Input id="create-target" class="num" type="number" step="0.5" bind:value={createTarget} /></Field>
			<Field label="Vorname *" for="create-fn"><Input id="create-fn" bind:value={createFirstName} required /></Field>
			<Field label="Nachname *" for="create-ln"><Input id="create-ln" bind:value={createLastName} required /></Field>
			<Field label="E-Mail *" for="create-email"><Input id="create-email" type="email" bind:value={createEmail} required /></Field>
			<Field label="Telefon" for="create-phone"><Input id="create-phone" bind:value={createPhone} /></Field>
		</form>
		{#snippet footer()}
			<Button onclick={() => (showCreateForm = false)}>Abbrechen</Button>
			<Button type="submit" form="emp-create" variant="solid" disabled={createLoading}>{createLoading ? 'Erstelle …' : 'Erstellen'}</Button>
		{/snippet}
	</Modal>
{/if}
