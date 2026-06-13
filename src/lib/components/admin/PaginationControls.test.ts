import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PaginationControls from './PaginationControls.svelte';

describe('PaginationControls', () => {
	it('shows "Seite X von Y" with totalPages = ceil(total / limit)', () => {
		render(PaginationControls, { page: 1, total: 45, limit: 20, onPrev: () => {}, onNext: () => {} });
		expect(screen.getByText('Seite 2 von 3')).toBeInTheDocument();
	});

	it('disables prev on the first page and next on the last', () => {
		const { unmount } = render(PaginationControls, {
			page: 0,
			total: 45,
			limit: 20,
			onPrev: () => {},
			onNext: () => {},
		});
		expect(screen.getByRole('button', { name: 'Vorherige Seite' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeEnabled();
		unmount();

		render(PaginationControls, { page: 2, total: 45, limit: 20, onPrev: () => {}, onNext: () => {} });
		expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeDisabled();
	});

	it('invokes the navigation callbacks', async () => {
		const user = userEvent.setup();
		const onPrev = vi.fn();
		const onNext = vi.fn();
		render(PaginationControls, { page: 1, total: 60, limit: 20, onPrev, onNext });

		await user.click(screen.getByRole('button', { name: 'Vorherige Seite' }));
		await user.click(screen.getByRole('button', { name: 'Nächste Seite' }));
		expect(onPrev).toHaveBeenCalledTimes(1);
		expect(onNext).toHaveBeenCalledTimes(1);
	});

	it('shows at least one page even for an empty list', () => {
		render(PaginationControls, { page: 0, total: 0, limit: 20, onPrev: () => {}, onNext: () => {} });
		expect(screen.getByText('Seite 1 von 1')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Nächste Seite' })).toBeDisabled();
	});
});
