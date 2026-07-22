<script lang="ts">
	import { formatTime } from '$lib/utils/format';
	import type { CalendarDay } from '$lib/utils/calendar';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
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

<div class="agenda-list">
	{#each monthDays as day (day.dateStr)}
		{@const dateStr = day.dateStr}
		{@const entries = buildDayEntries(dateStr)}
		{@const publicHol = publicHolidayMap.get(dateStr)}
		{@const schoolHol = schoolHolidayMap.get(dateStr)}
		{@const booked = day.schedule?.booked ?? 0}
		{@const capacity = day.schedule?.capacity ?? 1}
		{@const overbooked = booked > capacity}
		<div class="agenda-day" class:agenda-today={day.isToday}>
			<div class="agenda-day-header">
				<span class="agenda-day-name">{weekdayShort(dateStr)}</span>
				<span class="agenda-day-num" class:agenda-day-num-today={day.isToday}>{day.date}.</span>
				{#if booked > 0}
					<span class="agenda-cap-badge" class:agenda-cap-over={overbooked}>{booked}/{capacity}</span>
				{/if}
				{#if publicHol}<span class="holiday-badge">🎉 {publicHol}</span>{/if}
				{#if schoolHol}<span class="school-holiday-label">{schoolHol}</span>{/if}
			</div>

			{#if entries.length === 0}
				<div class="agenda-empty">—</div>
			{:else}
				<div class="agenda-entries">
					{#each entries as entry}
						{#if entry.type === 'inquiry'}
							<button class="agenda-card {inquiryEntryClass(entry.item.status)}" onclick={(e) => openInquiryPanel(e, entry.item)}>
								<div class="ac-row">
									<span class="ac-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
									<StatusBadge status={entry.item.status} />
								</div>
								<div class="ac-title">{truncate(entry.item.customer_name, 40)}</div>
								{#if entry.item.departure_address || entry.item.arrival_address}
									<div class="ac-sub">{entry.item.departure_address || '?'} → {entry.item.arrival_address || '?'}</div>
								{/if}
								{#if entry.item.employees_assigned}
									<div class="ac-crew">👥 {entry.item.employees_assigned}</div>
								{/if}
							</button>
						{:else if entry.type === 'appointment'}
							<button class="agenda-card entry-appt" onclick={(e) => onAppointmentClick(e, entry.item)}>
								<div class="ac-row">
									{#if entry.item.start_time}<span class="ac-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>{/if}
									<span class="ac-kind">{apptKindLabel(entry.item.kind)}</span>
								</div>
								<div class="ac-title">{truncate(entry.item.customer_name, 40)}</div>
								{#if entry.item.assignee_name}
									<div class="ac-crew">👤 {entry.item.assignee_name}</div>
								{/if}
							</button>
						{:else if entry.type === 'schedule-termin'}
							<button
								class="agenda-card {termineEntryClass(entry.item.category)}"
								onclick={(e) => openTerminPanel(e, { id: entry.item.calendar_item_id, title: entry.item.title, category: entry.item.category, location: entry.item.location, description: entry.item.description ?? null, scheduled_date: dateStr, start_time: entry.item.start_time, end_time: entry.item.end_time ?? null, duration_hours: 0, status: 'scheduled' })}
							>
								<div class="ac-row">
									<span class="ac-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
								</div>
								<div class="ac-title">{truncate(entry.item.title, 40)}</div>
								{#if entry.item.location}
									<div class="ac-sub">📍 {entry.item.location}</div>
								{/if}
								{#if entry.item.employees_assigned}
									<div class="ac-crew">👥 {entry.item.employees_assigned}</div>
								{/if}
							</button>
						{:else}
							<!-- 'termin' type: never actually produced by buildDayEntries, kept for type completeness -->
							<button
								class="agenda-card {termineEntryClass(entry.item.category)}"
								onclick={(e) => openTerminPanel(e, entry.item)}
							>
								<div class="ac-row">
									<span class="ac-time">{formatTime(entry.item.start_time)}{entry.item.end_time ? '–' + formatTime(entry.item.end_time) : ''}</span>
								</div>
								<div class="ac-title">{truncate(entry.item.title, 40)}</div>
								{#if entry.item.location}
									<div class="ac-sub">📍 {entry.item.location}</div>
								{/if}
							</button>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.agenda-list {
		display: flex;
		flex-direction: column;
	}

	.agenda-day + .agenda-day {
		border-top: 1px solid var(--dt-surface-container-high);
	}

	.agenda-day-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 0.25rem 0.375rem;
		flex-wrap: wrap;
	}
	.agenda-today .agenda-day-header { background: rgba(2, 36, 72, 0.06); border-radius: var(--dt-radius-sm); }

	.agenda-day-name {
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dt-on-surface-variant);
	}
	.agenda-day-num {
		font-size: 1rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}
	.agenda-day-num-today { color: var(--dt-primary); }

	.agenda-cap-badge {
		margin-left: auto;
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-high);
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
	}
	.agenda-cap-over { background: rgba(168, 57, 0, 0.15); color: var(--dt-secondary); }

	.agenda-empty {
		padding: 0 0.25rem 0.75rem;
		font-size: 0.75rem;
		color: var(--dt-outline-variant);
	}

	.agenda-entries {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0 0.25rem 0.75rem;
	}

	.agenda-card {
		display: flex;
		flex-direction: column;
		gap: 3px;
		border-radius: var(--dt-radius-sm);
		padding: 0.55rem 0.65rem;
		text-align: left;
		width: 100%;
		min-height: 44px;
		cursor: pointer;
		transition: box-shadow var(--dt-transition);
	}
	.agenda-card:hover { box-shadow: var(--dt-shadow-ambient); }

	/* Entry colour classes — duplicated from the parent page (Svelte scopes styles
	   per-component, so these must exist here too for cards rendered by this list). */
	.entry-yellow { background: rgba(2, 36, 72, 0.12); color: var(--dt-primary); }
	.entry-green  { background: #dcfce7; color: #14532d; }
	.entry-violet { background: #e0e7ff; color: #3730a3; }
	.entry-orange { background: #ffedd5; color: #9a3412; }
	.entry-blue   { background: #dbeafe; color: #1e40af; }
	.entry-pink   { background: #fce7f3; color: #9d174d; }
	.entry-appt   { background: #cffafe; color: #155e75; border-left: 3px solid #0891b2; }

	.holiday-badge {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		color: #991b1b;
		background: #fecaca;
		border-radius: 3px;
		padding: 0 4px;
	}
	.school-holiday-label {
		font-size: 0.6rem;
		color: #92400e;
		opacity: 0.85;
	}

	.ac-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
	.ac-time {
		font-size: 0.7rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}
	.ac-kind { font-size: 0.7rem; font-weight: 700; opacity: 0.85; }
	.ac-title {
		font-size: 0.85rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ac-sub {
		font-size: 0.7rem;
		opacity: 0.75;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ac-crew { font-size: 0.7rem; opacity: 0.8; }
</style>
