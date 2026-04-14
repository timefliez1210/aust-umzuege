<script lang="ts">
	import { apiGet, apiPost, apiPatch, formatDateTime } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { FileText, CalendarDays, Users, ArrowRight, AlertTriangle, Star, CheckCircle, Receipt, MessageSquare } from 'lucide-svelte';
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

	// --- Morning workflow types ---

	interface MorningInquiry {
		id: string;
		customer_name: string | null;
		customer_email: string | null;
		last_day: string | null;
		status: string;
		invoice_status: string | null;
		invoice_id: string | null;
		invoice_type: string | null;
		has_review_request: boolean;
	}

	interface MorningCalendarItem {
		id: string;
		title: string;
		last_day: string | null;
		status: string;
	}

	type MorningJob =
		| { kind: 'inquiry'; data: MorningInquiry }
		| { kind: 'calendar_item'; data: MorningCalendarItem };

	interface ReviewReminder {
		inquiry_id: string;
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

	// --- Morning workflow state ---

	let morningJobs = $state<MorningJob[]>([]);
	let morningIndex = $state(0);
	let morningVisible = $state(false);

	// Per-job step state: 'complete' | 'invoice' | 'review'
	// Each job tracks which steps are done
	type StepKey = 'complete' | 'invoice' | 'review';
	let completedSteps = $state<Record<string, Set<StepKey>>>({});

	// Review sub-state per job
	let reviewDays = $state(3);
	let sendingStep = $state(false);

	function jobKey(job: MorningJob): string {
		return job.kind === 'inquiry' ? `inq:${job.data.id}` : `ci:${job.data.id}`;
	}

	function neededSteps(job: MorningJob): StepKey[] {
		if (job.kind === 'calendar_item') {
			return ['complete'];
		}
		const inq = job.data;
		const steps: StepKey[] = [];
		if (!['completed', 'invoiced', 'paid'].includes(inq.status)) steps.push('complete');
		if (!['sent', 'paid'].includes(inq.invoice_status ?? '')) steps.push('invoice');
		if (!inq.has_review_request) steps.push('review');
		return steps;
	}

	function isStepDone(job: MorningJob, step: StepKey): boolean {
		return completedSteps[jobKey(job)]?.has(step) ?? false;
	}

	function markStep(job: MorningJob, step: StepKey) {
		const k = jobKey(job);
		if (!completedSteps[k]) completedSteps[k] = new Set();
		completedSteps[k] = new Set([...completedSteps[k], step]);
	}

	function allStepsDone(job: MorningJob): boolean {
		return neededSteps(job).every(s => isStepDone(job, s));
	}

	async function loadMorningWorkflow() {
		try {
			const res = await apiGet<{ inquiries: MorningInquiry[]; calendar_items: MorningCalendarItem[] }>(
				'/api/v1/admin/morning-workflow'
			);
			const jobs: MorningJob[] = [
				...res.inquiries.map(d => ({ kind: 'inquiry' as const, data: d })),
				...res.calendar_items.map(d => ({ kind: 'calendar_item' as const, data: d })),
			];
			if (jobs.length > 0) {
				morningJobs = jobs;
				morningIndex = 0;
				morningVisible = true;
			}
		} catch {
			// silently skip if endpoint fails
		}
	}

	async function doMarkComplete(job: MorningJob) {
		if (sendingStep) return;
		sendingStep = true;
		try {
			if (job.kind === 'inquiry') {
				await apiPatch(`/api/v1/inquiries/${job.data.id}`, { status: 'completed' });
				job.data.status = 'completed';
			} else {
				await apiPatch(`/api/v1/admin/calendar-items/${job.data.id}`, { status: 'completed' });
				job.data.status = 'completed';
			}
			markStep(job, 'complete');
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			sendingStep = false;
		}
	}

	async function doSendInvoice(job: MorningJob) {
		if (job.kind !== 'inquiry' || sendingStep) return;
		sendingStep = true;
		try {
			const inq = job.data;
			let invoiceId = inq.invoice_id;
			// Create invoice if none exists yet
			if (!invoiceId || !['ready', 'draft'].includes(inq.invoice_status ?? '')) {
				const created = await apiPost<{ id: string }[]>(
					`/api/v1/inquiries/${inq.id}/invoices`,
					{ invoice_type: 'full' }
				);
				invoiceId = created[0].id;
				inq.invoice_id = invoiceId;
				inq.invoice_status = 'ready';
			}
			// Send the invoice
			await apiPost(`/api/v1/inquiries/${inq.id}/invoices/${invoiceId}/send`, {});
			inq.invoice_status = 'sent';
			markStep(job, 'invoice');
			showToast('Rechnung gesendet', 'success');
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler beim Senden der Rechnung', 'error');
		} finally {
			sendingStep = false;
		}
	}

	async function doReviewAction(job: MorningJob, action: 'now' | 'later' | 'skip') {
		if (job.kind !== 'inquiry' || sendingStep) return;
		sendingStep = true;
		try {
			await apiPost(`/api/v1/admin/inquiries/${job.data.id}/review-request`, {
				action,
				...(action === 'later' ? { remind_after_days: reviewDays } : {}),
			});
			job.data.has_review_request = true;
			markStep(job, 'review');
			if (action === 'now') showToast('Bewertungsanfrage gesendet', 'success');
			else if (action === 'later') showToast(`Erinnerung in ${reviewDays} Tagen`, 'success');
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			sendingStep = false;
		}
	}

	function nextJob() {
		if (morningIndex < morningJobs.length - 1) {
			morningIndex++;
		} else {
			morningVisible = false;
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
		loadReviewReminders();
		loadMorningWorkflow();
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

<!-- Morning workflow dialog -->
{#if morningVisible && morningJobs.length > 0}
	{@const job = morningJobs[morningIndex]}
	{@const steps = neededSteps(job)}
	{@const isInquiry = job.kind === 'inquiry'}
	<div class="mw-overlay">
		<div class="mw-dialog">
			<div class="mw-header">
				<span class="mw-greeting">Guten Morgen — {morningJobs.length} {morningJobs.length === 1 ? 'Job' : 'Jobs'} zum Abschliessen</span>
				<span class="mw-counter">{morningIndex + 1} / {morningJobs.length}</span>
			</div>

			<div class="mw-job-title">
				{#if isInquiry}
					{job.data.customer_name ?? 'Unbekannt'} —
					{new Date(job.data.last_day ?? '').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
				{:else}
					{job.data.title} —
					{new Date(job.data.last_day ?? '').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
					<span class="mw-tag">Termin</span>
				{/if}
			</div>

			<div class="mw-steps">
				<!-- Step: Mark complete -->
				{#if steps.includes('complete')}
					<div class="mw-step" class:done={isStepDone(job, 'complete')}>
						<div class="mw-step-icon">
							<CheckCircle size={18} />
						</div>
						<div class="mw-step-body">
							<span class="mw-step-label">Als erledigt markieren</span>
							{#if !isStepDone(job, 'complete')}
								<button class="btn btn-primary btn-sm" disabled={sendingStep} onclick={() => doMarkComplete(job)}>
									Erledigt
								</button>
							{:else}
								<span class="mw-done-badge">✓ Erledigt</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Step: Send invoice (inquiries only) -->
				{#if isInquiry && steps.includes('invoice')}
					{@const invoiceReady = ['ready', 'draft'].includes(job.data.invoice_status ?? '')}
					{@const prevDone = !steps.includes('complete') || isStepDone(job, 'complete')}
					<div class="mw-step" class:done={isStepDone(job, 'invoice')} class:locked={!prevDone}>
						<div class="mw-step-icon">
							<Receipt size={18} />
						</div>
						<div class="mw-step-body">
							<span class="mw-step-label">
								{invoiceReady ? 'Rechnung senden' : 'Rechnung erstellen & senden'}
							</span>
							{#if !isStepDone(job, 'invoice')}
								<button
									class="btn btn-primary btn-sm"
									disabled={sendingStep || !prevDone}
									onclick={() => doSendInvoice(job)}
								>
									{invoiceReady ? 'Senden' : 'Erstellen & senden'}
								</button>
							{:else}
								<span class="mw-done-badge">✓ Gesendet</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Step: Review request (inquiries only) -->
				{#if isInquiry && steps.includes('review')}
					{@const prevDone = !steps.includes('invoice') || isStepDone(job, 'invoice')}
					<div class="mw-step" class:done={isStepDone(job, 'review')} class:locked={!prevDone}>
						<div class="mw-step-icon">
							<MessageSquare size={18} />
						</div>
						<div class="mw-step-body">
							<span class="mw-step-label">Bewertungsanfrage</span>
							{#if !isStepDone(job, 'review')}
								<div class="mw-review-row">
									<button class="btn btn-primary btn-sm" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'now')}>
										Jetzt
									</button>
									<button class="btn btn-sm" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'later')}>
										In <input type="number" class="mw-days-input" min="1" max="30" bind:value={reviewDays} onclick={(e) => e.stopPropagation()} /> Tagen
									</button>
									<button class="btn btn-sm mw-skip-btn" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'skip')}>
										Nicht
									</button>
								</div>
							{:else}
								<span class="mw-done-badge">✓ Erledigt</span>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="mw-footer">
				<button class="btn btn-sm mw-skip-job" onclick={nextJob}>
					{allStepsDone(job) ? (morningIndex < morningJobs.length - 1 ? 'Nächster →' : 'Fertig ✓') : 'Überspringen →'}
				</button>
			</div>
		</div>
	</div>
{/if}

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

	/* === Morning workflow dialog === */

	.mw-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.mw-dialog {
		background: var(--dt-surface);
		border-radius: var(--dt-radius-lg);
		padding: 1.75rem;
		width: min(520px, calc(100vw - 2rem));
		box-shadow: var(--dt-shadow-lg, 0 8px 32px rgba(0,0,0,.2));
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.mw-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.mw-greeting {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		font-weight: 500;
	}

	.mw-counter {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.mw-job-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--dt-on-surface);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.mw-tag {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
		padding: 0.1rem 0.4rem;
		border-radius: var(--dt-radius-sm);
	}

	.mw-steps {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.mw-step {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
		border-radius: var(--dt-radius-md);
		background: var(--dt-surface-container-low);
		transition: opacity var(--dt-transition);
	}

	.mw-step.done {
		opacity: 0.55;
	}

	.mw-step.locked {
		opacity: 0.35;
		pointer-events: none;
	}

	.mw-step-icon {
		color: var(--dt-primary);
		flex-shrink: 0;
		padding-top: 0.125rem;
	}

	.mw-step.done .mw-step-icon {
		color: #34d399;
	}

	.mw-step-body {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.mw-step-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--dt-on-surface);
	}

	.mw-done-badge {
		font-size: 0.8125rem;
		color: #34d399;
		font-weight: 600;
	}

	.mw-review-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.mw-days-input {
		width: 3rem;
		padding: 0 0.25rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		text-align: center;
		outline: none;
	}

	.mw-skip-btn {
		color: var(--dt-on-surface-variant);
	}

	.mw-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: 0.25rem;
		border-top: 1px solid var(--dt-outline-variant);
	}

	.mw-skip-job {
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-wrap: wrap;
		}
	}
</style>
