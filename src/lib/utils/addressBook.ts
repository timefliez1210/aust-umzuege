/**
 * Customer address book — shared types and helpers.
 *
 * The address book is a per-customer catalogue of known addresses (harvested
 * from past inquiries, correspondence, or added manually). It powers the
 * "select a known address" picker in the inquiry-create flows (inquiry overview
 * and calendar) and the address list on the customer detail page.
 *
 * Backend: GET /api/v1/admin/customers/{id}/addresses
 */

import { apiGet } from './api.svelte';

/** One entry in a customer's address book, mirroring the backend `CustomerAddressItem`. */
export interface KnownAddress {
	id: string;
	street: string;
	house_number: string | null;
	postal_code: string | null;
	city: string;
	country: string;
	floor: string | null;
	elevator: boolean | null;
	parking_ban: boolean;
	label: string | null;
	source: string;
	last_used_at: string;
}

/**
 * Fetches a customer's known addresses, most-recently-used first.
 *
 * Swallows errors (returns `[]`) because the picker is a convenience — a failed
 * lookup should never block manual address entry.
 *
 * @param customerId - The customer whose address book to load.
 * @returns The address book entries, or an empty array on error.
 */
export async function fetchKnownAddresses(customerId: string): Promise<KnownAddress[]> {
	try {
		return await apiGet<KnownAddress[]>(`/api/v1/admin/customers/${customerId}/addresses`);
	} catch {
		return [];
	}
}

/** Street + house number as a single line, e.g. "Musterstraße 1". */
export function knownAddressStreetLine(a: KnownAddress): string {
	return [a.street, a.house_number].filter(Boolean).join(' ');
}

/** One-line human label for a dropdown option, e.g. "Musterstraße 1, 30159 Hannover". */
export function formatKnownAddress(a: KnownAddress): string {
	const cityLine = [a.postal_code, a.city].filter(Boolean).join(' ');
	return [knownAddressStreetLine(a), cityLine].filter(Boolean).join(', ');
}
