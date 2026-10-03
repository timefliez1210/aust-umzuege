<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDelete } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Plus, Pin, PinOff, Trash2, Check } from 'lucide-svelte';
	import { media } from '$lib/stores/media.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { panels } from './panels.svelte';

	/** The office's shared sticky notes (`/admin/notes`), auto-saved while typing. */
	interface Note {
		id: string;
		title: string;
		content: string;
		color: string;
		pinned: boolean;
		created_at: string;
		updated_at: string;
	}

	let notes = $state<Note[]>([]);
	let loading = $state(false);
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (panels.notes) loadNotes();
		else if (editingId) finishEditing();
	});

	async function loadNotes() {
		loading = true;
		try {
			notes = (await apiGet<{ notes: Note[] }>('/api/v1/admin/notes')).notes;
		} catch {
			notes = [];
		} finally {
			loading = false;
		}
	}

	async function addNote() {
		try {
			const note = await apiPost<Note>('/api/v1/admin/notes', {});
			notes = [note, ...notes];
			startEditing(note);
		} catch {
			showToast('Fehler beim Erstellen', 'error');
		}
	}

	function startEditing(note: Note) {
		editingId = note.id;
		editTitle = note.title;
		editContent = note.content;
	}

	function debounceSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveNote, 600);
	}

	async function saveNote() {
		if (!editingId) return;
		try {
			const updated = await apiPatch<Note>(`/api/v1/admin/notes/${editingId}`, {
				title: editTitle,
				content: editContent
			});
			notes = notes.map((n) => (n.id === updated.id ? updated : n));
		} catch {
			showToast('Fehler beim Speichern', 'error');
		}
	}

	async function finishEditing() {
		if (saveTimeout) clearTimeout(saveTimeout);
		await saveNote();
		editingId = null;
	}

	async function togglePin(note: Note) {
		try {
			const updated = await apiPatch<Note>(`/api/v1/admin/notes/${note.id}`, { pinned: !note.pinned });
			const next = notes.map((n) => (n.id === updated.id ? updated : n));
			notes = [...next.filter((n) => n.pinned), ...next.filter((n) => !n.pinned)];
		} catch {
			showToast('Fehler beim Anheften', 'error');
		}
	}

	async function removeNote(id: string) {
		try {
			await apiDelete(`/api/v1/admin/notes/${id}`);
			notes = notes.filter((n) => n.id !== id);
			if (editingId === id) editingId = null;
		} catch {
			showToast('Fehler beim Löschen', 'error');
		}
	}

	function timeAgo(dateStr: string): string {
		const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
		if (mins < 1) return 'gerade';
		if (mins < 60) return `vor ${mins} min`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `vor ${hrs} h`;
		return `vor ${Math.floor(hrs / 24)} T`;
	}
</script>

<Sheet bind:open={panels.notes} side={media.desktop ? 'right' : 'bottom'} title="Notizen" description="Für alle im Büro sichtbar">
	<div class="flex flex-col gap-2 px-4 pb-4">
		<Button variant="outline" size="sm" class="self-start" onclick={addNote}><Plus size={15} /> Neue Notiz</Button>

		{#if loading}
			<p class="py-6 text-center text-sm text-muted">Laden …</p>
		{:else if notes.length === 0}
			<p class="py-6 text-center text-sm text-muted">Noch keine Notizen.</p>
		{:else}
			{#each notes as note (note.id)}
				<article
					class="rounded-md border bg-panel {note.pinned ? 'border-accent/60' : 'border-line'} {editingId ===
					note.id
						? 'ring-1 ring-fg'
						: ''}"
				>
					{#if editingId === note.id}
						<div class="flex flex-col gap-2 p-3">
							<input
								class="bg-transparent text-sm font-semibold outline-none placeholder:text-faint"
								placeholder="Titel …"
								bind:value={editTitle}
								oninput={debounceSave}
							/>
							<textarea
								class="min-h-28 resize-y bg-transparent text-sm leading-relaxed outline-none placeholder:text-faint"
								placeholder="Notiz schreiben …"
								bind:value={editContent}
								oninput={debounceSave}
							></textarea>
							<Button variant="solid" size="xs" class="self-end" onclick={finishEditing}><Check size={14} /> Fertig</Button>
						</div>
					{:else}
						<button type="button" class="block w-full p-3 text-left" onclick={() => startEditing(note)}>
							<span class="block text-sm font-semibold">{note.title || 'Ohne Titel'}</span>
							<span class="mt-0.5 line-clamp-4 block text-[13px] whitespace-pre-line text-muted"
								>{note.content || '…'}</span
							>
						</button>
						<div class="flex items-center justify-between border-t border-line px-3 py-1.5">
							<span class="num text-[11px] text-faint">{timeAgo(note.updated_at)}</span>
							<span class="flex gap-1">
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={note.pinned ? 'Lösen' : 'Anheften'}
									onclick={() => togglePin(note)}
								>
									{#if note.pinned}<PinOff size={14} />{:else}<Pin size={14} />{/if}
								</Button>
								<Button variant="ghost" size="icon-sm" aria-label="Löschen" onclick={() => removeNote(note.id)}>
									<Trash2 size={14} />
								</Button>
							</span>
						</div>
					{/if}
				</article>
			{/each}
		{/if}
	</div>
</Sheet>
