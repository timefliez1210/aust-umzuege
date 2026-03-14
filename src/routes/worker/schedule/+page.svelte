<script lang="ts">
	import { goto } from '$app/navigation';
	import { workerGet } from '$lib/stores/worker.svelte';
	import { worker } from '$lib/stores/worker.svelte';
	import { MapPin, Package, Users, ChevronRight } from 'lucide-svelte';

	interface ScheduleJob {
		inquiry_id: string;
		job_date: string | null;
		status: string;
		origin_city: string | null;
		destination_city: string | null;
		estimated_volume_m3: number | null;
		customer_name: string | null;
		planned_hours: number;
		colleague_names: string[];
	}

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let jobs = $state<ScheduleJob[]>([]);
	let loading = $state(true);

	$effect(() => {
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
	 * Formats a job status string into a German label and color class.
	 *
	 * Called by: Template (status badge per job).
	 * Purpose: Human-readable, color-coded status for the employee.
	 *
	 * @param status - Raw status string from the API
	 * @returns Object with label and CSS class name
	 */
	function statusLabel(status: string): { label: string; cls: string } {
		const map: Record<string, { label: string; cls: string }> = {
			pending: { label: 'Ausstehend', cls: 'badge-gray' },
			estimating: { label: 'In Bearbeitung', cls: 'badge-blue' },
			estimated: { label: 'Geschätzt', cls: 'badge-blue' },
			offer_ready: { label: 'Angebot bereit', cls: 'badge-blue' },
			offer_sent: { label: 'Angebot gesendet', cls: 'badge-blue' },
			accepted: { label: 'Bestätigt', cls: 'badge-green' },
			scheduled: { label: 'Geplant', cls: 'badge-indigo' },
			completed: { label: 'Abgeschlossen', cls: 'badge-green' },
			cancelled: { label: 'Abgesagt', cls: 'badge-red' },
		};
		return map[status] ?? { label: status, cls: 'badge-gray' };
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
			{@const s = statusLabel(job.status)}
			<button class="job-card" onclick={() => goto(`/worker/jobs/${job.inquiry_id}`)}>
				<div class="job-top">
					<span class="job-date">{fmtDate(job.job_date)}</span>
					<span class="badge {s.cls}">{s.label}</span>
				</div>

				<div class="job-route">
					<MapPin size={14} />
					<span>
						{#if job.origin_city && job.destination_city}
							{job.origin_city} → {job.destination_city}
						{:else}
							{job.origin_city ?? job.destination_city ?? '—'}
						{/if}
					</span>
				</div>

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
					<span class="meta-pill">{job.planned_hours.toFixed(1)} h</span>
				</div>

				<ChevronRight size={16} class="chevron" />
			</button>
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
		align-items: center;
		gap: 0.375rem;
		font-size: 0.9375rem;
		font-weight: 500;
		color: #334155;
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

	.badge-gray   { background: #f1f5f9; color: #64748b; }
	.badge-blue   { background: #dbeafe; color: #1d4ed8; }
	.badge-indigo { background: #e0e7ff; color: #4338ca; }
	.badge-green  { background: #dcfce7; color: #16a34a; }
	.badge-red    { background: #fee2e2; color: #dc2626; }

	.chevron {
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
</style>
