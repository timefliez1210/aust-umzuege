<script lang="ts">
	import { apiGet, apiPost, apiPatch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { CheckCircle, Receipt, MessageSquare } from 'lucide-svelte';
	import InvoiceSendModal from '$lib/components/admin/InvoiceSendModal.svelte';

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
		offer_price_cents: number | null;
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

	/**
	 * "Guten Morgen" step-through dialog for closing out yesterday's completed jobs
	 * (mark complete → send invoice → request review).
	 *
	 * Called by: admin/+page.svelte (mounted unconditionally; self-loads on mount)
	 * Purpose: Fully self-contained — fetches its own job queue via
	 *          GET /api/v1/admin/morning-workflow and stays hidden if that list is
	 *          empty, so the parent dashboard doesn't need to know about it at all.
	 */

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

	// Invoice send modal state
	let invoiceModalJob = $state<MorningJob | null>(null);

	function openInvoiceModal(job: MorningJob) {
		if (job.kind !== 'inquiry') return;
		invoiceModalJob = job;
	}

	function onInvoiceSent() {
		if (!invoiceModalJob || invoiceModalJob.kind !== 'inquiry') return;
		invoiceModalJob.data.invoice_status = 'sent';
		markStep(invoiceModalJob, 'invoice');
		invoiceModalJob = null;
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

	$effect(() => {
		loadMorningWorkflow();
	});
</script>

{#if morningVisible && morningJobs.length > 0}
	{@const job = morningJobs[morningIndex]}
	{@const steps = neededSteps(job)}
	{@const isInquiry = job.kind === 'inquiry'}
	<div class="mw-overlay">
		<div class="mw-dialog">
			<div class="mw-header">
				<span class="mw-greeting">Guten Morgen — {morningJobs.length} {morningJobs.length === 1 ? 'Job' : 'Jobs'} zum Abschliessen</span>
				<div class="mw-header-right">
					<span class="mw-counter">{morningIndex + 1} / {morningJobs.length}</span>
					<button class="mw-close" onclick={() => morningVisible = false} title="Alle überspringen">✕</button>
				</div>
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
					{@const prevDone = !steps.includes('complete') || isStepDone(job, 'complete')}
					<div class="mw-step" class:done={isStepDone(job, 'invoice')} class:locked={!prevDone}>
						<div class="mw-step-icon">
							<Receipt size={18} />
						</div>
						<div class="mw-step-body">
							<span class="mw-step-label">Rechnung vorbereiten & senden</span>
							{#if !isStepDone(job, 'invoice')}
								<button
									class="btn btn-primary btn-sm"
									disabled={!prevDone}
									onclick={() => openInvoiceModal(job)}
								>
									Rechnung &rarr;
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

{#if invoiceModalJob && invoiceModalJob.kind === 'inquiry'}
	<InvoiceSendModal
		inquiryId={invoiceModalJob.data.id}
		inquiryStatus={invoiceModalJob.data.status}
		customerName={invoiceModalJob.data.customer_name}
		offerPriceCents={invoiceModalJob.data.offer_price_cents}
		onSent={onInvoiceSent}
		onClose={() => invoiceModalJob = null}
	/>
{/if}

<style>
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

	.mw-header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.mw-counter {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}

	.mw-close {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--dt-on-surface-variant);
		font-size: 1rem;
		line-height: 1;
		padding: 0.125rem 0.25rem;
		border-radius: var(--dt-radius-sm);
		transition: color var(--dt-transition), background var(--dt-transition);
	}

	.mw-close:hover {
		color: var(--dt-on-surface);
		background: var(--dt-surface-container-high);
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
		.mw-overlay {
			align-items: flex-end;
			padding: 0;
		}

		.mw-dialog {
			width: 100%;
			max-width: 100%;
			max-height: 92vh;
			border-radius: var(--dt-radius-lg) var(--dt-radius-lg) 0 0;
			overflow-y: auto;
			-webkit-overflow-scrolling: touch;
		}

		.mw-footer {
			position: sticky;
			bottom: 0;
			background: var(--dt-surface);
			padding-top: 0.75rem;
		}

		.btn { min-height: 44px; }
	}
</style>
