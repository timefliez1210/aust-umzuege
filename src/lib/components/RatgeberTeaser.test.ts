import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RatgeberTeaser from './RatgeberTeaser.svelte';

describe('RatgeberTeaser', () => {
	it('renders all nine guide cards as links to their articles', () => {
		const { container } = render(RatgeberTeaser);
		const cards = container.querySelectorAll('a.ratgeber-card');
		expect(cards).toHaveLength(9);

		const hrefs = [...cards].map((a) => a.getAttribute('href'));
		for (const expected of [
			'/ratgeber/umzugs-checkliste',
			'/ratgeber/verpackungstipps',
			'/ratgeber/haushaltsaufloesungen-entruempelungen',
			'/ratgeber/seriose-umzugsfirma',
			'/ratgeber/messie-wohnung-raeumen',
			'/ratgeber/umzug-mit-kindern',
			'/ratgeber/moebel-einlagern',
			'/ratgeber/umzug-mit-buergergeld',
			'/ratgeber/umzugskosten-steuerlich-absetzen',
		]) {
			expect(hrefs).toContain(expected);
		}
	});

	it('links to the guide index page', () => {
		render(RatgeberTeaser);
		expect(screen.getByRole('link', { name: /Alle Ratgeber-Artikel/ })).toHaveAttribute(
			'href',
			'/ratgeber'
		);
	});
});
