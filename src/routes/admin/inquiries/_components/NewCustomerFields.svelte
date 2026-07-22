<script lang="ts">
	/**
	 * The "Neu anlegen" customer form inside CreateInquiryModal's Kunde section:
	 * customer type toggle, contact fields, and (for private customers) the
	 * "booking for someone else" recipient sub-form.
	 *
	 * Called by: CreateInquiryModal.svelte (when customerMode === 'new')
	 * Purpose: Mechanical extraction to shrink CreateInquiryModal — all fields are
	 *          `$bindable` so the parent's existing $state variables keep working
	 *          unchanged, and clearCustomer() in the parent still resets them directly.
	 */
	interface Props {
		customerType: 'private' | 'business';
		newCustomerCompanyName: string;
		newCustomerSalutation: string;
		newCustomerEmail: string;
		newCustomerName: string;
		newCustomerPhone: string;
		bookingForSelf: boolean;
		recipientSalutation: string;
		recipientFirstName: string;
		recipientLastName: string;
		recipientPhone: string;
		recipientEmail: string;
	}

	let {
		customerType = $bindable(),
		newCustomerCompanyName = $bindable(),
		newCustomerSalutation = $bindable(),
		newCustomerEmail = $bindable(),
		newCustomerName = $bindable(),
		newCustomerPhone = $bindable(),
		bookingForSelf = $bindable(),
		recipientSalutation = $bindable(),
		recipientFirstName = $bindable(),
		recipientLastName = $bindable(),
		recipientPhone = $bindable(),
		recipientEmail = $bindable(),
	}: Props = $props();
</script>

<div class="new-customer-form">
	<div class="type-toggle" role="group" aria-label="Kundentyp">
		<button type="button" class="type-btn" class:active={customerType === 'private'}
			onclick={() => customerType = 'private'}>Privat</button>
		<button type="button" class="type-btn" class:active={customerType === 'business'}
			onclick={() => customerType = 'business'}>Gewerbe</button>
	</div>
	{#if customerType === 'business'}
		<input type="text" placeholder="Firmenname *" bind:value={newCustomerCompanyName} class="form-input" />
	{/if}
	<select bind:value={newCustomerSalutation} class="form-input">
		<option value="">Anrede</option>
		<option value="Herr">Herr</option>
		<option value="Frau">Frau</option>
		<option value="D">Divers</option>
	</select>
	<input type="email" placeholder="E-Mail" bind:value={newCustomerEmail} class="form-input" />
	<input type="text" placeholder="Name" bind:value={newCustomerName} class="form-input" />
	<input type="tel" placeholder="Telefon" bind:value={newCustomerPhone} class="form-input" />

	{#if customerType === 'private'}
		<div class="booking-for-toggle" role="group" aria-label="Für wen buchen Sie?">
			<button type="button" class="type-btn" class:active={bookingForSelf}
				onclick={() => bookingForSelf = true}>Für mich selbst</button>
			<button type="button" class="type-btn" class:active={!bookingForSelf}
				onclick={() => bookingForSelf = false}>Für jemand anderen</button>
		</div>
		{#if !bookingForSelf}
			<div class="recipient-fields">
				<h4>Leistungsempfänger</h4>
				<div class="address-row">
					<select bind:value={recipientSalutation} class="form-select">
						<option value="">Anrede</option>
						<option>Herr</option><option>Frau</option><option>Divers</option>
					</select>
					<input type="text" placeholder="Vorname" bind:value={recipientFirstName} class="form-input" />
					<input type="text" placeholder="Nachname *" bind:value={recipientLastName} class="form-input" />
				</div>
				<div class="address-row">
					<input type="tel" placeholder="Telefon" bind:value={recipientPhone} class="form-input" />
					<input type="email" placeholder="E-Mail" bind:value={recipientEmail} class="form-input" />
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.new-customer-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		border: none;
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		box-sizing: border-box;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
		border-bottom: 2px solid transparent;
	}

	.form-input::placeholder {
		color: var(--dt-on-surface-variant);
	}

	.form-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}

	.form-select {
		padding: 0.5rem 0.75rem;
		border-radius: var(--dt-radius-sm);
		border: none;
		background: var(--dt-surface-container-high);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		outline: none;
		cursor: pointer;
		transition: background var(--dt-transition);
	}

	.form-select:focus {
		background: var(--dt-surface-container-lowest);
		outline: 2px solid var(--dt-primary);
	}

	.address-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.type-toggle {
		display: inline-flex;
		align-self: flex-start;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.6rem;
	}

	.type-btn {
		padding: 0.35rem 0.85rem;
		border: none;
		background: var(--dt-surface-container-lowest);
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		cursor: pointer;
		transition: all 0.12s;
	}

	.type-btn:not(:first-child) { border-left: 1.5px solid var(--dt-outline-variant); }
	.type-btn.active { background: var(--dt-primary); color: #fff; }

	.booking-for-toggle {
		display: inline-flex;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		overflow: hidden;
		margin-top: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.recipient-fields {
		background: var(--dt-surface-container);
		border-radius: 8px;
		padding: 0.75rem;
		margin-top: 0.5rem;
	}

	.recipient-fields h4 {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--dt-primary);
		margin: 0 0 0.5rem;
	}

	@media (max-width: 768px) {
		.address-row {
			flex-wrap: wrap;
		}
	}
</style>
