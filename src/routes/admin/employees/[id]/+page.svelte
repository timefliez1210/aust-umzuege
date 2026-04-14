<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, apiDownload, apiFetch, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { ArrowLeft, Save, Trash2, Upload, Download, X, FileText, FileSpreadsheet } from 'lucide-svelte';
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
		clock_in: string | null;
		clock_out: string | null;
		break_minutes: number;
		start_time: string | null;
		end_time: string | null;
		notes: string | null;
		status: string;
	}

	interface CalendarItemAssignment {
		calendar_item_id: string;
		title: string;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		planned_hours: number;
		actual_hours: number | null;
		clock_in: string | null;
		clock_out: string | null;
		break_minutes: number;
		start_time: string | null;
		end_time: string | null;
		status: string;
	}

	interface TimeDraft {
		clock_in: string;
		clock_out: string;
		break_minutes: number;
		saving: boolean;
	}

	interface HoursSummary {
		from: string;
		to: string;
		target_hours: number;
		planned_hours: number;
		actual_hours: number;
		assignment_count: number;
		assignments: Assignment[];
		calendar_items: CalendarItemAssignment[];
	}

	let data = $state<Employee | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let showDeleteDialog = $state(false);
	let pendingDocType = $state<string | null>(null);
	let showDocDeleteDialog = $state(false);
	let hoursSummary = $state<HoursSummary | null>(null);
	let timeDrafts = $state<Record<string, TimeDraft>>({});

	// Editable fields
	let editSalutation = $state('');
	let editFirstName = $state('');
	let editLastName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editTarget = $state('160');

	// Hours view mode: '7d' shows rolling 7-day window from today; 'month' shows calendar month
	let viewMode = $state<'7d' | 'month'>('7d');
	let selectedMonth = $state(new Date().toISOString().slice(0, 7));

	/**
	 * Returns today and today+6 as ISO date strings.
	 *
	 * Called by: loadHours (7-day mode)
	 * Purpose: Computes the rolling 7-day window anchored to the current date.
	 *
	 * @returns { from, to } — YYYY-MM-DD strings
	 */
	function getWeekRange(): { from: string; to: string } {
		const today = new Date();
		const from = today.toISOString().slice(0, 10);
		const to = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
		return { from, to };
	}

	$effect(() => {
		const id = $page.params.id;
		if (id) {
			loadEmployee(id);
			loadHours(id);
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
	 * Loads hours summary for the active view mode (7-day or month).
	 *
	 * Called by: $effect on mount, view mode toggle, month picker change
	 * Purpose: Fetches hours aggregation for either the rolling 7-day window or a calendar month.
	 */
	async function loadHours(id: string) {
		try {
			let url: string;
			if (viewMode === '7d') {
				const { from, to } = getWeekRange();
				url = `/api/v1/admin/employees/${id}/hours?from=${from}&to=${to}`;
			} else {
				url = `/api/v1/admin/employees/${id}/hours?month=${selectedMonth}`;
			}
			hoursSummary = await apiGet<HoursSummary>(url);

			// Initialise inline-edit drafts from server values
			const drafts: Record<string, TimeDraft> = {};
			for (const a of hoursSummary.assignments ?? []) {
				drafts[`inq:${a.inquiry_id}`] = {
					clock_in: a.clock_in ? a.clock_in.slice(0, 5) : '',
					clock_out: a.clock_out ? a.clock_out.slice(0, 5) : '',
					break_minutes: a.break_minutes ?? 0,
					saving: false
				};
			}
			for (const ci of hoursSummary.calendar_items ?? []) {
				drafts[`ci:${ci.calendar_item_id}`] = {
					clock_in: ci.clock_in ? ci.clock_in.slice(0, 5) : '',
					clock_out: ci.clock_out ? ci.clock_out.slice(0, 5) : '',
					break_minutes: ci.break_minutes ?? 0,
					saving: false
				};
			}
			timeDrafts = drafts;
		} catch {
			hoursSummary = null;
			timeDrafts = {};
		}
	}

	/** Converts "HH:MM" (from <input type="time">) to "HH:MM:SS" for the API, or null if empty. */
	function toTimeStr(val: string): string | null {
		if (!val) return null;
		return val.length === 5 ? `${val}:00` : val;
	}

	/**
	 * Saves clock_in / clock_out / break_minutes for one assignment row via PATCH.
	 *
	 * Called by: onblur on any time/break input in the assignments table.
	 * Purpose: Persists per-day time tracking without a dedicated save button.
	 *
	 * @param key - "inq:{inquiry_id}" or "ci:{calendar_item_id}"
	 */
	async function saveTime(key: string) {
		if (!data) return;
		const draft = timeDrafts[key];
		if (!draft || draft.saving) return;
		draft.saving = true;
		try {
			const [type, id] = key.split(':');
			const payload = {
				clock_in: toTimeStr(draft.clock_in),
				clock_out: toTimeStr(draft.clock_out),
				break_minutes: draft.break_minutes
			};
			if (type === 'inq') {
				await apiPatch(`/api/v1/inquiries/${id}/employees/${data.id}`, payload);
			} else {
				await apiPatch(`/api/v1/admin/calendar-items/${id}/employees/${data.id}`, payload);
			}
			// Reload to refresh the computed actual_hours column
			await loadHours(data.id);
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			draft.saving = false;
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
	/**
	 * Soft-deletes (deactivates) the employee after confirmation dialog.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: Sets active=false, preserving assignment history. Navigates back to list.
	 */
	async function handleDelete() {
		if (!data) return;
		try {
			await apiPost(`/api/v1/admin/employees/${data.id}/delete`);
			showDeleteDialog = false;
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
		if (data) loadHours(data.id);
	}

	/**
	 * Switches between 7-day and month view modes and reloads hours.
	 *
	 * Called by: Template (view mode toggle buttons)
	 * Purpose: Lets admin switch between rolling 7-day window and calendar month view.
	 *
	 * @param mode - '7d' for rolling week view, 'month' for calendar month view
	 */
	function setViewMode(mode: '7d' | 'month') {
		viewMode = mode;
		if (data) loadHours(data.id);
	}

	let exportingXlsx = $state(false);

	/**
	 * Downloads the employee's Stundenzettel as an XLSX file for the selected month.
	 *
	 * Called by: Template (export button, month view only)
	 * Purpose: Generates the monthly timesheet document Alex uses for payroll.
	 */
	async function exportStundenzettel() {
		if (!data) return;
		exportingXlsx = true;
		try {
			const filename = `Stundenzettel_${data.last_name}_${data.first_name}_${selectedMonth}.xlsx`;
			await apiDownload(
				`/api/v1/admin/employees/${data.id}/hours/export?month=${selectedMonth}`,
				filename
			);
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Export fehlgeschlagen', 'error');
		} finally {
			exportingXlsx = false;
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
		if (!data || !docType) return;
		deletingDoc = docType;
		try {
			const updated = await apiFetch<Employee>(
				`/api/v1/admin/employees/${data.id}/documents/${docType}`,
				{ method: 'DELETE' }
			);
			data = { ...data, ...updated };
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
			<button class="btn btn-danger" onclick={() => { showDeleteDialog = true; }}>
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

		<!-- Hours Card (7-day or monthly) -->
		<div class="card">
			<div class="card-header">
				<h2>Stunden</h2>
				<div class="view-toggle">
					<button
						class="toggle-btn"
						class:active={viewMode === '7d'}
						onclick={() => setViewMode('7d')}
					>7 Tage</button>
					<button
						class="toggle-btn"
						class:active={viewMode === 'month'}
						onclick={() => setViewMode('month')}
					>Monat</button>
					{#if viewMode === 'month'}
						<input
							type="month"
							bind:value={selectedMonth}
							onchange={onHoursMonthChange}
							class="month-input"
						/>
						<button
							class="btn btn-sm export-btn"
							onclick={exportStundenzettel}
							disabled={exportingXlsx}
							title="Stundenzettel als XLSX herunterladen"
						>
							{#if exportingXlsx}
								…
							{:else}
								<FileSpreadsheet size={14} />
							{/if}
						</button>
					{/if}
				</div>
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
				<div class="empty-state">
					{viewMode === '7d' ? 'Keine Einsaetze in den naechsten 7 Tagen.' : 'Keine Daten fuer diesen Monat.'}
				</div>
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

	<!-- Assignments Table -->
	<div class="card full-width">
		<div class="card-header">
			<h2>Einsaetze</h2>
		</div>
		{#if hoursSummary && (hoursSummary.assignments.length > 0 || hoursSummary.calendar_items?.length > 0)}
			<div class="table-wrapper">
				<table class="data-table">
					<thead>
						<tr>
							<th>Datum</th>
							<th>Beschreibung</th>
							<th>Details</th>
							<th class="num">Geplant (h)</th>
							<th class="time-col">Von</th>
							<th class="time-col">Bis</th>
							<th class="time-col">Pause (Min.)</th>
							<th class="num">Ist (h)</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each hoursSummary.assignments as a}
							{@const key = `inq:${a.inquiry_id}`}
							{@const draft = timeDrafts[key]}
							<tr
								class="clickable-row"
								onclick={() => { if (a.inquiry_id) goto(`/admin/inquiries/${a.inquiry_id}`); }}
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
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="time"
											class="time-input"
											class:saving={draft.saving}
											bind:value={draft.clock_in}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="time"
											class="time-input"
											class:saving={draft.saving}
											bind:value={draft.clock_out}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="number"
											class="break-input"
											class:saving={draft.saving}
											min="0"
											step="5"
											bind:value={draft.break_minutes}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="num">{a.actual_hours?.toFixed(1) ?? '—'}</td>
								<td><StatusBadge status={a.status} /></td>
							</tr>
						{/each}
						{#each (hoursSummary.calendar_items ?? []) as ci}
							{@const key = `ci:${ci.calendar_item_id}`}
							{@const draft = timeDrafts[key]}
							<tr
								class="clickable-row item-row"
								onclick={() => goto(`/admin/calendar-items/${ci.calendar_item_id}`)}
							>
								<td>{ci.scheduled_date ? formatDate(ci.scheduled_date) : '—'}</td>
								<td>
									<span class="item-badge">Termin</span>
									{ci.title}
								</td>
								<td>{ci.location ?? '—'}</td>
								<td class="num">{ci.planned_hours.toFixed(1)}</td>
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="time"
											class="time-input"
											class:saving={draft.saving}
											bind:value={draft.clock_in}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="time"
											class="time-input"
											class:saving={draft.saving}
											bind:value={draft.clock_out}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="time-cell" onclick={(e) => e.stopPropagation()}>
									{#if draft}
										<input
											type="number"
											class="break-input"
											class:saving={draft.saving}
											min="0"
											step="5"
											bind:value={draft.break_minutes}
											onblur={() => saveTime(key)}
										/>
									{/if}
								</td>
								<td class="num">{ci.actual_hours?.toFixed(1) ?? '—'}</td>
								<td><StatusBadge status={ci.status} /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="empty-state">
				{viewMode === '7d' ? 'Keine Einsaetze in den naechsten 7 Tagen.' : 'Keine Einsaetze in diesem Monat.'}
			</div>
		{/if}
	</div>
{/if}

<style>
	.page-header {
		justify-content: space-between;
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

	.field input,
	.field select {
		padding: 0.5rem;
	}

	.meta-info {
		display: flex;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		background: var(--dt-surface-container-low);
		margin-left: -1.25rem;
		margin-right: -1.25rem;
		margin-bottom: -1.25rem;
		padding: 0.75rem 1.25rem;
		border-radius: 0 0 var(--dt-radius-lg) var(--dt-radius-lg);
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.view-toggle {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.toggle-btn {
		padding: 0.25rem 0.6rem;
		font-size: 0.8125rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.toggle-btn.active {
		background: var(--dt-primary);
		color: var(--dt-on-primary);
	}

	.toggle-btn:hover:not(.active) {
		background: var(--dt-surface-container);
	}

	.export-btn {
		padding: 0.25rem 0.5rem;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		display: inline-flex;
		align-items: center;
	}

	.export-btn:hover:not(:disabled) {
		background: var(--dt-surface-container);
		color: var(--dt-on-surface);
	}

	.month-input {
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
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
		color: var(--dt-on-surface-variant);
		font-weight: 500;
	}

	.hours-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface);
	}

	.hours-row.muted {
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
		margin-top: 0.25rem;
	}

	.progress-bar {
		height: 8px;
		background: var(--dt-surface-container-high);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width var(--dt-transition-panel);
	}

	.progress-fill.planned {
		background: var(--dt-primary-container);
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
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		font-weight: 600;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem;
		color: var(--dt-on-surface);
	}

	.data-table tbody tr:nth-child(even) td {
		background: var(--dt-surface-container-low);
	}

	.data-table .num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.clickable-row {
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.clickable-row:hover td {
		background: var(--dt-surface-container) !important;
	}

	.item-row td {
		background: rgba(252, 96, 24, 0.04);
	}

	.item-row:hover td {
		background: rgba(252, 96, 24, 0.08) !important;
	}

	.item-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
		padding: 0.1rem 0.35rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.35rem;
		vertical-align: middle;
	}

	.time-col {
		text-align: center;
		white-space: nowrap;
	}

	.time-cell {
		padding: 0.25rem 0.5rem;
	}

	.time-input,
	.break-input {
		padding: 0.25rem 0.375rem;
		font-size: 0.8125rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		outline: none;
		width: 100%;
		min-width: 0;
		font-variant-numeric: tabular-nums;
		transition: border-color var(--dt-transition), opacity var(--dt-transition);
	}

	.time-input:focus,
	.break-input:focus {
		border-color: var(--dt-primary);
		background: var(--dt-surface-container);
	}

	.time-input.saving,
	.break-input.saving {
		opacity: 0.5;
	}

	.break-input {
		width: 5rem;
	}

	.loading,
	.empty-state {
		padding: 2rem;
	}

	.btn-back {
		color: var(--dt-on-surface-variant);
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
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Mitarbeiter deaktivieren"
	message={data ? `Mitarbeiter „${data.first_name} ${data.last_name}" deaktivieren?` : ''}
	confirmLabel="Deaktivieren"
	onConfirm={handleDelete}
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
