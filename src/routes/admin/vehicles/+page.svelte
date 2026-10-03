<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDelete, formatDate } from '$lib/utils/api.svelte';
	import { Truck, Wrench, Plus, Trash2, Bell, Check, RotateCcw, Pencil, X, RefreshCw } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import type { Tone } from '$lib/components/ui/tone';

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

	// Inline vehicle-edit draft, keyed by vehicle id being edited (only one at a time)
	let editingId = $state<string | null>(null);
	let editLabel = $state('');
	let editKennzeichen = $state('');

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

	function startEdit(v: Vehicle) {
		editingId = v.id;
		editLabel = v.label;
		editKennzeichen = v.kennzeichen;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(v: Vehicle) {
		const label = editLabel.trim();
		const kennzeichen = editKennzeichen.trim();
		if (!label || !kennzeichen || busy) return;
		busy = true;
		try {
			await apiPatch(`/api/v1/admin/vehicles/${v.id}`, { label, kennzeichen });
			editingId = null;
			await load();
		} catch {
			error = 'Fahrzeug konnte nicht gespeichert werden.';
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

	/** The earliest still-active reminder for a vehicle, or null if none. */
	function nextReminder(v: Vehicle): Reminder | null {
		const active = v.reminders.filter((r) => r.active);
		if (active.length === 0) return null;
		return active.reduce((soonest, r) => (r.due_date < soonest.due_date ? r : soonest));
	}

	$effect(() => {
		load();
	});

	const URGENCY_TONE: Record<ReturnType<typeof urgency>, Tone> = {
		done: 'neutral',
		overdue: 'danger',
		soon: 'warn',
		upcoming: 'info'
	};
</script>

<svelte:head><title>Fuhrpark</title></svelte:head>

<PageHeader title="Fuhrpark" count="{vehicles.length} Fahrzeuge">
	{#snippet actions()}
		<Button variant="ghost" size="icon" onclick={load} disabled={loading} aria-label="Aktualisieren">
			<RefreshCw size={16} class={loading ? 'animate-spin' : ''} />
		</Button>
	{/snippet}
</PageHeader>

{#if error}<Notice tone="danger" class="mb-3">{error}</Notice>{/if}

<form
	class="mb-5 grid gap-2 rounded-md border border-line bg-panel p-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]"
	onsubmit={(e) => {
		e.preventDefault();
		addVehicle();
	}}
>
	<Input placeholder="Bezeichnung (z. B. Mercedes Sprinter)" bind:value={newVehicleLabel} maxlength={120} aria-label="Bezeichnung" />
	<Input placeholder="Kennzeichen (z. B. HI-AB 1234)" bind:value={newVehicleKennzeichen} maxlength={20} aria-label="Kennzeichen" class="num uppercase" />
	<Button type="submit" variant="accent" disabled={busy || !newVehicleLabel.trim() || !newVehicleKennzeichen.trim()}>
		<Plus size={16} /> Fahrzeug
	</Button>
</form>

{#if loading && vehicles.length === 0}
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
		{#each Array(3) as _, i (i)}<div class="h-48 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if vehicles.length === 0}
	<EmptyState title="Noch keine Fahrzeuge angelegt" hint="Fahrzeuge mit TÜV-, Öl- und Versicherungsterminen — Josie erinnert rechtzeitig." />
{:else}
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
		{#each vehicles as v (v.id)}
			<section class="flex flex-col rounded-md border border-line bg-panel">
				<header class="flex items-center gap-2 border-b border-line px-4 py-3">
					{#if editingId === v.id}
						<form
							class="grid w-full grid-cols-[minmax(0,1fr)_110px_auto_auto] items-center gap-1.5"
							onsubmit={(e) => {
								e.preventDefault();
								saveEdit(v);
							}}
						>
							<Input bind:value={editLabel} maxlength={120} placeholder="Bezeichnung" aria-label="Bezeichnung" />
							<Input bind:value={editKennzeichen} maxlength={20} placeholder="Kennzeichen" aria-label="Kennzeichen" class="num uppercase" />
							<Button type="submit" variant="ghost" size="icon-sm" aria-label="Speichern" disabled={busy || !editLabel.trim() || !editKennzeichen.trim()}
								><Check size={16} /></Button
							>
							<Button variant="ghost" size="icon-sm" aria-label="Abbrechen" onclick={cancelEdit}><X size={16} /></Button>
						</form>
					{:else}
						{@const upcoming = nextReminder(v)}
						<Truck size={18} class="shrink-0 text-muted" />
						<span class="flex min-w-0 flex-1 flex-col">
							<h2 class="truncate text-[15px] font-semibold">{v.label}</h2>
							{#if v.kennzeichen}<span class="num text-xs tracking-wide text-faint uppercase">{v.kennzeichen}</span>{/if}
						</span>
						{#if upcoming}
							<Badge tone={URGENCY_TONE[urgency(upcoming)]} title={upcoming.label}>{dueLabel(upcoming.due_date)}</Badge>
						{/if}
						<Button variant="ghost" size="icon-sm" aria-label="Fahrzeug bearbeiten" title="Fahrzeug bearbeiten" onclick={() => startEdit(v)}
							><Pencil size={15} /></Button
						>
						<Button variant="ghost" size="icon-sm" class="hover:text-danger" aria-label="Fahrzeug löschen" title="Fahrzeug löschen" onclick={() => deleteVehicle(v)}
							><Trash2 size={15} /></Button
						>
					{/if}
				</header>

				{#if v.reminders.length === 0}
					<p class="px-4 py-3 text-[13px] text-faint">Keine Erinnerungen.</p>
				{:else}
					<ul class="divide-y divide-line">
						{#each v.reminders as r (r.id)}
							{@const tier = urgency(r)}
							<li class="flex items-center gap-2.5 px-4 py-2 {r.active ? '' : 'text-faint'}">
								<Wrench size={14} class="shrink-0 text-faint" />
								<span class="min-w-0 flex-1 truncate text-sm {r.active ? '' : 'line-through'}">{r.label}</span>
								<span class="num text-xs text-muted">{formatDate(r.due_date)}</span>
								<Badge tone={URGENCY_TONE[tier]}>{r.active ? dueLabel(r.due_date) : 'erledigt'}</Badge>
								{#if r.active}
									<Button variant="ghost" size="icon-sm" aria-label="Als erledigt markieren" title="Als erledigt markieren" onclick={() => setReminderActive(v, r, false)}
										><Check size={15} /></Button
									>
								{:else}
									<Button variant="ghost" size="icon-sm" aria-label="Wieder aktivieren" title="Wieder aktivieren" onclick={() => setReminderActive(v, r, true)}
										><RotateCcw size={15} /></Button
									>
								{/if}
								<Button variant="ghost" size="icon-sm" class="hover:text-danger" aria-label="Löschen" title="Löschen" onclick={() => deleteReminder(v, r)}
									><Trash2 size={15} /></Button
								>
							</li>
						{/each}
					</ul>
				{/if}

				<form
					class="mt-auto grid grid-cols-[minmax(0,1fr)_140px_auto] items-center gap-1.5 border-t border-line p-3"
					onsubmit={(e) => {
						e.preventDefault();
						addReminder(v);
					}}
				>
					<label class="flex h-9 items-center gap-2 rounded-sm border border-line-strong bg-panel px-2.5 focus-within:border-fg">
						<Bell size={14} class="shrink-0 text-faint" />
						<input
							type="text"
							placeholder="TÜV, Ölwechsel …"
							aria-label="Erinnerung"
							class="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
							bind:value={reminderDrafts[v.id].label}
							maxlength="120"
						/>
					</label>
					<Input type="date" aria-label="Fällig am" bind:value={reminderDrafts[v.id].due_date} />
					<Button type="submit" size="icon" aria-label="Erinnerung hinzufügen" disabled={busy || !reminderDrafts[v.id].label.trim() || !reminderDrafts[v.id].due_date}>
						<Plus size={15} />
					</Button>
				</form>
			</section>
		{/each}
	</div>
{/if}
