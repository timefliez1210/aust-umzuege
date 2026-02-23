<script lang="ts" module>
	interface ToastItem {
		id: number;
		type: 'success' | 'error' | 'info';
		message: string;
	}

	let toasts = $state<ToastItem[]>([]);
	let nextId = 0;

	export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
		const id = nextId++;
		toasts.push({ id, type, message });
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 4000);
	}
</script>

<script lang="ts">
	import { X } from 'lucide-svelte';

	function dismiss(id: number) {
		toasts = toasts.filter((t) => t.id !== id);
	}
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			<div class="toast toast-{toast.type}">
				<span class="toast-message">{toast.message}</span>
				<button class="toast-close" onclick={() => dismiss(toast.id)} aria-label="Schliessen">
					<X size={16} />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
	}

	.toast {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.875rem;
		animation: slideIn 200ms ease;
		box-shadow: 5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff;
	}

	.toast-success {
		background: #d1fae5;
		color: #065f46;
	}

	.toast-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.toast-info {
		background: #dbeafe;
		color: #1e40af;
	}

	.toast-message {
		flex: 1;
		font-weight: 500;
	}

	.toast-close {
		color: currentColor;
		opacity: 0.5;
		padding: 0.125rem;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.toast-close:hover {
		opacity: 1;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
</style>
