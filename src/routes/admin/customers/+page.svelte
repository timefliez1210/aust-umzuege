<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';

	interface Customer {
		id: string;
		email: string;
		name: string | null;
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

	// Create form state
	let showCreateForm = $state(false);
	let createName = $state('');
	let createEmail = $state('');
	let createPhone = $state('');
	let createError = $state('');
	let createLoading = $state(false);

	const columns = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'email', label: 'E-Mail', sortable: true },
		{ key: 'phone', label: 'Telefon', width: '150px' },
		{ key: 'created_at', label: 'Erstellt', sortable: true, width: '120px' }
	];

	$effect(() => {
		loadCustomers();
	});

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

	function handleSearch() {
		offset = 0;
		loadCustomers();
	}

	function prevPage() {
		if (offset > 0) { offset = Math.max(0, offset - limit); loadCustomers(); }
	}

	function nextPage() {
		if (offset + limit < total) { offset += limit; loadCustomers(); }
	}

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
				phone: createPhone.trim() || null
			});
			goto(`/admin/customers/${res.id}`);
		} catch (e: any) {
			createError = e.message || 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	let currentPage = $derived(Math.floor(offset / limit) + 1);
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
		onRowClick={(row) => goto(`/admin/customers/${(row as Customer).id}`)}
	>
		{#snippet row(item, _i)}
			{@const c = item as Customer}
			<td class="cell-name">{c.name || '—'}</td>
			<td>{c.email}</td>
			<td class="text-muted">{c.phone || '—'}</td>
			<td class="text-muted">{formatDate(c.created_at)}</td>
		{/snippet}
	</DataTable>

	{#if totalPages > 1}
		<div class="pagination">
			<button onclick={prevPage} disabled={offset === 0}><ChevronLeft size={16} /></button>
			<span>Seite {currentPage} von {totalPages}</span>
			<button onclick={nextPage} disabled={offset + limit >= total}><ChevronRight size={16} /></button>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.page-count {
		font-size: 0.8125rem;
		color: #94a3b8;
		flex: 1;
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #ffffff;
		background: #6366f1;
		border: none;
		cursor: pointer;
		box-shadow: 2px 2px 6px #d1d9e6;
		transition: all 150ms ease;
	}

	.btn-create:hover {
		background: #4f46e5;
	}

	.create-form {
		background: #ffffff;
		border-radius: 12px;
		padding: 1rem 1.25rem;
		margin-bottom: 1rem;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
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
		border-radius: 8px;
		border: none;
		background: #e8ecf1;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		font-size: 0.875rem;
		color: #1a1a2e;
		outline: none;
	}

	.create-form__input::placeholder {
		color: #94a3b8;
	}

	.create-form__input:focus {
		box-shadow: inset 2px 2px 5px #c5cdd8, inset -2px -2px 5px #ffffff;
	}

	.create-form__submit {
		padding: 0.5rem 1.25rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		color: #ffffff;
		background: #6366f1;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.create-form__submit:hover:not(:disabled) {
		background: #4f46e5;
	}

	.create-form__submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.create-form__error {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #ef4444;
	}

	.toolbar {
		display: flex;
		margin-bottom: 1rem;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #e8ecf1;
		border: none;
		border-radius: 10px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		padding: 0 0.75rem;
		color: #94a3b8;
	}

	.search-box input {
		background: transparent;
		border: none;
		color: #1a1a2e;
		padding: 0.5rem 0;
		font-size: 0.875rem;
		outline: none;
		width: 280px;
	}

	.search-box input::placeholder {
		color: #94a3b8;
	}

	.cell-name {
		font-weight: 500;
		color: #1a1a2e;
	}

	.text-muted {
		color: #94a3b8;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: #64748b;
	}

	.pagination button {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: 8px;
		color: #64748b;
		border: none;
		background: #ffffff;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
		transition: all 150ms ease;
	}

	.pagination button:hover:not(:disabled) {
		color: #1a1a2e;
	}

	.pagination button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.pagination span {
		color: #64748b;
	}
</style>
