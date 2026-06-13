import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import FAQSection from './FAQSection.svelte';

const faqs = [
	{ question: 'Was kostet ein Umzug?', answer: 'Das hängt vom Volumen ab.' },
	{ question: 'Wie weit im Voraus buchen?', answer: 'Zwei bis vier Wochen.' },
];

describe('FAQSection', () => {
	it('renders the title and all questions', () => {
		render(FAQSection, { faqs, title: 'Fragen zum Umzug' });
		expect(screen.getByRole('heading', { name: 'Fragen zum Umzug' })).toBeInTheDocument();
		expect(screen.getByText('Was kostet ein Umzug?')).toBeInTheDocument();
		expect(screen.getByText('Wie weit im Voraus buchen?')).toBeInTheDocument();
	});

	it('toggles answers open and closed with correct aria-expanded', async () => {
		const user = userEvent.setup();
		render(FAQSection, { faqs });

		const q1 = screen.getByRole('button', { name: /Was kostet ein Umzug\?/ });
		expect(q1).toHaveAttribute('aria-expanded', 'false');

		await user.click(q1);
		expect(q1).toHaveAttribute('aria-expanded', 'true');

		await user.click(q1);
		expect(q1).toHaveAttribute('aria-expanded', 'false');
	});

	it('allows several FAQs to be open at once (independent accordion)', async () => {
		const user = userEvent.setup();
		render(FAQSection, { faqs });

		await user.click(screen.getByRole('button', { name: /Was kostet ein Umzug\?/ }));
		await user.click(screen.getByRole('button', { name: /Wie weit im Voraus buchen\?/ }));

		expect(screen.getByRole('button', { name: /Was kostet/ })).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('button', { name: /Wie weit/ })).toHaveAttribute('aria-expanded', 'true');
	});

	it('emits FAQPage JSON-LD covering every question (rich results)', () => {
		render(FAQSection, { faqs });
		const ld = [...document.head.querySelectorAll('script[type="application/ld+json"]')]
			.map((s) => s.textContent)
			.join('');
		expect(ld).toContain('"@type": "FAQPage"');
		expect(ld).toContain('Was kostet ein Umzug?');
		expect(ld).toContain('Zwei bis vier Wochen.');
	});
});
