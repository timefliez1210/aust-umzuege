<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { normalizeTimeInput } from '$lib/utils/format';
	import { DEFAULT_START_TIME, DEFAULT_END_TIME } from '$lib/utils/time';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Plus } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import PhoneLink from '$lib/components/ui/PhoneLink.svelte';
	import Stepper from '$lib/components/ui/Stepper.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import type { Tone } from '$lib/components/ui/tone';

	interface CalendarItem {
		id: string;
		title: string;
		description: string | null;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		start_time: string;
		end_time: string | null;
		duration_hours: number;
		status: string;
		created_at: string;
		customer_name?: string | null;
		customer_phone?: string | null;
	}

	const CATEGORY_LABELS: Record<string, string> = {
		intern: 'Intern',
		umzug: 'Umzug',
		entruempelung: 'Entrümpelung',
		montage: 'Montage',
		streichen: 'Streichen',
		kartons_auslieferung: 'Kartons Auslieferung',
		kartons_abholung: 'Kartons Abholung'
	};

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let items = $state<CalendarItem[]>([]);
	let loading = $state(true);

	// Create form
	let showCreate = $state(false);
	let createTitle = $state('');
	let createCategory = $state('intern');
	let createDate = $state('');
	let createDuration = $state('0');
	let createLocation = $state('');
	let createDescription = $state('');
	let createStartTime = $state(DEFAULT_START_TIME);
	let createEndTime = $state(DEFAULT_END_TIME);
	let createLoading = $state(false);
	let createError = $state('');

	$effect(() => {
		loadItems(selectedMonth);
	});

	/**
	 * Loads calendar items for the selected month.
	 *
	 * Called by: $effect on mount and whenever selectedMonth changes.
	 * Purpose: Fetches GET /admin/calendar-items?month=YYYY-MM.
	 */
	async function loadItems(month: string) {
		loading = true;
		try {
			items = await apiGet<CalendarItem[]>(`/api/v1/admin/calendar-items?month=${month}`);
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Creates a new calendar item via the API.
	 *
	 * Called by: Template (create form submit).
	 * Purpose: POSTs new item and reloads the list on success.
	 */
	async function handleCreate() {
		createError = '';
		if (!createTitle.trim()) {
			createError = 'Titel ist ein Pflichtfeld.';
			return;
		}
		if (!createStartTime) {
			createError = 'Startzeit ist ein Pflichtfeld.';
			return;
		}
		createLoading = true;
		try {
			await apiPost('/api/v1/admin/calendar-items', {
				title: createTitle.trim(),
				category: createCategory,
				scheduled_date: createDate || null,
				start_time: normalizeTimeInput(createStartTime),
				end_time: normalizeTimeInput(createEndTime),
				duration_hours: parseFloat(createDuration) || 0,
				location: createLocation.trim() || null,
				description: createDescription.trim() || null
			});
			showToast('Termin erstellt', 'success');
			showCreate = false;
			createTitle = '';
			createCategory = 'intern';
			createDate = '';
			createDuration = '0';
			createLocation = '';
			createDescription = '';
			createStartTime = DEFAULT_START_TIME;
			createEndTime = DEFAULT_END_TIME;
			loadItems(selectedMonth);
		} catch (e: unknown) {
			createError = e instanceof Error ? e.message : 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	/**
	 * Returns a CSS class for the item status badge.
	 *
	 * Called by: Template (status column).
	 * Purpose: Color-codes status for quick visual scanning.
	 *
	 * @param status - Raw status string from the API
	 */
	function statusTone(status: string): Tone {
		const map: Record<string, Tone> = { scheduled: 'info', completed: 'ok', cancelled: 'danger' };
		return map[status] ?? 'neutral';
	}

	/** "2026-10" ± n months. */
	function shiftMonth(key: string, n: number): string {
		const [y, m] = key.split('-').map(Number);
		const d = new Date(y, m - 1 + n, 1);
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
	}

	const monthLabel = $derived(
		new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
	);

	/**
	 * Returns the German label for a status string.
	 *
	 * Called by: Template (status badge text).
	 * Purpose: Human-readable status labels in German.
	 *
	 * @param status - Raw status string
	 */
	function statusLabel(status: string): string {
		const map: Record<string, string> = {
			scheduled: 'Geplant',
			completed: 'Erledigt',
			cancelled: 'Abgesagt'
		};
		return map[status] ?? status;
	}
</script>

<svelte:head><title>Termine</title></svelte:head>

<PageHeader title="Termine" count={items.length ? `${items.length} im Monat` : undefined}>
	{#snippet actions()}
		<Button variant="accent" onclick={() => (showCreate = true)}><Plus size={16} /> Neuer Termin</Button>
	{/snippet}
</PageHeader>

<div class="mb-4">
	<Stepper
		label={monthLabel}
		onprev={() => (selectedMonth = shiftMonth(selectedMonth, -1))}
		onnext={() => (selectedMonth = shiftMonth(selectedMonth, 1))}
		prevLabel="Vorheriger Monat"
		nextLabel="Nächster Monat"
	/>
</div>

{#if loading}
	<div class="h-64 animate-pulse rounded-md bg-sunk"></div>
{:else if items.length === 0}
	<EmptyState title="Keine Termine in diesem Monat" hint="Besichtigungen, Kartonlieferungen und interne Termine erscheinen hier und im Kalender." />
{:else}
	<ul class="divide-y divide-line rounded-md border border-line bg-panel">
		{#each items as item (item.id)}
			<!-- Stretched link: the title's <a> covers the whole row (after:inset-0), so the
			     row stays one big link while the phone number can be its own tel: link. -->
			<li class="relative">
				<div
					class="grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-sunk/60 sm:grid-cols-[92px_110px_minmax(0,1fr)_auto_auto]"
				>
					<span class="num flex flex-col text-[13px]">
						<span class="font-medium">{item.scheduled_date ? formatDate(item.scheduled_date) : '—'}</span>
						<span class="text-xs text-faint sm:hidden">{item.start_time ? item.start_time.slice(0, 5) : ''}</span>
					</span>
					<span class="num hidden text-[13px] text-muted sm:block"
						>{item.start_time ? item.start_time.slice(0, 5) : '—'}{item.end_time ? ' – ' + item.end_time.slice(0, 5) : ''}</span
					>
					<span class="flex min-w-0 flex-col">
						<a href="/admin/calendar-items/{item.id}" class="truncate text-sm font-medium after:absolute after:inset-0">{item.title}</a>
						<span class="truncate text-xs text-faint">
							{CATEGORY_LABELS[item.category] ?? item.category}{item.location ? ` · ${item.location}` : ''}{item.customer_name ? ` · ${item.customer_name}` : ''}
						</span>
						<PhoneLink phone={item.customer_phone} class="relative z-[1] self-start text-xs text-muted" />
					</span>
					<span class="num hidden text-right text-xs text-muted sm:block">{item.duration_hours.toFixed(1)} h</span>
					<Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#if showCreate}
	<Modal title="Neuer Termin" onclose={() => (showCreate = false)}>
		<form
			id="item-create"
			class="grid grid-cols-2 gap-3"
			onsubmit={(e) => {
				e.preventDefault();
				handleCreate();
			}}
		>
			{#if createError}<Notice tone="danger" class="col-span-2">{createError}</Notice>{/if}
			<Field label="Titel *" for="c-title" class="col-span-2"><Input id="c-title" bind:value={createTitle} required /></Field>
			<Field label="Kategorie" for="c-cat">
				<Input id="c-cat" list="cal-categories" bind:value={createCategory} placeholder="Intern, Umzug, eigene …" />
				<datalist id="cal-categories">
					{#each Object.entries(CATEGORY_LABELS) as [v, l] (v)}<option value={v}>{l}</option>{/each}
				</datalist>
			</Field>
			<Field label="Datum" for="c-date"><Input id="c-date" type="date" bind:value={createDate} /></Field>
			<Field label="Startzeit *" for="c-start">
				<Input
					id="c-start"
					class="num"
					inputmode="numeric"
					pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
					placeholder="HH:MM"
					maxlength={5}
					bind:value={createStartTime}
					required
				/>
			</Field>
			<Field label="Endzeit" for="c-end">
				<Input
					id="c-end"
					class="num"
					inputmode="numeric"
					pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
					placeholder="HH:MM"
					maxlength={5}
					bind:value={createEndTime}
				/>
			</Field>
			<Field label="Dauer (h)" for="c-dur"><Input id="c-dur" class="num" type="number" step="0.5" min="0" bind:value={createDuration} /></Field>
			<Field label="Ort" for="c-loc"><Input id="c-loc" bind:value={createLocation} /></Field>
			<Field label="Beschreibung" for="c-desc" class="col-span-2"><Textarea id="c-desc" rows={3} bind:value={createDescription} /></Field>
		</form>
		{#snippet footer()}
			<Button onclick={() => (showCreate = false)}>Abbrechen</Button>
			<Button type="submit" form="item-create" variant="solid" disabled={createLoading}>{createLoading ? 'Erstelle …' : 'Erstellen'}</Button>
		{/snippet}
	</Modal>
{/if}
