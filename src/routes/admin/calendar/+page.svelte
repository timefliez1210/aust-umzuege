<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { ChevronLeft, ChevronRight, Check, X, Trash2, Plus } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface BookingItem {
		id: string;
		quote_id: string | null;
		customer_name: string | null;
		customer_email: string | null;
		description: string | null;
		status: string;
	}

	interface DaySchedule {
		date: string;
		bookings: BookingItem[];
		availability: {
			capacity: number;
			booked: number;
			available: boolean;
			remaining: number;
		};
	}

	let currentDate = $state(new Date());
	let schedule = $state<DaySchedule[]>([]);
	let loading = $state(true);
	let selectedDay = $state<DaySchedule | null>(null);
	let capacityInput = $state('');
	let savingCapacity = $state(false);

	// Create booking form
	let showCreateForm = $state(false);
	let newBooking = $state({ customer_name: '', customer_email: '', description: '' });
	let creatingBooking = $state(false);

	let year = $derived(currentDate.getFullYear());
	let month = $derived(currentDate.getMonth());
	let monthName = $derived(
		new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(currentDate)
	);

	let calendarDays = $derived(buildCalendar(year, month, schedule));

	function buildCalendar(y: number, m: number, sched: DaySchedule[]) {
		const first = new Date(y, m, 1);
		const startDay = (first.getDay() + 6) % 7; // Monday=0
		const daysInMonth = new Date(y, m + 1, 0).getDate();
		const schedMap = new Map(sched.map((d) => [d.date.split('T')[0], d]));

		const days: { date: number | null; key: string; schedule: DaySchedule | null; isToday: boolean }[] = [];
		const today = new Date().toISOString().split('T')[0];

		for (let i = 0; i < startDay; i++) {
			days.push({ date: null, key: `empty-${i}`, schedule: null, isToday: false });
		}

		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			days.push({
				date: d,
				key: dateStr,
				schedule: schedMap.get(dateStr) || null,
				isToday: dateStr === today
			});
		}

		return days;
	}

	$effect(() => {
		loadSchedule();
	});

	async function loadSchedule() {
		loading = true;
		try {
			const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
			const lastDay = new Date(year, month + 1, 0).getDate();
			const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
			const res = await apiGet<DaySchedule[] | { dates: DaySchedule[] }>(`/api/v1/calendar/schedule?from=${from}&to=${to}`);
			schedule = Array.isArray(res) ? res : (res.dates || []);
		} catch {
			schedule = [];
		} finally {
			loading = false;
		}
	}

	function prevMonth() {
		currentDate = new Date(year, month - 1, 1);
		loadSchedule();
	}

	function nextMonth() {
		currentDate = new Date(year, month + 1, 1);
		loadSchedule();
	}

	function selectDay(day: DaySchedule | null, dateNum: number | null) {
		if (!dateNum) return;
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`;
		selectedDay = day || { date: dateStr, bookings: [], availability: { capacity: 1, booked: 0, available: true, remaining: 1 } };
		capacityInput = String(selectedDay.availability.capacity);
		showCreateForm = false;
		newBooking = { customer_name: '', customer_email: '', description: '' };
	}

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

	async function createBooking() {
		if (!selectedDay) return;
		creatingBooking = true;
		try {
			const dateStr = selectedDay.date.split('T')[0];
			await apiPost('/api/v1/calendar/bookings', {
				booking_date: dateStr,
				customer_name: newBooking.customer_name || null,
				customer_email: newBooking.customer_email || null,
				description: newBooking.description || null,
			});
			showToast('Buchung erstellt', 'success');
			showCreateForm = false;
			newBooking = { customer_name: '', customer_email: '', description: '' };
			await loadSchedule();
			const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
			if (updated) selectedDay = updated;
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			creatingBooking = false;
		}
	}

	async function confirmBooking(bookingId: string) {
		if (!selectedDay) return;
		try {
			await apiPatch(`/api/v1/calendar/bookings/${bookingId}`, { status: 'confirmed' });
			showToast('Buchung bestaetigt', 'success');
			const dateStr = selectedDay.date.split('T')[0];
			await loadSchedule();
			const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
			if (updated) selectedDay = updated;
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function cancelBooking(bookingId: string) {
		if (!selectedDay) return;
		try {
			await apiPatch(`/api/v1/calendar/bookings/${bookingId}`, { status: 'cancelled' });
			showToast('Buchung storniert', 'success');
			const dateStr = selectedDay.date.split('T')[0];
			await loadSchedule();
			const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
			if (updated) selectedDay = updated;
		} catch (e) {
			showToast((e as Error).message, 'error');
		}
	}

	async function deleteBooking(bookingId: string) {
		if (!selectedDay) return;
		if (!confirm('Buchung unwiderruflich loeschen?')) return;
		try {
			await apiDelete(`/api/v1/calendar/bookings/${bookingId}`);
			showToast('Buchung geloescht', 'success');
			const dateStr = selectedDay.date.split('T')[0];
			await loadSchedule();
			const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
			if (updated) selectedDay = updated;
			else selectedDay = null;
		} catch (e) {
			showToast((e as Error).message, 'error');
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
					{@const booked = day.schedule?.availability?.booked || 0}
					{@const capacity = day.schedule?.availability?.capacity || 1}
					{@const full = booked >= capacity}
					{@const overbooked = booked > capacity}
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
					</button>
				{/if}
			{/each}
		</div>
	</div>
</div>

{#if selectedDay}
	<div class="modal-backdrop" onclick={() => (selectedDay = null)} onkeydown={(e) => { if (e.key === 'Escape') selectedDay = null; }} role="dialog" tabindex="-1">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="document">
			<h3>{new Date(selectedDay.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>

			<div class="modal-section">
				<label>Kapazitaet</label>
				<div class="capacity-row">
					<input type="number" min="0" max="10" bind:value={capacityInput} />
					<button class="btn btn-primary" onclick={saveCapacity} disabled={savingCapacity}>
						{savingCapacity ? 'Speichern...' : 'Speichern'}
					</button>
				</div>
			</div>

			<div class="modal-section">
				<div class="section-header">
					<label>Buchungen ({selectedDay.bookings.length})</label>
					<button class="btn-icon" onclick={() => showCreateForm = !showCreateForm} title="Neue Buchung">
						<Plus size={16} />
					</button>
				</div>

				{#if showCreateForm}
					<div class="create-form">
						<input type="text" placeholder="Kundenname" bind:value={newBooking.customer_name} />
						<input type="email" placeholder="E-Mail" bind:value={newBooking.customer_email} />
						<input type="text" placeholder="Beschreibung" bind:value={newBooking.description} />
						<button class="btn btn-primary" onclick={createBooking} disabled={creatingBooking}>
							{creatingBooking ? 'Erstellen...' : 'Buchung erstellen'}
						</button>
					</div>
				{/if}

				{#if selectedDay.bookings.length > 0}
					{#each selectedDay.bookings as booking}
						<div class="booking-item">
							<div class="booking-info">
								<span class="booking-name">{booking.customer_name || booking.customer_email || 'Unbekannt'}</span>
								<StatusBadge status={booking.status} />
							</div>
							{#if booking.description}
								<span class="booking-notes">{booking.description}</span>
							{/if}
							<div class="booking-actions">
								{#if booking.status !== 'confirmed'}
									<button class="btn-icon btn-confirm" onclick={() => confirmBooking(booking.id)} title="Bestaetigen">
										<Check size={14} />
									</button>
								{/if}
								{#if booking.status !== 'cancelled'}
									<button class="btn-icon btn-cancel" onclick={() => cancelBooking(booking.id)} title="Stornieren">
										<X size={14} />
									</button>
								{/if}
								<button class="btn-icon btn-delete" onclick={() => deleteBooking(booking.id)} title="Loeschen">
									<Trash2 size={14} />
								</button>
							</div>
						</div>
					{/each}
				{:else if !showCreateForm}
					<p class="text-muted">Keine Buchungen</p>
				{/if}
			</div>
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
	.modal-section label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.375rem; text-transform: uppercase; }
	.capacity-row { display: flex; gap: 0.5rem; align-items: center; }
	.capacity-row input { width: 80px; padding: 0.5rem 0.75rem; background: #e8ecf1; border: none; border-radius: 8px; box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff; color: #1a1a2e; font-size: 0.875rem; outline: none; }
	.capacity-row input:focus { box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px #6366f1; }

	.btn { padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 500; transition: all 150ms; }
	.btn-primary { background: #6366f1; color: #fff; }
	.btn-primary:hover:not(:disabled) { background: #4f46e5; }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.section-header { display: flex; align-items: center; justify-content: space-between; }
	.section-header label { margin-bottom: 0; }

	.btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: none; background: #e8ecf1; color: #64748b; cursor: pointer; transition: all 150ms; box-shadow: 2px 2px 4px #d1d9e6, -2px -2px 4px #ffffff; }
	.btn-icon:hover { color: #1a1a2e; box-shadow: 3px 3px 6px #d1d9e6, -3px -3px 6px #ffffff; }
	.btn-confirm:hover { color: #16a34a; }
	.btn-cancel:hover { color: #f59e0b; }
	.btn-delete:hover { color: #ef4444; }

	.create-form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px; }
	.create-form input { padding: 0.5rem 0.75rem; background: #e8ecf1; border: none; border-radius: 8px; box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff; color: #1a1a2e; font-size: 0.875rem; outline: none; }
	.create-form input:focus { box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2); }

	.booking-item { padding: 0.625rem 0; border-bottom: 1px solid #f1f5f9; }
	.booking-item:last-child { border-bottom: none; }
	.booking-info { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
	.booking-name { font-size: 0.875rem; color: #334155; font-weight: 500; }
	.booking-status-badge { font-size: 0.6875rem; font-weight: 600; padding: 0.125rem 0.5rem; border-radius: 9999px; text-transform: capitalize; }
	.booking-status-badge.confirmed { background: #dcfce7; color: #16a34a; }
	.booking-status-badge.pending, .booking-status-badge.tentative { background: #fef3c7; color: #d97706; }
	.booking-status-badge.cancelled { background: #fee2e2; color: #dc2626; }
	.booking-notes { display: block; font-size: 0.75rem; color: #94a3b8; margin-bottom: 0.25rem; }
	.booking-actions { display: flex; gap: 0.375rem; }
	.text-muted { color: #94a3b8; font-size: 0.875rem; }

	@media (max-width: 768px) {
		.page-header { flex-wrap: wrap; }

		.cal-nav button { min-height: 44px; min-width: 44px; justify-content: center; }

		.calendar-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
		.calendar-grid { min-width: 500px; }

		.cal-cell { padding: 0.375rem 0.25rem; min-height: 56px; }
		.cal-header { padding: 0.375rem 0.25rem; }
	}
</style>
