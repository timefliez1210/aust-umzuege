<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
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

<Panel title="Profil">
	{#snippet actions()}
		<Button size="sm" variant="solid" onclick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Speichern …' : 'Speichern'}</Button>
	{/snippet}
	<div class="grid grid-cols-2 gap-3">
		<Field label="Anrede" for="edit-sal">
			<Select id="edit-sal" bind:value={editSalutation}>
				<option value="">—</option>
				<option value="Herr">Herr</option>
				<option value="Frau">Frau</option>
				<option value="D">Divers</option>
			</Select>
		</Field>
		<Field label="Monatsstunden" for="edit-target"><Input id="edit-target" class="num" type="number" step="0.5" bind:value={editTarget} /></Field>
		<Field label="Vorname" for="edit-fn"><Input id="edit-fn" bind:value={editFirstName} /></Field>
		<Field label="Nachname" for="edit-ln"><Input id="edit-ln" bind:value={editLastName} /></Field>
		<Field label="E-Mail" for="edit-email"><Input id="edit-email" type="email" bind:value={editEmail} /></Field>
		<Field label="Telefon" for="edit-phone"><Input id="edit-phone" bind:value={editPhone} /></Field>
	</div>
	<div class="mt-4 flex items-center gap-3 border-t border-line pt-3 text-xs text-faint">
		<span class="num">Erstellt {formatDate(employee.created_at)}</span>
		<Badge tone={employee.active ? 'ok' : 'neutral'}>{employee.active ? 'Aktiv' : 'Inaktiv'}</Badge>
	</div>
</Panel>
