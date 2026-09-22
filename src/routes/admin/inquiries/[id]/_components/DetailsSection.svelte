<script lang="ts">
	import { Save, ChevronRight } from "lucide-svelte";
	import RouteMap from "$lib/components/admin/RouteMap.svelte";
	import { shortAddress, type InquiryRoute } from "$lib/types/route";

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
		routePlan,
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
		routePlan: InquiryRoute | null;
		customerMessage: string | null;
		detailsOpen: boolean;
		routeOpen: boolean;
		messageOpen: boolean;
		onToggleDetails: () => void;
		onToggleRoute: () => void;
		onToggleMessage: () => void;
		onSave: () => void | Promise<void>;
	} = $props();

	/** Format kilometres German-style with one decimal, e.g. `4,1 km`. */
	function km(value: number): string {
		return `${value.toFixed(1).replace(".", ",")} km`;
	}

	/** Format a duration in minutes as `1 h 05 min`, or `45 min` under an hour. */
	function duration(minutes: number): string {
		if (minutes < 60) return `${minutes} min`;
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${h} h ${String(m).padStart(2, "0")} min`;
	}
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

<!-- Route Map + per-leg kilometre breakdown -->
{#if routeCoordinates || routePlan}
	<div class="card" class:card--collapsed={!routeOpen}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onToggleRoute} aria-expanded={routeOpen}>
				<span class="card-toggle-chev" class:open={routeOpen}><ChevronRight size={16} /></span>
				<h3>Route</h3>
			</button>
			{#if routePlan && !routeOpen}
				<span class="route-total-chip">{km(routePlan.total_distance_km)}</span>
			{/if}
		</div>
		{#if routeOpen}
			{#if routeCoordinates}
				<RouteMap
					coordinates={routeCoordinates}
					legs={routePlan?.legs ?? null}
					distanceKm={routePlan?.total_distance_km ?? editDistance}
				/>
			{/if}
			{#if routePlan}
				<ol class="route-legs">
					{#each routePlan.legs as leg, i (i)}
						<li class="route-leg">
							<span class="route-leg-index">{i + 1}</span>
							<span class="route-leg-path">
								<span class="route-leg-label">{leg.from_label}</span>
								<span class="route-leg-addr">{shortAddress(leg.from_address)}</span>
								<span class="route-leg-arrow" aria-hidden="true">→</span>
								<span class="route-leg-label">{leg.to_label}</span>
								<span class="route-leg-addr">{shortAddress(leg.to_address)}</span>
							</span>
							<span class="route-leg-km">{km(leg.distance_km)}</span>
						</li>
					{/each}
					<li class="route-leg route-leg--total">
						<span class="route-leg-index" aria-hidden="true"></span>
						<span class="route-leg-path">
							Gesamtstrecke
							<span class="route-leg-duration">ca. {duration(routePlan.total_duration_minutes)} Fahrzeit</span>
						</span>
						<span class="route-leg-km">{km(routePlan.total_distance_km)}</span>
					</li>
				</ol>
				<p class="route-hint">
					Gefahrene Strecke ab Lager und zurück — Grundlage der Fahrkostenpauschale.
					Das Feld „Entfernung“ oben ist die einfache Strecke Auszug → Einzug.
				</p>
			{/if}
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
	.route-total-chip {
		font-size: 11px;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		padding: 2px 8px;
		border-radius: var(--dt-radius-sm);
	}

	.route-legs {
		list-style: none;
		margin: 0.875rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.route-leg {
		display: grid;
		grid-template-columns: 1.5rem 1fr auto;
		align-items: baseline;
		gap: 0.625rem;
		padding: 0.5rem 0;
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		border-bottom: 1px solid var(--dt-outline-variant);
	}

	.route-leg-index {
		font-size: 0.6875rem;
		font-variant-numeric: tabular-nums;
		color: var(--dt-on-surface-variant);
		text-align: right;
	}

	.route-leg-path {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.375rem;
		min-width: 0;
	}

	.route-leg-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dt-on-surface-variant);
	}

	.route-leg-addr {
		font-weight: 500;
	}

	.route-leg-arrow {
		color: var(--dt-on-surface-variant);
	}

	.route-leg-km {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
		white-space: nowrap;
	}

	.route-leg--total {
		border-bottom: none;
		margin-top: 0.125rem;
		padding-top: 0.625rem;
		border-top: 1px solid var(--dt-outline);
		font-weight: 600;
	}

	.route-leg--total .route-leg-km {
		font-weight: 700;
	}

	.route-leg-duration {
		font-weight: 400;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.route-hint {
		margin: 0.625rem 0 0;
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--dt-on-surface-variant);
	}

	.customer-message {
		color: var(--dt-on-surface);
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}
</style>
