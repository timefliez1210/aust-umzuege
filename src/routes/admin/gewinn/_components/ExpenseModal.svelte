<script lang="ts">
	/**
	 * Create/edit one expense. Alex types the BRUTTO amount and picks the VAT rate;
	 * the backend splits netto/USt. Wages are always 0 % (no USt on Lohn).
	 */
	import { untrack } from 'svelte';
	import { apiGet, apiPatch, apiPost, formatEuro } from '$lib/utils/api.svelte';
	import { parseEuroInput } from '$lib/utils/format';
	import type { Category, Expense, JobsResponse, Vehicle } from './types';
	import { KIND_LABELS, monthKey } from './types';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';

	let {
		open = $bindable(false),
		expense = null,
		categories,
		vehicles,
		employees,
		onSaved
	}: {
		open: boolean;
		expense?: Expense | null;
		categories: Category[];
		vehicles: Vehicle[];
		employees: { id: string; name: string }[];
		onSaved: (e: Expense) => void;
	} = $props();

	const today = () => new Date().toISOString().slice(0, 10);

	let categoryId = $state('');
	let brutto = $state('');
	let vatRate = $state(19);
	let receiptDate = $state(today());
	let paidOn = $state('');
	let periodMonth = $state('');
	let supplier = $state('');
	let receiptNumber = $state('');
	let description = $state('');
	let vehicleId = $state('');
	let employeeId = $state('');
	let inquiryId = $state('');
	let file = $state<File | null>(null);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let jobs = $state<{ id: string; label: string }[]>([]);

	let category = $derived(categories.find((c) => c.id === categoryId));
	let isWages = $derived(category?.kind === 'wages');
	let bruttoCents = $derived(parseEuroInput(brutto));
	let effectiveVat = $derived(isWages ? 0 : vatRate);
	let nettoCents = $derived(
		bruttoCents == null ? null : Math.round((bruttoCents * 100) / (100 + effectiveVat))
	);
	let month = $derived(periodMonth || receiptDate.slice(0, 7));

	// (Re)fill the form when the dialog opens — and only then. Everything else is read
	// untracked: the effect used to read `categoryId` itself, so picking a category
	// re-ran it and snapped the dropdown back to the default.
	$effect(() => {
		if (!open) return;
		untrack(fillForm);
	});

	function fillForm() {
		const e = expense;
		const initial = e
			? categories.find((c) => c.id === e.category_id)
			: (categories.find((c) => c.name === 'Kraftstoff') ?? categories[0]);
		categoryId = e?.category_id ?? initial?.id ?? '';
		brutto = e ? (e.brutto_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) : '';
		vatRate = e?.vat_rate ?? initial?.default_vat_rate ?? 19;
		receiptDate = e?.receipt_date ?? today();
		paidOn = e?.paid_on ?? '';
		periodMonth = e ? monthKey(e.period_month) : '';
		supplier = e?.supplier ?? '';
		receiptNumber = e?.receipt_number ?? '';
		description = e?.description ?? '';
		vehicleId = e?.vehicle_id ?? '';
		employeeId = e?.employee_id ?? '';
		inquiryId = e?.inquiry_id ?? '';
		file = null;
		error = null;
	}

	// Categories can arrive after the dialog opened (first visit): pick a default then.
	$effect(() => {
		if (open && !categoryId && categories.length) {
			untrack(() => {
				const c = categories.find((x) => x.name === 'Kraftstoff') ?? categories[0];
				categoryId = c.id;
				vatRate = c.default_vat_rate;
			});
		}
	});

	// Jobs of the booking month — the ones a cost can be attributed to.
	$effect(() => {
		if (!open || !month) return;
		const m = month;
		apiGet<JobsResponse>(`/api/v1/admin/profit/jobs?month=${m}`)
			.then((r) => {
				jobs = r.jobs.map((j) => ({
					id: j.inquiry_id,
					label: `${j.scheduled_date?.slice(8, 10)}.${j.scheduled_date?.slice(5, 7)}. ${j.customer_name ?? ''}`
				}));
				if (expense?.inquiry_id && !jobs.some((j) => j.id === expense?.inquiry_id)) {
					jobs = [{ id: expense.inquiry_id, label: expense.inquiry_label ?? 'Auftrag' }, ...jobs];
				}
			})
			.catch(() => (jobs = []));
	});

	function onCategoryChange() {
		const c = categories.find((x) => x.id === categoryId);
		if (c) vatRate = c.default_vat_rate;
	}

	async function save() {
		if (bruttoCents == null || bruttoCents <= 0) {
			error = 'Bitte einen Betrag eingeben.';
			return;
		}
		if (!categoryId) {
			error = 'Bitte eine Kategorie wählen.';
			return;
		}
		saving = true;
		error = null;
		const body = {
			category_id: categoryId,
			brutto_cents: bruttoCents,
			vat_rate: effectiveVat,
			receipt_date: receiptDate,
			paid_on: paidOn || null,
			period_month: periodMonth || null,
			supplier: supplier || null,
			receipt_number: receiptNumber || null,
			description: description || null,
			vehicle_id: vehicleId || null,
			employee_id: employeeId || null,
			inquiry_id: inquiryId || null
		};
		try {
			let saved = expense
				? await apiPatch<Expense>(`/api/v1/admin/profit/expenses/${expense.id}`, body)
				: await apiPost<Expense>('/api/v1/admin/profit/expenses', body);
			if (file) {
				const fd = new FormData();
				fd.append('file', file);
				saved = await apiPost<Expense>(`/api/v1/admin/profit/expenses/${saved.id}/receipt`, fd);
			}
			open = false;
			onSaved(saved);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen.';
		} finally {
			saving = false;
		}
	}

	const grouped = $derived(
		(['fixed', 'variable', 'wages'] as const).map((k) => ({
			kind: k,
			items: categories.filter((c) => c.kind === k && c.active)
		}))
	);
</script>

{#if open}
	<Modal title={expense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe'} size="lg" onclose={() => (open = false)}>
		<form
			id="expense-form"
			class="grid gap-3 sm:grid-cols-2"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<Field label="Kategorie" for="ex-cat">
				<Select id="ex-cat" bind:value={categoryId} onchange={onCategoryChange}>
					{#each grouped as g (g.kind)}
						{#if g.items.length}
							<optgroup label={KIND_LABELS[g.kind]}>
								{#each g.items as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
							</optgroup>
						{/if}
					{/each}
				</Select>
			</Field>
			<Field label="Betrag brutto (€)" for="ex-brutto">
				<Input id="ex-brutto" class="num" inputmode="decimal" placeholder="0,00" bind:value={brutto} required />
			</Field>
			<Field label="MwSt" for="ex-vat">
				<Select id="ex-vat" bind:value={vatRate} disabled={isWages}>
					<option value={19}>19 %</option>
					<option value={7}>7 %</option>
					<option value={0}>0 % (keine)</option>
				</Select>
			</Field>
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted">Netto</span>
				<span class="num flex h-9 items-center text-base font-semibold">{nettoCents == null ? '—' : formatEuro(nettoCents)}</span>
			</div>
			<Field label="Belegdatum" for="ex-date"><Input id="ex-date" type="date" bind:value={receiptDate} required /></Field>
			<Field label="Bezahlt am" for="ex-paid"><Input id="ex-paid" type="date" bind:value={paidOn} /></Field>
			<Field label="Gehört zu Monat" for="ex-month">
				<Input id="ex-month" type="month" bind:value={periodMonth} placeholder={receiptDate.slice(0, 7)} />
			</Field>
			<Field label="Lieferant / Empfänger" for="ex-supplier"><Input id="ex-supplier" bind:value={supplier} maxlength={200} /></Field>
			<Field label="Belegnummer" for="ex-nr"><Input id="ex-nr" bind:value={receiptNumber} maxlength={100} /></Field>
			<Field label="Fahrzeug" for="ex-veh">
				<Select id="ex-veh" bind:value={vehicleId}>
					<option value="">—</option>
					{#each vehicles as v (v.id)}<option value={v.id}>{v.label} ({v.kennzeichen})</option>{/each}
				</Select>
			</Field>
			<Field label="Mitarbeiter{isWages ? ' (für den echten Stundensatz)' : ''}" for="ex-emp">
				<Select id="ex-emp" bind:value={employeeId}>
					<option value="">{isWages ? '— alle (z. B. SV-Beiträge)' : '—'}</option>
					{#each employees as e (e.id)}<option value={e.id}>{e.name}</option>{/each}
				</Select>
			</Field>
			<Field label="Auftrag" for="ex-job">
				<Select id="ex-job" bind:value={inquiryId}>
					<option value="">—</option>
					{#each jobs as j (j.id)}<option value={j.id}>{j.label}</option>{/each}
				</Select>
			</Field>
			<Field label="Beschreibung" for="ex-desc" class="sm:col-span-2">
				<Input id="ex-desc" bind:value={description} maxlength={500} />
			</Field>
			<Field
				label="Beleg (Foto oder PDF){expense?.receipt_filename ? ` — vorhanden: ${expense.receipt_filename}` : ''}"
				for="ex-file"
				class="sm:col-span-2"
			>
				<input
					id="ex-file"
					type="file"
					accept="image/*,application/pdf"
					class="text-[13px] text-muted file:mr-3 file:h-8 file:rounded-sm file:border file:border-line-strong file:bg-panel file:px-3 file:text-fg"
					onchange={(e) => (file = e.currentTarget.files?.[0] ?? null)}
				/>
			</Field>
			{#if error}<Notice tone="danger" class="sm:col-span-2">{error}</Notice>{/if}
		</form>
		{#snippet footer()}
			<Button onclick={() => (open = false)}>Abbrechen</Button>
			<Button type="submit" form="expense-form" variant="solid" disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
		{/snippet}
	</Modal>
{/if}
