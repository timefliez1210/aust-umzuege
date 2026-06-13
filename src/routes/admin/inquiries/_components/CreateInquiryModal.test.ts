import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import CreateInquiryModal from './CreateInquiryModal.svelte';
import { auth } from '$lib/stores/auth.svelte';

function jsonRes(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	auth.token = 't';
	fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
		const u = String(url);
		const method = opts?.method ?? 'GET';
		if (method === 'POST' && u.endsWith('/admin/customers'))
			return Promise.resolve(jsonRes({ id: 'cust-new' }));
		if (method === 'POST' && u.endsWith('/inquiries'))
			return Promise.resolve(jsonRes({ id: 'inq-new' }));
		if (u.includes('/admin/customers?search'))
			return Promise.resolve(
				jsonRes({ customers: [{ id: 'cust-1', email: 'k@x.de', name: 'Kunde Eins', phone: null }] })
			);
		return Promise.resolve(jsonRes({}));
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
	auth.logout();
});

const baseProps = { open: true, onCreated: () => {} };
const submit = () => screen.getByRole('button', { name: /Anfrage erstellen/ });

async function switchToNewCustomer(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole('button', { name: 'Neu anlegen' }));
}

/** Service types are picked via label buttons (svc-type-btn), not a select. */
async function pickService(user: ReturnType<typeof userEvent.setup>, label: string) {
	await user.click(screen.getByRole('button', { name: label }));
}

async function fillAddresses(user: ReturnType<typeof userEvent.setup>) {
	await user.type(screen.getAllByPlaceholderText('Straße *')[0], 'Kaiserstr. 32');
	await user.type(screen.getAllByPlaceholderText('Stadt *')[0], 'Hildesheim');
	if (screen.getAllByPlaceholderText('Straße *').length > 1) {
		await user.type(screen.getAllByPlaceholderText('Straße *')[1], 'Zielweg 1');
		await user.type(screen.getAllByPlaceholderText('Stadt *')[1], 'Hannover');
	}
}

describe('CreateInquiryModal — validation', () => {
	it('requires a selected customer in existing-customer mode', async () => {
		const user = userEvent.setup();
		render(CreateInquiryModal, baseProps);
		await user.click(submit());
		expect(screen.getByText('Bitte Kunde auswählen')).toBeInTheDocument();
		expect(fetchMock.mock.calls.filter(([, o]) => o?.method === 'POST')).toHaveLength(0);
	});

	it('new-customer mode needs at least one contact detail', async () => {
		const user = userEvent.setup();
		render(CreateInquiryModal, baseProps);
		await switchToNewCustomer(user);
		await user.click(submit());
		expect(screen.getByText('Bitte mindestens Name, E-Mail oder Telefon angeben')).toBeInTheDocument();
	});

	it('requires origin and destination for a Privatumzug', async () => {
		const user = userEvent.setup();
		render(CreateInquiryModal, baseProps);
		await switchToNewCustomer(user);
		await user.type(screen.getByPlaceholderText('Name'), 'Test Kunde');
		await user.click(submit());
		expect(screen.getByText(/Auszugsadresse \(Straße, Stadt\) ist erforderlich/)).toBeInTheDocument();
	});
});

describe('CreateInquiryModal — service-type driven address config', () => {
	it('hides the destination for single-address services (Entrümpelung)', async () => {
		const user = userEvent.setup();
		render(CreateInquiryModal, baseProps);

		expect(screen.getAllByPlaceholderText('Straße *').length).toBe(2);
		await pickService(user, 'Entrümpelung');
		expect(screen.getAllByPlaceholderText('Straße *').length).toBe(1);
		// label adapts to the service
		expect(screen.getByText('Räumungsadresse')).toBeInTheDocument();
	});

	it('marks the destination optional for Umzugshelfer and omits it from the payload when empty', async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();
		render(CreateInquiryModal, { open: true, onCreated });

		await pickService(user, 'Umzugshelfer');
		// optional destination renders without the * marker
		expect(screen.getAllByPlaceholderText('Straße').length).toBeGreaterThan(0);

		await switchToNewCustomer(user);
		await user.type(screen.getByPlaceholderText('Name'), 'Test Kunde');
		await user.type(screen.getByPlaceholderText('Straße *'), 'Vonweg 1');
		await user.type(screen.getByPlaceholderText('Stadt *'), 'Hildesheim');
		await user.click(submit());

		await waitFor(() => expect(onCreated).toHaveBeenCalledWith('inq-new'));
		const inquiryPost = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/inquiries')
		)!;
		const body = JSON.parse(inquiryPost[1].body);
		expect(body.service_type).toBe('umzugshelfer');
		expect(body.origin).toBeDefined();
		expect(body.destination).toBeUndefined();
	});
});

describe('CreateInquiryModal — submission', () => {
	it('creates the new customer first, then the inquiry with the manual volume payload', async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();
		render(CreateInquiryModal, { open: true, onCreated });

		await switchToNewCustomer(user);
		await user.type(screen.getByPlaceholderText('E-Mail'), 'neu@kunde.de');
		await user.type(screen.getByPlaceholderText('Name'), 'Neu Kunde');
		await fillAddresses(user);

		// add volume via the embedded calculator: 1× Klavier (1.5 m³)
		const klavierRow = screen.getByText('Klavier').closest('div')!;
		await user.click(klavierRow.querySelector('button[aria-label="Hinzufügen"]')!);

		const dateInput = document.querySelector<HTMLInputElement>('#preferred-date')!;
		await user.type(dateInput, '2027-04-01');
		await user.click(submit());

		await waitFor(() => expect(onCreated).toHaveBeenCalledWith('inq-new'));

		// customer created before the inquiry
		const customerPost = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/admin/customers')
		)!;
		expect(JSON.parse(customerPost[1].body)).toMatchObject({
			email: 'neu@kunde.de',
			name: 'Neu Kunde',
			customer_type: 'private',
		});

		const inquiryPost = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/inquiries')
		)!;
		const body = JSON.parse(inquiryPost[1].body);
		expect(body.customer_id).toBe('cust-new');
		expect(body.submission_mode).toBe('manuell');
		expect(body.origin).toMatchObject({ street: 'Kaiserstr. 32', city: 'Hildesheim' });
		expect(body.destination).toMatchObject({ street: 'Zielweg 1', city: 'Hannover' });
		expect(body.scheduled_date).toBe('2027-04-01');
		expect(body.estimated_volume_m3).toBeCloseTo(1.5);
		expect(body.items_list).toContain('1x Klavier');
	});

	it('finds and uses an existing customer via the debounced search', async () => {
		const user = userEvent.setup();
		const onCreated = vi.fn();
		render(CreateInquiryModal, { open: true, onCreated });

		await user.type(screen.getByPlaceholderText(/Kunde suchen/), 'Kunde');
		await user.click(await screen.findByText('Kunde Eins'));
		await fillAddresses(user);
		await user.click(submit());

		await waitFor(() => expect(onCreated).toHaveBeenCalledWith('inq-new'));
		const inquiryPost = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/inquiries')
		)!;
		expect(JSON.parse(inquiryPost[1].body).customer_id).toBe('cust-1');
		// no extra customer was created
		expect(
			fetchMock.mock.calls.filter(([u, o]) => o?.method === 'POST' && String(u).endsWith('/admin/customers'))
		).toHaveLength(0);
	});

	it('shows the backend error and keeps the form when creation fails', async () => {
		fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
			if (opts?.method === 'POST' && String(url).endsWith('/inquiries'))
				return Promise.resolve(jsonRes({ message: 'Kunde gesperrt' }, 422));
			if (opts?.method === 'POST') return Promise.resolve(jsonRes({ id: 'cust-new' }));
			return Promise.resolve(jsonRes({}));
		});
		const user = userEvent.setup();
		render(CreateInquiryModal, baseProps);
		await switchToNewCustomer(user);
		await user.type(screen.getByPlaceholderText('Name'), 'X');
		await fillAddresses(user);
		await user.click(submit());

		expect(await screen.findByText('Kunde gesperrt')).toBeInTheDocument();
	});
});
