<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDateTime } from '$lib/utils/api.svelte';
	import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';

	interface EmailThread {
		id: string;
		customer_id: string;
		customer_email: string;
		customer_name: string | null;
		quote_id: string | null;
		subject: string | null;
		message_count: number;
		last_message_at: string | null;
		last_direction: string | null;
		created_at: string;
	}

	interface EmailThreadsResponse {
		threads: EmailThread[];
		total: number;
	}

	let threads = $state<EmailThread[]>([]);
	let total = $state(0);
	let loading = $state(true);
	let searchQuery = $state('');
	let offset = $state(0);
	const limit = 20;

	// Compose state
	let showCompose = $state(false);
	let composeEmail = $state('');
	let composeSubject = $state('');
	let composeBody = $state('');
	let composing = $state(false);

	const columns = [
		{ key: 'customer', label: 'Kunde', sortable: true },
		{ key: 'subject', label: 'Betreff', sortable: true },
		{ key: 'message_count', label: 'Nachrichten', width: '120px' },
		{ key: 'last_message_at', label: 'Letzte Nachricht', sortable: true, width: '160px' },
		{ key: 'direction', label: 'Richtung', width: '100px' }
	];

	$effect(() => {
		loadThreads();
	});

	async function loadThreads() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (searchQuery) params.set('search', searchQuery);
			params.set('limit', String(limit));
			params.set('offset', String(offset));
			const res = await apiGet<EmailThreadsResponse>(`/api/v1/admin/emails?${params}`);
			threads = res.threads;
			total = res.total;
		} catch {
			threads = [];
			total = 0;
		} finally {
			loading = false;
		}
	}

	function handleSearch() {
		offset = 0;
		loadThreads();
	}

	function prevPage() {
		if (offset > 0) { offset = Math.max(0, offset - limit); loadThreads(); }
	}

	function nextPage() {
		if (offset + limit < total) { offset += limit; loadThreads(); }
	}

	async function handleCompose() {
		if (!composeEmail.trim() || !composeSubject.trim() || !composeBody.trim()) return;
		composing = true;
		try {
			const res = await apiPost<{ thread_id: string; message_id: string }>('/api/v1/admin/emails/compose', {
				customer_email: composeEmail.trim(),
				subject: composeSubject.trim(),
				body_text: composeBody.trim(),
			});
			showToast('E-Mail-Entwurf erstellt', 'success');
			goto(`/admin/emails/${res.thread_id}`);
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			composing = false;
		}
	}

	function cancelCompose() {
		showCompose = false;
		composeEmail = '';
		composeSubject = '';
		composeBody = '';
	}

	let currentPage = $derived(Math.floor(offset / limit) + 1);
	let totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
</script>

<div class="page">
	<div class="page-header">
		<h1>E-Mails</h1>
		<span class="page-count">{total} gesamt</span>
		<button class="btn btn-new" onclick={() => { showCompose = !showCompose; }}>
			<Plus size={16} /> Neue E-Mail
		</button>
	</div>

	{#if showCompose}
		<div class="compose-form">
			<h3>Neue E-Mail verfassen</h3>
			<div class="form-field">
				<label for="compose-email">Empfänger</label>
				<input id="compose-email" type="email" placeholder="kunde@beispiel.de" bind:value={composeEmail} />
			</div>
			<div class="form-field">
				<label for="compose-subject">Betreff</label>
				<input id="compose-subject" type="text" placeholder="Betreff..." bind:value={composeSubject} />
			</div>
			<div class="form-field">
				<label for="compose-body">Nachricht</label>
				<textarea id="compose-body" rows="6" placeholder="Nachrichtentext..." bind:value={composeBody}></textarea>
			</div>
			<div class="compose-actions">
				<button class="btn btn-create" onclick={handleCompose} disabled={composing || !composeEmail.trim() || !composeSubject.trim() || !composeBody.trim()}>
					{composing ? 'Erstelle...' : 'Erstellen'}
				</button>
				<button class="btn btn-cancel" onclick={cancelCompose} disabled={composing}>Abbrechen</button>
			</div>
		</div>
	{/if}

	<div class="toolbar">
		<div class="search-box">
			<Search size={16} />
			<input
				type="text"
				placeholder="Name, E-Mail oder Betreff suchen..."
				bind:value={searchQuery}
				onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			/>
		</div>
	</div>

	<DataTable
		{columns}
		rows={threads}
		onRowClick={(row) => goto(`/admin/emails/${(row as EmailThread).id}`)}
	>
		{#snippet row(item, _i)}
			{@const t = item as EmailThread}
			<td class="cell-customer">
				<div class="customer-info">
					<span class="customer-name">{t.customer_name || t.customer_email}</span>
					{#if t.customer_name}
						<span class="customer-email">{t.customer_email}</span>
					{/if}
				</div>
			</td>
			<td class="text-muted">{t.subject || '(kein Betreff)'}</td>
			<td class="text-center">{t.message_count}</td>
			<td class="text-muted">{t.last_message_at ? formatDateTime(t.last_message_at) : '—'}</td>
			<td>
				{#if t.last_direction === 'inbound'}
					<span class="badge badge-inbound">Eingang</span>
				{:else if t.last_direction === 'outbound'}
					<span class="badge badge-outbound">Ausgang</span>
				{:else}
					<span class="text-muted">—</span>
				{/if}
			</td>
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

	.btn-new {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: #6366f1;
		color: #ffffff;
		font-weight: 600;
		font-size: 0.8125rem;
		border: none;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: 2px 2px 6px rgba(99, 102, 241, 0.3);
		transition: all 150ms ease;
	}

	.btn-new:hover {
		background: #4f46e5;
	}

	.compose-form {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.25rem;
		margin-bottom: 1rem;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.compose-form h3 {
		font-size: 1rem;
		font-weight: 600;
		color: #1a1a2e;
		margin-bottom: 1rem;
	}

	.form-field {
		margin-bottom: 0.75rem;
	}

	.form-field label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
		margin-bottom: 0.25rem;
	}

	.form-field input,
	.form-field textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #1a1a2e;
		background: #f8fafc;
		outline: none;
		transition: border-color 150ms;
		box-sizing: border-box;
	}

	.form-field input:focus,
	.form-field textarea:focus {
		border-color: #6366f1;
	}

	.form-field textarea {
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
	}

	.compose-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		font-weight: 600;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-create {
		background: #6366f1;
		color: #ffffff;
		box-shadow: 2px 2px 6px rgba(99, 102, 241, 0.3);
	}

	.btn-create:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn-cancel {
		background: #ffffff;
		color: #64748b;
		border: 1px solid #e2e8f0;
	}

	.btn-cancel:hover:not(:disabled) {
		background: #f8fafc;
		border-color: #cbd5e1;
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
		width: 320px;
	}

	.search-box input::placeholder {
		color: #94a3b8;
	}

	.customer-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-name {
		font-weight: 500;
		color: #1a1a2e;
	}

	.customer-email {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.text-muted {
		color: #94a3b8;
	}

	.text-center {
		text-align: center;
	}

	.badge {
		display: inline-block;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.badge-inbound {
		background: #dbeafe;
		color: #1d4ed8;
	}

	.badge-outbound {
		background: #d1fae5;
		color: #065f46;
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
