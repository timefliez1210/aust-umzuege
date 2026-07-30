<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workerGet, workerFetch } from '$lib/stores/worker.svelte';
	import { normalizeTime } from '$lib/utils/time';
	import { ArrowLeft, MapPin, Users, Clock, ClipboardList, Phone } from 'lucide-svelte';

	interface AppointmentDetail {
		appointment_id: string;
		inquiry_id: string;
		job_date: string | null;
		status: string;
		kind: string;
		start_time: string | null;
		end_time: string | null;
		description: string | null;
		location: string | null;
		address_street: string | null;
		address_house_number: string | null;
		address_city: string | null;
		address_postal_code: string | null;
		address_floor: string | null;
		address_elevator: boolean | null;
		customer_name: string | null;
		customer_phone: string | null;
		notes: string | null;
		employee_notes: string | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_break_minutes: number | null;
		employee_actual_hours: number | null;
		colleague_names: string[];
	}

	let appt = $state<AppointmentDetail | null>(null);
	let loading = $state(true);

	// Clock-in/out editing state
	let clockIn = $state('');
	let clockOut = $state('');
	let breakMin = $state('');
	let clockSaving = $state(false);
	let clockSaved = $state(false);

	$effect(() => {
		const id = $page.params.id;
		if (id) loadAppt(id);
	});

	/**
	 * Loads the Zusatztermin detail from the API.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Fetches GET /employee/appointments/{id} (single day, no ?date).
	 *
	 * @param id - Appointment UUID from the URL
	 */
	async function loadAppt(id: string) {
		loading = true;
		try {
			appt = await workerGet<AppointmentDetail>(`/api/v1/employee/appointments/${id}`);
			clockIn  = appt.employee_clock_in  ? isoToLocalTime(appt.employee_clock_in)  : '';
			clockOut = appt.employee_clock_out ? isoToLocalTime(appt.employee_clock_out) : '';
			breakMin = appt.employee_break_minutes != null ? String(appt.employee_break_minutes) : '';
		} catch {
			appt = null;
		} finally {
			loading = false;
		}
	}

	/**
	 * Saves the employee's self-reported clock-in and clock-out times.
	 *
	 * Called by: Template (Speichern button in Meine Zeiten section).
	 * Purpose: PATCHes /employee/appointments/{id}/clock with the employee's own times.
	 */
	async function saveClockTimes() {
		if (!appt) return;
		clockSaving = true;
		try {
			const anchorDate = appt.job_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
			// Movers type "7.30" / "730" / "7" on a phone keypad — normalize before
			// building a timezone-correct ISO timestamp from the local wall-clock time.
			const toIso = (t: string) => {
				const norm = normalizeTime(t);
				return norm ? new Date(`${anchorDate}T${norm}:00`).toISOString() : null;
			};

			await workerFetch(`/api/v1/employee/appointments/${appt.appointment_id}/clock`, {
				method: 'PATCH',
				body: JSON.stringify({
					employee_clock_in:  clockIn  ? toIso(clockIn)  : null,
					employee_clock_out: clockOut ? toIso(clockOut) : null,
					employee_break_minutes: breakMin ? parseInt(breakMin, 10) : null,
				}),
			});
			clockSaved = true;
			setTimeout(() => (clockSaved = false), 2000);
			await loadAppt(appt.appointment_id);
		} catch {
			// silent — user can retry
		} finally {
			clockSaving = false;
		}
	}

	/** Extracts HH:MM from an ISO datetime string using local time. */
	function isoToLocalTime(iso: string): string {
		const d = new Date(iso);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	/** Formats a date string to a German long-form date. */
	function fmtDate(d: string | null): string {
		if (!d) return 'Datum unbekannt';
		return new Date(d + 'T12:00:00').toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	/** Formats a HH:MM:SS time string to HH:MM, or "" when absent. */
	function hhmm(t: string | null): string {
		return t ? t.slice(0, 5) : '';
	}

	/** The Zusatztermin's own address: structured line if present, else free-text. */
	const addressLine = $derived.by(() => {
		if (!appt) return null;
		if (appt.address_street) {
			const street = [appt.address_street, appt.address_house_number].filter(Boolean).join(' ');
			const city = [appt.address_postal_code, appt.address_city].filter(Boolean).join(' ');
			return [street, city].filter(Boolean).join(', ');
		}
		return appt.location;
	});

	/** Human-readable title from the free-text kind. */
	function kindLabel(k: string): string {
		return k ? k.charAt(0).toUpperCase() + k.slice(1) : 'Zusatztermin';
	}
</script>

<svelte:head>
	<title>Zusatztermin | Aust Mitarbeiter</title>
</svelte:head>

<div class="back-row">
	<button class="back-btn" onclick={() => goto('/worker/schedule')}>
		<ArrowLeft size={18} />
		Zurück
	</button>
</div>

{#if loading}
	<div class="empty">Laden...</div>
{:else if !appt}
	<div class="empty">Zusatztermin nicht gefunden.</div>
{:else}
	<h1 class="job-date">{fmtDate(appt.job_date)}</h1>
	<div class="title-row">
		<span class="badge badge-appt">Zusatztermin</span>
		<h2 class="item-title">{kindLabel(appt.kind)}</h2>
	</div>

	<!-- Time -->
	{#if hhmm(appt.start_time)}
		<div class="section">
			<h2 class="section-title"><Clock size={15} /> Beginn</h2>
			<div class="time-chip">
				{hhmm(appt.start_time)}{hhmm(appt.end_time) ? `–${hhmm(appt.end_time)}` : ''} Uhr
			</div>
		</div>
	{/if}

	<!-- Location -->
	{#if addressLine}
		<div class="section">
			<h2 class="section-title"><MapPin size={15} /> Ort</h2>
			<div class="address-card">
				<div class="address-line">{addressLine}</div>
				{#if appt.address_floor}
					<div class="address-sub">Etage: {appt.address_floor}{appt.address_elevator ? ' · Aufzug' : ''}</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Task / description -->
	{#if appt.description}
		<div class="section">
			<h2 class="section-title"><ClipboardList size={15} /> Aufgabe</h2>
			<p class="description">{appt.description}</p>
		</div>
	{/if}

	<!-- Customer contact -->
	{#if appt.customer_name || appt.customer_phone}
		<div class="section">
			<h2 class="section-title"><Phone size={15} /> Kontakt</h2>
			<div class="address-card">
				{#if appt.customer_name}<div class="address-line">{appt.customer_name}</div>{/if}
				{#if appt.customer_phone}<a class="phone-link" href={`tel:${appt.customer_phone}`}>{appt.customer_phone}</a>{/if}
			</div>
		</div>
	{/if}

	<!-- Team -->
	{#if appt.colleague_names.length > 0}
		<div class="section">
			<h2 class="section-title"><Users size={15} /> Team</h2>
			<div class="team-list">
				{#each appt.colleague_names as name}
					<span class="team-chip">{name}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- My Times — employee self-reported clock-in/out -->
	<div class="section">
		<h2 class="section-title"><Clock size={15} /> Meine Zeiten</h2>

		{#if appt.employee_actual_hours !== null}
			<div class="hours-row">
				<span>Gearbeitet</span><strong>{appt.employee_actual_hours.toFixed(1)} h</strong>
			</div>
		{/if}

		<div class="clock-form">
			<div class="clock-row">
				<label for="clock-in">Beginn</label>
				<input
					id="clock-in"
					type="text"
					inputmode="decimal"
					placeholder="z.B. 8 oder 7.30"
					maxlength="5"
					class="clock-input"
					bind:value={clockIn}
					onblur={() => { const n = normalizeTime(clockIn); if (n) clockIn = n; }}
				/>
			</div>
			<div class="clock-row">
				<label for="clock-out">Ende</label>
				<input
					id="clock-out"
					type="text"
					inputmode="decimal"
					placeholder="z.B. 17 oder 17.00"
					maxlength="5"
					class="clock-input"
					bind:value={clockOut}
					onblur={() => { const n = normalizeTime(clockOut); if (n) clockOut = n; }}
				/>
			</div>
			<div class="clock-row">
				<label for="break-min">Pause (Min.)</label>
				<input
					id="break-min"
					type="text"
					inputmode="numeric"
					placeholder="30"
					maxlength="3"
					pattern="[0-9]*"
					class="clock-input"
					bind:value={breakMin}
				/>
			</div>
			<button
				class="btn-save"
				class:saved={clockSaved}
				onclick={saveClockTimes}
				disabled={clockSaving}
			>
				{clockSaving ? '...' : clockSaved ? 'Gespeichert ✓' : 'Zeiten speichern'}
			</button>
		</div>

		{#if appt.notes}
			<p class="notes">{appt.notes}</p>
		{/if}

		{#if appt.employee_notes}
			<div class="employee-notes-box">
				<div class="employee-notes-label">Hinweise vom Büro</div>
				<p class="employee-notes-text">{appt.employee_notes}</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		background: none;
		border: none;
		color: #64748b;
		font-size: 0.9375rem;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1rem;
	}

	.back-btn:hover { color: #1e293b; }

	.job-date {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}

	.item-title {
		font-size: 1.0625rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
	}

	.badge-appt { background: #cffafe; color: #155e75; }

	.section {
		margin-bottom: 1.5rem;
	}

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.625rem;
	}

	.time-chip {
		display: inline-block;
		background: #cffafe;
		color: #155e75;
		font-size: 0.9375rem;
		font-weight: 600;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
	}

	.address-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.625rem;
		padding: 0.875rem 1rem;
	}

	.address-line {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #1e293b;
	}

	.address-sub {
		font-size: 0.8125rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.phone-link {
		display: inline-block;
		margin-top: 0.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		color: #0e7490;
		text-decoration: none;
	}

	.description {
		font-size: 0.9375rem;
		color: #334155;
		margin: 0;
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.team-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.team-chip {
		background: #f1f5f9;
		color: #334155;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 0.3rem 0.75rem;
		border-radius: 999px;
	}

	.hours-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.9375rem;
		color: #334155;
		padding: 0.375rem 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.clock-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.clock-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.clock-row label {
		font-size: 0.9375rem;
		color: #475569;
		font-weight: 500;
		min-width: 4rem;
	}

	.clock-input {
		flex: 1;
		max-width: 110px;
		padding: 0.5rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
		text-align: center;
		outline: none;
		transition: border-color 150ms;
		font-variant-numeric: tabular-nums;
	}

	.clock-input:focus {
		border-color: #0891b2;
	}

	.btn-save {
		padding: 0.625rem 1rem;
		background: #0891b2;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms;
		width: 100%;
	}

	.btn-save:hover:not(:disabled) { background: #0e7490; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-save.saved { background: #16a34a; }

	.notes {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0.75rem 0 0;
		font-style: italic;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
		font-size: 0.9375rem;
	}

	.back-row { margin-bottom: 0; }

	.employee-notes-box {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		background: #fefce8;
		border-left: 3px solid #ca8a04;
		border-radius: 0 0.375rem 0.375rem 0;
	}

	.employee-notes-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: #92400e;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.375rem;
	}

	.employee-notes-text {
		font-size: 0.9375rem;
		color: #1e293b;
		margin: 0;
		white-space: pre-wrap;
	}
</style>
