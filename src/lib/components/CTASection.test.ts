import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CTASection from './CTASection.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';

beforeEach(() => closeContactFlow());

describe('CTASection', () => {
	it('renders heading, description, and the CTA', () => {
		render(CTASection, {
			heading: 'Haben Sie Fragen?',
			description: 'Wir beraten Sie gerne.',
			buttonText: 'Kontakt aufnehmen',
		});
		expect(screen.getByRole('heading', { name: 'Haben Sie Fragen?' })).toBeInTheDocument();
		expect(screen.getByText('Wir beraten Sie gerne.')).toBeInTheDocument();
	});

	it('opens the contact flow by default — buttonHref is documented as ignored then', async () => {
		const user = userEvent.setup();
		render(CTASection, {
			heading: 'H',
			description: 'D',
			buttonText: 'Kontakt aufnehmen',
			buttonHref: '/kontakt', // ignored: openFlow defaults to true
		});

		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Kontakt aufnehmen' }));
		expect(contactFlow.mode).toBe('picker');
	});

	it('falls back to a plain link when openFlow is disabled', () => {
		render(CTASection, {
			heading: 'H',
			description: 'D',
			buttonText: 'Zum Angebot',
			buttonHref: '/kostenloses-angebot',
			openFlow: false,
		});
		expect(screen.getByRole('link', { name: 'Zum Angebot' })).toHaveAttribute(
			'href',
			'/kostenloses-angebot'
		);
	});
});
