<script lang="ts">
	import { Save, ChevronRight } from "lucide-svelte";
	import RouteMap from "$lib/components/admin/RouteMap.svelte";

	let {
		editVolume = $bindable(),
		editDistance = $bindable(),
		editDate = $bindable(),
		editStartTime = $bindable(),
		editEndTime = $bindable(),
		editNotes = $bindable(),
		isLocked,
		saving,
		routeCoordinates,
		customerMessage,
		detailsOpen = $bindable(),
		routeOpen = $bindable(),
		messageOpen = $bindable(),
		onToggleDetails,
		onToggleRoute,
		onToggleMessage,
		onSave,
	}: {
		editVolume: number | null;
		editDistance: number;
		editDate: string;
		editStartTime: string;
		editEndTime: string;
		editNotes: string;
		isLocked: boolean;
		saving: boolean;
		routeCoordinates: [number, number][] | null;
		customerMessage: string | null;
		detailsOpen: boolean;
		routeOpen: boolean;
		messageOpen: boolean;
		onToggleDetails: () => void;
		onToggleRoute: () => void;
		onToggleMessage: () => void;
		onSave: () => void | Promise<void>;
	} = $props();
</script>

<!-- Editable Fields -->
<div class="card" class:card--collapsed={!detailsOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onToggleDetails} aria-expanded={detailsOpen}>
			<span class="card-toggle-chev" class:open={detailsOpen}><ChevronRight size={16} /></span>
			<h3>Details</h3>
		</button>
		{#if detailsOpen}
			<button
				class="btn btn-sm"
				onclick={onSave}
				disabled={saving}
			>
				<Save size={14} />
				{saving ? "Speichern..." : "Speichern"}
			</button>
		{/if}
	</div>
	{#if detailsOpen}
	<div class="form-grid">
		<div class="field">
			<label for="volume">Volumen (m3){isLocked ? ' 🔒' : ''}</label>
			<input
				id="volume"
				type="number"
				step="0.1"
				bind:value={editVolume}
				disabled={isLocked}
			/>
		</div>
		<div class="field">
			<label for="distance">Entfernung (km){isLocked ? ' 🔒' : ''}</label>
			<input
				id="distance"
				type="number"
				step="0.1"
				bind:value={editDistance}
				disabled={isLocked}
			/>
		</div>
		<div class="field">
			<label for="preferred-date">Datum</label>
			<input
				id="preferred-date"
				type="date"
				bind:value={editDate}
			/>
		</div>
		<div class="field">
			<label for="start-time">Startzeit</label>
			<input id="start-time" type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" bind:value={editStartTime} />
		</div>
		<div class="field">
			<label for="end-time">Endzeit</label>
			<input id="end-time" type="text" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength="5" bind:value={editEndTime} />
		</div>
		<div class="field full-width">
			<label for="notes">Notizen / Services</label>
			<textarea id="notes" rows={3} bind:value={editNotes}
			></textarea>
		</div>
	</div>
	{/if}
</div>

<!-- Route Map -->
{#if routeCoordinates}
	<div class="card" class:card--collapsed={!routeOpen}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onToggleRoute} aria-expanded={routeOpen}>
				<span class="card-toggle-chev" class:open={routeOpen}><ChevronRight size={16} /></span>
				<h3>Route</h3>
			</button>
		</div>
		{#if routeOpen}
			<RouteMap
				coordinates={routeCoordinates}
				distanceKm={editDistance}
			/>
		{/if}
	</div>
{/if}

<!-- Customer Message -->
{#if customerMessage}
	<div class="card" class:card--collapsed={!messageOpen}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onToggleMessage} aria-expanded={messageOpen}>
				<span class="card-toggle-chev" class:open={messageOpen}><ChevronRight size={16} /></span>
				<h3>Kundennachricht</h3>
			</button>
		</div>
		{#if messageOpen}
			<p class="customer-message">{customerMessage}</p>
		{/if}
	</div>
{/if}

<style>
	.customer-message {
		color: var(--dt-on-surface);
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}
</style>
