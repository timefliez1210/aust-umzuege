<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Users, User, MapPin } from 'lucide-svelte';
	import { apiGet, apiPatch, apiPost, apiDelete } from "$lib/utils/api.svelte";
	import { normalizeTimeInput } from "$lib/utils/format";
	import { showToast } from "$lib/components/admin/Toast.svelte";
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

<Panel
	title="Termine & Besichtigungen{(appointments?.length ?? 0) > 0 ? ` (${appointments?.length})` : ''}"
	{open}
	onToggle={onOpenAppointments}
>
	<div class="flex flex-col gap-4">
		<p class="text-xs text-muted">
			Zusätzliche Termine zu diesem Auftrag an eigenen Daten (z. B. eine Besichtigung vor dem Umzug). Unabhängig vom
			Umzugstermin.
		</p>

		{#if (appointments?.length ?? 0) > 0}
			<div class="flex flex-col divide-y divide-line rounded-sm border border-line">
				{#each appointments ?? [] as a (a.id)}
					<div class="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5 {editingApptId === a.id ? 'bg-sunk' : ''}">
						<div class="flex min-w-0 flex-1 flex-col gap-1">
							<div class="flex flex-wrap items-center gap-2 text-sm">
								<span class="font-medium">{apptKindLabel(a.kind)}</span>
								<span class="num text-muted">{formatApptDate(a.scheduled_date)}</span>
								{#if a.start_time}
									<span class="num text-muted"
										>{a.start_time.slice(0, 5)}{a.end_time ? '–' + a.end_time.slice(0, 5) : ''}</span
									>
								{/if}
								<Badge tone={a.status === 'done' ? 'ok' : a.status === 'cancelled' ? 'danger' : 'info'}
									>{APPT_STATUS_LABELS[a.status] ?? a.status}</Badge
								>
							</div>
							{#if (a.employees?.length ?? 0) > 0 || a.assignee_name || a.location || a.description || a.notes}
								<div class="flex flex-col gap-0.5 text-xs text-muted">
									{#if (a.employees?.length ?? 0) > 0}
										<span class="flex items-center gap-1.5"
											><Users size={12} />{a.employees?.map((e) => `${e.first_name} ${e.last_name}`).join(', ')}</span
										>
									{:else if a.assignee_name}
										<span class="flex items-center gap-1.5"><User size={12} />{a.assignee_name}</span>
									{/if}
									{#if a.location}<span class="flex items-center gap-1.5"><MapPin size={12} />{a.location}</span>{/if}
									{#if a.description}<span class="text-fg">{a.description}</span>{/if}
									{#if a.notes}<span class="italic">{a.notes}</span>{/if}
								</div>
							{/if}
						</div>
						<div class="flex gap-1.5">
							<Button size="xs" onclick={() => editAppt(a)}>Bearbeiten</Button>
							<Button size="xs" variant="danger" onclick={() => deleteAppt(a)}>Löschen</Button>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-[13px] text-faint">Noch keine Termine.</p>
		{/if}

		<div class="flex flex-col gap-3 rounded-sm border border-line bg-sunk/50 p-3">
			<h4 class="label-xs text-faint">{editingApptId ? 'Termin bearbeiten' : 'Neuer Termin'}</h4>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				<Field label="Art" for="appt-kind">
					<Input id="appt-kind" bind:value={apptForm.kind} placeholder="besichtigung" list="appt-kinds" />
					<datalist id="appt-kinds"><option value="besichtigung"></option><option value="nachtermin"></option></datalist>
				</Field>
				<Field label="Datum" for="appt-date"><Input id="appt-date" type="date" bind:value={apptForm.scheduled_date} /></Field>
				<Field label="Status" for="appt-status">
					<Select id="appt-status" bind:value={apptForm.status}>
						<option value="scheduled">Geplant</option>
						<option value="done">Erledigt</option>
						<option value="cancelled">Storniert</option>
					</Select>
				</Field>
				<Field label="Von" for="appt-from"><Input id="appt-from" type="time" bind:value={apptForm.start_time} /></Field>
				<Field label="Bis" for="appt-to"><Input id="appt-to" type="time" bind:value={apptForm.end_time} /></Field>
				<Field label="Mitarbeiter" for="appt-assignee">
					<Select id="appt-assignee" bind:value={apptForm.assignee_id}>
						<option value="">— keiner —</option>
						{#each apptEmployees as e (e.id)}
							<option value={e.id}>{e.first_name} {e.last_name}</option>
						{/each}
					</Select>
				</Field>
				<Field label="Ort" for="appt-loc" class="col-span-2 sm:col-span-3">
					<Input id="appt-loc" bind:value={apptForm.location} placeholder="Adresse (optional, sonst Auszugsadresse)" />
				</Field>
				<Field label="Beschreibung" for="appt-desc" class="col-span-2 sm:col-span-3">
					<Textarea id="appt-desc" rows={2} bind:value={apptForm.description} placeholder="Was ist zu tun? (z. B. Halteverbotszone aufstellen)" />
				</Field>
				<Field label="Notiz für Mitarbeiter" for="appt-empnote" class="col-span-2 sm:col-span-3">
					<Textarea
						id="appt-empnote"
						rows={2}
						bind:value={apptForm.employee_notes}
						placeholder="Hinweis, den alle zugewiesenen Mitarbeiter sehen"
					/>
				</Field>
				<Field label="Interne Notiz" for="appt-note" class="col-span-2 sm:col-span-3">
					<Textarea id="appt-note" rows={2} bind:value={apptForm.notes} />
				</Field>
			</div>
			<div class="flex gap-2">
				<Button size="sm" variant="solid" onclick={saveAppt} disabled={apptSaving}>{editingApptId ? 'Speichern' : 'Anlegen'}</Button>
				{#if editingApptId}<Button size="sm" onclick={resetApptForm} disabled={apptSaving}>Abbrechen</Button>{/if}
			</div>

			{#if editingApptId}
				<!-- Crew for paid Zusatztermin work (Halteverbotszone etc.); needs a saved appointment id. -->
				<div class="border-t border-line pt-3">
					<EmployeeAssignmentPanel
						entityType="appointment"
						entityId={editingApptId}
						{inquiryId}
						preferredDate={apptForm.scheduled_date}
						onUpdated={onSaved}
					/>
				</div>
			{:else}
				<p class="text-xs text-muted">
					Mitarbeiter für bezahlte Zusatztermine (z. B. Halteverbotszone) lassen sich nach dem Anlegen zuweisen — Termin
					speichern, dann „Bearbeiten“.
				</p>
			{/if}
		</div>
	</div>
</Panel>
