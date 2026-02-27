<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import type L from 'leaflet';

	interface Props {
		coordinates: [number, number][];
		distanceKm?: number;
	}

	let { coordinates, distanceKm }: Props = $props();

	let mapContainer = $state<HTMLDivElement | null>(null);
	let map: L.Map | null = null;

	/**
	 * Initialises the Leaflet map after the component mounts in the DOM.
	 *
	 * Called by: Svelte (onMount lifecycle hook)
	 * Purpose: Lazily imports Leaflet (keeping it out of the SSR bundle), creates
	 *          the map instance on the bound mapContainer element, draws an
	 *          OpenStreetMap tile layer, renders the route as a purple polyline,
	 *          and places colour-coded circle markers at the origin (green) and
	 *          destination (red). Exits early when fewer than two coordinate
	 *          pairs are provided. Returns a cleanup function that destroys the
	 *          map instance when the component is unmounted.
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

			// Draw the route polyline
			const latLngs = coordinates.map(([lat, lng]) => leaflet.latLng(lat, lng));
			const polyline = leaflet.polyline(latLngs, {
				color: '#6366f1',
				weight: 4,
				opacity: 0.8,
				smoothFactor: 1,
			}).addTo(map);

			// Origin marker (green)
			const origin = latLngs[0];
			leaflet.circleMarker(origin, {
				radius: 8,
				fillColor: '#22c55e',
				color: '#ffffff',
				weight: 2,
				fillOpacity: 1,
			}).addTo(map).bindTooltip('Start', { direction: 'top', offset: [0, -8] });

			// Destination marker (red)
			const dest = latLngs[latLngs.length - 1];
			leaflet.circleMarker(dest, {
				radius: 8,
				fillColor: '#ef4444',
				color: '#ffffff',
				weight: 2,
				fillOpacity: 1,
			}).addTo(map).bindTooltip('Ziel', { direction: 'top', offset: [0, -8] });

			// Fit map to route bounds
			map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
		});

		return () => {
			if (map) {
				map.remove();
				map = null;
			}
		};
	});
</script>

<div class="route-map-card">
	<div class="card-header">
		<h3>Route</h3>
		{#if distanceKm}
			<span class="distance-badge">{distanceKm.toFixed(1)} km</span>
		{/if}
	</div>
	<div class="map-wrapper" bind:this={mapContainer}></div>
</div>

<style>
	.route-map-card {
		background: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
		grid-column: 1 / -1;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}

	.card-header h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #64748b;
		margin: 0;
	}

	.distance-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.08);
		padding: 0.25rem 0.625rem;
		border-radius: 20px;
	}

	.map-wrapper {
		width: 100%;
		height: 300px;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}
</style>
