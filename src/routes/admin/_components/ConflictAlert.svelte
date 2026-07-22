<script lang="ts">
	import { AlertTriangle } from 'lucide-svelte';

	interface ConflictDate {
		date: string;
		booked: number;
		capacity: number;
	}

	/**
	 * Renders the "Terminueberschneidungen" alert card listing over-booked calendar dates.
	 *
	 * Called by: admin/+page.svelte (only when data.conflict_dates is non-empty)
	 * Purpose: Pure presentational component — each row links to the calendar.
	 *
	 * @prop conflicts - Dates where booked count exceeds capacity, from DashboardData
	 */
	interface Props {
		conflicts: ConflictDate[];
	}

	let { conflicts }: Props = $props();
</script>

<div class="section-card conflict-card">
	<div class="section-header conflict-header">
		<h2><AlertTriangle size={16} /> Terminueberschneidungen</h2>
	</div>
	<div class="conflict-list">
		{#each conflicts as conflict}
			<a href="/admin/calendar" class="conflict-item">
				<span class="conflict-date">{new Date(conflict.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
				<span class="conflict-count">{conflict.booked}/{conflict.capacity} gebucht</span>
			</a>
		{/each}
	</div>
</div>

<style>
	.section-card {
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		overflow: hidden;
	}

	.section-header {
		padding: 1rem 1.25rem;
		background: var(--dt-surface-container);
	}

	.section-header h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.conflict-card {
		margin-bottom: 1.5rem;
	}

	.conflict-header {
		background: rgba(168, 57, 0, 0.06);
	}

	.conflict-header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--dt-secondary);
	}

	.conflict-list {
		display: flex;
		flex-direction: column;
	}

	.conflict-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		text-decoration: none;
		transition: background var(--dt-transition);
	}

	.conflict-item:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	.conflict-item:hover {
		background: rgba(168, 57, 0, 0.04);
	}

	.conflict-date {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dt-on-surface);
	}

	.conflict-count {
		display: inline-flex;
		align-items: center;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--dt-on-secondary-container);
		background: var(--dt-secondary-container);
		padding: 0.125rem 0.5rem;
		border-radius: var(--dt-radius-sm);
	}

	@media (max-width: 768px) {
		.conflict-item {
			flex-wrap: wrap;
			gap: 0.375rem;
		}
	}
</style>
