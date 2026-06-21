import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import HoursPage from './+page.svelte';
import { worker } from '$lib/stores/worker.svelte';
import { goto } from '$app/navigation';

const employee = {
	id: 'e1',
	email: 'max@aust.de',
	first_name: 'Max',
	last_name: 'Helfer',
	salutation: null,
	phone: null,
};

beforeEach(() => {
	localStorage.clear();
	worker.login('tok', employee);
	vi.mocked(goto).mockClear();
});

afterEach(() => {
	vi.restoreAllMocks();
	worker.logout();
});

// The worker hours summary was removed on purpose: workers must not have a
// digital record of their accumulated hours. The route now only bounces any
// stale bookmark back to the schedule and never fetches or renders hours.
describe('worker hours route — removed (no digital record)', () => {
	it('redirects to the schedule and never shows an hours total', () => {
		const fetchMock = vi.fn();
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		const { container } = render(HoursPage);

		expect(goto).toHaveBeenCalledWith('/worker/schedule', { replaceState: true });
		// no API call for an hours summary, nothing rendered
		expect(fetchMock).not.toHaveBeenCalled();
		expect(container.textContent?.trim()).toBe('');
	});
});
