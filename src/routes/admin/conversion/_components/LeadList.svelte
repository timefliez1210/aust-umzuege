<script lang="ts">
	/**
	 * Alle Kontakte — every lead of the period with how far it got and why it ended,
	 * filterable by channel and result. Rows with an inquiry link to it.
	 */
	import { formatDate, formatEuro } from '$lib/utils/api.svelte';
	import Table from '$lib/components/ui/Table.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Tone } from '$lib/components/ui/tone';
	import { CHANNEL, CHANNELS, OUTCOME_LABEL, REASON_LABEL, STAGES, type Channel, type Lead, type Outcome } from './types';

	let { leads }: { leads: Lead[] } = $props();

	const PAGE = 50;
	let channel = $state<Channel | ''>('');
	let outcome = $state<Outcome | ''>('');
	let shown = $state(PAGE);

	let filtered = $derived(leads.filter((l) => (!channel || l.channel === channel) && (!outcome || l.outcome === outcome)));

	const OUTCOME_TONE: Record<Outcome, Tone> = { won: 'ok', lost: 'danger', open: 'info', duplicate: 'neutral' };

	$effect(() => {
		void channel;
		void outcome;
		shown = PAGE;
	});
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<Select aria-label="Kanal" class="w-auto" bind:value={channel}>
			<option value="">Alle Kanäle</option>
			{#each CHANNELS as c (c.key)}<option value={c.key}>{c.label}</option>{/each}
		</Select>
		<Select aria-label="Ergebnis" class="w-auto" bind:value={outcome}>
			<option value="">Alle Ergebnisse</option>
			<option value="won">Auftrag</option>
			<option value="lost">Abgesprungen</option>
			<option value="open">Offen</option>
			<option value="duplicate">Doppelt (nicht gezählt)</option>
		</Select>
		<span class="num text-xs text-muted">{filtered.length} Kontakte</span>
	</div>

	<Table minWidth="820px">
		<thead>
			<tr>
				<th>Datum</th>
				<th>Name</th>
				<th>Kanal</th>
				<th>Erreicht</th>
				<th>Ergebnis</th>
				<th class="text-right">KVA netto</th>
			</tr>
		</thead>
		<tbody>
			{#each filtered.slice(0, shown) as l (l.id)}
				{@const meta = CHANNEL[l.channel]}
				<tr class={l.outcome === 'duplicate' ? 'text-muted' : ''}>
					<td class="num whitespace-nowrap">{formatDate(l.at)}</td>
					<td class="max-w-56 truncate">
						{#if l.inquiry_id}
							<a class="hover:underline" href="/admin/inquiries/{l.inquiry_id}">{l.name ?? 'Ohne Namen'}</a>
						{:else}
							{l.name ?? 'Ohne Namen'}
						{/if}
					</td>
					<td class="whitespace-nowrap">
						<span class="flex items-center gap-1.5"><span class="size-2 rounded-xs {meta.dot}" aria-hidden="true"></span>{meta.short}</span>
					</td>
					<td class="whitespace-nowrap text-muted">{STAGES[l.stage]}</td>
					<td class="whitespace-nowrap">
						<span class="flex items-center gap-2">
							<Badge tone={OUTCOME_TONE[l.outcome]}>{OUTCOME_LABEL[l.outcome]}</Badge>
							{#if l.reason}<span class="text-xs text-muted">{REASON_LABEL[l.reason]}</span>{/if}
						</span>
					</td>
					<td class="num text-right">{l.value_cents === null ? '—' : formatEuro(l.value_cents)}</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="py-6 text-center text-muted">Keine Kontakte für diesen Filter.</td></tr>
			{/each}
		</tbody>
	</Table>
	{#if filtered.length > shown}
		<Button variant="outline" size="sm" class="self-center" onclick={() => (shown += PAGE)}>
			{Math.min(PAGE, filtered.length - shown)} weitere anzeigen
		</Button>
	{/if}
</div>
