<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiPost } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";

	let { open = $bindable(false), inquiryId }: { open: boolean; inquiryId: string } = $props();

	let reviewReminderDays = $state(3);
	let sendingReview = $state(false);

	/**
	 * Submits the review request action chosen by Alex in the popup.
	 *
	 * Called by: Template (popup buttons: Jetzt / Später / Nicht)
	 * Purpose: POSTs to /api/v1/admin/inquiries/{id}/review-request with action + optional days.
	 *
	 * @param action - "now" | "later" | "skip"
	 */
	async function submitReviewAction(action: 'now' | 'later' | 'skip') {
		sendingReview = true;
		try {
			await apiPost(`/api/v1/admin/inquiries/${inquiryId}/review-request`, {
				action,
				...(action === 'later' ? { remind_after_days: reviewReminderDays } : {}),
			});
			open = false;
			if (action === 'now') showToast('Bewertungsanfrage gesendet', 'success');
			else if (action === 'later') showToast(`Erinnerung in ${reviewReminderDays} Tagen`, 'success');
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			sendingReview = false;
		}
	}
</script>

<!-- Shown after marking an inquiry as "Erledigt". -->
{#if open}
	<Modal title="Bewertungsanfrage senden?" size="sm" onclose={() => (open = false)}>
		<p class="text-sm text-muted">Möchten Sie dem Kunden jetzt eine E-Mail mit der Bitte um eine Google-Bewertung schicken?</p>
		<label class="mt-4 flex items-center gap-2 text-[13px]" for="review-days">
			Bei „Später“ erinnern in
			<input
				id="review-days"
				type="number"
				min="1"
				max="30"
				class="num h-8 w-16 rounded-sm border border-line-strong bg-panel px-2 text-right outline-none focus:border-fg"
				bind:value={reviewReminderDays}
			/>
			Tagen
		</label>
		{#snippet footer()}
			<Button variant="ghost" disabled={sendingReview} onclick={() => submitReviewAction('skip')}>Nicht</Button>
			<Button disabled={sendingReview} onclick={() => submitReviewAction('later')}>Später ({reviewReminderDays} T)</Button>
			<Button variant="accent" disabled={sendingReview} onclick={() => submitReviewAction('now')}>Jetzt senden</Button>
		{/snippet}
	</Modal>
{/if}
