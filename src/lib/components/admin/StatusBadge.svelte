<script lang="ts" module>
	import type { Tone } from '$lib/components/ui/tone';

	/**
	 * Every status any list can show → German label + semantic tone.
	 * Tone groups: accent = needs us, info = in the offer pipeline, ok = booked/done,
	 * warn = money outstanding or tentative, danger = lost, neutral = inert.
	 */
	export const STATUS_STYLE: Record<string, { tone: Tone; text: string }> = {
		draft: { tone: 'neutral', text: 'Entwurf' },
		open: { tone: 'accent', text: 'Offen' },
		new: { tone: 'accent', text: 'Neu' },
		pending: { tone: 'accent', text: 'Ausstehend' },
		info_requested: { tone: 'warn', text: 'Info angefragt' },
		expired: { tone: 'neutral', text: 'Abgelaufen' },
		estimating: { tone: 'info', text: 'Schätzung' },
		estimated: { tone: 'info', text: 'Volumen' },
		offer_ready: { tone: 'info', text: 'Angebot' },
		sent: { tone: 'info', text: 'Gesendet' },
		accepted: { tone: 'ok', text: 'Akzeptiert' },
		confirmed: { tone: 'ok', text: 'Bestätigt' },
		scheduled: { tone: 'ok', text: 'Geplant' },
		completed: { tone: 'ok', text: 'Erledigt' },
		invoiced: { tone: 'warn', text: 'Fakturiert' },
		rejected: { tone: 'danger', text: 'Abgelehnt' },
		cancelled: { tone: 'danger', text: 'Storniert' },
		offer_created: { tone: 'info', text: 'Angebot erstellt' },
		volume_estimated: { tone: 'info', text: 'Volumen' },
		offer_generated: { tone: 'info', text: 'Angebot' },
		offer_sent: { tone: 'info', text: 'Gesendet' },
		done: { tone: 'ok', text: 'Erledigt' },
		paid: { tone: 'ok', text: 'Bezahlt' },
		tentative: { tone: 'warn', text: 'Vorläufig' }
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { toneChip, toneFill } from '$lib/components/ui/tone';

	let { status, label, class: className }: { status: string; label?: string; class?: string } = $props();

	const config = $derived(STATUS_STYLE[status] ?? { tone: 'neutral' as Tone, text: status });
</script>

<span
	class={cn(
		'badge num inline-flex h-5 items-center gap-1.5 rounded-xs border px-1.5 text-[11px] leading-none whitespace-nowrap',
		toneChip[config.tone],
		className
	)}
	data-tone={config.tone}
>
	<span aria-hidden="true" class="size-1.5 rounded-full {toneFill[config.tone]}"></span>
	{label || config.text}
</span>
