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
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

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

<Modal title="Anfrage aus E-Mail erstellen" onclose={onClose}>
	<form id="inquiry-from-email" class="flex flex-col gap-3" onsubmit={submit}>
		<p class="text-[13px] text-muted">
			Kunde: <strong class="text-fg">{customerName || customerEmail || 'Unbekannt'}</strong>
			{#if customerName && customerEmail}<span class="text-faint"> · {customerEmail}</span>{/if}
		</p>
		<div class="grid gap-3 sm:grid-cols-2">
			<Field label="Auftragsart" for="ife-type">
				<Select id="ife-type" bind:value={serviceType}>
					{#each SERVICE_OPTIONS as [value, label] (value)}<option {value}>{label}</option>{/each}
				</Select>
			</Field>
			<Field label="Umzugsdatum (optional)" for="ife-date"><Input id="ife-date" type="date" bind:value={scheduledDate} /></Field>
		</div>
		{#each [addrCfg.showOrigin ? 'origin' : null, addrCfg.showDestination ? 'dest' : null].filter(Boolean) as which (which)}
			<fieldset class="flex flex-col gap-2">
				<legend class="mb-1.5 text-xs font-medium text-muted">{which === 'origin' ? addrCfg.originLabel : addrCfg.destinationLabel}</legend>
				{#if which === 'origin'}
					<Input placeholder="Straße und Hausnummer" bind:value={originStreet} />
					<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
						<Input placeholder="PLZ" bind:value={originPostal} />
						<Input placeholder="Stadt" bind:value={originCity} />
					</div>
				{:else}
					<Input placeholder="Straße und Hausnummer" bind:value={destStreet} />
					<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
						<Input placeholder="PLZ" bind:value={destPostal} />
						<Input placeholder="Stadt" bind:value={destCity} />
					</div>
				{/if}
			</fieldset>
		{/each}
		<Field label="Notizen" for="ife-notes" hint="Vorbelegt mit dem Text der letzten Kundennachricht.">
			<Textarea id="ife-notes" rows={5} bind:value={notes} />
		</Field>
		{#if error}<Notice tone="danger">{error}</Notice>{/if}
	</form>
	{#snippet footer()}
		<Button onclick={onClose}>Abbrechen</Button>
		<Button type="submit" form="inquiry-from-email" variant="solid" disabled={submitting}>{submitting ? 'Wird erstellt …' : 'Anfrage erstellen'}</Button>
	{/snippet}
</Modal>
