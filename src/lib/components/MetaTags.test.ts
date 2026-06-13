import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MetaTags from './MetaTags.svelte';

const q = (sel: string) => document.head.querySelector(sel);

describe('MetaTags', () => {
	it('sets title and meta description', () => {
		render(MetaTags, { title: 'Testseite | Aust', description: 'Beschreibung der Seite' });
		expect(document.title).toBe('Testseite | Aust');
		expect(q('meta[name="description"]')).toHaveAttribute('content', 'Beschreibung der Seite');
	});

	it('renders canonical plus de/x-default hreflang alternates when a canonical is given', () => {
		render(MetaTags, {
			title: 'T',
			description: 'D',
			canonical: 'https://www.aust-umzuege.de/leistungen',
		});
		expect(q('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.aust-umzuege.de/leistungen');
		expect(q('link[hreflang="de"]')).toHaveAttribute('href', 'https://www.aust-umzuege.de/leistungen');
		expect(q('link[hreflang="x-default"]')).toHaveAttribute(
			'href',
			'https://www.aust-umzuege.de/leistungen'
		);
		expect(q('meta[property="og:url"]')).toHaveAttribute(
			'content',
			'https://www.aust-umzuege.de/leistungen'
		);
	});

	it('omits canonical, hreflang and og:url without a canonical', () => {
		render(MetaTags, { title: 'T', description: 'D' });
		expect(q('link[rel="canonical"]')).toBeNull();
		expect(q('meta[property="og:url"]')).toBeNull();
	});

	it('emits Open Graph and Twitter Card tags with German locale defaults', () => {
		render(MetaTags, { title: 'OG Titel', description: 'OG Desc' });
		expect(q('meta[property="og:title"]')).toHaveAttribute('content', 'OG Titel');
		expect(q('meta[property="og:description"]')).toHaveAttribute('content', 'OG Desc');
		expect(q('meta[property="og:type"]')).toHaveAttribute('content', 'website');
		expect(q('meta[property="og:locale"]')).toHaveAttribute('content', 'de_DE');
		expect(q('meta[property="og:site_name"]')).toHaveAttribute('content', 'Aust Umzüge');
		expect(q('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
		// default og:image is the brand image on the live domain
		expect(q('meta[property="og:image"]')?.getAttribute('content')).toMatch(
			/^https:\/\/www\.aust-umzuege\.de\/.+\.webp$/
		);
	});

	it('only adds a robots noindex tag when requested', () => {
		const { unmount } = render(MetaTags, { title: 'T', description: 'D' });
		expect(q('meta[name="robots"][content="noindex, follow"]')).toBeNull();
		unmount();

		render(MetaTags, { title: 'T', description: 'D', noindex: true });
		expect(q('meta[name="robots"][content="noindex, follow"]')).not.toBeNull();
	});

	it('renders keywords only when provided', () => {
		render(MetaTags, { title: 'T', description: 'D', keywords: 'umzug, hildesheim' });
		expect(q('meta[name="keywords"]')).toHaveAttribute('content', 'umzug, hildesheim');
	});
});
