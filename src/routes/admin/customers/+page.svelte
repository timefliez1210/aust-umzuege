<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { CUSTOMER_TYPE_LABELS } from '$lib/utils/constants';
	import { Search, Plus } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';

	interface Customer {
		id: string;
		email: string;
		name: string | null;
		salutation: string | null;
		phone: string | null;
		created_at: string;
	}

	interface CustomersResponse {
		customers: Customer[];
		total: number;
	}

	let customers = $state<Customer[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	let sortKey = $state('created_at');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// Create form state
	let showCreateForm = $state(false);
	let createName = $state('');
	let createEmail = $state('');
	let createPhone = $state('');
	let createError = $state('');
	let createLoading = $state(false);

	const columns = [
		{ key: 'customer_type', label: 'Typ', width: '80px' },
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'email', label: 'E-Mail', sortable: true },
		{ key: 'phone', label: 'Telefon', width: '150px' },
		{ key: 'created_at', label: 'Erstellt', sortable: true, width: '120px' }
	];

	$effect(() => {
		loadCustomers();
	});

	/**
	 * Fetches a paginated, optionally filtered list of customers from the API.
	 *
	 * Called by: $effect (on mount and whenever searchQuery, offset, or sortKey changes),
	 *            handleSearch, prevPage, nextPage
	 * Purpose: Populates the DataTable with the current page of customer records, supporting
	 *          server-side search and offset-based pagination via GET /api/v1/admin/customers.
	 *
	 * @returns void
	 */
	async function loadCustomers() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));
			const res = await apiGet<CustomersResponse>(`/api/v1/admin/customers?${params}`);
			customers = res.customers;
			total = res.total;
		} catch {
			customers = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	/**
	 * Resets pagination to the first page and triggers a fresh customer search.
	 *
	 * Called by: Template (search input onkeydown Enter)
	 * Purpose: Ensures that when a new search term is typed the result set always starts
	 *          from page 1 rather than an arbitrary mid-list offset.
	 *
	 * @returns void
	 */
	function handleSearch() {
		offset = 0;
		loadCustomers();
	}

	/**
	 * Creates a new customer record via the API and navigates to the new customer's detail page.
	 *
	 * Called by: Template (create-form submit button click and Enter keydown on email/phone inputs)
	 * Purpose: Validates that an e-mail address has been provided, then POSTs the new customer
	 *          data to POST /api/v1/admin/customers. On success the admin is redirected to the
	 *          created customer's detail page to continue editing.
	 *
	 * @returns void
	 */
	async function handleCreateCustomer() {
		if (!createEmail.trim()) {
			createError = 'E-Mail ist erforderlich';
			return;
		}
		createError = '';
		createLoading = true;
		try {
			const res = await apiPost<Customer>('/api/v1/admin/customers', {
				email: createEmail.trim(),
				name: createName.trim() || null,
				phone: createPhone.trim() || null,
			});
			goto(`/admin/customers/${res.id}`);
		} catch (e: any) {
			createError = e.message || 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="page">
	<div class="page-header">
		<h1>Kunden</h1>
		<span class="page-count">{total} gesamt</span>
		<button class="btn-create" onclick={() => { showCreateForm = !showCreateForm; }}>
			<Plus size={16} />
			Neuer Kunde
		</button>
	</div>

	{#if showCreateForm}
		<div class="create-form">
			<div class="create-form__fields">
				<input
					type="text"
					placeholder="Name"
					bind:value={createName}
					class="create-form__input"
				/>
				<input
					type="email"
					placeholder="E-Mail *"
					bind:value={createEmail}
					class="create-form__input"
					onkeydown={(e) => { if (e.key === 'Enter') handleCreateCustomer(); }}
				/>
				<input
					type="tel"
					placeholder="Telefon"
					bind:value={createPhone}
					class="create-form__input"
					onkeydown={(e) => { if (e.key === 'Enter') handleCreateCustomer(); }}
				/>
				<button
					class="create-form__submit"
					onclick={handleCreateCustomer}
					disabled={createLoading}
				>
					{createLoading ? 'Erstelle...' : 'Erstellen'}
				</button>
			</div>
			{#if createError}
				<p class="create-form__error">{createError}</p>
			{/if}
		</div>
	{/if}

	<div class="toolbar">
		<div class="search-box">
			<Search size={16} />
			<input
				type="text"
				placeholder="Name oder E-Mail suchen..."
				bind:value={searchQuery}
				onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			/>
		</div>
	</div>

	<DataTable
		{columns}
		rows={customers}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/customers/${(row as Customer).id}`)}
	>
		{#snippet row(item, _i)}
			{@const c = item as Customer}
			<td>
			{#if c.customer_type}
				<span class="cust-type-badge" data-type={c.customer_type}>{CUSTOMER_TYPE_LABELS[c.customer_type] ?? c.customer_type}</span>
			{:else}
				<span class="cust-type-badge" data-type="private">Privat</span>
			{/if}
		</td>
		<td class="cell-name">
			{#if c.salutation}<span class="sal-badge">{c.salutation === 'D' ? 'Div.' : c.salutation}</span>{/if}{c.name || '—'}
			{#if c.company_name}<span class="cell-company">({c.company_name})</span>{/if}
		</td>
			<td>{c.email}</td>
			<td class="text-muted">{c.phone || '—'}</td>
			<td class="text-muted">{formatDate(c.created_at)}</td>
		{/snippet}
	</DataTable>

	{#if totalPages > 1}
		<PaginationControls
			page={Math.floor(offset / limit)}
			total={total}
			limit={limit}
			onPrev={() => { offset = Math.max(0, offset - limit); loadCustomers(); }}
			onNext={() => { offset += limit; loadCustomers(); }}
		/>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		flex: 1;
	}

	.create-form {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-md);
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
	}

	.create-form__fields {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.create-form__input {
		flex: 1;
		min-width: 150px;
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		border: none;
		border-bottom: 2px solid transparent;
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		transition: background var(--dt-transition), border-color var(--dt-transition);
	}

	.create-form__input::placeholder {
		color: var(--dt-outline-variant);
	}

	.create-form__input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}

	.create-form__submit {
		padding: 0.5rem 1.25rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, #022448, #1e3a5f);
		border: none;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.create-form__submit:hover:not(:disabled) {
		opacity: 0.9;
	}

	.create-form__submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-form__error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: var(--dt-secondary);
	}

	.cust-type-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.1rem 0.35rem;
		border-radius: 4px;
		letter-spacing: 0.03em;
	}
	.cust-type-badge[data-type="business"] { background: #d1fae5; color: #065f46; }
	.cust-type-badge[data-type="private"] { background: #dbeafe; color: #1e40af; }
	.cell-company {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		margin-left: 0.3rem;
	}
	.sal-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		padding: 0.05rem 0.3rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.3rem;
		vertical-align: middle;
	}

	.cell-name {
		font-weight: 500;
		color: var(--dt-on-surface);
	}

	.text-muted {
		color: var(--dt-on-surface-variant);
	}

</style>
