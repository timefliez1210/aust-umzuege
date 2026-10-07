<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { tenant } from '$lib/tenant.svelte';
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

<Panel title="E-Mail-Verlauf" class="lg:col-span-2">
	{#snippet actions()}
		{#if emailThreads.length > 0}
			<a href="/admin/emails/{emailThreads[0].thread.id}" class="label-xs text-muted hover:text-fg">Vollansicht →</a>
		{/if}
	{/snippet}

	{#if emailsLoading}
		<p class="text-sm text-muted">E-Mails werden geladen …</p>
	{:else if emailThreads.length === 0}
		<p class="text-[13px] text-faint">Noch keine E-Mails für diese Anfrage.</p>
	{:else}
		<div class="flex flex-col gap-5">
			{#each emailThreads as { thread, messages } (thread.id)}
				<div class="flex flex-col gap-2">
					{#if thread.subject}<h4 class="text-sm font-semibold">{thread.subject}</h4>{/if}
					{#if thread.offer_pdf_filename}
						<button
							type="button"
							class="flex items-center gap-2 self-start rounded-sm border border-info/40 bg-info/10 px-2.5 py-1.5 text-xs text-info hover:bg-info/15"
							onclick={() => emailPreviewOfferPdf()}
						>
							<Paperclip size={13} /> Angebot wird als Anhang mitgesendet: {thread.offer_pdf_filename}
						</button>
					{/if}
					<!-- Newest first, matching the mailbox: the mail that needs an answer is the last one in. -->
					<div class="flex flex-col gap-2">
						{#each [...messages].reverse() as msg (msg.id)}
							{@const draft = msg.status === 'draft'}
							{@const inbound = msg.direction === 'inbound'}
							<article
								class="rounded-sm border px-3 py-2.5 {draft
									? 'border-dashed border-warn/60 bg-warn/5'
									: inbound
										? 'border-line bg-panel'
										: 'border-line bg-sunk sm:ml-8'}"
							>
								<header class="flex flex-wrap items-center justify-between gap-2">
									<span class="text-[13px] font-medium">
										{#if draft}Entwurf an {msg.to_address}{:else if inbound}{msg.from_address}{:else}{tenant.name}{/if}
									</span>
									<span class="flex items-center gap-1.5">
										{#if draft}<Badge tone="warn">Entwurf</Badge>{/if}
										{#if msg.llm_generated}<Badge tone="info">KI</Badge>{/if}
										<span class="num text-[11px] text-faint">{formatDateTime(msg.created_at)}</span>
									</span>
								</header>

								{#if emailEditingId === msg.id}
									<div class="mt-2 flex flex-col gap-2">
										<input
											class="h-9 rounded-sm border border-line-strong bg-panel px-3 text-sm outline-none focus:border-fg"
											type="text"
											placeholder="Betreff"
											aria-label="Betreff"
											bind:value={emailEditSubject}
										/>
										<textarea
											class="min-h-40 rounded-sm border border-line-strong bg-panel px-3 py-2 text-sm leading-relaxed outline-none focus:border-fg"
											rows="8"
											placeholder="Nachrichtentext …"
											aria-label="Nachrichtentext"
											bind:value={emailEditBody}
										></textarea>
										<div class="flex gap-1.5">
											<Button size="xs" variant="solid" onclick={() => emailSaveEdit(msg.id)} disabled={emailSaving}>
												<Save size={13} />
												{emailSaving ? 'Speichere …' : 'Speichern'}
											</Button>
											<Button size="xs" onclick={emailCancelEdit} disabled={emailSaving}>Abbrechen</Button>
										</div>
									</div>
								{:else}
									{#if msg.subject}<div class="mt-1.5 text-[13px] font-medium">{msg.subject}</div>{/if}
									<div class="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-muted">{msg.body_text || ''}</div>

									{#if msg.attachment_keys.length > 0}
										<div class="mt-2 flex flex-wrap gap-1.5">
											{#each msg.attachment_keys as key, i (key)}
												{@const fname = key.split('/').pop() ?? `Anhang ${i + 1}`}
												<button
													type="button"
													class="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line px-2 text-xs hover:bg-sunk"
													onclick={() => emailPreviewAttachment(msg.id, i)}
												>
													<Paperclip size={11} />{fname}
												</button>
											{/each}
										</div>
									{/if}

									{#if draft}
										<div class="mt-2.5 flex flex-wrap gap-1.5">
											<Button size="xs" variant="accent" onclick={() => emailSendDraft(msg.id)} disabled={emailActionLoading === msg.id}>
												<Send size={13} />
												{emailActionLoading === msg.id ? 'Bitte warten …' : 'Senden'}
											</Button>
											<Button size="xs" onclick={() => emailStartEdit(msg)} disabled={emailActionLoading === msg.id}>
												<Pencil size={13} /> Bearbeiten
											</Button>
											{#if msg.llm_generated}
												<Button size="xs" onclick={() => emailRegenerateLlm(msg.id)} disabled={emailActionLoading === msg.id}>
													<RotateCcw size={13} /> Neu generieren
												</Button>
											{/if}
											<Button size="xs" variant="danger" onclick={() => emailDiscardDraft(msg.id)} disabled={emailActionLoading === msg.id}>
												<X size={13} /> Verwerfen
											</Button>
										</div>
									{/if}
								{/if}
							</article>
						{/each}
						{#if messages.length === 0}
							<p class="text-[13px] text-faint">Keine Nachrichten in diesem Thread.</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Panel>
