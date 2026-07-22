<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiPreview, formatDateTime } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { Save, Send, Pencil, RotateCcw, X, Paperclip } from "lucide-svelte";

	interface InquiryEmailThread {
		id: string;
		customer_email: string;
		customer_name: string | null;
		quote_id: string | null;
		subject: string | null;
		offer_pdf_filename: string | null;
		created_at: string;
	}

	interface InquiryEmailMessage {
		id: string;
		direction: string;
		from_address: string;
		to_address: string;
		subject: string | null;
		body_text: string | null;
		llm_generated: boolean;
		status: string;
		attachment_keys: string[];
		created_at: string;
	}

	interface InquiryThreadWithMessages {
		thread: InquiryEmailThread;
		messages: InquiryEmailMessage[];
	}

	let { inquiryId }: { inquiryId: string } = $props();

	let emailsLoading = $state(false);
	let emailThreads = $state<InquiryThreadWithMessages[]>([]);

	// Draft editing state
	let emailEditingId = $state<string | null>(null);
	let emailEditSubject = $state("");
	let emailEditBody = $state("");
	let emailSaving = $state(false);
	let emailActionLoading = $state<string | null>(null);

	/**
	 * Loads all email threads for this inquiry plus their messages.
	 *
	 * Called by: $effect (on mount / when inquiryId changes)
	 * Purpose: Fetches GET /api/v1/inquiries/{id}/emails to get thread list,
	 *          then fetches GET /api/v1/admin/emails/{threadId} for each thread to get messages.
	 *
	 * @returns void (side-effect: sets `emailThreads`, `emailsLoading`)
	 */
	async function loadEmails() {
		emailsLoading = true;
		try {
			const threads = await apiGet<InquiryEmailThread[]>(
				`/api/v1/inquiries/${inquiryId}/emails`,
			);
			const withMessages = await Promise.all(
				threads.map(async (thread) => {
					try {
						const res = await apiGet<{
							thread: InquiryEmailThread;
							messages: InquiryEmailMessage[];
						}>(`/api/v1/admin/emails/${thread.id}`);
						return { thread: res.thread, messages: res.messages };
					} catch {
						return { thread, messages: [] };
					}
				}),
			);
			emailThreads = withMessages;
		} catch {
			emailThreads = [];
		} finally {
			emailsLoading = false;
		}
	}

	$effect(() => {
		if (inquiryId) loadEmails();
	});

	/**
	 * Opens an email attachment in a new tab for preview.
	 *
	 * Called by: Template (attachment link click in the email section message bubble).
	 * Purpose: Fetches through the authenticated API proxy — a plain <a href> would
	 *          401 since the endpoint requires a Bearer token.
	 *
	 * @param msgId - The ID of the message the attachment belongs to
	 * @param idx   - Zero-based attachment index
	 */
	async function emailPreviewAttachment(msgId: string, idx: number) {
		try {
			await apiPreview(`/api/v1/admin/emails/messages/${msgId}/attachments/${idx}`);
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/**
	 * Opens the offer PDF that will be attached when a draft in this thread is sent.
	 *
	 * Called by: Template (offer-pdf banner click, shown when the thread carries
	 *            `offer_pdf_filename`).
	 * Purpose: `send_draft_email` on the backend silently attaches the active offer's
	 *          PDF at send time — this lets the admin confirm it exists before hitting
	 *          "Senden", rather than only finding out after the customer replies.
	 */
	async function emailPreviewOfferPdf() {
		try {
			await apiPreview(`/api/v1/inquiries/${inquiryId}/pdf`);
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/**
	 * Sends a draft email message to the customer after confirmation.
	 *
	 * Called by: Template (onclick on "Senden" button in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/send to dispatch the email.
	 *          Reloads emails on success so the message status updates to "sent".
	 *
	 * @param msgId - ID of the draft message to send
	 * @returns void
	 */
	async function emailSendDraft(msgId: string) {
		if (!confirm("E-Mail jetzt an den Kunden senden?")) return;
		emailActionLoading = msgId;
		try {
			const res = await apiPost<{ message: string }>(
				`/api/v1/admin/emails/messages/${msgId}/send`,
			);
			showToast(res.message, "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}

	/**
	 * Discards a draft email message after confirmation.
	 *
	 * Called by: Template (onclick on "Verwerfen" button in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/discard to delete the draft.
	 *          Reloads emails on success so the message disappears.
	 *
	 * @param msgId - ID of the draft message to discard
	 * @returns void
	 */
	async function emailDiscardDraft(msgId: string) {
		if (!confirm("Entwurf verwerfen?")) return;
		emailActionLoading = msgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/discard`);
			showToast("Entwurf verworfen", "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}

	/**
	 * Opens the inline editor for a draft email message pre-filling with existing content.
	 *
	 * Called by: Template (onclick on "Bearbeiten" button in the email section draft bubble)
	 * Purpose: Seeds the editable subject and body fields with the draft's existing text.
	 *
	 * @param msg - The InquiryEmailMessage to edit
	 * @returns void
	 */
	function emailStartEdit(msg: InquiryEmailMessage) {
		emailEditingId = msg.id;
		emailEditSubject = msg.subject || "";
		emailEditBody = msg.body_text || "";
	}

	/**
	 * Closes the inline email editor without saving.
	 *
	 * Called by: Template (onclick on "Abbrechen" inside the inline email editor)
	 * Purpose: Resets the editing state so the message bubble reverts to read-only view.
	 *
	 * @returns void
	 */
	function emailCancelEdit() {
		emailEditingId = null;
		emailEditSubject = "";
		emailEditBody = "";
	}

	/**
	 * Saves the edited subject and body of a draft email to the API.
	 *
	 * Called by: Template (onclick on "Speichern" inside the inline email editor)
	 * Purpose: PATCHes via PATCH /api/v1/admin/emails/messages/{id}.
	 *          Closes the editor and reloads emails on success.
	 *
	 * @param msgId - ID of the draft message being edited
	 * @returns void
	 */
	async function emailSaveEdit(msgId: string) {
		emailSaving = true;
		try {
			await apiPatch(`/api/v1/admin/emails/messages/${msgId}`, {
				subject: emailEditSubject || null,
				body_text: emailEditBody || null,
			});
			showToast("Entwurf gespeichert", "success");
			emailEditingId = null;
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailSaving = false;
		}
	}

	/**
	 * Regenerates the LLM response for a draft email message.
	 *
	 * Called by: Template (onclick on "Neu generieren" in the email section draft bubble)
	 * Purpose: Calls POST /api/v1/admin/emails/messages/{id}/regenerate to ask the LLM to
	 *          rewrite the draft. Reloads emails on success so the updated body appears.
	 *
	 * @param msgId - ID of the draft message to regenerate
	 * @returns void
	 */
	async function emailRegenerateLlm(msgId: string) {
		emailActionLoading = msgId;
		try {
			await apiPost(`/api/v1/admin/emails/messages/${msgId}/regenerate`);
			showToast("Antwort wird neu generiert...", "success");
			await loadEmails();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			emailActionLoading = null;
		}
	}
</script>

<!-- Email Thread Section (below the main grid) -->
<div class="email-section">
	<div class="email-section__header">
		<h2 class="email-section__title">E-Mail-Verlauf</h2>
		{#if emailThreads.length > 0}
			<a
				href="/admin/emails/{emailThreads[0].thread.id}"
				class="email-section__link"
			>
				Vollansicht
			</a>
		{/if}
	</div>

	{#if emailsLoading}
		<div class="email-loading">E-Mails werden geladen...</div>
	{:else if emailThreads.length === 0}
		<div class="email-empty">Noch keine E-Mails für diese Anfrage.</div>
	{:else}
		{#each emailThreads as { thread, messages }}
			<div class="email-thread">
				{#if thread.subject}
					<div class="email-thread__subject">
						{thread.subject}
					</div>
				{/if}
				{#if thread.offer_pdf_filename}
					<button
						type="button"
						class="offer-pdf-banner"
						onclick={() => emailPreviewOfferPdf()}
					>
						<Paperclip size={13} />
						Angebot wird als Anhang mitgesendet: {thread.offer_pdf_filename}
					</button>
				{/if}
				<div class="email-conversation">
					{#each messages as msg}
						<div
							class="email-msg"
							class:email-msg--inbound={msg.direction ===
								"inbound"}
							class:email-msg--outbound={msg.direction ===
								"outbound" && msg.status !== "draft"}
							class:email-msg--draft={msg.status === "draft"}
						>
							<div class="email-msg__header">
								<span class="email-msg__from">
									{#if msg.status === "draft"}
										Entwurf an {msg.to_address}
									{:else if msg.direction === "inbound"}
										{msg.from_address}
									{:else}
										AUST Umzuege
									{/if}
								</span>
								<div class="email-msg__meta">
									{#if msg.status === "draft"}
										<span
											class="email-badge email-badge--draft"
											>Entwurf</span
										>
									{/if}
									{#if msg.llm_generated}
										<span
											class="email-badge email-badge--ai"
											>KI</span
										>
									{/if}
									<span class="email-msg__date"
										>{formatDateTime(
											msg.created_at,
										)}</span
									>
								</div>
							</div>

							{#if emailEditingId === msg.id}
								<div class="email-edit-fields">
									<input
										class="email-edit-subject"
										type="text"
										placeholder="Betreff"
										bind:value={emailEditSubject}
									/>
									<textarea
										class="email-edit-body"
										rows="8"
										placeholder="Nachrichtentext..."
										bind:value={emailEditBody}
									></textarea>
								</div>
								<div class="email-draft-actions">
									<button
										class="btn btn-sm btn-save"
										onclick={() =>
											emailSaveEdit(msg.id)}
										disabled={emailSaving}
									>
										<Save size={14} />
										{emailSaving
											? "Speichere..."
											: "Speichern"}
									</button>
									<button
										class="btn btn-sm"
										onclick={emailCancelEdit}
										disabled={emailSaving}
									>
										Abbrechen
									</button>
								</div>
							{:else}
								{#if msg.subject}
									<div class="email-msg__subject">
										{msg.subject}
									</div>
								{/if}
								<div class="email-msg__body">
									{msg.body_text || ""}
								</div>

								{#if msg.attachment_keys.length > 0}
									<div class="email-attachment-list">
										{#each msg.attachment_keys as key, i}
											{@const fname = key.split("/").pop() ?? `Anhang ${i + 1}`}
											<button
												type="button"
												class="email-attachment-link"
												onclick={() => emailPreviewAttachment(msg.id, i)}
											>
												<Paperclip size={11} />
												{fname}
											</button>
										{/each}
									</div>
								{/if}

								{#if msg.status === "draft"}
									<div class="email-draft-actions">
										<button
											class="btn btn-sm btn-primary"
											onclick={() =>
												emailSendDraft(msg.id)}
											disabled={emailActionLoading ===
												msg.id}
										>
											<Send size={14} />
											{emailActionLoading === msg.id
												? "Bitte warten..."
												: "Senden"}
										</button>
										<button
											class="btn btn-sm"
											onclick={() =>
												emailStartEdit(msg)}
											disabled={emailActionLoading ===
												msg.id}
										>
											<Pencil size={14} />
											Bearbeiten
										</button>
										{#if msg.llm_generated}
											<button
												class="btn btn-sm"
												onclick={() =>
													emailRegenerateLlm(
														msg.id,
													)}
												disabled={emailActionLoading ===
													msg.id}
											>
												<RotateCcw size={14} />
												Neu generieren
											</button>
										{/if}
										<button
											class="btn btn-sm btn-danger"
											onclick={() =>
												emailDiscardDraft(msg.id)}
											disabled={emailActionLoading ===
												msg.id}
										>
											<X size={14} />
											Verwerfen
										</button>
									</div>
								{/if}
							{/if}
						</div>
					{/each}
					{#if messages.length === 0}
						<div class="email-empty">
							Keine Nachrichten in diesem Thread.
						</div>
					{/if}
				</div>
			</div>
		{/each}
	{/if}
</div>

<style>
	.email-section {
		height: 100%;
		margin-top: 1.5rem;
	}

	.email-section__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.email-section__title {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.email-section__link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		text-decoration: none;
		padding: 0.375rem 0.75rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-lowest);
		transition: background var(--dt-transition);
	}

	.email-section__link:hover {
		background: var(--dt-surface-container-low);
	}

	.email-loading,
	.email-empty {
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		padding: 1.5rem;
		text-align: center;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-thread {
		margin-bottom: 1rem;
	}

	.email-thread__subject {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.5rem;
		padding-left: 0.25rem;
	}

	.email-conversation {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.email-msg {
		border-radius: var(--dt-radius-md);
		padding: 1rem 1.25rem;
		max-width: 85%;
	}

	.email-msg--inbound {
		align-self: flex-start;
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg--outbound {
		align-self: flex-end;
		background: var(--dt-surface-container);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg--draft {
		align-self: flex-end;
		background: var(--dt-surface-container-low);
		border: 2px dashed var(--dt-outline-variant);
		box-shadow: var(--dt-shadow-ambient);
	}

	.email-msg__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.email-msg__from {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.email-msg__meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.email-msg__date {
		font-size: 0.6875rem;
		color: var(--dt-on-surface-variant);
		white-space: nowrap;
	}

	.email-badge {
		display: inline-block;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.email-badge--draft {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.email-badge--ai {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
	}

	.email-msg__subject {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}

	.email-msg__body {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.offer-pdf-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		margin-bottom: 0.75rem;
		padding: 0.5rem 0.875rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary);
		font-size: 0.75rem;
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

	.email-attachment-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.5rem;
	}

	.email-attachment-link {
		display: inline-flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.1875rem 0.5625rem;
		background: var(--dt-surface-container-high);
		color: var(--dt-primary);
		font-size: 0.6875rem;
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

	.email-attachment-link:hover {
		background: var(--dt-surface-container);
	}

	.email-draft-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--dt-outline-variant);
		flex-wrap: wrap;
	}

	.email-edit-fields {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.email-edit-subject,
	.email-edit-body {
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
		font-family: inherit;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.email-edit-subject:focus,
	.email-edit-body:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.email-edit-body {
		resize: vertical;
		line-height: 1.5;
	}

	.btn-save {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container)) !important;
		color: var(--dt-on-primary) !important;
	}

	.btn-save:hover:not(:disabled) {
		opacity: 0.88;
	}

	@media (max-width: 768px) {
		.email-msg {
			max-width: 100%;
		}

		.email-msg__header {
			gap: 0.375rem;
		}
	}
</style>
