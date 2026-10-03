<script lang="ts">
	import { onMount } from 'svelte';
	import { apiGet, apiPost, apiPatch, apiDelete, apiDownload } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { formatEuro, formatDate } from '$lib/utils/format';
	import { Plus, Trash2, FileText, Check, X, RefreshCw, Pencil } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import type { Tone } from '$lib/components/ui/tone';

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

	const statusTone: Record<string, Tone> = {
		active: 'ok',
		ended: 'neutral',
		cancelled: 'danger',
		pending_approval: 'warn',
		sent: 'info',
		paid: 'ok'
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

<svelte:head><title>Lagerung</title></svelte:head>

<PageHeader title="Lagerung" eyebrow="Einlagerungsverträge & monatliche Rechnungen">
	{#snippet actions()}
		<Button variant="ghost" size="icon" onclick={load} disabled={loading} aria-label="Aktualisieren">
			<RefreshCw size={16} class={loading ? 'animate-spin' : ''} />
		</Button>
		<Button variant="accent" onclick={openCreate}><Plus size={16} /> Neuer Vertrag</Button>
	{/snippet}
</PageHeader>

{#if error}
	<p class="mb-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
{/if}

<div class="flex flex-col gap-5">
	{#if pendingInvoices.length > 0}
		<section class="flex flex-col gap-2">
			<h2 class="flex items-center gap-2 text-[15px] font-semibold">
				Warten auf Freigabe <Badge tone="warn">{pendingInvoices.length}</Badge>
			</h2>
			<Table minWidth="640px" class="border-warn/50">
				<thead>
					<tr><th>Kunde</th><th>Zeitraum</th><th>Rechnung</th><th class="text-right">Brutto</th><th class="text-right">Aktionen</th></tr>
				</thead>
				<tbody>
					{#each pendingInvoices as inv (inv.id)}
						<tr>
							<td class="font-medium">{inv.customer_name ?? '—'}</td>
							<td class="text-muted">{inv.period_label}</td>
							<td class="num text-[13px]">{inv.invoice_number}</td>
							<td class="num text-right">{formatEuro(inv.brutto_cents)}</td>
							<td>
								<span class="flex justify-end gap-1">
									{#if inv.has_pdf}
										<Button variant="ghost" size="icon-sm" aria-label="PDF" title="PDF" onclick={() => downloadPdf(inv)}><FileText size={15} /></Button>
									{/if}
									<Button size="sm" variant="solid" disabled={busyId === inv.id} onclick={() => approve(inv)}>
										<Check size={14} /> Freigeben & senden
									</Button>
									<Button variant="ghost" size="icon-sm" class="hover:text-danger" aria-label="Ablehnen" title="Ablehnen" disabled={busyId === inv.id} onclick={() => reject(inv)}>
										<X size={15} />
									</Button>
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		</section>
	{/if}

	<section class="flex flex-col gap-2">
		<h2 class="text-[15px] font-semibold">Verträge</h2>
		{#if loading}
			<div class="h-40 animate-pulse rounded-md bg-sunk"></div>
		{:else if contracts.length === 0}
			<EmptyState title="Noch keine Einlagerungsverträge" hint="Lege einen Vertrag an — die Monatsrechnungen entstehen dann automatisch.">
				<Button size="sm" variant="solid" class="mt-2" onclick={openCreate}><Plus size={14} /> Neuer Vertrag</Button>
			</EmptyState>
		{:else}
			<Table minWidth="760px">
				<thead>
					<tr>
						<th>Kunde</th><th>Zeitraum</th><th class="text-right">Fläche</th><th class="text-right">Monat brutto</th><th>Abrechnung</th><th
							>Status</th
						><th class="text-right">Aktionen</th>
					</tr>
				</thead>
				<tbody>
					{#each contracts as c (c.id)}
						<tr>
							<td class="font-medium">{c.customer_name ?? '—'}</td>
							<td class="num text-[13px] whitespace-nowrap text-muted">
								{formatDate(c.contract_start)} – {c.contract_end ? formatDate(c.contract_end) : 'offen'}
							</td>
							<td class="num text-right">{String(c.sqm).replace('.', ',')} m²</td>
							<td class="num text-right">{formatEuro(c.monthly_brutto_cents)}</td>
							<td class="text-[13px] text-muted">{c.billing_day}. des Monats</td>
							<td><Badge tone={statusTone[c.status] ?? 'neutral'}>{statusLabel[c.status] ?? c.status}</Badge></td>
							<td>
								<span class="flex justify-end gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Rechnung jetzt erzeugen"
										title="Rechnung jetzt erzeugen"
										disabled={busyId === c.id || c.status !== 'active'}
										onclick={() => generateNow(c)}><FileText size={15} /></Button
									>
									<Button variant="ghost" size="icon-sm" aria-label="Bearbeiten" title="Bearbeiten" onclick={() => openEdit(c)}><Pencil size={15} /></Button>
									<Button
										variant="ghost"
										size="icon-sm"
										class="hover:text-danger"
										aria-label="Löschen"
										title="Löschen"
										disabled={busyId === c.id}
										onclick={() => deleteContract(c)}><Trash2 size={15} /></Button
									>
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		{/if}
	</section>

	{#if otherInvoices.length > 0}
		<section class="flex flex-col gap-2">
			<h2 class="text-[15px] font-semibold">Rechnungen</h2>
			<Table minWidth="600px">
				<thead>
					<tr><th>Kunde</th><th>Zeitraum</th><th>Rechnung</th><th class="text-right">Brutto</th><th>Status</th><th></th></tr>
				</thead>
				<tbody>
					{#each otherInvoices as inv (inv.id)}
						<tr>
							<td class="font-medium">{inv.customer_name ?? '—'}</td>
							<td class="text-muted">{inv.period_label}</td>
							<td class="num text-[13px]">{inv.invoice_number}</td>
							<td class="num text-right">{formatEuro(inv.brutto_cents)}</td>
							<td><Badge tone={statusTone[inv.status] ?? 'neutral'}>{statusLabel[inv.status] ?? inv.status}</Badge></td>
							<td class="text-right">
								{#if inv.has_pdf}
									<Button variant="ghost" size="icon-sm" aria-label="PDF" title="PDF" onclick={() => downloadPdf(inv)}><FileText size={15} /></Button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</Table>
		</section>
	{/if}
</div>

{#if showForm}
	<Modal title={editingId ? 'Vertrag bearbeiten' : 'Neuer Vertrag'} onclose={() => (showForm = false)}>
		<div class="flex flex-col gap-3">
			<Field label="Kunde" for="st-customer">
				<div class="relative">
					<Input
						id="st-customer"
						placeholder="Name oder E-Mail suchen …"
						bind:value={fCustomerSearch}
						oninput={onCustomerInput}
						disabled={!!editingId}
					/>
					{#if fShowDropdown && fCustomerResults.length > 0}
						<ul class="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-line bg-panel p-1 shadow-xl">
							{#each fCustomerResults as c (c.id)}
								<li>
									<button type="button" class="w-full rounded-sm px-2.5 py-2 text-left text-sm hover:bg-sunk" onclick={() => pickCustomer(c)}>
										{c.name || c.email || 'Unbenannt'}
										{#if c.email}<span class="text-xs text-muted">· {c.email}</span>{/if}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</Field>
			<div class="grid grid-cols-2 gap-3">
				<Field label="Vertragsbeginn" for="st-start"><Input id="st-start" type="date" bind:value={fStart} /></Field>
				<Field label="Vertragsende (optional)" for="st-end"><Input id="st-end" type="date" bind:value={fEnd} /></Field>
				<Field label="Fläche (m²)" for="st-sqm"><Input id="st-sqm" class="num" inputmode="decimal" placeholder="12,5" bind:value={fSqm} /></Field>
				<Field label="Monatspreis (brutto €)" for="st-brutto">
					<Input id="st-brutto" class="num" inputmode="decimal" placeholder="150,00" bind:value={fBrutto} />
				</Field>
			</div>
			<p class="num rounded-sm bg-sunk px-3 py-2 text-xs text-muted">
				Netto <strong class="text-fg">{formatEuro(previewNetto)}</strong> · MwSt 19 %
				<strong class="text-fg">{formatEuro(previewMwst)}</strong> · Brutto
				<strong class="text-fg">{formatEuro(Math.round(num(fBrutto) * 100))}</strong>
			</p>
			{#if editingId}
				<Field label="Status" for="st-status">
					<Select id="st-status" bind:value={fStatus}>
						<option value="active">Aktiv</option>
						<option value="ended">Beendet</option>
						<option value="cancelled">Storniert</option>
					</Select>
				</Field>
			{/if}
			<Field label="Notiz (optional)" for="st-note"><Textarea id="st-note" rows={2} bind:value={fNote} /></Field>
		</div>
		{#snippet footer()}
			<Button onclick={() => (showForm = false)} disabled={saving}>Abbrechen</Button>
			<Button variant="solid" onclick={saveContract} disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
		{/snippet}
	</Modal>
{/if}
