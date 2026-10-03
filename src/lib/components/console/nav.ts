import type { Component } from 'svelte';
import {
	House,
	Inbox,
	PhoneCall,
	Mail,
	ClipboardList,
	CalendarDays,
	CalendarCheck,
	Warehouse,
	BookMarked,
	BookOpen,
	TrendingUp,
	Users,
	UserCheck,
	Truck,
	Flag,
	Settings,
	LayoutGrid
} from 'lucide-svelte';

/** Keys of `GET /admin/nav-badges`. */
export type BadgeKey = 'flash_contacts' | 'unread_emails' | 'new_inquiries' | 'kva_followups';

export interface NavItem {
	href: string;
	label: string;
	/** One line for the mobile "Mehr" list and the command palette. */
	hint: string;
	// lucide-svelte ships legacy class components; Component<any> fits both.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: Component<any> | any;
	badge?: BadgeKey;
	/** Counter in the tenant colour — someone is waiting. */
	hot?: boolean;
	badgeLabel?: (n: number) => string;
	adminOnly?: boolean;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

/** The whole console, in sidebar order. Single source for sidebar, tab bar, "Mehr" and ⌘K. */
export const NAV: NavGroup[] = [
	{
		label: 'Betrieb',
		items: [
			{ href: '/admin', label: 'Heute', hint: 'Was heute ansteht', icon: House },
			{
				href: '/admin/inquiries',
				label: 'Anfragen',
				hint: 'Neue Anfragen bis Angebot',
				icon: Inbox,
				badge: 'new_inquiries',
				hot: true,
				badgeLabel: (n) => `${n} neue Anfragen`
			},
			{
				href: '/admin/flash-contacts',
				label: 'Rückrufe',
				hint: 'Schnellkontakt-Formular',
				icon: PhoneCall,
				badge: 'flash_contacts',
				hot: true,
				badgeLabel: (n) => `${n} offene Rückrufe`
			},
			{
				href: '/admin/emails',
				label: 'E-Mails',
				hint: 'Posteingang & Antworten',
				icon: Mail,
				badge: 'unread_emails',
				hot: true,
				badgeLabel: (n) => `${n} ungelesene E-Mails`
			},
			{ href: '/admin/orders', label: 'Aufträge', hint: 'Angenommen bis bezahlt', icon: ClipboardList },
			{ href: '/admin/calendar', label: 'Kalender', hint: 'Umzüge & Auslastung', icon: CalendarDays },
			{
				href: '/admin/calendar-items',
				label: 'Termine',
				hint: 'Besichtigung, Halteverbot, Zusatztermine',
				icon: CalendarCheck
			},
			{ href: '/admin/storage', label: 'Lagerung', hint: 'Eingelagerte Kunden & Lagerplätze', icon: Warehouse }
		]
	},
	{
		label: 'Geld',
		items: [
			{
				href: '/admin/kva-buch',
				label: 'KVA-Buch',
				hint: 'Kostenvoranschläge & Nachfassen',
				icon: BookMarked,
				badge: 'kva_followups',
				badgeLabel: (n) => `${n} KVA zum Nachfassen`
			},
			{
				href: '/admin/rechnungsausgangsbuch',
				label: 'Rechnungsbuch',
				hint: 'Rechnungsausgangsbuch',
				icon: BookOpen
			},
			{ href: '/admin/gewinn', label: 'Gewinn', hint: 'Rohertrag, Ausgaben, Löhne', icon: TrendingUp, adminOnly: true }
		]
	},
	{
		label: 'Stammdaten',
		items: [
			{ href: '/admin/customers', label: 'Kunden', hint: 'Kontakte & Adressbuch', icon: Users },
			{ href: '/admin/employees', label: 'Mitarbeiter', hint: 'Stunden & Einsätze', icon: UserCheck },
			{ href: '/admin/vehicles', label: 'Fuhrpark', hint: 'Fahrzeuge & Verfügbarkeit', icon: Truck }
		]
	},
	{
		label: 'System',
		items: [
			{ href: '/admin/reports', label: 'Feedback', hint: 'Gemeldete Fehler & Wünsche', icon: Flag, adminOnly: true },
			{ href: '/admin/settings', label: 'Einstellungen', hint: 'Firma, Preise, Benutzer', icon: Settings }
		]
	}
];

/** Navigation as the given role sees it. */
export function navFor(role: string | undefined): NavGroup[] {
	return NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || role === 'admin') })).filter(
		(g) => g.items.length > 0
	);
}

/** Exact match for the home page, prefix match for every section. */
export function isActive(href: string, pathname: string): boolean {
	if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
	return pathname === href || pathname.startsWith(href + '/');
}

/** Phone bottom bar. Everything else lives behind "Mehr". */
export const TAB_HREFS = ['/admin', '/admin/inquiries', '/admin/calendar', '/admin/rechnungsausgangsbuch'];

export const MORE_ICON = LayoutGrid;

/** Short tab labels where the sidebar label is too long for a 78px tab. */
export const TAB_LABEL: Record<string, string> = { '/admin/rechnungsausgangsbuch': 'Rechnungen' };

/** The section the current path belongs to, for the mobile header. */
export function currentItem(pathname: string): NavItem | undefined {
	return NAV.flatMap((g) => g.items).find((i) => isActive(i.href, pathname));
}
