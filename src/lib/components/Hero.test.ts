import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Hero from './Hero.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';

beforeEach(() => closeContactFlow());
afterEach(() => vi.useRealTimers());

describe('Hero (city-page variant)', () => {
	it('composes the heading from leadIn, accent word, and trailing parts', () => {
		render(Hero, {
			leadIn: 'Ihre Umzugsfirma für',
			accentWord: 'Hannover',
			trailing: '– Festpreis aus Hildesheim',
		});
		const h1 = screen.getByRole('heading', { level: 1 });
		expect(h1).toHaveTextContent('Ihre Umzugsfirma für');
		expect(h1).toHaveTextContent('Hannover');
		expect(h1).toHaveTextContent('– Festpreis aus Hildesheim');
	});

	it('uses the unified contact flow CTA instead of a bespoke callback form', async () => {
		const user = userEvent.setup();
		render(Hero);
		// the broken inline flash-contact form must not come back
		expect(document.querySelector('form')).toBeNull();

		await user.click(screen.getByText('Kontakt aufnehmen'));
		expect(contactFlow.mode).toBe('picker');
	});

	it('renders the responsive hero image with srcset derived from imageBase', () => {
		render(Hero, { imageBase: '/some-image', imageAlt: 'Teamfoto' });
		const img = screen.getByAltText('Teamfoto');
		expect(img).toHaveAttribute('src', '/some-image.webp');
		expect(img.getAttribute('srcset')).toBe(
			'/some-image-400w.webp 400w, /some-image-600w.webp 600w, /some-image-800w.webp 800w'
		);
		expect(img).toHaveAttribute('fetchpriority', 'high');
	});

	it('shows the Google rating with the configured review count', () => {
		render(Hero, { ratingCount: '99+' });
		expect(screen.getByText(/basierend auf 99\+ Bewertungen/)).toBeInTheDocument();
	});

	it('renders all six default testimonials with exactly one active', () => {
		const { container } = render(Hero);
		const cards = container.querySelectorAll('.hero__testimonial');
		expect(cards).toHaveLength(6);
		expect(container.querySelectorAll('.hero__testimonial.active')).toHaveLength(1);
		// inactive slides are hidden from assistive tech
		expect(container.querySelectorAll('[aria-hidden="true"].hero__testimonial')).toHaveLength(5);
	});

	it('auto-advances the carousel every 7 seconds and wraps around', async () => {
		vi.useFakeTimers();
		const { container } = render(Hero);
		const activeIdx = () =>
			[...container.querySelectorAll('.hero__testimonial')].findIndex((el) =>
				el.classList.contains('active')
			);

		expect(activeIdx()).toBe(0);
		await vi.advanceTimersByTimeAsync(7000);
		expect(activeIdx()).toBe(1);
		await vi.advanceTimersByTimeAsync(7000 * 5);
		expect(activeIdx()).toBe(0); // wrapped
	});

	it('jumps to a testimonial via its dot and resets the timer', async () => {
		vi.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		const { container } = render(Hero);

		await user.click(screen.getByRole('button', { name: 'Bewertung 4' }));
		const activeIdx = () =>
			[...container.querySelectorAll('.hero__testimonial')].findIndex((el) =>
				el.classList.contains('active')
			);
		expect(activeIdx()).toBe(3);

		// timer restarted: 7s after the manual jump it moves to 5
		await vi.advanceTimersByTimeAsync(7000);
		expect(activeIdx()).toBe(4);
	});
});
