<script lang="ts">
	import { ArrowRight, type Icon } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	interface StatCard {
		label: string;
		value: number;
		icon: ComponentType<Icon>;
		color: string;
		href: string;
	}

	/**
	 * Renders the dashboard's row of clickable KPI stat cards.
	 *
	 * Called by: admin/+page.svelte
	 * Purpose: Pure presentational component — the parent computes `cards` from the
	 *          fetched DashboardData via a $derived, this just lays them out.
	 *
	 * @prop cards - Precomputed stat card descriptors (label, value, icon, color, href)
	 */
	interface Props {
		cards: StatCard[];
	}

	let { cards }: Props = $props();
</script>

<div class="stats-grid">
	{#each cards as card}
		<a href={card.href} class="stat-card">
			<div class="stat-icon" style="color: {card.color};">
				<card.icon size={24} />
			</div>
			<div class="stat-info">
				<span class="stat-value">{card.value}</span>
				<span class="stat-label">{card.label}</span>
			</div>
			<ArrowRight size={16} class="stat-arrow" />
		</a>
	{/each}
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: var(--dt-surface-container-lowest);
		border-radius: var(--dt-radius-lg);
		padding: 1.25rem;
		text-decoration: none;
		transition: opacity var(--dt-transition);
	}

	.stat-card:hover {
		opacity: 0.85;
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: var(--dt-radius-sm);
		background: var(--dt-surface-container);
		flex-shrink: 0;
	}

	.stat-info {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--dt-on-surface);
	}

	.stat-label {
		font-size: 0.8125rem;
		color: var(--dt-on-surface-variant);
	}

	.stat-card :global(.stat-arrow) {
		color: var(--dt-outline-variant);
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: 1fr 1fr;
			gap: 0.75rem;
		}
	}
</style>
