<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { ArrowLeft, Trash2 } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ProfileCard from './_components/ProfileCard.svelte';
	import DocumentsCard from './_components/DocumentsCard.svelte';
	import HoursAndAssignments from './_components/HoursAndAssignments.svelte';

	interface EmployeeDocument {
		id: string;
		label: string;
		filename: string;
		size_bytes: number;
		created_at: string;
	}

	interface Employee {
		id: string;
		salutation: string | null;
		first_name: string;
		last_name: string;
		email: string;
		phone: string | null;
		monthly_hours_target: number;
		active: boolean;
		arbeitsvertrag_key: string | null;
		mitarbeiterfragebogen_key: string | null;
		documents: EmployeeDocument[];
		created_at: string;
		updated_at: string;
	}

	let data = $state<Employee | null>(null);
	let loading = $state(true);
	let showDeleteDialog = $state(false);

	$effect(() => {
		const id = $page.params.id;
		if (id) loadEmployee(id);
	});

	/**
	 * Loads employee detail from the API.
	 *
	 * Called by: $effect on mount
	 * Purpose: Fetches employee profile and assignment history.
	 */
	async function loadEmployee(id: string) {
		loading = true;
		try {
			data = await apiGet<Employee>(`/api/v1/admin/employees/${id}`);
		} catch {
			showToast('Mitarbeiter nicht gefunden', 'error');
			goto('/admin/employees');
		} finally {
			loading = false;
		}
	}

	/**
	 * Soft-deletes (deactivates) the employee after confirmation dialog.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: Sets active=false, preserving assignment history. Navigates back to list.
	 */
	async function handleDelete() {
		if (!data) return;
		try {
			await apiPost(`/api/v1/admin/employees/${data.id}/delete`);
			showDeleteDialog = false;
			showToast('Mitarbeiter deaktiviert', 'success');
			goto('/admin/employees');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}
</script>

<svelte:head><title>{data ? `${data.first_name} ${data.last_name}` : 'Mitarbeiter'}</title></svelte:head>

<a href="/admin/employees" class="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft size={15} /> Mitarbeiter</a>

{#if loading}
	<div class="grid gap-3.5 lg:grid-cols-2" aria-busy="true">
		{#each Array(2) as _, i (i)}<div class="h-64 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if data}
	<header class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-4">
		<div class="flex min-w-0 flex-col gap-1.5">
			<span class="label-xs text-faint">Mitarbeiter</span>
			<h1 class="truncate text-[26px] leading-none font-semibold tracking-[-0.03em] sm:text-[30px]">{data.first_name} {data.last_name}</h1>
		</div>
		{#if auth.user?.role === 'admin'}
			<Button variant="danger" onclick={() => (showDeleteDialog = true)}><Trash2 size={15} /> Deaktivieren</Button>
		{/if}
	</header>

	<div class="grid items-start gap-3.5 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
		<div class="flex min-w-0 flex-col gap-3.5">
			<ProfileCard
				employee={data}
				onSaved={(updated) => {
					if (data) data = { ...data, ...updated };
				}}
			/>
			<DocumentsCard
				employeeId={data.id}
				arbeitsvertragKey={data.arbeitsvertrag_key}
				mitarbeiterfragebogenKey={data.mitarbeiterfragebogen_key}
				documents={data.documents ?? []}
				onUpdated={(updated) => {
					if (data) data = { ...data, ...updated };
				}}
			/>
		</div>
		<HoursAndAssignments employeeId={data.id} lastName={data.last_name} firstName={data.first_name} />
	</div>
{/if}

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Mitarbeiter deaktivieren"
	message={data ? `Mitarbeiter „${data.first_name} ${data.last_name}“ deaktivieren?` : ''}
	confirmLabel="Deaktivieren"
	onConfirm={handleDelete}
/>
