<script lang="ts">
	import { apiGet, apiPost, formatDate } from '$lib/utils/api.svelte';
	import { Phone, CheckCircle, Clock, PhoneCall, Trash2, AlarmClock } from 'lucide-svelte';

	interface FlashContact {
		id: string;
		name: string;
		phone: string;
		time_preference: string;
		created_at: string;
		reminder_sent_at: string | null;
		handled_at: string | null;
		next_remind_at: string | null;
		dismissed_at: string | null;
	}

	const TIME_LABELS: Record<string, string> = {
		gleich: 'Jetzt gleich',
		vormittag: 'Vormittag',
		nachmittag: 'Nachmittag'
	};

	let contacts = $state<FlashContact[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let handlingId = $state<string | null>(null);

	const open = $derived(contacts.filter((c) => !c.handled_at && !c.dismissed_at));
	const done = $derived(contacts.filter((c) => !!c.handled_at));
	const dismissed = $derived(contacts.filter((c) => !!c.dismissed_at));

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await apiGet<FlashContact[]>('/api/v1/admin/flash-contacts');
			contacts = res;
		} catch {
			error = 'Laden fehlgeschlagen.';
		} finally {
			loading = false;
		}
	}

	async function markHandled(id: string) {
		handlingId = id;
		try {
			await apiPost(`/api/v1/admin/flash-contacts/${id}/handle`, {});
			contacts = contacts.map((c) =>
				c.id === id ? { ...c, handled_at: new Date().toISOString() } : c
			);
		} catch {
			error = 'Aktion fehlgeschlagen.';
		} finally {
			handlingId = null;
		}
	}

	$effect(() => {
		load();
	});
</script>

<div class="page">
	<div class="page-header">
		<div class="page-title">
			<PhoneCall size={22} />
			<h1>Rückruf-Anfragen</h1>
		</div>
		<button class="btn-refresh" onclick={load} disabled={loading}>
			{loading ? 'Lädt …' : 'Aktualisieren'}
		</button>
	</div>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if loading && contacts.length === 0}
		<p class="empty">Lädt …</p>
	{:else}
		<section class="section">
			<h2 class="section-title">
				<Clock size={16} />
				Offen ({open.length})
			</h2>
			{#if open.length === 0}
				<p class="empty">Keine offenen Anfragen.</p>
			{:else}
				<div class="cards">
					{#each open as c (c.id)}
						<div class="card card--open">
							<div class="card-info">
								<span class="card-name">{c.name}</span>
								<a class="card-phone" href="tel:{c.phone}">
									<Phone size={14} />
									{c.phone}
								</a>
								<span class="card-time">
									Wann: <strong>{TIME_LABELS[c.time_preference] ?? c.time_preference}</strong>
								</span>
								<span class="card-date">Eingegangen: {formatDate(c.created_at)}</span>
							{#if c.next_remind_at}
								<span class="card-snooze">
									<AlarmClock size={12} />
									Nächste Erinnerung: {formatDate(c.next_remind_at)}
								</span>
							{/if}
							</div>
							<button
								class="btn-handle"
								onclick={() => markHandled(c.id)}
								disabled={handlingId === c.id}
							>
								<CheckCircle size={16} />
								{handlingId === c.id ? 'Speichert …' : 'Erledigt'}
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="section">
			<h2 class="section-title">
				<CheckCircle size={16} />
				Erreicht ({done.length})
			</h2>
			{#if done.length === 0}
				<p class="empty">Noch keine erledigten Anfragen.</p>
			{:else}
				<div class="cards cards--done">
					{#each done as c (c.id)}
						<div class="card card--done">
							<div class="card-info">
								<span class="card-name">{c.name}</span>
								<a class="card-phone" href="tel:{c.phone}">
									<Phone size={14} />
									{c.phone}
								</a>
								<span class="card-time">
									Wann: <strong>{TIME_LABELS[c.time_preference] ?? c.time_preference}</strong>
								</span>
								<span class="card-date">Eingegangen: {formatDate(c.created_at)}</span>
								{#if c.handled_at}
									<span class="card-date">Erreicht: {formatDate(c.handled_at)}</span>
								{/if}
							</div>
							<span class="badge-done">
								<CheckCircle size={14} />
								Erreicht
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="section">
			<h2 class="section-title">
				<Trash2 size={16} />
				Verworfen ({dismissed.length})
			</h2>
			{#if dismissed.length === 0}
				<p class="empty">Keine verworfenen Anfragen.</p>
			{:else}
				<div class="cards cards--done">
					{#each dismissed as c (c.id)}
						<div class="card card--done">
							<div class="card-info">
								<span class="card-name">{c.name}</span>
								<a class="card-phone" href="tel:{c.phone}">
									<Phone size={14} />
									{c.phone}
								</a>
								<span class="card-time">
									Wann: <strong>{TIME_LABELS[c.time_preference] ?? c.time_preference}</strong>
								</span>
								<span class="card-date">Eingegangen: {formatDate(c.created_at)}</span>
								{#if c.dismissed_at}
									<span class="card-date">Verworfen: {formatDate(c.dismissed_at)}</span>
								{/if}
							</div>
							<span class="badge-dismissed">
								<Trash2 size={14} />
								Verworfen
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

<style>
	@import '../../../styles/admin.css';

	.page {
		padding: 2rem;
		max-width: 900px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-title {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--dt-on-surface, #191c1e);
	}

	.page-title h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.btn-refresh {
		padding: 0.45rem 1rem;
		border: 1px solid var(--dt-outline, #ccc);
		border-radius: 0.5rem;
		background: transparent;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--dt-on-surface, #191c1e);
	}
	.btn-refresh:hover:not(:disabled) {
		background: var(--dt-surface-variant, #f0f2f5);
	}
	.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

	.section { margin-bottom: 2.5rem; }

	.section-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem;
		color: var(--dt-on-surface, #191c1e);
	}

	.cards {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		border: 1px solid var(--dt-outline-variant, #e0e2e8);
		background: var(--dt-surface-container, #fff);
	}

	.card--open {
		border-left: 4px solid #ff6b00;
	}

	.cards--done { opacity: 0.7; }

	.card-info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
	}

	.card-name {
		font-weight: 700;
		font-size: 1rem;
	}

	.card-phone {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.9rem;
		color: #ff6b00;
		text-decoration: none;
		font-weight: 600;
	}
	.card-phone:hover { text-decoration: underline; }

	.card-time {
		font-size: 0.82rem;
		color: var(--dt-on-surface-variant, #5b6478);
	}

	.card-date {
		font-size: 0.78rem;
		color: var(--dt-on-surface-variant, #5b6478);
	}

	.btn-handle {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		background: #1e3a5f;
		color: #fff;
		border: none;
		border-radius: 0.55rem;
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.btn-handle:hover:not(:disabled) { background: #15294a; }
	.btn-handle:disabled { opacity: 0.5; cursor: not-allowed; }

	.badge-done {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #166534;
		background: #dcfce7;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.badge-dismissed {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.card-snooze {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.78rem;
		color: #b45309;
		font-weight: 600;
	}

	.error {
		color: #dc2626;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.empty {
		color: var(--dt-on-surface-variant, #5b6478);
		font-size: 0.9rem;
	}
</style>
