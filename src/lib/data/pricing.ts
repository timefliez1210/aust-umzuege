// Single source of truth for crew + LKW package pricing.
// These prices are valid for Privatumzug, Firmenumzug, Umzugshelfer,
// Entrümpelung und Haushaltsauflösung — abweichende Aufwände wie
// Entsorgungskosten, lange Anfahrten oder Sondervolumen werden als
// seitenspezifische Disclaimer ausgewiesen (siehe PriceCards.svelte).

export interface PriceTier {
    hours: number;
    price: number; // EUR, inkl. MwSt.
}

export interface CrewPackage {
    id: string;
    helpers: number;
    lkw: number;
    label: string; // z.B. "LKW 3,5 Tonnen"
    tiers: PriceTier[];
    extraHour: number; // EUR pro zusätzlicher Stunde
}

export const crewPackages: CrewPackage[] = [
    {
        id: "2h-1l",
        helpers: 2,
        lkw: 1,
        label: "LKW 3,5 Tonnen",
        tiers: [
            { hours: 4, price: 400 },
            { hours: 5, price: 500 },
            { hours: 6, price: 600 },
            { hours: 7, price: 700 },
            { hours: 8, price: 800 },
        ],
        extraHour: 110,
    },
    {
        id: "3h-1l",
        helpers: 3,
        lkw: 1,
        label: "LKW 3,5 Tonnen",
        tiers: [
            { hours: 4, price: 580 },
            { hours: 5, price: 725 },
            { hours: 6, price: 870 },
            { hours: 7, price: 1015 },
            { hours: 8, price: 1160 },
        ],
        extraHour: 160,
    },
    {
        id: "3h-2l",
        helpers: 3,
        lkw: 2,
        label: "LKW 3,5 Tonnen",
        tiers: [
            { hours: 6, price: 930 },
            { hours: 7, price: 1085 },
            { hours: 8, price: 1240 },
        ],
        extraHour: 170,
    },
    {
        id: "4h-2l",
        helpers: 4,
        lkw: 2,
        label: "LKW 3,5 Tonnen",
        tiers: [
            { hours: 6, price: 1200 },
            { hours: 7, price: 1400 },
            { hours: 8, price: 1600 },
        ],
        extraHour: 220,
    },
];

// Standard-Disclaimer, die auf jeder Seite gelten
export const baseDisclaimers = [
    "Alle Preise inkl. 19 % MwSt.",
    "Anfahrt und Rückfahrt zählen zur Arbeitszeit (Beginn ab Standort Hildesheim).",
    "Bei Anfahrten über 30 km außerhalb Hildesheims berechnen wir 1,20 € pro km.",
];

// Seitenspezifische Zusatz-Disclaimer
export const disclaimersByService = {
    umzugshelfer: [
        ...baseDisclaimers,
        "Wenn Sie nur Helfer ohne LKW buchen möchten, gelten unsere Stundensätze pro Person (siehe Tabelle unten).",
    ],
    privatumzug: [
        ...baseDisclaimers,
        "Verpackungsmaterial (Umzugskartons, Folie, Decken) und Halteverbotszonen werden separat ausgewiesen.",
        "Klaviere, Tresore und Sonderladungen auf Anfrage.",
    ],
    firmenumzug: [
        ...baseDisclaimers,
        "Größere Volumen, IT-/Servertransporte und Wochenend-/Nachteinsätze auf Anfrage.",
        "Verpackungsmaterial wird nach Aufwand abgerechnet.",
    ],
    entruempelung: [
        ...baseDisclaimers,
        "Zzgl. Entsorgungs- und Containerkosten nach tatsächlichem Aufwand (Wertstoffhof, Sondermüll).",
        "Verwertbare Gegenstände rechnen wir transparent gegen den Endpreis an.",
    ],
    haushaltsaufloesung: [
        ...baseDisclaimers,
        "Zzgl. Entsorgungs- und Containerkosten nach tatsächlichem Aufwand.",
        "Verkaufsfähige Möbel und Wertgegenstände werden transparent gegengerechnet.",
        "Besenreine Übergabe inklusive.",
    ],
} as const;

export type ServiceKey = keyof typeof disclaimersByService;
