<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { CUSTOMER_TYPE_LABELS } from '$lib/utils/constants';
	import { Plus } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';

	interface Customer {
		id: string;
		email: string | null;
		name: string | null;
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		customer_type: string | null;
		company_name: string | null;
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
	let createSalutation = $state('');
	let createFirstName = $state('');
	let createLastName = $state('');
	let createEmail = $state('');
	let createPhone = $state('');
	let createCustomerType = $state<'private' | 'business'>('private');
	let createCompanyName = $state('');
	let createError = $state('');
	let createLoading = $state(false);

	const columns = [
		{ key: 'customer_type', label: 'Typ', width: '80px' },
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'E-Mail' },
		{ key: 'phone', label: 'Telefon', width: '150px' },
		{ key: 'created_at', label: 'Erstellt', width: '120px' }
	];

	// Once on mount; search and paging reload explicitly (untrack: not on every keystroke).
	$effect(() => {
		untrack(loadCustomers);
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
		// Email is optional — elderly customers may not have email
		createError = '';
		createLoading = true;
		try {
			const firstName = createFirstName.trim();
			const lastName = createLastName.trim();
			const fullName = [firstName, lastName].filter(Boolean).join(' ') || null;
			const res = await apiPost<Customer>('/api/v1/admin/customers', {
				email: createEmail.trim() || null,
				name: fullName,
				first_name: firstName || null,
				last_name: lastName || null,
				salutation: createSalutation || null,
				phone: createPhone.trim() || null,
				customer_type: createCustomerType || null,
				company_name: createCustomerType === 'business' ? (createCompanyName.trim() || null) : null,
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

<svelte:head><title>Kunden</title></svelte:head>

<PageHeader title="Kunden" count="{total} gesamt">
	{#snippet actions()}
		<Button variant="accent" onclick={() => (showCreateForm = true)}><Plus size={16} /> Neuer Kunde</Button>
	{/snippet}
</PageHeader>

<SearchInput bind:value={searchQuery} onsearch={handleSearch} placeholder="Name oder E-Mail suchen …" class="mb-4 sm:w-80" />

<div class={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
	<DataTable
		{columns}
		rows={customers}
		bind:sortKey
		bind:sortDir
		emptyMessage={loading ? 'Laden …' : 'Keine Kunden gefunden'}
		onRowClick={(row) => goto(`/admin/customers/${(row as Customer).id}`)}
	>
		{#snippet card(item, _i)}
			{@const c = item as Customer}
			<span class="flex items-start justify-between gap-3">
				<span class="flex min-w-0 flex-col">
					<span class="truncate font-semibold">{c.company_name || c.name || '—'}</span>
					<span class="truncate text-[13px] text-muted">{c.email ?? '—'}</span>
				</span>
				<Badge>{CUSTOMER_TYPE_LABELS[c.customer_type ?? 'private'] ?? 'Privat'}</Badge>
			</span>
			<span class="num mt-1.5 flex justify-between text-xs text-faint">
				<span>{c.phone || ''}</span><span>seit {formatDate(c.created_at)}</span>
			</span>
		{/snippet}
		{#snippet row(item, _i)}
			{@const c = item as Customer}
			<td><Badge>{CUSTOMER_TYPE_LABELS[c.customer_type ?? 'private'] ?? c.customer_type}</Badge></td>
			<td>
				<span class="font-medium">
					{#if c.salutation}<span class="mr-1 font-normal text-faint">{c.salutation === 'D' ? 'Div.' : c.salutation}</span>{/if}{c.name ||
						'—'}
				</span>
				{#if c.company_name}<span class="ml-1 text-muted">({c.company_name})</span>{/if}
			</td>
			<td class="text-[13px]">{c.email ?? '—'}</td>
			<td class="num text-[13px] text-muted">{c.phone || '—'}</td>
			<td class="num text-[13px] text-muted">{formatDate(c.created_at)}</td>
		{/snippet}
	</DataTable>
</div>

{#if totalPages > 1}
	<PaginationControls
		page={Math.floor(offset / limit)}
		{total}
		{limit}
		onPrev={() => {
			offset = Math.max(0, offset - limit);
			loadCustomers();
		}}
		onNext={() => {
			offset += limit;
			loadCustomers();
		}}
	/>
{/if}

{#if showCreateForm}
	<Modal title="Neuer Kunde" onclose={() => (showCreateForm = false)}>
		<form
			id="customer-create"
			class="flex flex-col gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreateCustomer();
			}}
		>
			<Segmented
				label="Kundentyp"
				options={[
					{ value: 'private', label: 'Privat' },
					{ value: 'business', label: 'Gewerbe' }
				]}
				bind:value={createCustomerType}
				class="self-start"
			/>
			{#if createCustomerType === 'business'}<Input placeholder="Firmenname" bind:value={createCompanyName} />{/if}
			<div class="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]">
				<Select bind:value={createSalutation} aria-label="Anrede">
					<option value="">Anrede</option>
					<option value="Herr">Herr</option>
					<option value="Frau">Frau</option>
					<option value="D">Divers</option>
				</Select>
				<Input placeholder="Vorname" bind:value={createFirstName} />
				<Input placeholder="Nachname" bind:value={createLastName} />
			</div>
			<div class="grid gap-2 sm:grid-cols-2">
				<Input type="email" placeholder="E-Mail" bind:value={createEmail} />
				<Input type="tel" placeholder="Telefon" bind:value={createPhone} />
			</div>
			{#if createError}<Notice tone="danger">{createError}</Notice>{/if}
		</form>
		{#snippet footer()}
			<Button onclick={() => (showCreateForm = false)}>Abbrechen</Button>
			<Button type="submit" form="customer-create" variant="solid" disabled={createLoading}>{createLoading ? 'Erstelle …' : 'Erstellen'}</Button>
		{/snippet}
	</Modal>
{/if}
