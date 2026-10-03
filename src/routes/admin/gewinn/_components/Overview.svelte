<script lang="ts">
	import { apiGet, formatEuro } from '$lib/utils/api.svelte';
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import HourlyRateCard from './HourlyRateCard.svelte';
	import RechargeCard from './RechargeCard.svelte';
	import {
		type Overview,
		LABOR_SOURCE_LABELS,
		MONTH_LONG,
		RATE_SOURCE_LABELS,
		fmtHours,
		fmtRate,
		monthLabel,
		SOURCE_TONE
	} from './types';

	let { onOpenTab }: { onOpenTab: (tab: 'ausgaben' | 'loehne' | 'dauerauftraege') => void } = $props();

	const thisYear = new Date().getFullYear();
	let year = $state(thisYear);
	let data = $state<Overview | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			data = await apiGet<Overview>(`/api/v1/admin/profit/overview?year=${year}`);
		} catch {
			error = 'Übersicht konnte nicht geladen werden.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void year;
		load();
	});

	/** Months that have started — the "bisher" figures ignore the forecast. */
	let elapsed = $derived(data ? data.months.filter((m) => !m.is_future) : []);
	let ytd = $derived({
		revenue: elapsed.reduce((s, m) => s + m.revenue_cents, 0),
		labor: elapsed.reduce((s, m) => s + m.labor_cents, 0),
		fixed: elapsed.reduce((s, m) => s + m.fixed_cents, 0),
		variable: elapsed.reduce((s, m) => s + m.variable_cents, 0),
		result: elapsed.reduce((s, m) => s + m.result_cents, 0)
	});
	let unpaidLaborMonths = $derived(
		elapsed.filter((m) => !m.is_current && m.labor_source === 'vorlaeufig').length
	);

	function pct(part: number, whole: number): string {
		// A month carried by a Gutschrift has no meaningful margin.
		if (whole <= 0) return '—';
		return `${((part / whole) * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
	}
</script>

<div class="flex flex-col gap-3.5">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Stepper
			label={String(year)}
			onprev={() => year--}
			onnext={() => year++}
			nextDisabled={year >= thisYear + 1}
			prevLabel="Vorheriges Jahr"
			nextLabel="Nächstes Jahr"
		/>
		{#if data}
			<span class="flex items-center gap-2 text-xs text-muted">
				Lohnsatz <span class="num text-fg">{fmtRate(data.rates.company_rate_cents)}</span>
				<Badge tone={SOURCE_TONE[data.rates.company_source]}>{RATE_SOURCE_LABELS[data.rates.company_source]}</Badge>
			</span>
		{/if}
	</div>

	{#if error}<Notice tone="danger">{error}</Notice>{/if}

	{#if data}
		{#if data.open_drafts > 0}
			<Notice tone="warn">
				{data.open_drafts} Dauerauftrag-Buchung{data.open_drafts === 1 ? '' : 'en'} warte{data.open_drafts === 1 ? 't' : 'n'} auf
				Bestätigung — sie sind schon eingerechnet.
				{#snippet actions()}<Button size="xs" onclick={() => onOpenTab('ausgaben')}>Zu den Ausgaben</Button>{/snippet}
			</Notice>
		{/if}
		{#if unpaidLaborMonths > 0}
			<Notice>
				Für {unpaidLaborMonths} abgeschlossene{unpaidLaborMonths === 1 ? 'n Monat' : ' Monate'} sind die Löhne nur geschätzt.
				Stunden übernehmen und Löhne buchen macht den Stundensatz genauer.
				{#snippet actions()}<Button size="xs" onclick={() => onOpenTab('loehne')}>Löhne & Stunden</Button>{/snippet}
			</Notice>
		{/if}

		<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Kennzahlen">
			<Kpi label="Umsatz netto{year === thisYear ? ' bisher' : ''}" value={formatEuro(ytd.revenue)} spark={elapsed.map((m) => m.revenue_cents)} />
			<Kpi label="Lohnkosten" value={formatEuro(ytd.labor)} sub="{pct(ytd.labor, ytd.revenue)} vom Umsatz" />
			<Kpi label="Fixkosten" value={formatEuro(ytd.fixed)} />
			<Kpi label="Variable Kosten" value={formatEuro(ytd.variable)} />
			<Kpi
				label="Ergebnis"
				value={formatEuro(ytd.result)}
				sub="{pct(ytd.result, ytd.revenue)} Marge"
				spark={elapsed.map((m) => m.result_cents)}
				sparkClass="text-accent"
				class={ytd.result < 0 ? '[&_.text-\[26px\]]:text-danger' : ''}
			/>
			{#if data.break_even}
				<Kpi
					label="Break-even / Monat"
					value={formatEuro(data.break_even.revenue_cents)}
					sub="{Math.round(data.break_even.contribution_ratio * 100)} % Deckungsbeitrag"
				/>
			{/if}
		</section>

		<HourlyRateCard />

		<RechargeCard {year} />

		<Table minWidth="760px">
			<thead>
				<tr>
					<th>Monat</th><th class="text-right">Umsatz netto</th><th class="text-right">Löhne</th><th class="text-right">Fixkosten</th><th
						class="text-right">Variabel</th
					><th class="text-right">Ergebnis</th><th class="text-right">Marge</th>
				</tr>
			</thead>
			<tbody>
				{#each data.months as m, i (m.month)}
					<tr class="{m.is_future ? 'text-faint italic' : ''} {m.is_current ? 'bg-sunk/60' : ''}">
						<td class="whitespace-nowrap {m.is_current ? 'font-semibold' : ''}">
							{MONTH_LONG[i]}{m.is_current ? ' · laufend' : ''}{m.is_future ? ' · Plan' : ''}
						</td>
						<td class="num text-right">{formatEuro(m.revenue_cents)}</td>
						<td class="num text-right whitespace-nowrap" title={m.labor_hours ? fmtHours(m.labor_hours) : ''}>
							{formatEuro(m.labor_cents)}
							{#if m.labor_source !== 'keine'}
								<Badge tone={SOURCE_TONE[m.labor_source]} class="ml-1 not-italic">{LABOR_SOURCE_LABELS[m.labor_source]}</Badge>
							{/if}
						</td>
						<td class="num text-right whitespace-nowrap">
							{formatEuro(m.fixed_cents)}
							{#if m.draft_cents}<Badge tone="warn" class="ml-1 not-italic" title="davon unbestätigt: {formatEuro(m.draft_cents)}">offen</Badge>{/if}
						</td>
						<td class="num text-right">{formatEuro(m.variable_cents)}</td>
						<td class="num text-right font-medium {m.result_cents > 0 ? 'text-ok' : m.result_cents < 0 ? 'text-danger' : ''}">
							{formatEuro(m.result_cents)}
						</td>
						<td class="num text-right text-muted">{pct(m.result_cents, m.revenue_cents)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="font-semibold">
					<td>Jahr {year}</td>
					<td class="num text-right">{formatEuro(data.totals.revenue_cents)}</td>
					<td class="num text-right">{formatEuro(data.totals.labor_cents)}</td>
					<td class="num text-right">{formatEuro(data.totals.fixed_cents)}</td>
					<td class="num text-right">{formatEuro(data.totals.variable_cents)}</td>
					<td class="num text-right {data.totals.result_cents > 0 ? 'text-ok' : data.totals.result_cents < 0 ? 'text-danger' : ''}">
						{formatEuro(data.totals.result_cents)}
					</td>
					<td class="num text-right">{pct(data.totals.result_cents, data.totals.revenue_cents)}</td>
				</tr>
			</tfoot>
		</Table>
		<p class="text-xs text-muted">
			Umsatz nach Leistungsmonat wie im Rechnungsbuch. Zukünftige Monate enthalten bereits eingeplante Einsätze und
			Daueraufträge, aber noch keinen Umsatz ohne Rechnung. Nur Controlling — ersetzt nicht den Steuerberater.
		</p>

		{#if data.vehicles.length > 0}
			<section class="flex flex-col gap-2">
				<h3 class="text-[15px] font-semibold">Kosten pro Fahrzeug {year}</h3>
				<Table>
					<thead><tr><th>Fahrzeug</th><th class="text-right">Gesamt netto</th><th class="text-right">Ø pro Monat</th></tr></thead>
					<tbody>
						{#each data.vehicles as v (v.vehicle_id)}
							<tr>
								<td>{v.label} <span class="text-faint">({v.kennzeichen})</span></td>
								<td class="num text-right">{formatEuro(v.total_cents)}</td>
								<td class="num text-right">{formatEuro(v.per_month_cents)}</td>
							</tr>
						{/each}
					</tbody>
				</Table>
			</section>
		{/if}

		{#if data.break_even}
			<p class="text-xs text-muted">Break-even berechnet aus {data.break_even.months.map(monthLabel).join(', ')}.</p>
		{/if}
	{:else if loading}
		<div class="h-80 animate-pulse rounded-md bg-sunk"></div>
	{/if}
</div>
