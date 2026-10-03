<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, apiPatch, apiDelete, formatDate } from '$lib/utils/api.svelte';
	import { normalizeTimeInput } from '$lib/utils/format';
	import { DEFAULT_START_TIME, DEFAULT_END_TIME } from '$lib/utils/time';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { ArrowLeft, Save, Trash2, X } from 'lucide-svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import EmployeeAssignmentPanel from '$lib/components/admin/EmployeeAssignmentPanel.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Field from '$lib/components/ui/Field.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Textarea from '$lib/components/ui/Textarea.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Segmented from '$lib/components/ui/Segmented.svelte';

	interface CalendarItemDetail {
		id: string;
		title: string;
		description: string | null;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		start_time: string;
		end_time: string | null;
		duration_hours: number;
		status: string;
		created_at: string;
		customer_id: string | null;
		customer_name: string | null;
		employee_notes: string | null;
		employees: EmployeeAssignment[];
	}

	interface CustomerOption {
		id: string;
		name: string | null;
		email: string | null;
	}

	interface EmployeeAssignment {
		employee_id: string;
		first_name: string;
		last_name: string;
		actual_hours: number | null;
		notes: string | null;
	}

	let data = $state<CalendarItemDetail | null>(null);
	let loading = $state(true);
	let saving = $state(false);
	let showDeleteDialog = $state(false);

	// Edit fields
	let editTitle = $state('');
	let editCategory = $state('intern');
	let editDate = $state('');
	let editDuration = $state('0');
	let editLocation = $state('');
	let editDescription = $state('');
	let editStartTime = $state(DEFAULT_START_TIME);
	let editEndTime = $state('');
	let editEmployeeNotes = $state('');
	let editStatus = $state('scheduled');

	// Customer assignment
	let customerSearch = $state('');
	let customerResults = $state<CustomerOption[]>([]);
	let customerSearching = $state(false);
	let customerMode = $state<'view' | 'search' | 'create'>('view');
	let newCustEmail = $state('');
	let newCustName = $state('');
	let newCustPhone = $state('');
	let newCustSalutation = $state('');
	let savingCustomer = $state(false);

	$effect(() => {
		const id = $page.params.id;
		if (id) {
			loadItem(id);
		}
	});

	/**
	 * Loads the calendar item detail from the API.
	 *
	 * Called by: $effect on mount.
	 * Purpose: Fetches item + assigned employees from GET /admin/calendar-items/{id}.
	 */
	async function loadItem(id: string) {
		loading = true;
		try {
			const res = await apiGet<CalendarItemDetail>(`/api/v1/admin/calendar-items/${id}`);
			data = res;
			editTitle = res.title;
			editCategory = res.category;
			editDate = res.scheduled_date ?? '';
			editDuration = String(res.duration_hours);
			editLocation = res.location ?? '';
			editDescription = res.description ?? '';
			editStatus = res.status;
			editEmployeeNotes = res.employee_notes ?? '';
			// Without these two the form always showed the initial 09:00 and an empty
			// end time, so saving any unrelated field (location, status, …) silently
			// overwrote the Termin's stored times (feedback be449a19).
			editStartTime = res.start_time ? res.start_time.slice(0, 5) : DEFAULT_START_TIME;
			editEndTime = res.end_time ? res.end_time.slice(0, 5) : '';
		} catch {
			showToast('Termin nicht gefunden', 'error');
			goto('/admin/calendar-items');
		} finally {
			loading = false;
		}
	}

	/**
	 * Saves updated item fields via PATCH.
	 *
	 * Called by: Template (Save button).
	 * Purpose: Persists title, category, date, duration, location, description, status.
	 */
	async function handleSave() {
		if (!data) return;
		saving = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, {
				title: editTitle,
				category: editCategory,
				scheduled_date: editDate || null,
				start_time: normalizeTimeInput(editStartTime) ?? undefined,
				end_time: normalizeTimeInput(editEndTime),
				duration_hours: parseFloat(editDuration) || 0,
				location: editLocation || null,
				description: editDescription || null,
				status: editStatus,
				employee_notes: editEmployeeNotes || null
			});
			data = { ...data, ...updated };
			showToast('Gespeichert', 'success');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			saving = false;
		}
	}

	/**
	 * Deletes the calendar item after confirmation and navigates back to the list.
	 *
	 * Called by: ConfirmationDialog (onConfirm).
	 * Purpose: Removes the item permanently via DELETE /admin/calendar-items/{id}.
	 */
	async function handleDelete() {
		if (!data) return;
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${data.id}`);
			showDeleteDialog = false;
			showToast('Termin gelöscht', 'success');
			goto('/admin/calendar-items');
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		}
	}

	/**
	 * Searches customers by name or email for the customer assignment input.
	 *
	 * Called by: Template (oninput on customer search field)
	 * Purpose: Lets Alex find an existing customer to link to this Termin.
	 *
	 * @param q - Search query string
	 */
	async function searchCustomers(q: string) {
		if (q.trim().length < 2) { customerResults = []; return; }
		customerSearching = true;
		try {
			const res = await apiGet<{ customers: CustomerOption[] }>(`/api/v1/admin/customers?search=${encodeURIComponent(q)}&limit=8`);
			customerResults = res.customers;
		} catch { customerResults = []; }
		finally { customerSearching = false; }
	}

	/**
	 * Assigns a customer (or creates a new one) to this calendar item via PATCH.
	 *
	 * Called by: Template (select from search results or create form submit)
	 * Purpose: Links a customer to the Termin so Alex knows which client this appointment is for.
	 *
	 * @param customerId - UUID of the existing or newly created customer
	 */
	async function assignCustomer(customerId: string) {
		if (!data) return;
		savingCustomer = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, { customer_id: customerId });
			data = { ...data, customer_id: updated.customer_id, customer_name: updated.customer_name };
			customerMode = 'view';
			customerSearch = '';
			customerResults = [];
			newCustEmail = ''; newCustName = ''; newCustPhone = ''; newCustSalutation = '';
			showToast('Kunde zugewiesen', 'success');
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
	}

	/**
	 * Creates a new customer then immediately assigns them to this calendar item.
	 *
	 * Called by: Template (create form submit in customer section)
	 * Purpose: Allows Alex to register a new customer directly from the Termin detail page.
	 */
	async function createAndAssignCustomer() {
		if (!newCustName.trim() && !newCustEmail.trim() && !newCustPhone.trim()) { showToast('Bitte mindestens Name, E-Mail oder Telefon angeben', 'error'); return; }
		savingCustomer = true;
		try {
			const c = await apiPost<{ id: string }>('/api/v1/admin/customers', {
				email: newCustEmail.trim() || null,
				name: newCustName.trim() || null,
				phone: newCustPhone.trim() || null,
				salutation: newCustSalutation || null,
			});
			await assignCustomer(c.id);
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
	}

	/**
	 * Removes the customer assignment from this calendar item.
	 *
	 * Called by: Template (× button on the current customer badge)
	 * Purpose: Clears the customer link when a Termin is no longer associated with a specific customer.
	 */
	async function removeCustomer() {
		if (!data) return;
		savingCustomer = true;
		try {
			const updated = await apiPatch<CalendarItemDetail>(`/api/v1/admin/calendar-items/${data.id}`, { remove_customer: true });
			data = { ...data, customer_id: updated.customer_id, customer_name: updated.customer_name };
			showToast('Kunde entfernt', 'success');
		} catch (e) { showToast((e as Error).message, 'error'); }
		finally { savingCustomer = false; }
	}
</script>

<svelte:head><title>{data?.title ?? 'Termin'}</title></svelte:head>

<a href="/admin/calendar-items" class="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg"><ArrowLeft size={15} /> Termine</a>

{#if loading}
	<div class="grid gap-3.5 lg:grid-cols-2" aria-busy="true">
		{#each Array(3) as _, i (i)}<div class="h-48 animate-pulse rounded-md bg-sunk"></div>{/each}
	</div>
{:else if data}
	<header class="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-4">
		<div class="flex min-w-0 flex-col gap-1.5">
			<span class="label-xs text-faint">Termin · erstellt {formatDate(data.created_at)}</span>
			<h1 class="truncate text-[26px] leading-none font-semibold tracking-[-0.03em] sm:text-[30px]">{data.title}</h1>
		</div>
		<div class="flex gap-2">
			<Button variant="accent" onclick={handleSave} disabled={saving}><Save size={16} /> {saving ? 'Speichern …' : 'Speichern'}</Button>
			<Button variant="danger" size="icon" aria-label="Termin löschen" title="Termin löschen" onclick={() => (showDeleteDialog = true)}>
				<Trash2 size={16} />
			</Button>
		</div>
	</header>

	<div class="grid items-start gap-3.5 lg:grid-cols-2">
		<Panel title="Details">
			<div class="grid grid-cols-2 gap-3">
				<Field label="Titel" for="e-title" class="col-span-2"><Input id="e-title" bind:value={editTitle} /></Field>
				<Field label="Kategorie" for="e-cat">
					<Input id="e-cat" list="cal-categories" bind:value={editCategory} placeholder="Intern, Umzug, eigene …" />
					<datalist id="cal-categories">
						<option value="intern">Intern</option>
						<option value="umzug">Umzug</option>
						<option value="entruempelung">Entrümpelung</option>
						<option value="montage">Montage</option>
						<option value="streichen">Streichen</option>
						<option value="kartons_auslieferung">Kartons Auslieferung</option>
						<option value="kartons_abholung">Kartons Abholung</option>
					</datalist>
				</Field>
				<Field label="Status" for="e-status">
					<Select id="e-status" bind:value={editStatus}>
						<option value="scheduled">Geplant</option>
						<option value="completed">Erledigt</option>
						<option value="cancelled">Abgesagt</option>
					</Select>
				</Field>
				<Field label="Datum" for="e-date"><Input id="e-date" type="date" bind:value={editDate} /></Field>
				<Field label="Dauer (h)" for="e-dur"><Input id="e-dur" class="num" type="number" step="0.5" min="0" bind:value={editDuration} /></Field>
				<Field label="Startzeit *" for="e-start">
					<Input id="e-start" class="num" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength={5} bind:value={editStartTime} />
				</Field>
				<Field label="Endzeit" for="e-end">
					<Input id="e-end" class="num" inputmode="numeric" pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$" placeholder="HH:MM" maxlength={5} bind:value={editEndTime} />
				</Field>
				<Field label="Ort" for="e-loc" class="col-span-2"><Input id="e-loc" bind:value={editLocation} /></Field>
				<Field label="Beschreibung" for="e-desc" class="col-span-2"><Textarea id="e-desc" rows={3} bind:value={editDescription} /></Field>
			</div>
		</Panel>

		<div class="flex min-w-0 flex-col gap-3.5">
			<Panel title="Kunde">
				<div class="flex flex-col gap-3">
					{#if data.customer_id}
						<div class="flex items-center gap-2 rounded-sm border border-line-strong bg-sunk px-3 py-2">
							<a href="/admin/customers/{data.customer_id}" class="min-w-0 flex-1 truncate text-sm font-medium hover:underline">
								{data.customer_name ?? data.customer_id}
							</a>
							<Button variant="ghost" size="icon-sm" aria-label="Kunde entfernen" title="Kunde entfernen" onclick={removeCustomer} disabled={savingCustomer}>
								<X size={14} />
							</Button>
						</div>
						<Button
							size="xs"
							variant="ghost"
							class="self-start"
							onclick={() => (customerMode = customerMode === 'search' ? 'view' : 'search')}>Anderen Kunden zuweisen</Button
						>
					{:else}
						<p class="text-[13px] text-faint">Kein Kunde zugewiesen.</p>
					{/if}

					{#if !data.customer_id || customerMode === 'search' || customerMode === 'create'}
						<Segmented
							label="Kunde"
							size="sm"
							class="self-start"
							options={[
								{ value: 'search', label: 'Suchen' },
								{ value: 'create', label: 'Neu anlegen' }
							]}
							value={customerMode === 'create' ? 'create' : 'search'}
							onchange={(v) => (customerMode = v)}
						/>

						{#if customerMode !== 'create'}
							<div class="relative">
								<Input
									placeholder="Name oder E-Mail …"
									bind:value={customerSearch}
									oninput={(e) => searchCustomers((e.target as HTMLInputElement).value)}
								/>
								{#if customerSearching}<span class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">Suche …</span>{/if}
								{#if customerResults.length > 0}
									<div class="mt-1 flex flex-col rounded-md border border-line bg-panel p-1">
										{#each customerResults as c (c.id)}
											<button
												type="button"
												class="flex flex-col items-start rounded-sm px-2.5 py-2 text-left hover:bg-sunk"
												onclick={() => assignCustomer(c.id)}
												disabled={savingCustomer}
											>
												<span class="text-sm">{c.name ?? c.email ?? 'Kunde'}</span>
												{#if c.name && c.email}<span class="text-xs text-muted">{c.email}</span>{/if}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							<div class="grid grid-cols-2 gap-3">
								<Field label="Anrede" for="nc-salutation">
									<Select id="nc-salutation" bind:value={newCustSalutation}>
										<option value="">—</option>
										<option value="Herr">Herr</option>
										<option value="Frau">Frau</option>
										<option value="D">Divers</option>
									</Select>
								</Field>
								<Field label="Name" for="nc-name"><Input id="nc-name" bind:value={newCustName} placeholder="Max Mustermann" /></Field>
								<Field label="E-Mail" for="nc-email"><Input id="nc-email" type="email" bind:value={newCustEmail} placeholder="kunde@example.com" /></Field>
								<Field label="Telefon" for="nc-phone"><Input id="nc-phone" type="tel" bind:value={newCustPhone} placeholder="+49 …" /></Field>
								<Button variant="solid" class="col-span-2 justify-self-start" onclick={createAndAssignCustomer} disabled={savingCustomer}>
									{savingCustomer ? 'Wird erstellt …' : 'Kunde anlegen & zuweisen'}
								</Button>
							</div>
						{/if}
					{/if}
				</div>
			</Panel>

			<Panel title="Mitarbeiter">
				<div class="flex flex-col gap-4">
					<EmployeeAssignmentPanel entityId={data.id} entityType="calendar_item" />
					<Field label="Hinweis für Mitarbeiter" for="emp-notes-ci">
						<Textarea
							id="emp-notes-ci"
							rows={3}
							placeholder="Sichtbar für alle zugewiesenen Mitarbeiter im Mitarbeiterportal…"
							bind:value={editEmployeeNotes}
							onblur={handleSave}
						/>
					</Field>
				</div>
			</Panel>
		</div>
	</div>
{/if}

<ConfirmationDialog
	bind:open={showDeleteDialog}
	title="Termin löschen"
	message={data ? `Termin „${data.title}“ löschen?` : ''}
	confirmLabel="Löschen"
	onConfirm={handleDelete}
/>
