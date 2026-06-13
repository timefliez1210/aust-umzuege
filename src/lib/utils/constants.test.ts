import { describe, it, expect } from 'vitest';
import {
	SERVICE_TYPE_LABELS,
	SERVICE_TYPE_COLORS,
	CUSTOMER_TYPE_LABELS,
	CUSTOMER_TYPE_COLORS,
	SERVICE_ADDRESS_CONFIG,
} from './constants';
import { SERVICES } from '../../routes/foto-angebot/serviceConfig';

describe('service type constants', () => {
	it('every service type has both a label and a badge color', () => {
		expect(Object.keys(SERVICE_TYPE_LABELS).sort()).toEqual(Object.keys(SERVICE_TYPE_COLORS).sort());
	});

	it('every public serviceConfig service has a label (admin badges must not show raw ids)', () => {
		for (const svc of SERVICES) {
			expect(SERVICE_TYPE_LABELS[svc.id], `missing label for service "${svc.id}"`).toBeTruthy();
		}
	});

	it('customer types cover private and business with label + color', () => {
		expect(CUSTOMER_TYPE_LABELS).toEqual({ private: 'Privat', business: 'Gewerbe' });
		expect(Object.keys(CUSTOMER_TYPE_COLORS).sort()).toEqual(['business', 'private']);
	});
});

describe('SERVICE_ADDRESS_CONFIG', () => {
	it('exists for every service type label (CreateInquiryModal relies on the lookup)', () => {
		for (const id of Object.keys(SERVICE_TYPE_LABELS)) {
			expect(SERVICE_ADDRESS_CONFIG[id], `missing address config for "${id}"`).toBeDefined();
		}
	});

	// Doc comment: "Mirrors the AddressConfig from serviceConfig.ts".
	// umzugshelfer intentionally diverges (optional destination in admin).
	it('mirrors the public serviceConfig address flags', () => {
		for (const svc of SERVICES) {
			const admin = SERVICE_ADDRESS_CONFIG[svc.id];
			expect(admin.showOrigin, `${svc.id} showOrigin`).toBe(svc.addressConfig.showOrigin);
			if (svc.id !== 'umzugshelfer') {
				expect(admin.showDestination, `${svc.id} showDestination`).toBe(
					svc.addressConfig.showDestination
				);
			}
			expect(admin.showBilling, `${svc.id} showBilling`).toBe(svc.addressConfig.showBilling);
		}
	});

	it('umzugshelfer shows an optional destination ("Nach (optional)")', () => {
		const cfg = SERVICE_ADDRESS_CONFIG.umzugshelfer;
		expect(cfg.showDestination).toBe(true);
		expect(cfg.optionalDestination).toBe(true);
		expect(cfg.destinationLabel).toContain('optional');
	});

	it('single-address services hide the destination', () => {
		for (const id of ['montage', 'haushaltsaufloesung', 'entruempelung']) {
			expect(SERVICE_ADDRESS_CONFIG[id].showDestination, id).toBe(false);
		}
	});

	it('lagerung needs no address at all', () => {
		expect(SERVICE_ADDRESS_CONFIG.lagerung.showOrigin).toBe(false);
		expect(SERVICE_ADDRESS_CONFIG.lagerung.showDestination).toBe(false);
	});
});
