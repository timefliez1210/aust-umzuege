<script lang="ts">
	import { apiGet, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { FileText, CalendarDays, Users, Star, Bell } from 'lucide-svelte';
	import DashboardStatCards from './_components/DashboardStatCards.svelte';
	import ConflictAlert from './_components/ConflictAlert.svelte';
	import ActivityFeed from './_components/ActivityFeed.svelte';
	import MorningWorkflowDialog from './_components/MorningWorkflowDialog.svelte';

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

	interface ReviewReminder {
		inquiry_id: string;
		remind_after: string;
		customer_name: string | null;
		customer_email: string | null;
	}

	interface InvoiceReminder {
		id: string;
		invoice_id: string;
		inquiry_id: string;
		invoice_number: string;
		level: number;
		remind_after: string;
		customer_name: string | null;
		customer_email: string | null;
	}

	interface DashboardData {
		open_quotes: number;
		pending_offers: number;
		todays_bookings: number;
		total_customers: number;
		recent_activity: ActivityItem[];
		conflict_dates: ConflictDate[];
		pending_review_count: number;
	}

	let reviewReminders = $state<ReviewReminder[]>([]);

	async function loadReviewReminders() {
		try {
			reviewReminders = await apiGet<ReviewReminder[]>('/api/v1/admin/review-reminders');
		} catch {
			reviewReminders = [];
		}
	}

	// --- Invoice reminder state ---

	let invoiceReminders = $state<InvoiceReminder[]>([]);
	let invoiceSnoozedays = $state<Record<string, number>>({});
	let invoiceReminderSending = $state<Record<string, boolean>>({});

	const DUNNING_LABELS: Record<number, string> = {
		1: 'Zahlungserinnerung',
		2: '1. Mahnung',
		3: '2. Mahnung',
	};

	async function loadInvoiceReminders() {
		try {
			invoiceReminders = await apiGet<InvoiceReminder[]>('/api/v1/admin/invoice-reminders');
			// Seed default snooze days
			for (const r of invoiceReminders) {
				if (!(r.id in invoiceSnoozedays)) {
					invoiceSnoozedays[r.id] = 7;
				}
			}
		} catch {
			invoiceReminders = [];
		}
	}

	async function doInvoiceAction(id: string, action: 'send' | 'later' | 'paid') {
		if (invoiceReminderSending[id]) return;
		invoiceReminderSending[id] = true;
		try {
			const body: Record<string, unknown> = { action };
			if (action === 'later') body.days = invoiceSnoozedays[id] ?? 7;
			await apiPost(`/api/v1/admin/invoice-reminders/${id}/action`, body);
			await loadInvoiceReminders();
			if (action === 'send') showToast('Mahnung gesendet', 'success');
			else if (action === 'later') showToast('Erinnerung verschoben', 'success');
			else showToast('Als bezahlt markiert', 'success');
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			invoiceReminderSending[id] = false;
		}
	}

	async function sendReviewNow(inquiryId: string) {
		try {
			await apiPost(`/api/v1/admin/inquiries/${inquiryId}/review-request`, { action: 'now' });
			showToast('Bewertungsanfrage gesendet', 'success');
			await loadReviewReminders();
			if (data) data.pending_review_count = reviewReminders.length;
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		}
	}

	let data = $state<DashboardData | null>(null);
	let error = $state<string | null>(null);

	$effect(() => {
		loadDashboard();
		loadReviewReminders();
		loadInvoiceReminders();
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
				conflict_dates: [],
				pending_review_count: 0
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

	<DashboardStatCards cards={statCards} />

	{#if data && data.conflict_dates && data.conflict_dates.length > 0}
		<ConflictAlert conflicts={data.conflict_dates} />
	{/if}

	{#if reviewReminders.length > 0}
		<div class="section-card review-card">
			<div class="section-header">
				<h2><Star size={16} /> Bewertungsanfragen fällig ({reviewReminders.length})</h2>
			</div>
			<div class="review-list">
				{#each reviewReminders as r}
					<div class="review-item">
						<div class="review-info">
							<a href="/admin/inquiries/{r.inquiry_id}" class="review-name">
								{r.customer_name ?? 'Unbekannt'}
							</a>
							<span class="review-date">fällig seit {new Date(r.remind_after).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}</span>
						</div>
						<button class="btn btn-sm btn-primary" onclick={() => sendReviewNow(r.inquiry_id)}>
							Jetzt senden
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if invoiceReminders.length > 0}
		<div class="section-card invoice-reminder-card">
			<div class="section-header invoice-reminder-header">
				<h2><Bell size={16} /> Rechnungserinnerungen fällig ({invoiceReminders.length})</h2>
			</div>
			<div class="ir-list">
				{#each invoiceReminders as r}
					{@const label = DUNNING_LABELS[r.level] ?? `Level ${r.level}`}
					{@const sending = invoiceReminderSending[r.id] ?? false}
					<div class="ir-item">
						<div class="ir-info">
							<a href="/admin/inquiries/{r.inquiry_id}" class="ir-name">
								{r.customer_name ?? 'Unbekannt'}
							</a>
							<span class="ir-meta">
								Rechnung {r.invoice_number} ·
								<span class="ir-level-badge" data-level={r.level}>{label}</span>
								· fällig seit {new Date(r.remind_after).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
							</span>
						</div>
						<div class="ir-actions">
							<button
								class="btn btn-sm btn-primary"
								disabled={sending}
								onclick={() => doInvoiceAction(r.id, 'send')}
							>
								Mahnung schreiben
							</button>
							<button
								class="btn btn-sm ir-later-btn"
								disabled={sending}
								onclick={() => doInvoiceAction(r.id, 'later')}
							>
								Später (<input
									type="number"
									class="ir-days-input"
									min="1"
									max="90"
									bind:value={invoiceSnoozedays[r.id]}
									onclick={(e) => e.stopPropagation()}
								/>d)
							</button>
							<button
								class="btn btn-sm ir-paid-btn"
								disabled={sending}
								onclick={() => doInvoiceAction(r.id, 'paid')}
							>
								Bezahlt
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<ActivityFeed activities={data?.recent_activity ?? []} />
</div>

<MorningWorkflowDialog />

<style>
	.dashboard {
		height: 100%;
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

	.review-card {
		margin-bottom: 1.5rem;
	}

	.review-card .section-header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--dt-primary);
	}

	.review-list {
		display: flex;
		flex-direction: column;
	}

	.review-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1.25rem;
		gap: 0.75rem;
	}

	.review-item:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	.review-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.review-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dt-on-surface);
		text-decoration: none;
	}

	.review-name:hover {
		text-decoration: underline;
	}

	.review-date {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	/* === Invoice reminders card === */

	.invoice-reminder-card {
		margin-bottom: 1.5rem;
	}

	.invoice-reminder-header {
		background: rgba(234, 160, 0, 0.07);
	}

	.invoice-reminder-header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #c97700;
	}

	.ir-list {
		display: flex;
		flex-direction: column;
	}

	.ir-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.ir-item:nth-child(even) {
		background: var(--dt-surface-container-low);
	}

	.ir-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
		min-width: 0;
	}

	.ir-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dt-on-surface);
		text-decoration: none;
	}

	.ir-name:hover {
		text-decoration: underline;
	}

	.ir-meta {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.ir-level-badge {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 0.1rem 0.4rem;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
	}

	.ir-level-badge[data-level="2"],
	.ir-level-badge[data-level="3"] {
		background: rgba(234, 88, 12, 0.15);
		color: #c2410c;
	}

	.ir-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		flex-shrink: 0;
	}

	.ir-later-btn {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}

	.ir-days-input {
		width: 2.75rem;
		padding: 0 0.2rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.8125rem;
		color: var(--dt-on-surface);
		text-align: center;
		outline: none;
	}

	.ir-paid-btn {
		color: #16a34a;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-wrap: wrap;
		}

		.review-item {
			flex-wrap: wrap;
		}
	}
</style>
