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
		employees_assigned: number;
		employees_quoted: number | null;
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
		{ value: 'scheduled', label: 'Geplant' },
		{ value: 'completed', label: 'Erledigt' },
		{ value: 'invoiced', label: 'Fakturiert' },
		{ value: 'paid', label: 'Bezahlt' }
	];

	const columns = [
		{ key: 'booking_date', label: 'Termin', sortable: true, width: '120px' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', width: '90px' },
		{ key: 'offer_price_brutto', label: 'Preis', width: '100px' },
		{ key: 'employees', label: 'Helfer', width: '80px' },
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
			<td>
				{#if o.employees_quoted != null}
					<span class="emp-cell" class:emp-ok={o.employees_assigned >= o.employees_quoted} class:emp-partial={o.employees_assigned > 0 && o.employees_assigned < o.employees_quoted} class:emp-none={o.employees_assigned === 0}>
						{o.employees_assigned}/{o.employees_quoted}
					</span>
				{:else if o.employees_assigned > 0}
					<span class="emp-cell">{o.employees_assigned}</span>
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

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		flex: 1;
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
		background: transparent;
		border: none;
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
		white-space: nowrap;
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
		padding: 0.375rem 0.75rem;
		margin-left: auto;
	}

	.search-box :global(svg) {
		color: var(--dt-on-surface-variant);
		flex-shrink: 0;
	}

	.search-box input {
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		outline: none;
		width: 160px;
	}

	.search-box input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.cell-name {
		font-weight: 500;
		color: var(--dt-on-surface);
	}

	.cell-email {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.text-muted {
		color: var(--dt-outline-variant);
	}

	.emp-cell {
		display: inline-block;
		font-size: 0.8125rem;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container);
		color: var(--dt-on-surface-variant);
	}
	.emp-ok {
		background: var(--dt-surface-container);
		color: var(--dt-primary);
	}
	.emp-partial {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}
	.emp-none {
		background: var(--dt-surface-container-high);
		color: var(--dt-secondary);
	}

</style>
