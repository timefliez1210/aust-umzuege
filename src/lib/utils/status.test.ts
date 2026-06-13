import { describe, it, expect } from 'vitest';
import { INQUIRY_STATUS_LABELS, formatStatus } from './status';

/**
 * Backend contract: every value `InquiryStatus::as_str()` can produce
 * (crates/core/src/models/inquiry.rs) must have a German label here —
 * see CLAUDE.md "Connected Changes".
 */
const BACKEND_STATUSES = [
	'pending',
	'info_requested',
	'estimating',
	'estimated',
	'offer_ready',
	'offer_sent',
	'accepted',
	'rejected',
	'expired',
	'cancelled',
	'scheduled',
	'completed',
	'invoiced',
	'paid',
];

describe('INQUIRY_STATUS_LABELS', () => {
	it('covers every backend InquiryStatus value', () => {
		for (const status of BACKEND_STATUSES) {
			expect(INQUIRY_STATUS_LABELS[status], `missing label for "${status}"`).toBeTruthy();
		}
	});

	it('has no labels for statuses the backend no longer knows', () => {
		for (const key of Object.keys(INQUIRY_STATUS_LABELS)) {
			expect(BACKEND_STATUSES, `stale label key "${key}"`).toContain(key);
		}
	});

	it('labels are German user-facing strings', () => {
		expect(INQUIRY_STATUS_LABELS.pending).toBe('Ausstehend');
		expect(INQUIRY_STATUS_LABELS.offer_sent).toBe('Angebot gesendet');
		expect(INQUIRY_STATUS_LABELS.paid).toBe('Bezahlt');
	});
});

describe('formatStatus', () => {
	it('returns the German label for known statuses', () => {
		expect(formatStatus('estimating')).toBe('Wird geschätzt');
		expect(formatStatus('cancelled')).toBe('Abgesagt');
	});

	it('falls back to the raw status for unknown codes instead of swallowing them', () => {
		expect(formatStatus('some_future_status')).toBe('some_future_status');
		expect(formatStatus('')).toBe('');
	});
});
