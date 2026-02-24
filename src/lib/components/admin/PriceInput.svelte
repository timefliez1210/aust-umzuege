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

	function handleFocus() {
		editing = true;
	}

	function handleBlur() {
		editing = false;
	}
</script>

<div class="price-input">
	<label class="price-label">{label}</label>
	<div class="input-row">
		<div class="input-wrapper">
			<input
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
		font-weight: 600;
		color: #64748b;
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
		background: #e8ecf1;
		border-radius: 10px;
		padding: 0 0.75rem;
		flex: 1;
		transition: box-shadow 150ms ease;
		box-shadow: inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #ffffff;
	}

	.input-wrapper:focus-within {
		box-shadow: inset 2px 2px 5px #c5cdd8, inset -2px -2px 5px #ffffff, 0 0 0 2px rgba(99, 102, 241, 0.2);
	}

	input {
		background: transparent;
		border: none;
		color: #1a1a2e;
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
		color: #94a3b8;
		font-size: 0.8125rem;
		font-weight: 500;
		margin-left: 0.5rem;
	}

	.mode-toggle {
		display: flex;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 2px 2px 6px #d1d9e6, -2px -2px 6px #ffffff;
	}

	.mode-toggle button {
		padding: 0.5rem 0.625rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #94a3b8;
		background: #e8ecf1;
		transition: all 150ms ease;
	}

	.mode-toggle button.active {
		background: #6366f1;
		color: #ffffff;
		box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.1);
	}

	.price-hint {
		font-size: 0.75rem;
		color: #94a3b8;
	}
</style>
