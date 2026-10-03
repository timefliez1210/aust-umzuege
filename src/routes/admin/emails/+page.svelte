<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDateTime } from '$lib/utils/api.svelte';
	import { Plus, BellOff, ArrowDownLeft, ArrowUpRight } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import SearchInput from '$lib/components/ui/SearchInput.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
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

	// Once on mount; search/paging reload explicitly (untrack: not on every keystroke).
	$effect(() => {
		untrack(loadThreads);
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

<svelte:head><title>E-Mails</title></svelte:head>

<PageHeader title="E-Mails" count="{total} Unterhaltungen">
	{#snippet actions()}
		<Button variant="accent" onclick={() => (showCompose = true)}><Plus size={16} /> Neue E-Mail</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
	<FilterTabs
		label="Filter"
		options={[
			{ value: 'all', label: 'Alle' },
			{ value: 'unread', label: 'Ungelesen', count: unreadThreadCount || undefined }
		]}
		value={unreadOnly ? 'unread' : 'all'}
		onchange={(v) => (unreadOnly = v === 'unread')}
	/>
	<SearchInput bind:value={searchQuery} onsearch={handleSearch} placeholder="Name, E-Mail, Betreff, Text …" class="sm:ml-auto sm:w-80" />
</div>

{#if loading && threads.length === 0}
	<div class="h-80 animate-pulse rounded-md bg-sunk"></div>
{:else if visibleThreads.length === 0}
	<EmptyState title={unreadOnly ? 'Keine ungelesenen E-Mails' : 'Keine E-Mails gefunden'} />
{:else}
	<ul class="divide-y divide-line overflow-hidden rounded-md border border-line bg-panel {loading ? 'opacity-60' : ''}">
		{#each visibleThreads as t (t.id)}
			{@const unread = t.unread_count > 0}
			<li>
				<a
					href="/admin/emails/{t.id}"
					class="grid grid-cols-[10px_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-3 hover:bg-sunk/60 {unread ? 'bg-accent/[0.04]' : ''}"
				>
					<span class="mt-1.5 size-2 rounded-full {unread ? 'bg-accent' : ''}" aria-hidden="true"></span>
					<span class="flex min-w-0 flex-col gap-0.5">
						<span class="flex items-center gap-2">
							<span class="truncate text-sm {unread ? 'font-semibold' : 'font-medium'}">
								{t.customer_name || t.customer_email || '(unbekannter Absender)'}
							</span>
							{#if t.message_count > 1}<span class="num text-xs text-faint">{t.message_count}</span>{/if}
							{#if t.muted}<span class="text-faint" title="Erinnerungen stummgeschaltet"><BellOff size={13} /></span>{/if}
						</span>
						<span class="truncate text-[13px] {unread ? 'text-fg' : 'text-muted'}">{t.subject || '(kein Betreff)'}</span>
						{#if t.customer_name}<span class="truncate text-xs text-faint">{t.customer_email}</span>{/if}
					</span>
					<span class="flex flex-col items-end gap-1.5">
						<span class="num text-xs whitespace-nowrap text-faint">{t.last_message_at ? formatDateTime(t.last_message_at) : '—'}</span>
						<span class="flex items-center gap-1.5">
							{#if t.last_direction === 'inbound'}
								<ArrowDownLeft size={13} class="text-info" aria-label="Eingang" />
							{:else if t.last_direction === 'outbound'}
								<ArrowUpRight size={13} class="text-faint" aria-label="Ausgang" />
							{/if}
							{#if unread}
								<Badge tone="accent">{t.unread_count} neu</Badge>
							{:else if t.unhandled_count > 0}
								<Badge tone="warn">offen</Badge>
							{:else}
								<Badge>erledigt</Badge>
							{/if}
						</span>
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}

{#if totalPages > 1}
	<PaginationControls
		page={Math.floor(offset / limit)}
		{total}
		{limit}
		onPrev={() => {
			offset = Math.max(0, offset - limit);
			loadThreads();
		}}
		onNext={() => {
			offset += limit;
			loadThreads();
		}}
	/>
{/if}

{#if showCompose}
	<Modal title="Neue E-Mail" size="lg" onclose={cancelCompose}>
		<div class="flex flex-col gap-3">
			<Field label="Empfänger" for="compose-email"><Input id="compose-email" type="email" placeholder="kunde@beispiel.de" bind:value={composeEmail} /></Field>
			<div class="grid gap-3 sm:grid-cols-2">
				<Field label="CC (optional, mit Komma trennen)" for="compose-cc">
					<Input id="compose-cc" placeholder="kollege@beispiel.de, buero@beispiel.de" bind:value={composeCc} />
				</Field>
				<Field label="BCC (optional)" for="compose-bcc"><Input id="compose-bcc" placeholder="archiv@beispiel.de" bind:value={composeBcc} /></Field>
			</div>
			<Field label="Betreff" for="compose-subject"><Input id="compose-subject" placeholder="Betreff …" bind:value={composeSubject} /></Field>
			<Field label="Nachricht" for="compose-body"><Textarea id="compose-body" rows={8} placeholder="Nachrichtentext …" bind:value={composeBody} /></Field>
			<p class="text-xs text-faint">Wird als Entwurf angelegt — Senden in der Unterhaltung.</p>
		</div>
		{#snippet footer()}
			<Button onclick={cancelCompose} disabled={composing}>Abbrechen</Button>
			<Button
				variant="solid"
				onclick={handleCompose}
				disabled={composing || !composeEmail.trim() || !composeSubject.trim() || !composeBody.trim()}
			>
				{composing ? 'Erstelle …' : 'Entwurf erstellen'}
			</Button>
		{/snippet}
	</Modal>
{/if}
