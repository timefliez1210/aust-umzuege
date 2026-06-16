import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import SchedulePage from './+page.svelte';
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

const inquiryJob = {
	inquiry_id: 'inq-1',
	job_date: '2026-06-15',
	status: 'scheduled',
	origin_street: 'Kaiserstr. 32',
	origin_city: 'Hildesheim',
	destination_street: 'Bahnhofstr. 1',
	destination_city: 'Hannover',
	estimated_volume_m3: 24.5,
	customer_name: 'Familie Muster',
	colleague_names: ['Anna', 'Ben'],
	entry_type: 'inquiry',
	calendar_item_id: null,
	title: null,
	location: null,
	category: null,
	employee_notes: null,
};

const itemJob = {
	inquiry_id: null,
	job_date: '2026-06-16',
	status: 'confirmed',
	origin_street: null,
	origin_city: null,
	destination_street: null,
	destination_city: null,
	estimated_volume_m3: null,
	customer_name: null,
	colleague_names: [],
	entry_type: 'item',
	calendar_item_id: 'ci-1',
	title: 'Lager aufräumen',
	location: 'Halle 2',
	category: 'Intern',
	employee_notes: 'Handschuhe mitbringen',
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	localStorage.clear();
	worker.login('tok', employee);
	vi.mocked(goto).mockClear();
	fetchMock = vi.fn().mockImplementation(() =>
		Promise.resolve(
			new Response(JSON.stringify([inquiryJob, itemJob]), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		)
	);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
	worker.logout();
});

describe('worker schedule', () => {
	it('greets the worker by first name and loads the current month', async () => {
		render(SchedulePage);
		expect(screen.getByRole('heading', { name: 'Hallo, Max!' })).toBeInTheDocument();

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toMatch(/\/api\/v1\/employee\/schedule\?month=\d{4}-\d{2}$/);
	});

	it('renders moving jobs with their route and item-type entries with title/location/notes', async () => {
		render(SchedulePage);
		// inquiry job: route line
		expect(await screen.findByText(/Kaiserstr\. 32, Hildesheim → Bahnhofstr\. 1, Hannover/)).toBeInTheDocument();
		// calendar item: category badge, title, location, office notes
		expect(screen.getByText('Intern')).toBeInTheDocument();
		expect(screen.getByText('Lager aufräumen')).toBeInTheDocument();
		expect(screen.getByText('Halle 2')).toBeInTheDocument();
		expect(screen.getByText('Handschuhe mitbringen')).toBeInTheDocument();
	});

	it('tapping a moving job opens its detail page (items are not tappable)', async () => {
		const user = userEvent.setup();
		render(SchedulePage);
		const route = await screen.findByText(/Kaiserstr\. 32/);
		await user.click(route.closest('button')!);
		expect(goto).toHaveBeenCalledWith('/worker/jobs/inq-1?date=2026-06-15');

		// the item entry renders as a plain div, not a button
		expect(screen.getByText('Lager aufräumen').closest('button')).toBeNull();
	});

	it('re-fetches when the month is changed', async () => {
		const user = userEvent.setup();
		const { container } = render(SchedulePage);
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

		const month = container.querySelector('input[type="month"]') as HTMLInputElement;
		await user.clear(month);
		// fireEvent-style direct value change for the month input
		month.value = '2026-01';
		month.dispatchEvent(new Event('input', { bubbles: true }));

		await waitFor(() =>
			expect(fetchMock.mock.calls.some(([u]) => String(u).includes('month=2026-01'))).toBe(true)
		);
	});

	it('shows the empty state when no jobs exist', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve(new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }))
		);
		render(SchedulePage);
		expect(await screen.findByText('Keine Einsätze in diesem Monat.')).toBeInTheDocument();
	});
});
