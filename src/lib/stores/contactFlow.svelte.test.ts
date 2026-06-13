import { describe, it, expect, beforeEach } from 'vitest';
import { contactFlow, openContactFlow, closeContactFlow } from './contactFlow.svelte';

beforeEach(() => closeContactFlow());

describe('contactFlow store', () => {
	it('starts closed', () => {
		expect(contactFlow.mode).toBe(null);
	});

	it('openContactFlow defaults to the picker step', () => {
		openContactFlow();
		expect(contactFlow.mode).toBe('picker');
	});

	it('can jump straight to a form step (callback / message)', () => {
		openContactFlow('callback');
		expect(contactFlow.mode).toBe('callback');
		openContactFlow('message');
		expect(contactFlow.mode).toBe('message');
	});

	it('closeContactFlow resets to null', () => {
		openContactFlow('callback');
		closeContactFlow();
		expect(contactFlow.mode).toBe(null);
	});
});
