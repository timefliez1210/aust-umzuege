<script lang="ts">
	import { apiPatch, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Save } from 'lucide-svelte';

	interface EmployeeProfile {
		id: string;
		salutation: string | null;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		monthly_hours_target: number;
		active: boolean;
		created_at: string;
	}

	let {
		employee,
		onSaved
	}: {
		employee: EmployeeProfile;
		onSaved: (updated: Partial<EmployeeProfile>) => void;
	} = $props();

	let saving = $state(false);

	// Editable fields
	let editSalutation = $state('');
	let editFirstName = $state('');
	let editLastName = $state('');
	let editEmail = $state('');
	let editPhone = $state('');
	let editTarget = $state('160');

	// Reseed the edit drafts only when a different employee record loads (keyed on
	// employee.id), not on every parent `data` merge — sibling cards (documents,
	// hours) also write back into the shared parent `data` object, which would
	// otherwise clobber an in-progress, unsaved profile edit on every such update.
	let seededFor = $state<string | null>(null);
	$effect(() => {
		if (seededFor === employee.id) return;
		seededFor = employee.id;
		editSalutation = employee.salutation ?? '';
		editFirstName = employee.first_name;
		editLastName = employee.last_name;
		editEmail = employee.email;
		editPhone = employee.phone ?? '';
		editTarget = String(employee.monthly_hours_target);
	});

	/**
	 * Saves updated employee profile fields.
	 *
	 * Called by: Template (save button)
	 * Purpose: Persists profile changes via PATCH.
	 */
	async function handleSave() {
		saving = true;
		try {
			const updated = await apiPatch<EmployeeProfile>(`/api/v1/admin/employees/${employee.id}`, {
				salutation: editSalutation || null,
				first_name: editFirstName,
				last_name: editLastName,
				email: editEmail,
				phone: editPhone || null,
				monthly_hours_target: parseFloat(editTarget) || 160
			});
			onSaved(updated);
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			saving = false;
		}
	}
</script>

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
		<span>Erstellt: {formatDate(employee.created_at)}</span>
		<span>Status: {employee.active ? 'Aktiv' : 'Inaktiv'}</span>
	</div>
</div>

<style>
	.card {
		padding: 1.25rem;
		box-shadow: none;
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
</style>
