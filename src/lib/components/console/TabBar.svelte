<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth.svelte';
	import { NAV, TAB_HREFS, TAB_LABEL, MORE_ICON, isActive, navFor } from './nav';
	import { navBadges } from './navBadges.svelte';
	import { panels } from './panels.svelte';

	/** Phone bottom navigation (< lg): four sections + "Mehr". */
	const all = NAV.flatMap((g) => g.items);
	const tabs = TAB_HREFS.map((h) => all.find((i) => i.href === h)!);

	const tabActive = $derived(tabs.some((t) => isActive(t.href, $page.url.pathname)));
	/** Everything that isn't a tab — its counters roll up onto "Mehr". */
	const moreCount = $derived(
		navFor(auth.user?.role)
			.flatMap((g) => g.items)
			.filter((i) => !TAB_HREFS.includes(i.href) && i.hot)
			.reduce((n, i) => n + navBadges.get(i.badge), 0)
	);
</script>

<nav
	aria-label="Hauptnavigation"
	class="fixed inset-x-0 bottom-0 z-[400] grid grid-cols-5 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
>
	{#each tabs as tab (tab.href)}
		{@const active = isActive(tab.href, $page.url.pathname)}
		{@const count = navBadges.get(tab.badge)}
		<a
			href={tab.href}
			aria-current={active ? 'page' : undefined}
			class="relative flex h-[60px] flex-col items-center justify-center gap-1 {active
				? 'text-fg shadow-[inset_0_2px_0_var(--accent)]'
				: 'text-faint'}"
		>
			<tab.icon size={22} strokeWidth={1.6} />
			<span class="text-[11px] font-medium">{TAB_LABEL[tab.href] ?? tab.label}</span>
			{#if count > 0}
				<span
					class="num absolute top-1.5 left-1/2 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-ink"
					aria-label={tab.badgeLabel?.(count)}>{count > 99 ? '99+' : count}</span
				>
			{/if}
		</a>
	{/each}
	<button
		type="button"
		onclick={() => (panels.more = true)}
		aria-haspopup="dialog"
		class="relative flex h-[60px] flex-col items-center justify-center gap-1 {!tabActive
			? 'text-fg shadow-[inset_0_2px_0_var(--accent)]'
			: 'text-faint'}"
	>
		<MORE_ICON size={22} strokeWidth={1.6} />
		<span class="text-[11px] font-medium">Mehr</span>
		{#if moreCount > 0}
			<span
				class="num absolute top-1.5 left-1/2 ml-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] text-accent-ink"
				aria-label="{moreCount} offene Punkte">{moreCount > 99 ? '99+' : moreCount}</span
			>
		{/if}
	</button>
</nav>
