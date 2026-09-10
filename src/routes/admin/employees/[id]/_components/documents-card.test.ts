import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DocumentsCard from './DocumentsCard.svelte';

const existingDoc = {
	id: 'doc-1',
	label: 'Führungszeugnis',
	filename: 'fz.pdf',
	size_bytes: 2048,
	created_at: '2026-09-01T10:00:00Z',
};

let fetchMock: ReturnType<typeof vi.fn>;

/** Renders the card with the two fixed slots empty and the given free-form documents. */
function renderCard(documents = [existingDoc], onUpdated = vi.fn()) {
	return render(DocumentsCard, {
		props: {
			employeeId: 'emp-1',
			arbeitsvertragKey: null,
			mitarbeiterfragebogenKey: null,
			documents,
			onUpdated,
		},
	});
}

beforeEach(() => {
	fetchMock = vi.fn().mockImplementation(() =>
		Promise.resolve(
			new Response(JSON.stringify({ documents: [] }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			})
		)
	);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('employee documents card', () => {
	it('lists a free-form document beside the two fixed slots', () => {
		renderCard();
		expect(screen.getByText('Arbeitsvertrag')).toBeInTheDocument();
		expect(screen.getByText('Mitarbeiterfragebogen')).toBeInTheDocument();
		expect(screen.getByText('Führungszeugnis')).toBeInTheDocument();
		expect(screen.getByText(/fz\.pdf · 2 KB/)).toBeInTheDocument();
	});

	it('refuses to open the file picker until a label is typed', async () => {
		const user = userEvent.setup();
		renderCard([]);

		// The two fixed slots also read "Hochladen", so the button is found by its
		// title, which is what tells Alex why it is disabled.
		expect(screen.getByTitle('Bitte zuerst eine Bezeichnung eingeben')).toBeDisabled();

		await user.type(screen.getByLabelText('Weiteres Dokument'), 'Fahrerlaubnis');
		expect(screen.getByTitle('Datei auswählen')).toBeEnabled();
	});

	it('uploads the file under the typed label and clears the field', async () => {
		const user = userEvent.setup();
		const onUpdated = vi.fn();
		const { container } = renderCard([], onUpdated);

		const labelInput = screen.getByLabelText('Weiteres Dokument') as HTMLInputElement;
		await user.type(labelInput, 'Fahrerlaubnis');

		const fileInput = container.querySelector('#doc-input-extra') as HTMLInputElement;
		await user.upload(fileInput, new File(['x'], 'schein.pdf', { type: 'application/pdf' }));

		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toMatch(/\/api\/v1\/admin\/employees\/emp-1\/documents$/);
		expect(init.method).toBe('POST');
		const form = init.body as FormData;
		expect(form.get('label')).toBe('Fahrerlaubnis');
		expect((form.get('file') as File).name).toBe('schein.pdf');

		await waitFor(() => expect(onUpdated).toHaveBeenCalled());
		await waitFor(() => expect(labelInput.value).toBe(''));
	});

	it('asks before deleting a free-form document, naming it', async () => {
		const user = userEvent.setup();
		renderCard();

		await user.click(screen.getByTitle('Loeschen'));
		expect(await screen.findByText(/Führungszeugnis wirklich löschen\?/)).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Löschen' }));
		await waitFor(() => expect(fetchMock).toHaveBeenCalled());
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toMatch(/\/documents\/extra\/doc-1$/);
		expect(init.method).toBe('DELETE');
	});
});
