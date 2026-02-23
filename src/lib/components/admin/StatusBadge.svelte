<script lang="ts">
	let { status, label }: { status: string; label?: string } = $props();

	const statusConfig: Record<string, { bg: string; color: string; text: string }> = {
		draft: { bg: '#f1f5f9', color: '#64748b', text: 'Entwurf' },
		open: { bg: '#dbeafe', color: '#2563eb', text: 'Offen' },
		new: { bg: '#dbeafe', color: '#2563eb', text: 'Neu' },
		pending: { bg: '#fef3c7', color: '#b45309', text: 'Ausstehend' },
		sent: { bg: '#e0e7ff', color: '#4338ca', text: 'Gesendet' },
		accepted: { bg: '#d1fae5', color: '#059669', text: 'Akzeptiert' },
		confirmed: { bg: '#d1fae5', color: '#059669', text: 'Bestaetigt' },
		rejected: { bg: '#fee2e2', color: '#dc2626', text: 'Abgelehnt' },
		cancelled: { bg: '#fee2e2', color: '#dc2626', text: 'Storniert' },
		offer_created: { bg: '#e0e7ff', color: '#4338ca', text: 'Angebot erstellt' },
		completed: { bg: '#d1fae5', color: '#059669', text: 'Abgeschlossen' },
		volume_estimated: { bg: '#ede9fe', color: '#7c3aed', text: 'Volumen' },
		offer_generated: { bg: '#e0e7ff', color: '#4338ca', text: 'Angebot' },
		offer_sent: { bg: '#dbeafe', color: '#2563eb', text: 'Gesendet' }
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
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
		line-height: 1.25;
	}
</style>
