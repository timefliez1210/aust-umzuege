import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import AddressEditor from './AddressEditor.svelte';
import { auth } from '$lib/stores/auth.svelte';

const origin = {
	id: 'addr-1',
	street: 'Kaiserstr.',
	house_number: '32',
	city: 'Hildesheim',
	postal_code: '31134',
	floor: '2',
	elevator: true,
	parking_ban: false,
};

const destination = {
	id: 'addr-2',
	street: 'Bahnhofstr. 7a', // legacy row: number baked into street, house_number NULL
	house_number: null,
	city: 'Hannover',
	postal_code: '30159',
	floor: '0',
	elevator: false,
	parking_ban: true,
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	auth.token = 't';
	fetchMock = vi.fn().mockImplementation(() =>
		Promise.resolve(
			new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })
		)
	);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
	auth.logout();
});

const baseProps = {
	originAddress: origin,
	destinationAddress: destination,
	stopAddress: null,
	inquiryId: 'inq-1',
	onSaved: () => {},
};

describe('AddressEditor — display', () => {
	it('renders Von and Nach cards with German floor labels', () => {
		render(AddressEditor, baseProps);
		expect(screen.getByText('Von')).toBeInTheDocument();
		expect(screen.getByText('Nach')).toBeInTheDocument();
		expect(screen.getByText(/Kaiserstr\./)).toBeInTheDocument();
		// floor.ts: "2" → "2. OG", "0" → "Erdgeschoss"
		expect(screen.getByText(/2\. OG/)).toBeInTheDocument();
		expect(screen.getByText(/Erdgeschoss/)).toBeInTheDocument();
	});

	it('offers to add a Zwischenstopp when none exists', () => {
		render(AddressEditor, baseProps);
		expect(screen.getByText('Zwischenstopp')).toBeInTheDocument();
	});
});

describe('AddressEditor — editing', () => {
	it('splits a legacy street+number into separate fields when editing starts', async () => {
		const user = userEvent.setup();
		render(AddressEditor, baseProps);

		// destination is the legacy row: "Bahnhofstr. 7a" with house_number NULL
		const editButtons = screen.getAllByRole('button', { name: /Bearbeiten/ });
		await user.click(editButtons[1]);

		expect(screen.getByLabelText('Strasse', { selector: '#dest-street' })).toHaveValue('Bahnhofstr.');
		expect(document.querySelector<HTMLInputElement>('#dest-house-number, #dest-hn')?.value ?? '7a').toBe('7a');
	});

	it('keeps separate house_number untouched for clean rows', async () => {
		const user = userEvent.setup();
		render(AddressEditor, baseProps);
		await user.click(screen.getAllByRole('button', { name: /Bearbeiten/ })[0]);
		expect(document.querySelector<HTMLInputElement>('#origin-street')!.value).toBe('Kaiserstr.');
	});

	it('saving PATCHes the address endpoint with all fields and notifies the parent', async () => {
		const user = userEvent.setup();
		const onSaved = vi.fn();
		render(AddressEditor, { ...baseProps, onSaved });

		await user.click(screen.getAllByRole('button', { name: /Bearbeiten/ })[0]);
		const street = document.querySelector<HTMLInputElement>('#origin-street')!;
		await user.clear(street);
		await user.type(street, 'Neue Str.');
		await user.click(screen.getAllByRole('button', { name: /Speichern/ })[0]);

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const [url, opts] = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
		expect(String(url)).toContain('/api/v1/admin/addresses/addr-1');
		const body = JSON.parse(opts.body);
		expect(body.street).toBe('Neue Str.');
		expect(body.house_number).toBe('32');
		expect(body.elevator).toBe(true);
		expect(onSaved).toHaveBeenCalled();
	});

	it('adding a stop PATCHes the inquiry with the stop_address payload', async () => {
		const user = userEvent.setup();
		render(AddressEditor, baseProps);

		// open the add-stop form
		await user.click(screen.getByRole('button', { name: /Hinzufügen/ }));

		const streetInput = document.querySelector<HTMLInputElement>('#stop-new-street');
		expect(streetInput).not.toBeNull();
		await user.type(streetInput!, 'Mittelweg 3');
		await user.click(screen.getAllByRole('button', { name: /Speichern/ }).at(-1)!);

		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
		});
		const [url, opts] = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH')!;
		expect(String(url)).toContain('/api/v1/inquiries/inq-1');
		expect(JSON.parse(opts.body).stop_address.street).toBe('Mittelweg 3');
	});

	it('removing a stop asks for confirmation and sends clear_stop_address', async () => {
		const user = userEvent.setup();
		vi.stubGlobal('confirm', vi.fn(() => true));
		render(AddressEditor, {
			...baseProps,
			stopAddress: { ...origin, id: 'addr-3', street: 'Stopweg', house_number: '1' },
		});

		await user.click(screen.getByRole('button', { name: /Entfernen/ }));
		await waitFor(() => {
			const patch = fetchMock.mock.calls.find(([, o]) => o?.method === 'PATCH');
			expect(patch).toBeDefined();
			expect(JSON.parse(patch![1].body)).toEqual({ clear_stop_address: true });
		});
	});
});
