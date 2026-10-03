<script lang="ts">
	import Kpi from '$lib/components/ui/Kpi.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { apiGet, formatEuro, formatDate } from '$lib/utils/api.svelte';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import {
		type JobsResponse,
		RATE_SOURCE_LABELS,
		currentMonthKey,
		fmtHours,
		fmtRate,
		monthLabel,
		shiftMonth,
		SOURCE_TONE
	} from './types';

	let month = $state(currentMonthKey());
	let data = $state<JobsResponse | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let open = $state<Record<string, boolean>>({});

	async function load() {
		loading = true;
		error = null;
		try {
			data = await apiGet<JobsResponse>(`/api/v1/admin/profit/jobs?month=${month}`);
		} catch {
			error = 'Aufträge konnten nicht geladen werden.';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void month;
		load();
	});

	function pct(v: number | null): string {
		return v == null ? '—' : `${v.toLocaleString('de-DE', { maximumFractionDigits: 1 })} %`;
	}

	let marginPct = $derived(
		data && data.totals.revenue_cents
			? Math.round((data.totals.margin_cents / data.totals.revenue_cents) * 1000) / 10
			: null
	);
</script>

<div class="flex flex-col gap-3.5">
	<Stepper
		label={monthLabel(month)}
		onprev={() => (month = shiftMonth(month, -1))}
		onnext={() => (month = shiftMonth(month, 1))}
		prevLabel="Vorheriger Monat"
		nextLabel="Nächster Monat"
	/>

	{#if error}<Notice tone="danger">{error}</Notice>{/if}

	{#if data}
		<section class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-label="Kennzahlen">
			<Kpi label="Aufträge" value={String(data.jobs.length)} />
			<Kpi label="Umsatz netto" value={formatEuro(data.totals.revenue_cents)} />
			<Kpi label="Lohnkosten" value={formatEuro(data.totals.labor_cents)} />
			<Kpi label="Direkte Kosten" value={formatEuro(data.totals.direct_cents)} />
			<Kpi
				label="Deckungsbeitrag"
				value={formatEuro(data.totals.margin_cents)}
				sub={pct(marginPct)}
				valueClass={data.totals.margin_cents < 0 ? 'text-danger' : data.totals.margin_cents > 0 ? 'text-ok' : ''}
			/>
		</section>

		{#if data.jobs.length === 0}
			<EmptyState title="Keine Aufträge in diesem Monat" />
		{:else}
			<Table minWidth="820px">
				<thead>
					<tr>
						<th class="w-8"></th><th>Datum</th><th>Kunde</th><th class="text-right">Umsatz netto</th><th class="text-right">Löhne</th><th
							class="text-right">Direkt</th
						><th class="text-right">Deckungsbeitrag</th><th class="text-right">Marge</th>
					</tr>
				</thead>
				<tbody>
					{#each data.jobs as j (j.inquiry_id)}
						<tr class="cursor-pointer hover:bg-sunk/60" onclick={() => (open[j.inquiry_id] = !open[j.inquiry_id])}>
							<td class="text-faint">
								{#if open[j.inquiry_id]}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
							</td>
							<td class="num text-[13px] whitespace-nowrap text-muted">
								{j.scheduled_date ? formatDate(j.scheduled_date) : '—'}{j.end_date && j.end_date !== j.scheduled_date
									? `–${formatDate(j.end_date)}`
									: ''}
							</td>
							<td>
								<a class="font-medium hover:underline" href="/admin/inquiries/{j.inquiry_id}" onclick={(e) => e.stopPropagation()}>
									{j.customer_name ?? 'Unbekannt'}
								</a>
								{#if j.route}<div class="text-xs text-faint">{j.route}</div>{/if}
							</td>
							<td class="num text-right whitespace-nowrap">
								{formatEuro(j.revenue_cents)}
								{#if j.revenue_source === 'angebot'}<Badge tone="warn" class="ml-1" title="Noch keine Rechnung — Betrag aus dem KVA">KVA</Badge>{/if}
							</td>
							<td class="num text-right whitespace-nowrap">
								{formatEuro(j.labor_cents)}
								{#if j.labor_planned}<Badge tone="warn" class="ml-1" title="Mindestens ein Tag ist noch nicht erfasst — geplante Stunden">Plan</Badge>{/if}
							</td>
							<td class="num text-right">{formatEuro(j.direct_cents)}</td>
							<td class="num text-right font-medium {j.margin_cents > 0 ? 'text-ok' : j.margin_cents < 0 ? 'text-danger' : ''}">
								{formatEuro(j.margin_cents)}
							</td>
							<td class="num text-right text-muted">{pct(j.margin_pct)}</td>
						</tr>
						{#if open[j.inquiry_id]}
							<tr class="bg-sunk/40">
								<td></td>
								<td colspan="7">
									{#if j.crew.length === 0}
										<span class="text-[13px] text-faint">Keine Mitarbeiter eingeteilt.</span>
									{:else}
										<div class="grid grid-cols-[minmax(0,12rem)_auto_auto_auto] gap-x-5 gap-y-1 text-[13px]">
											{#each j.crew as c, ci (ci)}
												<span>{c.name}</span>
												<span class="num text-right">{fmtHours(c.hours)}{c.planned ? ' (Plan)' : ''}</span>
												<span class="num flex items-center justify-end gap-1.5">
													× {fmtRate(c.rate_cents)}
													<Badge tone={SOURCE_TONE[c.rate_source]}>{RATE_SOURCE_LABELS[c.rate_source]}</Badge>
												</span>
												<span class="num text-right">{formatEuro(c.cost_cents)}</span>
											{/each}
										</div>
									{/if}
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</Table>
			<p class="text-xs text-muted">
				Deckungsbeitrag = Umsatz − Löhne − Kosten, die direkt auf den Auftrag gebucht sind. Fixkosten werden nicht auf
				Aufträge verteilt. Löhne mit dem echten Stundensatz je Mitarbeiter, sobald Löhne gebucht sind.
			</p>
		{/if}
	{:else if loading}
		<div class="h-72 animate-pulse rounded-md bg-sunk"></div>
	{/if}
</div>
