<script lang="ts">
	import { goto } from '$app/navigation';
	import { workerGet } from '$lib/stores/worker.svelte';
	import { worker, workerData } from '$lib/stores/worker.svelte';
	import { MapPin, Package, Users, ChevronRight, Phone, User } from 'lucide-svelte';

	interface ScheduleJob {
		inquiry_id: string | null;
		job_date: string | null;
		start_time: string | null;
		status: string;
		origin_street: string | null;
		origin_house_number: string | null;
		origin_city: string | null;
		origin_postal_code: string | null;
		destination_street: string | null;
		destination_house_number: string | null;
		destination_city: string | null;
		destination_postal_code: string | null;
		estimated_volume_m3: number | null;
		customer_name: string | null;
		customer_phone: string | null;
		colleague_names: string[];
		entry_type: string;
		calendar_item_id: string | null;
		appointment_id: string | null;
		title: string | null;
		location: string | null;
		category: string | null;
		employee_notes: string | null;
	}

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let jobs = $state<ScheduleJob[]>([]);
	let loading = $state(true);

	$effect(() => {
		void workerData.refresh; // re-fetch after the worker logs pending hours
		loadSchedule(selectedMonth);
	});

	/**
	 * Loads the schedule for the selected month.
	 *
	 * Called by: $effect on mount and whenever selectedMonth changes.
	 * Purpose: Fetches assigned jobs from GET /employee/schedule?month=YYYY-MM.
	 *
	 * @param month - ISO month string (YYYY-MM)
	 */
	async function loadSchedule(month: string) {
		loading = true;
		try {
			jobs = await workerGet<ScheduleJob[]>(`/api/v1/employee/schedule?month=${month}`);
		} catch {
			jobs = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Formats a date string to German locale short date.
	 *
	 * Called by: Template (job date display).
	 * Purpose: Converts ISO date to readable German format.
	 *
	 * @param d - ISO date string or null
	 * @returns Formatted date string or "—"
	 */
	function fmtDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('de-DE', {
			weekday: 'short',
			day: '2-digit',
			month: '2-digit',
		});
	}

	/**
	 * Formats a HH:MM:SS time to "HH:MM Uhr", or "" when the entry has no time.
	 *
	 * Called by: Template (every card's date row).
	 * Purpose: The list is ordered by the hour the worker starts, so that hour has
	 * to be on the card. Two entries on one day are otherwise indistinguishable.
	 */
	function fmtTime(t: string | null): string {
		return t ? `${t.slice(0, 5)} Uhr` : '';
	}

	/**
	 * Joins one address into a single readable line.
	 *
	 * Called by: Template (job cards).
	 * Purpose: The crew asked for full addresses, so the house number and the
	 * postal code belong on the card, not just the street name and the town.
	 */
	function addressLine(
		street: string | null,
		houseNumber: string | null,
		postalCode: string | null,
		city: string | null,
	): string {
		const left = [street, houseNumber].filter(Boolean).join(' ');
		const right = [postalCode, city].filter(Boolean).join(' ');
		return [left, right].filter(Boolean).join(', ');
	}
</script>

<svelte:head>
	<title>Einsätze | Aust Mitarbeiter</title>
</svelte:head>

<div class="page-header">
	<h1>Hallo, {worker.employee?.first_name ?? ''}!</h1>
	<input
		type="month"
		bind:value={selectedMonth}
		class="month-input"
	/>
</div>

{#if loading}
	<div class="empty">Laden...</div>
{:else if jobs.length === 0}
	<div class="empty">Keine Einsätze in diesem Monat.</div>
{:else}
	<div class="job-list">
		{#each jobs as job}
			{#if job.entry_type === 'item'}
				<button class="job-card item-card" onclick={() => goto(`/worker/items/${job.calendar_item_id}${job.job_date ? `?date=${job.job_date}` : ''}`)}>
					<div class="job-top">
						<span class="job-date">{fmtDate(job.job_date)}</span>
						{#if fmtTime(job.start_time)}
							<span class="job-time">{fmtTime(job.start_time)}</span>
						{/if}
						<span class="badge badge-item">{job.category ?? 'Termin'}</span>
					</div>

					<div class="job-route">
						<span class="item-title">{job.title ?? '—'}</span>
					</div>

					{#if job.location}
						<div class="job-route item-location">
							<MapPin size={14} />
							<span>{job.location}</span>
						</div>
					{/if}
					{#if job.customer_name || job.customer_phone}
						<div class="contact-row">
							{#if job.customer_name}
								<span class="contact-name"><User size={13} />{job.customer_name}</span>
							{/if}
							{#if job.customer_phone}
								<a
									class="contact-phone"
									href={`tel:${job.customer_phone}`}
									onclick={(e) => e.stopPropagation()}
								>
									<Phone size={13} />{job.customer_phone}
								</a>
							{/if}
						</div>
					{/if}
					{#if job.employee_notes}
						<p class="sched-notes">{job.employee_notes}</p>
					{/if}

					<ChevronRight size={16} class="chevron" />
				</button>
			{:else if job.entry_type === 'appointment'}
				<button class="job-card appt-card" onclick={() => goto(`/worker/appointments/${job.appointment_id}`)}>
					<div class="job-top">
						<span class="job-date">{fmtDate(job.job_date)}</span>
						{#if fmtTime(job.start_time)}
							<span class="job-time">{fmtTime(job.start_time)}</span>
						{/if}
						<span class="badge badge-appt">Zusatztermin</span>
					</div>

					<div class="job-route">
						<span class="item-title">{job.title ?? 'Zusatztermin'}</span>
					</div>

					{#if job.location}
						<div class="job-route item-location">
							<MapPin size={14} />
							<span>{job.location}</span>
						</div>
					{/if}
					{#if job.customer_name || job.customer_phone}
						<div class="contact-row">
							{#if job.customer_name}
								<span class="contact-name"><User size={13} />{job.customer_name}</span>
							{/if}
							{#if job.customer_phone}
								<a
									class="contact-phone"
									href={`tel:${job.customer_phone}`}
									onclick={(e) => e.stopPropagation()}
								>
									<Phone size={13} />{job.customer_phone}
								</a>
							{/if}
						</div>
					{/if}
					{#if job.colleague_names.length > 0}
						<div class="job-meta">
							<span class="meta-pill">
								<Users size={12} />
								+{job.colleague_names.length}
							</span>
						</div>
					{/if}
					{#if job.employee_notes}
						<p class="sched-notes">{job.employee_notes}</p>
					{/if}

					<ChevronRight size={16} class="chevron" />
				</button>
			{:else}
				<button class="job-card" onclick={() => goto(`/worker/jobs/${job.inquiry_id}${job.job_date ? `?date=${job.job_date}` : ''}`)}>
					<div class="job-top">
						<span class="job-date">{fmtDate(job.job_date)}</span>
						{#if fmtTime(job.start_time)}
							<span class="job-time">{fmtTime(job.start_time)}</span>
						{/if}
					</div>

					<div class="job-route">
						<MapPin size={14} />
						<span class="route-lines">
							{#if job.origin_city || job.destination_city}
								{#if job.origin_city}
									<span class="route-line">
										<span class="route-label">Von</span>
										{addressLine(job.origin_street, job.origin_house_number, job.origin_postal_code, job.origin_city)}
									</span>
								{/if}
								{#if job.destination_city}
									<span class="route-line">
										<span class="route-label">Nach</span>
										{addressLine(job.destination_street, job.destination_house_number, job.destination_postal_code, job.destination_city)}
									</span>
								{/if}
							{:else}
								—
							{/if}
						</span>
					</div>

					{#if job.customer_name || job.customer_phone}
						<div class="contact-row">
							{#if job.customer_name}
								<span class="contact-name"><User size={13} />{job.customer_name}</span>
							{/if}
							{#if job.customer_phone}
								<a
									class="contact-phone"
									href={`tel:${job.customer_phone}`}
									onclick={(e) => e.stopPropagation()}
								>
									<Phone size={13} />{job.customer_phone}
								</a>
							{/if}
						</div>
					{/if}

					<div class="job-meta">
						{#if job.estimated_volume_m3}
							<span class="meta-pill">
								<Package size={12} />
								{job.estimated_volume_m3.toFixed(1)} m³
							</span>
						{/if}
						{#if job.colleague_names.length > 0}
							<span class="meta-pill">
								<Users size={12} />
								+{job.colleague_names.length}
							</span>
						{/if}
					</div>

					{#if job.employee_notes}
						<p class="sched-notes">{job.employee_notes}</p>
					{/if}

					<ChevronRight size={16} class="chevron" />
				</button>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.month-input {
		padding: 0.375rem 0.5rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: #1e293b;
	}

	.job-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.job-card {
		background: #fff;
		border: 1px solid #e2e8f0;
		border-radius: 0.875rem;
		padding: 1rem;
		text-align: left;
		cursor: pointer;
		width: 100%;
		position: relative;
		transition: box-shadow 150ms;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.job-card:hover {
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.job-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.job-date {
		font-size: 0.875rem;
		font-weight: 700;
		color: #1e293b;
	}

	.job-route {
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #334155;
	}

	.route-lines {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.route-line {
		display: block;
		word-break: break-word;
	}

	.route-label {
		display: inline-block;
		min-width: 2.5rem;
		font-weight: 600;
		color: #94a3b8;
	}

	.job-time {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #0e7490;
	}

	.contact-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.875rem;
		color: #475569;
	}

	.contact-name,
	.contact-phone {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.contact-phone {
		color: #2563eb;
		font-weight: 600;
		text-decoration: none;
	}

	.job-meta {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.meta-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		background: #f1f5f9;
		color: #64748b;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 999px;
	}

	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
	}

	.badge-item   { background: #fef3c7; color: #92400e; }
	.badge-appt   { background: #cffafe; color: #155e75; }

	.item-card {
		border-left: 3px solid #f59e0b;
	}

	.appt-card {
		border-left: 3px solid #0891b2;
	}

	.item-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #1e293b;
	}

	.item-location {
		color: #64748b;
	}

	:global(.chevron) {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #cbd5e0;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
		font-size: 0.9375rem;
	}

	.sched-notes {
		margin: 0.5rem 0 0;
		font-size: 0.8125rem;
		color: #92400e;
		background: #fefce8;
		border-left: 2px solid #ca8a04;
		padding: 0.25rem 0.5rem;
		border-radius: 0 3px 3px 0;
		white-space: pre-wrap;
	}
</style>
