<script lang="ts" module>
	/**
	 * Dial string for a `tel:` link: "0151 123 45-67" → "tel:01511234567",
	 * "+49 (5121) 1234" → "tel:+4951211234". Keeps a leading "+" and the digits;
	 * spaces, slashes, dashes and brackets are display formatting some dialers choke on.
	 */
	export function telHref(phone: string): string {
		const trimmed = phone.trim();
		const digits = trimmed.replace(/[^\d]/g, '');
		return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
	}
</script>

<script lang="ts">
	import { Phone } from 'lucide-svelte';
	import { cn } from '$lib/utils/cn';

	/**
	 * Tap-to-call link for a customer's phone number.
	 *
	 * Used in: calendar (week/day/agenda cards + side panel), Termine, the employee
	 * Einsätze table — anywhere a job is shown, so the primary contact is one tap away.
	 * Stops click propagation: it usually sits inside a clickable card/row that would
	 * otherwise open the detail panel instead of dialling.
	 */
	let {
		phone,
		icon = true,
		class: className
	}: { phone: string | null | undefined; icon?: boolean; class?: string } = $props();
</script>

{#if phone?.trim()}
	<a
		href={telHref(phone)}
		class={cn('num inline-flex max-w-full items-center gap-1 underline-offset-2 hover:underline', className)}
		title="Anrufen: {phone}"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		draggable="false"
	>
		{#if icon}<Phone size={11} class="shrink-0" />{/if}<span class="truncate">{phone.trim()}</span>
	</a>
{/if}
