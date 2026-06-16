import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import JobDetailPage from './+page.svelte';
import { worker } from '$lib/stores/worker.svelte';
import { goto } from '$app/navigation';
import { setTestUrl } from '$lib/test/app-stores';

const employee = {
	id: 'e1',
	email: 'max@aust.de',
	first_name: 'Max',
	last_name: 'Helfer',
	salutation: null,
	phone: null,
};

// 08:00 local time on the job date, expressed as the ISO string the API returns
const clockInIso = new Date('2026-06-15T08:00:00').toISOString();

const job = {
	inquiry_id: 'inq-1',
	job_date: '2026-06-15',
	status: 'scheduled',
	origin_street: 'Kaiserstr. 32',
	origin_city: 'Hildesheim',
	origin_postal_code: '31134',
	origin_floor: '2',
	origin_elevator: true,
	destination_street: 'Bahnhofstr. 1',
	destination_city: 'Hannover',
	destination_postal_code: '30159',
	destination_floor: '0',
	destination_elevator: false,
	estimated_volume_m3: 24.5,
	items: [
		{ name: 'Sofa', volume_m3: 1.2, quantity: 1 },
		{ name: 'Umzugskarton', volume_m3: 0.1, quantity: 12 },
	],
	customer_name: 'Familie Muster',
	customer_phone: '0151 23456',
	notes: 'Klavier im Wohnzimmer.',
	employee_notes: 'Früh anfangen.',
	employee_clock_in: clockInIso,
	employee_clock_out: null,
	employee_actual_hours: null,
	colleague_names: ['Anna', 'Ben'],
};

let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/json' },
	});
}

beforeEach(() => {
	localStorage.clear();
	worker.login('tok', employee);
	vi.mocked(goto).mockClear();
	setTestUrl('/worker/jobs/inq-1', { id: 'inq-1' });
	fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(job)));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
	worker.logout();
});

describe('worker job detail — logistics view', () => {
	it('loads the job for the route param and shows the long German date', async () => {
		render(JobDetailPage);
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/api\/v1\/employee\/jobs\/inq-1$/);
		expect(await screen.findByText(/Montag, 15\. Juni 2026/)).toBeInTheDocument();
	});

	it('renders both addresses with floor labels and elevator flag', async () => {
		render(JobDetailPage);
		expect(await screen.findByText('Kaiserstr. 32')).toBeInTheDocument();
		expect(screen.getByText('31134 Hildesheim')).toBeInTheDocument();
		// floor "2" + elevator → "2. OG · Aufzug"
		expect(screen.getByText('2. OG · Aufzug')).toBeInTheDocument();
		// floor "0" without elevator → "EG"
		expect(screen.getByText('EG')).toBeInTheDocument();
		expect(screen.getByText('Bahnhofstr. 1')).toBeInTheDocument();
	});

	it('offers the customer phone as a tap-to-call link', async () => {
		render(JobDetailPage);
		const tel = await screen.findByRole('link', { name: /0151 23456/ });
		expect(tel).toHaveAttribute('href', 'tel:0151 23456');
		expect(screen.getByText('Familie Muster')).toBeInTheDocument();
	});

	it('lists colleagues and the inventory with quantities and volumes', async () => {
		render(JobDetailPage);
		expect(await screen.findByText('Anna')).toBeInTheDocument();
		expect(screen.getByText('Ben')).toBeInTheDocument();
		expect(screen.getByText('Gesamtvolumen: 24.5 m³')).toBeInTheDocument();
		expect(screen.getByText(/12×\s*Umzugskarton/)).toBeInTheDocument();
		expect(screen.getByText('1.20 m³')).toBeInTheDocument();
	});

	it('shows job notes and office hints', async () => {
		render(JobDetailPage);
		expect(await screen.findByText('Klavier im Wohnzimmer.')).toBeInTheDocument();
		expect(screen.getByText('Hinweise vom Büro')).toBeInTheDocument();
		expect(screen.getByText('Früh anfangen.')).toBeInTheDocument();
	});

	it('shows a not-found state when the job cannot be loaded', async () => {
		fetchMock.mockResolvedValue(new Response('{}', { status: 404 }));
		render(JobDetailPage);
		expect(await screen.findByText('Einsatz nicht gefunden.')).toBeInTheDocument();
	});

	it('back button returns to the schedule', async () => {
		const user = userEvent.setup();
		render(JobDetailPage);
		await user.click(screen.getByRole('button', { name: /Zurück/ }));
		expect(goto).toHaveBeenCalledWith('/worker/schedule');
	});
});

describe('worker job detail — clock-in/out (Meine Zeiten)', () => {
	it('pre-fills the Beginn input from the stored clock-in (local time)', async () => {
		render(JobDetailPage);
		const input = await screen.findByLabelText('Beginn');
		expect(input).toHaveValue('08:00');
	});

	it('offers an end-time input alongside Beginn', async () => {
		render(JobDetailPage);
		await screen.findByLabelText('Beginn');
		expect(screen.getByLabelText('Ende')).toBeInTheDocument();
	});

	it('saves the entered time as an ISO timestamp on the job date and refreshes', async () => {
		const user = userEvent.setup();
		render(JobDetailPage);
		const input = await screen.findByLabelText('Beginn');

		await user.clear(input);
		await user.type(input, '07:30');
		await user.click(screen.getByRole('button', { name: 'Zeiten speichern' }));

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const [url, opts] = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
		expect(String(url)).toMatch(/\/api\/v1\/employee\/jobs\/inq-1\/clock$/);
		const body = JSON.parse(opts.body);
		expect(body.employee_clock_in).toBe(new Date('2026-06-15T07:30:00').toISOString());

		// the job is reloaded afterwards to refresh computed hours
		const gets = fetchMock.mock.calls.filter(([, o]) => !o?.method || o.method === 'GET');
		expect(gets.length).toBeGreaterThanOrEqual(2);
	});

	it('shows the worked hours once the backend computed them', async () => {
		fetchMock.mockImplementation(() =>
			Promise.resolve(jsonResponse({ ...job, employee_actual_hours: 8.5 }))
		);
		render(JobDetailPage);
		expect(await screen.findByText('8.5 h')).toBeInTheDocument();
		expect(screen.getByText('Gearbeitet')).toBeInTheDocument();
	});
});

describe('worker job detail — multi-day day scoping', () => {
	// A multi-day inquiry lists one schedule entry per day; the tapped day arrives
	// as ?date= so the detail/clock endpoints resolve the right day, not the
	// inquiry's primary date. Regression: tapping the 15th opened the 5th.
	beforeEach(() => {
		setTestUrl('/worker/jobs/inq-1?date=2026-06-15', { id: 'inq-1' });
	});

	it('loads the tapped day by forwarding ?date= to the detail endpoint', async () => {
		render(JobDetailPage);
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(String(fetchMock.mock.calls[0][0])).toMatch(
			/\/api\/v1\/employee\/jobs\/inq-1\?date=2026-06-15$/
		);
	});

	it('scopes the clock PATCH and time anchor to the tapped day', async () => {
		const user = userEvent.setup();
		render(JobDetailPage);
		const input = await screen.findByLabelText('Beginn');

		await user.clear(input);
		await user.type(input, '07:30');
		await user.click(screen.getByRole('button', { name: 'Zeiten speichern' }));

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const [url, opts] = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
		expect(String(url)).toMatch(/\/api\/v1\/employee\/jobs\/inq-1\/clock\?date=2026-06-15$/);
		const body = JSON.parse(opts.body);
		expect(body.employee_clock_in).toBe(new Date('2026-06-15T07:30:00').toISOString());
	});
});
