import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import LoadingButton from './LoadingButton.svelte';

const label = createRawSnippet(() => ({ render: () => '<span>Speichern</span>' }));

describe('LoadingButton', () => {
	it('renders the label and fires onclick when idle', async () => {
		const user = userEvent.setup();
		const onclick = vi.fn();
		render(LoadingButton, { children: label, onclick });

		const btn = screen.getByRole('button', { name: 'Speichern' });
		expect(btn).toBeEnabled();
		await user.click(btn);
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('disables itself and shows a spinner while loading', () => {
		const { container } = render(LoadingButton, { children: label, loading: true });
		expect(screen.getByRole('button')).toBeDisabled();
		expect(container.querySelector('svg')).not.toBeNull();
	});

	it('respects an additional disabled condition', () => {
		render(LoadingButton, { children: label, disabled: true });
		expect(screen.getByRole('button')).toBeDisabled();
	});

	it('maps variant and size onto the console button', () => {
		const { container, unmount } = render(LoadingButton, {
			children: label,
			variant: 'danger',
			size: 'sm',
		});
		const btn = container.querySelector('button')!;
		expect(btn.dataset.variant === 'danger').toBe(true);
		expect(btn.dataset.size === 'sm').toBe(true);
		unmount();

		const { container: c2 } = render(LoadingButton, { children: label, variant: 'ghost' });
		expect(c2.querySelector('button')!.dataset.variant === 'ghost').toBe(true);
	});

	it('defaults to type="button" so it never submits forms accidentally', () => {
		render(LoadingButton, { children: label });
		expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
	});
});
