export function formatEuro(cents: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR'
	}).format(cents / 100);
}

export function formatDate(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	}).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string): string {
	return new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}).format(new Date(dateStr));
}
