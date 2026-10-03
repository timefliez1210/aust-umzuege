<script lang="ts">
	/**
	 * Stundensatz-Kalkulation — what one sold crew hour must cost the customer.
	 * Wages are per hour (Alex pays only hours worked); only fixed costs depend on
	 * volume, so the rate is shown against the monthly volume, with full capacity as
	 * the comparison line.
	 */
	import { apiGet, formatEuro } from '$lib/utils/api.svelte';
	import { Settings2 } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import HourlySettingsModal from './HourlySettingsModal.svelte';
	import { type HourlyRate, VOLUME_LABELS, fmtHours, fmtRate, monthLabel } from './types';

	let data = $state<HourlyRate | null>(null);
	let loaded = $state(false);
	let error = $state<string | null>(null);
	let settingsOpen = $state(false);

	async function load() {
		error = null;
		try {
			data = await apiGet<HourlyRate | null>('/api/v1/admin/profit/hourly-rate');
		} catch {
			error = 'Stundensatz konnte nicht berechnet werden.';
		} finally {
			loaded = true;
		}
	}

	$effect(() => {
		load();
	});

	/** Current KVA rate against break-even / target. */
	let currentTone = $derived<'ok' | 'warn' | 'danger'>(
		!data
			? 'warn'
			: data.current_rate_cents < data.break_even_cents
				? 'danger'
				: data.current_rate_cents < data.target_rate_cents
					? 'warn'
					: 'ok'
	);
	const toneClass = { ok: 'text-ok', warn: 'text-warn', danger: 'text-danger' };
	const signed = (c: number) => (c > 0 ? '+' : '') + formatEuro(c);
</script>

<Card>
	<CardHeader
		title="Stundensatz-Kalkulation"
		meta={data
			? `Basis: ${data.months.length} Monat${data.months.length === 1 ? '' : 'e'} (${monthLabel(data.months[0])} – ${monthLabel(data.months[data.months.length - 1])}), Beträge netto pro Mitarbeiterstunde`
			: 'Was eine verkaufte Mitarbeiterstunde kosten muss'}
	>
		{#snippet actions()}
			{#if data?.inaccurate}<Badge tone="warn">vorläufig</Badge>{/if}
			<Button size="sm" onclick={() => (settingsOpen = true)}><Settings2 size={14} /> Annahmen</Button>
		{/snippet}
	</CardHeader>

	<div class="flex flex-col gap-4 px-4 pb-4">
		{#if error}<Notice tone="danger">{error}</Notice>{/if}

		{#if data}
			{#if data.warnings.length}
				<Notice tone="warn">
					<ul class="list-disc pl-4">
						{#each data.warnings as w}<li>{w}</li>{/each}
					</ul>
				</Notice>
			{/if}

			<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-muted">Break-even</span>
					<span class="num text-2xl font-semibold">{fmtRate(data.break_even_cents)}</span>
					<span class="text-xs text-muted">bei {fmtHours(data.basis_hours)}/Monat{data.planned_hours ? ' (Plan)' : ' (Ø)'}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-muted">Empfohlen inkl. Zielgewinn</span>
					<span class="num text-2xl font-semibold">{fmtRate(data.target_rate_cents)}</span>
					<span class="text-xs text-muted">{formatEuro(data.target_profit_cents)} Gewinn/Monat</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-muted">Aktueller KVA-Satz</span>
					<span class="num text-2xl font-semibold {toneClass[currentTone]}">{fmtRate(data.current_rate_cents)}</span>
					<span class="text-xs {toneClass[currentTone]}">
						{signed(data.result_at_current_cents)}/Monat bei {fmtHours(data.basis_hours)}
					</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-muted">Nötige Stunden zum aktuellen Satz</span>
					{#if data.hours_needed_break_even == null}
						<span class="text-sm font-semibold text-danger">Satz deckt nicht einmal Lohn + variable Kosten</span>
					{:else}
						<span class="num text-2xl font-semibold">{fmtHours(Math.round(data.hours_needed_break_even))}</span>
						<span class="text-xs text-muted">
							pro Monat für Break-even{data.hours_needed_target != null && data.target_profit_cents
								? `, ${fmtHours(Math.round(data.hours_needed_target))} mit Zielgewinn`
								: ''}
						</span>
					{/if}
				</div>
			</div>

			<p class="text-sm">
				<span class="text-muted">Vergleich volle Auslastung:</span>
				{data.capacity_crew} Mitarbeiter → {fmtHours(data.capacity_hours)}/Monat →
				<span class="num font-semibold">{fmtRate(data.capacity_break_even_cents)}</span> Break-even.
				<span class="text-muted">
					Gemessen verkauft: Ø {fmtHours(data.avg_sold_hours)} ({data.capacity_hours
						? Math.round((data.avg_sold_hours / data.capacity_hours) * 100)
						: 0} % Auslastung).
				</span>
			</p>

			<div class="grid gap-4 xl:grid-cols-[3fr_2fr]">
				<section class="flex flex-col gap-2">
					<h3 class="text-[13px] font-semibold">Satz nach Auslastung</h3>
					<Table bare minWidth="560px">
						<thead>
							<tr>
								<th>Std./Monat</th>
								<th class="text-right">Fixanteil</th>
								<th class="text-right">Break-even</th>
								<th class="text-right">+ Zielgewinn</th>
								<th class="text-right">Ergebnis/Monat zum akt. Satz</th>
							</tr>
						</thead>
						<tbody>
							{#each data.volumes as v (v.hours)}
								<tr class={v.kind === 'average' || v.kind === 'plan' ? 'font-semibold' : ''}>
									<td class="whitespace-nowrap">
										<span class="num">{fmtHours(v.hours)}</span>
										<span class="text-xs font-normal text-muted">{VOLUME_LABELS[v.kind]}</span>
									</td>
									<td class="num text-right">{fmtRate(v.fixed_share_cents)}</td>
									<td class="num text-right">{fmtRate(v.break_even_cents)}</td>
									<td class="num text-right">{fmtRate(v.with_profit_cents)}</td>
									<td class="num text-right {v.result_at_current_cents >= 0 ? 'text-ok' : 'text-danger'}">
										{signed(v.result_at_current_cents)}
									</td>
								</tr>
							{/each}
						</tbody>
					</Table>
				</section>

				<section class="flex flex-col gap-2">
					<h3 class="text-[13px] font-semibold">Woraus sich eine Stunde zusammensetzt</h3>
					<Table bare>
						<thead>
							<tr><th>Kosten</th><th class="text-right">Ø / Monat</th><th class="text-right">pro Stunde</th></tr>
						</thead>
						<tbody>
							{#each data.components as c (c.label)}
								<tr>
									<td class="whitespace-nowrap">
										{c.label}
										<span class="text-xs text-muted">{c.kind === 'fixed' ? 'fix' : c.kind === 'wages' ? 'pro Stunde' : 'variabel'}</span>
									</td>
									<td class="num text-right">{formatEuro(c.per_month_cents)}</td>
									<td class="num text-right">{fmtRate(c.per_hour_cents)}</td>
								</tr>
							{/each}
						</tbody>
						<tfoot>
							<tr class="font-semibold">
								<td class="whitespace-nowrap">Break-even</td>
								<td></td>
								<td class="num text-right">{fmtRate(data.break_even_cents)}</td>
							</tr>
						</tfoot>
					</Table>
					{#if data.excluded_per_month_cents}
						<p class="text-xs text-muted">
							Nicht im Satz: Ø {formatEuro(data.excluded_per_month_cents)}/Monat aus weiterberechneten Kategorien (z. B.
							Kraftstoff über die Fahrkostenpauschale) — siehe „Weiterberechnete Kosten“.
						</p>
					{/if}
				</section>
			</div>

			<p class="text-xs text-muted">
				Löhne pro verkaufter Stunde: alle Lohnkosten ÷ Stunden auf Kundenaufträgen — bezahlte Lager-, Werkstatt- oder
				Krankheitszeit steckt damit im Satz. Fixkosten werden auf die verkauften Stunden des Monats verteilt.
			</p>
		{:else if loaded && !error}
			<p class="text-sm text-muted">
				Noch kein abgeschlossener Monat mit Stunden auf Kundenaufträgen — die Kalkulation startet, sobald einer vorliegt.
			</p>
		{:else if !loaded}
			<div class="h-40 animate-pulse rounded-md bg-sunk"></div>
		{/if}
	</div>
</Card>

<HourlySettingsModal bind:open={settingsOpen} onSaved={load} />
