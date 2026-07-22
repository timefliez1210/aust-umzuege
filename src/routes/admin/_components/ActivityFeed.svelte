<script lang="ts">
	import { formatDateTime } from '$lib/utils/api.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface ActivityItem {
		type: string;
		description: string;
		created_at: string;
		id: string | null;
		status: string | null;
	}

	/**
	 * Renders the dashboard's "Letzte Aktivitaeten" feed.
	 *
	 * Called by: admin/+page.svelte
	 * Purpose: Pure presentational component — maps each activity's type/id to a
	 *          navigable link and a short German type label.
	 *
	 * @prop activities - Recent activity rows from DashboardData
	 */
	interface Props {
		activities: ActivityItem[];
	}

	let { activities }: Props = $props();

	/**
	 * Build the navigation href for a recent activity item.
	 *
	 * @param type - Activity type string from API (inquiry, offer_*, email, calendar_item)
	 * @param id - UUID of the target resource, or null
	 * @returns Absolute path string suitable for <a href>, or null if no link available
	 */
	function activityHref(type: string, id: string | null): string | null {
		if (!id) return null;
		if (type === 'email') return `/admin/emails/${id}`;
		if (type === 'calendar_item') return `/admin/calendar-items/${id}`;
		// inquiry, offer_draft, offer_sent, offer_approved, etc. all link to inquiry
		return `/admin/inquiries/${id}`;
	}

	/**
	 * Translate raw activity type to a short German label for display.
	 *
	 * @param type - Activity type string from API
	 * @returns Short German label
	 */
	function activityTypeLabel(type: string): string {
		if (type === 'email') return 'E-Mail';
		if (type === 'calendar_item') return 'Termin';
		if (type.startsWith('offer_')) return 'Angebot';
		return 'Anfrage';
	}
</script>

<div class="section-card">
	<div class="section-header">
		<h2>Letzte Aktivitaeten</h2>
	</div>
	<div class="activity-list">
		{#if activities.length > 0}
			{#each activities as activity}
				{@const href = activityHref(activity.type, activity.id)}
				{#if href}
					<a {href} class="activity-item activity-link">
						<div class="activity-info">
							<span class="activity-desc">
								<span class="activity-type-badge">{activityTypeLabel(activity.type)}</span>
								{activity.description}
							</span>
							<span class="activity-time">{formatDateTime(activity.created_at)}</span>
						</div>
						{#if activity.status}
							<StatusBadge status={activity.status} />
						{/if}
					</a>
				{:else}
					<div class="activity-item">
						<div class="activity-info">
							<span class="activity-desc">{activity.description}</span>
							<span class="activity-time">{formatDateTime(activity.created_at)}</span>
						</div>
						{#if activity.status}
							<StatusBadge status={activity.status} />
						{/if}
					</div>
				{/if}
			{/each}
		{:else}
			<div class="activity-empty">Keine aktuellen Aktivitaeten</div>
		{/if}
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

	.activity-list {
		display: flex;
		flex-direction: column;
	}

	.activity-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
	}

	.activity-item:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	.activity-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.activity-desc {
		font-size: 0.875rem;
		color: var(--dt-on-surface);
	}

	.activity-time {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.activity-empty {
		padding: 2rem;
		text-align: center;
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
	}

	.activity-link {
		text-decoration: none;
		transition: background var(--dt-transition);
	}

	.activity-link:hover {
		background: var(--dt-surface-container-low);
	}

	.activity-type-badge {
		display: inline-block;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		padding: 0.1rem 0.35rem;
		border-radius: var(--dt-radius-sm);
		margin-right: 0.35rem;
		vertical-align: middle;
	}

	@media (max-width: 768px) {
		.activity-item {
			flex-wrap: wrap;
			gap: 0.375rem;
		}
	}
</style>
