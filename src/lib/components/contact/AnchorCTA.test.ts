import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AnchorCTA from './AnchorCTA.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';

beforeEach(() => closeContactFlow());

describe('AnchorCTA', () => {
	it('renders title, sub line, and the default button label', () => {
		render(AnchorCTA, { title: 'Reden wir 5 Minuten.', sub: 'Sie entscheiden.' });
		expect(screen.getByText('Reden wir 5 Minuten.')).toBeInTheDocument();
		expect(screen.getByText('Sie entscheiden.')).toBeInTheDocument();
		expect(screen.getByText('Kontakt aufnehmen')).toBeInTheDocument();
	});

	it('opens the contact flow picker when clicked', async () => {
		const user = userEvent.setup();
		render(AnchorCTA, { title: 'T', sub: 'S' });
		await user.click(screen.getByRole('button'));
		expect(contactFlow.mode).toBe('picker');
	});

	it('supports a custom button label and the primary variant', () => {
		const { container } = render(AnchorCTA, {
			title: 'T',
			sub: 'S',
			variant: 'primary',
			buttonLabel: 'Jetzt starten',
		});
		expect(screen.getByText('Jetzt starten')).toBeInTheDocument();
		expect(container.querySelector('.acta--primary')).not.toBeNull();
	});
});
