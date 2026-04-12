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

	interface CustomerDetail {
		id: string;
		email: string;
		name: string | null;
		salutation: string | null;
		first_name: string | null;
		last_name: string | null;
		phone: string | null;
		customer_type: string | null;
		company_name: string | null;
		created_at: string;
		quotes: { id: string; status: string; estimated_volume_m3: number | null; scheduled_date: string | null; created_at: string }[];
		offers: { id: string; quote_id: string; price_cents: number; status: string; created_at: string; sent_at: string | null }[];
		termine: { id: string; title: string; category: string; scheduled_date: string | null; status: string }[];
	}

	let data = $state<CustomerDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let showDeleteDialog = $state(false);
	let editCustomerType = $state<string>('private');
	let editCompanyName = $state('');
	let editSalutation = $state('');
	let editFirstName = $state('');
	let editLastName = $state('');
	let editName = $state('');
	let editPhone = $state('');
	let editEmail = $state('');
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
			editEmail = data.email;
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
				email: editEmail,
				customer_type: editCustomerType || null,
				company_name: editCustomerType === 'business' ? (editCompanyName.trim() || null) : null,
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
</script>

<div class="page">
	<div class="page-nav">
		<a href="/admin/customers" class="back-link"><ArrowLeft size={16} /> Kunden</a>
	</div>

	{#if loading}
		<div class="loading">Laden...</div>
	{:else if data}
		<div class="page-header">
			<h1>
				{#if data.customer_type === 'business'}
					<span class="cust-type-badge" data-type="business">Gewerbe</span>
				{:else}
					<span class="cust-type-badge" data-type="private">Privat</span>
				{/if}
				{data.name || data.email}
				{#if data.company_name}<span style="color: var(--dt-on-surface-variant); font-weight: 400; font-size: 0.9em;"> ({data.company_name})</span>{/if}
			</h1>
			{#if auth.user?.role === 'admin'}
			<button class="btn-delete-entity" onclick={() => { showDeleteDialog = true; }} title="Kunde loeschen">
				<Trash2 size={16} />
				Loeschen
			</button>
		{/if}
		</div>

		{#if message}
			<div class="msg" class:msg-success={message.type === 'success'} class:msg-error={message.type === 'error'}>
				{message.text}
			</div>
		{/if}

		<div class="grid">
			<div class="card">
				<div class="card-header"><h2>Kundendaten</h2></div>
				<div class="card-body">
					<div class="form-group">
						<label for="salutation">Anrede</label>
						<select id="salutation" bind:value={editSalutation}>
							<option value="">—</option>
							<option value="Herr">Herr</option>
							<option value="Frau">Frau</option>
							<option value="D">Divers</option>
						</select>
					</div>
					<div class="form-row">
						<div class="form-group">
							<label for="first_name">Vorname</label>
							<input id="first_name" type="text" bind:value={editFirstName} placeholder="Vorname" />
						</div>
						<div class="form-group">
							<label for="last_name">Nachname</label>
							<input id="last_name" type="text" bind:value={editLastName} placeholder="Nachname" />
						</div>
					</div>
					<div class="form-group">
						<label for="email">E-Mail</label>
						<input id="email" type="email" bind:value={editEmail} />
					</div>
					<div class="form-group">
						<label for="phone">Telefon</label>
						<input id="phone" type="tel" bind:value={editPhone} placeholder="+49 ..." />
					</div>
					<div class="form-group">
						<span class="form-label">Kundentyp</span>
						<div class="type-toggle">
							<button type="button" class="type-btn" class:active={editCustomerType === 'private'} onclick={() => editCustomerType = 'private'}>Privat</button>
							<button type="button" class="type-btn" class:active={editCustomerType === 'business'} onclick={() => editCustomerType = 'business'}>Gewerbe</button>
						</div>
					</div>
					{#if editCustomerType === 'business'}
					<div class="form-group">
						<label for="company_name">Firmenname</label>
						<input id="company_name" type="text" bind:value={editCompanyName} placeholder="Firmenname" />
					</div>
					{/if}
					<div class="form-group">
						<span class="form-label">Erstellt</span>
						<span class="form-value">{formatDate(data.created_at)}</span>
					</div>
					<LoadingButton loading={saving} variant="primary" onclick={saveCustomer}>
						<Save size={16} /> Speichern
					</LoadingButton>
				</div>
			</div>

			<div class="card">
				<div class="card-header"><h2>Anfragen ({data.quotes.length})</h2></div>
				<div class="card-body list">
					{#if data.quotes.length === 0}
						<div class="empty">Keine Anfragen</div>
					{:else}
						{#each data.quotes as q}
							<a href="/admin/inquiries/{q.id}" class="list-item">
								<div class="list-info">
									<span>{formatDate(q.created_at)}</span>
									{#if q.estimated_volume_m3}
										<span class="text-muted">{q.estimated_volume_m3.toFixed(1)} m³</span>
									{/if}
								</div>
								<StatusBadge status={q.status} />
							</a>
						{/each}
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header"><h2>Angebote ({data.offers.length})</h2></div>
				<div class="card-body list">
					{#if data.offers.length === 0}
						<div class="empty">Keine Angebote</div>
					{:else}
						{#each data.offers as o}
							<a href="/admin/inquiries/{o.quote_id}" class="list-item">
								<div class="list-info">
									<span>{formatEuro(o.price_cents)}</span>
									<span class="text-muted">{formatDate(o.created_at)}</span>
								</div>
								<StatusBadge status={o.status} />
							</a>
						{/each}
					{/if}
				</div>
			</div>

			<div class="card">
				<div class="card-header"><h2>Termine ({data.termine.length})</h2></div>
				<div class="card-body list">
					{#if data.termine.length === 0}
						<div class="empty">Keine Termine</div>
					{:else}
						{#each data.termine as t}
							<a href="/admin/calendar-items/{t.id}" class="list-item">
								<div class="list-info">
									<span>{t.title}</span>
									<span class="text-muted">{t.scheduled_date ? formatDate(t.scheduled_date) : '–'} · {t.category}</span>
								</div>
								<StatusBadge status={t.status} />
							</a>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Kunde löschen"
	message={data ? `Kunde „${data.name || data.email}" und alle zugehörigen Daten unwiderruflich löschen?` : ''}
	confirmLabel="Löschen"
	loading={deleting}
	onConfirm={deleteCustomer}
/>

<style>
	.page { max-width: 1000px; }
	.page-nav { margin-bottom: 1rem; }

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		color: var(--dt-on-surface-variant);
		font-size: 0.875rem;
		text-decoration: none;
		transition: color var(--dt-transition);
	}
	.back-link:hover { color: var(--dt-on-surface); }

	.page-header {
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.btn-delete-entity {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		background: var(--dt-surface-container-lowest);
		color: var(--dt-secondary);
		font-weight: 600;
		font-size: 0.8125rem;
		border: var(--dt-ghost-border);
		border-radius: var(--dt-radius-md);
		cursor: pointer;
		transition: all var(--dt-transition);
		white-space: nowrap;
	}
	.btn-delete-entity:hover {
		background: rgba(168, 57, 0, 0.06);
	}

	.loading {
		text-align: center;
		color: var(--dt-on-surface-variant);
		padding: 3rem;
	}

	.msg { padding: 0.75rem 1rem; font-size: 0.875rem; margin-bottom: 1rem; border-radius: var(--dt-radius-sm); }
	.msg-success { background: rgba(22, 101, 52, 0.08); color: #166534; }
	.msg-error { background: rgba(168, 57, 0, 0.08); color: var(--dt-secondary); }

	.grid { display: flex; flex-direction: column; gap: 1rem; }

	.card {
		overflow: hidden;
		padding: 0;
	}

	.card-header {
		padding: 0.75rem 1.25rem;
		background: var(--dt-surface-container);
	}
	.card-header h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--dt-on-surface);
	}

	.card-body { padding: 1.25rem; }
	.card-body.list { padding: 0; }

	.form-group { margin-bottom: 1rem; }
	.form-group label, .form-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}
	.form-row {
		display: flex;
		gap: 0.75rem;
	}
	.form-row .form-group { flex: 1; }
	.form-group input,
	.form-group select {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		font-size: 0.875rem;
		outline: none;
		transition: background var(--dt-transition), border-color var(--dt-transition);
		box-sizing: border-box;
	}
	.form-group input:focus,
	.form-group select:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}
	.type-toggle {
		display: inline-flex;
		border: 1.5px solid var(--dt-outline-variant);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.5rem;
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
	.form-value { font-size: 0.875rem; color: var(--dt-on-surface-variant); }

	.list-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		text-decoration: none;
		transition: background var(--dt-transition);
	}
	.list-item:nth-child(even) { background: var(--dt-surface-container-low); }
	.list-item:hover { background: var(--dt-surface-container); }
	.list-info { display: flex; flex-direction: column; gap: 0.125rem; }
	.list-info span { font-size: 0.875rem; color: var(--dt-on-surface); }
	.text-muted { color: var(--dt-on-surface-variant) !important; font-size: 0.75rem !important; }
	.empty { padding: 1.5rem; text-align: center; color: var(--dt-on-surface-variant); font-size: 0.875rem; }

	@media (max-width: 768px) {
		.grid { gap: 0.75rem; }
		.card-body { padding: 1rem; }
		.list-item { padding: 0.75rem 1rem; }
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
	.cust-type-badge[data-type="business"] { background: #d1fae5; color: #065f46; }
	.cust-type-badge[data-type="private"] { background: #dbeafe; color: #1e40af; }
</style>
