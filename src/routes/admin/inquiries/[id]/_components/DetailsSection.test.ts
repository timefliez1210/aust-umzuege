import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import DetailsSection from './DetailsSection.svelte';
import type { InquiryRoute } from '$lib/types/route';

// RouteMap pulls in Leaflet, which needs a real layout box jsdom cannot provide.
// The breakdown list below the map is what these tests are about.
vi.mock('$lib/components/admin/RouteMap.svelte', async () => {
	const { default: Stub } = await import('./__stubs__/RouteMapStub.svelte');
	return { default: Stub };
});

const route: InquiryRoute = {
	total_distance_km: 37.4,
	total_duration_minutes: 68,
	legs: [
		{
			from_label: 'Lager',
			to_label: 'Auszug',
			from_address: 'Borsigstr 6, 31135 Hildesheim',
			to_address: 'Steinbergstr. 4, 31139 Hildesheim',
			distance_km: 4.2,
			duration_minutes: 9,
		},
		{
			from_label: 'Auszug',
			to_label: 'Zwischenstopp',
			from_address: 'Steinbergstr. 4, 31139 Hildesheim',
			to_address: 'Am Wertstoffhof 1, 31135 Hildesheim',
			distance_km: 3.1,
			duration_minutes: 7,
		},
		{
			from_label: 'Zwischenstopp',
			to_label: 'Einzug',
			from_address: 'Am Wertstoffhof 1, 31135 Hildesheim',
			to_address: 'Kirchweg 12, 31137 Hildesheim',
			distance_km: 14.0,
			duration_minutes: 26,
		},
		{
			from_label: 'Einzug',
			to_label: 'Lager',
			from_address: 'Kirchweg 12, 31137 Hildesheim',
			to_address: 'Borsigstr 6, 31135 Hildesheim',
			distance_km: 16.1,
			duration_minutes: 26,
		},
	],
};

function props(overrides: Record<string, unknown> = {}) {
	return {
		editVolume: 30,
		editDistance: 12,
		editDate: '',
		editStartTime: '',
		editEndTime: '',
		editNotes: '',
		isLocked: false,
		saving: false,
		routeCoordinates: [
			[52.15, 9.95],
			[52.16, 9.96],
		] as [number, number][],
		routePlan: route,
		customerMessage: null,
		detailsOpen: false,
		routeOpen: true,
		messageOpen: false,
		onToggleDetails: () => {},
		onToggleRoute: () => {},
		onToggleMessage: () => {},
		onSave: () => {},
		...overrides,
	};
}

describe('DetailsSection route card', () => {
	it('lists every leg with its own distance', () => {
		render(DetailsSection, { props: props() });

		const items = screen.getAllByRole('listitem');
		// Four legs plus the total row.
		expect(items).toHaveLength(5);
		expect(items[0]).toHaveTextContent('Borsigstr 6');
		expect(items[0]).toHaveTextContent('Steinbergstr. 4');
		expect(items[0]).toHaveTextContent('4,2 km');
		expect(items[2]).toHaveTextContent('14,0 km');
	});

	it('shows the Zwischenstopp as its own waypoint', () => {
		render(DetailsSection, { props: props() });

		// The stop closes one leg and opens the next, so it appears on both rows.
		expect(screen.getAllByText('Zwischenstopp')).toHaveLength(2);
		expect(screen.getAllByText('Am Wertstoffhof 1')).toHaveLength(2);
	});

	it('closes the loop back at the Lager', () => {
		render(DetailsSection, { props: props() });

		const items = screen.getAllByRole('listitem');
		expect(items[3]).toHaveTextContent('Einzug');
		expect(items[3]).toHaveTextContent('Borsigstr 6');
		expect(items[3]).toHaveTextContent('16,1 km');
	});

	it('totals the round trip in German notation with the driving time', () => {
		render(DetailsSection, { props: props() });

		const total = screen.getAllByRole('listitem').at(-1)!;
		expect(total).toHaveTextContent('Gesamtstrecke');
		expect(total).toHaveTextContent('37,4 km');
		expect(total).toHaveTextContent('1 h 08 min');
	});

	it('renders nothing route-related when the route could not be calculated', () => {
		render(DetailsSection, { props: props({ routePlan: null, routeCoordinates: null }) });

		expect(screen.queryByText('Gesamtstrecke')).not.toBeInTheDocument();
		expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
	});
});
