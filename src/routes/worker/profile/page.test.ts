import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ProfilePage from './+page.svelte';
import { worker } from '$lib/stores/worker.svelte';
import { goto } from '$app/navigation';

beforeEach(() => {
	localStorage.clear();
	worker.logout();
	vi.mocked(goto).mockClear();
});

describe('worker profile', () => {
	it('shows initials avatar, full name, email, and tappable phone', () => {
		worker.login('tok', {
			id: 'e1',
			email: 'max@aust.de',
			first_name: 'Max',
			last_name: 'Helfer',
			salutation: 'Herr',
			phone: '0151 999',
		});
		render(ProfilePage);

		expect(screen.getByText('MH')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Max Helfer' })).toBeInTheDocument();
		expect(screen.getByText('max@aust.de')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: '0151 999' })).toHaveAttribute('href', 'tel:0151 999');
	});

	it('omits the phone row when no phone is stored', () => {
		worker.login('tok', {
			id: 'e1',
			email: 'max@aust.de',
			first_name: 'Max',
			last_name: 'Helfer',
			salutation: null,
			phone: null,
		});
		render(ProfilePage);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('logout clears the session and redirects to login', async () => {
		worker.login('tok', {
			id: 'e1',
			email: 'max@aust.de',
			first_name: 'Max',
			last_name: 'Helfer',
			salutation: null,
			phone: null,
		});
		const user = userEvent.setup();
		render(ProfilePage);

		await user.click(screen.getByRole('button', { name: /Abmelden/ }));
		expect(worker.isAuthenticated).toBe(false);
		expect(goto).toHaveBeenCalledWith('/worker/login');
	});

	it('shows a fallback when no profile is loaded', () => {
		render(ProfilePage);
		expect(screen.getByText('Kein Profil geladen.')).toBeInTheDocument();
	});
});
