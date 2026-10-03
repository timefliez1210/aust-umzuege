<script lang="ts">
	/**
	 * Root layout — deliberately empty. The marketing site brings its own chrome and
	 * global.css from `(site)/+layout.svelte`; the console (`/admin`, `/worker`) brings
	 * its own design system. Nothing here may style either side.
	 */
	let { children } = $props();
</script>

{@render children()}
