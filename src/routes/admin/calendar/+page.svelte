<script lang="ts">
	import { apiGet, apiPut, apiPatch, apiPost } from '$lib/utils/api.svelte';
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

	const PRE_ACCEPTED = new Set(['pending', 'info_requested', 'estimating', 'estimated', 'offer_ready', 'offer_sent']);

	/**
	 * Returns the CSS class for an inquiry calendar entry based on its status.
	 *
	 * Called by: Template (calendar cell entry rendering)
	 * Purpose: Visually distinguishes pre-accepted inquiries (yellow) from accepted/operational ones (green)
	 *
	 * @param status - The inquiry status string
	 * @returns CSS class name string
	 */
	function inquiryEntryClass(status: string): string {
		return PRE_ACCEPTED.has(status) ? 'entry-yellow' : 'entry-green';
	}

	/**
	 * Returns the CSS class for a calendar item (Termin) entry based on its category.
	 *
	 * Called by: Template (calendar cell entry rendering)
	 * Purpose: Color-codes termine by category for at-a-glance visual differentiation
	 *
	 * @param category - The CalendarItem category string
	 * @returns CSS class name string
	 */
	function termineEntryClass(category: string): string {
		const map: Record<string, string> = {
			internal: 'entry-violet',
			maintenance: 'entry-orange',
			training: 'entry-blue',
			other: 'entry-pink'
		};
		return map[category] ?? 'entry-violet';
	}

	/**
	 * Returns the first 8 characters of a UUID for compact display.
	 *
	 * Called by: Template (inquiry entry short ID label)
	 * Purpose: Shows enough of the ID to identify an inquiry without overflowing narrow cell entries
	 *
	 * @param id - Full UUID string
	 * @returns First 8 characters of the ID
	 */
	function shortId(id: string): string {
		return id.slice(0, 8);
	}

	/**
	 * Truncates a string to a maximum length, appending an ellipsis if needed.
	 *
	 * Called by: Template (calendar cell entry label truncation)
	 * Purpose: Keeps entry labels within the narrow cell width without layout overflow
	 *
	 * @param s - The string to truncate, or null
	 * @param max - Maximum character length before truncation
	 * @returns Truncated string or '—' if null/empty
	 */
	function truncate(s: string | null, max: number): string {
		if (!s) return '—';
		return s.length > max ? s.slice(0, max - 1) + '…' : s;
	}

	let currentDate = $state(new Date());
	let schedule = $state<DaySchedule[]>([]);
	let calendarItems = $state<CalendarItem[]>([]);
	let loading = $state(true);
	let selectedDay = $state<DaySchedule | null>(null);
	let selectedDayItems = $state<CalendarItem[]>([]);
	let capacityInput = $state('');
	let savingCapacity = $state(false);

	// Drag-and-drop state
	let draggingId = $state<string | null>(null);
	let draggingType = $state<'inquiry' | 'termin' | null>(null);
	let draggingFromDate = $state<string | null>(null);
	let dragOverDate = $state<string | null>(null);

	// Context menu
	let contextMenu = $state<{ x: number; y: number; dateStr: string } | null>(null);

	// Quick-create mode: 'inquiry' | 'termin' | null
	let quickCreateMode = $state<'inquiry' | 'termin' | null>(null);
	let quickCreateDate = $state('');
	let quickCreateLoading = $state(false);
	let quickCreateError = $state('');

	// Quick-inquiry form fields
	let qiCustomerMode = $state<'existing' | 'new'>('existing');
	let qiCustomerSearch = $state('');
	let qiCustomerResults = $state<{ id: string; name: string | null; email: string }[]>([]);
	let qiCustomerSearching = $state(false);
	let qiCustomerId = $state<string | null>(null);
	let qiCustomerLabel = $state('');
	let qiEmail = $state('');
	let qiName = $state('');
	let qiPhone = $state('');
	let qiOriginStreet = $state('');
	let qiOriginCity = $state('');
	let qiOriginPostal = $state('');
	let qiDestStreet = $state('');
	let qiDestCity = $state('');
	let qiDestPostal = $state('');
	let qiNotes = $state('');

	// Quick-termin form fields
	let qtTitle = $state('');
	let qtCategory = $state('internal');
	let qtLocation = $state('');
	let qtDuration = $state(8);
	let qtCustomerMode = $state<'none' | 'existing' | 'new'>('none');
	let qtCustomerSearch = $state('');
	let qtCustomerResults = $state<{ id: string; name: string | null; email: string }[]>([]);
	let qtCustomerSearching = $state(false);
	let qtCustomerId = $state<string | null>(null);
	let qtCustomerLabel = $state('');
	let qtNewCustEmail = $state('');
	let qtNewCustName = $state('');
	let qtNewCustPhone = $state('');

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

	/**
	 * Initiates a drag operation for an inquiry entry.
	 *
	 * Called by: Template (ondragstart on inquiry cal-entry span)
	 * Purpose: Records which inquiry is being dragged and from which date so the drop
	 *          handler knows what to reschedule and can skip no-op drops.
	 *
	 * @param e - The DragEvent
	 * @param inquiryId - UUID of the inquiry being dragged
	 * @param fromDate - ISO date string (YYYY-MM-DD) of the source cell
	 */
	function onEntryDragStart(e: DragEvent, id: string, type: 'inquiry' | 'termin', fromDate: string) {
		draggingId = id;
		draggingType = type;
		draggingFromDate = fromDate;
		e.dataTransfer!.effectAllowed = 'move';
	}

	/**
	 * Allows a calendar cell to accept a drop and highlights it.
	 *
	 * Called by: Template (ondragover on cal-cell)
	 * Purpose: Prevents the default browser behaviour (which disallows drops) and sets
	 *          dragOverDate so the hovered cell gets a visual highlight class.
	 *
	 * @param e - The DragEvent
	 * @param dateStr - ISO date string of the target cell
	 */
	function onCellDragOver(e: DragEvent, dateStr: string) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
		dragOverDate = dateStr;
	}

	/**
	 * Clears the drag-over highlight when the dragged item leaves a cell.
	 *
	 * Called by: Template (ondragleave on cal-cell)
	 * Purpose: Removes the visual drop-target highlight when the cursor exits a cell.
	 */
	function onCellDragLeave() {
		dragOverDate = null;
	}

	/**
	 * Handles dropping an inquiry onto a target date cell and persists the new date.
	 *
	 * Called by: Template (ondrop on cal-cell)
	 * Purpose: PATCHes the inquiry's preferred_date to the drop target date via
	 *          PATCH /api/v1/inquiries/{id}, then reloads the schedule so the calendar
	 *          reflects the move immediately. No-ops if dropped on the same date.
	 *
	 * @param e - The DragEvent
	 * @param dateStr - ISO date string (YYYY-MM-DD) of the target cell
	 */
	async function onCellDrop(e: DragEvent, dateStr: string) {
		e.preventDefault();
		dragOverDate = null;
		const id = draggingId;
		const type = draggingType;
		const fromDate = draggingFromDate;
		draggingId = null;
		draggingType = null;
		draggingFromDate = null;
		if (!id || fromDate === dateStr) return;
		try {
			if (type === 'termin') {
				await apiPatch(`/api/v1/admin/calendar-items/${id}`, { scheduled_date: dateStr });
			} else {
				await apiPatch(`/api/v1/inquiries/${id}`, { preferred_date: dateStr });
			}
			showToast('Termin verschoben', 'success');
			await loadSchedule();
		} catch (err) {
			showToast((err as Error).message, 'error');
		}
	}

	/**
	 * Opens the right-click context menu anchored to the cursor position.
	 *
	 * Called by: Template (oncontextmenu on cal-cell)
	 * Purpose: Shows a mini popup with "Anfrage erstellen" / "Termin erstellen" options
	 *          pre-seeded with the clicked date so the forms open with the date pre-filled.
	 *
	 * @param e - The MouseEvent from right-click
	 * @param dateStr - ISO date string of the clicked cell
	 */
	function onCellContextMenu(e: MouseEvent, dateStr: string) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, dateStr };
	}

	/**
	 * Closes the context menu.
	 *
	 * Called by: Template (onclick on backdrop, onkeydown Escape)
	 * Purpose: Hides the floating context menu without taking any action.
	 */
	function closeContextMenu() {
		contextMenu = null;
	}

	/**
	 * Opens a quick-create form for the given type, pre-seeded with the context menu date.
	 *
	 * Called by: Template (context menu option click)
	 * Purpose: Transitions from the context menu to the appropriate creation form,
	 *          carrying the target date across so Alex doesn't have to re-enter it.
	 *
	 * @param mode - 'inquiry' or 'termin'
	 */
	function openQuickCreate(mode: 'inquiry' | 'termin') {
		quickCreateDate = contextMenu!.dateStr;
		contextMenu = null;
		quickCreateMode = mode;
		quickCreateError = '';
		// Reset fields
		qiCustomerMode = 'existing'; qiCustomerSearch = ''; qiCustomerResults = []; qiCustomerId = null; qiCustomerLabel = '';
		qiEmail = ''; qiName = ''; qiPhone = '';
		qiOriginStreet = ''; qiOriginCity = ''; qiOriginPostal = '';
		qiDestStreet = ''; qiDestCity = ''; qiDestPostal = '';
		qiNotes = '';
		qtTitle = ''; qtCategory = 'internal'; qtLocation = ''; qtDuration = 8;
		qtCustomerMode = 'none'; qtCustomerSearch = ''; qtCustomerResults = []; qtCustomerId = null; qtCustomerLabel = '';
		qtNewCustEmail = ''; qtNewCustName = ''; qtNewCustPhone = '';
	}

	/**
	 * Searches for existing customers for the inquiry quick-create customer field.
	 *
	 * Called by: Template (oninput on customer search in inquiry form)
	 * Purpose: Lets Alex find and link an existing customer to the new inquiry.
	 *
	 * @param q - Search query string
	 */
	async function searchQiCustomers(q: string) {
		if (q.trim().length < 2) { qiCustomerResults = []; return; }
		qiCustomerSearching = true;
		try {
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			qiCustomerResults = res.customers;
		} catch { qiCustomerResults = []; }
		finally { qiCustomerSearching = false; }
	}

	/**
	 * Creates a customer (if new mode selected) then an inquiry via the API, and reloads the calendar.
	 *
	 * Called by: Template (form submit in quick-inquiry modal)
	 * Purpose: Allows Alex to quickly schedule a new inquiry directly from the calendar
	 *          without navigating to the inquiry list. Volume is intentionally omitted —
	 *          it is added later on the inquiry detail page.
	 *
	 * @returns void
	 */
	async function submitQuickInquiry() {
		if (!qiOriginStreet.trim() || !qiOriginCity.trim()) { quickCreateError = 'Auszugsadresse (Straße, Stadt) erforderlich'; return; }
		if (!qiDestStreet.trim() || !qiDestCity.trim()) { quickCreateError = 'Einzugsadresse (Straße, Stadt) erforderlich'; return; }
		if (qiCustomerMode === 'existing' && !qiCustomerId) { quickCreateError = 'Bitte einen Kunden auswählen'; return; }
		if (qiCustomerMode === 'new' && !qiEmail.trim()) { quickCreateError = 'E-Mail ist erforderlich'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			let customerId = qiCustomerId;
			if (qiCustomerMode === 'new') {
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qiEmail.trim(),
					name: qiName.trim() || null,
					phone: qiPhone.trim() || null,
				});
				customerId = c.id;
			}
			await apiPost('/api/v1/inquiries', {
				customer_id: customerId,
				preferred_date: quickCreateDate,
				origin: {
					street: qiOriginStreet.trim(),
					city: qiOriginCity.trim(),
					postal_code: qiOriginPostal.trim() || null,
				},
				destination: {
					street: qiDestStreet.trim(),
					city: qiDestCity.trim(),
					postal_code: qiDestPostal.trim() || null,
				},
				notes: qiNotes.trim() || null,
			});
			showToast('Anfrage erstellt', 'success');
			quickCreateMode = null;
			await loadSchedule();
		} catch (err) {
			quickCreateError = (err as Error).message;
		} finally {
			quickCreateLoading = false;
		}
	}

	/**
	 * Searches for existing customers for the termin quick-create customer field.
	 *
	 * Called by: Template (oninput on customer search in termin form)
	 * Purpose: Lets Alex find and link an existing customer to the new Termin.
	 *
	 * @param q - Search query string
	 */
	async function searchQtCustomers(q: string) {
		if (q.trim().length < 2) { qtCustomerResults = []; return; }
		qtCustomerSearching = true;
		try {
			const res = await apiGet<{ customers: { id: string; name: string | null; email: string }[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			qtCustomerResults = res.customers;
		} catch { qtCustomerResults = []; }
		finally { qtCustomerSearching = false; }
	}

	/**
	 * Creates a calendar item (Termin) via the API and reloads the calendar.
	 * Creates a new customer first if qtCustomerMode === 'new'.
	 *
	 * Called by: Template (form submit in quick-termin modal)
	 * Purpose: Allows Alex to schedule internal events directly from the calendar grid,
	 *          optionally linking to an existing or new customer.
	 *
	 * @returns void
	 */
	async function submitQuickTermin() {
		if (!qtTitle.trim()) { quickCreateError = 'Titel ist erforderlich'; return; }
		quickCreateError = '';
		quickCreateLoading = true;
		try {
			let customerId: string | null = qtCustomerId;
			if (qtCustomerMode === 'new') {
				if (!qtNewCustEmail.trim()) { quickCreateError = 'E-Mail ist erforderlich'; return; }
				const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
					email: qtNewCustEmail.trim(),
					name: qtNewCustName.trim() || null,
					phone: qtNewCustPhone.trim() || null,
				});
				customerId = c.id;
			}
			await apiPost('/api/v1/admin/calendar-items', {
				title: qtTitle.trim(),
				category: qtCategory,
				location: qtLocation.trim() || null,
				scheduled_date: quickCreateDate,
				duration_hours: qtDuration,
				customer_id: customerId,
			});
			showToast('Termin erstellt', 'success');
			quickCreateMode = null;
			await loadSchedule();
		} catch (err) {
			quickCreateError = (err as Error).message;
		} finally {
			quickCreateLoading = false;
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
					{@const dayInquiries = day.schedule?.inquiries || []}
					{@const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`}
					{@const dayTermine = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dateStr))}
					{@const totalCount = dayInquiries.length + dayTermine.length}
					{@const booked = day.schedule?.booked || 0}
					{@const capacity = day.schedule?.capacity || 1}
					{@const overbooked = booked > capacity}
					<button
						class="cal-cell"
						class:today={day.isToday}
						class:overbooked
						class:drag-over={dragOverDate === dateStr}
						onclick={() => selectDay(day.schedule, day.date)}
						ondragover={(e) => onCellDragOver(e, dateStr)}
						ondragleave={onCellDragLeave}
						ondrop={(e) => onCellDrop(e, dateStr)}
						oncontextmenu={(e) => onCellContextMenu(e, dateStr)}
					>
						<div class="cal-cell-header">
							<span class="cal-date" class:cal-date-today={day.isToday}>{day.date}</span>
							{#if overbooked}<span class="cal-overbooked-icon" title="Überbucht">⚠</span>{/if}
						</div>
						<div class="cal-entries">
							{#each dayInquiries.slice(0, 4) as inq}
								<span
									class="cal-entry {inquiryEntryClass(inq.status)}"
									title="{inq.customer_name ?? ''} · {inq.inquiry_id}"
									draggable="true"
									ondragstart={(e) => onEntryDragStart(e, inq.inquiry_id, 'inquiry', dateStr)}
									role="button"
									tabindex="0"
								>
									{truncate(inq.customer_name, 14)} <span class="entry-id">{shortId(inq.inquiry_id)}</span>
								</span>
							{/each}
							{#each dayTermine.slice(0, Math.max(0, 4 - dayInquiries.length)) as ci}
								<span
									class="cal-entry {termineEntryClass(ci.category)}"
									title="{ci.title}{ci.location ? ' @ ' + ci.location : ''}"
									draggable="true"
									ondragstart={(e) => onEntryDragStart(e, ci.id, 'termin', dateStr)}
									role="button"
									tabindex="0"
								>
									{truncate(ci.title, 16)}
								</span>
							{/each}
							{#if totalCount > 4}
								<span class="cal-more">+{totalCount - 4} mehr</span>
							{/if}
						</div>
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

{#if contextMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="ctx-backdrop" onclick={closeContextMenu} onkeydown={(e) => e.key === 'Escape' && closeContextMenu()}></div>
	<div class="ctx-menu" style="left:{contextMenu.x}px;top:{contextMenu.y}px;">
		<button class="ctx-item" onclick={() => openQuickCreate('inquiry')}>
			<span class="ctx-icon">📋</span> Anfrage erstellen
		</button>
		<button class="ctx-item" onclick={() => openQuickCreate('termin')}>
			<span class="ctx-icon">📅</span> Termin erstellen
		</button>
	</div>
{/if}

{#if quickCreateMode === 'inquiry'}
	<div class="modal-backdrop modal-backdrop-clear" onclick={(e) => { if (e.target === e.currentTarget) quickCreateMode = null; }} onkeydown={(e) => { if (e.key === 'Escape') quickCreateMode = null; }} role="dialog" tabindex="-1">
		<div class="modal modal-wide">
			<h3>Neue Anfrage — {quickCreateDate}</h3>

			<div class="qc-section-label">Kunde *</div>
			{#if qiCustomerId}
				<div class="qt-customer-badge">
					<span>{qiCustomerLabel}</span>
					<button class="qt-customer-remove" onclick={() => { qiCustomerId = null; qiCustomerLabel = ''; qiCustomerSearch = ''; }}>×</button>
				</div>
			{:else}
				<div class="qc-customer-tabs">
					<button class="tab-sm" class:tab-sm-active={qiCustomerMode === 'existing'} onclick={() => qiCustomerMode = 'existing'}>Suchen</button>
					<button class="tab-sm" class:tab-sm-active={qiCustomerMode === 'new'} onclick={() => qiCustomerMode = 'new'}>Neu</button>
				</div>
				{#if qiCustomerMode === 'existing'}
					<div class="qc-row" style="flex-direction:column;gap:0.25rem">
						<input type="text" bind:value={qiCustomerSearch} oninput={(e) => searchQiCustomers((e.target as HTMLInputElement).value)} placeholder="Name oder E-Mail..." />
						{#if qiCustomerSearching}<span style="font-size:0.75rem;color:#94a3b8">Suche...</span>{/if}
						{#if qiCustomerResults.length > 0}
							<div class="qt-results">
								{#each qiCustomerResults as c}
									<button class="qt-result-item" onclick={() => { qiCustomerId = c.id; qiCustomerLabel = c.name ?? c.email; qiCustomerResults = []; }}>
										<span class="cr-name">{c.name ?? c.email}</span>
										{#if c.name}<span class="cr-email">{c.email}</span>{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qi-email">E-Mail *</label>
							<input id="qi-email" type="email" bind:value={qiEmail} placeholder="kunde@example.com" />
						</div>
					</div>
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qi-name">Name</label>
							<input id="qi-name" type="text" bind:value={qiName} placeholder="Max Mustermann" />
						</div>
						<div class="qc-field">
							<label for="qi-phone">Telefon</label>
							<input id="qi-phone" type="tel" bind:value={qiPhone} placeholder="+49 ..." />
						</div>
					</div>
				{/if}
			{/if}

			<div class="qc-section-label">Auszug *</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-os">Straße</label>
					<input id="qi-os" type="text" bind:value={qiOriginStreet} placeholder="Musterstraße 1" />
				</div>
				<div class="qc-field">
					<label for="qi-op">PLZ</label>
					<input id="qi-op" type="text" bind:value={qiOriginPostal} placeholder="31134" style="width:90px" />
				</div>
				<div class="qc-field qc-field-grow">
					<label for="qi-oc">Stadt</label>
					<input id="qi-oc" type="text" bind:value={qiOriginCity} placeholder="Hildesheim" />
				</div>
			</div>

			<div class="qc-section-label">Einzug *</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-ds">Straße</label>
					<input id="qi-ds" type="text" bind:value={qiDestStreet} placeholder="Zielstraße 2" />
				</div>
				<div class="qc-field">
					<label for="qi-dp">PLZ</label>
					<input id="qi-dp" type="text" bind:value={qiDestPostal} placeholder="31134" style="width:90px" />
				</div>
				<div class="qc-field qc-field-grow">
					<label for="qi-dc">Stadt</label>
					<input id="qi-dc" type="text" bind:value={qiDestCity} placeholder="Hannover" />
				</div>
			</div>

			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qi-notes">Notizen</label>
					<textarea id="qi-notes" bind:value={qiNotes} placeholder="Besonderheiten..." rows="2"></textarea>
				</div>
			</div>

			{#if quickCreateError}<p class="qc-error">{quickCreateError}</p>{/if}
			<div class="qc-actions">
				<button class="btn btn-secondary" onclick={() => quickCreateMode = null}>Abbrechen</button>
				<button class="btn btn-primary" onclick={submitQuickInquiry} disabled={quickCreateLoading}>
					{quickCreateLoading ? 'Wird erstellt...' : 'Anfrage erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if quickCreateMode === 'termin'}
	<div class="modal-backdrop modal-backdrop-clear" onclick={(e) => { if (e.target === e.currentTarget) quickCreateMode = null; }} onkeydown={(e) => { if (e.key === 'Escape') quickCreateMode = null; }} role="dialog" tabindex="-1">
		<div class="modal">
			<h3>Neuer Termin — {quickCreateDate}</h3>

			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qt-title">Titel *</label>
					<input id="qt-title" type="text" bind:value={qtTitle} placeholder="z.B. Fahrerschulung" />
				</div>
			</div>
			<div class="qc-row">
				<div class="qc-field">
					<label for="qt-cat">Kategorie</label>
					<select id="qt-cat" bind:value={qtCategory}>
						<option value="internal">Intern</option>
						<option value="maintenance">Wartung</option>
						<option value="training">Schulung</option>
						<option value="other">Sonstiges</option>
					</select>
				</div>
				<div class="qc-field">
					<label for="qt-dur">Dauer (h)</label>
					<input id="qt-dur" type="number" min="0.5" step="0.5" bind:value={qtDuration} style="width:80px" />
				</div>
			</div>
			<div class="qc-row">
				<div class="qc-field qc-field-grow">
					<label for="qt-loc">Ort</label>
					<input id="qt-loc" type="text" bind:value={qtLocation} placeholder="optional" />
				</div>
			</div>

			<div class="qc-section-label">Kunde (optional)</div>
			{#if qtCustomerId}
				<div class="qt-customer-badge">
					<span>{qtCustomerLabel}</span>
					<button class="qt-customer-remove" onclick={() => { qtCustomerId = null; qtCustomerLabel = ''; qtCustomerMode = 'none'; }}>×</button>
				</div>
			{:else}
				<div class="qc-customer-tabs">
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'none'} onclick={() => qtCustomerMode = 'none'}>Kein Kunde</button>
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'existing'} onclick={() => qtCustomerMode = 'existing'}>Suchen</button>
					<button class="tab-sm" class:tab-sm-active={qtCustomerMode === 'new'} onclick={() => qtCustomerMode = 'new'}>Neu</button>
				</div>
				{#if qtCustomerMode === 'existing'}
					<div class="qc-row" style="flex-direction:column;gap:0.25rem">
						<input type="text" bind:value={qtCustomerSearch} oninput={(e) => searchQtCustomers((e.target as HTMLInputElement).value)} placeholder="Name oder E-Mail..." />
						{#if qtCustomerSearching}<span style="font-size:0.75rem;color:#94a3b8">Suche...</span>{/if}
						{#if qtCustomerResults.length > 0}
							<div class="qt-results">
								{#each qtCustomerResults as c}
									<button class="qt-result-item" onclick={() => { qtCustomerId = c.id; qtCustomerLabel = c.name ?? c.email; qtCustomerResults = []; }}>
										<span class="cr-name">{c.name ?? c.email}</span>
										{#if c.name}<span class="cr-email">{c.email}</span>{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{:else if qtCustomerMode === 'new'}
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qtc-email">E-Mail *</label>
							<input id="qtc-email" type="email" bind:value={qtNewCustEmail} placeholder="kunde@example.com" />
						</div>
					</div>
					<div class="qc-row">
						<div class="qc-field qc-field-grow">
							<label for="qtc-name">Name</label>
							<input id="qtc-name" type="text" bind:value={qtNewCustName} placeholder="Max Mustermann" />
						</div>
						<div class="qc-field">
							<label for="qtc-phone">Telefon</label>
							<input id="qtc-phone" type="tel" bind:value={qtNewCustPhone} placeholder="+49 ..." />
						</div>
					</div>
				{/if}
			{/if}

			{#if quickCreateError}<p class="qc-error">{quickCreateError}</p>{/if}
			<div class="qc-actions">
				<button class="btn btn-secondary" onclick={() => quickCreateMode = null}>Abbrechen</button>
				<button class="btn btn-primary" onclick={submitQuickTermin} disabled={quickCreateLoading}>
					{quickCreateLoading ? 'Wird erstellt...' : 'Termin erstellen'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page { max-width: 1100px; }
	.page-header { margin-bottom: 1.5rem; }
	.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }

	.cal-nav { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1.5rem; }
	.cal-nav button { display: flex; align-items: center; color: #64748b; padding: 0.375rem; border-radius: 8px; transition: color 150ms; }
	.cal-nav button:hover { color: #1a1a2e; }
	.month-label { font-size: 1.125rem; font-weight: 600; color: #1a1a2e; min-width: 200px; text-align: center; text-transform: capitalize; }

	.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff; }
	.cal-header { padding: 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: #64748b; background: #f8fafc; text-transform: uppercase; }

	/* Cell base */
	.cal-cell {
		padding: 0.375rem 0.25rem 0.375rem 0.375rem;
		min-height: 80px;
		background: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		transition: background 150ms;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}
	.cal-cell:hover { background: #f8fafc; }
	.cal-cell.empty { background: #f1f5f9; cursor: default; pointer-events: none; }
	.cal-cell.today { background: #eef2ff; }
	.cal-cell.today:hover { background: #e0e7ff; }
	.cal-cell.overbooked { background: #fff7ed; }
	.cal-cell.overbooked:hover { background: #ffedd5; }
	.cal-cell.drag-over { background: #e0e7ff; outline: 2px dashed #6366f1; outline-offset: -2px; }

	.cal-entry[draggable="true"] { cursor: grab; }
	.cal-entry[draggable="true"]:active { cursor: grabbing; opacity: 0.6; }

	/* Date number row */
	.cal-cell-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.125rem; }
	.cal-date { font-size: 0.8125rem; font-weight: 600; color: #64748b; line-height: 1; }
	.cal-date-today { color: #4f46e5; }
	.cal-overbooked-icon { font-size: 0.65rem; color: #ea580c; line-height: 1; }

	/* Entry rows */
	.cal-entries { display: flex; flex-direction: column; gap: 2px; width: 100%; }

	.cal-entry {
		display: block;
		font-size: 0.6rem;
		font-weight: 600;
		padding: 2px 4px;
		border-radius: 3px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		line-height: 1.4;
	}

	/* Inquiry: pre-accepted — yellow */
	.entry-yellow { background: #fef9c3; color: #713f12; }
	/* Inquiry: accepted and beyond — green */
	.entry-green { background: #dcfce7; color: #14532d; }
	/* Termine: internal — indigo */
	.entry-violet { background: #e0e7ff; color: #3730a3; }
	/* Termine: maintenance — orange */
	.entry-orange { background: #ffedd5; color: #9a3412; }
	/* Termine: training — blue */
	.entry-blue { background: #dbeafe; color: #1e40af; }
	/* Termine: other — pink */
	.entry-pink { background: #fce7f3; color: #9d174d; }

	.entry-id { font-weight: 400; opacity: 0.7; font-size: 0.55rem; }

	.cal-more { font-size: 0.6rem; color: #94a3b8; font-weight: 500; padding: 1px 3px; }

	/* Modal */
	.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 500; }
	.modal { background: #ffffff; border: none; border-radius: 16px; box-shadow: 10px 10px 30px #d1d9e6, -10px -10px 30px #ffffff; padding: 1.5rem; width: 90%; max-width: 440px; max-height: 80vh; overflow-y: auto; }
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
	.item-entry { background: #fffbeb; border-radius: 6px; padding: 0.5rem 0.625rem; margin-bottom: 0.375rem; }
	.cat-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; background: #fde68a; color: #92400e; padding: 0.1rem 0.35rem; border-radius: 4px; }

	/* Quick-create: transparent backdrop so calendar stays visible */
	.modal-backdrop-clear { background: transparent; backdrop-filter: none; align-items: flex-start; justify-content: flex-end; padding: 1rem; pointer-events: none; }
	.modal-backdrop-clear .modal { pointer-events: all; margin-top: 3rem; box-shadow: 8px 8px 24px rgba(0,0,0,0.18), -4px -4px 12px #ffffff; }

	/* Context menu */
	.ctx-backdrop { position: fixed; inset: 0; z-index: 600; }
	.ctx-menu { position: fixed; z-index: 601; background: #fff; border-radius: 10px; box-shadow: 4px 4px 16px #d1d9e6, -2px -2px 8px #ffffff; padding: 0.25rem; min-width: 200px; }
	.ctx-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; border-radius: 7px; font-size: 0.875rem; color: #334155; text-align: left; transition: background 120ms; }
	.ctx-item:hover { background: #f1f5f9; }
	.ctx-icon { font-size: 1rem; }

	/* Quick-create forms */
	.modal-wide { max-width: 560px; }
	.qc-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #6366f1; margin: 0.75rem 0 0.25rem; letter-spacing: 0.05em; }
	.qc-section-label:first-of-type { margin-top: 0; }
	.qc-row { display: flex; gap: 0.5rem; margin-bottom: 0.375rem; flex-wrap: wrap; }
	.qc-field { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.qc-field-grow { flex: 1; }
	.qc-field label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
	.qc-field input, .qc-field select, .qc-field textarea {
		padding: 0.4rem 0.6rem; background: #e8ecf1; border: none; border-radius: 7px;
		box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff;
		color: #1a1a2e; font-size: 0.8125rem; outline: none; width: 100%; font-family: inherit;
	}
	.qc-field input:focus, .qc-field select:focus, .qc-field textarea:focus {
		box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff, 0 0 0 2px #6366f1;
	}
	.qc-field textarea { resize: vertical; }
	.qc-error { font-size: 0.8rem; color: #dc2626; margin: 0.5rem 0 0; }
	.qc-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
	.btn-secondary { background: #e8ecf1; color: #475569; box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff; }
	.btn-secondary:hover { background: #dde3ea; }

	.qc-customer-tabs { display: flex; gap: 0.25rem; margin-bottom: 0.375rem; }
	.tab-sm { padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 6px; color: #64748b; background: #f1f5f9; }
	.tab-sm-active { background: #e0e7ff; color: #4338ca; font-weight: 600; }
	.qt-results { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-top: 0.25rem; }
	.qt-result-item { display: flex; flex-direction: column; width: 100%; padding: 0.375rem 0.6rem; text-align: left; border-bottom: 1px solid #f1f5f9; }
	.qt-result-item:last-child { border-bottom: none; }
	.qt-result-item:hover { background: #f8fafc; }
	.qt-customer-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.6rem; background: #e0e7ff; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; color: #3730a3; margin-bottom: 0.25rem; }
	.qt-customer-remove { font-size: 1rem; color: #6366f1; padding: 0 0.125rem; line-height: 1; }
	.cr-name { font-size: 0.8125rem; font-weight: 500; color: #1e293b; }
	.cr-email { font-size: 0.7rem; color: #64748b; }
	.qc-row input[type="text"]:not(.qc-field input) { width: 100%; padding: 0.4rem 0.6rem; background: #e8ecf1; border: none; border-radius: 7px; box-shadow: inset 2px 2px 4px #d1d9e6, inset -2px -2px 4px #ffffff; font-size: 0.8125rem; outline: none; }

	@media (max-width: 768px) {
		.page-header { flex-wrap: wrap; }
		.cal-nav button { min-height: 44px; min-width: 44px; justify-content: center; }
		.calendar-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
		.calendar-grid { min-width: 560px; }
		.cal-cell { min-height: 64px; }
		.cal-header { padding: 0.375rem 0.25rem; }
	}
</style>
