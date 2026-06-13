import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ContactFlowCard from './ContactFlowCard.svelte';
import { contactFlow, openContactFlow, closeContactFlow } from '$lib/stores/contactFlow.svelte';
import { PHONE_HREF, PHONE_SHORT, WHATSAPP_HREF, KOSTENLOSES_ANGEBOT_HREF } from './constants';
import { setHoursOpen, setHoursClosed } from './testHours';

beforeEach(() => closeContactFlow());

describe('ContactFlowCard — during office hours', () => {
	beforeEach(() => setHoursOpen());

	it('leads with a direct call link to the office number', () => {
		render(ContactFlowCard, {});
		const call = screen.getByRole('link', { name: new RegExp(`Jetzt anrufen.*${PHONE_SHORT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) });
		expect(call).toHaveAttribute('href', PHONE_HREF);
	});

	it('offers a 30-minute callback as secondary option', async () => {
		const onPick = vi.fn();
		const user = userEvent.setup();
		render(ContactFlowCard, { onPick });
		await user.click(screen.getByRole('button', { name: /Rückruf in 30 Min/ }));
		expect(onPick).toHaveBeenCalledWith('callback');
	});

	it('does not show the closed-hours notice', () => {
		render(ContactFlowCard, {});
		expect(screen.queryByText(/Außerhalb der Geschäftszeiten/)).not.toBeInTheDocument();
	});
});

describe('ContactFlowCard — outside office hours', () => {
	beforeEach(() => setHoursClosed('am Montag ab 09:00 Uhr'));

	it('promotes the callback request with the reopen time instead of the call link', async () => {
		const onPick = vi.fn();
		const user = userEvent.setup();
		render(ContactFlowCard, { onPick });

		expect(screen.queryByRole('link', { name: /Jetzt anrufen/ })).not.toBeInTheDocument();
		const cb = screen.getByRole('button', { name: /Rückruf anfordern/ });
		expect(cb).toHaveTextContent('am Montag ab 09:00 Uhr');
		await user.click(cb);
		expect(onPick).toHaveBeenCalledWith('callback');
	});

	it('shows the closed-hours notice with the reopen time', () => {
		render(ContactFlowCard, {});
		expect(screen.getByText(/Außerhalb der Geschäftszeiten/)).toBeInTheDocument();
	});
});

describe('ContactFlowCard — always-available options', () => {
	beforeEach(() => setHoursOpen());

	it('links to WhatsApp in a new tab', () => {
		render(ContactFlowCard, {});
		const wa = screen.getByRole('link', { name: /WhatsApp/ });
		expect(wa).toHaveAttribute('href', WHATSAPP_HREF);
		expect(wa).toHaveAttribute('target', '_blank');
		expect(wa).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});

	it('picks the message form via onPick', async () => {
		const onPick = vi.fn();
		const user = userEvent.setup();
		render(ContactFlowCard, { onPick });
		await user.click(screen.getByRole('button', { name: /Nachricht schreiben/ }));
		expect(onPick).toHaveBeenCalledWith('message');
	});

	it('links to the kostenloses-angebot form and dismisses an open sheet on click', async () => {
		const user = userEvent.setup();
		openContactFlow('picker');
		render(ContactFlowCard, {});

		const link = screen.getByRole('link', { name: /Kostenloses Angebot/ });
		expect(link).toHaveAttribute('href', KOSTENLOSES_ANGEBOT_HREF);

		await user.click(link);
		expect(contactFlow.mode).toBe(null);
	});

	it('hides header and footer when configured (inline embed)', () => {
		render(ContactFlowCard, { showHeader: false, showFoot: false });
		expect(screen.queryByText(/Wie können wir Sie am besten erreichen/)).not.toBeInTheDocument();
		expect(screen.queryByText(/Kaiserstr\. 32/)).not.toBeInTheDocument();
	});

	it('shows the step indicator only when showStep is set', () => {
		const { unmount } = render(ContactFlowCard, { showStep: true });
		expect(screen.getByText('Schritt 1 von 2')).toBeInTheDocument();
		unmount();

		render(ContactFlowCard, { showStep: false });
		expect(screen.queryByText('Schritt 1 von 2')).not.toBeInTheDocument();
	});
});
