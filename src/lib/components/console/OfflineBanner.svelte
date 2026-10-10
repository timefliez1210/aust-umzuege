<script lang="ts">
	import { WifiOff } from 'lucide-svelte';

	/**
	 * Sticky "Offline" notice for the admin console.
	 *
	 * Rendered by: routes/admin/+layout.svelte
	 * Purpose: Alex often works from the car. When the browser loses its
	 * connection, say so up front instead of letting saves fail one by one with
	 * cryptic errors. Driven by the browser's online/offline events.
	 */
	let online = $state(typeof navigator === 'undefined' ? true : navigator.onLine);

	$effect(() => {
		const up = () => (online = true);
		const down = () => (online = false);
		window.addEventListener('online', up);
		window.addEventListener('offline', down);
		return () => {
			window.removeEventListener('online', up);
			window.removeEventListener('offline', down);
		};
	});
</script>

{#if !online}
	<div
		role="status"
		class="flex items-center justify-center gap-2 bg-warn px-4 py-1.5 text-[13px] font-medium text-white"
	>
		<WifiOff size={14} />
		Keine Internetverbindung – Änderungen können gerade nicht gespeichert werden.
	</div>
{/if}
