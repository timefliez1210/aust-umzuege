import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import MediaPreviewGrid from './MediaPreviewGrid.svelte';

beforeEach(() => {
	let n = 0;
	vi.stubGlobal(
		'URL',
		Object.assign(URL, {
			createObjectURL: vi.fn(() => `blob:thumb-${n++}`),
			revokeObjectURL: vi.fn(),
		})
	);
});

const img = new File(['x'], 'wohnzimmer.jpg', { type: 'image/jpeg' });
const video = new File([new ArrayBuffer(2_500_000)], 'rundgang.mp4', { type: 'video/mp4' });

describe('MediaPreviewGrid', () => {
	it('queue mode lists file names with human-readable sizes', () => {
		render(MediaPreviewGrid, { files: [video], mode: 'queue', onremove: () => {} });
		expect(screen.getByText('rundgang.mp4')).toBeInTheDocument();
		expect(screen.getByText(/2\.4 MB/)).toBeInTheDocument();
	});

	it('thumbnails mode renders object-URL previews for images', () => {
		const { container } = render(MediaPreviewGrid, {
			files: [img],
			mode: 'thumbnails',
			onremove: () => {},
		});
		const thumb = container.querySelector('img');
		expect(thumb?.src).toContain('blob:thumb-');
	});

	it('remove buttons call onremove with the file index', async () => {
		const user = userEvent.setup();
		const onremove = vi.fn();
		const { container } = render(MediaPreviewGrid, {
			files: [img, video],
			mode: 'queue',
			onremove,
		});
		const removeButtons = container.querySelectorAll('button');
		await user.click([...removeButtons].find((b) => b.closest('[class]') && b.querySelector('svg'))!);
		expect(onremove).toHaveBeenCalledWith(0);
	});

	it('revokes object URLs when files are removed (no memory leaks)', async () => {
		const { rerender } = render(MediaPreviewGrid, {
			files: [img],
			mode: 'thumbnails',
			onremove: () => {},
		});
		await rerender({ files: [], mode: 'thumbnails', onremove: () => {} });
		expect(URL.revokeObjectURL).toHaveBeenCalled();
	});
});
