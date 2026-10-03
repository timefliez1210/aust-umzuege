<script lang="ts" module>
	interface ToastAction {
		label: string;
		onClick: () => void;
	}
	interface ToastItem {
		id: number;
		type: 'success' | 'error' | 'info';
		message: string;
		action?: ToastAction;
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
	export function showToast(
		message: string,
		type: 'success' | 'error' | 'info' = 'info',
		options?: { action?: ToastAction; durationMs?: number }
	) {
		const id = nextId++;
		toasts.push({ id, type, message, action: options?.action });
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, options?.durationMs ?? 4000);
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
	<!-- Phones: above the tab bar; desktop: top right. Class names are test hooks. -->
	<div
		class="toast-container fixed inset-x-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[9999] flex flex-col gap-2 lg:inset-x-auto lg:top-4 lg:right-4 lg:bottom-auto lg:w-96"
		role="status"
		aria-live="polite"
	>
		{#each toasts as toast (toast.id)}
			<div
				class="toast toast-{toast.type} flex items-center gap-3 rounded-md border border-line bg-panel py-2.5 pr-2 pl-3 text-sm text-fg shadow-xl"
			>
				<span
					aria-hidden="true"
					class="size-2 shrink-0 rounded-full {toast.type === 'success'
						? 'bg-ok'
						: toast.type === 'error'
							? 'bg-danger'
							: 'bg-info'}"
				></span>
				<span class="toast-message flex-1 font-medium">{toast.message}</span>
				{#if toast.action}
					<button
						class="h-7 shrink-0 rounded-sm border border-line-strong px-2.5 text-[13px] font-semibold hover:bg-sunk"
						onclick={() => {
							toast.action?.onClick();
							dismiss(toast.id);
						}}>{toast.action.label}</button
					>
				{/if}
				<button
					class="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-faint hover:bg-sunk hover:text-fg"
					onclick={() => dismiss(toast.id)}
					aria-label="Schließen"
				>
					<X size={15} />
				</button>
			</div>
		{/each}
	</div>
{/if}
