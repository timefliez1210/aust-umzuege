<script lang="ts">
	/**
	 * Daueraufträge — rent, insurance, the lift's loan rate, software. Each active
	 * template creates an unconfirmed booking per due month; Alex confirms it once paid.
	 */
	import { apiDelete, apiGet, apiPatch, apiPost, formatEuro } from '$lib/utils/api.svelte';
	import { parseEuroInput } from '$lib/utils/format';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { Pencil, Plus, Trash2 } from 'lucide-svelte';
	import type { Category, Recurring, Vehicle } from './types';
	import { KIND_LABELS, currentMonthKey, monthKey, monthLabel } from './types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';

	let { categories, vehicles }: { categories: Category[]; vehicles: Vehicle[] } = $props();

	const INTERVALS: Record<number, string> = { 1: 'monatlich', 3: 'vierteljährlich', 6: 'halbjährlich', 12: 'jährlich' };

	let rows = $state<Recurring[]>([]);
	let loading = $state(true);
	let modalOpen = $state(false);
	let editing = $state<Recurring | null>(null);
	let saving = $state(false);
	let formError = $state<string | null>(null);
	let deleteTarget = $state<Recurring | null>(null);
	let deleteOpen = $state(false);

	// Form
	let categoryId = $state('');
	let label = $state('');
	let supplier = $state('');
	let brutto = $state('');
	let vatRate = $state(19);
	let interval = $state(1);
	let day = $state(1);
	let startMonth = $state(currentMonthKey());
	let endMonth = $state('');
	let vehicleId = $state('');
	let active = $state(true);
	let notes = $state('');

	async function load() {
		loading = true;
		try {
			rows = await apiGet<Recurring[]>('/api/v1/admin/profit/recurring');
		} catch {
			showToast('Daueraufträge konnten nicht geladen werden', 'error');
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});

	let monthlyFixed = $derived(
		rows
			.filter((r) => r.active && (!r.end_month || r.end_month >= `${currentMonthKey()}-01`))
			.reduce((s, r) => s + r.netto_cents / r.interval_months, 0)
	);

	function openForm(r: Recurring | null) {
		editing = r;
		const fallback = categories.find((c) => c.name === 'Miete') ?? categories[0];
		categoryId = r?.category_id ?? fallback?.id ?? '';
		label = r?.label ?? '';
		supplier = r?.supplier ?? '';
		brutto = r ? (r.brutto_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) : '';
		vatRate = r?.vat_rate ?? fallback?.default_vat_rate ?? 19;
		interval = r?.interval_months ?? 1;
		day = r?.day_of_month ?? 1;
		startMonth = r ? monthKey(r.start_month) : currentMonthKey();
		endMonth = r?.end_month ? monthKey(r.end_month) : '';
		vehicleId = r?.vehicle_id ?? '';
		active = r?.active ?? true;
		notes = r?.notes ?? '';
		formError = null;
		modalOpen = true;
	}

	async function save() {
		const cents = parseEuroInput(brutto);
		if (!label.trim() || cents == null || cents <= 0) {
			formError = 'Bezeichnung und Betrag sind Pflicht.';
			return;
		}
		saving = true;
		formError = null;
		const body = {
			category_id: categoryId,
			label: label.trim(),
			supplier: supplier || null,
			brutto_cents: cents,
			vat_rate: vatRate,
			interval_months: interval,
			day_of_month: day,
			start_month: startMonth,
			end_month: endMonth || null,
			vehicle_id: vehicleId || null,
			active,
			notes: notes || null
		};
		try {
			if (editing) await apiPatch(`/api/v1/admin/profit/recurring/${editing.id}`, body);
			else await apiPost('/api/v1/admin/profit/recurring', body);
			modalOpen = false;
			showToast('Gespeichert', 'success');
			await load();
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Speichern fehlgeschlagen.';
		} finally {
			saving = false;
		}
	}

	async function doDelete() {
		if (!deleteTarget) return;
		try {
			await apiDelete(`/api/v1/admin/profit/recurring/${deleteTarget.id}`);
			showToast('Dauerauftrag gelöscht', 'success');
			deleteOpen = false;
			await load();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Löschen fehlgeschlagen', 'error');
		}
	}
</script>

<div class="flex flex-col gap-3.5">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<Kpi label="Fixe Daueraufträge / Monat (netto)" value={formatEuro(Math.round(monthlyFixed))} class="min-w-64" />
		<Button variant="accent" onclick={() => openForm(null)}><Plus size={16} /> Dauerauftrag</Button>
	</div>

	<p class="text-xs text-muted">
		Jeder Dauerauftrag legt pro Fälligkeit eine unbestätigte Buchung unter „Ausgaben“ an. Die Kreditrate für den Möbellift
		hier einfach als Dauerauftrag in „Finanzierung / Kredit“ anlegen, mit Enddatum der Laufzeit.
	</p>

	<Table minWidth="820px">
		<thead>
			<tr>
				<th>Bezeichnung</th><th>Kategorie</th><th>Rhythmus</th><th>Laufzeit</th><th class="text-right">Netto</th><th class="text-right">Brutto</th><th
				></th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r (r.id)}
				<tr class={r.active ? '' : 'text-faint'}>
					<td>
						<span class="flex items-center gap-1.5 font-medium">{r.label}{#if !r.active}<Badge>pausiert</Badge>{/if}</span>
						{#if r.supplier}<div class="text-xs text-faint">{r.supplier}</div>{/if}
						{#if r.vehicle_label}<div class="text-xs text-faint">{r.vehicle_label}</div>{/if}
					</td>
					<td>{r.category_name} <span class="text-xs text-faint">({KIND_LABELS[r.category_kind]})</span></td>
					<td class="text-[13px]">{INTERVALS[r.interval_months]}, am {r.day_of_month}.</td>
					<td class="text-[13px] text-muted">ab {monthLabel(r.start_month)}{r.end_month ? ` bis ${monthLabel(r.end_month)}` : ''}</td>
					<td class="num text-right">{formatEuro(r.netto_cents)}</td>
					<td class="num text-right">{formatEuro(r.brutto_cents)}</td>
					<td>
						<span class="flex justify-end gap-0.5">
							<Button variant="ghost" size="icon-sm" aria-label="Bearbeiten" title="Bearbeiten" onclick={() => openForm(r)}><Pencil size={15} /></Button>
							<Button
								variant="ghost"
								size="icon-sm"
								class="hover:text-danger"
								aria-label="Löschen"
								title="Löschen"
								onclick={() => {
									deleteTarget = r;
									deleteOpen = true;
								}}><Trash2 size={15} /></Button
							>
						</span>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="7" class="py-8 text-center text-sm text-muted">
						{loading ? 'Lädt …' : 'Noch keine Daueraufträge — z. B. Miete Lagerhalle, Miete Büro, Kreditrate Möbellift.'}
					</td>
				</tr>
			{/each}
		</tbody>
	</Table>
</div>

{#if modalOpen}
	<Modal title={editing ? 'Dauerauftrag bearbeiten' : 'Neuer Dauerauftrag'} size="lg" onclose={() => (modalOpen = false)}>
		<form
			id="recurring-form"
			class="grid gap-3 sm:grid-cols-2"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<Field label="Bezeichnung" for="rc-label" class="sm:col-span-2">
				<Input id="rc-label" bind:value={label} placeholder="z. B. Miete Lagerhalle" maxlength={120} required />
			</Field>
			<Field label="Kategorie" for="rc-cat">
				<Select
					id="rc-cat"
					bind:value={categoryId}
					onchange={() => {
						const c = categories.find((x) => x.id === categoryId);
						if (c) vatRate = c.default_vat_rate;
					}}
				>
					{#each categories.filter((c) => c.active) as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
				</Select>
			</Field>
			<Field label="Empfänger" for="rc-sup"><Input id="rc-sup" bind:value={supplier} maxlength={200} /></Field>
			<Field label="Betrag brutto (€)" for="rc-brutto">
				<Input id="rc-brutto" class="num" inputmode="decimal" bind:value={brutto} placeholder="0,00" required />
			</Field>
			<Field label="MwSt" for="rc-vat">
				<Select id="rc-vat" bind:value={vatRate}>
					<option value={19}>19 %</option>
					<option value={7}>7 %</option>
					<option value={0}>0 % (keine)</option>
				</Select>
			</Field>
			<Field label="Rhythmus" for="rc-int">
				<Select id="rc-int" bind:value={interval}>
					{#each Object.entries(INTERVALS) as [k, v] (k)}<option value={Number(k)}>{v}</option>{/each}
				</Select>
			</Field>
			<Field label="Fällig am (Tag)" for="rc-day"><Input id="rc-day" class="num" type="number" min="1" max="28" bind:value={day} /></Field>
			<Field label="Erster Monat" for="rc-start"><Input id="rc-start" type="month" bind:value={startMonth} required /></Field>
			<Field label="Letzter Monat (optional)" for="rc-end"><Input id="rc-end" type="month" bind:value={endMonth} /></Field>
			<Field label="Fahrzeug" for="rc-veh">
				<Select id="rc-veh" bind:value={vehicleId}>
					<option value="">—</option>
					{#each vehicles as v (v.id)}<option value={v.id}>{v.label} ({v.kennzeichen})</option>{/each}
				</Select>
			</Field>
			<Field label="Status" for="rc-active">
				<Select id="rc-active" bind:value={active}>
					<option value={true}>aktiv</option>
					<option value={false}>pausiert</option>
				</Select>
			</Field>
			<Field label="Notiz" for="rc-notes" class="sm:col-span-2"><Input id="rc-notes" bind:value={notes} maxlength={500} /></Field>
			{#if formError}<Notice tone="danger" class="sm:col-span-2">{formError}</Notice>{/if}
		</form>
		{#snippet footer()}
			<Button onclick={() => (modalOpen = false)}>Abbrechen</Button>
			<Button type="submit" form="recurring-form" variant="solid" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
		{/snippet}
	</Modal>
{/if}

<ConfirmationDialog
	bind:open={deleteOpen}
	title="Dauerauftrag löschen?"
	message="Unbestätigte Buchungen dieses Dauerauftrags werden mitgelöscht. Bereits bestätigte Buchungen bleiben erhalten."
	confirmLabel="Löschen"
	onConfirm={doDelete}
/>
