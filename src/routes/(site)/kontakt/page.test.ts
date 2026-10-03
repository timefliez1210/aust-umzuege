import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import KontaktPage from './+page.svelte';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi
		.fn()
		.mockImplementation(() => Promise.resolve(new Response('{"success":true}', { status: 200 })));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => vi.restoreAllMocks());

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole('radio', { name: 'Herr' }));
	await user.type(screen.getByPlaceholderText('Nachname: *'), 'Mustermann');
	await user.type(screen.getByPlaceholderText('Ihre E-Mail-Adresse: *'), 'max@example.de');
	await user.type(screen.getByPlaceholderText('Ihre Nachricht: *'), 'Bitte um Rückruf.');
	await user.click(screen.getByRole('checkbox', { name: /Datenschutzerklärung/ }));
}

describe('kontakt page — validation gating', () => {
	it('submit stays disabled until salutation, last name, email, message, and privacy are set', async () => {
		const user = userEvent.setup();
		render(KontaktPage);
		const submit = screen.getByRole('button', { name: /JETZT ANFRAGEN/i });
		expect(submit).toBeDisabled();

		await fillRequired(user);
		expect(submit).toBeEnabled();
	});

	it('shows the missing-fields hint only once the user started typing', async () => {
		const user = userEvent.setup();
		render(KontaktPage);
		const hint = /Bitte füllen Sie alle Pflichtfelder aus/;
		expect(screen.queryByText(hint)).not.toBeInTheDocument();

		await user.type(screen.getByPlaceholderText('Vorname:'), 'Max');
		expect(screen.getByText(hint)).toBeInTheDocument();

		await fillRequired(user);
		expect(screen.queryByText(hint)).not.toBeInTheDocument();
	});

	it('salutation is required (a name alone does not enable submission)', async () => {
		const user = userEvent.setup();
		render(KontaktPage);
		await user.type(screen.getByPlaceholderText('Nachname: *'), 'Mustermann');
		await user.type(screen.getByPlaceholderText('Ihre E-Mail-Adresse: *'), 'max@example.de');
		await user.type(screen.getByPlaceholderText('Ihre Nachricht: *'), 'Hallo');
		await user.click(screen.getByRole('checkbox', { name: /Datenschutzerklärung/ }));
		expect(screen.getByRole('button', { name: /JETZT ANFRAGEN/i })).toBeDisabled();
	});
});

describe('kontakt page — submission contract with send-mail.php', () => {
	it('posts urlencoded fields matching the PHP "kontakt" branch', async () => {
		const user = userEvent.setup();
		render(KontaktPage);
		await user.type(screen.getByPlaceholderText('Vorname:'), 'Max');
		await fillRequired(user);
		await user.type(screen.getByPlaceholderText('Ihre Telefonnummer:'), '0151 123');
		await user.click(screen.getByRole('button', { name: /JETZT ANFRAGEN/i }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe('/send-mail.php');
		expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

		const params = new URLSearchParams(opts.body);
		expect(params.get('form-name')).toBe('kontakt');
		expect(params.get('anrede')).toBe('Herr');
		expect(params.get('vorname')).toBe('Max');
		expect(params.get('nachname')).toBe('Mustermann');
		expect(params.get('email')).toBe('max@example.de');
		expect(params.get('phone')).toBe('0151 123');
		expect(params.get('nachricht')).toBe('Bitte um Rückruf.');
		// honeypot present and empty for humans
		expect(params.get('bot-field')).toBe('');
	});

	it('shows the success state and resets the form afterwards', async () => {
		const user = userEvent.setup();
		render(KontaktPage);
		await fillRequired(user);
		await user.click(screen.getByRole('button', { name: /JETZT ANFRAGEN/i }));

		expect(await screen.findByText('Vielen Dank für Ihre Nachricht!')).toBeInTheDocument();

		// "Neue Nachricht senden" returns to a blank form
		await user.click(screen.getByRole('button', { name: 'Neue Nachricht senden' }));
		expect(screen.getByPlaceholderText('Nachname: *')).toHaveValue('');
		expect(screen.getByRole('button', { name: /JETZT ANFRAGEN/i })).toBeDisabled();
	});

	it('keeps the form and shows a German error when the mailer fails', async () => {
		fetchMock.mockResolvedValue(new Response('{"error":"x"}', { status: 500 }));
		const user = userEvent.setup();
		render(KontaktPage);
		await fillRequired(user);
		await user.click(screen.getByRole('button', { name: /JETZT ANFRAGEN/i }));

		expect(
			await screen.findByText('Es gab einen Fehler. Bitte versuchen Sie es erneut.')
		).toBeInTheDocument();
		// user input is preserved for retry
		expect(screen.getByPlaceholderText('Nachname: *')).toHaveValue('Mustermann');
	});

	it('also shows the error message on network failure', async () => {
		fetchMock.mockRejectedValue(new TypeError('offline'));
		const user = userEvent.setup();
		render(KontaktPage);
		await fillRequired(user);
		await user.click(screen.getByRole('button', { name: /JETZT ANFRAGEN/i }));
		expect(
			await screen.findByText('Es gab einen Fehler. Bitte versuchen Sie es erneut.')
		).toBeInTheDocument();
	});
});

describe('kontakt page — contact sidebar', () => {
	it('lists phone, email, address, and office hours', () => {
		render(KontaktPage);
		expect(screen.getByRole('link', { name: '05121 – 755 83 79' })).toHaveAttribute(
			'href',
			'tel:+4951217558379'
		);
		expect(screen.getByRole('link', { name: 'info@aust-umzuege.de' })).toHaveAttribute(
			'href',
			'mailto:info@aust-umzuege.de'
		);
		expect(screen.getByText(/Kaiserstr\. 32/)).toBeInTheDocument();
		expect(screen.getByText(/09:00 – 19:00 Uhr/)).toBeInTheDocument();
	});
});
