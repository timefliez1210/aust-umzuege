import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import MediaDropzone from './MediaDropzone.svelte';

function makeFile(name: string, type: string, sizeBytes = 1000): File {
	const f = new File([new ArrayBuffer(sizeBytes)], name, { type });
	return f;
}

function dropFiles(target: Element, files: File[]) {
	const dt = { files, items: [], types: ['Files'] };
	const ev = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
	Object.defineProperty(ev, 'dataTransfer', { value: dt });
	target.dispatchEvent(ev);
}

describe('MediaDropzone — selection', () => {
	it('forwards picked files to onfiles and resets the input for re-selection', async () => {
		const onfiles = vi.fn();
		const user = userEvent.setup();
		const { container } = render(MediaDropzone, { onfiles, id: 'dz-test' });

		const input = container.querySelector<HTMLInputElement>('#dz-test')!;
		const file = makeFile('foto.jpg', 'image/jpeg');
		await user.upload(input, file);

		expect(onfiles).toHaveBeenCalledWith([file]);
		// input cleared so the same file can be re-picked after removal
		expect(input.value).toBe('');
	});

	it('accepts files via drag & drop on the whole area', () => {
		const onfiles = vi.fn();
		const { container } = render(MediaDropzone, { onfiles });
		dropFiles(container.querySelector('.md-wrap')!, [makeFile('a.png', 'image/png')]);
		expect(onfiles).toHaveBeenCalledTimes(1);
	});
});

describe('MediaDropzone — validation gate', () => {
	it('rejects files over maxSizeMb with a German reason and excludes them from onfiles', () => {
		const onfiles = vi.fn();
		const onrejected = vi.fn();
		const { container } = render(MediaDropzone, { onfiles, onrejected, maxSizeMb: 1 });

		const small = makeFile('klein.jpg', 'image/jpeg', 500_000);
		const huge = makeFile('riesig.jpg', 'image/jpeg', 2_000_000);
		dropFiles(container.querySelector('.md-wrap')!, [small, huge]);

		expect(onfiles).toHaveBeenCalledWith([small]);
		expect(onrejected).toHaveBeenCalledWith(huge, 'riesig.jpg zu groß (max. 1 MB)');
	});

	it('enforces the MIME filter but allows known extensions with empty MIME (HEIC)', () => {
		const onfiles = vi.fn();
		const onrejected = vi.fn();
		const { container } = render(MediaDropzone, { onfiles, onrejected, mimeFilter: 'image/' });

		const heic = makeFile('iphone.heic', ''); // HEIC files often report no MIME type
		const pdf = makeFile('doc.pdf', 'application/pdf');
		dropFiles(container.querySelector('.md-wrap')!, [heic, pdf]);

		expect(onfiles).toHaveBeenCalledWith([heic]);
		expect(onrejected).toHaveBeenCalledWith(pdf, 'doc.pdf: Falscher Dateityp');
	});

	it('does nothing when disabled', () => {
		const onfiles = vi.fn();
		const { container } = render(MediaDropzone, { onfiles, disabled: true });
		dropFiles(container.querySelector('.md-wrap')!, [makeFile('a.jpg', 'image/jpeg')]);
		expect(onfiles).not.toHaveBeenCalled();
	});
});

describe('MediaDropzone — presentation', () => {
	it('shows the empty-state prompt with custom label and hint', () => {
		render(MediaDropzone, {
			onfiles: () => {},
			label: 'Fotos hier ablegen',
			hint: 'JPG oder PNG',
		});
		expect(screen.getByText('Fotos hier ablegen')).toBeInTheDocument();
		expect(screen.getByText('JPG oder PNG')).toBeInTheDocument();
	});

	it('renders slot content instead of the prompt when hasFiles is true', () => {
		const { container } = render(MediaDropzone, { onfiles: () => {}, hasFiles: true });
		expect(container.querySelector('.md-empty')).toBeNull();
	});
});
