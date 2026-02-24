<script lang="ts">
	import { page } from '$app/stores';
	import {
		LayoutDashboard,
		FileText,
		Receipt,
		Users,
		Mail,
		CalendarDays,
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
		{ href: '/admin/quotes', label: 'Anfragen', icon: FileText },
		{ href: '/admin/orders', label: 'Auftraege', icon: ClipboardList },
		{ href: '/admin/offers', label: 'Angebote', icon: Receipt },
		{ href: '/admin/customers', label: 'Kunden', icon: Users },
		{ href: '/admin/emails', label: 'E-Mails', icon: Mail },
		{ href: '/admin/calendar', label: 'Kalender', icon: CalendarDays },
		{ href: '/admin/settings', label: 'Einstellungen', icon: Settings }
	];

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
		background: #1a1a2e;
		display: flex;
		flex-direction: column;
		transition: width 150ms ease;
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
		border-radius: 0.375rem;
		transition: color 150ms ease;
		display: flex;
		align-items: center;
	}

	.sidebar-toggle:hover {
		color: #ffffff;
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
		border-radius: 0.5rem;
		color: rgba(255, 255, 255, 0.5);
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 150ms ease;
		white-space: nowrap;
	}

	.sidebar.collapsed .sidebar-link {
		justify-content: center;
		padding: 0.625rem;
	}

	.sidebar-link:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.sidebar-link.active {
		background: rgba(99, 102, 241, 0.2);
		color: #a5b4fc;
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
