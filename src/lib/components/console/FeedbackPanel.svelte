<script lang="ts">
	import { page } from '$app/stores';
	import { apiFetch } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Upload, X, Loader, Flag } from 'lucide-svelte';
	import { media } from '$lib/stores/media.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import { panels } from './panels.svelte';

	/** Bug report / feature request from anywhere → `POST /admin/feedback` (multipart). */
	let formType = $state<'bug' | 'feature'>('bug');
	let formPriority = $state<'low' | 'medium' | 'high' | 'critical'>('medium');
	let formTitle = $state('');
	let formDesc = $state('');
	let formLocation = $state('');
	let formFiles = $state<File[]>([]);
	let submitting = $state(false);
	let dragOver = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	// Prefill the page the report is about every time the panel opens.
	$effect(() => {
		if (panels.feedback) formLocation = $page.url.pathname;
	});

	async function submit() {
		if (!formTitle.trim()) {
			showToast('Bitte Titel eingeben', 'error');
			return;
		}
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
			panels.feedback = false;
			formTitle = '';
			formDesc = '';
			formFiles = [];
			formType = 'bug';
			formPriority = 'medium';
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Einreichen', 'error');
		} finally {
			submitting = false;
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		formFiles = [...formFiles, ...Array.from(e.dataTransfer?.files ?? [])];
	}

	function onFilePick(e: Event) {
		const input = e.target as HTMLInputElement;
		formFiles = [...formFiles, ...Array.from(input.files ?? [])];
		input.value = '';
	}

	/** Screenshots straight from the clipboard (Strg+V). */
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

<Sheet
	bind:open={panels.feedback}
	side={media.desktop ? 'right' : 'bottom'}
	title="Fehler oder Wunsch melden"
	description="Landet direkt in der Feedback-Liste"
>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="flex flex-col gap-3.5 px-4 pb-4" onpaste={onPaste}>
		<div class="grid grid-cols-2 gap-2">
			<Field label="Art" for="fb-type">
				<Select id="fb-type" bind:value={formType}>
					<option value="bug">Fehler</option>
					<option value="feature">Wunsch</option>
				</Select>
			</Field>
			<Field label="Dringlichkeit" for="fb-prio">
				<Select id="fb-prio" bind:value={formPriority}>
					<option value="low">Niedrig</option>
					<option value="medium">Mittel</option>
					<option value="high">Hoch</option>
					<option value="critical">Kritisch</option>
				</Select>
			</Field>
		</div>
		<Field label="Titel *" for="fb-title"><Input id="fb-title" bind:value={formTitle} /></Field>
		<Field label="Seite / Bereich" for="fb-loc"><Input id="fb-loc" bind:value={formLocation} /></Field>
		<Field label="Beschreibung" for="fb-desc"><Textarea id="fb-desc" rows={4} bind:value={formDesc} /></Field>

		<div
			role="presentation"
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => (dragOver = false)}
			ondrop={onDrop}
			class="flex flex-wrap items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-4 text-[13px] text-muted {dragOver
				? 'border-accent bg-accent/8'
				: 'border-line-strong'}"
		>
			<Upload size={15} />
			<span>Bild ablegen, einfügen (Strg+V) oder</span>
			<button type="button" class="text-fg underline underline-offset-2" onclick={() => fileInput?.click()}
				>auswählen</button
			>
			<input bind:this={fileInput} type="file" multiple accept="image/*,.pdf" class="hidden" onchange={onFilePick} />
		</div>

		{#if formFiles.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each formFiles as f, i (i)}
					<span class="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line bg-sunk pr-1 pl-2 text-xs">
						<span class="max-w-40 truncate">{f.name}</span>
						<button
							type="button"
							aria-label="Entfernen"
							class="inline-flex size-5 items-center justify-center rounded-xs hover:bg-sunk-2"
							onclick={() => (formFiles = formFiles.filter((_, j) => j !== i))}><X size={12} /></button
						>
					</span>
				{/each}
			</div>
		{/if}

		<Button variant="accent" size="lg" onclick={submit} disabled={submitting}>
			{#if submitting}<Loader size={16} class="animate-spin" /> Wird eingereicht …{:else}<Flag size={16} /> Einreichen{/if}
		</Button>
	</div>
</Sheet>
