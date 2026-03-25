<script lang="ts">
	/**
	 * A reusable confirmation dialog that replaces inline `confirm()` calls.
	 *
	 * Renders a modal overlay with a title, message, and two action buttons.
	 * Use `bind:open` to control visibility. The `onConfirm` callback fires
	 * when the user presses the confirm button; `onCancel` fires on cancel or
	 * backdrop click.
	 *
	 * Styling depends on global classes from `admin-components.css`:
	 * `.modal-backdrop`, `.modal`, `.modal-actions`, `.btn-cancel`,
	 * `.btn-danger`, `.btn-primary`.
	 */

	/**
	 * Component props.
	 *
	 * @prop open         - Controls dialog visibility (bindable).
	 * @prop title        - Heading text shown at the top of the modal.
	 * @prop message      - Body text describing what will be confirmed.
	 * @prop confirmLabel - Label for the confirm button. Default: 'Bestätigen'.
	 * @prop cancelLabel  - Label for the cancel button. Default: 'Abbrechen'.
	 * @prop variant      - Button style: 'danger' (red) or 'primary' (blue). Default: 'danger'.
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
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<h2 id="confirm-dialog-title">{title}</h2>
			<p class="dialog-message">{message}</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={handleCancel} disabled={loading}>
					{cancelLabel}
				</button>
				{#if variant === 'danger'}
					<button class="btn-danger" onclick={handleConfirm} disabled={loading}>
						{#if loading}
							<svg class="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
							</svg>
						{/if}
						{confirmLabel}
					</button>
				{:else}
					<button class="btn-primary" onclick={handleConfirm} disabled={loading}>
						{#if loading}
							<svg class="spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="31.4 31.4" />
							</svg>
						{/if}
						{confirmLabel}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-message {
		font-size: 0.9375rem;
		color: var(--dt-on-surface-variant);
		margin: 0 0 0.5rem;
		line-height: 1.5;
	}

	.spinner {
		width: 16px;
		height: 16px;
		animation: spin 0.8s linear infinite;
		flex-shrink: 0;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to   { transform: rotate(360deg); }
	}
</style>
