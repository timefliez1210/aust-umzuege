<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { apiGet, apiPatch, formatDate } from '$lib/utils/api.svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Plus } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';
	import CreateInquiryModal from './_components/CreateInquiryModal.svelte';
	import { INQUIRY_STATUS_LABELS } from '$lib/utils/status';
	import { SERVICE_TYPE_LABELS } from '$lib/utils/constants';

	interface InquiryListItem {
		id: string;
		customer_name: string | null;
		customer_email: string;
		salutation: string | null;
		customer_type: string | null;
		service_type: string | null;
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
	// `?neu=1` opens the form directly — the "Neue Anfrage" button on Heute and in ⌘K.
	let showCreateForm = $state($page.url.searchParams.get('neu') === '1');

	const tabs = [
		{ value: '', label: 'Alle' },
		{ value: 'pending', label: 'Offen' },
		{ value: 'estimating', label: 'Schätzung' },
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
		{ key: 'service_type', label: 'Art', width: '110px' },
		{ key: 'customer_name', label: 'Kunde', sortable: true },
		{ key: 'route', label: 'Von / Nach' },
		{ key: 'volume_m3', label: 'Volumen', sortable: true, width: '100px' },
		{ key: 'status', label: 'Status', width: '140px' }
	];

	// Loads on mount and whenever the sort changes. Filters, search and paging call
	// loadInquiries themselves; `untrack` keeps the bound search text from re-running
	// this on every keystroke.
	$effect(() => {
		void sortKey;
		void sortDir;
		untrack(() => {
			offset = 0;
			loadInquiries();
		});
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
			params.set('sort', sortKey);
			params.set('dir', sortDir);
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

	// Inline status editing in the list row
	let editingStatusId = $state<string | null>(null);
	let patchingStatusId = $state<string | null>(null);

	const statusOptions = Object.entries(INQUIRY_STATUS_LABELS);

	/**
	 * PATCHes the inquiry status and updates the local row in-place.
	 *
	 * Called by: Template (status select onchange in list row)
	 * Purpose: Lets Alex change inquiry status from the list without opening the detail page.
	 *
	 * @param id        — Inquiry UUID
	 * @param newStatus — Target status string (e.g. "scheduled")
	 */
	async function handleStatusChange(id: string, newStatus: string) {
		const current = inquiries.find(i => i.id === id)?.status;
		editingStatusId = null;
		if (newStatus === current) return;
		patchingStatusId = id;
		try {
			await apiPatch(`/api/v1/inquiries/${id}`, { status: newStatus });
			inquiries = inquiries.map(i => i.id === id ? { ...i, status: newStatus } : i);
			showToast('Status aktualisiert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			patchingStatusId = null;
		}
	}
</script>

<svelte:head><title>Anfragen</title></svelte:head>

<PageHeader title="Anfragen" count="{total} gesamt">
	{#snippet actions()}
		<Button variant="accent" onclick={() => (showCreateForm = true)}><Plus size={16} strokeWidth={2.2} /> Neue Anfrage</Button>
	{/snippet}
</PageHeader>

{#if showCreateForm}
	<CreateInquiryModal bind:open={showCreateForm} onCreated={(id) => goto(`/admin/inquiries/${id}`)} />
{/if}

<div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
	<FilterTabs options={tabs} bind:value={statusFilter} onchange={setFilter} label="Status" />
	<SearchInput bind:value={searchQuery} onsearch={handleSearch} placeholder="Name, E-Mail, Ort …" class="lg:w-72" />
</div>

<div class={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
	<DataTable
		{columns}
		rows={inquiries}
		bind:sortKey
		bind:sortDir
		emptyMessage={loading ? 'Laden …' : 'Keine Anfragen gefunden'}
		onRowClick={(row) => {
			const id = (row as InquiryListItem).id;
			if (id) goto(`/admin/inquiries/${id}`);
		}}
	>
		{#snippet card(item, _i)}
			{@const q = item as InquiryListItem}
			<span class="flex items-start justify-between gap-3">
				<span class="flex min-w-0 flex-col">
					<span class="truncate font-semibold">{q.customer_name || q.customer_email}</span>
					<span class="truncate text-[13px] text-muted">
						{#if q.origin_city && q.destination_city}{q.origin_city} → {q.destination_city}{:else}—{/if}
					</span>
				</span>
				<StatusBadge status={q.status} />
			</span>
			<span class="num mt-2 flex items-center gap-3 text-xs text-faint">
				<span>{formatDate(q.created_at)}</span>
				{#if q.service_type}<span>{SERVICE_TYPE_LABELS[q.service_type] ?? q.service_type}</span>{/if}
				{#if q.volume_m3 != null}<span class="ml-auto text-muted">{q.volume_m3.toFixed(1)} m³</span>{/if}
			</span>
		{/snippet}
		{#snippet row(item, _i)}
			{@const q = item as InquiryListItem}
			<td class="num text-[13px] whitespace-nowrap text-muted">{formatDate(q.created_at)}</td>
			<td>
				{#if q.service_type}
					<Badge>{SERVICE_TYPE_LABELS[q.service_type] ?? q.service_type}</Badge>
				{:else}
					<span class="text-faint">—</span>
				{/if}
			</td>
			<td>
				<div class="font-medium">
					{#if q.salutation}<span class="mr-1.5 text-faint">{q.salutation === 'D' ? 'Div.' : q.salutation}</span>{/if}{q.customer_name ||
						q.customer_email}
				</div>
				{#if q.customer_name}<div class="text-xs text-faint">{q.customer_email}</div>{/if}
			</td>
			<td>
				{#if q.origin_city && q.destination_city}
					{q.origin_city} <span class="text-faint">→</span> {q.destination_city}
				{:else}
					<span class="text-faint">—</span>
				{/if}
			</td>
			<td class="num whitespace-nowrap">
				{#if q.volume_m3 != null}
					{q.volume_m3.toFixed(1)} m³
				{:else}
					<span class="text-faint">—</span>
				{/if}
			</td>
			<!-- stopPropagation: changing the status must not open the inquiry -->
			<td onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				{#if patchingStatusId === q.id}
					<span class="text-faint">…</span>
				{:else if editingStatusId === q.id}
					<!-- svelte-ignore a11y_autofocus -->
					<select
						class="h-8 rounded-sm border border-line-strong bg-panel px-2 text-[13px] text-fg"
						value={q.status}
						autofocus
						onchange={(e) => handleStatusChange(q.id, (e.target as HTMLSelectElement).value)}
						onblur={() => {
							editingStatusId = null;
						}}
					>
						{#each statusOptions as [val, label] (val)}
							<option value={val}>{label}</option>
						{/each}
					</select>
				{:else}
					<button
						type="button"
						title="Status ändern"
						class="rounded-xs hover:opacity-80"
						onclick={() => {
							editingStatusId = q.id;
						}}
					>
						<StatusBadge status={q.status} />
					</button>
				{/if}
			</td>
		{/snippet}
	</DataTable>
</div>

{#if totalPages > 1}
	<PaginationControls page={currentPage - 1} {total} {limit} onPrev={prevPage} onNext={nextPage} />
{/if}
