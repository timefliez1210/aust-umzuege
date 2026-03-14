<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { worker } from '$lib/stores/worker.svelte';
	import { CalendarDays, Clock, LogOut, User } from 'lucide-svelte';

	let { children } = $props();

	const isLogin = $derived($page.url.pathname === '/worker/login');

	$effect(() => {
		if (!isLogin && !worker.isAuthenticated) {
			goto('/worker/login');
		}
	});

	/**
	 * Logs the worker out and redirects to the login page.
	 *
	 * Called by: Template (logout button in bottom nav).
	 * Purpose: Clears session from localStorage and sends worker back to login.
	 */
	function handleLogout() {
		worker.logout();
		goto('/worker/login');
	}

	const navItems = [
		{ href: '/worker/schedule', label: 'Einsätze', icon: CalendarDays },
		{ href: '/worker/hours', label: 'Stunden', icon: Clock },
		{ href: '/worker/profile', label: 'Profil', icon: User },
	];
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#if isLogin}
	{@render children()}
{:else if worker.isAuthenticated}
	<div class="worker-shell">
		<header class="worker-header">
			<span class="header-title">Aust Mitarbeiter</span>
			<button class="logout-btn" onclick={handleLogout} title="Abmelden">
				<LogOut size={18} />
			</button>
		</header>

		<main class="worker-main">
			{@render children()}
		</main>

		<nav class="worker-nav">
			{#each navItems as item}
				{@const active = $page.url.pathname.startsWith(item.href)}
				<a href={item.href} class="nav-item" class:active>
					<item.icon size={22} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
	</div>
{/if}

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f1f5f9;
		color: #1e293b;
	}

	.worker-shell {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		max-width: 480px;
		margin: 0 auto;
		background: #fff;
		box-shadow: 0 0 40px rgba(0, 0, 0, 0.08);
	}

	.worker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		background: #1e293b;
		color: #fff;
		flex-shrink: 0;
	}

	.header-title {
		font-size: 1rem;
		font-weight: 700;
		letter-spacing: 0.01em;
	}

	.logout-btn {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		padding: 0.25rem;
		display: flex;
		align-items: center;
		border-radius: 0.375rem;
		transition: color 150ms;
	}

	.logout-btn:hover {
		color: #fff;
	}

	.worker-main {
		flex: 1;
		overflow-y: auto;
		padding: 1.25rem;
	}

	.worker-nav {
		display: flex;
		border-top: 1px solid #e2e8f0;
		background: #fff;
		flex-shrink: 0;
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.75rem 0.5rem;
		text-decoration: none;
		color: #94a3b8;
		font-size: 0.6875rem;
		font-weight: 500;
		transition: color 150ms;
	}

	.nav-item.active {
		color: #4f46e5;
	}

	.nav-item:hover {
		color: #475569;
	}
</style>
