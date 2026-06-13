import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AboutSection from './AboutSection.svelte';

describe('AboutSection', () => {
	it('renders the default owner-led copy', () => {
		render(AboutSection);
		expect(screen.getByText('Vollservice-Umzugsunternehmen aus Hildesheim')).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: /pünktlich, sorgfältig, persönlich/ })
		).toBeInTheDocument();
		// inhabergeführt narrative is part of the documented brand intent
		expect(screen.getByText(/Alex Aust selbst vorbei/)).toBeInTheDocument();
	});

	it('renders one paragraph per entry', () => {
		render(AboutSection, {
			tagline: 'T',
			heading: 'H',
			paragraphs: ['Absatz eins.', 'Absatz zwei.', 'Absatz drei.'],
		});
		expect(screen.getByText('Absatz eins.')).toBeInTheDocument();
		expect(screen.getByText('Absatz zwei.')).toBeInTheDocument();
		expect(screen.getByText('Absatz drei.')).toBeInTheDocument();
	});

	it('derives the responsive srcset from the imageSrc and lazy-loads it', () => {
		render(AboutSection, { imageSrc: '/team-foto.webp', imageAlt: 'Das Team' });
		const img = screen.getByAltText('Das Team');
		expect(img.getAttribute('srcset')).toBe(
			'/team-foto-400w.webp 400w, /team-foto-500w.webp 500w, /team-foto-600w.webp 600w'
		);
		expect(img).toHaveAttribute('loading', 'lazy');
	});

	it('supports the reversed layout variant', () => {
		const { container } = render(AboutSection, { reversed: true });
		expect(container.querySelector('.about-section.reversed')).not.toBeNull();
	});
});
