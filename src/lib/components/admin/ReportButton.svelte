<script lang="ts">
	import { apiFetch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Flag, X, Upload, Loader } from 'lucide-svelte';

	let open = $state(false);
	let formType = $state<'bug' | 'feature'>('bug');
	let formPriority = $state<'low' | 'medium' | 'high' | 'critical'>('medium');
	let formTitle = $state('');
	let formDesc = $state('');
	let formLocation = $state('');
	let formFiles = $state<File[]>([]);
	let submitting = $state(false);
	let dragOver = $state(false);

	/**
	 * Toggles the report panel open/closed and pre-fills location from the current URL.
	 *
	 * Called by: Template (FAB click).
	 * Purpose: Opens the quick-submit form from anywhere in the admin dashboard.
	 */
	function toggle() {
		open = !open;
		if (open && typeof window !== 'undefined') {
			formLocation = window.location.pathname;
		}
	}

	/**
	 * Submits the report form as multipart/form-data and closes the panel on success.
	 *
	 * Called by: Template (Einreichen button).
	 * Purpose: Creates a bug report or feature request via POST /api/v1/admin/feedback.
	 */
	async function submit() {
		if (!formTitle.trim()) { showToast('Bitte Titel eingeben', 'error'); return; }
		submitting = true;
		try {
			const fd = new FormData();
			fd.append('type', formType);
			fd.append('priority', formPriority);
			fd.append('title', formTitle.trim());
			if (formDesc.trim()) fd.append('description', formDesc.trim());
			if (formLocation.trim()) fd.append('location', formLocation.trim());
			for (const file of formFiles) fd.append('attachments', file);

			await apiFetch('/api/v1/admin/feedback', { method: 'POST', body: fd });
			showToast('Report eingereicht', 'success');
			open = false;
			formTitle = ''; formDesc = ''; formFiles = []; formType = 'bug'; formPriority = 'medium';
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Einreichen', 'error');
		} finally {
			submitting = false;
		}
	}

	/**
	 * Handles file drop onto the drop zone.
	 *
	 * Called by: Template (ondrop on drop zone).
	 * Purpose: Appends dropped files to formFiles.
	 *
	 * @param e - Native DragEvent
	 */
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		formFiles = [...formFiles, ...Array.from(e.dataTransfer?.files ?? [])];
	}

	/**
	 * Handles file selection via the hidden file input.
	 *
	 * Called by: Template (onchange on hidden file input).
	 * Purpose: Appends selected files to formFiles.
	 *
	 * @param e - Native change event from file input
	 */
	function onFilePick(e: Event) {
		const input = e.target as HTMLInputElement;
		formFiles = [...formFiles, ...Array.from(input.files ?? [])];
		input.value = '';
	}

	/**
	 * Handles clipboard paste of images into the panel.
	 *
	 * Called by: Template (onpaste on the panel div).
	 * Purpose: Allows pasting screenshots directly from clipboard (Ctrl+V / Cmd+V).
	 *
	 * @param e - Native ClipboardEvent
	 */
	function onPaste(e: ClipboardEvent) {
		const images = Array.from(e.clipboardData?.items ?? [])
			.filter((item) => item.type.startsWith('image/'))
			.map((item) => item.getAsFile())
			.filter((f): f is File => f !== null);
		if (images.length > 0) {
			e.preventDefault();
			formFiles = [...formFiles, ...images];
		}
	}
</script>

<!-- FAB -->
<button class="report-fab" class:active={open} onclick={toggle} aria-label="Report einreichen">
	{#if open}
		<X size={20} />
	{:else}
		<Flag size={20} />
	{/if}
</button>

<!-- Panel -->
{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="report-panel" role="region" onpaste={onPaste}>
		<div class="panel-header">
			<span>Report einreichen</span>
		</div>

		<div class="form-row">
			<select bind:value={formType} class="sel">
				<option value="bug">Bug</option>
				<option value="feature">Feature</option>
			</select>
			<select bind:value={formPriority} class="sel">
				<option value="low">Niedrig</option>
				<option value="medium">Mittel</option>
				<option value="high">Hoch</option>
				<option value="critical">Kritisch</option>
			</select>
		</div>

		<input class="inp" type="text" bind:value={formTitle} placeholder="Titel *" />
		<input class="inp" type="text" bind:value={formLocation} placeholder="Seite / Bereich" />
		<textarea class="inp inp-ta" rows="3" bind:value={formDesc} placeholder="Beschreibung…"></textarea>

		<!-- Drop zone -->
		<div
			class="drop-zone"
			class:drag-over={dragOver}
			ondragover={(e) => { e.preventDefault(); dragOver = true; }}
			ondragleave={() => { dragOver = false; }}
			ondrop={onDrop}
			role="presentation"
		>
			<Upload size={14} />
			<span>Ablegen, einfügen (Strg+V) oder</span>
			<button class="btn-link" onclick={() => document.getElementById('rfab-file')?.click()}>
				auswählen
			</button>
			<input id="rfab-file" type="file" multiple accept="image/*,.pdf" class="hidden" onchange={onFilePick} />
		</div>

		{#if formFiles.length > 0}
			<div class="file-chips">
				{#each formFiles as f, i}
					<span class="chip">
						{f.name}
						<button onclick={() => { formFiles = formFiles.filter((_, j) => j !== i); }}>
							<X size={10} />
						</button>
					</span>
				{/each}
			</div>
		{/if}

		<button class="btn-submit" onclick={submit} disabled={submitting}>
			{#if submitting}
				<Loader size={14} class="spin" />
				Wird eingereicht…
			{:else}
				<Flag size={14} />
				Einreichen
			{/if}
		</button>
	</div>
{/if}

<style>
	/* ─── FAB ─────────────────────────────────────────────────────── */
	.report-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 5.5rem;
		z-index: 500;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border: none;
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

	.report-fab:hover {
		transform: scale(1.08);
		box-shadow:
			0 12px 40px -4px rgba(2, 36, 72, 0.35),
			0 4px 12px -2px rgba(2, 36, 72, 0.2);
	}

	.report-fab.active {
		background: var(--dt-secondary, #a83900);
	}

	/* ─── Panel ──────────────────────────────────────────────────── */
	.report-panel {
		position: fixed;
		bottom: 5rem;
		right: 5.5rem;
		z-index: 499;
		width: 320px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: rgba(247, 249, 251, 0.92);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid rgba(2, 36, 72, 0.08);
		border-radius: 16px;
		padding: 1rem;
		box-shadow:
			0 16px 48px -8px rgba(2, 36, 72, 0.2),
			0 4px 16px -4px rgba(2, 36, 72, 0.12);
	}

	.panel-header {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--dt-on-surface, #191c1e);
		margin-bottom: 0.25rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.sel,
	.inp {
		width: 100%;
		padding: 0.4rem 0.5rem;
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(2, 36, 72, 0.1);
		border-radius: 8px;
		font-size: 0.8125rem;
		color: var(--dt-on-surface, #191c1e);
		outline: none;
		font-family: inherit;
		transition: border-color 150ms;
		box-sizing: border-box;
	}

	.sel:focus,
	.inp:focus { border-color: var(--dt-primary, #022448); }

	.inp-ta { resize: vertical; min-height: 64px; }

	.drop-zone {
		border: 1.5px dashed rgba(2, 36, 72, 0.18);
		border-radius: 8px;
		padding: 0.5rem 0.75rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant, #444);
		transition: border-color 150ms, background 150ms;
	}

	.drop-zone.drag-over {
		border-color: var(--dt-primary, #022448);
		background: rgba(2, 36, 72, 0.04);
	}

	.btn-link {
		background: none;
		border: none;
		color: var(--dt-primary, #022448);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
		padding: 0;
	}

	.hidden { display: none; }

	.file-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		background: rgba(2, 36, 72, 0.07);
		border-radius: 999px;
		padding: 0.15rem 0.45rem;
		font-size: 0.7rem;
		color: var(--dt-on-surface, #191c1e);
	}

	.chip button {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		display: flex;
		color: var(--dt-on-surface-variant, #666);
	}

	.btn-submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		width: 100%;
		padding: 0.5rem;
		background: var(--dt-primary, #022448);
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 150ms;
		margin-top: 0.25rem;
	}

	.btn-submit:hover:not(:disabled) { opacity: 0.88; }
	.btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

	:global(.spin) { animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 768px) {
		.report-fab { right: 5rem; bottom: 1rem; }
		.report-panel {
			right: 0.5rem;
			bottom: 4.5rem;
			width: calc(100vw - 1rem);
		}
	}
</style>
