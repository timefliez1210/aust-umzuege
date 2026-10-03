import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AngebotPage from './+page.svelte';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	fetchMock = vi
		.fn()
		.mockImplementation(() => Promise.resolve(new Response('{"success":true}', { status: 200 })));
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => vi.restoreAllMocks());

const submitButton = () => screen.getByRole('button', { name: /Kostenloses Angebot anfordern/ });

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getByLabelText('Nachname *'), 'Mustermann');
	await user.type(screen.getByLabelText('E-Mail-Adresse *'), 'max@example.de');
	await user.type(screen.getByLabelText('Telefonnummer *'), '0151 123');
	await user.type(screen.getByLabelText('Wunschtermin *'), '2027-03-15');

	await user.type(screen.getByLabelText('Straße (Auszug)'), 'Kaiserstr.');
	await user.type(screen.getByLabelText('Hausnummer (Auszug)'), '32');
	await user.type(screen.getByLabelText('Postleitzahl (Auszug)'), '31134');
	await user.type(screen.getByLabelText('Ort (Auszug)'), 'Hildesheim');
	await user.selectOptions(screen.getByLabelText('Etage Auszug *'), '2. Stock');

	await user.type(screen.getByLabelText('Straße (Einzug)'), 'Bahnhofstr.');
	await user.type(screen.getByLabelText('Hausnummer (Einzug)'), '1');
	await user.type(screen.getByLabelText('Postleitzahl (Einzug)'), '30159');
	await user.type(screen.getByLabelText('Ort (Einzug)'), 'Hannover');
	await user.selectOptions(screen.getByLabelText('Etage Einzug *'), 'Erdgeschoss');

	await user.click(screen.getByRole('checkbox', { name: /Datenschutzerklärung/ }));
}

describe('kostenloses-angebot — validation gating', () => {
	it('submit is disabled until contact, both addresses with floors, date, and privacy are set', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		expect(submitButton()).toBeDisabled();
		await fillRequired(user);
		expect(submitButton()).toBeEnabled();
	}, 60000);

	it('the Wunschtermin cannot be in the past (min = today)', () => {
		render(AngebotPage);
		const date = screen.getByLabelText('Wunschtermin *');
		expect(date.getAttribute('min')).toBe(new Date().toISOString().slice(0, 10));
	});

	it('floor selects require an explicit choice (empty "Bitte wählen *" default)', () => {
		render(AngebotPage);
		expect(screen.getByLabelText('Etage Auszug *')).toHaveValue('');
		expect(screen.getByLabelText('Etage Einzug *')).toHaveValue('');
	});
});

describe('kostenloses-angebot — submission contract with send-mail.php', () => {
	it('posts urlencoded fields matching the PHP "kostenloses-angebot" branch', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		await fillRequired(user);
		// tick the Auszug elevator checkbox (two exist: Auszug + Einzug)
		await user.click(screen.getAllByRole('checkbox', { name: 'Aufzug vorhanden' })[0]);
		await user.click(submitButton());

		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe('/send-mail.php');

		const params = new URLSearchParams(opts.body);
		expect(params.get('form-name')).toBe('kostenloses-angebot');
		expect(params.get('nachname')).toBe('Mustermann');
		expect(params.get('email')).toBe('max@example.de');
		expect(params.get('phone')).toBe('0151 123');
		expect(params.get('wunschtermin')).toBe('2027-03-15');
		// addresses are combined into single fields for the mailer
		expect(params.get('auszugsadresse')).toBe('Kaiserstr. 32, 31134 Hildesheim');
		expect(params.get('einzugsadresse')).toBe('Bahnhofstr. 1, 30159 Hannover');
		expect(params.get('etage-auszug')).toBe('2. Stock');
		expect(params.get('etage-einzug')).toBe('Erdgeschoss');
		// elevator checkbox is included when ticked (and lands in the email body)
		expect(params.get('aufzug-auszug')).not.toBeNull();
		// honeypot present and empty
		expect(params.get('bot-field')).toBe('');
		// volume calculator data rides along even when empty
		expect(params.get('umzugsvolumen-m3')).toBe('0.00');
		expect(params.get('zusatzleistungen')).toBe('Keine');
	}, 60000);

	it('carries selected Zusatzleistungen as readable labels', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		await fillRequired(user);
		await user.click(screen.getByText('Einpackservice'));
		await user.click(screen.getByText('Einlagerung'));
		await user.click(submitButton());

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
		expect(params.get('zusatzleistungen')).toBe('Einpackservice, Einlagerung');
	}, 60000);

	it('includes volume calculator results in the hidden fields', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		await fillRequired(user);

		// add 2× "Sofa, Couch, Liege je Sitz" (0.4 m³ each) via the calculator
		const sofaRow = screen.getByText('Sofa, Couch, Liege je Sitz').closest('div')!;
		const plus = sofaRow.querySelector('button[aria-label="Hinzufügen"]')!;
		await user.click(plus);
		await user.click(plus);

		await user.click(submitButton());
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const params = new URLSearchParams(fetchMock.mock.calls[0][1].body);
		expect(params.get('umzugsvolumen-m3')).toBe('0.80');
		expect(params.get('gegenstaende-liste')).toContain('2x Sofa, Couch, Liege je Sitz');
	}, 60000);

	it('shows the optional Zwischenstopp fields only after toggling them on', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		expect(screen.queryByLabelText('Straße (Zwischenstopp)')).not.toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Zwischenstopp hinzufügen/ }));
		expect(screen.getByLabelText('Straße (Zwischenstopp)')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /Zwischenstopp entfernen/ }));
		expect(screen.queryByLabelText('Straße (Zwischenstopp)')).not.toBeInTheDocument();
	});

	it('shows the success state after submission', async () => {
		const user = userEvent.setup();
		render(AngebotPage);
		await fillRequired(user);
		await user.click(submitButton());
		expect(await screen.findByText('Vielen Dank für Ihre Anfrage!')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Zur Startseite' })).toHaveAttribute('href', '/');
	}, 60000);

	it('keeps user input and shows a German error when the mailer fails', async () => {
		fetchMock.mockResolvedValue(new Response('', { status: 500 }));
		const user = userEvent.setup();
		render(AngebotPage);
		await fillRequired(user);
		await user.click(submitButton());

		expect(
			await screen.findByText('Es gab einen Fehler. Bitte versuchen Sie es erneut.')
		).toBeInTheDocument();
		expect(screen.getByLabelText('Nachname *')).toHaveValue('Mustermann');
	}, 60000);
});
