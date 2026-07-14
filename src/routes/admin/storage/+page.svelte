<script lang="ts">
	import { onMount } from 'svelte';
	import { apiGet, apiPost, apiPatch, apiDelete, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { formatEuro, formatDate } from '$lib/utils/format';
	import { Plus, Trash2, FileText, Check, X, RefreshCw, Pencil } from 'lucide-svelte';

	/** A storage-rental contract as returned by the API (prices in brutto cents). */
	interface Contract {
		id: string;
		customer_id: string;
		customer_name: string | null;
		billing_address_id: string | null;
		contract_start: string;
		contract_end: string | null;
		sqm: number;
		monthly_netto_cents: number;
		monthly_brutto_cents: number;
		billing_day: number;
		status: string;
		note: string | null;
	}

	/** A generated monthly storage invoice awaiting approval / already sent. */
	interface StorageInvoice {
		id: string;
		contract_id: string;
		invoice_number: string;
		period_year: number;
		period_month: number;
		period_label: string;
		netto_cents: number;
		brutto_cents: number;
		status: string;
		customer_name: string | null;
		sqm: number;
		has_pdf: boolean;
		created_at: string;
	}

	interface CustomerMatch {
		id: string;
		email: string | null;
		name: string | null;
		phone: string | null;
	}

	let contracts = $state<Contract[]>([]);
	let invoices = $state<StorageInvoice[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let busyId = $state<string | null>(null);

	// ── Contract form state ──────────────────────────────────────────────────
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let fCustomer = $state<CustomerMatch | null>(null);
	let fCustomerSearch = $state('');
	let fCustomerResults = $state<CustomerMatch[]>([]);
	let fShowDropdown = $state(false);
	let fStart = $state('');
	let fEnd = $state('');
	let fSqm = $state('');
	let fBrutto = $state('');
	let fStatus = $state('active');
	let fNote = $state('');
	let saving = $state(false);
	let searchTimer: ReturnType<typeof setTimeout> | undefined;

	const statusLabel: Record<string, string> = {
		active: 'Aktiv',
		ended: 'Beendet',
		cancelled: 'Storniert',
		pending_approval: 'Wartet auf Freigabe',
		sent: 'Versendet',
		paid: 'Bezahlt'
	};

	onMount(load);

	async function load() {
		loading = true;
		error = null;
		try {
			const [c, i] = await Promise.all([
				apiGet<Contract[]>('/api/v1/admin/storage/contracts'),
				apiGet<StorageInvoice[]>('/api/v1/admin/storage/invoices')
			]);
			contracts = c;
			invoices = i;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	// ── Customer search ──────────────────────────────────────────────────────
	function onCustomerInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(searchCustomers, 250);
	}
	async function searchCustomers() {
		const q = fCustomerSearch.trim();
		if (q.length < 2) {
			fCustomerResults = [];
			fShowDropdown = false;
			return;
		}
		try {
			const res = await apiGet<{ customers: CustomerMatch[]; total: number }>(
				`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`
			);
			fCustomerResults = res.customers;
			fShowDropdown = true;
		} catch {
			fCustomerResults = [];
		}
	}
	function pickCustomer(c: CustomerMatch) {
		fCustomer = c;
		fCustomerSearch = c.name || c.email || '';
		fShowDropdown = false;
	}

	// ── Form open/reset ──────────────────────────────────────────────────────
	function openCreate() {
		editingId = null;
		fCustomer = null;
		fCustomerSearch = '';
		fStart = new Date().toISOString().slice(0, 10);
		fEnd = '';
		fSqm = '';
		fBrutto = '';
		fStatus = 'active';
		fNote = '';
		showForm = true;
	}

	function openEdit(c: Contract) {
		editingId = c.id;
		fCustomer = { id: c.customer_id, name: c.customer_name, email: null, phone: null };
		fCustomerSearch = c.customer_name || '';
		fStart = c.contract_start;
		fEnd = c.contract_end || '';
		fSqm = String(c.sqm).replace('.', ',');
		fBrutto = (c.monthly_brutto_cents / 100).toFixed(2).replace('.', ',');
		fStatus = c.status;
		fNote = c.note || '';
		showForm = true;
	}

	function num(s: string): number {
		const v = parseFloat(s.replace(',', '.'));
		return isNaN(v) ? 0 : v;
	}

	async function saveContract() {
		if (!fCustomer) {
			showToast('Bitte einen Kunden auswählen', 'error');
			return;
		}
		if (!fStart) {
			showToast('Vertragsbeginn fehlt', 'error');
			return;
		}
		if (num(fSqm) <= 0) {
			showToast('Fläche (m²) muss größer als 0 sein', 'error');
			return;
		}
		if (num(fBrutto) <= 0) {
			showToast('Monatspreis muss größer als 0 sein', 'error');
			return;
		}
		const payload = {
			customer_id: fCustomer.id,
			contract_start: fStart,
			contract_end: fEnd || null,
			sqm: num(fSqm),
			monthly_brutto_cents: Math.round(num(fBrutto) * 100),
			status: fStatus,
			note: fNote.trim() || null
		};
		saving = true;
		try {
			if (editingId) {
				await apiPatch(`/api/v1/admin/storage/contracts/${editingId}`, payload);
				showToast('Vertrag aktualisiert', 'success');
			} else {
				await apiPost('/api/v1/admin/storage/contracts', payload);
				showToast('Vertrag angelegt', 'success');
			}
			showForm = false;
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Speichern fehlgeschlagen', 'error');
		} finally {
			saving = false;
		}
	}

	async function deleteContract(c: Contract) {
		if (!confirm(`Vertrag von ${c.customer_name ?? 'Kunde'} wirklich löschen?`)) return;
		busyId = c.id;
		try {
			await apiDelete(`/api/v1/admin/storage/contracts/${c.id}`);
			showToast('Vertrag gelöscht', 'success');
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Löschen fehlgeschlagen', 'error');
		} finally {
			busyId = null;
		}
	}

	async function generateNow(c: Contract) {
		busyId = c.id;
		try {
			const res = await apiPost<{ created: boolean }>(
				`/api/v1/admin/storage/contracts/${c.id}/generate-now`
			);
			showToast(
				res.created ? 'Rechnung erzeugt — wartet auf Freigabe' : 'Für diesen Monat bereits erzeugt',
				res.created ? 'success' : 'info'
			);
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Erzeugen fehlgeschlagen', 'error');
		} finally {
			busyId = null;
		}
	}

	// ── Invoice actions ──────────────────────────────────────────────────────
	async function approve(inv: StorageInvoice) {
		if (!confirm(`Rechnung ${inv.invoice_number} freigeben und an ${inv.customer_name ?? 'Kunde'} senden?`))
			return;
		busyId = inv.id;
		try {
			await apiPost(`/api/v1/admin/storage/invoices/${inv.id}/approve`);
			showToast('Rechnung versendet', 'success');
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Versand fehlgeschlagen', 'error');
		} finally {
			busyId = null;
		}
	}

	async function reject(inv: StorageInvoice) {
		if (!confirm(`Rechnung ${inv.invoice_number} ablehnen?`)) return;
		busyId = inv.id;
		try {
			await apiPost(`/api/v1/admin/storage/invoices/${inv.id}/reject`);
			showToast('Rechnung abgelehnt', 'success');
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Ablehnen fehlgeschlagen', 'error');
		} finally {
			busyId = null;
		}
	}

	async function downloadPdf(inv: StorageInvoice) {
		try {
			await apiDownload(`/api/v1/admin/storage/invoices/${inv.id}/pdf`, `Rechnung_${inv.invoice_number}.pdf`);
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Download fehlgeschlagen', 'error');
		}
	}

	const pendingInvoices = $derived(invoices.filter((i) => i.status === 'pending_approval'));
	const otherInvoices = $derived(invoices.filter((i) => i.status !== 'pending_approval'));

	// Live netto/MwSt preview for the form's brutto input.
	const previewNetto = $derived(Math.round((num(fBrutto) * 100) / 1.19));
	const previewMwst = $derived(Math.round(num(fBrutto) * 100) - previewNetto);
</script>

<div class="page">
	<div class="page-header">
		<div class="page-title">
			<h1>Lagerung</h1>
			<p class="subtitle">Einlagerungsverträge & monatliche Rechnungen</p>
		</div>
		<div class="header-actions">
			<button class="btn-refresh" onclick={load} disabled={loading} title="Aktualisieren">
				<RefreshCw size={16} />
			</button>
			<button class="btn-primary" onclick={openCreate}>
				<Plus size={16} /> Neuer Vertrag
			</button>
		</div>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<!-- ── Pending approval invoices ──────────────────────────────────────── -->
	{#if pendingInvoices.length > 0}
		<section class="card highlight">
			<h2>Warten auf Freigabe ({pendingInvoices.length})</h2>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Kunde</th>
							<th>Zeitraum</th>
							<th>Rechnung</th>
							<th class="right">Betrag (brutto)</th>
							<th class="right">Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{#each pendingInvoices as inv (inv.id)}
							<tr>
								<td>{inv.customer_name ?? '—'}</td>
								<td>{inv.period_label}</td>
								<td class="mono">{inv.invoice_number}</td>
								<td class="right">{formatEuro(inv.brutto_cents)}</td>
								<td class="right actions">
									{#if inv.has_pdf}
										<button class="icon-btn" title="PDF" onclick={() => downloadPdf(inv)}>
											<FileText size={15} />
										</button>
									{/if}
									<button
										class="icon-btn success"
										title="Freigeben & Senden"
										disabled={busyId === inv.id}
										onclick={() => approve(inv)}
									>
										<Check size={15} />
									</button>
									<button
										class="icon-btn danger"
										title="Ablehnen"
										disabled={busyId === inv.id}
										onclick={() => reject(inv)}
									>
										<X size={15} />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}

	<!-- ── Contracts ──────────────────────────────────────────────────────── -->
	<section class="card">
		<h2>Verträge</h2>
		{#if loading}
			<p class="empty">Lädt …</p>
		{:else if contracts.length === 0}
			<p class="empty">Noch keine Einlagerungsverträge angelegt.</p>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Kunde</th>
							<th>Zeitraum</th>
							<th class="right">Fläche</th>
							<th class="right">Monat (brutto)</th>
							<th>Abrechnungstag</th>
							<th>Status</th>
							<th class="right">Aktionen</th>
						</tr>
					</thead>
					<tbody>
						{#each contracts as c (c.id)}
							<tr>
								<td>{c.customer_name ?? '—'}</td>
								<td>
									{formatDate(c.contract_start)}
									{#if c.contract_end}– {formatDate(c.contract_end)}{:else}– offen{/if}
								</td>
								<td class="right">{String(c.sqm).replace('.', ',')} m²</td>
								<td class="right">{formatEuro(c.monthly_brutto_cents)}</td>
								<td>{c.billing_day}. des Monats</td>
								<td><span class="badge badge--{c.status}">{statusLabel[c.status] ?? c.status}</span></td>
								<td class="right actions">
									<button
										class="icon-btn"
										title="Rechnung jetzt erzeugen"
										disabled={busyId === c.id || c.status !== 'active'}
										onclick={() => generateNow(c)}
									>
										<FileText size={15} />
									</button>
									<button class="icon-btn" title="Bearbeiten" onclick={() => openEdit(c)}>
										<Pencil size={15} />
									</button>
									<button
										class="icon-btn danger"
										title="Löschen"
										disabled={busyId === c.id}
										onclick={() => deleteContract(c)}
									>
										<Trash2 size={15} />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<!-- ── History (sent / other) ─────────────────────────────────────────── -->
	{#if otherInvoices.length > 0}
		<section class="card">
			<h2>Rechnungen</h2>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Kunde</th>
							<th>Zeitraum</th>
							<th>Rechnung</th>
							<th class="right">Betrag (brutto)</th>
							<th>Status</th>
							<th class="right"></th>
						</tr>
					</thead>
					<tbody>
						{#each otherInvoices as inv (inv.id)}
							<tr>
								<td>{inv.customer_name ?? '—'}</td>
								<td>{inv.period_label}</td>
								<td class="mono">{inv.invoice_number}</td>
								<td class="right">{formatEuro(inv.brutto_cents)}</td>
								<td><span class="badge badge--{inv.status}">{statusLabel[inv.status] ?? inv.status}</span></td>
								<td class="right actions">
									{#if inv.has_pdf}
										<button class="icon-btn" title="PDF" onclick={() => downloadPdf(inv)}>
											<FileText size={15} />
										</button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>

<!-- ── Contract form modal ────────────────────────────────────────────────── -->
{#if showForm}
	<div
		class="modal-backdrop"
		onclick={() => (showForm = false)}
		onkeydown={(e) => e.key === 'Escape' && (showForm = false)}
		role="presentation"
	>
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<h2>{editingId ? 'Vertrag bearbeiten' : 'Neuer Vertrag'}</h2>

			<label class="field">
				<span>Kunde</span>
				<div class="autocomplete">
					<input
						type="text"
						placeholder="Name oder E-Mail suchen…"
						bind:value={fCustomerSearch}
						oninput={onCustomerInput}
						disabled={!!editingId}
					/>
					{#if fShowDropdown && fCustomerResults.length > 0}
						<ul class="dropdown">
							{#each fCustomerResults as c (c.id)}
								<li>
									<button type="button" onclick={() => pickCustomer(c)}>
										{c.name || c.email || 'Unbenannt'}
										{#if c.email}<span class="muted">· {c.email}</span>{/if}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</label>

			<div class="row">
				<label class="field">
					<span>Vertragsbeginn</span>
					<input type="date" bind:value={fStart} />
				</label>
				<label class="field">
					<span>Vertragsende (optional)</span>
					<input type="date" bind:value={fEnd} />
				</label>
			</div>

			<div class="row">
				<label class="field">
					<span>Fläche (m²)</span>
					<input type="text" inputmode="decimal" placeholder="12,5" bind:value={fSqm} />
				</label>
				<label class="field">
					<span>Monatspreis (brutto €)</span>
					<input type="text" inputmode="decimal" placeholder="150,00" bind:value={fBrutto} />
				</label>
			</div>

			<p class="preview">
				Netto <strong>{formatEuro(previewNetto)}</strong> · MwSt 19%
				<strong>{formatEuro(previewMwst)}</strong> · Brutto
				<strong>{formatEuro(Math.round(num(fBrutto) * 100))}</strong>
			</p>

			{#if editingId}
				<label class="field">
					<span>Status</span>
					<select bind:value={fStatus}>
						<option value="active">Aktiv</option>
						<option value="ended">Beendet</option>
						<option value="cancelled">Storniert</option>
					</select>
				</label>
			{/if}

			<label class="field">
				<span>Notiz (optional)</span>
				<textarea rows="2" bind:value={fNote}></textarea>
			</label>

			<div class="modal-actions">
				<button class="btn" onclick={() => (showForm = false)} disabled={saving}>Abbrechen</button>
				<button class="btn-primary" onclick={saveContract} disabled={saving}>
					{saving ? 'Speichert…' : 'Speichern'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page {
		padding: 1.5rem;
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.page-title h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.subtitle {
		margin: 0.2rem 0 0;
		opacity: 0.7;
		font-size: 0.9rem;
	}
	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.9rem;
		border: none;
		border-radius: 8px;
		background: var(--dt-primary, #2563eb);
		color: #fff;
		cursor: pointer;
		font-size: 0.9rem;
	}
	.btn {
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--dt-outline, #c4c7c5);
		border-radius: 8px;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.btn-refresh {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem;
		border: 1px solid var(--dt-outline, #c4c7c5);
		border-radius: 8px;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.btn-primary:disabled,
	.btn:disabled,
	.btn-refresh:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.card {
		background: var(--dt-surface, #fff);
		border: 1px solid var(--dt-outline-variant, #e1e3e1);
		border-radius: 12px;
		padding: 1rem 1.15rem;
	}
	.card.highlight {
		border-color: var(--dt-primary, #2563eb);
	}
	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
	}
	th,
	td {
		padding: 0.5rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--dt-outline-variant, #e1e3e1);
		white-space: nowrap;
	}
	th {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		opacity: 0.65;
	}
	.right {
		text-align: right;
	}
	.mono {
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: 0.3rem;
		justify-content: flex-end;
	}
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.35rem;
		border: 1px solid var(--dt-outline-variant, #e1e3e1);
		border-radius: 6px;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.icon-btn.success {
		color: #16a34a;
		border-color: #16a34a55;
	}
	.icon-btn.danger {
		color: #dc2626;
		border-color: #dc262655;
	}
	.badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		font-size: 0.72rem;
		background: var(--dt-outline-variant, #e1e3e1);
	}
	.badge--active,
	.badge--sent {
		background: #16a34a22;
		color: #15803d;
	}
	.badge--pending_approval {
		background: #f59e0b22;
		color: #b45309;
	}
	.badge--cancelled,
	.badge--ended {
		background: #6b728022;
		color: #4b5563;
	}
	.badge--paid {
		background: #2563eb22;
		color: #1d4ed8;
	}
	.empty {
		opacity: 0.6;
		padding: 0.5rem 0;
	}
	.error {
		color: #dc2626;
	}
	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
		z-index: 50;
	}
	.modal {
		background: var(--dt-surface, #fff);
		color: var(--dt-on-surface, #191c1e);
		border-radius: 12px;
		padding: 1.25rem;
		width: 100%;
		max-width: 480px;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
	}
	.field > span {
		opacity: 0.75;
	}
	.field input,
	.field select,
	.field textarea {
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--dt-outline, #c4c7c5);
		border-radius: 7px;
		background: var(--dt-surface, #fff);
		color: inherit;
		font-size: 0.9rem;
	}
	.row {
		display: flex;
		gap: 0.75rem;
	}
	.row .field {
		flex: 1;
	}
	.autocomplete {
		position: relative;
	}
	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin: 0.2rem 0 0;
		padding: 0.25rem;
		list-style: none;
		background: var(--dt-surface, #fff);
		border: 1px solid var(--dt-outline, #c4c7c5);
		border-radius: 8px;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
		z-index: 10;
		max-height: 220px;
		overflow-y: auto;
	}
	.dropdown li button {
		width: 100%;
		text-align: left;
		padding: 0.4rem 0.5rem;
		border: none;
		background: transparent;
		color: inherit;
		cursor: pointer;
		border-radius: 6px;
		font-size: 0.88rem;
	}
	.dropdown li button:hover {
		background: var(--dt-outline-variant, #e1e3e1);
	}
	.muted {
		opacity: 0.6;
	}
	.preview {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.85;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	@media (max-width: 640px) {
		.row {
			flex-direction: column;
		}
	}
</style>
