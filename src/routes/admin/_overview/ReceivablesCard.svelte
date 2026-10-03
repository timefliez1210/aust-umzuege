<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import { formatEuroWhole } from '$lib/utils/format';
	import type { Overview } from './types';

	/** What customers owe, by how late it is — the register's "offen" column, aged. */
	let { r }: { r: Overview['receivables'] } = $props();

	const overdueTotal = $derived(r.overdue_1_30_cents + r.overdue_31_60_cents + r.overdue_60_plus_cents);
	const buckets = $derived(
		[
			{ label: 'Nicht fällig', cents: r.current_cents, cls: 'bg-bar-strong' },
			{ label: '1–30 Tage', cents: r.overdue_1_30_cents, cls: 'bg-warn/60' },
			{ label: '31–60 Tage', cents: r.overdue_31_60_cents, cls: 'bg-warn' },
			{ label: '> 60 Tage', cents: r.overdue_60_plus_cents, cls: 'bg-danger' }
		].map((b) => ({ ...b, width: r.open_cents > 0 ? (b.cents / r.open_cents) * 100 : 0 }))
	);
</script>

<Card>
	<CardHeader
		title="Offene Forderungen"
		meta={r.open_cents
			? `${formatEuroWhole(r.open_cents)} · davon ${formatEuroWhole(overdueTotal)} überfällig`
			: 'Alles bezahlt'}
	>
		{#snippet actions()}<a href="/admin/rechnungsausgangsbuch" class="label-xs text-muted hover:text-fg">Rechnungsbuch →</a>{/snippet}
	</CardHeader>
	{#if r.open_cents > 0}
		<div class="flex flex-col gap-3 px-4 pt-1 pb-3">
			<div class="flex h-3 gap-0.5" role="img" aria-label="Forderungen nach Alter">
				{#each buckets as b (b.label)}
					{#if b.width > 0}<div class="rounded-xs {b.cls}" style="width: {b.width}%"></div>{/if}
				{/each}
			</div>
			<div class="grid grid-cols-2 gap-x-3 gap-y-2.5 sm:grid-cols-4">
				{#each buckets as b (b.label)}
					<div class="flex flex-col gap-0.5">
						<span class="flex items-center gap-1.5 text-xs text-muted"><span class="size-2 {b.cls}"></span>{b.label}</span>
						<span class="num text-[15px] font-medium">{formatEuroWhole(b.cents)}</span>
					</div>
				{/each}
			</div>
		</div>
		{#if r.overdue.length}
			<ul class="mt-1">
				{#each r.overdue as o (o.invoice_number)}
					<li
						class="relative grid grid-cols-[64px_minmax(0,1fr)_auto_auto] items-center gap-3 border-t border-line px-4 py-2.5 text-[13px]"
					>
						<span class="num text-xs text-faint">{o.invoice_number}</span>
						{#if o.inquiry_id}
							<a href="/admin/inquiries/{o.inquiry_id}" class="truncate after:absolute after:inset-0"
								>{o.customer_name ?? 'Unbekannt'}</a
							>
						{:else}
							<span class="truncate">{o.customer_name ?? 'Unbekannt'}</span>
						{/if}
						<span class="num text-xs {o.days_overdue > 60 ? 'text-danger' : 'text-warn'}">{o.days_overdue} T</span>
						<span class="num min-w-[72px] text-right font-medium">{formatEuroWhole(o.open_cents)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</Card>
