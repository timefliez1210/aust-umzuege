<script lang="ts">
	/**
	 * Weiterberechnete Kosten — per recharged category: what its KVA positions brought
	 * in vs. what it cost. Answers "does the Kilometerpauschale cover fuel?" and "do I
	 * sell Kartons at a profit?".
	 */
	import { apiGet, formatEuro } from '$lib/utils/api.svelte';
	import { ChevronDown, ChevronRight, Tags } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import CategoriesModal from './CategoriesModal.svelte';
	import { type RechargeReport, MONTH_SHORT, VERDICT_LABELS, VERDICT_TONE } from './types';

	let { year }: { year: number } = $props();

	let data = $state<RechargeReport | null>(null);
	let open = $state<Record<string, boolean>>({});
	let categoriesOpen = $state(false);

	async function load() {
		try {
			data = await apiGet<RechargeReport>(`/api/v1/admin/profit/recharge?year=${year}`);
		} catch {
			data = null;
		}
	}

	$effect(() => {
		void year;
		load();
	});

	const signed = (c: number) => (c > 0 ? '+' : '') + formatEuro(c);
	const resultClass = (c: number) => (c > 0 ? 'text-ok' : c < 0 ? 'text-danger' : '');
</script>

<Card>
	<CardHeader title="Weiterberechnete Kosten {year}" meta="Was über die KVA-Positionen reinkam vs. was es gekostet hat (netto)">
		{#snippet actions()}
			<Button size="sm" onclick={() => (categoriesOpen = true)}><Tags size={14} /> Kategorien</Button>
		{/snippet}
	</CardHeader>
	<div class="flex flex-col gap-2 px-4 pb-4">
		{#if data && data.rows.length}
			<Table bare minWidth="620px">
				<thead>
					<tr>
						<th></th>
						<th>Kosten → Position</th>
						<th class="text-right">Einnahmen</th>
						<th class="text-right">Kosten</th>
						<th class="text-right">Ergebnis</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as r (r.category_id)}
						<tr class="cursor-pointer hover:bg-sunk" onclick={() => (open[r.category_id] = !open[r.category_id])}>
							<td class="w-6 text-muted">
								{#if open[r.category_id]}<ChevronDown size={14} />{:else}<ChevronRight size={14} />{/if}
							</td>
							<td>
								<span class="font-medium">{r.category_name}</span>
								<span class="text-xs text-muted">→ {r.positions.join(', ')}</span>
							</td>
							<td class="num text-right">{formatEuro(r.revenue_cents)}</td>
							<td class="num text-right">{formatEuro(r.cost_cents)}</td>
							<td class="num text-right font-semibold {resultClass(r.result_cents)}">{signed(r.result_cents)}</td>
							<td class="text-right"><Badge tone={VERDICT_TONE[r.verdict]}>{VERDICT_LABELS[r.verdict]}</Badge></td>
						</tr>
						{#if open[r.category_id]}
							<tr>
								<td></td>
								<td colspan="5">
									<div class="grid grid-cols-3 gap-x-4 gap-y-1 py-1 text-xs sm:grid-cols-6">
										{#each r.months.filter((m) => m.revenue_cents || m.cost_cents) as m (m.month)}
											<div class="flex flex-col">
												<span class="text-muted">{MONTH_SHORT[Number(m.month.slice(5, 7)) - 1]}</span>
												<span class="num">{m.revenue_cents ? `+${formatEuro(m.revenue_cents)}` : '—'}</span>
												<span class="num text-muted">{m.cost_cents ? `−${formatEuro(m.cost_cents)}` : '—'}</span>
											</div>
										{:else}
											<span class="text-muted">Keine Bewegungen.</span>
										{/each}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</Table>
			<p class="text-xs text-muted">
				„Unvollständig“ = Kosten ohne Einnahmen oder umgekehrt — meist noch nicht gebucht (z. B. Kraftstoff) oder Einkauf und
				Verkauf in verschiedenen Monaten; auf das ganze Jahr gleicht sich das aus.
				{#if data.legacy_invoices}
					{data.legacy_invoices} aus dem Excel-Rechnungsbuch importierte Rechnungen haben keine Positionen und fehlen hier.
				{/if}
			</p>
		{:else if data}
			<p class="text-sm text-muted">
				Noch keine Kategorie ist als „weiterberechnet“ markiert — z. B. Kraftstoff über die Fahrkostenpauschale.
			</p>
		{/if}
	</div>
</Card>

<CategoriesModal bind:open={categoriesOpen} onSaved={load} />
