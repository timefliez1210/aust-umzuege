<script lang="ts">
	import { apiGet, formatDateTime } from '$lib/utils/api.svelte';
	import { FileText, CalendarDays, Users, ArrowRight, AlertTriangle } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';

	interface ConflictDate {
		date: string;
		booked: number;
		capacity: number;
	}

	interface DashboardData {
		open_quotes: number;
		pending_offers: number;
		todays_bookings: number;
		total_customers: number;
		recent_activity: {
			type: string;
			description: string;
			created_at: string;
			status?: string;
		}[];
		conflict_dates: ConflictDate[];
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
					<div class="activity-item">
						<div class="activity-info">
							<span class="activity-desc">{activity.description}</span>
							<span class="activity-time">{formatDateTime(activity.created_at)}</span>
						</div>
						{#if activity.status}
							<StatusBadge status={activity.status} />
						{/if}
					</div>
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
		font-size: 1.5rem;
		font-weight: 700;
		color: #1a1a2e;
	}

	.error-banner {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem 1rem;
		border-radius: 10px;
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
		background: #ffffff;
		border: none;
		border-radius: 12px;
		padding: 1.25rem;
		text-decoration: none;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
		transition: box-shadow 200ms ease;
	}

	.stat-card:hover {
		box-shadow: 7px 7px 20px #c5cdd8, -7px -7px 20px #ffffff;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 10px;
		background: #f1f5f9;
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
		color: #1a1a2e;
	}

	.stat-label {
		font-size: 0.8125rem;
		color: #64748b;
	}

	.stat-card :global(.stat-arrow) {
		color: #cbd5e1;
	}

	.section-card {
		background: #ffffff;
		border: none;
		border-radius: 12px;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
		overflow: hidden;
	}

	.section-header {
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #f1f5f9;
		background: #f8fafc;
	}

	.section-header h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: #334155;
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
		border-bottom: 1px solid #f1f5f9;
	}

	.activity-item:last-child {
		border-bottom: none;
	}

	.activity-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.activity-desc {
		font-size: 0.875rem;
		color: #334155;
	}

	.activity-time {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.activity-empty {
		padding: 2rem;
		text-align: center;
		color: #94a3b8;
		font-size: 0.875rem;
	}

	.conflict-card {
		border-left: 3px solid #f59e0b;
		margin-bottom: 1.5rem;
	}

	.conflict-header {
		background: #fffbeb;
	}

	.conflict-header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #92400e;
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
		border-bottom: 1px solid #f1f5f9;
		text-decoration: none;
		transition: background 150ms;
	}

	.conflict-item:last-child {
		border-bottom: none;
	}

	.conflict-item:hover {
		background: #fffbeb;
	}

	.conflict-date {
		font-size: 0.875rem;
		font-weight: 500;
		color: #334155;
	}

	.conflict-count {
		font-size: 0.75rem;
		font-weight: 600;
		color: #d97706;
		background: #fef3c7;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-wrap: wrap;
		}
	}
</style>
