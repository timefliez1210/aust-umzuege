<script lang="ts">
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

<!-- Review request popup — shown after marking an inquiry as "Erledigt".
     Uses the shared .modal-overlay/.modal/.modal-actions classes so it
     automatically becomes a bottom sheet on mobile (admin-components.css). -->
{#if open}
	<div
		class="modal-overlay"
		role="presentation"
		onclick={() => (open = false)}
		onkeydown={(e) => e.key === 'Escape' && (open = false)}
		tabindex="-1"
	>
		<div
			class="modal review-dialog"
			role="dialog"
			aria-modal="true"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2>Bewertungsanfrage senden?</h2>
			<p>
				Möchten Sie dem Kunden jetzt eine E-Mail mit der Bitte um eine Google-Bewertung schicken?
			</p>
			<div class="review-later-row">
				<label for="review-days">Bei „Später" erinnern in</label>
				<input
					id="review-days"
					type="number"
					min="1"
					max="30"
					bind:value={reviewReminderDays}
				/>
				<span>Tagen</span>
			</div>
			<div class="modal-actions review-actions">
				<button
					class="btn btn-primary"
					disabled={sendingReview}
					onclick={() => submitReviewAction('now')}
				>
					Jetzt senden
				</button>
				<button
					class="btn"
					disabled={sendingReview}
					onclick={() => submitReviewAction('later')}
				>
					Später ({reviewReminderDays}d)
				</button>
				<button
					class="btn btn-muted"
					disabled={sendingReview}
					onclick={() => submitReviewAction('skip')}
				>
					Nicht
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.review-dialog {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.review-dialog p {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
	}

	.review-later-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
	}

	.review-later-row input[type="number"] {
		width: 4rem;
		padding: 0.25rem 0.375rem;
		background: var(--dt-surface-container-high);
		border: 1px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
	}

	.review-actions .btn {
		flex: 1;
		min-width: 7rem;
		justify-content: center;
	}
</style>
