import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StatusPill from './StatusPill.svelte';
import { setHoursOpen, setHoursClosed } from './testHours';

describe('StatusPill', () => {
	it('shows the open label with the open styling during office hours', () => {
		setHoursOpen();
		const { container } = render(StatusPill);
		const pill = container.querySelector('.status')!;
		expect(pill).toHaveTextContent('Geöffnet — wir gehen sofort ran');
		expect(pill.classList.contains('status--open')).toBe(true);
		expect(pill.classList.contains('status--closed')).toBe(false);
	});

	it('shows the closed label with the amber styling outside office hours', () => {
		setHoursClosed();
		const { container } = render(StatusPill);
		const pill = container.querySelector('.status')!;
		expect(pill).toHaveTextContent('Aktuell geschlossen');
		expect(pill.classList.contains('status--closed')).toBe(true);
	});
});
