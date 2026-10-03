<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiFetch, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { Upload, Download, X, FileText, Plus } from 'lucide-svelte';

	interface EmployeeDocument {
		id: string;
		label: string;
		filename: string;
		size_bytes: number;
		created_at: string;
	}

	interface DocumentKeys {
		arbeitsvertrag_key: string | null;
		mitarbeiterfragebogen_key: string | null;
		documents: EmployeeDocument[];
	}

	let {
		employeeId,
		arbeitsvertragKey,
		mitarbeiterfragebogenKey,
		documents,
		onUpdated
	}: {
		employeeId: string;
		arbeitsvertragKey: string | null;
		mitarbeiterfragebogenKey: string | null;
		documents: EmployeeDocument[];
		onUpdated: (updated: Partial<DocumentKeys>) => void;
	} = $props();

	/** Label Alex types for the next free-form upload. */
	let newDocLabel = $state('');
	/** True while a labelled document is being uploaded. */
	let uploadingExtra = $state(false);
	/** The labelled document awaiting delete confirmation. */
	let pendingExtraDoc = $state<EmployeeDocument | null>(null);
	let deletingExtraId = $state<string | null>(null);

	const canUploadExtra = $derived(newDocLabel.trim().length > 0 && !uploadingExtra);

	/**
	 * Formats a byte count for the document row.
	 *
	 * Called by: Template (labelled document rows)
	 * Purpose: Shows the size in the unit a person reads without counting zeros.
	 */
	function fmtSize(bytes: number): string {
		if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${bytes} B`;
	}

	/**
	 * Opens the file picker for a labelled upload.
	 *
	 * Called by: Template ("Hochladen" button in the add row)
	 * Purpose: The label is typed first, so the picker only opens once there is one.
	 */
	function triggerExtraPicker() {
		if (!canUploadExtra) return;
		document.getElementById('doc-input-extra')?.click();
	}

	/**
	 * Uploads the chosen file under the typed label.
	 *
	 * Called by: Template (onchange on the hidden extra file input)
	 * Purpose: POSTs label + file as multipart and refreshes the document list.
	 */
	async function handleExtraUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		const label = newDocLabel.trim();
		if (!file || !label) return;

		uploadingExtra = true;
		try {
			const form = new FormData();
			form.append('label', label);
			form.append('file', file);
			const updated = await apiFetch<DocumentKeys>(
				`/api/v1/admin/employees/${employeeId}/documents`,
				{ method: 'POST', body: form }
			);
			onUpdated(updated);
			newDocLabel = '';
			showToast(`${label} hochgeladen`, 'success');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'Upload fehlgeschlagen', 'error');
		} finally {
			uploadingExtra = false;
		}
	}

	/**
	 * Downloads a labelled document through the API.
	 *
	 * Called by: Template (download button on a labelled document row)
	 * Purpose: Uses apiDownload so the admin JWT is sent; S3 is not public.
	 */
	async function handleExtraDownload(doc: EmployeeDocument) {
		await apiDownload(
			`/api/v1/admin/employees/${employeeId}/documents/extra/${doc.id}`,
			doc.filename
		);
	}

	/**
	 * Deletes the pending labelled document after confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm)
	 * Purpose: Removes the file from S3 and the row from the list.
	 */
	async function handleExtraDelete() {
		const doc = pendingExtraDoc;
		if (!doc) return;
		deletingExtraId = doc.id;
		try {
			const updated = await apiFetch<DocumentKeys>(
				`/api/v1/admin/employees/${employeeId}/documents/extra/${doc.id}`,
				{ method: 'DELETE' }
			);
			onUpdated(updated);
			pendingExtraDoc = null;
			showToast(`${doc.label} geloescht`, 'success');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'Fehler beim Loeschen', 'error');
		} finally {
			deletingExtraId = null;
		}
	}

	/** Tracks which doc type is currently being uploaded (shows spinner). */
	let uploadingDoc = $state<string | null>(null);
	/** Tracks which doc type is currently being deleted. */
	let deletingDoc = $state<string | null>(null);
	let pendingDocType = $state<string | null>(null);
	let showDocDeleteDialog = $state(false);

	const DOC_LABELS: Record<string, string> = {
		arbeitsvertrag: 'Arbeitsvertrag',
		mitarbeiterfragebogen: 'Mitarbeiterfragebogen'
	};

	/**
	 * Returns the S3 key stored for a given document type.
	 *
	 * Called by: Template (document card)
	 * Purpose: Derives the presence/absence of a document from the employee record.
	 *
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 * @returns The S3 key string, or null if not uploaded yet
	 */
	function docKey(docType: string): string | null {
		return docType === 'arbeitsvertrag' ? arbeitsvertragKey : mitarbeiterfragebogenKey;
	}

	/**
	 * Opens a hidden file input to select a document for upload.
	 *
	 * Called by: Template (upload button per doc type)
	 * Purpose: Triggers native file picker without exposing the input element in the UI.
	 *
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 */
	function triggerDocPicker(docType: string) {
		document.getElementById(`doc-input-${docType}`)?.click();
	}

	/**
	 * Uploads the selected file for the given document type.
	 *
	 * Called by: Template (onchange on the hidden file input)
	 * Purpose: POSTs the file as multipart to the backend, updates the employee record on success.
	 *
	 * @param e       - Native change event from the file input
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 */
	async function handleDocUpload(e: Event, docType: string) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;

		uploadingDoc = docType;
		try {
			const form = new FormData();
			form.append('file', file);
			const updated = await apiFetch<DocumentKeys>(
				`/api/v1/admin/employees/${employeeId}/documents/${docType}`,
				{ method: 'POST', body: form }
			);
			onUpdated(updated);
			showToast(`${DOC_LABELS[docType]} hochgeladen`, 'success');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'Upload fehlgeschlagen', 'error');
		} finally {
			uploadingDoc = null;
		}
	}

	/**
	 * Downloads the stored document by proxying it through the API.
	 *
	 * Called by: Template (download button per doc type)
	 * Purpose: Uses apiDownload so the JWT Authorization header is sent (S3 is not public).
	 *
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 */
	async function handleDocDownload(docType: string) {
		const key = docKey(docType);
		const filename = key?.split('/').pop() ?? `${docType}.pdf`;
		await apiDownload(`/api/v1/admin/employees/${employeeId}/documents/${docType}`, filename);
	}

	/**
	 * Opens the document delete confirmation dialog.
	 *
	 * Called by: Template (delete icon per doc type).
	 * Purpose: Records which doc type is pending deletion and shows the dialog.
	 *
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 */
	function confirmDocDelete(docType: string) {
		pendingDocType = docType;
		showDocDeleteDialog = true;
	}

	/**
	 * Deletes the pending document from S3 and clears the DB key after confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: Removes a previously uploaded document and resets the slot to "not uploaded".
	 */
	async function handleDocDelete() {
		const docType = pendingDocType;
		if (!docType) return;
		deletingDoc = docType;
		try {
			const updated = await apiFetch<DocumentKeys>(
				`/api/v1/admin/employees/${employeeId}/documents/${docType}`,
				{ method: 'DELETE' }
			);
			onUpdated(updated);
			showDocDeleteDialog = false;
			pendingDocType = null;
			showToast(`${DOC_LABELS[docType]} geloescht`, 'success');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'Fehler beim Loeschen', 'error');
		} finally {
			deletingDoc = null;
		}
	}
</script>

{#snippet row(icon: 'file' | 'plus', label: string, sub: string, missing: boolean, actions: import('svelte').Snippet)}
	<div class="flex items-center gap-3 py-2.5">
		<span class="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-line bg-sunk text-muted">
			{#if icon === 'file'}<FileText size={17} />{:else}<Plus size={17} />{/if}
		</span>
		<span class="flex min-w-0 flex-1 flex-col">
			<span class="text-sm font-medium">{label}</span>
			<span class="truncate text-xs {missing ? 'text-warn' : 'text-faint'}">{sub}</span>
		</span>
		<span class="flex shrink-0 gap-1">{@render actions()}</span>
	</div>
{/snippet}

<Panel title="Dokumente">
	<div class="-my-2.5 divide-y divide-line">
		{#each ['arbeitsvertrag', 'mitarbeiterfragebogen'] as docType (docType)}
			{@const key = docKey(docType)}
			{@const uploading = uploadingDoc === docType}
			{@const deleting = deletingDoc === docType}
			{#snippet docActions()}
				{#if key}
					<Button size="icon-sm" variant="ghost" onclick={() => handleDocDownload(docType)} title="Herunterladen" aria-label="Herunterladen"
						><Download size={14} /></Button
					>
					<Button size="icon-sm" variant="ghost" class="hover:text-danger" onclick={() => confirmDocDelete(docType)} disabled={deleting} title="Löschen" aria-label="Dokument löschen"
						><X size={14} /></Button
					>
				{:else}
					<Button size="sm" onclick={() => triggerDocPicker(docType)} disabled={uploading}>
						{#if uploading}Laden …{:else}<Upload size={14} /> Hochladen{/if}
					</Button>
				{/if}
			{/snippet}
			<div>
				{@render row('file', DOC_LABELS[docType], key ? (key.split('/').pop() ?? '') : 'Nicht hochgeladen', !key, docActions)}
				<input id="doc-input-{docType}" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" class="hidden" onchange={(e) => handleDocUpload(e, docType)} />
			</div>
		{/each}

		<!-- Free-form documents: whatever the personnel file needs, named by hand. -->
		{#each documents as doc (doc.id)}
			{#snippet extraActions()}
				<Button size="icon-sm" variant="ghost" onclick={() => handleExtraDownload(doc)} title="Herunterladen" aria-label="Herunterladen"><Download size={14} /></Button>
				<Button
					size="icon-sm"
					variant="ghost"
					class="hover:text-danger"
					onclick={() => {
						pendingExtraDoc = doc;
					}}
					disabled={deletingExtraId === doc.id}
					title="Löschen"
					aria-label="Dokument löschen"><X size={14} /></Button
				>
			{/snippet}
			{@render row('file', doc.label, `${doc.filename} · ${fmtSize(doc.size_bytes)}`, false, extraActions)}
		{/each}

		<div class="flex flex-wrap items-center gap-3 py-2.5">
			<span class="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-dashed border-line-strong text-faint"><Plus size={17} /></span>
			<span class="flex min-w-48 flex-1 flex-col gap-1">
				<label class="text-xs font-medium text-muted" for="doc-new-label">Weiteres Dokument</label>
				<input
					id="doc-new-label"
					class="h-8 rounded-sm border border-line-strong bg-panel px-2.5 text-sm outline-none placeholder:text-faint focus:border-fg"
					type="text"
					maxlength="100"
					placeholder="Bezeichnung, z. B. Führungszeugnis"
					bind:value={newDocLabel}
					onkeydown={(e) => {
						if (e.key === 'Enter') triggerExtraPicker();
					}}
				/>
			</span>
			<Button
				size="sm"
				class="self-end"
				onclick={triggerExtraPicker}
				disabled={!canUploadExtra}
				title={canUploadExtra ? 'Datei auswählen' : 'Bitte zuerst eine Bezeichnung eingeben'}
			>
				{#if uploadingExtra}Laden …{:else}<Upload size={14} /> Hochladen{/if}
			</Button>
			<input id="doc-input-extra" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" class="hidden" onchange={handleExtraUpload} />
		</div>
	</div>
</Panel>

<ConfirmationDialog
	open={pendingExtraDoc !== null}
	title="Dokument löschen"
	message={pendingExtraDoc ? `${pendingExtraDoc.label} wirklich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deletingExtraId !== null}
	onConfirm={handleExtraDelete}
	onCancel={() => {
		pendingExtraDoc = null;
	}}
/>

<ConfirmationDialog
	bind:open={showDocDeleteDialog}
	title="Dokument löschen"
	message={pendingDocType ? `${DOC_LABELS[pendingDocType]} wirklich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deletingDoc !== null}
	onConfirm={handleDocDelete}
	onCancel={() => {
		pendingDocType = null;
	}}
/>
