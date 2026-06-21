<script lang="ts">
	import { workerGet, workerFetch, worker, bumpWorkerData } from '$lib/stores/worker.svelte';
	import { normalizeTime } from '$lib/utils/time';
	import { Clock, MapPin } from 'lucide-svelte';

	interface Pending {
		entry_type: string; // 'job' | 'item'
		inquiry_id: string | null;
		calendar_item_id: string | null;
		job_date: string; // YYYY-MM-DD
		title: string | null;
		customer_name: string | null;
		origin_city: string | null;
		destination_city: string | null;
		location: string | null;
		start_time: string | null;
	}

	let pending = $state<Pending[]>([]);
	let loaded = $state(false);
	let idx = $state(0);

	let clockIn = $state('');
	let clockOut = $state('');
	let breakMin = $state('');
	let saving = $state(false);
	let error = $state('');

	const current = $derived(pending[idx]);

	// Load the worker's overdue assignments once they are authenticated. The layout
	// persists across navigation, so this runs once per session (the `loaded` guard).
	$effect(() => {
		if (worker.isAuthenticated && !loaded) {
			loaded = true;
			void load();
		}
	});

	async function load() {
		try {
			pending = await workerGet<Pending[]>('/api/v1/employee/pending-hours');
		} catch {
			pending = [];
		}
	}

	const ready = $derived(!!normalizeTime(clockIn) && !!normalizeTime(clockOut));

	function label(p: Pending): string {
		if (p.entry_type === 'item') return p.title ?? 'Termin';
		return p.customer_name ?? 'Auftrag';
	}

	function place(p: Pending): string {
		if (p.entry_type === 'item') return p.location ?? '';
		return [p.origin_city, p.destination_city].filter(Boolean).join(' → ');
	}

	function fmtDate(d: string): string {
		return new Date(d + 'T12:00:00').toLocaleDateString('de-DE', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});
	}

	/**
	 * Logs the hours for the current overdue assignment, then advances to the next.
	 * The modal cannot be dismissed until every overdue assignment is logged.
	 */
	async function save() {
		const p = current;
		if (!p) return;
		const inNorm = normalizeTime(clockIn);
		const outNorm = normalizeTime(clockOut);
		if (!inNorm || !outNorm) {
			error = 'Bitte Beginn und Ende eintragen (z.B. 8 oder 7.30).';
			return;
		}

		saving = true;
		error = '';
		try {
			const anchor = p.job_date;
			const toIso = (t: string) => new Date(`${anchor}T${t}:00`).toISOString();
			const path =
				p.entry_type === 'item'
					? `/api/v1/employee/items/${p.calendar_item_id}/clock?date=${p.job_date}`
					: `/api/v1/employee/jobs/${p.inquiry_id}/clock?date=${p.job_date}`;

			await workerFetch(path, {
				method: 'PATCH',
				body: JSON.stringify({
					employee_clock_in: toIso(inNorm),
					employee_clock_out: toIso(outNorm),
					employee_break_minutes: breakMin ? parseInt(breakMin, 10) : null,
				}),
			});

			// advance to the next overdue assignment; reset the inputs
			idx += 1;
			clockIn = '';
			clockOut = '';
			breakMin = '';

			// last one done — let the schedule re-fetch (the logged job drops off)
			if (idx >= pending.length) bumpWorkerData();
		} catch {
			error = 'Speichern fehlgeschlagen. Bitte erneut versuchen.';
		} finally {
			saving = false;
		}
	}
</script>

{#if current}
	<!-- Blocking overlay: no close affordance, cannot be dismissed until logged. -->
	<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="ph-title">
		<div class="sheet">
			<div class="badge"><Clock size={18} /></div>
			<h2 id="ph-title">Stunden nachtragen</h2>
			<p class="lead">
				Bitte trage deine Arbeitszeit für diesen vergangenen Einsatz ein. Das Fenster
				schließt erst, wenn alle offenen Einsätze erfasst sind.
			</p>

			{#if pending.length > 1}
				<div class="counter">{idx + 1} von {pending.length}</div>
			{/if}

			<div class="job-box">
				<div class="job-label">{label(current)}</div>
				<div class="job-date">{fmtDate(current.job_date)}</div>
				{#if place(current)}
					<div class="job-place"><MapPin size={13} /> {place(current)}</div>
				{/if}
			</div>

			<div class="fields">
				<div class="field">
					<label for="ph-in">Beginn</label>
					<input
						id="ph-in"
						type="text"
						inputmode="decimal"
						placeholder="z.B. 8 oder 7.30"
						maxlength="5"
						class="time-input"
						bind:value={clockIn}
						onblur={() => { const n = normalizeTime(clockIn); if (n) clockIn = n; }}
					/>
				</div>
				<div class="field">
					<label for="ph-out">Ende</label>
					<input
						id="ph-out"
						type="text"
						inputmode="decimal"
						placeholder="z.B. 17 oder 17.00"
						maxlength="5"
						class="time-input"
						bind:value={clockOut}
						onblur={() => { const n = normalizeTime(clockOut); if (n) clockOut = n; }}
					/>
				</div>
				<div class="field">
					<label for="ph-break">Pause (Min.)</label>
					<input
						id="ph-break"
						type="text"
						inputmode="numeric"
						placeholder="30"
						maxlength="3"
						class="time-input"
						bind:value={breakMin}
					/>
				</div>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button class="save-btn" onclick={save} disabled={saving || !ready}>
				{saving ? 'Speichern…' : 'Stunden speichern'}
			</button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(15, 23, 42, 0.72);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		padding: 1rem;
	}

	@media (min-width: 640px) {
		.overlay { align-items: center; }
	}

	.sheet {
		width: 100%;
		max-width: 440px;
		background: #fff;
		border-radius: 1rem;
		padding: 1.5rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom));
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.25);
	}

	.badge {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #e0e7ff;
		color: #4338ca;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1e293b;
		margin: 0 0 0.5rem;
	}

	.lead {
		font-size: 0.875rem;
		color: #64748b;
		margin: 0 0 1rem;
		line-height: 1.4;
	}

	.counter {
		font-size: 0.75rem;
		font-weight: 600;
		color: #4338ca;
		margin-bottom: 0.5rem;
	}

	.job-box {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 0.625rem;
		padding: 0.75rem 0.875rem;
		margin-bottom: 1rem;
	}

	.job-label {
		font-size: 1rem;
		font-weight: 700;
		color: #1e293b;
	}

	.job-date {
		font-size: 0.8125rem;
		color: #475569;
		margin-top: 0.125rem;
	}

	.job-place {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.8125rem;
		color: #64748b;
		margin-top: 0.25rem;
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		margin-bottom: 0.75rem;
	}

	.field {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.field label {
		font-size: 0.9375rem;
		color: #475569;
		font-weight: 500;
		min-width: 6rem;
	}

	.time-input {
		flex: 1;
		max-width: 130px;
		padding: 0.625rem 0.75rem;
		border: 1.5px solid #e2e8f0;
		border-radius: 0.5rem;
		font-size: 1rem;
		text-align: center;
		outline: none;
		font-variant-numeric: tabular-nums;
	}

	.time-input:focus { border-color: #4f46e5; }

	.error {
		font-size: 0.8125rem;
		color: #dc2626;
		margin: 0 0 0.75rem;
	}

	.save-btn {
		width: 100%;
		padding: 0.8rem 1rem;
		background: #4f46e5;
		color: #fff;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 150ms;
	}

	.save-btn:hover:not(:disabled) { background: #4338ca; }
	.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
