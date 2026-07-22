import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import DataTable from './DataTable.svelte';

interface Row {
	name: string;
	city: string;
}

const columns = [
	{ key: 'name', label: 'Name', sortable: true },
	{ key: 'city', label: 'Stadt' },
];

const rows: Row[] = [
	{ name: 'Muster', city: 'Hildesheim' },
	{ name: 'Beispiel', city: 'Hannover' },
];

// createRawSnippet requires a single root element, so both fields share one cell
const rowSnippet = createRawSnippet<[unknown, number]>((row) => ({
	render: () => {
		const r = row() as Row;
		return `<td colspan="2">${r.name} | ${r.city}</td>`;
	},
}));

describe('DataTable', () => {
	it('renders column headers and one row per item via the row snippet', () => {
		render(DataTable, { columns, rows, row: rowSnippet });
		expect(screen.getByText('Stadt')).toBeInTheDocument();
		expect(screen.getByText(/Muster \| Hildesheim/)).toBeInTheDocument();
		expect(screen.getByText(/Beispiel \| Hannover/)).toBeInTheDocument();
		expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
	});

	it('shows the empty message when there are no rows', () => {
		render(DataTable, { columns, rows: [], row: rowSnippet, emptyMessage: 'Nichts da.' });
		expect(screen.getByText('Nichts da.')).toBeInTheDocument();
	});

	it('sortable headers select the column descending first, then toggle direction', async () => {
		const user = userEvent.setup();
		render(DataTable, { columns, rows, row: rowSnippet });

		const sortBtn = screen.getByRole('button', { name: /Name/ });
		// new column → descending (arrow-down icon)
		await user.click(sortBtn);
		expect(sortBtn.querySelector('.lucide-arrow-down')).not.toBeNull();

		// same column again → ascending
		await user.click(sortBtn);
		expect(sortBtn.querySelector('.lucide-arrow-up')).not.toBeNull();
	});

	it('non-sortable columns render as plain text without a sort button', () => {
		render(DataTable, { columns, rows, row: rowSnippet });
		expect(screen.queryByRole('button', { name: /Stadt/ })).not.toBeInTheDocument();
	});

	it('row clicks (and Enter) invoke onRowClick with the row data', async () => {
		const user = userEvent.setup();
		const onRowClick = vi.fn();
		render(DataTable, { columns, rows, row: rowSnippet, onRowClick });

		const dataRow = screen.getByText(/Muster/).closest('tr')!;
		expect(dataRow.classList.contains('clickable')).toBe(true);
		await user.click(dataRow);
		expect(onRowClick).toHaveBeenCalledWith(rows[0]);

		dataRow.focus();
		await user.keyboard('{Enter}');
		expect(onRowClick).toHaveBeenCalledTimes(2);
	});

	it('rows are not interactive without onRowClick', () => {
		render(DataTable, { columns, rows, row: rowSnippet });
		const dataRow = screen.getByText(/Muster/).closest('tr')!;
		expect(dataRow.classList.contains('clickable')).toBe(false);
		expect(dataRow).not.toHaveAttribute('tabindex');
	});

	it('applies per-row classes via rowClass', () => {
		render(DataTable, {
			columns,
			rows,
			row: rowSnippet,
			rowClass: (r) => ((r as Row).city === 'Hannover' ? 'highlight' : undefined),
		});
		expect(screen.getByText(/Hannover/).closest('tr')!.classList.contains('highlight')).toBe(true);
		expect(screen.getByText(/Hildesheim/).closest('tr')!.classList.contains('highlight')).toBe(false);
	});

	describe('mobile card mode', () => {
		// NB: real page callers render one <td> per column (verified against
		// src/routes/admin/customers/+page.svelte etc.), which is what the
		// data-label indexing in DataTable relies on. createRawSnippet can only
		// produce a single root element for a test double, so — same as the
		// colspan rowSnippet above — this exercises index 0 (first column) only.
		function mockMobileMatchMedia(matches: boolean) {
			vi.stubGlobal('matchMedia', (query: string) => ({
				matches,
				media: query,
				addEventListener: () => {},
				removeEventListener: () => {},
			}));
		}

		afterEach(() => {
			vi.unstubAllGlobals();
		});

		it('sets data-label from the first column on each row td when below the mobile breakpoint', async () => {
			mockMobileMatchMedia(true);
			render(DataTable, { columns, rows, row: rowSnippet });

			const nameCell = (await screen.findByText(/Muster \| Hildesheim/)).closest('td')!;
			expect(nameCell).toHaveAttribute('data-label', 'Name');
		});

		it('does not set data-label above the mobile breakpoint', () => {
			mockMobileMatchMedia(false);
			render(DataTable, { columns, rows, row: rowSnippet });
			expect(screen.getByText(/Muster \| Hildesheim/).closest('td')).not.toHaveAttribute('data-label');
		});

		it('shows a compact sort select for sortable columns on mobile', async () => {
			mockMobileMatchMedia(true);
			render(DataTable, { columns, rows, row: rowSnippet });

			const select = await screen.findByRole('combobox', { name: 'Sortieren nach' });
			expect(within(select).getByRole('option', { name: 'Name' })).toBeInTheDocument();
			expect(within(select).queryByRole('option', { name: 'Stadt' })).not.toBeInTheDocument();
		});

		it('does not show the mobile sort select above the mobile breakpoint', () => {
			mockMobileMatchMedia(false);
			render(DataTable, { columns, rows, row: rowSnippet });
			expect(screen.queryByRole('combobox', { name: 'Sortieren nach' })).not.toBeInTheDocument();
		});
	});
});
