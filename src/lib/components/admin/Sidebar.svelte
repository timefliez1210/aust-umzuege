<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		FileText,
		Users,
		UserCheck,
		Mail,
		CalendarDays,
		CalendarCheck,
		Settings,
		PanelLeftClose,
		PanelLeft,
		ClipboardList,
		Flag,
		BookOpen,
		BookMarked,
		PhoneCall,
		Truck,
		Warehouse
	} from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { apiGet } from '$lib/utils/api.svelte';
	import { onDestroy } from 'svelte';

	let {
		collapsed,
		onToggle,
		mobileOpen = false,
		onMobileClose = () => {}
	}: {
		collapsed: boolean;
		onToggle: () => void;
		mobileOpen?: boolean;
		onMobileClose?: () => void;
	} = $props();

	interface NavBadgeCounts {
		flash_contacts: number;
		unread_emails: number;
		new_inquiries: number;
		kva_followups: number;
	}

	/** Counts shown as badges next to the navigation links. */
	let badges = $state<NavBadgeCounts>({
		flash_contacts: 0,
		unread_emails: 0,
		new_inquiries: 0,
		kva_followups: 0
	});

	/**
	 * Polls the navigation badge counts.
	 *
	 * Called by: $effect (mount) and its own interval.
	 * Purpose: Nothing outside the respective page said that a Rückruf, a mail or a
	 *          new inquiry had arrived — Alex had to open each tab to find out
	 *          (feedback report dc7515c2). A minute is deliberately slack: these are
	 *          ambient hints, and Telegram is what actually chases anything urgent.
	 *          Failures are swallowed so a blip cannot break the navigation.
	 */
	async function loadBadges() {
		try {
			badges = await apiGet<NavBadgeCounts>('/api/v1/admin/nav-badges');
		} catch {
			// Ambient badges — a failed poll should leave the last known counts alone.
		}
	}

	$effect(() => {
		loadBadges();
	});

	const badgePoll = setInterval(loadBadges, 60_000);
	onDestroy(() => clearInterval(badgePoll));

	/** Which badge count, if any, rides on each link — key into `badges`. */
	const links: {
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
		badge?: keyof NavBadgeCounts;
		badgeLabel?: (n: number) => string;
	}[] = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{
			href: '/admin/inquiries',
			label: 'Anfragen',
			icon: FileText,
			badge: 'new_inquiries',
			badgeLabel: (n) => `${n} neue Anfragen`
		},
		{ href: '/admin/orders', label: 'Auftraege', icon: ClipboardList },
		{ href: '/admin/employees', label: 'Mitarbeiter', icon: UserCheck },
		{ href: '/admin/customers', label: 'Kunden', icon: Users },
		{
			href: '/admin/emails',
			label: 'E-Mails',
			icon: Mail,
			badge: 'unread_emails',
			badgeLabel: (n) => `${n} ungelesene E-Mails`
		},
		{ href: '/admin/calendar', label: 'Kalender', icon: CalendarDays },
		{ href: '/admin/calendar-items', label: 'Termine', icon: CalendarCheck },
		{ href: '/admin/rechnungsausgangsbuch', label: 'Rechnungsausgangsbuch', icon: BookOpen },
		{
			href: '/admin/kva-buch',
			label: 'KVA-Buch',
			icon: BookMarked,
			badge: 'kva_followups',
			badgeLabel: (n) => `${n} KVA zum Nachfassen`
		},
		{ href: '/admin/storage', label: 'Lagerung', icon: Warehouse },
		{
			href: '/admin/flash-contacts',
			label: 'Rückrufe',
			icon: PhoneCall,
			badge: 'flash_contacts',
			badgeLabel: (n) => `${n} offene Rückrufe`
		},
		{ href: '/admin/vehicles', label: 'Fuhrpark', icon: Truck },
		{ href: '/admin/settings', label: 'Einstellungen', icon: Settings }
	];

	/**
	 * Determines whether a navigation link should be marked as active.
	 *
	 * Called by: Template (inside {#each} via {@const active = isActive(...)})
	 * Purpose: Provides exact-match logic for the dashboard root and prefix-match
	 *          logic for all other routes so that nested pages keep their parent
	 *          link highlighted.
	 *
	 * @param href - The href of the navigation link being evaluated
	 * @param pathname - The current page URL pathname from the $page store
	 * @returns True if the link should receive the active style, false otherwise
	 */
	function isActive(href: string, pathname: string): boolean {
		if (href === '/admin') return pathname === '/admin';
		return pathname.startsWith(href);
	}
</script>

<aside class="sidebar" class:collapsed class:mobile-open={mobileOpen}>
	<div class="sidebar-header">
		{#if !collapsed}
			<span class="sidebar-brand">AUST</span>
		{/if}
		<button class="sidebar-toggle" onclick={onToggle} aria-label="Sidebar umschalten">
			{#if collapsed}
				<PanelLeft size={20} />
			{:else}
				<PanelLeftClose size={20} />
			{/if}
		</button>
	</div>

	<nav class="sidebar-nav">
		{#each links as link}
			{@const active = isActive(link.href, $page.url.pathname)}
			{@const count = link.badge ? badges[link.badge] : 0}
			<a href={link.href} class="sidebar-link" class:active aria-current={active ? 'page' : undefined}>
				<link.icon size={20} />
				{#if !collapsed}
					<span>{link.label}</span>
				{/if}
				{#if count > 0}
					<span
						class="nav-badge"
						class:collapsed
						class:urgent={link.badge === 'flash_contacts'}
						aria-label={link.badgeLabel?.(count)}
					>{count > 99 ? '99+' : count}</span>
				{/if}
			</a>
		{/each}
		{#if auth.user?.role === 'admin'}
			{@const active = isActive('/admin/reports', $page.url.pathname)}
			<a href="/admin/reports" class="sidebar-link" class:active aria-current={active ? 'page' : undefined}>
				<Flag size={20} />
				{#if !collapsed}
					<span>Reports</span>
				{/if}
			</a>
		{/if}
	</nav>
</aside>

<style>
	.nav-badge {
		margin-left: auto;
		min-width: 1.25rem;
		padding: 0 0.35rem;
		border-radius: 999px;
		background: var(--dt-primary, #1b6ca8);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 600;
		line-height: 1.25rem;
		text-align: center;
	}

	/* A waiting customer outranks unread mail, so the Rückruf count is the one
	   colour that reads as "call now" rather than "look when you get to it". */
	.nav-badge.urgent {
		background: var(--dt-error, #b3261e);
	}

	/* Collapsed rail: the label is gone, so the count rides on the icon instead. */
	.nav-badge.collapsed {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		margin-left: 0;
	}

	.sidebar {
		width: 240px;
		min-height: 100vh;
		background: var(--dt-sidebar-bg, rgba(2, 36, 72, 0.88));
		backdrop-filter: var(--dt-sidebar-blur, blur(24px));
		-webkit-backdrop-filter: var(--dt-sidebar-blur, blur(24px));
		border-right: var(--dt-glass-border, 1px solid rgba(255, 255, 255, 0.08));
		display: flex;
		flex-direction: column;
		transition: width var(--dt-transition, 150ms ease-out);
		position: fixed;
		top: 0;
		left: 0;
		z-index: 200;
	}

	.sidebar.collapsed {
		width: 64px;
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		height: 56px;
	}

	.sidebar.collapsed .sidebar-header {
		justify-content: center;
	}

	.sidebar-brand {
		font-weight: 800;
		font-size: 1.25rem;
		color: #ffffff;
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	.sidebar-toggle {
		color: rgba(255, 255, 255, 0.5);
		padding: 0.25rem;
		border-radius: var(--dt-radius-sm, 8px);
		transition: color var(--dt-transition, 150ms ease-out);
		display: flex;
		align-items: center;
	}

	.sidebar-toggle:hover {
		color: var(--dt-on-primary, #ffffff);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
	}

	.sidebar-link {
		display: flex;
		/* Anchors .nav-badge.collapsed, which sits on the icon when the rail is narrow. */
		position: relative;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
		border-radius: var(--dt-radius-md, 12px);
		color: rgba(255, 255, 255, 0.6);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all var(--dt-transition, 150ms ease-out);
		white-space: nowrap;
	}

	.sidebar.collapsed .sidebar-link {
		justify-content: center;
		padding: 0.625rem;
	}

	.sidebar-link:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--dt-on-primary, #ffffff);
	}

	.sidebar-link.active {
		background: var(--dt-primary-container, #1e3a5f);
		color: var(--dt-on-primary, #ffffff);
	}

	@media (max-width: 768px) {
		.sidebar {
			width: 240px;
			position: fixed;
			top: 0;
			left: 0;
			height: 100vh;
			z-index: 1001;
			transform: translateX(-100%);
			transition: transform 250ms ease;
		}

		.sidebar.mobile-open {
			transform: translateX(0);
		}

		/* Always show brand and labels in mobile drawer */
		.sidebar-brand,
		.sidebar-link span {
			display: inline;
		}

		.sidebar-link {
			justify-content: flex-start;
			padding: 0.625rem 0.75rem;
			min-height: 44px;
		}

		.sidebar-header {
			justify-content: space-between;
		}

		/* Hide collapse toggle on mobile - drawer is always full width when open */
		.sidebar-toggle {
			display: none;
		}
	}
</style>
