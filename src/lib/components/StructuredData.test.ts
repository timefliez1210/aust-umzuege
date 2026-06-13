import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StructuredData from './StructuredData.svelte';

function readJsonLd(): unknown[] {
	return [...document.head.querySelectorAll('script[type="application/ld+json"]')].map((s) =>
		JSON.parse(s.textContent ?? 'null')
	);
}

describe('StructuredData', () => {
	it('renders a single schema as JSON-LD with the schema.org context', () => {
		render(StructuredData, {
			schema: { '@type': 'MovingCompany', name: 'Aust Umzüge' },
		});
		const [ld] = readJsonLd() as Array<Record<string, unknown>>;
		expect(ld['@context']).toBe('https://schema.org');
		expect(ld['@type']).toBe('MovingCompany');
		expect(ld.name).toBe('Aust Umzüge');
	});

	it('produces parseable JSON for nested schema objects', () => {
		render(StructuredData, {
			schema: {
				'@type': 'BreadcrumbList',
				itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home' }],
			},
		});
		const [ld] = readJsonLd() as Array<Record<string, any>>;
		expect(ld.itemListElement[0].name).toBe('Home');
	});

	it('renders every entry when given an array of schemas', () => {
		render(StructuredData, {
			schema: [
				{ '@type': 'MovingCompany', name: 'Aust Umzüge' },
				{ '@type': 'WebSite', name: 'aust-umzuege.de' },
			],
		});
		const rendered = JSON.stringify(readJsonLd());
		expect(rendered).toContain('MovingCompany');
		expect(rendered).toContain('WebSite');
	});
});
