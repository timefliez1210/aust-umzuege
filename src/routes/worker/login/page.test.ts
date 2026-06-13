import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import LoginPage from './+page.svelte';
import { worker } from '$lib/stores/worker.svelte';
import { goto } from '$app/navigation';

let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

beforeEach(() => {
	localStorage.clear();
	worker.logout();
	vi.mocked(goto).mockClear();
	fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => vi.restoreAllMocks());

describe('worker login — OTP request step', () => {
	it('rejects an empty/invalid email locally without hitting the API', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		// empty input passes the type="email" constraint, so the component's own
		// guard is what must catch it (non-empty invalid strings are already
		// blocked by native validation before submit fires)
		await user.click(screen.getByRole('button', { name: 'Code senden' }));

		expect(screen.getByText('Bitte eine gültige E-Mail-Adresse eingeben.')).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('requests the OTP with the trimmed, lowercased email and advances to the code step', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		await user.type(screen.getByLabelText('E-Mail-Adresse'), '  Max@Aust.DE ');
		await user.click(screen.getByRole('button', { name: 'Code senden' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toMatch(/\/api\/v1\/employee\/auth\/request$/);
		expect(JSON.parse(opts.body)).toEqual({ email: 'max@aust.de' });

		// code step shows where the code went
		expect(await screen.findByText(/Ein 6-stelliger Code wurde an/)).toBeInTheDocument();
		expect(screen.getByText('max@aust.de')).toBeInTheDocument();
		expect(screen.getByLabelText('Zugangscode')).toBeInTheDocument();
	});

	it('surfaces the backend error message when the request fails', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ message: 'Zu viele Versuche' }, 429));
		const user = userEvent.setup();
		render(LoginPage);
		await user.type(screen.getByLabelText('E-Mail-Adresse'), 'max@aust.de');
		await user.click(screen.getByRole('button', { name: 'Code senden' }));

		expect(await screen.findByText('Zu viele Versuche')).toBeInTheDocument();
		// still on the email step
		expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
	});
});

describe('worker login — OTP verify step', () => {
	async function goToCodeStep(user: ReturnType<typeof userEvent.setup>) {
		await user.type(screen.getByLabelText('E-Mail-Adresse'), 'max@aust.de');
		await user.click(screen.getByRole('button', { name: 'Code senden' }));
		await screen.findByLabelText('Zugangscode');
	}

	it('requires a 6-digit code before calling the API', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		await goToCodeStep(user);
		fetchMock.mockClear();

		await user.type(screen.getByLabelText('Zugangscode'), '123');
		await user.click(screen.getByRole('button', { name: 'Anmelden' }));
		expect(screen.getByText('Der Code muss 6 Stellen haben.')).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('verifies the code, stores the session, and navigates to the schedule', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		await goToCodeStep(user);

		const employee = {
			id: 'e1',
			email: 'max@aust.de',
			first_name: 'Max',
			last_name: 'Helfer',
			salutation: null,
			phone: null,
		};
		fetchMock.mockResolvedValue(jsonResponse({ token: 'session-tok', employee }));

		await user.type(screen.getByLabelText('Zugangscode'), '123456');
		await user.click(screen.getByRole('button', { name: 'Anmelden' }));

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/worker/schedule'));
		const [url, opts] = fetchMock.mock.calls.at(-1)!;
		expect(url).toMatch(/\/api\/v1\/employee\/auth\/verify$/);
		expect(JSON.parse(opts.body)).toEqual({ email: 'max@aust.de', code: '123456' });

		expect(worker.isAuthenticated).toBe(true);
		expect(worker.token).toBe('session-tok');
		expect(worker.employee?.first_name).toBe('Max');
	});

	it('shows the backend rejection for a wrong code and stays logged out', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		await goToCodeStep(user);
		fetchMock.mockResolvedValue(jsonResponse({ message: 'Ungültiger Code' }, 401));

		await user.type(screen.getByLabelText('Zugangscode'), '000000');
		await user.click(screen.getByRole('button', { name: 'Anmelden' }));

		expect(await screen.findByText('Ungültiger Code')).toBeInTheDocument();
		expect(worker.isAuthenticated).toBe(false);
		expect(goto).not.toHaveBeenCalled();
	});

	it('"Andere E-Mail verwenden" returns to the email step and clears code + error', async () => {
		const user = userEvent.setup();
		render(LoginPage);
		await goToCodeStep(user);

		await user.type(screen.getByLabelText('Zugangscode'), '123');
		await user.click(screen.getByRole('button', { name: 'Anmelden' })); // provoke error
		await user.click(screen.getByRole('button', { name: 'Andere E-Mail verwenden' }));

		expect(screen.getByLabelText('E-Mail-Adresse')).toBeInTheDocument();
		expect(screen.queryByText('Der Code muss 6 Stellen haben.')).not.toBeInTheDocument();
	});
});
