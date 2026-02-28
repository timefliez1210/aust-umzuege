<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { Search, ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Order {
		id: string;
		customer_name: string | null;
		customer_email: string;
		origin_city: string | null;
		destination_city: string | null;
		volume_m3: number | null;
		status: string;
		preferred_date: string | null;
		offer_price_brutto: number | null;
		booking_date: string | null;
		created_at: string;
	}

	interface OrdersResponse {
		orders: Order[];
		total: number;
	}

	let orders = $state<Order[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let statusFilter = $state('');
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	let sortKey = $state('preferred_date');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'done', label: 'Erledigt' },
		{ value: 'paid', label: 'Bezahlt' }
	];

	const columns = [
		{ key: 'booking_date', label: 'Termin', sortable: true, width: '120px' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', width: '90px' },
		{ key: 'offer_price_brutto', label: 'Preis', width: '100px' },
		{ key: 'status', label: 'Status', width: '120px' }
	];

	$effect(() => {
		loadOrders();
	});

	async function loadOrders() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));

			const res = await apiGet<OrdersResponse>(`/api/v1/admin/orders?${params}`);
			orders = res.orders;
			total = res.total;
		} catch {
			orders = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	function setFilter(value: string) {
		statusFilter = value;
		offset = 0;
		loadOrders();
	}

	function handleSearch() {
		offset = 0;
		loadOrders();
	}

	function prevPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			loadOrders();
		}
	}

	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadOrders();
		}
	}

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	let currentPage = $derived(Math.floor(offset / limit) + 1);

	function formatBookingDate(order: Order): string {
		const d = order.booking_date || order.preferred_date;
		if (!d) return '--';
		return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<div class="page">
	<div class="page-header">
		<h1>Auftraege</h1>
		<span class="page-count">{total} gesamt</span>
	</div>

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
		rows={orders}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/inquiries/${(row as Order).id}`)}
	>
		{#snippet row(item, _i)}
			{@const o = item as Order}
			<td>{formatBookingDate(o)}</td>
			<td>
				<div class="cell-name">{o.customer_name || o.customer_email}</div>
				{#if o.customer_name}<div class="cell-email">{o.customer_email}</div>{/if}
			</td>
			<td>
				{#if o.origin_city && o.destination_city}
					{o.origin_city} &rarr; {o.destination_city}
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td>
				{#if o.volume_m3 != null}
					{o.volume_m3.toFixed(1)} m&sup3;
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td>
				{#if o.offer_price_brutto != null}
					{formatEuro(o.offer_price_brutto)}
				{:else}
					<span class="text-muted">--</span>
				{/if}
			</td>
			<td><StatusBadge status={o.status} /></td>
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
		color: #1a1a2e;
	}

	.page-count {
		font-size: 0.8125rem;
		color: #94a3b8;
		flex: 1;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: #e8ecf1;
		border-radius: 10px;
		padding: 0.25rem;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.tab {
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #64748b;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
		white-space: nowrap;
	}

	.tab:hover {
		color: #1a1a2e;
	}

	.tab.active {
		background: #ffffff;
		color: #1a1a2e;
		box-shadow: 2px 2px 5px #d1d9e6, -2px -2px 5px #ffffff;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: #e8ecf1;
		border-radius: 10px;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
		margin-left: auto;
	}

	.search-box :global(svg) {
		color: #94a3b8;
		flex-shrink: 0;
	}

	.search-box input {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: #1a1a2e;
		outline: none;
		width: 160px;
	}

	.search-box input::placeholder {
		color: #94a3b8;
	}

	.cell-name {
		font-weight: 500;
		color: #1a1a2e;
	}

	.cell-email {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.text-muted {
		color: #cbd5e1;
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
		background: #e8ecf1;
		border: none;
		color: #64748b;
		cursor: pointer;
		box-shadow: 2px 2px 5px #d1d9e6, -2px -2px 5px #ffffff;
		transition: all 150ms ease;
	}

	.pagination button:hover:not(:disabled) {
		color: #1a1a2e;
	}

	.pagination button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
