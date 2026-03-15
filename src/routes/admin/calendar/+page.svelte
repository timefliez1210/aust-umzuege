<script lang="ts">
	import { apiGet, apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { buildCalendar } from '$lib/utils/calendar';
	import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface InquiryItem {
		inquiry_id: string;
		customer_name: string | null;
		departure_address: string | null;
		arrival_address: string | null;
		volume_m3: number | null;
		status: string;
		offer_price_cents: number | null;
	}

	interface CalendarItem {
		id: string;
		title: string;
		category: string;
		location: string | null;
		scheduled_date: string;
		duration_hours: number;
		status: string;
	}

	interface DaySchedule {
		date: string;
		available: boolean;
		capacity: number;
		booked: number;
		remaining: number;
		inquiries: InquiryItem[];
	}

	const CATEGORY_LABELS: Record<string, string> = {
		internal: 'Intern',
		maintenance: 'Wartung',
		training: 'Schulung',
		other: 'Sonstiges'
	};

	let currentDate = $state(new Date());
	let schedule = $state<DaySchedule[]>([]);
	let calendarItems = $state<CalendarItem[]>([]);
	let loading = $state(true);
	let selectedDay = $state<DaySchedule | null>(null);
	let selectedDayItems = $state<CalendarItem[]>([]);
	let capacityInput = $state('');
	let savingCapacity = $state(false);

	let year = $derived(currentDate.getFullYear());
	let month = $derived(currentDate.getMonth());
	let monthName = $derived(
		new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(currentDate)
	);

	let calendarDays = $derived(buildCalendar(year, month, schedule));

	$effect(() => {
		loadSchedule();
	});

	/**
	 * Fetches the inquiry schedule for the currently displayed calendar month.
	 *
	 * Called by: $effect (on mount and whenever currentDate changes), prevMonth, nextMonth, saveCapacity
	 * Purpose: Requests the full month's day schedules from
	 *          GET /api/v1/calendar/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD and stores them
	 *          so the calendar grid and day-detail modal stay consistent with server state.
	 *
	 * @returns void
	 */
	async function loadSchedule() {
		loading = true;
		try {
			const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
			const lastDay = new Date(year, month + 1, 0).getDate();
			const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
			const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
			const [schedRes, itemsRes] = await Promise.all([
				apiGet<DaySchedule[] | { dates: DaySchedule[] }>(`/api/v1/calendar/schedule?from=${from}&to=${to}`),
				apiGet<CalendarItem[]>(`/api/v1/admin/calendar-items?month=${monthStr}`).catch(() => [])
			]);
			schedule = Array.isArray(schedRes) ? schedRes : (schedRes.dates || []);
			calendarItems = Array.isArray(itemsRes) ? itemsRes : [];
		} catch {
			schedule = [];
			calendarItems = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Navigates the calendar view to the previous month and reloads its schedule.
	 *
	 * Called by: Template (left chevron navigation button click)
	 * Purpose: Moves currentDate back by one month, which reactively updates the derived
	 *          year, month, and monthName values and triggers a fresh schedule load.
	 *
	 * @returns void
	 */
	function prevMonth() {
		currentDate = new Date(year, month - 1, 1);
		loadSchedule();
	}

	/**
	 * Navigates the calendar view to the next month and reloads its schedule.
	 *
	 * Called by: Template (right chevron navigation button click)
	 * Purpose: Moves currentDate forward by one month, which reactively updates the derived
	 *          year, month, and monthName values and triggers a fresh schedule load.
	 *
	 * @returns void
	 */
	function nextMonth() {
		currentDate = new Date(year, month + 1, 1);
		loadSchedule();
	}

	/**
	 * Opens the day-detail modal for a calendar cell, synthesising a default schedule if none exists.
	 *
	 * Called by: Template (calendar cell button click)
	 * Purpose: Sets selectedDay to the existing DaySchedule for the clicked date or to a
	 *          default object with capacity 1 and zero inquiries when the API returned no data
	 *          for that day. Also seeds capacityInput.
	 *
	 * @param day - The DaySchedule from the API for this date, or null if no data exists
	 * @param dateNum - The day-of-month number (1–31), or null for a padding cell
	 * @returns void
	 */
	function selectDay(day: DaySchedule | null, dateNum: number | null) {
		if (!dateNum) return;
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
		selectedDay = day || { date: dateStr, inquiries: [], available: true, capacity: 1, booked: 0, remaining: 1 };
		capacityInput = String(selectedDay.capacity);
		selectedDayItems = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dateStr));
	}

	/**
	 * Persists the capacity override for the currently selected day to the API.
	 *
	 * Called by: Template ("Speichern" button click in the capacity section of the day modal)
	 * Purpose: PUTs the new integer capacity value to PUT /api/v1/calendar/capacity/{date},
	 *          then reloads the schedule and updates selectedDay so the capacity badge in
	 *          the calendar cell and modal reflect the change immediately.
	 *
	 * @returns void
	 */
	async function saveCapacity() {
		if (!selectedDay) return;
		savingCapacity = true;
		try {
			const dateStr = selectedDay.date.split('T')[0];
			await apiPut(`/api/v1/calendar/capacity/${dateStr}`, {
				capacity: parseInt(capacityInput) || 1
			});
			showToast('Kapazitaet gespeichert', 'success');
			await loadSchedule();
			// Update selectedDay from refreshed schedule
			const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
			if (updated) selectedDay = updated;
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			savingCapacity = false;
		}
	}

	const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<div class="page">
	<div class="page-header">
		<h1>Kalender</h1>
	</div>

	<div class="cal-nav">
		<button onclick={prevMonth}><ChevronLeft size={20} /></button>
		<span class="month-label">{monthName}</span>
		<button onclick={nextMonth}><ChevronRight size={20} /></button>
	</div>

	<div class="calendar-scroll">
		<div class="calendar-grid">
			{#each weekdays as day}
				<div class="cal-header">{day}</div>
			{/each}

			{#each calendarDays as day}
				{#if day.date === null}
					<div class="cal-cell empty"></div>
				{:else}
					{@const booked = day.schedule?.booked || 0}
					{@const capacity = day.schedule?.capacity || 1}
					{@const full = booked >= capacity}
					{@const overbooked = booked > capacity}
					{@const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`}
					{@const dayItems = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dateStr))}
					<button
						class="cal-cell"
						class:today={day.isToday}
						class:has-bookings={booked > 0}
						class:full
						class:overbooked
						onclick={() => selectDay(day.schedule, day.date)}
					>
						<span class="cal-date">{day.date}</span>
						{#if booked > 0}
							<span class="cal-count">{#if overbooked}&#9888;&#xFE0F; {/if}{booked}/{capacity}</span>
						{/if}
						{#if dayItems.length > 0}
							<span class="cal-items-dot" title="{dayItems.length} Termin(e)">{dayItems.length} T</span>
						{/if}
					</button>
				{/if}
			{/each}
		</div>
	</div>
</div>

{#if selectedDay}
	<div class="modal-backdrop" onclick={(e) => { if (e.target === e.currentTarget) selectedDay = null; }} onkeydown={(e) => { if (e.key === 'Escape') selectedDay = null; }} role="dialog" tabindex="-1">
		<div class="modal">
			<h3>{new Date(selectedDay.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>

			<div class="modal-section">
				<label for="capacity-input">Kapazitaet</label>
				<div class="capacity-row">
					<input id="capacity-input" type="number" min="0" max="10" bind:value={capacityInput} />
					<button class="btn btn-primary" onclick={saveCapacity} disabled={savingCapacity}>
						{savingCapacity ? 'Speichern...' : 'Speichern'}
					</button>
				</div>
			</div>

			<div class="modal-section">
				<span class="modal-label">Auftraege ({selectedDay.inquiries.length})</span>

				{#if selectedDay.inquiries.length > 0}
					{#each selectedDay.inquiries as inq}
						<div class="booking-item">
							<div class="booking-info">
								<a href="/admin/inquiries/{inq.inquiry_id}" class="booking-link">
									<span class="booking-name">{inq.customer_name || 'Unbekannt'}</span>
									<ExternalLink size={12} />
								</a>
								<StatusBadge status={inq.status} />
							</div>
							{#if inq.departure_address || inq.arrival_address}
								<span class="booking-route">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
							{/if}
							{#if inq.volume_m3 || inq.offer_price_cents}
								<div class="booking-details">
									{#if inq.volume_m3}
										<span class="booking-detail">📦 {inq.volume_m3.toFixed(1)} m³</span>
									{/if}
									{#if inq.offer_price_cents}
										<span class="booking-detail">💰 {(inq.offer_price_cents / 100 * 1.19).toFixed(0)} € brutto</span>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				{:else}
					<p class="text-muted">Keine Auftraege</p>
				{/if}
			</div>

			{#if selectedDayItems.length > 0}
				<div class="modal-section">
					<span class="modal-label">Termine ({selectedDayItems.length})</span>
					{#each selectedDayItems as ci}
						<div class="booking-item item-entry">
							<div class="booking-info">
								<a href="/admin/calendar-items/{ci.id}" class="booking-link">
									<span class="booking-name">{ci.title}</span>
									<ExternalLink size={12} />
								</a>
								<span class="cat-badge">{CATEGORY_LABELS[ci.category] ?? ci.category}</span>
							</div>
							{#if ci.location}
								<span class="booking-route">{ci.location}</span>
							{/if}
							<div class="booking-details">
								<span class="booking-detail">&#x23F1; {ci.duration_hours.toFixed(1)} h</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.page { max-width: 900px; }
	.page-header { margin-bottom: 1.5rem; }
	.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }

	.cal-nav { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1.5rem; }
	.cal-nav button { display: flex; align-items: center; color: #64748b; padding: 0.375rem; border-radius: 8px; transition: color 150ms; }
	.cal-nav button:hover { color: #1a1a2e; }
	.month-label { font-size: 1.125rem; font-weight: 600; color: #1a1a2e; min-width: 200px; text-align: center; text-transform: capitalize; }

	.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e2e8f0; border: none; border-radius: 12px; overflow: hidden; box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff; }
	.cal-header { padding: 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: #64748b; background: #f8fafc; text-transform: uppercase; }
	.cal-cell { padding: 0.75rem 0.5rem; min-height: 72px; background: #ffffff; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; transition: background 150ms; }
	.cal-cell:not(.empty) { cursor: pointer; }
	.cal-cell:not(.empty):hover { background: #f8fafc; }
	.cal-cell.empty { background: #f1f5f9; }
	.cal-cell.today { background: #eef2ff; }
	.cal-cell.today:hover { background: #e0e7ff; }
	.cal-date { font-size: 0.875rem; font-weight: 500; color: #334155; }
	.cal-count { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.375rem; border-radius: 9999px; }
	.has-bookings .cal-count { background: #dbeafe; color: #2563eb; }
	.full .cal-count { background: #fee2e2; color: #dc2626; }
	.overbooked { background: #fef3c7; }
	.overbooked:hover { background: #fde68a; }
	.overbooked .cal-count { background: #fbbf24; color: #92400e; }

	.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 500; }
	.modal { background: #ffffff; border: none; border-radius: 16px; box-shadow: 10px 10px 30px #d1d9e6, -10px -10px 30px #ffffff; padding: 1.5rem; width: 90%; max-width: 400px; }
	.modal h3 { font-size: 1rem; font-weight: 600; color: #1a1a2e; margin-bottom: 1rem; text-transform: capitalize; }
	.modal-section { margin-bottom: 1rem; }
	.modal-section label, .modal-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.375rem; text-transform: uppercase; }
	.capacity-row { display: flex; gap: 0.5rem; align-items: center; }
	.capacity-row input { width: 80px; padding: 0.5rem 0.75rem; background: #e8ecf1; border: none; border-radius: 8px; box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff; color: #1a1a2e; font-size: 0.875rem; outline: none; }
	.capacity-row input:focus { box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px #6366f1; }

	.btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; transition: all 150ms; }
	.btn-primary { background: #6366f1; color: #fff; }
	.btn-primary:hover:not(:disabled) { background: #4f46e5; }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.booking-item { padding: 0.625rem 0; border-bottom: 1px solid #f1f5f9; }
	.booking-item:last-child { border-bottom: none; }
	.booking-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
	.booking-name { font-size: 0.875rem; color: #334155; font-weight: 500; }
	.booking-link { display: inline-flex; align-items: center; gap: 0.25rem; color: #4338ca; text-decoration: none; font-size: 0.875rem; font-weight: 500; }
	.booking-link:hover { color: #3730a3; text-decoration: underline; }
	.booking-route { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.125rem; }
	.booking-details { display: flex; gap: 0.75rem; margin-bottom: 0.25rem; }
	.booking-detail { font-size: 0.75rem; color: #475569; font-weight: 500; }
	.text-muted { color: #94a3b8; font-size: 0.875rem; }

	.cal-items-dot { font-size: 0.6rem; font-weight: 700; background: #fde68a; color: #92400e; padding: 0.1rem 0.3rem; border-radius: 4px; }
	.item-entry { background: #fffbeb; border-radius: 6px; padding: 0.5rem 0.625rem; margin-bottom: 0.375rem; }
	.cat-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #fde68a; color: #92400e; padding: 0.1rem 0.35rem; border-radius: 4px; }

	@media (max-width: 768px) {
		.page-header { flex-wrap: wrap; }

		.cal-nav button { min-height: 44px; min-width: 44px; justify-content: center; }

		.calendar-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
		.calendar-grid { min-width: 500px; }

		.cal-cell { padding: 0.375rem 0.25rem; min-height: 56px; }
		.cal-header { padding: 0.375rem 0.25rem; }
	}
</style>
