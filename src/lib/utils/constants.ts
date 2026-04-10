/**
 * Shared constants for the admin dashboard and public forms.
 *
 * Single source of truth for service type and customer type labels/badges.
 */

export const SERVICE_TYPE_LABELS: Record<string, string> = {
	privatumzug: 'Privatumzug',
	firmenumzug: 'Firmenumzug',
	seniorenumzug: 'Seniorenumzug',
	umzugshelfer: 'Umzugshelfer',
	montage: 'Montage',
	haushaltsaufloesung: 'Haushaltsauflösung',
	entruempelung: 'Entrümpelung',
	lagerung: 'Lagerung',
};

export const SERVICE_TYPE_COLORS: Record<string, string> = {
	privatumzug: '#3b82f6',
	firmenumzug: '#10b981',
	seniorenumzug: '#f59e0b',
	umzugshelfer: '#8b5cf6',
	montage: '#06b6d4',
	haushaltsaufloesung: '#6366f1',
	entruempelung: '#ef4444',
	lagerung: '#78716c',
};

export const CUSTOMER_TYPE_LABELS: Record<string, string> = {
	private: 'Privat',
	business: 'Gewerbe',
};

export const CUSTOMER_TYPE_COLORS: Record<string, string> = {
	private: '#3b82f6',
	business: '#10b981',
};