<script lang="ts">
	/**
	 * Annahmen der Stundensatz-Kalkulation: target profit, look-back window, planned
	 * volume, the full-capacity comparison, and which cost categories are loaded onto
	 * the hourly rate.
	 */
	import { untrack } from 'svelte';
	import { apiGet, apiPut } from '$lib/utils/api.svelte';
	import { parseEuroInput } from '$lib/utils/format';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Notice from '$lib/components/ui/Notice.svelte';
	import { type Category, type ProfitSettings } from './types';

	let { open = $bindable(false), onSaved }: { open: boolean; onSaved: () => void } = $props();

	let settings = $state<ProfitSettings | null>(null);
	let categories = $state<Category[]>([]);

	let profit = $state('');
	let windowMonths = $state('12');
	let plannedHours = $state('');
	let crew = $state('');
	let hoursPerDay = $state('8');
	let daysPerMonth = $state('21');
	let saving = $state(false);
	let error = $state<string | null>(null);

	const de = (n: number) => n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
	const num = (s: string) => {
		const v = Number(s.replace(/\./g, '').replace(',', '.'));
		return s.trim() === '' || !Number.isFinite(v) ? null : v;
	};

	$effect(() => {
		if (!open) return;
		untrack(load);
	});

	async function load() {
		error = null;
		try {
			const [s, cats] = await Promise.all([
				apiGet<ProfitSettings>('/api/v1/admin/profit/settings'),
				apiGet<Category[]>('/api/v1/admin/profit/categories')
			]);
			settings = s;
			categories = cats.filter((c) => c.kind !== 'wages' && c.active);
			const h = s.hourly;
			profit = (h.target_profit_cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 });
			windowMonths = String(h.window_months);
			plannedHours = h.planned_hours_per_month == null ? '' : de(h.planned_hours_per_month);
			crew = h.capacity_crew == null ? '' : String(h.capacity_crew);
			hoursPerDay = de(h.capacity_hours_per_day);
			daysPerMonth = de(h.capacity_days_per_month);
		} catch {
			error = 'Einstellungen konnten nicht geladen werden.';
		}
	}

	async function save() {
		if (!settings) return;
		const profitCents = parseEuroInput(profit || '0');
		const win = num(windowMonths);
		const hpd = num(hoursPerDay);
		const dpm = num(daysPerMonth);
		if (profitCents == null || win == null || hpd == null || dpm == null) {
			error = 'Bitte alle Pflichtfelder als Zahl eingeben.';
			return;
		}
		saving = true;
		error = null;
		try {
			await apiPut('/api/v1/admin/profit/settings', {
				default_rate_cents: settings.default_rate_cents,
				hourly: {
					target_profit_cents: profitCents,
					window_months: Math.round(win),
					planned_hours_per_month: num(plannedHours),
					capacity_crew: num(crew) == null ? null : Math.round(num(crew)!),
					capacity_hours_per_day: hpd,
					capacity_days_per_month: dpm
				}
			});
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
	<Modal title="Annahmen Stundensatz" size="lg" onclose={() => (open = false)}>
		<form
			id="hourly-settings"
			class="flex flex-col gap-4"
			onsubmit={(e) => {
				e.preventDefault();
				save();
			}}
		>
			<div class="grid gap-3 sm:grid-cols-3">
				<Field label="Zielgewinn pro Monat (€ netto)" for="hs-profit" hint="Kommt auf den Break-even obendrauf.">
					<Input id="hs-profit" class="num" inputmode="decimal" bind:value={profit} />
				</Field>
				<Field label="Zeitraum (Monate)" for="hs-window" hint="Wie weit zurück gerechnet wird, max. 24.">
					<Input id="hs-window" class="num" inputmode="numeric" bind:value={windowMonths} />
				</Field>
				<Field label="Geplante Stunden / Monat" for="hs-plan" hint="Leer = gemessener Durchschnitt.">
					<Input id="hs-plan" class="num" inputmode="decimal" placeholder="Ø" bind:value={plannedHours} />
				</Field>
			</div>

			<div>
				<p class="mb-2 text-[13px] font-semibold">Vergleich: volle Auslastung</p>
				<div class="grid gap-3 sm:grid-cols-3">
					<Field label="Teamgröße" for="hs-crew" hint="Leer = aktive Mitarbeiter.">
						<Input id="hs-crew" class="num" inputmode="numeric" placeholder="aktive" bind:value={crew} />
					</Field>
					<Field label="Stunden pro Tag" for="hs-hpd">
						<Input id="hs-hpd" class="num" inputmode="decimal" bind:value={hoursPerDay} />
					</Field>
					<Field label="Arbeitstage pro Monat" for="hs-dpm">
						<Input id="hs-dpm" class="num" inputmode="decimal" bind:value={daysPerMonth} />
					</Field>
				</div>
			</div>

			<div>
				<p class="mb-1 text-[13px] font-semibold">Kosten im Stundensatz</p>
				<p class="text-xs text-muted">
					Alle Kategorien mit „Eigene Kosten“ plus Löhne. Weiterberechnet und damit ausgenommen:
					{categories
						.filter((c) => c.recharge_positions.length)
						.map((c) => `${c.name} (→ ${c.recharge_positions.join(', ')})`)
						.join(' · ') || 'keine'}. Ändern unter Übersicht → Weiterberechnete Kosten → Kategorien.
				</p>
			</div>

			{#if error}<Notice tone="danger">{error}</Notice>{/if}
		</form>
		{#snippet footer()}
			<Button onclick={() => (open = false)}>Abbrechen</Button>
			<Button type="submit" form="hourly-settings" variant="solid" disabled={saving || !settings}>
				{saving ? 'Speichert …' : 'Speichern'}
			</Button>
		{/snippet}
	</Modal>
{/if}
