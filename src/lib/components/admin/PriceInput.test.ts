import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PriceInput from './PriceInput.svelte';

describe('PriceInput — brutto/netto conversion (19% VAT)', () => {
	it('shows the brutto value from cents with two decimals', () => {
		render(PriceInput, { bruttoCents: 123456, label: 'Preis' });
		expect(screen.getByLabelText('Preis')).toHaveValue(1234.56);
		// hint shows the derived netto: 123456 / 1.19 = 103745.38… → rounded cents
		expect(screen.getByText('Netto: 1037.45 EUR')).toBeInTheDocument();
	});

	it('typing a brutto euro amount converts it to integer cents', async () => {
		const user = userEvent.setup();
		render(PriceInput, { bruttoCents: 0 });
		const input = screen.getByLabelText('Preis');

		await user.clear(input);
		await user.type(input, '119');
		// netto hint proves bruttoCents became 11900
		expect(screen.getByText('Netto: 100.00 EUR')).toBeInTheDocument();
	});

	it('switching to netto mode shows the netto value and converts input back to brutto', async () => {
		const user = userEvent.setup();
		render(PriceInput, { bruttoCents: 11900 });

		await user.click(screen.getByRole('button', { name: 'Netto' }));
		expect(screen.getByLabelText('Preis')).toHaveValue(100);
		expect(screen.getByText('Brutto: 119.00 EUR')).toBeInTheDocument();

		const input = screen.getByLabelText('Preis');
		await user.clear(input);
		await user.type(input, '200');
		// 200 € netto × 1.19 = 238 € brutto
		expect(screen.getByText('Brutto: 238.00 EUR')).toBeInTheDocument();
	});

	it('ignores unparseable input instead of corrupting the price', async () => {
		const user = userEvent.setup();
		render(PriceInput, { bruttoCents: 5000 });
		const input = screen.getByLabelText('Preis');

		await user.clear(input);
		// cleared field parses as NaN → bruttoCents must stay 5000
		expect(screen.getByText('Netto: 42.02 EUR')).toBeInTheDocument();
	});

	it('snaps the field to the canonical two-decimal format on blur', async () => {
		const user = userEvent.setup();
		render(PriceInput, { bruttoCents: 0 });
		const input = screen.getByLabelText('Preis');

		await user.clear(input);
		await user.type(input, '99.9');
		await user.tab(); // blur
		expect(input).toHaveValue(99.9);
		expect(screen.getByText('Netto: 83.95 EUR')).toBeInTheDocument();
	});

	it('can be disabled', () => {
		render(PriceInput, { bruttoCents: 0, disabled: true });
		expect(screen.getByLabelText('Preis')).toBeDisabled();
	});
});
