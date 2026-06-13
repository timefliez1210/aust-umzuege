import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CTAButton from './CTAButton.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';

describe('CTAButton', () => {
	beforeEach(() => {
		closeContactFlow();
	});

	it('renders a link when only href is given', () => {
		render(CTAButton, { text: 'Jetzt anfragen', href: '/kostenloses-angebot' });
		const link = screen.getByRole('link', { name: 'Jetzt anfragen' });
		expect(link).toHaveAttribute('href', '/kostenloses-angebot');
	});

	it('renders a button instead of a link when openFlow is set', () => {
		render(CTAButton, { text: 'Kontakt aufnehmen', openFlow: true });
		expect(screen.getByRole('button', { name: 'Kontakt aufnehmen' })).toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('opens the site-wide contact flow picker on click when openFlow is set', async () => {
		const user = userEvent.setup();
		render(CTAButton, { text: 'Kontakt aufnehmen', openFlow: true });

		await user.click(screen.getByRole('button', { name: 'Kontakt aufnehmen' }));
		expect(contactFlow.mode).toBe('picker');
	});

	it('renders a button and forwards clicks when a custom onclick is given', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(CTAButton, { text: 'Mehr erfahren', onclick });

		await user.click(screen.getByRole('button', { name: 'Mehr erfahren' }));
		expect(onclick).toHaveBeenCalledTimes(1);
		// without openFlow the contact flow must stay closed
		expect(contactFlow.mode).toBe(null);
	});

	it('shows the arrow icon by default and hides it with showArrow=false', () => {
		const { container, unmount } = render(CTAButton, { text: 'A', href: '/' });
		expect(container.querySelector('svg')).not.toBeNull();
		unmount();

		const { container: c2 } = render(CTAButton, { text: 'B', href: '/', showArrow: false });
		expect(c2.querySelector('svg')).toBeNull();
	});

	it('applies the aria-label when provided', () => {
		render(CTAButton, { text: 'Anfragen', href: '/x', ariaLabel: 'Kostenloses Angebot anfordern' });
		expect(screen.getByRole('link', { name: 'Kostenloses Angebot anfordern' })).toBeInTheDocument();
	});
});
