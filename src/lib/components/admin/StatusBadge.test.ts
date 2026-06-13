import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatusBadge from './StatusBadge.svelte';
import { INQUIRY_STATUS_LABELS } from '$lib/utils/status';

describe('StatusBadge', () => {
	it('maps known statuses to German badge text', () => {
		render(StatusBadge, { status: 'completed' });
		expect(screen.getByText('Erledigt')).toBeInTheDocument();
	});

	it('falls back to the raw status for unknown codes (never blank)', () => {
		render(StatusBadge, { status: 'mystery_state' });
		expect(screen.getByText('mystery_state')).toBeInTheDocument();
	});

	it('an explicit label overrides the mapped text', () => {
		render(StatusBadge, { status: 'paid', label: 'Beglichen' });
		expect(screen.getByText('Beglichen')).toBeInTheDocument();
		expect(screen.queryByText('Bezahlt')).not.toBeInTheDocument();
	});

	it('covers every backend inquiry status with a translation', () => {
		// every status the backend can emit must render a translated badge,
		// not the raw English code
		for (const status of Object.keys(INQUIRY_STATUS_LABELS)) {
			const { container, unmount } = render(StatusBadge, { status });
			const text = container.querySelector('.badge')!.textContent!.trim();
			expect(text, `badge for "${status}" shows raw code`).not.toBe(status);
			unmount();
		}
	});

	it('colors success-like and failure-like statuses differently', () => {
		const { container: ok, unmount } = render(StatusBadge, { status: 'accepted' });
		const okStyle = ok.querySelector('.badge')!.getAttribute('style');
		unmount();
		const { container: bad } = render(StatusBadge, { status: 'rejected' });
		const badStyle = bad.querySelector('.badge')!.getAttribute('style');
		expect(okStyle).not.toBe(badStyle);
	});
});
