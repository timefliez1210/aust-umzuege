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

/**
 * Which address fields are required per service type.
 * Mirrors the AddressConfig from serviceConfig.ts but in a simpler form
 * for use in the admin CreateInquiryModal.
 *
 * `showDestination` = false for services that only need 1 address
 * (Haushaltsauflösung, Entrümpelung, Montage, Lagerung).
 */
export const SERVICE_ADDRESS_CONFIG: Record<string, { showOrigin: boolean; originLabel: string; showDestination: boolean; destinationLabel: string; showBilling: boolean }> = {
	privatumzug:          { showOrigin: true, originLabel: 'Auszugsadresse',  showDestination: true,  destinationLabel: 'Einzugsadresse',  showBilling: false },
	firmenumzug:          { showOrigin: true, originLabel: 'Aktueller Standort', showDestination: true,  destinationLabel: 'Neuer Standort',    showBilling: false },
	seniorenumzug:        { showOrigin: true, originLabel: 'Auszugsadresse',  showDestination: true,  destinationLabel: 'Einzugsadresse',  showBilling: false },
	umzugshelfer:         { showOrigin: true, originLabel: 'Von',             showDestination: true,  destinationLabel: 'Nach',             showBilling: false },
	montage:              { showOrigin: true, originLabel: 'Einsatzadresse',  showDestination: false, destinationLabel: '',                 showBilling: false },
	haushaltsaufloesung:  { showOrigin: true, originLabel: 'Auflösungsadresse', showDestination: false, destinationLabel: '',                 showBilling: true },
	entruempelung:        { showOrigin: true, originLabel: 'Räumungsadresse',  showDestination: false, destinationLabel: '',                 showBilling: false },
	lagerung:             { showOrigin: false, originLabel: '',             showDestination: false, destinationLabel: '',                 showBilling: false },
};