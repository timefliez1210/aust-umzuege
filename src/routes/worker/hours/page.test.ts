import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
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

const summary = {
	month: '2026-06',
	target_hours: 160,
	actual_hours: 80,
	assignment_count: 2,
	assignments: [
		{
			inquiry_id: 'inq-1',
			job_date: '2026-06-02',
			origin_city: 'Hildesheim',
			destination_city: 'Hannover',
			actual_hours: 7.5,
			status: 'completed',
			entry_type: 'inquiry',
			calendar_item_id: null,
			title: null,
			location: null,
		},
		{
			inquiry_id: null,
			job_date: '2026-06-03',
			origin_city: null,
			destination_city: null,
			actual_hours: null,
			status: 'confirmed',
			entry_type: 'item',
			calendar_item_id: 'ci-1',
			title: 'Lagerpflege',
			location: null,
		},
	],
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	localStorage.clear();
	worker.login('tok', employee);
	vi.mocked(goto).mockClear();
	fetchMock = vi.fn().mockImplementation(() =>
		Promise.resolve(
			new Response(JSON.stringify(summary), {
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

describe('worker hours', () => {
	it('loads the summary for the current local month', async () => {
		render(HoursPage);
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());

		const d = new Date();
		const localMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		expect(String(fetchMock.mock.calls[0][0])).toContain(`/api/v1/employee/hours?month=${localMonth}`);
	});

	it('shows target vs actual hours with a capped progress bar', async () => {
		render(HoursPage);
		expect(await screen.findByText('160 h')).toBeInTheDocument();
		expect(screen.getByText('80.0 h')).toBeInTheDocument();
		expect(screen.getByText('50%')).toBeInTheDocument();
	});

	it('caps the progress percentage at 100 even when over target', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve(
				new Response(JSON.stringify({ ...summary, actual_hours: 200 }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				})
			)
		);
		render(HoursPage);
		expect(await screen.findByText('100%')).toBeInTheDocument();
	});

	it('lists assignments: moving jobs navigate to detail, calendar items do not', async () => {
		const user = userEvent.setup();
		render(HoursPage);

		expect(await screen.findByText('2 Einsätze')).toBeInTheDocument();
		expect(screen.getByText('Hildesheim → Hannover')).toBeInTheDocument();
		expect(screen.getByText('7.5 h')).toBeInTheDocument();

		await user.click(screen.getByText('Hildesheim → Hannover').closest('button')!);
		expect(goto).toHaveBeenCalledWith('/worker/jobs/inq-1');

		// item entry is a plain row without navigation
		expect(screen.getByText('Lagerpflege').closest('button')).toBeNull();
	});

	it('shows the German error/empty state when the API fails', async () => {
		fetchMock.mockRejectedValue(new TypeError('offline'));
		render(HoursPage);
		expect(await screen.findByText('Keine Daten verfügbar.')).toBeInTheDocument();
	});

	it('shows an empty-month message when there are no assignments', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve(
				new Response(JSON.stringify({ ...summary, assignment_count: 0, assignments: [] }), {
					status: 200,
					headers: { 'content-type': 'application/json' },
				})
			)
		);
		render(HoursPage);
		expect(await screen.findByText('Keine Einsätze in diesem Monat.')).toBeInTheDocument();
	});
});
