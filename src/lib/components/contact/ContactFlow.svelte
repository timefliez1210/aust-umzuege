<script lang="ts">
	// Site-wide host for the contact flow: floating launcher + modal sheet.
	// Mount once in +layout.svelte. Any component can trigger it via:
	//   import { openContactFlow } from '$lib/stores/contactFlow.svelte';
	import LauncherPill from './LauncherPill.svelte';
	import ContactFlowSheet from './ContactFlowSheet.svelte';
</script>

<LauncherPill />
<ContactFlowSheet />
