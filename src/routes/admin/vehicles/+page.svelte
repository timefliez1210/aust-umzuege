<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDelete, formatDate } from '$lib/utils/api.svelte';
	import { Truck, Wrench, Plus, Trash2, Bell, Check, RotateCcw } from 'lucide-svelte';

	interface Reminder {
		id: string;
		vehicle_id: string;
		label: string;
		due_date: string;
		active: boolean;
		completed_at: string | null;
		last_pinged_on: string | null;
	}

	interface Vehicle {
		id: string;
		label: string;
		kennzeichen: string;
		created_at: string;
		updated_at: string;
		reminders: Reminder[];
	}

	let vehicles = $state<Vehicle[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let busy = $state(false);

	// New-vehicle form
	let newVehicleLabel = $state('');
	let newVehicleKennzeichen = $state('');

	// Per-vehicle new-reminder drafts, keyed by vehicle id
	let reminderDrafts = $state<Record<string, { label: string; due_date: string }>>({});

	async function load() {
		loading = true;
		error = null;
		try {
			vehicles = await apiGet<Vehicle[]>('/api/v1/admin/vehicles');
			// Ensure every vehicle has a reminder draft so the template can bind
			// directly to reminderDrafts[id].* (Svelte can't bind to a function call).
			const drafts = { ...reminderDrafts };
			for (const v of vehicles) {
				if (!drafts[v.id]) drafts[v.id] = { label: '', due_date: '' };
			}
			reminderDrafts = drafts;
		} catch {
			error = 'Laden fehlgeschlagen.';
		} finally {
			loading = false;
		}
	}

	async function addVehicle() {
		const label = newVehicleLabel.trim();
		const kennzeichen = newVehicleKennzeichen.trim();
		if (!label || !kennzeichen || busy) return;
		busy = true;
		try {
			await apiPost('/api/v1/admin/vehicles', { label, kennzeichen });
			newVehicleLabel = '';
			newVehicleKennzeichen = '';
			await load();
		} catch {
			error = 'Fahrzeug konnte nicht angelegt werden.';
		} finally {
			busy = false;
		}
	}

	async function deleteVehicle(v: Vehicle) {
		if (!confirm(`Fahrzeug „${v.label}" und alle Erinnerungen löschen?`)) return;
		busy = true;
		try {
			await apiDelete(`/api/v1/admin/vehicles/${v.id}`);
			await load();
		} catch {
			error = 'Fahrzeug konnte nicht gelöscht werden.';
		} finally {
			busy = false;
		}
	}

	async function addReminder(v: Vehicle) {
		const draft = reminderDrafts[v.id];
		const label = draft.label.trim();
		if (!label || !draft.due_date || busy) return;
		busy = true;
		try {
			await apiPost(`/api/v1/admin/vehicles/${v.id}/reminders`, {
				label,
				due_date: draft.due_date
			});
			reminderDrafts[v.id] = { label: '', due_date: '' };
			await load();
		} catch {
			error = 'Erinnerung konnte nicht angelegt werden.';
		} finally {
			busy = false;
		}
	}

	async function setReminderActive(v: Vehicle, r: Reminder, active: boolean) {
		busy = true;
		try {
			await apiPatch(`/api/v1/admin/vehicles/${v.id}/reminders/${r.id}`, { active });
			await load();
		} catch {
			error = 'Aktion fehlgeschlagen.';
		} finally {
			busy = false;
		}
	}

	async function deleteReminder(v: Vehicle, r: Reminder) {
		if (!confirm(`Erinnerung „${r.label}" löschen?`)) return;
		busy = true;
		try {
			await apiDelete(`/api/v1/admin/vehicles/${v.id}/reminders/${r.id}`);
			await load();
		} catch {
			error = 'Erinnerung konnte nicht gelöscht werden.';
		} finally {
			busy = false;
		}
	}

	/** Whole days from today until the due date (negative = overdue). */
	function daysUntil(due: string): number {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const d = new Date(due + 'T00:00:00');
		return Math.round((d.getTime() - today.getTime()) / 86_400_000);
	}

	function dueLabel(due: string): string {
		const n = daysUntil(due);
		if (n < 0) return `überfällig seit ${-n} ${-n === 1 ? 'Tag' : 'Tagen'}`;
		if (n === 0) return 'heute fällig';
		if (n === 1) return 'morgen fällig';
		return `in ${n} Tagen`;
	}

	/** Visual urgency tier driving the badge colour. */
	function urgency(r: Reminder): 'done' | 'overdue' | 'soon' | 'upcoming' {
		if (!r.active) return 'done';
		const n = daysUntil(r.due_date);
		if (n < 0) return 'overdue';
		if (n <= 7) return 'soon';
		return 'upcoming';
	}

	$effect(() => {
		load();
	});
</script>

<div class="page">
	<div class="page-header">
		<div class="page-title">
			<Truck size={22} />
			<h1>Fuhrpark</h1>
		</div>
		<button class="btn-refresh" onclick={load} disabled={loading}>
			{loading ? 'Lädt …' : 'Aktualisieren'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<!-- Add vehicle -->
	<form class="add-vehicle" onsubmit={(e) => { e.preventDefault(); addVehicle(); }}>
		<input
			type="text"
			class="vehicle-label-input"
			placeholder="Bezeichnung (z. B. Mercedes Sprinter)"
			bind:value={newVehicleLabel}
			maxlength="120"
		/>
		<input
			type="text"
			class="vehicle-kennzeichen-input"
			placeholder="Kennzeichen (z. B. HI-AB 1234)"
			bind:value={newVehicleKennzeichen}
			maxlength="20"
		/>
		<button
			type="submit"
			class="btn-primary"
			disabled={busy || !newVehicleLabel.trim() || !newVehicleKennzeichen.trim()}
		>
			<Plus size={16} /> Fahrzeug
		</button>
	</form>

	{#if loading && vehicles.length === 0}
		<p class="empty">Lädt …</p>
	{:else if vehicles.length === 0}
		<p class="empty">Noch keine Fahrzeuge angelegt.</p>
	{:else}
		<div class="fleet">
			{#each vehicles as v (v.id)}
				<section class="vehicle-card">
					<header class="vehicle-head">
						<div class="vehicle-name">
							<Truck size={18} />
							<h2>{v.label}</h2>
							{#if v.kennzeichen}
								<span class="kennzeichen">{v.kennzeichen}</span>
							{/if}
						</div>
						<button class="icon-btn danger" title="Fahrzeug löschen" onclick={() => deleteVehicle(v)}>
							<Trash2 size={16} />
						</button>
					</header>

					{#if v.reminders.length === 0}
						<p class="empty small">Keine Erinnerungen.</p>
					{:else}
						<ul class="reminders">
							{#each v.reminders as r (r.id)}
								{@const tier = urgency(r)}
								<li class="reminder" class:done={!r.active}>
									<span class="reminder-icon"><Wrench size={14} /></span>
									<span class="reminder-label">{r.label}</span>
									<span class="reminder-date">{formatDate(r.due_date)}</span>
									<span class="badge badge--{tier}">
										{#if !r.active}erledigt{:else}{dueLabel(r.due_date)}{/if}
									</span>
									<span class="reminder-actions">
										{#if r.active}
											<button class="icon-btn" title="Als erledigt markieren" onclick={() => setReminderActive(v, r, false)}>
												<Check size={15} />
											</button>
										{:else}
											<button class="icon-btn" title="Wieder aktivieren" onclick={() => setReminderActive(v, r, true)}>
												<RotateCcw size={15} />
											</button>
										{/if}
										<button class="icon-btn danger" title="Löschen" onclick={() => deleteReminder(v, r)}>
											<Trash2 size={15} />
										</button>
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					<!-- Add reminder -->
					<form class="add-reminder" onsubmit={(e) => { e.preventDefault(); addReminder(v); }}>
						<Bell size={14} class="add-reminder-icon" />
						<input
							type="text"
							placeholder="Erinnerung (z. B. TÜV, Ölwechsel)"
							bind:value={reminderDrafts[v.id].label}
							maxlength="120"
						/>
						<input type="date" bind:value={reminderDrafts[v.id].due_date} />
						<button
							type="submit"
							class="btn-secondary"
							disabled={busy || !reminderDrafts[v.id].label.trim() || !reminderDrafts[v.id].due_date}
						>
							<Plus size={14} />
						</button>
					</form>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		padding: 1.5rem;
		max-width: 920px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.page-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.page-title h1 {
		font-size: 1.4rem;
		margin: 0;
	}

	.btn-refresh {
		background: var(--dt-surface-variant, #e7edf3);
		border: 1px solid var(--dt-outline, #c2cbd4);
		border-radius: 8px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.error {
		background: #fdecea;
		color: #b3261e;
		border-radius: 8px;
		padding: 0.6rem 0.9rem;
		margin-bottom: 1rem;
	}

	.empty {
		color: var(--dt-on-surface-variant, #6b7680);
		font-style: italic;
	}
	.empty.small {
		font-size: 0.85rem;
		margin: 0.25rem 0 0.75rem;
	}

	.add-vehicle {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}
	.vehicle-label-input {
		flex: 2 1 220px;
	}
	.vehicle-kennzeichen-input {
		flex: 1 1 150px;
	}

	input[type='text'],
	input[type='date'] {
		padding: 0.5rem 0.7rem;
		border: 1px solid var(--dt-outline, #c2cbd4);
		border-radius: 8px;
		font-size: 0.9rem;
		background: var(--dt-surface, #fff);
		color: inherit;
	}

	.btn-primary,
	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.5rem 0.9rem;
		white-space: nowrap;
	}
	.btn-primary {
		background: var(--dt-primary, #1e3a5f);
		color: #fff;
	}
	.btn-secondary {
		background: var(--dt-surface-variant, #e7edf3);
		color: var(--dt-on-surface, #191c1e);
		padding: 0.5rem 0.7rem;
	}
	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.fleet {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.vehicle-card {
		background: var(--dt-surface, #fff);
		border: 1px solid var(--dt-outline-variant, #dde3ea);
		border-radius: 12px;
		padding: 1rem 1.1rem;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
	}

	.vehicle-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	.vehicle-name {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.vehicle-name h2 {
		font-size: 1.05rem;
		margin: 0;
	}
	.kennzeichen {
		font-family: 'Courier New', ui-monospace, monospace;
		font-weight: 700;
		font-size: 0.8rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.15rem 0.5rem;
		border: 1.5px solid var(--dt-outline, #c2cbd4);
		border-radius: 5px;
		background: #fff;
		color: #1a1a1a;
		white-space: nowrap;
	}

	.reminders {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.reminder {
		display: grid;
		grid-template-columns: auto 1fr auto auto auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.45rem 0.5rem;
		border-radius: 8px;
		background: var(--dt-surface-variant, #f3f6f9);
	}
	.reminder.done {
		opacity: 0.55;
	}
	.reminder.done .reminder-label {
		text-decoration: line-through;
	}

	.reminder-icon {
		display: flex;
		color: var(--dt-on-surface-variant, #6b7680);
	}
	.reminder-label {
		font-weight: 500;
	}
	.reminder-date {
		font-size: 0.82rem;
		color: var(--dt-on-surface-variant, #6b7680);
	}

	.badge {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 0.18rem 0.5rem;
		border-radius: 999px;
		white-space: nowrap;
	}
	.badge--overdue {
		background: #fdecea;
		color: #b3261e;
	}
	.badge--soon {
		background: #fff4e5;
		color: #b25e00;
	}
	.badge--upcoming {
		background: #e7f0e9;
		color: #2e6b3e;
	}
	.badge--done {
		background: #eceff1;
		color: #6b7680;
	}

	.reminder-actions {
		display: flex;
		gap: 0.2rem;
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 6px;
		padding: 0.3rem;
		cursor: pointer;
		color: var(--dt-on-surface-variant, #6b7680);
	}
	.icon-btn:hover {
		background: rgba(0, 0, 0, 0.06);
	}
	.icon-btn.danger:hover {
		background: #fdecea;
		color: #b3261e;
	}

	.add-reminder {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-top: 1px dashed var(--dt-outline-variant, #dde3ea);
		padding-top: 0.75rem;
	}
	.add-reminder input[type='text'] {
		flex: 1;
	}
	:global(.add-reminder-icon) {
		color: var(--dt-on-surface-variant, #6b7680);
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.reminder {
			grid-template-columns: auto 1fr auto;
			grid-template-areas:
				'icon label actions'
				'icon date badge';
		}
		.reminder-icon {
			grid-area: icon;
		}
		.reminder-label {
			grid-area: label;
		}
		.reminder-date {
			grid-area: date;
		}
		.badge {
			grid-area: badge;
			justify-self: start;
		}
		.reminder-actions {
			grid-area: actions;
		}
		.add-reminder {
			flex-wrap: wrap;
		}
	}
</style>
