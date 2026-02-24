<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Offer {
		id: string;
		offer_number: string | null;
		customer_name: string | null;
		total_brutto_cents: number | null;
		status: string;
		created_at: string;
	}

	interface OffersResponse {
		offers: Offer[];
		total: number;
	}

	let offers = $state<Offer[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let statusFilter = $state('');
	let offset = $state(0);
	const limit = 20;

	let sortKey = $state('created_at');
	let sortDir = $state<'asc' | 'desc'>('desc');

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'draft', label: 'Entwurf' },
		{ value: 'sent', label: 'Gesendet' },
		{ value: 'accepted', label: 'Akzeptiert' },
		{ value: 'rejected', label: 'Abgelehnt' }
	];

	const columns = [
		{ key: 'created_at', label: 'Datum', sortable: true, width: '120px' },
		{ key: 'offer_number', label: 'Angebots-Nr.' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'total_brutto_cents', label: 'Preis (brutto)', sortable: true, width: '140px' },
		{ key: 'status', label: 'Status', width: '120px' }
	];

	$effect(() => {
		loadOffers();
	});

	async function loadOffers() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (statusFilter) params.set('status', statusFilter);
			params.set('limit', String(limit));
			params.set('offset', String(offset));

			const res = await apiGet<OffersResponse>(`/api/v1/admin/offers?${params}`);
			offers = res.offers;
			total = res.total;
		} catch {
			offers = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	function setFilter(value: string) {
		statusFilter = value;
		offset = 0;
		loadOffers();
	}

	function prevPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			loadOffers();
		}
	}

	function nextPage() {
		if (offset + limit < total) {
			offset += limit;
			loadOffers();
		}
	}

	let currentPage = $derived(Math.floor(offset / limit) + 1);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="page">
	<div class="page-header">
		<h1>Angebote</h1>
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
	</div>

	<DataTable
		{columns}
		rows={offers}
		bind:sortKey
		bind:sortDir
		onRowClick={(row) => goto(`/admin/offers/${(row as Offer).id}`)}
	>
		{#snippet row(item, _i)}
			{@const o = item as Offer}
			<td>{formatDate(o.created_at)}</td>
			<td class="mono">{o.offer_number || '—'}</td>
			<td>{o.customer_name || '—'}</td>
			<td class="price">{o.total_brutto_cents != null ? formatEuro(o.total_brutto_cents) : '—'}</td>
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
	}

	.toolbar {
		margin-bottom: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: #ffffff;
		border: none;
		border-radius: 10px;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
		padding: 0.25rem;
		width: fit-content;
	}

	.tab {
		padding: 0.375rem 0.75rem;
		border-radius: 8px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #94a3b8;
		background: transparent;
		border: none;
		transition: all 150ms ease;
	}

	.tab:hover {
		color: #475569;
	}

	.tab.active {
		background: #6366f1;
		color: #ffffff;
	}

	.mono {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.8125rem;
		color: #334155;
	}

	.price {
		font-weight: 600;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.8125rem;
		color: #1a1a2e;
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

	@media (max-width: 768px) {
		.page-header {
			flex-wrap: wrap;
		}
		.tabs {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			flex-wrap: nowrap;
			width: 100%;
		}
		.tab {
			min-height: 44px;
			white-space: nowrap;
		}
		.pagination button {
			min-height: 44px;
			min-width: 44px;
			justify-content: center;
		}
	}
</style>
