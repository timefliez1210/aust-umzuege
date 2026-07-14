<script lang="ts">
	import { apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { X, Star } from 'lucide-svelte';

	interface Props {
		/** Inquiry the review request hangs off. */
		inquiryId: string;
		customerName: string | null;
		/** Called after a decision was recorded (sent, deferred, or skipped). */
		onDecided: () => void;
		onClose: () => void;
	}

	let { inquiryId, customerName, onDecided, onClose }: Props = $props();

	/** Matches the backend default (billing_reminder_service::DEFAULT_REVIEW_SNOOZE_DAYS). */
	let remindDays = $state(3);
	let busy = $state(false);

	const name = $derived(customerName ?? 'den Kunden');

	async function decide(action: 'now' | 'later' | 'skip') {
		busy = true;
		try {
			await apiPost(`/api/v1/admin/inquiries/${inquiryId}/review-request`, {
				action,
				...(action === 'later' ? { remind_after_days: remindDays } : {})
			});
			if (action === 'now') showToast('Bewertungsanfrage gesendet', 'success');
			else if (action === 'later') showToast(`Erinnerung in ${remindDays} Tagen`, 'success');
			else showToast('Bewertungsanfrage übersprungen', 'info');
			onDecided();
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			busy = false;
		}
	}
</script>

<div
	class="overlay"
	role="presentation"
	onclick={onClose}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
>
	<div
		class="modal"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
	>
		<div class="modal-header">
			<h2><Star size={16} /> Bewertung anfragen</h2>
			<button class="close-btn" onclick={onClose} title="Schlie&szlig;en"><X size={18} /></button>
		</div>

		<div class="modal-body">
			<p class="hint">
				Rechnung ist bezahlt und der Auftrag abgeschlossen. Soll {name} um eine
				Google-Rezension gebeten werden?
			</p>

			<div class="later-row">
				<span class="later-label">Sp&auml;ter erinnern in</span>
				<input
					class="days-input"
					type="number"
					min="1"
					max="90"
					bind:value={remindDays}
					disabled={busy}
					aria-label="Tage bis zur Erinnerung"
				/>
				<span class="later-label">Tagen</span>
			</div>
		</div>

		<div class="modal-footer">
			<button class="btn btn-ghost" onclick={() => decide('skip')} disabled={busy}>
				Nicht fragen
			</button>
			<button class="btn" onclick={() => decide('later')} disabled={busy}>
				In {remindDays} Tagen erinnern
			</button>
			<button class="btn btn-primary" onclick={() => decide('now')} disabled={busy}>
				{busy ? 'Sende…' : 'Jetzt senden'}
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
	}

	.modal {
		background: var(--dt-surface);
		border-radius: var(--dt-radius-lg);
		width: min(460px, calc(100vw - 2rem));
		display: flex;
		flex-direction: column;
		box-shadow: var(--dt-shadow-lg, 0 8px 32px rgba(0, 0, 0, 0.25));
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem 1rem;
		border-bottom: 1px solid var(--dt-outline-variant);
	}

	.modal-header h2 {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.close-btn {
		background: var(--dt-surface-container-high);
		border: 1px solid var(--dt-outline-variant);
		cursor: pointer;
		color: var(--dt-on-surface);
		padding: 0.3rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
	}

	.close-btn:hover {
		background: var(--dt-surface-container-highest, #ddd);
	}

	.modal-body {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.hint {
		font-size: 0.875rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
		line-height: 1.5;
	}

	.later-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
	}

	.later-label {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.days-input {
		width: 3.5rem;
		padding: 0.375rem 0.5rem;
		background: var(--dt-surface-container-low);
		border: 1px solid var(--dt-outline-variant);
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		text-align: right;
		outline: none;
	}

	.days-input:focus {
		border-color: var(--dt-primary);
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--dt-outline-variant);
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
		flex-wrap: wrap;
	}

	.btn-ghost {
		background: none;
		border: none;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
	}

	.btn-ghost:hover:not(:disabled) {
		color: var(--dt-on-surface);
		text-decoration: underline;
	}
</style>
