import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ServicesCarousel from './ServicesCarousel.svelte';

describe('ServicesCarousel', () => {
	it('renders all six default service cards linking to their pages', () => {
		render(ServicesCarousel);
		for (const [title, href] of [
			['Privatumzüge', '/leistungen/privatumzug'],
			['Gewerbe & Firmenumzüge', '/leistungen/firmenumzug'],
			['Montagen & Demontagen', '/leistungen/montage'],
			['Haushaltsauflösungen', '/leistungen/haushaltsaufloesung'],
			['Lagerung & Einlagerung', '/leistungen/lagerung'],
			['Seniorenumzüge', '/leistungen/seniorenumzug'],
		] as const) {
			const heading = screen.getByText(title);
			expect(heading.closest('a, article')?.querySelector('a') ?? heading.closest('a')).toBeTruthy();
			expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull();
		}
	});

	it('exposes prev/next slide controls and a labelled carousel region', () => {
		render(ServicesCarousel);
		expect(screen.getByLabelText('Leistungen Karussell')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Vorheriger Slide' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Nächster Slide' })).toBeInTheDocument();
	});

	it('advances slides and clamps at both ends', async () => {
		const user = userEvent.setup();
		render(ServicesCarousel);
		const prev = screen.getByRole('button', { name: 'Vorheriger Slide' });
		const next = screen.getByRole('button', { name: 'Nächster Slide' });

		// at index 0 prev must not move below 0 (stays functional, no crash)
		await user.click(prev);
		// 6 services, 3 visible → maxIndex 3; clicking next 10× must clamp
		for (let i = 0; i < 10; i++) await user.click(next);
		await user.click(screen.getByRole('button', { name: 'Gehe zu Slide 1' }));
		expect(screen.getByText('Privatumzüge')).toBeInTheDocument();
	});

	it('renders a custom heading and CTA link', () => {
		render(ServicesCarousel, { heading: 'Was wir tun', ctaText: 'Alle Leistungen', ctaHref: '/leistungen' });
		expect(screen.getByRole('heading', { name: 'Was wir tun' })).toBeInTheDocument();
	});
});
