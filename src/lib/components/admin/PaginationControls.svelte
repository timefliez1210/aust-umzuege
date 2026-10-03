<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';

	/** Prev / "Seite x von y" / next. `page` is zero-based. */
	let {
		page,
		total,
		limit,
		onPrev,
		onNext
	}: {
		page: number;
		total: number;
		limit: number;
		onPrev: () => void;
		onNext: () => void;
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(total / limit)));
	const isFirst = $derived(page <= 0);
	const isLast = $derived((page + 1) * limit >= total);
</script>

<div class="flex items-center justify-center gap-3 py-3">
	<Button size="icon-sm" onclick={onPrev} disabled={isFirst} aria-label="Vorherige Seite"><ChevronLeft size={16} /></Button>
	<span class="num text-xs text-muted">Seite {page + 1} von {totalPages}</span>
	<Button size="icon-sm" onclick={onNext} disabled={isLast} aria-label="Nächste Seite"><ChevronRight size={16} /></Button>
</div>
