/**
 * Closes an overlay when its backdrop — and only its backdrop — is clicked.
 *
 * Used by: every hand-rolled modal/lightbox backdrop (ui/Modal, ConfirmationDialog,
 *          the calendar quick-create dialog, image viewers, ContactFlowSheet).
 * Purpose: a drag that starts inside the panel (selecting text in an input) and is
 *          released over the backdrop fires its `click` on the backdrop, because that
 *          is the nearest common ancestor. Checking `e.target` alone cannot tell that
 *          apart from a real backdrop click, so the press has to start there too
 *          (report 573d50f9).
 *
 * Usage: `<div class="fixed inset-0 …" use:dismissOnBackdrop={close}>`
 */
export function dismissOnBackdrop(node: HTMLElement, close: () => void) {
	let onClose = close;
	let pressedOnBackdrop = false;

	const onPointerDown = (e: PointerEvent) => {
		pressedOnBackdrop = e.target === node;
	};
	const onClick = (e: MouseEvent) => {
		if (pressedOnBackdrop && e.target === node) onClose();
		pressedOnBackdrop = false;
	};

	node.addEventListener('pointerdown', onPointerDown);
	node.addEventListener('click', onClick);
	return {
		update(next: () => void) {
			onClose = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', onPointerDown);
			node.removeEventListener('click', onClick);
		}
	};
}
