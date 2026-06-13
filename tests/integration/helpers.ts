/**
 * Shared helpers for integration tests.
 *
 * Admin calls go through the REAL frontend API client (`$lib/utils/api.svelte`
 * + auth store) so the tests exercise the exact code paths the admin UI uses
 * — header injection, JSON handling, error mapping, token storage.
 */
import { expect } from 'vitest';
import { auth } from '$lib/stores/auth.svelte';
import { apiPost, apiDelete } from '$lib/utils/api.svelte';
import { API_BASE, MAILPIT_BASE, TEST_DOMAIN, ADMIN_EMAIL, ADMIN_PASSWORD } from './config';

// ── Auth ────────────────────────────────────────────────────────────────────

/** Logs in through the frontend auth store; fails the test run if rejected. */
export async function adminLogin(): Promise<void> {
	if (auth.isAuthenticated) return;
	const ok = await auth.login(ADMIN_EMAIL, ADMIN_PASSWORD);
	expect(ok, `Admin-Login fehlgeschlagen: ${auth.error ?? 'unbekannt'}`).toBe(true);
}

// ── Tagged test data factories ──────────────────────────────────────────────

let seq = 0;
export function testEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${seq++}@${TEST_DOMAIN}`;
}

export interface CreatedRefs {
	inquiryIds: string[];
	customerIds: string[];
	employeeIds: string[];
}

export function newRefs(): CreatedRefs {
	return { inquiryIds: [], customerIds: [], employeeIds: [] };
}

/** Creates a tagged customer via the admin API and tracks it for cleanup. */
export async function createCustomer(
	refs: CreatedRefs,
	over: Record<string, unknown> = {}
): Promise<{ id: string; email: string }> {
	const email = testEmail('kunde');
	const res = await apiPost<{ id: string }>('/api/v1/admin/customers', {
		email,
		name: 'Integration Testkunde',
		phone: '0151 0000000',
		salutation: 'Frau',
		...over,
	});
	refs.customerIds.push(res.id);
	return { id: res.id, email };
}

/** Creates a tagged employee via the admin API and tracks it for cleanup. */
export async function createEmployee(
	refs: CreatedRefs,
	over: Record<string, unknown> = {}
): Promise<{ id: string; email: string }> {
	const email = testEmail('mitarbeiter');
	const res = await apiPost<{ id: string }>('/api/v1/admin/employees', {
		first_name: 'Inge',
		last_name: 'Integration',
		email,
		phone: '0151 1111111',
		...over,
	});
	refs.employeeIds.push(res.id);
	return { id: res.id, email };
}

/** Creates an inquiry for a customer (Privatumzug with both addresses by default). */
export async function createInquiry(
	refs: CreatedRefs,
	customerId: string,
	over: Record<string, unknown> = {}
): Promise<string> {
	const res = await apiPost<{ id: string }>('/api/v1/inquiries', {
		customer_id: customerId,
		service_type: 'privatumzug',
		submission_mode: 'manuell',
		origin: {
			street: 'Teststr. 1',
			city: 'Hildesheim',
			postal_code: '31134',
			floor: '2',
			elevator: true,
			parking_ban: null,
		},
		destination: {
			street: 'Zielweg 9',
			city: 'Hannover',
			postal_code: '30159',
			floor: 'EG',
			elevator: null,
			parking_ban: true,
		},
		notes: `[${TEST_DOMAIN}] integration test inquiry`,
		...over,
	});
	refs.inquiryIds.push(res.id);
	return res.id;
}

/**
 * Best-effort cleanup in FK-safe order: inquiries (hard-delete cascades
 * estimations/offers/invoices/assignments) → employees → customers.
 */
export async function cleanup(refs: CreatedRefs): Promise<void> {
	for (const id of refs.inquiryIds) {
		await apiDelete(`/api/v1/inquiries/${id}`).catch(() => {});
	}
	for (const id of refs.employeeIds) {
		await apiPost(`/api/v1/admin/employees/${id}/delete`).catch(() => {});
	}
	for (const id of refs.customerIds) {
		await apiPost(`/api/v1/admin/customers/${id}/delete`).catch(() => {});
	}
}

// ── Raw fetch (public + worker endpoints, no admin token) ──────────────────

export async function publicPost(path: string, body: unknown): Promise<Response> {
	return fetch(`${API_BASE}${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

export async function workerGetRaw<T>(path: string, token: string): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	expect(res.ok, `${path} → ${res.status}`).toBe(true);
	return res.json() as Promise<T>;
}

export async function workerPatchRaw<T>(path: string, token: string, body: unknown): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		method: 'PATCH',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
	expect(res.ok, `PATCH ${path} → ${res.status}`).toBe(true);
	const text = await res.text();
	return (text ? JSON.parse(text) : undefined) as T;
}

// ── Mailpit ─────────────────────────────────────────────────────────────────

interface MailpitMessageMeta {
	ID: string;
	Subject: string;
	To: { Address: string }[];
	Created: string;
}

/** Polls Mailpit until a message to `recipient` (optionally matching subject) arrives. */
export async function waitForMail(
	recipient: string,
	opts: { subjectContains?: string; timeoutMs?: number } = {}
): Promise<{ meta: MailpitMessageMeta; text: string }> {
	const deadline = Date.now() + (opts.timeoutMs ?? 15_000);
	while (Date.now() < deadline) {
		const res = await fetch(
			`${MAILPIT_BASE}/api/v1/search?query=${encodeURIComponent(`to:"${recipient}"`)}`
		);
		if (res.ok) {
			const data = (await res.json()) as { messages: MailpitMessageMeta[] };
			const match = (data.messages ?? []).find(
				(m) => !opts.subjectContains || m.Subject.includes(opts.subjectContains)
			);
			if (match) {
				const detail = await fetch(`${MAILPIT_BASE}/api/v1/message/${match.ID}`);
				const body = (await detail.json()) as { Text: string };
				return { meta: match, text: body.Text };
			}
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`Keine Mail an ${recipient} in Mailpit gefunden (${opts.subjectContains ?? ''})`);
}

/** Extracts the 6-digit OTP from the German code email. */
export function extractOtp(mailText: string): string {
	const m = mailText.match(/Zugangscode lautet:\s*(\d{6})/);
	if (!m) throw new Error(`Kein OTP in Mail gefunden:\n${mailText}`);
	return m[1];
}
