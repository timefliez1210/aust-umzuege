<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import type L from 'leaflet';
	import type { RouteLeg } from '$lib/types/route';

	interface Props {
		/** Full polyline as `[lat, lng]` pairs — every leg concatenated. */
		coordinates: [number, number][];
		/**
		 * Per-leg breakdown. When present each leg is drawn separately and every
		 * waypoint gets a labelled marker ("Lager", "Auszug", "Zwischenstopp",
		 * "Einzug"), so the round trip is readable instead of one anonymous line.
		 */
		legs?: RouteLeg[] | null;
		/** Total driven distance, shown as a badge over the map. */
		distanceKm?: number;
	}

	let { coordinates, legs = null, distanceKm }: Props = $props();

	let mapContainer = $state<HTMLDivElement | null>(null);
	let map: L.Map | null = null;

	/** Marker fill per waypoint role; the depot bookends the trip and stays neutral. */
	const MARKER_COLORS: Record<string, string> = {
		Lager: '#64748b',
		Auszug: '#22c55e',
		Zwischenstopp: '#f59e0b',
		Einzug: '#ef4444',
	};

	/**
	 * Initialises the Leaflet map after the component mounts in the DOM.
	 *
	 * Called by: Svelte (onMount lifecycle hook)
	 * Purpose: Lazily imports Leaflet (keeping it out of the SSR bundle), creates the map
	 *          instance on the bound mapContainer element, draws an OpenStreetMap tile
	 *          layer, then renders the route. With `legs` it draws one polyline per leg
	 *          and a labelled circle marker at every waypoint; without them it falls back
	 *          to a single polyline with Start/Ziel markers. Exits early when fewer than
	 *          two coordinate pairs are provided.
	 *
	 * @returns A cleanup function that removes the Leaflet map instance to
	 *          prevent memory leaks when the component is destroyed
	 */
	onMount(() => {
		if (!mapContainer || coordinates.length < 2) return;

		import('leaflet').then((mod) => {
			const leaflet = mod.default;

			map = leaflet.map(mapContainer!, {
				zoomControl: true,
				attributionControl: true,
				scrollWheelZoom: false,
			});

			leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				maxZoom: 18,
			}).addTo(map);

			const latLngs = coordinates.map(([lat, lng]) => leaflet.latLng(lat, lng));

			/** Place a colour-coded circle marker with a permanent role label. */
			const marker = (at: L.LatLng, label: string) => {
				leaflet
					.circleMarker(at, {
						radius: 7,
						fillColor: MARKER_COLORS[label] ?? '#6366f1',
						color: '#ffffff',
						weight: 2,
						fillOpacity: 1,
					})
					.addTo(map!)
					.bindTooltip(label, { direction: 'top', offset: [0, -8] });
			};

			const drawnLegs = legs?.filter((l) => (l.geometry?.length ?? 0) >= 2) ?? [];

			if (drawnLegs.length > 0) {
				// One polyline per leg. The two depot legs are dashed so the loop back to
				// the Lager reads as travel rather than as part of the customer's move.
				drawnLegs.forEach((leg) => {
					const legLatLngs = leg.geometry!.map(([lng, lat]) => leaflet.latLng(lat, lng));
					const isDepotLeg = leg.from_label === 'Lager' || leg.to_label === 'Lager';
					leaflet
						.polyline(legLatLngs, {
							color: isDepotLeg ? '#94a3b8' : '#6366f1',
							weight: 4,
							opacity: isDepotLeg ? 0.7 : 0.9,
							dashArray: isDepotLeg ? '6 6' : undefined,
							smoothFactor: 1,
						})
						.addTo(map!)
						.bindTooltip(`${leg.from_label} → ${leg.to_label}: ${leg.distance_km.toFixed(1).replace('.', ',')} km`);

					marker(legLatLngs[0], leg.from_label);
				});

				// Closing waypoint — the last leg's end has no following leg to mark it.
				const last = drawnLegs[drawnLegs.length - 1];
				const lastLatLngs = last.geometry!.map(([lng, lat]) => leaflet.latLng(lat, lng));
				marker(lastLatLngs[lastLatLngs.length - 1], last.to_label);
			} else {
				leaflet
					.polyline(latLngs, { color: '#6366f1', weight: 4, opacity: 0.8, smoothFactor: 1 })
					.addTo(map);
				marker(latLngs[0], 'Start');
				marker(latLngs[latLngs.length - 1], 'Ziel');
			}

			// Fit map to the whole trip, not just one leg.
			map.fitBounds(leaflet.latLngBounds(latLngs), { padding: [30, 30] });
		});

		return () => {
			if (map) {
				map.remove();
				map = null;
			}
		};
	});
</script>

<div class="route-map">
	<div class="map-wrapper" bind:this={mapContainer}></div>
	{#if distanceKm}
		<span class="distance-badge">{distanceKm.toFixed(1).replace('.', ',')} km</span>
	{/if}
</div>

<style>
	.route-map {
		position: relative;
		grid-column: 1 / -1;
	}

	.distance-badge {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		z-index: 400; /* above Leaflet panes (400 = overlayPane) */
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dt-on-primary);
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		padding: 4px 8px;
		border-radius: var(--dt-radius-sm);
		box-shadow: 0 1px 4px rgb(0 0 0 / 0.25);
		pointer-events: none;
	}

	.map-wrapper {
		width: 100%;
		height: 300px;
		border-radius: var(--dt-radius-md);
		overflow: hidden;
		isolation: isolate;
	}
</style>
