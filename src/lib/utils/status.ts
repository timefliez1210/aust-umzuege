/**
 * Maps inquiry status codes to German display labels.
 *
 * Used by: calendar/+page.svelte (status dropdown), StatusBadge.svelte,
 *          and any page that needs to display a human-readable status name.
 * Purpose: Single source of truth for German status translations so that all
 *          admin pages show consistent labels without duplicating the mapping.
 */
export const INQUIRY_STATUS_LABELS: Record<string, string> = {
	pending: 'Ausstehend',
	info_requested: 'Info angefragt',
	estimating: 'Wird geschätzt',
	estimated: 'Geschätzt',
	offer_ready: 'Angebot bereit',
	offer_sent: 'Angebot gesendet',
	accepted: 'Angenommen',
	rejected: 'Abgelehnt',
	expired: 'Abgelaufen',
	cancelled: 'Abgesagt',
	scheduled: 'Geplant',
	completed: 'Abgeschlossen',
	invoiced: 'Fakturiert',
	paid: 'Bezahlt',
};

/**
 * Returns the German display label for a given inquiry status code.
 *
 * Called by: any component that renders a status as human-readable text
 * Purpose: Provides a safe lookup with a fallback so unknown status codes are
 *          displayed as-is rather than silently swallowed.
 *
 * @param status - Raw status string from the API (e.g. "offer_sent")
 * @returns The matching German label, or the raw status value if not found
 */
export function formatStatus(status: string): string {
	return INQUIRY_STATUS_LABELS[status] ?? status;
}
