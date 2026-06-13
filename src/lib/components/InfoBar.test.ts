import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import InfoBar from './InfoBar.svelte';

describe('InfoBar', () => {
	it('shows the office phone number as a tappable tel: link with country code', () => {
		render(InfoBar);
		const phone = screen.getByRole('link', { name: /Telefon/ });
		expect(phone).toHaveAttribute('href', 'tel:+4951217558379');
		expect(phone).toHaveTextContent('05121 – 755 83 79');
	});

	it('shows the default office hours', () => {
		render(InfoBar);
		expect(screen.getByText('Montag – Freitag von 09:00 – 19:00 Uhr')).toBeInTheDocument();
	});

	it('accepts custom phone display and hours via props', () => {
		render(InfoBar, { phone: '0123 456', hours: 'Immer erreichbar' });
		expect(screen.getByText('0123 456')).toBeInTheDocument();
		expect(screen.getByText('Immer erreichbar')).toBeInTheDocument();
	});
});
