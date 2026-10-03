<script lang="ts">
	/**
	 * Gewinn — Alex's personal cost accounting: what's left after wages, rent and the
	 * fleet. Controlling only; it does not replace the Steuerberater.
	 *
	 * Tabs: Übersicht (months + break-even), Aufträge (per-job margin), Ausgaben
	 * (bookings + receipts), Daueraufträge (rent, insurance, loan rate), Löhne &
	 * Stunden (monthly hours transfer + real cost per employee).
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import FilterTabs from '$lib/components/ui/FilterTabs.svelte';
	import { apiGet } from '$lib/utils/api.svelte';
	import Overview from './_components/Overview.svelte';
	import Jobs from './_components/Jobs.svelte';
	import Expenses from './_components/Expenses.svelte';
	import RecurringTab from './_components/Recurring.svelte';
	import Labor from './_components/Labor.svelte';
	import type { Category, Vehicle } from './_components/types';

	const TABS = [
		{ key: 'uebersicht', label: 'Übersicht' },
		{ key: 'auftraege', label: 'Aufträge' },
		{ key: 'ausgaben', label: 'Ausgaben' },
		{ key: 'dauerauftraege', label: 'Daueraufträge' },
		{ key: 'loehne', label: 'Löhne & Stunden' }
	] as const;
	type TabKey = (typeof TABS)[number]['key'];

	let tab = $derived(($page.url.searchParams.get('tab') as TabKey) || 'uebersicht');

	function selectTab(key: TabKey) {
		const url = new URL($page.url);
		url.searchParams.set('tab', key);
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	interface EmployeeOption {
		id: string;
		name: string;
	}

	// Lookups shared by the booking forms.
	let categories = $state<Category[]>([]);
	let vehicles = $state<Vehicle[]>([]);
	let employees = $state<EmployeeOption[]>([]);

	async function loadLookups() {
		try {
			const [cats, vs, emps] = await Promise.all([
				apiGet<Category[]>('/api/v1/admin/profit/categories'),
				apiGet<Vehicle[]>('/api/v1/admin/vehicles'),
				apiGet<{ employees: { id: string; first_name: string; last_name: string }[] }>(
					'/api/v1/admin/employees?active=true&limit=200'
				)
			]);
			categories = cats;
			vehicles = vs;
			employees = emps.employees.map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }));
		} catch {
			// Forms still work without vehicle/employee pickers; categories are retried on open.
		}
	}

	$effect(() => {
		loadLookups();
	});
</script>

<svelte:head><title>Gewinn</title></svelte:head>

<PageHeader title="Gewinn" eyebrow="Controlling — ersetzt nicht den Steuerberater" />

<FilterTabs class="mb-4" label="Bereich" options={TABS.map((t) => ({ value: t.key, label: t.label }))} value={tab} onchange={selectTab} />

{#if tab === 'uebersicht'}
	<Overview onOpenTab={selectTab} />
{:else if tab === 'auftraege'}
	<Jobs />
{:else if tab === 'ausgaben'}
	<Expenses {categories} {vehicles} {employees} onCategoriesChanged={loadLookups} />
{:else if tab === 'dauerauftraege'}
	<RecurringTab {categories} {vehicles} />
{:else if tab === 'loehne'}
	<Labor />
{/if}
