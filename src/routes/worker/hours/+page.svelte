<script lang="ts">
	import { goto } from '$app/navigation';

	// The worker hours summary was removed deliberately: workers must not have a
	// digital record of their accumulated hours. Any stale bookmark or old link to
	// /worker/hours is bounced to the schedule. Hours are still logged per job and
	// shown read-only to the office in the admin dashboard.
	$effect(() => {
		goto('/worker/schedule', { replaceState: true });
	});
</script>
