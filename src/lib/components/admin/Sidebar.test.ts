import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar.svelte';
import { auth } from '$lib/stores/auth.svelte';
import { setTestUrl } from '$lib/test/app-stores';

const baseProps = { collapsed: false, onToggle: () => {} };

/** Badge payload the sidebar polls on mount; overridden per test. */
let badgeCounts: Record<string, number>;

beforeEach(() => {
	auth.logout();
	setTestUrl('/admin');
	badgeCounts = { flash_contacts: 0, unread_emails: 0, new_inquiries: 0, kva_followups: 0 };
	vi.stubGlobal(
		'fetch',
		vi.fn(() =>
			Promise.resolve(
				new Response(JSON.stringify(badgeCounts), {
					headers: { 'content-type': 'application/json' }
				})
			)
		)
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
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

describe('Sidebar — badges', () => {
	it('shows the open-callback count on the Rückrufe link', async () => {
		badgeCounts.flash_contacts = 3;
		render(Sidebar, baseProps);
		expect(await screen.findByLabelText('3 offene Rückrufe')).toHaveTextContent('3');
	});

	it('badges every counted section and leaves the rest bare', async () => {
		badgeCounts = {
			flash_contacts: 1,
			unread_emails: 2,
			new_inquiries: 4,
			kva_followups: 5
		};
		const { container } = render(Sidebar, baseProps);
		await screen.findByLabelText('1 offene Rückrufe');
		expect(screen.getByLabelText('2 ungelesene E-Mails')).toBeInTheDocument();
		expect(screen.getByLabelText('4 neue Anfragen')).toBeInTheDocument();
		expect(screen.getByLabelText('5 KVA zum Nachfassen')).toBeInTheDocument();
		expect(container.querySelectorAll('.nav-badge').length).toBe(4);
	});

	it('hides a badge at zero and caps three-digit counts', async () => {
		badgeCounts.flash_contacts = 120;
		const { container } = render(Sidebar, baseProps);
		expect(await screen.findByLabelText('120 offene Rückrufe')).toHaveTextContent('99+');
		// unread_emails/new_inquiries/kva_followups are all 0 — no badge for them.
		expect(container.querySelectorAll('.nav-badge').length).toBe(1);
	});

	it('keeps the navigation intact when the badge poll fails', async () => {
		vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
		const { container } = render(Sidebar, baseProps);
		expect(screen.getByRole('link', { name: 'Rückrufe' })).toBeInTheDocument();
		await vi.waitFor(() => expect(container.querySelectorAll('.nav-badge').length).toBe(0));
	});
});
