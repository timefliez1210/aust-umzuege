<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Check from '$lib/components/ui/Check.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { apiDownload } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import EmployeeAssignmentPanel from "$lib/components/admin/EmployeeAssignmentPanel.svelte";

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
	}

	let {
		inquiryId,
		status,
		scheduledDate,
		isMultiDay,
		employees,
		hasPauschale = $bindable(),
		employeeNotes = $bindable(),
		open = $bindable(),
		onToggle,
		onFieldBlur,
	}: {
		inquiryId: string;
		status: string;
		scheduledDate: string | null;
		isMultiDay: boolean | undefined;
		employees: EmployeeAssignment[];
		hasPauschale: boolean;
		employeeNotes: string;
		open: boolean;
		onToggle: () => void;
		onFieldBlur: () => void | Promise<void>;
	} = $props();

	const employeeStatuses = ['accepted', 'scheduled', 'completed', 'invoiced', 'paid'];

	/**
	 * Whether the Mitarbeiter card should be visible.
	 *
	 * Called by: Template (conditional rendering)
	 * Purpose: Only show employee assignments for inquiries past offer_sent.
	 */
	let showEmployeeCard = $derived(employeeStatuses.includes(status));

	// Travel expense download state
	let downloadingTravelExpense = $state(false);

	/**
	 * Downloads the travel-expense XLSX for the first assigned employee.
	 *
	 * Called by: Template (download button in pauschale section).
	 * Purpose: Calls GET /api/v1/inquiries/{id}/employees/{emp_id}/travel-expenses
	 *          and triggers a browser file download.
	 */
	async function downloadTravelExpense(empId: string) {
		downloadingTravelExpense = true;
		try {
			await apiDownload(
				`/api/v1/inquiries/${inquiryId}/employees/${empId}/travel-expenses`,
				`Reisekosten_${inquiryId.slice(0, 8)}.xlsx`,
			);
		} catch (e) {
			showToast((e as Error).message, 'error');
		} finally {
			downloadingTravelExpense = false;
		}
	}
</script>

{#if showEmployeeCard}
	<Panel title="Mitarbeiter" {open} {onToggle}>
		<div class="flex flex-col gap-4">
			<EmployeeAssignmentPanel entityId={inquiryId} entityType="inquiry" preferredDate={scheduledDate} {hasPauschale} />
			{#if isMultiDay}
				<div class="flex flex-col gap-2 border-t border-line pt-3">
					<Check bind:checked={hasPauschale} onchange={onFieldBlur}>Verpflegungspauschale (Reisekosten)</Check>
					{#if hasPauschale}
						<div class="flex flex-wrap gap-1.5">
							{#each employees ?? [] as emp (emp.employee_id)}
								<Button size="xs" onclick={() => downloadTravelExpense(emp.employee_id)} disabled={downloadingTravelExpense}>
									{downloadingTravelExpense ? 'Laden …' : `Reisekosten: ${emp.first_name} ${emp.last_name[0]}.`}
								</Button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			<Field label="Hinweis für Mitarbeiter" for="emp-notes-inq">
				<Textarea
					id="emp-notes-inq"
					rows={3}
					placeholder="Sichtbar für alle zugewiesenen Mitarbeiter im Mitarbeiterportal…"
					bind:value={employeeNotes}
					onblur={onFieldBlur}
				/>
			</Field>
		</div>
	</Panel>
{/if}
