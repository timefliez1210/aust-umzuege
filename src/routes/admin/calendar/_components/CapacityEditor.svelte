<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
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

	// svelte-ignore state_referenced_locally -- intentional initial seed; the $effect below re-seeds on prop change
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

<div class="flex flex-col gap-2">
	<span class="label-xs text-faint">Kapazität überschreiben</span>
	<div class="flex items-center gap-2">
		<input
			type="number"
			min="0"
			max="10"
			aria-label="Kapazität"
			class="num h-8 w-20 rounded-sm border border-line-strong bg-panel px-2 text-right text-sm outline-none focus:border-fg"
			bind:value={capacityInput}
		/>
		<Button size="sm" variant="solid" onclick={saveCapacity} disabled={saving}>{saving ? '…' : 'Speichern'}</Button>
	</div>
</div>
