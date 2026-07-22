<script lang="ts">
	import { apiPatch } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { ChevronRight, Pencil } from "lucide-svelte";

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

<!-- Customer -->
<div class="card" class:card--collapsed={!customerOpen}>
	<div class="card-header card-header--toggleable">
		<button class="card-toggle" onclick={onToggleCustomer} aria-expanded={customerOpen}>
			<span class="card-toggle-chev" class:open={customerOpen}><ChevronRight size={16} /></span>
			<h3>Kunde</h3>
		</button>
		{#if !editingCustomer && customerOpen}
			<button class="btn btn-sm" onclick={startEditCustomer}>
				<Pencil size={14} />
				Bearbeiten
			</button>
		{/if}
	</div>
	{#if customerOpen}
	{#if editingCustomer}
		<div class="form-grid">
			<div class="field">
				<label for="cust-type">Kundentyp</label>
				<select id="cust-type" bind:value={editCustomer.customer_type}>
					<option value={null}>–</option>
					<option value="private">Privat</option>
					<option value="business">Gewerbe</option>
				</select>
			</div>
			<div class="field">
				<label for="cust-company">Firma</label>
				<input id="cust-company" type="text" bind:value={editCustomer.company_name} placeholder="{editCustomer.customer_type === 'business' ? 'Firmenname' : 'optional'}" />
			</div>
			<div class="field">
				<label for="cust-salutation">Anrede</label>
				<select id="cust-salutation" bind:value={editCustomer.salutation}>
					<option value="">–</option>
					<option value="Herr">Herr</option>
					<option value="Frau">Frau</option>
					<option value="D">Divers</option>
				</select>
			</div>
			<div class="field">
				<label for="cust-first-name">Vorname</label>
				<input id="cust-first-name" type="text" bind:value={editCustomer.first_name} />
			</div>
			<div class="field">
				<label for="cust-last-name">Nachname</label>
				<input id="cust-last-name" type="text" bind:value={editCustomer.last_name} />
			</div>
			<div class="field full-width">
				<label for="cust-email">E-Mail</label>
				<input id="cust-email" type="email" bind:value={editCustomer.email} />
			</div>
			<div class="field full-width">
				<label for="cust-phone">Telefon</label>
				<input id="cust-phone" type="tel" bind:value={editCustomer.phone} />
			</div>
			<div class="field-actions full-width">
				<button class="btn btn-primary btn-sm" onclick={saveCustomer}>Speichern</button>
				<button class="btn btn-sm" onclick={() => (editingCustomer = false)}>Abbrechen</button>
			</div>
		</div>
	{:else}
		<div class="info-grid">
			<div class="info-item">
				<span class="info-label">Name</span>
				<span class="info-value name-with-salutation">
					{#if customer?.customer_type === 'business'}
						<span class="cust-type-badge" data-type="business">Gewerbe</span>
					{:else}
						<span class="cust-type-badge" data-type="private">Privat</span>
					{/if}
					{#if customer?.salutation}
						<span class="salutation-badge">{customer.salutation === "D" ? "Divers" : customer.salutation}</span>
					{/if}
					{customer?.first_name && customer?.last_name
						? `${customer.first_name} ${customer.last_name}`
						: (customer?.last_name ?? customer?.name ?? "—")}
				</span>
			</div>
			{#if customer?.company_name}
				<div class="info-item">
					<span class="info-label">Firma</span>
					<span class="info-value">{customer.company_name}</span>
				</div>
			{/if}
			<div class="info-item">
				<span class="info-label">E-Mail</span>
				<span class="info-value">{customer?.email}</span>
			</div>
			{#if customer?.phone}
				<div class="info-item">
					<span class="info-label">Telefon</span>
					<span class="info-value">{customer?.phone}</span>
				</div>
			{/if}
		</div>
	{/if}
	{/if}
</div>

{#if recipient}
	<div class="card" class:card--collapsed={!recipientOpen}>
		<div class="card-header card-header--toggleable">
			<button class="card-toggle" onclick={onToggleRecipient} aria-expanded={recipientOpen}>
				<span class="card-toggle-chev" class:open={recipientOpen}><ChevronRight size={16} /></span>
				<h3>Leistungsempfänger</h3>
			</button>
		</div>
		{#if recipientOpen}
		<div class="info-grid">
			<div class="info-item">
				<span class="info-label">Name</span>
				<span class="info-value">
					{#if recipient.salutation}
						<span class="salutation-badge">{recipient.salutation === "D" ? "Divers" : recipient.salutation}</span>
					{/if}
					{recipient.first_name && recipient.last_name
						? `${recipient.first_name} ${recipient.last_name}`
						: (recipient.last_name ?? "—")}
				</span>
			</div>
			<div class="info-item">
				<span class="info-label">E-Mail</span>
				<span class="info-value">{recipient.email ?? "—"}</span>
			</div>
			{#if recipient.phone}
				<div class="info-item">
					<span class="info-label">Telefon</span>
					<span class="info-value">{recipient.phone}</span>
				</div>
			{/if}
		</div>
		{/if}
	</div>
{/if}

<!-- Billing Address -->
<div class="card card--compact" class:card--collapsed={!billingOpen}>
	<div class="card-header card-header--action card-header--toggleable">
		<button class="card-toggle" onclick={onToggleBilling} aria-expanded={billingOpen}>
			<span class="card-toggle-chev" class:open={billingOpen}><ChevronRight size={16} /></span>
			<h3>Rechnungsadresse</h3>
		</button>
		{#if billingOpen}
			<button class="btn-edit" onclick={() => billingEditing = !billingEditing}>
				{billingEditing ? 'Schließen' : 'Bearbeiten'}
			</button>
		{/if}
	</div>

	{#if billingOpen}
	{#if effectiveBillingAddress}
		<div class="billing-addr-display">
			<div>{effectiveBillingAddress.street ?? ''} {effectiveBillingAddress.house_number ?? ''}</div>
			<div>{effectiveBillingAddress.postal_code ?? ''} {effectiveBillingAddress.city ?? ''}</div>
			{#if !billingAddress}
				<div class="billing-addr-source">
					{inquiryStatus === 'completed' || inquiryStatus === 'invoiced' || inquiryStatus === 'paid'
						? 'Einzugsadresse (Standard nach Umzug)'
						: 'Auszugsadresse (Standard)'}
				</div>
			{:else}
				<div class="billing-addr-source">Abweichende Rechnungsadresse</div>
			{/if}
		</div>
	{:else}
		<p class="billing-addr-hint">Keine Adresse verfügbar.</p>
	{/if}

	{#if billingEditing}
		<div class="billing-addr-form">
			<div class="billing-addr-row">
				<input type="text" placeholder="Strasse" bind:value={billingStreet} class="form-input billing-input--street" />
				<input type="text" placeholder="Nr." bind:value={billingNumber} class="form-input billing-input--nr" />
			</div>
			<div class="billing-addr-row">
				<input type="text" placeholder="PLZ" bind:value={billingPostal} class="form-input billing-input--plz" />
				<input type="text" placeholder="Ort" bind:value={billingCity} class="form-input billing-input--city" />
			</div>
			<div class="billing-addr-actions">
				<button class="btn btn-primary btn-sm" onclick={saveBillingAddress} disabled={billingSaving}>
					{billingSaving ? 'Speichert…' : 'Speichern'}
				</button>
				{#if billingAddress}
					<button class="btn btn-sm btn-tertiary" onclick={clearBillingAddress} disabled={billingSaving}>
						Zurücksetzen
					</button>
				{/if}
			</div>
		</div>
	{/if}
	{/if}
</div>

<style>
	.card--compact {
		padding: var(--dt-space-4);
	}

	/* Billing address: display saved address */
	.billing-addr-display {
		padding: var(--dt-space-3) var(--dt-space-4);
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-md);
		font-size: 0.9375rem;
		color: var(--dt-on-surface);
		line-height: 1.5;
		margin-bottom: var(--dt-space-3);
	}
	.billing-addr-source {
		margin-top: var(--dt-space-2);
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--dt-on-surface-variant);
	}

	.billing-addr-hint {
		font-size: 0.78rem;
		color: var(--dt-on-surface-variant);
		margin: 0;
		font-style: italic;
	}

	.billing-addr-form {
		margin-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.billing-addr-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.billing-addr-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	/* Billing address input sizing — replaces inline flex styles */
	.billing-input--street { flex: 2; }
	.billing-input--nr     { flex: 0 0 80px; }
	.billing-input--plz    { flex: 0 0 100px; }
	.billing-input--city   { flex: 2; }

	/* Tertiary button — amber text-only per design spec */
	.btn-tertiary {
		background: none;
		border: none;
		color: var(--dt-secondary);
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 0.375rem 0.625rem;
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.btn-tertiary:hover:not(:disabled) {
		background: var(--dt-surface-container-low);
	}

	.btn-tertiary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.info-label {
		font-size: 0.6875rem;
		color: var(--dt-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.info-value {
		font-size: 0.9375rem;
		color: var(--dt-on-surface);
	}

	.name-with-salutation {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.salutation-badge {
		display: inline-block;
		padding: 0.1rem 0.45rem;
		border-radius: var(--dt-radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--dt-surface-container);
		color: var(--dt-primary);
		letter-spacing: 0.03em;
	}

	.cust-type-badge {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		margin-right: 0.35rem;
		vertical-align: middle;
	}

	.cust-type-badge[data-type="business"] {
		background: #d1fae5;
		color: #065f46;
	}

	.cust-type-badge[data-type="private"] {
		background: #dbeafe;
		color: #1e40af;
	}

	@media (max-width: 768px) {
		.billing-addr-row {
			flex-wrap: wrap;
		}

		.billing-input--nr,
		.billing-input--plz {
			flex: 1 1 45%;
		}

		.billing-input--street,
		.billing-input--city {
			flex: 1 1 100%;
		}
	}
</style>
