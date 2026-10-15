import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/svelte';
import { dismissOnBackdrop } from './dismissOnBackdrop';

function setup() {
	const backdrop = document.createElement('div');
	const panel = document.createElement('div');
	const input = document.createElement('input');
	panel.appendChild(input);
	backdrop.appendChild(panel);
	document.body.appendChild(backdrop);
	const close = vi.fn();
	const action = dismissOnBackdrop(backdrop, close);
	return { backdrop, input, close, action };
}

describe('dismissOnBackdrop', () => {
	it('closes when press and click both land on the backdrop', async () => {
		const { backdrop, close } = setup();
		await fireEvent.pointerDown(backdrop);
		await fireEvent.click(backdrop);
		expect(close).toHaveBeenCalledOnce();
	});

	it('ignores a text selection started in an input and released over the backdrop', async () => {
		const { backdrop, input, close } = setup();
		await fireEvent.pointerDown(input);
		await fireEvent.click(backdrop);
		expect(close).not.toHaveBeenCalled();
	});

	it('ignores clicks inside the panel', async () => {
		const { input, close } = setup();
		await fireEvent.pointerDown(input);
		await fireEvent.click(input);
		expect(close).not.toHaveBeenCalled();
	});

	it('uses the latest callback after update and detaches on destroy', async () => {
		const { backdrop, close, action } = setup();
		const next = vi.fn();
		action.update(next);
		await fireEvent.pointerDown(backdrop);
		await fireEvent.click(backdrop);
		expect(next).toHaveBeenCalledOnce();
		expect(close).not.toHaveBeenCalled();
		action.destroy();
		await fireEvent.pointerDown(backdrop);
		await fireEvent.click(backdrop);
		expect(next).toHaveBeenCalledOnce();
	});
});
