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

<div class="calendar-grid">
	<div class="cal-kw cal-kw-header"></div>
	{#each weekdays as day}
		<div class="cal-header">{day}</div>
	{/each}

	{#each calendarDays as day, i}
		{#if i % 7 === 0}
			<div class="cal-kw">KW {getISOWeek(day.dateStr)}</div>
		{/if}
			{@const dateStr = day.dateStr}
			{@const allEntries = buildDayEntries(dateStr)}
			{@const booked = day.schedule?.booked || 0}
			{@const capacity = day.schedule?.capacity || 1}
			{@const overbooked = booked > capacity}
			{@const publicHol = publicHolidayMap.get(dateStr)}
			{@const schoolHol = schoolHolidayMap.get(dateStr)}
			{@const mdEntries = allEntries.filter(e => (e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1) || (e.type === 'schedule-termin' && e.item.total_days && e.item.total_days > 1))}
			{@const sdEntries = allEntries.filter(e => !(e.type === 'inquiry' && e.item.total_days && e.item.total_days > 1) && !(e.type === 'schedule-termin' && e.item.total_days && e.item.total_days > 1))}
			{@const lanes = dayLaneMap.get(dateStr) ?? []}
			{@const sdCap = Math.max(2, 4 - lanes.length)}
			<button
				class="cal-cell"
				class:overflow={day.isOverflow}
				class:today={day.isToday}
				class:overbooked
				class:school-holiday={!!schoolHol}
				class:public-holiday={!!publicHol}
				class:drag-over={dragOverDate === dateStr}
				onclick={() => openDayPanel(day.schedule, null, day.dateStr)}
				ondragover={(e) => onCellDragOver(e, dateStr)}
				ondragleave={onCellDragLeave}
				ondrop={(e) => onCellDrop(e, dateStr)}
				oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
			>
				<div class="cal-cell-header">
					<span class="cal-date" class:cal-date-today={day.isToday}>{day.date}</span>
					{#if overbooked}<span class="cal-overbooked-icon" title="Überbucht">⚠</span>{/if}
					{#if publicHol}<span class="holiday-badge">🎉 {publicHol}</span>{/if}
				</div>
				{#if schoolHol}<div class="school-holiday-label">{schoolHol}</div>{/if}
	{#each lanes as laneId}
		{@const entry = mdEntries.find(e => e.type === 'inquiry' ? e.item.inquiry_id === laneId : ('calendar_item_id' in e.item && e.item.calendar_item_id === laneId))}
		{#if entry}
			{@const mdEntry = entry as ({type: 'inquiry'; item: InquiryItem} | {type: 'schedule-termin'; item: ScheduleCalendarItem})}
			{@const dayNum = mdEntry.item.day_number ?? 1}
			{@const totalDays = mdEntry.item.total_days ?? 1}
			{@const dow = new Date(dateStr + 'T00:00:00').getDay()}
			{@const isVisualStart = dayNum === 1 || dow === 1}
			{@const isVisualEnd = dayNum === totalDays || dow === 0}
			{@const isMultiDayInquiry = mdEntry.type === 'inquiry'}
			{@const barColor = isMultiDayInquiry ? inquiryEntryClass(mdEntry.item.status) : termineEntryClass(mdEntry.item.category)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="md-bar {barColor}"
				class:md-bar-start={isVisualStart}
				class:md-bar-end={isVisualEnd}
				title="{isMultiDayInquiry ? (mdEntry.item.customer_name ?? '') : mdEntry.item.title} · Tag {dayNum}/{totalDays}"
				draggable="true"
				ondragstart={(e) => onEntryDragStart(e, isMultiDayInquiry ? mdEntry.item.inquiry_id : mdEntry.item.calendar_item_id, isMultiDayInquiry ? 'inquiry' : 'termin', dateStr, ('day_number' in entry.item ? mdEntry.item.day_number : null) ?? 1)}
				onclick={(e) => isMultiDayInquiry ? openInquiryPanel(e, mdEntry.item) : openTerminPanel(e, { id: mdEntry.item.calendar_item_id, title: mdEntry.item.title, category: mdEntry.item.category, location: mdEntry.item.location, description: mdEntry.item.description ?? null, scheduled_date: dateStr, start_time: mdEntry.item.start_time, end_time: mdEntry.item.end_time ?? null, duration_hours: 0, status: 'scheduled' })}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && (isMultiDayInquiry ? openInquiryPanel(e as unknown as MouseEvent, mdEntry.item) : openTerminPanel(e as unknown as MouseEvent, { id: mdEntry.item.calendar_item_id, title: mdEntry.item.title, category: mdEntry.item.category, location: mdEntry.item.location, description: mdEntry.item.description ?? null, scheduled_date: dateStr, start_time: mdEntry.item.start_time, end_time: mdEntry.item.end_time ?? null, duration_hours: 0, status: 'scheduled' }))}
			>
				{#if isVisualStart}
					<span class="md-bar-text">{truncate(isMultiDayInquiry ? mdEntry.item.customer_name : mdEntry.item.title, 12)}</span>
				{:else}
					<span class="md-bar-text md-bar-cont">Tag {dayNum}/{totalDays}</span>
				{/if}
			</div>
		{:else}
			<div class="md-bar-spacer"></div>
		{/if}
	{/each}
					<div class="cal-entries">
						{#each sdEntries.slice(0, sdCap) as entry}
						{#if entry.type === 'inquiry'}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								class="cal-entry cal-entry-multiline {inquiryEntryClass(entry.item.status)}"
								title="{entry.item.customer_name ?? ''} · {entry.item.inquiry_id}{entry.item.departure_address || entry.item.arrival_address ? ' · ' + (entry.item.departure_address || '?') + ' → ' + (entry.item.arrival_address || '?') : ''}"
								draggable="true"
								ondragstart={(e) => onEntryDragStart(e, entry.item.inquiry_id, 'inquiry', dateStr)}
								onclick={(e) => openInquiryPanel(e, entry.item)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && openInquiryPanel(e as unknown as MouseEvent, entry.item)}
							>
								<span class="cal-entry-line"><span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.customer_name, 10)}</span>
								{#if entry.item.departure_address || entry.item.arrival_address}
									<span class="cal-entry-route">{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</span>
								{/if}
							</span>
						{:else if entry.type === 'termin'}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								class="cal-entry {termineEntryClass(entry.item.category)}"
								title="{entry.item.title}{entry.item.location ? ' @ ' + entry.item.location : ''}"
								draggable="true"
								ondragstart={(e) => onEntryDragStart(e, entry.item.id, 'termin', dateStr)}
								onclick={(e) => openTerminPanel(e, entry.item)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, entry.item)}
							>
								<span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.title, 14)}
							</span>
						{:else if entry.type === 'appointment'}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								class="cal-entry entry-appt"
								title="{apptKindLabel(entry.item.kind)}: {entry.item.customer_name ?? ''}{entry.item.assignee_name ? ' · ' + entry.item.assignee_name : ''}"
								draggable="true"
								ondragstart={(e) => onEntryDragStart(e, entry.item.appointment_id, 'appointment', dateStr, 1, entry.item.inquiry_id)}
								onclick={(e) => onAppointmentClick(e, entry.item)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && onAppointmentClick(e, entry.item)}
							>
								{#if entry.item.start_time}<span class="entry-time">{formatTime(entry.item.start_time)}</span>{/if}{truncate(apptKindLabel(entry.item.kind), 12)}
							</span>
						{:else}
							<!-- schedule-termin from schedule API -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<span
								class="cal-entry {termineEntryClass(entry.item.category)}"
								title="{entry.item.title}{entry.item.location ? ' @ ' + entry.item.location : ''}"
								draggable="true"
								ondragstart={(e) => onEntryDragStart(e, entry.item.calendar_item_id, 'termin', dateStr)}
								onclick={(e) => openTerminPanel(e, { id: entry.item.calendar_item_id, title: entry.item.title, category: entry.item.category, location: entry.item.location, description: entry.item.description ?? null, scheduled_date: dateStr, start_time: entry.item.start_time, end_time: entry.item.end_time ?? null, duration_hours: 0, status: 'scheduled' })}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && openTerminPanel(e as unknown as MouseEvent, { id: entry.item.calendar_item_id, title: entry.item.title, category: entry.item.category, location: entry.item.location, description: entry.item.description ?? null, scheduled_date: dateStr, start_time: entry.item.start_time, end_time: entry.item.end_time ?? null, duration_hours: 0, status: 'scheduled' })}
							>
								<span class="entry-time">{formatTime(entry.item.start_time)}</span>{truncate(entry.item.title, 14)}
							</span>
						{/if}
					{/each}
					{#if sdEntries.length > sdCap}
						<span class="cal-more">+{sdEntries.length - sdCap} mehr</span>
					{/if}
				</div>
			</button>
	{/each}
</div>

<style>
	/* ─── Calendar grid ────────────────────────────────────────────────────────── */
	.calendar-grid {
		display: grid;
		/* minmax(0, …) — a bare 1fr floors at min-content, so the long route lines
		   inside the cells widen every column and push FR/SA/SO past the grid's
		   overflow:hidden edge. Matches the week grid in +page.svelte. */
		grid-template-columns: 36px repeat(7, minmax(0, 1fr));
		gap: 0;
		background: var(--dt-surface-container);
		border-radius: var(--dt-radius-lg);
		overflow: hidden;
		box-shadow: var(--dt-shadow-ambient);
	}
	.cal-header {
		padding: 0.5rem;
		text-align: center;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container);
		text-transform: uppercase;
		border-right: 1px solid var(--dt-surface-container-high);
	}

	.cal-kw {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6rem;
		font-weight: 600;
		color: var(--dt-outline);
		background: var(--dt-surface-container);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		letter-spacing: 0.04em;
		border-right: 1px solid var(--dt-surface-container-high);
		border-bottom: 1px solid var(--dt-surface-container-high);
	}
	.cal-kw-header {
		background: var(--dt-surface-container);
	}

	.cal-cell {
		padding: 0.375rem 0.25rem 0.375rem 0.375rem;
		min-height: 80px;
		background: var(--dt-surface-container-lowest);
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		transition: background var(--dt-transition);
		cursor: pointer;
		text-align: left;
		width: 100%;
		/* flex/grid item: let it shrink below its content's min-content width so
		   the ellipsis on .cal-entry-line / .cal-entry-route actually kicks in */
		min-width: 0;
		border-right: 1px solid var(--dt-surface-container-high);
		border-bottom: 1px solid var(--dt-surface-container-high);
	}
	.cal-cell:hover { background: var(--dt-surface-container-low); }
	.cal-cell.empty { background: var(--dt-surface-container); cursor: default; pointer-events: none; }
	.cal-cell.overflow { background: var(--dt-surface-container); opacity: 0.55; }
	.cal-cell.overflow:hover { background: var(--dt-surface-container-low); opacity: 0.75; }
	.cal-cell.overflow .cal-date { color: var(--dt-outline); }
	.cal-cell.today { background: rgba(2, 36, 72, 0.06); }
	.cal-cell.today:hover { background: rgba(2, 36, 72, 0.10); }
	.cal-cell.overbooked { background: rgba(168, 57, 0, 0.06); }
	.cal-cell.overbooked:hover { background: rgba(168, 57, 0, 0.10); }
	.cal-cell.drag-over { background: rgba(2, 36, 72, 0.10); outline: 2px dashed var(--dt-primary); outline-offset: -2px; }
	.cal-cell.school-holiday { background: linear-gradient(135deg, #fffbeb, #fef9c3); }
	.cal-cell.public-holiday { background: linear-gradient(135deg, #fee2e2, #fecaca); }
	/* Public holiday takes precedence when both apply */
	.cal-cell.school-holiday.public-holiday { background: linear-gradient(135deg, #fee2e2, #fecaca); }

	.cal-entry[draggable="true"] { cursor: grab; }
	.cal-entry[draggable="true"]:active { cursor: grabbing; opacity: 0.6; }

	.cal-cell-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.125rem; }
	.cal-date { font-size: 0.8125rem; font-weight: 600; color: var(--dt-on-surface-variant); line-height: 1; }
	.cal-date-today { color: var(--dt-primary); font-weight: 700; }
	.cal-overbooked-icon { font-size: 0.65rem; color: var(--dt-secondary); line-height: 1; }

	.cal-entries { display: flex; flex-direction: column; gap: 2px; width: 100%; min-width: 0; }

	.cal-entry {
		display: block;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 4px;
		border-radius: var(--dt-radius-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.4;
		cursor: pointer;
		transition: opacity var(--dt-transition);
	}
	.cal-entry:hover { opacity: 0.8; }

	/* Inquiry entries additionally show a second, smaller line with the route
	   (full departure/arrival addresses) so it's visible without opening the panel. */
	.cal-entry.cal-entry-multiline {
		white-space: normal;
		overflow: visible;
		text-overflow: clip;
	}
	.cal-entry-line {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.cal-entry-route {
		display: block;
		font-size: 0.56rem;
		font-weight: 500;
		opacity: 0.85;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Entry colour classes — duplicated from the parent page (Svelte scopes styles
	   per-component, so these must exist here too for entries rendered by this grid). */
	.entry-yellow { background: rgba(2, 36, 72, 0.12); color: var(--dt-primary); }
	.entry-green  { background: #dcfce7; color: #14532d; }
	.entry-violet { background: #e0e7ff; color: #3730a3; }
	.entry-orange { background: #ffedd5; color: #9a3412; }
	.entry-blue   { background: #dbeafe; color: #1e40af; }
	.entry-pink   { background: #fce7f3; color: #9d174d; }
	.entry-appt   { background: #cffafe; color: #155e75; border-left: 3px solid #0891b2; }

	.entry-time {
		font-size: 0.6rem;
		font-weight: 700;
		opacity: 0.75;
		margin-right: 3px;
		font-variant-numeric: tabular-nums;
	}

	.cal-more { font-size: 0.6rem; color: var(--dt-on-surface-variant); font-weight: 500; padding: 1px 3px; }

	.holiday-badge {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		color: #991b1b;
		background: #fecaca;
		border-radius: 3px;
		padding: 0 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
	.school-holiday-label {
		font-size: 0.6rem;
		color: #92400e;
		opacity: 0.85;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0 2px 2px;
	}

	/* ─── Multi-day spanning bars (month view) ─────────────────────────────────── */
	.md-bar {
		display: block;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 0;
		white-space: nowrap;
		overflow: hidden;
		cursor: pointer;
		/* extend through cell padding AND the 1px cell border to fill edge-to-edge */
		margin: 1px calc(-0.25rem - 1px) 1px -0.375rem;
		border-radius: 0;
		min-height: 14px;
		transition: opacity var(--dt-transition);
	}
	.md-bar:hover { opacity: 0.8; }
	.md-bar.md-bar-start {
		margin-left: 1px;
		border-top-left-radius: 3px;
		border-bottom-left-radius: 3px;
	}
	.md-bar.md-bar-end {
		margin-right: 1px;
		border-top-right-radius: 3px;
		border-bottom-right-radius: 3px;
	}
	.md-bar.md-bar-start.md-bar-end {
		margin: 1px;
		border-radius: 3px;
	}
	.md-bar-text { padding-left: 5px; }
	.md-bar-cont { opacity: 0.7; font-style: italic; }
	.md-bar-spacer { display: block; min-height: 14px; margin: 1px calc(-0.25rem - 1px) 1px -0.375rem; }

	/* ─── Mobile: month grid (dots-only entries, see page-level media query for
	   the surrounding nav/page chrome) ───────────────────────────────────────── */
	@media (max-width: 768px) {
		.calendar-grid { min-width: unset; }
		.cal-cell { min-height: 52px; padding: 0.25rem 0.2rem; }
		.cal-header { font-size: 0.6875rem; padding: 0.3rem 0.1rem; }
		.cal-entry {
			width: 8px;
			height: 8px;
			border-radius: 50%;
			padding: 0;
			font-size: 0;
			flex-shrink: 0;
			min-width: 0;
		}
		.cal-entries { flex-direction: row; flex-wrap: wrap; gap: 2px; align-items: center; }
		.entry-time { display: none; }
		.cal-more { font-size: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--dt-outline-variant); padding: 0; }
		/* Keep inquiry entries as plain dots too — the route sub-line is desktop-only. */
		.cal-entry.cal-entry-multiline { white-space: nowrap; overflow: hidden; text-overflow: clip; }
		.cal-entry-route { display: none; }
	}

	@media (max-width: 600px) {
		.calendar-grid { min-width: unset; }
		.cal-cell { min-height: 52px; padding: 0.25rem; }
		.cal-header { font-size: 0.6rem; padding: 0.25rem 0.1rem; }
		.cal-entry { display: none; }
		.cal-entries::after { content: ''; }
		.cal-cell:has(.cal-entry) .cal-entries {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 2px;
			padding-top: 2px;
		}
		.cal-cell:has(.cal-entry) .cal-entries .cal-entry:first-child {
			display: block;
			width: 8px;
			height: 8px;
			border-radius: 50%;
			padding: 0;
			font-size: 0;
			flex-shrink: 0;
		}
	}
</style>
