<script lang="ts">
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

<!-- Documents Card -->
<div class="card full-width">
	<div class="card-header">
		<h2>Dokumente</h2>
	</div>
	<div class="docs-grid">
		{#each ['arbeitsvertrag', 'mitarbeiterfragebogen'] as docType}
			{@const key = docKey(docType)}
			{@const label = DOC_LABELS[docType]}
			{@const uploading = uploadingDoc === docType}
			{@const deleting = deletingDoc === docType}
			<div class="doc-row">
				<div class="doc-icon">
					<FileText size={20} />
				</div>
				<div class="doc-info">
					<span class="doc-label">{label}</span>
					{#if key}
						<span class="doc-filename">{key.split('/').pop()}</span>
					{:else}
						<span class="doc-missing">Nicht hochgeladen</span>
					{/if}
				</div>
				<div class="doc-actions">
					{#if key}
						<button
							class="btn btn-sm"
							onclick={() => handleDocDownload(docType)}
							title="Herunterladen"
						>
							<Download size={14} />
						</button>
						<button
							class="btn btn-sm btn-danger-sm"
							onclick={() => confirmDocDelete(docType)}
							disabled={deleting}
							title="Loeschen"
						>
							<X size={14} />
						</button>
					{:else}
						<button
							class="btn btn-sm btn-primary-sm"
							onclick={() => triggerDocPicker(docType)}
							disabled={uploading}
						>
							{#if uploading}
								Laden...
							{:else}
								<Upload size={14} />
								Hochladen
							{/if}
						</button>
					{/if}
				</div>
				<input
					id="doc-input-{docType}"
					type="file"
					accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
					class="doc-input-hidden"
					onchange={(e) => handleDocUpload(e, docType)}
				/>
			</div>
		{/each}

		<!-- Free-form documents: whatever the personnel file needs, named by hand. -->
		{#each documents as doc (doc.id)}
			<div class="doc-row">
				<div class="doc-icon">
					<FileText size={20} />
				</div>
				<div class="doc-info">
					<span class="doc-label">{doc.label}</span>
					<span class="doc-filename">{doc.filename} · {fmtSize(doc.size_bytes)}</span>
				</div>
				<div class="doc-actions">
					<button
						class="btn btn-sm"
						onclick={() => handleExtraDownload(doc)}
						title="Herunterladen"
					>
						<Download size={14} />
					</button>
					<button
						class="btn btn-sm btn-danger-sm"
						onclick={() => { pendingExtraDoc = doc; }}
						disabled={deletingExtraId === doc.id}
						title="Loeschen"
					>
						<X size={14} />
					</button>
				</div>
			</div>
		{/each}

		<div class="doc-row doc-add-row">
			<div class="doc-icon">
				<Plus size={20} />
			</div>
			<div class="doc-info">
				<label class="doc-add-label" for="doc-new-label">Weiteres Dokument</label>
				<input
					id="doc-new-label"
					class="doc-add-input"
					type="text"
					maxlength="100"
					placeholder="Bezeichnung, z. B. Führungszeugnis"
					bind:value={newDocLabel}
					onkeydown={(e) => { if (e.key === 'Enter') triggerExtraPicker(); }}
				/>
			</div>
			<div class="doc-actions">
				<button
					class="btn btn-sm btn-primary-sm"
					onclick={triggerExtraPicker}
					disabled={!canUploadExtra}
					title={canUploadExtra ? 'Datei auswählen' : 'Bitte zuerst eine Bezeichnung eingeben'}
				>
					{#if uploadingExtra}
						Laden...
					{:else}
						<Upload size={14} />
						Hochladen
					{/if}
				</button>
			</div>
			<input
				id="doc-input-extra"
				type="file"
				accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
				class="doc-input-hidden"
				onchange={handleExtraUpload}
			/>
		</div>
	</div>
</div>

<ConfirmationDialog
	open={pendingExtraDoc !== null}
	title="Dokument löschen"
	message={pendingExtraDoc ? `${pendingExtraDoc.label} wirklich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deletingExtraId !== null}
	onConfirm={handleExtraDelete}
	onCancel={() => { pendingExtraDoc = null; }}
/>

<ConfirmationDialog
	bind:open={showDocDeleteDialog}
	title="Dokument löschen"
	message={pendingDocType ? `${DOC_LABELS[pendingDocType]} wirklich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deletingDoc !== null}
	onConfirm={handleDocDelete}
	onCancel={() => { pendingDocType = null; }}
/>

<style>
	.card {
		padding: 1.25rem;
		box-shadow: none;
	}

	.card.full-width {
		grid-column: 1 / -1;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
		margin: 0;
	}

	.docs-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.doc-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container-low);
	}

	.doc-icon {
		color: var(--dt-on-surface-variant);
		flex-shrink: 0;
	}

	.doc-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.doc-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.doc-filename {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.doc-missing {
		font-size: 0.75rem;
		color: var(--dt-outline-variant);
		font-style: italic;
	}

	.doc-actions {
		display: flex;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.doc-input-hidden {
		display: none;
	}

	.doc-add-row {
		background: transparent;
		border: 1px dashed var(--dt-outline-variant);
	}

	.doc-add-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
	}

	.doc-add-input {
		width: 100%;
		padding: 0.375rem 0.5rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
	}

	.doc-add-input:focus {
		outline: none;
		border-color: var(--dt-primary);
	}

	.btn-primary-sm {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		border: none;
	}

	.btn-primary-sm:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-danger-sm {
		color: var(--dt-secondary);
		border-color: rgba(var(--dt-secondary-rgb), 0.2);
	}

	.btn-danger-sm:hover:not(:disabled) {
		background: rgba(var(--dt-secondary-rgb), 0.06);
	}

	@media (max-width: 768px) {
		.doc-row {
			flex-wrap: wrap;
		}
	}
</style>
