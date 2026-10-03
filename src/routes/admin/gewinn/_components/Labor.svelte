<script lang="ts">
	/**
	 * Löhne & Stunden — the monthly routine that makes the labor cost real:
	 * 1. finish the month in the hours tab, 2. "Stunden übernehmen" here,
	 * 3. book the wages (Ausgaben → Löhne, per employee), 4. the real €/h updates.
	 */
	import { apiGet, apiPost, apiPut, formatDateTime, formatEuro } from '$lib/utils/api.svelte';
	import { parseEuroInput } from '$lib/utils/format';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { AlertTriangle, ArrowDownToLine } from 'lucide-svelte';
	import {
		type EmployeesResponse,
		type TransferPreview,
		MONTH_SHORT,
		RATE_SOURCE_LABELS,
		currentMonthKey,
		fmtHours,
		fmtRate,
		monthLabel,
		shiftMonth,
		SOURCE_TONE
	} from './types';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	// Default to last month: that's the one Alex closes at the start of a new month.
	let month = $state(shiftMonth(currentMonthKey(), -1));
	let preview = $state<TransferPreview | null>(null);
	let previewLoading = $state(true);
	let staff = $state<EmployeesResponse | null>(null);
	let transferring = $state(false);
	let confirmOpen = $state(false);

	let defaultRate = $state('');
	let savingRate = $state(false);

	async function loadPreview() {
		previewLoading = true;
		try {
			preview = await apiGet<TransferPreview>(`/api/v1/admin/profit/labor/${month}`);
		} catch {
			showToast('Stunden konnten nicht geladen werden', 'error');
		} finally {
			previewLoading = false;
		}
	}

	async function loadStaff() {
		try {
			staff = await apiGet<EmployeesResponse>('/api/v1/admin/profit/employees');
			defaultRate = (staff.rates.default_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 });
		} catch {
			showToast('Mitarbeiterkosten konnten nicht geladen werden', 'error');
		}
	}

	$effect(() => {
		void month;
		loadPreview();
	});
	$effect(() => {
		loadStaff();
	});

	let unconfirmed = $derived(preview ? preview.lines.filter((l) => l.unconfirmed_days > 0) : []);
	let isFutureOrCurrent = $derived(month >= currentMonthKey());

	async function transfer() {
		transferring = true;
		try {
			preview = await apiPost<TransferPreview>(`/api/v1/admin/profit/labor/${month}/transfer`);
			showToast(`Stunden für ${monthLabel(month)} übernommen`, 'success');
			confirmOpen = false;
			await loadStaff();
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Übernahme fehlgeschlagen', 'error');
		} finally {
			transferring = false;
		}
	}

	async function saveRate() {
		const cents = parseEuroInput(defaultRate);
		if (cents == null) return;
		savingRate = true;
		try {
			await apiPut('/api/v1/admin/profit/settings', { default_rate_cents: cents });
			showToast('Standard-Stundensatz gespeichert', 'success');
			await Promise.all([loadStaff(), loadPreview()]);
		} catch (e) {
			showToast(e instanceof Error ? e.message : 'Speichern fehlgeschlagen', 'error');
		} finally {
			savingRate = false;
		}
	}

	function confirmMessage(): string {
		if (!preview) return '';
		let msg = `${fmtHours(preview.total_hours)} für ${preview.lines.length} Mitarbeiter, ${formatEuro(preview.total_cost_cents)} geschätzte Lohnkosten.`;
		if (preview.transferred_at) msg += ' Die bisherige Übernahme wird ersetzt.';
		if (unconfirmed.length) msg += ` Achtung: ${unconfirmed.length} Mitarbeiter haben noch unbestätigte Tage.`;
		return msg;
	}
</script>

<div class="flex flex-col gap-5">
	<section class="flex flex-col gap-3 rounded-md border border-line bg-panel p-4">
		<header class="flex flex-wrap items-center justify-between gap-3">
			<h3 class="text-[15px] font-semibold">Stunden übernehmen</h3>
			<Stepper
				label={monthLabel(month)}
				onprev={() => (month = shiftMonth(month, -1))}
				onnext={() => (month = shiftMonth(month, 1))}
				nextDisabled={month >= currentMonthKey()}
				prevLabel="Vorheriger Monat"
				nextLabel="Nächster Monat"
			/>
		</header>
		<p class="text-xs text-muted">
			Übernimmt die bezahlten Stunden aus dem Stunden-Tab (inkl. deiner Korrekturen) als festen Monatsstand. Spätere
			Änderungen im Stunden-Tab ändern den Monat erst, wenn du erneut übernimmst.
		</p>

		{#if preview}
			{#if preview.transferred_at}
				<Notice>
					Übernommen am {formatDateTime(preview.transferred_at)}.
					{preview.has_changes ? 'Seitdem haben sich Stunden geändert — erneut übernehmen?' : 'Keine Änderungen seitdem.'}
				</Notice>
			{/if}
			{#if !preview.month_complete}
				<Notice tone="warn">Der Monat läuft noch — eine Übernahme jetzt ist vorläufig.</Notice>
			{/if}
			{#if unconfirmed.length}
				<Notice tone="warn">
					Unbestätigte Tage (ohne Uhrzeiten, zählen mit 0 h):
					{unconfirmed.map((l) => `${l.name} ${l.unconfirmed_days}`).join(', ')}.
				</Notice>
			{/if}

			<Table minWidth="680px" class="bg-transparent">
				<thead>
					<tr>
						<th>Mitarbeiter</th><th class="text-right">Bezahlte Std.</th><th class="text-right">Gearbeitet</th><th class="text-right">Satz</th><th
							class="text-right">Kosten</th
						><th class="text-right">Bisher übernommen</th>
					</tr>
				</thead>
				<tbody>
					{#each preview.lines as l (l.employee_id)}
						{@const changed = l.changed && l.transferred_hours != null}
						<tr>
							<td>
								<span class="flex flex-wrap items-center gap-1.5">
									{l.name}
									{#if l.unconfirmed_days}<Badge tone="warn">{l.unconfirmed_days} unbestätigt</Badge>{/if}
								</span>
							</td>
							<td class="num text-right">{fmtHours(l.paid_hours)}</td>
							<td class="num text-right text-muted">{fmtHours(l.worked_hours)}</td>
							<td class="num text-right whitespace-nowrap">
								{fmtRate(l.rate_cents)}
								<Badge tone={SOURCE_TONE[l.rate_source]} class="ml-1">{RATE_SOURCE_LABELS[l.rate_source]}</Badge>
							</td>
							<td class="num text-right">{formatEuro(l.cost_cents)}</td>
							<td class="num text-right {changed ? 'font-semibold text-warn' : ''}">
								{l.transferred_hours == null ? '—' : fmtHours(l.transferred_hours)}
								{#if changed && l.transferred_hours != null}
									<span class="font-normal text-muted"
										>({l.paid_hours - l.transferred_hours > 0 ? '+' : ''}{fmtHours(
											Math.round((l.paid_hours - l.transferred_hours) * 100) / 100
										)})</span
									>
								{/if}
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="py-6 text-center text-sm text-muted">Keine Stunden in diesem Monat.</td></tr>
					{/each}
				</tbody>
				{#if preview.lines.length}
					<tfoot>
						<tr class="font-semibold">
							<td>Summe</td>
							<td class="num text-right">{fmtHours(preview.total_hours)}</td>
							<td></td>
							<td></td>
							<td class="num text-right">{formatEuro(preview.total_cost_cents)}</td>
							<td></td>
						</tr>
					</tfoot>
				{/if}
			</Table>

			<div class="flex flex-wrap items-center gap-3">
				<Button
					variant="solid"
					onclick={() => (confirmOpen = true)}
					disabled={transferring || !preview.has_changes || preview.lines.length === 0}
				>
					<ArrowDownToLine size={16} />
					{preview.transferred_at ? 'Erneut übernehmen' : `Stunden für ${monthLabel(month)} übernehmen`}
				</Button>
				{#if isFutureOrCurrent}<span class="text-xs text-faint">Laufender Monat</span>{/if}
			</div>
		{:else if previewLoading}
			<div class="h-40 animate-pulse rounded-md bg-sunk"></div>
		{/if}
	</section>

	<section class="flex flex-col gap-3 rounded-md border border-line bg-panel p-4">
		<header class="flex flex-wrap items-center justify-between gap-3">
			<h3 class="text-[15px] font-semibold">Echte Kosten pro Mitarbeiter</h3>
			{#if staff}
				<span class="flex items-center gap-2 text-xs text-muted">
					Betriebsschnitt <span class="num text-fg">{fmtRate(staff.rates.company_rate_cents)}</span>
					<Badge tone={SOURCE_TONE[staff.rates.company_source]}>{RATE_SOURCE_LABELS[staff.rates.company_source]}</Badge>
				</span>
			{/if}
		</header>
		<p class="text-xs text-muted">
			Echter Stundensatz = gebuchte Löhne ÷ übernommene Stunden (letzte 6 Monate mit beidem). Löhne ohne Mitarbeiter (z. B.
			SV-Beiträge) werden nach Stunden verteilt. Liegt der Satz deutlich über dem Standard, wird bezahlte Zeit nicht im
			Stunden-Tab erfasst (Krankheit, Urlaub, Lager).
		</p>

		{#if staff}
			<Table minWidth="760px" class="bg-transparent">
				<thead>
					<tr>
						<th>Mitarbeiter</th><th class="text-right">Satz</th>
						{#each staff.months as m (m)}<th class="text-right">{MONTH_SHORT[Number(m.slice(5, 7)) - 1]}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each staff.employees as e (e.employee_id)}
						<tr class="align-top">
							<td>
								{e.name}{e.active ? '' : ' (inaktiv)'}
								{#each e.warnings as w, wi (wi)}
									<div class="mt-1 flex items-center gap-1 text-xs text-warn"><AlertTriangle size={12} /> {w}</div>
								{/each}
							</td>
							<td class="num text-right whitespace-nowrap">
								{fmtRate(e.rate_cents)}
								<Badge tone={SOURCE_TONE[e.rate_source]} class="ml-1">{RATE_SOURCE_LABELS[e.rate_source]}</Badge>
								{#if e.real}<div class="text-xs text-faint">{e.real.months} Mon., {fmtHours(e.real.hours)}</div>{/if}
							</td>
							{#each e.months as m, mi (mi)}
								<td class="num text-right text-xs">
									{#if m.hours || m.wages_cents}
										<div>{fmtHours(m.hours)}{m.transferred ? '' : '*'}</div>
										<div class="text-faint">{m.wages_cents ? formatEuro(m.wages_cents) : '—'}</div>
										{#if m.rate_cents}<div class="text-faint">{fmtRate(m.rate_cents)}</div>{/if}
									{:else}
										<span class="text-faint">—</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</Table>
			<p class="text-xs text-muted">* Stunden noch nicht übernommen (Live-Stand aus dem Stunden-Tab). Zweite Zeile: gebuchter Lohn.</p>
		{/if}

		<form
			class="flex flex-wrap items-end gap-3 border-t border-line pt-3"
			onsubmit={(e) => {
				e.preventDefault();
				saveRate();
			}}
		>
			<Field label="Standard-Stundensatz inkl. Arbeitgeberanteil (€/h)" for="def-rate" hint="Gilt, solange es noch keine gebuchten Löhne gibt.">
				<Input id="def-rate" class="num w-32" inputmode="decimal" bind:value={defaultRate} />
			</Field>
			<Button type="submit" disabled={savingRate} class="mb-5">Speichern</Button>
		</form>
	</section>
</div>

<ConfirmationDialog
	bind:open={confirmOpen}
	title="Stunden für {monthLabel(month)} übernehmen?"
	message={confirmMessage()}
	confirmLabel="Übernehmen"
	variant="primary"
	loading={transferring}
	onConfirm={transfer}
/>
