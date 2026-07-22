<script lang="ts">
	import { apiFetch, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { Upload, Download, X, FileText } from 'lucide-svelte';

	interface DocumentKeys {
		arbeitsvertrag_key: string | null;
		mitarbeiterfragebogen_key: string | null;
	}

	let {
		employeeId,
		arbeitsvertragKey,
		mitarbeiterfragebogenKey,
		onUpdated
	}: {
		employeeId: string;
		arbeitsvertragKey: string | null;
		mitarbeiterfragebogenKey: string | null;
		onUpdated: (updated: Partial<DocumentKeys>) => void;
	} = $props();

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
	</div>
</div>

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
