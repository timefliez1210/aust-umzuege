/**
 * Data-driven configuration for the foto-angebot form.
 *
 * Adding a new service = adding one entry to SERVICES below.
 * No changes needed in +page.svelte.
 *
 * Design decisions
 * ----------------
 * 1. Each service owns its address layout (not the page component).
 *    `addressConfig` flags replace an if/else chain in the template.
 *
 * 2. `allowedModes` restricts which submission tabs are shown.
 *    e.g. Lagerung has no visual content to photograph → termin only.
 *
 * 3. Address labels adapt to service context — Auszugsadresse for Umzug,
 *    Räumungsadresse for Entrümpelung, etc. Same component, different copy.
 *
 * 4. `additionalServices` are per-service add-ons, replacing the global
 *    hardcoded list. Services like Wertankauf only appear for Haushaltsauflösung.
 *
 * 5. `showVolumeCalculator` gates the VolumeCalculator — it only makes sense
 *    for services where volume drives pricing.
 */

export type SubmissionMode = 'termin' | 'manuell' | 'foto' | 'video';

export interface AddressConfig {
	/** Auszugsadresse / Abholadresse / Einsatzort etc. */
	showOrigin: boolean;
	originLabel: string;
	originRequired: boolean;

	/** Einzugsadresse — only for moves */
	showDestination: boolean;
	destinationLabel: string;
	destinationRequired: boolean;

	/** Zwischenstopp — optional toggle for multi-stop moves */
	showIntermediate: boolean;

	/**
	 * Rechnungsadresse — for Haushaltsauflösung where the person
	 * paying may live elsewhere (executor of estate, family member).
	 */
	showBilling: boolean;
}

export interface AddonService {
	id: string;
	label: string;
}

/**
 * A simple numeric stepper shown on the details step for services
 * where the job scope is defined by quantities rather than volume.
 * Currently used by Umzugshelfer (helpers count + hours).
 * Add more entries to any service's `customFields` array as needed.
 */
export interface CustomField {
	id: string;
	label: string;
	unit: string;
	min: number;
	max: number;
	default: number;
	step: number;
}

/**
 * 'private'  — implicitly a private customer (Privatumzug, Seniorenumzug, Haushaltsauflösung).
 *              Toggle is hidden; customerType is set automatically.
 * 'business' — implicitly a business customer (Firmenumzug).
 *              Toggle is hidden; customerType is set automatically.
 * 'ask'      — ambiguous; show the private/business toggle (Umzugshelfer, Montage, Entrümpelung, Lagerung).
 */
export type CustomerTypeMode = 'private' | 'business' | 'ask';

export interface ServiceConfig {
	/** Matches the /leistungen/ URL slug — used as form value and for deep-link pre-selection. */
	id: string;
	label: string;
	/** Emoji placeholder — easy to swap for an <img> or Lucide icon later. */
	icon: string;
	/** One-line pitch shown under the card label in the selector grid. */
	description: string;
	customerType: CustomerTypeMode;
	addressConfig: AddressConfig;
	allowedModes: SubmissionMode[];
	showVolumeCalculator: boolean;
	additionalServices: AddonService[];
	/** Optional numeric steppers for scope inputs (helpers, hours, etc.) */
	customFields: CustomField[];
}

// ---------------------------------------------------------------------------
// Shared add-on list for all Umzug variants (reused by reference)
// ---------------------------------------------------------------------------

const UMZUG_ADDONS: AddonService[] = [
	{ id: 'Möbeldemontage', label: 'Möbeldemontage' },
	{ id: 'Möbelmontage',   label: 'Möbelmontage' },
	{ id: 'Einpackservice', label: 'Einpackservice' },
	{ id: 'Einlagerung',    label: 'Einlagerung' },
	{ id: 'Entsorgung',     label: 'Entsorgung Sperrmüll' },
];

// ---------------------------------------------------------------------------
// Service catalogue — order here = order in the selector grid
// ---------------------------------------------------------------------------

export const SERVICES: ServiceConfig[] = [
	{
		id: 'privatumzug',
		label: 'Privatumzug',
		icon: '🏠',
		description: 'Stressfreier Umzug — von der Packung bis zum Aufbau',
		customerType: 'private',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Auszugsadresse',
			originRequired:      true,
			showDestination:     true,
			destinationLabel:    'Einzugsadresse',
			destinationRequired: true,
			showIntermediate:    true,
			showBilling:         false,
		},
		allowedModes:         ['termin', 'manuell', 'foto', 'video'],
		showVolumeCalculator: true,
		additionalServices:   UMZUG_ADDONS,
		customFields:         [],
	},
	{
		id: 'firmenumzug',
		label: 'Firmenumzug',
		icon: '🏢',
		description: 'Büroumzug mit minimaler Ausfallzeit',
		customerType: 'business',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Aktueller Standort',
			originRequired:      true,
			showDestination:     true,
			destinationLabel:    'Neuer Standort',
			destinationRequired: true,
			showIntermediate:    true,
			showBilling:         false,
		},
		allowedModes:         ['termin', 'manuell', 'foto', 'video'],
		showVolumeCalculator: true,
		additionalServices:   UMZUG_ADDONS,
		customFields:         [],
	},
	{
		id: 'seniorenumzug',
		label: 'Seniorenumzug',
		icon: '🤝',
		description: 'Einfühlsamer Service mit Zeit & Geduld',
		customerType: 'private',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Auszugsadresse',
			originRequired:      true,
			showDestination:     true,
			destinationLabel:    'Einzugsadresse',
			destinationRequired: true,
			showIntermediate:    false,
			showBilling:         false,
		},
		allowedModes:         ['termin', 'manuell', 'foto', 'video'],
		showVolumeCalculator: true,
		additionalServices:   UMZUG_ADDONS,
		customFields:         [],
	},
	{
		id: 'umzugshelfer',
		label: 'Umzugshelfer',
		icon: '💪',
		description: 'Tatkräftige Unterstützung nach Ihrem Plan',
		customerType: 'ask',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Von',
			originRequired:      true,
			showDestination:     true,
			destinationLabel:    'Nach',
			destinationRequired: true,
			showIntermediate:    false,
			showBilling:         false,
		},
		allowedModes:         ['termin'],
		showVolumeCalculator: false,
		additionalServices:   [],
		customFields: [
			{ id: 'helpers', label: 'Anzahl Helfer',      unit: 'Personen', min: 1, max: 10, default: 2, step: 1 },
			{ id: 'hours',   label: 'Geschätzte Dauer',   unit: 'Stunden',  min: 1, max: 24, default: 4, step: 1 },
		],
	},
	{
		id: 'montage',
		label: 'Demontage & Montage',
		icon: '🔧',
		description: 'Möbel fachgerecht ab- und aufbauen',
		customerType: 'ask',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Einsatzadresse',
			originRequired:      true,
			showDestination:     false,
			destinationLabel:    '',
			destinationRequired: false,
			showIntermediate:    false,
			showBilling:         false,
		},
		// Foto mode useful (fitter can assess scope from photos)
		allowedModes:         ['termin', 'foto'],
		showVolumeCalculator: false,
		additionalServices:   [],
		customFields:         [],
	},
	{
		id: 'haushaltsaufloesung',
		label: 'Haushaltsauflösung',
		icon: '📦',
		description: 'Komplettauflösung mit Entsorgung & Wertankauf',
		customerType: 'private',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Auflösungsadresse',
			originRequired:      true,
			showDestination:     false,
			destinationLabel:    '',
			destinationRequired: false,
			showIntermediate:    false,
			// Billing address because the payer is often family/executor,
			// not the person at the pickup address.
			showBilling:         true,
		},
		allowedModes:         ['termin', 'foto'],
		showVolumeCalculator: false,
		additionalServices:   [
			{ id: 'Wertankauf', label: 'Wertankauf (Antiquitäten, Wertsachen)' },
			{ id: 'Entsorgung', label: 'Entsorgung Sperrmüll' },
		],
		customFields: [],
	},
	{
		id: 'entruempelung',
		label: 'Entrümpelung',
		icon: '🗑️',
		description: 'Keller, Dachboden oder Wohnung komplett räumen',
		customerType: 'ask',
		addressConfig: {
			showOrigin:          true,
			originLabel:         'Räumungsadresse',
			originRequired:      true,
			showDestination:     false,
			destinationLabel:    '',
			destinationRequired: false,
			showIntermediate:    false,
			showBilling:         false,
		},
		allowedModes:         ['termin', 'foto'],
		showVolumeCalculator: false,
		additionalServices:   [
			{ id: 'Wertankauf', label: 'Wertankauf (Antiquitäten, Wertsachen)' },
		],
		customFields: [],
	},
	{
		id: 'lagerung',
		label: 'Lagerung',
		icon: '🏭',
		description: 'Sichere Einlagerung Ihrer Möbel & Gegenstände',
		customerType: 'ask',
		addressConfig: {
			showOrigin:          false,
			originLabel:         '',
			originRequired:      false,
			showDestination:     false,
			destinationLabel:    '',
			destinationRequired: false,
			showIntermediate:    false,
			showBilling:         false,
		},
		// Contact form only — we discuss storage needs in person
		allowedModes:         ['termin'],
		showVolumeCalculator: false,
		additionalServices:   [],
		customFields:         [],
	},
];

/** Lookup by service ID — O(1), used by the page for URL param pre-selection. */
export const SERVICE_BY_ID = new Map(SERVICES.map(s => [s.id, s]));

/** Default service if none is pre-selected (most common inquiry type). */
export const DEFAULT_SERVICE_ID = 'privatumzug';
