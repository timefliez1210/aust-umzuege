import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PendingHoursModal from './PendingHoursModal.svelte';
import { worker, workerData } from '$lib/stores/worker.svelte';

const employee = {
	id: 'e1',
	email: 'max@aust.de',
	first_name: 'Max',
	last_name: 'Helfer',
	salutation: null,
	phone: null,
};

const pendingJob = {
	entry_type: 'job',
	inquiry_id: 'inq-1',
	calendar_item_id: null,
	job_date: '2026-06-15',
	title: null,
	customer_name: 'Familie Muster',
	origin_city: 'Hildesheim',
	destination_city: 'Hannover',
	location: null,
	start_time: '08:30:00',
};

let fetchMock: ReturnType<typeof vi.fn>;

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

beforeEach(() => {
	localStorage.clear();
	worker.login('tok', employee);
	workerData.refresh = 0;
});

afterEach(() => {
	vi.restoreAllMocks();
	worker.logout();
});

describe('PendingHoursModal — overdue hours prompt', () => {
	it('does not render when there are no pending assignments', async () => {
		fetchMock = vi.fn().mockResolvedValue(json([]));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		render(PendingHoursModal);
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/employee\/pending-hours$/);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('shows a blocking, non-dismissable prompt for a past job', async () => {
		fetchMock = vi.fn().mockResolvedValue(json([pendingJob]));
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		render(PendingHoursModal);

		const dialog = await screen.findByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(screen.getByText('Familie Muster')).toBeInTheDocument();
		expect(screen.getByText(/Hildesheim → Hannover/)).toBeInTheDocument();
		// no way out: no close/cancel control, only the save button
		expect(screen.queryByRole('button', { name: /Schließen|Abbrechen/ })).not.toBeInTheDocument();
	});

	it('keeps Speichern disabled until both Beginn and Ende are filled', async () => {
		fetchMock = vi.fn().mockResolvedValue(json([pendingJob]));
		globalThis.fetch = fetchMock as unknown as typeof fetch;
		const user = userEvent.setup();

		render(PendingHoursModal);
		const save = await screen.findByRole('button', { name: 'Stunden speichern' });
		expect(save).toBeDisabled();

		await user.type(screen.getByLabelText('Beginn'), '7.30');
		expect(save).toBeDisabled(); // only start filled
		await user.type(screen.getByLabelText('Ende'), '16');
		expect(save).toBeEnabled();
	});

	it('logs loose-format hours, closes, and signals a schedule refresh', async () => {
		fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
			if (opts?.method === 'PATCH') return Promise.resolve(new Response(null, { status: 204 }));
			return Promise.resolve(json([pendingJob]));
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
		const user = userEvent.setup();

		render(PendingHoursModal);
		await screen.findByRole('dialog');

		await user.type(screen.getByLabelText('Beginn'), '7.30');
		await user.type(screen.getByLabelText('Ende'), '16');
		await user.type(screen.getByLabelText('Pause (Min.)'), '30');
		await user.click(screen.getByRole('button', { name: 'Stunden speichern' }));

		// PATCH to the job clock endpoint, scoped to the job day, with normalized ISO times
		const patch = await waitFor(() => {
			const c = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(c).toBeDefined();
			return c!;
		});
		expect(String(patch[0])).toMatch(/\/api\/v1\/employee\/jobs\/inq-1\/clock\?date=2026-06-15$/);
		const body = JSON.parse(patch[1].body);
		expect(body.employee_clock_in).toBe(new Date('2026-06-15T07:30:00').toISOString());
		expect(body.employee_clock_out).toBe(new Date('2026-06-15T16:00:00').toISOString());
		expect(body.employee_break_minutes).toBe(30);

		// last pending logged → dialog gone + schedule asked to refresh
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(workerData.refresh).toBeGreaterThan(0);
	});

	it('advances through multiple pending assignments before closing', async () => {
		const pendingItem = {
			...pendingJob,
			entry_type: 'item',
			inquiry_id: null,
			calendar_item_id: 'cal-9',
			customer_name: null,
			title: 'Lagerumzug',
			location: 'Halle 3',
			job_date: '2026-06-10',
		};
		fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
			if (opts?.method === 'PATCH') return Promise.resolve(new Response(null, { status: 204 }));
			return Promise.resolve(json([pendingJob, pendingItem]));
		});
		globalThis.fetch = fetchMock as unknown as typeof fetch;
		const user = userEvent.setup();

		render(PendingHoursModal);
		await screen.findByText('Familie Muster');

		// log the first (job)
		await user.type(screen.getByLabelText('Beginn'), '8');
		await user.type(screen.getByLabelText('Ende'), '16');
		await user.click(screen.getByRole('button', { name: 'Stunden speichern' }));

		// modal advances to the second (Termin), still blocking
		expect(await screen.findByText('Lagerumzug')).toBeInTheDocument();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});
