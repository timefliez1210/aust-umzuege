<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, apiDownload, apiFetch, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { ArrowLeft, Save, Trash2, Upload, Download, X, FileText } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';

	interface Employee {
		id: string;
		salutation: string | null;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		monthly_hours_target: number;
		active: boolean;
		arbeitsvertrag_key: string | null;
		mitarbeiterfragebogen_key: string | null;
		created_at: string;
		updated_at: string;
		assignments: Assignment[];
	}

	interface Assignment {
		inquiry_id: string;
		customer_name: string | null;
		origin_city: string | null;
		destination_city: string | null;
		booking_date: string | null;
		planned_hours: number;
		actual_hours: number | null;
		notes: string | null;
		status: string;
	}

	interface HoursSummary {
		month: string;
		target_hours: number;
		planned_hours: number;
		actual_hours: number;
		assignment_count: number;
		assignments: Assignment[];
	}

	let data = $state<Employee | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let hoursSummary = $state<HoursSummary | null>(null);

	// Editable fields
	let editSalutation = $state('');
	let editFirstName = $state('');
	let editLastName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editTarget = $state('160');

	// Month picker for hours card
	let selectedMonth = $state(new Date().toISOString().slice(0, 7));

	$effect(() => {
		const id = $page.params.id;
		if (id) {
			loadEmployee(id);
			loadHours(id, selectedMonth);
		}
	});

	/**
	 * Loads employee detail from the API.
	 *
	 * Called by: $effect on mount
	 * Purpose: Fetches employee profile and assignment history.
	 */
	async function loadEmployee(id: string) {
		loading = true;
		try {
			const res = await apiGet<Employee>(`/api/v1/admin/employees/${id}`);
			data = res;
			editSalutation = res.salutation ?? '';
			editFirstName = res.first_name;
			editLastName = res.last_name;
			editEmail = res.email;
			editPhone = res.phone ?? '';
			editTarget = String(res.monthly_hours_target);
		} catch {
			showToast('Mitarbeiter nicht gefunden', 'error');
			goto('/admin/employees');
		} finally {
			loading = false;
		}
	}

	/**
	 * Loads monthly hours summary.
	 *
	 * Called by: $effect on mount and month picker change
	 * Purpose: Fetches hours aggregation for selected month.
	 */
	async function loadHours(id: string, month: string) {
		try {
			hoursSummary = await apiGet<HoursSummary>(
				`/api/v1/admin/employees/${id}/hours?month=${month}`
			);
		} catch {
			hoursSummary = null;
		}
	}

	/**
	 * Saves updated employee profile fields.
	 *
	 * Called by: Template (save button)
	 * Purpose: Persists profile changes via PATCH.
	 */
	async function handleSave() {
		if (!data) return;
		saving = true;
		try {
			const updated = await apiPatch<Employee>(`/api/v1/admin/employees/${data.id}`, {
				salutation: editSalutation || null,
				first_name: editFirstName,
				last_name: editLastName,
				email: editEmail,
				phone: editPhone || null,
				monthly_hours_target: parseFloat(editTarget) || 160
			});
			data = { ...data, ...updated };
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			saving = false;
		}
	}

	/**
	 * Soft-deletes (deactivates) the employee.
	 *
	 * Called by: Template (delete button)
	 * Purpose: Sets active=false, preserving assignment history.
	 */
	async function handleDelete() {
		if (!data || !confirm('Mitarbeiter deaktivieren?')) return;
		try {
			await apiPost(`/api/v1/admin/employees/${data.id}/delete`);
			showToast('Mitarbeiter deaktiviert', 'success');
			goto('/admin/employees');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Handles month picker change in hours card.
	 *
	 * Called by: Template (month input onchange)
	 * Purpose: Reloads hours summary for the new month.
	 */
	function onHoursMonthChange() {
		if (data) {
			loadHours(data.id, selectedMonth);
		}
	}

	/**
	 * Calculates progress bar width percentage.
	 *
	 * Called by: Template (progress bar)
	 * Purpose: Visual representation of target vs planned/actual.
	 *
	 * Math: width = min(100, (value / target) * 100)
	 */
	function progressPct(value: number, target: number): number {
		if (target <= 0) return 0;
		return Math.min(100, (value / target) * 100);
	}

	// --- Document upload/download ---

	/** Tracks which doc type is currently being uploaded (shows spinner). */
	let uploadingDoc = $state<string | null>(null);
	/** Tracks which doc type is currently being deleted. */
	let deletingDoc = $state<string | null>(null);

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
		if (!data) return null;
		return docType === 'arbeitsvertrag'
			? data.arbeitsvertrag_key
			: data.mitarbeiterfragebogen_key;
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
		if (!file || !data) return;

		uploadingDoc = docType;
		try {
			const form = new FormData();
			form.append('file', file);
			const updated = await apiFetch<Employee>(
				`/api/v1/admin/employees/${data.id}/documents/${docType}`,
				{ method: 'POST', body: form }
			);
			data = { ...data, ...updated };
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
		if (!data) return;
		const key = docKey(docType);
		const filename = key?.split('/').pop() ?? `${docType}.pdf`;
		await apiDownload(`/api/v1/admin/employees/${data.id}/documents/${docType}`, filename);
	}

	/**
	 * Deletes the stored document from S3 and clears the DB key.
	 *
	 * Called by: Template (delete icon per doc type)
	 * Purpose: Removes a previously uploaded document and resets the slot to "not uploaded".
	 *
	 * @param docType - "arbeitsvertrag" or "mitarbeiterfragebogen"
	 */
	async function handleDocDelete(docType: string) {
		if (!data || !confirm(`${DOC_LABELS[docType]} wirklich loeschen?`)) return;
		deletingDoc = docType;
		try {
			const updated = await apiFetch<Employee>(
				`/api/v1/admin/employees/${data.id}/documents/${docType}`,
				{ method: 'DELETE' }
			);
			data = { ...data, ...updated };
			showToast(`${DOC_LABELS[docType]} geloescht`, 'success');
		} catch (err: unknown) {
			showToast(err instanceof Error ? err.message : 'Fehler beim Loeschen', 'error');
		} finally {
			deletingDoc = null;
		}
	}
</script>

<svelte:head>
	<title>
		{data ? `${data.first_name} ${data.last_name}` : 'Mitarbeiter'} | AUST Admin
	</title>
</svelte:head>

<div class="page-header">
	<button class="btn btn-back" onclick={() => goto('/admin/employees')}>
		<ArrowLeft size={16} />
		Zurueck
	</button>
	{#if data && auth.user?.role === 'admin'}
		<div class="header-actions">
			<button class="btn btn-danger" onclick={handleDelete}>
				<Trash2 size={16} />
				Deaktivieren
			</button>
		</div>
	{/if}
</div>

{#if loading}
	<div class="loading">Laden...</div>
{:else if data}
	<div class="detail-grid">
		<!-- Profile Card -->
		<div class="card">
			<div class="card-header">
				<h2>Profil</h2>
				<button class="btn btn-primary" onclick={handleSave} disabled={saving}>
					<Save size={16} />
					{saving ? 'Speichern...' : 'Speichern'}
				</button>
			</div>
			<div class="form-grid">
				<div class="field">
					<label for="edit-sal">Anrede</label>
					<select id="edit-sal" bind:value={editSalutation}>
						<option value="">—</option>
						<option value="Herr">Herr</option>
						<option value="Frau">Frau</option>
						<option value="D">Divers</option>
					</select>
				</div>
				<div class="field">
					<label for="edit-target">Monatsstunden</label>
					<input id="edit-target" type="number" step="0.5" bind:value={editTarget} />
				</div>
				<div class="field">
					<label for="edit-fn">Vorname</label>
					<input id="edit-fn" type="text" bind:value={editFirstName} />
				</div>
				<div class="field">
					<label for="edit-ln">Nachname</label>
					<input id="edit-ln" type="text" bind:value={editLastName} />
				</div>
				<div class="field">
					<label for="edit-email">E-Mail</label>
					<input id="edit-email" type="email" bind:value={editEmail} />
				</div>
				<div class="field">
					<label for="edit-phone">Telefon</label>
					<input id="edit-phone" type="text" bind:value={editPhone} />
				</div>
			</div>
			<div class="meta-info">
				<span>Erstellt: {formatDate(data.created_at)}</span>
				<span>Status: {data.active ? 'Aktiv' : 'Inaktiv'}</span>
			</div>
		</div>

		<!-- Monthly Hours Card -->
		<div class="card">
			<div class="card-header">
				<h2>Monatsstunden</h2>
				<input
					type="month"
					bind:value={selectedMonth}
					onchange={onHoursMonthChange}
					class="month-input"
				/>
			</div>
			{#if hoursSummary}
				<div class="hours-summary">
					<div class="hours-row">
						<span class="hours-label">Ziel</span>
						<span class="hours-value">{hoursSummary.target_hours} h</span>
					</div>
					<div class="hours-row">
						<span class="hours-label">Geplant</span>
						<span class="hours-value">{hoursSummary.planned_hours.toFixed(1)} h</span>
					</div>
					<div class="progress-bar">
						<div
							class="progress-fill planned"
							style="width: {progressPct(hoursSummary.planned_hours, hoursSummary.target_hours)}%"
						></div>
					</div>
					<div class="hours-row">
						<span class="hours-label">Ist</span>
						<span class="hours-value">{hoursSummary.actual_hours.toFixed(1)} h</span>
					</div>
					<div class="progress-bar">
						<div
							class="progress-fill actual"
							style="width: {progressPct(hoursSummary.actual_hours, hoursSummary.target_hours)}%"
						></div>
					</div>
					<div class="hours-row muted">
						<span>{hoursSummary.assignment_count} Einsaetze</span>
					</div>
				</div>
			{:else}
				<div class="empty-state">Keine Daten fuer diesen Monat.</div>
			{/if}
		</div>
	</div>

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
								onclick={() => handleDocDelete(docType)}
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

	<!-- Assignments Table -->
	<div class="card full-width">
		<div class="card-header">
			<h2>Einsaetze</h2>
		</div>
		{#if hoursSummary && hoursSummary.assignments.length > 0}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Datum</th>
							<th>Kunde</th>
							<th>Strecke</th>
							<th class="num">Geplant (h)</th>
							<th class="num">Ist (h)</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each hoursSummary.assignments as a}
							<tr
								class="clickable-row"
								onclick={() => goto(`/admin/inquiries/${a.inquiry_id}`)}
							>
								<td>{a.booking_date ? formatDate(a.booking_date) : '—'}</td>
								<td>{a.customer_name ?? '—'}</td>
								<td>
									{#if a.origin_city && a.destination_city}
										{a.origin_city} → {a.destination_city}
									{:else}
										—
									{/if}
								</td>
								<td class="num">{a.planned_hours.toFixed(1)}</td>
								<td class="num">{a.actual_hours?.toFixed(1) ?? '—'}</td>
								<td><StatusBadge status={a.status} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">Keine Einsaetze in diesem Monat.</div>
		{/if}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.card {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		border: 1px solid #f1f5f9;
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
		color: #1e293b;
		margin: 0;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
	}

	.field input,
	.field select {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.meta-info {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f1f5f9;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.month-input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.hours-summary {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.hours-label {
		color: #64748b;
		font-weight: 500;
	}

	.hours-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.hours-row.muted {
		color: #94a3b8;
		font-size: 0.8125rem;
		margin-top: 0.25rem;
	}

	.progress-bar {
		height: 8px;
		background: #f1f5f9;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 300ms ease;
	}

	.progress-fill.planned {
		background: #818cf8;
	}

	.progress-fill.actual {
		background: #34d399;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid #e2e8f0;
		color: #64748b;
		font-weight: 600;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.data-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.clickable-row {
		cursor: pointer;
		transition: background 150ms;
	}

	.clickable-row:hover {
		background: #f8fafc;
	}

	.loading,
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: #94a3b8;
		font-size: 0.875rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.btn:hover {
		background: #f8fafc;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #4f46e5;
		color: #fff;
		border-color: #4f46e5;
	}

	.btn-primary:hover {
		background: #4338ca;
	}

	.btn-back {
		color: #64748b;
	}

	.btn-danger {
		color: #dc2626;
		border-color: #fecaca;
	}

	.btn-danger:hover {
		background: #fef2f2;
	}

	/* === Documents === */

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
		border: 1px solid #f1f5f9;
		border-radius: 0.5rem;
		background: #fafafa;
	}

	.doc-icon {
		color: #94a3b8;
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
		color: #1e293b;
	}

	.doc-filename {
		font-size: 0.75rem;
		color: #64748b;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.doc-missing {
		font-size: 0.75rem;
		color: #cbd5e0;
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

	.btn-sm {
		padding: 0.375rem 0.625rem;
		font-size: 0.8125rem;
		gap: 0.25rem;
	}

	.btn-primary-sm {
		background: #4f46e5;
		color: #fff;
		border-color: #4f46e5;
	}

	.btn-primary-sm:hover:not(:disabled) {
		background: #4338ca;
	}

	.btn-danger-sm {
		color: #dc2626;
		border-color: #fecaca;
	}

	.btn-danger-sm:hover:not(:disabled) {
		background: #fef2f2;
	}

	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.form-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
	}
</style>
