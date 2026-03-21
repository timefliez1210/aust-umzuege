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

	/**
	 * Fetches a paginated, optionally searched list of email threads from the API.
	 *
	 * Called by: $effect (on mount and whenever searchQuery or offset changes),
	 *            handleSearch, prevPage, nextPage
	 * Purpose: Populates the DataTable with the current page of email thread summaries
	 *          via GET /api/v1/admin/emails, supporting server-side search across customer
	 *          name, email address, and subject line.
	 *
	 * @returns void
	 */
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

	/**
	 * Resets pagination to the first page and triggers a fresh email thread search.
	 *
	 * Called by: Template (search input onkeydown Enter)
	 * Purpose: Ensures that when a new search term is entered the result set always starts
	 *          from page 1 rather than a mid-list offset from a previous query.
	 *
	 * @returns void
	 */
	function handleSearch() {
		offset = 0;
		loadThreads();
	}

	/**
	 * Navigates to the previous page of the email thread list.
	 *
	 * Called by: Template (previous-page pagination button click)
	 * Purpose: Decrements the offset by one page length (clamped to 0) and reloads the
	 *          thread list so the admin can browse backwards through correspondence history.
	 *
	 * @returns void
	 */
	function prevPage() {
		if (offset > 0) { offset = Math.max(0, offset - limit); loadThreads(); }
	}

	/**
	 * Navigates to the next page of the email thread list.
	 *
	 * Called by: Template (next-page pagination button click)
	 * Purpose: Increments the offset by one page length when further threads exist and
	 *          reloads the list to display the following page of results.
	 *
	 * @returns void
	 */
	function nextPage() {
		if (offset + limit < total) { offset += limit; loadThreads(); }
	}

	/**
	 * Composes and saves a new outbound email thread as a draft via the API.
	 *
	 * Called by: Template ("Erstellen" button click in the compose form)
	 * Purpose: Validates that all three required compose fields are non-empty, then POSTs
	 *          to POST /api/v1/admin/emails/compose to create a draft message in a new thread.
	 *          On success the admin is redirected to the newly created thread's detail page.
	 *
	 * @returns void
	 */
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

	/**
	 * Dismisses the compose panel and clears all draft compose fields.
	 *
	 * Called by: Template ("Abbrechen" button click in the compose form)
	 * Purpose: Hides the compose form without saving and resets recipient, subject, and body
	 *          state so the form starts blank the next time it is opened.
	 *
	 * @returns void
	 */
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
		color: var(--dt-on-surface);
	}

	.page-count {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		flex: 1;
	}

	.btn-new {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		font-weight: 600;
		font-size: 0.8125rem;
		border: none;
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}

	.btn-new:hover {
		opacity: 0.88;
	}

	.compose-form {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		margin-bottom: 1rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.compose-form h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		margin-bottom: 1rem;
	}

	.form-field {
		margin-bottom: 0.75rem;
	}

	.form-field label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.25rem;
	}

	.form-field input,
	.form-field textarea {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
		outline: none;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
		box-sizing: border-box;
	}

	.form-field input:focus,
	.form-field textarea:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
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
		border-radius: var(--dt-radius-sm);
		cursor: pointer;
		transition: opacity var(--dt-transition), background var(--dt-transition);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-create {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
	}

	.btn-create:hover:not(:disabled) {
		opacity: 0.88;
	}

	.btn-cancel {
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface-variant);
		border: var(--dt-ghost-border);
	}

	.btn-cancel:hover:not(:disabled) {
		background: var(--dt-surface-container-low);
		color: var(--dt-on-surface);
	}

	.toolbar {
		display: flex;
		margin-bottom: 1rem;
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
		width: 320px;
	}

	.search-box input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.customer-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.customer-name {
		font-weight: 500;
		color: var(--dt-on-surface);
	}

	.customer-email {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.text-muted {
		color: var(--dt-on-surface-variant);
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
		background: var(--dt-surface-container);
		color: var(--dt-primary);
	}

	.badge-outbound {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
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

	.pagination span {
		color: var(--dt-on-surface-variant);
	}

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
		.btn-new {
			min-height: 44px;
		}
		.btn-create {
			min-height: 44px;
		}
		.btn-cancel {
			min-height: 44px;
		}
		.pagination button {
			min-height: 44px;
			min-width: 44px;
			justify-content: center;
		}
	}
</style>
