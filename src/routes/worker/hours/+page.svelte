<script lang="ts">
	import { goto } from '$app/navigation';
	import { workerGet } from '$lib/stores/worker.svelte';
	import { ChevronRight } from 'lucide-svelte';

	interface HoursEntry {
		inquiry_id: string | null;
		job_date: string | null;
		origin_city: string | null;
		destination_city: string | null;
		planned_hours: number;
		actual_hours: number | null;
		status: string;
		entry_type: string;
		calendar_item_id: string | null;
		title: string | null;
		location: string | null;
	}

	interface HoursSummary {
		month: string;
		target_hours: number;
		planned_hours: number;
		actual_hours: number;
		assignment_count: number;
		assignments: HoursEntry[];
	}

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let summary = $state<HoursSummary | null>(null);
	let loading = $state(true);

	$effect(() => {
		loadHours(selectedMonth);
	});

	/**
	 * Loads the monthly hours summary from the API.
	 *
	 * Called by: $effect on mount and whenever selectedMonth changes.
	 * Purpose: Fetches GET /employee/hours?month=YYYY-MM for the authenticated employee.
	 *
	 * @param month - ISO month string (YYYY-MM)
	 */
	async function loadHours(month: string) {
		loading = true;
		try {
			summary = await workerGet<HoursSummary>(`/api/v1/employee/hours?month=${month}`);
		} catch {
			summary = null;
		} finally {
			loading = false;
		}
	}

	/**
	 * Calculates a percentage capped at 100 for progress bars.
	 *
	 * Called by: Template (progress bars for planned/actual hours).
	 * Purpose: Visual fill width as a percentage of the monthly target.
	 *
	 * Math: pct = min(100, (value / target) * 100)
	 *
	 * @param value  - Numerator (hours worked/planned)
	 * @param target - Denominator (monthly target)
	 * @returns Percentage 0–100
	 */
	function pct(value: number, target: number): number {
		if (target <= 0) return 0;
		return Math.min(100, (value / target) * 100);
	}

	/**
	 * Formats a date string to a short German date.
	 *
	 * Called by: Template (date column in assignments table).
	 * Purpose: Readable German short-date format.
	 *
	 * @param d - ISO date string or null
	 * @returns Formatted string or "—"
	 */
	function fmtDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
	}
</script>

<svelte:head>
	<title>Stunden | Aust Mitarbeiter</title>
</svelte:head>

<div class="page-header">
	<h1>Stunden</h1>
	<input type="month" bind:value={selectedMonth} class="month-input" />
</div>

{#if loading}
	<div class="empty">Laden...</div>
{:else if !summary}
	<div class="empty">Keine Daten verfügbar.</div>
{:else}
	<!-- Summary cards -->
	<div class="summary-cards">
		<div class="summary-card">
			<span class="summary-label">Ziel</span>
			<span class="summary-value">{summary.target_hours} h</span>
		</div>
		<div class="summary-card">
			<span class="summary-label">Geplant</span>
			<span class="summary-value planned">{summary.planned_hours.toFixed(1)} h</span>
		</div>
		<div class="summary-card">
			<span class="summary-label">Ist</span>
			<span class="summary-value actual">{summary.actual_hours.toFixed(1)} h</span>
		</div>
	</div>

	<!-- Progress bars -->
	<div class="bars">
		<div class="bar-row">
			<span class="bar-label">Geplant</span>
			<div class="bar-track">
				<div class="bar-fill planned" style="width:{pct(summary.planned_hours, summary.target_hours)}%"></div>
			</div>
			<span class="bar-pct">{pct(summary.planned_hours, summary.target_hours).toFixed(0)}%</span>
		</div>
		<div class="bar-row">
			<span class="bar-label">Ist</span>
			<div class="bar-track">
				<div class="bar-fill actual" style="width:{pct(summary.actual_hours, summary.target_hours)}%"></div>
			</div>
			<span class="bar-pct">{pct(summary.actual_hours, summary.target_hours).toFixed(0)}%</span>
		</div>
	</div>

	<!-- Assignments -->
	{#if summary.assignments.length > 0}
		<h2 class="section-title">{summary.assignment_count} Einsätze</h2>
		<div class="assignment-list">
			{#each summary.assignments as a}
				{#if a.entry_type === 'item'}
					<div class="assignment-row item-row">
						<div class="a-date">{fmtDate(a.job_date)}</div>
						<div class="a-route">{a.title ?? '—'}</div>
						<div class="a-hours">
							<span class="h-planned">{a.planned_hours.toFixed(1)} h</span>
							{#if a.actual_hours !== null}
								<span class="h-actual">/ {a.actual_hours.toFixed(1)} h</span>
							{/if}
						</div>
					</div>
				{:else}
					<button class="assignment-row" onclick={() => goto(`/worker/jobs/${a.inquiry_id}`)}>
						<div class="a-date">{fmtDate(a.job_date)}</div>
						<div class="a-route">
							{#if a.origin_city && a.destination_city}
								{a.origin_city} → {a.destination_city}
							{:else}
								{a.origin_city ?? a.destination_city ?? '—'}
							{/if}
						</div>
						<div class="a-hours">
							<span class="h-planned">{a.planned_hours.toFixed(1)} h</span>
							{#if a.actual_hours !== null}
								<span class="h-actual">/ {a.actual_hours.toFixed(1)} h</span>
							{/if}
						</div>
						<ChevronRight size={14} class="chevron" />
					</button>
				{/if}
			{/each}
		</div>
	{:else}
		<div class="empty">Keine Einsätze in diesem Monat.</div>
	{/if}
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
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.625rem;
		margin-bottom: 1.25rem;
	}

	.summary-card {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		padding: 0.875rem 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.summary-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #94a3b8;
	}

	.summary-value {
		font-size: 1.375rem;
		font-weight: 700;
		color: #1e293b;
		font-variant-numeric: tabular-nums;
	}

	.summary-value.planned { color: #4f46e5; }
	.summary-value.actual  { color: #16a34a; }

	.bars {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.bar-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.bar-label {
		font-size: 0.8125rem;
		color: #64748b;
		width: 3.5rem;
		flex-shrink: 0;
	}

	.bar-track {
		flex: 1;
		height: 10px;
		background: #f1f5f9;
		border-radius: 999px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 999px;
		transition: width 400ms ease;
	}

	.bar-fill.planned { background: #818cf8; }
	.bar-fill.actual  { background: #34d399; }

	.bar-pct {
		font-size: 0.75rem;
		color: #94a3b8;
		width: 2.5rem;
		text-align: right;
		flex-shrink: 0;
	}

	.section-title {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
	}

	.assignment-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid #e2e8f0;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.assignment-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.875rem 1rem;
		background: #fff;
		border: none;
		border-bottom: 1px solid #f1f5f9;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 150ms;
		position: relative;
	}

	.assignment-row:last-child { border-bottom: none; }
	.assignment-row:hover { background: #f8fafc; }

	.item-row {
		cursor: default;
		border-left: 3px solid #f59e0b;
	}

	.item-row:hover { background: #fff; }

	.a-date {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #475569;
		width: 2.5rem;
		flex-shrink: 0;
	}

	.a-route {
		flex: 1;
		font-size: 0.875rem;
		color: #334155;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.a-hours {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		flex-shrink: 0;
		padding-right: 1.25rem;
	}

	.h-planned {
		font-size: 0.875rem;
		font-weight: 700;
		color: #4f46e5;
	}

	.h-actual {
		font-size: 0.8125rem;
		color: #16a34a;
	}

	.chevron {
		position: absolute;
		right: 0.75rem;
		color: #cbd5e0;
	}

	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: #94a3b8;
		font-size: 0.9375rem;
	}
</style>
