import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Toast, { showToast } from './Toast.svelte';

beforeEach(() => vi.useFakeTimers());
afterEach(async () => {
	// flush any pending auto-dismiss timers so module-level toast state is clean
	await act(() => vi.runAllTimers());
	vi.useRealTimers();
});

describe('Toast', () => {
	it('renders nothing while no toast is queued', () => {
		const { container } = render(Toast);
		expect(container.querySelector('.toast-container')).toBeNull();
	});

	it('showToast surfaces a message with the requested variant from anywhere', async () => {
		render(Toast);
		await act(() => showToast('Gespeichert', 'success'));

		const toast = screen.getByText('Gespeichert').closest('.toast')!;
		expect(toast.classList.contains('toast-success')).toBe(true);
	});

	it('defaults to the info variant', async () => {
		render(Toast);
		await act(() => showToast('Hinweis'));
		expect(screen.getByText('Hinweis').closest('.toast')!.classList.contains('toast-info')).toBe(true);
	});

	it('stacks multiple toasts and auto-dismisses each after 4 seconds', async () => {
		render(Toast);
		await act(() => showToast('Erster', 'success'));
		await act(() => vi.advanceTimersByTime(1000));
		await act(() => showToast('Zweiter', 'error'));

		expect(screen.getByText('Erster')).toBeInTheDocument();
		expect(screen.getByText('Zweiter')).toBeInTheDocument();

		await act(() => vi.advanceTimersByTime(3000)); // first reaches 4s
		expect(screen.queryByText('Erster')).not.toBeInTheDocument();
		expect(screen.getByText('Zweiter')).toBeInTheDocument();

		await act(() => vi.advanceTimersByTime(1000)); // second reaches 4s
		expect(screen.queryByText('Zweiter')).not.toBeInTheDocument();
	});

	it('respects a custom duration', async () => {
		render(Toast);
		await act(() => showToast('Lang', 'info', { durationMs: 10000 }));
		await act(() => vi.advanceTimersByTime(5000));
		expect(screen.getByText('Lang')).toBeInTheDocument();
		await act(() => vi.advanceTimersByTime(5000));
		expect(screen.queryByText('Lang')).not.toBeInTheDocument();
	});

	it('can be dismissed manually before the timer fires', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		render(Toast);
		await act(() => showToast('Weg damit', 'info'));

		await user.click(screen.getByRole('button', { name: 'Schliessen' }));
		expect(screen.queryByText('Weg damit')).not.toBeInTheDocument();
	});

	it('runs the optional action callback and dismisses the toast', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
		const onClick = vi.fn();
		render(Toast);
		await act(() => showToast('Rückgängig?', 'success', { action: { label: 'Undo', onClick } }));

		await user.click(screen.getByRole('button', { name: 'Undo' }));
		expect(onClick).toHaveBeenCalledTimes(1);
		expect(screen.queryByText('Rückgängig?')).not.toBeInTheDocument();
	});
});
