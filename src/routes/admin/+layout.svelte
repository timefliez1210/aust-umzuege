<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { LogOut, User } from 'lucide-svelte';
	import Sidebar from '$lib/components/admin/Sidebar.svelte';
	import Toast from '$lib/components/admin/Toast.svelte';

	let { children } = $props();
	let sidebarCollapsed = $state(false);
	let mobileOpen = $state(false);

	/**
	 * Closes the mobile sidebar drawer after every client-side navigation.
	 *
	 * Called by: afterNavigate lifecycle hook (SvelteKit, fires after each route change)
	 * Purpose: Ensures the mobile overlay does not remain visible when the user taps a
	 *          sidebar link and the route changes, keeping the UI clean on small screens.
	 *
	 * @returns void
	 */
	afterNavigate(() => {
		mobileOpen = false;
	});

	$effect(() => {
		if (!auth.isAuthenticated && !$page.url.pathname.startsWith('/admin/login')) {
			goto('/admin/login');
		}
	});

	/**
	 * Logs the current user out and redirects to the login page.
	 *
	 * Called by: Template (topbar "Abmelden" button click)
	 * Purpose: Clears the JWT tokens from the auth store / localStorage via auth.logout(),
	 *          then navigates away from all protected admin routes to prevent unauthorised access.
	 *
	 * @returns void
	 */
	function handleLogout() {
		auth.logout();
		goto('/admin/login');
	}
</script>

<svelte:head>
	<title>AUST Admin</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if $page.url.pathname.startsWith('/admin/login')}
	{@render children()}
{:else if auth.isAuthenticated}
	<div class="admin-shell" class:sidebar-collapsed={sidebarCollapsed}>
		<Sidebar
			collapsed={sidebarCollapsed}
			onToggle={() => (sidebarCollapsed = !sidebarCollapsed)}
			{mobileOpen}
			onMobileClose={() => (mobileOpen = false)}
		/>

		{#if mobileOpen}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="mobile-backdrop" onclick={() => (mobileOpen = false)} onkeydown={() => {}}></div>
		{/if}

		<div class="admin-main">
			<header class="admin-topbar">
				<div class="topbar-left">
					<button
						class="hamburger-btn"
						onclick={() => (mobileOpen = !mobileOpen)}
						aria-label="Menü öffnen"
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</div>
				<div class="topbar-right">
					<div class="topbar-user">
						<User size={16} />
						<span>{auth.user?.name || 'Admin'}</span>
					</div>
					<button class="topbar-logout" onclick={handleLogout}>
						<LogOut size={16} />
						<span>Abmelden</span>
					</button>
				</div>
			</header>

			<main class="admin-content">
				{@render children()}
			</main>
		</div>
	</div>
{/if}

<Toast />

<style>
	@import '../../styles/admin.css';

	:global(body) {
		background: var(--admin-bg, #e8ecf1);
	}

	.admin-shell {
		display: flex;
		min-height: 100vh;
		background: #e8ecf1;
		color: #1a1a2e;
	}

	.admin-main {
		flex: 1;
		margin-left: 240px;
		transition: margin-left 150ms ease;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.sidebar-collapsed .admin-main {
		margin-left: 64px;
	}

	.admin-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		padding: 0 1.5rem;
		background: #ffffff;
		border-bottom: 1px solid #e2e8f0;
		position: sticky;
		top: 0;
		z-index: 100;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.topbar-left {
		display: flex;
		align-items: center;
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.topbar-user {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #64748b;
		font-size: 0.875rem;
	}

	.topbar-logout {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		color: #94a3b8;
		font-size: 0.8125rem;
		padding: 0.375rem 0.625rem;
		border-radius: 0.5rem;
		transition: all 150ms ease;
	}

	.topbar-logout:hover {
		color: #ef4444;
		background: #fee2e2;
	}

	.admin-content {
		flex: 1;
		padding: 1.5rem;
	}

	/* Hamburger button - hidden on desktop */
	.hamburger-btn {
		display: none;
		align-items: center;
		justify-content: center;
		color: #64748b;
		padding: 0.375rem;
		border-radius: 0.375rem;
		transition: color 150ms ease, background 150ms ease;
	}

	.hamburger-btn:hover {
		color: #1a1a2e;
		background: #f1f5f9;
	}

	/* Mobile backdrop overlay */
	.mobile-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 999;
	}

	@media (max-width: 768px) {
		.admin-main {
			margin-left: 0;
			overflow-x: hidden;
		}

		.sidebar-collapsed .admin-main {
			margin-left: 0;
		}

		.admin-content {
			padding: 0.75rem;
		}

		.hamburger-btn {
			display: flex;
			min-height: 44px;
			min-width: 44px;
		}

		.topbar-logout {
			min-height: 44px;
		}

		.topbar-logout span {
			display: none;
		}

		.topbar-user span {
			display: none;
		}
	}
</style>
