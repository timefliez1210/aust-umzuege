/**
 * Round-trip: the admin email workflow (`/api/v1/admin/emails/*`) — the
 * "compose → review draft → send via SMTP → mark sent" path the dashboard uses.
 * Previously unexercised.
 *
 * A composed thread is NOT tied to an inquiry/offer, so send takes the plain-
 * email branch (no PDF attachment, no offer.sent event, no Telegram) and is
 * safe for the default suite. Delivery is verified against Mailpit, which
 * captures all SMTP from the local backend.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiGet, apiPost } from '$lib/utils/api.svelte';
import { adminLogin, cleanup, createCustomer, newRefs, waitForMail } from './helpers';

interface ComposeResult {
	thread_id: string;
	message_id: string;
}
interface ThreadDetail {
	thread: { id: string; customer_id: string; customer_email: string | null; subject: string | null };
	messages: {
		id: string;
		direction: string;
		to_address: string;
		subject: string | null;
		body_text: string | null;
		status: string;
	}[];
}

const refs = newRefs();
let customerEmail: string;
const SUBJECT = `Integration Compose ${Date.now()}`;
const BODY = 'Sehr geehrte Damen und Herren, dies ist ein Integrationstest.';

beforeAll(async () => {
	await adminLogin();
	const customer = await createCustomer(refs);
	customerEmail = customer.email;
});

afterAll(async () => {
	await cleanup(refs);
});

describe('Admin email compose → send', () => {
	let threadId: string;
	let messageId: string;

	it('composes a new outbound draft thread', async () => {
		const res = await apiPost<ComposeResult>('/api/v1/admin/emails/compose', {
			customer_email: customerEmail,
			subject: SUBJECT,
			body_text: BODY,
		});
		expect(res.thread_id).toBeTruthy();
		expect(res.message_id).toBeTruthy();
		threadId = res.thread_id;
		messageId = res.message_id;
	});

	it('exposes the draft via the thread detail endpoint', async () => {
		const detail = await apiGet<ThreadDetail>(`/api/v1/admin/emails/${threadId}`);
		expect(detail.thread.customer_email).toBe(customerEmail);
		expect(detail.thread.subject).toBe(SUBJECT);
		// Ensure the upserted customer gets cleaned up regardless of upsert path.
		if (!refs.customerIds.includes(detail.thread.customer_id)) {
			refs.customerIds.push(detail.thread.customer_id);
		}

		const msg = detail.messages.find((m) => m.id === messageId);
		expect(msg, 'draft message missing from thread').toBeDefined();
		expect(msg!.status).toBe('draft');
		expect(msg!.direction).toBe('outbound');
		expect(msg!.body_text).toBe(BODY);
	});

	it('lists the thread in the inbox view', async () => {
		const list = await apiGet<{ threads: { id: string }[] }>('/api/v1/admin/emails');
		expect(list.threads.some((t) => t.id === threadId)).toBe(true);
	});

	it('sends the draft via SMTP and Mailpit receives it', async () => {
		const send = await apiPost<{ message: string }>(
			`/api/v1/admin/emails/messages/${messageId}/send`,
			{}
		);
		expect(send.message).toContain(customerEmail);

		// Real SMTP round-trip → Mailpit must hold the message.
		const mail = await waitForMail(customerEmail, { subjectContains: SUBJECT });
		expect(mail.text).toContain('Integrationstest');
	});

	it('flips the message status to sent', async () => {
		const detail = await apiGet<ThreadDetail>(`/api/v1/admin/emails/${threadId}`);
		const msg = detail.messages.find((m) => m.id === messageId);
		expect(msg?.status).toBe('sent');
	});

	it('cannot re-send an already-sent message (404)', async () => {
		await expect(
			apiPost(`/api/v1/admin/emails/messages/${messageId}/send`, {})
		).rejects.toMatchObject({ status: 404 });
	});
});

describe('Admin email draft management', () => {
	it('discards a draft so it drops out of the thread', async () => {
		const composed = await apiPost<ComposeResult>('/api/v1/admin/emails/compose', {
			customer_email: customerEmail,
			subject: `${SUBJECT} (discard)`,
			body_text: 'wird verworfen',
		});
		await apiPost(`/api/v1/admin/emails/messages/${composed.message_id}/discard`, {});

		const detail = await apiGet<ThreadDetail>(`/api/v1/admin/emails/${composed.thread_id}`);
		expect(detail.messages.some((m) => m.id === composed.message_id)).toBe(false);
	});

	it('returns 501 for the not-yet-implemented regenerate stub', async () => {
		const composed = await apiPost<ComposeResult>('/api/v1/admin/emails/compose', {
			customer_email: customerEmail,
			subject: `${SUBJECT} (regen)`,
			body_text: 'regenerate me',
		});
		// Transparent 501 is the intended contract (better than a silent 404).
		await expect(
			apiPost(`/api/v1/admin/emails/messages/${composed.message_id}/regenerate`, {})
		).rejects.toMatchObject({ status: 501 });
	});
});
