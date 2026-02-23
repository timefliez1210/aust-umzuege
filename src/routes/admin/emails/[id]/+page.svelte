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

	function startEdit(msg: EmailMessage) {
		editingId = msg.id;
		editSubject = msg.subject || '';
		editBody = msg.body_text || '';
	}

	function cancelEdit() {
		editingId = null;
		editSubject = '';
		editBody = '';
	}

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
				<a href="/admin/quotes/{data.thread.quote_id}" class="link-quote">
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
	.back-link { display: inline-flex; align-items: center; gap: 0.375rem; color: #94a3b8; font-size: 0.875rem; text-decoration: none; transition: color 150ms; }
	.back-link:hover { color: #6366f1; }

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
		color: #1a1a2e;
	}

	.thread-subject {
		font-size: 0.875rem;
		color: #64748b;
	}

	.link-quote {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: #ffffff;
		color: #6366f1;
		font-weight: 600;
		font-size: 0.8125rem;
		border: 1px solid #e0e7ff;
		border-radius: 10px;
		text-decoration: none;
		transition: all 150ms ease;
		white-space: nowrap;
	}

	.link-quote:hover {
		background: #eef2ff;
		border-color: #c7d2fe;
	}

	.loading { text-align: center; color: #94a3b8; padding: 3rem; }
	.error-msg { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.875rem; }
	.empty { text-align: center; color: #94a3b8; padding: 3rem; font-size: 0.875rem; }

	.conversation {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.message {
		border-radius: 12px;
		padding: 1rem 1.25rem;
		max-width: 85%;
	}

	.message.inbound {
		align-self: flex-start;
		background: #ffffff;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.message.outbound {
		align-self: flex-end;
		background: #eef2ff;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.message.draft {
		align-self: flex-end;
		background: #fffbeb;
		border: 2px dashed #f59e0b;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
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
		color: #334155;
	}

	.message-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.message-date {
		font-size: 0.6875rem;
		color: #94a3b8;
		white-space: nowrap;
	}

	.badge-ai {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		background: #fef3c7;
		color: #92400e;
		white-space: nowrap;
	}

	.badge-draft {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		background: #fef3c7;
		color: #b45309;
		white-space: nowrap;
	}

	.message-subject {
		font-size: 0.75rem;
		font-weight: 500;
		color: #64748b;
		margin-bottom: 0.375rem;
	}

	.message-body {
		font-size: 0.875rem;
		color: #334155;
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
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #1a1a2e;
		background: #ffffff;
		outline: none;
		box-sizing: border-box;
	}

	.edit-subject:focus {
		border-color: #6366f1;
	}

	.edit-body {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		font-size: 0.875rem;
		color: #1a1a2e;
		background: #ffffff;
		outline: none;
		resize: vertical;
		font-family: inherit;
		line-height: 1.5;
		box-sizing: border-box;
	}

	.edit-body:focus {
		border-color: #6366f1;
	}

	.draft-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #fde68a;
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

	.btn-send {
		background: #6366f1;
		color: #ffffff;
		box-shadow: 2px 2px 6px rgba(99, 102, 241, 0.3);
	}

	.btn-send:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn-edit {
		background: #ffffff;
		color: #6366f1;
		border: 1px solid #e0e7ff;
	}

	.btn-edit:hover:not(:disabled) {
		background: #eef2ff;
		border-color: #c7d2fe;
	}

	.btn-save {
		background: #059669;
		color: #ffffff;
		box-shadow: 2px 2px 6px rgba(5, 150, 105, 0.3);
	}

	.btn-save:hover:not(:disabled) {
		background: #047857;
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

	.btn-discard {
		background: #ffffff;
		color: #dc2626;
		border: 1px solid #fecaca;
	}

	.btn-discard:hover:not(:disabled) {
		background: #fef2f2;
		border-color: #f87171;
	}

	/* Reply section */
	.reply-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-reply {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		color: #6366f1;
		font-weight: 600;
		font-size: 0.875rem;
		border: 1px solid #e0e7ff;
		border-radius: 10px;
		cursor: pointer;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
		transition: all 150ms ease;
	}

	.btn-reply:hover {
		background: #eef2ff;
		border-color: #c7d2fe;
	}

	.reply-form {
		background: #ffffff;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 3px 3px 8px #d1d9e6, -3px -3px 8px #ffffff;
	}

	.reply-form h3 {
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

	.reply-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
</style>
