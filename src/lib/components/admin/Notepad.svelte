<script lang="ts">
	import { apiGet, apiPost, apiPatch, apiDelete } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { StickyNote, Plus, Pin, PinOff, Trash2, X, Check } from 'lucide-svelte';

	interface Note {
		id: string;
		title: string;
		content: string;
		color: string;
		pinned: boolean;
		created_at: string;
		updated_at: string;
	}

	let open = $state(false);
	let notes = $state<Note[]>([]);
	let loading = $state(false);
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Loads all notes from the API.
	 *
	 * Called by: toggle() when opening the panel
	 * Purpose: Fetches fresh note list each time the panel opens.
	 */
	async function loadNotes() {
		loading = true;
		try {
			const res = await apiGet<{ notes: Note[] }>('/api/v1/admin/notes');
			notes = res.notes;
		} catch {
			notes = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Toggles the notepad panel open/closed.
	 *
	 * Called by: Template (FAB button click)
	 * Purpose: Opens panel and loads notes, or closes it.
	 */
	function toggle() {
		open = !open;
		if (open) loadNotes();
	}

	/**
	 * Creates a new empty note.
	 *
	 * Called by: Template (+ button)
	 * Purpose: Adds a blank note and immediately opens it for editing.
	 */
	async function addNote() {
		try {
			const note = await apiPost<Note>('/api/v1/admin/notes', {});
			notes = [note, ...notes];
			startEditing(note);
		} catch {
			showToast('Fehler beim Erstellen', 'error');
		}
	}

	/**
	 * Begins inline editing of a note.
	 *
	 * Called by: Template (note card click), addNote()
	 * Purpose: Sets editing state so the card switches to input mode.
	 */
	function startEditing(note: Note) {
		editingId = note.id;
		editTitle = note.title;
		editContent = note.content;
	}

	/**
	 * Auto-saves the current note after a debounce.
	 *
	 * Called by: Template (input/textarea oninput)
	 * Purpose: Persists changes without requiring an explicit save button.
	 */
	function debounceSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => saveNote(), 600);
	}

	/**
	 * Persists the currently edited note to the API.
	 *
	 * Called by: debounceSave(), finishEditing()
	 * Purpose: PATCHes title and content changes.
	 */
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

	/**
	 * Finishes editing and saves.
	 *
	 * Called by: Template (check button, blur)
	 * Purpose: Saves and exits edit mode.
	 */
	async function finishEditing() {
		if (saveTimeout) clearTimeout(saveTimeout);
		await saveNote();
		editingId = null;
	}

	/**
	 * Toggles the pinned state of a note.
	 *
	 * Called by: Template (pin button)
	 * Purpose: Pins/unpins a note to keep it at top.
	 */
	async function togglePin(note: Note, e: Event) {
		e.stopPropagation();
		try {
			const updated = await apiPatch<Note>(`/api/v1/admin/notes/${note.id}`, {
				pinned: !note.pinned
			});
			notes = notes.map((n) => (n.id === updated.id ? updated : n));
			// Re-sort: pinned first
			notes = [...notes.filter((n) => n.pinned), ...notes.filter((n) => !n.pinned)];
		} catch {
			showToast('Fehler beim Anheften', 'error');
		}
	}

	/**
	 * Deletes a note after confirmation.
	 *
	 * Called by: Template (trash button)
	 * Purpose: Permanently removes a note.
	 */
	async function removeNote(id: string, e: Event) {
		e.stopPropagation();
		try {
			await apiDelete(`/api/v1/admin/notes/${id}`);
			notes = notes.filter((n) => n.id !== id);
			if (editingId === id) editingId = null;
		} catch {
			showToast('Fehler beim Löschen', 'error');
		}
	}

	/**
	 * Formats a timestamp as relative time (e.g. "vor 2h").
	 *
	 * Called by: Template (note card footer)
	 * Purpose: Shows when the note was last updated.
	 */
	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'gerade';
		if (mins < 60) return `vor ${mins}m`;
		const hrs = Math.floor(mins / 60);
		if (hrs < 24) return `vor ${hrs}h`;
		const days = Math.floor(hrs / 24);
		return `vor ${days}d`;
	}
</script>

<!-- Floating action button -->
<button class="notepad-fab" class:active={open} onclick={toggle} aria-label="Notizen öffnen">
	{#if open}
		<X size={22} />
	{:else}
		<StickyNote size={22} />
	{/if}
</button>

<!-- Slide-out panel -->
{#if open}
	<div class="notepad-panel">
		<div class="notepad-header">
			<h3>Notizen</h3>
			<button class="notepad-add" onclick={addNote} aria-label="Neue Notiz">
				<Plus size={18} />
			</button>
		</div>

		<div class="notepad-body">
			{#if loading}
				<div class="notepad-empty">Laden...</div>
			{:else if notes.length === 0}
				<div class="notepad-empty">
					Keine Notizen vorhanden.
					<button class="notepad-empty-cta" onclick={addNote}>Erste Notiz erstellen</button>
				</div>
			{:else}
				{#each notes as note (note.id)}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="note-card"
						class:editing={editingId === note.id}
						class:pinned={note.pinned}
						onclick={() => editingId !== note.id && startEditing(note)}
						onkeydown={() => {}}
					>
						{#if editingId === note.id}
							<input
								class="note-title-input"
								type="text"
								placeholder="Titel..."
								bind:value={editTitle}
								oninput={debounceSave}
							/>
							<textarea
								class="note-content-input"
								placeholder="Notiz schreiben..."
								bind:value={editContent}
								oninput={debounceSave}
								rows="4"
							></textarea>
							<div class="note-actions">
								<button class="note-btn done" onclick={finishEditing} aria-label="Fertig">
									<Check size={14} />
								</button>
							</div>
						{:else}
							<div class="note-title">{note.title || 'Ohne Titel'}</div>
							<div class="note-content">{note.content || '...'}</div>
							<div class="note-footer">
								<span class="note-time">{timeAgo(note.updated_at)}</span>
								<div class="note-actions">
									<button
										class="note-btn"
										class:pinned={note.pinned}
										onclick={(e) => togglePin(note, e)}
										aria-label={note.pinned ? 'Lösen' : 'Anheften'}
									>
										{#if note.pinned}<PinOff size={13} />{:else}<Pin size={13} />{/if}
									</button>
									<button class="note-btn danger" onclick={(e) => removeNote(note.id, e)} aria-label="Löschen">
										<Trash2 size={13} />
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
{/if}

<style>
	/* ─── FAB ─────────────────────────────────────────────────────── */
	.notepad-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 500;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;

		/* Glassmorphism */
		background: var(--dt-glass-bg, rgba(30, 58, 95, 0.85));
		backdrop-filter: var(--dt-glass-blur, blur(20px));
		-webkit-backdrop-filter: var(--dt-glass-blur, blur(20px));
		border: var(--dt-glass-border, 1px solid rgba(255, 255, 255, 0.08));
		color: var(--dt-on-primary, #ffffff);
		box-shadow:
			0 8px 32px -4px rgba(2, 36, 72, 0.25),
			0 2px 8px -2px rgba(2, 36, 72, 0.15);
		transition: all var(--dt-transition, 150ms ease-out);
	}

	.notepad-fab:hover {
		transform: scale(1.08);
		box-shadow:
			0 12px 40px -4px rgba(2, 36, 72, 0.35),
			0 4px 12px -2px rgba(2, 36, 72, 0.2);
	}

	.notepad-fab.active {
		background: var(--dt-secondary, #a83900);
	}

	/* ─── Panel ──────────────────────────────────────────────────── */
	.notepad-panel {
		position: fixed;
		bottom: 5rem;
		right: 1.5rem;
		z-index: 499;
		width: 360px;
		max-height: calc(100vh - 8rem);
		display: flex;
		flex-direction: column;

		/* Glassmorphism */
		background: rgba(247, 249, 251, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid rgba(255, 255, 255, 0.35);
		border-radius: var(--dt-radius-lg, 16px);
		box-shadow:
			0 16px 64px -8px rgba(2, 36, 72, 0.18),
			0 4px 16px -4px rgba(2, 36, 72, 0.1);

		animation: notepad-slide-in 200ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes notepad-slide-in {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.notepad-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem 0.75rem;
		border-bottom: 1px solid rgba(2, 36, 72, 0.06);
	}

	.notepad-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--dt-on-surface, #191c1e);
		letter-spacing: -0.01em;
	}

	.notepad-add {
		width: 32px;
		height: 32px;
		border-radius: var(--dt-radius-sm, 8px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		background: var(--dt-primary, #022448);
		color: var(--dt-on-primary, #ffffff);
		transition: opacity var(--dt-transition, 150ms ease-out);
	}

	.notepad-add:hover {
		opacity: 0.85;
	}

	/* ─── Body ───────────────────────────────────────────────────── */
	.notepad-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.notepad-empty {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--dt-on-surface-variant, #43474e);
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.notepad-empty-cta {
		background: none;
		border: none;
		color: var(--dt-primary, #022448);
		font-weight: 600;
		cursor: pointer;
		font-size: 0.875rem;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* ─── Note Card ──────────────────────────────────────────────── */
	.note-card {
		background: var(--dt-surface-container-lowest, #ffffff);
		border-radius: var(--dt-radius-md, 12px);
		padding: 0.75rem;
		cursor: pointer;
		transition: all var(--dt-transition, 150ms ease-out);
		border: 1px solid transparent;
	}

	.note-card:hover:not(.editing) {
		box-shadow: var(--dt-shadow-ambient);
	}

	.note-card.editing {
		cursor: default;
		border-color: var(--dt-primary, #022448);
		box-shadow: 0 0 0 2px rgba(2, 36, 72, 0.12);
	}

	.note-card.pinned {
		border-left: 3px solid var(--dt-secondary, #a83900);
	}

	.note-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface, #191c1e);
		margin-bottom: 0.25rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-content {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant, #43474e);
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.note-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.5rem;
	}

	.note-time {
		font-size: 0.6875rem;
		color: var(--dt-outline-variant, #c4c6cf);
	}

	/* ─── Note Inputs (edit mode) ────────────────────────────────── */
	.note-title-input {
		width: 100%;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-on-surface, #191c1e);
		outline: none;
		padding: 0;
		margin-bottom: 0.375rem;
	}

	.note-title-input::placeholder {
		color: var(--dt-outline-variant, #c4c6cf);
	}

	.note-content-input {
		width: 100%;
		border: none;
		background: var(--dt-surface-container-low, #f2f4f6);
		border-radius: var(--dt-radius-sm, 8px);
		font-size: 0.8125rem;
		color: var(--dt-on-surface, #191c1e);
		outline: none;
		padding: 0.5rem;
		resize: vertical;
		min-height: 80px;
		font-family: inherit;
		line-height: 1.5;
	}

	.note-content-input::placeholder {
		color: var(--dt-outline-variant, #c4c6cf);
	}

	/* ─── Action buttons ─────────────────────────────────────────── */
	.note-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.note-card.editing .note-actions {
		justify-content: flex-end;
		margin-top: 0.375rem;
	}

	.note-btn {
		width: 26px;
		height: 26px;
		border-radius: var(--dt-radius-sm, 8px);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--dt-on-surface-variant, #43474e);
		transition: all var(--dt-transition, 150ms ease-out);
	}

	.note-btn:hover {
		background: var(--dt-surface-container-high, #e6e8ea);
	}

	.note-btn.pinned {
		color: var(--dt-secondary, #a83900);
	}

	.note-btn.danger:hover {
		background: rgba(168, 57, 0, 0.1);
		color: var(--dt-secondary, #a83900);
	}

	.note-btn.done {
		background: var(--dt-primary, #022448);
		color: var(--dt-on-primary, #ffffff);
	}

	.note-btn.done:hover {
		opacity: 0.85;
	}

	/* ─── Mobile ─────────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.notepad-panel {
			width: calc(100vw - 2rem);
			right: 1rem;
			bottom: 4.5rem;
			max-height: calc(100vh - 6rem);
		}

		.notepad-fab {
			bottom: 1rem;
			right: 1rem;
			width: 48px;
			height: 48px;
		}
	}
</style>
