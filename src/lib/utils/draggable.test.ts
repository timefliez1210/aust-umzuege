import { describe, it, expect } from 'vitest';
import { draggable } from './draggable';

function makeModal(withHandle = true): HTMLElement {
	const node = document.createElement('div');
	if (withHandle) {
		const h3 = document.createElement('h3');
		h3.textContent = 'Termin anlegen';
		node.appendChild(h3);
	}
	document.body.appendChild(node);
	return node;
}

function mouse(type: string, x: number, y: number): MouseEvent {
	return new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
}

describe('draggable action', () => {
	it('uses the first h3 as drag handle and styles it as grabbable', () => {
		const node = makeModal();
		draggable(node);
		const handle = node.querySelector('h3')!;
		expect(handle.style.cursor).toBe('grab');
		expect(handle.style.userSelect).toBe('none');
	});

	it('moves the element via transform while dragging', () => {
		const node = makeModal();
		draggable(node);
		const handle = node.querySelector('h3')!;

		handle.dispatchEvent(mouse('mousedown', 100, 100));
		window.dispatchEvent(mouse('mousemove', 140, 130));
		expect(node.style.transform).toBe('translate(40px, 30px)');

		window.dispatchEvent(mouse('mousemove', 90, 80));
		expect(node.style.transform).toBe('translate(-10px, -20px)');

		window.dispatchEvent(mouse('mouseup', 90, 80));
		expect(handle.style.cursor).toBe('grab');
	});

	it('accumulates drags relative to the previous position (not reset between drags)', () => {
		const node = makeModal();
		draggable(node);
		const handle = node.querySelector('h3')!;

		handle.dispatchEvent(mouse('mousedown', 0, 0));
		window.dispatchEvent(mouse('mousemove', 10, 10));
		window.dispatchEvent(mouse('mouseup', 10, 10));

		handle.dispatchEvent(mouse('mousedown', 50, 50));
		window.dispatchEvent(mouse('mousemove', 60, 55));
		expect(node.style.transform).toBe('translate(20px, 15px)');
	});

	it('stops following the mouse after mouseup', () => {
		const node = makeModal();
		draggable(node);
		const handle = node.querySelector('h3')!;

		handle.dispatchEvent(mouse('mousedown', 0, 0));
		window.dispatchEvent(mouse('mousemove', 5, 5));
		window.dispatchEvent(mouse('mouseup', 5, 5));
		window.dispatchEvent(mouse('mousemove', 500, 500));
		expect(node.style.transform).toBe('translate(5px, 5px)');
	});

	it('supports a custom handle selector', () => {
		const node = document.createElement('div');
		const header = document.createElement('div');
		header.className = 'drag-me';
		node.appendChild(header);
		document.body.appendChild(node);

		draggable(node, '.drag-me');
		expect(header.style.cursor).toBe('grab');
	});

	it('is a no-op when no handle exists (must not throw)', () => {
		const node = makeModal(false);
		expect(() => draggable(node)).not.toThrow();
		expect(draggable(node)).toBeUndefined();
	});

	it('destroy() detaches listeners so the element stops moving', () => {
		const node = makeModal();
		const action = draggable(node)!;
		const handle = node.querySelector('h3')!;

		action.destroy();
		handle.dispatchEvent(mouse('mousedown', 0, 0));
		window.dispatchEvent(mouse('mousemove', 50, 50));
		expect(node.style.transform).toBe('');
	});
});
