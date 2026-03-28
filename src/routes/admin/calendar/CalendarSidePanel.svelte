<script lang="ts">
	import { apiGet, apiPatch, apiPost, apiDelete, apiPut } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { INQUIRY_STATUS_LABELS } from '$lib/utils/status';
	import { formatTime } from '$lib/utils/format';
	import { calculateBruttoCents } from '$lib/utils/pricing';
	import { X, Save, Trash2, Plus, Check, ExternalLink } from 'lucide-svelte';
	import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
	import CapacityEditor from './_components/CapacityEditor.svelte';
	import ConfirmationDialog from '$lib/components/admin/ConfirmationDialog.svelte';
	import EmployeeAssignmentPanel from '$lib/components/admin/EmployeeAssignmentPanel.svelte';

	// ─── Interfaces ──────────────────────────────────────────────────────────────

	interface InquiryItem {
		inquiry_id: string;
		customer_name: string | null;
		customer_email?: string | null;
		departure_address: string | null;
		arrival_address: string | null;
		volume_m3: number | null;
		status: string;
		notes: string | null;
		offer_price_cents: number | null;
		start_time: string;
		end_time: string;
		employees_assigned: number;
		employee_names: string | null;
		day_number?: number | null;
		total_days?: number | null;
		day_notes?: string | null;
		preferred_date?: string | null;
		scheduled_date?: string | null;
	}

	interface CalendarItem {
		id: string;
		title: string;
		category: string;
		location: string | null;
		description?: string | null;
		scheduled_date: string;
		start_time: string;
		end_time: string | null;
		duration_hours: number;
		status: string;
		customer_id?: string | null;
		customer_name?: string | null;
	}

	interface DaySchedule {
		date: string;
		available: boolean;
		capacity: number;
		booked: number;
		remaining: number;
		inquiries: InquiryItem[];
	}

	interface InquiryDay {
		day_date: string;
		day_number: number;
		notes: string | null;
	}

	interface PanelDay {
		kind: 'day';
		date: string;
		schedule: DaySchedule;
	}

	interface PanelInquiry {
		kind: 'inquiry';
		item: InquiryItem;
	}

	interface PanelTermin {
		kind: 'termin';
		item: CalendarItem;
	}

	type PanelSelection = PanelDay | PanelInquiry | PanelTermin | null;

	// ─── Constants ───────────────────────────────────────────────────────────────

	const CATEGORY_LABELS: Record<string, string> = {
		internal: 'Intern',
		maintenance: 'Wartung',
		training: 'Schulung',
		other: 'Sonstiges'
	};

	const INQUIRY_STATUSES = [
		'pending', 'info_requested', 'estimating', 'estimated',
		'offer_ready', 'offer_sent', 'accepted', 'rejected', 'expired',
		'cancelled', 'scheduled', 'completed', 'invoiced', 'paid'
	];

	// ─── Props ────────────────────────────────────────────────────────────────────

	/**
	 * Lifted panel selection state — shared with parent via $bindable so the parent
	 * can open the panel (set to a selection object) and the component can close it (set to null).
	 *
	 * Called by: Parent sets it on entry click; component clears it on close
	 * Purpose: Single source of truth for which panel content to show
	 */
	let {
		panelSelection = $bindable<PanelSelection>(null),
		calendarItems,
		schedule,
		onLoadSchedule
	}: {
		panelSelection: PanelSelection;
		calendarItems: CalendarItem[];
		schedule: DaySchedule[];
		onLoadSchedule: () => Promise<void>;
	} = $props();

	// ─── Helper functions ─────────────────────────────────────────────────────────

	/**
	 * Formats a YYYY-MM-DD date string to German locale display.
	 *
	 * Called by: Template (day panel header date display)
	 * Purpose: Shows dates in German format (Montag, 19. März 2026)
	 *
	 * @param d - ISO date string YYYY-MM-DD
	 * @returns German formatted date string
	 */
	function formatDateDE(d: string): string {
		if (!d) return '';
		const [y, m, day] = d.split('-').map(Number);
		return new Date(y, m - 1, day).toLocaleDateString('de-DE', {
			weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
		});
	}

	// ─── Panel state ──────────────────────────────────────────────────────────────

	// Inquiry panel edit state
	let inqEditStatus = $state('');
	let inqEditNotes = $state('');
	let inqEditPreferredDate = $state('');
	let inqEditStartTime = $state('');
	let inqEditEndTime = $state('');
	let savingInquiry = $state(false);
	let deletingInquiry = $state(false);
	let showDeleteInquiryDialog = $state(false);

	// Inquiry days (multi-day editor)
	let inqDays = $state<InquiryDay[]>([]);
	let inqDaysLoading = $state(false);
	let inqDaysSaving = $state(false);
	let inqDaysDirty = $state(false);
	let inqUntilDate = $state('');

	// Termin panel edit state
	let termEditTitle = $state('');
	let termEditCategory = $state('internal');
	let termEditStatus = $state('scheduled');
	let termEditDate = $state('');
	let termEditStartTime = $state('09:00');
	let termEditEndTime = $state('');
	let termEditDuration = $state('0');
	let termEditLocation = $state('');
	let termEditDescription = $state('');
	let savingTermin = $state(false);
	let deletingTermin = $state(false);
	let showDeleteTerminDialog = $state(false);

	// ─── Derived ─────────────────────────────────────────────────────────────────

	/** Returns the inquiry customer name from panelSelection for the delete dialog message. */
	const pendingDeleteInquiryName = $derived(
		panelSelection?.kind === 'inquiry' ? (panelSelection.item.customer_name ?? 'diese Anfrage') : ''
	);

	/** Returns the termin title from panelSelection for the delete dialog message. */
	const pendingDeleteTerminTitle = $derived(
		panelSelection?.kind === 'termin' ? panelSelection.item.title : ''
	);

	// ─── Selection change effect ──────────────────────────────────────────────────

	// Non-reactive guard: tracks the last seeded selection ID to avoid redundant re-seeding
	let _lastSeededId = '';

	/**
	 * Reacts to panelSelection changes by seeding edit state and loading async data.
	 *
	 * Called by: $effect (automatically whenever panelSelection reference changes)
	 * Purpose: Decouples the parent's "click to open panel" from loading/seeding logic —
	 *          the parent just sets panelSelection, this effect handles the rest.
	 */
	$effect(() => {
		const sel = panelSelection;
		const id = !sel ? ''
		         : sel.kind === 'inquiry' ? `inq:${sel.item.inquiry_id}`
		         : sel.kind === 'termin' ? `term:${sel.item.id}`
		         : `day:${sel.date}`;
		if (id === _lastSeededId) return;
		_lastSeededId = id;
		if (!sel) return;
		if (sel.kind === 'inquiry') {
			inqEditStatus = sel.item.status;
			inqEditNotes = sel.item.notes ?? '';
			inqEditPreferredDate = sel.item.scheduled_date?.slice(0, 10) ?? sel.item.preferred_date?.slice(0, 10) ?? '';
			inqEditStartTime = formatTime(sel.item.start_time);
			inqEditEndTime = formatTime(sel.item.end_time);
			loadInquiryDays(sel.item.inquiry_id);
		} else if (sel.kind === 'termin') {
			termEditTitle = sel.item.title;
			termEditCategory = sel.item.category;
			termEditStatus = sel.item.status;
			termEditDate = sel.item.scheduled_date ?? '';
			termEditStartTime = formatTime(sel.item.start_time);
			termEditEndTime = formatTime(sel.item.end_time);
			termEditDuration = String(sel.item.duration_hours);
			termEditLocation = sel.item.location ?? '';
			termEditDescription = sel.item.description ?? '';
		}
	});

	// ─── Close panel ─────────────────────────────────────────────────────────────

	/**
	 * Closes the side panel by clearing panelSelection.
	 *
	 * Called by: Template (× button, drag handle, backdrop), ConfirmationDialog after delete
	 * Purpose: Hides the panel and resets selection state.
	 */
	function closePanel() {
		panelSelection = null;
	}

	// ─── Inquiry: multi-day editor ────────────────────────────────────────────────

	/**
	 * Loads scheduled days for the currently selected inquiry.
	 *
	 * Called by: $effect (when panelSelection changes to kind='inquiry')
	 * Purpose: Populates inqDays for the multi-day date range editor.
	 *
	 * @param inqId - UUID of the inquiry
	 */
	async function loadInquiryDays(inqId: string) {
		inqDaysLoading = true;
		inqDaysDirty = false;
		try {
			const res = await apiGet<InquiryDay[]>(`/api/v1/inquiries/${inqId}/days`);
			const days = Array.isArray(res) ? res : [];
			inqDays = days;
			inqUntilDate = days.length > 1 ? days[days.length - 1].day_date : '';
		} catch {
			inqDays = [];
		} finally {
			inqDaysLoading = false;
		}
	}

	/**
	 * Generates the inquiry day list from the inquiry's origin date to inqUntilDate.
	 *
	 * Called by: saveInquiryDays
	 * Purpose: User picks an end date; all dates in the range are auto-generated
	 *          instead of adding days one by one.
	 *
	 * @returns false if the range is invalid (until before origin, or no origin date)
	 */
	function applyInquiryDateRange(): boolean {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return false;
		const originStr = panelSelection.item.scheduled_date?.slice(0, 10)
			?? panelSelection.item.preferred_date?.slice(0, 10) ?? '';
		if (!originStr) return false;
		const origin = new Date(originStr + 'T00:00:00');
		const until  = inqUntilDate ? new Date(inqUntilDate + 'T00:00:00') : origin;
		if (until < origin) return false;
		const days: InquiryDay[] = [];
		const cur = new Date(origin);
		let num = 1;
		while (cur <= until) {
			const y = cur.getFullYear();
			const m = String(cur.getMonth() + 1).padStart(2, '0');
			const d = String(cur.getDate()).padStart(2, '0');
			days.push({ day_date: `${y}-${m}-${d}`, day_number: num++, notes: null });
			cur.setDate(cur.getDate() + 1);
		}
		inqDays = days;
		inqDaysDirty = true;
		return true;
	}

	/**
	 * Persists the current inquiry day list via PUT /api/v1/inquiries/{id}/days.
	 *
	 * Called by: Template (Zeitraum speichern button in inquiry panel)
	 * Purpose: Full-replace semantics — sends the complete day list to the API.
	 */
	async function saveInquiryDays() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		if (!applyInquiryDateRange()) {
			showToast('Ungültiger Zeitraum', 'error');
			return;
		}
		const inqId = panelSelection.item.inquiry_id;
		inqDaysSaving = true;
		try {
			await apiPut(`/api/v1/inquiries/${inqId}/days`, { days: inqDays });
			inqDaysDirty = false;
			showToast('Tage gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			inqDaysSaving = false;
		}
	}

	// ─── Inquiry: save / delete ───────────────────────────────────────────────────

	/**
	 * Saves editable inquiry fields (status, dates, times) via PATCH.
	 *
	 * Called by: Template (Speichern button in inquiry panel)
	 * Purpose: PATCHes /api/v1/inquiries/{id} with updated status and dates,
	 *          then reloads the calendar schedule to keep chips in sync.
	 */
	async function saveInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inq = panelSelection.item;
		savingInquiry = true;
		try {
			await apiPatch(`/api/v1/inquiries/${inq.inquiry_id}`, {
				status: inqEditStatus || undefined,
				notes: inqEditNotes || null,
				preferred_date: inqEditPreferredDate || null,
				start_time: inqEditStartTime ? (inqEditStartTime.length === 5 ? inqEditStartTime + ':00' : inqEditStartTime) : undefined,
				end_time: inqEditEndTime ? (inqEditEndTime.length === 5 ? inqEditEndTime + ':00' : inqEditEndTime) : null,
			});
			showToast('Anfrage gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingInquiry = false;
		}
	}

	/**
	 * Shows the delete confirmation dialog for the selected inquiry.
	 *
	 * Called by: Template (Löschen button in inquiry panel)
	 * Purpose: Records intent and shows dialog before the destructive action.
	 */
	function deleteInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		showDeleteInquiryDialog = true;
	}

	/**
	 * Executes the inquiry deletion after dialog confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm)
	 * Purpose: DELETEs /api/v1/inquiries/{id}, closes panel and reloads calendar.
	 */
	async function confirmDeleteInquiry() {
		if (!panelSelection || panelSelection.kind !== 'inquiry') return;
		const inq = panelSelection.item;
		deletingInquiry = true;
		try {
			await apiDelete(`/api/v1/inquiries/${inq.inquiry_id}`);
			showToast('Anfrage gelöscht', 'success');
			closePanel();
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingInquiry = false;
		}
	}

	// ─── Termin: save / delete ────────────────────────────────────────────────────

	/**
	 * Saves editable termin fields via PATCH.
	 *
	 * Called by: Template (Speichern button in termin panel)
	 * Purpose: PATCHes /api/v1/admin/calendar-items/{id} with updated fields,
	 *          then reloads the calendar schedule.
	 */
	async function saveTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ci = panelSelection.item;
		savingTermin = true;
		try {
			await apiPatch(`/api/v1/admin/calendar-items/${ci.id}`, {
				title: termEditTitle,
				category: termEditCategory,
				status: termEditStatus,
				scheduled_date: termEditDate || null,
				start_time: termEditStartTime ? (termEditStartTime.length === 5 ? termEditStartTime + ':00' : termEditStartTime) : undefined,
				end_time: termEditEndTime ? (termEditEndTime.length === 5 ? termEditEndTime + ':00' : termEditEndTime) : null,
				duration_hours: parseFloat(termEditDuration) || 0,
				location: termEditLocation || null,
				description: termEditDescription || null,
			});
			showToast('Termin gespeichert', 'success');
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler beim Speichern', 'error');
		} finally {
			savingTermin = false;
		}
	}

	/**
	 * Shows the delete confirmation dialog for the selected termin.
	 *
	 * Called by: Template (Löschen button in termin panel)
	 * Purpose: Shows confirmation dialog before the destructive delete.
	 */
	function deleteTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		showDeleteTerminDialog = true;
	}

	/**
	 * Executes the termin deletion after dialog confirmation.
	 *
	 * Called by: ConfirmationDialog (onConfirm)
	 * Purpose: DELETEs /api/v1/admin/calendar-items/{id}, closes panel and reloads.
	 */
	async function confirmDeleteTermin() {
		if (!panelSelection || panelSelection.kind !== 'termin') return;
		const ci = panelSelection.item;
		deletingTermin = true;
		try {
			await apiDelete(`/api/v1/admin/calendar-items/${ci.id}`);
			showToast('Termin gelöscht', 'success');
			closePanel();
			await onLoadSchedule();
		} catch (e: unknown) {
			showToast(e instanceof Error ? e.message : 'Fehler', 'error');
		} finally {
			deletingTermin = false;
		}
	}
</script>

<!-- ─── Side panel (desktop) / bottom sheet (mobile) ──────────────────────── -->
<aside class="side-panel" class:panel-visible={panelSelection !== null} aria-label="Details">
	<!-- Drag handle (mobile only) -->
	<div class="sheet-handle-bar" onclick={closePanel} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && closePanel()}>
		<span class="sheet-handle"></span>
	</div>

	{#if !panelSelection}
		<div class="panel-placeholder">
			<span class="placeholder-icon">📋</span>
			<p>Klicke auf einen Eintrag</p>
		</div>
	{:else}
		<div class="panel-header">
			{#if panelSelection.kind === 'day'}
				<h2 class="panel-title">{formatDateDE(panelSelection.date)}</h2>
			{:else if panelSelection.kind === 'inquiry'}
				<div class="panel-title-block">
					<h2 class="panel-title">{panelSelection.item.customer_name ?? 'Anfrage'}</h2>
					{#if panelSelection.item.scheduled_date || panelSelection.item.preferred_date}
						<span class="panel-subtitle">{(panelSelection.item.scheduled_date?.slice(0,10) ?? panelSelection.item.preferred_date?.slice(0,10) ?? '').split('-').reverse().join('.')}</span>
					{/if}
				</div>
			{:else}
				<h2 class="panel-title">{panelSelection.item.title}</h2>
			{/if}
			<button class="panel-close" onclick={closePanel} title="Schließen"><X size={16} /></button>
		</div>

		<div class="panel-body">

			<!-- ─── DAY PANEL ──────────────────────────────────────────── -->
			{#if panelSelection.kind === 'day'}
				{@const ds = panelSelection.schedule}
				{@const dayPanelDate = panelSelection.date}
				{@const dayTermine = calendarItems.filter(ci => ci.scheduled_date?.startsWith(dayPanelDate))}

				<div class="panel-section">
					<div class="panel-kv">
						<span class="kv-label">Gebucht</span>
						<span class="kv-value">{ds.booked} / {ds.capacity}</span>
					</div>
					<div class="panel-kv">
						<span class="kv-label">Verbleibend</span>
						<span class="kv-value">{ds.remaining}</span>
					</div>
				</div>

				<CapacityEditor
					date={ds.date.split('T')[0]}
					currentCapacity={ds.capacity}
					onSaved={async () => {
						await onLoadSchedule();
						const dateStr = ds.date.split('T')[0];
						const updated = schedule.find(s => s.date.split('T')[0] === dateStr);
						if (updated) {
							panelSelection = { kind: 'day', date: dateStr, schedule: updated };
						}
					}}
				/>

				{#if ds.inquiries.length > 0 || dayTermine.length > 0}
					<div class="panel-section">
						<div class="section-title">Tagesplan ({ds.inquiries.length + dayTermine.length})</div>
						{#each ds.inquiries as inq}
							<div class="day-entry">
								<div class="day-entry-top">
									<button class="entry-link-btn" onclick={(e) => { e.stopPropagation(); panelSelection = { kind: 'inquiry', item: inq }; }}>
										{inq.customer_name || 'Unbekannt'}
									</button>
									<StatusBadge status={inq.status} />
									<span class="time-badge">{formatTime(inq.start_time)} – {formatTime(inq.end_time)}</span>
								</div>
								{#if inq.departure_address || inq.arrival_address}
									<span class="entry-route">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
								{/if}
								<a href="/admin/inquiries/{inq.inquiry_id}" class="entry-detail-link">
									<ExternalLink size={11} /> Detail öffnen
								</a>
							</div>
						{/each}
						{#each dayTermine as ci}
							<div class="day-entry day-entry-termin">
								<div class="day-entry-top">
									<button class="entry-link-btn" onclick={(e) => { e.stopPropagation(); panelSelection = { kind: 'termin', item: ci }; }}>
										{ci.title}
									</button>
									<span class="cat-badge">{CATEGORY_LABELS[ci.category] ?? ci.category}</span>
									<span class="time-badge">{formatTime(ci.start_time)}{ci.end_time ? ' – ' + formatTime(ci.end_time) : ''}</span>
								</div>
								{#if ci.location}
									<span class="entry-route">{ci.location}</span>
								{/if}
								<a href="/admin/calendar-items/{ci.id}" class="entry-detail-link">
									<ExternalLink size={11} /> Detail öffnen
								</a>
							</div>
						{/each}
					</div>
				{:else}
					<p class="panel-empty">Keine Einträge</p>
				{/if}

			<!-- ─── INQUIRY PANEL ───────────────────────────────────────── -->
			{:else if panelSelection.kind === 'inquiry'}
				{@const inq = panelSelection.item}

				<div class="panel-section">
					<div class="panel-kv">
						<span class="kv-label">E-Mail</span>
						<span class="kv-value kv-muted">{inq.customer_email ?? '—'}</span>
					</div>
					{#if inq.departure_address || inq.arrival_address}
						<div class="panel-kv">
							<span class="kv-label">Route</span>
							<span class="kv-value kv-muted">{inq.departure_address || '?'} → {inq.arrival_address || '?'}</span>
						</div>
					{/if}
					{#if inq.volume_m3}
						<div class="panel-kv">
							<span class="kv-label">Volumen</span>
							<span class="kv-value">{inq.volume_m3.toFixed(1)} m³</span>
						</div>
					{/if}
					{#if inq.offer_price_cents}
						<div class="panel-kv">
							<span class="kv-label">Angebotspreis</span>
							<span class="kv-value">{(calculateBruttoCents(inq.offer_price_cents) / 100).toFixed(0)} € brutto</span>
						</div>
					{/if}
				</div>

				<div class="panel-section">
					<div class="section-title">Bearbeiten</div>
					<div class="field">
						<label for="inq-status">Status</label>
						<select id="inq-status" class="neu-input" bind:value={inqEditStatus}>
							{#each INQUIRY_STATUSES as s}
								<option value={s}>{INQUIRY_STATUS_LABELS[s] ?? s}</option>
							{/each}
						</select>
					</div>
					<div class="field">
						<label for="inq-pref-date">Datum</label>
						<input id="inq-pref-date" type="date" class="neu-input" bind:value={inqEditPreferredDate} />
					</div>
					<div class="field-row">
						<div class="field">
							<label for="inq-start">Startzeit</label>
							<input id="inq-start" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={inqEditStartTime} />
						</div>
						<div class="field">
							<label for="inq-end">Endzeit</label>
							<input id="inq-end" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={inqEditEndTime} />
						</div>
					</div>
					<div class="field">
						<label for="inq-notes">Notizen</label>
						<textarea id="inq-notes" rows={3} class="neu-input" bind:value={inqEditNotes}></textarea>
					</div>
					<div class="panel-actions">
						<button class="btn btn-primary btn-sm" onclick={saveInquiry} disabled={savingInquiry}>
							<Save size={13} />
							{savingInquiry ? 'Speichern...' : 'Speichern'}
						</button>
						<a href="/admin/inquiries/{inq.inquiry_id}" class="btn btn-ghost btn-sm">
							<ExternalLink size={13} /> Detail
						</a>
						<button class="btn btn-danger btn-sm" onclick={deleteInquiry} disabled={deletingInquiry}>
							{deletingInquiry ? '...' : 'Löschen'}
						</button>
					</div>
				</div>

				<!-- Employee assignments -->
				<div class="panel-section">
					<EmployeeAssignmentPanel
						entityId={panelSelection.item.inquiry_id}
						entityType="inquiry"
						preferredDate={panelSelection.item.scheduled_date ?? panelSelection.item.preferred_date}
						onUpdated={() => onLoadSchedule()}
					/>
				</div>

				<!-- Multi-day scheduling section -->
				<div class="panel-section">
					<div class="section-title">Mehrtägiger Termin</div>
					{#if inqDaysLoading}
						<p class="panel-loading">Laden...</p>
					{:else}
						{@const originStr = panelSelection.item.scheduled_date?.slice(0,10) ?? panelSelection.item.preferred_date?.slice(0,10) ?? ''}
						<div class="field-row">
							<div class="field">
								<label>Von</label>
								<span class="day-origin-label">{originStr ? originStr.split('-').reverse().join('.') : '—'}</span>
							</div>
							<div class="field">
								<label for="inq-until">Bis</label>
								<input id="inq-until" type="date" class="neu-input" min={originStr} bind:value={inqUntilDate} />
							</div>
						</div>
						{#if inqDays.length > 1}
							<p class="day-range-summary">{inqDays.length} Tage geplant</p>
						{/if}
						<div class="days-actions">
							<button class="btn btn-primary btn-sm" onclick={saveInquiryDays} disabled={inqDaysSaving || !inqUntilDate}>
								{inqDaysSaving ? '...' : 'Zeitraum speichern'}
							</button>
						</div>
					{/if}
				</div>

			<!-- ─── TERMIN PANEL ────────────────────────────────────────── -->
			{:else if panelSelection.kind === 'termin'}
				{@const ci = panelSelection.item}

				<div class="panel-section">
					<div class="section-title">Bearbeiten</div>
					<div class="field">
						<label for="term-title">Titel</label>
						<input id="term-title" type="text" class="neu-input" bind:value={termEditTitle} />
					</div>
					<div class="field-row">
						<div class="field">
							<label for="term-cat">Kategorie</label>
							<select id="term-cat" class="neu-input" bind:value={termEditCategory}>
								<option value="internal">Intern</option>
								<option value="maintenance">Wartung</option>
								<option value="training">Schulung</option>
								<option value="other">Sonstiges</option>
							</select>
						</div>
						<div class="field">
							<label for="term-status">Status</label>
							<select id="term-status" class="neu-input" bind:value={termEditStatus}>
								<option value="scheduled">Geplant</option>
								<option value="completed">Abgeschlossen</option>
								<option value="cancelled">Abgesagt</option>
							</select>
						</div>
					</div>
					<div class="field">
						<label for="term-date">Datum</label>
						<input id="term-date" type="date" class="neu-input" bind:value={termEditDate} />
					</div>
					<div class="field-row">
						<div class="field">
							<label for="term-start">Startzeit</label>
							<input id="term-start" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={termEditStartTime} />
						</div>
						<div class="field">
							<label for="term-end">Endzeit</label>
							<input id="term-end" type="text" inputmode="decimal" placeholder="HH:MM" maxlength="5" pattern="[0-9]{2}:[0-5][0-9]" class="neu-input" bind:value={termEditEndTime} />
						</div>
					</div>
					<div class="field">
						<label for="term-dur">Dauer (h)</label>
						<input id="term-dur" type="number" step="0.5" min="0" class="neu-input" bind:value={termEditDuration} />
					</div>
					<div class="field">
						<label for="term-loc">Ort</label>
						<input id="term-loc" type="text" class="neu-input" bind:value={termEditLocation} />
					</div>
					<div class="field">
						<label for="term-desc">Beschreibung</label>
						<textarea id="term-desc" rows={3} class="neu-input" bind:value={termEditDescription}></textarea>
					</div>
					{#if ci.customer_name}
						<div class="panel-kv">
							<span class="kv-label">Kunde</span>
							<span class="kv-value">{ci.customer_name}</span>
						</div>
					{/if}
					<div class="panel-actions">
						<button class="btn btn-primary btn-sm" onclick={saveTermin} disabled={savingTermin}>
							<Save size={13} />
							{savingTermin ? 'Speichern...' : 'Speichern'}
						</button>
						<a href="/admin/calendar-items/{ci.id}" class="btn btn-ghost btn-sm">
							<ExternalLink size={13} /> Detail
						</a>
						<button class="btn btn-danger btn-sm" onclick={deleteTermin} disabled={deletingTermin}>
							<Trash2 size={13} />
							{deletingTermin ? '...' : 'Löschen'}
						</button>
					</div>
				</div>

				<!-- Employee assignments -->
				<div class="panel-section">
					<EmployeeAssignmentPanel
						entityId={panelSelection.item.id}
						entityType="calendar_item"
						onUpdated={() => onLoadSchedule()}
					/>
				</div>
			{/if}

		</div>
	{/if}
</aside>

<ConfirmationDialog
	bind:open={showDeleteInquiryDialog}
	title="Anfrage löschen"
	message={`Anfrage von „${pendingDeleteInquiryName}" löschen?`}
	confirmLabel="Löschen"
	loading={deletingInquiry}
	onConfirm={confirmDeleteInquiry}
/>

<ConfirmationDialog
	bind:open={showDeleteTerminDialog}
	title="Termin löschen"
	message={`Termin „${pendingDeleteTerminTitle}" löschen?`}
	confirmLabel="Löschen"
	loading={deletingTermin}
	onConfirm={confirmDeleteTermin}
/>

<style>
	/* ─── Side panel container ─────────────────────────────────────────────────── */
	.side-panel {
		width: 0;
		overflow: hidden;
		flex-shrink: 0;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		box-shadow: var(--dt-shadow-ambient);
		transition: width 280ms ease, opacity 280ms ease;
		opacity: 0;
		display: flex;
		flex-direction: column;
		max-height: calc(100vh - 140px);
		position: sticky;
		top: 1rem;
	}

	.side-panel.panel-visible {
		width: 380px;
		opacity: 1;
	}

	/* ─── Panel placeholder ────────────────────────────────────────────────────── */
	.panel-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--dt-on-surface-variant);
		gap: 0.5rem;
	}
	.placeholder-icon { font-size: 2rem; }
	.panel-placeholder p { font-size: 0.875rem; }

	/* ─── Panel header ─────────────────────────────────────────────────────────── */
	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 1rem 1rem 0.75rem;
		flex-shrink: 0;
		background: var(--dt-glass-bg);
		backdrop-filter: var(--dt-glass-blur);
		border-bottom: var(--dt-glass-border);
		border-radius: var(--dt-radius-lg) var(--dt-radius-lg) 0 0;
	}
	.panel-title-block {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.panel-subtitle {
		font-size: 0.75rem;
		font-weight: 400;
		color: rgba(255,255,255,0.7);
		margin: 0;
	}
	.panel-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--dt-on-primary);
		margin: 0;
		line-height: 1.3;
		word-break: break-word;
	}
	.panel-close {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: var(--dt-radius-sm);
		color: rgba(255,255,255,0.7);
		background: rgba(255,255,255,0.12);
		border: var(--dt-glass-border);
		transition: background var(--dt-transition), color var(--dt-transition);
	}
	.panel-close:hover { background: rgba(255,255,255,0.22); color: var(--dt-on-primary); }

	/* ─── Panel body ───────────────────────────────────────────────────────────── */
	.panel-body {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	/* ─── Panel sections ───────────────────────────────────────────────────────── */
	.panel-section {
		padding: 0.75rem 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.panel-section + .panel-section {
		border-top: 1px solid var(--dt-surface-container);
	}

	.section-title {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--dt-primary);
		margin-bottom: 0.125rem;
	}

	.panel-kv { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
	.kv-label { font-size: 0.75rem; font-weight: 600; color: var(--dt-on-surface-variant); flex-shrink: 0; }
	.kv-value { font-size: 0.8125rem; color: var(--dt-on-surface); font-weight: 500; text-align: right; }
	.kv-muted { color: var(--dt-on-surface-variant); font-weight: 400; }

	.panel-empty { font-size: 0.8125rem; color: var(--dt-on-surface-variant); margin: 0; }
	.panel-loading { font-size: 0.8125rem; color: var(--dt-on-surface-variant); margin: 0; }

	/* ─── Day panel entries ────────────────────────────────────────────────────── */
	.day-entry {
		background: var(--dt-surface-container-low);
		border-radius: var(--dt-radius-sm);
		padding: 0.5rem 0.625rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.day-entry-termin { background: rgba(168, 57, 0, 0.06); }
	.day-entry-top { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
	.entry-link-btn {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--dt-primary);
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color var(--dt-transition);
	}
	.entry-link-btn:hover { color: var(--dt-secondary); text-decoration: underline; }
	.entry-route { font-size: 0.7rem; color: var(--dt-on-surface-variant); }
	.entry-detail-link {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: 0.7rem;
		color: var(--dt-secondary);
		text-decoration: none;
		align-self: flex-start;
		transition: color var(--dt-transition);
	}
	.entry-detail-link:hover { text-decoration: underline; }
	.cat-badge {
		font-size: 0.6rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--dt-secondary-container);
		color: var(--dt-on-secondary-container);
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}
	.time-badge {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--dt-on-surface-variant);
		margin-left: auto;
		white-space: nowrap;
	}

	/* ─── Form inputs ──────────────────────────────────────────────────────────── */
	.neu-input {
		padding: 0.4rem 0.6rem;
		background: var(--dt-surface-container-high);
		border: none;
		border-radius: var(--dt-radius-sm);
		color: var(--dt-on-surface);
		font-size: 0.8125rem;
		outline: none;
		width: 100%;
		font-family: inherit;
		resize: vertical;
		transition: var(--dt-transition);
	}
	.neu-input:focus {
		background: var(--dt-surface-container-lowest);
		border-bottom: 2px solid var(--dt-primary);
	}
	select.neu-input { appearance: auto; }

	/* ─── Form field layout ────────────────────────────────────────────────────── */
	.field { display: flex; flex-direction: column; gap: 0.2rem; }
	.field label { font-size: 0.6875rem; font-weight: 600; color: var(--dt-on-surface-variant); text-transform: uppercase; }
	.field-row { display: flex; gap: 0.5rem; }
	.field-row .field { flex: 1; }

	/* ─── Panel action buttons ─────────────────────────────────────────────────── */
	.panel-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.25rem; }

	/* ─── Buttons ──────────────────────────────────────────────────────────────── */
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.5rem 1rem;
		border-radius: var(--dt-radius-md);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background var(--dt-transition);
		white-space: nowrap;
		border: var(--dt-ghost-border);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-on-surface);
		text-decoration: none;
	}
	.btn-sm { padding: 0.35rem 0.7rem; font-size: 0.8rem; border-radius: var(--dt-radius-sm); }
	.btn-primary {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, var(--dt-primary-container), var(--dt-primary));
	}
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-ghost {
		background: var(--dt-surface-container-high);
		color: var(--dt-on-surface-variant);
		border: none;
		text-decoration: none;
	}
	.btn-ghost:hover { background: var(--dt-surface-container); color: var(--dt-on-surface); }
	.btn-danger {
		background: linear-gradient(135deg, var(--dt-secondary), #8a2e00);
		color: var(--dt-on-primary);
		border: none;
	}
	.btn-danger:hover:not(:disabled) {
		background: linear-gradient(135deg, #8a2e00, var(--dt-secondary));
	}
	.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

	/* ─── Multi-day editor ─────────────────────────────────────────────────────── */
	.days-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; margin-top: 0.25rem; }
	.day-origin-label { font-size: 0.875rem; font-weight: 600; color: var(--dt-on-surface); display: block; padding: 0.25rem 0; }
	.day-range-summary { font-size: 0.75rem; color: var(--dt-on-surface-variant); margin: 0.25rem 0 0; }

	/* ─── Mobile: bottom sheet handle ─────────────────────────────────────────── */
	.sheet-handle-bar {
		display: none;
		justify-content: center;
		padding: 10px 0 6px;
		cursor: pointer;
		flex-shrink: 0;
	}
	.sheet-handle {
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: var(--dt-outline-variant);
	}

	/* ─── Tablet: stack below calendar ────────────────────────────────────────── */
	@media (min-width: 769px) and (max-width: 900px) {
		.side-panel { width: 100%; max-height: none; position: static; opacity: 1; transition: none; }
		.side-panel:not(.panel-visible) { display: none; }
		.sheet-handle-bar { display: none; }
	}

	/* ─── Mobile: full-width bottom sheet ─────────────────────────────────────── */
	@media (max-width: 768px) {
		.side-panel {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			width: 100%;
			max-height: 85vh;
			border-radius: 20px 20px 0 0;
			top: auto;
			transform: translateY(105%);
			opacity: 1;
			transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
			z-index: 510;
			overflow-y: auto;
		}
		.side-panel.panel-visible {
			transform: translateY(0);
			width: 100%;
		}
		.sheet-handle-bar { display: flex; }
	}
</style>
