<script lang="ts">
	import { page } from '$app/stores';
	import { ChevronRight, StickyNote, Flag, LogOut } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { tenant } from '$lib/tenant.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import CountBadge from '$lib/components/ui/CountBadge.svelte';
	import TenantMark from './TenantMark.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { navFor, isActive, TAB_HREFS } from './nav';
	import { navBadges } from './navBadges.svelte';
	import { panels } from './panels.svelte';

	/** Phone: every section that isn't a tab, plus notes, feedback, theme and logout. */
	let { onLogout }: { onLogout: () => void } = $props();

	const groups = $derived(
		navFor(auth.user?.role)
			.map((g) => ({ ...g, items: g.items.filter((i) => !TAB_HREFS.includes(i.href)) }))
			.filter((g) => g.items.length > 0)
	);

	function open(panel: 'notes' | 'feedback') {
		panels.more = false;
		panels[panel] = true;
	}
</script>

<Sheet bind:open={panels.more} side="bottom" title="Mehr">
	<div class="flex flex-col gap-5 px-4 pb-5">
		<div class="flex items-center gap-3">
			<TenantMark class="size-9" />
			<span class="flex min-w-0 flex-1 flex-col">
				<span class="truncate text-[15px] font-semibold">{tenant.name}</span>
				<span class="truncate text-xs text-faint">{auth.user?.name ?? 'Admin'}</span>
			</span>
		</div>

		{#each groups as group (group.label)}
			<div class="flex flex-col gap-1.5">
				<span class="label-xs px-0.5 text-faint">{group.label}</span>
				<div class="overflow-hidden rounded-md border border-line bg-panel">
					{#each group.items as item, i (item.href)}
						{@const active = isActive(item.href, $page.url.pathname)}
						<a
							href={item.href}
							onclick={() => (panels.more = false)}
							aria-current={active ? 'page' : undefined}
							class="grid min-h-[52px] grid-cols-[22px_minmax(0,1fr)_auto_16px] items-center gap-3 px-3.5 {i > 0
								? 'border-t border-line'
								: ''} {active ? 'bg-sunk' : 'active:bg-sunk'}"
						>
							<item.icon size={20} strokeWidth={1.6} class="text-muted" />
							<span class="flex min-w-0 flex-col">
								<span class="font-medium">{item.label}</span>
								<span class="truncate text-xs text-faint">{item.hint}</span>
							</span>
							<CountBadge count={navBadges.get(item.badge)} hot={item.hot} />
							<ChevronRight size={16} class="text-faint" />
						</a>
					{/each}
				</div>
			</div>
		{/each}

		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={() => open('notes')}
				class="flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-panel text-sm"
			>
				<StickyNote size={16} strokeWidth={1.8} /> Notizen
			</button>
			<button
				type="button"
				onclick={() => open('feedback')}
				class="flex h-11 items-center justify-center gap-2 rounded-md border border-line bg-panel text-sm"
			>
				<Flag size={16} strokeWidth={1.8} /> Fehler melden
			</button>
		</div>
		<ThemeToggle class="[&_button]:h-10" />
		<button
			type="button"
			onclick={onLogout}
			class="flex h-11 items-center justify-center gap-2 rounded-md border border-line text-sm text-danger"
		>
			<LogOut size={16} strokeWidth={1.8} /> Abmelden
		</button>
	</div>
</Sheet>
