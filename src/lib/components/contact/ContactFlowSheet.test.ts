import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import ContactFlowSheet from './ContactFlowSheet.svelte';
import { contactFlow, openContactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { API_BASE } from '$lib/utils/api.svelte';
import { setHoursOpen, setHoursClosed } from './testHours';

let fetchMock: ReturnType<typeof vi.fn>;

function okResponse(): Response {
	return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
}

beforeEach(() => {
	closeContactFlow();
	setHoursOpen();
	sessionStorage.clear();
	fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	closeContactFlow();
	vi.restoreAllMocks();
});

async function openSheet(mode: 'picker' | 'callback' | 'message') {
	render(ContactFlowSheet);
	openContactFlow(mode);
	await tick();
}

describe('ContactFlowSheet — visibility and dismissal', () => {
	it('renders nothing while the flow is closed', () => {
		render(ContactFlowSheet);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('opens as a modal dialog when the store opens', async () => {
		await openSheet('callback');
		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAccessibleName('Rückruf anfordern');
	});

	it('closes on Escape', async () => {
		await openSheet('callback');
		await userEvent.keyboard('{Escape}');
		expect(contactFlow.mode).toBe(null);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('closes when the backdrop (not the sheet) is clicked', async () => {
		const user = userEvent.setup();
		await openSheet('callback');

		await user.click(document.querySelector('.backdrop')!);
		expect(contactFlow.mode).toBe(null);
	});

	it('keeps the sheet open when clicking inside it', async () => {
		const user = userEvent.setup();
		await openSheet('callback');
		await user.click(screen.getByText('Rückruf anfordern', { selector: 'h2' }));
		expect(contactFlow.mode).toBe('callback');
	});

	it('closes via the X button', async () => {
		const user = userEvent.setup();
		await openSheet('callback');
		await user.click(screen.getByRole('button', { name: 'Schließen' }));
		expect(contactFlow.mode).toBe(null);
	});

	it('locks body scroll while open and restores it on close', async () => {
		await openSheet('callback');
		expect(document.body.style.overflow).toBe('hidden');
		closeContactFlow();
		await tick();
		expect(document.body.style.overflow).toBe('');
	});

	it('focuses the first form field when a form step opens', async () => {
		await openSheet('callback');
		await waitFor(() => {
			expect(document.activeElement).toBe(screen.getByPlaceholderText('Max Mustermann'));
		});
	});
});

describe('ContactFlowSheet — picker step', () => {
	it('shows the option card and switches to the picked form', async () => {
		const user = userEvent.setup();
		await openSheet('picker');
		expect(screen.getByText(/Wie können wir Sie am besten erreichen/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Nachricht schreiben/ }));
		expect(contactFlow.mode).toBe('message');
		await tick();
		expect(screen.getByText('Nachricht schreiben', { selector: 'h2' })).toBeInTheDocument();
	});
});

describe('ContactFlowSheet — callback form', () => {
	it('promises a 30-minute callback while open, reopen time while closed', async () => {
		await openSheet('callback');
		expect(screen.getByText('Wir rufen Sie innerhalb von 30 Minuten zurück.')).toBeInTheDocument();
		closeContactFlow();
		setHoursClosed('am Montag ab 09:00 Uhr');
		openContactFlow('callback');
		await tick();
		expect(screen.getByText('Wir rufen Sie am Montag ab 09:00 Uhr zurück.')).toBeInTheDocument();
	});

	it('labels the immediate slot "Sofort" when open and "Bei Öffnung" when closed', async () => {
		await openSheet('callback');
		expect(screen.getByRole('button', { name: 'Sofort' })).toBeInTheDocument();

		closeContactFlow();
		setHoursClosed();
		openContactFlow('callback');
		await tick();
		expect(screen.getByRole('button', { name: 'Bei Öffnung' })).toBeInTheDocument();
	});

	it('blocks submission without privacy consent', async () => {
		const user = userEvent.setup();
		await openSheet('callback');

		await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
		await user.type(screen.getByPlaceholderText('0151 23 45 67 89'), '0151 999');
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		expect(screen.getByRole('alert')).toHaveTextContent(
			'Bitte stimmen Sie der Datenschutzerklärung zu.'
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('submits to flash-contact with backend-valid time_preference values', async () => {
		const user = userEvent.setup();
		await openSheet('callback');

		await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
		await user.type(screen.getByPlaceholderText('0151 23 45 67 89'), '0151 999');
		await user.click(screen.getByRole('button', { name: 'Vormittags' }));
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe(`${API_BASE}/api/v1/flash-contact`);
		expect(JSON.parse(opts.body)).toEqual({
			name: 'Erika Muster',
			phone: '0151 999',
			// backend enum: gleich | vormittag | nachmittag (crates/flash-contact)
			time_preference: 'vormittag',
		});

		// success step greets by first name
		expect(await screen.findByText('Danke, Erika!')).toBeInTheDocument();
	});

	it('defaults the time preference to "gleich"', async () => {
		const user = userEvent.setup();
		await openSheet('callback');

		await user.type(screen.getByPlaceholderText('Max Mustermann'), 'A B');
		await user.type(screen.getByPlaceholderText('0151 23 45 67 89'), '1');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).time_preference).toBe('gleich');
	});

	it('shows a German error and stays on the form when the backend fails', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));
		const user = userEvent.setup();
		await openSheet('callback');

		await user.type(screen.getByPlaceholderText('Max Mustermann'), 'A B');
		await user.type(screen.getByPlaceholderText('0151 23 45 67 89'), '1');
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Senden fehlgeschlagen. Bitte später erneut versuchen oder direkt anrufen.'
		);
		expect(screen.getByRole('button', { name: /Absenden/ })).toBeInTheDocument();
	});
});

describe('ContactFlowSheet — message form', () => {
	async function fillMessageForm(user: ReturnType<typeof userEvent.setup>) {
		await openSheet('message');
		await user.type(screen.getByPlaceholderText('Max Mustermann'), 'Erika Muster');
		await user.type(screen.getByPlaceholderText('ihre@email.de'), 'erika@example.de');
		await user.type(screen.getByPlaceholderText(/Worum geht's/), 'Umzug am 1.8.');
	}

	it('posts to send-mail.php as the known "kontakt" form with honeypot field', async () => {
		const user = userEvent.setup();
		await fillMessageForm(user);
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe('/send-mail.php');
		expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

		const params = new URLSearchParams(opts.body);
		// send-mail.php only routes known form-names; 'kontakt' is the message branch
		expect(params.get('form-name')).toBe('kontakt');
		expect(params.get('name')).toBe('Erika Muster');
		expect(params.get('email')).toBe('erika@example.de');
		expect(params.get('nachricht')).toBe('Umzug am 1.8.');
		expect(params.get('datenschutz-akzeptiert')).toBe('1');
		// server-side spam check field must be present (and empty for humans)
		expect(params.get('bot-field')).toBe('');
	});

	it('silently short-circuits to success when the honeypot is filled (bot)', async () => {
		const user = userEvent.setup();
		await fillMessageForm(user);

		// the honeypot is visually hidden but present in the DOM
		const honeypot = document.querySelector<HTMLInputElement>('.hp input')!;
		honeypot.value = 'Spam GmbH';
		honeypot.dispatchEvent(new Event('input', { bubbles: true }));

		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		expect(await screen.findByText(/Danke, Erika!/)).toBeInTheDocument();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('success step confirms same-business-day reply for messages', async () => {
		const user = userEvent.setup();
		await fillMessageForm(user);
		await user.click(screen.getByRole('checkbox'));
		await user.click(screen.getByRole('button', { name: /Absenden/ }));

		expect(
			await screen.findByText(/Wir haben Ihre Nachricht erhalten und melden uns am gleichen Werktag\./)
		).toBeInTheDocument();
	});
});
