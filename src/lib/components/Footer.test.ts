import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
	it('links all four legal pages', () => {
		render(Footer);
		expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum');
		expect(screen.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz');
		expect(screen.getByRole('link', { name: 'AGB' })).toHaveAttribute('href', '/agb');
		expect(screen.getByRole('link', { name: 'Cookie-Einstellungen' })).toHaveAttribute(
			'href',
			'/cookie-einstellungen'
		);
	});

	it('social links open in new tabs with noopener', () => {
		render(Footer);
		for (const name of ['Facebook', 'Instagram', 'TikTok']) {
			const link = screen.getByRole('link', { name });
			expect(link).toHaveAttribute('target', '_blank');
			expect(link.getAttribute('rel')).toContain('noopener');
		}
	});

	it('exposes phone numbers and email as tappable links', () => {
		render(Footer);
		expect(screen.getByRole('link', { name: '05121 – 755 83 79' })).toHaveAttribute(
			'href',
			'tel:+4951217558379'
		);
		expect(screen.getByRole('link', { name: '0176 – 70745281' })).toHaveAttribute(
			'href',
			'tel:+4917670745281'
		);
		expect(screen.getByRole('link', { name: 'info@aust-umzuege.de' })).toHaveAttribute(
			'href',
			'mailto:info@aust-umzuege.de'
		);
	});

	it('shows address and office hours', () => {
		render(Footer);
		expect(screen.getByText(/Kaiserstr\. 32/)).toBeInTheDocument();
		expect(screen.getByText(/Montag – Freitag: 09:00 – 19:00 Uhr/)).toBeInTheDocument();
		expect(screen.getByText(/Samstag nach Vereinbarung/)).toBeInTheDocument();
	});

	it('shows the Check24 trust badge lazily', () => {
		render(Footer);
		const badge = screen.getByAltText('Check24 Profi seit 2019');
		expect(badge).toHaveAttribute('loading', 'lazy');
	});
});
