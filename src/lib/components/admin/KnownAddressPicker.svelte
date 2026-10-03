<script lang="ts">
	/**
	 * A dropdown for picking one of a customer's known addresses to pre-fill an
	 * address form. Presentational — the parent owns the fetch (via
	 * `fetchKnownAddresses`) and applies the chosen entry to its own fields.
	 *
	 * Renders nothing when the customer has no known addresses.
	 *
	 * Called by: CreateInquiryModal (inquiry overview), calendar quick-create form.
	 */
	import type { KnownAddress } from '$lib/utils/addressBook';
	import { formatKnownAddress } from '$lib/utils/addressBook';

	interface Props {
		/** The customer's known addresses (already fetched by the parent). */
		addresses: KnownAddress[];
		/** Called with the chosen entry when the user picks one. */
		onselect: (a: KnownAddress) => void;
		/** Optional label for the placeholder option. */
		placeholder?: string;
	}

	let { addresses, onselect, placeholder = 'Bekannte Adresse übernehmen…' }: Props = $props();

	function handleChange(e: Event) {
		const el = e.target as HTMLSelectElement;
		const idx = el.value;
		el.value = ''; // reset so re-picking the same entry fires again
		if (idx === '') return;
		const a = addresses[Number(idx)];
		if (a) onselect(a);
	}
</script>

{#if addresses.length > 0}
	<select
		class="h-9 w-full cursor-pointer rounded-sm border border-dashed border-line-strong bg-sunk px-3 text-[13px] text-muted outline-none hover:border-fg hover:text-fg focus:border-fg"
		onchange={handleChange}
		aria-label={placeholder}
	>
		<option value="">{placeholder}</option>
		{#each addresses as a, i (i)}
			<option value={i}>{a.label ? `${a.label} — ` : ''}{formatKnownAddress(a)}</option>
		{/each}
	</select>
{/if}
