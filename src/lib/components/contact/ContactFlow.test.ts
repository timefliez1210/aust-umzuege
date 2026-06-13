import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import ContactFlow from './ContactFlow.svelte';
import { openContactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { setHoursOpen } from './testHours';

beforeEach(() => {
	closeContactFlow();
	setHoursOpen();
});

describe('ContactFlow host (mounted once in the root layout)', () => {
	it('always shows the floating launcher pill', () => {
		render(ContactFlow);
		expect(screen.getByRole('button', { name: 'Kontakt aufnehmen' })).toBeInTheDocument();
	});

	it('any component can surface the sheet through the store opener', async () => {
		render(ContactFlow);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

		openContactFlow('callback');
		await tick();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
