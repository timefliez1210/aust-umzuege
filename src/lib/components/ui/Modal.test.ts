import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import Modal from './Modal.svelte';

function setup() {
	const onclose = vi.fn();
	const { container } = render(Modal, { props: { title: 'Test', onclose } });
	const backdrop = container.ownerDocument.querySelector('[data-backdrop]') as HTMLElement;
	const panel = screen.getByRole('dialog');
	return { onclose, backdrop, panel };
}

describe('Modal backdrop', () => {
	it('closes on a press and release on the backdrop', async () => {
		const { onclose, backdrop } = setup();
		await fireEvent.pointerDown(backdrop);
		await fireEvent.click(backdrop);
		expect(onclose).toHaveBeenCalledOnce();
	});

	it('stays open when a text selection inside the panel is released over the backdrop (report 573d50f9)', async () => {
		const { onclose, backdrop, panel } = setup();
		await fireEvent.pointerDown(panel);
		await fireEvent.click(backdrop);
		expect(onclose).not.toHaveBeenCalled();
	});

	it('stays open on a click inside the panel', async () => {
		const { onclose, panel } = setup();
		await fireEvent.pointerDown(panel);
		await fireEvent.click(panel);
		expect(onclose).not.toHaveBeenCalled();
	});
});
