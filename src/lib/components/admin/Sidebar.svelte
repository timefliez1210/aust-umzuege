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
		ClipboardList
	} from 'lucide-svelte';

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

	const links = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/inquiries', label: 'Anfragen', icon: FileText },
		{ href: '/admin/orders', label: 'Auftraege', icon: ClipboardList },
		{ href: '/admin/employees', label: 'Mitarbeiter', icon: UserCheck },
		{ href: '/admin/customers', label: 'Kunden', icon: Users },
		{ href: '/admin/emails', label: 'E-Mails', icon: Mail },
		{ href: '/admin/calendar', label: 'Kalender', icon: CalendarDays },
		{ href: '/admin/calendar-items', label: 'Termine', icon: CalendarCheck },
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
			<a href={link.href} class="sidebar-link" class:active aria-current={active ? 'page' : undefined}>
				<link.icon size={20} />
				{#if !collapsed}
					<span>{link.label}</span>
				{/if}
			</a>
		{/each}
	</nav>
</aside>

<style>
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
