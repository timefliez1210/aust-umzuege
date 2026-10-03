import { browser } from '$app/environment';

/** Matches the Tailwind `lg` breakpoint: sidebar layout vs phone layout. */
class Media {
	desktop = $state(browser ? window.matchMedia('(min-width: 1024px)').matches : true);

	constructor() {
		if (!browser) return;
		window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => (this.desktop = e.matches));
	}
}

export const media = new Media();
