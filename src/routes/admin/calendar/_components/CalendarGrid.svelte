<script lang="ts">
	import { getISOWeek } from '$lib/utils/calendar';
	import type { CalendarDay } from '$lib/utils/calendar';
	import { formatTime } from '$lib/utils/format';
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
	 * Renders the desktop/mobile month grid (day cells, multi-day spanning bars,
	 * per-day entry chips). Extracted verbatim from admin/calendar/+page.svelte —
	 * all interaction (drag-and-drop, click handlers, panel opening) is delegated
	 * back to the parent via callback props so behavior is unchanged.
	 */
	let {
		calendarDays,
		weekdays,
		publicHolidayMap,
		schoolHolidayMap,
		dayLaneMap,
		dragOverDate,
		buildDayEntries,
		inquiryEntryClass,
		termineEntryClass,
		truncate,
		apptKindLabel,
		openDayPanel,
		onCellDragOver,
		onCellDragLeave,
		onCellDrop,
		onCellContextMenu,
		onEntryDragStart,
		openInquiryPanel,
		openTerminPanel,
		onAppointmentClick
	}: {
		calendarDays: CalendarDay<DaySchedule>[];
		weekdays: string[];
		publicHolidayMap: Map<string, string>;
		schoolHolidayMap: Map<string, string>;
		dayLaneMap: Map<string, string[]>;
		dragOverDate: string | null;
		buildDayEntries: (dateStr: string) => DayEntry[];
		inquiryEntryClass: (status: string) => string;
		termineEntryClass: (category: string) => string;
		truncate: (s: string | null, max: number) => string;
		apptKindLabel: (kind: string) => string;
		openDayPanel: (day: DaySchedule | null, dateNum: number | null, dateStrOverride?: string) => void;
		onCellDragOver: (e: DragEvent, dateStr: string) => void;
		onCellDragLeave: () => void;
		onCellDrop: (e: DragEvent, dateStr: string) => void;
		onCellContextMenu: (e: MouseEvent, dateStr: string) => void;
		onEntryDragStart: (
			e: DragEvent,
			id: string,
			type: 'inquiry' | 'termin' | 'appointment',
			fromDate: string,
			dayNumber?: number,
			apptInquiryId?: string | null
		) => void;
		openInquiryPanel: (e: MouseEvent, inq: InquiryItem) => void;
		openTerminPanel: (e: MouseEvent, ci: CalendarItem) => void;
		onAppointmentClick: (e: Event, a: ScheduleAppointment) => void;
	} = $props();
</script>

<!--
	Month grid (desktop; phones get MonthAgenda). Cell tints: holiday / overbooked /
	outside-month; today is an inset ring + filled date pill so it survives any tint.
	Multi-day jobs render as bars that bleed through cell padding and borders so a
	week reads as one continuous strip.
-->
<div class="grid grid-cols-[32px_repeat(7,minmax(0,1fr))] overflow-hidden rounded-md border border-line bg-sunk">
	<div class="border-r border-b border-line"></div>
	{#each weekdays as day (day)}
		<div class="label-xs border-r border-b border-line py-2 text-center text-[10px] text-faint last:border-r-0">{day}</div>
	{/each}

	{#each calendarDays as day, i (day.dateStr)}
		{#if i % 7 === 0}
			<div class="num flex items-center justify-center border-r border-b border-line text-[10px] text-faint [writing-mode:vertical-rl]">
				KW {getISOWeek(day.dateStr)}
			</div>
		{/if}
		{@const dateStr = day.dateStr}
		{@const allEntries = buildDayEntries(dateStr)}
		{@const booked = day.schedule?.booked || 0}
		{@const capacity = day.schedule?.capacity || 1}
		{@const overbooked = booked > capacity}
		{@const publicHol = publicHolidayMap.get(dateStr)}
		{@const schoolHol = schoolHolidayMap.get(dateStr)}
		{@const mdEntries = allEntries.filter(
			(e) =>
				(e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1) ||
				(e.type === 'schedule-termin' && e.item.total_days && e.item.total_days > 1)
		)}
		{@const sdEntries = allEntries.filter(
			(e) =>
				!(e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1) &&
				!(e.type === 'schedule-termin' && e.item.total_days && e.item.total_days > 1)
		)}
		{@const lanes = dayLaneMap.get(dateStr) ?? []}
		<button
			class="relative flex min-h-24 w-full min-w-0 cursor-pointer flex-col gap-0.5 border-r border-b border-line py-1.5 pr-1 pl-1.5 text-left transition-colors [&:nth-child(8n)]:border-r-0
				{publicHol
				? 'bg-danger/8'
				: schoolHol
					? 'bg-warn/8'
					: overbooked
						? 'bg-danger/5'
						: day.isOverflow
							? 'bg-sunk'
							: 'bg-panel'}
				{day.isOverflow ? 'opacity-55 hover:opacity-80' : 'hover:bg-sunk/70'}
				{day.isToday ? 'z-[1] shadow-[inset_0_0_0_2px_var(--fg)]' : ''}
				{dragOverDate === dateStr ? 'bg-accent/10 outline-2 -outline-offset-2 outline-accent outline-dashed' : ''}"
			onclick={() => openDayPanel(day.schedule, null, day.dateStr)}
			ondragover={(e) => onCellDragOver(e, dateStr)}
			ondragleave={onCellDragLeave}
			ondrop={(e) => onCellDrop(e, dateStr)}
			oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
		>
			<span class="mb-0.5 flex items-center justify-between gap-1">
				<span
					class="num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[12px] leading-none font-semibold
						{day.isToday ? 'bg-fg text-bg' : day.isOverflow ? 'text-faint' : 'text-muted'}">{day.date}</span
				>
				{#if overbooked}<span class="num rounded-xs bg-danger px-1 text-[9.5px] font-semibold text-white" title="Überbucht">{booked}/{capacity}</span>{/if}
			</span>
			{#if publicHol}<span class="truncate text-[10px] font-medium text-danger">{publicHol}</span>{/if}
			{#if schoolHol}<span class="truncate text-[10px] text-warn">{schoolHol}</span>{/if}

			{#each lanes as laneId (laneId)}
				{@const entry = mdEntries.find((e) =>
					e.type === 'inquiry' ? e.item.inquiry_id === laneId : 'calendar_item_id' in e.item && e.item.calendar_item_id === laneId
				)}
				{#if entry}
					{@const mdEntry = entry as { type: 'inquiry'; item: InquiryItem } | { type: 'schedule-termin'; item: ScheduleCalendarItem }}
					{@const dayNum = mdEntry.item.day_number ?? 1}
					{@const totalDays = mdEntry.item.total_days ?? 1}
					{@const dow = new Date(dateStr + 'T00:00:00').getDay()}
					{@const isVisualStart = dayNum === 1 || dow === 1}
					{@const isVisualEnd = dayNum === totalDays || dow === 0}
					{@const isMultiDayInquiry = mdEntry.type === 'inquiry'}
					{@const barColor = isMultiDayInquiry ? inquiryEntryClass(mdEntry.item.status) : termineEntryClass(mdEntry.item.category)}
					{@const terminArg = isMultiDayInquiry
						? null
						: {
								id: (mdEntry.item as ScheduleCalendarItem).calendar_item_id,
								title: (mdEntry.item as ScheduleCalendarItem).title,
								category: (mdEntry.item as ScheduleCalendarItem).category,
								location: (mdEntry.item as ScheduleCalendarItem).location,
								description: (mdEntry.item as ScheduleCalendarItem).description ?? null,
								scheduled_date: dateStr,
								start_time: mdEntry.item.start_time,
								end_time: mdEntry.item.end_time ?? null,
								duration_hours: 0,
								status: 'scheduled'
							}}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="block min-h-[15px] cursor-pointer overflow-hidden py-0.5 text-[10.5px] font-medium whitespace-nowrap hover:brightness-95 {barColor}
							{isVisualStart && isVisualEnd
							? 'm-px rounded-xs'
							: isVisualStart
								? 'my-px mr-[calc(-0.25rem-1px)] ml-px rounded-l-xs'
								: isVisualEnd
									? 'my-px mr-px -ml-1.5 rounded-r-xs'
									: 'my-px mr-[calc(-0.25rem-1px)] -ml-1.5'}"
						title="{isMultiDayInquiry ? (mdEntry.item as InquiryItem).customer_name ?? '' : (mdEntry.item as ScheduleCalendarItem).title} · Tag {dayNum}/{totalDays}"
						draggable="true"
						ondragstart={(e) =>
							onEntryDragStart(
								e,
								isMultiDayInquiry ? (mdEntry.item as InquiryItem).inquiry_id : (mdEntry.item as ScheduleCalendarItem).calendar_item_id,
								isMultiDayInquiry ? 'inquiry' : 'termin',
								dateStr,
								('day_number' in entry.item ? mdEntry.item.day_number : null) ?? 1
							)}
						onclick={(e) => (isMultiDayInquiry ? openInquiryPanel(e, mdEntry.item as InquiryItem) : openTerminPanel(e, terminArg!))}
						role="button"
						tabindex="0"
						onkeydown={(e) =>
							e.key === 'Enter' &&
							(isMultiDayInquiry
								? openInquiryPanel(e as unknown as MouseEvent, mdEntry.item as InquiryItem)
								: openTerminPanel(e as unknown as MouseEvent, terminArg!))}
					>
						{#if isVisualStart}
							<span class="pl-1.5">{truncate(isMultiDayInquiry ? (mdEntry.item as InquiryItem).customer_name : (mdEntry.item as ScheduleCalendarItem).title, 12)}</span>
						{:else}
							<span class="pl-1.5 italic opacity-70">Tag {dayNum}/{totalDays}</span>
						{/if}
					</div>
				{:else}
					<div class="my-px block min-h-[15px]"></div>
				{/if}
			{/each}

			<span class="flex w-full min-w-0 flex-col gap-0.5">
				{#each sdEntries as entry, ei (ei)}
					{#if entry.type === 'inquiry'}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span
							class="block w-full cursor-pointer overflow-hidden rounded-xs px-1 py-0.5 text-[10.5px] leading-snug font-medium text-ellipsis whitespace-nowrap hover:brightness-95 active:cursor-grabbing active:opacity-60 whitespace-normal {inquiryEntryClass(entry.item.status)}"
							title="{entry.item.customer_name ?? ''}{entry.item.departure_address || entry.item.arrival_address
								? ' · ' + (entry.item.departure_address || '?') + ' → ' + (entry.item.arrival_address || '?')
								: ''}"
							draggable="true"
							ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
							onclick={(e) => openInquiryPanel(e, entry.item)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
						>
							<span class="block truncate"
								><span class="num mr-1 opacity-70">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.customer_name, 12)}</span
							>
							{#if entry.item.departure_address || entry.item.arrival_address}
								<span class="block truncate text-[9.5px] font-normal opacity-75"
									>{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</span
								>
							{/if}
						</span>
					{:else if entry.type === 'termin'}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span
							class="block w-full cursor-pointer overflow-hidden rounded-xs px-1 py-0.5 text-[10.5px] leading-snug font-medium text-ellipsis whitespace-nowrap hover:brightness-95 active:cursor-grabbing active:opacity-60 {termineEntryClass(entry.item.category)}"
							title="{entry.item.title}{entry.item.location ? ' @ ' + entry.item.location : ''}"
							draggable="true"
							ondragstart={(e) => onEntryDragStart(e, entry.item.id, 'termin', dateStr)}
							onclick={(e) => openTerminPanel(e, entry.item)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, entry.item)}
						>
							<span class="num mr-1 opacity-70">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.title, 14)}
						</span>
					{:else if entry.type === 'appointment'}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span
							class="block w-full cursor-pointer overflow-hidden rounded-xs px-1 py-0.5 text-[10.5px] leading-snug font-medium text-ellipsis whitespace-nowrap hover:brightness-95 active:cursor-grabbing active:opacity-60 entry-appt"
							title="{apptKindLabel(entry.item.kind)}: {entry.item.customer_name ?? ''}{entry.item.assignee_name ? ' · ' + entry.item.assignee_name : ''}"
							draggable="true"
							ondragstart={(e) => onEntryDragStart(e, entry.item.appointment_id, 'appointment', dateStr, 1, entry.item.inquiry_id)}
							onclick={(e) => onAppointmentClick(e, entry.item)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && onAppointmentClick(e, entry.item)}
						>
							{#if entry.item.start_time}<span class="num mr-1 opacity-70">{formatTime(entry.item.start_time)}</span>{/if}{truncate(
								apptKindLabel(entry.item.kind),
								12
							)}
						</span>
					{:else}
						<!-- schedule-termin from the schedule API -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<span
							class="block w-full cursor-pointer overflow-hidden rounded-xs px-1 py-0.5 text-[10.5px] leading-snug font-medium text-ellipsis whitespace-nowrap hover:brightness-95 active:cursor-grabbing active:opacity-60 {termineEntryClass(entry.item.category)}"
							title="{entry.item.title}{entry.item.location ? ' @ ' + entry.item.location : ''}"
							draggable="true"
							ondragstart={(e) => onEntryDragStart(e, entry.item.calendar_item_id, 'termin', dateStr)}
							onclick={(e) =>
								openTerminPanel(e, {
									id: entry.item.calendar_item_id,
									title: entry.item.title,
									category: entry.item.category,
									location: entry.item.location,
									description: entry.item.description ?? null,
									scheduled_date: dateStr,
									start_time: entry.item.start_time,
									end_time: entry.item.end_time ?? null,
									duration_hours: 0,
									status: 'scheduled'
								})}
							role="button"
							tabindex="0"
							onkeydown={(e) =>
								e.key === 'Enter' &&
								openTerminPanel(e as unknown as MouseEvent, {
									id: entry.item.calendar_item_id,
									title: entry.item.title,
									category: entry.item.category,
									location: entry.item.location,
									description: entry.item.description ?? null,
									scheduled_date: dateStr,
									start_time: entry.item.start_time,
									end_time: entry.item.end_time ?? null,
									duration_hours: 0,
									status: 'scheduled'
								})}
						>
							<span class="num mr-1 opacity-70">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.title, 14)}
						</span>
					{/if}
				{/each}
			</span>
		</button>
	{/each}
</div>
