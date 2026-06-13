import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import InvoiceSendModal from './InvoiceSendModal.svelte';
import { auth } from '$lib/stores/auth.svelte';

function jsonRes(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

const fullInvoice = {
	id: 'inv-1',
	invoice_number: 'RE-2026-001',
	invoice_type: 'full',
	partial_percent: null,
	extra_services: [],
	total_brutto_cents: 119000,
};

let fetchMock: ReturnType<typeof vi.fn>;
/** Existing invoices returned by the seed GET. */
let existingInvoices: unknown[] = [];

beforeEach(() => {
	auth.token = 't';
	existingInvoices = [];
	fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
		const u = String(url);
		const method = opts?.method ?? 'GET';
		if (method === 'GET' && u.endsWith('/invoices')) return Promise.resolve(jsonRes(existingInvoices));
		if (method === 'POST' && u.endsWith('/invoices')) return Promise.resolve(jsonRes([fullInvoice]));
		if (method === 'PATCH' && u.includes('/invoices/')) return Promise.resolve(jsonRes(fullInvoice));
		return Promise.resolve(jsonRes({}));
	});
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	vi.stubGlobal('alert', vi.fn());
});

afterEach(() => {
	vi.restoreAllMocks();
	auth.logout();
});

const baseProps = {
	inquiryId: 'inq-1',
	inquiryStatus: 'scheduled',
	customerName: 'Frau Muster',
	offerPriceCents: 100000, // 1.000 € netto → 1.190 € brutto
	onSent: () => {},
	onClose: () => {},
};

describe('InvoiceSendModal — type step', () => {
	it('starts on the type step with Vollrechnung preselected', () => {
		render(InvoiceSendModal, baseProps);
		expect(screen.getByText('Rechnungstyp wählen')).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: /Vollrechnung/ })).toBeChecked();
	});

	it('shows Anzahlung/Schlussrechnung amounts derived from the offer brutto', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);
		await user.click(screen.getByRole('radio', { name: /Teilrechnung/ }));

		// 1.190 € brutto · 30 % = 357 € Anzahlung, 833 € Schluss
		expect(screen.getByText(/357,00/)).toBeInTheDocument();
		expect(screen.getByText(/833,00/)).toBeInTheDocument();
	});

	it('requires a manual brutto amount when no offer exists', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, { ...baseProps, offerPriceCents: null });

		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		expect(vi.mocked(alert)).toHaveBeenCalledWith('Bitte einen Rechnungsbetrag (Brutto) eingeben.');
		// still on step 1
		expect(screen.getByText('Rechnungstyp wählen')).toBeInTheDocument();
	});

	it('bounds the Anzahlung percentage to 1–99', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);
		await user.click(screen.getByRole('radio', { name: /Teilrechnung/ }));

		const pct = document.querySelector<HTMLInputElement>('#partial-percent')!;
		await user.clear(pct);
		await user.type(pct, '120');
		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		expect(vi.mocked(alert)).toHaveBeenCalledWith('Prozentwert muss zwischen 1 und 99 liegen.');
	});
});

describe('InvoiceSendModal — line items and totals', () => {
	async function goToLineItems(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		await screen.findByText('Positionen bearbeiten');
	}

	it('preset chips add line items and the brutto total updates (19% VAT round-trip)', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);
		await goToLineItems(user);

		// base: 1.190,00 € brutto
		expect(screen.getByText(/1\.190,00/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Möbelmontage' }));
		// 95,20 € brutto → 80 € netto → total 1.285,20 € brutto
		expect(await screen.findByText(/1\.285,20/)).toBeInTheDocument();
	});

	it('creates the invoice, applies extras as netto cents, and seeds the German email', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);
		await goToLineItems(user);
		await user.click(screen.getByRole('button', { name: 'Halteverbotszone (Auszug)' }));
		await user.click(screen.getByRole('button', { name: /Rechnung erstellen/ }));

		await waitFor(() =>
			expect(document.querySelector<HTMLInputElement>('#email-subject')?.value).toContain('RE-2026-001')
		);

		// inquiry was marked completed first (status was 'scheduled')
		const statusPatch = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'PATCH' && String(u).endsWith('/inquiries/inq-1')
		);
		expect(JSON.parse(statusPatch![1].body)).toEqual({ status: 'completed' });

		// invoice created as full type
		const post = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/invoices')
		);
		expect(JSON.parse(post![1].body)).toEqual({ invoice_type: 'full' });

		// extras patched onto the invoice as netto cents (59,50 € brutto → 5000 netto)
		const extrasPatch = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'PATCH' && String(u).includes('/invoices/inv-1')
		);
		expect(JSON.parse(extrasPatch![1].body)).toEqual({
			extra_services: [{ description: 'Halteverbotszone (Auszug)', price_cents: 5000 }],
		});

		// email body addresses the customer and demands payment within 7 days
		const body = document.querySelector('textarea')!.value;
		expect(body).toContain('Sehr geehrte/r Frau Muster');
		expect(body).toContain('innerhalb von 7 Tagen');
	});

	it('does not touch the inquiry status when it is already invoiced/completed', async () => {
		const user = userEvent.setup();
		render(InvoiceSendModal, { ...baseProps, inquiryStatus: 'completed' });
		await goToLineItems(user);
		await user.click(screen.getByRole('button', { name: /Rechnung erstellen/ }));
		await waitFor(() =>
			expect(document.querySelector<HTMLInputElement>('#email-subject')?.value).toContain('RE-2026-001')
		);

		const statusPatch = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'PATCH' && String(u).endsWith('/inquiries/inq-1')
		);
		expect(statusPatch).toBeUndefined();
	});

	it('sends partial invoices with the percentage and emails the Schlussrechnung', async () => {
		fetchMock.mockImplementation((url: string, opts?: RequestInit) => {
			const u = String(url);
			const method = opts?.method ?? 'GET';
			if (method === 'GET' && u.endsWith('/invoices')) return Promise.resolve(jsonRes([]));
			if (method === 'POST' && u.endsWith('/invoices'))
				return Promise.resolve(
					jsonRes([
						{ ...fullInvoice, id: 'inv-first', invoice_type: 'partial_first', partial_percent: 40 },
						{ ...fullInvoice, id: 'inv-final', invoice_type: 'partial_final' },
					])
				);
			return Promise.resolve(jsonRes(fullInvoice));
		});

		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);
		await user.click(screen.getByRole('radio', { name: /Teilrechnung/ }));
		const pct = document.querySelector<HTMLInputElement>('#partial-percent')!;
		await user.clear(pct);
		await user.type(pct, '40');
		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		await screen.findByText('Positionen bearbeiten');
		await user.click(screen.getByRole('button', { name: /Rechnung erstellen/ }));
		await waitFor(() =>
			expect(document.querySelector<HTMLInputElement>('#email-subject')?.value).toContain('RE-2026-001')
		);

		const post = fetchMock.mock.calls.find(
			([u, o]) => o?.method === 'POST' && String(u).endsWith('/invoices')
		);
		expect(JSON.parse(post![1].body)).toEqual({ invoice_type: 'partial', partial_percent: 40 });
	});
});

describe('InvoiceSendModal — sending', () => {
	it('POSTs subject and body to the send endpoint and reports back', async () => {
		const user = userEvent.setup();
		const onSent = vi.fn();
		render(InvoiceSendModal, { ...baseProps, onSent });

		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		await screen.findByText('Positionen bearbeiten');
		await user.click(screen.getByRole('button', { name: /Rechnung erstellen/ }));
		await waitFor(() =>
			expect(document.querySelector<HTMLInputElement>('#email-subject')?.value).toContain('RE-2026-001')
		);
		await user.click(screen.getByRole('button', { name: 'Rechnung senden' }));

		await waitFor(() => expect(onSent).toHaveBeenCalled());
		const send = fetchMock.mock.calls.find(([u, o]) => String(u).endsWith('/send') && o?.method === 'POST');
		expect(send).toBeDefined();
		const body = JSON.parse(send![1].body);
		expect(body.subject).toContain('RE-2026-001');
		expect(body.body).toContain('Frau Muster');
	});
});

describe('InvoiceSendModal — re-edit seeding', () => {
	it('seeds type, percentage, and stored extras from existing invoices', async () => {
		existingInvoices = [
			{ ...fullInvoice, id: 'p1', invoice_type: 'partial_first', partial_percent: 25 },
			{
				...fullInvoice,
				id: 'p2',
				invoice_type: 'partial_final',
				extra_services: [{ description: 'Entsorgung', price_cents: 5000 }],
			},
		];
		const user = userEvent.setup();
		render(InvoiceSendModal, baseProps);

		await waitFor(() =>
			expect(screen.getByRole('radio', { name: /Teilrechnung/ })).toBeChecked()
		);

		await user.click(screen.getByRole('button', { name: 'Weiter →' }));
		// stored extra reappears with its brutto string (5000 netto → 59,50 brutto)
		expect(await screen.findByDisplayValue('Entsorgung')).toBeInTheDocument();
		expect(screen.getByDisplayValue('59,50')).toBeInTheDocument();
	});
});
