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

	it('applies variant and size classes from admin-components.css', () => {
		const { container, unmount } = render(LoadingButton, {
			children: label,
			variant: 'danger',
			size: 'sm',
		});
		const btn = container.querySelector('button')!;
		expect(btn.classList.contains('btn-danger')).toBe(true);
		expect(btn.classList.contains('btn-sm')).toBe(true);
		unmount();

		const { container: c2 } = render(LoadingButton, { children: label, variant: 'ghost' });
		expect(c2.querySelector('button')!.classList.contains('btn-ghost')).toBe(true);
	});

	it('defaults to type="button" so it never submits forms accidentally', () => {
		render(LoadingButton, { children: label });
		expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
	});
});
