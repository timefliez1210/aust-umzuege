<script lang="ts">
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
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

<div class="flex flex-col gap-2">
	<Segmented
		label="Kundentyp"
		options={[
			{ value: 'private', label: 'Privat' },
			{ value: 'business', label: 'Gewerbe' }
		]}
		bind:value={customerType}
		class="self-start"
	/>
	{#if customerType === 'business'}
		<Input placeholder="Firmenname *" bind:value={newCustomerCompanyName} />
	{/if}
	<div class="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
		<Select bind:value={newCustomerSalutation} aria-label="Anrede">
			<option value="">Anrede</option>
			<option value="Herr">Herr</option>
			<option value="Frau">Frau</option>
			<option value="D">Divers</option>
		</Select>
		<Input placeholder="Name" bind:value={newCustomerName} />
	</div>
	<div class="grid gap-2 sm:grid-cols-2">
		<Input type="email" placeholder="E-Mail" bind:value={newCustomerEmail} />
		<Input type="tel" placeholder="Telefon" bind:value={newCustomerPhone} />
	</div>

	{#if customerType === 'private'}
		<div role="group" aria-label="Für wen buchen Sie?" class="mt-1 inline-flex gap-0.5 self-start rounded-md border border-line bg-sunk p-0.5">
			{#each [{ v: true, l: 'Für mich selbst' }, { v: false, l: 'Für jemand anderen' }] as o (o.l)}
				<button
					type="button"
					aria-pressed={bookingForSelf === o.v}
					onclick={() => (bookingForSelf = o.v)}
					class="h-8 rounded-sm border px-3 text-[13px] {bookingForSelf === o.v
						? 'border-line-strong bg-panel text-fg'
						: 'border-transparent text-muted hover:text-fg'}">{o.l}</button
				>
			{/each}
		</div>
		{#if !bookingForSelf}
			<div class="flex flex-col gap-2 rounded-md border border-line bg-sunk p-3">
				<h4 class="label-xs text-faint">Leistungsempfänger</h4>
				<div class="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)]">
					<Select bind:value={recipientSalutation} aria-label="Anrede Leistungsempfänger">
						<option value="">Anrede</option>
						<option>Herr</option><option>Frau</option><option>Divers</option>
					</Select>
					<Input placeholder="Vorname" bind:value={recipientFirstName} />
					<Input placeholder="Nachname *" bind:value={recipientLastName} />
				</div>
				<div class="grid gap-2 sm:grid-cols-2">
					<Input type="tel" placeholder="Telefon" bind:value={recipientPhone} />
					<Input type="email" placeholder="E-Mail" bind:value={recipientEmail} />
				</div>
			</div>
		{/if}
	{/if}
</div>
