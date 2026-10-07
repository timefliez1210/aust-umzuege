<script lang="ts">
	import { page } from '$app/stores';
	import { apiGet, apiPost, apiPatch, apiPreview, formatDateTime } from '$lib/utils/api.svelte';
	import { ArrowLeft, ExternalLink, Send, X, Pencil, Save, Paperclip, FilePlus, Check, Bell, BellOff, Code, FileText } from 'lucide-svelte';
	import CreateInquiryFromEmailModal from './_components/CreateInquiryFromEmailModal.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { tenant } from '$lib/tenant.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';

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

<svelte:head><title>{data ? data.thread.customer_name || data.thread.customer_email : 'E-Mail'}</title></svelte:head>

<a href="/admin/emails" class="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft size={15} /> E-Mails</a>

{#if loading}
	<div class="flex flex-col gap-3" aria-busy="true">
		<div class="h-16 animate-pulse rounded-md bg-sunk"></div>
		<div class="h-48 animate-pulse rounded-md bg-sunk"></div>
	</div>
{:else if error}
	<Notice tone="danger">{error}</Notice>
{:else if data}
	<div class="mx-auto flex max-w-4xl flex-col gap-3.5">
		<header class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
			<div class="flex min-w-0 flex-col gap-1.5">
				<h1 class="truncate text-[24px] leading-tight font-semibold tracking-[-0.03em] sm:text-[28px]">
					{data.thread.customer_name || data.thread.customer_email || '(unbekannter Absender)'}
				</h1>
				{#if data.thread.subject}<p class="text-sm text-muted">{data.thread.subject}</p>{/if}
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Button
					size="sm"
					variant={data.thread.muted ? 'outline' : 'ghost'}
					onclick={toggleMuted}
					title={data.thread.muted ? 'Erinnerungen für diesen Thread sind aus' : 'Keine Telegram-Erinnerungen mehr für diesen Thread'}
				>
					{#if data.thread.muted}<BellOff size={14} /> Stumm{:else}<Bell size={14} /> Stummschalten{/if}
				</Button>
				{#if data.thread.inquiry_id}
					<Button size="sm" href="/admin/inquiries/{data.thread.inquiry_id}"><ExternalLink size={14} /> Zur Anfrage</Button>
				{:else if data.thread.customer_id}
					<Button size="sm" onclick={() => (showCreateInquiry = true)}><FilePlus size={14} /> Anfrage erstellen</Button>
				{:else}
					<Badge tone="warn" title="Diese E-Mail konnte keinem Kunden zugeordnet werden">Kein Kunde zugeordnet</Badge>
				{/if}
				{#if !showReply}
					<Button size="sm" variant="accent" onclick={() => (showReply = true)}><Send size={14} /> Antworten</Button>
				{/if}
			</div>
		</header>

		{#if data.thread.offer_pdf_filename}
			<button
				type="button"
				class="flex items-center gap-2 self-start rounded-sm border border-info/40 bg-info/10 px-3 py-2 text-[13px] text-info hover:bg-info/15"
				onclick={() => previewOfferPdf()}
			>
				<Paperclip size={14} /> Angebot wird als Anhang mitgesendet: {data.thread.offer_pdf_filename}
			</button>
		{/if}

		{#if showReply}
			<section class="flex flex-col gap-3 rounded-md border border-line bg-panel p-4">
				<h3 class="text-[15px] font-semibold">Antwort verfassen</h3>
				<Field label="Betreff (optional)" for="reply-subject">
					<Input id="reply-subject" placeholder={data.thread.subject || 'Betreff …'} bind:value={replySubject} />
				</Field>
				<div class="grid gap-3 sm:grid-cols-2">
					<Field label="CC (optional, mit Komma trennen)" for="reply-cc"><Input id="reply-cc" placeholder="kollege@beispiel.de" bind:value={replyCc} /></Field>
					<Field label="BCC (optional)" for="reply-bcc"><Input id="reply-bcc" placeholder="archiv@beispiel.de" bind:value={replyBcc} /></Field>
				</div>
				<Field label="Nachricht" for="reply-body"><Textarea id="reply-body" rows={7} placeholder="Antwort schreiben …" bind:value={replyBody} /></Field>
				<div class="flex flex-wrap gap-2">
					<Button variant="solid" onclick={saveReply} disabled={replying || !replyBody.trim()}>
						<Save size={14} />
						{replying ? 'Speichere …' : 'Als Entwurf speichern'}
					</Button>
					<Button
						variant="ghost"
						disabled={replying}
						onclick={() => {
							showReply = false;
							replySubject = '';
							replyBody = '';
							replyCc = '';
							replyBcc = '';
						}}>Abbrechen</Button
					>
				</div>
			</section>
		{/if}

		<div class="flex flex-col gap-3">
			{#each orderedMessages as msg (msg.id)}
				{@const draft = msg.status === 'draft'}
				{@const inbound = msg.direction === 'inbound'}
				<article
					class="flex flex-col gap-2.5 rounded-md border p-4 {draft
						? 'border-dashed border-warn/60 bg-warn/5'
						: inbound
							? 'border-line bg-panel'
							: 'border-line bg-sunk sm:ml-10'}"
				>
					<header class="flex flex-wrap items-center justify-between gap-2">
						<span class="flex min-w-0 items-center gap-2 text-sm font-medium">
							<span class="size-2 shrink-0 rounded-full {draft ? 'bg-warn' : inbound ? 'bg-info' : 'bg-bar-strong'}" aria-hidden="true"></span>
							<span class="truncate">{#if draft}Entwurf an {msg.to_address}{:else if inbound}{msg.from_address}{:else}{tenant.name}{/if}</span>
						</span>
						<span class="flex items-center gap-1.5">
							{#if draft}<Badge tone="warn">Entwurf</Badge>{/if}
							{#if msg.llm_generated}<Badge tone="info">KI</Badge>{/if}
							{#if inbound && msg.handled_at !== null}<Badge tone="ok">erledigt</Badge>{/if}
							<span class="num text-xs text-faint">{formatDateTime(msg.created_at)}</span>
						</span>
					</header>

					{#if editingId === msg.id}
						<Input placeholder="Betreff" aria-label="Betreff" bind:value={editSubject} />
						<Textarea rows={9} placeholder="Nachrichtentext …" aria-label="Nachrichtentext" bind:value={editBody} />
						<div class="flex flex-wrap gap-2">
							<Button size="sm" variant="accent" onclick={() => saveAndSend(msg.id)} disabled={saving}>
								<Send size={14} />
								{saving ? 'Sende …' : 'Speichern & senden'}
							</Button>
							<Button size="sm" onclick={() => saveEdit(msg.id)} disabled={saving}><Save size={14} /> {saving ? 'Speichere …' : 'Speichern'}</Button>
							<Button size="sm" variant="ghost" onclick={cancelEdit} disabled={saving}>Abbrechen</Button>
						</div>
					{:else}
						{#if msg.subject}<div class="text-sm font-semibold">{msg.subject}</div>{/if}
						{#if msg.cc_addresses.length > 0}<div class="text-xs text-faint">CC: {msg.cc_addresses.join(', ')}</div>{/if}

						{#if msg.body_html && !plainTextOverride[msg.id]}
							<!-- Sanitised server-side (scripts, handlers, remote images, tracking pixels removed).
							     Rendered on a white "paper" in both themes: mail HTML carries its own inline
							     colours and would turn unreadable on a dark surface. -->
							<div
								class="overflow-x-auto rounded-sm bg-white p-4 text-sm leading-relaxed text-[#111] [&_a]:text-[#1a56db] [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[#ccc] [&_blockquote]:pl-3 [&_blockquote]:text-[#555] [&_img]:h-auto [&_img]:max-w-full [&_p]:my-2 [&_table]:max-w-full"
							>
								{@html msg.body_html}
							</div>
							<button type="button" class="inline-flex items-center gap-1.5 self-start text-xs text-faint hover:text-fg" onclick={() => (plainTextOverride[msg.id] = true)}>
								<Code size={12} /> Als Text anzeigen
							</button>
						{:else}
							<div class="text-sm leading-relaxed whitespace-pre-wrap">{msg.body_text || ''}</div>
							{#if msg.body_html}
								<button type="button" class="inline-flex items-center gap-1.5 self-start text-xs text-faint hover:text-fg" onclick={() => (plainTextOverride[msg.id] = false)}>
									<Code size={12} /> Formatiert anzeigen
								</button>
							{/if}
						{/if}

						{#if msg.attachment_keys.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each msg.attachment_keys as key, i (key)}
									<button
										type="button"
										class="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line bg-panel px-2 text-xs hover:bg-sunk"
										onclick={() => previewAttachment(msg.id, i)}
									>
										<Paperclip size={12} />{attachmentLabel(msg, i)}
									</button>
								{/each}
							</div>
						{/if}

						{#if inbound}
							<Button size="xs" variant={msg.handled_at !== null ? 'outline' : 'ghost'} class="self-start" onclick={() => toggleHandled(msg)}>
								<Check size={13} />
								{msg.handled_at !== null ? 'Erledigt' : 'Als erledigt markieren'}
							</Button>
						{/if}

						{#if draft}
							<div class="flex flex-wrap gap-1.5 border-t border-line pt-2.5">
								<Button size="sm" variant="accent" onclick={() => confirmSendDraft(msg.id)} disabled={actionLoading === msg.id}>
									<Send size={14} />
									{actionLoading === msg.id ? 'Sende …' : 'Senden'}
								</Button>
								<Button size="sm" onclick={() => startEdit(msg)} disabled={actionLoading === msg.id}><Pencil size={14} /> Bearbeiten</Button>
								<Button size="sm" variant={docPickerFor === msg.id ? 'solid' : 'outline'} onclick={() => toggleDocPicker(msg.id)}>
									<FileText size={14} /> KVA / Rechnung
								</Button>
								<label
									class="inline-flex h-8 cursor-pointer items-center gap-2 rounded-sm border border-line-strong px-3 text-[13px] hover:bg-sunk {uploadingFor === msg.id
										? 'pointer-events-none opacity-60'
										: ''}"
								>
									<Paperclip size={14} />
									{uploadingFor === msg.id ? 'Lade hoch …' : 'Datei'}
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
								<Button size="sm" variant="danger" class="ml-auto" onclick={() => confirmDiscardDraft(msg.id)} disabled={actionLoading === msg.id}>
									<X size={14} /> Verwerfen
								</Button>
							</div>

							{#if docPickerFor === msg.id}
								<div class="flex flex-col divide-y divide-line rounded-sm border border-line bg-panel">
									{#if documentsLoading}
										<p class="px-3 py-3 text-[13px] text-muted">Dokumente werden geladen …</p>
									{:else if documents.length === 0}
										<p class="px-3 py-3 text-[13px] text-muted">
											Keine fertigen Dokumente für diesen Kunden — KVA oder Rechnung muss erst erzeugt werden.
										</p>
									{:else}
										{#each documents as doc (doc.kind + doc.id)}
											<button
												type="button"
												class="flex items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-sunk disabled:opacity-60"
												disabled={doc.attached || attachingDoc !== null}
												onclick={() => attachDocument(msg.id, doc)}
											>
												<FileText size={14} class="shrink-0 text-muted" />
												<span class="font-medium">{doc.label}</span>
												<span class="min-w-0 flex-1 truncate text-xs text-faint">{doc.filename}</span>
												{#if doc.attached}
													<Badge tone="ok">angehängt</Badge>
												{:else if attachingDoc === `${doc.kind}:${doc.id}`}
													<span class="text-xs text-faint">wird angehängt …</span>
												{/if}
											</button>
										{/each}
									{/if}
								</div>
							{/if}
						{/if}
					{/if}
				</article>
			{/each}

			{#if data.messages.length === 0}
				<p class="py-8 text-center text-sm text-muted">Keine Nachrichten in diesem Thread</p>
			{/if}
		</div>
	</div>
{/if}

<ConfirmationDialog
	bind:open={showSendConfirm}
	title="E-Mail senden"
	message="E-Mail jetzt an den Kunden senden?"
	confirmLabel="Senden"
	variant="primary"
	loading={actionLoading !== null}
	onConfirm={sendDraft}
	onCancel={() => {
		pendingActionMsgId = null;
	}}
/>

<ConfirmationDialog
	bind:open={showDiscardConfirm}
	title="Entwurf verwerfen"
	message="Entwurf unwiderruflich verwerfen?"
	confirmLabel="Verwerfen"
	loading={actionLoading !== null}
	onConfirm={discardDraft}
	onCancel={() => {
		pendingActionMsgId = null;
	}}
/>

<!-- Gated on customer_id: a thread opened by unattributable mail has no customer to hang an Anfrage on. -->
{#if showCreateInquiry && data?.thread.customer_id}
	<CreateInquiryFromEmailModal
		threadId={data.thread.id}
		customerId={data.thread.customer_id}
		customerName={data.thread.customer_name}
		customerEmail={data.thread.customer_email}
		initialNotes={latestInboundBody}
		onCreated={() => {
			showCreateInquiry = false;
			loadThread();
		}}
		onClose={() => (showCreateInquiry = false)}
	/>
{/if}
