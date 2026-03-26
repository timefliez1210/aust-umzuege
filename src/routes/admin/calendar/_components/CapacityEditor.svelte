<script lang="ts">
	import { apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';

	/**
	 * Props for the CapacityEditor component.
	 *
	 * Called by: calendar/+page.svelte (inside the day panel, panel-section "Kapazität überschreiben")
	 * Purpose: Renders a number input and save button that lets the admin override
	 *          the daily move capacity for a specific date.
	 *
	 * @prop date - ISO date string (YYYY-MM-DD) of the day to edit
	 * @prop currentCapacity - The currently configured capacity value (seeds the input)
	 * @prop onSaved - Callback called with the new capacity value after a successful PUT
	 */
	interface Props {
		date: string;
		currentCapacity: number;
		onSaved: (newCapacity: number) => void;
	}

	let { date, currentCapacity, onSaved }: Props = $props();

	let capacityInput = $state(String(currentCapacity));
	let saving = $state(false);

	// Re-seed the input whenever the parent changes the current capacity
	// (e.g. when the user opens a different day panel).
	$effect(() => {
		capacityInput = String(currentCapacity);
	});

	/**
	 * Persists the capacity override for the selected day to the API.
	 *
	 * Called by: Template (onclick on "Speichern" button)
	 * Purpose: PUTs the new integer capacity to PUT /api/v1/calendar/capacity/{date},
	 *          then calls onSaved so the parent panel can reload the schedule.
	 *
	 * @returns void (side-effect: shows toast, calls onSaved(newCapacity) on success)
	 */
	async function saveCapacity() {
		saving = true;
		try {
			const newCapacity = parseInt(capacityInput) || 1;
			await apiPut(`/api/v1/calendar/capacity/${date}`, { capacity: newCapacity });
			showToast('Kapazität gespeichert', 'success');
			onSaved(newCapacity);
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			saving = false;
		}
	}
</script>

<div class="panel-section">
	<div class="section-title">Kapazität überschreiben</div>
	<div class="capacity-row">
		<input
			type="number"
			min="0"
			max="10"
			class="neu-input capacity-input"
			bind:value={capacityInput}
		/>
		<button class="btn btn-primary btn-sm" onclick={saveCapacity} disabled={saving}>
			{saving ? '...' : 'Speichern'}
		</button>
	</div>
</div>
