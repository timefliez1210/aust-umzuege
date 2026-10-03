<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
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

<!-- One step of the close-out checklist. Steps unlock in order. -->
{#snippet step(Icon: typeof CheckCircle, label: string, done: boolean, locked: boolean, doneLabel: string, actions: import('svelte').Snippet)}
	<div class="flex items-start gap-3 rounded-md border px-3 py-2.5 {done ? 'border-ok/40 bg-ok/5' : 'border-line'} {locked ? 'opacity-45' : ''}">
		<span class="mt-0.5 {done ? 'text-ok' : 'text-muted'}"><Icon size={18} /></span>
		<div class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
			<span class="text-sm font-medium">{label}</span>
			{#if done}<Badge tone="ok">✓ {doneLabel}</Badge>{:else}{@render actions()}{/if}
		</div>
	</div>
{/snippet}

{#if morningVisible && morningJobs.length > 0}
	{@const job = morningJobs[morningIndex]}
	{@const steps = neededSteps(job)}
	{@const isInquiry = job.kind === 'inquiry'}
	<Modal
		title="Guten Morgen — {morningJobs.length} {morningJobs.length === 1 ? 'Job' : 'Jobs'} abschließen"
		description="{morningIndex + 1} von {morningJobs.length}"
		onclose={() => (morningVisible = false)}
	>
		<div class="flex flex-col gap-3">
			<p class="flex flex-wrap items-center gap-2 text-base font-semibold">
				{isInquiry ? (job.data as { customer_name: string | null }).customer_name ?? 'Unbekannt' : (job.data as { title: string }).title}
				<span class="num text-sm font-normal text-muted">
					{new Date(job.data.last_day ?? '').toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}
				</span>
				{#if !isInquiry}<Badge tone="info">Termin</Badge>{/if}
			</p>

			{#if steps.includes('complete')}
				{#snippet completeActions()}
					<Button size="sm" variant="solid" disabled={sendingStep} onclick={() => doMarkComplete(job)}>Erledigt</Button>
				{/snippet}
				{@render step(CheckCircle, 'Als erledigt markieren', isStepDone(job, 'complete'), false, 'Erledigt', completeActions)}
			{/if}

			{#if isInquiry && steps.includes('invoice')}
				{@const prevDone = !steps.includes('complete') || isStepDone(job, 'complete')}
				{#snippet invoiceActions()}
					<Button size="sm" variant="solid" disabled={!prevDone} onclick={() => openInvoiceModal(job)}>Rechnung →</Button>
				{/snippet}
				{@render step(Receipt, 'Rechnung vorbereiten & senden', isStepDone(job, 'invoice'), !prevDone, 'Gesendet', invoiceActions)}
			{/if}

			{#if isInquiry && steps.includes('review')}
				{@const prevDone = !steps.includes('invoice') || isStepDone(job, 'invoice')}
				{#snippet reviewActions()}
					<span class="flex flex-wrap items-center gap-1.5">
						<Button size="sm" variant="solid" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'now')}>Jetzt</Button>
						<Button size="sm" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'later')}>
							In
							<input
								type="number"
								aria-label="Tage"
								class="num h-6 w-10 rounded-xs border border-line-strong bg-panel text-center text-xs outline-none"
								min="1"
								max="30"
								bind:value={reviewDays}
								onclick={(e) => e.stopPropagation()}
							/>
							Tagen
						</Button>
						<Button size="sm" variant="ghost" disabled={sendingStep || !prevDone} onclick={() => doReviewAction(job, 'skip')}>Nicht</Button>
					</span>
				{/snippet}
				{@render step(MessageSquare, 'Bewertungsanfrage', isStepDone(job, 'review'), !prevDone, 'Erledigt', reviewActions)}
			{/if}
		</div>
		{#snippet footer()}
			<Button variant={allStepsDone(job) ? 'accent' : 'ghost'} onclick={nextJob}>
				{allStepsDone(job) ? (morningIndex < morningJobs.length - 1 ? 'Nächster →' : 'Fertig ✓') : 'Überspringen →'}
			</Button>
		{/snippet}
	</Modal>
{/if}

{#if invoiceModalJob && invoiceModalJob.kind === 'inquiry'}
	<InvoiceSendModal
		inquiryId={invoiceModalJob.data.id}
		inquiryStatus={invoiceModalJob.data.status}
		customerName={invoiceModalJob.data.customer_name}
		offerPriceCents={invoiceModalJob.data.offer_price_cents}
		onSent={onInvoiceSent}
		onClose={() => (invoiceModalJob = null)}
	/>
{/if}
