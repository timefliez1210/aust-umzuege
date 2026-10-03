<script lang="ts">
	import { apiGet, apiPost } from '$lib/utils/api.svelte';
	import { showToast } from '$lib/components/admin/Toast.svelte';
	import { auth } from '$lib/stores/auth.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	/**
	 * Due Zahlungserinnerungen/Mahnungen and Bewertungsanfragen, each with its action
	 * inline — the old dashboard's two reminder widgets, merged. Renders nothing when
	 * neither list has anything due.
	 */
	let { onChange }: { onChange?: () => void } = $props();

	interface InvoiceReminder {
		id: string;
		invoice_id: string;
		inquiry_id: string;
		invoice_number: string;
		level: number;
		remind_after: string;
		customer_name: string | null;
	}
	interface ReviewReminder {
		inquiry_id: string;
		remind_after: string;
		customer_name: string | null;
	}

	const DUNNING: Record<number, string> = { 1: 'Zahlungserinnerung', 2: '1. Mahnung', 3: '2. Mahnung' };

	let invoices = $state<InvoiceReminder[]>([]);
	let reviews = $state<ReviewReminder[]>([]);
	let snooze = $state<Record<string, number>>({});
	let busy = $state<Record<string, boolean>>({});

	async function load() {
		try {
			invoices = await apiGet<InvoiceReminder[]>('/api/v1/admin/invoice-reminders');
			for (const r of invoices) snooze[r.id] ??= 7;
		} catch {
			invoices = [];
		}
		// Admin-only endpoint; the office role simply doesn't see this half.
		if (auth.user?.role === 'admin') {
			try {
				reviews = await apiGet<ReviewReminder[]>('/api/v1/admin/review-reminders');
			} catch {
				reviews = [];
			}
		}
	}

	$effect(() => {
		load();
	});

	async function invoiceAction(id: string, action: 'send' | 'later' | 'paid') {
		if (busy[id]) return;
		busy[id] = true;
		try {
			const body: Record<string, unknown> = { action };
			if (action === 'later') body.days = snooze[id] ?? 7;
			await apiPost(`/api/v1/admin/invoice-reminders/${id}/action`, body);
			showToast(
				action === 'send' ? 'Mahnung gesendet' : action === 'later' ? 'Erinnerung verschoben' : 'Als bezahlt markiert',
				'success'
			);
			await load();
			onChange?.();
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		} finally {
			busy[id] = false;
		}
	}

	async function sendReview(inquiryId: string) {
		try {
			await apiPost(`/api/v1/admin/inquiries/${inquiryId}/review-request`, { action: 'now' });
			showToast('Bewertungsanfrage gesendet', 'success');
			await load();
		} catch (e) {
			showToast((e as Error).message ?? 'Fehler', 'error');
		}
	}

	const since = (iso: string) =>
		new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
</script>

{#if invoices.length || reviews.length}
	<Card>
		<CardHeader title="Erinnerungen fällig" meta="{invoices.length + reviews.length} offen" />
		<ul>
			{#each invoices as r (r.id)}
				<li class="flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t border-line px-4 py-3">
					<span class="flex min-w-48 flex-1 flex-col gap-1">
						<a href="/admin/inquiries/{r.inquiry_id}" class="font-medium hover:underline">{r.customer_name ?? 'Unbekannt'}</a>
						<span class="flex flex-wrap items-center gap-2 text-xs text-muted">
							<Badge tone={r.level >= 2 ? 'danger' : 'warn'}>{DUNNING[r.level] ?? `Stufe ${r.level}`}</Badge>
							<span class="num">Rg. {r.invoice_number} · fällig seit {since(r.remind_after)}</span>
						</span>
					</span>
					<span class="flex flex-wrap items-center gap-1.5">
						<Button size="sm" variant="solid" disabled={busy[r.id]} onclick={() => invoiceAction(r.id, 'send')}
							>Mahnung senden</Button
						>
						<span class="flex items-center rounded-sm border border-line-strong">
							<Button size="sm" variant="ghost" disabled={busy[r.id]} onclick={() => invoiceAction(r.id, 'later')}
								>Später</Button
							>
							<input
								type="number"
								min="1"
								max="90"
								aria-label="Tage später"
								class="num h-8 w-11 border-l border-line bg-transparent text-center text-[13px] outline-none"
								bind:value={snooze[r.id]}
							/>
							<span class="pr-2 text-xs text-faint">T</span>
						</span>
						<Button size="sm" disabled={busy[r.id]} onclick={() => invoiceAction(r.id, 'paid')}>Bezahlt</Button>
					</span>
				</li>
			{/each}
			{#each reviews as r (r.inquiry_id)}
				<li class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-3">
					<span class="flex min-w-48 flex-1 flex-col gap-1">
						<a href="/admin/inquiries/{r.inquiry_id}" class="font-medium hover:underline">{r.customer_name ?? 'Unbekannt'}</a>
						<span class="flex items-center gap-2 text-xs text-muted">
							<Badge tone="info">Bewertung</Badge><span class="num">fällig seit {since(r.remind_after)}</span>
						</span>
					</span>
					<Button size="sm" onclick={() => sendReview(r.inquiry_id)}>Jetzt anfragen</Button>
				</li>
			{/each}
		</ul>
	</Card>
{/if}
