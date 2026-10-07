<script lang="ts">
	import { goto } from '$app/navigation';
	import { Command, Dialog } from 'bits-ui';
	import { Search, User, Inbox, Plus, StickyNote, Flag, SunMoon } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';
	import { apiGet } from '$lib/utils/api.svelte';
	import { navFor } from './nav';
	import { panels } from './panels.svelte';

	/**
	 * ⌘K / Ctrl+K: jump to any section, a customer or an inquiry, or run a shell action.
	 * Sections and actions filter locally; customers and inquiries come from the
	 * existing list endpoints' `search` parameter once two characters are typed.
	 */
	interface CustomerHit {
		id: string;
		name: string | null;
		company_name: string | null;
		email: string | null;
	}
	interface InquiryHit {
		id: string;
		customer_name: string | null;
		origin_city: string | null;
		destination_city: string | null;
		status: string;
	}

	let query = $state('');
	let customers = $state<CustomerHit[]>([]);
	let inquiries = $state<InquiryHit[]>([]);
	let searching = $state(false);

	const items = $derived(navFor(auth.user?.role, auth.user?.superuser).flatMap((g) => g.items));
	const q = $derived(query.trim().toLowerCase());
	const pages = $derived(
		q ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)) : items
	);

	const actions = [
		{ label: 'Neue Anfrage', icon: Plus, run: () => goto('/admin/inquiries?neu=1') },
		{ label: 'Notizen öffnen', icon: StickyNote, run: () => (panels.notes = true) },
		{ label: 'Fehler melden', icon: Flag, run: () => (panels.feedback = true) },
		{ label: 'Hell / Dunkel umschalten', icon: SunMoon, run: () => theme.toggle() }
	];
	const shownActions = $derived(q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions);

	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const term = query.trim();
		clearTimeout(timer);
		if (term.length < 2) {
			customers = [];
			inquiries = [];
			return;
		}
		timer = setTimeout(async () => {
			searching = true;
			const params = new URLSearchParams({ search: term, limit: '5', offset: '0' });
			const [c, i] = await Promise.allSettled([
				apiGet<{ customers: CustomerHit[] }>(`/api/v1/admin/customers?${params}`),
				apiGet<{ inquiries: InquiryHit[] }>(`/api/v1/inquiries?${params}`)
			]);
			if (query.trim() !== term) return; // a newer keystroke owns the result
			customers = c.status === 'fulfilled' ? (c.value.customers ?? []) : [];
			inquiries = i.status === 'fulfilled' ? (i.value.inquiries ?? []) : [];
			searching = false;
		}, 220);
	});

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			panels.palette = !panels.palette;
		}
	}

	function run(fn: () => unknown) {
		panels.palette = false;
		query = '';
		fn();
	}

	const itemClass =
		'flex h-10 cursor-pointer items-center gap-3 rounded-sm px-2.5 text-sm text-muted data-selected:bg-sunk data-selected:text-fg';
	const headingClass = 'label-xs px-2.5 pt-3 pb-1.5 text-[10px] text-faint';
</script>

<svelte:window onkeydown={onKeydown} />

<Dialog.Root bind:open={panels.palette}>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[700] bg-black/50" />
		<Dialog.Content
			class="fixed top-[12dvh] left-1/2 z-[701] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-md border border-line bg-panel text-fg shadow-2xl outline-none"
		>
			<Dialog.Title class="sr-only">Suchen und springen</Dialog.Title>
			<Command.Root shouldFilter={false} class="flex flex-col">
				<div class="flex items-center gap-2.5 border-b border-line px-3.5">
					<Search size={16} class="shrink-0 text-faint" />
					<Command.Input
						bind:value={query}
						placeholder="Kunde, Anfrage, Seite …"
						class="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-faint"
					/>
					<kbd class="num hidden rounded-xs border border-line-strong px-1.5 text-[11px] text-faint sm:block">Esc</kbd>
				</div>
				<Command.List class="max-h-[60dvh] overflow-y-auto p-1.5">
					<Command.Empty class="px-3 py-6 text-center text-sm text-muted">
						{searching ? 'Suche …' : 'Nichts gefunden'}
					</Command.Empty>

					{#if customers.length}
						<Command.Group>
							<Command.GroupHeading class={headingClass}>Kunden</Command.GroupHeading>
							<Command.GroupItems>
								{#each customers as c (c.id)}
									<Command.Item
										value="customer-{c.id}"
										class={itemClass}
										onSelect={() => run(() => goto(`/admin/customers/${c.id}`))}
									>
										<User size={16} />
										<span class="flex-1 truncate text-fg">{c.company_name || c.name || c.email}</span>
										<span class="truncate text-xs text-faint">{c.email ?? ''}</span>
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/if}

					{#if inquiries.length}
						<Command.Group>
							<Command.GroupHeading class={headingClass}>Anfragen</Command.GroupHeading>
							<Command.GroupItems>
								{#each inquiries as inq (inq.id)}
									<Command.Item
										value="inquiry-{inq.id}"
										class={itemClass}
										onSelect={() => run(() => goto(`/admin/inquiries/${inq.id}`))}
									>
										<Inbox size={16} />
										<span class="flex-1 truncate text-fg">{inq.customer_name ?? 'Unbekannt'}</span>
										<span class="truncate text-xs text-faint">
											{[inq.origin_city, inq.destination_city].filter(Boolean).join(' → ')}
										</span>
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/if}

					{#if pages.length}
						<Command.Group>
							<Command.GroupHeading class={headingClass}>Seiten</Command.GroupHeading>
							<Command.GroupItems>
								{#each pages as p (p.href)}
									<Command.Item value="page-{p.href}" class={itemClass} onSelect={() => run(() => goto(p.href))}>
										<p.icon size={16} />
										<span class="text-fg">{p.label}</span>
										<span class="truncate text-xs text-faint">{p.hint}</span>
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/if}

					{#if shownActions.length}
						<Command.Group>
							<Command.GroupHeading class={headingClass}>Aktionen</Command.GroupHeading>
							<Command.GroupItems>
								{#each shownActions as a (a.label)}
									<Command.Item value="action-{a.label}" class={itemClass} onSelect={() => run(a.run)}>
										<a.icon size={16} />
										<span class="text-fg">{a.label}</span>
									</Command.Item>
								{/each}
							</Command.GroupItems>
						</Command.Group>
					{/if}
				</Command.List>
			</Command.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
