<script lang="ts">
	import { apiDownload } from "$lib/utils/api.svelte";
	import { showToast } from "$lib/components/admin/Toast.svelte";
	import { ChevronRight } from "lucide-svelte";
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

<!-- Mitarbeiter Card (visible for accepted+ statuses) -->
{#if showEmployeeCard}
	<div class="employees-section">
		<div class="card" class:card--collapsed={!open}>
			<div class="card-header card-header--toggleable">
				<button class="card-toggle" onclick={onToggle} aria-expanded={open}>
					<span class="card-toggle-chev" class:open><ChevronRight size={16} /></span>
					<h3>Mitarbeiter</h3>
				</button>
			</div>
			{#if open}
			<EmployeeAssignmentPanel
				entityId={inquiryId}
				entityType="inquiry"
				preferredDate={scheduledDate}
				{hasPauschale}
			/>
			{#if isMultiDay}
				<div class="pauschale-toggle">
					<label class="form-checkbox" style="margin-top: 0.75rem;">
						<input
							type="checkbox"
							bind:checked={hasPauschale}
							onchange={onFieldBlur}
						/>
						Verpflegungspauschale (Reisekosten)
					</label>
					{#if hasPauschale}
						<div style="margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.35rem;">
							{#each (employees ?? []) as emp}
								<button
									class="btn btn-sm"
									onclick={() => downloadTravelExpense(emp.employee_id)}
									disabled={downloadingTravelExpense}
								>
									{downloadingTravelExpense ? 'Laden...' : `Reisekosten: ${emp.first_name} ${emp.last_name[0]}.`}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			<div class="emp-notes-field">
				<label for="emp-notes-inq" class="emp-notes-label">Hinweis für Mitarbeiter</label>
				<textarea
					id="emp-notes-inq"
					rows={3}
					placeholder="Sichtbar für alle zugewiesenen Mitarbeiter im Mitarbeiterportal…"
					bind:value={employeeNotes}
					onblur={onFieldBlur}
				></textarea>
			</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.employees-section {
		margin-top: 1rem;
		margin-bottom: 1.5rem;
	}

	.emp-notes-field {
		padding: 0.75rem 0.75rem 0;
		border-top: 1px solid var(--dt-outline-variant);
		margin-top: 0.75rem;
	}

	.emp-notes-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-bottom: 0.375rem;
	}

	.emp-notes-field textarea {
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.625rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: var(--dt-radius-sm);
		font-size: 0.875rem;
		color: var(--dt-on-surface);
		resize: vertical;
		outline: none;
		font-family: inherit;
		transition: background var(--dt-transition), border-bottom var(--dt-transition);
	}

	.emp-notes-field textarea:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
</style>
