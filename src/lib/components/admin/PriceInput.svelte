<script lang="ts">
	let {
		bruttoCents = $bindable(0),
		label = 'Preis',
		disabled = false
	}: {
		bruttoCents?: number;
		label?: string;
		disabled?: boolean;
	} = $props();

	let mode = $state<'brutto' | 'netto'>('brutto');
	let bruttoEuro = $derived(bruttoCents / 100);
	let nettoEuro = $derived(Math.round(bruttoCents / 1.19) / 100);

	// Local string state to avoid cursor-resetting on every keystroke
	let inputText = $state('');
	let editing = $state(false);

	// Sync display when not actively editing
	let displayValue = $derived(
		mode === 'brutto' ? bruttoEuro.toFixed(2) : nettoEuro.toFixed(2)
	);

	$effect(() => {
		if (!editing) {
			inputText = displayValue;
		}
	});

	/**
	 * Processes each keystroke in the price input field.
	 *
	 * Called by: Template (oninput on the number input element)
	 * Purpose: Keeps the local inputText string in sync with what the user is
	 *          typing without resetting the cursor position. Converts the entered
	 *          euro value to integer cents and writes it back to the bindable
	 *          bruttoCents prop, applying the 19% VAT factor when the component
	 *          is in netto mode.
	 *
	 * @param e - The native input Event fired by the number input element
	 */
	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		inputText = target.value;
		const val = parseFloat(target.value);
		if (isNaN(val)) return;

		if (mode === 'brutto') {
			bruttoCents = Math.round(val * 100);
		} else {
			bruttoCents = Math.round(val * 1.19 * 100);
		}
	}

	/**
	 * Marks the input as actively being edited when it receives focus.
	 *
	 * Called by: Template (onfocus on the number input element)
	 * Purpose: Suspends the reactive displayValue sync so the user's raw
	 *          keystrokes are preserved in inputText rather than being
	 *          overwritten by the formatted derived value on every render.
	 */
	function handleFocus() {
		editing = true;
	}

	/**
	 * Marks the input as no longer being edited when it loses focus.
	 *
	 * Called by: Template (onblur on the number input element)
	 * Purpose: Re-enables the $effect that syncs inputText to the formatted
	 *          displayValue, so the field snaps to the canonical two-decimal
	 *          representation after the user finishes typing.
	 */
	function handleBlur() {
		editing = false;
	}
</script>

<div class="price-input">
	<label class="price-label" for={`price-${label.replace(/\s/g, '-').toLowerCase()}`}>{label}</label>
	<div class="input-row">
		<div class="input-wrapper">
			<input
				id={`price-${label.replace(/\s/g, '-').toLowerCase()}`}
				type="number"
				step="0.01"
				value={editing ? inputText : displayValue}
				oninput={handleInput}
				onfocus={handleFocus}
				onblur={handleBlur}
				{disabled}
			/>
			<span class="currency">EUR</span>
		</div>
		<div class="mode-toggle">
			<button
				class:active={mode === 'brutto'}
				onclick={() => (mode = 'brutto')}
				type="button"
			>
				Brutto
			</button>
			<button
				class:active={mode === 'netto'}
				onclick={() => (mode = 'netto')}
				type="button"
			>
				Netto
			</button>
		</div>
	</div>
	<span class="price-hint">
		{mode === 'brutto'
			? `Netto: ${nettoEuro.toFixed(2)} EUR`
			: `Brutto: ${bruttoEuro.toFixed(2)} EUR`}
	</span>
</div>

<style>
	.price-input {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.price-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.input-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.input-wrapper {
		display: flex;
		align-items: center;
		background: var(--dt-surface-container-high);
		border-radius: var(--dt-radius-md);
		padding: 0 0.75rem;
		flex: 1;
		transition: background var(--dt-transition), border-bottom-color var(--dt-transition);
		border-bottom: 2px solid transparent;
	}

	.input-wrapper:focus-within {
		background: var(--dt-surface-container-lowest);
		border-bottom-color: var(--dt-primary);
	}

	input {
		background: transparent;
		border: none;
		color: var(--dt-on-surface);
		padding: 0.5rem 0;
		width: 100%;
		font-size: 0.9375rem;
		font-weight: 600;
		outline: none;
	}

	input::-webkit-inner-spin-button,
	input::-webkit-outer-spin-button {
		-webkit-appearance: none;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}

	.currency {
		color: var(--dt-on-surface-variant);
		font-size: 0.8125rem;
		font-weight: 500;
		margin-left: 0.5rem;
	}

	.mode-toggle {
		display: flex;
		border-radius: var(--dt-radius-md);
		overflow: hidden;
		border: var(--dt-ghost-border);
	}

	.mode-toggle button {
		padding: 0.5rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--dt-on-surface-variant);
		background: var(--dt-surface-container-lowest);
		transition: background var(--dt-transition), color var(--dt-transition);
	}

	.mode-toggle button.active {
		background: linear-gradient(135deg, var(--dt-primary), var(--dt-primary-container));
		color: var(--dt-on-primary);
	}

	.price-hint {
		font-size: 0.75rem;
		color: var(--dt-on-surface-variant);
	}
</style>
