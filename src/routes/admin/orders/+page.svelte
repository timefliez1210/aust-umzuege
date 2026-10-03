<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';

	interface Order {
		id: string;
		customer_name: string | null;
		customer_email: string;
		origin_city: string | null;
		destination_city: string | null;
		volume_m3: number | null;
		status: string;
		scheduled_date: string | null;
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

	let sortKey = $state('scheduled_date');
	let sortDir = $state<'asc' | 'desc'>('asc');

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'accepted', label: 'Angenommen' },
		{ value: 'scheduled', label: 'Geplant' },
		{ value: 'completed', label: 'Erledigt' },
		{ value: 'invoiced', label: 'Fakturiert' },
		{ value: 'paid', label: 'Bezahlt' }
	];

	const columns = [
		{ key: 'booking_date', label: 'Termin', width: '120px' },
		{ key: 'customer_name', label: 'Kunde' },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', width: '90px' },
		{ key: 'offer_price_brutto', label: 'Preis', width: '100px' },
		{ key: 'employees', label: 'Helfer', width: '80px' },
		{ key: 'status', label: 'Status', width: '120px' }
	];

	// Once on mount; filters/search/paging reload explicitly. `untrack` keeps the bound
	// search text from re-running this on every keystroke.
	$effect(() => {
		untrack(loadOrders);
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

	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));

	function formatBookingDate(order: Order): string {
		const d = order.booking_date || order.scheduled_date;
		if (!d) return '--';
		return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
	}
</script>

<svelte:head><title>Aufträge</title></svelte:head>

<PageHeader title="Aufträge" count="{total} gesamt" />

<div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
	<FilterTabs options={tabs} bind:value={statusFilter} onchange={setFilter} label="Status" />
	<SearchInput bind:value={searchQuery} onsearch={handleSearch} placeholder="Name, E-Mail …" class="lg:w-72" />
</div>

{#snippet crew(o: Order)}
	{#if o.employees_quoted != null}
		<span
			class="num text-[13px] {o.employees_assigned >= o.employees_quoted
				? 'text-ok'
				: o.employees_assigned > 0
					? 'text-warn'
					: 'text-danger'}">{o.employees_assigned}/{o.employees_quoted}</span
		>
	{:else if o.employees_assigned > 0}
		<span class="num text-[13px]">{o.employees_assigned}</span>
	{:else}
		<span class="text-faint">—</span>
	{/if}
{/snippet}

<div class={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
	<DataTable
		{columns}
		rows={orders}
		bind:sortKey
		bind:sortDir
		emptyMessage={loading ? 'Laden …' : 'Keine Aufträge gefunden'}
		onRowClick={(row) => goto(`/admin/inquiries/${(row as Order).id}`)}
	>
		{#snippet card(item, _i)}
			{@const o = item as Order}
			<span class="flex items-start justify-between gap-3">
				<span class="flex min-w-0 flex-col">
					<span class="truncate font-semibold">{o.customer_name || o.customer_email}</span>
					<span class="truncate text-[13px] text-muted">
						{#if o.origin_city && o.destination_city}{o.origin_city} → {o.destination_city}{:else}—{/if}
					</span>
				</span>
				<StatusBadge status={o.status} />
			</span>
			<span class="num mt-2 flex items-center gap-3 text-xs text-faint">
				<span class="text-fg">{formatBookingDate(o)}</span>
				{#if o.volume_m3 != null}<span>{o.volume_m3.toFixed(1)} m³</span>{/if}
				<span>Team {@render crew(o)}</span>
				{#if o.offer_price_brutto != null}<span class="ml-auto text-muted">{formatEuro(o.offer_price_brutto)}</span>{/if}
			</span>
		{/snippet}
		{#snippet row(item, _i)}
			{@const o = item as Order}
			<td class="num text-[13px] whitespace-nowrap">{formatBookingDate(o)}</td>
			<td>
				<div class="font-medium">{o.customer_name || o.customer_email}</div>
				{#if o.customer_name}<div class="text-xs text-faint">{o.customer_email}</div>{/if}
			</td>
			<td>
				{#if o.origin_city && o.destination_city}
					{o.origin_city} <span class="text-faint">→</span> {o.destination_city}
				{:else}<span class="text-faint">—</span>{/if}
			</td>
			<td class="num whitespace-nowrap">
				{#if o.volume_m3 != null}{o.volume_m3.toFixed(1)} m³{:else}<span class="text-faint">—</span>{/if}
			</td>
			<td class="num whitespace-nowrap">
				{#if o.offer_price_brutto != null}{formatEuro(o.offer_price_brutto)}{:else}<span class="text-faint">—</span>{/if}
			</td>
			<td>{@render crew(o)}</td>
			<td><StatusBadge status={o.status} /></td>
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
			loadOrders();
		}}
		onNext={() => {
			offset += limit;
			loadOrders();
		}}
	/>
{/if}
