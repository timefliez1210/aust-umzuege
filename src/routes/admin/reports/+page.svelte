<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { apiFetch, apiGet, apiPatch, apiDownload, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Flag, Plus, X, Upload, ChevronDown, Download, CheckCircle2, Circle, Loader } from 'lucide-svelte';

	interface FeedbackReport {
		id: string;
		report_type: 'bug' | 'feature';
		priority: 'low' | 'medium' | 'high' | 'critical';
		title: string;
		description: string | null;
		location: string | null;
		attachment_keys: string[];
		status: 'open' | 'in_progress' | 'resolved';
		created_at: string;
		updated_at: string;
	}

	// ── Guards ────────────────────────────────────────────────────────────────
	$effect(() => {
		if (auth.user && auth.user.role !== 'admin') goto('/admin');
	});

	// ── List state ────────────────────────────────────────────────────────────
	let reports = $state<FeedbackReport[]>([]);
	let loading = $state(true);
	let filterStatus = $state('');
	let filterType = $state('');

	// ── Detail panel ─────────────────────────────────────────────────────────
	let selected = $state<FeedbackReport | null>(null);

	// ── Create form ──────────────────────────────────────────────────────────
	let showForm = $state(false);
	let formType = $state<'bug' | 'feature'>('bug');
	let formPriority = $state<'low' | 'medium' | 'high' | 'critical'>('medium');
	let formTitle = $state('');
	let formDesc = $state('');
	let formLocation = $state(typeof window !== 'undefined' ? window.location.pathname : '');
	let formFiles = $state<File[]>([]);
	let submitting = $state(false);
	let dragOver = $state(false);

	$effect(() => {
		loadReports();
	});

	/**
	 * Loads the report list from the API with optional filters applied.
	 *
	 * Called by: $effect on mount and whenever filterStatus/filterType change.
	 * Purpose: Fetches all feedback reports visible to the admin.
	 */
	async function loadReports() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filterStatus) params.set('status', filterStatus);
			if (filterType) params.set('type', filterType);
			const qs = params.toString();
			reports = await apiGet<FeedbackReport[]>(`/api/v1/admin/feedback${qs ? '?' + qs : ''}`);
		} catch {
			showToast('Fehler beim Laden der Reports', 'error');
		} finally {
			loading = false;
		}
	}

	/**
	 * Submits the new report form as multipart/form-data.
	 *
	 * Called by: Template (form submit button).
	 * Purpose: Creates a feedback report with optional file attachments.
	 */
	async function submitReport() {
		if (!formTitle.trim()) { showToast('Bitte Titel eingeben', 'error'); return; }
		submitting = true;
		try {
			const fd = new FormData();
			fd.append('type', formType);
			fd.append('priority', formPriority);
			fd.append('title', formTitle.trim());
			if (formDesc.trim()) fd.append('description', formDesc.trim());
			if (formLocation.trim()) fd.append('location', formLocation.trim());
			for (const file of formFiles) fd.append('attachments', file);

			await apiFetch('/api/v1/admin/feedback', { method: 'POST', body: fd });
			showToast('Report eingereicht', 'success');
			showForm = false;
			formTitle = ''; formDesc = ''; formFiles = [];
			formLocation = typeof window !== 'undefined' ? window.location.pathname : '';
			await loadReports();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Einreichen', 'error');
		} finally {
			submitting = false;
		}
	}

	/**
	 * Updates the status of a report via PATCH.
	 *
	 * Called by: Template (status dropdown in detail panel).
	 * Purpose: Lets the admin move a report from open → in_progress → resolved.
	 *
	 * @param id     - Report UUID
	 * @param status - New status value
	 */
	async function setStatus(id: string, status: string) {
		try {
			const updated = await apiPatch<FeedbackReport>(`/api/v1/admin/feedback/${id}`, { status });
			reports = reports.map(r => r.id === id ? updated : r);
			if (selected?.id === id) selected = updated;
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Downloads a single attachment by its index in the report's attachment_keys array.
	 *
	 * Called by: Template (attachment download button).
	 * Purpose: Proxies the file through the API so the auth header is sent.
	 *
	 * @param reportId - Report UUID
	 * @param idx      - Zero-based attachment index
	 * @param key      - S3 key (used to derive filename)
	 */
	async function downloadAttachment(reportId: string, idx: number, key: string) {
		const filename = key.split('/').pop() ?? `attachment-${idx}`;
		await apiDownload(`/api/v1/admin/feedback/${reportId}/attachments/${idx}`, filename);
	}

	/**
	 * Handles file drop onto the drop zone.
	 *
	 * Called by: Template (ondrop event on drop zone div).
	 * Purpose: Appends dropped files to formFiles for upload.
	 *
	 * @param e - Native DragEvent
	 */
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const files = Array.from(e.dataTransfer?.files ?? []);
		formFiles = [...formFiles, ...files];
	}

	/**
	 * Handles file selection via the hidden file input.
	 *
	 * Called by: Template (onchange on hidden file input).
	 * Purpose: Appends selected files to formFiles for upload.
	 *
	 * @param e - Native change event from file input
	 */
	function onFilePick(e: Event) {
		const input = e.target as HTMLInputElement;
		formFiles = [...formFiles, ...Array.from(input.files ?? [])];
		input.value = '';
	}

	/**
	 * Removes a file from the pending upload list by index.
	 *
	 * Called by: Template (remove button on file chip).
	 * Purpose: Lets the user deselect a file before submitting.
	 *
	 * @param i - Index in formFiles
	 */
	function removeFile(i: number) {
		formFiles = formFiles.filter((_, idx) => idx !== i);
	}

	const PRIORITY_LABEL: Record<string, string> = {
		low: 'Niedrig', medium: 'Mittel', high: 'Hoch', critical: 'Kritisch'
	};
	const PRIORITY_CLS: Record<string, string> = {
		low: 'p-low', medium: 'p-medium', high: 'p-high', critical: 'p-critical'
	};
	const STATUS_LABEL: Record<string, string> = {
		open: 'Offen', in_progress: 'In Bearbeitung', resolved: 'Erledigt'
	};
	const STATUS_CLS: Record<string, string> = {
		open: 's-open', in_progress: 's-progress', resolved: 's-resolved'
	};
	const TYPE_LABEL: Record<string, string> = { bug: 'Bug', feature: 'Feature' };
	const TYPE_CLS: Record<string, string> = { bug: 't-bug', feature: 't-feature' };

	/**
	 * Formats an ISO datetime string to a short German date.
	 *
	 * Called by: Template (report list and detail panel dates).
	 * Purpose: Human-readable date display for reports.
	 *
	 * @param s - ISO datetime string
	 * @returns German-formatted date string
	 */
	function fmt(s: string): string { return formatDate(s); }
</script>

<svelte:head>
	<title>Reports | AUST Admin</title>
</svelte:head>

<div class="page-header">
	<div class="header-left">
		<Flag size={20} />
		<h1>Reports</h1>
	</div>
	<button class="btn btn-primary" onclick={() => { showForm = true; }}>
		<Plus size={16} />
		Neuer Report
	</button>
</div>

<!-- Filters -->
<div class="toolbar">
	<select bind:value={filterStatus} onchange={loadReports} class="filter-select">
		<option value="">Alle Status</option>
		<option value="open">Offen</option>
		<option value="in_progress">In Bearbeitung</option>
		<option value="resolved">Erledigt</option>
	</select>
	<select bind:value={filterType} onchange={loadReports} class="filter-select">
		<option value="">Alle Typen</option>
		<option value="bug">Bug</option>
		<option value="feature">Feature</option>
	</select>
</div>

<!-- List + Detail layout -->
<div class="content-grid" class:has-detail={selected !== null}>
	<!-- Report list -->
	<div class="report-list">
		{#if loading}
			<div class="empty">Laden...</div>
		{:else if reports.length === 0}
			<div class="empty">Keine Reports vorhanden.</div>
		{:else}
			{#each reports as r}
				<button
					class="report-row"
					class:active={selected?.id === r.id}
					onclick={() => { selected = r; }}
				>
					<div class="row-top">
						<span class="badge {TYPE_CLS[r.report_type]}">{TYPE_LABEL[r.report_type]}</span>
						<span class="badge {PRIORITY_CLS[r.priority]}">{PRIORITY_LABEL[r.priority]}</span>
						<span class="badge {STATUS_CLS[r.status]}">{STATUS_LABEL[r.status]}</span>
						<span class="row-date">{fmt(r.created_at)}</span>
					</div>
					<div class="row-title">{r.title}</div>
					{#if r.location}
						<div class="row-location">{r.location}</div>
					{/if}
				</button>
			{/each}
		{/if}
	</div>

	<!-- Detail panel -->
	{#if selected}
		<div class="detail-panel">
			<div class="detail-header">
				<h2>{selected.title}</h2>
				<button class="btn-close" onclick={() => { selected = null; }}><X size={18} /></button>
			</div>

			<div class="detail-badges">
				<span class="badge {TYPE_CLS[selected.report_type]}">{TYPE_LABEL[selected.report_type]}</span>
				<span class="badge {PRIORITY_CLS[selected.priority]}">{PRIORITY_LABEL[selected.priority]}</span>
			</div>

			<!-- Status selector -->
			<div class="detail-field">
				<label class="field-label">Status</label>
				<div class="status-select-wrap">
					<select
						class="status-select badge {STATUS_CLS[selected.status]}"
						value={selected.status}
						onchange={(e) => setStatus(selected!.id, (e.target as HTMLSelectElement).value)}
					>
						<option value="open">Offen</option>
						<option value="in_progress">In Bearbeitung</option>
						<option value="resolved">Erledigt</option>
					</select>
					<ChevronDown size={12} class="status-arrow" />
				</div>
			</div>

			{#if selected.location}
				<div class="detail-field">
					<label class="field-label">Seite / Bereich</label>
					<div class="detail-value mono">{selected.location}</div>
				</div>
			{/if}

			{#if selected.description}
				<div class="detail-field">
					<label class="field-label">Beschreibung</label>
					<div class="detail-value pre">{selected.description}</div>
				</div>
			{/if}

			<div class="detail-field">
				<label class="field-label">Erstellt</label>
				<div class="detail-value">{fmt(selected.created_at)}</div>
			</div>

			<!-- Attachments -->
			{#if selected.attachment_keys.length > 0}
				<div class="detail-field">
					<label class="field-label">Anhänge ({selected.attachment_keys.length})</label>
					<div class="attachment-list">
						{#each selected.attachment_keys as key, i}
							{@const fname = key.split('/').pop() ?? `Datei ${i + 1}`}
							{@const isImage = /\.(png|jpe?g|gif|webp)$/i.test(key)}
							<div class="attachment-item">
								{#if isImage}
									<img
										src="/api/v1/admin/feedback/{selected.id}/attachments/{i}"
										alt={fname}
										class="attachment-thumb"
									/>
								{/if}
								<span class="attachment-name">{fname}</span>
								<button
									class="btn btn-sm"
									onclick={() => downloadAttachment(selected!.id, i, key)}
									title="Herunterladen"
								>
									<Download size={14} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Create form overlay -->
{#if showForm}
	<div class="modal-backdrop" onclick={() => { showForm = false; }}></div>
	<div class="modal">
		<div class="modal-header">
			<h2>Neuer Report</h2>
			<button class="btn-close" onclick={() => { showForm = false; }}><X size={18} /></button>
		</div>

		<div class="form-grid">
			<div class="field">
				<label for="f-type">Typ</label>
				<select id="f-type" bind:value={formType}>
					<option value="bug">Bug</option>
					<option value="feature">Feature Request</option>
				</select>
			</div>
			<div class="field">
				<label for="f-prio">Priorität</label>
				<select id="f-prio" bind:value={formPriority}>
					<option value="low">Niedrig</option>
					<option value="medium">Mittel</option>
					<option value="high">Hoch</option>
					<option value="critical">Kritisch</option>
				</select>
			</div>
		</div>

		<div class="field">
			<label for="f-title">Titel *</label>
			<input id="f-title" type="text" bind:value={formTitle} placeholder="Kurze Zusammenfassung" />
		</div>

		<div class="field">
			<label for="f-loc">Seite / Bereich</label>
			<input id="f-loc" type="text" bind:value={formLocation} placeholder="/admin/calendar" />
		</div>

		<div class="field">
			<label for="f-desc">Beschreibung</label>
			<textarea id="f-desc" rows="4" bind:value={formDesc} placeholder="Schritte zum Reproduzieren, erwartetes Verhalten..."></textarea>
		</div>

		<!-- File drop -->
		<div
			class="drop-zone"
			class:drag-over={dragOver}
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => { dragOver = false; }}
			ondrop={onDrop}
			role="presentation"
		>
			<Upload size={20} />
			<span>Screenshots hier ablegen oder</span>
			<button class="btn-link" onclick={() => document.getElementById('file-input')?.click()}>
				durchsuchen
			</button>
			<input id="file-input" type="file" multiple accept="image/*,.pdf" class="hidden-input" onchange={onFilePick} />
		</div>

		{#if formFiles.length > 0}
			<div class="file-chips">
				{#each formFiles as f, i}
					<span class="file-chip">
						{f.name}
						<button onclick={() => removeFile(i)}><X size={12} /></button>
					</span>
				{/each}
			</div>
		{/if}

		<div class="modal-actions">
			<button class="btn" onclick={() => { showForm = false; }}>Abbrechen</button>
			<button class="btn btn-primary" onclick={submitReport} disabled={submitting}>
				{#if submitting}
					<Loader size={15} class="spin" />
					Wird eingereicht...
				{:else}
					<Flag size={15} />
					Einreichen
				{/if}
			</button>
		</div>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--dt-on-surface);
	}

	.header-left h1 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}

	.toolbar {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.filter-select {
		padding: 0.375rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
	}

	/* Two-column layout when detail panel is open */
	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.content-grid.has-detail {
		grid-template-columns: 1fr 380px;
	}

	/* Report list */
	.report-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.report-row {
		text-align: left;
		background: var(--dt-surface-container);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-md);
		padding: 0.875rem 1rem;
		cursor: pointer;
		transition: background var(--dt-transition), border-color var(--dt-transition);
		width: 100%;
	}

	.report-row:hover,
	.report-row.active {
		background: var(--dt-surface-container-high);
		border-color: var(--dt-primary-container);
	}

	.row-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		margin-bottom: 0.375rem;
	}

	.row-date {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.row-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.row-location {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		margin-top: 0.2rem;
		font-family: monospace;
	}

	/* Detail panel */
	.detail-panel {
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		align-self: flex-start;
		position: sticky;
		top: 1rem;
	}

	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.875rem;
	}

	.detail-header h2 {
		font-size: 1rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		margin: 0;
		line-height: 1.4;
	}

	.detail-badges {
		display: flex;
		gap: 0.375rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.detail-field {
		margin-bottom: 1rem;
	}

	.field-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		display: block;
		margin-bottom: 0.25rem;
	}

	.detail-value {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
	}

	.detail-value.mono { font-family: monospace; }

	.detail-value.pre {
		white-space: pre-wrap;
		background: var(--dt-surface-container-high);
		padding: 0.625rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		line-height: 1.5;
	}

	.status-select-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
	}

	.status-select {
		appearance: none;
		border: none;
		padding: 0.2rem 1.5rem 0.2rem 0.5rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	/* Attachments */
	.attachment-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.attachment-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-sm);
		padding: 0.375rem 0.5rem;
	}

	.attachment-thumb {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.attachment-name {
		flex: 1;
		min-width: 0;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Badges */
	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.175rem 0.5rem;
		border-radius: 999px;
	}

	.t-bug     { background: #fee2e2; color: #991b1b; }
	.t-feature { background: #dbeafe; color: #1e40af; }

	.p-low      { background: #f1f5f9; color: #475569; }
	.p-medium   { background: #fef9c3; color: #854d0e; }
	.p-high     { background: #fed7aa; color: #9a3412; }
	.p-critical { background: #fca5a5; color: #7f1d1d; }

	.s-open     { background: #e0e7ff; color: #3730a3; }
	.s-progress { background: #fef3c7; color: #92400e; }
	.s-resolved { background: #dcfce7; color: #166534; }

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 400;
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 401;
		background: var(--dt-surface);
		border-radius: var(--dt-radius-lg);
		padding: 1.5rem;
		width: min(560px, calc(100vw - 2rem));
		max-height: calc(100vh - 4rem);
		overflow-y: auto;
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.modal-header h2 {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--dt-on-surface);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.field label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		transition: border-color var(--dt-transition);
		font-family: inherit;
		resize: vertical;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		border-color: var(--dt-primary);
	}

	/* Drop zone */
	.drop-zone {
		border: 1.5px dashed var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		padding: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		cursor: default;
		transition: border-color var(--dt-transition), background var(--dt-transition);
		margin-bottom: 0.75rem;
	}

	.drop-zone.drag-over {
		border-color: var(--dt-primary);
		background: rgba(var(--dt-primary-rgb, 79, 70, 229), 0.04);
	}

	.btn-link {
		background: none;
		border: none;
		color: var(--dt-primary);
		font-size: 0.875rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.hidden-input { display: none; }

	.file-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.file-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: var(--dt-surface-container-high);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface);
	}

	.file-chip button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		padding: 0;
		display: flex;
	}

	.btn-close {
		background: none;
		border: none;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		flex-shrink: 0;
	}

	.btn-close:hover { color: var(--dt-on-surface); }

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--dt-on-surface-variant);
		font-size: 0.9375rem;
	}

	:global(.spin) {
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.content-grid.has-detail {
			grid-template-columns: 1fr;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
