<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import { media } from '$lib/stores/media.svelte';
	import { apiGet, apiPatch, apiDownload, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { panels } from '$lib/components/console/panels.svelte';
	import { Plus, X, Download } from 'lucide-svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { Tone } from '$lib/components/ui/tone';

	/**
	 * Feedback — bug reports and wishes filed from the console ("Melden").
	 * Admin-only. New reports are filed through the shell's feedback panel, so this
	 * page lists, triages and downloads attachments.
	 */
	interface FeedbackReport {
		id: string;
		report_type: 'bug' | 'feature';
		priority: 'low' | 'medium' | 'high' | 'critical';
		title: string;
		description: string | null;
		location: string | null;
		attachment_keys: string[];
		status: 'open' | 'in_progress' | 'resolved';
		created_at: string;
		updated_at: string;
	}

	$effect(() => {
		if (auth.user && auth.user.role !== 'admin') goto('/admin');
	});

	let reports = $state<FeedbackReport[]>([]);
	let loading = $state(true);
	let filterStatus = $state('');
	let filterType = $state('');
	let selected = $state<FeedbackReport | null>(null);

	$effect(() => {
		untrack(loadReports);
	});

	// A report filed from the panel shows up as soon as the panel closes.
	let feedbackWasOpen = false;
	$effect(() => {
		const open = panels.feedback;
		if (feedbackWasOpen && !open) untrack(loadReports);
		feedbackWasOpen = open;
	});

	async function loadReports() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filterStatus) params.set('status', filterStatus);
			if (filterType) params.set('type', filterType);
			const qs = params.toString();
			reports = await apiGet<FeedbackReport[]>(`/api/v1/admin/feedback${qs ? '?' + qs : ''}`);
		} catch {
			showToast('Fehler beim Laden der Reports', 'error');
		} finally {
			loading = false;
		}
	}

	async function setStatus(id: string, status: string) {
		try {
			const updated = await apiPatch<FeedbackReport>(`/api/v1/admin/feedback/${id}`, { status });
			reports = reports.map((r) => (r.id === id ? updated : r));
			if (selected?.id === id) selected = updated;
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	async function downloadAttachment(reportId: string, idx: number, key: string) {
		const filename = key.split('/').pop() ?? `attachment-${idx}`;
		await apiDownload(`/api/v1/admin/feedback/${reportId}/attachments/${idx}`, filename);
	}

	const PRIORITY: Record<string, { label: string; tone: Tone }> = {
		low: { label: 'Niedrig', tone: 'neutral' },
		medium: { label: 'Mittel', tone: 'info' },
		high: { label: 'Hoch', tone: 'warn' },
		critical: { label: 'Kritisch', tone: 'danger' }
	};
	const STATUS: Record<string, { label: string; tone: Tone }> = {
		open: { label: 'Offen', tone: 'accent' },
		in_progress: { label: 'In Bearbeitung', tone: 'info' },
		resolved: { label: 'Erledigt', tone: 'ok' }
	};
	const TYPE: Record<string, { label: string; tone: Tone }> = {
		bug: { label: 'Fehler', tone: 'danger' },
		feature: { label: 'Wunsch', tone: 'info' }
	};

	let mobileOpen = $derived(!media.desktop && selected !== null);
</script>

<svelte:head><title>Feedback</title></svelte:head>

<PageHeader title="Feedback" count="{reports.length} Meldungen">
	{#snippet actions()}
		<Button variant="accent" onclick={() => (panels.feedback = true)}><Plus size={16} /> Neue Meldung</Button>
	{/snippet}
</PageHeader>

<div class="mb-4 flex flex-wrap gap-2">
	<Select class="w-44" aria-label="Status" bind:value={filterStatus} onchange={loadReports}>
		<option value="">Alle Status</option>
		<option value="open">Offen</option>
		<option value="in_progress">In Bearbeitung</option>
		<option value="resolved">Erledigt</option>
	</Select>
	<Select class="w-40" aria-label="Typ" bind:value={filterType} onchange={loadReports}>
		<option value="">Alle Typen</option>
		<option value="bug">Fehler</option>
		<option value="feature">Wunsch</option>
	</Select>
</div>

{#snippet detail(r: FeedbackReport)}
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap gap-1.5">
			<Badge tone={TYPE[r.report_type].tone}>{TYPE[r.report_type].label}</Badge>
			<Badge tone={PRIORITY[r.priority].tone}>{PRIORITY[r.priority].label}</Badge>
		</div>
		<label class="flex flex-col gap-1.5 text-xs font-medium text-muted">
			Status
			<Select value={r.status} onchange={(e) => setStatus(r.id, (e.target as HTMLSelectElement).value)}>
				<option value="open">Offen</option>
				<option value="in_progress">In Bearbeitung</option>
				<option value="resolved">Erledigt</option>
			</Select>
		</label>
		{#if r.location}
			<div class="flex flex-col gap-1">
				<span class="label-xs text-faint">Seite / Bereich</span>
				<span class="num text-[13px]">{r.location}</span>
			</div>
		{/if}
		{#if r.description}
			<div class="flex flex-col gap-1">
				<span class="label-xs text-faint">Beschreibung</span>
				<p class="text-sm leading-relaxed whitespace-pre-wrap">{r.description}</p>
			</div>
		{/if}
		<div class="flex flex-col gap-1">
			<span class="label-xs text-faint">Erstellt</span>
			<span class="num text-[13px]">{formatDate(r.created_at)}</span>
		</div>
		{#if r.attachment_keys.length > 0}
			<div class="flex flex-col gap-2">
				<span class="label-xs text-faint">Anhänge ({r.attachment_keys.length})</span>
				{#each r.attachment_keys as key, i (key)}
					<div class="flex items-center gap-2 rounded-sm border border-line px-2.5 py-1.5">
						<span class="min-w-0 flex-1 truncate text-[13px]">{key.split('/').pop() ?? `Datei ${i + 1}`}</span>
						<Button size="icon-sm" variant="ghost" aria-label="Herunterladen" title="Herunterladen" onclick={() => downloadAttachment(r.id, i, key)}>
							<Download size={14} />
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="grid items-start gap-3.5 {selected && media.desktop ? 'lg:grid-cols-[minmax(0,1fr)_400px]' : ''}">
	<div class="min-w-0">
		{#if loading}
			<div class="h-64 animate-pulse rounded-md bg-sunk"></div>
		{:else if reports.length === 0}
			<EmptyState title="Keine Meldungen" hint="Fehler und Wünsche aus dem Büro landen hier — über „Melden“ in der Seitenleiste." />
		{:else}
			<ul class="divide-y divide-line rounded-md border border-line bg-panel">
				{#each reports as r (r.id)}
					<li>
						<button
							type="button"
							class="flex w-full flex-col gap-1.5 px-4 py-3 text-left hover:bg-sunk/60 {selected?.id === r.id
								? 'bg-sunk shadow-[inset_2px_0_0_var(--accent)]'
								: ''}"
							onclick={() => (selected = r)}
						>
							<span class="flex flex-wrap items-center gap-1.5">
								<Badge tone={TYPE[r.report_type].tone}>{TYPE[r.report_type].label}</Badge>
								<Badge tone={PRIORITY[r.priority].tone}>{PRIORITY[r.priority].label}</Badge>
								<Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
								<span class="num ml-auto text-xs text-faint">{formatDate(r.created_at)}</span>
							</span>
							<span class="text-sm font-medium break-words">{r.title}</span>
							{#if r.location}<span class="num truncate text-xs text-faint">{r.location}</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if selected && media.desktop}
		<aside class="sticky top-4 rounded-md border border-line bg-panel">
			<header class="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
				<h2 class="text-[15px] font-semibold">{selected.title}</h2>
				<Button size="icon-sm" variant="ghost" aria-label="Schließen" onclick={() => (selected = null)}><X size={16} /></Button>
			</header>
			<div class="p-4">{@render detail(selected)}</div>
		</aside>
	{/if}
</div>

{#if selected && !media.desktop}
	<Sheet
		open={mobileOpen}
		side="bottom"
		title={selected.title}
		onOpenChange={(o: boolean) => {
			if (!o) selected = null;
		}}
	>
		<div class="px-4 pb-5">{@render detail(selected)}</div>
	</Sheet>
{/if}
