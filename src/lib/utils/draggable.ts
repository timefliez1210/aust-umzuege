/**
 * Svelte action that makes a floating element freely draggable by its heading.
 *
 * Usage: `<div class="modal" use:draggable>`
 * The action looks for the first `h3` inside the node as the drag handle.
 * The element is moved via `transform: translate(dx, dy)` relative to its
 * initial rendered position — no layout changes required.
 *
 * Called by: admin/calendar/+page.svelte (quick-create inquiry + termin modals)
 * Purpose: Let the user reposition floating modals freely so they don't obscure
 *          the calendar data they are working on.
 *
 * @param node - The modal element to make draggable
 * @param handleSelector - CSS selector for the drag handle within node (default: 'h3')
 */
export function draggable(node: HTMLElement, handleSelector: string = 'h3') {
	const handle = node.querySelector(handleSelector) as HTMLElement | null;
	if (!handle) return;

	let offsetX = 0;
	let offsetY = 0;
	let startX = 0;
	let startY = 0;

	handle.style.cursor = 'grab';
	handle.style.userSelect = 'none';

	/** Begins tracking a drag initiated by mouse. */
	function onMouseDown(e: MouseEvent) {
		startX = e.clientX - offsetX;
		startY = e.clientY - offsetY;
		handle!.style.cursor = 'grabbing';
		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
		e.preventDefault();
	}

	/** Updates the element position while the mouse moves. */
	function onMouseMove(e: MouseEvent) {
		offsetX = e.clientX - startX;
		offsetY = e.clientY - startY;
		node.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
	}

	/** Ends the drag on mouse release. */
	function onMouseUp() {
		handle!.style.cursor = 'grab';
		window.removeEventListener('mousemove', onMouseMove);
		window.removeEventListener('mouseup', onMouseUp);
	}

	/** Begins tracking a drag initiated by touch. */
	function onTouchStart(e: TouchEvent) {
		const t = e.touches[0];
		startX = t.clientX - offsetX;
		startY = t.clientY - offsetY;
		window.addEventListener('touchmove', onTouchMove, { passive: false });
		window.addEventListener('touchend', onTouchEnd);
	}

	/** Updates the element position while the finger moves. */
	function onTouchMove(e: TouchEvent) {
		e.preventDefault();
		const t = e.touches[0];
		offsetX = t.clientX - startX;
		offsetY = t.clientY - startY;
		node.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
	}

	/** Ends the drag on touch release. */
	function onTouchEnd() {
		window.removeEventListener('touchmove', onTouchMove);
		window.removeEventListener('touchend', onTouchEnd);
	}

	handle.addEventListener('mousedown', onMouseDown);
	handle.addEventListener('touchstart', onTouchStart, { passive: true });

	return {
		destroy() {
			handle!.removeEventListener('mousedown', onMouseDown);
			handle!.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
		}
	};
}
