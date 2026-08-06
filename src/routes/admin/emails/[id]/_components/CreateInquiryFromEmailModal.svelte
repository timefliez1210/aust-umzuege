<script lang="ts">
	/**
	 * Turns an incoming customer email into an Anfrage without leaving the mailbox.
	 *
	 * Feedback report 71e097f6: "Ich kann aus den Emails keine Anfrage erstellen, nur
	 * über Umstände" — the only route was to open /admin/inquiries, re-type the
	 * customer, and lose the link to the conversation.
	 *
	 * The thread already carries the customer, so no customer lookup is needed here:
	 * the modal collects service type, addresses and date, POSTs the inquiry, then
	 * links the thread to it so the mail and the Anfrage stay connected.
	 */
	import { apiPost, apiPatch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { SERVICE_TYPE_LABELS, SERVICE_ADDRESS_CONFIG } from '$lib/utils/constants';
	import { X } from 'lucide-svelte';

	let {
		threadId,
		customerId,
		customerName,
		customerEmail,
		/** Body of the newest inbound message — prefills the notes field. */
		initialNotes = '',
		onCreated,
		onClose
	}: {
		threadId: string;
		customerId: string;
		customerName: string | null;
		customerEmail: string | null;
		initialNotes?: string;
		onCreated: (inquiryId: string) => void;
		onClose: () => void;
	} = $props();

	const SERVICE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS) as [string, string][];

	let serviceType = $state('privatumzug');
	let scheduledDate = $state('');
	let originStreet = $state('');
	let originCity = $state('');
	let originPostal = $state('');
	let destStreet = $state('');
	let destCity = $state('');
	let destPostal = $state('');
	// Intentionally a one-time seed: the modal is mounted fresh each time it opens,
	// and Alex must be able to edit the text afterwards.
	// svelte-ignore state_referenced_locally
	let notes = $state(initialNotes);
	let submitting = $state(false);
	let error = $state('');

	let addrCfg = $derived(SERVICE_ADDRESS_CONFIG[serviceType] ?? SERVICE_ADDRESS_CONFIG['privatumzug']);

	/**
	 * Creates the inquiry and links this email thread to it.
	 *
	 * Called by: Template (form submit).
	 * Purpose: One click from mail to Anfrage. The link is a best-effort second step —
	 * if it fails the Anfrage still exists, so we surface a warning rather than an error.
	 */
	async function submit(e: Event) {
		e.preventDefault();
		if (addrCfg.showOrigin && (!originStreet.trim() || !originCity.trim())) {
			error = `${addrCfg.originLabel} (Straße, Stadt) erforderlich`;
			return;
		}
		if (
			addrCfg.showDestination &&
			!addrCfg.optionalDestination &&
			(!destStreet.trim() || !destCity.trim())
		) {
			error = `${addrCfg.destinationLabel} (Straße, Stadt) erforderlich`;
			return;
		}

		error = '';
		submitting = true;
		try {
			const body: Record<string, unknown> = {
				customer_id: customerId,
				service_type: serviceType,
				scheduled_date: scheduledDate || null,
				notes: notes.trim() || null
			};
			if (addrCfg.showOrigin) {
				body.origin = {
					street: originStreet.trim(),
					city: originCity.trim(),
					postal_code: originPostal.trim() || null
				};
			}
			if (
				addrCfg.showDestination &&
				(!addrCfg.optionalDestination || destStreet.trim() || destCity.trim())
			) {
				body.destination = {
					street: destStreet.trim(),
					city: destCity.trim(),
					postal_code: destPostal.trim() || null
				};
			}

			const created = await apiPost<{ id: string }>('/api/v1/inquiries', body);

			try {
				await apiPatch(`/api/v1/admin/emails/${threadId}/inquiry`, { inquiry_id: created.id });
			} catch {
				showToast('Anfrage erstellt, aber die E-Mail konnte nicht verknüpft werden', 'error');
			}

			showToast('Anfrage aus E-Mail erstellt', 'success');
			onCreated(created.id);
		} catch (e: any) {
			error = e?.message || 'Anfrage konnte nicht erstellt werden';
		} finally {
			submitting = false;
		}
	}
</script>

<div
	class="backdrop"
	role="presentation"
	onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
>
	<div class="modal" role="dialog" aria-modal="true" aria-label="Anfrage aus E-Mail erstellen">
		<div class="modal-head">
			<h3>Anfrage aus E-Mail erstellen</h3>
			<button type="button" class="icon-btn" onclick={onClose} aria-label="Schließen">
				<X size={18} />
			</button>
		</div>

		<p class="customer-line">
			Kunde: <strong>{customerName || customerEmail || 'Unbekannt'}</strong>
			{#if customerName && customerEmail}<span class="muted"> · {customerEmail}</span>{/if}
		</p>

		<form onsubmit={submit}>
			<label>
				Auftragsart
				<select bind:value={serviceType}>
					{#each SERVICE_OPTIONS as [value, label]}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>

			<label>
				Umzugsdatum (optional)
				<input type="date" bind:value={scheduledDate} />
			</label>

			{#if addrCfg.showOrigin}
				<fieldset>
					<legend>{addrCfg.originLabel}</legend>
					<input type="text" placeholder="Straße und Hausnummer" bind:value={originStreet} />
					<div class="row">
						<input class="plz" type="text" placeholder="PLZ" bind:value={originPostal} />
						<input type="text" placeholder="Stadt" bind:value={originCity} />
					</div>
				</fieldset>
			{/if}

			{#if addrCfg.showDestination}
				<fieldset>
					<legend>{addrCfg.destinationLabel}</legend>
					<input type="text" placeholder="Straße und Hausnummer" bind:value={destStreet} />
					<div class="row">
						<input class="plz" type="text" placeholder="PLZ" bind:value={destPostal} />
						<input type="text" placeholder="Stadt" bind:value={destCity} />
					</div>
				</fieldset>
			{/if}

			<label>
				Notizen
				<textarea rows="5" bind:value={notes}></textarea>
				<span class="hint">Vorbelegt mit dem Text der letzten Kundennachricht.</span>
			</label>

			{#if error}
				<div class="error-box">{error}</div>
			{/if}

			<div class="actions">
				<button type="button" class="btn-ghost" onclick={onClose}>Abbrechen</button>
				<button type="submit" class="btn-primary" disabled={submitting}>
					{submitting ? 'Wird erstellt…' : 'Anfrage erstellen'}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.backdrop {
		position: fixed; inset: 0; z-index: 60;
		background: rgba(0, 0, 0, 0.45);
		display: flex; align-items: center; justify-content: center;
		padding: var(--dt-space-4);
	}
	.modal {
		width: min(560px, 100%); max-height: 90vh; overflow-y: auto;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg); padding: var(--dt-space-6);
		box-shadow: var(--dt-elevation-3, 0 8px 32px rgba(0, 0, 0, 0.25));
	}
	.modal-head {
		display: flex; align-items: center; justify-content: space-between;
		margin-bottom: var(--dt-space-2);
	}
	.modal-head h3 { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--dt-on-surface); }
	.icon-btn {
		border: none; background: none; cursor: pointer;
		color: var(--dt-on-surface-variant); padding: 4px; line-height: 0;
	}

	.customer-line {
		margin: 0 0 var(--dt-space-4); font-size: 0.875rem; color: var(--dt-on-surface);
	}
	.muted { color: var(--dt-on-surface-variant); }

	form { display: flex; flex-direction: column; gap: var(--dt-space-4); }
	label {
		display: flex; flex-direction: column; gap: 0.35rem;
		font-size: 0.8125rem; font-weight: 600; color: var(--dt-on-surface-variant);
	}
	fieldset {
		display: flex; flex-direction: column; gap: 0.5rem;
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-md);
		padding: var(--dt-space-3);
	}
	legend {
		font-size: 0.8125rem; font-weight: 600; color: var(--dt-on-surface-variant);
		padding: 0 0.35rem;
	}
	.row { display: flex; gap: 0.5rem; }
	.row .plz { flex: 0 0 90px; }
	.row input:not(.plz) { flex: 1; }

	input, select, textarea {
		width: 100%; padding: 0.55rem 0.7rem;
		border: var(--dt-ghost-border); border-radius: var(--dt-radius-md);
		background: var(--dt-surface-container-low); color: var(--dt-on-surface);
		font-size: 0.9375rem; font-weight: 400; font-family: inherit;
	}
	textarea { resize: vertical; }
	.hint { font-size: 0.75rem; font-weight: 400; color: var(--dt-on-surface-variant); }

	.error-box {
		background: var(--dt-error-bg); border: 1px solid var(--dt-error-text);
		color: var(--dt-error-text); padding: var(--dt-space-3);
		border-radius: var(--dt-radius-md); font-size: 0.875rem;
	}

	.actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
	.btn-ghost, .btn-primary {
		padding: 0.55rem 1.1rem; border-radius: var(--dt-radius-md);
		font-size: 0.875rem; font-weight: 600; cursor: pointer;
	}
	.btn-ghost {
		border: var(--dt-ghost-border); background: transparent; color: var(--dt-on-surface);
	}
	.btn-primary {
		border: none; background: var(--dt-primary); color: var(--dt-on-primary);
	}
	.btn-primary:disabled { opacity: 0.6; cursor: default; }

	@media (max-width: 768px) {
		.modal { padding: var(--dt-space-4); }
		input, select, textarea, .btn-ghost, .btn-primary { min-height: 44px; }
	}
</style>
