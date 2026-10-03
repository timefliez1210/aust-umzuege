<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import { ArrowLeft, Save, Trash2 } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { CUSTOMER_TYPE_LABELS } from '$lib/utils/constants';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import LoadingButton from '$lib/components/admin/LoadingButton.svelte';
	import { formatKnownAddress, type KnownAddress } from '$lib/utils/addressBook';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

	interface CustomerDetail {
		id: string;
		email: string | null;
		name: string | null;
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		customer_type: string | null;
		company_name: string | null;
		notes: string | null;
		billing_address_id: string | null;
		billing_address: {
			street: string | null;
			house_number: string | null;
			postal_code: string | null;
			city: string | null;
		} | null;
		created_at: string;
		quotes: { id: string; status: string; estimated_volume_m3: number | null; scheduled_date: string | null; created_at: string }[];
		offers: { id: string; quote_id: string; price_cents: number; status: string; created_at: string; sent_at: string | null }[];
		termine: { id: string; title: string; category: string; scheduled_date: string | null; status: string }[];
		addresses: KnownAddress[];
	}

	let data = $state<CustomerDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let showDeleteDialog = $state(false);
	let editCustomerType = $state<string>('private');
	let editCompanyName = $state('');

	// Billing address editor state
	let showBillingEdit = $state(false);
	let billingStreet = $state('');
	let billingNumber = $state('');
	let billingPostal = $state('');
	let billingCity = $state('');
	let billingSaving = $state(false);
	// Address-book (known addresses) editor state
	let showAddAddress = $state(false);
	let addrStreet = $state('');
	let addrNumber = $state('');
	let addrPostal = $state('');
	let addrCity = $state('');
	let addrLabel = $state('');
	let addrSaving = $state(false);
	let deletingAddressId = $state<string | null>(null);

	let editSalutation = $state('');
	let editFirstName = $state('');
	let editLastName = $state('');
	let editName = $state('');
	let editPhone = $state('');
	let editEmail = $state('');
	let editNotes = $state('');
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	$effect(() => {
		loadCustomer();
	});

	/**
	 * Fetches the full detail record for the customer identified by the route parameter.
	 *
	 * Called by: $effect (on mount)
	 * Purpose: Loads customer profile data together with their linked quotes and offers from
	 *          GET /api/v1/admin/customers/{id}, then seeds the editable form fields so the
	 *          admin can make changes immediately without re-typing existing values.
	 *
	 * @returns void
	 */
	async function loadCustomer() {
		loading = true;
		try {
			data = await apiGet<CustomerDetail>(`/api/v1/admin/customers/${$page.params.id}`);
			editCustomerType = data.customer_type ?? 'private';
			editCompanyName = data.company_name || '';
			editSalutation = data.salutation || '';
			editFirstName = data.first_name || '';
			editLastName = data.last_name || '';
			editName = data.name || '';
			editPhone = data.phone || '';
			editEmail = data.email ?? '';
			editNotes = data.notes ?? '';
			billingStreet = data.billing_address?.street ?? '';
			billingNumber = data.billing_address?.house_number ?? '';
			billingPostal = data.billing_address?.postal_code ?? '';
			billingCity = data.billing_address?.city ?? '';
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			loading = false;
		}
	}

	/**
	 * Persists edited customer fields (name, phone, email) to the API.
	 *
	 * Called by: Template ("Speichern" button click)
	 * Purpose: PATCHes the customer record via PATCH /api/v1/admin/customers/{id} with the
	 *          current form values, then reloads the customer to confirm the saved state.
	 *          Displays an inline success or error message rather than using the toast system.
	 *
	 * @returns void
	 */
	async function saveCustomer() {
		saving = true;
		message = null;
		try {
			const firstName = editFirstName.trim();
			const lastName = editLastName.trim();
			const derivedName = [firstName, lastName].filter(Boolean).join(' ') || editName.trim() || null;
			await apiPatch(`/api/v1/admin/customers/${$page.params.id}`, {
				name: derivedName,
				first_name: firstName || null,
				last_name: lastName || null,
				salutation: editSalutation || null,
				phone: editPhone || null,
				email: editEmail || null,
				notes: editNotes.trim(),
				customer_type: editCustomerType || null,
				company_name: editCustomerType === 'business' ? (editCompanyName.trim() || null) : null,
				...(showBillingEdit && (billingStreet.trim() || billingCity.trim()) ? {
					billing_address: {
						street: billingStreet.trim() || null,
						house_number: billingNumber.trim() || null,
						postal_code: billingPostal.trim() || null,
						city: billingCity.trim() || null,
					}
				} : {}),
			});
			message = { type: 'success', text: 'Kunde gespeichert' };
			await loadCustomer();
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			saving = false;
		}
	}

	/**
	 * Permanently deletes the current customer and all associated data after confirmation.
	 *
	 * Called by: Template ("Loeschen" button click)
	 * Purpose: Presents a native browser confirm dialog as a safety gate, then POSTs to
	 *          POST /api/v1/admin/customers/{id}/delete. On success a toast is shown and the
	 *          admin is redirected back to the customer list.
	 *
	 * @returns void
	 */
	/**
	 * Permanently deletes the current customer and all associated data.
	 *
	 * Called by: ConfirmationDialog (onConfirm callback).
	 * Purpose: POSTs to customers/{id}/delete; on success navigates back to list.
	 */
	async function deleteCustomer() {
		if (!data) return;
		deleting = true;
		try {
			await apiPost(`/api/v1/admin/customers/${data.id}/delete`);
			showDeleteDialog = false;
			showToast('Kunde geloescht', 'success');
			goto('/admin/customers');
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			deleting = false;
		}
	}

	/** Save the customer's default billing address. */
	async function saveBillingAddress() {
		billingSaving = true;
		try {
			await apiPatch(`/api/v1/admin/customers/${$page.params.id}`, {
				billing_address: {
					street: billingStreet.trim() || null,
					house_number: billingNumber.trim() || null,
					postal_code: billingPostal.trim() || null,
					city: billingCity.trim() || null,
				},
			});
			showBillingEdit = false;
			message = { type: 'success', text: 'Rechnungsadresse gespeichert' };
			await loadCustomer();
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			billingSaving = false;
		}
	}

	/** Clear the customer's default billing address. */
	async function clearBillingAddress() {
		billingSaving = true;
		try {
			await apiPatch(`/api/v1/admin/customers/${$page.params.id}`, {
				clear_billing_address: true,
			});
			showBillingEdit = false;
			message = { type: 'success', text: 'Rechnungsadresse zurückgesetzt' };
			await loadCustomer();
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			billingSaving = false;
		}
	}

	/** Add a known address to the customer's address book. */
	async function addAddress() {
		if (!addrStreet.trim() || !addrCity.trim()) {
			message = { type: 'error', text: 'Straße und Ort sind erforderlich' };
			return;
		}
		addrSaving = true;
		try {
			await apiPost(`/api/v1/admin/customers/${$page.params.id}/addresses`, {
				street: addrStreet.trim(),
				house_number: addrNumber.trim() || null,
				postal_code: addrPostal.trim() || null,
				city: addrCity.trim(),
				label: addrLabel.trim() || null,
			});
			addrStreet = addrNumber = addrPostal = addrCity = addrLabel = '';
			showAddAddress = false;
			message = { type: 'success', text: 'Adresse hinzugefügt' };
			await loadCustomer();
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			addrSaving = false;
		}
	}

	/** Remove a known address from the customer's address book. */
	async function deleteAddress(addressId: string) {
		deletingAddressId = addressId;
		try {
			await apiPost(`/api/v1/admin/customers/${$page.params.id}/addresses/${addressId}/delete`);
			message = { type: 'success', text: 'Adresse entfernt' };
			await loadCustomer();
		} catch (e) {
			message = { type: 'error', text: (e as Error).message };
		} finally {
			deletingAddressId = null;
		}
	}
</script>

<svelte:head><title>{data ? data.company_name || data.name || data.email || 'Kunde' : 'Kunde'}</title></svelte:head>

<a href="/admin/customers" class="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft size={15} /> Kunden</a>

{#snippet linkList(items: { href: string; title: string; meta: string; status: string }[], empty: string)}
	{#if items.length === 0}
		<p class="text-[13px] text-faint">{empty}</p>
	{:else}
		<ul class="-mx-4 -my-4 divide-y divide-line">
			{#each items as it (it.href)}
				<li>
					<a href={it.href} class="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-sunk/60">
						<span class="flex min-w-0 flex-col">
							<span class="truncate text-sm font-medium">{it.title}</span>
							<span class="num truncate text-xs text-faint">{it.meta}</span>
						</span>
						<StatusBadge status={it.status} />
					</a>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#if loading}
	<div class="grid gap-3.5 lg:grid-cols-2" aria-busy="true">
		{#each Array(4) as _, i (i)}<div class="h-48 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if data}
	<header class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-4">
		<div class="flex min-w-0 flex-col gap-2">
			<span class="label-xs text-faint">Kunde</span>
			<h1 class="truncate text-[26px] leading-none font-semibold tracking-[-0.03em] sm:text-[30px]">
				{data.company_name || data.name || data.email || 'Kunde'}
			</h1>
			<div class="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
				<Badge>{data.customer_type === 'business' ? 'Gewerbe' : 'Privat'}</Badge>
				{#if data.company_name && data.name}<span>{data.name}</span>{/if}
				<span class="num text-faint">seit {formatDate(data.created_at)}</span>
			</div>
		</div>
		{#if auth.user?.role === 'admin'}
			<Button variant="danger" onclick={() => (showDeleteDialog = true)}><Trash2 size={15} /> Löschen</Button>
		{/if}
	</header>

	{#if message}
		<Notice tone={message.type === 'error' ? 'danger' : 'info'} class="mb-3">{message.text}</Notice>
	{/if}

	<div class="grid items-start gap-3.5 lg:grid-cols-2">
		<div class="flex min-w-0 flex-col gap-3.5">
			<Panel title="Kundendaten">
				<div class="grid grid-cols-2 gap-3">
					<Segmented
						label="Kundentyp"
						options={[
							{ value: 'private', label: 'Privat' },
							{ value: 'business', label: 'Gewerbe' }
						]}
						bind:value={editCustomerType}
						class="col-span-2 self-start justify-self-start"
					/>
					{#if editCustomerType === 'business'}
						<Field label="Firmenname" for="company_name" class="col-span-2">
							<Input id="company_name" bind:value={editCompanyName} placeholder="Firmenname" />
						</Field>
					{/if}
					<Field label="Anrede" for="salutation" class="col-span-2 sm:col-span-1">
						<Select id="salutation" bind:value={editSalutation}>
							<option value="">—</option>
							<option value="Herr">Herr</option>
							<option value="Frau">Frau</option>
							<option value="D">Divers</option>
						</Select>
					</Field>
					<span class="hidden sm:block"></span>
					<Field label="Vorname" for="first_name"><Input id="first_name" bind:value={editFirstName} placeholder="Vorname" /></Field>
					<Field label="Nachname" for="last_name"><Input id="last_name" bind:value={editLastName} placeholder="Nachname" /></Field>
					<Field label="E-Mail" for="email" class="col-span-2"><Input id="email" type="email" bind:value={editEmail} /></Field>
					<Field label="Telefon" for="phone" class="col-span-2"><Input id="phone" type="tel" bind:value={editPhone} placeholder="+49 …" /></Field>
					<Field label="Notizen" for="notes" class="col-span-2">
						<Textarea id="notes" rows={4} bind:value={editNotes} placeholder="Absprachen, letzte Anpassungen, Anrufbelästigungen …" />
					</Field>
					<div class="col-span-2">
						<LoadingButton loading={saving} variant="primary" onclick={saveCustomer}><Save size={15} /> Speichern</LoadingButton>
					</div>
				</div>
			</Panel>

			<Panel title="Rechnungsadresse (Standard)">
				{#snippet actions()}
					<Button size="sm" variant="ghost" onclick={() => (showBillingEdit = !showBillingEdit)}>{showBillingEdit ? 'Schließen' : 'Bearbeiten'}</Button>
				{/snippet}
				{#if data.billing_address_id && data.billing_address}
					<div class="text-sm leading-relaxed">
						<div>{data.billing_address.street ?? ''} {data.billing_address.house_number ?? ''}</div>
						<div>{data.billing_address.postal_code ?? ''} {data.billing_address.city ?? ''}</div>
					</div>
				{:else}
					<p class="text-[13px] text-muted">
						Keine hinterlegt. Für B2B-Kunden kann hier eine abweichende Rechnungsadresse (z. B. Hauptsitz) gespeichert werden.
					</p>
				{/if}
				{#if showBillingEdit}
					<div class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
						<div class="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
							<Input placeholder="Straße" bind:value={billingStreet} />
							<Input placeholder="Nr." bind:value={billingNumber} />
						</div>
						<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
							<Input placeholder="PLZ" bind:value={billingPostal} />
							<Input placeholder="Ort" bind:value={billingCity} />
						</div>
						<div class="flex flex-wrap gap-2">
							<Button size="sm" variant="solid" onclick={saveBillingAddress} disabled={billingSaving}>{billingSaving ? 'Speichert …' : 'Speichern'}</Button>
							{#if data.billing_address_id}
								<Button size="sm" variant="danger" onclick={clearBillingAddress} disabled={billingSaving}>Zurücksetzen</Button>
							{/if}
							<Button size="sm" variant="ghost" onclick={() => (showBillingEdit = false)}>Abbrechen</Button>
						</div>
					</div>
				{/if}
			</Panel>

			<Panel title="Bekannte Adressen ({data.addresses.length})">
				{#snippet actions()}
					<Button size="sm" variant="ghost" onclick={() => (showAddAddress = !showAddAddress)}>{showAddAddress ? 'Schließen' : 'Hinzufügen'}</Button>
				{/snippet}
				{#if data.addresses.length === 0}
					<p class="text-[13px] text-muted">
						Noch keine hinterlegt. Adressen aus Anfragen werden automatisch gesammelt; hier kannst du auch manuell welche ergänzen.
					</p>
				{:else}
					<ul class="-my-1 divide-y divide-line">
						{#each data.addresses as a (a.id)}
							<li class="flex items-center justify-between gap-3 py-2">
								<span class="flex min-w-0 flex-col">
									{#if a.label}<span class="label-xs text-faint">{a.label}</span>{/if}
									<span class="text-sm">{formatKnownAddress(a)}</span>
								</span>
								<Button
									variant="ghost"
									size="icon-sm"
									class="hover:text-danger"
									aria-label="Adresse entfernen"
									title="Adresse entfernen"
									disabled={deletingAddressId === a.id}
									onclick={() => deleteAddress(a.id)}
								>
									<Trash2 size={15} />
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
				{#if showAddAddress}
					<div class="mt-3 flex flex-col gap-2 border-t border-line pt-3">
						<Input placeholder="Bezeichnung (optional, z. B. Alte Wohnung)" bind:value={addrLabel} />
						<div class="grid grid-cols-[minmax(0,1fr)_80px] gap-2">
							<Input placeholder="Straße" bind:value={addrStreet} />
							<Input placeholder="Nr." bind:value={addrNumber} />
						</div>
						<div class="grid grid-cols-[100px_minmax(0,1fr)] gap-2">
							<Input placeholder="PLZ" bind:value={addrPostal} />
							<Input placeholder="Ort" bind:value={addrCity} />
						</div>
						<div class="flex gap-2">
							<Button size="sm" variant="solid" onclick={addAddress} disabled={addrSaving}>{addrSaving ? 'Speichert …' : 'Speichern'}</Button>
							<Button size="sm" variant="ghost" onclick={() => (showAddAddress = false)}>Abbrechen</Button>
						</div>
					</div>
				{/if}
			</Panel>
		</div>

		<div class="flex min-w-0 flex-col gap-3.5">
			<Panel title="Anfragen ({data.quotes.length})">
				{@render linkList(
					data.quotes.map((q) => ({
						href: `/admin/inquiries/${q.id}`,
						title: formatDate(q.created_at),
						meta: q.estimated_volume_m3 ? `${q.estimated_volume_m3.toFixed(1)} m³` : '',
						status: q.status
					})),
					'Keine Anfragen'
				)}
			</Panel>
			<Panel title="Angebote ({data.offers.length})">
				{@render linkList(
					data.offers.map((o) => ({
						href: `/admin/inquiries/${o.quote_id}#${o.id}`,
						title: formatEuro(o.price_cents),
						meta: formatDate(o.created_at),
						status: o.status
					})),
					'Keine Angebote'
				)}
			</Panel>
			<Panel title="Termine ({data.termine.length})">
				{@render linkList(
					data.termine.map((t) => ({
						href: `/admin/calendar-items/${t.id}`,
						title: t.title,
						meta: `${t.scheduled_date ? formatDate(t.scheduled_date) : '–'} · ${t.category}`,
						status: t.status
					})),
					'Keine Termine'
				)}
			</Panel>
		</div>
	</div>
{/if}

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Kunde löschen"
	message={data ? `Kunde „${data.name || data.email || 'Kunde'}“ und alle zugehörigen Daten unwiderruflich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deleting}
	onConfirm={deleteCustomer}
/>
