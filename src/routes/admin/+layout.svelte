<script lang="ts">
	import '../../styles/console.css';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { tenant, loadTenant } from '$lib/tenant.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Toast from '$lib/components/admin/Toast.svelte';
	import Sidebar from '$lib/components/console/Sidebar.svelte';
	import TabBar from '$lib/components/console/TabBar.svelte';
	import MoreSheet from '$lib/components/console/MoreSheet.svelte';
	import CommandPalette from '$lib/components/console/CommandPalette.svelte';
	import NotesPanel from '$lib/components/console/NotesPanel.svelte';
	import FeedbackPanel from '$lib/components/console/FeedbackPanel.svelte';
	import TenantMark from '$lib/components/console/TenantMark.svelte';
	import SearchButton from '$lib/components/console/SearchButton.svelte';
	import ThemeButton from '$lib/components/console/ThemeButton.svelte';
	import OfflineBanner from '$lib/components/console/OfflineBanner.svelte';
	import { navBadges } from '$lib/components/console/navBadges.svelte';

	let { children } = $props();

	const isLogin = $derived($page.url.pathname.startsWith('/admin/login'));

	// Theme + tenant colour live on <html> so dialogs portalled to <body> inherit them.
	$effect(() => {
		theme.apply();
	});
	$effect(() => {
		const html = document.documentElement;
		html.style.setProperty('--accent', tenant.accent);
		return () => {
			html.style.removeProperty('--accent');
			delete html.dataset.console;
			delete html.dataset.theme;
		};
	});

	$effect(() => {
		loadTenant();
	});

	$effect(() => {
		if (!auth.isAuthenticated && !isLogin) goto('/admin/login');
	});

	$effect(() => {
		if (auth.isAuthenticated && !isLogin) return navBadges.start();
	});

	function handleLogout() {
		auth.logout();
		goto('/admin/login');
	}
</script>

<svelte:head>
	<title>{tenant.name} · Console</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content={theme.resolved === 'dark' ? '#09090a' : '#f5f5f3'} />
</svelte:head>

{#if isLogin}
	{@render children()}
{:else if auth.isAuthenticated}
	<div class="flex min-h-dvh bg-bg text-fg">
		<Sidebar onLogout={handleLogout} />

		<div class="flex min-w-0 flex-1 flex-col">
			<OfflineBanner />
			<!-- Phones: slim bar with the company, search and theme. Navigation is the tab bar. -->
			<header
				class="sticky top-0 z-[300] flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur lg:hidden"
			>
				<a href="/admin" class="flex min-w-0 items-center gap-2.5">
					<TenantMark class="size-7 text-xs" />
					<span class="truncate text-sm font-semibold">{tenant.name}</span>
				</a>
				<div class="flex items-center gap-2">
					<SearchButton compact class="size-10" />
					<ThemeButton class="size-10" />
				</div>
			</header>

			<main
				class="w-full max-w-[1320px] flex-1 px-4 pt-4 pb-[calc(84px+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pt-7 lg:pb-12"
			>
				{@render children()}
			</main>
		</div>
	</div>

	<TabBar />
	<MoreSheet onLogout={handleLogout} />
	<CommandPalette />
	<NotesPanel />
	<FeedbackPanel />
{/if}

<Toast />
