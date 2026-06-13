import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ImageLightbox from './ImageLightbox.svelte';

beforeEach(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			disconnect() {}
			unobserve() {}
		}
	);
});

describe('ImageLightbox — single image mode', () => {
	it('shows the image with item name and volume', () => {
		render(ImageLightbox, {
			imageUrl: 'https://s3/img1.jpg',
			itemName: 'Sofa',
			volumeM3: 1.2,
			onclose: () => {},
		});
		const img = document.querySelector('img')!;
		expect(img.src).toContain('img1.jpg');
		expect(screen.getByText(/Sofa/)).toBeInTheDocument();
	});

	it('Escape closes the lightbox', async () => {
		const onclose = vi.fn();
		render(ImageLightbox, { imageUrl: 'https://s3/img1.jpg', onclose });
		await userEvent.keyboard('{Escape}');
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('clicking the backdrop closes, clicking the image does not', async () => {
		const user = userEvent.setup();
		const onclose = vi.fn();
		const { container } = render(ImageLightbox, { imageUrl: 'https://s3/img1.jpg', onclose });

		await user.click(document.querySelector('img')!);
		expect(onclose).not.toHaveBeenCalled();

		await user.click(container.querySelector('.backdrop')!);
		expect(onclose).toHaveBeenCalledTimes(1);
	});
});

describe('ImageLightbox — gallery mode', () => {
	const images = ['https://s3/a.jpg', 'https://s3/b.jpg', 'https://s3/c.jpg'];

	it('starts at the initial index and navigates with arrow keys, clamping at both ends', async () => {
		render(ImageLightbox, { images, initialIndex: 1, onclose: () => {} });
		const img = () => document.querySelector('img')!.src;
		expect(img()).toContain('b.jpg');

		await userEvent.keyboard('{ArrowRight}');
		expect(img()).toContain('c.jpg');
		await userEvent.keyboard('{ArrowRight}'); // clamped at last
		expect(img()).toContain('c.jpg');

		await userEvent.keyboard('{ArrowLeft}');
		await userEvent.keyboard('{ArrowLeft}');
		await userEvent.keyboard('{ArrowLeft}'); // clamped at first
		expect(img()).toContain('a.jpg');
	});

	it('arrow keys do nothing in single-image mode', async () => {
		render(ImageLightbox, { imageUrl: 'https://s3/solo.jpg', onclose: () => {} });
		await userEvent.keyboard('{ArrowRight}');
		expect(document.querySelector('img')!.src).toContain('solo.jpg');
	});
});
