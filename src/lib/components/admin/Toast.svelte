<script lang="ts" module>
	interface ToastItem {
		id: number;
		type: 'success' | 'error' | 'info';
		message: string;
	}

	let toasts = $state<ToastItem[]>([]);
	let nextId = 0;

	/**
	 * Adds a new toast notification to the stack and auto-dismisses it after 4 seconds.
	 *
	 * Called by: quotes/[id]/+page.svelte, offers/[id]/+page.svelte,
	 *            calendar/+page.svelte, settings/+page.svelte,
	 *            customers/[id]/+page.svelte, emails/[id]/+page.svelte,
	 *            emails/+page.svelte (all import and call this from the module context)
	 * Purpose: Provides a single, globally accessible function that any admin page
	 *          can call to surface transient feedback (save confirmations, API
	 *          errors, informational messages) without needing to manage toast
	 *          state locally. Lives in module context so the shared toasts array
	 *          is not re-created per component instance.
	 *
	 * @param message - The text to display inside the toast
	 * @param type    - Visual variant: 'success' (green), 'error' (red), or
	 *                  'info' (blue); defaults to 'info'
	 */
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

	/**
	 * Immediately removes a toast from the visible stack by its unique id.
	 *
	 * Called by: Template (onclick of each toast's close button)
	 * Purpose: Allows the user to manually dismiss a notification before the
	 *          4-second auto-dismiss timer fires.
	 *
	 * @param id - The numeric id of the ToastItem to remove
	 */
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
		border-radius: var(--dt-radius-md);
		font-size: 0.875rem;
		animation: slideIn 200ms ease;
		background: var(--dt-surface-container-lowest);
		box-shadow: var(--dt-shadow-ambient);
		color: var(--dt-on-surface);
		border-left: 4px solid transparent;
	}

	.toast-success {
		border-left-color: #16a34a;
		background: rgba(22, 163, 74, 0.08);
		color: var(--dt-on-surface);
	}

	.toast-error {
		border-left-color: var(--dt-secondary);
		background: rgba(168, 57, 0, 0.06);
		color: var(--dt-on-surface);
	}

	.toast-info {
		border-left-color: var(--dt-primary);
		background: var(--dt-surface-container-lowest);
		color: var(--dt-primary-container);
	}

	.toast-message {
		flex: 1;
		font-weight: 500;
	}

	.toast-close {
		color: currentColor;
		opacity: 0.5;
		padding: 0.125rem;
		border-radius: var(--dt-radius-sm);
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: opacity var(--dt-transition);
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
