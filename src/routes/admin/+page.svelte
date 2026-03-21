<script lang="ts">
	import { apiGet, formatDateTime } from '$lib/utils/api.svelte';
	import { FileText, CalendarDays, Users, ArrowRight, AlertTriangle } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface ConflictDate {
		date: string;
		booked: number;
		capacity: number;
	}

	interface ActivityItem {
		type: string;
		description: string;
		created_at: string;
		id: string | null;
		status: string | null;
	}

	interface DashboardData {
		open_quotes: number;
		pending_offers: number;
		todays_bookings: number;
		total_customers: number;
		recent_activity: ActivityItem[];
		conflict_dates: ConflictDate[];
	}

	/**
	 * Build the navigation href for a recent activity item.
	 *
	 * Called by: template ({#each recent_activity})
	 * Purpose: Map activity type + id to the correct admin page URL so each
	 *          activity row is a clickable link.
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
	 * Called by: template ({#each recent_activity})
	 * Purpose: Make activity type human-readable in German.
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

	let data = $state<DashboardData | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		loadDashboard();
	});

	/**
	 * Fetches summary KPI data for the admin dashboard from the API.
	 *
	 * Called by: $effect (on mount)
	 * Purpose: Populates the four stat cards (open quotes, pending offers, today's bookings,
	 *          total customers), the recent activity feed, and the conflict-date alert list.
	 *          Falls back to zeroed-out mock data on error so the page still renders.
	 *
	 * @returns void
	 */
	async function loadDashboard() {
		try {
			data = await apiGet<DashboardData>('/api/v1/admin/dashboard');
		} catch (e) {
			error = (e as Error).message;
			// Fallback mock data for development
			data = {
				open_quotes: 0,
				pending_offers: 0,
				todays_bookings: 0,
				total_customers: 0,
				recent_activity: [],
				conflict_dates: []
			};
		}
	}

	const statCards = $derived(
		data
			? [
					{ label: 'Offene Anfragen', value: data.open_quotes, icon: FileText, color: '#3b82f6', href: '/admin/inquiries' },
					{ label: 'Ausstehende Angebote', value: data.pending_offers, icon: FileText, color: '#f59e0b', href: '/admin/inquiries?status=offer_ready' },
					{ label: 'Heutige Buchungen', value: data.todays_bookings, icon: CalendarDays, color: '#22c55e', href: '/admin/calendar' },
					{ label: 'Kunden gesamt', value: data.total_customers, icon: Users, color: '#a855f7', href: '/admin/customers' }
				]
			: []
	);
</script>

<div class="dashboard">
	<div class="page-header">
		<h1>Dashboard</h1>
	</div>

	{#if error}
		<div class="error-banner">{error}</div>
	{/if}

	<div class="stats-grid">
		{#each statCards as card}
			<a href={card.href} class="stat-card">
				<div class="stat-icon" style="color: {card.color};">
					<card.icon size={24} />
				</div>
				<div class="stat-info">
					<span class="stat-value">{card.value}</span>
					<span class="stat-label">{card.label}</span>
				</div>
				<ArrowRight size={16} class="stat-arrow" />
			</a>
		{/each}
	</div>

	{#if data && data.conflict_dates && data.conflict_dates.length > 0}
		<div class="section-card conflict-card">
			<div class="section-header conflict-header">
				<h2><AlertTriangle size={16} /> Terminueberschneidungen</h2>
			</div>
			<div class="conflict-list">
				{#each data.conflict_dates as conflict}
					<a href="/admin/calendar" class="conflict-item">
						<span class="conflict-date">{new Date(conflict.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
						<span class="conflict-count">{conflict.booked}/{conflict.capacity} gebucht</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<div class="section-card">
		<div class="section-header">
			<h2>Letzte Aktivitaeten</h2>
		</div>
		<div class="activity-list">
			{#if data && data.recent_activity.length > 0}
				{#each data.recent_activity as activity}
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
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	.page-header {
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--dt-on-surface);
	}

	.error-banner {
		background: rgba(168, 57, 0, 0.08);
		color: var(--dt-secondary);
		padding: 0.75rem 1rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		text-decoration: none;
		transition: opacity var(--dt-transition);
	}

	.stat-card:hover {
		opacity: 0.85;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container);
		flex-shrink: 0;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.stat-label {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.stat-card :global(.stat-arrow) {
		color: var(--dt-outline-variant);
	}

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
		.page-header {
			flex-wrap: wrap;
		}
	}
</style>
