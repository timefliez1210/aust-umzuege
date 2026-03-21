<script lang="ts">
	import { page } from '$app/stores';
	import { apiGet, apiPost, apiPatch, formatDateTime } from '$lib/utils/api.svelte';
	import { ArrowLeft, ExternalLink, Send, X, Pencil, Save } from 'lucide-svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';

	interface EmailMessage {
		id: string;
		direction: string;
		from_address: string;
		to_address: string;
		subject: string | null;
		body_text: string | null;
		llm_generated: boolean;
		status: string;
		created_at: string;
	}

	interface EmailThread {
		id: string;
		customer_id: string;
		customer_email: string;
		customer_name: string | null;
		quote_id: string | null;
		subject: string | null;
		created_at: string;
	}

	interface ThreadResponse {
		thread: EmailThread;
		messages: EmailMessage[];
	}

	let data = $state<ThreadResponse | null>(null);
	let loading = $state(true);
	let error = $state('');
	let actionLoading = $state<string | null>(null);

	// Edit draft state
	let editingId = $state<string | null>(null);
	let editSubject = $state('');
	let editBody = $state('');
	let saving = $state(false);

	// Reply state
	let showReply = $state(false);
	let replySubject = $state('');
	let replyBody = $state('');
	let replying = $state(false);

	$effect(() => {
		loadThread();
	});

	/**
	 * Fetches the full email thread including all messages for the current route ID.
	 *
	 * Called by: $effect (on mount), sendDraft, discardDraft, saveEdit, saveReply (after mutations)
	 * Purpose: Loads thread metadata and the ordered message list from
	 *          GET /api/v1/admin/emails/{id} so the conversation view stays in sync with
	 *          the server state after every action.
	 *
	 * @returns void
	 */
	async function loadThread() {
		loading = true;
		error = '';
		try {
			data = await apiGet<ThreadResponse>(`/api/v1/admin/emails/${$page.params.id}`);
		} catch (e) {
			error = (e as Error).message;
		} finally {
			loading = false;
		}
	}

	/**
	 * Sends a saved draft message to the customer after a confirmation prompt.
	 *
	 * Called by: Template ("Senden" button click on a draft message bubble)
	 * Purpose: Asks the admin to confirm before transmission, then POSTs to
	 *          POST /api/v1/admin/emails/messages/{msgId}/send to dispatch the email.
	 *          Reloads the thread on success so the message status updates to "sent".
	 *
	 * @param msgId - The ID of the draft message to send
	 * @returns void
	 */
	async function sendDraft(msgId: string) {
		if (!confirm('E-Mail jetzt an den Kunden senden?')) return;
		actionLoading = msgId;
		try {
			const res = await apiPost<{ message: string }>(`/api/v1/admin/emails/messages/${msgId}/send`);
			showToast(res.message, 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			actionLoading = null;
		}
	}

	/**
	 * Discards a draft message after a confirmation prompt.
	 *
	 * Called by: Template ("Verwerfen" button click on a draft message bubble)
	 * Purpose: Presents a confirmation dialog to prevent accidental discards, then POSTs to
	 *          POST /api/v1/admin/emails/messages/{msgId}/discard to permanently delete the
	 *          draft. The thread is reloaded so the discarded message disappears from the UI.
	 *
	 * @param msgId - The ID of the draft message to discard
	 * @returns void
	 */
	async function discardDraft(msgId: string) {
		if (!confirm('Entwurf verwerfen?')) return;
		actionLoading = msgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/discard`);
			showToast('Entwurf verworfen', 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			actionLoading = null;
		}
	}

	/**
	 * Opens the inline edit form for a draft message, pre-filling it with the current content.
	 *
	 * Called by: Template ("Bearbeiten" button click on a draft message bubble)
	 * Purpose: Sets the active editing ID and seeds the editable subject and body fields with
	 *          the draft's existing text so the admin can make targeted changes without
	 *          rewriting the whole message from scratch.
	 *
	 * @param msg - The draft EmailMessage object whose content should be loaded into the editor
	 * @returns void
	 */
	function startEdit(msg: EmailMessage) {
		editingId = msg.id;
		editSubject = msg.subject || '';
		editBody = msg.body_text || '';
	}

	/**
	 * Closes the inline draft editor and clears temporary edit state without saving.
	 *
	 * Called by: Template ("Abbrechen" button click inside the edit form)
	 * Purpose: Resets editingId, editSubject, and editBody so the message bubble reverts to
	 *          read-only view and no partial edits linger in state.
	 *
	 * @returns void
	 */
	function cancelEdit() {
		editingId = null;
		editSubject = '';
		editBody = '';
	}

	/**
	 * Saves the edited subject and body of a draft message to the API.
	 *
	 * Called by: Template ("Speichern" button click inside the inline edit form)
	 * Purpose: PATCHes the draft message via PATCH /api/v1/admin/emails/messages/{msgId}
	 *          with the updated subject and body text, then closes the editor and reloads
	 *          the thread to reflect the saved content.
	 *
	 * @param msgId - The ID of the draft message being edited
	 * @returns void
	 */
	async function saveEdit(msgId: string) {
		saving = true;
		try {
			await apiPatch(`/api/v1/admin/emails/messages/${msgId}`, {
				subject: editSubject || null,
				body_text: editBody || null,
			});
			showToast('Entwurf gespeichert', 'success');
			editingId = null;
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			saving = false;
		}
	}

	/**
	 * Creates a new outbound reply message as a draft within the current thread.
	 *
	 * Called by: Template ("Als Entwurf speichern" button click in the reply composer)
	 * Purpose: Validates that the reply body is non-empty, then POSTs to
	 *          POST /api/v1/admin/emails/{id}/reply to append a draft reply to the thread.
	 *          Clears the reply form and reloads the thread so the new draft appears inline.
	 *
	 * @returns void
	 */
	async function saveReply() {
		if (!replyBody.trim()) return;
		replying = true;
		try {
			await apiPost(`/api/v1/admin/emails/${$page.params.id}/reply`, {
				subject: replySubject.trim() || null,
				body_text: replyBody.trim(),
			});
			showToast('Antwort als Entwurf gespeichert', 'success');
			replySubject = '';
			replyBody = '';
			showReply = false;
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			replying = false;
		}
	}
</script>

<div class="page">
	<div class="page-nav">
		<a href="/admin/emails" class="back-link"><ArrowLeft size={16} /> E-Mails</a>
	</div>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if error}
		<div class="error-msg">{error}</div>
	{:else if data}
		<div class="page-header">
			<div class="header-info">
				<h1>{data.thread.customer_name || data.thread.customer_email}</h1>
				{#if data.thread.subject}
					<span class="thread-subject">{data.thread.subject}</span>
				{/if}
			</div>
			{#if data.thread.quote_id}
				<a href="/admin/inquiries/{data.thread.quote_id}" class="link-quote">
					<ExternalLink size={14} /> Zur Anfrage
				</a>
			{/if}
		</div>

		<div class="conversation">
			{#each data.messages as msg}
				<div
					class="message"
					class:inbound={msg.direction === 'inbound'}
					class:outbound={msg.direction === 'outbound' && msg.status !== 'draft'}
					class:draft={msg.status === 'draft'}
				>
					<div class="message-header">
						<span class="message-from">
							{#if msg.status === 'draft'}
								Entwurf an {msg.to_address}
							{:else if msg.direction === 'inbound'}
								{msg.from_address}
							{:else}
								AUST Umzuege
							{/if}
						</span>
						<div class="message-meta">
							{#if msg.status === 'draft'}
								<span class="badge-draft">Entwurf</span>
							{/if}
							{#if msg.llm_generated}
								<span class="badge-ai">KI-generiert</span>
							{/if}
							<span class="message-date">{formatDateTime(msg.created_at)}</span>
						</div>
					</div>

					{#if editingId === msg.id}
						<div class="edit-fields">
							<input
								class="edit-subject"
								type="text"
								placeholder="Betreff"
								bind:value={editSubject}
							/>
							<textarea
								class="edit-body"
								rows="8"
								placeholder="Nachrichtentext..."
								bind:value={editBody}
							></textarea>
						</div>
						<div class="draft-actions">
							<button
								class="btn btn-save"
								onclick={() => saveEdit(msg.id)}
								disabled={saving}
							>
								<Save size={14} />
								{saving ? 'Speichere...' : 'Speichern'}
							</button>
							<button
								class="btn btn-cancel"
								onclick={cancelEdit}
								disabled={saving}
							>
								Abbrechen
							</button>
						</div>
					{:else}
						{#if msg.subject}
							<div class="message-subject">{msg.subject}</div>
						{/if}
						<div class="message-body">{msg.body_text || ''}</div>

						{#if msg.status === 'draft'}
							<div class="draft-actions">
								<button
									class="btn btn-send"
									onclick={() => sendDraft(msg.id)}
									disabled={actionLoading === msg.id}
								>
									<Send size={14} />
									{actionLoading === msg.id ? 'Sende...' : 'Senden'}
								</button>
								<button
									class="btn btn-edit"
									onclick={() => startEdit(msg)}
									disabled={actionLoading === msg.id}
								>
									<Pencil size={14} />
									Bearbeiten
								</button>
								<button
									class="btn btn-discard"
									onclick={() => discardDraft(msg.id)}
									disabled={actionLoading === msg.id}
								>
									<X size={14} />
									Verwerfen
								</button>
							</div>
						{/if}
					{/if}
				</div>
			{/each}

			{#if data.messages.length === 0}
				<div class="empty">Keine Nachrichten in diesem Thread</div>
			{/if}
		</div>

		<!-- Reply composer -->
		<div class="reply-section">
			{#if showReply}
				<div class="reply-form">
					<h3>Antwort verfassen</h3>
					<div class="form-field">
						<label for="reply-subject">Betreff (optional)</label>
						<input
							id="reply-subject"
							type="text"
							placeholder={data.thread.subject || 'Betreff...'}
							bind:value={replySubject}
						/>
					</div>
					<div class="form-field">
						<label for="reply-body">Nachricht</label>
						<textarea
							id="reply-body"
							rows="6"
							placeholder="Antwort schreiben..."
							bind:value={replyBody}
						></textarea>
					</div>
					<div class="reply-actions">
						<button
							class="btn btn-save"
							onclick={saveReply}
							disabled={replying || !replyBody.trim()}
						>
							<Save size={14} />
							{replying ? 'Speichere...' : 'Als Entwurf speichern'}
						</button>
						<button
							class="btn btn-cancel"
							onclick={() => { showReply = false; replySubject = ''; replyBody = ''; }}
							disabled={replying}
						>
							Abbrechen
						</button>
					</div>
				</div>
			{:else}
				<button class="btn btn-reply" onclick={() => { showReply = true; }}>
					<Send size={14} /> Antworten
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.page { max-width: 900px; }
	.page-nav { margin-bottom: 1rem; }
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-decoration: none;
		transition: color var(--dt-transition);
	}
	.back-link:hover { color: var(--dt-on-surface); }

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}

	.header-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.thread-subject {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.link-quote {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary);
		font-weight: 600;
		font-size: 0.8125rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		text-decoration: none;
		transition: background var(--dt-transition);
		white-space: nowrap;
	}

	.link-quote:hover {
		background: var(--dt-surface-container-low);
	}

	.loading { text-align: center; color: var(--dt-on-surface-variant); padding: 3rem; }
	.error-msg {
		background: var(--dt-surface-container);
		color: var(--dt-secondary);
		border-radius: var(--dt-radius-md);
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
	}
	.empty { text-align: center; color: var(--dt-on-surface-variant); padding: 3rem; font-size: 0.875rem; }

	.conversation {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		border-radius: var(--dt-radius-md);
		padding: 1rem 1.25rem;
		max-width: 85%;
	}

	.message.inbound {
		align-self: flex-start;
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
	}

	.message.outbound {
		align-self: flex-end;
		background: var(--dt-surface-container);
		box-shadow: var(--dt-shadow-ambient);
	}

	.message.draft {
		align-self: flex-end;
		background: var(--dt-surface-container-low);
		border: 2px dashed var(--dt-outline-variant);
		box-shadow: var(--dt-shadow-ambient);
	}

	.message-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.message-from {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.message-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.message-date {
		font-size: 0.6875rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.badge-ai {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.badge-draft {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.message-subject {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}

	.message-body {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.edit-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.edit-subject {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
		outline: none;
		box-sizing: border-box;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-subject:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.edit-body {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
		box-sizing: border-box;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.edit-body:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.draft-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-outline-variant);
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

	.btn-send {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
	}

	.btn-send:hover:not(:disabled) {
		opacity: 0.88;
	}

	.btn-edit {
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary);
		border: var(--dt-ghost-border);
	}

	.btn-edit:hover:not(:disabled) {
		background: var(--dt-surface-container-low);
	}

	.btn-save {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
	}

	.btn-save:hover:not(:disabled) {
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

	.btn-discard {
		background: var(--dt-surface-container-lowest);
		color: var(--dt-secondary);
		border: var(--dt-ghost-border);
	}

	.btn-discard:hover:not(:disabled) {
		background: var(--dt-surface-container-low);
	}

	/* Reply section */
	.reply-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--dt-outline-variant);
	}

	.btn-reply {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary);
		font-weight: 600;
		font-size: 0.875rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		box-shadow: var(--dt-shadow-ambient);
		transition: background var(--dt-transition);
	}

	.btn-reply:hover {
		background: var(--dt-surface-container-low);
	}

	.reply-form {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		box-shadow: var(--dt-shadow-ambient);
	}

	.reply-form h3 {
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

	.reply-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.page-header { flex-wrap: wrap; }

		.message { max-width: 100%; }
		.message-body { max-width: 100%; overflow-wrap: break-word; }
		.message-header { flex-wrap: wrap; gap: 0.375rem; }

		.draft-actions { flex-wrap: wrap; }
		.reply-actions { flex-wrap: wrap; }

		.btn { min-height: 44px; }
		.btn-reply { min-height: 44px; }
		.link-quote { min-height: 44px; }
	}
</style>
