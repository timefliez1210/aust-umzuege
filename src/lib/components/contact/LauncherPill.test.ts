import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import LauncherPill from './LauncherPill.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { setHoursOpen, setHoursClosed } from './testHours';

beforeEach(() => closeContactFlow());

describe('LauncherPill', () => {
	it('opens the contact flow picker on click', async () => {
		setHoursOpen();
		const user = userEvent.setup();
		render(LauncherPill);

		await user.click(screen.getByRole('button', { name: 'Kontakt aufnehmen' }));
		expect(contactFlow.mode).toBe('picker');
	});

	it('advertises instant answers while open', () => {
		setHoursOpen();
		render(LauncherPill);
		expect(screen.getByText(/Geöffnet · sofort Antwort/)).toBeInTheDocument();
	});

	it('shows the reopen time while closed', () => {
		setHoursClosed('am Montag ab 09:00 Uhr');
		render(LauncherPill);
		expect(screen.getByText(/Geschlossen · am Montag ab 09:00 Uhr/)).toBeInTheDocument();
	});
});
