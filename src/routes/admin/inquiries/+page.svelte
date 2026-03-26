<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, formatDate } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus, X } from 'lucide-svelte';
	import CreateInquiryModal from './_components/CreateInquiryModal.svelte';

	interface InquiryListItem {
		id: string;
		customer_name: string | null;
		customer_email: string;
		salutation: string | null;
		origin_city: string | null;
		destination_city: string | null;
		volume_m3: number | null;
		distance_km: number | null;
		status: string;
		has_offer: boolean;
		offer_status: string | null;
		created_at: string;
	}

	interface InquiriesResponse {
		inquiries: InquiryListItem[];
		total: number;
	}

	let inquiries = $state<InquiryListItem[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let statusFilter = $state('');
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	let sortKey = $state('created_at');
	let sortDir = $state<'asc' | 'desc'>('desc');

	// Create form visibility
	let showCreateForm = $state(false);

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'pending', label: 'Offen' },
		{ value: 'estimating', label: 'Schaetzung' },
		{ value: 'estimated', label: 'Volumen' },
		{ value: 'offer_ready', label: 'Angebot' },
		{ value: 'sent', label: 'Gesendet' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'scheduled', label: 'Geplant' },
		{ value: 'completed', label: 'Erledigt' },
		{ value: 'invoiced', label: 'Fakturiert' },
		{ value: 'paid', label: 'Bezahlt' }
	];

	const columns = [
		{ key: 'created_at', label: 'Datum', sortable: true, width: '120px' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', sortable: true, width: '100px' },
		{ key: 'status', label: 'Status', width: '140px' }
	];

	$effect(() => {
		loadInquiries();
	});

	/**
	 * Fetches the paginated inquiries list from the API and populates the DataTable.
	 *
	 * Called by: $effect (on mount and whenever statusFilter, searchQuery, or offset change)
	 * Purpose: Loads inquiry records filtered by status and free-text search, respecting the
	 *          current pagination offset. Calls GET /api/v1/inquiries with query parameters.
	 *          On error, resets the list to empty so the page stays usable.
	 *
	 * @returns void (side-effect: sets `inquiries`, `total`, `loading`)
	 */
	async function loadInquiries() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));

			const res = await apiGet<InquiriesResponse>(`/api/v1/inquiries?${params}`);
			inquiries = res.inquiries;
			total = res.total;
		} catch {
			inquiries = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	/**
	 * Switches the active status tab filter and reloads the quotes list from page 1.
	 *
	 * Called by: Template (onclick on each status tab button — Alle, Offen, Volumen, etc.)
	 * Purpose: Narrows the quotes table to a single workflow stage without clearing the search input.
	 *
	 * @param value - The status string to filter by ('' for all, or e.g. 'pending', 'offer_generated')
	 * @returns void
	 */
	function setFilter(value: string) {
		statusFilter = value;
		offset = 0;
		loadInquiries();
	}

	/**
	 * Resets the pagination offset and triggers a new quote search with the current query string.
	 *
	 * Called by: Template (oninput or onsubmit on the search input field)
	 * Purpose: Ensures search results always start from page 1 when the query changes.
	 *
	 * @returns void
	 */
	function handleSearch() {
		offset = 0;
		loadInquiries();
	}

	/**
	 * Moves the pagination offset back by one page and reloads the quotes list.
	 *
	 * Called by: Template (onclick on the left-chevron pagination button)
	 * Purpose: Navigates to the previous 20-item page; no-ops if already on page 1.
	 *
	 * @returns void
	 */
	function prevPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			loadInquiries();
		}
	}

	/**
	 * Advances the pagination offset by one page and reloads the quotes list.
	 *
	 * Called by: Template (onclick on the right-chevron pagination button)
	 * Purpose: Navigates to the next 20-item page; no-ops if already on the last page.
	 *
	 * @returns void
	 */
	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadInquiries();
		}
	}

	let currentPage = $derived(Math.floor(offset / limit) + 1);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="page">
	<div class="page-header">
		<h1>Anfragen</h1>
		<span class="page-count">{total} gesamt</span>
		<button class="btn-create" onclick={() => { showCreateForm = !showCreateForm; }}>
			{#if showCreateForm}
				<X size={16} />
				Schließen
			{:else}
				<Plus size={16} />
				Neue Anfrage
			{/if}
		</button>
	</div>

	{#if showCreateForm}
		<CreateInquiryModal
			bind:open={showCreateForm}
			onCreated={(id) => goto(`/admin/inquiries/${id}`)}
		/>
	{/if}

	<div class="toolbar">
		<div class="tabs">
			{#each tabs as tab}
				<button
					class="tab"
					class:active={statusFilter === tab.value}
					onclick={() => setFilter(tab.value)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="search-box">
			<Search size={16} />
			<input
				type="text"
				placeholder="Suche..."
				bind:value={searchQuery}
				onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			/>
		</div>
	</div>

	<DataTable
		{columns}
		rows={inquiries}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/inquiries/${(row as InquiryListItem).id}`)}
	>
		{#snippet row(item, _i)}
			{@const q = item as InquiryListItem}
			<td>{formatDate(q.created_at)}</td>
			<td>
				<div class="cell-name">
					{#if q.salutation}<span class="sal-badge">{q.salutation === 'D' ? 'Div.' : q.salutation}</span>{/if}{q.customer_name || q.customer_email}
				</div>
				{#if q.customer_name}<div class="cell-email">{q.customer_email}</div>{/if}
			</td>
			<td>
				{#if q.origin_city && q.destination_city}
					{q.origin_city} &rarr; {q.destination_city}
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td>
				{#if q.volume_m3 != null}
					{q.volume_m3.toFixed(1)} m&sup3;
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td><StatusBadge status={q.status} /></td>
		{/snippet}
	</DataTable>

	{#if totalPages > 1}
		<div class="pagination">
			<button onclick={prevPage} disabled={offset === 0}>
				<ChevronLeft size={16} />
			</button>
			<span>Seite {currentPage} von {totalPages}</span>
			<button onclick={nextPage} disabled={offset + limit >= total}>
				<ChevronRight size={16} />
			</button>
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
		color: var(--dt-on-surface);
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		flex: 1;
	}

	.btn-create {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		border: none;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.btn-create:hover {
		opacity: 0.88;
	}

	/* Create form styles live in _components/CreateInquiryModal.svelte */

	@media (max-width: 768px) {
		.page-header {
			flex-wrap: wrap;
		}
		.search-box {
			flex: 1;
			min-width: 0;
		}
		.search-box input {
			width: 100%;
		}
		.btn-create {
			min-height: 44px;
		}
		.tab {
			min-height: 44px;
		}
		.pagination button {
			min-height: 44px;
			min-width: 44px;
			justify-content: center;
		}
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-md);
		padding: 0.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.tab {
		padding: 0.375rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		border: none;
		background: transparent;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.tab:hover {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
	}

	.tab.active {
		background: var(--dt-primary-container);
		color: var(--dt-on-primary);
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-md);
		padding: 0 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.search-box input {
		background: transparent;
		border: none;
		color: var(--dt-on-surface);
		padding: 0.5rem 0;
		font-size: 0.875rem;
		outline: none;
		width: 200px;
	}

	.search-box input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.sal-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--dt-primary);
		background: var(--dt-surface-container);
		padding: 0.05rem 0.3rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.3rem;
		vertical-align: middle;
	}

	.cell-name {
		color: var(--dt-on-surface);
		font-weight: 500;
	}

	.cell-email {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.text-muted {
		color: var(--dt-outline-variant);
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.pagination button {
		display: flex;
		align-items: center;
		padding: 0.375rem;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		border: var(--dt-ghost-border);
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
		cursor: pointer;
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.pagination button:hover:not(:disabled) {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
	}

	.pagination button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
</style>
