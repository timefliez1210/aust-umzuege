<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A button that shows a spinner and becomes disabled while `loading` is true.
	 *
	 * Replaces the common pattern:
	 *   `<button disabled={loading}>{loading ? 'Speichern...' : 'Speichern'}</button>`
	 *
	 * Uses global CSS classes from `admin-components.css`:
	 * `.btn-primary`, `.btn-ghost` / `.btn-cancel`, `.btn-danger`, `.btn-sm`.
	 *
	 * @example
	 *   <LoadingButton {loading} onclick={handleSave}>Speichern</LoadingButton>
	 *   <LoadingButton {loading} variant="danger" onclick={handleDelete}>Löschen</LoadingButton>
	 */

	/**
	 * Component props.
	 *
	 * @prop loading  - When true: show spinner SVG and disable the button.
	 * @prop disabled - Additional disabled condition on top of `loading`.
	 * @prop variant  - Visual style: 'primary' (blue), 'ghost' (neutral), 'danger' (red). Default: 'primary'.
	 * @prop size     - Size modifier: 'default' (0.875rem) or 'sm' (0.8125rem). Default: 'default'.
	 * @prop type     - HTML button type attribute. Default: 'button'.
	 * @prop onclick  - Optional click handler (async allowed).
	 * @prop children - Button label content (Svelte snippet).
	 */
	let {
		loading = false,
		disabled = false,
		variant = 'primary',
		size = 'default',
		type = 'button',
		onclick,
		children
	}: {
		loading?: boolean;
		disabled?: boolean;
		variant?: 'primary' | 'ghost' | 'danger';
		size?: 'default' | 'sm';
		type?: 'button' | 'submit';
		onclick?: () => void | Promise<void>;
		children: Snippet;
	} = $props();

	/** Derived CSS class string based on variant and size props. */
	const cls = $derived(
		[
			variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-ghost',
			size === 'sm' ? 'btn-sm' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<button
	{type}
	class={cls}
	disabled={loading || disabled}
	{onclick}
>
	{#if loading}
		<svg
			class="spinner"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<circle
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				stroke-dasharray="31.4 31.4"
			/>
		</svg>
	{/if}
	{@render children()}
</button>

<style>
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
