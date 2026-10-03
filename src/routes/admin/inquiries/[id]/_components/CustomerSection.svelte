<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import KeyValue from '$lib/components/ui/KeyValue.svelte';
	import { apiPatch } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { Pencil } from "lucide-svelte";

	interface AddressSnapshot {
		street: string;
		house_number: string | null;
		city: string;
		postal_code: string | null;
	}

	interface CustomerSnapshot {
		id: string;
		name: string | null;
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		email: string;
		phone: string | null;
		customer_type: string | null;
		company_name: string | null;
	}

	interface RecipientSnapshot {
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		phone: string | null;
	}

	let {
		inquiryId,
		inquiryStatus,
		customer,
		recipient,
		billingAddress,
		effectiveBillingAddress,
		customerOpen = $bindable(),
		recipientOpen = $bindable(),
		billingOpen = $bindable(),
		onToggleCustomer,
		onToggleRecipient,
		onToggleBilling,
		onSaved,
	}: {
		inquiryId: string;
		inquiryStatus: string;
		customer: CustomerSnapshot | null;
		recipient: RecipientSnapshot | null;
		billingAddress: AddressSnapshot | null;
		effectiveBillingAddress: AddressSnapshot | null;
		customerOpen: boolean;
		recipientOpen: boolean;
		billingOpen: boolean;
		onToggleCustomer: () => void;
		onToggleRecipient: () => void;
		onToggleBilling: () => void;
		onSaved: () => void | Promise<void>;
	} = $props();

	// Billing address editor state
	let billingSaving = $state(false);
	let billingEditing = $state(false);
	let billingStreet = $state('');
	let billingNumber = $state('');
	let billingPostal = $state('');
	let billingCity = $state('');
	let billingLoadedForId = $state<string | null>(null);

	// Pre-fill billing fields once per loaded inquiry so admin edits aren't clobbered on reload.
	$effect(() => {
		if (inquiryId !== billingLoadedForId) {
			billingStreet = billingAddress?.street ?? '';
			billingNumber = billingAddress?.house_number ?? '';
			billingPostal = billingAddress?.postal_code ?? '';
			billingCity = billingAddress?.city ?? '';
			billingLoadedForId = inquiryId;
		}
	});

	let editingCustomer = $state(false);
	let editCustomer = $state({ salutation: "", first_name: "", last_name: "", email: "", phone: "", customer_type: "private", company_name: "" });

	/**
	 * Copies the origin address fields into the inline edit form and activates origin edit mode.
	 *
	 * Called by: Template (onclick on the "Bearbeiten" button in the Kunde card)
	 * Purpose: Seeds the inline customer editor with the current values.
	 *
	 * @returns void (side-effect: populates `editCustomer`, sets `editingCustomer = true`)
	 */
	function startEditCustomer() {
		if (!customer) return;
		const c = customer;
		editCustomer = {
			salutation: c.salutation ?? "",
			first_name: c.first_name ?? "",
			last_name: c.last_name ?? c.name ?? "",
			email: c.email,
			phone: c.phone ?? "",
			customer_type: c.customer_type ?? "private",
			company_name: c.company_name ?? "",
		};
		editingCustomer = true;
	}

	/**
	 * Saves the edited customer fields to the API and exits edit mode.
	 *
	 * Called by: Template (onclick on the "Speichern" button in the Kunde card)
	 * Purpose: Persists name, email and phone corrections via PATCH /api/v1/admin/customers/{id}.
	 *
	 * @returns void (side-effect: shows toast, sets editingCustomer = false, reloads inquiry)
	 */
	async function saveCustomer() {
		if (!customer) return;
		try {
			await apiPatch(`/api/v1/admin/customers/${customer.id}`, {
				salutation: editCustomer.salutation || null,
				first_name: editCustomer.first_name || null,
				last_name: editCustomer.last_name || null,
				email: editCustomer.email || null,
				phone: editCustomer.phone || null,
				customer_type: editCustomer.customer_type || null,
				company_name: editCustomer.company_name || null,
			});
			showToast("Kunde gespeichert", "success");
			editingCustomer = false;
			await onSaved();
		} catch (e) {
			showToast((e as Error).message, "error");
		}
	}

	/** Save or update the billing address for this inquiry. */
	async function saveBillingAddress() {
		billingSaving = true;
		try {
			const patch: Record<string, unknown> = {};
			if (billingStreet.trim() || billingCity.trim()) {
				patch.billing_address = {
					street: billingStreet.trim() || null,
					house_number: billingNumber.trim() || null,
					postal_code: billingPostal.trim() || null,
					city: billingCity.trim() || null,
				};
			} else {
				patch.clear_billing_address = true;
			}
			await apiPatch(`/api/v1/inquiries/${inquiryId}`, patch);
			showToast("Rechnungsadresse gespeichert", "success");
			billingLoadedForId = null;
			await onSaved();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			billingSaving = false;
		}
	}

	/** Clear the billing address override (fall back to auto-resolution). */
	async function clearBillingAddress() {
		billingSaving = true;
		try {
			await apiPatch(`/api/v1/inquiries/${inquiryId}`, { clear_billing_address: true });
			showToast("Rechnungsadresse zurückgesetzt", "success");
			billingStreet = '';
			billingNumber = '';
			billingPostal = '';
			billingCity = '';
			billingLoadedForId = null;
			await onSaved();
		} catch (e) {
			showToast((e as Error).message, "error");
		} finally {
			billingSaving = false;
		}
	}
</script>

<Panel title="Kunde" open={customerOpen} onToggle={onToggleCustomer}>
	{#snippet actions()}
		{#if !editingCustomer}
			<Button size="sm" variant="ghost" onclick={startEditCustomer}><Pencil size={14} /> Bearbeiten</Button>
		{/if}
	{/snippet}
	{#if editingCustomer}
		<div class="grid grid-cols-2 gap-3">
			<Field label="Kundentyp" for="cust-type">
				<Select id="cust-type" bind:value={editCustomer.customer_type}>
					<option value={null}>–</option>
					<option value="private">Privat</option>
					<option value="business">Gewerbe</option>
				</Select>
			</Field>
			<Field label="Firma" for="cust-company">
				<Input
					id="cust-company"
					bind:value={editCustomer.company_name}
					placeholder={editCustomer.customer_type === 'business' ? 'Firmenname' : 'optional'}
				/>
			</Field>
			<Field label="Anrede" for="cust-salutation" class="col-span-2 sm:col-span-1">
				<Select id="cust-salutation" bind:value={editCustomer.salutation}>
					<option value="">–</option>
					<option value="Herr">Herr</option>
					<option value="Frau">Frau</option>
					<option value="D">Divers</option>
				</Select>
			</Field>
			<span class="hidden sm:block"></span>
			<Field label="Vorname" for="cust-first-name"><Input id="cust-first-name" bind:value={editCustomer.first_name} /></Field>
			<Field label="Nachname" for="cust-last-name"><Input id="cust-last-name" bind:value={editCustomer.last_name} /></Field>
			<Field label="E-Mail" for="cust-email" class="col-span-2">
				<Input id="cust-email" type="email" bind:value={editCustomer.email} />
			</Field>
			<Field label="Telefon" for="cust-phone" class="col-span-2">
				<Input id="cust-phone" type="tel" bind:value={editCustomer.phone} />
			</Field>
			<div class="col-span-2 flex gap-2">
				<Button size="sm" variant="solid" onclick={saveCustomer}>Speichern</Button>
				<Button size="sm" onclick={() => (editingCustomer = false)}>Abbrechen</Button>
			</div>
		</div>
	{:else}
		<dl class="-my-1.5">
			<KeyValue label="Name">
				<span class="inline-flex flex-wrap items-center gap-1.5">
					<Badge>{customer?.customer_type === 'business' ? 'Gewerbe' : 'Privat'}</Badge>
					{#if customer?.salutation}
						<span class="text-muted">{customer.salutation === 'D' ? 'Divers' : customer.salutation}</span>
					{/if}
					<span class="font-medium">
						{customer?.first_name && customer?.last_name
							? `${customer.first_name} ${customer.last_name}`
							: (customer?.last_name ?? customer?.name ?? '—')}
					</span>
				</span>
			</KeyValue>
			{#if customer?.company_name}
				<KeyValue label="Firma">{customer.company_name}</KeyValue>
			{/if}
			<KeyValue label="E-Mail">
				{#if customer?.email}<a class="hover:underline" href="mailto:{customer.email}">{customer.email}</a>{:else}—{/if}
			</KeyValue>
			{#if customer?.phone}
				<KeyValue label="Telefon"><a class="num hover:underline" href="tel:{customer.phone}">{customer.phone}</a></KeyValue>
			{/if}
		</dl>
	{/if}
</Panel>

{#if recipient}
	<Panel title="Leistungsempfänger" open={recipientOpen} onToggle={onToggleRecipient}>
		<dl class="-my-1.5">
			<KeyValue label="Name">
				{#if recipient.salutation}
					<span class="mr-1 text-muted">{recipient.salutation === 'D' ? 'Divers' : recipient.salutation}</span>
				{/if}
				{recipient.first_name && recipient.last_name
					? `${recipient.first_name} ${recipient.last_name}`
					: (recipient.last_name ?? '—')}
			</KeyValue>
			<KeyValue label="E-Mail">{recipient.email ?? '—'}</KeyValue>
			{#if recipient.phone}
				<KeyValue label="Telefon"><a class="num hover:underline" href="tel:{recipient.phone}">{recipient.phone}</a></KeyValue>
			{/if}
		</dl>
	</Panel>
{/if}

<Panel title="Rechnungsadresse" open={billingOpen} onToggle={onToggleBilling}>
	{#snippet actions()}
		<Button size="sm" variant="ghost" onclick={() => (billingEditing = !billingEditing)}>
			{billingEditing ? 'Schließen' : 'Bearbeiten'}
		</Button>
	{/snippet}
	{#if effectiveBillingAddress}
		<div class="text-sm leading-relaxed">
			<div>{effectiveBillingAddress.street ?? ''} {effectiveBillingAddress.house_number ?? ''}</div>
			<div>{effectiveBillingAddress.postal_code ?? ''} {effectiveBillingAddress.city ?? ''}</div>
			<div class="mt-1 text-xs text-faint">
				{#if !billingAddress}
					{inquiryStatus === 'completed' || inquiryStatus === 'invoiced' || inquiryStatus === 'paid'
						? 'Einzugsadresse (Standard nach Umzug)'
						: 'Auszugsadresse (Standard)'}
				{:else}
					Abweichende Rechnungsadresse
				{/if}
			</div>
		</div>
	{:else}
		<p class="text-sm text-muted">Keine Adresse verfügbar.</p>
	{/if}

	{#if billingEditing}
		<div class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
			<div class="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
				<Input placeholder="Straße" bind:value={billingStreet} />
				<Input placeholder="Nr." bind:value={billingNumber} />
			</div>
			<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
				<Input placeholder="PLZ" bind:value={billingPostal} />
				<Input placeholder="Ort" bind:value={billingCity} />
			</div>
			<div class="flex gap-2">
				<Button size="sm" variant="solid" onclick={saveBillingAddress} disabled={billingSaving}>
					{billingSaving ? 'Speichert …' : 'Speichern'}
				</Button>
				{#if billingAddress}
					<Button size="sm" variant="ghost" onclick={clearBillingAddress} disabled={billingSaving}>Zurücksetzen</Button>
				{/if}
			</div>
		</div>
	{/if}
</Panel>
