<script lang="ts">
	import { page } from '$app/stores';
	import { StickyNote, Flag, LogOut } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { tenant } from '$lib/tenant';
	import CountBadge from '$lib/components/ui/CountBadge.svelte';
	import TenantMark from './TenantMark.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { navFor, isActive } from './nav';
	import { navBadges } from './navBadges.svelte';
	import { panels } from './panels.svelte';

	/** Desktop navigation (≥ lg). Phones get TabBar + MoreSheet instead. */
	let { onLogout }: { onLogout: () => void } = $props();

	const groups = $derived(navFor(auth.user?.role));
	const initials = $derived(
		(auth.user?.name ?? 'A')
			.split(/\s+/)
			.map((p) => p[0])
			.join('')
			.slice(0, 2)
			.toUpperCase()
	);
</script>

<aside
	class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col self-start gap-5 border-r border-line bg-bg px-3 py-4 lg:flex"
	aria-label="Seitenleiste"
>
	<a href="/admin" class="flex items-center gap-2.5 px-2">
		<TenantMark />
		<span class="flex min-w-0 flex-col">
			<span class="truncate text-sm font-semibold">{tenant.name}</span>
			<span class="label-xs text-[10px] text-faint">{tenant.place}</span>
		</span>
	</a>

	<nav aria-label="Hauptnavigation" class="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1">
		{#each groups as group (group.label)}
			<div class="flex flex-col gap-0.5">
				<span class="label-xs px-2.5 pb-1.5 text-[10px] text-faint">{group.label}</span>
				{#each group.items as item (item.href)}
					{@const active = isActive(item.href, $page.url.pathname)}
					<a
						href={item.href}
						aria-current={active ? 'page' : undefined}
						class="flex h-8 items-center gap-2.5 rounded-sm px-2.5 text-[13.5px] transition-colors {active
							? 'bg-sunk text-fg shadow-[inset_2px_0_0_var(--accent)]'
							: 'text-muted hover:bg-sunk hover:text-fg'}"
					>
						<item.icon size={17} strokeWidth={1.6} />
						<span class="flex-1 truncate">{item.label}</span>
						<CountBadge
							count={navBadges.get(item.badge)}
							hot={item.hot}
							label={item.badgeLabel?.(navBadges.get(item.badge))}
						/>
					</a>
				{/each}
			</div>
		{/each}
	</nav>

	<div class="flex flex-col gap-3">
		<div class="grid grid-cols-2 gap-1.5">
			<button
				type="button"
				onclick={() => (panels.notes = true)}
				class="flex h-8 items-center justify-center gap-1.5 rounded-sm border border-line text-[12.5px] text-muted hover:bg-sunk hover:text-fg"
			>
				<StickyNote size={14} strokeWidth={1.8} /> Notizen
			</button>
			<button
				type="button"
				onclick={() => (panels.feedback = true)}
				class="flex h-8 items-center justify-center gap-1.5 rounded-sm border border-line text-[12.5px] text-muted hover:bg-sunk hover:text-fg"
			>
				<Flag size={14} strokeWidth={1.8} /> Melden
			</button>
		</div>
		<ThemeToggle />
		<div class="flex items-center gap-2.5 border-t border-line px-1 pt-3">
			<span
				class="num inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-sunk text-[11px]"
				aria-hidden="true">{initials}</span
			>
			<span class="flex min-w-0 flex-1 flex-col">
				<span class="truncate text-[13px] font-medium">{auth.user?.name ?? 'Admin'}</span>
				<span class="text-xs text-faint">{auth.user?.role === 'admin' ? 'Inhaber' : 'Büro'}</span>
			</span>
			<button
				type="button"
				onclick={onLogout}
				aria-label="Abmelden"
				title="Abmelden"
				class="inline-flex size-8 items-center justify-center rounded-sm text-muted hover:bg-sunk hover:text-fg"
			>
				<LogOut size={16} strokeWidth={1.8} />
			</button>
		</div>
	</div>
</aside>
