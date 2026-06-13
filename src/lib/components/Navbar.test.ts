import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Navbar from './Navbar.svelte';
import { contactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { setTestUrl } from '$lib/test/app-stores';

beforeEach(() => {
	closeContactFlow();
	setTestUrl('/');
});

describe('Navbar — structure', () => {
	it('renders the logo as a home link', () => {
		render(Navbar);
		const home = screen.getByRole('link', { name: 'Zur Startseite' });
		expect(home).toHaveAttribute('href', '/');
		expect(within(home).getByAltText('Aust Umzüge Logo')).toBeInTheDocument();
	});

	it('renders the three top-level sections with their dropdown menus', () => {
		const { container } = render(Navbar);
		const desktop = container.querySelector('.navbar__links')!;
		for (const [label, href] of [
			['Leistungen', '/leistungen'],
			['Ratgeber', '/ratgeber'],
			['Über uns', '/ueber-uns'],
		]) {
			expect(within(desktop as HTMLElement).getByText(label).closest('a')).toHaveAttribute('href', href);
		}
		// every service page is reachable from the Leistungen dropdown
		const dropdownLinks = [...container.querySelectorAll('.navbar__dropdown-link')].map((a) =>
			a.getAttribute('href')
		);
		expect(dropdownLinks).toContain('/leistungen/privatumzug');
		expect(dropdownLinks).toContain('/leistungen/firmenumzug');
		expect(dropdownLinks).toContain('/ratgeber/umzugs-checkliste');
		expect(dropdownLinks.length).toBeGreaterThanOrEqual(24); // 15 Leistungen + 9 Ratgeber
	});

	it('marks the section of the current page as active', async () => {
		setTestUrl('/leistungen/privatumzug');
		const { container } = render(Navbar);
		const active = container.querySelector('.navbar__link.active');
		expect(active).toHaveTextContent('Leistungen');
	});

	it('desktop CTA opens the contact flow instead of navigating', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		const cta = within(container.querySelector('.navbar__cta-wrapper') as HTMLElement).getByRole(
			'button',
			{ name: 'Kontakt aufnehmen' }
		);
		await user.click(cta);
		expect(contactFlow.mode).toBe('picker');
	});
});

describe('Navbar — mobile menu', () => {
	it('toggle button controls the menu with correct aria state and inert', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		const toggle = screen.getByRole('button', { name: 'Menü öffnen' });
		const menu = container.querySelector('#mobile-menu')!;

		expect(toggle).toHaveAttribute('aria-expanded', 'false');
		expect((menu as HTMLElement).inert).toBe(true);

		await user.click(toggle);
		expect(screen.getByRole('button', { name: 'Menü schließen' })).toHaveAttribute(
			'aria-expanded',
			'true'
		);
		expect((menu as HTMLElement).inert).toBeFalsy();
	});

	it('expands a submenu accordion and collapses it again', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));

		const subToggle = screen.getByRole('button', { name: 'Leistungen Untermenü öffnen' });
		expect(subToggle).toHaveAttribute('aria-expanded', 'false');
		expect(container.querySelector('.navbar__mobile-sublinks')).toBeNull();

		await user.click(subToggle);
		expect(subToggle).toHaveAttribute('aria-expanded', 'true');
		const sublinks = container.querySelector('.navbar__mobile-sublinks')!;
		expect(within(sublinks as HTMLElement).getByText('Privatumzug')).toBeInTheDocument();

		// opening the other submenu closes the first (single-accordion behaviour)
		await user.click(screen.getByRole('button', { name: 'Ratgeber Untermenü öffnen' }));
		expect(subToggle).toHaveAttribute('aria-expanded', 'false');

		// collapse by clicking again
		await user.click(screen.getByRole('button', { name: 'Ratgeber Untermenü öffnen' }));
		expect(container.querySelector('.navbar__mobile-sublinks')).toBeNull();
	});

	it('closes the menu when a navigation link is tapped', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));

		const mobile = container.querySelector('.navbar__mobile')!;
		const ueberUns = within(mobile as HTMLElement).getByText('Über uns');
		await user.click(ueberUns);

		expect(mobile.classList.contains('open')).toBe(false);
		expect((mobile as HTMLElement).inert).toBe(true);
	});

	it('mobile CTA closes the menu and opens the contact flow', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));

		const mobile = container.querySelector('.navbar__mobile') as HTMLElement;
		await user.click(within(mobile).getByRole('button', { name: 'Kontakt aufnehmen' }));

		expect(contactFlow.mode).toBe('picker');
		expect(mobile.classList.contains('open')).toBe(false);
	});

	it('resets open submenus when the menu is closed via the toggle', async () => {
		const user = userEvent.setup();
		const { container } = render(Navbar);
		await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
		await user.click(screen.getByRole('button', { name: 'Leistungen Untermenü öffnen' }));
		await user.click(screen.getByRole('button', { name: 'Menü schließen' }));
		await user.click(screen.getByRole('button', { name: 'Menü öffnen' }));
		expect(container.querySelector('.navbar__mobile-sublinks')).toBeNull();
	});
});
