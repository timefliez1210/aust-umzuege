import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ConfirmationDialog from './ConfirmationDialog.svelte';

const base = {
	title: 'Anfrage löschen?',
	message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
	onConfirm: () => {},
};

describe('ConfirmationDialog', () => {
	it('renders nothing while closed', () => {
		render(ConfirmationDialog, { ...base, open: false });
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows title, message, and both actions when open', () => {
		render(ConfirmationDialog, { ...base, open: true });
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAccessibleName('Anfrage löschen?');
		expect(screen.getByText(base.message)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Bestätigen' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
	});

	it('confirm fires onConfirm and closes the dialog', async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		render(ConfirmationDialog, { ...base, open: true, onConfirm });

		await user.click(screen.getByRole('button', { name: 'Bestätigen' }));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('cancel fires onCancel and closes without confirming', async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		render(ConfirmationDialog, { ...base, open: true, onConfirm, onCancel });

		await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('backdrop click cancels, clicks inside the modal do not', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		const { container } = render(ConfirmationDialog, { ...base, open: true, onCancel });

		await user.click(screen.getByText(base.message)); // inside
		expect(screen.getByRole('dialog')).toBeInTheDocument();

		await user.click(container.querySelector('.modal-backdrop')!);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('disables both buttons and keeps the dialog open while loading', async () => {
		const user = userEvent.setup();
		render(ConfirmationDialog, { ...base, open: true, loading: true });

		expect(screen.getByRole('button', { name: 'Bestätigen' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDisabled();
	});

	it('supports custom labels and the primary variant', () => {
		const { container } = render(ConfirmationDialog, {
			...base,
			open: true,
			confirmLabel: 'Senden',
			cancelLabel: 'Doch nicht',
			variant: 'primary',
		});
		expect(screen.getByRole('button', { name: 'Senden' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Doch nicht' })).toBeInTheDocument();
		expect(container.querySelector('.btn-primary')).not.toBeNull();
		expect(container.querySelector('.btn-danger')).toBeNull();
	});
});
