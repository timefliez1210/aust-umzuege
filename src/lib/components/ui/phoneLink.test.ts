import { describe, it, expect } from 'vitest';
import { telHref } from './PhoneLink.svelte';

describe('telHref', () => {
	it('strips display formatting from a German mobile number', () => {
		expect(telHref('0151 123 45-67')).toBe('tel:01511234567');
	});

	it('keeps the leading + of an international number', () => {
		expect(telHref(' +49 (5121) 12/34 ')).toBe('tel:+4951211234');
	});
});
