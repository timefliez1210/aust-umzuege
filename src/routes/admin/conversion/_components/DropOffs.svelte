<script lang="ts">
	/**
	 * Wo springen Kunden ab? — every drop-off reason per channel, as count and share
	 * of that channel's Eingänge, grouped by funnel phase.
	 */
	import Table from '$lib/components/ui/Table.svelte';
	import { CHANNEL, REASONS, pct, type ChannelStats } from './types';

	let { channels, total }: { channels: ChannelStats[]; total: ChannelStats } = $props();

	let rows = $derived(REASONS.filter((r) => (total.lost_by_reason[r.key] ?? 0) > 0));
	let maxShare = $derived(
		Math.max(
			0.0001,
			...channels.flatMap((c) => rows.map((r) => (c.leads ? (c.lost_by_reason[r.key] ?? 0) / c.leads : 0)))
		)
	);
</script>

{#if rows.length === 0}
	<p class="text-sm text-muted">Im Zeitraum ist niemand abgesprungen.</p>
{:else}
	<Table minWidth="{280 + channels.length * 110}px">
		<thead>
			<tr>
				<th>Grund</th>
				{#each channels as c (c.channel)}
					{@const meta = CHANNEL[c.channel!]}
					<th class="text-right">
						<span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-xs {meta.dot}" aria-hidden="true"></span>{meta.short}</span>
					</th>
				{/each}
				<th class="text-right">Gesamt</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r, i (r.key)}
				{#if i === 0 || rows[i - 1].phase !== r.phase}
					<tr class="bg-sunk/50"><td colspan={channels.length + 2} class="label-xs text-faint">{r.phase}</td></tr>
				{/if}
				<tr>
					<td title={r.hint}>{r.label}</td>
					{#each channels as c (c.channel)}
						{@const n = c.lost_by_reason[r.key] ?? 0}
						{@const share = c.leads ? n / c.leads : 0}
						<td class="num text-right" title="{CHANNEL[c.channel!].label}: {n} von {c.leads} Eingängen">
							{#if n}
								<span class="flex items-center justify-end gap-2">
									<span class="hidden h-1.5 w-10 rounded-xs bg-sunk sm:block">
										<span class="block h-1.5 rounded-xs bg-danger/70" style="width:{(share / maxShare) * 100}%"></span>
									</span>
									<span>{n}</span>
									<span class="w-11 text-muted">{pct(n, c.leads, 0)}</span>
								</span>
							{:else}
								<span class="text-faint">—</span>
							{/if}
						</td>
					{/each}
					<td class="num text-right font-medium">
						{total.lost_by_reason[r.key]} <span class="font-normal text-muted">{pct(total.lost_by_reason[r.key] ?? 0, total.leads, 0)}</span>
					</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr class="font-semibold">
				<td>Abgesprungen</td>
				{#each channels as c (c.channel)}
					<td class="num text-right">{c.lost} <span class="font-normal text-muted">{pct(c.lost, c.leads, 0)}</span></td>
				{/each}
				<td class="num text-right">{total.lost} <span class="font-normal text-muted">{pct(total.lost, total.leads, 0)}</span></td>
			</tr>
			<tr class="text-muted">
				<td>Noch offen</td>
				{#each channels as c (c.channel)}
					<td class="num text-right">{c.open || '—'}</td>
				{/each}
				<td class="num text-right">{total.open}</td>
			</tr>
		</tfoot>
	</Table>
{/if}
