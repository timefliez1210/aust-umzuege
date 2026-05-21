<script lang="ts">
	import { hours } from '$lib/utils/officeHours.svelte';
</script>

<span class="status" class:status--open={hours.open} class:status--closed={!hours.open}>
	<span class="status__dot" aria-hidden="true"></span>
	{hours.label}
</span>

<style>
	.status {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 5px 11px 5px 9px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
		border: 1px solid var(--line);
		background: #fff;
		white-space: nowrap;
	}
	.status__dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--muted-on-light);
	}
	.status--open {
		color: var(--green-status);
		border-color: rgba(47, 125, 79, 0.25);
		background: rgba(47, 125, 79, 0.06);
	}
	.status--open .status__dot {
		background: var(--green-status);
		animation: pulse 2s ease-in-out infinite;
	}
	.status--closed {
		color: var(--amber-status);
		border-color: rgba(176, 112, 0, 0.25);
		background: rgba(176, 112, 0, 0.06);
	}
	.status--closed .status__dot { background: var(--amber-status); }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
	@media (prefers-reduced-motion: reduce) {
		.status--open .status__dot { animation: none; }
	}
</style>
