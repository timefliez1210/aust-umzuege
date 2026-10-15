<script lang="ts">
	/**
	 * Kanäle im Vergleich — one row per channel: volume, how far leads get, and the
	 * Abschlussquote with an inline bar so the best channel stands out at a glance.
	 */
	import { formatEuro } from '$lib/utils/api.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { CHANNEL, MIN_LEADS, STAGE_SENT_INDEX, fmtDays, pct, type ChannelStats } from './types';

	let { channels, total }: { channels: ChannelStats[]; total: ChannelStats } = $props();

	/** Best Abschlussquote among channels with enough leads to mean something. */
	let best = $derived.by(() => {
		const eligible = channels.filter((c) => c.leads >= MIN_LEADS);
		if (eligible.length < 2) return null;
		return eligible.reduce((a, b) => (b.won / b.leads > a.won / a.leads ? b : a)).channel;
	});
	let maxRate = $derived(Math.max(0.0001, ...channels.map((c) => (c.leads ? c.won / c.leads : 0))));
</script>

<Table minWidth="980px">
	<thead>
		<tr>
			<th>Kanal</th>
			<th class="text-right">Eingänge</th>
			<th class="text-right">Anteil</th>
			<th class="text-right" title="Anteil der Eingänge, aus denen eine Anfrage wurde">→ Anfrage</th>
			<th class="text-right" title="Anteil der Eingänge, die einen KVA bekommen haben">→ KVA</th>
			<th class="text-right">Aufträge</th>
			<th title="Aufträge ÷ Eingänge">Abschlussquote</th>
			<th class="text-right" title="Aufträge ÷ versendete KVAs">KVA → Auftrag</th>
			<th class="text-right">Auftragswert</th>
			<th class="text-right">Ø Auftrag</th>
			<th class="text-right" title="Median vom ersten Kontakt bis zum KVA">Tage bis KVA</th>
		</tr>
	</thead>
	<tbody>
		{#each channels as c (c.channel)}
			{@const meta = CHANNEL[c.channel!]}
			{@const rate = c.leads ? c.won / c.leads : 0}
			<tr>
				<td class="whitespace-nowrap" title={meta.hint}>
					<span class="flex items-center gap-2">
						<span class="size-2.5 shrink-0 rounded-xs {meta.dot}" aria-hidden="true"></span>
						<span class="font-medium">{meta.label}</span>
						{#if c.channel === best}<Badge tone="ok">Beste Quote</Badge>{/if}
						{#if c.leads < MIN_LEADS}<Badge title="Weniger als {MIN_LEADS} Eingänge — Prozente schwanken stark">wenig Daten</Badge>{/if}
					</span>
				</td>
				<td class="num whitespace-nowrap text-right">
					{c.leads}
					{#if c.duplicates}<span class="text-faint" title="doppelte Formulare, nicht mitgezählt"> +{c.duplicates}</span>{/if}
				</td>
				<td class="num whitespace-nowrap text-right text-muted">{pct(c.leads, total.leads, 0)}</td>
				<td class="num whitespace-nowrap text-right">{pct(c.reached[1], c.leads, 0)}</td>
				<td class="num whitespace-nowrap text-right">{pct(c.reached[STAGE_SENT_INDEX], c.leads, 0)}</td>
				<td class="num whitespace-nowrap text-right">{c.won}</td>
				<td class="min-w-40">
					<span class="flex items-center gap-2">
						<span class="h-2 flex-1 rounded-xs bg-sunk">
							<span class="block h-2 rounded-xs" style="width:{(rate / maxRate) * 100}%; background:{meta.color}"></span>
						</span>
						<span class="num w-14 text-right font-medium">{pct(c.won, c.leads)}</span>
					</span>
				</td>
				<td class="num whitespace-nowrap text-right">{pct(c.won, c.reached[STAGE_SENT_INDEX])}</td>
				<td class="num whitespace-nowrap text-right">{formatEuro(c.won_value_cents)}</td>
				<td class="num whitespace-nowrap text-right">{c.avg_won_value_cents === null ? '—' : formatEuro(c.avg_won_value_cents)}</td>
				<td class="num whitespace-nowrap text-right">{fmtDays(c.median_days_to_kva)}</td>
			</tr>
		{/each}
	</tbody>
	<tfoot>
		<tr class="font-semibold">
			<td>Gesamt</td>
			<td class="num whitespace-nowrap text-right">{total.leads}</td>
			<td class="num whitespace-nowrap text-right">100 %</td>
			<td class="num whitespace-nowrap text-right">{pct(total.reached[1], total.leads, 0)}</td>
			<td class="num whitespace-nowrap text-right">{pct(total.reached[STAGE_SENT_INDEX], total.leads, 0)}</td>
			<td class="num whitespace-nowrap text-right">{total.won}</td>
			<td class="num"><span class="block w-full text-right">{pct(total.won, total.leads)}</span></td>
			<td class="num whitespace-nowrap text-right">{pct(total.won, total.reached[STAGE_SENT_INDEX])}</td>
			<td class="num whitespace-nowrap text-right">{formatEuro(total.won_value_cents)}</td>
			<td class="num whitespace-nowrap text-right">{total.avg_won_value_cents === null ? '—' : formatEuro(total.avg_won_value_cents)}</td>
			<td class="num whitespace-nowrap text-right">{fmtDays(total.median_days_to_kva)}</td>
		</tr>
	</tfoot>
</Table>
