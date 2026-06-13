import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PriceCards from './PriceCards.svelte';
import { crewPackages, disclaimersByService } from '$lib/data/pricing';

describe('PriceCards', () => {
	it('renders one card per crew package from the pricing data', () => {
		const { container } = render(PriceCards, { service: 'privatumzug' });
		expect(container.querySelectorAll('.price-card')).toHaveLength(crewPackages.length);
	});

	it('shows crew composition, tiers with German number formatting, and the extra-hour rate', () => {
		render(PriceCards, { service: 'privatumzug' });
		// 2 Helfer · 1 LKW base package
		expect(screen.getAllByText(/2 Helfer · 1 LKW/).length).toBeGreaterThan(0);
		// a four-digit price must use the German thousands separator
		expect(screen.getByText('1.015')).toBeInTheDocument();
		// every price block declares VAT included
		expect(screen.getAllByText('Alle Preise inkl. MwSt.')).toHaveLength(crewPackages.length);
	});

	it('shows the service-specific disclaimers by default', () => {
		render(PriceCards, { service: 'privatumzug' });
		const expected = disclaimersByService.privatumzug;
		expect(expected.length).toBeGreaterThan(0);
		expect(screen.getByText(new RegExp(expected[0].slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
	});

	it('allows overriding disclaimers per page', () => {
		render(PriceCards, { service: 'privatumzug', disclaimers: ['Nur ein Hinweis.'] });
		expect(screen.getByText(/Nur ein Hinweis\./)).toBeInTheDocument();
	});

	it('accepts a custom title and intro', () => {
		// `intro` collides with Svelte's own mount option — must nest under props
		render(PriceCards, { props: { service: 'entruempelung', title: 'Pakete', intro: 'Unser Einstieg.' } });
		expect(screen.getByRole('heading', { name: 'Pakete' })).toBeInTheDocument();
		expect(screen.getByText('Unser Einstieg.')).toBeInTheDocument();
	});
});
