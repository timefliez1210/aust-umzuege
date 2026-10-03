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

<div class="flex flex-col gap-1.5">
	<label class="text-xs font-medium text-muted" for={`price-${label.replace(/\s/g, '-').toLowerCase()}`}>{label}</label>
	<div class="flex items-center gap-2">
		<div
			class="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-sm border border-line-strong bg-panel px-3 focus-within:border-fg"
		>
			<input
				id={`price-${label.replace(/\s/g, '-').toLowerCase()}`}
				type="number"
				step="0.01"
				class="num min-w-0 flex-1 bg-transparent text-xl font-medium outline-none"
				value={editing ? inputText : displayValue}
				oninput={handleInput}
				onfocus={handleFocus}
				onblur={handleBlur}
				{disabled}
			/>
			<span class="text-sm text-faint">€</span>
		</div>
		<div role="group" aria-label="Preisart" class="inline-flex gap-0.5 rounded-md border border-line bg-sunk p-0.5">
			{#each [['brutto', 'Brutto'], ['netto', 'Netto']] as const as [m, l] (m)}
				<button
					type="button"
					aria-pressed={mode === m}
					onclick={() => (mode = m)}
					class="h-9 rounded-sm border px-3 text-[13px] {mode === m
						? 'border-line-strong bg-panel text-fg'
						: 'border-transparent text-muted hover:text-fg'}">{l}</button
				>
			{/each}
		</div>
	</div>
	<span class="num text-xs text-faint">
		{mode === 'brutto' ? `Netto: ${nettoEuro.toFixed(2)} €` : `Brutto: ${bruttoEuro.toFixed(2)} €`}
	</span>
</div>
