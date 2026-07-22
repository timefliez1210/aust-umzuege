<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import { ArrowLeft, Trash2 } from 'lucide-svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import ProfileCard from './_components/ProfileCard.svelte';
	import DocumentsCard from './_components/DocumentsCard.svelte';
	import HoursAndAssignments from './_components/HoursAndAssignments.svelte';

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

<svelte:head>
	<title>
		{data ? `${data.first_name} ${data.last_name}` : 'Mitarbeiter'} | AUST Admin
	</title>
</svelte:head>

<div class="page-header">
	<button class="btn btn-back" onclick={() => goto('/admin/employees')}>
		<ArrowLeft size={16} />
		Zurueck
	</button>
	{#if data && auth.user?.role === 'admin'}
		<div class="header-actions">
			<button class="btn btn-danger" onclick={() => { showDeleteDialog = true; }}>
				<Trash2 size={16} />
				Deaktivieren
			</button>
		</div>
	{/if}
</div>

{#if loading}
	<div class="loading">Laden...</div>
{:else if data}
	<div class="detail-grid">
		<ProfileCard employee={data} onSaved={(updated) => { if (data) data = { ...data, ...updated }; }} />
		<HoursAndAssignments employeeId={data.id} lastName={data.last_name} firstName={data.first_name} />
	</div>

	<DocumentsCard
		employeeId={data.id}
		arbeitsvertragKey={data.arbeitsvertrag_key}
		mitarbeiterfragebogenKey={data.mitarbeiterfragebogen_key}
		onUpdated={(updated) => { if (data) data = { ...data, ...updated }; }}
	/>
{/if}

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Mitarbeiter deaktivieren"
	message={data ? `Mitarbeiter „${data.first_name} ${data.last_name}" deaktivieren?` : ''}
	confirmLabel="Deaktivieren"
	onConfirm={handleDelete}
/>

<style>
	.page-header {
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.loading {
		padding: 2rem;
	}

	.btn-back {
		color: var(--dt-on-surface-variant);
	}

	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
