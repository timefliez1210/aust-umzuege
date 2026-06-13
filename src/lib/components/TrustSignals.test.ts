import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { Star } from 'lucide-svelte';
import TrustSignals from './TrustSignals.svelte';

describe('TrustSignals', () => {
	it('renders the four default company stats', () => {
		render(TrustSignals);
		expect(screen.getByText('Über 1.200')).toBeInTheDocument();
		expect(screen.getByText(/Umzüge, Haushaltsauflösungen & Entrümpelungen/)).toBeInTheDocument();
		expect(screen.getByText('Über 230')).toBeInTheDocument();
		expect(screen.getByText('Über 7')).toBeInTheDocument();
		expect(screen.getByText(/5-Sterne-Bewertungen auf Google/)).toBeInTheDocument();
	});

	it('is labelled as a stats region for assistive tech', () => {
		render(TrustSignals);
		expect(screen.getByLabelText('Aust Umzüge in Zahlen')).toBeInTheDocument();
	});

	it('renders custom signals when provided', () => {
		render(TrustSignals, {
			signals: [{ number: '42', label: 'Testwerte', icon: Star }],
		});
		expect(screen.getByText('42')).toBeInTheDocument();
		expect(screen.getByText('Testwerte')).toBeInTheDocument();
		expect(screen.queryByText('Über 1.200')).not.toBeInTheDocument();
	});
});
