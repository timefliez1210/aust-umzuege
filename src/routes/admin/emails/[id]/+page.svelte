<script lang="ts">
	import { page } from '$app/stores';
	import { apiGet, apiPost, apiPatch, apiPreview, formatDateTime } from '$lib/utils/api.svelte';
	import { ArrowLeft, ExternalLink, Send, X, Pencil, Save, Paperclip, FilePlus, Check, Bell, BellOff, Code, FileText } from 'lucide-svelte';
	import CreateInquiryFromEmailModal from './_components/CreateInquiryFromEmailModal.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';

	interface EmailMessage {
		id: string;
		direction: string;
		from_address: string;
		to_address: string;
		cc_addresses: string[];
		subject: string | null;
		body_text: string | null;
		/** Sanitised server-side; safe to render. Null when the mail was plain text. */
		body_html: string | null;
		llm_generated: boolean;
		status: string;
		read_at: string | null;
		handled_at: string | null;
		attachment_keys: string[];
		/** Positionally paired with attachment_keys; empty for older rows. */
		attachment_names: string[];
		created_at: string;
	}

	interface EmailThread {
		id: string;
		customer_id: string | null;
		muted: boolean;
		customer_email: string;
		customer_name: string | null;
		inquiry_id: string | null;
		subject: string | null;
		offer_pdf_filename: string | null;
		created_at: string;
	}

	interface ThreadResponse {
		thread: EmailThread;
		messages: EmailMessage[];
	}

	/** A KVA or Rechnung already generated for this customer, ready to hang on a draft. */
	interface ThreadDocument {
		kind: 'offer' | 'invoice';
		id: string;
		label: string;
		filename: string;
		created_at: string;
		attached: boolean;
	}

	let data = $state<ThreadResponse | null>(null);
	let loading = $state(true);
	let error = $state('');
	let actionLoading = $state<string | null>(null);
	let pendingActionMsgId = $state<string | null>(null);
	let showSendConfirm = $state(false);
	let showDiscardConfirm = $state(false);

	// Edit draft state
	let editingId = $state<string | null>(null);
	let editSubject = $state('');
	let editBody = $state('');
	let saving = $state(false);

	// Create-inquiry-from-email state (feedback report 71e097f6)
	let showCreateInquiry = $state(false);

	/**
	 * Body of the newest inbound message — what the customer actually wrote.
	 * Prefills the notes field so the request details survive into the Anfrage.
	 */
	let latestInboundBody = $derived(
		[...(data?.messages ?? [])].reverse().find((m) => m.direction === 'inbound')?.body_text ?? ''
	);

	// Reply state
	let showReply = $state(false);
	let replySubject = $state('');
	let replyBody = $state('');
	let replyCc = $state('');
	let replyBcc = $state('');
	let replying = $state(false);

	/** Message ids the admin has switched from the HTML rendering back to plain text. */
	let plainTextOverride = $state<Record<string, boolean>>({});
	let uploadingFor = $state<string | null>(null);

	// Document picker (KVA / Rechnung) state — scoped to the draft it was opened on.
	let docPickerFor = $state<string | null>(null);
	let documents = $state<ThreadDocument[]>([]);
	let documentsLoading = $state(false);
	let attachingDoc = $state<string | null>(null);

	/**
	 * The conversation newest-first.
	 *
	 * Called by: Template (message list)
	 * Purpose: the API returns the thread oldest-first, which buried the mail that
	 *          actually needs answering under months of history. `data.messages` keeps
	 *          its server order — everything reading it positionally (latestInboundBody,
	 *          attachment indices) still lines up with the backend.
	 */
	let orderedMessages = $derived([...(data?.messages ?? [])].reverse());

	/**
	 * Splits a comma- or semicolon-separated recipient string into addresses.
	 *
	 * Called by: saveReply
	 * Purpose: The CC/BCC inputs accept whatever the admin pastes. The backend names
	 *          the offending address if one does not parse, so this only tidies.
	 */
	function parseAddressList(raw: string): string[] {
		return raw
			.split(/[,;]/)
			.map((a) => a.trim())
			.filter((a) => a.length > 0);
	}

	/**
	 * Display name for one attachment.
	 *
	 * Called by: Template (attachment list)
	 * Purpose: `attachment_names` is empty for messages stored before the sender's
	 *          filename was kept, where the key's basename is "{idx}.{ext}" — better
	 *          than nothing, and exactly what the download route serves.
	 */
	function attachmentLabel(msg: EmailMessage, i: number): string {
		return msg.attachment_names[i] || msg.attachment_keys[i]?.split('/').pop() || `Anhang ${i + 1}`;
	}

	/**
	 * Ticks an inbound message off, or puts it back on the list.
	 *
	 * Called by: Template ("Erledigt" toggle on an inbound message)
	 * Purpose: `handled_at` is what the Telegram reminder reconciles against, so this
	 *          is the switch that silences a nag — deliberately separate from having
	 *          merely read the mail.
	 */
	async function toggleHandled(msg: EmailMessage) {
		const handled = msg.handled_at === null;
		try {
			await apiPatch(`/api/v1/admin/emails/messages/${msg.id}/handled`, { handled });
			showToast(handled ? 'Als erledigt markiert' : 'Wieder als offen markiert', 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Mutes or unmutes reminders for this thread.
	 *
	 * Called by: Template (header "Stummschalten" button)
	 * Purpose: Lets an automated or newsletter thread stop nagging without claiming
	 *          its mail was answered.
	 */
	async function toggleMuted() {
		if (!data) return;
		const muted = !data.thread.muted;
		try {
			await apiPatch(`/api/v1/admin/emails/${$page.params.id}/mute`, { muted });
			showToast(muted ? 'Erinnerungen stummgeschaltet' : 'Erinnerungen wieder aktiv', 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Opens (or closes) the KVA/Rechnung picker for a draft and loads what is available.
	 *
	 * Called by: Template ("KVA / Rechnung" button on a draft)
	 * Purpose: the list is fetched per draft rather than with the thread, so it reflects
	 *          documents generated while the composer was already open, and so each entry
	 *          knows whether it is on *this* draft already.
	 */
	async function toggleDocPicker(msgId: string) {
		if (docPickerFor === msgId) {
			docPickerFor = null;
			return;
		}
		docPickerFor = msgId;
		documents = [];
		documentsLoading = true;
		try {
			documents = await apiGet<ThreadDocument[]>(
				`/api/v1/admin/emails/${$page.params.id}/documents?message=${msgId}`
			);
		} catch (e) {
			showToast((e as Error).message, 'error');
			docPickerFor = null;
		} finally {
			documentsLoading = false;
		}
	}

	/**
	 * Hangs an already-generated KVA or Rechnung on a draft.
	 *
	 * Called by: Template (document picker entry)
	 * Purpose: attaching the offer or the invoice used to mean downloading the PDF from
	 *          the dashboard and uploading it straight back through the file picker.
	 *          The backend attaches the stored file by reference, so nothing is copied.
	 */
	async function attachDocument(msgId: string, doc: ThreadDocument) {
		attachingDoc = `${doc.kind}:${doc.id}`;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/attachments/document`, {
				kind: doc.kind,
				id: doc.id,
			});
			showToast(`${doc.filename} angehängt`, 'success');
			docPickerFor = null;
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			attachingDoc = null;
		}
	}

	/**
	 * Uploads one or more files onto a draft message.
	 *
	 * Called by: Template ("Datei anhängen" input on a draft)
	 * Purpose: Outbound mail could previously carry only the offer PDF, and only
	 *          because the send path hardcoded it — anything else had to be sent from
	 *          a separate mail client.
	 */
	async function uploadAttachments(msgId: string, files: FileList | null) {
		if (!files || files.length === 0) return;
		uploadingFor = msgId;
		try {
			const form = new FormData();
			for (const file of Array.from(files)) form.append('file', file);
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/attachments`, form);
			showToast('Anhang hinzugefügt', 'success');
			docPickerFor = null;
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			uploadingFor = null;
		}
	}

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
	/**
	 * Opens the send confirmation dialog for the given draft message.
	 *
	 * Called by: Template ("Senden" button click on a draft message bubble).
	 * Purpose: Records which message is pending action and shows the dialog.
	 *
	 * @param msgId - The ID of the draft to send
	 */
	function confirmSendDraft(msgId: string) {
		pendingActionMsgId = msgId;
		showSendConfirm = true;
	}

	/**
	 * Sends the pending draft message after confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: POSTs to /messages/{id}/send, reloads the thread on success.
	 */
	async function sendDraft() {
		if (!pendingActionMsgId) return;
		actionLoading = pendingActionMsgId;
		try {
			const res = await apiPost<{ message: string }>(`/api/v1/admin/emails/messages/${pendingActionMsgId}/send`);
			showToast(res.message, 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			actionLoading = null;
			pendingActionMsgId = null;
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
	/**
	 * Opens the discard confirmation dialog for the given draft message.
	 *
	 * Called by: Template ("Verwerfen" button click on a draft message bubble).
	 * Purpose: Records which message is pending and shows the dialog.
	 *
	 * @param msgId - The ID of the draft to discard
	 */
	function confirmDiscardDraft(msgId: string) {
		pendingActionMsgId = msgId;
		showDiscardConfirm = true;
	}

	/**
	 * Discards the pending draft message after confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: POSTs to /messages/{id}/discard, reloads the thread on success.
	 */
	async function discardDraft() {
		if (!pendingActionMsgId) return;
		actionLoading = pendingActionMsgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${pendingActionMsgId}/discard`);
			showToast('Entwurf verworfen', 'success');
			await loadThread();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			actionLoading = null;
			pendingActionMsgId = null;
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
	 * Saves the edited draft and immediately sends it.
	 *
	 * Called by: Template ("Speichern & Senden" button in the inline edit form)
	 * Purpose: Combines the save and send steps so the admin does not have to
	 *          close the editor first, find the Senden button, and click it separately.
	 *
	 * @param msgId - The ID of the draft message being edited
	 * @returns void
	 */
	async function saveAndSend(msgId: string) {
		saving = true;
		try {
			await apiPatch(`/api/v1/admin/emails/messages/${msgId}`, {
				subject: editSubject || null,
				body_text: editBody || null,
			});
			editingId = null;
			const res = await apiPost<{ message: string }>(`/api/v1/admin/emails/messages/${msgId}/send`);
			showToast(res.message, 'success');
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
	/**
	 * Opens an email attachment in a new tab for preview.
	 *
	 * Called by: Template (attachment link click on a message bubble).
	 * Purpose: Fetches the attachment through the authenticated API proxy
	 *          (GET /api/v1/admin/emails/messages/{msgId}/attachments/{idx})
	 *          and opens it as a blob URL, rather than a plain <a href> which
	 *          would 401 since the endpoint requires a Bearer token.
	 *
	 * @param msgId - The ID of the message the attachment belongs to
	 * @param idx   - Zero-based attachment index
	 */
	async function previewAttachment(msgId: string, idx: number) {
		try {
			await apiPreview(`/api/v1/admin/emails/messages/${msgId}/attachments/${idx}`);
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	/**
	 * Opens the offer PDF that will be attached when a draft in this thread is sent.
	 *
	 * Called by: Template (offer-pdf banner click, shown when the thread's inquiry
	 *            has an active offer with a generated PDF).
	 * Purpose: `send_draft_email` on the backend silently attaches this PDF at send
	 *          time (see admin_emails.rs) — this lets the admin confirm it exists
	 *          and see its contents before hitting "Senden".
	 */
	async function previewOfferPdf() {
		if (!data?.thread.inquiry_id) return;
		try {
			await apiPreview(`/api/v1/inquiries/${data.thread.inquiry_id}/pdf`);
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function saveReply() {
		if (!replyBody.trim()) return;
		replying = true;
		try {
			await apiPost(`/api/v1/admin/emails/${$page.params.id}/reply`, {
				subject: replySubject.trim() || null,
				body_text: replyBody.trim(),
				cc: parseAddressList(replyCc),
				bcc: parseAddressList(replyBcc),
			});
			showToast('Antwort als Entwurf gespeichert', 'success');
			replySubject = '';
			replyBody = '';
			replyCc = '';
			replyBcc = '';
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
				<h1>{data.thread.customer_name || data.thread.customer_email || '(unbekannter Absender)'}</h1>
				{#if data.thread.subject}
					<span class="thread-subject">{data.thread.subject}</span>
				{/if}
			</div>
			<div class="header-actions">
				<button
					type="button"
					class="link-quote"
					class:is-muted={data.thread.muted}
					onclick={toggleMuted}
					title={data.thread.muted
						? 'Erinnerungen für diesen Thread sind aus'
						: 'Keine Telegram-Erinnerungen mehr für diesen Thread'}
				>
					{#if data.thread.muted}
						<BellOff size={14} /> Stumm
					{:else}
						<Bell size={14} /> Stummschalten
					{/if}
				</button>
				{#if data.thread.inquiry_id}
					<a href="/admin/inquiries/{data.thread.inquiry_id}" class="link-quote">
						<ExternalLink size={14} /> Zur Anfrage
					</a>
				{:else if data.thread.customer_id}
					<button type="button" class="link-quote" onclick={() => (showCreateInquiry = true)}>
						<FilePlus size={14} /> Anfrage erstellen
					</button>
				{:else}
					<span class="no-customer-hint" title="Diese E-Mail konnte keinem Kunden zugeordnet werden">
						Kein Kunde zugeordnet
					</span>
				{/if}
			</div>
		</div>

		{#if data.thread.offer_pdf_filename}
			<button
				type="button"
				class="offer-pdf-banner"
				onclick={() => previewOfferPdf()}
			>
				<Paperclip size={14} />
				Angebot wird als Anhang mitgesendet: {data.thread.offer_pdf_filename}
			</button>
		{/if}

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
						<label for="reply-cc">CC <span class="optional">(optional, mit Komma trennen)</span></label>
						<input id="reply-cc" type="text" placeholder="kollege@beispiel.de" bind:value={replyCc} />
					</div>
					<div class="form-field">
						<label for="reply-bcc">BCC <span class="optional">(optional)</span></label>
						<input id="reply-bcc" type="text" placeholder="archiv@beispiel.de" bind:value={replyBcc} />
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
							onclick={() => { showReply = false; replySubject = ''; replyBody = ''; replyCc = ''; replyBcc = ''; }}
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

		<div class="conversation">
			{#each orderedMessages as msg}
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
								class="btn btn-send"
								onclick={() => saveAndSend(msg.id)}
								disabled={saving}
							>
								<Send size={14} />
								{saving ? 'Sende...' : 'Speichern & Senden'}
							</button>
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
						{#if msg.cc_addresses.length > 0}
							<div class="message-cc">CC: {msg.cc_addresses.join(', ')}</div>
						{/if}

						{#if msg.body_html && !plainTextOverride[msg.id]}
							<!-- Sanitised on the server (scripts, handlers, remote images and
							     tracking pixels removed) before it ever reaches the client. -->
							<div class="message-body message-html">{@html msg.body_html}</div>
							<button
								type="button"
								class="body-toggle"
								onclick={() => (plainTextOverride[msg.id] = true)}
							>
								<Code size={12} /> Als Text anzeigen
							</button>
						{:else}
							<div class="message-body">{msg.body_text || ''}</div>
							{#if msg.body_html}
								<button
									type="button"
									class="body-toggle"
									onclick={() => (plainTextOverride[msg.id] = false)}
								>
									<Code size={12} /> Formatiert anzeigen
								</button>
							{/if}
						{/if}

						{#if msg.attachment_keys.length > 0}
							<div class="attachment-list">
								{#each msg.attachment_keys as _key, i}
									<button
										type="button"
										class="attachment-link"
										onclick={() => previewAttachment(msg.id, i)}
									>
										<Paperclip size={12} />
										{attachmentLabel(msg, i)}
									</button>
								{/each}
							</div>
						{/if}

						{#if msg.direction === 'inbound'}
							<div class="draft-actions">
								<button
									class="btn btn-handled"
									class:is-handled={msg.handled_at !== null}
									onclick={() => toggleHandled(msg)}
								>
									<Check size={14} />
									{msg.handled_at !== null ? 'Erledigt' : 'Als erledigt markieren'}
								</button>
							</div>
						{/if}

						{#if msg.status === 'draft'}
							<div class="draft-actions">
								<button
									class="btn btn-attach-doc"
									class:is-open={docPickerFor === msg.id}
									onclick={() => toggleDocPicker(msg.id)}
								>
									<FileText size={14} />
									KVA / Rechnung anhängen
								</button>
								<label class="btn btn-attach" class:is-busy={uploadingFor === msg.id}>
									<Paperclip size={14} />
									{uploadingFor === msg.id ? 'Lade hoch...' : 'Datei anhängen'}
									<input
										type="file"
										multiple
										hidden
										disabled={uploadingFor === msg.id}
										onchange={(e) => {
											const input = e.currentTarget as HTMLInputElement;
											uploadAttachments(msg.id, input.files);
											input.value = '';
										}}
									/>
								</label>
								<button
									class="btn btn-send"
									onclick={() => confirmSendDraft(msg.id)}
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
									onclick={() => confirmDiscardDraft(msg.id)}
									disabled={actionLoading === msg.id}
								>
									<X size={14} />
									Verwerfen
								</button>
							</div>

							{#if docPickerFor === msg.id}
								<div class="doc-picker">
									{#if documentsLoading}
										<div class="doc-empty">Dokumente werden geladen...</div>
									{:else if documents.length === 0}
										<div class="doc-empty">
											Keine fertigen Dokumente für diesen Kunden — KVA oder Rechnung
											muss erst erzeugt werden.
										</div>
									{:else}
										{#each documents as doc}
											<button
												type="button"
												class="doc-entry"
												disabled={doc.attached || attachingDoc !== null}
												onclick={() => attachDocument(msg.id, doc)}
											>
												<FileText size={14} />
												<span class="doc-label">{doc.label}</span>
												<span class="doc-file">{doc.filename}</span>
												{#if doc.attached}
													<span class="doc-state">angehängt</span>
												{:else if attachingDoc === `${doc.kind}:${doc.id}`}
													<span class="doc-state">wird angehängt...</span>
												{/if}
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						{/if}
					{/if}
				</div>
			{/each}

			{#if data.messages.length === 0}
				<div class="empty">Keine Nachrichten in diesem Thread</div>
			{/if}
		</div>
	{/if}
</div>

<ConfirmationDialog
	bind:open={showSendConfirm}
	title="E-Mail senden"
	message="E-Mail jetzt an den Kunden senden?"
	confirmLabel="Senden"
	variant="primary"
	loading={actionLoading !== null}
	onConfirm={sendDraft}
	onCancel={() => { pendingActionMsgId = null; }}
/>

<ConfirmationDialog
	bind:open={showDiscardConfirm}
	title="Entwurf verwerfen"
	message="Entwurf unwiderruflich verwerfen?"
	confirmLabel="Verwerfen"
	loading={actionLoading !== null}
	onConfirm={discardDraft}
	onCancel={() => { pendingActionMsgId = null; }}
/>

<!-- Gated on customer_id: a thread opened by unattributable mail has no customer
     to hang an Anfrage on. The button below is hidden in that case, and the
     "Kunde zuordnen" hint takes its place. -->
{#if showCreateInquiry && data?.thread.customer_id}
	<CreateInquiryFromEmailModal
		threadId={data.thread.id}
		customerId={data.thread.customer_id}
		customerName={data.thread.customer_name}
		customerEmail={data.thread.customer_email}
		initialNotes={latestInboundBody}
		onCreated={() => { showCreateInquiry = false; loadThread(); }}
		onClose={() => (showCreateInquiry = false)}
	/>
{/if}

<style>
	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.no-customer-hint {
		font-size: 0.8rem;
		color: var(--text-muted, #888);
		padding: 0.35rem 0.5rem;
	}

	.link-quote.is-muted {
		color: var(--text-muted, #888);
	}

	.message-cc {
		font-size: 0.8rem;
		color: var(--text-muted, #888);
		margin-bottom: 0.25rem;
	}

	/* The HTML body is sanitised server-side; these rules only stop a wide mail
	   from blowing out the column. */
	.message-html {
		overflow-x: auto;
	}

	.message-html :global(table) {
		max-width: 100%;
	}

	.message-html :global(a) {
		color: var(--dt-primary, #1b6ca8);
	}

	.body-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.4rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--text-muted, #888);
		font-size: 0.75rem;
		cursor: pointer;
	}

	.body-toggle:hover {
		color: var(--dt-primary, #1b6ca8);
	}

	.btn-attach {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
	}

	.btn-attach.is-busy {
		opacity: 0.6;
		cursor: progress;
	}

	.btn-handled.is-handled {
		color: var(--dt-primary, #1b6ca8);
	}

	.optional {
		font-weight: 400;
		color: var(--text-muted, #888);
		font-size: 0.8em;
	}

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
		/* Shared by the <a> "Zur Anfrage" and the <button> "Anfrage erstellen". */
		cursor: pointer;
		font-family: inherit;
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

	.offer-pdf-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		margin-bottom: 1rem;
		padding: 0.625rem 1rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary);
		font-size: 0.8125rem;
		font-weight: 600;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		text-align: left;
		transition: background var(--dt-transition);
	}

	.offer-pdf-banner:hover {
		background: var(--dt-surface-container-low);
	}

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

	.btn-attach-doc {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
	}
	.btn-attach-doc.is-open {
		box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.15);
	}

	.doc-picker {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-top: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.5rem;
		background: var(--bg-subtle, rgba(0, 0, 0, 0.03));
	}
	.doc-empty {
		font-size: 0.8rem;
		color: var(--text-muted, #888);
		padding: 0.25rem;
	}
	.doc-entry {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		text-align: left;
		padding: 0.4rem 0.5rem;
		border: none;
		border-radius: 0.4rem;
		background: transparent;
		cursor: pointer;
		font-size: 0.85rem;
		color: inherit;
	}
	.doc-entry:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.05);
	}
	.doc-entry:disabled {
		opacity: 0.55;
		cursor: default;
	}
	.doc-label {
		font-weight: 600;
	}
	.doc-file {
		color: var(--text-muted, #888);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.doc-state {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--text-muted, #888);
	}

	.attachment-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.625rem;
	}

	.attachment-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.25rem 0.625rem;
		background: var(--dt-surface-container-high);
		color: var(--dt-primary);
		font-size: 0.75rem;
		font-weight: 500;
		border: var(--dt-ghost-border);
		border-radius: 9999px;
		cursor: pointer;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: background var(--dt-transition);
	}

	.attachment-link:hover {
		background: var(--dt-surface-container);
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

	/* Reply section — sits above the conversation, which reads newest-first. */
	.reply-section {
		margin-bottom: 1.5rem;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--dt-outline-variant);
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
