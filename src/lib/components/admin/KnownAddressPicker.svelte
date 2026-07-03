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
	<select class="known-addr-picker" onchange={handleChange} aria-label={placeholder}>
		<option value="">{placeholder}</option>
		{#each addresses as a, i}
			<option value={i}>{a.label ? `${a.label} — ` : ''}{formatKnownAddress(a)}</option>
		{/each}
	</select>
{/if}

<style>
	.known-addr-picker {
		width: 100%;
		padding: 0.4rem 0.65rem;
		margin-bottom: 0.5rem;
		border-radius: var(--dt-radius-sm);
		border: 1.5px dashed var(--dt-outline-variant);
		background: var(--dt-surface-container);
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
		outline: none;
		cursor: pointer;
		box-sizing: border-box;
		transition: border-color var(--dt-transition), color var(--dt-transition);
	}
	.known-addr-picker:hover,
	.known-addr-picker:focus {
		border-color: var(--dt-primary);
		color: var(--dt-on-surface);
	}
</style>
