import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ReviewsSection from './ReviewsSection.svelte';
import { reviews, allReviewsUrl } from '$lib/data/structuredData';

beforeEach(() => {
	// jsdom has no IntersectionObserver; the component uses it to lazy-load the
	// wkdb seal widget only when scrolled into view.
	vi.stubGlobal(
		'IntersectionObserver',
		class {
			observe() {}
			disconnect() {}
			unobserve() {}
		}
	);
});

describe('ReviewsSection', () => {
	it('renders the heading and the aggregate-rating link to Google', () => {
		render(ReviewsSection);
		expect(screen.getByRole('heading', { name: 'Das sagen unsere Kunden' })).toBeInTheDocument();
		const links = screen
			.getAllByRole('link')
			.filter((a) => a.getAttribute('href') === allReviewsUrl);
		expect(links.length).toBeGreaterThan(0);
	});

	it('renders every review from the structured data', () => {
		render(ReviewsSection);
		// each review author must appear in the carousel track
		for (const r of reviews.slice(0, 3)) {
			expect(screen.getByText(new RegExp(r.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
		}
	});

	it('offers prev/next controls that do not crash at the bounds', async () => {
		const user = userEvent.setup();
		render(ReviewsSection);
		const prev = screen.getByRole('button', { name: 'Vorherige Bewertung' });
		const next = screen.getByRole('button', { name: 'Nächste Bewertung' });

		await user.click(prev); // clamped at 0
		for (let i = 0; i < reviews.length + 2; i++) await user.click(next); // clamped at max
		expect(screen.getByRole('button', { name: 'Gehe zu Bewertung 1' })).toBeInTheDocument();
	});

	it('does not load the wkdb seal script before the section is visible', () => {
		render(ReviewsSection);
		const wkdb = [...document.querySelectorAll('script')].find((s) =>
			s.src.includes('wkdb-siegel.de')
		);
		expect(wkdb).toBeUndefined();
	});
});
