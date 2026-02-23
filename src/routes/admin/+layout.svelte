<script lang="ts">
	import { auth } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { LogOut, User } from 'lucide-svelte';
	import Sidebar from '$lib/components/admin/Sidebar.svelte';
	import Toast from '$lib/components/admin/Toast.svelte';

	let { children } = $props();
	let sidebarCollapsed = $state(false);

	$effect(() => {
		if (!auth.isAuthenticated && !$page.url.pathname.startsWith('/admin/login')) {
			goto('/admin/login');
		}
	});

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
		<Sidebar collapsed={sidebarCollapsed} onToggle={() => (sidebarCollapsed = !sidebarCollapsed)} />

		<div class="admin-main">
			<header class="admin-topbar">
				<div class="topbar-left"></div>
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
	:global(body) {
		background: #e8ecf1;
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

	@media (max-width: 767px) {
		.admin-main {
			margin-left: 64px;
		}

		.admin-content {
			padding: 1rem;
		}
	}
</style>
