<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';

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

<Modal title="Bewertung anfragen" size="sm" onclose={onClose}>
	<p class="text-sm text-muted">
		Rechnung ist bezahlt und der Auftrag abgeschlossen. Soll {name} um eine Google-Rezension gebeten werden?
	</p>
	<label class="mt-4 flex items-center gap-2 text-[13px]">
		Später erinnern in
		<input
			class="num h-8 w-16 rounded-sm border border-line-strong bg-panel px-2 text-right outline-none focus:border-fg"
			type="number"
			min="1"
			max="90"
			bind:value={remindDays}
			disabled={busy}
			aria-label="Tage bis zur Erinnerung"
		/>
		Tagen
	</label>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => decide('skip')} disabled={busy}>Nicht fragen</Button>
		<Button onclick={() => decide('later')} disabled={busy}>In {remindDays} Tagen erinnern</Button>
		<Button variant="accent" onclick={() => decide('now')} disabled={busy}>{busy ? 'Sende …' : 'Jetzt senden'}</Button>
	{/snippet}
</Modal>
