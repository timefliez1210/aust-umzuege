import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ReadyCloser from './ReadyCloser.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { setHoursOpen } from './testHours';

beforeEach(() => {
	closeContactFlow();
	setHoursOpen();
});

describe('ReadyCloser', () => {
	it('renders the default closer copy with the owner attribution', () => {
		render(ReadyCloser);
		expect(screen.getByText('Reden wir 5 Minuten. Den Rest erledigen wir.')).toBeInTheDocument();
		expect(screen.getByText('Alex Aust')).toBeInTheDocument();
		expect(screen.getByText('Inhaber, Aust Umzüge Hildesheim')).toBeInTheDocument();
	});

	it('accepts custom copy via props', () => {
		render(ReadyCloser, { title: 'Eigener Titel', lede: 'Eigene Lede', eyebrow: 'Los?' });
		expect(screen.getByText('Eigener Titel')).toBeInTheDocument();
		expect(screen.getByText('Eigene Lede')).toBeInTheDocument();
		expect(screen.getByText('Los?')).toBeInTheDocument();
	});

	it('embeds the contact card and opens the flow when an option is picked', async () => {
		const user = userEvent.setup();
		render(ReadyCloser);
		await user.click(screen.getByRole('button', { name: /Nachricht schreiben/ }));
		expect(contactFlow.mode).toBe('message');
	});
});
