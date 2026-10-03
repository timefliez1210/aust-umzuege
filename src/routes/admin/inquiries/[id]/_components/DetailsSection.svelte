<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Lock } from 'lucide-svelte';
	import { Save } from "lucide-svelte";
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

<Panel title="Details" open={detailsOpen} onToggle={onToggleDetails}>
	{#snippet actions()}
		<Button size="sm" onclick={onSave} disabled={saving}>
			<Save size={14} />
			{saving ? 'Speichern …' : 'Speichern'}
		</Button>
	{/snippet}
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		<Field label="Volumen (m³)" for="volume">
			<div class="relative">
				<Input id="volume" type="number" step="0.1" bind:value={editVolume} disabled={isLocked} class="num" />
				{#if isLocked}<Lock size={13} class="absolute top-1/2 right-3 -translate-y-1/2 text-faint" aria-label="gesperrt" />{/if}
			</div>
		</Field>
		<Field label="Entfernung (km)" for="distance">
			<div class="relative">
				<Input id="distance" type="number" step="0.1" bind:value={editDistance} disabled={isLocked} class="num" />
				{#if isLocked}<Lock size={13} class="absolute top-1/2 right-3 -translate-y-1/2 text-faint" aria-label="gesperrt" />{/if}
			</div>
		</Field>
		<Field label="Datum" for="preferred-date"><Input id="preferred-date" type="date" bind:value={editDate} /></Field>
		<Field label="Startzeit" for="start-time">
			<Input
				id="start-time"
				class="num"
				inputmode="numeric"
				pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
				placeholder="HH:MM"
				maxlength={5}
				bind:value={editStartTime}
			/>
		</Field>
		<Field label="Endzeit" for="end-time">
			<Input
				id="end-time"
				class="num"
				inputmode="numeric"
				pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
				placeholder="HH:MM"
				maxlength={5}
				bind:value={editEndTime}
			/>
		</Field>
		<Field label="Notizen / Services" for="notes" class="col-span-2 sm:col-span-3">
			<Textarea id="notes" rows={3} bind:value={editNotes} />
		</Field>
	</div>
</Panel>

{#if routeCoordinates || routePlan}
	<Panel title="Route" open={routeOpen} onToggle={onToggleRoute}>
		{#snippet summary()}
			{#if routePlan}<Badge>{km(routePlan.total_distance_km)}</Badge>{/if}
		{/snippet}
		{#if routeCoordinates}
			<div class="overflow-hidden rounded-sm border border-line">
				<RouteMap
					coordinates={routeCoordinates}
					legs={routePlan?.legs ?? null}
					distanceKm={routePlan?.total_distance_km ?? editDistance}
				/>
			</div>
		{/if}
		{#if routePlan}
			<ol class="mt-3 flex flex-col">
				{#each routePlan.legs as leg, i (i)}
					<li class="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-2.5 border-b border-line py-2 text-[13px]">
						<span class="num text-right text-[11px] text-faint">{i + 1}</span>
						<span class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
							<span class="label-xs text-faint">{leg.from_label}</span>
							<span class="font-medium">{shortAddress(leg.from_address)}</span>
							<span class="text-faint" aria-hidden="true">→</span>
							<span class="label-xs text-faint">{leg.to_label}</span>
							<span class="font-medium">{shortAddress(leg.to_address)}</span>
						</span>
						<span class="num font-medium whitespace-nowrap">{km(leg.distance_km)}</span>
					</li>
				{/each}
				<li class="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-baseline gap-2.5 pt-2.5 text-[13px] font-semibold">
					<span aria-hidden="true"></span>
					<span>
						Gesamtstrecke
						<span class="ml-1 text-xs font-normal text-muted">ca. {duration(routePlan.total_duration_minutes)} Fahrzeit</span>
					</span>
					<span class="num whitespace-nowrap">{km(routePlan.total_distance_km)}</span>
				</li>
			</ol>
			<p class="mt-2.5 text-xs leading-relaxed text-muted">
				Gefahrene Strecke ab Lager und zurück — Grundlage der Fahrkostenpauschale. Das Feld „Entfernung“ oben ist die
				einfache Strecke Auszug → Einzug.
			</p>
		{/if}
	</Panel>
{/if}

{#if customerMessage}
	<Panel title="Kundennachricht" open={messageOpen} onToggle={onToggleMessage}>
		<p class="text-sm leading-relaxed whitespace-pre-wrap">{customerMessage}</p>
	</Panel>
{/if}
