<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import type { CapacityDay } from './types';

	/**
	 * Four weeks of bookings vs capacity (Mon–Sat), same count as the calendar.
	 * Fill strength = how full the day is; overbooked days are red.
	 */
	let { days, today }: { days: CapacityDay[]; today: string } = $props();

	const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

	function isoWeek(iso: string): number {
		const d = new Date(`${iso}T12:00:00Z`);
		d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
	}

	const weeks = $derived(
		Array.from({ length: Math.ceil(days.length / 6) }, (_, w) => days.slice(w * 6, w * 6 + 6)).map((cells) => ({
			kw: cells.length ? isoWeek(cells[0].date) : 0,
			cells: cells.map((c) => {
				const ratio = c.capacity > 0 ? c.booked / c.capacity : c.booked > 0 ? 2 : 0;
				const past = c.date < today;
				return {
					...c,
					day: c.date.slice(8, 10) + '.' + c.date.slice(5, 7) + '.',
					past,
					isToday: c.date === today,
					cls:
						ratio > 1
							? 'bg-danger text-white'
							: ratio >= 1
								? 'bg-accent text-accent-ink'
								: ratio >= 0.5
									? 'bg-accent/45'
									: ratio > 0
										? 'bg-accent/18'
										: 'bg-sunk'
				};
			})
		}))
	);
	const free = $derived(
		days.filter((d) => d.date >= today).reduce((n, d) => n + Math.max(0, d.capacity - d.booked), 0)
	);
</script>

<Card>
	<CardHeader title="Auslastung" meta="Buchungen / Kapazität · {free} freie Plätze ab heute">
		{#snippet actions()}<a href="/admin/calendar" class="label-xs text-muted hover:text-fg">Kalender →</a>{/snippet}
	</CardHeader>
	<div class="flex flex-col gap-1 px-4 pt-1 pb-4 sm:gap-1.5">
		<div class="grid grid-cols-[36px_repeat(6,minmax(0,1fr))] sm:grid-cols-[44px_repeat(6,minmax(0,1fr))] gap-1.5">
			<span></span>
			{#each DAYS as d (d)}<span class="label-xs text-center text-[10px] text-faint">{d}</span>{/each}
		</div>
		{#each weeks as w (w.kw)}
			<div class="grid grid-cols-[36px_repeat(6,minmax(0,1fr))] sm:grid-cols-[44px_repeat(6,minmax(0,1fr))] gap-1.5">
				<span class="num flex items-center text-[10px] text-faint sm:text-[11px]">KW {w.kw}</span>
				{#each w.cells as c (c.date)}
					<a
						href="/admin/calendar"
						title="{c.day}: {c.booked} von {c.capacity} gebucht"
						class="flex h-10 flex-col justify-end rounded-xs px-1 py-1 sm:h-11 sm:justify-between sm:px-1.5 {c.cls} {c.past ? 'opacity-40' : ''} {c.isToday
							? 'ring-2 ring-fg ring-offset-1 ring-offset-panel'
							: ''}"
					>
						<span class="num hidden text-[10px] opacity-75 sm:block">{c.day}</span>
						<span class="num self-center text-[12px] font-medium sm:self-end sm:text-[13px]">{c.booked}/{c.capacity}</span>
					</a>
				{/each}
			</div>
		{/each}
	</div>
</Card>
