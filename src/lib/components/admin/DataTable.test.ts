import { describe, it, expect, vi } from 'vitest';
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
});
