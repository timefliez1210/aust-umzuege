<script lang="ts">
	/**
	 * Trichter — how many leads reach each stage, for all channels or one. Each step
	 * shows the share of all Eingänge and how many were lost since the step before,
	 * so the biggest leak is obvious.
	 */
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import { CHANNEL, CHANNELS, STAGES, pct, type Channel, type ChannelStats } from './types';

	let { channels, total }: { channels: ChannelStats[]; total: ChannelStats } = $props();

	let selected = $state<Channel | 'alle'>('alle');
	let options = $derived([
		{ value: 'alle' as const, label: 'Alle Kanäle', count: total.leads },
		...CHANNELS.filter((c) => channels.some((s) => s.channel === c.key)).map((c) => ({
			value: c.key,
			label: c.short,
			count: channels.find((s) => s.channel === c.key)!.leads
		}))
	]);
	let stats = $derived(selected === 'alle' ? total : (channels.find((c) => c.channel === selected) ?? total));
	let color = $derived(selected === 'alle' ? 'var(--muted)' : CHANNEL[selected].color);

	/** The step that loses the largest share of the leads entering it. */
	let biggestLeak = $derived.by(() => {
		let worst = -1;
		let worstShare = 0;
		for (let i = 1; i < STAGES.length; i++) {
			const before = stats.reached[i - 1];
			if (!before) continue;
			const share = (before - stats.reached[i]) / before;
			if (share > worstShare) {
				worstShare = share;
				worst = i;
			}
		}
		return worst;
	});
</script>

<div class="flex flex-col gap-3">
	<FilterTabs label="Kanal" {options} bind:value={selected} />

	<ol class="flex flex-col gap-1.5" aria-label="Trichter {selected === 'alle' ? 'alle Kanäle' : CHANNEL[selected].label}">
		{#each STAGES as stage, i (stage)}
			{@const n = stats.reached[i]}
			{@const prev = i > 0 ? stats.reached[i - 1] : n}
			{@const lost = prev - n}
			<li
				class="grid grid-cols-[minmax(76px,120px)_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 rounded-sm px-1 py-1 {i === biggestLeak
					? 'bg-danger/5'
					: ''}"
				title="{stage}: {n} von {stats.leads} ({pct(n, stats.leads)})"
			>
				<span class="text-[13px] {i === 0 ? 'font-medium' : ''}">{stage}</span>
				<span class="relative h-6 rounded-xs bg-sunk">
					<span
						class="absolute inset-y-0 left-0 rounded-xs transition-[width]"
						style="width:{stats.leads ? (n / stats.leads) * 100 : 0}%; background:{color}"
					></span>
				</span>
				<span class="num flex items-baseline justify-end gap-1.5 text-right text-xs sm:w-40 sm:gap-2 sm:text-[13px]">
					<span class="font-medium">{n}</span>
					<span class="w-10 text-muted sm:w-14">{pct(n, stats.leads, 0)}</span>
					<span class="w-10 sm:w-14 {i === biggestLeak ? 'font-medium text-danger' : 'text-faint'}">
						{#if i > 0 && lost > 0}−{pct(lost, prev, 0)}{/if}
					</span>
				</span>
			</li>
		{/each}
	</ol>
	<p class="text-xs text-muted">
		Balken = Anteil aller Eingänge. Rechts: verloren seit dem Schritt davor.
		{#if biggestLeak > 0}
			Größter Verlust: <span class="font-medium text-fg">{STAGES[biggestLeak - 1]} → {STAGES[biggestLeak]}</span>.
		{/if}
		„Zusage“ zählt auch später stornierte Aufträge mit; die Abschlussquote nicht. Durchgeführt/Bezahlt hängen auch davon ab, ob der Termin schon war.
	</p>
</div>
