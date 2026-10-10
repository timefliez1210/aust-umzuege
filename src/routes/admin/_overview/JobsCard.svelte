<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatTime } from '$lib/utils/format';
	import type { Overview } from './types';

	/** Won jobs today and tomorrow with route, volume and crew. */
	let { jobs, today }: { jobs: Overview['jobs']; today: string } = $props();

	/** "Kirchstr. 4, Hildesheim" → "Hildesheim" */
	const city = (addr: string | null) => addr?.split(',').at(-1)?.trim() || '—';
	const initials = (name: string) =>
		name
			.replace('.', '')
			.split(/\s+/)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
</script>

<Card>
	<CardHeader title="Heute & morgen" meta={jobs.length ? `${jobs.length} Einsätze` : undefined}>
		{#snippet actions()}<a href="/admin/calendar" class="label-xs text-muted hover:text-fg">Kalender →</a>{/snippet}
	</CardHeader>
	{#if jobs.length === 0}
		<p class="border-t border-line px-4 py-6 text-sm text-muted">Heute und morgen keine Umzüge geplant.</p>
	{:else}
		<ul>
			{#each jobs as j (j.inquiry_id + j.date)}
				{@const isToday = j.date === today}
				<li class="relative grid grid-cols-[52px_minmax(0,1fr)] gap-3.5 border-t border-line px-4 py-3.5">
					<span class="flex flex-col gap-0.5">
						<span class="label-xs text-[10px] text-faint">{isToday ? 'Heute' : 'Morgen'}</span>
						<span class="num text-[17px] font-medium">{formatTime(j.start_time)}</span>
					</span>
					<span class="flex min-w-0 flex-col gap-1.5">
						<span class="flex items-center justify-between gap-2">
							<a href="/admin/inquiries/{j.inquiry_id}" class="truncate font-semibold after:absolute after:inset-0"
								>{j.customer_name ?? 'Unbekannt'}</a
							>
							{#if j.crew.length === 0}
								<Badge tone="danger">Kein Team</Badge>
							{:else if j.total_days > 1}
								<Badge>Tag {j.day_number}/{j.total_days}</Badge>
							{/if}
						</span>
						<span class="truncate text-[13px] text-muted">{city(j.departure_address)} → {city(j.arrival_address)}</span>
						<PhoneLink phone={j.customer_phone} class="relative z-10 self-start text-xs text-muted" />
						<span class="flex items-center justify-between gap-2">
							<span class="num text-xs text-faint">{j.volume_m3 ? `${Math.round(j.volume_m3)} m³` : ''}</span>
							<span class="flex gap-1">
								{#each j.crew as c (c)}
									<span
										title={c}
										class="num inline-flex size-6 items-center justify-center rounded-full border border-line-strong bg-sunk text-[9.5px]"
										>{initials(c)}</span
									>
								{/each}
								{#if j.crew.length === 0}
									<Button
										href="/admin/inquiries/{j.inquiry_id}"
										size="xs"
										class="relative z-10 border-dashed">+ Team</Button
									>
								{/if}
							</span>
						</span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
