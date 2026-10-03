<script lang="ts">
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { Phone, CheckCircle, AlarmClock, RefreshCw } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { navBadges } from '$lib/components/console/navBadges.svelte';

	interface FlashContact {
		id: string;
		name: string;
		phone: string;
		time_preference: string;
		created_at: string;
		reminder_sent_at: string | null;
		handled_at: string | null;
		next_remind_at: string | null;
		dismissed_at: string | null;
	}

	const TIME_LABELS: Record<string, string> = {
		gleich: 'Jetzt gleich',
		vormittag: 'Vormittag',
		nachmittag: 'Nachmittag'
	};

	let contacts = $state<FlashContact[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let handlingId = $state<string | null>(null);

	const open = $derived(contacts.filter((c) => !c.handled_at && !c.dismissed_at));
	const done = $derived(contacts.filter((c) => !!c.handled_at));
	const dismissed = $derived(contacts.filter((c) => !!c.dismissed_at));

	let tab = $state<'open' | 'done' | 'dismissed'>('open');
	const history = $derived(tab === 'done' ? done : dismissed);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await apiGet<FlashContact[]>('/api/v1/admin/flash-contacts');
			contacts = res;
		} catch {
			error = 'Laden fehlgeschlagen.';
		} finally {
			loading = false;
		}
	}

	async function markHandled(id: string) {
		handlingId = id;
		try {
			await apiPost(`/api/v1/admin/flash-contacts/${id}/handle`, {});
			contacts = contacts.map((c) =>
				c.id === id ? { ...c, handled_at: new Date().toISOString() } : c
			);
			navBadges.refresh();
		} catch {
			error = 'Aktion fehlgeschlagen.';
		} finally {
			handlingId = null;
		}
	}

	$effect(() => {
		load();
	});
</script>

<svelte:head><title>Rückrufe</title></svelte:head>

<PageHeader title="Rückrufe" count="{open.length} offen">
	{#snippet actions()}
		<Button variant="ghost" size="icon" onclick={load} disabled={loading} aria-label="Aktualisieren">
			<RefreshCw size={16} class={loading ? 'animate-spin' : ''} />
		</Button>
	{/snippet}
</PageHeader>

{#if error}
	<p class="mb-3 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
{/if}

<FilterTabs
	class="mb-4"
	label="Rückrufe"
	options={[
		{ value: 'open', label: 'Offen', count: open.length },
		{ value: 'done', label: 'Erreicht', count: done.length },
		{ value: 'dismissed', label: 'Verworfen', count: dismissed.length }
	]}
	bind:value={tab}
/>

{#if loading && contacts.length === 0}
	<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true">
		{#each Array(3) as _, i (i)}<div class="h-40 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if tab === 'open'}
	{#if open.length === 0}
		<EmptyState title="Keine offenen Rückrufe" hint="Neue Anfragen aus dem Schnellkontakt-Formular erscheinen hier." />
	{:else}
		<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each open as c (c.id)}
				<article class="flex flex-col gap-3 rounded-md border border-line bg-panel p-4 shadow-[inset_3px_0_0_var(--accent)]">
					<div class="flex items-start justify-between gap-3">
						<div class="flex min-w-0 flex-col gap-0.5">
							<span class="truncate text-base font-semibold">{c.name}</span>
							<span class="num text-xs text-faint">Eingegangen {formatDate(c.created_at)}</span>
						</div>
						<Badge tone={c.time_preference === 'gleich' ? 'danger' : 'warn'}>{TIME_LABELS[c.time_preference] ?? c.time_preference}</Badge>
					</div>
					<a href="tel:{c.phone}" class="num text-xl font-medium tracking-tight hover:text-accent-text">{c.phone}</a>
					{#if c.next_remind_at}
						<span class="flex items-center gap-1.5 text-xs text-muted">
							<AlarmClock size={12} /> Nächste Erinnerung {formatDate(c.next_remind_at)}
						</span>
					{/if}
					<div class="mt-auto grid grid-cols-2 gap-2">
						<Button href="tel:{c.phone}" variant="accent"><Phone size={15} /> Anrufen</Button>
						<Button onclick={() => markHandled(c.id)} disabled={handlingId === c.id}>
							<CheckCircle size={15} />
							{handlingId === c.id ? 'Speichert …' : 'Erreicht'}
						</Button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
{:else if history.length === 0}
	<EmptyState title={tab === 'done' ? 'Noch keine erreichten Rückrufe' : 'Keine verworfenen Rückrufe'} />
{:else}
	<ul class="divide-y divide-line rounded-md border border-line bg-panel">
		{#each history as c (c.id)}
			<li class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
				<span class="flex min-w-0 flex-col">
					<span class="font-medium">{c.name}</span>
					<a href="tel:{c.phone}" class="num text-[13px] text-muted hover:text-fg">{c.phone}</a>
				</span>
				<span class="num flex flex-col items-end text-xs text-faint">
					<span>Eingegangen {formatDate(c.created_at)}</span>
					{#if tab === 'done' && c.handled_at}<span class="text-ok">Erreicht {formatDate(c.handled_at)}</span>{/if}
					{#if tab === 'dismissed' && c.dismissed_at}<span>Verworfen {formatDate(c.dismissed_at)}</span>{/if}
				</span>
			</li>
		{/each}
	</ul>
{/if}
