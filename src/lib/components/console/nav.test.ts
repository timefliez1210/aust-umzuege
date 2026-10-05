import { describe, it, expect } from 'vitest';
import { NAV, navFor, isActive, TAB_HREFS, currentItem } from './nav';

const hrefs = (role?: string) => navFor(role).flatMap((g) => g.items.map((i) => i.href));

describe('console navigation', () => {
	it('lists every admin section exactly once', () => {
		const all = NAV.flatMap((g) => g.items.map((i) => i.href));
		expect(new Set(all).size).toBe(all.length);
		for (const h of [
			'/admin',
			'/admin/inquiries',
			'/admin/flash-contacts',
			'/admin/emails',
			'/admin/orders',
			'/admin/calendar',
			'/admin/calendar-items',
			'/admin/storage',
			'/admin/kva-buch',
			'/admin/rechnungsausgangsbuch',
			'/admin/gewinn',
			'/admin/customers',
			'/admin/employees',
			'/admin/vehicles',
			'/admin/reports',
			'/admin/settings'
		]) {
			expect(all).toContain(h);
		}
	});

	it('keeps Gewinn and Feedback for the admin role', () => {
		expect(hrefs('office')).not.toContain('/admin/gewinn');
		expect(hrefs('office')).not.toContain('/admin/reports');
		expect(hrefs('admin')).toContain('/admin/gewinn');
		expect(hrefs('admin')).toContain('/admin/reports');
	});

	it('matches Heute exactly and every other section by prefix', () => {
		expect(isActive('/admin', '/admin')).toBe(true);
		expect(isActive('/admin', '/admin/inquiries')).toBe(false);
		expect(isActive('/admin/inquiries', '/admin/inquiries/abc')).toBe(true);
		// "/admin/calendar" must not light up on "/admin/calendar-items"
		expect(isActive('/admin/calendar', '/admin/calendar-items')).toBe(false);
		expect(currentItem('/admin/calendar-items/x')?.label).toBe('Termine');
	});

	it('only puts real sections on the phone tab bar', () => {
		const all = NAV.flatMap((g) => g.items.map((i) => i.href));
		for (const h of TAB_HREFS) expect(all).toContain(h);
	});
});

describe('platform tab', () => {
	it('shows "Firmen" only to platform superusers', () => {
		const all = (role: string, su: boolean) => navFor(role, su).flatMap((g) => g.items.map((i) => i.href));
		expect(all('admin', false)).not.toContain('/admin/platform');
		expect(all('buerokraft', false)).not.toContain('/admin/platform');
		expect(all('admin', true)).toContain('/admin/platform');
	});
});
