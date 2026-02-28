<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPatch, apiPost, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import { ArrowLeft, Save, Trash2 } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';

	interface CustomerDetail {
		id: string;
		email: string;
		name: string | null;
		phone: string | null;
		created_at: string;
		quotes: { id: string; status: string; estimated_volume_m3: number | null; preferred_date: string | null; created_at: string }[];
		offers: { id: string; quote_id: string; price_cents: number; status: string; created_at: string; sent_at: string | null }[];
	}

	let data = $state<CustomerDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);
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
			await apiPatch(`/api/v1/admin/customers/${$page.params.id}`, {
				name: editName || null,
				phone: editPhone || null,
				email: editEmail
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
	async function deleteCustomer() {
		if (!data) return;
		if (!confirm(`Kunde "${data.name || data.email}" und alle zugehoerigen Daten unwiderruflich loeschen?`)) return;
		try {
			await apiPost(`/api/v1/admin/customers/${data.id}/delete`);
			showToast('Kunde geloescht', 'success');
			goto('/admin/customers');
		} catch (e) {
			showToast((e as Error).message, 'error');
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
			<h1>{data.name || data.email}</h1>
			<button class="btn-delete-entity" onclick={deleteCustomer} title="Kunde loeschen">
				<Trash2 size={16} />
				Loeschen
			</button>
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
						<label for="name">Name</label>
						<input id="name" type="text" bind:value={editName} placeholder="Vollstaendiger Name" />
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
						<span class="form-label">Erstellt</span>
						<span class="form-value">{formatDate(data.created_at)}</span>
					</div>
					<button class="btn btn-primary" onclick={saveCustomer} disabled={saving}>
						<Save size={16} /> {saving ? 'Speichern...' : 'Speichern'}
					</button>
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
		</div>
	{/if}
</div>

<style>
	.page { max-width: 1000px; }
	.page-nav { margin-bottom: 1rem; }
	.back-link { display: inline-flex; align-items: center; gap: 0.375rem; color: #94a3b8; font-size: 0.875rem; text-decoration: none; transition: color 150ms; }
	.back-link:hover { color: #6366f1; }
	.page-header { margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.page-header h1 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }
	.btn-delete-entity { display: flex; align-items: center; gap: 0.375rem; padding: 0.5rem 0.875rem; background: #ffffff; color: #dc2626; font-weight: 600; font-size: 0.8125rem; border: 1px solid #fecaca; border-radius: 10px; cursor: pointer; transition: all 150ms ease; white-space: nowrap; }
	.btn-delete-entity:hover { background: #fef2f2; border-color: #f87171; }
	.loading { text-align: center; color: #94a3b8; padding: 3rem; }

	.msg { padding: 0.75rem 1rem; font-size: 0.875rem; margin-bottom: 1rem; }
	.msg-success { background: #d1fae5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 10px; }
	.msg-error { background: #fee2e2; border: 1px solid #fecaca; color: #991b1b; border-radius: 10px; }

	.grid { display: flex; flex-direction: column; gap: 1rem; }
	.card { background: #ffffff; border: none; border-radius: 12px; overflow: hidden; box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff; }
	.card-header { padding: 0.75rem 1.25rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
	.card-header h2 { font-size: 0.9375rem; font-weight: 600; color: #334155; }
	.card-body { padding: 1.25rem; }
	.card-body.list { padding: 0; }

	.form-group { margin-bottom: 1rem; }
	.form-group label, .form-label { display: block; font-size: 0.75rem; font-weight: 600; color: #64748b; margin-bottom: 0.375rem; text-transform: uppercase; letter-spacing: 0.05em; }
	.form-group input { width: 100%; padding: 0.5rem 0.75rem; background: #e8ecf1; border: none; border-radius: 8px; box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff; color: #1a1a2e; font-size: 0.875rem; outline: none; transition: box-shadow 150ms; }
	.form-group input:focus { box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99,102,241,0.2); }
	.form-value { font-size: 0.875rem; color: #94a3b8; }

	.btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; transition: all 150ms; border: none; cursor: pointer; }
	.btn-primary { background: #6366f1; color: #fff; border-radius: 10px; box-shadow: 3px 3px 10px rgba(99,102,241,0.3); }
	.btn-primary:hover:not(:disabled) { background: #4f46e5; }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.list-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-bottom: 1px solid #f1f5f9; text-decoration: none; transition: background 150ms; }
	.list-item:last-child { border-bottom: none; }
	.list-item:hover { background: #f8fafc; }
	.list-info { display: flex; flex-direction: column; gap: 0.125rem; }
	.list-info span { font-size: 0.875rem; color: #334155; }
	.text-muted { color: #94a3b8 !important; font-size: 0.75rem !important; }
	.empty { padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }

	@media (max-width: 768px) {
		.page-header { flex-wrap: wrap; }

		.btn-delete-entity { min-height: 44px; }
		.btn { min-height: 44px; }

		.grid { gap: 0.75rem; }
		.card-body { padding: 1rem; }

		.list-item { padding: 0.75rem 1rem; }
	}
</style>
