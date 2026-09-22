<script lang="ts">
	// Test double for RouteMap: Leaflet needs a real layout box, jsdom has none.
	let { distanceKm }: { coordinates?: unknown; legs?: unknown; distanceKm?: number } = $props();
</script>

<div data-testid="route-map">{distanceKm ?? ''}</div>
