<script lang="ts">
	let { status, label }: { status: string; label?: string } = $props();

	const statusConfig: Record<string, { bg: string; color: string; text: string }> = {
		draft: { bg: '#f1f5f9', color: '#64748b', text: 'Entwurf' },
		open: { bg: '#dbeafe', color: '#2563eb', text: 'Offen' },
		new: { bg: '#dbeafe', color: '#2563eb', text: 'Neu' },
		pending: { bg: '#fef3c7', color: '#b45309', text: 'Ausstehend' },
		estimating: { bg: '#ede9fe', color: '#7c3aed', text: 'Schaetzung' },
		estimated: { bg: '#ede9fe', color: '#7c3aed', text: 'Volumen' },
		offer_ready: { bg: '#e0e7ff', color: '#4338ca', text: 'Angebot' },
		sent: { bg: '#e0e7ff', color: '#4338ca', text: 'Gesendet' },
		accepted: { bg: '#d1fae5', color: '#059669', text: 'Akzeptiert' },
		confirmed: { bg: '#d1fae5', color: '#059669', text: 'Bestaetigt' },
		scheduled: { bg: '#dbeafe', color: '#2563eb', text: 'Geplant' },
		completed: { bg: '#d1fae5', color: '#059669', text: 'Erledigt' },
		invoiced: { bg: '#fef3c7', color: '#d97706', text: 'Fakturiert' },
		rejected: { bg: '#fee2e2', color: '#dc2626', text: 'Abgelehnt' },
		cancelled: { bg: '#fee2e2', color: '#dc2626', text: 'Storniert' },
		offer_created: { bg: '#e0e7ff', color: '#4338ca', text: 'Angebot erstellt' },
		volume_estimated: { bg: '#ede9fe', color: '#7c3aed', text: 'Volumen' },
		offer_generated: { bg: '#e0e7ff', color: '#4338ca', text: 'Angebot' },
		offer_sent: { bg: '#dbeafe', color: '#2563eb', text: 'Gesendet' },
		done: { bg: '#d1fae5', color: '#059669', text: 'Erledigt' },
		paid: { bg: '#bbf7d0', color: '#15803d', text: 'Bezahlt' },
		tentative: { bg: '#fef3c7', color: '#d97706', text: 'Vorlaeufig' }
	};

	let config = $derived(
		statusConfig[status] || { bg: '#f1f5f9', color: '#64748b', text: status }
	);
</script>

<span
	class="badge"
	style="background: {config.bg}; color: {config.color};"
>
	{label || config.text}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		border-radius: var(--dt-radius-sm);
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		white-space: nowrap;
		line-height: 1.2;
	}
</style>
