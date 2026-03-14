<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { Plus, CalendarCheck } from 'lucide-svelte';

	interface CalendarItem {
		id: string;
		title: string;
		description: string | null;
		category: string;
		location: string | null;
		scheduled_date: string | null;
		duration_hours: number;
		status: string;
		created_at: string;
	}

	const CATEGORY_LABELS: Record<string, string> = {
		internal: 'Intern',
		maintenance: 'Wartung',
		training: 'Schulung',
		other: 'Sonstiges'
	};

	let selectedMonth = $state(new Date().toISOString().slice(0, 7));
	let items = $state<CalendarItem[]>([]);
	let loading = $state(true);

	// Create form
	let showCreate = $state(false);
	let createTitle = $state('');
	let createCategory = $state('internal');
	let createDate = $state('');
	let createDuration = $state('0');
	let createLocation = $state('');
	let createDescription = $state('');
	let createLoading = $state(false);
	let createError = $state('');

	$effect(() => {
		loadItems(selectedMonth);
	});

	/**
	 * Loads calendar items for the selected month.
	 *
	 * Called by: $effect on mount and whenever selectedMonth changes.
	 * Purpose: Fetches GET /admin/calendar-items?month=YYYY-MM.
	 */
	async function loadItems(month: string) {
		loading = true;
		try {
			items = await apiGet<CalendarItem[]>(`/api/v1/admin/calendar-items?month=${month}`);
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	/**
	 * Creates a new calendar item via the API.
	 *
	 * Called by: Template (create form submit).
	 * Purpose: POSTs new item and reloads the list on success.
	 */
	async function handleCreate() {
		createError = '';
		if (!createTitle.trim()) {
			createError = 'Titel ist ein Pflichtfeld.';
			return;
		}
		createLoading = true;
		try {
			await apiPost('/api/v1/admin/calendar-items', {
				title: createTitle.trim(),
				category: createCategory,
				scheduled_date: createDate || null,
				duration_hours: parseFloat(createDuration) || 0,
				location: createLocation.trim() || null,
				description: createDescription.trim() || null
			});
			showToast('Termin erstellt', 'success');
			showCreate = false;
			createTitle = '';
			createCategory = 'internal';
			createDate = '';
			createDuration = '0';
			createLocation = '';
			createDescription = '';
			loadItems(selectedMonth);
		} catch (e: unknown) {
			createError = e instanceof Error ? e.message : 'Fehler beim Erstellen';
		} finally {
			createLoading = false;
		}
	}

	/**
	 * Returns a CSS class for the item status badge.
	 *
	 * Called by: Template (status column).
	 * Purpose: Color-codes status for quick visual scanning.
	 *
	 * @param status - Raw status string from the API
	 */
	function statusClass(status: string): string {
		const map: Record<string, string> = {
			scheduled: 'badge-indigo',
			completed: 'badge-green',
			cancelled: 'badge-red'
		};
		return map[status] ?? 'badge-gray';
	}

	/**
	 * Returns the German label for a status string.
	 *
	 * Called by: Template (status badge text).
	 * Purpose: Human-readable status labels in German.
	 *
	 * @param status - Raw status string
	 */
	function statusLabel(status: string): string {
		const map: Record<string, string> = {
			scheduled: 'Geplant',
			completed: 'Abgeschlossen',
			cancelled: 'Abgesagt'
		};
		return map[status] ?? status;
	}
</script>

<svelte:head>
	<title>Termine | AUST Admin</title>
</svelte:head>

<div class="page-header">
	<div class="page-header-left">
		<h1>Termine</h1>
		{#if items.length > 0}
			<span class="count-badge">{items.length}</span>
		{/if}
	</div>
	<button class="btn btn-primary" onclick={() => (showCreate = true)}>
		<Plus size={16} />
		Neuer Termin
	</button>
</div>

<div class="toolbar">
	<div class="month-picker">
		<label for="month-select">Monat:</label>
		<input
			id="month-select"
			type="month"
			bind:value={selectedMonth}
		/>
	</div>
</div>

{#if showCreate}
	<div class="modal-overlay" onclick={() => (showCreate = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2>Neuer Termin</h2>
			{#if createError}
				<div class="alert-error">{createError}</div>
			{/if}
			<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
				<div class="form-grid">
					<div class="field span-2">
						<label for="c-title">Titel *</label>
						<input id="c-title" type="text" bind:value={createTitle} required />
					</div>
					<div class="field">
						<label for="c-cat">Kategorie</label>
						<select id="c-cat" bind:value={createCategory}>
							<option value="internal">Intern</option>
							<option value="maintenance">Wartung</option>
							<option value="training">Schulung</option>
							<option value="other">Sonstiges</option>
						</select>
					</div>
					<div class="field">
						<label for="c-date">Datum</label>
						<input id="c-date" type="date" bind:value={createDate} />
					</div>
					<div class="field">
						<label for="c-dur">Dauer (h)</label>
						<input id="c-dur" type="number" step="0.5" min="0" bind:value={createDuration} />
					</div>
					<div class="field">
						<label for="c-loc">Ort</label>
						<input id="c-loc" type="text" bind:value={createLocation} />
					</div>
					<div class="field span-2">
						<label for="c-desc">Beschreibung</label>
						<textarea id="c-desc" rows={3} bind:value={createDescription}></textarea>
					</div>
				</div>
				<div class="modal-actions">
					<button type="button" class="btn" onclick={() => (showCreate = false)}>Abbrechen</button>
					<button type="submit" class="btn btn-primary" disabled={createLoading}>
						{createLoading ? 'Erstelle...' : 'Erstellen'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if loading}
	<div class="empty-state">Laden...</div>
{:else if items.length === 0}
	<div class="empty-state">
		<CalendarCheck size={40} style="color:#cbd5e0;margin-bottom:0.75rem" />
		<p>Keine Termine in diesem Monat.</p>
	</div>
{:else}
	<div class="table-wrapper">
		<table class="data-table">
			<thead>
				<tr>
					<th>Datum</th>
					<th>Titel</th>
					<th>Kategorie</th>
					<th>Ort</th>
					<th class="num">Dauer (h)</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item}
					<tr class="clickable-row" onclick={() => goto(`/admin/calendar-items/${item.id}`)}>
						<td>{item.scheduled_date ? formatDate(item.scheduled_date) : '—'}</td>
						<td class="title-cell">{item.title}</td>
						<td><span class="badge badge-gray">{CATEGORY_LABELS[item.category] ?? item.category}</span></td>
						<td>{item.location ?? '—'}</td>
						<td class="num">{item.duration_hours.toFixed(1)}</td>
						<td><span class="badge {statusClass(item.status)}">{statusLabel(item.status)}</span></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.page-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}

	.count-badge {
		background: #e0e7ff;
		color: #4338ca;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.125rem 0.5rem;
		border-radius: 999px;
	}

	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.month-picker {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #64748b;
		font-weight: 500;
	}

	.month-picker input {
		padding: 0.375rem 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
	}

	.table-wrapper { overflow-x: auto; }

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.875rem;
	}

	.data-table th {
		text-align: left;
		padding: 0.75rem;
		border-bottom: 2px solid #e2e8f0;
		color: #64748b;
		font-weight: 600;
		white-space: nowrap;
	}

	.data-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #f1f5f9;
	}

	.data-table .num { text-align: right; font-variant-numeric: tabular-nums; }

	.title-cell { font-weight: 500; color: #1e293b; }

	.clickable-row { cursor: pointer; transition: background 150ms; }
	.clickable-row:hover { background: #f8fafc; }

	.badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
	}

	.badge-gray   { background: #f1f5f9; color: #64748b; }
	.badge-indigo { background: #e0e7ff; color: #4338ca; }
	.badge-green  { background: #dcfce7; color: #16a34a; }
	.badge-red    { background: #fee2e2; color: #dc2626; }

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: #94a3b8;
		font-size: 0.875rem;
	}

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal {
		background: #fff;
		border-radius: 0.75rem;
		padding: 1.5rem;
		width: 90%;
		max-width: 540px;
		box-shadow: 0 25px 50px rgba(0,0,0,0.15);
	}

	.modal h2 { margin: 0 0 1rem; font-size: 1.125rem; font-weight: 600; }

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.field { display: flex; flex-direction: column; gap: 0.25rem; }
	.field.span-2 { grid-column: span 2; }

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #64748b;
	}

	.field input,
	.field select,
	.field textarea {
		padding: 0.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		padding: 0.5rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		margin-bottom: 0.75rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms;
	}

	.btn:hover { background: #f8fafc; }
	.btn:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-primary {
		background: #4f46e5;
		color: #fff;
		border-color: #4f46e5;
	}

	.btn-primary:hover:not(:disabled) { background: #4338ca; }
</style>
