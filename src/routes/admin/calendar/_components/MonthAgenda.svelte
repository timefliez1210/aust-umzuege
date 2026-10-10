<script lang="ts">
	import { Users, User, MapPin } from 'lucide-svelte';
	import { formatTime } from '$lib/utils/format';
	import type { CalendarDay } from '$lib/utils/calendar';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';
	import type {
		InquiryItem,
		CalendarItem,
		ScheduleCalendarItem,
		ScheduleAppointment,
		DaySchedule
	} from '$lib/types/calendar';

	type DayEntry =
		| { type: 'inquiry'; item: InquiryItem }
		| { type: 'termin'; item: CalendarItem }
		| { type: 'schedule-termin'; item: ScheduleCalendarItem }
		| { type: 'appointment'; item: ScheduleAppointment };

	/**
	 * Mobile-only agenda view for the month grid (≤768px). The month grid is
	 * unusable on small screens, so this renders the same fetched schedule data
	 * as a vertically scrollable day-list instead: one section per day of the
	 * month with its entries as tappable cards. Tapping a card opens the same
	 * side panel the desktop grid uses (via the callback props).
	 */
	let {
		calendarDays,
		publicHolidayMap,
		schoolHolidayMap,
		buildDayEntries,
		inquiryEntryClass,
		termineEntryClass,
		truncate,
		apptKindLabel,
		openInquiryPanel,
		openTerminPanel,
		onAppointmentClick
	}: {
		calendarDays: CalendarDay<DaySchedule>[];
		publicHolidayMap: Map<string, string>;
		schoolHolidayMap: Map<string, string>;
		buildDayEntries: (dateStr: string) => DayEntry[];
		inquiryEntryClass: (status: string) => string;
		termineEntryClass: (category: string) => string;
		truncate: (s: string | null, max: number) => string;
		apptKindLabel: (kind: string) => string;
		openInquiryPanel: (e: MouseEvent, inq: InquiryItem) => void;
		openTerminPanel: (e: MouseEvent, ci: CalendarItem) => void;
		onAppointmentClick: (e: Event, a: ScheduleAppointment) => void;
	} = $props();

	/** Short German weekday label, e.g. "Mo", for the day-section header. */
	function weekdayShort(dateStr: string): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short' });
	}

	/** Only the days belonging to the displayed month — overflow padding days are skipped in the agenda. */
	let monthDays = $derived(calendarDays.filter((d) => !d.isOverflow));
</script>

<!-- Phone month view: one row per day, entries as full-width cards. -->
<div class="flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-panel">
	{#each monthDays as day (day.dateStr)}
		{@const dateStr = day.dateStr}
		{@const entries = buildDayEntries(dateStr)}
		{@const publicHol = publicHolidayMap.get(dateStr)}
		{@const schoolHol = schoolHolidayMap.get(dateStr)}
		{@const booked = day.schedule?.booked ?? 0}
		{@const capacity = day.schedule?.capacity ?? 1}
		{@const overbooked = booked > capacity}
		<div class="flex gap-3 px-3 py-2.5 {day.isToday ? 'bg-sunk' : ''}">
			<div class="flex w-10 shrink-0 flex-col items-center gap-0.5 pt-0.5">
				<span class="label-xs text-[10px] text-faint">{weekdayShort(dateStr)}</span>
				<span
					class="num inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold {day.isToday
						? 'bg-fg text-bg'
						: ''}">{day.date}</span
				>
				{#if booked > 0}
					<span class="num text-[10px] {overbooked ? 'font-semibold text-danger' : 'text-faint'}">{booked}/{capacity}</span>
				{/if}
			</div>
			<div class="flex min-w-0 flex-1 flex-col gap-1.5">
				{#if publicHol}<span class="text-[11px] font-medium text-danger">{publicHol}</span>{/if}
				{#if schoolHol}<span class="text-[11px] text-warn">{schoolHol}</span>{/if}
				{#if entries.length === 0}
					<span class="pt-1.5 text-xs text-faint">—</span>
				{:else}
					{#each entries as entry, ei (ei)}
						{#if entry.type === 'inquiry'}
							<div role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()} class="block w-full cursor-pointer rounded-sm px-3 py-2 text-left active:brightness-95 {inquiryEntryClass(entry.item.status)}" onclick={(e) => openInquiryPanel(e, entry.item)}>
								<span class="flex items-center justify-between gap-2">
									<span class="num text-xs opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
									<StatusBadge status={entry.item.status} />
								</span>
								<span class="mt-0.5 block truncate text-sm font-semibold">{truncate(entry.item.customer_name, 40)}</span>
								<PhoneLink phone={entry.item.customer_phone} class="text-xs" />
								{#if entry.item.departure_address || entry.item.arrival_address}
									<span class="block truncate text-xs opacity-75">{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</span>
								{/if}
								{#if entry.item.employees_assigned}
									<span class="mt-0.5 flex items-center gap-1 text-xs opacity-75"><Users size={11} /> {entry.item.employees_assigned}</span>
								{/if}
							</div>
						{:else if entry.type === 'appointment'}
							<div role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()} class="block w-full cursor-pointer rounded-sm px-3 py-2 text-left active:brightness-95 entry-appt" onclick={(e) => onAppointmentClick(e, entry.item)}>
								<span class="flex items-center justify-between gap-2 text-xs">
									{#if entry.item.start_time}<span class="num opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>{/if}
									<span class="font-medium">{apptKindLabel(entry.item.kind)}</span>
								</span>
								<span class="mt-0.5 block truncate text-sm font-semibold">{truncate(entry.item.customer_name, 40)}</span>
								<PhoneLink phone={entry.item.customer_phone} class="text-xs" />
								{#if entry.item.assignee_name}<span class="flex items-center gap-1 text-xs opacity-75"><User size={11} /> {entry.item.assignee_name}</span>{/if}
							</div>
						{:else if entry.type === 'schedule-termin'}
							<div
								role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()}
								class="block w-full cursor-pointer rounded-sm px-3 py-2 text-left active:brightness-95 {termineEntryClass(entry.item.category)}"
								onclick={(e) =>
									openTerminPanel(e, {
										id: entry.item.calendar_item_id,
										title: entry.item.title,
										category: entry.item.category,
										location: entry.item.location,
										description: entry.item.description ?? null,
										customer_name: entry.item.customer_name ?? null,
										customer_phone: entry.item.customer_phone ?? null,
										scheduled_date: dateStr,
										start_time: entry.item.start_time,
										end_time: entry.item.end_time ?? null,
										duration_hours: 0,
										status: 'scheduled'
									})}
							>
								<span class="num text-xs opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
								<span class="mt-0.5 block truncate text-sm font-semibold">{truncate(entry.item.title, 40)}</span>
								{#if entry.item.customer_name}<span class="block truncate text-xs opacity-75">{entry.item.customer_name}</span>{/if}
								<PhoneLink phone={entry.item.customer_phone} class="text-xs" />
								{#if entry.item.location}<span class="flex items-center gap-1 truncate text-xs opacity-75"><MapPin size={11} /> {entry.item.location}</span>{/if}
								{#if entry.item.employees_assigned}<span class="flex items-center gap-1 text-xs opacity-75"><Users size={11} /> {entry.item.employees_assigned}</span>{/if}
							</div>
						{:else}
							<!-- 'termin' type: never produced by buildDayEntries, kept for type completeness -->
							<div role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLElement).click()} class="block w-full cursor-pointer rounded-sm px-3 py-2 text-left active:brightness-95 {termineEntryClass(entry.item.category)}" onclick={(e) => openTerminPanel(e, entry.item)}>
								<span class="num text-xs opacity-75">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
								<span class="mt-0.5 block truncate text-sm font-semibold">{truncate(entry.item.title, 40)}</span>
								{#if entry.item.location}<span class="flex items-center gap-1 truncate text-xs opacity-75"><MapPin size={11} /> {entry.item.location}</span>{/if}
							</div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	{/each}
</div>
