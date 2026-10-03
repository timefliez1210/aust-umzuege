<script lang="ts">
	import { apiDelete, apiGet, apiPost, apiPreview, formatDate, formatEuro } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { Check as CheckIcon, FileText, Package, Pencil, Plus, RotateCcw, Trash2, Truck, User } from 'lucide-svelte';
	import ExpenseModal from './ExpenseModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Check from '$lib/components/ui/Check.svelte';
	import type { Category, Expense, Vehicle } from './types';
	import { currentMonthKey, monthLabel, shiftMonth } from './types';

	let {
		categories,
		vehicles,
		employees,
		onCategoriesChanged
	}: {
		categories: Category[];
		vehicles: Vehicle[];
		employees: { id: string; name: string }[];
		onCategoriesChanged: () => void;
	} = $props();

	let month = $state<string | null>(currentMonthKey());
	let categoryFilter = $state('');
	let onlyDrafts = $state(false);
	let rows = $state<Expense[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let busy = $state(false);

	let modalOpen = $state(false);
	let editing = $state<Expense | null>(null);

	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmMessage = $state('');
	let confirmLabel = $state('');
	let confirmAction = $state<() => Promise<void>>(async () => {});

	async function load() {
		loading = true;
		error = null;
		const q = new URLSearchParams();
		if (month) {
			q.set('from', month);
			q.set('to', month);
		}
		if (categoryFilter) q.set('category_id', categoryFilter);
		if (onlyDrafts) q.set('status', 'draft');
		try {
			rows = await apiGet<Expense[]>(`/api/v1/admin/profit/expenses?${q}`);
		} catch {
			error = 'Ausgaben konnten nicht geladen werden.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void month;
		void categoryFilter;
		void onlyDrafts;
		load();
	});

	let totals = $derived({
		netto: rows.reduce((s, r) => s + r.netto_cents, 0),
		vat: rows.reduce((s, r) => s + r.vat_cents, 0),
		brutto: rows.reduce((s, r) => s + r.brutto_cents, 0),
		drafts: rows.filter((r) => r.status === 'draft')
	});

	function newExpense() {
		if (categories.length === 0) onCategoriesChanged();
		editing = null;
		modalOpen = true;
	}

	function edit(e: Expense) {
		editing = e;
		modalOpen = true;
	}

	async function run(fn: () => Promise<unknown>, ok: string) {
		busy = true;
		try {
			await fn();
			showToast(ok, 'success');
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Aktion fehlgeschlagen', 'error');
		} finally {
			busy = false;
		}
	}

	function confirm(title: string, message: string, label: string, action: () => Promise<void>) {
		confirmTitle = title;
		confirmMessage = message;
		confirmLabel = label;
		confirmAction = action;
		confirmOpen = true;
	}

	function storno(e: Expense) {
		confirm(
			'Buchung stornieren?',
			`Es wird eine Gegenbuchung über ${formatEuro(-e.brutto_cents)} angelegt. Beide Buchungen bleiben sichtbar.`,
			'Stornieren',
			() => run(() => apiPost(`/api/v1/admin/profit/expenses/${e.id}/storno`), 'Storniert')
		);
	}

	function remove(e: Expense) {
		confirm(
			'Buchung endgültig löschen?',
			e.storno_id
				? 'Die Buchung und ihre Stornobuchung werden gelöscht. Das Änderungsprotokoll bleibt erhalten.'
				: 'Die Buchung wird gelöscht. Für eine nachvollziehbare Korrektur besser „Stornieren“ verwenden.',
			'Löschen',
			() => run(() => apiDelete(`/api/v1/admin/profit/expenses/${e.id}`), 'Gelöscht')
		);
	}

	async function confirmDraft(e: Expense) {
		await run(() => apiPost(`/api/v1/admin/profit/expenses/${e.id}/confirm`), 'Gebucht');
	}

	async function confirmAll() {
		const drafts = totals.drafts;
		await run(async () => {
			for (const d of drafts) await apiPost(`/api/v1/admin/profit/expenses/${d.id}/confirm`);
		}, `${drafts.length} Buchungen bestätigt`);
	}

	async function showReceipt(e: Expense) {
		try {
			await apiPreview(`/api/v1/admin/profit/expenses/${e.id}/receipt`);
		} catch {
			showToast('Beleg konnte nicht geöffnet werden', 'error');
		}
	}
</script>

<div class="flex flex-col gap-3.5">
	<div class="flex flex-wrap items-center gap-3">
		{#if month}
			<Stepper
				label={monthLabel(month)}
				onprev={() => (month = shiftMonth(month!, -1))}
				onnext={() => (month = shiftMonth(month!, 1))}
				prevLabel="Vorheriger Monat"
				nextLabel="Nächster Monat"
			/>
			<Button size="sm" variant="ghost" onclick={() => (month = null)}>Alle Monate</Button>
		{:else}
			<Button size="sm" onclick={() => (month = currentMonthKey())}>Nach Monat</Button>
		{/if}
		<Select class="w-52" aria-label="Kategorie" bind:value={categoryFilter}>
			<option value="">Alle Kategorien</option>
			{#each categories as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
		</Select>
		<Check bind:checked={onlyDrafts}>nur unbestätigte</Check>
		<Button variant="accent" class="ml-auto" onclick={newExpense}><Plus size={16} /> Ausgabe</Button>
	</div>

	{#if error}<Notice tone="danger">{error}</Notice>{/if}

	{#if totals.drafts.length > 0}
		<Notice tone="warn">
			{totals.drafts.length} Dauerauftrag-Buchung{totals.drafts.length === 1 ? '' : 'en'} unbestätigt. Bestätigen, sobald bezahlt —
			Betrag vorher anpassen, falls er abweicht.
			{#snippet actions()}
				<Button size="xs" onclick={confirmAll} disabled={busy}><CheckIcon size={13} /> Alle bestätigen</Button>
			{/snippet}
		</Notice>
	{/if}

	<Table minWidth="900px">
		<thead>
			<tr>
				<th>Datum</th><th>Kategorie</th><th>Lieferant / Beschreibung</th><th>Zuordnung</th><th class="text-right">Netto</th><th
					class="text-right">MwSt</th
				><th class="text-right">Brutto</th><th></th>
			</tr>
		</thead>
		<tbody>
			{#each rows as e (e.id)}
				{@const struck = !!e.storno_id}
				<tr class={struck ? 'text-faint [&_td:not(:last-child)]:line-through' : ''}>
					<td class="num text-[13px] whitespace-nowrap">
						{formatDate(e.receipt_date)}
						{#if month == null || e.period_month.slice(0, 7) !== e.receipt_date.slice(0, 7)}
							<div class="text-xs text-faint">für {monthLabel(e.period_month)}</div>
						{/if}
					</td>
					<td>
						<span class="flex flex-wrap items-center gap-1">
							{e.category_name}
							{#if e.status === 'draft'}<Badge tone="warn">unbestätigt</Badge>{/if}
							{#if e.storno_of}<Badge tone="danger">Storno</Badge>{/if}
							{#if e.storno_id}<Badge tone="danger">storniert</Badge>{/if}
						</span>
					</td>
					<td>
						{e.supplier ?? ''}
						{#if e.description}<div class="text-xs text-muted">{e.description}</div>{/if}
						{#if e.receipt_number}<div class="num text-xs text-faint">Beleg {e.receipt_number}</div>{/if}
					</td>
					<td class="text-xs text-muted">
						{#if e.vehicle_label}<div class="flex items-center gap-1"><Truck size={12} /> {e.vehicle_label}</div>{/if}
						{#if e.employee_name}<div class="flex items-center gap-1"><User size={12} /> {e.employee_name}</div>{/if}
						{#if e.inquiry_id}
							<div class="flex items-center gap-1">
								<Package size={12} /> <a class="hover:underline" href="/admin/inquiries/{e.inquiry_id}">{e.inquiry_label ?? 'Auftrag'}</a>
							</div>
						{/if}
					</td>
					<td class="num text-right">{formatEuro(e.netto_cents)}</td>
					<td class="num text-right text-muted">{e.vat_rate} %</td>
					<td class="num text-right font-medium">{formatEuro(e.brutto_cents)}</td>
					<td>
						<span class="flex justify-end gap-0.5">
							{#if e.receipt_s3_key}
								<Button variant="ghost" size="icon-sm" aria-label="Beleg ansehen" title="Beleg ansehen" onclick={() => showReceipt(e)}><FileText size={15} /></Button>
							{/if}
							{#if e.status === 'draft'}
								<Button variant="ghost" size="icon-sm" aria-label="Bestätigen (bezahlt)" title="Bestätigen (bezahlt)" onclick={() => confirmDraft(e)} disabled={busy}
									><CheckIcon size={15} /></Button
								>
							{/if}
							{#if !e.storno_of && !e.storno_id}
								<Button variant="ghost" size="icon-sm" aria-label="Bearbeiten" title="Bearbeiten" onclick={() => edit(e)}><Pencil size={15} /></Button>
								{#if e.status === 'booked'}
									<Button variant="ghost" size="icon-sm" aria-label="Stornieren" title="Stornieren" onclick={() => storno(e)} disabled={busy}
										><RotateCcw size={15} /></Button
									>
								{/if}
							{/if}
							<!-- A Storno goes together with its original: delete that one. -->
							{#if !e.storno_of}
								<Button variant="ghost" size="icon-sm" class="hover:text-danger" aria-label="Löschen" title="Löschen" onclick={() => remove(e)} disabled={busy}
									><Trash2 size={15} /></Button
								>
							{/if}
						</span>
					</td>
				</tr>
			{:else}
				<tr><td colspan="8" class="py-8 text-center text-sm text-muted">{loading ? 'Lädt …' : 'Keine Ausgaben.'}</td></tr>
			{/each}
		</tbody>
		{#if rows.length > 0}
			<tfoot>
				<tr class="font-semibold">
					<td colspan="4">Summe <span class="num font-normal text-faint">({rows.length})</span></td>
					<td class="num text-right">{formatEuro(totals.netto)}</td>
					<td class="num text-right">{formatEuro(totals.vat)}</td>
					<td class="num text-right">{formatEuro(totals.brutto)}</td>
					<td></td>
				</tr>
			</tfoot>
		{/if}
	</Table>
</div>

<ExpenseModal bind:open={modalOpen} expense={editing} {categories} {vehicles} {employees} onSaved={() => load()} />

<ConfirmationDialog
	bind:open={confirmOpen}
	title={confirmTitle}
	message={confirmMessage}
	{confirmLabel}
	loading={busy}
	onConfirm={async () => {
		await confirmAction();
		confirmOpen = false;
	}}
/>
