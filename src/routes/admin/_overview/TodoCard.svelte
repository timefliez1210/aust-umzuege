<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dot from '$lib/components/ui/Dot.svelte';
	import { CircleCheck } from 'lucide-svelte';
	import type { Todo } from './todos';

	let { todos }: { todos: Todo[] } = $props();
	const total = $derived(todos.reduce((n, t) => n + t.count, 0));
</script>

<Card>
	<CardHeader title="Zu tun" meta={total ? `${total} offen · nach Dringlichkeit` : undefined} />
	{#if todos.length === 0}
		<div class="flex items-center gap-3 border-t border-line px-4 py-6 text-sm text-muted">
			<CircleCheck size={18} class="text-ok" /> Alles erledigt. Nichts wartet.
		</div>
	{:else}
		<ul>
			{#each todos as t (t.key)}
				<li
					class="relative grid grid-cols-[8px_36px_minmax(0,1fr)] items-center gap-3 border-t border-line px-4 py-3 sm:grid-cols-[8px_40px_minmax(0,1fr)_auto] sm:gap-3.5"
				>
					<Dot tone={t.tone} />
					<span class="num text-[22px] leading-none font-medium tracking-tight">{t.count}</span>
					<span class="flex min-w-0 flex-col gap-0.5">
						<a href={t.href} class="font-medium after:absolute after:inset-0 sm:after:hidden">{t.title}</a>
						<span class="truncate text-[12.5px] text-muted">{t.meta}</span>
					</span>
					<Button href={t.href} size="sm" class="hidden sm:inline-flex">{t.action}</Button>
				</li>
			{/each}
		</ul>
	{/if}
</Card>
