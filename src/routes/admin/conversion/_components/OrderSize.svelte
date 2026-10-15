<script lang="ts">
	/**
	 * Auftragsgröße — links a lead's channel to the size of its KVA: which channel
	 * brings the big jobs, and how likely each channel books a job of a given size.
	 *
	 * Computed from the lead list (KVA netto per lead), so it follows the selected
	 * period. Quotes use decided leads only (Auftrag or abgesprungen) — open KVAs
	 * would drag the newest, often bigger, offers down.
	 */
	import { formatEuro } from '$lib/utils/api.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import { CHANNEL, CHANNELS, pct, type Channel, type Lead } from './types';
	import { BANDS, BIG_FROM_CENTS, bandOf, sizeStats } from './orderSize';

	let { leads }: { leads: Lead[] } = $props();

	let withKva = $derived(leads.filter((l) => l.outcome !== 'duplicate' && (l.value_cents ?? 0) > 0));
	let present = $derived(CHANNELS.filter((c) => withKva.some((l) => l.channel === c.key)));
	let perChannel = $derived(present.map((c) => ({ meta: c, s: sizeStats(withKva.filter((l) => l.channel === c.key)) })));
	let all = $derived(sizeStats(withKva));

	/** Won value from big jobs, split by channel — "woher kommen die großen Aufträge". */
	let bigWon = $derived(
		present
			.map((c) => ({
				meta: c,
				cents: withKva
					.filter((l) => l.channel === c.key && l.outcome === 'won' && (l.value_cents ?? 0) >= BIG_FROM_CENTS)
					.reduce((s, l) => s + (l.value_cents ?? 0), 0),
				count: withKva.filter((l) => l.channel === c.key && l.outcome === 'won' && (l.value_cents ?? 0) >= BIG_FROM_CENTS).length
			}))
			.filter((x) => x.count > 0)
	);
	let bigTotal = $derived(bigWon.reduce((s, x) => s + x.cents, 0));

	/** Cell for one band × channel: decided leads, won, quote. */
	function cell(channel: Channel | null, band: number) {
		const rows = withKva.filter((l) => (channel === null || l.channel === channel) && bandOf(l.value_cents!) === band);
		const decided = rows.filter((l) => l.outcome === 'won' || l.outcome === 'lost');
		const won = decided.filter((l) => l.outcome === 'won').length;
		return { kvas: rows.length, decided: decided.length, won, rate: decided.length ? won / decided.length : null };
	}
	const THIN = 5;
</script>

{#if withKva.length === 0}
	<p class="text-sm text-muted">Im Zeitraum gibt es keine KVAs mit Betrag.</p>
{:else}
	<div class="flex flex-col gap-5">
		<!-- 1. Per channel: how big are its KVAs and orders? -->
		<Table minWidth="860px">
			<thead>
				<tr>
					<th>Kanal</th>
					<th class="text-right">KVAs</th>
					<th class="text-right" title="Median aller KVA-Beträge (netto)">Typischer KVA</th>
					<th class="text-right">Ø Auftrag</th>
					<th class="text-right" title="Aufträge ab {formatEuro(BIG_FROM_CENTS)} netto">Große Aufträge</th>
					<th class="text-right" title="Anteil des Auftragswerts aus Aufträgen ab {formatEuro(BIG_FROM_CENTS)}">davon Umsatz</th>
					<th class="text-right">Größter Auftrag</th>
				</tr>
			</thead>
			<tbody>
				{#each perChannel as { meta, s } (meta.key)}
					<tr>
						<td class="whitespace-nowrap">
							<span class="flex items-center gap-2"><span class="size-2.5 rounded-xs {meta.dot}" aria-hidden="true"></span>{meta.label}</span>
						</td>
						<td class="num text-right">{s.kvas}</td>
						<td class="num text-right whitespace-nowrap">{s.medianKva === null ? '—' : formatEuro(s.medianKva)}</td>
						<td class="num text-right whitespace-nowrap">{s.avgWon === null ? '—' : formatEuro(s.avgWon)}</td>
						<td class="num text-right whitespace-nowrap">{s.bigWon} <span class="text-muted">von {s.won}</span></td>
						<td class="num text-right">{pct(s.bigWonCents, s.wonCents, 0)}</td>
						<td class="num text-right whitespace-nowrap">{s.maxWon === null ? '—' : formatEuro(s.maxWon)}</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="font-semibold">
					<td>Gesamt</td>
					<td class="num text-right">{all.kvas}</td>
					<td class="num text-right whitespace-nowrap">{all.medianKva === null ? '—' : formatEuro(all.medianKva)}</td>
					<td class="num text-right whitespace-nowrap">{all.avgWon === null ? '—' : formatEuro(all.avgWon)}</td>
					<td class="num text-right whitespace-nowrap">{all.bigWon} <span class="font-normal text-muted">von {all.won}</span></td>
					<td class="num text-right">{pct(all.bigWonCents, all.wonCents, 0)}</td>
					<td class="num text-right whitespace-nowrap">{all.maxWon === null ? '—' : formatEuro(all.maxWon)}</td>
				</tr>
			</tfoot>
		</Table>

		<!-- 2. Where do the big jobs come from? One 100 % bar of big-order value. -->
		{#if bigTotal > 0}
			<div class="flex flex-col gap-2">
				<h3 class="text-[13px] font-medium">Woher kommen die großen Aufträge? <span class="font-normal text-muted">(ab {formatEuro(BIG_FROM_CENTS)}, nach Auftragswert)</span></h3>
				<div class="flex h-7 w-full gap-[2px] overflow-hidden rounded-sm" role="img" aria-label="Anteil am Wert großer Aufträge nach Kanal">
					{#each bigWon as x (x.meta.key)}
						<span
							class="h-full first:rounded-l-sm last:rounded-r-sm"
							style="flex:{x.cents} 1 0; background:{x.meta.color}"
							title="{x.meta.label}: {x.count} {x.count === 1 ? 'Auftrag' : 'Aufträge'}, {formatEuro(x.cents)} ({pct(x.cents, bigTotal, 0)})"
						></span>
					{/each}
				</div>
				<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
					{#each bigWon as x (x.meta.key)}
						<li class="num flex items-center gap-1.5">
							<span class="size-2.5 rounded-xs {x.meta.dot}" aria-hidden="true"></span>{x.meta.short}
							<span class="text-fg">{pct(x.cents, bigTotal, 0)}</span>· {x.count} {x.count === 1 ? 'Auftrag' : 'Aufträge'} · {formatEuro(x.cents)}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- 3. Close rate by size and channel. -->
		<div class="flex flex-col gap-2">
			<h3 class="text-[13px] font-medium">Abschlussquote nach Auftragsgröße</h3>
			<Table minWidth="{200 + (present.length + 1) * 120}px">
				<thead>
					<tr>
						<th>KVA netto</th>
						{#each present as c (c.key)}
							<th class="text-right"><span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-xs {c.dot}" aria-hidden="true"></span>{c.short}</span></th>
						{/each}
						<th class="text-right">Gesamt</th>
					</tr>
				</thead>
				<tbody>
					{#each BANDS as band, bi (band.label)}
						<tr>
							<td class="whitespace-nowrap">{band.label}</td>
							{#each [...present.map((c) => c.key), null] as ch (ch ?? 'all')}
								{@const c = cell(ch, bi)}
								<td
									class="num text-right {ch === null ? 'font-medium' : ''}"
									title="{ch ? CHANNEL[ch].label : 'Gesamt'}, {band.label}: {c.won} von {c.decided} entschiedenen KVAs gebucht ({c.kvas} KVAs insgesamt)"
								>
									{#if c.decided === 0}
										<span class="text-faint">—</span>
									{:else}
										<span class="flex items-center justify-end gap-2 {c.decided < THIN ? 'text-faint opacity-60' : ''}">
											<span class="hidden h-1.5 w-10 rounded-xs bg-sunk sm:block">
												<span class="block h-1.5 rounded-xs" style="width:{(c.rate ?? 0) * 100}%; background:{ch ? CHANNEL[ch].color : 'var(--muted)'}"></span>
											</span>
											<span class="w-11">{pct(c.won, c.decided, 0)}</span>
											<span class="w-10 text-xs text-faint">{c.won}/{c.decided}</span>
										</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</Table>
			<p class="text-xs text-muted">
				Quote = gebucht ÷ entschieden (Auftrag oder abgesprungen); offene KVAs zählen nicht mit. Grau: weniger als {THIN} KVAs —
				zu wenig für eine Aussage.
			</p>
		</div>
	</div>
{/if}
