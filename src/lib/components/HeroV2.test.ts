import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import HeroV2 from './HeroV2.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { PHONE_HREF, PHONE_DISPLAY } from '$lib/components/contact/constants';

beforeEach(() => closeContactFlow());

describe('HeroV2 (homepage hero)', () => {
	it('renders the Festpreis headline with accent', () => {
		render(HeroV2);
		const h1 = screen.getByRole('heading', { level: 1 });
		expect(h1).toHaveTextContent('Ihr Umzug in Hildesheim — zum');
		expect(h1).toHaveTextContent('Festpreis.');
	});

	it('phone CTA uses the shared constants (E.164 tel link)', () => {
		render(HeroV2);
		const phone = screen.getByRole('link', { name: /Lieber direkt anrufen/ });
		expect(phone).toHaveAttribute('href', PHONE_HREF);
		expect(phone).toHaveTextContent(PHONE_DISPLAY);
	});

	it('primary CTA opens the contact flow', async () => {
		const user = userEvent.setup();
		render(HeroV2);
		await user.click(screen.getByText('Reden wir 5 Minuten.'));
		expect(contactFlow.mode).toBe('picker');
	});

	it('lists the three trust badges (Vor-Ort-Termin, Angebot, Festpreis-Garantie)', () => {
		render(HeroV2);
		expect(screen.getByText('Kostenloser Vor-Ort-Termin')).toBeInTheDocument();
		expect(screen.getByText('Verbindliches Angebot')).toBeInTheDocument();
		expect(screen.getByText('Festpreis-Garantie')).toBeInTheDocument();
	});

	it('shows the owner portrait with eager loading (LCP element)', () => {
		render(HeroV2);
		const img = screen.getByAltText('Alex Aust, Inhaber Aust Umzüge Hildesheim');
		expect(img).toHaveAttribute('loading', 'eager');
		expect(img).toHaveAttribute('fetchpriority', 'high');
		expect(img.getAttribute('srcset')).toContain('-400w.webp 400w');
	});

	it('links the testimonial to its Google review', () => {
		render(HeroV2);
		const link = screen.getByRole('link', { name: /eine von 71× ★★★★★ auf Google/ });
		expect(link).toHaveAttribute('target', '_blank');
		expect(link.getAttribute('href')).toContain('maps.app.goo.gl');
	});
});
