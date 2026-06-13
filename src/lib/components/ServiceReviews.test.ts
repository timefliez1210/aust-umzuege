import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ServiceReviews from './ServiceReviews.svelte';
import { aggregateRating } from '$lib/data/structuredData';

const reviews = [
	{ author: 'Anna A.', text: 'Super Team.', url: 'https://g.page/r/1' },
	{ author: 'Bernd B.', text: 'Alles top.', url: 'https://g.page/r/2' },
	{ author: 'Clara C.', text: 'Gerne wieder.', url: 'https://g.page/r/3' },
];

describe('ServiceReviews', () => {
	it('shows one review at a time, linked to its Google source', () => {
		render(ServiceReviews, { reviews });
		expect(screen.getByText(/Super Team\./)).toBeInTheDocument();
		expect(screen.queryByText(/Alles top\./)).not.toBeInTheDocument();
		const link = screen.getByText(/Super Team\./).closest('a')!;
		expect(link).toHaveAttribute('href', 'https://g.page/r/1');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('cycles forward and wraps around at the end', async () => {
		const user = userEvent.setup();
		render(ServiceReviews, { reviews });
		const next = screen.getByRole('button', { name: 'Nächste Bewertung' });

		await user.click(next);
		expect(screen.getByText(/Alles top\./)).toBeInTheDocument();
		await user.click(next);
		await user.click(next); // wraps to the first
		expect(screen.getByText(/Super Team\./)).toBeInTheDocument();
	});

	it('cycles backwards with wrap-around from the first review', async () => {
		const user = userEvent.setup();
		render(ServiceReviews, { reviews });
		await user.click(screen.getByRole('button', { name: 'Vorherige Bewertung' }));
		expect(screen.getByText(/Gerne wieder\./)).toBeInTheDocument();
	});

	it('jumps directly via the dots', async () => {
		const user = userEvent.setup();
		render(ServiceReviews, { reviews });
		await user.click(screen.getByRole('button', { name: 'Bewertung 2' }));
		expect(screen.getByText(/Alles top\./)).toBeInTheDocument();
	});

	it('hides carousel controls for a single review', () => {
		render(ServiceReviews, { reviews: [reviews[0]] });
		expect(screen.queryByRole('button', { name: 'Nächste Bewertung' })).not.toBeInTheDocument();
	});

	it('links to all Google reviews with the aggregate count', () => {
		render(ServiceReviews, { reviews });
		expect(
			screen.getByRole('link', { name: new RegExp(`Alle ${aggregateRating.reviewCount} Bewertungen`) })
		).toBeInTheDocument();
	});
});
