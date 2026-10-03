<script lang="ts">
	/**
	 * Kategorien — per cost category: Eigene Kosten (loaded onto the hourly rate) or
	 * Weiterberechnet über Positionen (the customer pays for it through KVA/invoice
	 * positions; whether that's a pass-through or profitable is computed in the
	 * Übersicht, not declared here).
	 */
	import { untrack } from 'svelte';
	import { X } from 'lucide-svelte';
	import { apiGet, apiPatch } from '$lib/utils/api.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import { KIND_LABELS, type Category } from './types';

	let { open = $bindable(false), onSaved }: { open: boolean; onSaved: () => void } = $props();

	let categories = $state<Category[]>([]);
	let draft = $state<Record<string, { mode: 'own' | 'recharged'; positions: string[]; adding: string }>>({});
	let suggestions = $state<string[]>([]);
	let saving = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!open) return;
		untrack(load);
	});

	async function load() {
		error = null;
		try {
			const [cats, names] = await Promise.all([
				apiGet<Category[]>('/api/v1/admin/profit/categories'),
				apiGet<string[]>('/api/v1/admin/profit/positions')
			]);
			categories = cats.filter((c) => c.kind !== 'wages' && c.active);
			suggestions = names;
			draft = Object.fromEntries(
				categories.map((c) => [
					c.id,
					{ mode: c.recharge_positions.length ? 'recharged' : 'own', positions: [...c.recharge_positions], adding: '' }
				])
			);
		} catch {
			error = 'Kategorien konnten nicht geladen werden.';
		}
	}

	function addPosition(id: string) {
		const d = draft[id];
		const name = d.adding.trim();
		if (name && !d.positions.some((p) => p.toLowerCase() === name.toLowerCase())) {
			d.positions = [...d.positions, name];
		}
		d.adding = '';
	}

	function wanted(id: string): string[] {
		const d = draft[id];
		return d.mode === 'own' ? [] : d.positions;
	}

	async function save() {
		const incomplete = categories.filter((c) => draft[c.id].mode === 'recharged' && draft[c.id].positions.length === 0);
		if (incomplete.length) {
			error = `Bitte mindestens eine Position wählen: ${incomplete.map((c) => c.name).join(', ')}.`;
			return;
		}
		saving = true;
		error = null;
		try {
			for (const c of categories) {
				const next = wanted(c.id);
				if (JSON.stringify(next) !== JSON.stringify(c.recharge_positions)) {
					await apiPatch(`/api/v1/admin/profit/categories/${c.id}`, { recharge_positions: next });
				}
			}
			open = false;
			onSaved();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Speichern fehlgeschlagen.';
		} finally {
			saving = false;
		}
	}
</script>

{#if open}
	<Modal
		title="Kategorien"
		description="Eigene Kosten fließen in den Stundensatz. Weiterberechnete Kosten zahlt der Kunde über eine Position im KVA — ob das plus/minus null oder Gewinn ist, zeigt die Übersicht."
		size="lg"
		onclose={() => (open = false)}
	>
		<datalist id="position-names">
			{#each suggestions as s (s)}<option value={s}></option>{/each}
		</datalist>

		<div class="flex flex-col divide-y divide-line">
			{#each categories as c (c.id)}
				{@const d = draft[c.id]}
				{#if d}
					<div class="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-40">
							<p class="text-[13px] font-semibold">{c.name}</p>
							<p class="text-xs text-muted">{KIND_LABELS[c.kind]}</p>
						</div>
						<div class="flex flex-1 flex-col gap-2 sm:items-end">
							<Segmented
								size="sm"
								label="Abrechnung {c.name}"
								options={[
									{ value: 'own', label: 'Eigene Kosten' },
									{ value: 'recharged', label: 'Weiterberechnet' }
								]}
								bind:value={d.mode}
							/>
							{#if d.mode === 'recharged'}
								<div class="flex flex-wrap items-center gap-1.5 sm:justify-end">
									{#each d.positions as p (p)}
										<span class="inline-flex items-center gap-1 rounded-sm border border-line-strong px-2 py-0.5 text-xs">
											{p}
											<button
												type="button"
												class="text-muted hover:text-danger"
												aria-label="{p} entfernen"
												onclick={() => (d.positions = d.positions.filter((x) => x !== p))}><X size={12} /></button
											>
										</span>
									{/each}
									<form
										class="flex items-center gap-1"
										onsubmit={(e) => {
											e.preventDefault();
											addPosition(c.id);
										}}
									>
										<Input
											list="position-names"
											class="h-8 w-48 text-xs"
											placeholder="Position hinzufügen …"
											bind:value={d.adding}
										/>
										<Button size="sm" type="submit" disabled={!d.adding.trim()}>+</Button>
									</form>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>

		{#if error}<Notice tone="danger">{error}</Notice>{/if}

		{#snippet footer()}
			<Button onclick={() => (open = false)}>Abbrechen</Button>
			<Button variant="solid" onclick={save} disabled={saving}>{saving ? 'Speichert …' : 'Speichern'}</Button>
		{/snippet}
	</Modal>
{/if}
