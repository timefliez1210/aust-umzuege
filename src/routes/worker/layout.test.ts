import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import WorkerLayout from './+layout.svelte';
import { worker, type WorkerEmployee } from '$lib/stores/worker.svelte';
import { goto } from '$app/navigation';
import { setTestUrl } from '$lib/test/app-stores';

const employee: WorkerEmployee = {
	id: 'e1',
	email: 'max@aust.de',
	first_name: 'Max',
	last_name: 'Helfer',
	salutation: null,
	phone: null,
};

const children = createRawSnippet(() => ({
	render: () => '<div data-testid="page-content">Inhalt</div>',
}));

beforeEach(() => {
	localStorage.clear();
	worker.logout();
	vi.mocked(goto).mockClear();
});

describe('worker layout — auth guard', () => {
	it('redirects unauthenticated visitors to the login page', () => {
		setTestUrl('/worker/schedule');
		render(WorkerLayout, { children });
		expect(goto).toHaveBeenCalledWith('/worker/login');
		// shell must not render for unauthenticated users
		expect(screen.queryByText('Aust Mitarbeiter')).not.toBeInTheDocument();
	});

	it('renders the login page without shell or guard', () => {
		setTestUrl('/worker/login');
		render(WorkerLayout, { children });
		expect(goto).not.toHaveBeenCalled();
		expect(screen.getByTestId('page-content')).toBeInTheDocument();
		expect(screen.queryByText('Aust Mitarbeiter')).not.toBeInTheDocument();
	});
});

describe('worker layout — authenticated shell', () => {
	beforeEach(() => {
		worker.login('tok', employee);
		setTestUrl('/worker/schedule');
	});

	it('renders header, page content, and the two-tab bottom nav (no Stunden record)', () => {
		render(WorkerLayout, { children });
		expect(screen.getByText('Aust Mitarbeiter')).toBeInTheDocument();
		expect(screen.getByTestId('page-content')).toBeInTheDocument();

		expect(screen.getByRole('link', { name: /Einsätze/ })).toHaveAttribute('href', '/worker/schedule');
		expect(screen.getByRole('link', { name: /Profil/ })).toHaveAttribute('href', '/worker/profile');
		// workers must not have a digital hours record — no Stunden tab
		expect(screen.queryByRole('link', { name: /Stunden/ })).not.toBeInTheDocument();
	});

	it('highlights the active tab from the current route', () => {
		setTestUrl('/worker/profile');
		const { container } = render(WorkerLayout, { children });
		const active = container.querySelector('.nav-item.active');
		expect(active).toHaveTextContent('Profil');
	});

	it('logout clears the session and navigates to login', async () => {
		const user = userEvent.setup();
		render(WorkerLayout, { children });
		await user.click(screen.getByTitle('Abmelden'));
		expect(worker.isAuthenticated).toBe(false);
		expect(goto).toHaveBeenCalledWith('/worker/login');
	});
});
