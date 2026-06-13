import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import EmployeeAssignmentPanel from './EmployeeAssignmentPanel.svelte';
import { auth } from '$lib/stores/auth.svelte';

const employees = {
	employees: [
		{ id: 'emp-1', first_name: 'Anna', last_name: 'Arbeit', email: 'a@aust.de' },
		{ id: 'emp-2', first_name: 'Ben', last_name: 'Bringt', email: 'b@aust.de' },
	],
};

function assignment(over: Record<string, unknown> = {}) {
	return {
		employee_id: 'emp-1',
		first_name: 'Anna',
		last_name: 'Arbeit',
		job_date: '2026-06-15',
		actual_hours: null,
		notes: null,
		start_time: null,
		end_time: null,
		clock_in: '08:00:00',
		clock_out: null,
		break_minutes: 0,
		...over,
	};
}

let fetchMock: ReturnType<typeof vi.fn>;
let assignmentsResponse: () => unknown;

function jsonRes(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

beforeEach(() => {
	auth.token = 't';
	assignmentsResponse = () => [assignment()];
	fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
		const u = String(url);
		if (u.includes('/admin/employees?active')) return Promise.resolve(jsonRes(employees));
		if (u.includes('/employees') && (!opts?.method || opts.method === 'GET'))
			return Promise.resolve(jsonRes(assignmentsResponse()));
		return Promise.resolve(jsonRes(assignment()));
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
	auth.logout();
});

const inquiryProps = { entityId: 'inq-1', entityType: 'inquiry' as const };

describe('EmployeeAssignmentPanel — inquiry single-day mode', () => {
	it('loads assignments from the inquiry endpoint and shows the row with prefilled times', async () => {
		render(EmployeeAssignmentPanel, inquiryProps);
		expect(await screen.findByText('Anna A.')).toBeInTheDocument();
		expect(
			fetchMock.mock.calls.some(([u]) => String(u).includes('/api/v1/inquiries/inq-1/employees'))
		).toBe(true);
		// clock_in HH:MM:SS is shown as HH:MM
		const timeInputs = document.querySelectorAll<HTMLInputElement>('.inq-time');
		expect(timeInputs[0].value).toBe('08:00');
	});

	it('accepts German decimal time input on blur and PATCHes it as HH:MM:SS (Lisa-Lullies regression)', async () => {
		const user = userEvent.setup();
		render(EmployeeAssignmentPanel, inquiryProps);
		await screen.findByText('Anna A.');

		const clockOut = document.querySelectorAll<HTMLInputElement>('.inq-time')[1];
		await user.click(clockOut);
		await user.type(clockOut, '16.30'); // mobile decimal keyboard has no colon
		await user.tab(); // blur triggers save

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const [url, opts] = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
		expect(String(url)).toContain('/api/v1/inquiries/inq-1/employees/emp-1');
		expect(JSON.parse(opts.body)).toEqual({ clock_out: '16:30:00' });
	});

	it('reverts the input when the backend rejects the value', async () => {
		const user = userEvent.setup();
		render(EmployeeAssignmentPanel, inquiryProps);
		await screen.findByText('Anna A.');

		fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
			if (opts?.method === 'PATCH') return Promise.resolve(jsonRes({ message: 'Ungültig' }, 422));
			if (String(url).includes('active')) return Promise.resolve(jsonRes(employees));
			return Promise.resolve(jsonRes([assignment()]));
		});

		const clockIn = document.querySelectorAll<HTMLInputElement>('.inq-time')[0];
		await user.clear(clockIn);
		await user.type(clockIn, '09:15');
		await user.tab();

		// rejected value must not linger looking "saved" — field reverts to 08:00
		await waitFor(() => expect(clockIn.value).toBe('08:00'));
	});

	it('the add dropdown only offers employees not yet assigned', async () => {
		const user = userEvent.setup();
		render(EmployeeAssignmentPanel, inquiryProps);
		await screen.findByText('Anna A.');

		await user.click(screen.getByRole('button', { name: /Zuweisen/ }));
		const options = [...document.querySelectorAll('option')].map((o) => o.textContent);
		expect(options.join()).toContain('Ben');
		expect(options.join()).not.toContain('Anna');
	});

	it('assigning posts employee_id + notes and refreshes the list', async () => {
		const user = userEvent.setup();
		render(EmployeeAssignmentPanel, inquiryProps);
		await screen.findByText('Anna A.');

		await user.click(screen.getByRole('button', { name: /Zuweisen/ }));
		// modal opens with the unassigned employee pre-selected
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByLabelText('Mitarbeiter')).toHaveValue('emp-2');
		await user.type(screen.getByLabelText('Notizen'), 'Springer');
		await user.click(document.querySelector('.modal-actions button[type="submit"]')!);

		await waitFor(() => {
			const post = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST');
			expect(post).toBeDefined();
			expect(JSON.parse(post![1].body)).toEqual({ employee_id: 'emp-2', notes: 'Springer' });
		});
	});
});

describe('EmployeeAssignmentPanel — inquiry multi-day mode', () => {
	beforeEach(() => {
		assignmentsResponse = () => [
			assignment({ job_date: '2026-06-15', actual_hours: 8 }),
			assignment({ job_date: '2026-06-16', actual_hours: 6.5 }),
			assignment({
				employee_id: 'emp-2',
				first_name: 'Ben',
				last_name: 'Bringt',
				job_date: '2026-06-15',
				actual_hours: 4,
			}),
		];
	});

	it('switches to the deduplicated per-employee summary (AGENTS.md contract)', async () => {
		render(EmployeeAssignmentPanel, inquiryProps);
		// Anna appears once despite two day-assignments
		expect(await screen.findAllByText('Anna A.')).toHaveLength(1);
		// day counts
		expect(screen.getByText('Mehrtägig — Zuweisung über den Kalender bearbeiten')).toBeInTheDocument();
		// summed hours 8 + 6.5 → "14h 30m"
		expect(screen.getByText('14h 30m')).toBeInTheDocument();
		expect(screen.getByText('4h')).toBeInTheDocument();
		// no editable time inputs in summary mode
		expect(document.querySelector('.inq-time')).toBeNull();
	});
});

describe('EmployeeAssignmentPanel — calendar item mode', () => {
	beforeEach(() => {
		assignmentsResponse = () => ({
			employees: [assignment({ clock_in: '07:00:00', clock_out: '15:00:00', break_minutes: 30 })],
		});
	});

	it('loads from the calendar-items endpoint (wrapped response shape)', async () => {
		render(EmployeeAssignmentPanel, { entityId: 'ci-1', entityType: 'calendar_item' });
		await screen.findByText(/Anna/);
		expect(
			fetchMock.mock.calls.some(([u]) =>
				String(u).includes('/api/v1/admin/calendar-items/ci-1/employees')
			)
		).toBe(true);
	});

	it('per-row save PATCHes the full edit payload with normalized times', async () => {
		const user = userEvent.setup();
		render(EmployeeAssignmentPanel, { entityId: 'ci-1', entityType: 'calendar_item' });
		await screen.findByText(/Anna/);

		const clockIn = document.querySelector<HTMLInputElement>('#ci-emp-1')!;
		await user.clear(clockIn);
		await user.type(clockIn, '6,45'); // comma separator must normalize too

		const saveBtn = document.querySelector('button .lucide-check')?.closest('button');
		expect(saveBtn).toBeTruthy();
		await user.click(saveBtn!);

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const body = JSON.parse(fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')![1].body);
		expect(body.clock_in).toBe('06:45:00');
		expect(body.clock_out).toBe('15:00:00');
		expect(body.break_minutes).toBe(30);
	});
});
