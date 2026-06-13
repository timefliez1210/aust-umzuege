import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { setTestUrl } from '$lib/test/app-stores';

const baseProps = { collapsed: false, onToggle: () => {} };

beforeEach(() => {
	auth.logout();
	setTestUrl('/admin');
});

describe('Sidebar — navigation', () => {
	it('renders all main admin sections with their routes', () => {
		render(Sidebar, baseProps);
		for (const [label, href] of [
			['Dashboard', '/admin'],
			['Anfragen', '/admin/inquiries'],
			['Auftraege', '/admin/orders'],
			['Mitarbeiter', '/admin/employees'],
			['Kunden', '/admin/customers'],
			['E-Mails', '/admin/emails'],
			['Kalender', '/admin/calendar'],
			['Termine', '/admin/calendar-items'],
			['Rechnungsausgangsbuch', '/admin/rechnungsausgangsbuch'],
			['Rückrufe', '/admin/flash-contacts'],
			['Einstellungen', '/admin/settings'],
		] as const) {
			expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
		}
	});

	it('marks the current section active — exact match for the dashboard, prefix for the rest', () => {
		setTestUrl('/admin/inquiries/abc-123');
		render(Sidebar, baseProps);
		expect(screen.getByRole('link', { name: 'Anfragen' })).toHaveAttribute('aria-current', 'page');
		// dashboard link must NOT light up on nested routes
		expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
	});

	it('the Reports link is reserved for the admin role', () => {
		const { unmount } = render(Sidebar, baseProps);
		expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument();
		unmount();

		auth.user = { email: 'a@aust.de', name: 'Alex', role: 'admin' };
		render(Sidebar, baseProps);
		expect(screen.getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/admin/reports');
	});
});

describe('Sidebar — collapse behaviour', () => {
	it('hides labels and brand when collapsed (icons only)', () => {
		render(Sidebar, { ...baseProps, collapsed: true });
		expect(screen.queryByText('AUST')).not.toBeInTheDocument();
		expect(screen.queryByText('Anfragen')).not.toBeInTheDocument();
		// links are still there, just icon-only
		expect(document.querySelectorAll('.sidebar-link').length).toBeGreaterThanOrEqual(11);
	});

	it('the toggle button reports back to the parent', async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		render(Sidebar, { ...baseProps, onToggle });
		await user.click(screen.getByRole('button', { name: 'Sidebar umschalten' }));
		expect(onToggle).toHaveBeenCalledTimes(1);
	});

	it('applies the mobile-open drawer class', () => {
		const { container } = render(Sidebar, { ...baseProps, mobileOpen: true });
		expect(container.querySelector('.sidebar.mobile-open')).not.toBeNull();
	});
});
