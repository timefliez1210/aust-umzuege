<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDateTime } from '$lib/utils/api.svelte';
	import { Search, Plus, BellOff, Mail } from 'lucide-svelte';
	import DataTable from '$lib/components/admin/DataTable.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import PaginationControls from '$lib/components/admin/PaginationControls.svelte';

	interface EmailThread {
		id: string;
		/** null for a thread opened by mail we could not attribute to a customer. */
		customer_id: string | null;
		customer_email: string;
		customer_name: string | null;
		quote_id: string | null;
		subject: string | null;
		message_count: number;
		/** Inbound messages nobody has opened yet. */
		unread_count: number;
		/** Inbound messages not yet ticked off — what the Telegram reminder nags about. */
		unhandled_count: number;
		muted: boolean;
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
	/** Client-side filter — the server already returns the counts it needs. */
	let unreadOnly = $state(false);
	const limit = 20;

	// Compose state
	let showCompose = $state(false);
	let composeEmail = $state('');
	let composeCc = $state('');
	let composeBcc = $state('');
	let composeSubject = $state('');
	let composeBody = $state('');
	let composing = $state(false);

	const visibleThreads = $derived(unreadOnly ? threads.filter((t) => t.unread_count > 0) : threads);
	const unreadThreadCount = $derived(threads.filter((t) => t.unread_count > 0).length);

	/**
	 * Splits a comma- or semicolon-separated recipient string into addresses.
	 *
	 * Called by: handleCompose
	 * Purpose: The CC/BCC inputs are free text so the admin can paste a list in
	 *          whatever shape their mail client produced. The backend validates each
	 *          address and rejects the send with the offending one named, so this only
	 *          has to split and tidy.
	 */
	function parseAddressList(raw: string): string[] {
		return raw
			.split(/[,;]/)
			.map((a) => a.trim())
			.filter((a) => a.length > 0);
	}

	const columns = [
		{ key: 'customer', label: 'Kunde', sortable: true },
		{ key: 'subject', label: 'Betreff', sortable: true },
		{ key: 'message_count', label: 'Nachrichten', width: '120px' },
		{ key: 'unread', label: 'Status', width: '130px' },
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
				cc: parseAddressList(composeCc),
				bcc: parseAddressList(composeBcc),
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
		composeCc = '';
		composeBcc = '';
		composeSubject = '';
		composeBody = '';
	}

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

	<div class="toolbar">
		<div class="search-box">
			<Search size={16} />
			<input
				type="text"
				placeholder="Name, E-Mail, Betreff oder Nachrichtentext suchen..."
				bind:value={searchQuery}
				onkeydown={(e) => { if (e.key === 'Enter') handleSearch(); }}
			/>
		</div>
		<button
			class="filter-toggle"
			class:active={unreadOnly}
			onclick={() => (unreadOnly = !unreadOnly)}
			aria-pressed={unreadOnly}
		>
			<Mail size={14} />
			Nur ungelesene{unreadThreadCount > 0 ? ` (${unreadThreadCount})` : ''}
		</button>
	</div>

	<DataTable
		{columns}
		rows={visibleThreads}
		onRowClick={(row) => goto(`/admin/emails/${(row as EmailThread).id}`)}
	>
		{#snippet row(item, _i)}
			{@const t = item as EmailThread}
			<td class="cell-customer" class:is-unread={t.unread_count > 0}>
				<div class="customer-info">
					<span class="customer-name">{t.customer_name || t.customer_email || '(unbekannter Absender)'}</span>
					{#if t.customer_name}
						<span class="customer-email">{t.customer_email}</span>
					{/if}
				</div>
			</td>
			<td class="text-muted">{t.subject || '(kein Betreff)'}</td>
			<td class="text-center">{t.message_count}</td>
			<td>
				{#if t.unread_count > 0}
					<span class="badge badge-unread">{t.unread_count} ungelesen</span>
				{:else if t.unhandled_count > 0}
					<span class="badge badge-open">offen</span>
				{:else}
					<span class="text-muted">erledigt</span>
				{/if}
				{#if t.muted}
					<span class="muted-icon" title="Erinnerungen stummgeschaltet"><BellOff size={13} /></span>
				{/if}
			</td>
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
		<PaginationControls
			page={Math.floor(offset / limit)}
			total={total}
			limit={limit}
			onPrev={() => { offset = Math.max(0, offset - limit); loadThreads(); }}
			onNext={() => { offset += limit; loadThreads(); }}
		/>
	{/if}
</div>

{#if showCompose}
	<div
		class="modal-backdrop"
		role="presentation"
		onclick={cancelCompose}
		onkeydown={(e) => e.key === 'Escape' && cancelCompose()}
		tabindex="-1"
	>
		<div
			class="modal"
			role="dialog"
			aria-labelledby="compose-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 id="compose-title">Neue E-Mail verfassen</h2>
			<div class="form-field">
				<label for="compose-email">Empfänger</label>
				<input id="compose-email" type="email" placeholder="kunde@beispiel.de" bind:value={composeEmail} />
			</div>
			<div class="form-field">
				<label for="compose-cc">CC <span class="optional">(optional, mit Komma trennen)</span></label>
				<input id="compose-cc" type="text" placeholder="kollege@beispiel.de, buero@beispiel.de" bind:value={composeCc} />
			</div>
			<div class="form-field">
				<label for="compose-bcc">BCC <span class="optional">(optional)</span></label>
				<input id="compose-bcc" type="text" placeholder="archiv@beispiel.de" bind:value={composeBcc} />
			</div>
			<div class="form-field">
				<label for="compose-subject">Betreff</label>
				<input id="compose-subject" type="text" placeholder="Betreff..." bind:value={composeSubject} />
			</div>
			<div class="form-field">
				<label for="compose-body">Nachricht</label>
				<textarea id="compose-body" rows="6" placeholder="Nachrichtentext..." bind:value={composeBody}></textarea>
			</div>
			<div class="modal-actions">
				<button class="btn btn-create" onclick={handleCompose} disabled={composing || !composeEmail.trim() || !composeSubject.trim() || !composeBody.trim()}>
					{composing ? 'Erstelle...' : 'Erstellen'}
				</button>
				<button class="btn btn-cancel" onclick={cancelCompose} disabled={composing}>Abbrechen</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page {
		height: 100%;
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

	.toolbar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.badge-unread {
		background: var(--dt-primary, #1b6ca8);
		color: #fff;
	}

	.badge-open {
		background: color-mix(in srgb, var(--dt-primary, #1b6ca8) 15%, transparent);
		color: var(--dt-primary, #1b6ca8);
	}

	.cell-customer.is-unread .customer-name {
		font-weight: 700;
	}

	.muted-icon {
		display: inline-flex;
		vertical-align: middle;
		margin-left: 0.35rem;
		color: var(--text-muted, #888);
	}

	.filter-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border, #d7dde3);
		border-radius: 6px;
		background: var(--surface, #fff);
		color: var(--text, inherit);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.filter-toggle.active {
		border-color: var(--dt-primary, #1b6ca8);
		color: var(--dt-primary, #1b6ca8);
		background: color-mix(in srgb, var(--dt-primary, #1b6ca8) 10%, transparent);
	}

	.optional {
		font-weight: 400;
		color: var(--text-muted, #888);
		font-size: 0.8em;
	}

	.badge-inbound {
		background: var(--dt-surface-container);
		color: var(--dt-primary);
	}

	.badge-outbound {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

</style>
