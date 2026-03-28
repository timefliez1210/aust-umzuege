<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { workerGet, workerFetch } from '$lib/stores/worker.svelte';
	import { ArrowLeft, MapPin, Package, Phone, Users, Box, Clock } from 'lucide-svelte';

	interface ItemInfo {
		name: string;
		volume_m3: number | null;
		quantity: number;
	}

	interface JobDetail {
		inquiry_id: string;
		job_date: string | null;
		status: string;
		origin_street: string | null;
		origin_city: string | null;
		origin_postal_code: string | null;
		origin_floor: string | null;
		origin_elevator: boolean | null;
		destination_street: string | null;
		destination_city: string | null;
		destination_postal_code: string | null;
		destination_floor: string | null;
		destination_elevator: boolean | null;
		estimated_volume_m3: number | null;
		items: ItemInfo[];
		customer_name: string | null;
		customer_phone: string | null;
		planned_hours: number;
		notes: string | null;
		employee_clock_in: string | null;
		employee_clock_out: string | null;
		employee_actual_hours: number | null;
		colleague_names: string[];
	}

	let job = $state<JobDetail | null>(null);
	let loading = $state(true);

	// Clock-in/out editing state
	let clockIn = $state('');
	let clockOut = $state('');
	let clockSaving = $state(false);
	let clockSaved = $state(false);

	$effect(() => {
		const id = $page.params.id;
		if (id) loadJob(id);
	});

	/**
	 * Loads the job logistics detail from the API.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Fetches GET /employee/jobs/{id} for the current inquiry.
	 *
	 * @param id - Inquiry UUID from the URL
	 */
	async function loadJob(id: string) {
		loading = true;
		try {
			job = await workerGet<JobDetail>(`/api/v1/employee/jobs/${id}`);
			// Pre-fill clock inputs from existing employee times
			clockIn  = job.employee_clock_in  ? isoToLocalTime(job.employee_clock_in)  : '';
			clockOut = job.employee_clock_out ? isoToLocalTime(job.employee_clock_out) : '';
		} catch {
			job = null;
		} finally {
			loading = false;
		}
	}

	/**
	 * Saves the employee's self-reported clock-in and clock-out times.
	 *
	 * Called by: Template (Speichern button in Meine Zeiten section).
	 * Purpose: PATCHes /employee/jobs/{id}/clock with the employee's own times.
	 *          These are stored separately from admin-set times for discrepancy checking.
	 */
	async function saveClockTimes() {
		if (!job) return;
		clockSaving = true;
		try {
			const jobDate = job.job_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
			const toIso = (t: string) =>
				t.length === 5 ? new Date(`${jobDate}T${t}:00`).toISOString() : null;

			await workerFetch(`/api/v1/employee/jobs/${job.inquiry_id}/clock`, {
				method: 'PATCH',
				body: JSON.stringify({
					employee_clock_in:  clockIn  ? toIso(clockIn)  : null,
					employee_clock_out: clockOut ? toIso(clockOut) : null,
				}),
			});
			clockSaved = true;
			setTimeout(() => (clockSaved = false), 2000);
			// Refresh to update computed hours
			await loadJob(job.inquiry_id);
		} catch {
			// silent — user can retry
		} finally {
			clockSaving = false;
		}
	}

	/**
	 * Extracts HH:MM from an ISO datetime string using local time.
	 *
	 * Called by: loadJob (pre-filling clock inputs).
	 * Purpose: Converts ISO 8601 timestamp to the 24h HH:MM string used in text inputs.
	 *
	 * @param iso - ISO 8601 datetime string
	 * @returns HH:MM string
	 */
	function isoToLocalTime(iso: string): string {
		const d = new Date(iso);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	/**
	 * Formats a date string to a German long-form date.
	 *
	 * Called by: Template (job date heading).
	 * Purpose: Readable German date for the job detail page header.
	 *
	 * @param d - ISO date string or null
	 * @returns Formatted date string or "Datum unbekannt"
	 */
	function fmtDate(d: string | null): string {
		if (!d) return 'Datum unbekannt';
		return new Date(d + 'T12:00:00').toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	/**
	 * Formats floor string and elevator flag to a German label.
	 *
	 * Called by: Template (address floor display).
	 * Purpose: Displays floor info (stored as VARCHAR in DB) with elevator indicator.
	 *
	 * @param floor - Floor string from DB (e.g. "2", "EG") or null
	 * @param elevator - Whether elevator is available or null
	 * @returns Formatted string like "2. OG · Aufzug" or ""
	 */
	function floorLabel(floor: string | null, elevator: boolean | null): string {
		if (!floor) return '';
		const num = parseInt(floor, 10);
		const f = !isNaN(num) ? (num === 0 ? 'EG' : `${num}. OG`) : floor;
		return f + (elevator ? ' · Aufzug' : '');
	}
</script>

<svelte:head>
	<title>Einsatz | Aust Mitarbeiter</title>
</svelte:head>

<div class="back-row">
	<button class="back-btn" onclick={() => goto('/worker/schedule')}>
		<ArrowLeft size={18} />
		Zurück
	</button>
</div>

{#if loading}
	<div class="empty">Laden...</div>
{:else if !job}
	<div class="empty">Einsatz nicht gefunden.</div>
{:else}
	<h1 class="job-date">{fmtDate(job.job_date)}</h1>

	<!-- Addresses -->
	<div class="section">
		<h2 class="section-title"><MapPin size={15} /> Strecke</h2>

		<div class="address-card">
			<div class="address-label">Auszug</div>
			{#if job.origin_street}
				<div class="address-line">{job.origin_street}</div>
			{/if}
			{#if job.origin_postal_code || job.origin_city}
				<div class="address-line">{[job.origin_postal_code, job.origin_city].filter(Boolean).join(' ')}</div>
			{/if}
			{#if !job.origin_street && !job.origin_city}
				<div class="address-line muted">Adresse unbekannt</div>
			{/if}
			{#if floorLabel(job.origin_floor, job.origin_elevator)}
				<div class="address-floor">{floorLabel(job.origin_floor, job.origin_elevator)}</div>
			{/if}
		</div>

		<div class="address-arrow">↓</div>

		<div class="address-card">
			<div class="address-label">Einzug</div>
			{#if job.destination_street}
				<div class="address-line">{job.destination_street}</div>
			{/if}
			{#if job.destination_postal_code || job.destination_city}
				<div class="address-line">{[job.destination_postal_code, job.destination_city].filter(Boolean).join(' ')}</div>
			{/if}
			{#if !job.destination_street && !job.destination_city}
				<div class="address-line muted">Adresse unbekannt</div>
			{/if}
			{#if floorLabel(job.destination_floor, job.destination_elevator)}
				<div class="address-floor">{floorLabel(job.destination_floor, job.destination_elevator)}</div>
			{/if}
		</div>
	</div>

	<!-- Customer Contact — phone only -->
	{#if job.customer_name || job.customer_phone}
		<div class="section">
			<h2 class="section-title"><Phone size={15} /> Auftraggeber</h2>
			<div class="contact-card">
				{#if job.customer_name}
					<div class="contact-name">{job.customer_name}</div>
				{/if}
				{#if job.customer_phone}
					<a class="contact-link" href="tel:{job.customer_phone}">
						<Phone size={14} />
						{job.customer_phone}
					</a>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Team -->
	{#if job.colleague_names.length > 0}
		<div class="section">
			<h2 class="section-title"><Users size={15} /> Team</h2>
			<div class="team-list">
				{#each job.colleague_names as name}
					<span class="team-chip">{name}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Volume & Items -->
	{#if job.estimated_volume_m3 || job.items.length > 0}
		<div class="section">
			<h2 class="section-title"><Package size={15} /> Umzugsgut</h2>
			{#if job.estimated_volume_m3}
				<div class="volume-chip">Gesamtvolumen: {job.estimated_volume_m3.toFixed(1)} m³</div>
			{/if}
			{#if job.items.length > 0}
				<div class="item-list">
					{#each job.items as item}
						<div class="item-row">
							<Box size={13} />
							<span>{item.quantity > 1 ? `${item.quantity}×` : ''} {item.name}</span>
							{#if item.volume_m3}
								<span class="item-vol">{item.volume_m3.toFixed(2)} m³</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- My Times — employee self-reported clock-in/out -->
	<div class="section">
		<h2 class="section-title"><Clock size={15} /> Meine Zeiten</h2>

		{#if job.employee_actual_hours !== null}
			<div class="hours-row">
				<span>Gearbeitet</span><strong>{job.employee_actual_hours.toFixed(1)} h</strong>
			</div>
		{/if}

		<div class="clock-form">
			<div class="clock-row">
				<label for="clock-in">Beginn</label>
				<input
					id="clock-in"
					type="text"
					inputmode="decimal"
					placeholder="08:00"
					maxlength="5"
					pattern="[0-9]{2}:[0-5][0-9]"
					class="clock-input"
					bind:value={clockIn}
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

		{#if job.notes}
			<p class="notes">{job.notes}</p>
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
		margin: 0 0 1.25rem;
	}

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

	.address-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.625rem;
		padding: 0.875rem 1rem;
	}

	.address-label {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
		margin-bottom: 0.25rem;
	}

	.address-line {
		font-size: 0.9375rem;
		font-weight: 500;
		color: #1e293b;
	}

	.address-line.muted {
		color: #94a3b8;
		font-weight: 400;
	}

	.address-floor {
		font-size: 0.8125rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.address-arrow {
		text-align: center;
		color: #94a3b8;
		font-size: 1.25rem;
		margin: 0.375rem 0;
	}

	.volume-chip {
		display: inline-block;
		background: #e0e7ff;
		color: #4338ca;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		margin-bottom: 0.625rem;
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.item-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.9375rem;
		color: #334155;
	}

	.item-vol {
		margin-left: auto;
		font-size: 0.8125rem;
		color: #94a3b8;
	}

	.contact-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.contact-name {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
	}

	.contact-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: #4f46e5;
		font-size: 0.9375rem;
		text-decoration: none;
	}

	.contact-link:hover { text-decoration: underline; }

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
		border-color: #4f46e5;
	}

	.btn-save {
		padding: 0.625rem 1rem;
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms;
		width: 100%;
	}

	.btn-save:hover:not(:disabled) { background: #4338ca; }
	.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-save.saved { background: #16a34a; }

	.notes {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0.75rem 0 0;
		font-style: italic;
	}

	.muted {
		color: #94a3b8;
		font-size: 0.875rem;
		margin: 0;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
		font-size: 0.9375rem;
	}

	.back-row { margin-bottom: 0; }
</style>
