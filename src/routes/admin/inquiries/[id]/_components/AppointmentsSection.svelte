<script lang="ts">
	import { apiGet, apiPatch, apiPost, apiDelete } from "$lib/utils/api.svelte";
	import { normalizeTimeInput } from "$lib/utils/format";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { ChevronRight } from "lucide-svelte";
	import EmployeeAssignmentPanel from "$lib/components/admin/EmployeeAssignmentPanel.svelte";

	/** A crew member assigned to an appointment (paid Zusatztermin). */
	interface AppointmentCrew {
		employee_id: string;
		first_name: string;
		last_name: string;
	}

	/** Appointment linked to this inquiry — Besichtigung or paid Zusatztermin. */
	interface Appointment {
		id: string;
		kind: string;
		scheduled_date: string;
		start_time: string | null;
		end_time: string | null;
		assignee_id: string | null;
		assignee_name: string | null;
		location: string | null;
		description: string | null;
		employee_notes: string | null;
		notes: string | null;
		status: string;
		employees?: AppointmentCrew[];
		created_at: string;
	}

	interface EmployeeOption {
		id: string;
		first_name: string;
		last_name: string;
		email: string;
	}

	let {
		inquiryId,
		scheduledDate,
		appointments,
		open = $bindable(),
		onToggle,
		onSaved,
	}: {
		inquiryId: string;
		scheduledDate: string | null;
		appointments: Appointment[];
		open: boolean;
		onToggle: () => void;
		onSaved: () => void | Promise<void>;
	} = $props();

	const APPT_KIND_LABELS: Record<string, string> = { besichtigung: 'Besichtigung', nachtermin: 'Nachtermin' };
	const APPT_STATUS_LABELS: Record<string, string> = { scheduled: 'Geplant', done: 'Erledigt', cancelled: 'Storniert' };
	function apptKindLabel(k: string): string {
		return APPT_KIND_LABELS[k] ?? (k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Termin');
	}
	function formatApptDate(d: string): string {
		const [y, m, dd] = d.slice(0, 10).split('-');
		return `${dd}.${m}.${y}`;
	}

	let apptEmployees = $state<EmployeeOption[]>([]);
	let apptEmployeesLoaded = $state(false);
	let editingApptId = $state<string | null>(null);
	let apptSaving = $state(false);
	let apptForm = $state({
		kind: 'besichtigung',
		scheduled_date: '',
		start_time: '',
		end_time: '',
		assignee_id: '',
		location: '',
		description: '',
		employee_notes: '',
		notes: '',
		status: 'scheduled',
	});

	async function loadApptEmployees() {
		if (apptEmployeesLoaded) return;
		try {
			const res = await apiGet<{ employees: EmployeeOption[] }>('/api/v1/admin/employees?active=true&limit=100');
			apptEmployees = res.employees;
			apptEmployeesLoaded = true;
		} catch {
			showToast('Mitarbeiterliste konnte nicht geladen werden', 'error');
		}
	}

	/** Prepares the appointments card on open: loads staff, seeds a sensible date. */
	function onOpenAppointments() {
		onToggle();
		if (open) {
			loadApptEmployees();
			if (!editingApptId && !apptForm.scheduled_date) {
				apptForm.scheduled_date = scheduledDate?.slice(0, 10) ?? '';
			}
		}
	}

	function resetApptForm() {
		editingApptId = null;
		apptForm = {
			kind: 'besichtigung',
			scheduled_date: scheduledDate?.slice(0, 10) ?? '',
			start_time: '', end_time: '', assignee_id: '', location: '',
			description: '', employee_notes: '', notes: '', status: 'scheduled',
		};
	}

	function editAppt(a: Appointment) {
		editingApptId = a.id;
		apptForm = {
			kind: a.kind,
			scheduled_date: a.scheduled_date?.slice(0, 10) ?? '',
			start_time: a.start_time ? a.start_time.slice(0, 5) : '',
			end_time: a.end_time ? a.end_time.slice(0, 5) : '',
			assignee_id: a.assignee_id ?? '',
			location: a.location ?? '',
			description: a.description ?? '',
			employee_notes: a.employee_notes ?? '',
			notes: a.notes ?? '',
			status: a.status,
		};
	}

	async function saveAppt() {
		if (!apptForm.scheduled_date) { showToast('Bitte ein Datum wählen', 'error'); return; }
		apptSaving = true;
		// `null` clears a field; times are normalised to HH:MM:SS for the backend.
		const body = {
			kind: apptForm.kind || 'besichtigung',
			scheduled_date: apptForm.scheduled_date,
			start_time: apptForm.start_time ? normalizeTimeInput(apptForm.start_time) : null,
			end_time: apptForm.end_time ? normalizeTimeInput(apptForm.end_time) : null,
			assignee_id: apptForm.assignee_id || null,
			location: apptForm.location.trim() || null,
			description: apptForm.description.trim() || null,
			employee_notes: apptForm.employee_notes.trim() || null,
			notes: apptForm.notes.trim() || null,
			status: apptForm.status,
		};
		try {
			if (editingApptId) {
				await apiPatch(`/api/v1/inquiries/${inquiryId}/appointments/${editingApptId}`, body);
				showToast('Termin aktualisiert', 'success');
			} else {
				await apiPost(`/api/v1/inquiries/${inquiryId}/appointments`, body);
				showToast('Termin angelegt', 'success');
			}
			resetApptForm();
			await onSaved();
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			apptSaving = false;
		}
	}

	async function deleteAppt(a: Appointment) {
		if (!confirm(`${apptKindLabel(a.kind)} am ${formatApptDate(a.scheduled_date)} löschen?`)) return;
		try {
			await apiDelete(`/api/v1/inquiries/${inquiryId}/appointments/${a.id}`);
			if (editingApptId === a.id) resetApptForm();
			showToast('Termin gelöscht', 'success');
			await onSaved();
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}
</script>

<!-- Termine & Besichtigungen Card -->
<div class="appointments-section">
	<div class="card" class:card--collapsed={!open}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onOpenAppointments} aria-expanded={open}>
				<span class="card-toggle-chev" class:open><ChevronRight size={16} /></span>
				<h3>Termine &amp; Besichtigungen{#if (appointments?.length ?? 0) > 0} ({appointments?.length}){/if}</h3>
			</button>
		</div>
		{#if open}
		<div class="appt-body">
			<p class="appt-hint">Zusätzliche Termine zu diesem Auftrag an eigenen Daten (z.&nbsp;B. eine Besichtigung vor dem Umzug). Unabhängig vom Umzugstermin.</p>

			{#if (appointments?.length ?? 0) > 0}
				<div class="appt-list">
					{#each appointments ?? [] as a (a.id)}
						<div class="appt-row" class:appt-editing={editingApptId === a.id}>
							<div class="appt-info">
								<div class="appt-main">
									<span class="appt-kind">{apptKindLabel(a.kind)}</span>
									<span class="appt-date">{formatApptDate(a.scheduled_date)}</span>
									{#if a.start_time}<span class="appt-time">{a.start_time.slice(0, 5)}{a.end_time ? '–' + a.end_time.slice(0, 5) : ''}</span>{/if}
									<span class="appt-status appt-status-{a.status}">{APPT_STATUS_LABELS[a.status] ?? a.status}</span>
								</div>
								{#if (a.employees?.length ?? 0) > 0 || a.assignee_name || a.location || a.description || a.notes}
									<div class="appt-sub">
										{#if (a.employees?.length ?? 0) > 0}
											<span>👥 {a.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(', ')}</span>
										{:else if a.assignee_name}
											<span>👤 {a.assignee_name}</span>
										{/if}
										{#if a.location}<span>📍 {a.location}</span>{/if}
										{#if a.description}<span class="appt-desc">{a.description}</span>{/if}
										{#if a.notes}<span class="appt-notes">{a.notes}</span>{/if}
									</div>
								{/if}
							</div>
							<div class="appt-actions">
								<button class="btn btn-sm" onclick={() => editAppt(a)}>Bearbeiten</button>
								<button class="btn btn-sm btn-danger" onclick={() => deleteAppt(a)}>Löschen</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="appt-empty">Noch keine Termine.</p>
			{/if}

			<div class="appt-form">
				<h4>{editingApptId ? 'Termin bearbeiten' : 'Neuer Termin'}</h4>
				<div class="appt-grid">
					<label>Art
						<input type="text" bind:value={apptForm.kind} placeholder="besichtigung" list="appt-kinds" />
						<datalist id="appt-kinds"><option value="besichtigung"></option><option value="nachtermin"></option></datalist>
					</label>
					<label>Datum
						<input type="date" bind:value={apptForm.scheduled_date} />
					</label>
					<label>Von
						<input type="time" bind:value={apptForm.start_time} />
					</label>
					<label>Bis
						<input type="time" bind:value={apptForm.end_time} />
					</label>
					<label>Mitarbeiter
						<select bind:value={apptForm.assignee_id}>
							<option value="">— keiner —</option>
							{#each apptEmployees as e}
								<option value={e.id}>{e.first_name} {e.last_name}</option>
							{/each}
						</select>
					</label>
					<label>Status
						<select bind:value={apptForm.status}>
							<option value="scheduled">Geplant</option>
							<option value="done">Erledigt</option>
							<option value="cancelled">Storniert</option>
						</select>
					</label>
					<label class="appt-wide">Ort
						<input type="text" bind:value={apptForm.location} placeholder="Adresse (optional, sonst Auszugsadresse)" />
					</label>
					<label class="appt-wide">Beschreibung
						<textarea rows={2} bind:value={apptForm.description} placeholder="Was ist zu tun? (z.&nbsp;B. Halteverbotszone aufstellen)"></textarea>
					</label>
					<label class="appt-wide">Notiz für Mitarbeiter
						<textarea rows={2} bind:value={apptForm.employee_notes} placeholder="Hinweis, den alle zugewiesenen Mitarbeiter sehen"></textarea>
					</label>
					<label class="appt-wide">Interne Notiz
						<textarea rows={2} bind:value={apptForm.notes}></textarea>
					</label>
				</div>
				<div class="appt-form-actions">
					<button class="btn btn-primary btn-sm" onclick={saveAppt} disabled={apptSaving}>
						{editingApptId ? 'Speichern' : 'Anlegen'}
					</button>
					{#if editingApptId}
						<button class="btn btn-sm" onclick={resetApptForm} disabled={apptSaving}>Abbrechen</button>
					{/if}
				</div>

				{#if editingApptId}
					<!-- Crew: paid Zusatztermin work (Halteverbotszone etc.). Only for a
					     saved appointment — the crew endpoints need its id. -->
					<div class="appt-crew">
						<EmployeeAssignmentPanel
							entityType="appointment"
							entityId={editingApptId}
							{inquiryId}
							preferredDate={apptForm.scheduled_date}
							onUpdated={onSaved}
						/>
					</div>
				{:else}
					<p class="appt-crew-hint">Mitarbeiter für bezahlte Zusatztermine (z.&nbsp;B. Halteverbotszone) lassen sich nach dem Anlegen zuweisen — Termin speichern, dann „Bearbeiten“.</p>
				{/if}
			</div>
		</div>
		{/if}
	</div>
</div>

<style>
	.appt-body { padding: 0.75rem 1rem 1rem; }
	.appt-hint { font-size: 0.8rem; color: var(--dt-text-muted, #64748b); margin: 0 0 0.75rem; }
	.appt-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
	.appt-row {
		display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem;
		padding: 0.5rem 0.65rem; border: 1px solid var(--dt-border, #e2e8f0);
		border-radius: 8px; border-left: 3px solid #0891b2;
	}
	.appt-row.appt-editing { background: #ecfeff; }
	.appt-info { min-width: 0; }
	.appt-main { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
	.appt-kind { font-weight: 600; }
	.appt-date { color: var(--dt-primary, #022448); font-variant-numeric: tabular-nums; }
	.appt-time { color: var(--dt-text-muted, #64748b); font-size: 0.85rem; }
	.appt-status { font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 999px; background: #e2e8f0; color: #334155; }
	.appt-status-scheduled { background: #cffafe; color: #155e75; }
	.appt-status-done { background: #dcfce7; color: #14532d; }
	.appt-status-cancelled { background: #fee2e2; color: #991b1b; }
	.appt-sub { display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.8rem; color: var(--dt-text-muted, #64748b); margin-top: 0.25rem; }
	.appt-notes { font-style: italic; }
	.appt-desc { color: var(--dt-text, #334155); }
	.appt-crew { border-top: 1px solid var(--dt-border, #e2e8f0); margin-top: 0.85rem; padding-top: 0.85rem; }
	.appt-crew-hint { font-size: 0.78rem; color: var(--dt-text-muted, #64748b); margin: 0.85rem 0 0; padding-top: 0.6rem; border-top: 1px dashed var(--dt-border, #e2e8f0); }
	.appt-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
	.appt-empty { font-size: 0.85rem; color: var(--dt-text-muted, #64748b); margin: 0 0 1rem; }
	.appt-form { border-top: 1px solid var(--dt-border, #e2e8f0); padding-top: 0.75rem; }
	.appt-form h4 { margin: 0 0 0.6rem; font-size: 0.9rem; }
	.appt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.6rem; }
	.appt-grid label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.78rem; color: var(--dt-text-muted, #64748b); }
	.appt-grid input, .appt-grid select, .appt-grid textarea {
		padding: 0.4rem 0.5rem; border: 1px solid var(--dt-border, #cbd5e1);
		border-radius: 6px; font-size: 0.85rem; font-family: inherit;
	}
	.appt-grid .appt-wide { grid-column: 1 / -1; }
	.appt-form-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }

	@media (max-width: 768px) {
		.appt-row {
			flex-direction: column;
		}
		.appt-actions {
			width: 100%;
		}
		.appt-actions .btn {
			flex: 1;
		}
	}
</style>
