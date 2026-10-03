<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Button from './Button.svelte';

	/** ‹ label › — for stepping through years or months. */
	let {
		label,
		onprev,
		onnext,
		prevDisabled = false,
		nextDisabled = false,
		prevLabel = 'Zurück',
		nextLabel = 'Weiter'
	}: {
		label: string;
		onprev: () => void;
		onnext: () => void;
		prevDisabled?: boolean;
		nextDisabled?: boolean;
		prevLabel?: string;
		nextLabel?: string;
	} = $props();
</script>

<div class="inline-flex items-center gap-1">
	<Button size="icon-sm" onclick={onprev} disabled={prevDisabled} aria-label={prevLabel}><ChevronLeft size={16} /></Button>
	<span class="num min-w-32 text-center text-sm font-semibold">{label}</span>
	<Button size="icon-sm" onclick={onnext} disabled={nextDisabled} aria-label={nextLabel}><ChevronRight size={16} /></Button>
</div>
