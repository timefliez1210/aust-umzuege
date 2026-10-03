<script lang="ts">
	import { Loader } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	/**
	 * A reusable confirmation dialog that replaces inline `confirm()` calls.
	 *
	 * Renders a modal overlay with a title, message, and two action buttons.
	 * Use `bind:open` to control visibility. The `onConfirm` callback fires
	 * when the user presses the confirm button; `onCancel` fires on cancel or
	 * backdrop click. Bottom sheet on phones, centred panel from `sm` up.
	 */

	/**
	 * Component props.
	 *
	 * @prop open         - Controls dialog visibility (bindable).
	 * @prop title        - Heading text shown at the top of the modal.
	 * @prop message      - Body text describing what will be confirmed.
	 * @prop confirmLabel - Label for the confirm button. Default: 'Bestätigen'.
	 * @prop cancelLabel  - Label for the cancel button. Default: 'Abbrechen'.
	 * @prop variant      - Confirm style: 'danger' (destructive) or 'primary' (solid). Default: 'danger'.
	 * @prop loading      - When true the confirm button shows a spinner and is disabled.
	 * @prop onConfirm    - Callback invoked when the user presses the confirm button.
	 * @prop onCancel     - Optional callback invoked on cancel or backdrop click.
	 */
	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		variant = 'danger',
		loading = false,
		onConfirm,
		onCancel
	}: {
		open: boolean;
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		variant?: 'danger' | 'primary';
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
	} = $props();

	/**
	 * Handles the cancel action: closes dialog and calls optional onCancel.
	 *
	 * Called by: Template (cancel button onclick, backdrop onclick).
	 * Purpose: Provides a single dismiss path for both the backdrop and the cancel button.
	 */
	function handleCancel() {
		open = false;
		onCancel?.();
	}

	/**
	 * Handles the confirm action: calls onConfirm then closes dialog.
	 *
	 * Called by: Template (confirm button onclick).
	 * Purpose: Delegates to the caller's onConfirm handler; the dialog stays open
	 *          while loading=true so a parent can keep it open during an async operation.
	 */
	async function handleConfirm() {
		await onConfirm();
		if (!loading) {
			open = false;
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[650] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
		role="presentation"
		data-backdrop
		onclick={handleCancel}
		onkeydown={(e) => e.key === 'Escape' && handleCancel()}
		tabindex="-1"
	>
		<div
			class="w-full max-w-md rounded-t-lg border border-line bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-fg shadow-2xl sm:rounded-md sm:pb-5"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-dialog-title"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 id="confirm-dialog-title" class="text-[15px] font-semibold">{title}</h2>
			<p class="mt-2 text-sm leading-relaxed whitespace-pre-line text-muted">{message}</p>
			<div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<Button onclick={handleCancel} disabled={loading}>{cancelLabel}</Button>
				<Button
					variant={variant === 'danger' ? 'destructive' : 'solid'}
					data-variant={variant}
					onclick={handleConfirm}
					disabled={loading}
				>
					{#if loading}<Loader size={15} class="animate-spin" aria-hidden="true" />{/if}
					{confirmLabel}
				</Button>
			</div>
		</div>
	</div>
{/if}
